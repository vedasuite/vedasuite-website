"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatMerchantOrderLabel = formatMerchantOrderLabel;
exports.getMerchantOrderLabelOrNull = getMerchantOrderLabelOrNull;
exports.isInternalOrderLabel = isInternalOrderLabel;
exports.maskMerchantCustomerLabel = maskMerchantCustomerLabel;
exports.formatMerchantInsightTitle = formatMerchantInsightTitle;
exports.formatMerchantInsightDetail = formatMerchantInsightDetail;
const UNKNOWN_ORDER_LABEL = "Waiting for Shopify order data";
const LEGACY_UNKNOWN_ORDER_LABEL = "Order pending sync";
function cleanOrderToken(value) {
    if (value == null) {
        return null;
    }
    const token = String(value).trim();
    if (!token) {
        return null;
    }
    return token.replace(/^#/, "");
}
function formatMerchantOrderLabel(order) {
    const label = getMerchantOrderLabelOrNull(order);
    return label ?? UNKNOWN_ORDER_LABEL;
}
function getMerchantOrderLabelOrNull(order) {
    if (!order) {
        return null;
    }
    if (order.orderName?.trim()) {
        return order.orderName.trim();
    }
    const orderToken = cleanOrderToken(order.orderNumber) ?? cleanOrderToken(order.shopifyLegacyOrderId);
    if (orderToken) {
        return `#${orderToken}`;
    }
    return null;
}
function isInternalOrderLabel(value) {
    if (!value) {
        return false;
    }
    return (value === UNKNOWN_ORDER_LABEL ||
        value === LEGACY_UNKNOWN_ORDER_LABEL ||
        /\.myshopify\.com-order-\d+$/i.test(value) ||
        value.startsWith("gid://shopify/") ||
        /^order-[a-z0-9]+$/i.test(value));
}
function maskMerchantCustomerLabel(value) {
    if (!value) {
        return "Customer profile";
    }
    const trimmed = value.trim();
    if (!trimmed) {
        return "Customer profile";
    }
    if (!trimmed.includes("@")) {
        return "Customer profile";
    }
    const [name] = trimmed.split("@");
    const visible = name.slice(0, 2);
    return `${visible || "cu"}***`;
}
function formatMerchantInsightTitle(input) {
    if (input.category === "pricing" || input.category === "profit") {
        return "Pricing insight updated";
    }
    if (input.category === "competitor") {
        return "Competitor analysis is ready";
    }
    if (input.eventType === "refund_requested") {
        return input.orderLabel
            ? `Refund review needs attention on ${input.orderLabel}`
            : "Refund review needs attention";
    }
    if (input.category === "orders") {
        return input.orderLabel
            ? `Order review updated for ${input.orderLabel}`
            : "Order review updated";
    }
    if (input.category === "abuse") {
        return "Refund review needs attention";
    }
    if (input.category === "trust") {
        return "Customer profile updated";
    }
    if (input.severity === "critical") {
        return "Store review needs attention";
    }
    return "Store insight updated";
}
function formatMerchantInsightDetail(input) {
    if (input.eventType === "refund_requested") {
        return input.orderLabel
            ? `${input.orderLabel} is waiting for refund review. Open Fraud Intelligence to review the supporting signals.`
            : "A recent order is waiting for refund review. Open Fraud Intelligence to review the supporting signals.";
    }
    if (input.category === "trust") {
        return "Customer trust signals were updated from recent Shopify activity.";
    }
    if (input.category === "abuse") {
        return "Refund and return behavior signals were updated from recent Shopify activity.";
    }
    return input.detail;
}
