"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
const express_1 = require("express");
const dashboardService_1 = require("../services/dashboardService");
exports.dashboardRouter = (0, express_1.Router)();
exports.dashboardRouter.get("/metrics", async (req, res) => {
    const { shop } = req.query;
    if (!shop || typeof shop !== "string") {
        return res.status(400).json({ error: "Missing shop query parameter." });
    }
    const metrics = await (0, dashboardService_1.getDashboardMetrics)(shop);
    if (!metrics) {
        return res.status(404).json({ error: "Store not found." });
    }
    return res.json(metrics);
});
