import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { siteConfig } from "@/content/site-content";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: `${siteConfig.productName} | AI commerce intelligence suite for Shopify merchants`,
  description:
    "VedaSuite AI helps Shopify merchants run fraud intelligence, competitor monitoring, AI pricing, shopper trust scoring, profit optimization, and reporting from one embedded operating layer.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${siteConfig.productName} | AI commerce intelligence suite for Shopify merchants`,
    description:
      "Run fraud, competitor monitoring, pricing, shopper trust, and profit decisions from one premium Shopify-native suite.",
    url: siteConfig.siteUrl,
    siteName: siteConfig.brandName,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${siteConfig.productName} product overview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.productName} | Shopify commerce intelligence`,
    description:
      "A premium embedded suite for fraud intelligence, competitor response, AI pricing, shopper trust, and margin decisions.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="font-[var(--font-body)] antialiased"
        style={
          {
            "--font-heading": '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
            "--font-body": '"Aptos", "Segoe UI", Inter, Arial, sans-serif',
          } as CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
