import { ImageResponse } from "next/og";
import { siteConfig } from "@/content/site-content";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background:
            "radial-gradient(circle at top left, rgba(245,158,11,0.24), transparent 30%), radial-gradient(circle at top right, rgba(99,102,241,0.28), transparent 24%), linear-gradient(180deg, #0b1020 0%, #141c2f 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            borderRadius: 999,
            padding: "10px 18px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            fontSize: 24,
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              background: "#ffffff",
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            V
          </div>
          {siteConfig.brandName}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 900 }}>
          <div style={{ fontSize: 68, lineHeight: 1.05, fontWeight: 700 }}>
            {"Run fraud, competitor, pricing, shopper trust, and profit decisions from one Shopify suite."}
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.45, color: "rgba(226,232,240,0.92)" }}>
            {`Premium commerce intelligence for Shopify merchants on ${siteConfig.domain}.`}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 24,
            color: "rgba(226,232,240,0.88)",
          }}
        >
          <div>{siteConfig.productName}</div>
          <div>{siteConfig.siteUrl}</div>
        </div>
      </div>
    ),
    size
  );
}
