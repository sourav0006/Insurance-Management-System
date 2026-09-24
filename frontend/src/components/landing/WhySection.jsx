import React from 'react';
import { Store, ScrollText, FileText, TrendingUp, ShieldCheck, MessageSquare, Building2, Check, BadgeCheck } from 'lucide-react';
import { useGsapContext, revealBatch } from './useGsapContext';
import SectionLabel from './SectionLabel';

/* Small capability cards (the feature card is rendered separately). */
const items = [
  { icon: Store, title: 'Centralised marketplace', copy: 'Health, life, vehicle and travel cover in one searchable place.' },
  { icon: ScrollText, title: 'Clear plan information', copy: 'Coverage, premium, frequency and term shown up front.' },
  { icon: FileText, title: 'Simple application flow', copy: 'Apply to an insurer directly, in a few guided steps.' },
  { icon: TrendingUp, title: 'Application tracking', copy: 'Follow every status from submitted to approved.' },
  { icon: ShieldCheck, title: 'Policy management', copy: 'View and keep issued policies in one account.' },
  { icon: MessageSquare, title: 'Customer–insurer queries', copy: 'Ask questions and get answers, on the platform.' },
];

const checks = ['Company details', 'License information', 'Platform review'];

/* Product-style verification panel that fills the large dark feature card. */
const VerificationCard = () => (
  <div className="lp-reveal group relative col-span-1 flex flex-col overflow-hidden rounded-2xl border border-transparent bg-[var(--lp-ink)] p-6 text-white sm:col-span-2 lg:col-span-2 lg:row-span-2">
    <div aria-hidden className="lp-grid-bg pointer-events-none absolute inset-0 opacity-25" />

    <div className="relative">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--lp-blue-bright)]/15 text-[var(--lp-blue-bright)]">
        <BadgeCheck className="h-5 w-5" />
      </span>
      <h3 className="lp-display mt-5 text-2xl font-semibold">Platform-verified insurers</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-white/70">
        Every insurer is reviewed and approved before their plans can reach customers.
      </p>
    </div>

    {/* verification interface */}
    <div className="relative mt-6 rounded-xl border border-white/12 bg-white/[0.04] p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <span className="lp-eyebrow text-white/55">Platform verification</span>
        <span className="lp-mono text-[10px] text-white/40">INS-verify</span>
      </div>

      {/* insurer identity */}
      <div className="flex items-center gap-3 py-3.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-[var(--lp-blue-bright)]">
          <Building2 className="h-4 w-4" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">Meridian Assurance</p>
          <p className="text-[11px] text-white/50">Insurer profile</p>
        </div>
      </div>

      {/* review checklist */}
      <ul className="space-y-2">
        {checks.map((label) => (
          <li
            key={label}
            className="lp-verify-row flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2"
          >
            <span className="text-xs text-white/75">{label}</span>
            <span className="lp-verify-check flex h-5 w-5 items-center justify-center rounded-full bg-[var(--lp-green)] text-white">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
          </li>
        ))}
      </ul>

      {/* approval state */}
      <div className="lp-verify-approve mt-3 flex items-center justify-between rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-2.5">
        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
          <BadgeCheck className="h-4 w-4" /> Verified &amp; approved
        </span>
        <span className="lp-mono text-[10px] uppercase tracking-wider text-emerald-300/70">status</span>
      </div>

      {/* plan visibility */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-white/55">
          <span>Plan visibility</span>
          <span className="font-semibold text-[var(--lp-blue-bright)]">Ready for marketplace</span>
        </div>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div className="lp-verify-bar h-full w-full rounded-full bg-[var(--lp-blue-bright)]" />
        </div>
      </div>
    </div>
  </div>
);

export const WhySection = () => {
  const scope = useGsapContext((api) => {
    const root = scope.current;
    revealBatch(root, '.lp-reveal', api);

    const { gsap, ScrollTrigger, reduced } = api;
    const card = root.querySelector('.lp-verify-row');
    if (!card) return;

    if (reduced) return; // checkmarks/bar stay in their final state via CSS

    // subtle sequential activation of the verification stages
    gsap.set(['.lp-verify-check', '.lp-verify-approve'], { scale: 0.6, opacity: 0 });
    gsap.set('.lp-verify-bar', { scaleX: 0, transformOrigin: 'left center' });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: root.querySelector('.lp-verify-row'), start: 'top 80%', once: true },
      defaults: { ease: 'back.out(1.7)' },
    });
    tl.to('.lp-verify-check', { scale: 1, opacity: 1, duration: 0.35, stagger: 0.18 })
      .to('.lp-verify-approve', { scale: 1, opacity: 1, duration: 0.4 }, '+=0.1')
      .to('.lp-verify-bar', { scaleX: 1, duration: 0.6, ease: 'power2.out' }, '-=0.2');
  }, []);

  return (
    <section ref={scope} className="border-t border-[var(--lp-line)] bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <div className="lp-reveal"><SectionLabel>Why InsurManage</SectionLabel></div>
          <h2 className="lp-reveal lp-display mt-5 text-4xl font-semibold text-[var(--lp-ink)] sm:text-5xl">
            Built around what the platform actually does.
          </h2>
        </div>

        <div className="mt-14 grid auto-rows-[minmax(0,1fr)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <VerificationCard />

          {items.map(({ icon: Icon, title, copy }) => (
            <div
              key={title}
              className="lp-reveal group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--lp-line)] bg-[var(--lp-paper)] p-6 transition-colors duration-200 hover:border-[var(--lp-blue)]/40"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[var(--lp-blue)]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="lp-display mt-auto pt-8 text-lg font-semibold text-[var(--lp-ink)]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--lp-muted)]">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhySection;
