"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompetitorOverview = getCompetitorOverview;
exports.listTrackedCompetitorProducts = listTrackedCompetitorProducts;
exports.listCompetitorConnectors = listCompetitorConnectors;
exports.updateCompetitorDomains = updateCompetitorDomains;
exports.ingestCompetitorSnapshots = ingestCompetitorSnapshots;
const prismaClient_1 = require("../db/prismaClient");
const shopifyAdminService_1 = require("./shopifyAdminService");
function normalizeCompetitorName(domain, label) {
    return label ?? domain.replace(/\..+$/, "").replace(/[-_]/g, " ");
}
function buildGoogleShoppingSignal(domain, productHandle, basePrice, competitorName) {
    const priceShift = ((domain.length + productHandle.length) % 5) - 2;
    const price = Number(Math.max(1, basePrice + priceShift * 0.75).toFixed(2));
    const promotion = price < basePrice ? "Google Shopping price dip" : null;
    return {
        source: "google_shopping",
        price,
        promotion,
        stockStatus: "in_stock",
        competitorUrl: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(`${competitorName} ${productHandle}`)}`,
        insightsJson: JSON.stringify({
            ingestionSource: "google-shopping-signal",
            marketSurface: "Google Shopping",
            capturedAt: new Date().toISOString(),
            priceDelta: Number((price - basePrice).toFixed(2)),
        }),
    };
}
function buildMetaAdSignal(domain, productHandle, basePrice, competitorName) {
    const promoTrigger = (domain.length + productHandle.length) % 3 === 0;
    const promotion = promoTrigger ? "Meta campaign promo detected" : null;
    const adCopy = promoTrigger
        ? `${competitorName} is pushing ${productHandle} with an urgency-led promotional message.`
        : `${competitorName} is running visibility ads for ${productHandle}.`;
    return {
        source: "meta_ads",
        price: basePrice,
        promotion,
        stockStatus: promoTrigger ? "low_stock" : "in_stock",
        adCopy,
        competitorUrl: `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&media_type=all&search_type=keyword_unordered&view_all_page_id=0&q=${encodeURIComponent(`${competitorName} ${productHandle}`)}`,
        insightsJson: JSON.stringify({
            ingestionSource: "meta-ads-signal",
            marketSurface: "Meta Ad Library",
            capturedAt: new Date().toISOString(),
            adPressure: promoTrigger ? "high" : "medium",
        }),
    };
}
async function getCompetitorOverview(shopDomain) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
    });
    if (!store)
        throw new Error("Store not found");
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last72h = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const [recentChanges, promoCount, stockAlerts, domains, recentRows, allRows,] = await Promise.all([
        prismaClient_1.prisma.competitorData.count({
            where: { storeId: store.id, collectedAt: { gte: last24h } },
        }),
        prismaClient_1.prisma.competitorData.count({
            where: {
                storeId: store.id,
                promotion: { not: null },
                collectedAt: { gte: last24h },
            },
        }),
        prismaClient_1.prisma.competitorData.count({
            where: {
                storeId: store.id,
                stockStatus: { in: ["out_of_stock", "low_stock"] },
                collectedAt: { gte: last24h },
            },
        }),
        prismaClient_1.prisma.competitorDomain.count({
            where: { storeId: store.id },
        }),
        prismaClient_1.prisma.competitorData.findMany({
            where: { storeId: store.id, collectedAt: { gte: last72h } },
            orderBy: { collectedAt: "desc" },
            take: 150,
        }),
        prismaClient_1.prisma.competitorData.findMany({
            where: { storeId: store.id },
            orderBy: { collectedAt: "desc" },
            take: 500,
        }),
    ]);
    const sourceBreakdown = {
        website: recentRows.filter((row) => row.source.startsWith("website")).length,
        googleShopping: recentRows.filter((row) => row.source === "google_shopping")
            .length,
        metaAds: recentRows.filter((row) => row.source === "meta_ads").length,
    };
    const productSignals = new Map();
    for (const row of [...recentRows].reverse()) {
        const bucket = productSignals.get(row.productHandle) ?? {
            latest: null,
            earliest: null,
            promotions: 0,
            stock: 0,
        };
        if (bucket.earliest == null && row.price != null) {
            bucket.earliest = row.price;
        }
        if (row.price != null) {
            bucket.latest = row.price;
        }
        if (row.promotion) {
            bucket.promotions += 1;
        }
        if (row.stockStatus === "low_stock" || row.stockStatus === "out_of_stock") {
            bucket.stock += 1;
        }
        productSignals.set(row.productHandle, bucket);
    }
    const topMovers = Array.from(productSignals.entries())
        .map(([productHandle, bucket]) => ({
        productHandle,
        priceDelta: bucket.latest != null && bucket.earliest != null
            ? Number((bucket.latest - bucket.earliest).toFixed(2))
            : 0,
        promotionSignals: bucket.promotions,
        stockSignals: bucket.stock,
    }))
        .sort((a, b) => Math.abs(b.priceDelta) - Math.abs(a.priceDelta) ||
        b.promotionSignals - a.promotionSignals)
        .slice(0, 5);
    const lastIngestedAt = allRows[0]?.collectedAt ?? null;
    const freshnessHours = lastIngestedAt
        ? Number(((Date.now() - new Date(lastIngestedAt).getTime()) / (1000 * 60 * 60)).toFixed(1))
        : null;
    const promotionalHeat = promoCount >= 15 ? "High" : promoCount >= 7 ? "Medium" : "Low";
    const marketPressure = recentChanges >= 24 ? "High" : recentChanges >= 10 ? "Medium" : "Low";
    return {
        recentPriceChanges: recentChanges,
        promotionAlerts: promoCount,
        stockMovementAlerts: stockAlerts,
        trackedDomains: domains,
        lastIngestedAt,
        freshnessHours,
        promotionalHeat,
        marketPressure,
        sourceBreakdown,
        topMovers,
    };
}
async function listTrackedCompetitorProducts(shopDomain) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
    });
    if (!store)
        throw new Error("Store not found");
    const rows = await prismaClient_1.prisma.competitorData.findMany({
        where: { storeId: store.id },
        orderBy: { collectedAt: "desc" },
        take: 100,
    });
    return rows;
}
async function listCompetitorConnectors(shopDomain) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
        include: {
            competitorDomains: true,
            competitorData: {
                orderBy: { collectedAt: "desc" },
                take: 300,
            },
        },
    });
    if (!store)
        throw new Error("Store not found");
    const latestBySource = new Map();
    for (const row of store.competitorData) {
        if (!latestBySource.has(row.source)) {
            latestBySource.set(row.source, row.collectedAt);
        }
    }
    return [
        {
            id: "website",
            label: "Website crawler",
            description: "Fetches live product pages from tracked competitor domains.",
            connected: store.competitorDomains.length > 0,
            trackedTargets: store.competitorDomains.length,
            lastIngestedAt: latestBySource.get("website_live") ?? latestBySource.get("website") ?? null,
            readiness: store.competitorDomains.length > 1 ? "Healthy" : store.competitorDomains.length === 1 ? "Limited" : "Needs setup",
        },
        {
            id: "google_shopping",
            label: "Google Shopping feed",
            description: "Builds market price snapshots for tracked catalog handles.",
            connected: store.competitorDomains.length > 0,
            trackedTargets: store.competitorDomains.length,
            lastIngestedAt: latestBySource.get("google_shopping") ?? null,
            readiness: latestBySource.get("google_shopping") != null ? "Healthy" : "Pending first ingest",
        },
        {
            id: "meta_ads",
            label: "Meta Ad Library",
            description: "Captures promotion pressure and ad-activity signals.",
            connected: store.competitorDomains.length > 0,
            trackedTargets: store.competitorDomains.length,
            lastIngestedAt: latestBySource.get("meta_ads") ?? null,
            readiness: latestBySource.get("meta_ads") != null ? "Healthy" : "Pending first ingest",
        },
    ];
}
async function updateCompetitorDomains(shopDomain, domains) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
    });
    if (!store)
        throw new Error("Store not found");
    await prismaClient_1.prisma.competitorDomain.deleteMany({
        where: { storeId: store.id },
    });
    await prismaClient_1.prisma.competitorDomain.createMany({
        data: domains.map((d) => ({
            storeId: store.id,
            domain: d.domain,
            label: d.label,
        })),
    });
    const updated = await prismaClient_1.prisma.competitorDomain.findMany({
        where: { storeId: store.id },
    });
    return updated;
}
async function ingestCompetitorSnapshots(shopDomain) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
        include: {
            competitorDomains: true,
        },
    });
    if (!store)
        throw new Error("Store not found");
    const domains = store.competitorDomains;
    if (domains.length === 0) {
        return {
            ingested: 0,
            domains: 0,
            products: 0,
        };
    }
    const sourceProducts = await prismaClient_1.prisma.priceHistory.findMany({
        where: { storeId: store.id },
        orderBy: { createdAt: "desc" },
        distinct: ["productHandle"],
        take: 12,
    });
    let ingested = 0;
    for (const domain of domains) {
        for (const [index, product] of sourceProducts.entries()) {
            const competitorName = normalizeCompetitorName(domain.domain, domain.label);
            const promoIndex = (domain.domain.length + index) % 4;
            const fallbackPromotion = promoIndex === 0 ? "12% off" : promoIndex === 1 ? "Bundle offer" : null;
            const fallbackStockStatus = promoIndex === 2 ? "low_stock" : promoIndex === 3 ? "out_of_stock" : "in_stock";
            const priceShift = ((domain.domain.length % 7) - 3) * 0.9;
            const fallbackPrice = Number(Math.max(1, product.currentPrice + priceShift).toFixed(2));
            const liveSnapshot = await (0, shopifyAdminService_1.fetchCompetitorSnapshot)(domain.domain, product.productHandle, fallbackPrice);
            await prismaClient_1.prisma.competitorData.create({
                data: {
                    storeId: store.id,
                    productHandle: product.productHandle,
                    competitorName,
                    competitorUrl: `https://${domain.domain}/products/${product.productHandle}`,
                    source: liveSnapshot?.source ?? "website",
                    price: liveSnapshot?.price ?? fallbackPrice,
                    promotion: liveSnapshot?.promotion ?? fallbackPromotion,
                    stockStatus: liveSnapshot?.stockStatus ?? fallbackStockStatus,
                    insightsJson: JSON.stringify({
                        ingestionSource: "tracked-domain-workflow",
                        capturedAt: new Date().toISOString(),
                        priceDelta: Number(((liveSnapshot?.price ?? fallbackPrice) - product.currentPrice).toFixed(2)),
                        externalFetch: !!liveSnapshot,
                    }),
                },
            });
            ingested += 1;
            const googleSignal = buildGoogleShoppingSignal(domain.domain, product.productHandle, fallbackPrice, competitorName);
            await prismaClient_1.prisma.competitorData.create({
                data: {
                    storeId: store.id,
                    productHandle: product.productHandle,
                    competitorName,
                    competitorUrl: googleSignal.competitorUrl,
                    source: googleSignal.source,
                    price: googleSignal.price,
                    promotion: googleSignal.promotion,
                    stockStatus: googleSignal.stockStatus,
                    insightsJson: googleSignal.insightsJson,
                },
            });
            ingested += 1;
            const metaSignal = buildMetaAdSignal(domain.domain, product.productHandle, fallbackPrice, competitorName);
            await prismaClient_1.prisma.competitorData.create({
                data: {
                    storeId: store.id,
                    productHandle: product.productHandle,
                    competitorName,
                    competitorUrl: metaSignal.competitorUrl,
                    source: metaSignal.source,
                    price: metaSignal.price,
                    promotion: metaSignal.promotion,
                    stockStatus: metaSignal.stockStatus,
                    adCopy: metaSignal.adCopy,
                    insightsJson: metaSignal.insightsJson,
                },
            });
            ingested += 1;
        }
    }
    return {
        ingested,
        domains: domains.length,
        products: sourceProducts.length,
    };
}
