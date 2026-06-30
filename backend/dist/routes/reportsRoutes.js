"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsRouter = void 0;
const express_1 = require("express");
const requireFeature_1 = require("../middleware/requireFeature");
const reportsService_1 = require("../services/reportsService");
const routeShop_1 = require("./routeShop");
exports.reportsRouter = (0, express_1.Router)();
exports.reportsRouter.get("/weekly", (0, requireFeature_1.requireFeature)("reports"), async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const report = await (0, reportsService_1.getWeeklyReport)(shop);
    return res.json({ report });
});
exports.reportsRouter.get("/weekly/export", (0, requireFeature_1.requireFeature)("reports"), async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
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
