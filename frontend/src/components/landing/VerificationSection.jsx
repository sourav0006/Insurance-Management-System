import React from 'react';
import { Building2, ShieldCheck, BadgeCheck, Store, Users, ArrowRight } from 'lucide-react';
import { useGsapContext, revealBatch } from './useGsapContext';
import SectionLabel from './SectionLabel';

const flow = [
  { icon: Building2, title: 'Insurer registers', copy: 'A company creates an insurer account and submits its details.' },
  { icon: ShieldCheck, title: 'Platform reviews', copy: 'The platform admin reviews the insurer before anything goes live.' },
  { icon: BadgeCheck, title: 'Approved', copy: 'Verified insurers are cleared to publish insurance products.' },
  { icon: Store, title: 'Plans go live', copy: 'Their active plans become visible in the marketplace.' },
  { icon: Users, title: 'Customers discover', copy: 'Only verified insurers reach customers browsing plans.' },
];

export const VerificationSection = () => {
  const scope = useGsapContext((api) => {
    const root = scope.current;
    revealBatch(root, '.lp-reveal', api);
    if (!api.reduced) {
      api.gsap.fromTo(
        '.lp-verify-line',
        { scaleX: 0 },
        {
          scaleX: 1,
          transformOrigin: 'left center',
          ease: 'none',
          scrollTrigger: { trigger: '.lp-verify-track', start: 'top 75%', end: 'bottom 60%', scrub: true },
        }
      );
    }
  }, []);

  return (
    <section ref={scope} className="border-t border-[var(--lp-line)] bg-[var(--lp-paper)] py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <div className="lp-reveal"><SectionLabel>Verified insurers</SectionLabel></div>
          <h2 className="lp-reveal lp-display mt-5 text-4xl font-semibold text-[var(--lp-ink)] sm:text-5xl">
            Trust starts before a plan is ever listed.
          </h2>
          <p className="lp-reveal mt-5 text-lg leading-relaxed text-[var(--lp-ink-soft)]">
            Insurers don't just appear in the marketplace. Each one is reviewed and approved by the platform
            admin first — so every plan a customer sees comes from a verified provider.
          </p>
        </div>

        {/* horizontal verification flow */}
        <div className="lp-verify-track relative mt-16">
          {/* connecting line (desktop) */}
          <div aria-hidden className="absolute left-0 right-0 top-7 hidden h-px bg-[var(--lp-line)] lg:block">
            <div className="lp-verify-line h-full w-full bg-[var(--lp-green)]" />
          </div>

          <ol className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
            {flow.map((step, i) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="lp-reveal relative">
                  <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--lp-line)] bg-white text-[var(--lp-blue)] shadow-sm">
                    <Icon className="h-6 w-6" />
                    <span className="lp-mono absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--lp-ink)] text-[10px] font-semibold text-white">
                      {i + 1}
                    </span>
                  </span>
                  <h3 className="lp-display mt-5 text-lg font-semibold text-[var(--lp-ink)]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--lp-muted)]">{step.copy}</p>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="lp-reveal mt-14 flex items-start gap-3 rounded-2xl border border-[var(--lp-line)] bg-white p-5 text-sm text-[var(--lp-ink-soft)]">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--lp-green)]" />
          <p>
            Verification is a platform review step — it controls which insurers can publish plans and reach
            customers. Suspended insurers can be removed from the marketplace by the admin at any time.
          </p>
        </div>
      </div>
    </section>
  );
};

export default VerificationSection;
