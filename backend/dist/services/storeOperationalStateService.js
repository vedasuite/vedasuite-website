"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODULE_PROCESSING_STATES = exports.STORE_SYNC_STATUSES = void 0;
exports.getStoreOperationalSnapshot = getStoreOperationalSnapshot;
exports.deriveSyncStatus = deriveSyncStatus;
exports.deriveModuleReadiness = deriveModuleReadiness;
const prismaClient_1 = require("../db/prismaClient");
exports.STORE_SYNC_STATUSES = [
    "NOT_CONNECTED",
    "SYNC_REQUIRED",
    "SYNC_IN_PROGRESS",
    "SYNC_COMPLETED_PROCESSING_PENDING",
    "READY_WITH_DATA",
    "EMPTY_STORE_DATA",
    "FAILED",
];
exports.MODULE_PROCESSING_STATES = [
    "NOT_STARTED",
    "QUEUED",
    "RUNNING",
    "SUCCEEDED",
    "FAILED",
    "SUCCEEDED_NO_DATA",
];
async function getStoreOperationalSnapshot(shopDomain) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
        select: {
            id: true,
            shop: true,
            onboardingSelectedModule: true,
            lastSyncAt: true,
            lastSyncStatus: true,
            lastConnectionStatus: true,
            lastConnectionError: true,
            syncJobs: {
                orderBy: { createdAt: "desc" },
                take: 8,
            },
            productSnapshots: {
                select: { id: true, syncedAt: true },
            },
            orders: {
                select: { id: true, createdAt: true },
            },
            customers: {
                select: { id: true, updatedAt: true },
            },
            priceHistory: {
                select: { id: true, createdAt: true },
                orderBy: { createdAt: "desc" },
                take: 50,
            },
            profitData: {
                select: { id: true, createdAt: true },
                orderBy: { createdAt: "desc" },
                take: 50,
            },
            timelineEvents: {
                select: { id: true, createdAt: true },
                orderBy: { createdAt: "desc" },
                take: 50,
            },
            competitorDomains: {
                select: { id: true },
            },
            competitorData: {
                select: { id: true, collectedAt: true },
                orderBy: { collectedAt: "desc" },
                take: 100,
            },
        },
    });
    if (!store) {
        throw new Error("Store not found");
    }
    const latestSyncJob = store.syncJobs.find((job) => job.jobType === "shopify_sync") ?? null;
    const latestCompetitorIngestJob = store.syncJobs.find((job) => job.jobType === "competitor_ingest") ?? null;
    return {
        store,
        counts: {
            products: store.productSnapshots.length,
            orders: store.orders.length,
            customers: store.customers.length,
            pricingRows: store.priceHistory.length,
            profitRows: store.profitData.length,
            timelineEvents: store.timelineEvents.length,
            competitorDomains: store.competitorDomains.length,
            competitorRows: store.competitorData.length,
        },
        latestSyncJob,
        latestCompetitorIngestJob,
        latestCompetitorAt: store.competitorData[0]?.collectedAt ?? null,
        latestProcessingAt: store.timelineEvents[0]?.createdAt ??
            store.profitData[0]?.createdAt ??
            store.priceHistory[0]?.createdAt ??
            null,
    };
}
function deriveSyncStatus(input) {
    const latestStatus = input.latestSyncJobStatus ?? input.lastSyncStatus ?? "SYNC_REQUIRED";
    if (input.connectionStatus &&
        ["SHOPIFY_AUTH_REQUIRED", "SHOPIFY_RECONNECT_REQUIRED", "MISSING_ACCESS_TOKEN"].includes(input.connectionStatus)) {
        return {
            status: "NOT_CONNECTED",
            reason: "Shopify connection needs repair before sync can run.",
        };
    }
    if (latestStatus === "PENDING" ||
        latestStatus === "RUNNING" ||
        latestStatus === "SYNC_IN_PROGRESS") {
        return {
            status: "SYNC_IN_PROGRESS",
            reason: "Shopify sync is currently running.",
        };
    }
    if (latestStatus === "FAILED") {
        return {
            status: "FAILED",
            reason: "The most recent Shopify sync failed.",
        };
    }
    if (latestStatus === "SUCCEEDED_PROCESSING_PENDING") {
        return {
            status: "SYNC_COMPLETED_PROCESSING_PENDING",
            reason: "Store activity is being analyzed. Insights will appear automatically.",
        };
    }
    if (latestStatus === "SUCCEEDED_READY_WITH_DATA" ||
        latestStatus === "READY_WITH_DATA") {
        return {
            status: "READY_WITH_DATA",
            reason: "Your store is connected and insights are ready.",
        };
    }
    const rawResourceCount = input.products + input.orders + input.customers;
    const processedResourceCount = input.priceRows + input.profitRows + input.timelineEvents;
    if (latestStatus === "SUCCEEDED_NO_DATA" || rawResourceCount === 0) {
        return {
            status: "EMPTY_STORE_DATA",
            reason: latestStatus === "SUCCEEDED_NO_DATA"
                ? "More Shopify product, order, or customer activity is needed before insights appear."
                : "More Shopify activity is needed before insights appear.",
        };
    }
    if ((latestStatus === "SUCCEEDED" ||
        latestStatus === "SUCCEEDED_PROCESSING_PENDING") &&
        processedResourceCount === 0) {
        return {
            status: "SYNC_COMPLETED_PROCESSING_PENDING",
            reason: "Store activity is being analyzed. Insights will appear automatically.",
        };
    }
    if (rawResourceCount > 0 && processedResourceCount > 0) {
        return {
            status: "READY_WITH_DATA",
            reason: "Your store is connected and insights are ready.",
        };
    }
    return {
        status: "SYNC_REQUIRED",
        reason: "Update store insights to begin analysis.",
    };
}
function deriveModuleReadiness(input) {
    if (input.syncStatus === "FAILED") {
        return {
            rawDataState: input.rawCount > 0 ? "PRESENT" : "MISSING",
            processingState: "FAILED",
            readinessState: "FAILED",
            lastUpdatedAt: input.lastUpdatedAt?.toISOString() ?? null,
            failureReason: input.failureReason ?? "The latest analysis needs attention.",
            reason: input.failureReason ?? "The latest analysis needs attention.",
        };
    }
    if (input.syncStatus === "NOT_CONNECTED") {
        return {
            rawDataState: "MISSING",
            processingState: "NOT_STARTED",
            readinessState: "NOT_CONNECTED",
            lastUpdatedAt: null,
            failureReason: input.failureReason ?? null,
            reason: "Reconnect Shopify before opening this workflow.",
        };
    }
    if (input.syncStatus === "SYNC_REQUIRED") {
        return {
            rawDataState: "MISSING",
            processingState: "NOT_STARTED",
            readinessState: "SYNC_REQUIRED",
            lastUpdatedAt: null,
            failureReason: null,
            reason: "Update store insights to prepare this workflow.",
        };
    }
    if (input.syncStatus === "SYNC_IN_PROGRESS") {
        return {
            rawDataState: input.rawCount > 0 ? "PRESENT" : "MISSING",
            processingState: "RUNNING",
            readinessState: "SYNC_IN_PROGRESS",
            lastUpdatedAt: input.lastUpdatedAt?.toISOString() ?? null,
            failureReason: null,
            reason: "Store activity is being analyzed.",
        };
    }
    if (input.syncStatus === "EMPTY_STORE_DATA") {
        return {
            rawDataState: "EMPTY_STORE",
            processingState: "SUCCEEDED_NO_DATA",
            readinessState: "EMPTY_STORE_DATA",
            lastUpdatedAt: input.lastUpdatedAt?.toISOString() ?? null,
            failureReason: null,
            reason: "More store activity is needed before insights appear.",
        };
    }
    if (input.processedCount === 0) {
        return {
            rawDataState: input.rawCount > 0 ? "PRESENT" : "MISSING",
            processingState: "SUCCEEDED_NO_DATA",
            readinessState: "SYNC_COMPLETED_PROCESSING_PENDING",
            lastUpdatedAt: input.lastUpdatedAt?.toISOString() ?? null,
            failureReason: null,
            reason: "More store activity is needed before this workflow has enough insight.",
        };
    }
    return {
        rawDataState: input.rawCount > 0 ? "PRESENT" : "MISSING",
        processingState: "SUCCEEDED",
        readinessState: "READY_WITH_DATA",
        lastUpdatedAt: input.lastUpdatedAt?.toISOString() ?? null,
        failureReason: null,
        reason: "Insights are ready from available store activity.",
    };
}
