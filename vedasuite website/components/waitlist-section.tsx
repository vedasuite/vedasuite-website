"use client";

import { useState } from "react";
import { challengeOptions, siteConfig, volumeOptions, type VariantKey } from "@/content/site-content";
import { formatSubmissionTimestamp } from "@/lib/utils";

type InquiryFormValues = {
  name: string;
  email: string;
  storeUrl: string;
  monthlyVolume: string;
  challenge: string;
  wantsEarlyAccess: boolean;
  wantsDemo: boolean;
};

type WaitlistSectionProps = {
  variant: VariantKey;
};

type Errors = Partial<Record<keyof InquiryFormValues, string>>;

const initialValues: InquiryFormValues = {
  name: "",
  email: "",
  storeUrl: "",
  monthlyVolume: volumeOptions[0],
  challenge: "",
  wantsEarlyAccess: true,
  wantsDemo: true,
};

const storageKey = "vedasuite-early-access-submissions";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidStoreUrl(storeUrl: string) {
  try {
    const normalized = storeUrl.startsWith("http") ? storeUrl : `https://${storeUrl}`;
    const url = new URL(normalized);
    return Boolean(url.hostname);
  } catch {
    return false;
  }
}

function normalizeStoreUrl(storeUrl: string) {
  return storeUrl.startsWith("http") ? storeUrl : `https://${storeUrl}`;
}

export function WaitlistSection({ variant }: WaitlistSectionProps) {
  const [values, setValues] = useState<InquiryFormValues>(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);

  const handleChange = <Key extends keyof InquiryFormValues>(key: Key, value: InquiryFormValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const nextErrors: Errors = {};
    if (!values.name.trim()) nextErrors.name = "Please enter your name.";
    if (!isValidEmail(values.email)) nextErrors.email = "Please enter a valid work email.";
    if (!values.storeUrl.trim() || !isValidStoreUrl(values.storeUrl)) {
      nextErrors.storeUrl = "Please enter a valid store URL.";
    }
    if (!values.challenge.trim()) nextErrors.challenge = "Tell us the first operating problem you want VedaSuite AI to solve.";
    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);

    const payload = {
      ...values,
      storeUrl: normalizeStoreUrl(values.storeUrl),
      variant,
      submittedAt: new Date().toISOString(),
    };

    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem(storageKey);
      const submissions = raw ? (JSON.parse(raw) as unknown[]) : [];
      window.localStorage.setItem(storageKey, JSON.stringify([payload, ...submissions]));
    }

    setSubmitting(false);
    const now = new Date();
    setSubmittedAt(now);
    setValues(initialValues);
  };

  return (
    <section id="waitlist" className="section-shell mb-24 mt-24">
      <div className="section-card luxury-frame overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="ink-panel border-b border-white/8 p-8 text-white sm:p-10 lg:border-b-0 lg:border-r lg:border-white/10">
            <span className="eyebrow border-white/10 bg-white/5 text-slate-300">Early access</span>
            <h2 className="prose-balance mt-4 font-[var(--font-heading)] text-[2rem] font-semibold tracking-[-0.04em] text-white sm:text-[2.7rem]">
              Start a VedaSuite AI conversation.
            </h2>
            <p className="prose-balance mt-4 max-w-xl text-[1.02rem] leading-8 text-slate-300">
              Share a few details about your store, operating priorities, and the first workflow you want to strengthen. We use this to guide demos, early access, and product-fit conversations.
            </p>

            <div className="story-divider mt-8 h-px w-full opacity-60" />

            <div className="mt-8 grid gap-4">
              {[
                ["Built for", "Shopify founders, operators, and revenue teams managing fraud, pricing, and margin together."],
                ["Best fit", "Merchants who want one intelligence layer instead of fragmented analytics and spreadsheets."],
                ["Use this for", "A demo request, early access conversation, or product-fit discussion."],
              ].map(([label, text]) => (
                <div key={label} className="rounded-[22px] border border-white/10 bg-white/[0.06] px-4 py-4">
                  <p className="editorial-kicker text-slate-300">{label}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-200">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[26px] border border-white/10 bg-black/10 p-6 sm:p-7">
              <p className="editorial-kicker text-slate-300">What happens next</p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                <p>1. We review your store context, order volume, and primary operating challenge.</p>
                <p>2. We tailor the conversation around fraud, competitor monitoring, pricing, trust scoring, or profit strategy.</p>
                <p>3. We follow up using <span className="font-semibold text-white">{siteConfig.email}</span> for next-step coordination.</p>
              </div>
            </div>
          </div>

          <div className="warm-panel p-8 sm:p-10">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="editorial-kicker">Inquiry form</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">Tell us where VedaSuite AI would have the most operational value for your store.</p>
              </div>
              <span className="surface-label hidden sm:inline-flex">Takes under 2 minutes</span>
            </div>

          {submittedAt ? (
            <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-8 shadow-[0_24px_60px_rgba(16,185,129,0.08)]">
              <span className="eyebrow border-emerald-200 bg-white text-emerald-700">Success</span>
              <h3 className="mt-4 font-[var(--font-heading)] text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                Your request is in.
              </h3>
              <p className="mt-4 text-base leading-7 text-slate-700">
                Thanks for sharing your details. We use this information to prepare walkthroughs, prioritize early access conversations, and understand the workflow your team cares about most.
              </p>
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-700">
                Submitted {formatSubmissionTimestamp(submittedAt)} from this browser.
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button type="button" className="button-accent" onClick={() => setSubmittedAt(null)}>
                  Submit another request
                </button>
                <a href={`mailto:${siteConfig.email}`} className="button-secondary">
                  Email the team
                </a>
              </div>
            </div>
          ) : (
            <form className="space-y-5 rounded-[30px] border border-white/75 bg-white/78 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-md sm:p-7" onSubmit={handleSubmit} noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  id="name"
                  label="Name"
                  value={values.name}
                  error={errors.name}
                  onChange={(value) => handleChange("name", value)}
                  placeholder="Alex Morgan"
                />
                <Field
                  id="email"
                  label="Work email"
                  type="email"
                  value={values.email}
                  error={errors.email}
                  onChange={(value) => handleChange("email", value)}
                  placeholder="alex@brand.com"
                />
              </div>

              <Field
                id="storeUrl"
                label="Store URL"
                value={values.storeUrl}
                error={errors.storeUrl}
                onChange={(value) => handleChange("storeUrl", value)}
                placeholder="yourstore.com"
              />

              <div>
                <label htmlFor="monthlyVolume" className="mb-2 block text-sm font-semibold text-slate-800">
                  Monthly order volume
                </label>
                <select
                  id="monthlyVolume"
                  value={values.monthlyVolume}
                  onChange={(event) => handleChange("monthlyVolume", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  {volumeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="challenge" className="mb-2 block text-sm font-semibold text-slate-800">
                  Primary challenge
                </label>
                <textarea
                  id="challenge"
                  rows={5}
                  value={values.challenge}
                  onChange={(event) => handleChange("challenge", event.target.value)}
                  placeholder={`Examples: ${challengeOptions.join(", ")}`}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  aria-invalid={Boolean(errors.challenge)}
                  aria-describedby={errors.challenge ? "challenge-error" : undefined}
                />
                {errors.challenge ? (
                  <p id="challenge-error" className="mt-2 text-sm text-rose-600">
                    {errors.challenge}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4">
                <label className="section-subtle p-4 transition hover:border-slate-300">
                  <span className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={values.wantsEarlyAccess}
                      onChange={(event) => handleChange("wantsEarlyAccess", event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-300"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">I want early access updates</span>
                      <span className="mt-1 block text-sm leading-7 text-slate-600">
                        Let us know if you want to be contacted when VedaSuite AI access opens for more stores.
                      </span>
                    </span>
                  </span>
                </label>

                <label className="section-subtle p-4 transition hover:border-slate-300">
                  <span className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={values.wantsDemo}
                      onChange={(event) => handleChange("wantsDemo", event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-300"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">I&apos;d like a product walkthrough</span>
                      <span className="mt-1 block text-sm leading-7 text-slate-600">
                        Useful if you want to see the suite, discuss fit, or review the operating workflow for your store.
                      </span>
                    </span>
                  </span>
                </label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button type="submit" className="button-accent" disabled={submitting}>
                  {submitting ? "Saving your request..." : "Request access"}
                </button>
                <p className="text-sm leading-7 text-slate-500">
                  Requests are stored locally in this build and can be connected later to a CRM, database, or API route.
                </p>
              </div>
            </form>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
};

function Field({ id, label, value, onChange, placeholder, type = "text", error }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
