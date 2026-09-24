import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Eye, User, ArrowRight } from 'lucide-react';
import { getInsurerApplications } from '../../services/api';
import {
  usePageReveal, StatusBadge, EmptyState, ErrorState, formatDate,
} from '../../components/customer/ui';
import {
  WorkspaceHeader, SearchInput, FilterSelect, TableCard, TableHead, Th,
} from '../../components/insurer/ui';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export const InsurerApplicationsPage = () => {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const data = await getInsurerApplications(params);
      setApplications(data || []);
    } catch (err) {
      console.error('Failed to fetch insurer applications:', err);
      if (err.response && err.response.status === 403) {
        setError('Approved insurer status required to view application queues.');
      } else {
        setError('Unable to load applications queue. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filteredApplications = applications.filter((app) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      app.application_number.toLowerCase().includes(term) ||
      app.customer_name.toLowerCase().includes(term) ||
      app.plan_name.toLowerCase().includes(term)
    );
  });

  const { scope } = usePageReveal([loading]);

  return (
    <div ref={scope} className="mx-auto max-w-7xl space-y-5">
      <WorkspaceHeader
        title="Applications queue"
        subtitle="Review, process, and decide on applications submitted for your insurance products."
      >
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search app no, customer, plan…"
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
        <ErrorState icon={FileText} title={error} onRetry={fetchApplications} />
      )}

      {!loading && !error && filteredApplications.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No applications found"
          description="There are currently no customer applications matching your search or filter."
        />
      )}

      {!loading && !error && filteredApplications.length > 0 && (
        <TableCard>
          <TableHead>
            <tr>
              <Th>Application No</Th>
              <Th>Customer</Th>
              <Th>Plan Name</Th>
              <Th>Category</Th>
              <Th>Submitted</Th>
              <Th>Status</Th>
              <Th className="text-right">Action</Th>
            </tr>
          </TableHead>
          <tbody className="divide-y divide-slate-100">
            {filteredApplications.map((app) => (
              <tr
                key={app.id}
                onClick={() => navigate(`/insurer/applications/${app.id}`)}
                className="cursor-pointer transition-colors hover:bg-slate-50/80"
              >
                <td className="px-4 py-3.5 font-mono font-bold text-blue-600">{app.application_number}</td>
                <td className="px-4 py-3.5 font-semibold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    {app.customer_name}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-medium text-slate-800">{app.plan_name}</td>
                <td className="px-4 py-3.5 text-slate-600">{app.category}</td>
                <td className="px-4 py-3.5 text-slate-500">{formatDate(app.submitted_at)}</td>
                <td className="px-4 py-3.5"><StatusBadge status={app.status} /></td>
                <td className="px-4 py-3.5 text-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/insurer/applications/${app.id}`); }}
                    className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" /> Review
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

export default InsurerApplicationsPage;
