"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BenefitsSection } from "@/components/benefits-section";
import { CinematicShowcase } from "@/components/cinematic-showcase";
import { DashboardPreview } from "@/components/dashboard-preview";
import { FAQSection } from "@/components/faq-section";
import { FeaturesGrid } from "@/components/features-grid";
import { FinalCTA } from "@/components/final-cta";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { InstallModal } from "@/components/install-modal";
import { MobileStickyCTA } from "@/components/mobile-sticky-cta";
import { Navbar } from "@/components/navbar";
import { PageIntro } from "@/components/page-intro";
import { ProblemSection } from "@/components/problem-section";
import { TrustSection } from "@/components/trust-section";
import { WaitlistSection } from "@/components/waitlist-section";
import { type VariantKey } from "@/content/site-content";
import { scrollToId } from "@/lib/utils";

type PageKind = "home" | "features" | "how-it-works" | "faq" | "early-access";

type SiteShellProps = {
  initialVariant: VariantKey;
  page: PageKind;
};

export function SiteShell({ initialVariant, page }: SiteShellProps) {
  const [variant, setVariant] = useState<VariantKey>(initialVariant);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const openWaitlist = () => {
    if (pathname === "/early-access") {
      scrollToId("waitlist");
      return;
    }
    router.push("/early-access");
  };

  const openHowItWorks = () => {
    if (pathname === "/how-it-works") {
      scrollToId("how-it-works");
      return;
    }
    router.push("/how-it-works");
  };

  const openInstall = () => setIsInstallOpen(true);

  return (
    <>
      <Navbar
        variant={variant}
        onJoinWaitlist={openWaitlist}
        onInstallClick={openInstall}
        onVariantChange={setVariant}
      />

      <main className="page-fade overflow-hidden pb-24 lg:pb-0">
        {page === "home" ? (
          <>
            <Hero
              variant={variant}
              onJoinWaitlist={openWaitlist}
              onHowItWorks={openHowItWorks}
              onInstallClick={openInstall}
              onVariantChange={setVariant}
            />
            <CinematicShowcase />
            <FeaturesGrid variant={variant} />
            <DashboardPreview />
            <TrustSection variant={variant} />
            <FinalCTA variant={variant} onJoinWaitlist={openWaitlist} onInstallClick={openInstall} />
          </>
        ) : null}

        {page === "features" ? (
          <>
            <PageIntro
              eyebrow="Feature overview"
              title="A full intelligence suite for Shopify operators."
              description="Explore the modules that help merchants reduce fraud, respond to competitors, improve pricing decisions, score shoppers, and increase profit from one embedded operating layer."
              variant={variant}
              onPrimaryClick={openWaitlist}
              onSecondaryClick={openInstall}
            />
            <CinematicShowcase />
            <FeaturesGrid variant={variant} />
            <DashboardPreview />
            <BenefitsSection variant={variant} />
            <FinalCTA variant={variant} onJoinWaitlist={openWaitlist} onInstallClick={openInstall} />
          </>
        ) : null}

        {page === "how-it-works" ? (
          <>
            <PageIntro
              eyebrow="How it works"
              title="See how VedaSuite AI turns scattered signals into one operating workflow."
              description="This page focuses on the merchant problem, the connected decision flow, and the actions operators can take across fraud, competitor intelligence, pricing, trust, and margin."
              variant={variant}
              onPrimaryClick={openWaitlist}
              onSecondaryClick={openInstall}
            />
            <ProblemSection variant={variant} />
            <HowItWorks variant={variant} />
            <DashboardPreview />
            <FinalCTA variant={variant} onJoinWaitlist={openWaitlist} onInstallClick={openInstall} />
          </>
        ) : null}

        {page === "faq" ? (
          <>
            <PageIntro
              eyebrow="Frequently asked questions"
              title="Clear answers about the suite, workflow, and who it is built for."
              description="A simpler page for merchants who want straightforward answers before they request a walkthrough or start an early access conversation."
              variant={variant}
              onPrimaryClick={openWaitlist}
              onSecondaryClick={openInstall}
            />
            <FAQSection variant={variant} />
            <TrustSection variant={variant} />
            <FinalCTA variant={variant} onJoinWaitlist={openWaitlist} onInstallClick={openInstall} />
          </>
        ) : null}

        {page === "early-access" ? (
          <>
            <PageIntro
              eyebrow="Early access"
              title="Request a VedaSuite AI walkthrough or join early access."
              description="Share a few details about your store, current operating challenges, and where VedaSuite AI can create the most value for your team."
              variant={variant}
              onPrimaryClick={openWaitlist}
              onSecondaryClick={openInstall}
            />
            <WaitlistSection variant={variant} />
            <TrustSection variant={variant} />
            <FAQSection variant={variant} />
          </>
        ) : null}
      </main>

      <Footer />
      <MobileStickyCTA onJoinWaitlist={openWaitlist} onInstallClick={openInstall} />
      <InstallModal
        open={isInstallOpen}
        variant={variant}
        onClose={() => setIsInstallOpen(false)}
        onJoinWaitlist={openWaitlist}
      />
    </>
  );
}
