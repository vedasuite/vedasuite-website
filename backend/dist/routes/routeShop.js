"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAuthenticatedShop = resolveAuthenticatedShop;
const shopifyConnectionService_1 = require("../services/shopifyConnectionService");
function resolveAuthenticatedShop(req) {
    const sessionShop = (0, shopifyConnectionService_1.normalizeShopDomain)(req.shopifySession?.shop);
    const queryShop = (0, shopifyConnectionService_1.normalizeShopDomain)(typeof req.query.shop === "string" ? req.query.shop : undefined);
    const bodyShop = (0, shopifyConnectionService_1.normalizeShopDomain)(typeof req.body?.shop === "string" ? req.body.shop : undefined);
    return sessionShop ?? queryShop ?? bodyShop ?? null;
}
