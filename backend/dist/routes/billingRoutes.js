"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.billingApiRouter = exports.billingRouter = void 0;
const express_1 = require("express");
const capabilities_1 = require("../billing/capabilities");
const env_1 = require("../config/env");
const verifyShopifySessionToken_1 = require("../middleware/verifyShopifySessionToken");
const billingManagementService_1 = require("../services/billingManagementService");
const subscriptionService_1 = require("../services/subscriptionService");
const routeShop_1 = require("./routeShop");
exports.billingRouter = (0, express_1.Router)();
exports.billingApiRouter = (0, express_1.Router)();
function buildSubscriptionReturnUrl(params) {
    const redirectUrl = new URL("/app/billing", env_1.env.shopifyAppUrl);
    redirectUrl.searchParams.set("shop", params.shop);
    redirectUrl.searchParams.set("billingResult", params.billingResult);
    if (params.host) {
        redirectUrl.searchParams.set("host", params.host);
    }
    if (params.intentId) {
        redirectUrl.searchParams.set("intentId", params.intentId);
    }
    if (params.plan) {
        redirectUrl.searchParams.set("plan", params.plan);
    }
    if (params.starterModule) {
        redirectUrl.searchParams.set("starterModule", params.starterModule);
    }
    if (params.message) {
        redirectUrl.searchParams.set("billingMessage", params.message);
    }
    return redirectUrl.toString();
}
function parseRequestedPlan(value) {
    const plan = (0, capabilities_1.normalizePlanName)(value);
    if (!plan || plan === "NONE" || plan === "TRIAL") {
        return null;
    }
    return plan;
}
function parseStarterModule(value) {
    return (0, capabilities_1.normalizeStarterModule)(value);
}
exports.billingApiRouter.get("/state", async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const billing = await (0, billingManagementService_1.getBillingManagementState)(shop);
    return res.json({ billing });
});
exports.billingApiRouter.post("/change-plan", async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    const body = req.body;
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const plan = parseRequestedPlan(body.plan);
    if (!plan) {
        return res.status(400).json({ error: "Unsupported billing plan." });
    }
    try {
        const result = await (0, billingManagementService_1.requestBillingPlanChange)({
            shopDomain: shop,
            requestedPlan: plan,
            starterModule: parseStarterModule(body.starterModule),
            host: body.host ?? null,
            returnPath: body.returnPath ?? "/app/billing",
        });
        return res.json({ result });
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Unable to change billing plan.",
        });
    }
});
exports.billingApiRouter.post("/cancel-plan", async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    const body = req.body;
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    if (!body.confirm) {
        return res.status(400).json({
            error: "Cancellation requires explicit confirmation.",
        });
    }
    try {
        const result = await (0, billingManagementService_1.cancelBillingPlan)(shop);
        return res.json({ result });
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error
                ? error.message
                : "Unable to cancel the current subscription.",
        });
    }
});
exports.billingApiRouter.post("/confirm-return", async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    const body = req.body;
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    try {
        const result = await (0, billingManagementService_1.confirmBillingApprovalReturn)({
            shopDomain: shop,
            intentId: body.intentId ?? null,
        });
        const entitlements = (0, subscriptionService_1.buildCanonicalEntitlements)({
            planName: result.billing.planName,
            starterModule: result.billing.starterModule,
            accessActive: result.billing.accessActive,
            verified: result.billing.verified,
            trialActive: result.billing.planName === "TRIAL" && result.billing.accessActive,
        });
        return res.json({
            result,
            subscription: result.subscription,
            billingState: result.billing,
            entitlements,
        });
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error
                ? error.message
                : "Unable to confirm the Shopify billing return.",
        });
    }
});
exports.billingRouter.post("/create-recurring", verifyShopifySessionToken_1.verifyShopifySessionToken, async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    const body = req.body;
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const plan = parseRequestedPlan(body.planName);
    if (!plan) {
        return res.status(400).json({ error: "Unsupported billing plan." });
    }
    try {
        const result = await (0, billingManagementService_1.requestBillingPlanChange)({
            shopDomain: shop,
            requestedPlan: plan,
            starterModule: parseStarterModule(body.starterModule),
            host: body.host ?? null,
            returnPath: body.returnPath ?? "/app/billing",
        });
        if (result.outcome !== "REDIRECT_REQUIRED") {
            return res.json({ result });
        }
        return res.json({
            confirmationUrl: result.confirmationUrl,
            pendingIntent: result.pendingIntent,
        });
    }
    catch (error) {
        const message = error instanceof Error
            ? error.message
            : "Unable to create billing charge.";
        return res.status(400).json({ error: { message } });
    }
});
exports.billingRouter.get("/start", async (req, res) => {
    const { shop, host, planName, starterModule, returnPath } = req.query;
    if (!shop || !planName) {
        return res.status(400).send("Missing shop or planName.");
    }
    const normalizedPlan = parseRequestedPlan(planName);
    if (!normalizedPlan) {
        return res.status(400).send("Unsupported billing plan.");
    }
    try {
        const result = await (0, billingManagementService_1.requestBillingPlanChange)({
            shopDomain: shop,
            requestedPlan: normalizedPlan,
            starterModule: parseStarterModule(starterModule),
            host: host ?? null,
            returnPath: returnPath ?? "/app/billing",
        });
        if (result.outcome === "REDIRECT_REQUIRED") {
            return res.redirect(result.confirmationUrl);
        }
        return res.redirect(buildSubscriptionReturnUrl({
            shop,
            host: host ?? null,
            billingResult: result.outcome === "UPDATED" ? "confirmed" : "noop",
            plan: result.state.subscription.planName,
            starterModule: result.state.subscription.starterModule,
            message: result.message,
        }));
    }
    catch (error) {
        return res.redirect(buildSubscriptionReturnUrl({
            shop,
            host: host ?? null,
            billingResult: "failed",
            plan: normalizedPlan,
            starterModule: parseStarterModule(starterModule),
            message: error instanceof Error
                ? error.message
                : "Unable to start Shopify billing approval.",
        }));
    }
});
exports.billingRouter.get("/activate", async (req, res) => {
    const { shop, host, intentId } = req.query;
    if (!shop) {
        return res.status(400).send("Missing billing activation parameters.");
    }
    try {
        const result = await (0, billingManagementService_1.confirmBillingApprovalReturn)({
            shopDomain: shop,
            intentId: intentId ?? null,
        });
        return res.redirect(buildSubscriptionReturnUrl({
            shop,
            host: host ?? null,
            billingResult: "confirmed",
            intentId: intentId ?? null,
            plan: result.subscription.planName,
            starterModule: result.subscription.starterModule,
        }));
    }
    catch (error) {
        return res.redirect(buildSubscriptionReturnUrl({
            shop,
            host: host ?? null,
            billingResult: "failed",
            intentId: intentId ?? null,
            message: error instanceof Error
                ? error.message
                : "Unable to confirm Shopify billing activation.",
        }));
    }
});
