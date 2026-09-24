import React from 'react';
import { Link } from 'react-router-dom';
import { User, Building2, Compass, GitCompareArrows, FileText, TrendingUp, FolderClock, MessageSquare, ShieldCheck, BadgeCheck, ClipboardCheck, FileSignature, ArrowRight } from 'lucide-react';
import { useGsapContext, revealBatch } from './useGsapContext';
import SectionLabel from './SectionLabel';

const customer = [
  { icon: Compass, label: 'Discover plans' },
  { icon: GitCompareArrows, label: 'Compare coverage' },
  { icon: FileText, label: 'Apply online' },
  { icon: TrendingUp, label: 'Track applications' },
  { icon: FolderClock, label: 'Manage policies' },
  { icon: MessageSquare, label: 'Ask insurers questions' },
];

const insurer = [
  { icon: Building2, label: 'Register a company' },
  { icon: BadgeCheck, label: 'Get verified' },
  { icon: FileSignature, label: 'Create insurance plans' },
  { icon: ClipboardCheck, label: 'Review applications' },
  { icon: ShieldCheck, label: 'Issue policies' },
  { icon: MessageSquare, label: 'Respond to queries' },
];

const Column = ({ tone, icon: Icon, kicker, title, items }) => {
  const dark = tone === 'dark';
  return (
    <div
      className={`lp-reveal relative overflow-hidden rounded-2xl border p-8 ${
        dark
          ? 'border-white/10 bg-[var(--lp-ink)] text-white'
          : 'border-[var(--lp-line)] bg-white text-[var(--lp-ink)]'
      }`}
    >
      {dark && <div aria-hidden className="lp-grid-bg pointer-events-none absolute inset-0 opacity-40" />}
      <div className="relative">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              dark ? 'bg-white/10 text-[var(--lp-blue-bright)]' : 'bg-blue-50 text-[var(--lp-blue)]'
            }`}
          >
            <Icon className="h-5 w-5" />
          </span>
          <span className={`lp-eyebrow ${dark ? 'text-[var(--lp-blue-bright)]' : 'text-[var(--lp-blue)]'}`}>
            {kicker}
          </span>
        </div>
        <h3 className="lp-display mt-6 text-2xl font-semibold sm:text-3xl">{title}</h3>
        <ul className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {items.map(({ icon: I, label }) => (
            <li
              key={label}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${
                dark ? 'border-white/10 bg-white/[0.03] text-white/80' : 'border-[var(--lp-line)] bg-[var(--lp-paper)] text-[var(--lp-ink-soft)]'
              }`}
            >
              <I className={`h-4 w-4 shrink-0 ${dark ? 'text-[var(--lp-blue-bright)]' : 'text-[var(--lp-blue)]'}`} />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export const TwoSidesSection = () => {
  const scope = useGsapContext((api) => {
    revealBatch(scope.current, '.lp-reveal', api);
  }, []);

  return (
    <section ref={scope} className="border-t border-[var(--lp-line)] bg-[var(--lp-paper)] py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="lp-reveal mx-auto max-w-2xl text-center">
          <div className="flex justify-center"><SectionLabel>Two sides, one platform</SectionLabel></div>
          <h2 className="lp-display mt-5 text-4xl font-semibold text-[var(--lp-ink)] sm:text-5xl">
            InsurManage sits between the people who need cover and the ones who provide it.
          </h2>
        </div>

        <div className="relative mt-14 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[1fr_auto_1fr]">
          <Column
            tone="light"
            icon={User}
            kicker="For customers"
            title="Find coverage that fits."
            items={customer}
          />

          {/* connective hub */}
          <div className="lp-reveal flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--lp-line)] bg-white px-6 py-5 shadow-sm">
              <ShieldCheck className="h-7 w-7 text-[var(--lp-blue)]" />
              <span className="lp-display text-sm font-semibold text-[var(--lp-ink)]">InsurManage</span>
              <span className="lp-eyebrow text-[var(--lp-muted)]">connection layer</span>
            </div>
          </div>

          <Column
            tone="dark"
            icon={Building2}
            kicker="For insurers"
            title="Manage products and customers."
            items={insurer}
          />
        </div>

        <div className="lp-reveal mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/register"
            className="group inline-flex items-center gap-2 rounded-xl bg-[var(--lp-blue)] px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#025687]"
          >
            Create your account
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--lp-line)] bg-white px-6 py-3 text-sm font-semibold text-[var(--lp-ink)] transition-colors duration-200 hover:border-[var(--lp-blue)] hover:text-[var(--lp-blue)]"
          >
            Browse the marketplace
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TwoSidesSection;
