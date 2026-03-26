import { prisma } from "../db/prismaClient";
import { tagShopifyOrder } from "./shopifyAdminService";

export type FraudSignalInput = {
  ipAddress?: string;
  email?: string;
  shippingAddress?: string;
  deviceFingerprint?: string;
  paymentFingerprint?: string;
  refundHistoryScore?: number;
  orderFrequencyScore?: number;
};

function mapScoreToRisk(score: number): "Low" | "Medium" | "High" {
  if (score <= 30) return "Low";
  if (score <= 70) return "Medium";
  return "High";
}

export async function scoreOrderFraud(
  shopDomain: string,
  orderId: string,
  signals: FraudSignalInput
) {
  const store = await prisma.store.findUnique({
    where: { shop: shopDomain },
  });
  if (!store) {
    throw new Error("Store not found");
  }

  let score = 10;

  if (signals.refundHistoryScore) score += signals.refundHistoryScore;
  if (signals.orderFrequencyScore) score += signals.orderFrequencyScore;

  if (signals.ipAddress?.startsWith("10.")) score += 10;
  if (signals.email?.endsWith("+fraud@test.com")) score += 15;

  if (store.fraudSensitivity === "high") {
    score = Math.min(100, Math.floor(score * 1.2));
  }

  score = Math.max(0, Math.min(100, score));
  const riskLevel = mapScoreToRisk(score);

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      fraudScore: score,
      fraudRiskLevel: riskLevel,
    },
  });

  await prisma.fraudSignal.create({
    data: {
      storeId: store.id,
      orderId: order.id,
      ipAddress: signals.ipAddress,
      email: signals.email,
      shippingAddress: signals.shippingAddress,
      deviceFingerprint: signals.deviceFingerprint,
      paymentFingerprint: signals.paymentFingerprint,
      refundHistory: signals.refundHistoryScore?.toString(),
      orderFrequency: signals.orderFrequencyScore?.toString(),
      riskScore: score,
      riskLevel,
    },
  });

  return { orderId: order.id, fraudScore: score, riskLevel };
}

export async function listRecentFraudOrders(shopDomain: string) {
  const store = await prisma.store.findUnique({
    where: { shop: shopDomain },
  });
  if (!store) {
    throw new Error("Store not found");
  }

  const orders = await prisma.order.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return orders;
}

export async function applyFraudAction(
  shopDomain: string,
  orderId: string,
  action: "allow" | "flag" | "block" | "manual_review"
) {
  const store = await prisma.store.findUnique({
    where: { shop: shopDomain },
  });
  if (!store) {
    throw new Error("Store not found");
  }

  const nextStatus =
    action === "allow"
      ? "approved"
      : action === "block"
      ? "blocked"
      : action === "flag"
      ? "flagged"
      : "manual_review";

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: nextStatus,
    },
  });

  const tags = [
    "VedaSuite AI",
    `vedasuite:${action}`,
    `fraud-risk:${order.fraudRiskLevel.toLowerCase()}`,
  ];
  const shopifyTagResult = await tagShopifyOrder(
    shopDomain,
    order.shopifyOrderId,
    tags
  );

  return {
    ...order,
    shopifyTagResult,
  };
}

