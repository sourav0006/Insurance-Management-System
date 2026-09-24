import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, FileText, XCircle, AlertCircle, X, ChevronRight,
  ShieldCheck, Ban, IndianRupee, CalendarClock,
} from 'lucide-react';
import { getInsurerPolicyById, updatePolicyStatus } from '../../services/api';
import {
  usePageReveal, SectionCard, InfoField, DetailGrid, StatusBadge, ErrorState,
  formatINR, formatDate, subtleBtn,
} from '../../components/customer/ui';

export const InsurerPolicyDetailsPage = () => {
  const { policyId } = useParams();
  const navigate = useNavigate();

  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReasonInput, setCancellationReasonInput] = useState('');
  const [modalError, setModalError] = useState(null);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInsurerPolicyById(policyId);
      setPolicy(data);
    } catch (err) {
      console.error('Failed to fetch insurer policy detail:', err);
      setError('Policy record not found or unauthorized.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (policyId) fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policyId]);

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancellationReasonInput.trim()) {
      setModalError('Please provide a reason for cancelling this policy.');
      return;
    }
    setUpdating(true);
    setModalError(null);
    try {
      const updated = await updatePolicyStatus(policy.id, {
        status: 'CANCELLED',
        cancellation_reason: cancellationReasonInput.trim(),
      });
      setPolicy(updated);
      setShowCancelModal(false);
      setCancellationReasonInput('');
    } catch (err) {
      console.error('Policy cancellation error:', err);
      if (err.response && err.response.data && err.response.data.detail) {
        setModalError(err.response.data.detail);
      } else {
        setModalError('Failed to cancel policy.');
      }
    } finally {
      setUpdating(false);
    }
  };

  const { scope } = usePageReveal([loading]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200/70" />
        <div className="h-44 animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="h-52 animate-pulse rounded-2xl bg-slate-200/70" />
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <ErrorState
          icon={AlertCircle}
          title={error || 'Policy record not found'}
          description="You can head back to the policy register."
          onRetry={() => navigate('/insurer/policies')}
          retryLabel="Back to Policies"
        />
      </div>
    );
  }

  const termYears = policy.financial?.policy_term_years;

  return (
    <div ref={scope} className="mx-auto max-w-4xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          onClick={() => navigate('/insurer/policies')}
          className="flex items-center gap-1 font-medium transition-colors hover:text-blue-600 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Policy register
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="font-semibold text-slate-800">{policy.policy_number}</span>
      </div>

      {/* Certificate-style header */}
      <div className="lp-reveal-d relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.18), transparent 65%)' }}
        />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-sky-300">
              <ShieldCheck className="h-3.5 w-3.5" /> Policy certificate
            </span>
            <StatusBadge status={policy.status} size="lg" />
          </div>
          <p className="mt-4 font-mono text-xs tracking-wider text-sky-300">POLICY {policy.policy_number}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{policy.plan.plan_name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-300">
            <User className="h-4 w-4 text-sky-300" />
            Policyholder <strong className="font-semibold text-white">{policy.customer.customer_name}</strong>
          </p>
        </div>
      </div>

      {/* Action bar */}
      <div className="lp-reveal-d flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:p-5">
        <p className="text-xs text-slate-600">
          Lifecycle status: <span className="font-bold text-slate-900">{policy.status}</span>
        </p>
        {policy.status === 'ACTIVE' && (
          <button
            disabled={updating}
            onClick={() => { setShowCancelModal(true); setModalError(null); }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
          >
            <Ban className="h-4 w-4" /> Cancel policy
          </button>
        )}
        {(policy.status === 'EXPIRED' || policy.status === 'CANCELLED') && (
          <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
            Lifecycle finalized ({policy.status})
          </span>
        )}
      </div>

      {/* Cancellation reason */}
      {policy.status === 'CANCELLED' && policy.cancellation_reason && (
        <div className="lp-reveal-d rounded-2xl border border-rose-200 bg-rose-50/60 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-700">
            <XCircle className="h-4 w-4" /> Policy cancellation reason
          </h3>
          <p className="mt-1.5 pl-6 text-sm font-medium text-slate-700">{policy.cancellation_reason}</p>
        </div>
      )}

      {/* Financial snapshot */}
      <div className="lp-reveal-d grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-600">
            <ShieldCheck className="h-3.5 w-3.5" /> Coverage amount
          </p>
          <p className="mt-1.5 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {formatINR(policy.financial.coverage_amount)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Fixed historical coverage terms</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-600">
            <IndianRupee className="h-3.5 w-3.5" /> Premium
          </p>
          <p className="mt-1.5 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {formatINR(policy.financial.premium_amount)}
            <span className="text-sm font-normal text-slate-500"> / {policy.financial.premium_frequency}</span>
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Fixed premium term structure</p>
        </div>
      </div>

      {/* Validity */}
      <div className="lp-reveal-d">
        <SectionCard icon={CalendarClock} title="Policy validity">
          <DetailGrid cols={3}>
            <InfoField label="Effective start date" value={formatDate(policy.start_date)} />
            <InfoField label="Policy end date" value={formatDate(policy.end_date)} />
            <InfoField
              label="Policy term"
              value={termYears ? `${termYears} Year${termYears > 1 ? 's' : ''}` : 'N/A'}
            />
          </DetailGrid>
        </SectionCard>
      </div>

      {/* References */}
      <div className="lp-reveal-d">
        <SectionCard icon={FileText} title="References & product data">
          <DetailGrid cols={2}>
            <InfoField label="Policyholder name" value={policy.customer.customer_name} />
            <InfoField label="Plan code" value={policy.plan.plan_code} mono />
            <InfoField label="Plan category" value={policy.plan.category} />
            <InfoField label="Approved application no" value={policy.application.application_number} mono valueClass="text-blue-600" />
          </DetailGrid>
        </SectionCard>
      </div>

      {/* Cancellation modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="flex items-center gap-2 text-base font-bold text-rose-700">
                <Ban className="h-5 w-5 text-rose-600" /> Cancel policy
              </h3>
              <button onClick={() => setShowCancelModal(false)} className="text-slate-400 transition-colors hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            {modalError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{modalError}</div>
            )}
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Cancellation reason *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide a clear reason for cancelling this policy (e.g. non-payment, customer request, policyholder breach)."
                  value={cancellationReasonInput}
                  onChange={(e) => setCancellationReasonInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowCancelModal(false)} className={subtleBtn}>Cancel</button>
                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                >
                  Confirm cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsurerPolicyDetailsPage;
