"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyShopifySessionToken = verifyShopifySessionToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const shopifyConnectionService_1 = require("../services/shopifyConnectionService");
const shopifySessionCookie_1 = require("../lib/shopifySessionCookie");
const observabilityService_1 = require("../services/observabilityService");
function sendAuthError(req, res, status, code, message, shop) {
    const host = typeof req.query.host === "string"
        ? req.query.host
        : typeof req.body?.host === "string"
            ? req.body.host
            : undefined;
    const returnTo = typeof req.query.returnTo === "string"
        ? req.query.returnTo
        : typeof req.body?.returnTo === "string"
            ? req.body.returnTo
            : req.path;
    // Tell App Bridge to refresh the session token and retry automatically
    if (status === 401) {
        res.setHeader("X-Shopify-Retry-Invalid-Session-Request", "1");
    }
    return res.status(status).json({
        error: {
            code,
            message,
            reauthorizeUrl: (0, shopifyConnectionService_1.buildReauthorizeUrl)(shop, returnTo, host),
        },
    });
}
function verifyShopifySessionToken(req, res, next) {
    const requestedShop = (0, shopifyConnectionService_1.normalizeShopDomain)((typeof req.query.shop === "string" && req.query.shop) ||
        (typeof req.body?.shop === "string" && req.body.shop) ||
        undefined);
    const cookieShop = (0, shopifyConnectionService_1.normalizeShopDomain)((0, shopifySessionCookie_1.readShopifySessionCookie)(req));
    const authHeader = req.headers.authorization;
    if (!requestedShop && !cookieShop) {
        return sendAuthError(req, res, 401, "MISSING_SHOP", "Missing Shopify shop context. Reopen the embedded app and retry.");
    }
    const acceptCookieSession = () => {
        if (!cookieShop) {
            return false;
        }
        if (requestedShop && cookieShop !== requestedShop) {
            return sendAuthError(req, res, 403, "INVALID_SHOPIFY_SESSION_TOKEN", "Shop parameter does not match the authenticated Shopify session.", requestedShop);
        }
        req.shopifySession = {
            shop: cookieShop,
            sub: undefined,
        };
        return next();
    };
    if (!authHeader?.startsWith("Bearer ")) {
        return acceptCookieSession();
    }
    const token = authHeader.slice("Bearer ".length);
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.shopifyApiSecret, {
            algorithms: ["HS256"],
            audience: env_1.env.shopifyApiKey,
        });
        // Docs require iss and dest top-level domains to match
        if (typeof payload.iss === "string" && typeof payload.dest === "string") {
            try {
                const issHost = new URL(payload.iss).host;
                const destHost = new URL(payload.dest).host;
                if (issHost !== destHost) {
                    throw new Error("iss/dest domain mismatch");
                }
            }
            catch {
                return sendAuthError(req, res, 401, "INVALID_SHOPIFY_SESSION_TOKEN", "Invalid Shopify session token. Refresh or reconnect the embedded app and retry.", requestedShop);
            }
        }
        const tokenShop = (0, shopifyConnectionService_1.normalizeShopDomain)(typeof payload.dest === "string" ? new URL(payload.dest).host : undefined);
        if (requestedShop && tokenShop && requestedShop !== tokenShop) {
            return sendAuthError(req, res, 403, "INVALID_SHOPIFY_SESSION_TOKEN", "Shop parameter does not match the authenticated Shopify session.", requestedShop);
        }
        req.shopifySession = {
            shop: tokenShop ?? requestedShop ?? cookieShop ?? undefined,
            sub: typeof payload.sub === "string" ? payload.sub : undefined,
        };
        return next();
    }
    catch (error) {
        (0, observabilityService_1.logEvent)("warn", "shopify.session_token.invalid", {
            shop: requestedShop ?? cookieShop ?? null,
            route: req.originalUrl,
            error,
        });
        if (acceptCookieSession()) {
            return;
        }
        (0, shopifySessionCookie_1.clearShopifySessionCookie)(res);
        return sendAuthError(req, res, 401, "INVALID_SHOPIFY_SESSION_TOKEN", "Invalid Shopify session token. Refresh or reconnect the embedded app and retry.", requestedShop);
    }
}
