"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPricingRecommendations = getPricingRecommendations;
exports.simulatePricingChange = simulatePricingChange;
exports.approvePricingRecommendation = approvePricingRecommendation;
const prismaClient_1 = require("../db/prismaClient");
const shopifyAdminService_1 = require("./shopifyAdminService");
async function getPricingRecommendations(shopDomain) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
    });
    if (!store)
        throw new Error("Store not found");
    const history = await prismaClient_1.prisma.priceHistory.findMany({
        where: { storeId: store.id },
        orderBy: { createdAt: "desc" },
        take: 100,
    });
    return history;
}
async function simulatePricingChange(params) {
    const { currentPrice, recommendedPrice, salesVelocity, margin } = params;
    const priceDelta = recommendedPrice - currentPrice;
    const expectedMarginImprovement = margin === 0 ? 0 : (priceDelta / currentPrice) * margin;
    const projectedMonthlyProfitGain = priceDelta * salesVelocity * 30 * (margin / 100);
    return {
        currentPrice,
        recommendedPrice,
        expectedMarginImprovement,
        projectedMonthlyProfitGain,
    };
}
async function approvePricingRecommendation(shopDomain, recommendationId) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
    });
    if (!store)
        throw new Error("Store not found");
    const recommendation = await prismaClient_1.prisma.priceHistory.findFirst({
        where: {
            id: recommendationId,
            storeId: store.id,
        },
    });
    if (!recommendation) {
        throw new Error("Pricing recommendation not found");
    }
    let rationale = {};
    if (recommendation.rationaleJson) {
        try {
            rationale = JSON.parse(recommendation.rationaleJson);
        }
        catch {
            rationale = {};
        }
    }
    const shopifyPublishResult = await (0, shopifyAdminService_1.publishProductPrice)(shopDomain, recommendation.productHandle, recommendation.recommendedPrice);
    const updated = await prismaClient_1.prisma.priceHistory.update({
        where: { id: recommendation.id },
        data: {
            rationaleJson: JSON.stringify({
                ...rationale,
                status: "approved",
                approvedAt: new Date().toISOString(),
                publishedToShopify: shopifyPublishResult.updated,
                shopifyPublishReason: shopifyPublishResult.updated ? null : shopifyPublishResult.reason,
            }),
        },
    });
    return {
        ...updated,
        shopifyPublishResult,
    };
}
