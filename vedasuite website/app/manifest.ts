import type { MetadataRoute } from "next";
import { siteConfig } from "@/content/site-content";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.productName,
    short_name: "VedaSuite",
    description:
      "AI commerce intelligence suite for Shopify merchants.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7fb",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
      },
    ],
  };
}
