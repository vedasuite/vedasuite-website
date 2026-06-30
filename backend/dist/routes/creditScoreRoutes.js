"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.creditScoreRouter = void 0;
const express_1 = require("express");
const requireFeature_1 = require("../middleware/requireFeature");
const creditScoreService_1 = require("../services/creditScoreService");
const routeShop_1 = require("./routeShop");
exports.creditScoreRouter = (0, express_1.Router)();
exports.creditScoreRouter.use((0, requireFeature_1.requireFeature)("creditScore"));
exports.creditScoreRouter.get("/customers", async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const customers = await (0, creditScoreService_1.listCustomerScores)(shop);
    return res.json({ customers });
});
exports.creditScoreRouter.get("/operating-layer", async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const operatingLayer = await (0, creditScoreService_1.getTrustOperatingLayer)(shop);
    return res.json({ operatingLayer });
});
exports.creditScoreRouter.get("/customer/:id", async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    const { id } = req.params;
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const customer = await (0, creditScoreService_1.getCustomerScore)(shop, id);
    return res.json({ customer });
});
exports.creditScoreRouter.post("/customer/:id/recompute", async (req, res) => {
    const { id } = req.params;
    const updated = await (0, creditScoreService_1.recomputeCustomerScore)(id);
    return res.json({ customer: updated });
});
