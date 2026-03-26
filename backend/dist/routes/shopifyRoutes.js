"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopifyRouter = void 0;
const express_1 = require("express");
const env_1 = require("../config/env");
const shopifyAdminService_1 = require("../services/shopifyAdminService");
exports.shopifyRouter = (0, express_1.Router)();
exports.shopifyRouter.post("/sync", async (req, res) => {
    const { shop } = req.body;
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const result = await (0, shopifyAdminService_1.syncShopifyStoreData)(shop);
    return res.json({ result });
});
exports.shopifyRouter.post("/register-webhooks", async (req, res) => {
    const { shop } = req.body;
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const result = await (0, shopifyAdminService_1.registerSyncWebhooks)(shop, env_1.env.shopifyAppUrl);
    return res.json({ result });
});
exports.shopifyRouter.get("/webhook-status", async (req, res) => {
    const { shop } = req.query;
    if (!shop || typeof shop !== "string") {
        return res.status(400).json({ error: "Missing shop." });
    }
    const result = await (0, shopifyAdminService_1.getSyncWebhookStatus)(shop, env_1.env.shopifyAppUrl);
    return res.json({ result });
});
