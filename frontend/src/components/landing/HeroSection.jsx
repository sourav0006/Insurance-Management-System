import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Building2, BadgeCheck, TrendingUp } from 'lucide-react';
import { useGsapContext } from './useGsapContext';
import { formatINR, demoPlans } from './demoData';

const heroPlan = demoPlans[0];

export const HeroSection = () => {
  const scope = useGsapContext(({ gsap, reduced }) => {
    if (reduced) {
      gsap.set('.lp-hero-anim', { opacity: 1, y: 0 });
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.lp-hero-eyebrow', { opacity: 0, y: 16, duration: 0.5 })
      .from('.lp-hero-title .lp-line', { opacity: 0, yPercent: 120, duration: 0.9, stagger: 0.12 }, '-=0.2')
      .from('.lp-hero-copy', { opacity: 0, y: 20, duration: 0.6 }, '-=0.5')
      .from('.lp-hero-cta', { opacity: 0, y: 18, duration: 0.5, stagger: 0.1 }, '-=0.35')
      .from('.lp-hero-meta', { opacity: 0, y: 14, duration: 0.5 }, '-=0.3')
      .from('.lp-hero-card', { opacity: 0, y: 40, scale: 0.96, duration: 0.9 }, '-=0.7')
      .from('.lp-hero-chip', { opacity: 0, x: 24, duration: 0.6, stagger: 0.12 }, '-=0.5');

    // gentle ambient float on the product card
    gsap.to('.lp-hero-card', {
      y: -12,
      duration: 3.4,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });
  }, []);

  return (
    <section ref={scope} className="relative overflow-hidden bg-[var(--lp-paper)]">
      {/* soft depth wash, not a blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60rem 40rem at 78% -10%, rgba(14,165,233,0.10), transparent 60%), radial-gradient(50rem 40rem at 0% 20%, rgba(3,105,161,0.07), transparent 55%)',
        }}
      />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-5 pt-16 pb-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pt-24 lg:pb-28">
        {/* Left — message */}
        <div>
          <div className="lp-hero-eyebrow lp-hero-anim inline-flex items-center gap-2 rounded-full border border-[var(--lp-line)] bg-white px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--lp-green)]" />
            <span className="lp-eyebrow text-[var(--lp-ink-soft)]">Multi-vendor insurance platform</span>
          </div>

          <h1 className="lp-hero-title lp-display mt-6 text-[2.6rem] font-semibold text-[var(--lp-ink)] sm:text-6xl lg:text-[4.1rem]">
            <span className="block overflow-hidden"><span className="lp-line block">Insurance,</span></span>
            <span className="block overflow-hidden"><span className="lp-line block">without the</span></span>
            <span className="block overflow-hidden">
              <span className="lp-line block text-[var(--lp-blue)]">maze.</span>
            </span>
          </h1>

          <p className="lp-hero-copy lp-hero-anim mt-6 max-w-xl text-lg leading-relaxed text-[var(--lp-ink-soft)]">
            InsurManage brings discovery, comparison, applications and policies into one place — where
            customers find coverage that fits and platform-verified insurers manage their products end to end.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/marketplace"
              className="lp-hero-cta lp-hero-anim group inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--lp-blue)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(3,105,161,0.7)] transition-colors duration-200 hover:bg-[#025687]"
            >
              Explore insurance plans
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/register"
              className="lp-hero-cta lp-hero-anim inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--lp-line)] bg-white px-6 py-3.5 text-sm font-semibold text-[var(--lp-ink)] transition-colors duration-200 hover:border-[var(--lp-blue)] hover:text-[var(--lp-blue)]"
            >
              Get started
            </Link>
          </div>

          <div className="lp-hero-meta lp-hero-anim mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-[var(--lp-muted)]">
            <span className="inline-flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-[var(--lp-green)]" /> Platform-verified insurers
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--lp-blue)]" /> Transparent plan details
            </span>
            <span className="inline-flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[var(--lp-blue-bright)]" /> Track every application
            </span>
          </div>
        </div>

        {/* Right — real product preview (marketplace plan card) */}
        <div className="relative">
          <div className="lp-hero-card relative z-10 rounded-2xl border border-[var(--lp-line)] bg-white p-2 shadow-[0_40px_80px_-40px_rgba(11,31,51,0.45)]">
            {/* window chrome */}
            <div className="flex items-center gap-1.5 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#e3e9f0]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#e3e9f0]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#e3e9f0]" />
              <span className="lp-mono ml-3 text-[11px] text-[var(--lp-muted)]">insurmanage · marketplace</span>
            </div>

            <div className="rounded-xl bg-[var(--lp-paper)] p-4">
              {/* plan card mirrors the real marketplace card */}
              <div className="overflow-hidden rounded-xl border border-[var(--lp-line)] bg-white">
                <div className="flex items-center justify-between px-4 pt-4">
                  <span className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[var(--lp-blue)]">
                    {heroPlan.category}
                  </span>
                  <span className="lp-mono text-[10px] uppercase tracking-wider text-slate-400">
                    {heroPlan.plan_code}
                  </span>
                </div>
                <div className="px-4 pt-3">
                  <h3 className="text-base font-bold text-[var(--lp-ink)]">{heroPlan.plan_name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--lp-muted)]">
                    <Building2 className="h-3.5 w-3.5" />
                    <span className="font-medium text-[var(--lp-ink-soft)]">{heroPlan.company_name}</span>
                    <BadgeCheck className="h-3.5 w-3.5 text-[var(--lp-green)]" />
                  </p>
                </div>
                <div className="m-4 space-y-2 rounded-lg border border-[var(--lp-line)] bg-[var(--lp-paper)] p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--lp-muted)]">Coverage</span>
                    <span className="font-bold text-[var(--lp-ink)]">{formatINR(heroPlan.coverage_amount)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[var(--lp-line)] pt-2">
                    <span className="text-[var(--lp-muted)]">Premium</span>
                    <span className="font-bold text-[var(--lp-blue)]">
                      {formatINR(heroPlan.premium_amount)}
                      <span className="font-normal text-[var(--lp-muted)]"> / {heroPlan.premium_frequency}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 pb-4 text-[11px] text-[var(--lp-muted)]">
                  <span>{heroPlan.policy_term_years} yr term</span>
                  <span>{heroPlan.eligibility_min_age}–{heroPlan.eligibility_max_age} yrs eligible</span>
                </div>
              </div>
            </div>
          </div>

          {/* floating status chips — echo real application statuses */}
          <div className="lp-hero-chip absolute -left-3 top-10 z-20 hidden rounded-xl border border-[var(--lp-line)] bg-white px-3.5 py-2.5 shadow-lg sm:block">
            <p className="lp-eyebrow text-[var(--lp-muted)]">Application</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Approved
            </p>
          </div>
          <div className="lp-hero-chip absolute -right-2 bottom-10 z-20 hidden rounded-xl border border-[var(--lp-line)] bg-white px-3.5 py-2.5 shadow-lg sm:block">
            <p className="lp-eyebrow text-[var(--lp-muted)]">Policy</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-[var(--lp-blue)]">
              <ShieldCheck className="h-4 w-4" /> Active
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
