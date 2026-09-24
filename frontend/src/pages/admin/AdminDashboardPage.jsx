import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Building2, FileCheck, ShieldCheck, FileText, MessageSquare, Clock,
  AlertCircle, Activity, CheckCircle2, PieChart, BarChart3, ArrowRight, ClipboardCheck,
} from 'lucide-react';
import { getAdminDashboardStats } from '../../services/api';
import api from '../../services/api';
import { usePageReveal, SectionCard } from '../../components/customer/ui';
import {
  AdminStatCard, AdminChartCard, DonutChart,
  VERIFICATION_COLORS, VERIFICATION_ORDER, VERIFICATION_LABELS,
} from '../../components/admin/ui';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [verificationCounts, setVerificationCounts] = useState(null); // real, from /admin/insurers
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    const [statsRes, insurersRes] = await Promise.allSettled([
      getAdminDashboardStats(),
      api.get('/admin/insurers'),
    ]);

    if (statsRes.status === 'fulfilled') {
      setStats(statsRes.value);
    } else {
      setError(statsRes.reason?.response?.data?.detail || 'Failed to load platform statistics.');
    }

    if (insurersRes.status === 'fulfilled') {
      const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0, SUSPENDED: 0 };
      (insurersRes.value.data || []).forEach((ins) => {
        if (counts[ins.verification_status] !== undefined) counts[ins.verification_status] += 1;
      });
      setVerificationCounts(counts);
    }

    setLoading(false);
  };

  const { scope } = usePageReveal([loading]);

  const donutData = VERIFICATION_ORDER.map((key) => ({
    key,
    label: VERIFICATION_LABELS[key],
    value: verificationCounts?.[key] ?? 0,
    color: VERIFICATION_COLORS[key],
  }));
  const verificationTotal = donutData.reduce((sum, d) => sum + d.value, 0);

  // Real platform-activity bars — all values sourced directly from the stats API.
  const activityBars = [
    { key: 'customers', label: 'Registered customers', value: stats?.total_customers ?? 0, color: '#3b82f6' },
    { key: 'plans', label: 'Active plans', value: stats?.active_plans ?? 0, color: '#0ea5e9' },
    { key: 'applications', label: 'Total applications', value: stats?.total_applications ?? 0, color: '#6366f1' },
    { key: 'policies', label: 'Active policies', value: stats?.active_policies ?? 0, color: '#10b981' },
    { key: 'queries', label: 'Open queries', value: stats?.open_queries ?? 0, color: '#f43f5e' },
  ];
  const activityMax = Math.max(1, ...activityBars.map((b) => b.value));

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-2xl bg-slate-200/70" />
          <div className="h-72 animate-pulse rounded-2xl bg-slate-200/70" />
        </div>
      </div>
    );
  }

  return (
    <div ref={scope} className="mx-auto max-w-6xl space-y-5">
      {/* Header */}
      <div className="lp-reveal-d flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Platform overview</h1>
        <p className="text-sm text-slate-500">
          Monitor marketplace activity and manage insurer vendor verification.
        </p>
      </div>

      {error && (
        <div className="lp-reveal-d flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/60 p-4 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI grid */}
      <div className="lp-reveal-d grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="Pending insurers"
          value={stats?.pending_insurers ?? 0}
          icon={Clock}
          accent="amber"
          to="/admin/insurers"
          actionRequired
        />
        <AdminStatCard
          label="Approved insurers"
          value={stats?.approved_insurers ?? 0}
          icon={Building2}
          accent="emerald"
          to="/admin/insurers"
          description={`of ${stats?.total_insurers ?? 0} vendors`}
        />
        <AdminStatCard
          label="Registered customers"
          value={stats?.total_customers ?? 0}
          icon={Users}
          accent="blue"
          description="Total accounts"
        />
        <AdminStatCard
          label="Active plans"
          value={stats?.active_plans ?? 0}
          icon={FileCheck}
          accent="sky"
          description="Marketplace live"
        />
        <AdminStatCard
          label="Total applications"
          value={stats?.total_applications ?? 0}
          icon={FileText}
          accent="blue"
          description="Customer submitted"
        />
        <AdminStatCard
          label="Active policies"
          value={stats?.active_policies ?? 0}
          icon={ShieldCheck}
          accent="emerald"
          description="Currently in force"
        />
        <AdminStatCard
          label="Open queries"
          value={stats?.open_queries ?? 0}
          icon={MessageSquare}
          accent="rose"
          description="Awaiting response"
        />
        <AdminStatCard
          label="Total users"
          value={stats?.total_users ?? 0}
          icon={Users}
          accent="slate"
          description="All roles"
        />
      </div>

      {/* Charts row */}
      <div className="lp-reveal-d grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Verification distribution donut */}
        <AdminChartCard
          icon={PieChart}
          title="Insurer verification distribution"
          subtitle="Live breakdown of every registered vendor by status"
        >
          {verificationCounts ? (
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
              <div className="shrink-0">
                <DonutChart data={donutData} centerLabel="Vendors" />
              </div>
              <ul className="w-full space-y-2.5">
                {donutData.map((d) => {
                  const pct = verificationTotal ? Math.round((d.value / verificationTotal) * 100) : 0;
                  return (
                    <li key={d.key} className="flex items-center gap-3 text-sm">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="flex-1 text-slate-600">{d.label}</span>
                      <span className="font-semibold text-slate-900">{d.value}</span>
                      <span className="w-10 text-right text-xs text-slate-400">{pct}%</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">
              Vendor distribution unavailable.
            </div>
          )}
        </AdminChartCard>

        {/* Platform activity bars — real stat counts */}
        <AdminChartCard
          icon={BarChart3}
          title="Platform activity"
          subtitle="Current totals across the marketplace"
        >
          <ul className="space-y-4">
            {activityBars.map((b) => (
              <li key={b.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">{b.label}</span>
                  <span className="font-semibold text-slate-900">{b.value}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(b.value / activityMax) * 100}%`, backgroundColor: b.color }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </AdminChartCard>
      </div>

      {/* Bottom row — operational status + quick actions */}
      <div className="lp-reveal-d grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard icon={Activity} title="System status">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Services operational</p>
              <p className="text-xs text-slate-500">Admin API responding normally.</p>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Total users</dt>
              <dd className="mt-1 text-lg font-bold text-slate-900">{stats?.total_users ?? 0}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Total insurers</dt>
              <dd className="mt-1 text-lg font-bold text-slate-900">{stats?.total_insurers ?? 0}</dd>
            </div>
          </dl>
        </SectionCard>

        <SectionCard icon={ClipboardCheck} title="Quick actions">
          <div className="space-y-3">
            <Link
              to="/admin/insurers"
              className="group flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4 transition-colors hover:border-amber-300 hover:bg-amber-50 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Clock className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Review pending insurers</p>
                  <p className="text-xs text-slate-500">{stats?.pending_insurers ?? 0} awaiting verification</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/admin/insurers"
              className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition-colors hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Building2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">View all insurers</p>
                  <p className="text-xs text-slate-500">{stats?.total_insurers ?? 0} registered vendors</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
