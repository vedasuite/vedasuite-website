"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setShopifySessionCookie = setShopifySessionCookie;
exports.clearShopifySessionCookie = clearShopifySessionCookie;
exports.readShopifySessionCookie = readShopifySessionCookie;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const SHOPIFY_SESSION_COOKIE = "vedasuite_embedded_session";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
function setShopifySessionCookie(res, shop) {
    const token = jsonwebtoken_1.default.sign({ shop }, env_1.env.shopifyApiSecret, {
        algorithm: "HS256",
        audience: env_1.env.shopifyApiKey,
        expiresIn: "7d",
        issuer: "vedasuite",
    });
    res.cookie(SHOPIFY_SESSION_COOKIE, token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: COOKIE_MAX_AGE_MS,
    });
}
function clearShopifySessionCookie(res) {
    res.clearCookie(SHOPIFY_SESSION_COOKIE, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
    });
}
function readShopifySessionCookie(req) {
    const rawCookie = typeof req.cookies?.[SHOPIFY_SESSION_COOKIE] === "string"
        ? req.cookies[SHOPIFY_SESSION_COOKIE]
        : null;
    if (!rawCookie) {
        return null;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(rawCookie, env_1.env.shopifyApiSecret, {
            algorithms: ["HS256"],
            audience: env_1.env.shopifyApiKey,
            issuer: "vedasuite",
        });
        return payload.shop || null;
    }
    catch {
        return null;
    }
}
