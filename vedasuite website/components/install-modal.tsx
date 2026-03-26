"use client";

import { useEffect } from "react";
import { type VariantKey, variantContent } from "@/content/site-content";

type InstallModalProps = {
  open: boolean;
  variant: VariantKey;
  onClose: () => void;
  onJoinWaitlist: () => void;
};

export function InstallModal({ open, variant, onClose, onJoinWaitlist }: InstallModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const content = variantContent[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="install-modal-title">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close modal overlay" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-glow">
        <span className="eyebrow">Product walkthrough</span>
        <h2 id="install-modal-title" className="prose-balance mt-4 font-[var(--font-heading)] text-[2rem] font-semibold tracking-[-0.03em] text-slate-950">
          {content.installTitle}
        </h2>
        <p className="mt-4 text-base leading-8 text-slate-600">{content.installText}</p>
        <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-900">What happens next</p>
          <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
            <li>Share your store URL, volume, and the operating challenge you want solved first.</li>
            <li>Request a walkthrough, early access conversation, or product-fit discussion.</li>
            <li>We use your input to tailor the right VedaSuite AI workflow conversation for your store.</li>
          </ul>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="button-accent"
            onClick={() => {
              onClose();
              onJoinWaitlist();
            }}
          >
            Book a Demo
          </button>
          <button type="button" className="button-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
