"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureStoreBootstrapped = ensureStoreBootstrapped;
const env_1 = require("../config/env");
const prismaClient_1 = require("../db/prismaClient");
const observabilityService_1 = require("./observabilityService");
async function ensureStoreBootstrapped(shop) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop },
        select: {
            id: true,
            shop: true,
            installedAt: true,
        },
    });
    if (!store) {
        throw new Error("Store not found");
    }
    if (env_1.env.enableGuidedBootstrap) {
        (0, observabilityService_1.logEvent)("warn", "bootstrap.guided_bootstrap_ignored", {
            shop: store.shop,
            message: "Guided bootstrap is enabled in configuration, but VedaSuite only uses Shopify store activity for merchant intelligence.",
        });
    }
    (0, observabilityService_1.logEvent)("info", "bootstrap.checked", {
        shop: store.shop,
        installedAt: store.installedAt?.toISOString() ?? null,
        generatedGuidedData: false,
    });
}
