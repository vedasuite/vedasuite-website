"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopifyWebhookRouter = void 0;
const crypto_1 = __importDefault(require("crypto"));
const express_1 = require("express");
const env_1 = require("../config/env");
const prismaClient_1 = require("../db/prismaClient");
const observabilityService_1 = require("../services/observabilityService");
const privacyService_1 = require("../services/privacyService");
const subscriptionService_1 = require("../services/subscriptionService");
const shopifyAdminService_1 = require("../services/shopifyAdminService");
exports.shopifyWebhookRouter = (0, express_1.Router)();
function verifyWebhookSignature(rawBody, hmacHeader) {
    if (!hmacHeader || typeof hmacHeader !== "string") {
        return false;
    }
    const digest = crypto_1.default
        .createHmac("sha256", env_1.env.shopifyApiSecret)
        .update(rawBody)
        .digest("base64");
    const provided = Buffer.from(hmacHeader);
    const generated = Buffer.from(digest);
    if (provided.length !== generated.length) {
        return false;
    }
    return crypto_1.default.timingSafeEqual(provided, generated);
}
async function handleSyncWebhook(req, res) {
    const rawBody = req.body;
    const shopDomain = req.headers["x-shopify-shop-domain"];
    const hmacHeader = req.headers["x-shopify-hmac-sha256"];
    if (!Buffer.isBuffer(rawBody) || !verifyWebhookSignature(rawBody, hmacHeader)) {
        return res.status(401).send("Invalid webhook signature");
    }
    if (!shopDomain || typeof shopDomain !== "string") {
        return res.status(400).send("Missing shop domain");
    }
    (0, observabilityService_1.logEvent)("info", "webhook.sync_received", {
        topic: req.path,
        shop: shopDomain,
    });
    await (0, observabilityService_1.withRetry)(() => (0, shopifyAdminService_1.syncShopifyStoreData)(shopDomain), {
        attempts: 3,
        delayMs: 300,
        operationName: "webhook.shopify_sync",
        context: {
            topic: req.path,
            shop: shopDomain,
        },
    });
    return res.status(200).send("ok");
}
async function handleWebhookEnvelope(req, res) {
    const rawBody = req.body;
    const shopDomain = req.headers["x-shopify-shop-domain"];
    const hmacHeader = req.headers["x-shopify-hmac-sha256"];
    if (!Buffer.isBuffer(rawBody) || !verifyWebhookSignature(rawBody, hmacHeader)) {
        return res.status(401).send("Invalid webhook signature");
    }
    if (!shopDomain || typeof shopDomain !== "string") {
        return res.status(400).send("Missing shop domain");
    }
    return {
        rawBody,
        shopDomain,
        payload: JSON.parse(rawBody.toString("utf8")),
    };
}
async function handleAppUninstalled(req, res) {
    const envelope = await handleWebhookEnvelope(req, res);
    if (!envelope || "status" in envelope) {
        return envelope;
    }
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: envelope.shopDomain },
        include: { subscription: true },
    });
    if (!store) {
        return res.status(200).send("ok");
    }
    await prismaClient_1.prisma.$transaction(async (tx) => {
        if (store.subscription) {
            await tx.storeSubscription.delete({
                where: { id: store.subscription.id },
            });
        }
        await tx.fraudSignal.deleteMany({ where: { storeId: store.id } });
        await tx.order.deleteMany({ where: { storeId: store.id } });
        await tx.customer.deleteMany({ where: { storeId: store.id } });
        await tx.competitorData.deleteMany({ where: { storeId: store.id } });
        await tx.competitorDomain.deleteMany({ where: { storeId: store.id } });
        await tx.priceHistory.deleteMany({ where: { storeId: store.id } });
        await tx.profitOptimizationData.deleteMany({ where: { storeId: store.id } });
        await tx.store.delete({ where: { id: store.id } });
    });
    (0, observabilityService_1.logEvent)("info", "webhook.app_uninstalled", {
        shop: envelope.shopDomain,
    });
    return res.status(200).send("ok");
}
async function handleCustomersDataRequest(req, res) {
    const envelope = await handleWebhookEnvelope(req, res);
    if (!envelope || "status" in envelope) {
        return envelope;
    }
    const result = await (0, privacyService_1.exportCustomerDataRequest)(envelope.shopDomain, envelope.payload);
    return res.status(200).json({
        ok: true,
        shop: envelope.shopDomain,
        ...result,
    });
}
async function handleCustomersRedact(req, res) {
    const envelope = await handleWebhookEnvelope(req, res);
    if (!envelope || "status" in envelope) {
        return envelope;
    }
    const result = await (0, privacyService_1.redactCustomerData)(envelope.shopDomain, envelope.payload);
    return res.status(200).json({
        ok: true,
        shop: envelope.shopDomain,
        ...result,
    });
}
async function handleShopRedact(req, res) {
    const envelope = await handleWebhookEnvelope(req, res);
    if (!envelope || "status" in envelope) {
        return envelope;
    }
    const result = await (0, privacyService_1.redactShopData)(envelope.shopDomain);
    return res.status(200).json({
        ok: true,
        ...result,
    });
}
async function handleAppSubscriptionUpdate(req, res) {
    const envelope = await handleWebhookEnvelope(req, res);
    if (!envelope || "status" in envelope) {
        return envelope;
    }
    const payload = envelope.payload;
    await (0, subscriptionService_1.reconcileStoreSubscriptionFromWebhook)({
        shopDomain: envelope.shopDomain,
        shopifyChargeId: payload.admin_graphql_api_id ?? null,
        planName: payload.name ?? null,
        status: payload.status ?? null,
        currentPeriodEnd: payload.current_period_end ?? payload.currentPeriodEnd ?? null,
    });
    (0, observabilityService_1.logEvent)("info", "webhook.app_subscription_updated", {
        shop: envelope.shopDomain,
        status: payload.status ?? null,
        planName: payload.name ?? null,
    });
    return res.status(200).send("ok");
}
exports.shopifyWebhookRouter.post("/orders_create", handleSyncWebhook);
exports.shopifyWebhookRouter.post("/orders_updated", handleSyncWebhook);
exports.shopifyWebhookRouter.post("/customers_create", handleSyncWebhook);
exports.shopifyWebhookRouter.post("/customers_update", handleSyncWebhook);
exports.shopifyWebhookRouter.post("/app_subscriptions_update", handleAppSubscriptionUpdate);
exports.shopifyWebhookRouter.post("/app_uninstalled", handleAppUninstalled);
exports.shopifyWebhookRouter.post("/customers_data_request", handleCustomersDataRequest);
exports.shopifyWebhookRouter.post("/customers_redact", handleCustomersRedact);
exports.shopifyWebhookRouter.post("/shop_redact", handleShopRedact);
