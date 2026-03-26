"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const qs_1 = __importDefault(require("qs"));
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const prismaClient_1 = require("../db/prismaClient");
const bootstrapService_1 = require("../services/bootstrapService");
const shopifyAdminService_1 = require("../services/shopifyAdminService");
exports.authRouter = (0, express_1.Router)();
function buildInstallUrl(shop) {
    const params = qs_1.default.stringify({
        client_id: env_1.env.shopifyApiKey,
        scope: env_1.env.shopifyScopes,
        redirect_uri: `${env_1.env.shopifyAppUrl}/auth/callback`,
    });
    return `https://${shop}/admin/oauth/authorize?${params}`;
}
exports.authRouter.get("/install", (req, res) => {
    const { shop } = req.query;
    if (!shop || typeof shop !== "string") {
        return res.status(400).send("Missing shop parameter.");
    }
    const redirectUrl = buildInstallUrl(shop);
    return res.redirect(redirectUrl);
});
exports.authRouter.get("/callback", async (req, res) => {
    const { shop, code, hmac } = req.query;
    if (!shop || !code || !hmac) {
        return res.status(400).send("Missing OAuth parameters.");
    }
    const message = qs_1.default.stringify(Object.fromEntries(Object.entries(req.query).filter(([key]) => key !== "hmac" && key !== "signature")));
    const generatedHmac = crypto_1.default
        .createHmac("sha256", env_1.env.shopifyApiSecret)
        .update(message)
        .digest("hex");
    if (generatedHmac !== hmac) {
        return res.status(400).send("HMAC validation failed.");
    }
    const tokenUrl = `https://${shop}/admin/oauth/access_token`;
    const tokenResponse = await axios_1.default.post(tokenUrl, {
        client_id: env_1.env.shopifyApiKey,
        client_secret: env_1.env.shopifyApiSecret,
        code,
    });
    const accessToken = tokenResponse.data.access_token;
    const shopDomain = String(shop);
    await prismaClient_1.prisma.store.upsert({
        where: { shop: shopDomain },
        create: {
            shop: shopDomain,
            accessToken,
        },
        update: {
            accessToken,
        },
    });
    await (0, bootstrapService_1.ensureStoreBootstrapped)(shopDomain);
    try {
        await (0, shopifyAdminService_1.registerSyncWebhooks)(shopDomain, env_1.env.shopifyAppUrl);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.warn("[auth] Unable to auto-register Shopify sync webhooks.", error);
    }
    // After installation, redirect into the embedded app in Shopify Admin.
    const redirectAppUrl = `${env_1.env.shopifyAppUrl}/?shop=${encodeURIComponent(shopDomain)}`;
    return res.redirect(redirectAppUrl);
});
