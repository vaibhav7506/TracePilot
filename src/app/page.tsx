import { DeveloperSection } from "@/components/landing/developer-section";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { FinalCta } from "@/components/landing/final-cta";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { ReportPreview } from "@/components/landing/report-preview";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <FeatureGrid />
      <ReportPreview />
      <DeveloperSection />
      <FinalCta />
    </>
  );
}
