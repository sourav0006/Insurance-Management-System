import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Users, ShieldCheck, FileCheck, FileText, MessageSquare, AlertCircle, ChevronRight, UserCheck, UserX, Phone, Mail, MapPin } from 'lucide-react';
import { getAdminCustomerById, suspendCustomer, unsuspendCustomer } from '../../services/api';
import { usePageReveal, SectionCard, InfoField, DetailGrid, StatusBadge, ErrorState, formatINR, formatDate } from '../../components/customer/ui';

export const AdminCustomerDetailPage = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminCustomerById(customerId);
      setCustomer(data);
    } catch (err) {
      console.error('Failed to load customer detail:', err);
      setError('Customer not found or access denied.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) fetchDetail();
  }, [customerId]);

  const { scope } = usePageReveal([loading]);

  const handleToggleSuspend = async () => {
    if (!customer) return;
    const action = customer.is_active ? 'suspend' : 'unsuspend';
    if (!window.confirm(`Are you sure you want to ${action} customer "${customer.full_name}"?`)) return;

    setActionLoading(true);
    try {
      if (customer.is_active) {
        await suspendCustomer(customer.id);
      } else {
        await unsuspendCustomer(customer.id);
      }
      await fetchDetail();
    } catch (err) {
      console.error(`Failed to ${action} customer:`, err);
      alert(`Failed to ${action} customer. ${err.response?.data?.detail || ''}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200/70" />
        <div className="h-44 animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="h-52 animate-pulse rounded-2xl bg-slate-200/70" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <ErrorState
          icon={AlertCircle}
          title={error || 'Customer not found'}
          description="Return to customer management."
          onRetry={() => navigate('/admin/customers')}
          retryLabel="Back to Customer List"
        />
      </div>
    );
  }

  const prof = customer.profile;

  return (
    <div ref={scope} className="mx-auto max-w-5xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/admin/customers" className="flex items-center gap-1 font-medium transition-colors hover:text-blue-600">
          <ArrowLeft className="h-3.5 w-3.5" /> Customer Management
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="font-semibold text-slate-800">{customer.full_name}</span>
      </div>

      {/* Header Banner */}
      <div className="lp-reveal-d relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-sky-300">
                <Users className="h-3.5 w-3.5" /> Customer Account
              </span>
              {customer.is_active ? (
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                  ACTIVE
                </span>
              ) : (
                <span className="rounded-full bg-rose-500/20 px-3 py-1 text-[11px] font-bold text-rose-300 border border-rose-500/30">
                  SUSPENDED
                </span>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{customer.full_name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-sky-300" /> {customer.email}</span>
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-sky-300" /> {customer.phone || 'N/A'}</span>
            </p>
          </div>

          <button
            onClick={handleToggleSuspend}
            disabled={actionLoading}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-md cursor-pointer ${
              customer.is_active
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {actionLoading ? 'Processing...' : customer.is_active ? 'Suspend Account' : 'Reinstate Account'}
          </button>
        </div>
      </div>

      {/* Profile Overview */}
      <div className="lp-reveal-d">
        <SectionCard icon={Users} title="Customer Profile & Contact Information">
          <DetailGrid cols={3}>
            <InfoField label="Date of Birth" value={prof?.date_of_birth ? formatDate(prof.date_of_birth) : 'Not specified'} />
            <InfoField label="Gender" value={prof?.gender || 'Not specified'} />
            <InfoField label="Nominee Name" value={prof?.nominee_name || 'N/A'} />
            <InfoField label="Nominee Relation" value={prof?.nominee_relationship || 'N/A'} />
            <InfoField label="Nominee Phone" value={prof?.nominee_phone || 'N/A'} />
            <InfoField label="Full Address" value={[prof?.address, prof?.city, prof?.state, prof?.pincode].filter(Boolean).join(', ') || 'N/A'} />
          </DetailGrid>
        </SectionCard>
      </div>

      {/* Policies */}
      <div className="lp-reveal-d">
        <SectionCard icon={ShieldCheck} title={`Insurance Policies (${customer.policies.length})`}>
          {customer.policies.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">No active or past policies found for this customer.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {customer.policies.map((pol) => (
                <div key={pol.id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-mono font-bold text-blue-600">{pol.policy_number}</span> — <strong className="font-semibold text-slate-800">{pol.plan_name}</strong>
                    <div className="text-[11px] text-slate-500">Insurer: <strong>{pol.insurer_company || pol.insurer_name}</strong> | Start: {formatDate(pol.start_date)}</div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={pol.status} />
                    <div className="text-xs font-bold text-slate-900 mt-1">{formatINR(pol.coverage_amount)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Claims */}
      <div className="lp-reveal-d">
        <SectionCard icon={FileCheck} title={`Insurance Claims (${customer.claims.length})`}>
          {customer.claims.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">No claims filed by this customer.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {customer.claims.map((cl) => (
                <div key={cl.id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-mono font-bold text-blue-600">{cl.claim_number}</span> — <strong className="font-semibold text-slate-800">{cl.claim_type}</strong>
                    <div className="text-[11px] text-slate-500">Insurer: <strong>{cl.insurer_company}</strong> | Policy: {cl.policy_number}</div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={cl.status} />
                    <div className="text-xs font-bold text-slate-900 mt-1">{formatINR(cl.claim_amount)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Applications */}
      <div className="lp-reveal-d">
        <SectionCard icon={FileText} title={`Insurance Applications (${customer.applications.length})`}>
          {customer.applications.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">No insurance applications submitted.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {customer.applications.map((app) => (
                <div key={app.id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-700">{app.application_number}</span> — <strong className="font-semibold text-slate-800">{app.plan_name}</strong>
                    <div className="text-[11px] text-slate-500">Insurer: <strong>{app.insurer_company}</strong></div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default AdminCustomerDetailPage;
