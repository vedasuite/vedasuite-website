"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreOrderFraud = scoreOrderFraud;
exports.listRecentFraudOrders = listRecentFraudOrders;
exports.applyFraudAction = applyFraudAction;
const prismaClient_1 = require("../db/prismaClient");
const shopifyAdminService_1 = require("./shopifyAdminService");
function mapScoreToRisk(score) {
    if (score <= 30)
        return "Low";
    if (score <= 70)
        return "Medium";
    return "High";
}
async function scoreOrderFraud(shopDomain, orderId, signals) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
    });
    if (!store) {
        throw new Error("Store not found");
    }
    let score = 10;
    if (signals.refundHistoryScore)
        score += signals.refundHistoryScore;
    if (signals.orderFrequencyScore)
        score += signals.orderFrequencyScore;
    if (signals.ipAddress?.startsWith("10."))
        score += 10;
    if (signals.email?.endsWith("+fraud@test.com"))
        score += 15;
    if (store.fraudSensitivity === "high") {
        score = Math.min(100, Math.floor(score * 1.2));
    }
    score = Math.max(0, Math.min(100, score));
    const riskLevel = mapScoreToRisk(score);
    const order = await prismaClient_1.prisma.order.update({
        where: { id: orderId },
        data: {
            fraudScore: score,
            fraudRiskLevel: riskLevel,
        },
    });
    await prismaClient_1.prisma.fraudSignal.create({
        data: {
            storeId: store.id,
            orderId: order.id,
            ipAddress: signals.ipAddress,
            email: signals.email,
            shippingAddress: signals.shippingAddress,
            deviceFingerprint: signals.deviceFingerprint,
            paymentFingerprint: signals.paymentFingerprint,
            refundHistory: signals.refundHistoryScore?.toString(),
            orderFrequency: signals.orderFrequencyScore?.toString(),
            riskScore: score,
            riskLevel,
        },
    });
    return { orderId: order.id, fraudScore: score, riskLevel };
}
async function listRecentFraudOrders(shopDomain) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
    });
    if (!store) {
        throw new Error("Store not found");
    }
    const orders = await prismaClient_1.prisma.order.findMany({
        where: { storeId: store.id },
        orderBy: { createdAt: "desc" },
        take: 50,
    });
    return orders;
}
async function applyFraudAction(shopDomain, orderId, action) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
    });
    if (!store) {
        throw new Error("Store not found");
    }
    const nextStatus = action === "allow"
        ? "approved"
        : action === "block"
            ? "blocked"
            : action === "flag"
                ? "flagged"
                : "manual_review";
    const order = await prismaClient_1.prisma.order.update({
        where: { id: orderId },
        data: {
            status: nextStatus,
        },
    });
    const tags = [
        "VedaSuite AI",
        `vedasuite:${action}`,
        `fraud-risk:${order.fraudRiskLevel.toLowerCase()}`,
    ];
    const shopifyTagResult = await (0, shopifyAdminService_1.tagShopifyOrder)(shopDomain, order.shopifyOrderId, tags);
    return {
        ...order,
        shopifyTagResult,
    };
}
