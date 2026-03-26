import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { siteConfig } from "@/content/site-content";

export function Footer() {
  return (
    <footer className="section-shell pb-24 pt-10">
      <div className="section-card flex flex-col gap-8 px-6 py-8 sm:px-8 lg:gap-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-slate-950 shadow-sm">
              <BrandLogo mode="mark" theme="dark" className="h-8" />
            </span>
            <div>
              <p className="font-[var(--font-heading)] text-lg font-semibold tracking-[-0.03em] text-slate-950">
                {siteConfig.brandName}
              </p>
              <p className="mt-1 max-w-md text-sm leading-7 text-slate-500">{siteConfig.shortTagline}</p>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pages</p>
              <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
                <Link href="/" className="transition hover:text-slate-950">
                  Home
                </Link>
                <Link href="/features" className="transition hover:text-slate-950">
                  Features
                </Link>
                <Link href="/how-it-works" className="transition hover:text-slate-950">
                  How It Works
                </Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Resources</p>
              <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
                <Link href="/faq" className="transition hover:text-slate-950">
                  FAQ
                </Link>
                <Link href="/early-access" className="transition hover:text-slate-950">
                  Early Access
                </Link>
                <a href={siteConfig.supportUrl} className="transition hover:text-slate-950">
                  Support
                </a>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Legal</p>
              <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
                <a href={siteConfig.privacyUrl} className="transition hover:text-slate-950">
                  Privacy
                </a>
                <a href={siteConfig.termsUrl} className="transition hover:text-slate-950">
                  Terms
                </a>
                <a href={`mailto:${siteConfig.email}`} className="transition hover:text-slate-950">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Built for modern Shopify merchants operating across fraud, pricing, competition, and margin.</p>
          <p>
            &copy; {new Date().getFullYear()} {siteConfig.productName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
