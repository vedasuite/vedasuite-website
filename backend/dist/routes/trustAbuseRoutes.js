"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trustAbuseRouter = void 0;
const express_1 = require("express");
const requireFeature_1 = require("../middleware/requireFeature");
const trustAbuseService_1 = require("../services/trustAbuseService");
const routeShop_1 = require("./routeShop");
exports.trustAbuseRouter = (0, express_1.Router)();
exports.trustAbuseRouter.use((0, requireFeature_1.requireFeature)("fraud"));
exports.trustAbuseRouter.get("/overview", async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const overview = await (0, trustAbuseService_1.getTrustAbuseOverview)(shop);
    return res.json({ overview });
});
