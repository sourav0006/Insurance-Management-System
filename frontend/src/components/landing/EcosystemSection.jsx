import React from 'react';
import { User, Building2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useGsapContext, revealBatch } from './useGsapContext';
import SectionLabel from './SectionLabel';

const chain = [
  'Insurers publish plans',
  'Platform verifies insurers',
  'Customers discover plans',
  'Customers apply',
  'Insurers review applications',
  'Approved applications become policies',
  'Customers & insurers stay in contact',
];

export const EcosystemSection = () => {
  const scope = useGsapContext((api) => {
    revealBatch(scope.current, '.lp-reveal', api, {});
  }, []);

  return (
    <section ref={scope} className="relative overflow-hidden border-t border-white/10 bg-[var(--lp-ink)] py-24 text-white sm:py-28">
      <div aria-hidden className="lp-grid-bg pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <div className="lp-reveal"><SectionLabel tone="dark">The ecosystem</SectionLabel></div>
          <h2 className="lp-reveal lp-display mt-5 text-4xl font-semibold sm:text-5xl">
            One connected system, overseen end to end.
          </h2>
          <p className="lp-reveal mt-5 text-lg leading-relaxed text-white/70">
            Customers and insurers meet in the marketplace, while the platform admin verifies insurers and
            keeps oversight of who can operate.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 items-center gap-12 lg:grid-cols-[auto_1fr]">
          {/* orbital diagram */}
          <div className="lp-reveal relative mx-auto h-72 w-72 sm:h-80 sm:w-80">
            <div aria-hidden className="lp-orbit absolute inset-0 rounded-full border border-dashed border-white/15" />
            <div aria-hidden className="absolute inset-8 rounded-full border border-white/8" />

            {/* center — admin oversight */}
            <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] text-center backdrop-blur-sm">
              <ShieldCheck className="h-7 w-7 text-[var(--lp-blue-bright)]" />
              <span className="lp-display mt-1 text-sm font-semibold">Platform</span>
              <span className="lp-eyebrow text-[10px] text-white/60">admin</span>
            </div>

            {/* customer node */}
            <div className="absolute left-1/2 top-0 flex -translate-x-1/2 flex-col items-center gap-1 rounded-xl border border-white/15 bg-[var(--lp-ink)] px-4 py-2.5">
              <User className="h-5 w-5 text-[var(--lp-blue-bright)]" />
              <span className="text-xs font-semibold">Customers</span>
            </div>

            {/* insurer node */}
            <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 rounded-xl border border-white/15 bg-[var(--lp-ink)] px-4 py-2.5">
              <Building2 className="h-5 w-5 text-[var(--lp-blue-bright)]" />
              <span className="text-xs font-semibold">Insurers</span>
            </div>
          </div>

          {/* the chain */}
          <ol className="space-y-2.5">
            {chain.map((step, i) => (
              <li
                key={step}
                className="lp-reveal flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5"
              >
                <span className="lp-mono flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--lp-blue-bright)]/15 text-[11px] font-semibold text-[var(--lp-blue-bright)]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-sm text-white/85">{step}</span>
                {i < chain.length - 1 && (
                  <ArrowRight className="ml-auto h-4 w-4 text-white/25" aria-hidden />
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default EcosystemSection;
