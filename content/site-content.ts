export type VariantKey = "suite" | "ops";

export const siteConfig = {
  brandName: "VedaSuite AI",
  productName: "VedaSuite AI",
  shortTagline: "AI commerce intelligence suite for Shopify merchants",
  domain: "vedasuite.in",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://vedasuite.in",
  email: "abhimanyu@vedasuite.in",
  supportUrl: "https://margarete-conidian-pearlie.ngrok-free.dev/support",
  privacyUrl: "https://margarete-conidian-pearlie.ngrok-free.dev/legal/privacy",
  termsUrl: "https://margarete-conidian-pearlie.ngrok-free.dev/legal/terms",
};

export const defaultVariant: VariantKey = "suite";

export const variantLabels: Record<VariantKey, { short: string; long: string }> = {
  suite: {
    short: "Suite",
    long: "Full suite positioning",
  },
  ops: {
    short: "Ops",
    long: "Operator workflow positioning",
  },
};

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "FAQ", href: "/faq" },
  { label: "Early Access", href: "/early-access" },
];

export const volumeOptions = [
  "Under 500 orders / month",
  "500 - 2,000 orders / month",
  "2,000 - 10,000 orders / month",
  "10,000 - 50,000 orders / month",
  "50,000+ orders / month",
];

export const challengeOptions = [
  "Fraud and chargeback pressure",
  "Competitor pricing and promotion tracking",
  "Pricing optimization and margin decisions",
  "Customer trust and post-purchase risk visibility",
  "Weekly reporting and operational intelligence",
];

type Feature = {
  title: string;
  description: string;
  icon: string;
  comingSoon?: boolean;
};

type FAQ = {
  question: string;
  answer: string;
};

type VariantContent = {
  badge: string;
  headline: string;
  subheadline: string;
  heroStats: Array<{ label: string; value: string; note: string }>;
  painIntro: string;
  painPoints: Array<{ title: string; description: string; icon: string }>;
  solutionTitle: string;
  solutionSteps: Array<{ step: string; title: string; description: string }>;
  features: Feature[];
  benefitsTitle: string;
  benefitsText: string;
  benefits: Array<{ stat: string; label: string; description: string }>;
  trustCards: Array<{ title: string; text: string }>;
  faq: FAQ[];
  finalCtaTitle: string;
  finalCtaText: string;
  installTitle: string;
  installText: string;
};

const sharedFeatures: Feature[] = [
  {
    title: "Fraud Intelligence",
    description:
      "Review high-risk orders, suspicious customer behavior, chargeback exposure, and return-abuse signals from one workflow.",
    icon: "shield",
  },
  {
    title: "Competitor Intelligence",
    description:
      "Track competitor pricing, promotions, stock posture, and market pressure across monitored domains and signal surfaces.",
    icon: "wave",
  },
  {
    title: "AI Pricing Strategy",
    description:
      "Simulate price changes, review AI recommendations, and publish pricing actions back into Shopify.",
    icon: "score",
  },
  {
    title: "Shopper Credit Score",
    description:
      "Score customer trust using refund history, fraud signals, payment reliability, and completion behavior.",
    icon: "profile",
  },
  {
    title: "AI Profit Optimization",
    description:
      "Identify margin lift opportunities and use structured playbooks to protect profit across key products.",
    icon: "spark",
  },
  {
    title: "Weekly Intelligence Reports",
    description:
      "Turn fraud, competitor, pricing, and profit signals into one executive-ready weekly operating brief.",
    icon: "alert",
  },
];

const sharedFaq: FAQ[] = [
  {
    question: "What is VedaSuite AI?",
    answer:
      "VedaSuite AI is an AI commerce intelligence suite for Shopify merchants that combines fraud intelligence, competitor monitoring, AI pricing strategy, shopper trust scoring, profit optimization, and weekly reporting in one embedded app.",
  },
  {
    question: "Is it embedded inside Shopify Admin?",
    answer:
      "Yes. VedaSuite AI is designed as an embedded Shopify app so merchants can work from inside Shopify Admin without relying on disconnected tools.",
  },
  {
    question: "Who is VedaSuite AI built for?",
    answer:
      "It is built for Shopify founders, operators, revenue teams, and merchants managing fraud, pricing, competition, and margin decisions.",
  },
  {
    question: "What does the competitor module do?",
    answer:
      "It helps merchants track competitor pricing, promotion pressure, stock posture, and market movement so they can make more disciplined pricing decisions.",
  },
  {
    question: "Does the app help with profitability too?",
    answer:
      "Yes. VedaSuite AI includes AI pricing strategy and profit optimization workflows to help merchants protect margin and identify higher-value actions.",
  },
  {
    question: "Can I start small and expand later?",
    answer:
      "Yes. The plan structure allows merchants to begin with lighter access and expand into the full suite as their operating needs grow.",
  },
];

export const variantContent: Record<VariantKey, VariantContent> = {
  suite: {
    badge: "Embedded commerce intelligence for Shopify",
    headline:
      "Run fraud, competitor monitoring, pricing, shopper trust, and profit decisions from one Shopify app.",
    subheadline:
      "VedaSuite AI gives Shopify merchants a unified operating layer for fraud defense, competitor response, AI pricing, shopper credit scoring, profit optimization, and weekly intelligence reporting.",
    heroStats: [
      {
        label: "Suite modules",
        value: "9",
        note: "dashboard, fraud, competitor, pricing, credit, profit, reports, settings, and plans",
      },
      {
        label: "Operational view",
        value: "1",
        note: "one embedded system instead of disconnected workflows",
      },
      {
        label: "Decision focus",
        value: "Live",
        note: "risk, market pressure, pricing, trust, and margin in one place",
      },
    ],
    painIntro:
      "Fraud sits in one workflow, competitor tracking happens elsewhere, pricing lives in spreadsheets, and profit decisions stay reactive. Merchants need one connected operating layer.",
    painPoints: [
      {
        title: "Fraud and return abuse are reviewed too late",
        description:
          "By the time teams connect the pattern, losses, refunds, or chargeback exposure have already compounded.",
        icon: "shield",
      },
      {
        title: "Competitor movement is hard to monitor consistently",
        description:
          "Price changes, promotions, and stock shifts happen across websites, shopping surfaces, and ads without a single shared view.",
        icon: "wave",
      },
      {
        title: "Pricing decisions happen without a system",
        description:
          "Merchants often change price without a connected view of competitor pressure, margin lift, and projected gain.",
        icon: "score",
      },
      {
        title: "Customer trust is unclear at decision time",
        description:
          "Teams need refund behavior, fraud signals, and payment reliability before they make support or fulfillment decisions.",
        icon: "profile",
      },
    ],
    solutionTitle: "One suite. Multiple intelligence workflows. One embedded operating system.",
    solutionSteps: [
      {
        step: "01",
        title: "Install once inside Shopify",
        description:
          "Connect VedaSuite AI as one embedded app instead of stacking disconnected point tools.",
      },
      {
        step: "02",
        title: "Sync store and market signals",
        description:
          "Bring in orders, customers, products, fraud indicators, and competitor activity into one shared intelligence layer.",
      },
      {
        step: "03",
        title: "Review what matters most",
        description:
          "Use fraud queues, market monitoring, pricing simulations, and customer trust scoring to focus attention where it matters.",
      },
      {
        step: "04",
        title: "Act with confidence",
        description:
          "Publish prices, investigate risk, open Shopify entities directly, and align teams through weekly reports.",
      },
    ],
    features: sharedFeatures,
    benefitsTitle: "Why merchants choose VedaSuite AI",
    benefitsText:
      "The value is not just more data. It is better operating decisions across fraud, pricing, competition, and margin.",
    benefits: [
      {
        stat: "Faster response",
        label: "React to risk and market movement quickly",
        description:
          "Move from insight to action without bouncing between separate tools and disconnected workflows.",
      },
      {
        stat: "Stronger decisions",
        label: "Give operators better context before they act",
        description:
          "Connect customer, order, pricing, and competitor signals so teams can make clearer calls.",
      },
      {
        stat: "Protected margin",
        label: "Improve pricing and profit discipline",
        description:
          "Use AI recommendations and profit playbooks to protect margin while still staying competitive.",
      },
    ],
    trustCards: [
      {
        title: "Built as a Shopify suite app",
        text: "One installation unlocks connected workflows across fraud, pricing, market monitoring, shopper trust, and reporting.",
      },
      {
        title: "Designed for operators",
        text: "VedaSuite AI is structured around queues, actions, reports, and real merchant workflows, not just dashboards.",
      },
      {
        title: "Native to Shopify Admin",
        text: "The product is designed to feel operationally useful inside Shopify, with direct links back into the platform.",
      },
    ],
    faq: sharedFaq,
    finalCtaTitle:
      "Bring store intelligence into one workflow.",
    finalCtaText:
      "VedaSuite AI gives Shopify merchants a more disciplined way to manage risk, pricing, competition, customer trust, and margin from one embedded operating system.",
    installTitle: "Request a product walkthrough",
    installText:
      "VedaSuite AI is being positioned as a premium Shopify intelligence suite. Use the website to request a walkthrough, ask questions, or join early access conversations.",
  },
  ops: {
    badge: "Operating layer for modern Shopify teams",
    headline:
      "Give fraud, pricing, market, and margin decisions one connected workflow.",
    subheadline:
      "VedaSuite AI helps founders and operators review store risk, customer trust, competitor movement, pricing actions, and profit opportunities inside Shopify Admin.",
    heroStats: [
      {
        label: "Decision surfaces",
        value: "5+",
        note: "fraud, competitor, pricing, customer trust, and profit views in one system",
      },
      {
        label: "Executive brief",
        value: "Weekly",
        note: "aligned reporting across risk, market, pricing, and margin",
      },
      {
        label: "Merchant outcome",
        value: "Clearer",
        note: "faster calls on operations, pricing, and customer risk",
      },
    ],
    painIntro:
      "Most teams do not need more dashboards. They need a cleaner operating layer for the decisions they already make every day.",
    painPoints: [
      {
        title: "Teams review risk without enough context",
        description:
          "Order-level and customer-level intelligence is often fragmented between support, ops, and finance workflows.",
        icon: "profile",
      },
      {
        title: "Competitor response is reactive",
        description:
          "Merchants often see competitor promotions too late and respond without knowing whether the move is worth matching.",
        icon: "wave",
      },
      {
        title: "Pricing and profit decisions are disconnected",
        description:
          "Price changes happen without a consistent model for expected lift, margin impact, or downstream profitability.",
        icon: "score",
      },
      {
        title: "Leadership lacks one operating brief",
        description:
          "Weekly insight is scattered across exports, spreadsheets, and disconnected point tools.",
        icon: "alert",
      },
    ],
    solutionTitle: "Give every store decision a stronger intelligence layer.",
    solutionSteps: [
      {
        step: "01",
        title: "Connect store operations",
        description:
          "Bring order, customer, pricing, and risk signals into a single Shopify-native workspace.",
      },
      {
        step: "02",
        title: "Monitor market and customer behavior",
        description:
          "Track competitor pressure, refund behavior, fraud exposure, and customer trust from one suite.",
      },
      {
        step: "03",
        title: "Run pricing and profit workflows",
        description:
          "Simulate price changes, review recommendations, and assess margin opportunities before acting.",
      },
      {
        step: "04",
        title: "Lead with a weekly brief",
        description:
          "Give operators and leadership one report to align fraud, competition, pricing, and profitability priorities.",
      },
    ],
    features: sharedFeatures,
    benefitsTitle: "Built for high-context merchant operations",
    benefitsText:
      "VedaSuite AI is for merchants who want less guesswork and more structure in how store decisions get made.",
    benefits: [
      {
        stat: "Less fragmentation",
        label: "Connect multiple workflows in one suite",
        description:
          "Fraud, competitor monitoring, pricing, and profit strategy can now live inside one operating system.",
      },
      {
        stat: "Higher clarity",
        label: "Improve merchant decision confidence",
        description:
          "Give teams enough context to act without needing to reconstruct the situation from multiple tools.",
      },
      {
        stat: "Better discipline",
        label: "Create a stronger operating rhythm",
        description:
          "Use weekly reports and in-app workflows to make decisions more systematic and less reactive.",
      },
    ],
    trustCards: [
      {
        title: "Structured for real operator workflows",
        text: "The suite is organized around review queues, strategy tabs, reports, and merchant controls instead of static analytics alone.",
      },
      {
        title: "Made for Shopify-native execution",
        text: "The product is designed to keep merchants in Shopify while still supporting richer intelligence decisions.",
      },
      {
        title: "Designed to scale with merchant maturity",
        text: "Merchants can start with focused module access and expand into the full intelligence suite as they grow.",
      },
    ],
    faq: sharedFaq,
    finalCtaTitle:
      "Operate your Shopify store with intelligence, not guesswork.",
    finalCtaText:
      "VedaSuite AI helps teams make faster, sharper calls on fraud, pricing, competition, shopper trust, and profit from one connected suite.",
    installTitle: "Book a VedaSuite walkthrough",
    installText:
      "Use this site to request a walkthrough of the suite, review capabilities, and start a conversation about fit for your store.",
  },
};

export function resolveVariant(value?: string): VariantKey | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized === "suite" || normalized === "a") return "suite";
  if (normalized === "ops" || normalized === "b") return "ops";
  return null;
}
