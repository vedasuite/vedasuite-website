"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fraudRouter = void 0;
const express_1 = require("express");
const requireFeature_1 = require("../middleware/requireFeature");
const fraudService_1 = require("../services/fraudService");
const merchantLabels_1 = require("../lib/merchantLabels");
const routeShop_1 = require("./routeShop");
exports.fraudRouter = (0, express_1.Router)();
exports.fraudRouter.use((0, requireFeature_1.requireFeature)("fraud"));
exports.fraudRouter.get("/orders", async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop query parameter." });
    }
    const orders = (await (0, fraudService_1.listRecentFraudOrders)(shop))
        .map((order) => ({
        ...order,
        shopifyOrderId: (0, merchantLabels_1.getMerchantOrderLabelOrNull)(order),
    }))
        .filter((order) => !!order.shopifyOrderId);
    return res.json({ orders });
});
exports.fraudRouter.get("/overview", async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop query parameter." });
    }
    const overview = await (0, fraudService_1.getFraudIntelligenceOverview)(shop);
    return res.json({ overview });
});
exports.fraudRouter.post("/score", async (req, res) => {
    const { orderId, signals } = req.body;
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop || !orderId) {
        return res.status(400).json({ error: "Missing shop or orderId." });
    }
    const result = await (0, fraudService_1.scoreOrderFraud)(shop, orderId, signals);
    return res.json(result);
});
exports.fraudRouter.post("/action", async (req, res) => {
    const { orderId, action } = req.body;
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop || !orderId || !action) {
        return res.status(400).json({ error: "Missing parameters." });
    }
    const order = await (0, fraudService_1.applyFraudAction)(shop, orderId, action);
    return res.json({ order });
});
