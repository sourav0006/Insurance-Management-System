import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useGsapContext, revealBatch } from './useGsapContext';

export const FinalCTA = () => {
  const scope = useGsapContext((api) => {
    revealBatch(scope.current, '.lp-reveal', api);
  }, []);

  return (
    <section ref={scope} className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
        <span className="lp-reveal inline-flex items-center gap-2 rounded-full border border-[var(--lp-line)] bg-[var(--lp-paper)] px-3 py-1.5">
          <ShieldCheck className="h-4 w-4 text-[var(--lp-green)]" />
          <span className="lp-eyebrow text-[var(--lp-ink-soft)]">Ready when you are</span>
        </span>

        <h2 className="lp-reveal lp-display mt-7 text-5xl font-semibold text-[var(--lp-ink)] sm:text-6xl">
          Insurance, without the maze.
        </h2>
        <p className="lp-reveal mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--lp-ink-soft)]">
          Discover verified plans, apply in a few steps, and manage everything in one place — whether you're
          looking for cover or providing it.
        </p>

        <div className="lp-reveal mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/marketplace"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--lp-blue)] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(3,105,161,0.7)] transition-colors duration-200 hover:bg-[#025687]"
          >
            Explore insurance plans
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--lp-line)] bg-white px-7 py-3.5 text-sm font-semibold text-[var(--lp-ink)] transition-colors duration-200 hover:border-[var(--lp-blue)] hover:text-[var(--lp-blue)]"
          >
            Get started
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
