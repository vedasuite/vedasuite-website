import { type VariantKey, variantContent } from "@/content/site-content";

type FinalCTAProps = {
  variant: VariantKey;
  onJoinWaitlist: () => void;
  onInstallClick: () => void;
};

export function FinalCTA({ variant, onJoinWaitlist, onInstallClick }: FinalCTAProps) {
  const content = variantContent[variant];

  return (
    <section className="section-shell mt-20 sm:mt-24">
      <div className="section-card premium-dark-panel overflow-hidden px-8 py-10 text-white shadow-[0_28px_84px_rgba(15,23,42,0.18)] sm:px-10 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <span className="eyebrow border-white/10 bg-white/5 text-slate-300">Final CTA</span>
            <h2 className="prose-balance mt-4 max-w-3xl font-[var(--font-heading)] text-[1.95rem] font-semibold tracking-[-0.04em] sm:text-[2.45rem]">
              {content.finalCtaTitle}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">{content.finalCtaText}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <button type="button" className="button-accent shadow-[0_16px_34px_rgba(14,165,233,0.2)]" onClick={onJoinWaitlist}>
              Book a demo
            </button>
            <button
              type="button"
              className="button-secondary border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={onInstallClick}
            >
              Join early access
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
