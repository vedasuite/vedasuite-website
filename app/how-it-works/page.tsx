import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { defaultVariant } from "@/content/site-content";

export const metadata: Metadata = {
  title: "How It Works | VedaSuite AI",
  description:
    "See how VedaSuite AI connects Shopify store signals, competitor movement, pricing decisions, shopper trust, and profit workflows inside one embedded system.",
};

export default function HowItWorksPage() {
  return <SiteShell initialVariant={defaultVariant} page="how-it-works" />;
}
