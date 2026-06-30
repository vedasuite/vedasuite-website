"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfitRecommendations = getProfitRecommendations;
exports.getProfitOpportunities = getProfitOpportunities;
const prismaClient_1 = require("../db/prismaClient");
const subscriptionService_1 = require("./subscriptionService");
async function assertProPlan(shopDomain) {
    const [store, subscription] = await Promise.all([
        prismaClient_1.prisma.store.findUnique({
            where: { shop: shopDomain },
        }),
        (0, subscriptionService_1.getCurrentSubscription)(shopDomain),
    ]);
    if (!store)
        throw new Error("Store not found");
    const hasFullProfitAccess = subscription.enabledModules.pricing &&
        subscription.featureAccess.fullProfitEngine;
    if (!hasFullProfitAccess) {
        throw new Error("AI Profit Optimization Engine is available only on PRO.");
    }
    return store;
}
async function getProfitRecommendations(shopDomain) {
    const store = await assertProPlan(shopDomain);
    const rows = await prismaClient_1.prisma.profitOptimizationData.findMany({
        where: { storeId: store.id },
        orderBy: { createdAt: "desc" },
        take: 50,
    });
    return rows;
}
async function getProfitOpportunities(shopDomain) {
    const recommendations = await getProfitRecommendations(shopDomain);
    return recommendations.map((row) => ({
        productHandle: row.productHandle,
        currentPrice: row.sellingPrice,
        recommendedPrice: row.optimalPrice,
        expectedMarginIncrease: row.projectedMarginIncrease,
        projectedMonthlyProfitGain: row.projectedMonthlyProfit,
        discountStrategy: row.discountStrategyJson,
        bundleOpportunities: row.bundleSuggestionsJson,
    }));
}
