"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRouter = void 0;
const express_1 = require("express");
const settingsService_1 = require("../services/settingsService");
exports.settingsRouter = (0, express_1.Router)();
exports.settingsRouter.get("/", async (req, res) => {
    const { shop } = req.query;
    if (!shop || typeof shop !== "string") {
        return res.status(400).json({ error: "Missing shop." });
    }
    const settings = await (0, settingsService_1.getSettings)(shop);
    return res.json({ settings });
});
exports.settingsRouter.post("/", async (req, res) => {
    const { shop, settings } = req.body;
    if (!shop || !settings) {
        return res.status(400).json({ error: "Missing shop or settings." });
    }
    const updated = await (0, settingsService_1.updateSettings)(shop, settings);
    return res.json({ settings: updated });
});
