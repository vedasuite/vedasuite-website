"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRouter = void 0;
const express_1 = require("express");
const requireCapability_1 = require("../middleware/requireCapability");
const settingsService_1 = require("../services/settingsService");
const routeShop_1 = require("./routeShop");
exports.settingsRouter = (0, express_1.Router)();
exports.settingsRouter.get("/", (0, requireCapability_1.requireCapability)("settings.view"), async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const settings = await (0, settingsService_1.getSettings)(shop);
    return res.json({ settings });
});
exports.settingsRouter.post("/", (0, requireCapability_1.requireCapability)("settings.manage"), async (req, res) => {
    const { settings } = req.body;
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop || !settings) {
        return res.status(400).json({ error: "Missing shop or settings." });
    }
    const updated = await (0, settingsService_1.updateSettings)(shop, settings);
    return res.json({ settings: updated });
});
