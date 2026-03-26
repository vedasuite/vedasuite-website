import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { defaultVariant } from "@/content/site-content";

export const metadata: Metadata = {
  title: "Early Access | VedaSuite AI",
  description:
    "Request a VedaSuite AI walkthrough or start an early access conversation for your Shopify store.",
};

export default function EarlyAccessPage() {
  return <SiteShell initialVariant={defaultVariant} page="early-access" />;
}
