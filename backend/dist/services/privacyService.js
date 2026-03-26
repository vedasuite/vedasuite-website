"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportCustomerDataRequest = exportCustomerDataRequest;
exports.redactCustomerData = redactCustomerData;
exports.redactShopData = redactShopData;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../config/env");
const prismaClient_1 = require("../db/prismaClient");
const observabilityService_1 = require("./observabilityService");
function runtimeExportPath(filename) {
    return path_1.default.resolve(process.cwd(), env_1.env.complianceExportDir, filename);
}
function normalizeCustomerId(value) {
    if (typeof value === "number") {
        return String(value);
    }
    if (typeof value === "string" && value.trim()) {
        return value.trim();
    }
    return null;
}
function redactEmail(email) {
    if (!email) {
        return null;
    }
    return `redacted+${Date.now()}@vedasuite.local`;
}
async function getStore(shopDomain) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
    });
    if (!store) {
        throw new Error("Store not found");
    }
    return store;
}
async function exportCustomerDataRequest(shopDomain, payload) {
    const store = await getStore(shopDomain);
    const customerId = normalizeCustomerId(payload.customer?.id ?? payload.customer_id ?? payload.customerId);
    const customerEmail = typeof payload.customer?.email === "string" ? payload.customer.email : null;
    const customer = customerId
        ? await prismaClient_1.prisma.customer.findFirst({
            where: {
                storeId: store.id,
                OR: [
                    { shopifyCustomerId: customerId },
                    ...(customerEmail ? [{ email: customerEmail }] : []),
                ],
            },
            include: {
                orders: true,
                fraudSignals: true,
            },
        })
        : customerEmail
            ? await prismaClient_1.prisma.customer.findFirst({
                where: {
                    storeId: store.id,
                    email: customerEmail,
                },
                include: {
                    orders: true,
                    fraudSignals: true,
                },
            })
            : null;
    const exportPayload = {
        requestedAt: new Date().toISOString(),
        shop: shopDomain,
        shopifyRequest: payload,
        customer: customer
            ? {
                shopifyCustomerId: customer.shopifyCustomerId,
                email: customer.email,
                creditScore: customer.creditScore,
                creditCategory: customer.creditCategory,
                totalOrders: customer.totalOrders,
                totalRefunds: customer.totalRefunds,
            }
            : null,
        orders: customer?.orders.map((order) => ({
            shopifyOrderId: order.shopifyOrderId,
            totalAmount: order.totalAmount,
            currency: order.currency,
            status: order.status,
            refunded: order.refunded,
            refundRequested: order.refundRequested,
            createdAt: order.createdAt,
        })) ?? [],
        fraudSignals: customer?.fraudSignals.map((signal) => ({
            riskScore: signal.riskScore,
            riskLevel: signal.riskLevel,
            createdAt: signal.createdAt,
        })) ?? [],
    };
    const filename = `customer-data-request-${shopDomain.replace(/\.myshopify\.com$/i, "")}-${Date.now()}.json`;
    const outputPath = runtimeExportPath(filename);
    await promises_1.default.mkdir(path_1.default.dirname(outputPath), { recursive: true });
    await promises_1.default.writeFile(outputPath, JSON.stringify(exportPayload, null, 2), "utf8");
    (0, observabilityService_1.logEvent)("info", "privacy.customer_data_request_exported", {
        shop: shopDomain,
        outputPath,
        customerFound: !!customer,
    });
    return {
        outputPath,
        customerFound: !!customer,
        orderCount: exportPayload.orders.length,
        fraudSignalCount: exportPayload.fraudSignals.length,
    };
}
async function redactCustomerData(shopDomain, payload) {
    const store = await getStore(shopDomain);
    const customerId = normalizeCustomerId(payload.customer?.id ?? payload.customer_id ?? payload.customerId);
    if (!customerId) {
        (0, observabilityService_1.logEvent)("warn", "privacy.customer_redact_missing_customer_id", {
            shop: shopDomain,
            payload,
        });
        return {
            redacted: false,
            reason: "Missing customer id in webhook payload.",
        };
    }
    const customer = await prismaClient_1.prisma.customer.findFirst({
        where: {
            storeId: store.id,
            shopifyCustomerId: customerId,
        },
        include: {
            orders: true,
            fraudSignals: true,
        },
    });
    if (!customer) {
        return {
            redacted: false,
            reason: "Customer not found in app data.",
        };
    }
    await prismaClient_1.prisma.$transaction(async (tx) => {
        await tx.fraudSignal.updateMany({
            where: {
                customerId: customer.id,
            },
            data: {
                customerId: null,
                email: null,
                shippingAddress: null,
                ipAddress: null,
                deviceFingerprint: null,
                paymentFingerprint: null,
            },
        });
        await tx.order.updateMany({
            where: {
                customerId: customer.id,
            },
            data: {
                customerId: null,
            },
        });
        await tx.customer.update({
            where: { id: customer.id },
            data: {
                email: redactEmail(customer.email),
                totalOrders: 0,
                totalRefunds: 0,
                refundRate: 0,
                fraudSignalsCount: 0,
                paymentReliability: 0,
                creditScore: 0,
                creditCategory: "Redacted",
            },
        });
    });
    (0, observabilityService_1.logEvent)("info", "privacy.customer_redacted", {
        shop: shopDomain,
        customerId,
    });
    return {
        redacted: true,
        customerId,
    };
}
async function redactShopData(shopDomain) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
        include: { subscription: true },
    });
    if (!store) {
        return {
            redacted: false,
            reason: "Store not found.",
        };
    }
    await prismaClient_1.prisma.$transaction(async (tx) => {
        if (store.subscription) {
            await tx.storeSubscription.delete({
                where: { id: store.subscription.id },
            });
        }
        await tx.fraudSignal.deleteMany({ where: { storeId: store.id } });
        await tx.order.deleteMany({ where: { storeId: store.id } });
        await tx.customer.deleteMany({ where: { storeId: store.id } });
        await tx.competitorData.deleteMany({ where: { storeId: store.id } });
        await tx.competitorDomain.deleteMany({ where: { storeId: store.id } });
        await tx.priceHistory.deleteMany({ where: { storeId: store.id } });
        await tx.profitOptimizationData.deleteMany({ where: { storeId: store.id } });
        await tx.store.delete({ where: { id: store.id } });
    });
    (0, observabilityService_1.logEvent)("info", "privacy.shop_redacted", {
        shop: shopDomain,
    });
    return {
        redacted: true,
        shop: shopDomain,
    };
}
