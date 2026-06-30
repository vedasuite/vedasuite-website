"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveCanonicalBillingLifecycle = deriveCanonicalBillingLifecycle;
exports.buildCanonicalEntitlements = buildCanonicalEntitlements;
exports.resolveBillingState = resolveBillingState;
exports.getCurrentSubscription = getCurrentSubscription;
exports.reconcileBillingState = reconcileBillingState;
exports.resolveEntitlements = resolveEntitlements;
exports.resolveActivePlan = resolveActivePlan;
exports.cancelSubscription = cancelSubscription;
exports.downgradeToTrial = downgradeToTrial;
exports.updateStarterModuleSelection = updateStarterModuleSelection;
exports.reconcileStoreSubscriptionFromWebhook = reconcileStoreSubscriptionFromWebhook;
const env_1 = require("../config/env");
const client_1 = require("@prisma/client");
const prismaClient_1 = require("../db/prismaClient");
const shopifyAdminService_1 = require("./shopifyAdminService");
const capabilities_1 = require("../billing/capabilities");
const observabilityService_1 = require("./observabilityService");
const storeWithSubscriptionArgs = client_1.Prisma.validator()({
    include: {
        subscription: {
            include: {
                plan: true,
            },
        },
        billingPlanIntents: {
            orderBy: {
                createdAt: "desc",
            },
            take: 1,
        },
    },
});
function getTrialEndsAt(trialStartedAt, trialEndsAt) {
    if (trialEndsAt) {
        return trialEndsAt;
    }
    if (!trialStartedAt) {
        return null;
    }
    const next = new Date(trialStartedAt);
    next.setDate(next.getDate() + env_1.env.billing.trialDays);
    return next;
}
function isDateInFuture(value) {
    return !!value && value.getTime() > Date.now();
}
function normalizeTier(planName) {
    switch (planName) {
        case "TRIAL":
            return "trial";
        case "STARTER":
            return "starter";
        case "GROWTH":
            return "growth";
        case "PRO":
            return "pro";
        default:
            return "none";
    }
}
function isPendingIntentStatus(value) {
    return value === "CREATING" || value === "PENDING_APPROVAL";
}
function isCancelledBillingStatus(value) {
    return ["CANCELLED", "EXPIRED", "DECLINED"].includes((value ?? "").toUpperCase());
}
function isFrozenBillingStatus(value) {
    return ["FROZEN", "PAUSED", "SUSPENDED", "PAST_DUE", "FROZEN_DUE_TO_MERCHANT"].includes((value ?? "").toUpperCase());
}
function isActiveBillingStatus(value) {
    return ["ACTIVE", "ACCEPTED", "PENDING"].includes((value ?? "").toUpperCase());
}
function deriveCanonicalBillingLifecycle(input) {
    void input.isTestCharge;
    if (input.uninstalled) {
        return "uninstalled";
    }
    if (input.pendingApproval) {
        return "pending_approval";
    }
    if (isFrozenBillingStatus(input.billingStatus)) {
        return "frozen";
    }
    if (isCancelledBillingStatus(input.billingStatus)) {
        return "cancelled";
    }
    if ((input.planName === "TRIAL" && input.accessActive) ||
        (input.planName !== "NONE" && input.accessActive && isActiveBillingStatus(input.billingStatus))) {
        return "active";
    }
    if (input.planName === "NONE") {
        return "no_subscription";
    }
    return "unknown_error";
}
function buildMerchantBillingCopy(input) {
    switch (input.lifecycle) {
        case "pending_approval":
            return {
                title: input.pendingRequestedPlanName
                    ? `${input.pendingRequestedPlanName} approval is waiting in Shopify`
                    : "Plan approval is waiting in Shopify",
                description: input.planName !== "NONE" && input.accessActive
                    ? `Your current ${input.planName} subscription stays active until Shopify confirms the requested change.`
                    : "Open Shopify billing and approve the requested plan before VedaSuite updates your subscription.",
            };
        case "active":
            return {
                title: input.planName === "TRIAL"
                    ? "Trial access is active"
                    : `${input.planName} plan is active`,
                description: input.planName === "TRIAL"
                    ? input.trialEndsAt
                        ? `Your trial is active until ${input.trialEndsAt.toLocaleString()}.`
                        : "Your trial is active."
                    : "Your subscription is active and included features are available.",
            };
        case "test_charge":
            return {
                title: `${input.planName} plan is active`,
                description: "Your subscription is active and included features are available.",
            };
        case "cancelled":
            return {
                title: input.accessActive
                    ? `${input.planName} is cancelled and stays active until the end of the current period`
                    : "The subscription has been cancelled",
                description: input.accessActive && input.endsAt
                    ? `Included features remain available until ${input.endsAt.toLocaleString()}.`
                    : "Choose a plan in billing if you want to restore paid features.",
            };
        case "frozen":
            return {
                title: "Billing needs attention",
                description: "Shopify has paused or restricted the subscription. Resolve billing in Shopify before VedaSuite can restore full access.",
            };
        case "uninstalled":
            return {
                title: "VedaSuite is disconnected from Shopify",
                description: "Reconnect the app in Shopify before billing and included features can be verified again.",
            };
        case "no_subscription":
            return {
                title: "No paid plan is active",
                description: "Choose a plan in billing to unlock included features.",
            };
        default:
            return {
                title: "Billing status could not be verified",
                description: "VedaSuite could not confirm the latest Shopify billing state yet. Refresh the page or try again in a moment.",
            };
    }
}
function buildCanonicalEntitlements(input) {
    const effectivePlanName = input.accessActive || (input.planName === "TRIAL" && input.trialActive)
        ? input.planName
        : "NONE";
    const resolved = (0, capabilities_1.resolveEntitlements)({
        plan: effectivePlanName,
        billingStatus: input.accessActive ? "ACTIVE" : "INACTIVE",
        starterModule: input.starterModule,
    });
    const capabilities = resolved.capabilities;
    const modules = resolved.moduleAccess;
    const featureAccess = resolved.featureAccess;
    const tier = normalizeTier(effectivePlanName);
    return {
        tier,
        planName: effectivePlanName,
        starterModule: effectivePlanName === "STARTER" ? resolved.starterModule : null,
        accessActive: input.accessActive || (effectivePlanName === "TRIAL" && input.trialActive),
        verified: input.verified,
        modules,
        featureAccess,
        capabilities,
        title: effectivePlanName === "NONE"
            ? "Limited access"
            : effectivePlanName === "TRIAL"
                ? "Trial access"
                : `${effectivePlanName} access`,
        description: effectivePlanName === "STARTER" && input.starterModule
            ? `${(0, capabilities_1.normalizeStarterModuleLabel)(input.starterModule)} is the active Starter workflow.`
            : effectivePlanName === "NONE"
                ? "Choose a plan to unlock included features."
                : "Included features are based on the active subscription.",
    };
}
function deriveLifecycleStatus(input) {
    if (input.planName === "TRIAL") {
        return isDateInFuture(input.trialEndsAt) ? "trial_active" : "trial_expired";
    }
    if (input.planName === "NONE") {
        return input.billingStatus === "CANCELLED" ? "cancelled" : "inactive";
    }
    if (input.billingStatus === "CANCELLED") {
        return "cancelled";
    }
    if (input.active) {
        return "active_paid";
    }
    return input.billingStatus === "CANCELLED" ? "cancelled" : "inactive";
}
async function ensurePlanRecord(planName) {
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
async function recordBillingAuditLog(input) {
    await prismaClient_1.prisma.billingAuditLog.create({
        data: {
            storeId: input.storeId,
            subscriptionId: input.subscriptionId ?? null,
            eventType: input.eventType,
            previousPlanName: input.previousPlanName ?? null,
            nextPlanName: input.nextPlanName ?? null,
            previousStarterModule: input.previousStarterModule ?? null,
            nextStarterModule: input.nextStarterModule ?? null,
            billingStatus: input.billingStatus ?? null,
            metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
        },
    });
}
function logSubscriptionSaved(input) {
    (0, observabilityService_1.logEvent)("info", "billing.subscription_saved", input);
}
async function ensureStoreTrialState(store) {
    if (store.trialStartedAt && store.trialEndsAt) {
        return {
            trialStartedAt: store.trialStartedAt,
            trialEndsAt: store.trialEndsAt,
        };
    }
    const trialStartedAt = store.trialStartedAt ?? new Date();
    const trialEndsAt = getTrialEndsAt(trialStartedAt, store.trialEndsAt);
    await prismaClient_1.prisma.store.update({
        where: { id: store.id },
        data: {
            trialStartedAt,
            trialEndsAt,
        },
    });
    return { trialStartedAt, trialEndsAt };
}
function buildSubscriptionPayload(input) {
    const entitlement = buildCanonicalEntitlements({
        planName: input.planName,
        starterModule: input.starterModule,
        accessActive: input.active,
        verified: true,
        trialActive: isDateInFuture(input.trialEndsAt),
    });
    const capabilities = entitlement.capabilities;
    return {
        planName: entitlement.planName,
        price: input.price,
        trialDays: input.trialDays,
        starterModule: entitlement.starterModule,
        active: entitlement.accessActive,
        endsAt: input.endsAt?.toISOString() ?? null,
        trialStartedAt: input.trialStartedAt?.toISOString() ?? null,
        trialEndsAt: input.trialEndsAt?.toISOString() ?? null,
        status: deriveLifecycleStatus({
            planName: entitlement.planName,
            active: entitlement.accessActive,
            billingStatus: input.billingStatus,
            trialEndsAt: input.trialEndsAt,
        }),
        billingStatus: input.billingStatus,
        starterModuleSwitchAvailableAt: input.starterModuleSwitchAvailableAt?.toISOString() ?? null,
        enabledModules: entitlement.modules,
        featureAccess: entitlement.featureAccess,
        capabilities,
    };
}
function getStarterModuleSwitchAvailableAt(moduleSwitchedAt) {
    void moduleSwitchedAt;
    return null;
}
async function reconcileCurrentSubscriptionFromShopify(store) {
    const activeSubscription = await (0, shopifyAdminService_1.getActiveAppSubscription)(store.shop);
    if (!activeSubscription) {
        return null;
    }
    const planName = (0, capabilities_1.normalizePlanName)(activeSubscription.name);
    if (!planName || planName === "TRIAL" || planName === "NONE") {
        return null;
    }
    const plan = await ensurePlanRecord(planName);
    const currentPeriodEnd = activeSubscription.currentPeriodEnd
        ? new Date(activeSubscription.currentPeriodEnd)
        : null;
    const billingStatus = activeSubscription.status?.toUpperCase() ?? "ACTIVE";
    const starterModule = planName === "STARTER"
        ? (0, capabilities_1.normalizeStarterModule)(store.subscription?.starterModule) ?? "fraud"
        : null;
    const previousPlanName = store.subscription?.plan?.name ?? null;
    const nextSubscription = await prismaClient_1.prisma.storeSubscription.upsert({
        where: { storeId: store.id },
        update: {
            planId: plan.id,
            starterModule,
            shopifyChargeId: activeSubscription.id,
            active: true,
            billingStatus,
            planActivatedAt: new Date(),
            lastBillingSyncAt: new Date(),
            lastBillingResolutionSource: "shopify_api_reconcile",
            lastBillingSubscriptionName: activeSubscription.name,
            cancelledAt: null,
            endsAt: currentPeriodEnd,
        },
        create: {
            storeId: store.id,
            planId: plan.id,
            starterModule,
            shopifyChargeId: activeSubscription.id,
            active: true,
            billingStatus,
            planActivatedAt: new Date(),
            lastBillingSyncAt: new Date(),
            lastBillingResolutionSource: "shopify_api_reconcile",
            lastBillingSubscriptionName: activeSubscription.name,
            endsAt: currentPeriodEnd,
        },
        include: {
            plan: true,
        },
    });
    if (previousPlanName !== planName) {
        await recordBillingAuditLog({
            storeId: store.id,
            subscriptionId: nextSubscription.id,
            eventType: "billing.reconciled_from_shopify",
            previousPlanName,
            nextPlanName: planName,
            previousStarterModule: store.subscription?.starterModule ?? null,
            nextStarterModule: starterModule,
            billingStatus,
            metadata: {
                shopifyChargeId: activeSubscription.id,
            },
        });
    }
    logSubscriptionSaved({
        shop: store.shop,
        savedPlan: planName,
        savedStarterModule: starterModule,
    });
    return nextSubscription;
}
function isPaidSubscriptionActive(subscription) {
    if (!subscription?.active) {
        return false;
    }
    if (!subscription.endsAt) {
        return true;
    }
    return subscription.endsAt.getTime() > Date.now();
}
async function resolveBillingState(shopDomain) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
        ...storeWithSubscriptionArgs,
    });
    if (!store) {
        throw new Error("Store not found");
    }
    const { trialEndsAt } = await ensureStoreTrialState(store);
    const dbPlanName = (0, capabilities_1.normalizePlanName)(store.subscription?.plan?.name) ?? "NONE";
    const dbBillingStatus = store.subscription?.billingStatus ?? null;
    const latestIntent = store.billingPlanIntents[0] ?? null;
    const pendingIntentStatus = latestIntent?.status ?? null;
    const pendingRequestedPlanName = (0, capabilities_1.normalizePlanName)(latestIntent?.requestedPlanName) ?? null;
    const pendingRequestedStarterModule = (0, capabilities_1.normalizeStarterModule)(latestIntent?.requestedStarterModule);
    let subscription = store.subscription;
    let planSource = "none";
    let reconciledFromShopify = false;
    if (!isPaidSubscriptionActive(subscription) || !subscription?.plan) {
        const reconciled = await reconcileCurrentSubscriptionFromShopify(store).catch(() => null);
        if (reconciled) {
            subscription = reconciled;
            reconciledFromShopify = true;
        }
    }
    if (subscription?.plan && isPaidSubscriptionActive(subscription)) {
        const planName = (0, capabilities_1.normalizePlanName)(subscription.plan.name) ?? "NONE";
        const accessActive = subscription.active && isPaidSubscriptionActive(subscription);
        const lifecycle = deriveCanonicalBillingLifecycle({
            uninstalled: !!store.uninstalledAt,
            pendingApproval: isPendingIntentStatus(pendingIntentStatus),
            planName,
            accessActive,
            billingStatus: subscription.billingStatus,
            isTestCharge: env_1.env.billing.testMode,
        });
        const merchantCopy = buildMerchantBillingCopy({
            lifecycle,
            planName,
            pendingRequestedPlanName,
            accessActive,
            endsAt: subscription.endsAt ?? null,
            trialEndsAt,
        });
        planSource = reconciledFromShopify ? "shopify_reconciled" : "database";
        return {
            lifecycle,
            planName,
            planTier: normalizeTier(planName),
            normalizedBillingStatus: subscription.billingStatus,
            active: lifecycle === "active",
            accessActive,
            verified: lifecycle !== "unknown_error",
            status: deriveLifecycleStatus({
                planName,
                active: accessActive,
                billingStatus: subscription.billingStatus,
                trialEndsAt,
            }),
            starterModule: (0, capabilities_1.normalizeStarterModule)(subscription.starterModule),
            endsAt: subscription.endsAt?.toISOString() ?? null,
            renewalAt: lifecycle === "active" || (lifecycle === "cancelled" && accessActive)
                ? subscription.endsAt?.toISOString() ?? null
                : null,
            showRenewalDate: lifecycle === "active" ||
                (lifecycle === "cancelled" && accessActive),
            showTrialDate: false,
            subscriptionId: subscription.id,
            shopifyChargeId: subscription.shopifyChargeId ?? null,
            planSource,
            dbPlanName,
            dbBillingStatus,
            lastBillingSyncAt: subscription.lastBillingSyncAt?.toISOString() ?? null,
            lastBillingWebhookProcessedAt: subscription.lastBillingWebhookProcessedAt?.toISOString() ?? null,
            lastBillingResolutionSource: subscription.lastBillingResolutionSource ?? null,
            pendingIntentStatus,
            pendingRequestedPlanName,
            pendingRequestedStarterModule,
            merchantTitle: merchantCopy.title,
            merchantDescription: merchantCopy.description,
            mismatchWarnings: dbPlanName !== "NONE" && dbPlanName !== planName
                ? [
                    `Persisted DB plan ${dbPlanName} does not match effective plan ${planName}.`,
                ]
                : [],
        };
    }
    if (isDateInFuture(trialEndsAt)) {
        const lifecycle = deriveCanonicalBillingLifecycle({
            uninstalled: !!store.uninstalledAt,
            pendingApproval: isPendingIntentStatus(pendingIntentStatus),
            planName: "TRIAL",
            accessActive: true,
            billingStatus: null,
            isTestCharge: false,
        });
        const merchantCopy = buildMerchantBillingCopy({
            lifecycle,
            planName: "TRIAL",
            pendingRequestedPlanName,
            accessActive: true,
            endsAt: trialEndsAt,
            trialEndsAt,
        });
        return {
            lifecycle,
            planName: "TRIAL",
            planTier: "trial",
            normalizedBillingStatus: null,
            active: lifecycle === "active",
            accessActive: true,
            verified: lifecycle !== "unknown_error",
            status: deriveLifecycleStatus({
                planName: "TRIAL",
                active: true,
                billingStatus: null,
                trialEndsAt,
            }),
            starterModule: null,
            endsAt: trialEndsAt?.toISOString() ?? null,
            renewalAt: null,
            showRenewalDate: false,
            showTrialDate: true,
            subscriptionId: store.subscription?.id ?? null,
            shopifyChargeId: store.subscription?.shopifyChargeId ?? null,
            planSource: "trial",
            dbPlanName,
            dbBillingStatus,
            lastBillingSyncAt: store.subscription?.lastBillingSyncAt?.toISOString() ?? null,
            lastBillingWebhookProcessedAt: store.subscription?.lastBillingWebhookProcessedAt?.toISOString() ?? null,
            lastBillingResolutionSource: store.subscription?.lastBillingResolutionSource ?? null,
            pendingIntentStatus,
            pendingRequestedPlanName,
            pendingRequestedStarterModule,
            merchantTitle: merchantCopy.title,
            merchantDescription: merchantCopy.description,
            mismatchWarnings: [],
        };
    }
    const lifecycle = deriveCanonicalBillingLifecycle({
        uninstalled: !!store.uninstalledAt,
        pendingApproval: isPendingIntentStatus(pendingIntentStatus),
        planName: "NONE",
        accessActive: false,
        billingStatus: store.subscription?.billingStatus ?? "INACTIVE",
        isTestCharge: false,
    });
    const merchantCopy = buildMerchantBillingCopy({
        lifecycle,
        planName: "NONE",
        pendingRequestedPlanName,
        accessActive: false,
        endsAt: store.subscription?.endsAt ?? null,
        trialEndsAt,
    });
    return {
        lifecycle,
        planName: "NONE",
        planTier: "none",
        normalizedBillingStatus: store.subscription?.billingStatus ?? "INACTIVE",
        active: false,
        accessActive: false,
        verified: lifecycle !== "unknown_error",
        status: deriveLifecycleStatus({
            planName: "NONE",
            active: false,
            billingStatus: store.subscription?.billingStatus ?? "INACTIVE",
            trialEndsAt,
        }),
        starterModule: null,
        endsAt: store.subscription?.endsAt?.toISOString() ??
            trialEndsAt?.toISOString() ??
            null,
        renewalAt: null,
        showRenewalDate: false,
        showTrialDate: false,
        subscriptionId: store.subscription?.id ?? null,
        shopifyChargeId: store.subscription?.shopifyChargeId ?? null,
        planSource: "none",
        dbPlanName,
        dbBillingStatus,
        lastBillingSyncAt: store.subscription?.lastBillingSyncAt?.toISOString() ?? null,
        lastBillingWebhookProcessedAt: store.subscription?.lastBillingWebhookProcessedAt?.toISOString() ?? null,
        lastBillingResolutionSource: store.subscription?.lastBillingResolutionSource ?? null,
        pendingIntentStatus,
        pendingRequestedPlanName,
        pendingRequestedStarterModule,
        merchantTitle: merchantCopy.title,
        merchantDescription: merchantCopy.description,
        mismatchWarnings: [],
    };
}
async function getCurrentSubscription(shopDomain) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
        ...storeWithSubscriptionArgs,
    });
    if (!store) {
        throw new Error("Store not found");
    }
    const { trialStartedAt, trialEndsAt } = await ensureStoreTrialState(store);
    const resolved = await resolveBillingState(shopDomain);
    if (resolved.planName !== "NONE" && resolved.planName !== "TRIAL" && resolved.accessActive) {
        return buildSubscriptionPayload({
            planName: resolved.planName,
            price: (0, capabilities_1.getPlanPrice)(resolved.planName),
            trialDays: store.subscription?.plan?.trialDays ?? env_1.env.billing.trialDays,
            starterModule: resolved.starterModule,
            active: resolved.accessActive,
            endsAt: resolved.endsAt ? new Date(resolved.endsAt) : null,
            trialStartedAt,
            trialEndsAt,
            billingStatus: resolved.normalizedBillingStatus,
            starterModuleSwitchAvailableAt: getStarterModuleSwitchAvailableAt(store.subscription?.moduleSwitchedAt),
        });
    }
    if (resolved.planName === "TRIAL") {
        return buildSubscriptionPayload({
            planName: "TRIAL",
            price: 0,
            trialDays: env_1.env.billing.trialDays,
            starterModule: null,
            active: true,
            endsAt: trialEndsAt,
            trialStartedAt,
            trialEndsAt,
            billingStatus: null,
        });
    }
    return buildSubscriptionPayload({
        planName: "NONE",
        price: 0,
        trialDays: env_1.env.billing.trialDays,
        starterModule: null,
        active: false,
        endsAt: null,
        trialStartedAt,
        trialEndsAt,
        billingStatus: store.subscription?.billingStatus ?? "INACTIVE",
    });
}
async function reconcileBillingState(shopDomain) {
    const [billingState, subscription] = await Promise.all([
        resolveBillingState(shopDomain),
        getCurrentSubscription(shopDomain),
    ]);
    const entitlements = buildCanonicalEntitlements({
        planName: billingState.planName,
        starterModule: billingState.starterModule,
        accessActive: billingState.accessActive,
        verified: billingState.verified,
        trialActive: billingState.planName === "TRIAL" && billingState.accessActive,
    });
    (0, observabilityService_1.logEvent)("info", "billing.entitlements_resolved", {
        shop: shopDomain,
        planName: entitlements.planName,
        starterModule: entitlements.starterModule,
        enabledModules: Object.entries(entitlements.modules)
            .filter(([key, value]) => ["fraud", "competitor", "pricing", "profit"].includes(key) && value)
            .map(([key]) => key),
    });
    return {
        billingState,
        subscription,
        entitlements,
    };
}
async function resolveEntitlements(shopDomain) {
    const { billingState, entitlements } = await reconcileBillingState(shopDomain);
    const resolved = (0, capabilities_1.resolveEntitlements)({
        plan: entitlements.planName,
        billingStatus: billingState.normalizedBillingStatus,
        starterModule: entitlements.starterModule,
    });
    return {
        plan: entitlements.planName,
        billingStatus: billingState.normalizedBillingStatus,
        starterModule: entitlements.starterModule,
        enabledModules: resolved.enabledModules,
        lockedModules: resolved.lockedModules,
    };
}
async function resolveActivePlan(shopDomain) {
    const subscription = await getCurrentSubscription(shopDomain);
    return subscription.planName;
}
async function cancelSubscription(shopDomain) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
        ...storeWithSubscriptionArgs,
    });
    if (!store)
        throw new Error("Store not found");
    if (!store.subscription)
        throw new Error("No active subscription");
    const activeSubscriptionBeforeCancel = store.subscription.shopifyChargeId
        ? await (0, shopifyAdminService_1.getActiveAppSubscription)(shopDomain).catch(() => null)
        : null;
    const currentPeriodEnd = activeSubscriptionBeforeCancel?.currentPeriodEnd
        ? new Date(activeSubscriptionBeforeCancel.currentPeriodEnd)
        : store.subscription.endsAt;
    const accessRemainsActive = !!currentPeriodEnd && currentPeriodEnd.getTime() > Date.now();
    if (store.subscription.shopifyChargeId) {
        await (0, shopifyAdminService_1.cancelAppSubscription)(shopDomain, store.subscription.shopifyChargeId, false);
    }
    const cancelled = await prismaClient_1.prisma.storeSubscription.update({
        where: { id: store.subscription.id },
        data: {
            active: accessRemainsActive,
            billingStatus: "CANCELLED",
            cancelledAt: new Date(),
            lastBillingSyncAt: new Date(),
            lastBillingResolutionSource: "cancel_api",
            lastBillingSubscriptionName: store.subscription.plan.name,
            endsAt: currentPeriodEnd ?? new Date(),
        },
        include: {
            plan: true,
        },
    });
    await recordBillingAuditLog({
        storeId: store.id,
        subscriptionId: cancelled.id,
        eventType: "billing.cancelled",
        previousPlanName: store.subscription.plan.name,
        nextPlanName: "NONE",
        previousStarterModule: store.subscription.starterModule,
        nextStarterModule: null,
        billingStatus: "CANCELLED",
        metadata: {
            accessRemainsActive,
            currentPeriodEnd: currentPeriodEnd?.toISOString() ?? null,
        },
    });
    return getCurrentSubscription(shopDomain);
}
async function downgradeToTrial(shopDomain) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
        ...storeWithSubscriptionArgs,
    });
    if (!store)
        throw new Error("Store not found");
    if (store.subscription?.shopifyChargeId) {
        await (0, shopifyAdminService_1.cancelAppSubscription)(shopDomain, store.subscription.shopifyChargeId, false);
    }
    if (store.subscription) {
        await recordBillingAuditLog({
            storeId: store.id,
            subscriptionId: store.subscription.id,
            eventType: "billing.downgraded_to_trial",
            previousPlanName: store.subscription.plan.name,
            nextPlanName: "TRIAL",
            previousStarterModule: store.subscription.starterModule,
            nextStarterModule: null,
            billingStatus: "CANCELLED",
        });
        await prismaClient_1.prisma.storeSubscription.delete({
            where: { id: store.subscription.id },
        });
    }
    const trialStartedAt = new Date();
    const trialEndsAt = getTrialEndsAt(trialStartedAt, null);
    await prismaClient_1.prisma.store.update({
        where: { id: store.id },
        data: {
            trialStartedAt,
            trialEndsAt,
        },
    });
    return buildSubscriptionPayload({
        planName: "TRIAL",
        price: 0,
        trialDays: env_1.env.billing.trialDays,
        starterModule: null,
        active: true,
        endsAt: trialEndsAt,
        trialStartedAt,
        trialEndsAt,
        billingStatus: null,
    });
}
async function updateStarterModuleSelection(shopDomain, starterModule) {
    (0, observabilityService_1.logEvent)("info", "starter_module.update_requested", {
        shop: shopDomain,
        requestedStarterModule: starterModule,
        normalizedStarterModule: (0, capabilities_1.normalizeStarterModule)(starterModule),
    });
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
        ...storeWithSubscriptionArgs,
    });
    if (!store)
        throw new Error("Store not found");
    if (!store.subscription || store.subscription.plan.name !== "STARTER") {
        throw new Error("Starter feature selection can only be changed on the STARTER plan.");
    }
    const normalizedStarterModule = (0, capabilities_1.normalizeStarterModule)(starterModule);
    if (!normalizedStarterModule) {
        throw new Error("Invalid Starter feature selection.");
    }
    const updated = await prismaClient_1.prisma.storeSubscription.update({
        where: { id: store.subscription.id },
        data: {
            starterModule: normalizedStarterModule,
            moduleSwitchedAt: new Date(),
            lastBillingSyncAt: new Date(),
            lastBillingResolutionSource: "starter_module_switch",
        },
        include: {
            plan: true,
        },
    });
    await recordBillingAuditLog({
        storeId: store.id,
        subscriptionId: updated.id,
        eventType: "starter.module_switched",
        previousPlanName: store.subscription.plan.name,
        nextPlanName: updated.plan.name,
        previousStarterModule: store.subscription.starterModule,
        nextStarterModule: normalizedStarterModule,
        billingStatus: updated.billingStatus,
    });
    (0, observabilityService_1.logEvent)("info", "starter_module.db_updated", {
        shop: shopDomain,
        savedPlan: "STARTER",
        savedStarterModule: normalizedStarterModule,
    });
    logSubscriptionSaved({
        shop: shopDomain,
        savedPlan: "STARTER",
        savedStarterModule: normalizedStarterModule,
    });
    return getCurrentSubscription(shopDomain);
}
async function reconcileStoreSubscriptionFromWebhook(input) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: input.shopDomain },
        ...storeWithSubscriptionArgs,
    });
    if (!store) {
        return null;
    }
    const normalizedStatus = input.status?.toUpperCase() ?? "INACTIVE";
    const isActive = normalizedStatus === "ACTIVE" ||
        normalizedStatus === "ACCEPTED" ||
        normalizedStatus === "PENDING";
    const planName = (0, capabilities_1.normalizePlanName)(input.planName);
    const currentPeriodEnd = input.currentPeriodEnd
        ? new Date(input.currentPeriodEnd)
        : null;
    if (!isActive) {
        if (!store.subscription) {
            return null;
        }
        const accessRemainsActive = normalizedStatus === "CANCELLED" &&
            !!currentPeriodEnd &&
            currentPeriodEnd.getTime() > Date.now();
        const updated = await prismaClient_1.prisma.storeSubscription.update({
            where: { id: store.subscription.id },
            data: {
                active: accessRemainsActive,
                billingStatus: normalizedStatus,
                cancelledAt: new Date(),
                lastBillingSyncAt: new Date(),
                lastBillingWebhookProcessedAt: new Date(),
                lastBillingResolutionSource: "webhook_app_subscriptions_update",
                lastBillingSubscriptionName: input.planName ?? store.subscription.plan.name,
                endsAt: currentPeriodEnd ?? new Date(),
            },
        });
        await recordBillingAuditLog({
            storeId: store.id,
            subscriptionId: updated.id,
            eventType: "billing.webhook_deactivated",
            previousPlanName: store.subscription.plan.name,
            nextPlanName: "NONE",
            previousStarterModule: store.subscription.starterModule,
            nextStarterModule: null,
            billingStatus: normalizedStatus,
            metadata: {
                shopifyChargeId: input.shopifyChargeId ?? null,
                accessRemainsActive,
                currentPeriodEnd: currentPeriodEnd?.toISOString() ?? null,
            },
        });
        logSubscriptionSaved({
            shop: input.shopDomain,
            savedPlan: "NONE",
            savedStarterModule: null,
        });
        return {
            ...updated,
            plan: store.subscription.plan,
        };
    }
    if (!planName || planName === "TRIAL" || planName === "NONE") {
        return store.subscription;
    }
    const plan = await ensurePlanRecord(planName);
    const updated = await prismaClient_1.prisma.storeSubscription.upsert({
        where: { storeId: store.id },
        update: {
            planId: plan.id,
            shopifyChargeId: input.shopifyChargeId ?? store.subscription?.shopifyChargeId ?? null,
            active: true,
            billingStatus: normalizedStatus,
            planActivatedAt: new Date(),
            lastBillingSyncAt: new Date(),
            lastBillingWebhookProcessedAt: new Date(),
            lastBillingResolutionSource: "webhook_app_subscriptions_update",
            lastBillingSubscriptionName: input.planName ?? planName,
            cancelledAt: null,
            endsAt: currentPeriodEnd,
            starterModule: planName === "STARTER"
                ? (0, capabilities_1.normalizeStarterModule)(store.subscription?.starterModule) ?? "fraud"
                : null,
        },
        create: {
            storeId: store.id,
            planId: plan.id,
            shopifyChargeId: input.shopifyChargeId ?? null,
            active: true,
            billingStatus: normalizedStatus,
            planActivatedAt: new Date(),
            lastBillingSyncAt: new Date(),
            lastBillingWebhookProcessedAt: new Date(),
            lastBillingResolutionSource: "webhook_app_subscriptions_update",
            lastBillingSubscriptionName: input.planName ?? planName,
            endsAt: currentPeriodEnd,
            starterModule: planName === "STARTER" ? "fraud" : null,
        },
        include: {
            plan: true,
        },
    });
    await recordBillingAuditLog({
        storeId: store.id,
        subscriptionId: updated.id,
        eventType: "billing.webhook_reconciled",
        previousPlanName: store.subscription?.plan?.name ?? null,
        nextPlanName: planName,
        previousStarterModule: store.subscription?.starterModule ?? null,
        nextStarterModule: updated.starterModule,
        billingStatus: normalizedStatus,
        metadata: {
            shopifyChargeId: input.shopifyChargeId ?? null,
            currentPeriodEnd: input.currentPeriodEnd ?? null,
        },
    });
    logSubscriptionSaved({
        shop: input.shopDomain,
        savedPlan: planName,
        savedStarterModule: (0, capabilities_1.normalizeStarterModule)(updated.starterModule),
    });
    return updated;
}
