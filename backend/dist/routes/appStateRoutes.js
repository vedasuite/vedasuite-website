"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appStateRouter = void 0;
const express_1 = require("express");
const appStateService_1 = require("../services/appStateService");
const observabilityService_1 = require("../services/observabilityService");
const routeShop_1 = require("./routeShop");
exports.appStateRouter = (0, express_1.Router)();
exports.appStateRouter.get("/", async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    const sessionShop = req.shopifySession
        ?.shop;
    (0, observabilityService_1.logEvent)("info", "app_state.route_request_started", {
        shop,
        hasSessionShop: !!sessionShop,
        hasQueryShop: typeof req.query.shop === "string",
    });
    if (!shop) {
        (0, observabilityService_1.logEvent)("warn", "app_state.route_missing_shop", {
            hasSessionShop: !!sessionShop,
            hasQueryShop: typeof req.query.shop === "string",
        });
        return res.status(400).json({
            error: {
                code: "MISSING_SHOP_CONTEXT",
                message: "VedaSuite could not determine which Shopify store is loading. Open the app from Shopify Admin and try again.",
            },
        });
    }
    try {
        (0, observabilityService_1.logEvent)("info", "app_state.installation_fetch_started", { shop });
        const appState = await (0, appStateService_1.getMerchantAppState)(shop);
        if (!appState?.install?.status) {
            (0, observabilityService_1.logEvent)("error", "app_state.installation_fetch_invalid", {
                shop,
                hasInstall: !!appState?.install,
            });
            return res.status(503).json({
                error: {
                    code: "APP_STATE_UNAVAILABLE",
                    message: "VedaSuite could not load the store setup status. Refresh the app and try again.",
                },
            });
        }
        (0, observabilityService_1.logEvent)("info", "app_state.route_request_succeeded", {
            shop,
            installStatus: appState.install.status,
            connectionStatus: appState.connection.status,
            appStatus: appState.appStatus,
        });
        return res.json({ appState });
    }
    catch (error) {
        (0, observabilityService_1.logEvent)("error", "app_state.route_request_failed", {
            shop,
            error,
        });
        return res.status(503).json({
            error: {
                code: "APP_STATE_FETCH_FAILED",
                message: "VedaSuite could not load the latest store setup details. Please refresh and try again.",
            },
        });
    }
});
