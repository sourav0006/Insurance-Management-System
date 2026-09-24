import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, BadgeCheck, ArrowRight, Search, SlidersHorizontal } from 'lucide-react';
import { useGsapContext, revealBatch } from './useGsapContext';
import SectionLabel from './SectionLabel';
import { demoPlans, formatINR } from './demoData';

export const MarketplaceShowcase = () => {
  const scope = useGsapContext((api) => {
    const root = scope.current;
    revealBatch(root, '.lp-reveal', api);
    if (!api.reduced) {
      // subtle parallax lift on the plan grid as it scrolls through view
      api.gsap.to('.lp-mkt-grid', {
        y: -26,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }
  }, []);

  return (
    <section ref={scope} className="relative border-t border-[var(--lp-line)] bg-white py-24 sm:py-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-14 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        {/* Left — editorial */}
        <div>
          <div className="lp-reveal"><SectionLabel>The marketplace</SectionLabel></div>
          <h2 className="lp-reveal lp-display mt-5 text-4xl font-semibold text-[var(--lp-ink)] sm:text-5xl">
            One place to compare coverage that actually fits.
          </h2>
          <p className="lp-reveal mt-5 max-w-md text-lg leading-relaxed text-[var(--lp-ink-soft)]">
            Every plan comes from a platform-verified insurer, with the numbers that matter shown up front —
            coverage, premium, payment frequency and policy term. Search, filter and sort until it fits.
          </p>

          <ul className="lp-reveal mt-8 space-y-3 text-sm text-[var(--lp-ink-soft)]">
            {[
              'Filter by category, premium range and coverage',
              'Sort by premium or coverage, low to high',
              'Clear plan codes and insurer details on every card',
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <BadgeCheck className="h-4 w-4 shrink-0 text-[var(--lp-green)]" />
                {t}
              </li>
            ))}
          </ul>

          <Link
            to="/marketplace"
            className="lp-reveal group mt-9 inline-flex items-center gap-2 text-sm font-semibold text-[var(--lp-blue)]"
          >
            Explore all plans
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Right — product surface */}
        <div className="lp-reveal">
          <div className="rounded-2xl border border-[var(--lp-line)] bg-[var(--lp-paper)] p-4 shadow-[0_40px_90px_-50px_rgba(11,31,51,0.4)]">
            {/* faux control bar mirroring the real marketplace */}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-[var(--lp-line)] bg-white px-3 py-2 text-xs text-[var(--lp-muted)]">
                <Search className="h-3.5 w-3.5" />
                Search plan name, code, category or insurer
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-[var(--lp-line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--lp-ink-soft)]">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--lp-blue)]" /> Filters
              </div>
            </div>

            <div className="lp-mkt-grid grid grid-cols-1 gap-3 sm:grid-cols-2">
              {demoPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="group cursor-default overflow-hidden rounded-xl border border-[var(--lp-line)] bg-white transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
                >
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[var(--lp-blue)]">
                        {plan.category}
                      </span>
                      <span className="lp-mono text-[9px] uppercase tracking-wider text-slate-400">
                        {plan.plan_code}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--lp-ink)] transition-colors group-hover:text-[var(--lp-blue)]">
                        {plan.plan_name}
                      </h3>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--lp-muted)]">
                        <Building2 className="h-3 w-3" /> {plan.company_name}
                      </p>
                    </div>
                    <div className="space-y-1.5 rounded-lg bg-[var(--lp-paper)] p-2.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--lp-muted)]">Coverage</span>
                        <span className="font-bold text-[var(--lp-ink)]">{formatINR(plan.coverage_amount)}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-[var(--lp-line)] pt-1.5">
                        <span className="text-[var(--lp-muted)]">Premium</span>
                        <span className="font-bold text-[var(--lp-blue)]">
                          {formatINR(plan.premium_amount)}
                          <span className="font-normal text-[var(--lp-muted)]"> / {plan.premium_frequency}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="lp-reveal mt-3 text-center text-[11px] text-[var(--lp-muted)]">
            Illustrative preview of the marketplace experience.
          </p>
        </div>
      </div>
    </section>
  );
};

export default MarketplaceShowcase;
