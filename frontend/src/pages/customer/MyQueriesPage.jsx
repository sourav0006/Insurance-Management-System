import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare, Plus, Search, Building2, Calendar, ArrowRight, RefreshCw,
} from 'lucide-react';
import { getMyQueries } from '../../services/api';
import {
  usePageReveal, PageHeader, StatusBadge, EmptyState, ErrorState, formatDate, primaryBtn,
} from '../../components/customer/ui';

const FILTERS = ['ALL', 'OPEN', 'RESPONDED', 'CLOSED'];

const MyQueriesPage = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const navigate = useNavigate();

  const fetchQueries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyQueries();
      setQueries(data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load your queries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const filteredQueries = queries.filter((q) => {
    const matchesSearch =
      q.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.company_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const { scope } = usePageReveal([loading]);

  return (
    <div ref={scope} className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Customer Support"
        subtitle="Ask verified insurers questions and manage your support conversations."
        action={
          <Link to="/customer/queries/new" className={primaryBtn}>
            <Plus className="h-4 w-4" /> Ask a Question
          </Link>
        }
      />

      {/* Search + filters */}
      <div className="lp-reveal-d flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by subject or insurer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {FILTERS.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <ErrorState
          icon={RefreshCw}
          title={error}
          description="We couldn't reach the support service."
          onRetry={fetchQueries}
        />
      )}

      {/* Loading skeleton */}
      {loading && !error && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="h-5 w-1/2 animate-pulse rounded bg-slate-200/70" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200/70" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filteredQueries.length === 0 && (
        <EmptyState
          icon={MessageSquare}
          title="No queries found"
          description={
            searchQuery || statusFilter !== 'ALL'
              ? 'No queries match your current filters. Try adjusting them.'
              : 'You have not asked any questions yet. Reach out to a verified insurer to get started.'
          }
          ctaLabel={!searchQuery && statusFilter === 'ALL' ? 'Ask a Question' : undefined}
          ctaTo={!searchQuery && statusFilter === 'ALL' ? '/customer/queries/new' : undefined}
        />
      )}

      {/* Query list */}
      {!loading && !error && filteredQueries.length > 0 && (
        <div className="space-y-3">
          {filteredQueries.map((query) => (
            <div
              key={query.id}
              onClick={() => navigate(`/customer/queries/${query.id}`)}
              className="lp-reveal-d group flex cursor-pointer flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-blue-300 hover:shadow-[0_16px_40px_-24px_rgba(11,31,51,0.5)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
                    {query.subject}
                  </span>
                  <StatusBadge status={query.status} />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" /> {query.company_name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> Submitted {formatDate(query.created_at)}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-blue-600">
                View details
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyQueriesPage;
