"use client";

import { useState } from "react";
import { BenefitsSection } from "@/components/benefits-section";
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
import { ProblemSection } from "@/components/problem-section";
import { TrustSection } from "@/components/trust-section";
import { WaitlistSection } from "@/components/waitlist-section";
import { type VariantKey } from "@/content/site-content";
import { scrollToId } from "@/lib/utils";

type LandingPageProps = {
  initialVariant: VariantKey;
};

export function LandingPage({ initialVariant }: LandingPageProps) {
  const [variant] = useState<VariantKey>(initialVariant);
  const [isInstallOpen, setIsInstallOpen] = useState(false);

  const openWaitlist = () => scrollToId("waitlist");
  const openHowItWorks = () => scrollToId("how-it-works");

  return (
    <>
      <Navbar
        variant={variant}
        onJoinWaitlist={openWaitlist}
        onInstallClick={() => setIsInstallOpen(true)}
        onVariantChange={() => undefined}
      />
      <main className="overflow-hidden pb-24 lg:pb-0">
        <Hero
          variant={variant}
          onJoinWaitlist={openWaitlist}
          onHowItWorks={openHowItWorks}
          onInstallClick={() => setIsInstallOpen(true)}
          onVariantChange={() => undefined}
        />
        <ProblemSection variant={variant} />
        <HowItWorks variant={variant} />
        <FeaturesGrid variant={variant} />
        <DashboardPreview />
        <BenefitsSection variant={variant} />
        <TrustSection variant={variant} />
        <WaitlistSection variant={variant} />
        <FAQSection variant={variant} />
        <FinalCTA
          variant={variant}
          onJoinWaitlist={openWaitlist}
          onInstallClick={() => setIsInstallOpen(true)}
        />
      </main>
      <Footer />
      <MobileStickyCTA onJoinWaitlist={openWaitlist} onInstallClick={() => setIsInstallOpen(true)} />
      <InstallModal
        open={isInstallOpen}
        variant={variant}
        onClose={() => setIsInstallOpen(false)}
        onJoinWaitlist={openWaitlist}
      />
    </>
  );
}
