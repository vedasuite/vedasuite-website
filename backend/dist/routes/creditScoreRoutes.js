"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.creditScoreRouter = void 0;
const express_1 = require("express");
const creditScoreService_1 = require("../services/creditScoreService");
exports.creditScoreRouter = (0, express_1.Router)();
exports.creditScoreRouter.get("/customers", async (req, res) => {
    const { shop } = req.query;
    if (!shop || typeof shop !== "string") {
        return res.status(400).json({ error: "Missing shop." });
    }
    const customers = await (0, creditScoreService_1.listCustomerScores)(shop);
    return res.json({ customers });
});
exports.creditScoreRouter.get("/customer/:id", async (req, res) => {
    const { shop } = req.query;
    const { id } = req.params;
    if (!shop || typeof shop !== "string") {
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
