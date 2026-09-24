import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Search, FileText, ShieldCheck, MessageSquare, Compass,
  ClipboardCheck, Building2, Clock, CheckCircle2, XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getMyApplications, getMyPolicies, getMyQueries } from '../../services/api';
import { useGsapContext } from '../../components/landing/useGsapContext';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const formatINR = (val) =>
  val === null || val === undefined
    ? 'N/A'
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const formatDate = (d) =>
  !d ? 'N/A' : new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

const appStatusChip = (status) => {
  const map = {
    SUBMITTED: { cls: 'bg-blue-50 text-blue-700 border-blue-200', Icon: Clock, label: 'Submitted' },
    UNDER_REVIEW: { cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Clock, label: 'Under review' },
    APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2, label: 'Approved' },
    REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', Icon: XCircle, label: 'Rejected' },
  };
  const s = map[status] || { cls: 'bg-slate-100 text-slate-600 border-slate-200', Icon: Clock, label: status };
  const { Icon } = s;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${s.cls}`}>
      <Icon className="h-3.5 w-3.5" /> {s.label}
    </span>
  );
};

/** Animated count-up for real numeric values (respects reduced motion via hook). */
const useCountUp = (ref, value, reduced) => {
  useEffect(() => {
    if (!ref.current) return;
    if (reduced) {
      ref.current.textContent = String(value);
      return;
    }
    let raf;
    const start = performance.now();
    const dur = 700;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      ref.current.textContent = String(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ref, value, reduced]);
};

const StatCard = ({ to, label, value, hint, Icon, accent, reduced }) => {
  const numRef = useRef(null);
  useCountUp(numRef, value, reduced);
  return (
    <Link
      to={to}
      className="lp-reveal-d group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_16px_40px_-24px_rgba(11,31,51,0.5)]"
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-1.5 flex items-baseline gap-1 text-3xl font-bold text-slate-900">
          <span ref={numRef}>0</span>
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors group-hover:text-blue-600">
          {hint} <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
        </p>
      </div>
      <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-6 w-6" />
      </span>
    </Link>
  );
};

const journey = [
  { Icon: Compass, title: 'Explore', copy: 'Browse verified plans' },
  { Icon: FileText, title: 'Apply', copy: 'Submit an application' },
  { Icon: ClipboardCheck, title: 'Review', copy: 'Insurer reviews it' },
  { Icon: ShieldCheck, title: 'Policy', copy: 'Coverage goes active' },
];

export const CustomerDashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ apps: [], policies: [], queries: [] });
  const [loading, setLoading] = useState(true);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [apps, policies, queries] = await Promise.all([
        getMyApplications().catch(() => []),
        getMyPolicies().catch(() => []),
        getMyQueries().catch(() => []),
      ]);
      if (mounted) {
        setData({ apps: apps || [], policies: policies || [], queries: queries || [] });
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const scope = useGsapContext(({ gsap, reduced: r }) => {
    setReduced(r);
    const targets = scope.current?.querySelectorAll('.lp-reveal-d');
    if (!targets || !targets.length) return;

    // Always guarantee the final visible state, regardless of motion pref
    // or StrictMode mount/revert cycles (avoids cards stuck at opacity 0).
    if (r) {
      gsap.set(targets, { opacity: 1, y: 0 });
      return;
    }
    gsap.fromTo(
      targets,
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08, clearProps: 'transform,opacity' }
    );
  }, [loading]);

  const activePolicies = data.policies.filter((p) => p.status === 'ACTIVE').length;
  const openQueries = data.queries.filter((q) => q.status === 'OPEN' || q.status === 'RESPONDED').length;
  const recentApp = [...data.apps].sort(
    (a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0)
  )[0];
  const recentPolicy = data.policies.find((p) => p.status === 'ACTIVE') || data.policies[0];

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200/70" />)}
        </div>
      </div>
    );
  }

  return (
    <div ref={scope} className="mx-auto max-w-6xl space-y-5">
      {/* Greeting */}
      <div className="lp-reveal-d">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {greeting()}, {user?.full_name || 'Customer'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage your coverage, applications and policies from one place.
        </p>
      </div>

      {/* Marketplace feature panel */}
      <div className="lp-reveal-d relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.22), transparent 65%)' }}
        />
        <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-sky-300">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified marketplace
            </span>
            <h3 className="mt-4 text-2xl font-bold sm:text-3xl" style={{ letterSpacing: '-0.02em' }}>
              Find coverage that fits your life
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Explore verified insurance plans, compare coverage and premiums, and apply in a few steps.
            </p>
          </div>
          <Link
            to="/customer/marketplace"
            className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-lg transition-colors duration-200 hover:bg-sky-50"
          >
            Explore insurance plans
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Overview stats — real counts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          to="/customer/applications" label="Applications" value={data.apps.length}
          hint="View your applications" Icon={FileText}
          accent="bg-blue-50 text-blue-600" reduced={reduced}
        />
        <StatCard
          to="/customer/policies" label="Active Policies" value={activePolicies}
          hint="Your active coverage" Icon={ShieldCheck}
          accent="bg-emerald-50 text-emerald-600" reduced={reduced}
        />
        <StatCard
          to="/customer/queries" label="Open Queries" value={openQueries}
          hint="Conversations with insurers" Icon={MessageSquare}
          accent="bg-violet-50 text-violet-600" reduced={reduced}
        />
        <Link
          to="/customer/marketplace"
          className="lp-reveal-d group relative flex items-center justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_16px_40px_-24px_rgba(11,31,51,0.5)]"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Available Plans</p>
            <p className="mt-1.5 text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-600">Browse plans</p>
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors group-hover:text-blue-600">
              Explore marketplace
              <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
            </p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Search className="h-6 w-6" />
          </span>
        </Link>
      </div>

      {/* Recent activity + Journey */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent activity (2 cols) */}
        <div className="lp-reveal-d space-y-4 lg:col-span-2">
          {/* Recent application */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Recent application</h3>
              <Link to="/customer/applications" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View all</Link>
            </div>
            {recentApp ? (
              <Link
                to={`/customer/applications/${recentApp.id}`}
                className="group flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition-colors hover:border-blue-300 hover:bg-white"
              >
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">APP {recentApp.application_number}</p>
                  <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-blue-600">{recentApp.plan_name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <Building2 className="h-3.5 w-3.5" /> {recentApp.company_name} · {formatDate(recentApp.submitted_at)}
                  </p>
                </div>
                {appStatusChip(recentApp.status)}
              </Link>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">No applications yet</p>
                  <p className="mt-0.5 text-xs text-slate-500">Start by exploring available insurance plans.</p>
                </div>
                <Link to="/customer/marketplace" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700">
                  Explore plans <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Active policy */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Active coverage</h3>
              <Link to="/customer/policies" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View all</Link>
            </div>
            {recentPolicy ? (
              <Link
                to={`/customer/policies/${recentPolicy.id}`}
                className="group flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition-colors hover:border-emerald-300 hover:bg-white"
              >
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">POLICY {recentPolicy.policy_number}</p>
                  <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-emerald-700">{recentPolicy.plan_name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <ShieldCheck className="h-3.5 w-3.5" /> Coverage {formatINR(recentPolicy.coverage_amount)}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {recentPolicy.status}
                </span>
              </Link>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">No active policies yet</p>
                  <p className="mt-0.5 text-xs text-slate-500">Once an application is approved, your policy will appear here.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Insurance journey */}
        <div className="lp-reveal-d rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Your insurance journey</h3>
          <p className="mt-1 text-xs text-slate-500">How coverage comes together on InsurManage.</p>
          <ol className="relative mt-5 space-y-1">
            <span aria-hidden className="absolute left-[1.35rem] top-3 bottom-3 w-px bg-slate-200" />
            {journey.map((step, i) => {
              const Icon = step.Icon;
              return (
                <li key={step.title} className="relative flex items-start gap-3.5 rounded-xl p-2.5">
                  <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="pt-0.5">
                    <p className="text-sm font-semibold text-slate-900">
                      <span className="font-mono mr-1.5 text-[11px] text-slate-400">0{i + 1}</span>
                      {step.title}
                    </p>
                    <p className="text-xs text-slate-500">{step.copy}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <Link
            to="/customer/marketplace"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Start exploring <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboardPage;
