import { SectionHeading } from "@/components/section-heading";
import { type VariantKey, variantContent } from "@/content/site-content";

type BenefitsSectionProps = {
  variant: VariantKey;
};

export function BenefitsSection({ variant }: BenefitsSectionProps) {
  const content = variantContent[variant];

  return (
    <section className="section-shell mt-20 sm:mt-24">
      <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
        <div className="section-card p-8 sm:p-10">
          <SectionHeading
            eyebrow="Business outcomes"
            title={content.benefitsTitle}
            description={content.benefitsText}
          />

          <div className="mt-8 space-y-3">
            {[
              "Bring fraud, customer trust, pricing, competitor movement, and profit signals into one operating layer.",
              "Give founders and operators enough context to act without rebuilding the story from multiple tools.",
              "Create a stronger rhythm for protecting margin, responding to market pressure, and leading weekly reviews.",
            ].map((item) => (
              <div key={item} className="section-subtle px-4 py-3 text-sm leading-7 text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {content.benefits.map((item) => (
            <article
              key={item.label}
              className="section-card flex h-full flex-col justify-between p-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,23,42,0.08)] sm:p-7"
            >
              <div>
                <p className="font-[var(--font-heading)] text-[2rem] font-semibold tracking-[-0.04em] text-slate-950">
                  {item.stat}
                </p>
                <h3 className="mt-4 text-[1.05rem] font-semibold tracking-[-0.025em] text-slate-950">{item.label}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              </div>
              <div className="mt-6 h-px bg-slate-200" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
