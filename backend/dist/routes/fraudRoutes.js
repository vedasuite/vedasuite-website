"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fraudRouter = void 0;
const express_1 = require("express");
const fraudService_1 = require("../services/fraudService");
exports.fraudRouter = (0, express_1.Router)();
exports.fraudRouter.get("/orders", async (req, res) => {
    const { shop } = req.query;
    if (!shop || typeof shop !== "string") {
        return res.status(400).json({ error: "Missing shop query parameter." });
    }
    const orders = await (0, fraudService_1.listRecentFraudOrders)(shop);
    return res.json({ orders });
});
exports.fraudRouter.post("/score", async (req, res) => {
    const { shop, orderId, signals } = req.body;
    if (!shop || !orderId) {
        return res.status(400).json({ error: "Missing shop or orderId." });
    }
    const result = await (0, fraudService_1.scoreOrderFraud)(shop, orderId, signals);
    return res.json(result);
});
exports.fraudRouter.post("/action", async (req, res) => {
    const { shop, orderId, action } = req.body;
    if (!shop || !orderId || !action) {
        return res.status(400).json({ error: "Missing parameters." });
    }
    const order = await (0, fraudService_1.applyFraudAction)(shop, orderId, action);
    return res.json({ order });
});
