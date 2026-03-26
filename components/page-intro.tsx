import { type VariantKey } from "@/content/site-content";

type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  variant: VariantKey;
  onPrimaryClick: () => void;
  onSecondaryClick?: () => void;
};

export function PageIntro({
  eyebrow,
  title,
  description,
  onPrimaryClick,
  onSecondaryClick,
}: PageIntroProps) {
  return (
    <section className="section-shell pt-8 sm:pt-10">
      <div className="section-card luxury-frame overflow-hidden px-6 py-10 sm:px-10 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h1 className="prose-balance mt-5 max-w-3xl font-[var(--font-heading)] text-[2.35rem] font-semibold tracking-[-0.05em] text-slate-950 sm:text-[3.15rem]">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-[1.01rem] leading-8 text-slate-600 sm:text-[1.06rem]">
              {description}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="warm-panel rounded-[24px] border border-white/70 p-5 shadow-sm">
              <p className="editorial-kicker">Built for</p>
              <p className="mt-3 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                Shopify founders, operators, growth teams, and margin-focused merchants
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Teams that want a premium operating layer across fraud, pricing, competition, and profit.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <button type="button" className="button-accent shadow-[0_14px_30px_rgba(14,165,233,0.2)]" onClick={onPrimaryClick}>
                Book a demo
              </button>
              {onSecondaryClick ? (
                <button type="button" className="button-secondary" onClick={onSecondaryClick}>
                  See the platform
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
