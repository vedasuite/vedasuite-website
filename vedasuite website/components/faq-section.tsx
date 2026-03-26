"use client";

import { useState } from "react";
import { SectionHeading } from "@/components/section-heading";
import { type VariantKey, variantContent } from "@/content/site-content";

type FAQSectionProps = {
  variant: VariantKey;
};

export function FAQSection({ variant }: FAQSectionProps) {
  const content = variantContent[variant];
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <section id="faq" className="section-shell mt-20 sm:mt-24">
      <div className="section-card luxury-frame overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[0.84fr_1.16fr]">
          <div className="warm-panel border-b border-white/70 p-8 sm:p-10 lg:border-b-0 lg:border-r">
            <SectionHeading
              eyebrow="FAQ"
              title="Questions merchants usually ask before evaluating the suite."
              description="Clear answers about product scope, workflow, Shopify fit, and how to begin an early access or demo conversation."
            />

            <div className="story-divider mt-8 h-px w-full" />

            <div className="mt-8 space-y-4">
              {[
                ["Embedded in Shopify", "The product is designed to feel native inside Shopify Admin, not like an external analytics portal."],
                ["Built as a suite", "Fraud, competitor monitoring, pricing, trust scoring, and reporting live under one operating model."],
                ["Best for operators", "The strongest fit is for merchants who want workflows and action paths, not just static dashboards."],
              ].map(([title, text]) => (
                <div key={title} className="section-subtle soft-ring px-5 py-4">
                  <p className="text-[1rem] font-semibold tracking-[-0.025em] text-slate-950">{title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="editorial-kicker">Merchant questions</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">Answers are designed to feel straightforward and commercially useful, not promotional.</p>
              </div>
              <span className="surface-label hidden sm:inline-flex">{content.faq.length} key answers</span>
            </div>

            <div className="space-y-4">
            {content.faq.map((item, index) => {
              const isOpen = index === openIndex;
              return (
                <article
                  key={item.question}
                  className="section-subtle soft-ring px-5 py-4 transition hover:border-slate-300 sm:px-6"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 text-left"
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    aria-expanded={isOpen}
                  >
                    <span className="pr-4 text-[1.05rem] font-semibold tracking-[-0.02em] text-slate-950">
                      {item.question}
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-lg leading-none text-slate-500">
                      {isOpen ? "-" : "+"}
                    </span>
                  </button>
                  {isOpen ? (
                    <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600">{item.answer}</p>
                  ) : null}
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
