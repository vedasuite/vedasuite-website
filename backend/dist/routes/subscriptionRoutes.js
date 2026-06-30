"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionDebugRouter = exports.subscriptionRouter = void 0;
const express_1 = require("express");
const requireCapability_1 = require("../middleware/requireCapability");
const subscriptionService_1 = require("../services/subscriptionService");
const billingManagementService_1 = require("../services/billingManagementService");
const routeShop_1 = require("./routeShop");
exports.subscriptionRouter = (0, express_1.Router)();
exports.subscriptionDebugRouter = (0, express_1.Router)();
exports.subscriptionRouter.get("/plan", (0, requireCapability_1.requireCapability)("billing.planManagement"), async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const plan = await (0, subscriptionService_1.getCurrentSubscription)(shop);
    const billingState = await (0, subscriptionService_1.resolveBillingState)(shop);
    const entitlements = (0, subscriptionService_1.buildCanonicalEntitlements)({
        planName: billingState.planName,
        starterModule: billingState.starterModule,
        accessActive: billingState.accessActive,
        verified: billingState.verified,
        trialActive: billingState.planName === "TRIAL" && billingState.accessActive,
    });
    const billing = await (0, billingManagementService_1.getBillingManagementState)(shop).catch(() => null);
    return res.json({ subscription: plan, billingState, entitlements, billing });
});
exports.subscriptionRouter.post("/cancel", (0, requireCapability_1.requireCapability)("billing.downgrade"), async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const subscription = await (0, subscriptionService_1.cancelSubscription)(shop);
    return res.json({ subscription });
});
exports.subscriptionRouter.post("/downgrade-to-trial", (0, requireCapability_1.requireCapability)("billing.downgrade"), async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const result = await (0, subscriptionService_1.downgradeToTrial)(shop);
    return res.json({ result });
});
exports.subscriptionRouter.post("/starter-module", (0, requireCapability_1.requireCapability)("billing.moduleSelectionStarter"), async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    return res.status(409).json({
        error: {
            code: "STARTER_MODULE_REQUIRES_BILLING_APPROVAL",
            message: "Changing the Starter feature now requires Shopify billing approval. Refresh billing and confirm the change there.",
        },
    });
});
exports.subscriptionDebugRouter.get("/entitlements", (0, requireCapability_1.requireCapability)("billing.planManagement"), async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const billingState = await (0, subscriptionService_1.resolveBillingState)(shop);
    const entitlements = await (0, subscriptionService_1.resolveEntitlements)(shop);
    return res.json({
        shop,
        dbPlan: billingState.dbPlanName,
        dbStarterModule: billingState.starterModule,
        normalizedStarterModule: entitlements.starterModule,
        enabledModules: entitlements.enabledModules,
        lockedModules: entitlements.lockedModules,
    });
});
