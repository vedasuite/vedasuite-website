"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.competitorRouter = void 0;
const express_1 = require("express");
const requireFeature_1 = require("../middleware/requireFeature");
const competitorService_1 = require("../services/competitorService");
const routeShop_1 = require("./routeShop");
exports.competitorRouter = (0, express_1.Router)();
exports.competitorRouter.use((0, requireFeature_1.requireFeature)("competitor"));
exports.competitorRouter.get("/overview", async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const overview = await (0, competitorService_1.getCompetitorOverview)(shop);
    return res.json(overview);
});
exports.competitorRouter.get("/products", async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const products = await (0, competitorService_1.listTrackedCompetitorProducts)(shop);
    return res.json({ products });
});
exports.competitorRouter.get("/connectors", async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const connectors = await (0, competitorService_1.listCompetitorConnectors)(shop);
    return res.json({ connectors });
});
exports.competitorRouter.get("/response-engine", async (req, res) => {
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const responseEngine = await (0, competitorService_1.getCompetitorResponseEngine)(shop);
    return res.json({ responseEngine });
});
exports.competitorRouter.post("/domains", async (req, res) => {
    const body = req.body;
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req) ?? body.shop;
    const domains = body.domains;
    if (!shop || !domains) {
        return res.status(400).json({ error: "Missing shop or domains." });
    }
    const updated = await (0, competitorService_1.updateCompetitorDomains)(shop, domains);
    return res.json({ domains: updated });
});
exports.competitorRouter.post("/ingest", async (req, res) => {
    const body = req.body;
    const shop = (0, routeShop_1.resolveAuthenticatedShop)(req) ?? body.shop;
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const result = await (0, competitorService_1.ingestCompetitorSnapshots)(shop);
    return res.json({ result });
});
