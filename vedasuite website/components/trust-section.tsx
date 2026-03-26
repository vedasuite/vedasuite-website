import { SectionHeading } from "@/components/section-heading";
import { type VariantKey, variantContent } from "@/content/site-content";

type TrustSectionProps = {
  variant: VariantKey;
};

export function TrustSection({ variant }: TrustSectionProps) {
  const content = variantContent[variant];

  return (
    <section className="section-shell mt-20 sm:mt-24">
      <div className="grid gap-6 lg:grid-cols-[0.96fr_1.04fr]">
        <div className="section-card luxury-frame overflow-hidden p-8 sm:p-10">
          <SectionHeading
            eyebrow="Why it wins"
            title="Built for modern Shopify operators who need more than disconnected analytics."
            description="VedaSuite AI is designed to feel native inside Shopify while still giving merchants the context, structure, and execution paths they need to make better decisions."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="ink-panel rounded-[26px] border border-white/10 p-6 text-white sm:p-7">
              <p className="editorial-kicker text-slate-300">Operating principle</p>
              <p className="mt-4 text-[1.7rem] font-semibold tracking-[-0.04em] text-white">
                Store intelligence should help teams act, not just explain what happened last week.
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                VedaSuite AI is built around direct Shopify handoffs, review queues, response strategy workflows, pricing action, and weekly operating rhythm.
              </p>
            </div>

            <div className="warm-panel rounded-[26px] border border-white/70 p-6 sm:p-7">
              <p className="editorial-kicker">What this means</p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                <p>Merchants do not need another reporting surface that stops at visibility.</p>
                <p>They need a system that connects risk, market movement, and margin decisions to real next steps.</p>
                <p>That is the lens behind the entire VedaSuite AI product story.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {content.trustCards.map((item) => (
            <article key={item.title} className="section-card luxury-frame h-full p-6 sm:p-7">
              <span className="surface-label">Trust signal</span>
              <h3 className="mt-5 text-[1.12rem] font-semibold tracking-[-0.025em] text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
