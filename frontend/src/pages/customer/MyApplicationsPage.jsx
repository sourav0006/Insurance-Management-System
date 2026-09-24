import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, Store, Building2, Calendar, Tag, ArrowRight, XCircle, RefreshCw, Compass,
} from 'lucide-react';
import { getMyApplications } from '../../services/api';
import {
  usePageReveal, PageHeader, StatusBadge, EmptyState, ErrorState, formatDate, primaryBtn,
} from '../../components/customer/ui';

export const MyApplicationsPage = () => {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyApplications();
      setApplications(data || []);
    } catch (err) {
      console.error('Failed to load customer applications:', err);
      setError('Unable to load your applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const { scope } = usePageReveal([loading]);

  return (
    <div ref={scope} className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="My Insurance Applications"
        subtitle="Track and monitor the status of your submitted insurance applications."
        action={
          <Link to="/customer/marketplace" className={primaryBtn}>
            <Store className="h-4 w-4" /> Browse Marketplace
          </Link>
        }
      />

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200/70" />
              <div className="h-5 w-1/2 animate-pulse rounded bg-slate-200/70" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200/70" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <ErrorState
          icon={RefreshCw}
          title={error}
          description="We couldn't reach the application service."
          onRetry={fetchApplications}
        />
      )}

      {/* Empty */}
      {!loading && !error && applications.length === 0 && (
        <EmptyState
          icon={Compass}
          title="No applications yet"
          description="Explore verified insurance plans and apply for coverage that fits your needs."
          ctaLabel="Explore marketplace"
          ctaTo="/customer/marketplace"
        />
      )}

      {/* List */}
      {!loading && !error && applications.length > 0 && (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="lp-reveal-d group rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-blue-300 hover:shadow-[0_16px_40px_-24px_rgba(11,31,51,0.5)] sm:p-6"
            >
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    APP {app.application_number}
                  </p>
                  <h3 className="mt-0.5 text-lg font-bold text-slate-900">{app.plan_name}</h3>
                </div>
                <StatusBadge status={app.status} size="md" />
              </div>

              <div className="grid grid-cols-1 gap-3 pt-4 text-xs text-slate-600 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">
                    Insurer <strong className="font-semibold text-slate-800">{app.company_name}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">
                    <strong className="font-semibold text-slate-800">{app.category}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                  <span>
                    Submitted <strong className="font-semibold text-slate-800">{formatDate(app.submitted_at)}</strong>
                  </span>
                </div>
              </div>

              {/* Rejection note */}
              {app.status === 'REJECTED' && app.rejection_reason && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-xs">
                  <p className="flex items-center gap-1.5 font-semibold text-rose-700">
                    <XCircle className="h-3.5 w-3.5" /> Reason for rejection
                  </p>
                  <p className="mt-1 pl-5 font-medium text-slate-700">{app.rejection_reason}</p>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => navigate(`/customer/applications/${app.id}`)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                >
                  View details
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

export default MyApplicationsPage;
