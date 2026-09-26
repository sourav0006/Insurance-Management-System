import React, { useState, useEffect } from 'react';
import { FileCheck, Search, AlertCircle, Eye, ShieldCheck, X } from 'lucide-react';
import { getAdminClaims } from '../../services/api';
import { usePageReveal, StatusBadge, EmptyState, ErrorState, formatINR, formatDate } from '../../components/customer/ui';

export const AdminClaimsPage = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClaim, setSelectedClaim] = useState(null);

  const fetchClaims = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const data = await getAdminClaims(params);
      setClaims(data || []);
    } catch (err) {
      console.error('Failed to load admin claims:', err);
      setError('Unable to load platform claims.');
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Platform Claims Oversight</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Read-only visibility into all insurance claims processed across insurers and customers.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="lp-reveal-d flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search claim number, customer, policy..."
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

      {/* Main Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          icon={AlertCircle}
          title="Error loading platform claims"
          description={error}
          onRetry={fetchClaims}
        />
      ) : claims.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No Platform Claims Found"
          description="No insurance claims match your search filters."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Claim Number &amp; Category</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Insurer Vendor</th>
                <th className="px-5 py-3.5">Policy Number</th>
                <th className="px-5 py-3.5">Claim Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">View Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {claims.map((cl) => (
                <tr key={cl.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-mono font-bold text-blue-600">{cl.claim_number}</div>
                    <div className="text-[11px] text-slate-500">{cl.claim_type}</div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{cl.customer_name}</td>
                  <td className="px-5 py-4 text-slate-700">{cl.company_name || cl.insurer_name}</td>
                  <td className="px-5 py-4 font-mono text-slate-600">{cl.policy_number}</td>
                  <td className="px-5 py-4 font-bold text-slate-900">{formatINR(cl.claim_amount)}</td>
                  <td className="px-5 py-4"><StatusBadge status={cl.status} /></td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setSelectedClaim(cl)}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Claim Inspection Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">{selectedClaim.claim_number}</span>
                <h3 className="text-lg font-bold text-slate-900">{selectedClaim.plan_name}</h3>
              </div>
              <button
                onClick={() => setSelectedClaim(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer</p>
                <p className="font-bold text-slate-900">{selectedClaim.customer_name}</p>
                <p className="text-slate-500">{selectedClaim.customer_email}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Insurer Vendor</p>
                <p className="font-bold text-slate-900">{selectedClaim.company_name || selectedClaim.insurer_name}</p>
                <p className="text-slate-500">Policy: {selectedClaim.policy_number}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
              <div>
                <p className="text-[10px] font-semibold text-slate-500">Claim Amount</p>
                <p className="text-base font-extrabold text-slate-900">{formatINR(selectedClaim.claim_amount)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500">Category</p>
                <p className="font-bold text-slate-800">{selectedClaim.claim_type}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500">Status</p>
                <StatusBadge status={selectedClaim.status} />
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold text-slate-700">Customer Description:</p>
              <p className="bg-slate-50 p-3 rounded-xl text-slate-700 whitespace-pre-line border border-slate-100">
                {selectedClaim.description}
              </p>
            </div>

            {selectedClaim.rejection_reason && (
              <div className="text-xs bg-rose-50 p-3 rounded-xl text-rose-700 border border-rose-100">
                <strong>Rejection Reason:</strong> {selectedClaim.rejection_reason}
              </div>
            )}

            {selectedClaim.insurer_response && (
              <div className="text-xs bg-blue-50 p-3 rounded-xl text-blue-700 border border-blue-100">
                <strong>Insurer Remarks:</strong> {selectedClaim.insurer_response}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedClaim(null)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClaimsPage;
