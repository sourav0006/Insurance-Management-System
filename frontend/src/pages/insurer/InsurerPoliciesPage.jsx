import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, User } from 'lucide-react';
import { getInsurerPolicies } from '../../services/api';
import {
  usePageReveal, StatusBadge, EmptyState, ErrorState, formatINR, formatDate,
} from '../../components/customer/ui';
import {
  WorkspaceHeader, SearchInput, FilterSelect, TableCard, TableHead, Th,
} from '../../components/insurer/ui';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const InsurerPoliciesPage = () => {
  const navigate = useNavigate();

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const data = await getInsurerPolicies(params);
      setPolicies(data || []);
    } catch (err) {
      console.error('Failed to fetch insurer policies:', err);
      if (err.response && err.response.status === 403) {
        setError('Approved insurer status required to view policy registers.');
      } else {
        setError('Unable to load policies register. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const filteredPolicies = policies.filter((pol) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      pol.policy_number.toLowerCase().includes(term) ||
      pol.customer_name.toLowerCase().includes(term) ||
      pol.plan_name.toLowerCase().includes(term)
    );
  });

  const { scope } = usePageReveal([loading]);

  return (
    <div ref={scope} className="mx-auto max-w-7xl space-y-5">
      <WorkspaceHeader
        title="Policy register"
        subtitle="Monitor active policies, validity terms, and lifecycle status updates."
      >
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search policy no, customer, plan…"
        />
        <FilterSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={STATUS_OPTIONS}
        />
      </WorkspaceHeader>

      {loading && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {!loading && error && (
        <ErrorState icon={ShieldCheck} title={error} onRetry={fetchPolicies} />
      )}

      {!loading && !error && filteredPolicies.length === 0 && (
        <EmptyState
          icon={ShieldCheck}
          title="No policies found"
          description="There are currently no issued policies matching your search or filter."
        />
      )}

      {!loading && !error && filteredPolicies.length > 0 && (
        <TableCard>
          <TableHead>
            <tr>
              <Th>Policy No</Th>
              <Th>Customer</Th>
              <Th>Plan Name</Th>
              <Th>Coverage</Th>
              <Th>Start</Th>
              <Th>End</Th>
              <Th>Status</Th>
              <Th className="text-right">Action</Th>
            </tr>
          </TableHead>
          <tbody className="divide-y divide-slate-100">
            {filteredPolicies.map((pol) => (
              <tr
                key={pol.id}
                onClick={() => navigate(`/insurer/policies/${pol.id}`)}
                className="cursor-pointer transition-colors hover:bg-slate-50/80"
              >
                <td className="px-4 py-3.5 font-mono font-bold text-blue-600">{pol.policy_number}</td>
                <td className="px-4 py-3.5 font-semibold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    {pol.customer_name}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-medium text-slate-800">{pol.plan_name}</td>
                <td className="px-4 py-3.5 font-bold text-slate-900">{formatINR(pol.coverage_amount)}</td>
                <td className="px-4 py-3.5 text-slate-500">{formatDate(pol.start_date)}</td>
                <td className="px-4 py-3.5 text-slate-500">{formatDate(pol.end_date)}</td>
                <td className="px-4 py-3.5"><StatusBadge status={pol.status} /></td>
                <td className="px-4 py-3.5 text-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/insurer/policies/${pol.id}`); }}
                    className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" /> Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
    </div>
  );
};

export default InsurerPoliciesPage;
