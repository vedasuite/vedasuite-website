import { BrandLogo } from "@/components/brand-logo";
import { siteConfig, type VariantKey, variantContent } from "@/content/site-content";

type HeroProps = {
  variant: VariantKey;
  onJoinWaitlist: () => void;
  onHowItWorks: () => void;
  onInstallClick: () => void;
  onVariantChange: (variant: VariantKey) => void;
};

export function Hero({
  variant,
  onJoinWaitlist,
  onHowItWorks,
  onInstallClick,
}: HeroProps) {
  const content = variantContent[variant];

  return (
    <section id="hero" className="section-shell pt-7 sm:pt-10">
      <div className="section-card luxury-frame hero-shell overflow-hidden px-6 py-8 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="fade-up">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-3 rounded-[22px] border border-white/80 bg-white/88 px-4 py-2.5 shadow-sm">
                <BrandLogo className="h-7 sm:h-8" />
              </div>
              <span className="surface-label">Premium Shopify intelligence suite</span>
            </div>

            <span className="eyebrow">{content.badge}</span>

            <h1 className="prose-balance mt-6 max-w-3xl font-[var(--font-heading)] text-[2.7rem] font-semibold tracking-[-0.055em] text-slate-950 sm:text-[3.7rem] lg:text-[4.15rem]">
              {content.headline}
            </h1>
            <p className="prose-balance mt-5 max-w-[37rem] text-[1.01rem] leading-8 text-slate-600 sm:text-[1.06rem]">
              {content.subheadline}
            </p>

            <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                "Detect risk before it becomes loss",
                "Respond faster to competitor moves",
                "Protect margin with AI pricing and profit strategy",
              ].map((point) => (
                <div key={point} className="section-subtle soft-ring px-4 py-3 text-sm leading-6 text-slate-700">
                  {point}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                className="button-accent shadow-[0_16px_35px_rgba(14,165,233,0.22)]"
                onClick={onJoinWaitlist}
              >
                Book a demo
              </button>
              <button type="button" className="button-secondary" onClick={onHowItWorks}>
                See how it works
              </button>
              <button type="button" className="button-secondary" onClick={onInstallClick}>
                Join early access
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
              <span>Built for Shopify merchants</span>
              <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" />
              <span>Designed for operators managing fraud, pricing, and margin</span>
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-3">
              {content.heroStats.map((stat) => (
                <div key={stat.label} className="section-subtle soft-ring p-5 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{stat.label}</p>
                  <p className="mt-3 font-[var(--font-heading)] text-[1.7rem] font-semibold tracking-[-0.04em] text-slate-950">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{stat.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="fade-up-delay">
            <div
              className="premium-dark-panel hero-grid relative rounded-[34px] border border-white/10 p-3 text-white sm:p-4"
              style={{
                background:
                  "radial-gradient(circle at 18% 10%, rgba(216, 168, 74, 0.08), transparent 22%), radial-gradient(circle at 86% 24%, rgba(109, 69, 110, 0.1), transparent 18%), linear-gradient(135deg, #0b1220 0%, #141d31 48%, #1b2640 100%)",
              }}
            >
              <div className="pointer-events-none absolute -right-6 top-10 h-20 w-20 rounded-full bg-cyan-400/8 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-6 left-10 h-20 w-20 rounded-full bg-emerald-400/6 blur-3xl" />
              <div className="pointer-events-none absolute left-[18%] top-[8%] h-28 w-28 rounded-full bg-amber-300/8 blur-3xl" />

              <div
                className="relative rounded-[28px] border border-white/12 bg-slate-950/96 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                style={{ backgroundColor: "rgba(2, 6, 23, 0.95)" }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{siteConfig.productName} workspace</p>
                    <p className="mt-1 text-sm leading-6 text-slate-200">
                      Example of how teams review fraud, market movement, pricing, and margin
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-400/18 px-3 py-1 text-xs font-semibold text-emerald-200">
                    Embedded app
                  </span>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {[
                    ["High-risk orders", "12", "Flagged for review today"],
                    ["Competitor signals", "26", "Market changes in the last 24h"],
                    ["Projected gain", "$3.2k", "Monthly upside from current recommendations"],
                  ].map(([label, value, note]) => (
                    <div
                      key={label}
                      className="rounded-[22px] border border-white/12 bg-slate-800/88 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                      style={{ backgroundColor: "rgba(30, 41, 59, 0.88)" }}
                    >
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">{label}</p>
                      <p className="mt-3 text-[1.85rem] font-semibold tracking-[-0.04em] text-white">{value}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-200">{note}</p>
                    </div>
                  ))}
                </div>

                <div
                  className="mt-5 flex items-center justify-between rounded-[22px] border border-white/12 bg-slate-800/84 px-4 py-3"
                  style={{ backgroundColor: "rgba(30, 41, 59, 0.84)" }}
                >
                  <div>
                    <p className="editorial-kicker text-slate-300">Executive ribbon</p>
                    <p className="mt-1 text-sm leading-6 text-slate-100">One suite connecting risk, pricing, competition, trust, and margin.</p>
                  </div>
                  <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-slate-100">Suite app</span>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                  <div
                    className="rounded-[24px] border border-white/12 bg-slate-800/84 p-4"
                    style={{ backgroundColor: "rgba(30, 41, 59, 0.84)" }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">Store intelligence trendline</p>
                      <p className="text-xs text-slate-300">Last 14 days</p>
                    </div>
                    <div className="mt-5 flex h-40 items-end gap-2">
                      {[28, 48, 32, 70, 60, 82, 54, 66, 46, 72, 64, 52, 76, 58].map((height, index) => (
                        <div key={`hero-bar-${index}-${height}`} className="relative flex-1">
                          <div className="absolute inset-x-0 bottom-0 h-full rounded-t-2xl bg-white/[0.03]" />
                          <div
                            className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-gradient-to-t from-cyan-400 via-sky-400 to-blue-500"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className="rounded-[24px] border border-white/12 bg-slate-800/84 p-4"
                    style={{ backgroundColor: "rgba(30, 41, 59, 0.84)" }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">Signal feed</p>
                      <p className="text-xs text-slate-300">Updated 2 min ago</p>
                    </div>
                    <div className="mt-4 space-y-3">
                      {[
                        ["Fraud queue", "A high-risk order needs manual review before fulfillment", "Review"],
                        ["Competitor pulse", "A tracked domain launched a promotion on a hero product", "Respond"],
                        ["Pricing engine", "One recommendation is ready for approval and Shopify publish", "Approve"],
                      ].map(([title, note, status]) => (
                        <div
                          key={title}
                          className="rounded-2xl border border-white/12 bg-slate-900/88 p-3"
                          style={{ backgroundColor: "rgba(15, 23, 42, 0.88)" }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-white">{title}</p>
                            <span className="rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-semibold text-slate-100">
                              {status}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-200">{note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Customer trust labels", "Trusted buyer, normal buyer, risky buyer"],
                    ["Recommended next steps", "Review fraud, evaluate market response, publish pricing, or open reports"],
                  ].map(([title, note]) => (
                    <div
                      key={title}
                      className="rounded-[22px] border border-white/12 bg-slate-800/84 p-4"
                      style={{ backgroundColor: "rgba(30, 41, 59, 0.84)" }}
                    >
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-200">{note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
