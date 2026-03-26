export function CinematicShowcase() {
  return (
    <section className="section-shell mt-20 sm:mt-24">
      <div className="section-card overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
          <div
            className="premium-dark-panel hero-grid relative overflow-hidden border-b border-white/10 p-8 text-white sm:p-10 lg:border-b-0 lg:border-r lg:border-white/10"
            style={{
              background:
                "radial-gradient(circle at 18% 10%, rgba(216, 168, 74, 0.08), transparent 22%), radial-gradient(circle at 86% 24%, rgba(109, 69, 110, 0.1), transparent 18%), linear-gradient(135deg, #0b1220 0%, #141d31 48%, #1b2640 100%)",
            }}
          >
            <div className="pointer-events-none absolute -left-8 top-8 h-28 w-28 rounded-full bg-amber-300/6 blur-3xl" />
            <div className="pointer-events-none absolute right-10 top-16 h-24 w-24 rounded-full bg-fuchsia-300/6 blur-3xl" />
            <p className="editorial-kicker text-slate-200">Platform view</p>
            <h2 className="prose-balance mt-4 max-w-2xl font-[var(--font-heading)] text-[2.05rem] font-semibold tracking-[-0.045em] text-white sm:text-[2.7rem]">
              A commerce intelligence layer that feels cinematic before it feels technical.
            </h2>
            <p className="mt-5 max-w-2xl text-[1.02rem] leading-8 text-slate-100">
              VedaSuite AI is designed to feel like a premium operating environment inside Shopify, with distinct surfaces for risk, market movement, pricing action, customer trust, and weekly reporting.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-[1.05fr_0.95fr]">
              <div
                className="rounded-[28px] border border-white/12 bg-slate-900/82 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                style={{ backgroundColor: "rgba(15, 23, 42, 0.86)" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">Executive command view</p>
                  <span className="rounded-full bg-white/12 px-3 py-1 text-[11px] font-semibold text-slate-100">Live suite</span>
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    ["Fraud alerts today", "12"],
                    ["Competitor promotions", "5"],
                    ["Pricing approvals", "3"],
                    ["Projected profit gain", "$3.2k"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-[18px] border border-white/12 bg-slate-800/88 px-4 py-3"
                      style={{ backgroundColor: "rgba(30, 41, 59, 0.9)" }}
                    >
                      <span className="text-sm text-slate-100">{label}</span>
                      <span className="text-sm font-semibold text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div
                  className="rounded-[26px] border border-white/12 bg-slate-900/82 p-5"
                  style={{ backgroundColor: "rgba(15, 23, 42, 0.86)" }}
                >
                  <p className="editorial-kicker text-slate-200">Response strategy</p>
                  <p className="mt-3 text-lg font-semibold text-white">Hold price or defend with bundles?</p>
                  <p className="mt-2 text-sm leading-7 text-slate-100">
                    Competitor pressure and margin exposure are compared in the same workflow so response decisions stay disciplined.
                  </p>
                </div>
                <div
                  className="rounded-[26px] border border-white/12 bg-gradient-to-br from-slate-800/88 to-slate-900/84 p-5"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.88))",
                  }}
                >
                  <p className="editorial-kicker text-slate-200">Shopper trust</p>
                  <p className="mt-3 text-lg font-semibold text-white">Trusted, normal, and risky buyer segments</p>
                  <p className="mt-2 text-sm leading-7 text-slate-100">
                    Customer trust scoring sits alongside fraud review instead of being buried in support history.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="warm-panel p-8 sm:p-10">
            <p className="editorial-kicker">Why the product feels different</p>
            <div className="mt-6 grid gap-4">
              {[
                [
                  "Designed as a suite app",
                  "One installation unlocks multiple connected workflows instead of stacking isolated point tools.",
                ],
                [
                  "Built around action",
                  "The product moves from detection to decision to execution rather than stopping at analytics.",
                ],
                [
                  "Native to Shopify",
                  "Operators can jump directly into orders, products, and customers without leaving the workflow.",
                ],
              ].map(([title, text], index) => (
                <div key={title} className={`section-subtle soft-ring px-5 py-5 ${index === 1 ? "translate-x-0 sm:translate-x-4" : ""}`}>
                  <p className="text-[1.02rem] font-semibold tracking-[-0.025em] text-slate-950">{title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
                </div>
              ))}
            </div>

            <div className="story-divider mt-8 h-px w-full" />

            <div className="mt-8 rounded-[26px] border border-white/70 bg-white/72 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <p className="editorial-kicker">Merchant outcome</p>
              <p className="mt-3 text-[1.55rem] font-semibold tracking-[-0.04em] text-slate-950">
                Fewer fragmented decisions. More commercial clarity.
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                The suite is designed for merchants who need better judgment across fraud, pricing, market pressure, trust, and margin without adding more operational noise.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
