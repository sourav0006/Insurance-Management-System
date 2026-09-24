import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, ClipboardList, ShieldCheck, MessageSquare, PlusCircle, ArrowRight,
  CheckCircle2, AlertCircle, XCircle, Clock, Building2, Inbox,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getInsurerApplications, getInsurerPolicies, getInsurerQueries,
} from '../../services/api';
import api from '../../services/api';
import {
  usePageReveal, SectionCard, StatusBadge, EmptyState, formatDate, primaryBtn, subtleBtn,
} from '../../components/customer/ui';

/* Compact metric tile — real counts only, with an optional actionable sub-count. */
const MetricTile = ({ icon: Icon, label, value, hint, to, accent }) => {
  const accents = {
    blue: 'bg-blue-50 text-blue-600',
    sky: 'bg-sky-50 text-sky-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <Link
      to={to}
      className="lp-reveal-d group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-blue-300 hover:shadow-[0_16px_40px_-24px_rgba(11,31,51,0.5)]"
    >
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-1.5 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
        {hint && <p className="mt-1 text-xs font-medium text-slate-500">{hint}</p>}
      </div>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${accents[accent]}`}>
        <Icon className="h-5 w-5" />
      </span>
    </Link>
  );
};

const QuickAction = ({ icon: Icon, label, description, to }) => (
  <Link
    to={to}
    className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition-colors hover:border-blue-300 hover:bg-blue-50/40"
  >
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
      <Icon className="h-4 w-4" />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="truncate text-xs text-slate-500">{description}</p>
    </div>
    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-blue-600" />
  </Link>
);

/* Verification panel — subtle, professional treatment per state. */
const VerificationPanel = ({ status }) => {
  const map = {
    APPROVED: {
      wrap: 'border-emerald-200 bg-emerald-50/70',
      Icon: CheckCircle2, iconCls: 'text-emerald-600',
      title: 'Verified partner',
      body: 'Your vendor account is fully verified. You can publish plans and process customer applications.',
    },
    PENDING: {
      wrap: 'border-amber-200 bg-amber-50/70',
      Icon: Clock, iconCls: 'text-amber-600',
      title: 'Verification pending',
      body: 'Your registration is submitted and awaiting Platform Admin review. Plan publishing unlocks once approved.',
    },
    REJECTED: {
      wrap: 'border-rose-200 bg-rose-50/70',
      Icon: XCircle, iconCls: 'text-rose-600',
      title: 'Verification rejected',
      body: 'Your vendor application was rejected. Review your company profile and contact the administrator.',
    },
    SUSPENDED: {
      wrap: 'border-slate-300 bg-slate-100/70',
      Icon: AlertCircle, iconCls: 'text-slate-600',
      title: 'Account suspended',
      body: 'Your vendor account is temporarily suspended. Please contact the Platform Administrator.',
    },
  };
  const s = map[status] || map.PENDING;
  const { Icon } = s;
  return (
    <div className={`lp-reveal-d flex items-start gap-3 rounded-2xl border p-5 ${s.wrap}`}>
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${s.iconCls}`} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{s.title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{s.body}</p>
      </div>
    </div>
  );
};

export const InsurerDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [applications, setApplications] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  const status = user?.verification_status || 'PENDING';
  const isApproved = status === 'APPROVED';

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      // Resilient fetch — some endpoints 403 until the vendor is approved.
      const [plansRes, appsRes, polsRes, queriesRes] = await Promise.allSettled([
        api.get('/plans/my'),
        getInsurerApplications(),
        getInsurerPolicies(),
        getInsurerQueries(),
      ]);
      if (!active) return;
      if (plansRes.status === 'fulfilled') setPlans(plansRes.value.data || []);
      if (appsRes.status === 'fulfilled') setApplications(appsRes.value || []);
      if (polsRes.status === 'fulfilled') setPolicies(polsRes.value || []);
      if (queriesRes.status === 'fulfilled') setQueries(queriesRes.value || []);
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  // Derived real metrics
  const activePlans = plans.filter((p) => p.status === 'ACTIVE').length;
  const pendingReview = applications.filter(
    (a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW'
  ).length;
  const activePolicies = policies.filter((p) => p.status === 'ACTIVE').length;
  const openQueries = queries.filter((q) => q.status === 'OPEN').length;

  const recentApplications = [...applications]
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
    .slice(0, 5);
  const recentQueries = [...queries]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const { scope } = usePageReveal([loading]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="h-28 animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200/70" />
      </div>
    );
  }

  return (
    <div ref={scope} className="mx-auto max-w-6xl space-y-5">
      {/* Welcome header */}
      <div className="lp-reveal-d relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.18), transparent 65%)' }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-sky-300">
              <Building2 className="h-3.5 w-3.5" /> Insurer Workspace
            </span>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Welcome, {user?.full_name || 'Insurer Vendor'}
            </h1>
            <p className="mt-1 text-sm text-slate-300">{user?.email}</p>
          </div>
          {isApproved && (
            <Link to="/insurer/plans" className={`${primaryBtn} shrink-0`}>
              <PlusCircle className="h-4 w-4" /> Manage Plans
            </Link>
          )}
        </div>
      </div>

      {/* Verification panel */}
      <VerificationPanel status={status} />

      {/* Real metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          icon={FileText}
          label="Insurance Plans"
          value={plans.length}
          hint={`${activePlans} active`}
          to="/insurer/plans"
          accent="blue"
        />
        <MetricTile
          icon={ClipboardList}
          label="Applications"
          value={applications.length}
          hint={pendingReview > 0 ? `${pendingReview} awaiting review` : 'No pending review'}
          to="/insurer/applications"
          accent="sky"
        />
        <MetricTile
          icon={ShieldCheck}
          label="Policies Issued"
          value={policies.length}
          hint={`${activePolicies} active`}
          to="/insurer/policies"
          accent="emerald"
        />
        <MetricTile
          icon={MessageSquare}
          label="Customer Queries"
          value={queries.length}
          hint={openQueries > 0 ? `${openQueries} open` : 'All handled'}
          to="/insurer/queries"
          accent="amber"
        />
      </div>

      {/* Two-column operational area */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Recent applications */}
        <div className="lp-reveal-d lg:col-span-2">
          <SectionCard
            icon={ClipboardList}
            title="Recent applications"
            action={
              applications.length > 0 && (
                <Link to="/insurer/applications" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                  View all
                </Link>
              )
            }
          >
            {recentApplications.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No applications yet"
                description="Customer applications for your plans will appear here once submitted."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {recentApplications.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => navigate(`/insurer/applications/${app.id}`)}
                    className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-slate-50/80"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600">{app.application_number}</span>
                        <StatusBadge status={app.status} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {app.customer_name} &bull; {app.plan_name} &bull; {formatDate(app.submitted_at)}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
                  </button>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Quick actions + recent queries */}
        <div className="lp-reveal-d space-y-5">
          <SectionCard icon={ArrowRight} title="Quick actions">
            <div className="space-y-2.5">
              <QuickAction icon={ClipboardList} label="Review applications" description={`${pendingReview} awaiting your decision`} to="/insurer/applications" />
              <QuickAction icon={FileText} label="Manage plans" description={`${plans.length} product${plans.length === 1 ? '' : 's'} configured`} to="/insurer/plans" />
              <QuickAction icon={MessageSquare} label="Answer queries" description={`${openQueries} open inquir${openQueries === 1 ? 'y' : 'ies'}`} to="/insurer/queries" />
              <QuickAction icon={Building2} label="Company profile" description="Update organization details" to="/insurer/profile" />
            </div>
          </SectionCard>

          <SectionCard
            icon={MessageSquare}
            title="Recent queries"
            action={
              queries.length > 0 && (
                <Link to="/insurer/queries" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                  View all
                </Link>
              )
            }
          >
            {recentQueries.length === 0 ? (
              <p className="py-3 text-xs text-slate-500">No customer queries received yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentQueries.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => navigate(`/insurer/queries/${q.id}`)}
                    className="flex w-full items-center justify-between gap-2 py-2.5 text-left"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-900">{q.subject}</p>
                      <p className="truncate text-[11px] text-slate-500">{q.customer_name}</p>
                    </div>
                    <StatusBadge status={q.status} />
                  </button>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default InsurerDashboardPage;
