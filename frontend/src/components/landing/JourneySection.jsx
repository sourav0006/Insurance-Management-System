import React, { useState } from 'react';
import { Compass, GitCompareArrows, FileText, ClipboardCheck, ShieldCheck, FolderClock } from 'lucide-react';
import { useGsapContext } from './useGsapContext';
import SectionLabel from './SectionLabel';

const steps = [
  {
    n: '01',
    key: 'discover',
    title: 'Discover',
    icon: Compass,
    copy: 'Browse active plans from platform-verified insurers across health, life, vehicle and travel cover.',
    state: 'Browsing marketplace',
  },
  {
    n: '02',
    key: 'compare',
    title: 'Compare',
    icon: GitCompareArrows,
    copy: 'Weigh coverage, premium, payment frequency and policy term side by side until the fit is clear.',
    state: 'Comparing plans',
  },
  {
    n: '03',
    key: 'apply',
    title: 'Apply',
    icon: FileText,
    copy: 'Submit an application to the insurer directly through the platform, in a few guided steps.',
    state: 'SUBMITTED',
  },
  {
    n: '04',
    key: 'review',
    title: 'Review',
    icon: ClipboardCheck,
    copy: 'The insurer reviews your application. You follow every status change as it happens.',
    state: 'UNDER REVIEW',
  },
  {
    n: '05',
    key: 'policy',
    title: 'Policy',
    icon: ShieldCheck,
    copy: 'Once approved, a policy is issued and becomes available to view in your account.',
    state: 'APPROVED',
  },
  {
    n: '06',
    key: 'manage',
    title: 'Manage',
    icon: FolderClock,
    copy: 'Keep policies in one place and raise questions to insurers whenever you need answers.',
    state: 'Policy active',
  },
];

export const JourneySection = () => {
  const [active, setActive] = useState(0);

  const scope = useGsapContext(({ gsap, ScrollTrigger, reduced }) => {
    if (reduced) return; // static list, no pinning

    const mm = gsap.matchMedia();
    // Only pin + scrub on larger screens; mobile gets a simple flow.
    mm.add('(min-width: 1024px)', () => {
      const panels = steps.length;
      ScrollTrigger.create({
        trigger: '.lp-journey-pin',
        start: 'top top',
        end: () => `+=${panels * 60}%`,
        pin: '.lp-journey-inner',
        scrub: true,
        onUpdate: (self) => {
          const idx = Math.min(panels - 1, Math.floor(self.progress * panels));
          setActive(idx);
        },
      });
    });

    return () => mm.revert();
  }, []);

  const Current = steps[active].icon;

  return (
    <section ref={scope} className="bg-[var(--lp-ink)] text-white">
      <div className="lp-journey-pin">
        <div className="lp-journey-inner mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-5 py-20 sm:px-8">
          <div className="mb-10">
            <SectionLabel tone="dark">The insurance journey</SectionLabel>
            <h2 className="lp-display mt-5 max-w-2xl text-4xl font-semibold sm:text-5xl">
              From first search to an active policy — one continuous path.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            {/* Left — step rail */}
            <ol className="relative">
              <span
                aria-hidden
                className="absolute left-[1.15rem] top-2 bottom-2 w-px bg-white/12"
              />
              {steps.map((s, i) => {
                const on = i === active;
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      onClick={() => setActive(i)}
                      className="group flex w-full items-center gap-4 py-2.5 text-left"
                    >
                      <span
                        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-all duration-300 ${
                          on
                            ? 'border-[var(--lp-blue-bright)] bg-[var(--lp-blue-bright)] text-[var(--lp-ink)]'
                            : 'border-sky-300/40 bg-white/5 text-sky-200/90'
                        }`}
                      >
                        {s.n}
                      </span>
                      <span
                        className={`lp-display text-2xl font-semibold transition-colors duration-300 sm:text-3xl ${
                          on ? 'text-white' : 'text-slate-300/75'
                        }`}
                      >
                        {s.title}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            {/* Right — active detail panel */}
            <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-8 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--lp-blue-bright)]/15 text-[var(--lp-blue-bright)]">
                  <Current className="h-7 w-7" />
                </span>
                <span className="lp-mono rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-wider text-white/70">
                  {steps[active].state}
                </span>
              </div>
              <p className="lp-eyebrow mt-6 text-[var(--lp-blue-bright)]">Step {steps[active].n}</p>
              <h3 className="lp-display mt-2 text-3xl font-semibold">{steps[active].title}</h3>
              <p className="mt-4 text-lg leading-relaxed text-white/70">{steps[active].copy}</p>

              {/* progress track */}
              <div className="mt-8 h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[var(--lp-blue-bright)] transition-all duration-500 ease-out"
                  style={{ width: `${((active + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JourneySection;
