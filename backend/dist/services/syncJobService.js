"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runStoreSyncJob = runStoreSyncJob;
exports.startStoreSyncJob = startStoreSyncJob;
exports.getLatestSyncJob = getLatestSyncJob;
const prismaClient_1 = require("../db/prismaClient");
const coreEngineService_1 = require("./coreEngineService");
const observabilityService_1 = require("./observabilityService");
const shopifyAdminService_1 = require("./shopifyAdminService");
const shopifyConnectionService_1 = require("./shopifyConnectionService");
const storeOperationalStateService_1 = require("./storeOperationalStateService");
const ACTIVE_SYNC_STATUSES = ["PENDING", "RUNNING", "SYNC_IN_PROGRESS"];
function buildSyncActivitySummary(params) {
    const competitorRows = params.operational.counts.competitorRows;
    const competitorReason = competitorRows > 0
        ? "Competitor analysis is managed from Competitor Intelligence."
        : "Open Competitor Intelligence to add competitor websites and run analysis.";
    return {
        ordersProcessed: params.syncResult.ordersSynced,
        customersEvaluated: params.recomputeResult.customersRecomputed,
        competitorPagesChecked: 0,
        pricingRecordsAnalyzed: params.recomputeResult.productOutputsUpdated,
        fraudSignalsGenerated: params.recomputeResult.fraudSignalsGenerated ?? 0,
        newInsightsCount: params.recomputeResult.timelineEventsCreated,
        updatedInsightsCount: 0,
        errorsCount: 0,
        noChangeReasons: [
            "no new fraud signals were triggered",
            competitorRows > 0
                ? "competitor analysis is managed separately"
                : "no competitor analysis ran during this update",
            "pricing signals remained stable",
        ],
        moduleProcessing: {
            fraud: {
                processed: true,
                status: (params.recomputeResult.fraudSignalsGenerated ?? 0) > 0
                    ? "updated"
                    : "processed_no_changes",
                reason: (params.recomputeResult.fraudSignalsGenerated ?? 0) > 0
                    ? "Fraud checks ran and generated updated fraud signals."
                    : "Fraud checks ran, but no new fraud signals were triggered.",
            },
            competitor: {
                processed: false,
                status: "not_refreshed",
                reason: competitorReason,
            },
            pricing: {
                processed: true,
                status: params.recomputeResult.productOutputsUpdated > 0
                    ? "updated"
                    : "processed_no_changes",
                reason: params.recomputeResult.productOutputsUpdated > 0
                    ? "Pricing records were analyzed during this sync."
                    : "Pricing insights were reviewed, but no pricing records changed.",
            },
        },
    };
}
function mapDerivedSyncStatusToJobStatus(status) {
    switch (status) {
        case "READY_WITH_DATA":
            return "READY_WITH_DATA";
        case "EMPTY_STORE_DATA":
            return "SUCCEEDED_NO_DATA";
        case "SYNC_COMPLETED_PROCESSING_PENDING":
            return "SUCCEEDED_PROCESSING_PENDING";
        case "FAILED":
            return "FAILED";
        case "SYNC_IN_PROGRESS":
            return "SYNC_IN_PROGRESS";
        case "NOT_CONNECTED":
            return "FAILED";
        case "SYNC_REQUIRED":
        default:
            return "SUCCEEDED_NO_DATA";
    }
}
async function finalizeSyncSuccess(params) {
    const operational = await (0, storeOperationalStateService_1.getStoreOperationalSnapshot)(params.shopDomain);
    const derivedSync = (0, storeOperationalStateService_1.deriveSyncStatus)({
        connectionStatus: operational.store.lastConnectionStatus,
        latestSyncJobStatus: params.syncResult.status,
        lastSyncStatus: operational.store.lastSyncStatus,
        products: operational.counts.products,
        orders: operational.counts.orders,
        customers: operational.counts.customers,
        priceRows: operational.counts.pricingRows,
        profitRows: operational.counts.profitRows,
        timelineEvents: operational.counts.timelineEvents,
    });
    const finalJobStatus = mapDerivedSyncStatusToJobStatus(derivedSync.status);
    const finishedAt = new Date();
    const activitySummary = buildSyncActivitySummary({
        syncResult: params.syncResult,
        recomputeResult: params.recomputeResult,
        operational,
    });
    const completed = await prismaClient_1.prisma.syncJob.update({
        where: { id: params.jobId },
        data: {
            status: finalJobStatus,
            finishedAt,
            summaryJson: JSON.stringify({
                syncResult: {
                    ...params.syncResult,
                    status: finalJobStatus,
                },
                recomputeResult: {
                    ...params.recomputeResult,
                    status: derivedSync.status === "READY_WITH_DATA"
                        ? "SUCCEEDED"
                        : derivedSync.status === "FAILED"
                            ? "FAILED"
                            : "SUCCEEDED_NO_DATA",
                },
                operationalCounts: operational.counts,
                derivedSync,
                activitySummary,
            }),
            errorMessage: derivedSync.status === "FAILED" ? derivedSync.reason : null,
        },
    });
    await prismaClient_1.prisma.store.update({
        where: { id: params.storeId },
        data: {
            lastSyncAt: finishedAt,
            lastSyncStatus: derivedSync.status,
            lastConnectionCheckAt: finishedAt,
            lastConnectionStatus: "OK",
            lastConnectionError: null,
            authErrorCode: null,
            authErrorMessage: null,
        },
    });
    (0, observabilityService_1.logEvent)("info", "sync_job.completed", {
        shop: params.shopDomain,
        triggerSource: params.triggerSource,
        jobId: completed.id,
        syncStatus: params.syncResult.status,
        finalJobStatus,
        derivedStatus: derivedSync.status,
        counts: operational.counts,
    });
    return {
        completed,
        derivedSync,
        operational,
    };
}
async function resolveStore(shopDomain) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
        select: {
            id: true,
            shop: true,
        },
    });
    if (!store) {
        throw new Error("Store not found");
    }
    return store;
}
function mapSyncFailure(error) {
    if (error instanceof shopifyConnectionService_1.ShopifyConnectionError) {
        const reconnectRequired = error.code === "OFFLINE_TOKEN_EXPIRED" ||
            error.code === "REFRESH_TOKEN_EXPIRED" ||
            error.code === "TOKEN_REFRESH_FAILED" ||
            error.code === "SHOPIFY_RECONNECT_REQUIRED" ||
            error.code === "SHOPIFY_AUTH_REQUIRED";
        return {
            code: error.code,
            status: reconnectRequired ? "SHOPIFY_RECONNECT_REQUIRED" : "SYNC_REQUIRED",
            message: error.message,
        };
    }
    const message = error instanceof Error ? error.message : "Shopify sync job failed.";
    const reconnectRequired = /reauthorize|invalid access token|refresh token|offline token expired|reconnect/i.test(message);
    return {
        code: reconnectRequired ? "SHOPIFY_RECONNECT_REQUIRED" : "SYNC_FAILED",
        status: reconnectRequired ? "SHOPIFY_RECONNECT_REQUIRED" : "SYNC_REQUIRED",
        message,
    };
}
async function runStoreSyncJob(shopDomain, triggerSource) {
    const store = await resolveStore(shopDomain);
    const job = await prismaClient_1.prisma.syncJob.create({
        data: {
            storeId: store.id,
            jobType: "shopify_sync",
            triggerSource,
            status: "SYNC_IN_PROGRESS",
            startedAt: new Date(),
        },
    });
    try {
        await prismaClient_1.prisma.store.update({
            where: { id: store.id },
            data: {
                lastSyncStatus: "SYNC_IN_PROGRESS",
            },
        });
        const syncResult = await (0, shopifyAdminService_1.syncShopifyStoreData)(shopDomain);
        const recomputeResult = await (0, coreEngineService_1.recomputeStoreDerivedData)(shopDomain);
        const { completed } = await finalizeSyncSuccess({
            storeId: store.id,
            jobId: job.id,
            shopDomain,
            triggerSource,
            syncResult,
            recomputeResult,
        });
        return {
            jobId: completed.id,
            status: completed.status,
            syncResult,
            recomputeResult,
        };
    }
    catch (error) {
        const failure = mapSyncFailure(error);
        await prismaClient_1.prisma.syncJob.update({
            where: { id: job.id },
            data: {
                status: "FAILED",
                finishedAt: new Date(),
                errorMessage: failure.message,
            },
        });
        await prismaClient_1.prisma.store.update({
            where: { id: store.id },
            data: {
                lastSyncStatus: "FAILED",
                lastConnectionCheckAt: new Date(),
                lastConnectionStatus: failure.status,
                lastConnectionError: failure.message,
                authErrorCode: failure.code,
                authErrorMessage: failure.message,
            },
        });
        (0, observabilityService_1.logEvent)("error", "sync_job.failed", {
            shop: shopDomain,
            triggerSource,
            jobId: job.id,
            code: failure.code,
            message: failure.message,
        });
        throw error;
    }
}
async function startStoreSyncJob(shopDomain, triggerSource) {
    const store = await resolveStore(shopDomain);
    const activeJob = await prismaClient_1.prisma.syncJob.findFirst({
        where: {
            storeId: store.id,
            jobType: "shopify_sync",
            status: {
                in: [...ACTIVE_SYNC_STATUSES],
            },
        },
        orderBy: { createdAt: "desc" },
    });
    if (activeJob) {
        return {
            jobId: activeJob.id,
            status: activeJob.status,
            reusedExisting: true,
        };
    }
    const createdJob = await prismaClient_1.prisma.syncJob.create({
        data: {
            storeId: store.id,
            jobType: "shopify_sync",
            triggerSource,
            status: "PENDING",
        },
    });
    void (async () => {
        try {
            await prismaClient_1.prisma.store.update({
                where: { id: store.id },
                data: {
                    lastSyncStatus: "SYNC_IN_PROGRESS",
                },
            });
            await prismaClient_1.prisma.syncJob.update({
                where: { id: createdJob.id },
                data: {
                    status: "SYNC_IN_PROGRESS",
                    startedAt: new Date(),
                },
            });
            const syncResult = await (0, shopifyAdminService_1.syncShopifyStoreData)(shopDomain);
            const recomputeResult = await (0, coreEngineService_1.recomputeStoreDerivedData)(shopDomain);
            const { completed, derivedSync, operational } = await finalizeSyncSuccess({
                storeId: store.id,
                jobId: createdJob.id,
                shopDomain,
                triggerSource,
                syncResult,
                recomputeResult,
            });
            (0, observabilityService_1.logEvent)("info", "sync_job.completed.background", {
                shop: shopDomain,
                triggerSource,
                jobId: completed.id,
                mode: "background",
                syncStatus: syncResult.status,
                finalJobStatus: completed.status,
                derivedStatus: derivedSync.status,
                counts: operational.counts,
            });
        }
        catch (error) {
            const failure = mapSyncFailure(error);
            await prismaClient_1.prisma.syncJob.update({
                where: { id: createdJob.id },
                data: {
                    status: "FAILED",
                    finishedAt: new Date(),
                    errorMessage: failure.message,
                },
            });
            await prismaClient_1.prisma.store.update({
                where: { id: store.id },
                data: {
                    lastSyncStatus: "FAILED",
                    lastConnectionCheckAt: new Date(),
                    lastConnectionStatus: failure.status,
                    lastConnectionError: failure.message,
                    authErrorCode: failure.code,
                    authErrorMessage: failure.message,
                },
            });
            (0, observabilityService_1.logEvent)("error", "sync_job.failed", {
                shop: shopDomain,
                triggerSource,
                jobId: createdJob.id,
                mode: "background",
                code: failure.code,
                message: failure.message,
            });
        }
    })();
    return {
        jobId: createdJob.id,
        status: "PENDING",
        reusedExisting: false,
    };
}
async function getLatestSyncJob(shopDomain) {
    const store = await resolveStore(shopDomain);
    return prismaClient_1.prisma.syncJob.findFirst({
        where: { storeId: store.id },
        orderBy: { createdAt: "desc" },
    });
}
