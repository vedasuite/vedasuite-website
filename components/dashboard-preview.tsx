export function DashboardPreview() {
  return (
    <section className="section-shell mt-20 sm:mt-24">
      <div className="section-card premium-dark-panel overflow-hidden">
        <div className="border-b border-white/10 px-6 py-8 text-white sm:px-8 sm:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="eyebrow border-white/10 bg-white/5 text-slate-300">Dashboard preview</span>
              <h2 className="prose-balance mt-4 max-w-3xl font-[var(--font-heading)] text-[2rem] font-semibold tracking-[-0.035em] text-white sm:text-[2.65rem]">
                A premium operating view that makes the suite feel useful immediately.
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                Sample data only. Designed to feel like a real commerce intelligence workspace with clear market, risk, pricing, and profit action paths.
              </p>
            </div>
            <div className="grid max-w-sm grid-cols-2 gap-3">
              {[
                ["Signals", "Orders, customers, products, competitors"],
                ["Outputs", "Scores, simulations, alerts, actions"],
              ].map(([label, text]) => (
                <div key={label} className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
                  <p className="mt-2 text-sm text-slate-200">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 bg-slate-950 px-6 py-8 text-white sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["High-risk orders", "27", "+12% vs last week"],
                ["Competitor shifts", "14", "5 promotions and 9 price changes"],
                ["Projected margin gain", "$6,420", "Modeled monthly impact"],
              ].map(([label, value, note]) => (
                <div key={label} className="rounded-[24px] border border-white/10 bg-white/[0.06] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white">{value}</p>
                  <p className="mt-2 text-sm text-slate-300">{note}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold tracking-[-0.02em] text-white">Store intelligence trendline</h3>
                  <p className="mt-1 text-sm text-slate-400">Sample view of fraud pressure, market movement, and pricing action over the last 30 days</p>
                </div>
                <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-300">
                  AI monitored
                </span>
              </div>
              <div className="mt-8 flex h-56 items-end gap-3">
                {[38, 42, 55, 44, 60, 58, 74, 68, 64, 78, 83, 76].map((height, index) => (
                  <div key={`dashboard-bar-${index}-${height}`} className="relative flex-1">
                    <div className="absolute inset-x-0 bottom-0 h-full rounded-t-[20px] bg-white/[0.03]" />
                    <div
                      className="absolute inset-x-0 bottom-0 rounded-t-[20px] bg-gradient-to-t from-emerald-400 via-cyan-400 to-sky-500 shadow-[0_0_24px_rgba(34,211,238,0.12)]"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold tracking-[-0.02em] text-white">Priority operating queue</h3>
                <span className="text-sm text-slate-400">Last refreshed 2 minutes ago</span>
              </div>
              <div className="mt-5 overflow-hidden rounded-[22px] border border-white/10 bg-black/10">
                <div className="hidden grid-cols-[1.2fr_0.75fr_1.15fr_0.75fr] bg-white/[0.04] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:grid">
                  <span>Workflow</span>
                  <span>Priority</span>
                  <span>Reason</span>
                  <span>Action</span>
                </div>
                {[
                  ["Fraud review", "82", "Address change + claim history", "Review"],
                  ["Competitor response", "74", "Tracked domain launched a promotion", "Respond"],
                  ["Pricing publish", "68", "One recommendation is approved and ready", "Publish"],
                ].map(([order, risk, reason, action]) => (
                  <div key={order}>
                    <div className="hidden grid-cols-[1.2fr_0.75fr_1.15fr_0.75fr] border-t border-white/10 px-4 py-3 text-sm text-slate-200 sm:grid">
                      <span className="font-semibold text-white">{order}</span>
                      <span>{risk}</span>
                      <span>{reason}</span>
                      <span className="text-cyan-300">{action}</span>
                    </div>
                    <div className="border-t border-white/10 px-4 py-4 text-sm text-slate-200 sm:hidden">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-white">{order}</span>
                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-cyan-300">
                          {action}
                        </span>
                      </div>
                      <p className="mt-2 text-slate-300">Priority score: {risk}</p>
                      <p className="mt-1 text-slate-300">{reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold tracking-[-0.02em] text-white">Customer trust signals</h3>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">Profiles</span>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["Trusted buyer", "Strong payment reliability and low refund rate", "Healthy"],
                  ["Watch account", "Refund frequency rising over the last 45 days", "Medium"],
                  ["Risky buyer", "Multiple addresses with shared device fingerprint", "High"],
                ].map(([label, note, risk]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-white">{label}</p>
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200">
                        {risk}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold tracking-[-0.02em] text-white">Recent intelligence signals</h3>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  Live queue
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["Competitor pulse", "Two tracked domains moved price on overlapping hero SKUs"],
                  ["Pricing engine", "Recommended increase holds margin while keeping market posture stable"],
                  ["Fraud queue", "One high-risk first-time buyer order requires manual review"],
                  ["Profit playbook", "Bundle defense opportunity opened on a slower-moving SKU cluster"],
                ].map(([title, detail]) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <p className="font-semibold text-white">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
