import {
  AlertIcon,
  ProfileIcon,
  RouteIcon,
  ScoreIcon,
  SparkIcon,
  WaveIcon,
} from "@/components/icons";
import { SectionHeading } from "@/components/section-heading";
import { type VariantKey, variantContent } from "@/content/site-content";

const featureIcons = {
  spark: SparkIcon,
  score: ScoreIcon,
  profile: ProfileIcon,
  wave: WaveIcon,
  route: RouteIcon,
  alert: AlertIcon,
};

type FeaturesGridProps = {
  variant: VariantKey;
};

export function FeaturesGrid({ variant }: FeaturesGridProps) {
  const content = variantContent[variant];

  return (
    <section id="features" className="section-shell mt-20 sm:mt-24">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          eyebrow="Feature set"
          title="A full intelligence suite for Shopify merchants who need clearer operational decisions."
          description="Built to connect fraud, competition, pricing, shopper trust, reporting, and profit decisions inside one embedded workflow."
        />
        <div className="section-subtle max-w-sm px-5 py-4 text-sm leading-7 text-slate-600">
          One installation unlocks multiple connected modules instead of a stack of disconnected point tools.
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {content.features.map((feature) => {
          const Icon = featureIcons[feature.icon as keyof typeof featureIcons] ?? AlertIcon;
          return (
            <article
              key={feature.title}
              className="section-card luxury-frame flex h-full flex-col p-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,23,42,0.08)] sm:p-7"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="premium-dark-panel flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                {feature.comingSoon ? (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-800">
                    Coming soon
                  </span>
                ) : null}
              </div>
              <h3 className="mt-6 text-[1.08rem] font-semibold tracking-[-0.025em] text-slate-950">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
