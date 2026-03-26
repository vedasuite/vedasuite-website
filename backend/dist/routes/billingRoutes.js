"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.billingRouter = void 0;
const express_1 = require("express");
const env_1 = require("../config/env");
const prismaClient_1 = require("../db/prismaClient");
const verifyShopifySessionToken_1 = require("../middleware/verifyShopifySessionToken");
const shopifyAdminService_1 = require("../services/shopifyAdminService");
exports.billingRouter = (0, express_1.Router)();
exports.billingRouter.post("/create-recurring", verifyShopifySessionToken_1.verifyShopifySessionToken, async (req, res) => {
    const { shop, host, planName, starterModule } = req.body;
    if (!shop || !planName) {
        return res.status(400).json({ error: "Missing shop or planName" });
    }
    if (planName === "STARTER" && !starterModule) {
        return res
            .status(400)
            .json({ error: "Starter plan requires a starterModule selection." });
    }
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop },
        include: {
            subscription: {
                include: {
                    plan: true,
                },
            },
        },
    });
    if (!store) {
        return res.status(404).json({ error: "Store not found" });
    }
    const plan = (await prismaClient_1.prisma.subscriptionPlan.findFirst({
        where: { name: planName },
    })) ||
        (await prismaClient_1.prisma.subscriptionPlan.create({
            data: {
                name: planName,
                price: planName === "STARTER"
                    ? env_1.env.billing.starterPrice
                    : planName === "GROWTH"
                        ? env_1.env.billing.growthPrice
                        : env_1.env.billing.proPrice,
                trialDays: env_1.env.billing.trialDays,
                features: JSON.stringify({ planName }),
            },
        }));
    const returnUrl = new URL(`${env_1.env.shopifyAppUrl}/billing/activate`);
    returnUrl.searchParams.set("shop", shop);
    returnUrl.searchParams.set("plan", planName);
    if (host) {
        returnUrl.searchParams.set("host", host);
    }
    if (starterModule) {
        returnUrl.searchParams.set("starterModule", starterModule);
    }
    try {
        const billing = await (0, shopifyAdminService_1.createAppSubscription)({
            shopDomain: shop,
            name: `VedaSuite AI - ${planName}`,
            price: plan.price,
            returnUrl: returnUrl.toString(),
            trialDays: plan.trialDays,
            test: process.env.NODE_ENV !== "production",
        });
        return res.json({
            confirmationUrl: billing.confirmationUrl,
            pendingSubscriptionId: billing.appSubscription?.id ?? null,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to create billing charge.";
        if (/reauthorize the app/i.test(message)) {
            const reauthorizeUrl = new URL("/auth/install", env_1.env.shopifyAppUrl);
            reauthorizeUrl.searchParams.set("shop", shop);
            return res.status(401).json({
                error: {
                    message,
                    reauthorizeUrl: reauthorizeUrl.toString(),
                },
            });
        }
        throw error;
    }
});
exports.billingRouter.get("/activate", async (req, res) => {
    const { shop, plan, starterModule, host } = req.query;
    if (!shop || !plan) {
        return res.status(400).send("Missing billing activation parameters.");
    }
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: String(shop) },
    });
    if (!store) {
        return res.status(404).send("Store not found.");
    }
    const planRecord = await prismaClient_1.prisma.subscriptionPlan.findFirst({
        where: { name: String(plan) },
    });
    if (!planRecord) {
        return res.status(404).send("Plan not found.");
    }
    const activeSubscription = await (0, shopifyAdminService_1.getActiveAppSubscription)(String(shop));
    if (!activeSubscription) {
        return res.status(400).send("No active Shopify app subscription found.");
    }
    await prismaClient_1.prisma.storeSubscription.upsert({
        where: { storeId: store.id },
        update: {
            planId: planRecord.id,
            starterModule: typeof starterModule === "string" ? starterModule : null,
            shopifyChargeId: activeSubscription.id,
            active: true,
            endsAt: null,
        },
        create: {
            storeId: store.id,
            planId: planRecord.id,
            starterModule: typeof starterModule === "string" ? starterModule : null,
            shopifyChargeId: activeSubscription.id,
            active: true,
        },
    });
    const redirectUrl = new URL(`${env_1.env.shopifyAppUrl}/subscription`);
    redirectUrl.searchParams.set("shop", String(shop));
    redirectUrl.searchParams.set("billing", "activated");
    redirectUrl.searchParams.set("plan", String(plan));
    if (typeof host === "string" && host) {
        redirectUrl.searchParams.set("host", host);
    }
    if (typeof starterModule === "string" && starterModule) {
        redirectUrl.searchParams.set("starterModule", starterModule);
    }
    const redirectAppUrl = redirectUrl.toString();
    return res.redirect(redirectAppUrl);
});
