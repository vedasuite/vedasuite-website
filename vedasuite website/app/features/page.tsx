import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { defaultVariant } from "@/content/site-content";

export const metadata: Metadata = {
  title: "Features | VedaSuite AI",
  description:
    "Explore VedaSuite AI modules for fraud intelligence, competitor monitoring, AI pricing, shopper trust scoring, profit optimization, and weekly reporting.",
};

export default function FeaturesPage() {
  return <SiteShell initialVariant={defaultVariant} page="features" />;
}
