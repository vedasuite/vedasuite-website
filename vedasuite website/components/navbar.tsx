"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { navLinks, siteConfig, type VariantKey } from "@/content/site-content";
import { cn, scrollToId } from "@/lib/utils";

type NavbarProps = {
  variant: VariantKey;
  onJoinWaitlist: () => void;
  onInstallClick: () => void;
  onVariantChange: (variant: VariantKey) => void;
};

export function Navbar({
  onJoinWaitlist,
  onInstallClick,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-[rgba(251,247,239,0.74)] backdrop-blur-xl">
      <div className="section-shell">
        <div className="flex h-[4.65rem] items-center justify-between gap-4">
          <Link
            href="/"
            onClick={() => {
              closeMenu();
              if (pathname === "/") scrollToId("hero");
            }}
            className="soft-ring flex items-center gap-3 rounded-[22px] border border-white/80 bg-white/85 px-3 py-2 text-left shadow-sm transition hover:border-slate-300"
          >
            <span className="premium-dark-panel flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm">
              <BrandLogo mode="mark" theme="dark" className="h-8" />
            </span>
            <span className="hidden sm:block">
              <span className="block font-[var(--font-heading)] text-[0.96rem] font-semibold tracking-[-0.03em] text-slate-950">
                {siteConfig.brandName}
              </span>
              <span className="block text-[10px] tracking-[0.18em] text-slate-500">
                {siteConfig.shortTagline}
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-7 xl:gap-9 lg:flex">
            <nav className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition",
                    pathname === link.href ? "text-slate-950" : "text-slate-600 hover:text-slate-950"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button type="button" className="button-secondary !min-h-11 px-4 py-2.5" onClick={onInstallClick}>
                See the platform
              </button>
              <button
                type="button"
                className="button-accent !min-h-11 px-4 py-2.5 shadow-[0_14px_30px_rgba(14,165,233,0.22)]"
                onClick={onJoinWaitlist}
              >
                Book a demo
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/88 text-slate-900 shadow-sm lg:hidden"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <span className="space-y-1.5">
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
            </span>
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <div className="border-t border-slate-200/70 bg-[rgba(251,247,239,0.96)] lg:hidden">
          <div className="section-shell py-4">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700"
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              ))}
              <button type="button" className="button-secondary w-full" onClick={onInstallClick}>
                See the platform
              </button>
              <button type="button" className="button-accent w-full" onClick={onJoinWaitlist}>
                Book a demo
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
