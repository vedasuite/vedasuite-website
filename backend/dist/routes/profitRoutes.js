"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profitRouter = void 0;
const express_1 = require("express");
const requireFeature_1 = require("../middleware/requireFeature");
const profitService_1 = require("../services/profitService");
const routeShop_1 = require("./routeShop");
exports.profitRouter = (0, express_1.Router)();
exports.profitRouter.get("/recommendations", (0, requireFeature_1.requireFeature)("profitOptimization"), async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const recs = await (0, profitService_1.getProfitRecommendations)(shop);
    return res.json({ recommendations: recs });
});
exports.profitRouter.get("/opportunities", (0, requireFeature_1.requireFeature)("profitOptimization"), async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const opportunities = await (0, profitService_1.getProfitOpportunities)(shop);
    return res.json({ opportunities });
});
