"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
const express_1 = require("express");
const decisionCenterService_1 = require("../services/decisionCenterService");
const dashboardService_1 = require("../services/dashboardService");
const onboardingService_1 = require("../services/onboardingService");
const routeShop_1 = require("./routeShop");
exports.dashboardRouter = (0, express_1.Router)();
exports.dashboardRouter.get("/metrics", async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop query parameter." });
    }
    const metrics = await (0, dashboardService_1.getDashboardMetrics)(shop);
    if (!metrics) {
        return res.status(404).json({ error: "Store not found." });
    }
    return res.json(metrics);
});
exports.dashboardRouter.get("/decision-center", async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop query parameter." });
    }
    const decisionCenter = await (0, decisionCenterService_1.getUnifiedDecisionCenter)(shop);
    return res.json(decisionCenter);
});
exports.dashboardRouter.get("/onboarding", async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop query parameter." });
    }
    const onboarding = await (0, onboardingService_1.getOnboardingState)(shop);
    return res.json({ onboarding });
});
exports.dashboardRouter.post("/onboarding/select-module", async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop query parameter." });
    }
    const body = req.body;
    const onboarding = await (0, onboardingService_1.selectOnboardingModule)({
        shopDomain: shop,
        moduleKey: body.moduleKey ?? "",
    });
    return res.json({ onboarding });
});
exports.dashboardRouter.post("/onboarding/view-insight", async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop query parameter." });
    }
    const body = req.body;
    const onboarding = await (0, onboardingService_1.markOnboardingInsightViewed)({
        shopDomain: shop,
        moduleKey: body.moduleKey ?? null,
    });
    return res.json({ onboarding });
});
exports.dashboardRouter.post("/onboarding/confirm-plan", async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop query parameter." });
    }
    const onboarding = await (0, onboardingService_1.confirmOnboardingPlan)(shop);
    return res.json({ onboarding });
});
exports.dashboardRouter.post("/onboarding/complete", async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop query parameter." });
    }
    const onboarding = await (0, onboardingService_1.markOnboardingComplete)(shop);
    return res.json({ onboarding });
});
exports.dashboardRouter.post("/onboarding/dismiss", async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop query parameter." });
    }
    const onboarding = await (0, onboardingService_1.dismissOnboarding)(shop);
    return res.json({ onboarding });
});
