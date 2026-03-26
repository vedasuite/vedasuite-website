"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopifyGraphQL = shopifyGraphQL;
exports.createAppSubscription = createAppSubscription;
exports.getActiveAppSubscription = getActiveAppSubscription;
exports.cancelAppSubscription = cancelAppSubscription;
exports.registerSyncWebhooks = registerSyncWebhooks;
exports.getSyncWebhookStatus = getSyncWebhookStatus;
exports.fetchCompetitorSnapshot = fetchCompetitorSnapshot;
exports.syncShopifyStoreData = syncShopifyStoreData;
exports.publishProductPrice = publishProductPrice;
exports.tagShopifyOrder = tagShopifyOrder;
exports.extractLegacyId = extractLegacyId;
const prismaClient_1 = require("../db/prismaClient");
const observabilityService_1 = require("./observabilityService");
const SHOPIFY_API_VERSION = "2024-01";
function formatBillingPermissionMessage(message) {
    if (/without a public distribution/i.test(message)) {
        return "Shopify Billing API is blocked for this app because the app is not set to Public distribution. In Shopify Partner Dashboard, open this app, go to Distribution, choose Public distribution, save, then reinstall or reauthorize the app and retry billing.";
    }
    if (/access denied|not authorized|forbidden|scope/i.test(message)) {
        return `${message} Reinstall or reauthorize the app with the write_own_subscription scope, then retry billing.`;
    }
    return message;
}
function extractLegacyId(gid) {
    if (!gid)
        return null;
    const match = gid.match(/\/(\d+)$/);
    return match?.[1] ?? null;
}
async function getStoreAccess(shopDomain) {
    const store = await prismaClient_1.prisma.store.findUnique({
        where: { shop: shopDomain },
        select: {
            id: true,
            shop: true,
            accessToken: true,
            pricingBias: true,
            profitGuardrail: true,
        },
    });
    if (!store) {
        throw new Error("Store not found");
    }
    return store;
}
async function shopifyGraphQL(shopDomain, query, variables) {
    const store = await getStoreAccess(shopDomain);
    const response = await fetch(`https://${store.shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": store.accessToken,
        },
        body: JSON.stringify({ query, variables }),
    });
    if (!response.ok) {
        const text = await response.text();
        if (response.status === 401 ||
            /invalid api key|invalid access token|unrecognized login|wrong password/i.test(text)) {
            throw new Error(`Stored Shopify access token is invalid for ${shopDomain}. Reauthorize the app and retry.`);
        }
        throw new Error(`Shopify GraphQL request failed: ${response.status} ${text}`);
    }
    const payload = (await response.json());
    if (payload.errors?.length) {
        throw new Error(payload.errors.map((error) => error.message).join(", "));
    }
    return payload.data;
}
async function createAppSubscription(params) {
    const data = await shopifyGraphQL(params.shopDomain, `
      mutation AppSubscriptionCreate(
        $name: String!
        $returnUrl: URL!
        $trialDays: Int
        $test: Boolean
        $lineItems: [AppSubscriptionLineItemInput!]!
      ) {
        appSubscriptionCreate(
          name: $name
          returnUrl: $returnUrl
          trialDays: $trialDays
          test: $test
          replacementBehavior: STANDARD
          lineItems: $lineItems
        ) {
          confirmationUrl
          appSubscription {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
        name: params.name,
        returnUrl: params.returnUrl,
        trialDays: params.trialDays ?? 0,
        test: params.test ?? false,
        lineItems: [
            {
                plan: {
                    appRecurringPricingDetails: {
                        interval: "EVERY_30_DAYS",
                        price: {
                            amount: params.price,
                            currencyCode: "USD",
                        },
                    },
                },
            },
        ],
    });
    const payload = data.appSubscriptionCreate;
    if (payload.userErrors.length) {
        throw new Error(formatBillingPermissionMessage(payload.userErrors.map((error) => error.message).join(", ")));
    }
    if (!payload.confirmationUrl) {
        throw new Error("Shopify did not return a billing confirmation URL.");
    }
    return payload;
}
async function getActiveAppSubscription(shopDomain) {
    const data = await shopifyGraphQL(shopDomain, `
      query CurrentAppInstallation {
        currentAppInstallation {
          activeSubscriptions {
            id
            name
            status
            createdAt
            currentPeriodEnd
          }
        }
      }
    `);
    const subscriptions = data.currentAppInstallation?.activeSubscriptions
        ?.filter((subscription) => subscription.status === "ACTIVE")
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()) ?? [];
    return subscriptions[0] ?? null;
}
async function cancelAppSubscription(shopDomain, subscriptionId, prorate = false) {
    const data = await shopifyGraphQL(shopDomain, `
      mutation AppSubscriptionCancel($id: ID!, $prorate: Boolean) {
        appSubscriptionCancel(id: $id, prorate: $prorate) {
          userErrors {
            message
          }
          appSubscription {
            id
            status
          }
        }
      }
    `, {
        id: subscriptionId,
        prorate,
    });
    const payload = data.appSubscriptionCancel;
    if (payload.userErrors.length) {
        throw new Error(formatBillingPermissionMessage(payload.userErrors.map((error) => error.message).join(", ")));
    }
    return payload.appSubscription ?? null;
}
async function registerSyncWebhooks(shopDomain, appUrl) {
    const callbackBaseUrl = new URL("/webhooks/shopify", appUrl).toString();
    const desiredTopics = [
        "ORDERS_CREATE",
        "ORDERS_UPDATED",
        "CUSTOMERS_CREATE",
        "CUSTOMERS_UPDATE",
        "APP_SUBSCRIPTIONS_UPDATE",
        "APP_UNINSTALLED",
        "CUSTOMERS_DATA_REQUEST",
        "CUSTOMERS_REDACT",
        "SHOP_REDACT",
    ];
    const existing = await shopifyGraphQL(shopDomain, `
      query ExistingWebhooks {
        webhookSubscriptions(first: 50) {
          edges {
            node {
              topic
              endpoint {
                __typename
                ... on WebhookHttpEndpoint {
                  callbackUrl
                }
              }
            }
          }
        }
      }
    `);
    const existingKeys = new Set(existing.webhookSubscriptions.edges.map((edge) => {
        const callbackUrl = edge.node.endpoint.callbackUrl ?? "";
        return `${edge.node.topic}|${callbackUrl}`;
    }));
    const created = [];
    for (const topic of desiredTopics) {
        const callbackUrl = `${callbackBaseUrl}/${topic.toLowerCase()}`;
        const key = `${topic}|${callbackUrl}`;
        if (existingKeys.has(key)) {
            continue;
        }
        const createdWebhook = await shopifyGraphQL(shopDomain, `
        mutation CreateWebhook($topic: WebhookSubscriptionTopic!, $callbackUrl: URL!) {
          webhookSubscriptionCreate(
            topic: $topic
            webhookSubscription: {
              callbackUrl: $callbackUrl
              format: JSON
            }
          ) {
            userErrors {
              message
            }
          }
        }
      `, {
            topic,
            callbackUrl,
        });
        if (createdWebhook.webhookSubscriptionCreate.userErrors.length) {
            throw new Error(createdWebhook.webhookSubscriptionCreate.userErrors
                .map((error) => error.message)
                .join(", "));
        }
        created.push(topic);
    }
    return {
        created,
        totalTracked: desiredTopics.length,
    };
}
async function getSyncWebhookStatus(shopDomain, appUrl) {
    const callbackBaseUrl = new URL("/webhooks/shopify", appUrl).toString();
    const desiredTopics = [
        "ORDERS_CREATE",
        "ORDERS_UPDATED",
        "CUSTOMERS_CREATE",
        "CUSTOMERS_UPDATE",
        "APP_SUBSCRIPTIONS_UPDATE",
        "APP_UNINSTALLED",
        "CUSTOMERS_DATA_REQUEST",
        "CUSTOMERS_REDACT",
        "SHOP_REDACT",
    ];
    const existing = await shopifyGraphQL(shopDomain, `
      query ExistingWebhooks {
        webhookSubscriptions(first: 50) {
          edges {
            node {
              topic
              endpoint {
                __typename
                ... on WebhookHttpEndpoint {
                  callbackUrl
                }
              }
            }
          }
        }
      }
    `);
    const webhooks = desiredTopics.map((topic) => {
        const callbackUrl = `${callbackBaseUrl}/${topic.toLowerCase()}`;
        const registered = existing.webhookSubscriptions.edges.some((edge) => edge.node.topic === topic && edge.node.endpoint.callbackUrl === callbackUrl);
        return {
            topic,
            callbackUrl,
            registered,
        };
    });
    return {
        registeredCount: webhooks.filter((webhook) => webhook.registered).length,
        totalTracked: desiredTopics.length,
        webhooks,
    };
}
function computeRecommendedPrice(currentPrice, pricingBias) {
    const lift = Math.max(0.01, (pricingBias - 45) / 250);
    return Number((currentPrice * (1 + lift)).toFixed(2));
}
function computeOptimalPrice(currentPrice, pricingBias, profitGuardrail) {
    const lift = Math.max(0.02, (pricingBias + profitGuardrail - 55) / 200);
    return Number((currentPrice * (1 + lift)).toFixed(2));
}
async function fetchCompetitorSnapshot(domain, productHandle, fallbackPrice) {
    try {
        return await (0, observabilityService_1.withRetry)(async () => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 4000);
            try {
                const response = await fetch(`https://${domain}/products/${productHandle}`, {
                    signal: controller.signal,
                    headers: {
                        "User-Agent": "VedaSuiteAI/1.0 competitor-ingestion",
                    },
                });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const html = await response.text();
                const lowerHtml = html.toLowerCase();
                const priceMatch = html.match(/\$([0-9]+(?:\.[0-9]{1,2})?)/i) ??
                    html.match(/"price"\s*:\s*"([0-9]+(?:\.[0-9]{1,2})?)"/i) ??
                    html.match(/property="product:price:amount"\s+content="([0-9]+(?:\.[0-9]{1,2})?)"/i);
                return {
                    price: priceMatch ? Number(priceMatch[1]) : fallbackPrice,
                    promotion: /sale|discount|bundle|offer/.test(lowerHtml)
                        ? "Live promo detected"
                        : null,
                    stockStatus: /out of stock/.test(lowerHtml)
                        ? "out_of_stock"
                        : /low stock/.test(lowerHtml)
                            ? "low_stock"
                            : "in_stock",
                    source: "website_live",
                };
            }
            finally {
                clearTimeout(timeout);
            }
        }, {
            attempts: 2,
            delayMs: 200,
            operationName: "competitor.fetch_snapshot",
            context: {
                domain,
                productHandle,
            },
        });
    }
    catch {
        (0, observabilityService_1.logEvent)("warn", "competitor.snapshot_fallback", {
            domain,
            productHandle,
        });
        return null;
    }
}
async function syncShopifyStoreData(shopDomain) {
    const store = await getStoreAccess(shopDomain);
    const data = await shopifyGraphQL(shopDomain, `
      query SyncStoreData {
        shop {
          name
          products(first: 20, sortKey: UPDATED_AT, reverse: true) {
            edges {
              node {
                id
                handle
                title
                variants(first: 1) {
                  edges {
                    node {
                      id
                      price
                    }
                  }
                }
              }
            }
          }
          orders(first: 20, sortKey: CREATED_AT, reverse: true) {
            edges {
              node {
                id
                legacyResourceId
                name
                createdAt
                displayFinancialStatus
                currentTotalPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                customer {
                  id
                  legacyResourceId
                  email
                  numberOfOrders
                }
                tags
                displayFulfillmentStatus
              }
            }
          }
        }
      }
    `);
    const products = data.shop.products.edges.map((edge) => edge.node);
    const orders = data.shop.orders.edges.map((edge) => edge.node);
    for (const orderNode of orders) {
        let customerId = null;
        if (orderNode.customer?.legacyResourceId) {
            const existingCustomer = await prismaClient_1.prisma.customer.findFirst({
                where: {
                    storeId: store.id,
                    shopifyCustomerId: orderNode.customer.legacyResourceId,
                },
            });
            const customer = existingCustomer
                ? await prismaClient_1.prisma.customer.update({
                    where: { id: existingCustomer.id },
                    data: {
                        email: orderNode.customer.email ?? existingCustomer.email,
                        totalOrders: orderNode.customer.numberOfOrders,
                    },
                })
                : await prismaClient_1.prisma.customer.create({
                    data: {
                        storeId: store.id,
                        shopifyCustomerId: orderNode.customer.legacyResourceId,
                        email: orderNode.customer.email,
                        totalOrders: orderNode.customer.numberOfOrders,
                    },
                });
            customerId = customer.id;
        }
        const normalizedStatus = orderNode.displayFinancialStatus.toLowerCase();
        const refunded = normalizedStatus.includes("refunded") ||
            normalizedStatus.includes("partially_refunded");
        const refundRequested = refunded || orderNode.tags.some((tag) => /refund/i.test(tag));
        await prismaClient_1.prisma.order.upsert({
            where: { shopifyOrderId: orderNode.legacyResourceId },
            create: {
                storeId: store.id,
                customerId,
                shopifyOrderId: orderNode.legacyResourceId,
                totalAmount: Number(orderNode.currentTotalPriceSet.shopMoney.amount),
                currency: orderNode.currentTotalPriceSet.shopMoney.currencyCode,
                status: normalizedStatus,
                refunded,
                refundRequested,
                createdAt: new Date(orderNode.createdAt),
            },
            update: {
                customerId,
                totalAmount: Number(orderNode.currentTotalPriceSet.shopMoney.amount),
                currency: orderNode.currentTotalPriceSet.shopMoney.currencyCode,
                status: normalizedStatus,
                refunded,
                refundRequested,
            },
        });
    }
    const customers = await prismaClient_1.prisma.customer.findMany({
        where: { storeId: store.id },
        include: {
            orders: true,
            fraudSignals: true,
        },
    });
    for (const customer of customers) {
        const totalOrders = customer.orders.length;
        const totalRefunds = customer.orders.filter((order) => order.refunded).length;
        const refundRate = totalOrders === 0 ? 0 : totalRefunds / totalOrders;
        const fraudSignalsCount = customer.fraudSignals.length;
        const successfulOrders = customer.orders.filter((order) => order.status === "paid" || order.status === "approved").length;
        const paymentReliability = totalOrders === 0 ? 0 : Number(((successfulOrders / totalOrders) * 20).toFixed(1));
        const score = Math.max(0, Math.min(100, Math.round(78 - refundRate * 55 - fraudSignalsCount * 6 + paymentReliability)));
        const creditCategory = score >= 80 ? "Trusted Buyer" : score >= 50 ? "Normal Buyer" : "Risky Buyer";
        await prismaClient_1.prisma.customer.update({
            where: { id: customer.id },
            data: {
                totalOrders,
                totalRefunds,
                refundRate,
                fraudSignalsCount,
                paymentReliability,
                creditScore: score,
                creditCategory,
            },
        });
    }
    for (const product of products) {
        const firstVariant = product.variants.edges[0]?.node;
        const currentPrice = Number(firstVariant?.price ?? 0);
        if (!product.handle || !currentPrice) {
            continue;
        }
        const latestPriceHistory = await prismaClient_1.prisma.priceHistory.findFirst({
            where: {
                storeId: store.id,
                productHandle: product.handle,
            },
            orderBy: { createdAt: "desc" },
        });
        const recommendedPrice = computeRecommendedPrice(currentPrice, store.pricingBias);
        if (!latestPriceHistory ||
            latestPriceHistory.currentPrice !== currentPrice ||
            latestPriceHistory.recommendedPrice !== recommendedPrice) {
            await prismaClient_1.prisma.priceHistory.create({
                data: {
                    storeId: store.id,
                    productHandle: product.handle,
                    currentPrice,
                    recommendedPrice,
                    expectedMarginDelta: Number((((recommendedPrice - currentPrice) / currentPrice) * 100).toFixed(2)),
                    expectedProfitGain: Number(((recommendedPrice - currentPrice) * 40).toFixed(2)),
                    rationaleJson: JSON.stringify({
                        source: "shopify_sync",
                        productTitle: product.title,
                        shopifyProductGid: product.id,
                        shopifyVariantGid: firstVariant?.id ?? null,
                        status: "pending",
                        syncedAt: new Date().toISOString(),
                    }),
                },
            });
        }
        const latestProfitRecord = await prismaClient_1.prisma.profitOptimizationData.findFirst({
            where: {
                storeId: store.id,
                productHandle: product.handle,
            },
            orderBy: { createdAt: "desc" },
        });
        const optimalPrice = computeOptimalPrice(currentPrice, store.pricingBias, store.profitGuardrail);
        if (!latestProfitRecord ||
            latestProfitRecord.sellingPrice !== currentPrice ||
            latestProfitRecord.optimalPrice !== optimalPrice) {
            const productCost = Number((currentPrice * 0.58).toFixed(2));
            await prismaClient_1.prisma.profitOptimizationData.create({
                data: {
                    storeId: store.id,
                    productHandle: product.handle,
                    productCost,
                    sellingPrice: currentPrice,
                    competitorAveragePrice: Number((currentPrice * 0.97).toFixed(2)),
                    advertisingSpend: Number((currentPrice * 0.12).toFixed(2)),
                    shippingCost: Number((currentPrice * 0.06).toFixed(2)),
                    returnRate: 0.08,
                    salesVelocity: 18,
                    optimalPrice,
                    projectedMarginIncrease: Number((((optimalPrice - currentPrice) / currentPrice) * 100).toFixed(2)),
                    projectedMonthlyProfit: Number(((optimalPrice - productCost) * 18 * 30).toFixed(2)),
                    bundleSuggestionsJson: JSON.stringify([
                        `Bundle ${product.title} with a complementary bestseller.`,
                    ]),
                    discountStrategyJson: JSON.stringify({
                        guardrail: store.profitGuardrail,
                        strategy: "Avoid broad discounting while competitor stock remains constrained.",
                    }),
                },
            });
        }
    }
    return {
        syncedAt: new Date().toISOString(),
        productsSynced: products.length,
        ordersSynced: orders.length,
        customersSynced: orders.filter((order) => order.customer?.legacyResourceId).length,
    };
}
async function publishProductPrice(shopDomain, productHandle, nextPrice) {
    const lookup = await shopifyGraphQL(shopDomain, `
      query ProductByHandle($query: String!) {
        products(first: 1, query: $query) {
          edges {
            node {
              id
              handle
              variants(first: 25) {
                edges {
                  node {
                    id
                    title
                    price
                  }
                }
              }
            }
          }
        }
      }
    `, { query: `handle:${productHandle}` });
    const product = lookup.products.edges[0]?.node;
    const variants = product?.variants.edges.map((edge) => edge.node) ?? [];
    if (!product?.id || variants.length === 0) {
        return { updated: false, reason: "No matching Shopify product variant found." };
    }
    const baseVariantPrice = Number(variants[0]?.price ?? 0);
    const priceDelta = nextPrice - baseVariantPrice;
    const mutation = await shopifyGraphQL(shopDomain, `
      mutation UpdateVariantPrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          userErrors {
            message
          }
        }
      }
    `, {
        productId: product.id,
        variants: variants.map((variant, index) => {
            const currentPrice = Number(variant.price ?? 0);
            const variantPrice = index === 0 ? nextPrice : Math.max(0.01, currentPrice + priceDelta);
            return {
                id: variant.id,
                price: variantPrice.toFixed(2),
            };
        }),
    });
    const errors = mutation.productVariantsBulkUpdate.userErrors;
    if (errors.length) {
        return { updated: false, reason: errors.map((error) => error.message).join(", ") };
    }
    return {
        updated: true,
        productHandle,
        variantCount: variants.length,
        price: nextPrice,
    };
}
async function tagShopifyOrder(shopDomain, shopifyOrderId, tags) {
    if (!/^\d+$/.test(shopifyOrderId)) {
        return {
            updated: false,
            reason: "Order does not have a Shopify numeric order id yet.",
        };
    }
    const orderGid = `gid://shopify/Order/${shopifyOrderId}`;
    const mutation = await shopifyGraphQL(shopDomain, `
      mutation AddOrderTags($id: ID!, $tags: [String!]!) {
        tagsAdd(id: $id, tags: $tags) {
          userErrors {
            message
          }
        }
      }
    `, {
        id: orderGid,
        tags,
    });
    const errors = mutation.tagsAdd.userErrors;
    if (errors.length) {
        return { updated: false, reason: errors.map((error) => error.message).join(", ") };
    }
    return { updated: true, shopifyOrderId, tags };
}
