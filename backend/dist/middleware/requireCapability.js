"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireCapability = requireCapability;
const subscriptionService_1 = require("../services/subscriptionService");
const routeShop_1 = require("../routes/routeShop");
function requireCapability(capability) {
    return async (req, res, next) => {
        const shop = (0, routeShop_1.resolveAuthenticatedShop)(req);
        const sessionShop = req
            .shopifySession?.shop;
        if (!sessionShop) {
            return res.status(401).json({
                error: {
                    message: "Missing Shopify session context. Reload the embedded app and try again.",
                },
            });
        }
        if (!shop) {
            return res.status(400).json({ error: "Missing shop." });
        }
        if (shop !== sessionShop) {
            return res.status(403).json({
                error: {
                    message: "Shop parameter does not match the authenticated Shopify session.",
                },
            });
        }
        const subscription = await (0, subscriptionService_1.getCurrentSubscription)(shop);
        if (!subscription.capabilities[capability]) {
            return res.status(403).json({
                error: {
                    code: "CAPABILITY_REQUIRED",
                    message: `Your current plan does not include ${capability}.`,
                    requiredCapability: capability,
                    currentPlan: subscription.planName,
                },
            });
        }
        return next();
    };
}
