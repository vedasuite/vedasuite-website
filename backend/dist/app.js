"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
require("express-async-errors");
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const errorHandler_1 = require("./middleware/errorHandler");
const requestContext_1 = require("./middleware/requestContext");
const routes_1 = require("./routes");
const shopifyWebhookRoutes_1 = require("./routes/shopifyWebhookRoutes");
const bootstrapService_1 = require("./services/bootstrapService");
const env_1 = require("./config/env");
const shopifySessionCookie_1 = require("./lib/shopifySessionCookie");
const shopifyConnectionService_1 = require("./services/shopifyConnectionService");
const shopifyAdminService_1 = require("./services/shopifyAdminService");
const embeddedAppRoutes = [
    "/",
    "/app",
    "/app/onboarding",
    "/app/dashboard",
    "/app/fraud-intelligence",
    "/app/competitor-intelligence",
    "/app/ai-pricing-engine",
    "/app/billing",
    "/app/settings",
    "/dashboard",
    "/onboarding",
    "/modules/fraud",
    "/modules/competitor",
    "/modules/pricing",
    "/trust-abuse",
    "/competitor",
    "/pricing-profit",
    "/settings",
    "/subscription",
    "/fraud",
    "/pricing",
    "/profit",
    "/credit-score",
];
function createApp() {
    const app = (0, express_1.default)();
    app.set("trust proxy", 1);
    const frontendDistPath = path_1.default.resolve(__dirname, "../../frontend/dist");
    const frontendIndexPath = path_1.default.join(frontendDistPath, "index.html");
    morgan_1.default.token("request-id", (req) => req.requestId ?? "-");
    app.use((0, helmet_1.default)({
        frameguard: false,
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                frameAncestors: [
                    "https://admin.shopify.com",
                    "https://*.myshopify.com",
                ],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.shopify.com"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.shopify.com"],
            },
        },
    }));
    app.use((0, cors_1.default)({
        origin: true,
        credentials: true,
    }));
    app.use(requestContext_1.attachRequestContext);
    app.use((0, morgan_1.default)(":method :url :status :response-time ms req_id=:request-id"));
    app.use("/webhooks/shopify", express_1.default.raw({ type: "application/json" }));
    app.use("/webhooks/shopify", shopifyWebhookRoutes_1.shopifyWebhookRouter);
    app.use(express_1.default.json());
    app.use((0, cookie_parser_1.default)());
    app.get("/health", (_req, res) => {
        res.json({ status: "ok" });
    });
    function redirectTopLevel(res, url) {
        return res
            .status(200)
            .type("html")
            .send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Redirecting…</title>
  </head>
  <body>
    <script>
      (function () {
        var target = ${JSON.stringify(url)};
        if (window.top && window.top !== window) {
          window.top.location.href = target;
          return;
        }
        window.location.href = target;
      })();
    </script>
    <p>Redirecting… <a href="${url}">Continue</a></p>
  </body>
</html>`);
    }
    app.use(express_1.default.static(frontendDistPath, {
        index: false,
    }));
    app.get("/auth", (req, res) => {
        const shop = (0, shopifyConnectionService_1.normalizeShopDomain)(req.query.shop ?? (0, shopifySessionCookie_1.readShopifySessionCookie)(req));
        if (!shop) {
            return res.status(400).send("Missing shop");
        }
        const redirectUrl = new URL("/auth/reconnect", env_1.env.shopifyAppUrl);
        redirectUrl.searchParams.set("shop", shop);
        const host = typeof req.query.host === "string" && req.query.host
            ? req.query.host
            : undefined;
        if (host) {
            redirectUrl.searchParams.set("host", host);
        }
        if (typeof req.query.returnTo === "string" && req.query.returnTo.startsWith("/")) {
            redirectUrl.searchParams.set("returnTo", req.query.returnTo);
        }
        return res.redirect(redirectUrl.toString());
    });
    app.get("/products", async (req, res) => {
        try {
            const shop = (0, shopifyConnectionService_1.normalizeShopDomain)(req.query.shop);
            if (!shop) {
                return res.status(400).send("Missing shop");
            }
            const data = await (0, shopifyAdminService_1.shopifyGraphQL)(shop, `
          query EmbeddedProducts {
            products(first: 20, sortKey: UPDATED_AT, reverse: true) {
              edges {
                node {
                  id
                  handle
                  title
                }
              }
            }
          }
        `);
            return res.status(200).json(data);
        }
        catch (err) {
            return res.status(500).send("Error fetching products");
        }
    });
    app.use(routes_1.router);
    app.get(embeddedAppRoutes, async (req, res, next) => {
        try {
            const shop = (0, shopifyConnectionService_1.normalizeShopDomain)(req.query.shop ?? (0, shopifySessionCookie_1.readShopifySessionCookie)(req));
            if (!shop) {
                return res.sendFile(frontendIndexPath);
            }
            const connectionHealth = await (0, shopifyConnectionService_1.getConnectionHealth)(shop, { probeApi: false });
            if (!connectionHealth.installationFound || !connectionHealth.hasOfflineToken) {
                const reconnectUrl = new URL("/auth", env_1.env.shopifyAppUrl);
                reconnectUrl.searchParams.set("shop", shop);
                reconnectUrl.searchParams.set("returnTo", req.path);
                if (typeof req.query.host === "string" && req.query.host) {
                    reconnectUrl.searchParams.set("host", req.query.host);
                }
                return redirectTopLevel(res, reconnectUrl.toString());
            }
            if (env_1.env.enableGuidedBootstrap) {
                await (0, bootstrapService_1.ensureStoreBootstrapped)(shop);
            }
            (0, shopifySessionCookie_1.setShopifySessionCookie)(res, shop);
            return res.sendFile(frontendIndexPath);
        }
        catch (err) {
            return next(err);
        }
    });
    app.use(errorHandler_1.errorHandler);
    return app;
}
