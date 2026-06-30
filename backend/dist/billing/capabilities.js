"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TRIAL_DAYS = exports.STARTER_MODULE_SWITCH_COOLDOWN_HOURS = exports.CAPABILITIES = exports.BILLING_PLANS = void 0;
exports.normalizeStarterModule = normalizeStarterModule;
exports.normalizePlanName = normalizePlanName;
exports.getPlanPrice = getPlanPrice;
exports.buildCapabilities = buildCapabilities;
exports.buildModuleAccessFromCapabilities = buildModuleAccessFromCapabilities;
exports.resolveEntitlements = resolveEntitlements;
exports.buildFeatureAccessFromCapabilities = buildFeatureAccessFromCapabilities;
exports.normalizeStarterModuleLabel = normalizeStarterModuleLabel;
exports.BILLING_PLANS = ["NONE", "TRIAL", "STARTER", "GROWTH", "PRO"];
exports.CAPABILITIES = [
    "module.trustAbuse",
    "module.competitorIntel",
    "module.pricingProfit",
    "reports.view",
    "reports.export",
    "settings.view",
    "settings.manage",
    "trust.score",
    "trust.timeline",
    "trust.returnAbuse",
    "trust.refundOutcomeSimulator",
    "trust.smartPolicyEngine",
    "trust.trustRecoveryEngine",
    "trust.supportCopilot",
    "trust.evidencePackExport",
    "trust.advancedAutomation",
    "competitor.moveFeed",
    "competitor.impactScore",
    "competitor.actionSuggestions",
    "competitor.strategyDetection",
    "competitor.weeklyReports",
    "competitor.advancedReports",
    "pricing.basicRecommendations",
    "pricing.explainableRecommendations",
    "pricing.advancedModes",
    "pricing.doNothingRecommendation",
    "pricing.profitLeakDetector",
    "pricing.dailyActionBoard",
    "pricing.scenarioSimulator",
    "pricing.marginAtRisk",
    "pricing.advancedAutomation",
    "billing.moduleSelectionStarter",
    "billing.planManagement",
    "billing.upgrade",
    "billing.downgrade",
    "billing.trialActive",
];
exports.STARTER_MODULE_SWITCH_COOLDOWN_HOURS = 24;
exports.DEFAULT_TRIAL_DAYS = 3;
const PLAN_PRICE_MAP = {
    NONE: 0,
    TRIAL: 0,
    STARTER: 19,
    GROWTH: 49,
    PRO: 99,
};
function normalizeStarterModule(value) {
    if (value === "fraud" || value === "competitor") {
        return value;
    }
    if (value === "trust" || value === "trustAbuse" || value === "fraudIntelligence" || value === "creditScore") {
        return "fraud";
    }
    if (value === "competitorIntelligence" || value === "competitor_monitoring") {
        return "competitor";
    }
    return null;
}
function normalizePlanName(value) {
    const normalized = value?.replace(/^VedaSuite AI - /i, "").trim().toUpperCase();
    if (!normalized) {
        return null;
    }
    if (exports.BILLING_PLANS.includes(normalized)) {
        return normalized;
    }
    return null;
}
function getPlanPrice(planName) {
    return PLAN_PRICE_MAP[planName];
}
function emptyCapabilities() {
    return Object.fromEntries(exports.CAPABILITIES.map((capability) => [capability, false]));
}
function buildCapabilities(planName, starterModule, options) {
    const capabilities = emptyCapabilities();
    const normalizedStarterModule = normalizeStarterModule(starterModule);
    const isTrial = planName === "TRIAL";
    const isGrowth = planName === "GROWTH";
    const isPro = planName === "PRO";
    const isStarterTrust = planName === "STARTER" && normalizedStarterModule === "fraud";
    const isStarterCompetitor = planName === "STARTER" && normalizedStarterModule === "competitor";
    const trialLimitedOnly = isTrial && (options?.trialActive ?? true);
    const fraudModule = isStarterTrust || isGrowth || isPro;
    const competitorModule = isStarterCompetitor || isGrowth || isPro;
    const pricingModule = isGrowth || isPro;
    const creditScoreModule = isGrowth || isPro;
    const reportsModule = isGrowth || isPro;
    const profitModule = isPro;
    capabilities["reports.view"] = reportsModule;
    capabilities["settings.view"] = true;
    capabilities["settings.manage"] = true;
    capabilities["billing.planManagement"] = true;
    capabilities["billing.upgrade"] = true;
    capabilities["billing.downgrade"] = planName !== "NONE";
    capabilities["billing.moduleSelectionStarter"] = planName === "STARTER";
    capabilities["billing.trialActive"] = trialLimitedOnly;
    capabilities["module.trustAbuse"] = fraudModule;
    capabilities["module.competitorIntel"] = competitorModule;
    capabilities["module.pricingProfit"] = pricingModule;
    capabilities["trust.score"] = creditScoreModule;
    capabilities["trust.timeline"] = fraudModule;
    capabilities["trust.returnAbuse"] = fraudModule;
    capabilities["trust.refundOutcomeSimulator"] = profitModule;
    capabilities["trust.smartPolicyEngine"] = fraudModule;
    capabilities["trust.trustRecoveryEngine"] = profitModule;
    capabilities["trust.supportCopilot"] = profitModule;
    capabilities["trust.evidencePackExport"] = fraudModule;
    capabilities["trust.advancedAutomation"] = profitModule;
    capabilities["competitor.moveFeed"] = competitorModule;
    capabilities["competitor.impactScore"] = competitorModule;
    capabilities["competitor.actionSuggestions"] = competitorModule;
    capabilities["competitor.strategyDetection"] = isGrowth || isPro;
    capabilities["competitor.weeklyReports"] = reportsModule && competitorModule;
    capabilities["competitor.advancedReports"] = isPro;
    capabilities["pricing.basicRecommendations"] = pricingModule;
    capabilities["pricing.explainableRecommendations"] = pricingModule;
    capabilities["pricing.advancedModes"] = profitModule;
    capabilities["pricing.doNothingRecommendation"] = pricingModule;
    capabilities["pricing.profitLeakDetector"] = profitModule;
    capabilities["pricing.dailyActionBoard"] = profitModule;
    capabilities["pricing.scenarioSimulator"] = profitModule;
    capabilities["pricing.marginAtRisk"] = profitModule;
    capabilities["pricing.advancedAutomation"] = profitModule;
    capabilities["reports.export"] = reportsModule;
    return capabilities;
}
function buildModuleAccessFromCapabilities(capabilities) {
    const trustAbuse = capabilities["module.trustAbuse"];
    const competitor = capabilities["module.competitorIntel"];
    const pricingProfit = capabilities["module.pricingProfit"];
    const profitOptimization = pricingProfit &&
        (capabilities["pricing.profitLeakDetector"] ||
            capabilities["pricing.dailyActionBoard"] ||
            capabilities["pricing.marginAtRisk"]);
    return {
        fraud: trustAbuse,
        competitor,
        pricing: pricingProfit,
        profit: profitOptimization,
        trustAbuse,
        pricingProfit,
        reports: capabilities["reports.view"],
        settings: capabilities["settings.view"],
        creditScore: trustAbuse,
        profitOptimization,
    };
}
function resolveEntitlements(input) {
    const normalizedStarterModule = normalizeStarterModule(input.starterModule);
    const capabilities = buildCapabilities(input.plan, normalizedStarterModule);
    const moduleAccess = buildModuleAccessFromCapabilities(capabilities);
    const featureAccess = buildFeatureAccessFromCapabilities(capabilities);
    const enabledModules = ["fraud", "competitor", "pricing", "profit"].filter((moduleKey) => moduleAccess[moduleKey]);
    const lockedModules = ["fraud", "competitor", "pricing", "profit"].filter((moduleKey) => !moduleAccess[moduleKey]);
    return {
        plan: input.plan,
        billingStatus: input.billingStatus,
        starterModule: input.plan === "STARTER" ? normalizedStarterModule : null,
        enabledModules,
        lockedModules,
        moduleAccess,
        featureAccess,
        capabilities,
    };
}
function buildFeatureAccessFromCapabilities(capabilities) {
    return {
        shopperTrustScore: capabilities["trust.score"],
        returnAbuseIntelligence: capabilities["trust.returnAbuse"],
        fraudReviewQueue: capabilities["module.trustAbuse"],
        supportCopilot: capabilities["trust.supportCopilot"],
        evidencePackExport: capabilities["trust.evidencePackExport"],
        competitorMoveFeed: capabilities["competitor.moveFeed"],
        competitorStrategyDetection: capabilities["competitor.strategyDetection"],
        weeklyCompetitorReports: capabilities["competitor.weeklyReports"],
        pricingRecommendations: capabilities["pricing.basicRecommendations"],
        explainableRecommendations: capabilities["pricing.explainableRecommendations"],
        scenarioSimulator: capabilities["pricing.scenarioSimulator"],
        profitLeakDetector: capabilities["pricing.profitLeakDetector"],
        marginAtRisk: capabilities["pricing.marginAtRisk"],
        dailyActionBoard: capabilities["pricing.dailyActionBoard"],
        advancedAutomation: capabilities["trust.advancedAutomation"] ||
            capabilities["pricing.advancedAutomation"],
        fullProfitEngine: capabilities["pricing.profitLeakDetector"] &&
            capabilities["pricing.dailyActionBoard"] &&
            capabilities["pricing.marginAtRisk"] &&
            capabilities["pricing.scenarioSimulator"],
    };
}
function normalizeStarterModuleLabel(moduleKey) {
    if (moduleKey === "fraud") {
        return "Fraud Intelligence";
    }
    if (moduleKey === "competitor") {
        return "Competitor Intelligence";
    }
    return null;
}
