"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCustomerScores = listCustomerScores;
exports.getCustomerScore = getCustomerScore;
exports.recomputeCustomerScore = recomputeCustomerScore;
const prismaClient_1 = require("../db/prismaClient");
function classifyCredit(score) {
    if (score >= 80)
        return "Trusted Buyer";
    if (score >= 50)
        return "Normal Buyer";
    return "Risky Buyer";
}
function mapCustomer(customer) {
    return {
        id: customer.id,
        email: customer.email,
        totalOrders: customer.totalOrders,
        totalRefunds: customer.totalRefunds,
        refundRate: customer.refundRate,
        fraudSignalsCount: customer.fraudSignalsCount,
        paymentReliability: customer.paymentReliability,
        creditScore: customer.creditScore,
        creditCategory: customer.creditCategory,
        orderCompletionRate: customer.totalOrders === 0
            ? 0
            : Number((((customer.totalOrders - customer.totalRefunds) / customer.totalOrders) *
                100).toFixed(1)),
    };
}
async function listCustomerScores(shopDomain) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
    });
    if (!store)
        throw new Error("Store not found");
    const customers = await prismaClient_1.prisma.customer.findMany({
        where: { storeId: store.id },
        orderBy: { updatedAt: "desc" },
        take: 100,
    });
    return customers.map(mapCustomer);
}
async function getCustomerScore(shopDomain, customerId) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
    });
    if (!store)
        throw new Error("Store not found");
    const customer = await prismaClient_1.prisma.customer.findFirst({
        where: { id: customerId, storeId: store.id },
    });
    if (!customer)
        throw new Error("Customer not found");
    return mapCustomer(customer);
}
async function recomputeCustomerScore(customerId) {
    const customer = await prismaClient_1.prisma.customer.findUnique({
        where: { id: customerId },
    });
    if (!customer)
        throw new Error("Customer not found");
    const base = 70;
    const refundPenalty = Math.min(40, customer.refundRate * 100);
    const fraudPenalty = Math.min(30, customer.fraudSignalsCount * 5);
    const paymentBonus = Math.min(20, customer.paymentReliability);
    let score = base - refundPenalty - fraudPenalty + paymentBonus;
    score = Math.max(0, Math.min(100, Math.round(score)));
    const category = classifyCredit(score);
    const updated = await prismaClient_1.prisma.customer.update({
        where: { id: customerId },
        data: { creditScore: score, creditCategory: category },
    });
    return mapCustomer(updated);
}
