"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
const prismaClient_1 = require("../db/prismaClient");
async function getSettings(shopDomain) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
        include: { competitorDomains: true },
    });
    if (!store)
        throw new Error("Store not found");
    return {
        fraudSensitivity: store.fraudSensitivity ?? "medium",
        sharedFraudNetwork: store.sharedFraudNetwork ?? false,
        pricingBias: typeof store.pricingBias === "number" ? store.pricingBias : 55,
        profitGuardrail: typeof store.profitGuardrail === "number" ? store.profitGuardrail : 18,
        competitorDomains: store.competitorDomains,
    };
}
async function updateSettings(shopDomain, input) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
    });
    if (!store)
        throw new Error("Store not found");
    await prismaClient_1.prisma.store.update({
        where: { id: store.id },
        data: {
            fraudSensitivity: input.fraudSensitivity ?? store.fraudSensitivity,
            sharedFraudNetwork: input.sharedFraudNetwork ?? store.sharedFraudNetwork,
            pricingBias: input.pricingBias ?? store.pricingBias,
            profitGuardrail: input.profitGuardrail ?? store.profitGuardrail,
        },
    });
    if (input.competitorDomains) {
        await prismaClient_1.prisma.competitorDomain.deleteMany({
            where: { storeId: store.id },
        });
        await prismaClient_1.prisma.competitorDomain.createMany({
            data: input.competitorDomains.map((d) => ({
                storeId: store.id,
                domain: d.domain,
                label: d.label,
            })),
        });
    }
    return getSettings(shopDomain);
}
