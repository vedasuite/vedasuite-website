"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBillingManagementState = getBillingManagementState;
exports.requestBillingPlanChange = requestBillingPlanChange;
exports.confirmBillingApprovalReturn = confirmBillingApprovalReturn;
exports.cancelBillingPlan = cancelBillingPlan;
const prismaClient_1 = require("../db/prismaClient");
const env_1 = require("../config/env");
const capabilities_1 = require("../billing/capabilities");
const shopifyAdminService_1 = require("./shopifyAdminService");
const subscriptionService_1 = require("./subscriptionService");
const observabilityService_1 = require("./observabilityService");
const MANAGED_PAID_PLANS = ["STARTER", "GROWTH", "PRO"];
const BILLING_INTENT_TTL_MS = 60 * 60 * 1000;
const PENDING_INTENT_STATUSES = ["CREATING", "PENDING_APPROVAL"];
function planSummary(planName) {
    switch (planName) {
        case "STARTER":
            return "Fraud & Return Protection for small stores, with one selected Starter feature.";
        case "GROWTH":
            return "Advanced competitor and pricing intelligence with enhanced fraud analysis.";
        case "PRO":
            return "Full AI commerce intelligence suite with profit optimization and priority processing.";
        case "TRIAL":
            return "Trial provides temporary evaluation access before a paid plan is selected.";
        default:
            return "No paid subscription is active yet.";
    }
}
function planRank(planName) {
    switch (planName) {
        case "STARTER":
            return 1;
        case "GROWTH":
            return 2;
        case "PRO":
            return 3;
        default:
            return 0;
    }
}
function serializeIntent(intent) {
    return {
        id: intent.id,
        requestedPlanName: ((0, capabilities_1.normalizePlanName)(intent.requestedPlanName) ?? "NONE"),
        requestedStarterModule: (0, capabilities_1.normalizeStarterModule)(intent.requestedStarterModule),
        actionType: intent.actionType,
        status: intent.status,
        confirmationUrl: intent.confirmationUrl ?? null,
        shopifyChargeId: intent.shopifyChargeId ?? null,
        errorCode: intent.errorCode ?? null,
        errorMessage: intent.errorMessage ?? null,
        createdAt: intent.createdAt.toISOString(),
        updatedAt: intent.updatedAt.toISOString(),
        confirmedAt: intent.confirmedAt?.toISOString() ?? null,
        cancelledAt: intent.cancelledAt?.toISOString() ?? null,
        expiresAt: intent.expiresAt?.toISOString() ?? null,
    };
}
async function getStoreForBilling(shopDomain) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
        include: {
            subscription: {
                include: {
                    plan: true,
                },
            },
            billingPlanIntents: {
                orderBy: { createdAt: "desc" },
                take: 5,
            },
        },
    });
    if (!store) {
        throw new Error("Store not found");
    }
    return store;
}
async function expireIntentIfNeeded(intent) {
    if (!intent?.expiresAt) {
        return intent;
    }
    if (PENDING_INTENT_STATUSES.includes(intent.status) &&
        intent.expiresAt.getTime() <= Date.now()) {
        return prismaClient_1.prisma.billingPlanIntent.update({
            where: { id: intent.id },
            data: {
                status: "EXPIRED",
                errorCode: "BILLING_APPROVAL_EXPIRED",
                errorMessage: "Shopify billing approval expired before confirmation completed.",
            },
        });
    }
    return intent;
}
async function getLatestRelevantIntent(storeId) {
    const latest = await prismaClient_1.prisma.billingPlanIntent.findFirst({
        where: { storeId },
        orderBy: { createdAt: "desc" },
    });
    if (!latest) {
        return null;
    }
    return expireIntentIfNeeded(latest);
}
function computePlanCardAction(current, target) {
    if (current.planName === target && current.active) {
        return "CURRENT_PLAN";
    }
    if (current.planName === "NONE" || current.planName === "TRIAL") {
        return "CHOOSE_PLAN";
    }
    return planRank(target) > planRank(current.planName) ? "UPGRADE" : "DOWNGRADE";
}
function buildPlanCards(current) {
    return MANAGED_PAID_PLANS.map((planName) => ({
        planName,
        price: (0, capabilities_1.getPlanPrice)(planName),
        shortSummary: planSummary(planName),
        current: current.planName === planName && current.active,
        recommendedForCurrentState: (current.planName === "NONE" || current.planName === "TRIAL") &&
            planName === "STARTER",
        action: computePlanCardAction(current, planName),
        requiresStarterModule: planName === "STARTER",
    }));
}
function buildReturnPath(returnPath) {
    if (!returnPath || typeof returnPath !== "string") {
        return "/app/billing";
    }
    if (!returnPath.startsWith("/") || returnPath.startsWith("//")) {
        return "/app/billing";
    }
    return returnPath;
}
function buildActionType(current, requestedPlan) {
    if (current.planName === requestedPlan && requestedPlan === "STARTER") {
        return "update_starter_module";
    }
    if (current.planName === requestedPlan) {
        return "switch";
    }
    if (current.planName === "NONE" || current.planName === "TRIAL") {
        return "start_paid_plan";
    }
    return planRank(requestedPlan) > planRank(current.planName) ? "upgrade" : "downgrade";
}
async function getBillingManagementState(shopDomain) {
    await (0, subscriptionService_1.reconcileBillingState)(shopDomain).catch(() => null);
    const [store, subscription, billing] = await Promise.all([
        getStoreForBilling(shopDomain),
        (0, subscriptionService_1.getCurrentSubscription)(shopDomain),
        (0, subscriptionService_1.resolveBillingState)(shopDomain),
    ]);
    const latestIntent = await getLatestRelevantIntent(store.id);
    return {
        subscription,
        billing,
        pendingIntent: latestIntent &&
            ["CREATING", "PENDING_APPROVAL", "FAILED", "CONFIRMED", "EXPIRED"].includes(latestIntent.status)
            ? serializeIntent(latestIntent)
            : null,
        availableActions: {
            canManagePlans: subscription.capabilities["billing.planManagement"],
            canCancelSubscription: billing.lifecycle === "active" && !!billing.shopifyChargeId,
            canChangeStarterModule: subscription.planName === "STARTER" &&
                subscription.active &&
                ["active", "cancelled"].includes(billing.lifecycle),
            awaitingApproval: !!latestIntent &&
                ["CREATING", "PENDING_APPROVAL"].includes(latestIntent.status),
        },
        plans: buildPlanCards(subscription),
    };
}
async function createPlanRecordIfMissing(planName) {
    const existing = await prismaClient_1.prisma.subscriptionPlan.findUnique({
        where: { name: planName },
    });
    if (existing) {
        return existing;
    }
    return prismaClient_1.prisma.subscriptionPlan.create({
        data: {
            name: planName,
            price: (0, capabilities_1.getPlanPrice)(planName),
            trialDays: env_1.env.billing.trialDays,
            features: JSON.stringify({ planName }),
        },
    });
}
async function cancelSupersededPendingIntents(storeId, keepIntentId) {
    await prismaClient_1.prisma.billingPlanIntent.updateMany({
        where: {
            storeId,
            status: { in: [...PENDING_INTENT_STATUSES] },
            ...(keepIntentId ? { NOT: { id: keepIntentId } } : {}),
        },
        data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            errorCode: "SUPERSEDED",
            errorMessage: "Superseded by a newer billing plan change request.",
        },
    });
}
async function requestBillingPlanChange(input) {
    const requestedPlan = input.requestedPlan;
    if (!MANAGED_PAID_PLANS.includes(requestedPlan)) {
        throw new Error("Only paid plans can be requested through the billing change flow.");
    }
    const normalizedStarterModule = (0, capabilities_1.normalizeStarterModule)(input.starterModule);
    if (requestedPlan === "STARTER" && !normalizedStarterModule) {
        throw new Error("Starter plan requires selecting a Starter feature.");
    }
    if (requestedPlan === "STARTER" && normalizedStarterModule) {
        (0, observabilityService_1.logEvent)("info", "billing.starter_module_selected", {
            shop: input.shopDomain,
            requestedPlan,
            selectedStarterModule: input.starterModule ?? null,
            normalizedStarterModule,
            starterModule: normalizedStarterModule,
        });
    }
    const [store, current] = await Promise.all([
        getStoreForBilling(input.shopDomain),
        (0, subscriptionService_1.getCurrentSubscription)(input.shopDomain),
    ]);
    if (current.planName === requestedPlan &&
        current.active &&
        !(requestedPlan === "STARTER" &&
            normalizedStarterModule &&
            current.starterModule !== normalizedStarterModule)) {
        return {
            outcome: "NOOP",
            message: `${requestedPlan} is already the active plan.`,
            state: await getBillingManagementState(input.shopDomain),
        };
    }
    const existingPending = await prismaClient_1.prisma.billingPlanIntent.findFirst({
        where: {
            storeId: store.id,
            status: { in: [...PENDING_INTENT_STATUSES] },
        },
        orderBy: { createdAt: "desc" },
    });
    if (existingPending &&
        existingPending.requestedPlanName === requestedPlan &&
        (0, capabilities_1.normalizeStarterModule)(existingPending.requestedStarterModule) ===
            normalizedStarterModule &&
        existingPending.confirmationUrl) {
        return {
            outcome: "REDIRECT_REQUIRED",
            confirmationUrl: existingPending.confirmationUrl,
            pendingIntent: serializeIntent(existingPending),
            state: await getBillingManagementState(input.shopDomain),
        };
    }
    await createPlanRecordIfMissing(requestedPlan);
    const actionType = buildActionType(current, requestedPlan);
    const expiresAt = new Date(Date.now() + BILLING_INTENT_TTL_MS);
    const returnPath = buildReturnPath(input.returnPath);
    const createdIntent = await prismaClient_1.prisma.billingPlanIntent.create({
        data: {
            storeId: store.id,
            requestedPlanName: requestedPlan,
            requestedStarterModule: normalizedStarterModule,
            actionType,
            status: "CREATING",
            host: input.host ?? null,
            returnPath,
            expiresAt,
        },
    });
    try {
        (0, observabilityService_1.logEvent)("info", "billing.create_request", {
            shop: input.shopDomain,
            plan: requestedPlan,
            starterModule: normalizedStarterModule,
        });
        const returnUrl = new URL("/billing/activate", env_1.env.shopifyAppUrl);
        returnUrl.searchParams.set("shop", input.shopDomain);
        returnUrl.searchParams.set("intentId", createdIntent.id);
        if (input.host) {
            returnUrl.searchParams.set("host", input.host);
        }
        const result = await (0, shopifyAdminService_1.createAppSubscription)({
            shopDomain: input.shopDomain,
            name: `VedaSuite AI - ${requestedPlan}`,
            price: (0, capabilities_1.getPlanPrice)(requestedPlan),
            returnUrl: returnUrl.toString(),
            trialDays: 0,
            test: env_1.env.billing.testMode,
        });
        await cancelSupersededPendingIntents(store.id, createdIntent.id);
        const pendingIntent = await prismaClient_1.prisma.billingPlanIntent.update({
            where: { id: createdIntent.id },
            data: {
                status: "PENDING_APPROVAL",
                confirmationUrl: result.confirmationUrl,
                shopifyChargeId: result.appSubscription?.id ?? null,
            },
        });
        await prismaClient_1.prisma.billingAuditLog.create({
            data: {
                storeId: store.id,
                subscriptionId: store.subscription?.id ?? null,
                eventType: "billing.intent_created",
                previousPlanName: current.planName,
                nextPlanName: requestedPlan,
                previousStarterModule: current.starterModule,
                nextStarterModule: normalizedStarterModule,
                billingStatus: current.billingStatus ?? null,
                metadataJson: JSON.stringify({
                    actionType,
                    intentId: pendingIntent.id,
                    requestedStarterModule: normalizedStarterModule,
                }),
            },
        });
        return {
            outcome: "REDIRECT_REQUIRED",
            confirmationUrl: result.confirmationUrl,
            pendingIntent: serializeIntent(pendingIntent),
            state: await getBillingManagementState(input.shopDomain),
        };
    }
    catch (error) {
        await prismaClient_1.prisma.billingPlanIntent.update({
            where: { id: createdIntent.id },
            data: {
                status: "FAILED",
                errorCode: "BILLING_REQUEST_FAILED",
                errorMessage: error instanceof Error ? error.message : "Unable to create Shopify billing request.",
            },
        });
        throw error;
    }
}
async function applyConfirmedStarterModule(shopDomain, starterModule) {
    if (!starterModule) {
        return;
    }
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
        include: {
            subscription: true,
        },
    });
    if (!store?.subscription) {
        return;
    }
    await prismaClient_1.prisma.storeSubscription.update({
        where: { id: store.subscription.id },
        data: {
            starterModule,
            moduleSwitchedAt: new Date(),
            lastBillingSyncAt: new Date(),
            lastBillingResolutionSource: "billing_callback_confirmed",
            lastBillingSubscriptionName: "STARTER",
        },
    });
    (0, observabilityService_1.logEvent)("info", "billing.subscription_saved", {
        shop: shopDomain,
        savedPlan: "STARTER",
        savedStarterModule: starterModule,
    });
}
async function confirmBillingApprovalReturn(input) {
    const store = await getStoreForBilling(input.shopDomain);
    const intent = input.intentId
        ? await prismaClient_1.prisma.billingPlanIntent.findFirst({
            where: {
                id: input.intentId,
                storeId: store.id,
            },
        })
        : await prismaClient_1.prisma.billingPlanIntent.findFirst({
            where: {
                storeId: store.id,
                status: { in: [...PENDING_INTENT_STATUSES] },
            },
            orderBy: { createdAt: "desc" },
        });
    if (intent) {
        await expireIntentIfNeeded(intent);
    }
    const activeSubscription = await (0, shopifyAdminService_1.getActiveAppSubscription)(input.shopDomain);
    if (!activeSubscription) {
        const declineMessage = "Shopify billing was not approved. If you declined the plan, select a plan below to subscribe.";
        if (intent) {
            await prismaClient_1.prisma.billingPlanIntent.update({
                where: { id: intent.id },
                data: {
                    status: "FAILED",
                    errorCode: "BILLING_NOT_CONFIRMED",
                    errorMessage: declineMessage,
                },
            });
        }
        throw new Error(declineMessage);
    }
    const effectivePlan = (0, capabilities_1.normalizePlanName)(activeSubscription.name);
    if (!effectivePlan || effectivePlan === "TRIAL" || effectivePlan === "NONE") {
        throw new Error("Shopify returned an unsupported billing plan.");
    }
    (0, observabilityService_1.logEvent)("info", "billing.confirmation_received", {
        shop: input.shopDomain,
        chargeId: activeSubscription.id,
        planFromRequest: (0, capabilities_1.normalizePlanName)(intent?.requestedPlanName) ?? null,
        starterModuleFromRequest: (0, capabilities_1.normalizeStarterModule)(intent?.requestedStarterModule ?? null),
        existingDbStarterModule: (0, capabilities_1.normalizeStarterModule)(store.subscription?.starterModule ?? null),
    });
    if (intent && effectivePlan !== (0, capabilities_1.normalizePlanName)(intent.requestedPlanName)) {
        await prismaClient_1.prisma.billingPlanIntent.update({
            where: { id: intent.id },
            data: {
                status: "FAILED",
                errorCode: "BILLING_PLAN_MISMATCH",
                errorMessage: `Shopify approved ${effectivePlan} but the pending intent expected ${intent.requestedPlanName}.`,
                shopifyChargeId: activeSubscription.id,
            },
        });
        throw new Error(`Shopify approved ${effectivePlan} but the pending intent expected ${intent.requestedPlanName}.`);
    }
    await (0, subscriptionService_1.reconcileStoreSubscriptionFromWebhook)({
        shopDomain: input.shopDomain,
        shopifyChargeId: activeSubscription.id,
        planName: activeSubscription.name,
        status: activeSubscription.status,
        currentPeriodEnd: activeSubscription.currentPeriodEnd ?? null,
    });
    await (0, subscriptionService_1.reconcileBillingState)(input.shopDomain);
    const confirmedStarterModule = (0, capabilities_1.normalizeStarterModule)(intent?.requestedStarterModule ?? null);
    if (effectivePlan === "STARTER" && confirmedStarterModule) {
        await applyConfirmedStarterModule(input.shopDomain, confirmedStarterModule);
    }
    if (intent) {
        await prismaClient_1.prisma.billingPlanIntent.update({
            where: { id: intent.id },
            data: {
                status: "CONFIRMED",
                confirmedAt: new Date(),
                errorCode: null,
                errorMessage: null,
                shopifyChargeId: activeSubscription.id,
            },
        });
    }
    const state = await getBillingManagementState(input.shopDomain);
    (0, observabilityService_1.logEvent)("info", "billing.app_state_refetched", {
        shop: input.shopDomain,
        planName: state.subscription.planName,
        starterModule: state.subscription.starterModule,
        pendingIntentStatus: state.pendingIntent?.status ?? null,
    });
    return state;
}
async function cancelBillingPlan(shopDomain) {
    await (0, subscriptionService_1.cancelSubscription)(shopDomain);
    await (0, subscriptionService_1.reconcileBillingState)(shopDomain).catch(() => null);
    return getBillingManagementState(shopDomain);
}
