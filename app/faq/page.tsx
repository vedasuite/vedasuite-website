import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { defaultVariant } from "@/content/site-content";

export const metadata: Metadata = {
  title: "FAQ | VedaSuite AI",
  description:
    "Read frequently asked questions about VedaSuite AI, Shopify workflows, module coverage, onboarding, and getting started.",
};

export default function FAQPage() {
  return <SiteShell initialVariant={defaultVariant} page="faq" />;
}
