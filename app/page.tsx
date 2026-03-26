import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { defaultVariant } from "@/content/site-content";

export const metadata: Metadata = {
  title: "VedaSuite AI | AI commerce intelligence suite for Shopify merchants",
  description:
    "Explore VedaSuite AI, the premium Shopify suite for fraud intelligence, competitor monitoring, AI pricing, shopper trust scoring, profit optimization, and executive reporting.",
};

export default function HomePage() {
  return <SiteShell initialVariant={defaultVariant} page="home" />;
}
