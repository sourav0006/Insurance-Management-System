import React, { useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroSection from '../../components/landing/HeroSection';
import ProblemSection from '../../components/landing/ProblemSection';
import MarketplaceShowcase from '../../components/landing/MarketplaceShowcase';
import JourneySection from '../../components/landing/JourneySection';
import VerificationSection from '../../components/landing/VerificationSection';
import TwoSidesSection from '../../components/landing/TwoSidesSection';
import WhySection from '../../components/landing/WhySection';
import EcosystemSection from '../../components/landing/EcosystemSection';
import FinalCTA from '../../components/landing/FinalCTA';

export const LandingPage = () => {
  // Refresh ScrollTrigger positions once all sections have mounted.
  useEffect(() => {
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="lp-root">
      <HeroSection />
      <ProblemSection />
      <MarketplaceShowcase />
      <JourneySection />
      <VerificationSection />
      <TwoSidesSection />
      <WhySection />
      <EcosystemSection />
      <FinalCTA />
    </div>
  );
};

export default LandingPage;
