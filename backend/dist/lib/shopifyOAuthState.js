"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShopifyOAuthState = createShopifyOAuthState;
exports.setShopifyOAuthStateCookie = setShopifyOAuthStateCookie;
exports.readShopifyOAuthStateCookie = readShopifyOAuthStateCookie;
exports.clearShopifyOAuthStateCookie = clearShopifyOAuthStateCookie;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const SHOPIFY_OAUTH_STATE_COOKIE = "vedasuite_oauth_state";
const COOKIE_MAX_AGE_MS = 15 * 60 * 1000;
function toBase64Url(value) {
    return Buffer.from(value, "utf8").toString("base64url");
}
function fromBase64Url(value) {
    return Buffer.from(value, "base64url").toString("utf8");
}
function buildCookieValue(payload) {
    const encodedPayload = toBase64Url(JSON.stringify({
        shop: payload.shop,
        state: payload.state,
        host: payload.host ?? null,
        returnTo: payload.returnTo ?? null,
    }));
    const signature = crypto_1.default
        .createHmac("sha256", env_1.env.shopifyApiSecret)
        .update(encodedPayload)
        .digest("hex");
    return `${encodedPayload}.${signature}`;
}
function parseCookieValue(raw) {
    if (!raw) {
        return null;
    }
    const [encodedPayload, signature] = raw.split(".");
    if (!encodedPayload || !signature) {
        return null;
    }
    const expected = crypto_1.default
        .createHmac("sha256", env_1.env.shopifyApiSecret)
        .update(encodedPayload)
        .digest("hex");
    const provided = Buffer.from(signature);
    const generated = Buffer.from(expected);
    if (provided.length !== generated.length) {
        return null;
    }
    if (!crypto_1.default.timingSafeEqual(provided, generated)) {
        return null;
    }
    try {
        const payload = JSON.parse(fromBase64Url(encodedPayload));
        if (!payload.shop || !payload.state) {
            return null;
        }
        return payload;
    }
    catch {
        return null;
    }
}
function createShopifyOAuthState() {
    return crypto_1.default.randomBytes(24).toString("hex");
}
function setShopifyOAuthStateCookie(res, payload) {
    res.cookie(SHOPIFY_OAUTH_STATE_COOKIE, buildCookieValue(payload), {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: COOKIE_MAX_AGE_MS,
    });
}
function readShopifyOAuthStateCookie(req) {
    const rawCookie = typeof req.cookies?.[SHOPIFY_OAUTH_STATE_COOKIE] === "string"
        ? req.cookies[SHOPIFY_OAUTH_STATE_COOKIE]
        : undefined;
    return parseCookieValue(rawCookie);
}
function clearShopifyOAuthStateCookie(res) {
    res.clearCookie(SHOPIFY_OAUTH_STATE_COOKIE, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
    });
}
