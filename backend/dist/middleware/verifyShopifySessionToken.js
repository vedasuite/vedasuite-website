"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyShopifySessionToken = verifyShopifySessionToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function buildReauthorizeUrl(shop) {
    if (!shop) {
        return undefined;
    }
    return new URL(`/auth/install?shop=${encodeURIComponent(shop)}`, env_1.env.shopifyAppUrl).toString();
}
function verifyShopifySessionToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const requestedShop = (typeof req.query.shop === "string" && req.query.shop) ||
        (typeof req.body?.shop === "string" && req.body.shop) ||
        undefined;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({
            error: {
                message: "Missing Shopify session token. Reload the embedded app and try again.",
                reauthorizeUrl: buildReauthorizeUrl(requestedShop),
            },
        });
    }
    const token = authHeader.slice("Bearer ".length);
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.shopifyApiSecret, {
            algorithms: ["HS256"],
            audience: env_1.env.shopifyApiKey,
        });
        const tokenShop = typeof payload.dest === "string" ? new URL(payload.dest).host : undefined;
        if (requestedShop && tokenShop && requestedShop !== tokenShop) {
            return res.status(403).json({
                error: {
                    message: "Shop parameter does not match the authenticated Shopify session.",
                },
            });
        }
        req.shopifySession = {
            shop: tokenShop,
            sub: typeof payload.sub === "string" ? payload.sub : undefined,
        };
        return next();
    }
    catch {
        return res.status(401).json({
            error: {
                message: "Invalid Shopify session token. Reopen or reauthorize the embedded app and retry.",
                reauthorizeUrl: buildReauthorizeUrl(requestedShop),
            },
        });
    }
}
