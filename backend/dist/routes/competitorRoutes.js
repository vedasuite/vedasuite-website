"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.competitorRouter = void 0;
const express_1 = require("express");
const competitorService_1 = require("../services/competitorService");
exports.competitorRouter = (0, express_1.Router)();
exports.competitorRouter.get("/overview", async (req, res) => {
    const { shop } = req.query;
    if (!shop || typeof shop !== "string") {
        return res.status(400).json({ error: "Missing shop." });
    }
    const overview = await (0, competitorService_1.getCompetitorOverview)(shop);
    return res.json(overview);
});
exports.competitorRouter.get("/products", async (req, res) => {
    const { shop } = req.query;
    if (!shop || typeof shop !== "string") {
        return res.status(400).json({ error: "Missing shop." });
    }
    const products = await (0, competitorService_1.listTrackedCompetitorProducts)(shop);
    return res.json({ products });
});
exports.competitorRouter.get("/connectors", async (req, res) => {
    const { shop } = req.query;
    if (!shop || typeof shop !== "string") {
        return res.status(400).json({ error: "Missing shop." });
    }
    const connectors = await (0, competitorService_1.listCompetitorConnectors)(shop);
    return res.json({ connectors });
});
exports.competitorRouter.post("/domains", async (req, res) => {
    const { shop, domains } = req.body;
    if (!shop || !domains) {
        return res.status(400).json({ error: "Missing shop or domains." });
    }
    const updated = await (0, competitorService_1.updateCompetitorDomains)(shop, domains);
    return res.json({ domains: updated });
});
exports.competitorRouter.post("/ingest", async (req, res) => {
    const { shop } = req.body;
    if (!shop) {
        return res.status(400).json({ error: "Missing shop." });
    }
    const result = await (0, competitorService_1.ingestCompetitorSnapshots)(shop);
    return res.json({ result });
});
