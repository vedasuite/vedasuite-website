import { Router } from "express";
import { getDashboardMetrics } from "../services/dashboardService";

export const dashboardRouter = Router();

dashboardRouter.get("/metrics", async (req, res) => {
  const { shop } = req.query;
  if (!shop || typeof shop !== "string") {
    return res.status(400).json({ error: "Missing shop query parameter." });
  }

  const metrics = await getDashboardMetrics(shop);
  if (!metrics) {
    return res.status(404).json({ error: "Store not found." });
  }

  return res.json(metrics);
});

