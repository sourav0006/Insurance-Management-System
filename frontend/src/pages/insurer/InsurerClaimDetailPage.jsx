import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileCheck, ShieldCheck, User, Calendar, AlertCircle, ChevronRight, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';
import { getInsurerClaimById, reviewClaim } from '../../services/api';
import { usePageReveal, SectionCard, InfoField, DetailGrid, StatusBadge, ErrorState, formatINR, formatDate } from '../../components/customer/ui';

export const InsurerClaimDetailPage = () => {
  const { claimId } = useParams();
  const navigate = useNavigate();

  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  const [targetStatus, setTargetStatus] = useState('');
  const [insurerResponse, setInsurerResponse] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInsurerClaimById(claimId);
      setClaim(data);
      setInsurerResponse(data.insurer_response || '');
      setRejectionReason(data.rejection_reason || '');

      // Set default next status based on current status
      if (data.status === 'SUBMITTED') setTargetStatus('UNDER_REVIEW');
      else if (data.status === 'UNDER_REVIEW') setTargetStatus('APPROVED');
      else if (data.status === 'APPROVED') setTargetStatus('SETTLED');
      else if (data.status === 'SETTLED') setTargetStatus('CLOSED');
      else setTargetStatus(data.status);
    } catch (err) {
      console.error('Failed to load claim detail:', err);
      setError('Claim detail not found or access denied.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (claimId) fetchDetail();
  }, [claimId]);

  const { scope } = usePageReveal([loading]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess('');

    if (targetStatus === 'REJECTED' && !rejectionReason.trim()) {
      setActionError('Rejection reason is required when rejecting a claim.');
      return;
    }

    setActionLoading(true);

    try {
      const payload = {
        status: targetStatus,
        insurer_response: insurerResponse.trim() || undefined,
        rejection_reason: targetStatus === 'REJECTED' ? rejectionReason.trim() : undefined,
      };

      const updated = await reviewClaim(claimId, payload);
      setClaim(updated);
      setActionSuccess(`Claim status updated to ${updated.status}!`);
    } catch (err) {
      console.error('Failed to update claim:', err);
      const detail = err.response?.data?.detail || 'Failed to update claim status.';
      setActionError(detail);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200/70" />
        <div className="h-44 animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="h-52 animate-pulse rounded-2xl bg-slate-200/70" />
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <ErrorState
          icon={AlertCircle}
          title={error || 'Claim not found'}
          description="Return to your claims dashboard."
          onRetry={() => navigate('/insurer/claims')}
          retryLabel="Back to Claims List"
        />
      </div>
    );
  }

  // Determine allowed next statuses
  const allowedNextStatuses = {
    SUBMITTED: ['UNDER_REVIEW'],
    UNDER_REVIEW: ['APPROVED', 'REJECTED'],
    APPROVED: ['SETTLED'],
    SETTLED: ['CLOSED'],
    REJECTED: [],
    CLOSED: [],
  }[claim.status] || [];

  return (
    <div ref={scope} className="mx-auto max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/insurer/claims" className="flex items-center gap-1 font-medium transition-colors hover:text-blue-600">
          <ArrowLeft className="h-3.5 w-3.5" /> Claims List
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="font-semibold text-slate-800">{claim.claim_number}</span>
      </div>

      {/* Header Banner */}
      <div className="lp-reveal-d relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white sm:p-7">
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-sky-300">
              <FileCheck className="h-3.5 w-3.5" /> Claim Adjudication
            </span>
            <StatusBadge status={claim.status} size="md" />
          </div>

          <p className="mt-4 font-mono text-xs tracking-wider text-sky-300">
            CLAIM NUMBER: {claim.claim_number}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {claim.plan_name} — {formatINR(claim.claim_amount)}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-300">
            <User className="h-4 w-4 text-sky-300" />
            Customer: <strong className="font-semibold text-white">{claim.customer_name}</strong> ({claim.customer_email})
          </p>
        </div>
      </div>

      {/* Customer & Policy Details */}
      <div className="lp-reveal-d grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Claim Summary</p>
          <p className="text-base font-bold text-slate-900">{claim.claim_type}</p>
          <p className="text-xs text-slate-500">Incident Date: <strong>{formatDate(claim.incident_date)}</strong></p>
          <p className="text-xs text-slate-500">Submitted At: <strong>{formatDate(claim.submitted_at)}</strong></p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Policy Details</p>
          <p className="font-mono text-base font-bold text-blue-600">{claim.policy_number}</p>
          <p className="text-xs text-slate-500">Plan: <strong>{claim.plan_name}</strong></p>
          <p className="text-xs text-slate-500">Insurer: <strong>{claim.company_name || claim.insurer_name}</strong></p>
        </div>
      </div>

      {/* Claim Description */}
      <div className="lp-reveal-d">
        <SectionCard icon={FileCheck} title="Customer Statement & Incident Description">
          <p className="text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
            {claim.description}
          </p>
        </SectionCard>
      </div>

      {/* Review Form (if not CLOSED or REJECTED) */}
      {allowedNextStatuses.length > 0 && (
        <div className="lp-reveal-d rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" /> Review &amp; Update Claim Status
          </h2>

          {actionError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-700">
              {actionError}
            </div>
          )}

          {actionSuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800">
              {actionSuccess}
            </div>
          )}

          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Target Status Transition <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {allowedNextStatuses.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setTargetStatus(st)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                      targetStatus === st
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Move to {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {targetStatus === 'REJECTED' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-rose-700 mb-2">
                  Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Specify why the claim is being rejected (e.g., policy exclusion, insufficient medical documentation)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                  className="w-full rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-xs font-medium text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Insurer Remarks / Response (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Add comments or instructions for the customer..."
                value={insurerResponse}
                onChange={(e) => setInsurerResponse(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md transition-colors hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Updating Claim...' : `Confirm Status Transition to ${targetStatus.replace('_', ' ')}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Historical Insurer Remarks / Rejection if completed */}
      {allowedNextStatuses.length === 0 && (
        <div className="lp-reveal-d rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-800">Final Adjudication Status</h3>
          {claim.rejection_reason && (
            <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-100">
              <strong>Rejection Reason:</strong> {claim.rejection_reason}
            </p>
          )}
          {claim.insurer_response && (
            <p className="text-xs text-blue-700 bg-blue-50 p-3 rounded-xl border border-blue-100">
              <strong>Insurer Response:</strong> {claim.insurer_response}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default InsurerClaimDetailPage;
