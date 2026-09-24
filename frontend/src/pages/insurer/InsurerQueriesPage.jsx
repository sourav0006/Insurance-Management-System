import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, User, Calendar, ChevronRight, AlertTriangle } from 'lucide-react';
import { getInsurerQueries } from '../../services/api';
import {
  usePageReveal, StatusBadge, EmptyState, ErrorState, formatDate,
} from '../../components/customer/ui';
import { WorkspaceHeader, SearchInput, FilterTabs } from '../../components/insurer/ui';

const FILTER_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'RESPONDED', label: 'Responded' },
  { value: 'CLOSED', label: 'Closed' },
];

const InsurerQueriesPage = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInsurerQueries();
      setQueries(data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load received queries.');
    } finally {
      setLoading(false);
    }
  };

  const filteredQueries = queries.filter((q) => {
    const matchesSearch =
      q.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const { scope } = usePageReveal([loading]);

  return (
    <div ref={scope} className="mx-auto max-w-6xl space-y-5">
      <WorkspaceHeader
        title="Customer inquiries"
        subtitle="Review and respond to customer questions regarding your insurance plans."
      />

      {/* Toolbar */}
      <div className="lp-reveal-d flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search subject or customer…"
          className="sm:flex-1"
        />
        <FilterTabs value={statusFilter} onChange={setStatusFilter} options={FILTER_OPTIONS} />
      </div>

      {error && <ErrorState icon={AlertTriangle} title={error} onRetry={fetchQueries} />}

      {loading && !error && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {!loading && !error && filteredQueries.length === 0 && (
        <EmptyState
          icon={MessageSquare}
          title="No queries received"
          description={
            searchQuery || statusFilter !== 'ALL'
              ? 'No customer inquiries match your filter criteria.'
              : 'You have not received any customer support inquiries yet.'
          }
        />
      )}

      {!loading && !error && filteredQueries.length > 0 && (
        <div className="lp-reveal-d overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="divide-y divide-slate-100">
            {filteredQueries.map((query) => (
              <button
                key={query.id}
                onClick={() => navigate(`/insurer/queries/${query.id}`)}
                className="group flex w-full flex-col justify-between gap-3 p-5 text-left transition-colors hover:bg-slate-50/80 sm:flex-row sm:items-center"
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
                      <User className="h-3.5 w-3.5 text-slate-400" /> {query.customer_name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" /> Received {formatDate(query.created_at)}
                    </span>
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-blue-600">
                  Manage query
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InsurerQueriesPage;
