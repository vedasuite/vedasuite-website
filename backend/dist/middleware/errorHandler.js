"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const observabilityService_1 = require("../services/observabilityService");
function isAggregateLikeError(err) {
    return (typeof err === "object" &&
        err !== null &&
        "errors" in err &&
        Array.isArray(err.errors));
}
// Centralized error handler so API responses are consistent.
function errorHandler(err, req, res, _next) {
    const status = 500;
    const message = isAggregateLikeError(err)
        ? err.errors
            .map((inner) => inner instanceof Error && inner.message
            ? inner.message
            : String(inner))
            .filter(Boolean)
            .join(" | ") || "Database connection failed."
        : err instanceof Error && err.message
            ? err.message
            : "Unexpected server error occurred.";
    const requestId = req.requestId;
    (0, observabilityService_1.logEvent)("error", "request.failed", {
        requestId,
        method: req.method,
        path: req.originalUrl,
        error: err,
    });
    res.status(status).json({
        error: {
            message,
            requestId,
        },
    });
}
