"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachRequestContext = attachRequestContext;
const crypto_1 = __importDefault(require("crypto"));
function attachRequestContext(req, res, next) {
    const requestId = req.headers["x-request-id"]?.toString() || crypto_1.default.randomUUID();
    req.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);
    next();
}
