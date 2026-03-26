import { prisma } from "../db/prismaClient";
import { publishProductPrice } from "./shopifyAdminService";

export async function getPricingRecommendations(shopDomain: string) {
  const store = await prisma.store.findUnique({
    where: { shop: shopDomain },
  });
  if (!store) throw new Error("Store not found");

  const history = await prisma.priceHistory.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return history;
}

export async function simulatePricingChange(params: {
  currentPrice: number;
  recommendedPrice: number;
  salesVelocity: number;
  margin: number;
}) {
  const { currentPrice, recommendedPrice, salesVelocity, margin } = params;
  const priceDelta = recommendedPrice - currentPrice;
  const expectedMarginImprovement =
    margin === 0 ? 0 : (priceDelta / currentPrice) * margin;

  const projectedMonthlyProfitGain =
    priceDelta * salesVelocity * 30 * (margin / 100);

  return {
    currentPrice,
    recommendedPrice,
    expectedMarginImprovement,
    projectedMonthlyProfitGain,
  };
}

export async function approvePricingRecommendation(
  shopDomain: string,
  recommendationId: string
) {
  const store = await prisma.store.findUnique({
    where: { shop: shopDomain },
  });
  if (!store) throw new Error("Store not found");

  const recommendation = await prisma.priceHistory.findFirst({
    where: {
      id: recommendationId,
      storeId: store.id,
    },
  });
  if (!recommendation) {
    throw new Error("Pricing recommendation not found");
  }

  let rationale: Record<string, unknown> = {};
  if (recommendation.rationaleJson) {
    try {
      rationale = JSON.parse(recommendation.rationaleJson) as Record<string, unknown>;
    } catch {
      rationale = {};
    }
  }

  const shopifyPublishResult = await publishProductPrice(
    shopDomain,
    recommendation.productHandle,
    recommendation.recommendedPrice
  );

  const updated = await prisma.priceHistory.update({
    where: { id: recommendation.id },
    data: {
      rationaleJson: JSON.stringify({
        ...rationale,
        status: "approved",
        approvedAt: new Date().toISOString(),
        publishedToShopify: shopifyPublishResult.updated,
        shopifyPublishReason:
          shopifyPublishResult.updated ? null : shopifyPublishResult.reason,
      }),
    },
  });

  return {
    ...updated,
    shopifyPublishResult,
  };
}

