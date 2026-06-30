"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const prismaClient_1 = require("../db/prismaClient");
const shopifyOAuthState_1 = require("../lib/shopifyOAuthState");
const shopifySessionCookie_1 = require("../lib/shopifySessionCookie");
const bootstrapService_1 = require("../services/bootstrapService");
const observabilityService_1 = require("../services/observabilityService");
const shopifyAdminService_1 = require("../services/shopifyAdminService");
const shopifyConnectionService_1 = require("../services/shopifyConnectionService");
const syncJobService_1 = require("../services/syncJobService");
exports.authRouter = (0, express_1.Router)();
function redirectTopLevel(res, url) {
    return res
        .status(200)
        .type("html")
        .send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Redirecting...</title>
  </head>
  <body>
    <script>
      (function () {
        var target = ${JSON.stringify(url)};
        if (window.top && window.top !== window) {
          window.top.location.href = target;
          return;
        }
        window.location.href = target;
      })();
    </script>
    <p>Redirecting... <a href="${url}">Continue</a></p>
  </body>
</html>`);
}
function normalizeReturnPath(returnTo) {
    if (!returnTo || typeof returnTo !== "string") {
        return "/";
    }
    if (!returnTo.startsWith("/")) {
        return "/";
    }
    if (returnTo.startsWith("//")) {
        return "/";
    }
    return returnTo;
}
function buildInstallUrl(shop, state) {
    const params = new URLSearchParams({
        client_id: env_1.env.shopifyApiKey,
        scope: env_1.env.shopifyScopes,
        redirect_uri: `${env_1.env.shopifyAppUrl}/auth/callback`,
        state,
    });
    return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}
function buildEmbeddedReturnUrl(options) {
    const returnTo = normalizeReturnPath(options.returnTo);
    const url = new URL(returnTo, env_1.env.shopifyAppUrl);
    url.searchParams.set("shop", options.shop);
    if (options.host) {
        url.searchParams.set("host", options.host);
    }
    url.searchParams.set("embedded", "1");
    return url.toString();
}
function safeEquals(left, right) {
    const provided = Buffer.from(left);
    const expected = Buffer.from(right);
    if (provided.length !== expected.length) {
        return false;
    }
    return crypto_1.default.timingSafeEqual(provided, expected);
}
function validateOAuthHmac(query, hmac) {
    const message = Object.entries(query)
        .filter(([key, value]) => key !== "hmac" && key !== "signature" && value != null)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join(",") : value}`)
        .join("&");
    const digest = crypto_1.default
        .createHmac("sha256", env_1.env.shopifyApiSecret)
        .update(message)
        .digest("hex");
    return safeEquals(digest, hmac);
}
async function exchangeOfflineAccessToken(shop, code) {
    const tokenUrl = `https://${shop}/admin/oauth/access_token`;
    const response = await axios_1.default.post(tokenUrl, {
        client_id: env_1.env.shopifyApiKey,
        client_secret: env_1.env.shopifyApiSecret,
        code,
    });
    return response.data;
}
async function persistInstallationRecord(params) {
    const existingStore = await prismaClient_1.prisma.store.findUnique({
        where: { shop: params.shop },
        select: {
            installedAt: true,
            trialStartedAt: true,
            trialEndsAt: true,
            createdAt: true,
        },
    });
    const trialStartedAt = existingStore?.trialStartedAt ?? params.installedAt;
    const trialEndsAt = existingStore?.trialEndsAt ??
        new Date(params.installedAt.getTime() + env_1.env.billing.trialDays * 24 * 60 * 60 * 1000);
    return prismaClient_1.prisma.store.upsert({
        where: { shop: params.shop },
        create: {
            shop: params.shop,
            accessToken: params.accessToken,
            grantedScopes: params.grantedScopes,
            isOffline: true,
            installedAt: params.installedAt,
            reauthorizedAt: params.reauthorizedAt,
            accessTokenExpiresAt: params.accessTokenExpiresAt,
            refreshToken: params.refreshToken,
            refreshTokenExpiresAt: params.refreshTokenExpiresAt,
            tokenAcquisitionMode: params.tokenAcquisitionMode,
            lastConnectionCheckAt: params.reauthorizedAt,
            lastConnectionStatus: "OK",
            lastConnectionError: null,
            authErrorCode: null,
            authErrorMessage: null,
            lastWebhookRegistrationStatus: "PENDING",
            lastSyncStatus: "PENDING",
            uninstalledAt: null,
            trialStartedAt,
            trialEndsAt,
        },
        update: {
            accessToken: params.accessToken,
            grantedScopes: params.grantedScopes,
            isOffline: true,
            installedAt: existingStore?.installedAt ?? params.installedAt,
            reauthorizedAt: params.reauthorizedAt,
            accessTokenExpiresAt: params.accessTokenExpiresAt,
            refreshToken: params.refreshToken,
            refreshTokenExpiresAt: params.refreshTokenExpiresAt,
            tokenAcquisitionMode: params.tokenAcquisitionMode,
            uninstalledAt: null,
            lastConnectionCheckAt: params.reauthorizedAt,
            lastConnectionStatus: "OK",
            lastConnectionError: null,
            authErrorCode: null,
            authErrorMessage: null,
            lastWebhookRegistrationStatus: "PENDING",
            trialStartedAt,
            trialEndsAt,
        },
    });
}
async function finalizeInstallationHealth(shop, returnUrl) {
    try {
        await (0, shopifyAdminService_1.registerSyncWebhooks)(shop, env_1.env.shopifyAppUrl);
    }
    catch (error) {
        (0, observabilityService_1.logEvent)("warn", "shopify.auth.webhook_registration_failed", {
            shop,
            route: "auth.callback",
            returnUrl,
            error,
        });
    }
    void (0, syncJobService_1.runStoreSyncJob)(shop, "auth_install").catch((error) => {
        (0, observabilityService_1.logEvent)("warn", "shopify.auth.initial_sync_failed", {
            shop,
            route: "auth.callback",
            returnUrl,
            error,
        });
    });
}
function startOAuth(req, res) {
    const normalizedShop = (0, shopifyConnectionService_1.normalizeShopDomain)(typeof req.query.shop === "string" ? req.query.shop : undefined);
    if (!normalizedShop) {
        return res.status(400).send("Missing or invalid shop parameter.");
    }
    const state = (0, shopifyOAuthState_1.createShopifyOAuthState)();
    const host = typeof req.query.host === "string" && req.query.host.trim()
        ? req.query.host
        : null;
    const returnTo = normalizeReturnPath(typeof req.query.returnTo === "string" ? req.query.returnTo : "/");
    (0, shopifyOAuthState_1.setShopifyOAuthStateCookie)(res, {
        shop: normalizedShop,
        state,
        host,
        returnTo,
    });
    (0, observabilityService_1.logEvent)("info", "shopify.auth.start", {
        shop: normalizedShop,
        route: "auth.install",
        host,
        returnTo,
    });
    return redirectTopLevel(res, buildInstallUrl(normalizedShop, state));
}
exports.authRouter.get("/install", (req, res) => startOAuth(req, res));
exports.authRouter.get("/reconnect", (req, res) => startOAuth(req, res));
exports.authRouter.get("/callback", async (req, res) => {
    const shop = (0, shopifyConnectionService_1.normalizeShopDomain)(typeof req.query.shop === "string" ? req.query.shop : undefined);
    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const hmac = typeof req.query.hmac === "string" ? req.query.hmac : undefined;
    const state = typeof req.query.state === "string" ? req.query.state : undefined;
    if (!shop || !code || !hmac || !state) {
        return res.status(400).send("Missing OAuth parameters.");
    }
    if (!validateOAuthHmac(req.query, hmac)) {
        (0, observabilityService_1.logEvent)("warn", "shopify.auth.callback_invalid_hmac", {
            shop,
            route: "auth.callback",
        });
        return res.status(400).send("HMAC validation failed.");
    }
    const statePayload = (0, shopifyOAuthState_1.readShopifyOAuthStateCookie)(req);
    if (!statePayload ||
        statePayload.shop !== shop ||
        statePayload.state !== state) {
        (0, observabilityService_1.logEvent)("warn", "shopify.auth.callback_invalid_state", {
            shop,
            route: "auth.callback",
            cookieShop: statePayload?.shop ?? null,
        });
        return res.status(400).send("OAuth state validation failed.");
    }
    (0, shopifyOAuthState_1.clearShopifyOAuthStateCookie)(res);
    try {
        const tokenData = await exchangeOfflineAccessToken(shop, code);
        const now = new Date();
        const accessTokenExpiresAt = typeof tokenData.expires_in === "number"
            ? new Date(now.getTime() + tokenData.expires_in * 1000)
            : null;
        const refreshTokenExpiresAt = typeof tokenData.refresh_token_expires_in === "number"
            ? new Date(now.getTime() + tokenData.refresh_token_expires_in * 1000)
            : null;
        const tokenAcquisitionMode = tokenData.refresh_token
            ? "offline_expiring"
            : "offline_legacy";
        await persistInstallationRecord({
            shop,
            accessToken: tokenData.access_token,
            grantedScopes: tokenData.scope ?? env_1.env.shopifyScopes,
            installedAt: now,
            reauthorizedAt: now,
            accessTokenExpiresAt,
            refreshToken: tokenData.refresh_token ?? null,
            refreshTokenExpiresAt,
            tokenAcquisitionMode,
        });
        (0, shopifySessionCookie_1.setShopifySessionCookie)(res, shop);
        if (env_1.env.enableGuidedBootstrap) {
            await (0, bootstrapService_1.ensureStoreBootstrapped)(shop);
        }
        const returnUrl = buildEmbeddedReturnUrl({
            shop,
            host: statePayload.host,
            returnTo: statePayload.returnTo,
        });
        await (0, shopifyConnectionService_1.updateConnectionDiagnostics)(shop, {
            lastConnectionStatus: "OK",
            authErrorCode: null,
            authErrorMessage: null,
        });
        await finalizeInstallationHealth(shop, returnUrl);
        (0, observabilityService_1.logEvent)("info", "shopify.auth.callback_completed", {
            shop,
            route: "auth.callback",
            host: statePayload.host ?? null,
            returnTo: statePayload.returnTo ?? "/",
            grantedScopes: tokenData.scope ?? env_1.env.shopifyScopes,
            hasRefreshToken: !!tokenData.refresh_token,
            tokenAcquisitionMode,
            accessTokenExpiresAt: accessTokenExpiresAt?.toISOString() ?? null,
        });
        return redirectTopLevel(res, returnUrl);
    }
    catch (error) {
        await prismaClient_1.prisma.store.upsert({
            where: { shop },
            create: {
                shop,
                isOffline: true,
                installedAt: new Date(),
                authErrorCode: "SHOPIFY_AUTH_REQUIRED",
                authErrorMessage: error instanceof Error ? error.message : "Shopify OAuth exchange failed.",
                lastConnectionStatus: "SHOPIFY_AUTH_REQUIRED",
                lastConnectionError: error instanceof Error ? error.message : "Shopify OAuth exchange failed.",
            },
            update: {
                authErrorCode: "SHOPIFY_AUTH_REQUIRED",
                authErrorMessage: error instanceof Error ? error.message : "Shopify OAuth exchange failed.",
                lastConnectionStatus: "SHOPIFY_AUTH_REQUIRED",
                lastConnectionError: error instanceof Error ? error.message : "Shopify OAuth exchange failed.",
            },
        });
        (0, observabilityService_1.logEvent)("error", "shopify.auth.callback_failed", {
            shop,
            route: "auth.callback",
            error,
        });
        return res.status(500).send("Unable to complete Shopify authorization.");
    }
});
