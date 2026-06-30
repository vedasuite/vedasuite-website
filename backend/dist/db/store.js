"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveStore = saveStore;
exports.getToken = getToken;
const prismaClient_1 = require("./prismaClient");
const env_1 = require("../config/env");
const shopifyConnectionService_1 = require("../services/shopifyConnectionService");
async function saveStore(shop, accessToken) {
    const normalizedShop = (0, shopifyConnectionService_1.normalizeShopDomain)(shop);
    if (!normalizedShop) {
        throw new Error("Invalid Shopify shop domain.");
    }
    return prismaClient_1.prisma.store.upsert({
        where: { shop: normalizedShop },
        create: {
            shop: normalizedShop,
            accessToken,
            grantedScopes: env_1.env.shopifyScopes,
            tokenAcquisitionMode: "offline_legacy",
            isOffline: true,
            installedAt: new Date(),
            reauthorizedAt: new Date(),
            lastConnectionStatus: "OK",
            authErrorCode: null,
            authErrorMessage: null,
        },
        update: {
            accessToken,
            grantedScopes: env_1.env.shopifyScopes,
            tokenAcquisitionMode: "offline_legacy",
            reauthorizedAt: new Date(),
            uninstalledAt: null,
            lastConnectionStatus: "OK",
            lastConnectionError: null,
            authErrorCode: null,
            authErrorMessage: null,
        },
    });
}
async function getToken(shop) {
    try {
        const installation = await (0, shopifyConnectionService_1.resolveOfflineInstallation)(shop);
        return installation.accessToken ?? null;
    }
    catch {
        return null;
    }
}
