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
const store_1 = require("./db/store");
const routes_1 = require("./routes");
const shopifyWebhookRoutes_1 = require("./routes/shopifyWebhookRoutes");
const bootstrapService_1 = require("./services/bootstrapService");
const embeddedAppRoutes = [
    "/",
    "/fraud",
    "/competitor",
    "/pricing",
    "/profit",
    "/credit-score",
    "/reports",
    "/settings",
    "/subscription",
];
function createApp() {
    const app = (0, express_1.default)();
    const frontendDistPath = path_1.default.resolve(__dirname, "../../frontend/dist");
    const frontendIndexPath = path_1.default.join(frontendDistPath, "index.html");
    morgan_1.default.token("request-id", (req) => req.requestId ?? "-");
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                frameAncestors: [
                    "https://admin.shopify.com",
                    "https://*.myshopify.com",
                ],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
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
    app.use(express_1.default.static(frontendDistPath, {
        index: false,
    }));
    app.get("/auth", (req, res) => {
        const shop = req.query.shop;
        if (!shop) {
            return res.status(400).send("Missing shop");
        }
        return res.redirect(`/auth/install?shop=${encodeURIComponent(shop)}`);
    });
    app.get("/products", async (req, res) => {
        try {
            const shop = req.query.shop;
            if (!shop) {
                return res.status(400).send("Missing shop");
            }
            const token = await (0, store_1.getToken)(shop);
            if (!token) {
                return res.status(400).send("No token found");
            }
            const response = await fetch(`https://${shop}/admin/api/2024-01/products.json`, {
                headers: {
                    "X-Shopify-Access-Token": token,
                    "Content-Type": "application/json",
                },
            });
            const data = await response.json();
            return res.status(response.status).json(data);
        }
        catch (err) {
            return res.status(500).send("Error fetching products");
        }
    });
    app.use(routes_1.router);
    app.get(embeddedAppRoutes, async (req, res, next) => {
        try {
            const shop = req.query.shop;
            if (!shop) {
                return res.status(400).send("Missing shop");
            }
            const token = await (0, store_1.getToken)(shop);
            if (!token) {
                return res.redirect(`/auth?shop=${encodeURIComponent(shop)}`);
            }
            await (0, bootstrapService_1.ensureStoreBootstrapped)(shop);
            return res.sendFile(frontendIndexPath);
        }
        catch (err) {
            return next(err);
        }
    });
    app.use(errorHandler_1.errorHandler);
    return app;
}
