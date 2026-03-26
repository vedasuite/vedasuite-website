import { SectionHeading } from "@/components/section-heading";
import { type VariantKey, variantContent } from "@/content/site-content";

type HowItWorksProps = {
  variant: VariantKey;
};

export function HowItWorks({ variant }: HowItWorksProps) {
  const content = variantContent[variant];

  return (
    <section id="how-it-works" className="section-shell mt-20 sm:mt-24">
      <div className="section-card luxury-frame overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="ink-panel border-b border-white/8 p-8 text-white sm:p-10 lg:border-b-0 lg:border-r lg:border-white/10">
            <p className="editorial-kicker text-slate-300">How it works</p>
            <h2 className="prose-balance mt-4 font-[var(--font-heading)] text-[2.1rem] font-semibold tracking-[-0.045em] text-white sm:text-[2.7rem]">
              {content.solutionTitle}
            </h2>
            <p className="mt-5 max-w-xl text-[1.02rem] leading-8 text-slate-300">
              A connected operating layer for teams that need faster decisions across fraud, competition, pricing, customer trust, and profit.
            </p>

            <div className="story-divider mt-8 h-px w-full opacity-60" />

            <div className="mt-8 space-y-4">
              {[
                "Detect live order, customer, product, and market signals.",
                "Decide with scoring, comparison, and AI-guided workflows.",
                "Act inside Shopify with direct links, pricing publishes, and operational review queues.",
              ].map((item) => (
                <div key={item} className="rounded-[22px] border border-white/10 bg-white/[0.06] px-4 py-3 text-sm leading-7 text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="editorial-kicker">Operating sequence</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">VedaSuite AI is structured as a deliberate flow from signal capture to merchant action.</p>
              </div>
              <span className="surface-label hidden sm:inline-flex">One installation, multiple workflows</span>
            </div>

            <div className="grid gap-4">
            {content.solutionSteps.map((item, index) => (
              <article
                key={item.step}
                className="relative section-subtle soft-ring p-6 sm:p-7"
              >
                {index < content.solutionSteps.length - 1 ? (
                  <span className="absolute left-10 top-full hidden h-8 w-px bg-gradient-to-b from-amber-400/50 to-transparent lg:block" />
                ) : null}
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
                  <div className="premium-dark-panel flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold text-white shadow-sm">
                    {item.step}
                  </div>
                  <div className="max-w-2xl">
                    <h3 className="text-[1.12rem] font-semibold tracking-[-0.025em] text-slate-950">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                  </div>
                </div>
              </article>
            ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
