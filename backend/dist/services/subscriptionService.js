"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentSubscription = getCurrentSubscription;
exports.cancelSubscription = cancelSubscription;
exports.downgradeToTrial = downgradeToTrial;
exports.updateStarterModuleSelection = updateStarterModuleSelection;
exports.reconcileStoreSubscriptionFromWebhook = reconcileStoreSubscriptionFromWebhook;
const prismaClient_1 = require("../db/prismaClient");
const shopifyAdminService_1 = require("./shopifyAdminService");
function isSubscriptionCurrentlyActive(endsAt, active) {
    if (!active) {
        return false;
    }
    if (!endsAt) {
        return true;
    }
    return endsAt.getTime() > Date.now();
}
async function getCurrentSubscription(shopDomain) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
        include: {
            subscription: {
                include: {
                    plan: true,
                },
            },
        },
    });
    if (!store)
        throw new Error("Store not found");
    const subscriptionIsActive = isSubscriptionCurrentlyActive(store.subscription?.endsAt, store.subscription?.active);
    const plan = subscriptionIsActive ? store.subscription?.plan : null;
    const starterModule = store.subscription?.starterModule ?? null;
    const isStarterFraud = plan?.name === "STARTER" && starterModule === "fraud";
    const isStarterCompetitor = plan?.name === "STARTER" && starterModule === "competitor";
    const enabledModules = {
        fraud: !!plan && (["GROWTH", "PRO"].includes(plan.name) || isStarterFraud),
        competitor: !!plan &&
            (["GROWTH", "PRO"].includes(plan.name) || isStarterCompetitor),
        pricing: !!plan && ["GROWTH", "PRO"].includes(plan.name),
        creditScore: !!plan && ["GROWTH", "PRO"].includes(plan.name),
        profitOptimization: !!plan && plan.name === "PRO",
    };
    return {
        planName: plan?.name ?? "TRIAL",
        price: plan?.price ?? 0,
        trialDays: plan?.trialDays ?? 3,
        starterModule,
        active: store.subscription?.active ?? false,
        endsAt: store.subscription?.endsAt?.toISOString() ?? null,
        enabledModules,
    };
}
async function cancelSubscription(shopDomain) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
        include: { subscription: true },
    });
    if (!store)
        throw new Error("Store not found");
    if (!store.subscription)
        throw new Error("No active subscription");
    if (store.subscription.shopifyChargeId) {
        await (0, shopifyAdminService_1.cancelAppSubscription)(shopDomain, store.subscription.shopifyChargeId, false);
    }
    const updated = await prismaClient_1.prisma.storeSubscription.update({
        where: { id: store.subscription.id },
        data: {
            active: false,
            endsAt: new Date(),
        },
    });
    return updated;
}
async function downgradeToTrial(shopDomain) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
        include: { subscription: true },
    });
    if (!store)
        throw new Error("Store not found");
    if (store.subscription) {
        if (store.subscription.shopifyChargeId) {
            await (0, shopifyAdminService_1.cancelAppSubscription)(shopDomain, store.subscription.shopifyChargeId, false);
        }
        await prismaClient_1.prisma.storeSubscription.delete({
            where: { id: store.subscription.id },
        });
    }
    return {
        planName: "TRIAL",
        active: false,
    };
}
async function updateStarterModuleSelection(shopDomain, starterModule) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
        include: {
            subscription: {
                include: { plan: true },
            },
        },
    });
    if (!store)
        throw new Error("Store not found");
    if (!store.subscription || store.subscription.plan.name !== "STARTER") {
        throw new Error("Starter module selection can only be changed on the STARTER plan.");
    }
    return prismaClient_1.prisma.storeSubscription.update({
        where: { id: store.subscription.id },
        data: { starterModule },
    });
}
async function reconcileStoreSubscriptionFromWebhook(input) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: input.shopDomain },
        include: {
            subscription: true,
        },
    });
    if (!store) {
        return null;
    }
    const normalizedStatus = input.status?.toUpperCase() ?? null;
    const isActive = normalizedStatus === "ACTIVE" ||
        normalizedStatus === "ACCEPTED" ||
        normalizedStatus === "PENDING";
    const planName = input.planName
        ?.replace(/^VedaSuite AI - /i, "")
        .trim()
        .toUpperCase();
    if (!isActive) {
        if (!store.subscription) {
            return null;
        }
        return prismaClient_1.prisma.storeSubscription.update({
            where: { id: store.subscription.id },
            data: {
                active: false,
                endsAt: input.currentPeriodEnd ? new Date(input.currentPeriodEnd) : new Date(),
            },
        });
    }
    if (!planName) {
        return store.subscription;
    }
    const plan = await prismaClient_1.prisma.subscriptionPlan.findUnique({
        where: { name: planName },
    });
    if (!plan) {
        return store.subscription;
    }
    return prismaClient_1.prisma.storeSubscription.upsert({
        where: { storeId: store.id },
        update: {
            planId: plan.id,
            shopifyChargeId: input.shopifyChargeId ?? store.subscription?.shopifyChargeId ?? null,
            active: true,
            endsAt: input.currentPeriodEnd ? new Date(input.currentPeriodEnd) : null,
        },
        create: {
            storeId: store.id,
            planId: plan.id,
            shopifyChargeId: input.shopifyChargeId ?? null,
            active: true,
            endsAt: input.currentPeriodEnd ? new Date(input.currentPeriodEnd) : null,
        },
    });
}
