import {
  Badge,
  Banner,
  BlockStack,
  Button,
  Box,
  Card,
  IndexTable,
  InlineGrid,
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
import { ModuleGate } from "../../components/ModuleGate";
import { EmptyPageState, LoadingPageState } from "../../components/PageState";
import { useEmbeddedNavigation } from "../../hooks/useEmbeddedNavigation";
import { useShopifyAdminLinks } from "../../hooks/useShopifyAdminLinks";
import { useSubscriptionPlan } from "../../hooks/useSubscriptionPlan";
import { readModuleCache, writeModuleCache } from "../../lib/moduleCache";

type CustomerRow = {
  id: string;
  email?: string | null;
  shopifyCustomerId?: string | null;
  totalOrders: number;
  totalRefunds: number;
  refundRate: number;
  fraudSignalsCount: number;
  paymentReliability: number;
  orderCompletionRate: number;
  creditScore: number;
  creditCategory: string;
};

const resourceName = {
  singular: "customer",
  plural: "customers",
};

export function CreditScorePage() {
  const api = useApiClient();
  const { navigateEmbedded } = useEmbeddedNavigation();
  const { getCustomerUrl } = useShopifyAdminLinks();
  const [searchParams] = useSearchParams();
  const { subscription, loading: subscriptionLoading } = useSubscriptionPlan();
  const cachedCustomers = readModuleCache<CustomerRow[]>("credit-customers");
  const [customers, setCustomers] = useState<CustomerRow[]>(cachedCustomers ?? []);
  const [loading, setLoading] = useState(!cachedCustomers);
  const [selectedTab, setSelectedTab] = useState(0);
  const [activeCustomer, setActiveCustomer] = useState<CustomerRow | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const focus = searchParams.get("focus");

  const filteredCustomers = useMemo(() => {
    if (selectedTab === 1) {
      return customers.filter((customer) => customer.creditScore >= 80);
    }
    if (selectedTab === 2) {
      return customers.filter((customer) => customer.creditScore < 50);
    }
    return customers;
  }, [customers, selectedTab]);

  const summary = useMemo(
    () => ({
      trusted: customers.filter((customer) => customer.creditScore >= 80).length,
      normal: customers.filter(
        (customer) => customer.creditScore >= 50 && customer.creditScore < 80
      ).length,
      risky: customers.filter((customer) => customer.creditScore < 50).length,
    }),
    [customers]
  );

  const focusMessage =
    focus === "risky"
      ? "Showing the highest-risk shoppers first so you can align fraud and refund decisions."
      : focus === "trusted"
      ? "Showing your most trusted buyers first so retention and VIP handling can move quickly."
      : null;

  const loadCustomers = () => {
    api
      .get<{ customers: CustomerRow[] }>("/api/credit-score/customers")
      .then((res) => {
        setCustomers(res.data.customers);
        writeModuleCache("credit-customers", res.data.customers);
      })
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCustomers();
  }, [api]);

  useEffect(() => {
    if (focus === "trusted") {
      setSelectedTab(1);
      return;
    }

    if (focus === "risky") {
      setSelectedTab(2);
      return;
    }

    setSelectedTab(0);
  }, [focus]);

  if (subscriptionLoading) {
    return (
      <LoadingPageState
        title="Shopper Credit Score"
        subtitle="Preparing customer trust data..."
        message="Loading plan access and customer scoring."
      />
    );
  }

  const recomputeScore = async () => {
    if (!activeCustomer) return;

    try {
      const response = await api.post<{ customer: CustomerRow }>(
        `/api/credit-score/customer/${activeCustomer.id}/recompute`,
        {}
      );
      const updatedCustomer = response.data.customer;
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === updatedCustomer.id ? updatedCustomer : customer
        )
      );
      setActiveCustomer(updatedCustomer);
      setToast(`Recomputed credit score for ${updatedCustomer.email ?? "customer"}.`);
    } catch {
      setToast("Unable to recompute the shopper credit score.");
    }
  };

  return (
    <ModuleGate
      title="Shopper Credit Score"
      subtitle="See trust, refund behavior, and customer reliability at a glance."
      requiredPlan="Growth or Pro"
      allowed={!!subscription?.enabledModules.creditScore}
    >
      {loading ? (
        <LoadingPageState
          title="Shopper Credit Score"
          subtitle="Preparing customer trust data..."
          message="Loading customer risk and credit insights."
        />
      ) : filteredCustomers.length === 0 ? (
        <EmptyPageState
          title="Shopper Credit Score"
          subtitle="No customer credit data yet."
          message="Customer scoring will appear here once shopper history is available."
        />
      ) : (
        <Page
          title="Shopper Credit Score"
          subtitle="See trust, refund behavior, and customer reliability at a glance."
        >
      <Layout>
        <Layout.Section>
          <Banner title="Customer trust scoring is active" tone="info">
            <p>
              Scores combine refund frequency, order completion, fraud signals,
              and payment reliability into a merchant-friendly trust score.
            </p>
          </Banner>
        </Layout.Section>
        {focusMessage ? (
          <Layout.Section>
            <Banner title="Focused customer segment" tone="info">
              <p>{focusMessage}</p>
            </Banner>
          </Layout.Section>
        ) : null}
        <Layout.Section>
          <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">
                  Trusted buyers
                </Text>
                <Text as="p" variant="heading2xl">
                  {summary.trusted}
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">
                  Normal buyers
                </Text>
                <Text as="p" variant="heading2xl">
                  {summary.normal}
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">
                  Risky buyers
                </Text>
                <Text as="p" variant="heading2xl">
                  {summary.risky}
                </Text>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <Tabs
              tabs={[
                { id: "all", content: "All" },
                { id: "trusted", content: "Trusted" },
                { id: "risky", content: "Risky" },
              ]}
              selected={selectedTab}
              onSelect={setSelectedTab}
            >
              <Box paddingBlockStart="400">
                <IndexTable
                  resourceName={resourceName}
                  itemCount={filteredCustomers.length}
                  selectable={false}
                  headings={[
                    { title: "Email" },
                    { title: "Orders" },
                    { title: "Refunds" },
                    { title: "Refund rate" },
                    { title: "Credit score" },
                    { title: "Category" },
                  ]}
                >
                  {filteredCustomers.map((customer, index) => (
                    <IndexTable.Row
                      id={customer.id}
                      key={customer.id}
                      position={index}
                      onClick={() => setActiveCustomer(customer)}
                    >
                      <IndexTable.Cell>{customer.email ?? "Unknown"}</IndexTable.Cell>
                      <IndexTable.Cell>{customer.totalOrders}</IndexTable.Cell>
                      <IndexTable.Cell>{customer.totalRefunds}</IndexTable.Cell>
                      <IndexTable.Cell>
                        {(customer.refundRate * 100).toFixed(1)}%
                      </IndexTable.Cell>
                      <IndexTable.Cell>{customer.creditScore}</IndexTable.Cell>
                      <IndexTable.Cell>
                        <Badge
                          tone={
                            customer.creditCategory === "Trusted Buyer"
                              ? "success"
                              : customer.creditCategory === "Risky Buyer"
                              ? "critical"
                              : "info"
                          }
                        >
                          {customer.creditCategory}
                        </Badge>
                      </IndexTable.Cell>
                    </IndexTable.Row>
                  ))}
                </IndexTable>
              </Box>
            </Tabs>
          </Card>
        </Layout.Section>
      </Layout>

      <Modal
        open={!!activeCustomer}
        onClose={() => setActiveCustomer(null)}
        title={activeCustomer?.email ?? "Customer score"}
        primaryAction={{ content: "Recompute score", onAction: recomputeScore }}
      >
        <Modal.Section>
          {activeCustomer ? (
            <BlockStack gap="300">
              <Text as="p">
                Credit score: <strong>{activeCustomer.creditScore}</strong>
              </Text>
              <Text as="p">
                Category: <strong>{activeCustomer.creditCategory}</strong>
              </Text>
              <Text as="p">
                Refund rate: {(activeCustomer.refundRate * 100).toFixed(1)}%
              </Text>
              <Text as="p">
                Order completion rate: <strong>{activeCustomer.orderCompletionRate}%</strong>
              </Text>
              <Text as="p">
                Payment reliability: <strong>{activeCustomer.paymentReliability}/20</strong>
              </Text>
              <InlineStack gap="200">
                <Badge tone="info">
                  {`${activeCustomer.totalOrders} completed orders`}
                </Badge>
                <Badge tone="warning">
                  {`${activeCustomer.totalRefunds} refunds recorded`}
                </Badge>
                <Badge tone="critical">
                  {`${activeCustomer.fraudSignalsCount} fraud signals`}
                </Badge>
              </InlineStack>
              <Text as="p" tone="subdued">
                Recommendation: combine this shopper score with fraud review and
                weekly reporting before changing fulfillment or refund policy.
              </Text>
              <InlineStack gap="300">
                <Button
                  onClick={() => navigateEmbedded("/fraud?focus=return-abuse")}
                >
                  Review fraud signals
                </Button>
                <Button
                  onClick={() => navigateEmbedded("/reports?focus=highlights")}
                >
                  Open weekly report
                </Button>
                {getCustomerUrl(activeCustomer.shopifyCustomerId) ? (
                  <Button
                    url={getCustomerUrl(activeCustomer.shopifyCustomerId) ?? undefined}
                    external
                  >
                    Open Shopify customer
                  </Button>
                ) : null}
              </InlineStack>
            </BlockStack>
          ) : null}
          </Modal.Section>
          </Modal>
          {toast ? <Toast content={toast} onDismiss={() => setToast(null)} /> : null}
        </Page>
      )}
    </ModuleGate>
  );
}
