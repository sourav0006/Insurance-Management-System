import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Store, Building2, Calendar, ArrowRight, RefreshCw,
} from 'lucide-react';
import { getMyPolicies } from '../../services/api';
import {
  usePageReveal, PageHeader, StatusBadge, EmptyState, ErrorState,
  formatINR, formatDate, primaryBtn,
} from '../../components/customer/ui';

export const MyPoliciesPage = () => {
  const navigate = useNavigate();

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyPolicies();
      setPolicies(data || []);
    } catch (err) {
      console.error('Failed to load customer policies:', err);
      setError('Unable to load your policies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const { scope } = usePageReveal([loading]);

  return (
    <div ref={scope} className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="My Insurance Policies"
        subtitle="View your active policy documentation, coverage periods and terms."
        action={
          <Link to="/customer/marketplace" className={primaryBtn}>
            <Store className="h-4 w-4" /> Browse Marketplace
          </Link>
        }
      />

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200/70" />
              <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200/70" />
              <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <ErrorState
          icon={RefreshCw}
          title={error}
          description="We couldn't reach the policy service."
          onRetry={fetchPolicies}
        />
      )}

      {/* Empty */}
      {!loading && !error && policies.length === 0 && (
        <EmptyState
          icon={ShieldCheck}
          title="No active policies yet"
          description="Your policy will appear here once an application is approved and a policy is issued."
          ctaLabel="Explore insurance plans"
          ctaTo="/customer/marketplace"
        />
      )}

      {/* Policy cards */}
      {!loading && !error && policies.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="lp-reveal-d group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-blue-300 hover:shadow-[0_16px_40px_-24px_rgba(11,31,51,0.5)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    POLICY {policy.policy_number}
                  </p>
                  <h3 className="mt-0.5 truncate text-base font-bold text-slate-900">{policy.plan_name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate font-medium text-slate-700">{policy.company_name}</span>
                  </p>
                </div>
                <StatusBadge status={policy.status} />
              </div>

              {/* Coverage / premium highlight */}
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Coverage</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">{formatINR(policy.coverage_amount)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Premium</p>
                  <p className="mt-0.5 text-sm font-bold text-blue-600">
                    {formatINR(policy.premium_amount)}
                    <span className="text-[11px] font-normal text-slate-500"> / {policy.premium_frequency}</span>
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Valid <strong className="font-semibold text-slate-700">{formatDate(policy.start_date)} – {formatDate(policy.end_date)}</strong>
              </div>

              <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
                <button
                  onClick={() => navigate(`/customer/policies/${policy.id}`)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                >
                  View policy details
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPoliciesPage;
