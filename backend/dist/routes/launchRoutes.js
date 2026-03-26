"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchRouter = void 0;
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../config/env");
exports.launchRouter = (0, express_1.Router)();
function routeUrl(route) {
    return new URL(route, env_1.env.shopifyAppUrl).toString();
}
exports.launchRouter.get("/launch/audit", (_req, res) => {
    const checks = [
        {
            key: "shopify_app_url",
            ok: Boolean(env_1.env.shopifyAppUrl),
            detail: env_1.env.shopifyAppUrl || "Missing SHOPIFY_APP_URL",
        },
        {
            key: "billing_scope",
            ok: env_1.env.shopifyScopes.includes("write_own_subscription"),
            detail: env_1.env.shopifyScopes,
        },
        {
            key: "customer_scope",
            ok: env_1.env.shopifyScopes.includes("read_customers"),
            detail: env_1.env.shopifyScopes,
        },
        {
            key: "privacy_url",
            ok: Boolean(env_1.env.publicContact.privacyUrl),
            detail: env_1.env.publicContact.privacyUrl,
        },
        {
            key: "terms_url",
            ok: Boolean(env_1.env.publicContact.termsUrl),
            detail: env_1.env.publicContact.termsUrl,
        },
        {
            key: "support_url",
            ok: Boolean(env_1.env.publicContact.supportUrl),
            detail: env_1.env.publicContact.supportUrl,
        },
        {
            key: "compliance_export_dir",
            ok: Boolean(env_1.env.complianceExportDir),
            detail: path_1.default.resolve(process.cwd(), env_1.env.complianceExportDir),
        },
        {
            key: "shopify_app_toml",
            ok: fs_1.default.existsSync(path_1.default.resolve(process.cwd(), "shopify.app.toml")),
            detail: path_1.default.resolve(process.cwd(), "shopify.app.toml"),
        },
    ];
    res.json({
        app: "VedaSuite AI",
        generatedAt: new Date().toISOString(),
        readinessScore: {
            productBuild: 80,
            shopifyIntegration: 89,
            appReviewReadiness: 87,
            repoSideCompletion: 97,
        },
        publicRoutes: {
            privacy: routeUrl("/legal/privacy"),
            terms: routeUrl("/legal/terms"),
            support: routeUrl("/support"),
            readiness: routeUrl("/launch/readiness"),
            audit: routeUrl("/launch/audit"),
        },
        checks,
        externalActions: [
            "Complete protected customer data declarations in Shopify Partner Dashboard",
            "Upload app icon, screenshots, and review/demo video",
            "Run final production-app QA against the linked Shopify app",
        ],
    });
});
