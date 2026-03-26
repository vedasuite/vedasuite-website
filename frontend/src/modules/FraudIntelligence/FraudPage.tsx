import {
  Banner,
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  IndexTable,
  InlineStack,
  Layout,
  Modal,
  Page,
  Tabs,
  Text,
  Toast,
} from "@shopify/polaris";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApiClient } from "../../api/client";
import { useShopifyAdminLinks } from "../../hooks/useShopifyAdminLinks";
import { readModuleCache, writeModuleCache } from "../../lib/moduleCache";

type OrderRow = {
  id: string;
  shopifyOrderId: string;
  totalAmount: number;
  currency: string;
  fraudScore: number;
  fraudRiskLevel: string;
  status: string;
};

const resourceName = {
  singular: "order",
  plural: "orders",
};

export function FraudPage() {
  const api = useApiClient();
  const { getOrderUrl } = useShopifyAdminLinks();
  const [searchParams] = useSearchParams();
  const cachedOrders = readModuleCache<OrderRow[]>("fraud-orders");
  const [orders, setOrders] = useState<OrderRow[]>(cachedOrders ?? []);
  const [selectedTab, setSelectedTab] = useState(0);
  const [activeOrder, setActiveOrder] = useState<OrderRow | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const focus = searchParams.get("focus");

  const loadOrders = () => {
    api
      .get<{ orders: OrderRow[] }>("/api/fraud/orders")
      .then((res) => {
        setOrders(res.data.orders);
        writeModuleCache("fraud-orders", res.data.orders);
      })
      .catch(() => setOrders([]));
  };

  useEffect(() => {
    loadOrders();
  }, [api]);

  useEffect(() => {
    if (focus === "signals") {
      setSelectedTab(1);
    } else {
      setSelectedTab(0);
    }
  }, [focus]);

  const tabs = [
    { id: "queue", content: "Review queue" },
    { id: "signals", content: "Signals" },
  ];

  const signalSummary = useMemo(
    () => [
      { label: "Shared network participation", value: "Enabled-ready" },
      { label: "Risk threshold", value: "71+ = High risk" },
      { label: "Detected patterns", value: "Chargeback, refund abuse, wardrobing" },
    ],
    []
  );

  const visibleOrders = useMemo(() => {
    if (focus === "high-risk") {
      return orders.filter((order) => order.fraudScore >= 71);
    }

    if (focus === "return-abuse") {
      return orders.filter((order) => order.fraudRiskLevel !== "Low");
    }

    return orders;
  }, [focus, orders]);

  const focusMessage =
    focus === "high-risk"
      ? "Showing only the highest-risk orders so you can act on the most urgent fraud exposure first."
      : focus === "return-abuse"
      ? "Showing orders with medium and high-risk behavior to help isolate refund and wardrobing patterns."
      : null;

  const runAction = async (action: "allow" | "flag" | "block" | "manual_review") => {
    if (!activeOrder) return;

    try {
      const response = await api.post("/api/fraud/action", {
        orderId: activeOrder.id,
        action,
      });
      const tagResult = response.data?.order?.shopifyTagResult as
        | { updated?: boolean; reason?: string }
        | undefined;
      setToast(
        tagResult?.updated
          ? `Order ${activeOrder.shopifyOrderId} updated and tagged in Shopify: ${action}.`
          : `Order ${activeOrder.shopifyOrderId} updated locally: ${action}${
              tagResult?.reason ? ` (${tagResult.reason})` : "."
            }`
      );
      setActiveOrder(null);
      loadOrders();
    } catch {
      setToast("Unable to update the order right now.");
    }
  };

  return (
    <Page
      title="Fraud & Return Abuse Intelligence"
      subtitle="Review payment risk, return abuse, chargeback exposure, and shopper trust signals."
    >
      <Layout>
        <Layout.Section>
          <Banner title="Fraud queue is active" tone="warning">
            <p>
              Orders are scored from 0-100 using IP, email, shipping address,
              device fingerprint, payment fingerprint, refund history, and order
              frequency.
            </p>
          </Banner>
        </Layout.Section>
        <Layout.Section>
          {focusMessage ? (
            <Banner title="Focused review mode" tone="info">
              <p>{focusMessage}</p>
            </Banner>
          ) : null}
        </Layout.Section>
        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
              <Box paddingBlockStart="400">
                {selectedTab === 0 ? (
                  visibleOrders.length === 0 ? (
                    <Card>
                      <BlockStack gap="300">
                        <Text as="h3" variant="headingMd">
                          No matching fraud queue results
                        </Text>
                        <Text as="p" tone="subdued">
                          There are no orders in the current focused view. Try
                          another filter or return to the full review queue.
                        </Text>
                      </BlockStack>
                    </Card>
                  ) : (
                    <IndexTable
                      resourceName={resourceName}
                      itemCount={visibleOrders.length}
                      selectable={false}
                      headings={[
                        { title: "Order" },
                        { title: "Amount" },
                        { title: "Fraud score" },
                        { title: "Risk level" },
                        { title: "Status" },
                        { title: "Action" },
                      ]}
                    >
                      {visibleOrders.map((order, index) => (
                        <IndexTable.Row id={order.id} key={order.id} position={index}>
                          <IndexTable.Cell>
                            <Text as="span" variant="bodyMd" fontWeight="semibold">
                              {order.shopifyOrderId}
                            </Text>
                          </IndexTable.Cell>
                          <IndexTable.Cell>
                            {order.totalAmount.toFixed(2)} {order.currency}
                          </IndexTable.Cell>
                          <IndexTable.Cell>{order.fraudScore}</IndexTable.Cell>
                          <IndexTable.Cell>
                            <Badge
                              tone={
                                order.fraudRiskLevel === "High"
                                  ? "critical"
                                  : order.fraudRiskLevel === "Low"
                                  ? "success"
                                  : undefined
                              }
                            >
                              {order.fraudRiskLevel}
                            </Badge>
                          </IndexTable.Cell>
                          <IndexTable.Cell>{order.status}</IndexTable.Cell>
                          <IndexTable.Cell>
                            <Button onClick={() => setActiveOrder(order)}>Review</Button>
                          </IndexTable.Cell>
                        </IndexTable.Row>
                      ))}
                    </IndexTable>
                  )
                ) : (
                  <BlockStack gap="300">
                    {signalSummary.map((item) => (
                      <Card key={item.label}>
                        <InlineStack align="space-between">
                          <Text as="span" variant="bodyMd">
                            {item.label}
                          </Text>
                          <Badge tone="info">{item.value}</Badge>
                        </InlineStack>
                      </Card>
                    ))}
                  </BlockStack>
                )}
              </Box>
            </Tabs>
          </Card>
        </Layout.Section>
      </Layout>

      <Modal
        open={!!activeOrder}
        onClose={() => setActiveOrder(null)}
        title={activeOrder ? `Order ${activeOrder.shopifyOrderId}` : "Order review"}
        primaryAction={
          activeOrder
            ? { content: "Allow order", onAction: () => runAction("allow") }
            : undefined
        }
        secondaryActions={
          activeOrder
            ? [
                { content: "Flag", onAction: () => runAction("flag") },
                { content: "Block", onAction: () => runAction("block") },
                {
                  content: "Manual review",
                  onAction: () => runAction("manual_review"),
                },
              ]
            : []
        }
      >
        <Modal.Section>
          {activeOrder ? (
            <BlockStack gap="300">
              <Text as="p">
                Risk score: <strong>{activeOrder.fraudScore}</strong> / 100
              </Text>
              <Text as="p">
                Decision guidance: review refund history, shipping consistency,
                and payment fingerprint before fulfillment.
              </Text>
              <InlineStack gap="200">
                <Badge tone="critical">Chargeback risk</Badge>
                <Badge tone="info">Refund history</Badge>
                <Badge tone="warning">Wardrobing watch</Badge>
              </InlineStack>
              {getOrderUrl(activeOrder.shopifyOrderId) ? (
                <Button
                  url={getOrderUrl(activeOrder.shopifyOrderId) ?? undefined}
                  external
                >
                  Open Shopify order
                </Button>
              ) : null}
            </BlockStack>
          ) : null}
        </Modal.Section>
      </Modal>

      {toast ? <Toast content={toast} onDismiss={() => setToast(null)} /> : null}
    </Page>
  );
}
