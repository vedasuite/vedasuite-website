"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pricingRouter = void 0;
const express_1 = require("express");
const requireFeature_1 = require("../middleware/requireFeature");
const pricingService_1 = require("../services/pricingService");
const routeShop_1 = require("./routeShop");
exports.pricingRouter = (0, express_1.Router)();
exports.pricingRouter.get("/recommendations", (0, requireFeature_1.requireFeature)("pricing"), async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const recs = await (0, pricingService_1.getPricingRecommendations)(shop);
    return res.json({ recommendations: recs });
});
exports.pricingRouter.post("/simulate", (0, requireFeature_1.requireFeature)("pricing"), async (req, res) => {
    const { currentPrice, recommendedPrice, salesVelocity, margin } = req.body;
    const result = await (0, pricingService_1.simulatePricingChange)({
        currentPrice,
        recommendedPrice,
        salesVelocity,
        margin,
    });
    return res.json(result);
});
exports.pricingRouter.post("/recommendations/:id/approve", (0, requireFeature_1.requireFeature)("pricing"), async (req, res) => {
    const { id } = req.params;
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop || !id) {
        return res.status(400).json({ error: "Missing shop or recommendation id." });
    }
    const recommendation = await (0, pricingService_1.approvePricingRecommendation)(shop, id);
    return res.json({ recommendation });
});
