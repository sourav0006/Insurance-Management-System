import React from 'react';
import { Compass, GitCompareArrows, FileText, TrendingUp, FolderClock } from 'lucide-react';
import { useGsapContext, revealBatch } from './useGsapContext';
import SectionLabel from './SectionLabel';

const stages = [
  { icon: Compass, label: 'Discover' },
  { icon: GitCompareArrows, label: 'Compare' },
  { icon: FileText, label: 'Apply' },
  { icon: TrendingUp, label: 'Track' },
  { icon: FolderClock, label: 'Manage' },
];

export const ProblemSection = () => {
  const scope = useGsapContext((api) => {
    revealBatch(scope.current, '.lp-reveal', api);
  }, []);

  return (
    <section ref={scope} className="border-t border-[var(--lp-line)] bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <div className="lp-reveal"><SectionLabel>The problem</SectionLabel></div>
            <h2 className="lp-reveal lp-display mt-5 text-4xl font-semibold text-[var(--lp-ink)] sm:text-5xl">
              Insurance is scattered across too many places.
            </h2>
          </div>
          <p className="lp-reveal max-w-lg text-lg leading-relaxed text-[var(--lp-ink-soft)]">
            Finding a plan, comparing the fine print, applying, chasing status updates, then keeping track of
            policies — it usually means juggling separate sites, forms and inboxes. InsurManage brings the whole
            path into a single, connected platform.
          </p>
        </div>

        {/* connected pipeline */}
        <div className="lp-reveal mt-16 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          {stages.map(({ icon: Icon, label }, i) => (
            <React.Fragment key={label}>
              <div className="flex flex-1 items-center gap-3 rounded-xl border border-[var(--lp-line)] bg-[var(--lp-paper)] px-4 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[var(--lp-blue)] shadow-sm">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="lp-display font-semibold text-[var(--lp-ink)]">{label}</span>
              </div>
              {i < stages.length - 1 && (
                <span aria-hidden className="mx-auto h-5 w-px bg-[var(--lp-line)] sm:h-px sm:w-5" />
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="lp-reveal mt-6 lp-eyebrow text-[var(--lp-muted)]">
          Discover → Compare → Apply → Track → Manage — connected end to end
        </p>
      </div>
    </section>
  );
};

export default ProblemSection;
