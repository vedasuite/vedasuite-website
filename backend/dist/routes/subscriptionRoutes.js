"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionRouter = void 0;
const express_1 = require("express");
const subscriptionService_1 = require("../services/subscriptionService");
exports.subscriptionRouter = (0, express_1.Router)();
exports.subscriptionRouter.get("/plan", async (req, res) => {
    const { shop } = req.query;
    if (!shop || typeof shop !== "string") {
        return res.status(400).json({ error: "Missing shop." });
    }
    const plan = await (0, subscriptionService_1.getCurrentSubscription)(shop);
    return res.json({ subscription: plan });
});
exports.subscriptionRouter.post("/cancel", async (req, res) => {
    const { shop } = req.body;
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const subscription = await (0, subscriptionService_1.cancelSubscription)(shop);
    return res.json({ subscription });
});
exports.subscriptionRouter.post("/downgrade-to-trial", async (req, res) => {
    const { shop } = req.body;
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const result = await (0, subscriptionService_1.downgradeToTrial)(shop);
    return res.json({ result });
});
exports.subscriptionRouter.post("/starter-module", async (req, res) => {
    const { shop, starterModule } = req.body;
    if (!shop || !starterModule) {
        return res.status(400).json({ error: "Missing shop or starter module." });
    }
    const subscription = await (0, subscriptionService_1.updateStarterModuleSelection)(shop, starterModule);
    return res.json({ subscription });
});
