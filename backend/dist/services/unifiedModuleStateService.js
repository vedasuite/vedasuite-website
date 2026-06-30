"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STALE_DATA_THRESHOLD_HOURS = void 0;
exports.toIsoString = toIsoString;
exports.isStaleTimestamp = isStaleTimestamp;
exports.createUnifiedModuleState = createUnifiedModuleState;
exports.deriveDashboardQuickAccessState = deriveDashboardQuickAccessState;
exports.STALE_DATA_THRESHOLD_HOURS = 24;
function toIsoString(value) {
    if (!value)
        return null;
    if (typeof value === "string")
        return value;
    return value.toISOString();
}
function isStaleTimestamp(value, thresholdHours = exports.STALE_DATA_THRESHOLD_HOURS) {
    if (!value)
        return false;
    const time = new Date(value).getTime();
    if (Number.isNaN(time))
        return false;
    return Date.now() - time > thresholdHours * 60 * 60 * 1000;
}
function createUnifiedModuleState(args) {
    return {
        setupStatus: args.setupStatus,
        syncStatus: args.syncStatus,
        dataStatus: args.dataStatus,
        lastSuccessfulSyncAt: args.lastSuccessfulSyncAt ?? null,
        lastAttemptAt: args.lastAttemptAt ?? null,
        dataChanged: args.dataChanged ?? false,
        coverage: args.coverage,
        dependencies: {
            competitor: args.dependencies?.competitor ?? "missing",
            pricing: args.dependencies?.pricing ?? "missing",
            fraud: args.dependencies?.fraud ?? "missing",
        },
        title: args.title,
        description: args.description,
        nextAction: args.nextAction ?? null,
    };
}
function deriveDashboardQuickAccessState(moduleState) {
    if (moduleState.setupStatus === "incomplete") {
        return {
            status: "Needs setup",
            freshnessAt: moduleState.lastSuccessfulSyncAt,
            reason: moduleState.description,
        };
    }
    if (moduleState.syncStatus === "running" ||
        moduleState.dataStatus === "processing") {
        return {
            status: "Refreshing",
            freshnessAt: moduleState.lastSuccessfulSyncAt,
            reason: moduleState.description,
        };
    }
    if (moduleState.syncStatus === "failed" ||
        moduleState.dataStatus === "failed") {
        return {
            status: "Error",
            freshnessAt: moduleState.lastSuccessfulSyncAt,
            reason: moduleState.description,
        };
    }
    if (moduleState.dataStatus === "stale") {
        return {
            status: "Stale",
            freshnessAt: moduleState.lastSuccessfulSyncAt,
            reason: moduleState.description,
        };
    }
    if (moduleState.dataStatus === "partial") {
        return {
            status: "Partial",
            freshnessAt: moduleState.lastSuccessfulSyncAt,
            reason: moduleState.description,
        };
    }
    return {
        status: "Ready",
        freshnessAt: moduleState.lastSuccessfulSyncAt,
        reason: moduleState.description,
    };
}
