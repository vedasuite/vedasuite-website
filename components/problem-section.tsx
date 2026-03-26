import { ClockIcon, GridIcon, LoopIcon, ProfileIcon, ShieldIcon, WaveIcon } from "@/components/icons";
import { SectionHeading } from "@/components/section-heading";
import { type VariantKey, variantContent } from "@/content/site-content";

const iconMap = {
  loop: LoopIcon,
  clock: ClockIcon,
  profile: ProfileIcon,
  shield: ShieldIcon,
  wave: WaveIcon,
  grid: GridIcon,
};

type ProblemSectionProps = {
  variant: VariantKey;
};

export function ProblemSection({ variant }: ProblemSectionProps) {
  const content = variantContent[variant];

  return (
    <section className="section-shell mt-20 sm:mt-24">
      <div className="section-card luxury-frame overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="warm-panel border-b border-white/70 p-8 sm:p-10 lg:border-b-0 lg:border-r">
            <SectionHeading
              eyebrow="Merchant pain"
              title="Most Shopify teams are still forced to run store intelligence from disconnected systems."
              description={content.painIntro}
            />

            <div className="story-divider mt-8 h-px w-full" />

            <div className="mt-8 space-y-4">
              {[
                ["Operations", "Merchants need one place to review what changed, what matters, and what to do next."],
                ["Leadership", "Founders and operators need one weekly operating brief instead of fragmented reporting."],
                ["Commercial pressure", "Competitor changes, refund behavior, and pricing decisions affect the same margin story, but most teams still review them separately."],
              ].map(([label, text]) => (
                <div key={label} className="section-subtle soft-ring px-5 py-4">
                  <p className="editorial-kicker">{label}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="editorial-kicker">Where fragmentation shows up</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">The cost is not only slower reporting. It is weaker operating decisions across fulfillment, pricing, support, and leadership planning.</p>
              </div>
              <span className="surface-label hidden sm:inline-flex">4 recurring breakdowns</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
          {content.painPoints.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap] ?? ShieldIcon;
            return (
              <article
                key={item.title}
                className="section-subtle group flex h-full flex-col p-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,23,42,0.08)] sm:p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="premium-dark-panel flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-white/80 bg-white/86 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Pain point
                  </span>
                </div>
                <h3 className="mt-6 text-[1.12rem] font-semibold tracking-[-0.025em] text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              </article>
            );
          })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
