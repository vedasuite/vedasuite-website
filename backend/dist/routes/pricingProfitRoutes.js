"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pricingProfitRouter = void 0;
const express_1 = require("express");
const requireFeature_1 = require("../middleware/requireFeature");
const pricingProfitService_1 = require("../services/pricingProfitService");
const observabilityService_1 = require("../services/observabilityService");
const routeShop_1 = require("./routeShop");
exports.pricingProfitRouter = (0, express_1.Router)();
exports.pricingProfitRouter.use((0, requireFeature_1.requireFeature)("pricing"));
exports.pricingProfitRouter.get("/overview", async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    try {
        (0, observabilityService_1.logEvent)("info", "pricing_profit.route_request_started", {
            shop,
            route: req.originalUrl,
        });
        const overview = await Promise.race([
            (0, pricingProfitService_1.getPricingProfitOverview)(shop),
            new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Pricing overview timed out.")), 12000);
            }),
        ]);
        (0, observabilityService_1.logEvent)("info", "pricing_profit.route_request_succeeded", {
            shop,
            route: req.originalUrl,
            viewStatus: overview.viewState?.status ?? null,
        });
        return res.json({ overview });
    }
    catch (error) {
        const message = error instanceof Error
            ? error.message
            : "Pricing overview could not be loaded.";
        const timedOut = /timed out/i.test(message);
        (0, observabilityService_1.logEvent)("error", "pricing_profit.route_request_failed", {
            shop,
            route: req.originalUrl,
            timedOut,
            error,
        });
        return res.status(timedOut ? 504 : 503).json({
            error: {
                code: timedOut ? "PRICING_TIMEOUT" : "PRICING_OVERVIEW_FAILED",
                message,
            },
        });
    }
});
