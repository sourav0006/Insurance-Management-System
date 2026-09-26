import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, AlertCircle, ChevronRight, ShieldCheck, ShieldAlert, CheckCircle2, UserCheck, UserX } from 'lucide-react';
import { getAdminCustomers, suspendCustomer, unsuspendCustomer } from '../../services/api';
import { usePageReveal, ErrorState, EmptyState, formatDate } from '../../components/customer/ui';

export const AdminCustomersPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminCustomers({ search: searchTerm.trim() || undefined });
      setCustomers(data || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
      setError('Unable to load customer accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const { scope } = usePageReveal([loading]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleToggleSuspend = async (customer) => {
    const action = customer.is_active ? 'suspend' : 'unsuspend';
    if (!window.confirm(`Are you sure you want to ${action} customer "${customer.full_name}"?`)) return;

    setActionLoading(customer.id);
    try {
      if (customer.is_active) {
        await suspendCustomer(customer.id);
      } else {
        await unsuspendCustomer(customer.id);
      }
      await fetchCustomers();
    } catch (err) {
      console.error(`Failed to ${action} customer:`, err);
      alert(`Failed to ${action} customer. ${err.response?.data?.detail || ''}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div ref={scope} className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="lp-reveal-d flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Customer Account Management</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Overview of registered customers, policies, claims, and account status controls.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="lp-reveal-d flex items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </form>
        <button
          onClick={fetchCustomers}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
        >
          Refresh List
        </button>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          icon={AlertCircle}
          title="Error loading customers"
          description={error}
          onRetry={fetchCustomers}
        />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Customers Found"
          description="No registered customer accounts match your search query."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Customer Name &amp; Email</th>
                <th className="px-5 py-3.5">Phone / Location</th>
                <th className="px-5 py-3.5">Policies</th>
                <th className="px-5 py-3.5">Claims</th>
                <th className="px-5 py-3.5">Account Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {customers.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900">{cust.full_name}</div>
                    <div className="text-[11px] text-slate-500">{cust.email}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div>{cust.phone || 'N/A'}</div>
                    <div className="text-[11px] text-slate-400">
                      {[cust.city, cust.state].filter(Boolean).join(', ') || 'No profile address'}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-900">{cust.policies_count}</td>
                  <td className="px-5 py-4 font-bold text-slate-900">{cust.claims_count}</td>
                  <td className="px-5 py-4">
                    {cust.is_active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                        <UserCheck className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                        <UserX className="h-3 w-3" /> Suspended
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right space-x-2">
                    <button
                      onClick={() => navigate(`/admin/customers/${cust.id}`)}
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      View Full Profile
                    </button>
                    <button
                      onClick={() => handleToggleSuspend(cust)}
                      disabled={actionLoading === cust.id}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        cust.is_active
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      {actionLoading === cust.id
                        ? 'Processing...'
                        : cust.is_active
                        ? 'Suspend'
                        : 'Reinstate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCustomersPage;
