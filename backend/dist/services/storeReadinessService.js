"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoreReadinessState = getStoreReadinessState;
const env_1 = require("../config/env");
const onboardingService_1 = require("./onboardingService");
const storeOperationalStateService_1 = require("./storeOperationalStateService");
const subscriptionService_1 = require("./subscriptionService");
async function getStoreReadinessState(shopDomain) {
    const [subscription, billing, onboarding, operational, entitlements] = await Promise.all([
        (0, subscriptionService_1.getCurrentSubscription)(shopDomain),
        (0, subscriptionService_1.resolveBillingState)(shopDomain),
        (0, onboardingService_1.getOnboardingState)(shopDomain),
        (0, storeOperationalStateService_1.getStoreOperationalSnapshot)(shopDomain),
        (0, subscriptionService_1.resolveEntitlements)(shopDomain),
    ]);
    const hasOrders = operational.counts.orders > 0;
    const hasProducts = operational.counts.products > 0;
    const hasCompetitors = operational.counts.competitorDomains > 0 && operational.counts.competitorRows > 0;
    const hasPricingData = operational.counts.pricingRows > 0;
    const hasProfitData = operational.counts.profitRows > 0;
    const stepsRemaining = onboarding.steps
        .filter((step) => !step.complete)
        .map((step) => step.label);
    return {
        billing: {
            plan: billing.planName,
            isActive: billing.accessActive,
            isTrial: billing.planName === "TRIAL" && billing.accessActive,
            starterModule: entitlements.starterModule,
            enabledModules: {
                fraud: entitlements.enabledModules.includes("fraud"),
                competitor: entitlements.enabledModules.includes("competitor"),
                pricing: entitlements.enabledModules.includes("pricing"),
                profit: entitlements.enabledModules.includes("profit"),
                reports: subscription.enabledModules.reports,
                settings: subscription.enabledModules.settings,
            },
        },
        onboarding: {
            complete: onboarding.canAccessDashboard,
            stepsRemaining,
        },
        data: {
            hasOrders,
            hasProducts,
            hasCompetitors,
            hasPricingData,
            hasProfitData,
        },
        modules: {
            fraudReady: entitlements.enabledModules.includes("fraud") && hasOrders,
            competitorReady: entitlements.enabledModules.includes("competitor") &&
                operational.counts.competitorDomains > 0 &&
                operational.counts.competitorRows > 0,
            pricingReady: entitlements.enabledModules.includes("pricing") && hasPricingData,
            profitReady: entitlements.enabledModules.includes("profit") && hasProfitData,
        },
        guidedMode: env_1.env.enableGuidedSetupData,
    };
}
