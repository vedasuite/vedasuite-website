"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsRouter = void 0;
const express_1 = require("express");
const reportsService_1 = require("../services/reportsService");
exports.reportsRouter = (0, express_1.Router)();
exports.reportsRouter.get("/weekly", async (req, res) => {
    const { shop } = req.query;
    if (!shop || typeof shop !== "string") {
        return res.status(400).json({ error: "Missing shop." });
    }
    const report = await (0, reportsService_1.getWeeklyReport)(shop);
    return res.json({ report });
});
exports.reportsRouter.get("/weekly/export", async (req, res) => {
    const { shop } = req.query;
    if (!shop || typeof shop !== "string") {
        return res.status(400).json({ error: "Missing shop." });
    }
    const report = await (0, reportsService_1.getWeeklyReport)(shop);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="vedasuite-weekly-report-${Date.now()}.json"`);
    return res.json({
        exportedAt: new Date().toISOString(),
        report,
    });
});
