"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profitRouter = void 0;
const express_1 = require("express");
const profitService_1 = require("../services/profitService");
exports.profitRouter = (0, express_1.Router)();
exports.profitRouter.get("/recommendations", async (req, res) => {
    const { shop } = req.query;
    if (!shop || typeof shop !== "string") {
        return res.status(400).json({ error: "Missing shop." });
    }
    const recs = await (0, profitService_1.getProfitRecommendations)(shop);
    return res.json({ recommendations: recs });
});
exports.profitRouter.get("/opportunities", async (req, res) => {
    const { shop } = req.query;
    if (!shop || typeof shop !== "string") {
        return res.status(400).json({ error: "Missing shop." });
    }
    const opportunities = await (0, profitService_1.getProfitOpportunities)(shop);
    return res.json({ opportunities });
});
