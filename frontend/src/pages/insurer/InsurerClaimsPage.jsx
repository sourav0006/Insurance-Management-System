import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck, Search, AlertCircle, ChevronRight, Filter } from 'lucide-react';
import { getInsurerClaims } from '../../services/api';
import { usePageReveal, StatusBadge, EmptyState, ErrorState, formatINR, formatDate } from '../../components/customer/ui';

export const InsurerClaimsPage = () => {
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClaims = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const data = await getInsurerClaims(params);
      setClaims(data || []);
    } catch (err) {
      console.error('Failed to load insurer claims:', err);
      setError('Unable to load claims. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [statusFilter]);

  const { scope } = usePageReveal([loading]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchClaims();
  };

  return (
    <div ref={scope} className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="lp-reveal-d flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Customer Claims Management</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Review, adjudicate, approve, reject, and settle claims filed against your insurance policies.
          </p>
        </div>
      </div>

      {/* Search & Status Filter */}
      <div className="lp-reveal-d flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search claim number, customer name, policy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SETTLED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'ALL' ? 'All Claims' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          icon={AlertCircle}
          title="Error loading claims"
          description={error}
          onRetry={fetchClaims}
        />
      ) : claims.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No Claims Found"
          description="There are currently no claims matching your search criteria."
        />
      ) : (
        <div className="space-y-3.5">
          {claims.map((claim) => (
            <div
              key={claim.id}
              onClick={() => navigate(`/insurer/claims/${claim.id}`)}
              className="group relative flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md sm:flex-row sm:items-center cursor-pointer"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold tracking-wider text-blue-600">
                    {claim.claim_number}
                  </span>
                  <StatusBadge status={claim.status} />
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                    {claim.claim_type}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Customer: {claim.customer_name} ({claim.customer_email})
                </h3>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                  <span>Policy: <strong className="font-semibold text-slate-700">{claim.policy_number}</strong></span>
                  <span>Plan: <strong className="font-semibold text-slate-700">{claim.plan_name}</strong></span>
                  <span>Incident Date: <strong className="font-semibold text-slate-700">{formatDate(claim.incident_date)}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0 sm:justify-end">
                <div className="text-left sm:text-right">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Claim Amount</p>
                  <p className="text-lg font-extrabold text-slate-900">{formatINR(claim.claim_amount)}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InsurerClaimsPage;
