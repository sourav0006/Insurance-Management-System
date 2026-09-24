import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Building2, HeartHandshake, Briefcase, CheckCircle2, XCircle,
  AlertCircle, Play, X, Check, ChevronRight, PlusCircle, FileCheck, HeartPulse,
} from 'lucide-react';
import {
  getInsurerApplicationById, updateApplicationStatus, getPolicyByApplicationId, createPolicy,
} from '../../services/api';
import {
  usePageReveal, SectionCard, InfoField, DetailGrid, StatusBadge, ErrorState,
  formatINR, formatDateTime, formatDate, primaryBtn, subtleBtn,
} from '../../components/customer/ui';

export const InsurerApplicationDetailsPage = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [app, setApp] = useState(null);
  const [existingPolicy, setExistingPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  // Rejection dialog state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [rejectionError, setRejectionError] = useState(null);

  // Create-policy modal state
  const [showCreatePolicyModal, setShowCreatePolicyModal] = useState(false);
  const [startDateInput, setStartDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [policyError, setPolicyError] = useState(null);
  const [createdPolicyData, setCreatedPolicyData] = useState(null);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInsurerApplicationById(applicationId);
      setApp(data);
      if (data && data.status === 'APPROVED') {
        const pol = await getPolicyByApplicationId(data.id);
        setExistingPolicy(pol);
      }
    } catch (err) {
      console.error('Failed to fetch insurer application detail:', err);
      setError('Application not found or unauthorized.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (applicationId) fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  const handleStatusUpdate = async (newStatus, reason = null) => {
    setUpdating(true);
    setError(null);
    try {
      const payload = { status: newStatus };
      if (newStatus === 'REJECTED') payload.rejection_reason = reason;
      const updated = await updateApplicationStatus(app.id, payload);
      setApp(updated);
      setShowRejectModal(false);
      setRejectionReasonInput('');
    } catch (err) {
      console.error('Status update error:', err);
      if (err.response && err.response.data && err.response.data.detail) {
        if (showRejectModal) setRejectionError(err.response.data.detail);
        else setError(err.response.data.detail);
      } else {
        setError('Failed to update application status.');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectionReasonInput.trim()) {
      setRejectionError('Please provide a reason for rejecting this application.');
      return;
    }
    setRejectionError(null);
    handleStatusUpdate('REJECTED', rejectionReasonInput.trim());
  };

  const handleCreatePolicySubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setPolicyError(null);
    try {
      const res = await createPolicy({
        application_id: app.id,
        start_date: startDateInput || undefined,
      });
      setCreatedPolicyData(res);
      setExistingPolicy(res);
      setShowCreatePolicyModal(false);
    } catch (err) {
      console.error('Policy creation error:', err);
      if (err.response && err.response.data && err.response.data.detail) {
        setPolicyError(err.response.data.detail);
      } else {
        setPolicyError('Failed to issue policy for this application.');
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
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200/70" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <ErrorState
          icon={AlertCircle}
          title={error || 'Application not found'}
          description="You can head back to the applications queue."
          onRetry={() => navigate('/insurer/applications')}
          retryLabel="Back to Applications"
        />
      </div>
    );
  }

  return (
    <div ref={scope} className="mx-auto max-w-4xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          onClick={() => navigate('/insurer/applications')}
          className="flex items-center gap-1 font-medium transition-colors hover:text-blue-600 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Applications
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="font-semibold text-slate-800">{app.application_number}</span>
      </div>

      {/* Header banner */}
      <div className="lp-reveal-d relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.18), transparent 65%)' }}
        />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-xs tracking-wider text-sky-300">APP {app.application_number}</span>
            <StatusBadge status={app.status} size="lg" />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{app.plan.plan_name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-300">
            <User className="h-4 w-4 text-sky-300" />
            Applicant <strong className="font-semibold text-white">{app.customer.full_name}</strong> ({app.customer.email})
          </p>
        </div>
      </div>

      {/* Action bar */}
      <div className="lp-reveal-d flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:p-5">
        <p className="text-xs text-slate-600">
          Current review status: <span className="font-bold text-slate-900">{app.status}</span>
        </p>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {app.status === 'SUBMITTED' && (
            <>
              <button
                disabled={updating}
                onClick={() => handleStatusUpdate('UNDER_REVIEW')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5" /> Start review
              </button>
              <button
                disabled={updating}
                onClick={() => { setShowRejectModal(true); setRejectionError(null); }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" /> Reject
              </button>
            </>
          )}

          {app.status === 'UNDER_REVIEW' && (
            <>
              <button
                disabled={updating}
                onClick={() => handleStatusUpdate('APPROVED')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              >
                <Check className="h-4 w-4" /> Approve
              </button>
              <button
                disabled={updating}
                onClick={() => { setShowRejectModal(true); setRejectionError(null); }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" /> Reject
              </button>
            </>
          )}

          {app.status === 'APPROVED' && (
            existingPolicy ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <FileCheck className="h-3.5 w-3.5" /> Policy {existingPolicy.policy_number}
                </span>
                <button onClick={() => navigate(`/insurer/policies/${existingPolicy.id}`)} className={primaryBtn}>
                  View policy
                </button>
              </div>
            ) : (
              <button
                disabled={updating}
                onClick={() => { setShowCreatePolicyModal(true); setPolicyError(null); }}
                className={primaryBtn}
              >
                <PlusCircle className="h-4 w-4" /> Create policy
              </button>
            )
          )}

          {app.status === 'REJECTED' && (
            <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
              Application rejected
            </span>
          )}
        </div>
      </div>

      {/* Policy creation success */}
      {createdPolicyData && (
        <div className="lp-reveal-d flex items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-xs">
          <div className="space-y-1">
            <p className="flex items-center gap-2 font-semibold text-emerald-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Policy issued successfully
            </p>
            <p className="text-slate-700">
              Policy <strong className="font-mono text-emerald-900">{createdPolicyData.policy_number}</strong> &bull; {formatDate(createdPolicyData.start_date)} to {formatDate(createdPolicyData.end_date)}
            </p>
          </div>
          <button
            onClick={() => navigate(`/insurer/policies/${createdPolicyData.id}`)}
            className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 cursor-pointer"
          >
            View policy
          </button>
        </div>
      )}

      {/* Rejection reason */}
      {app.status === 'REJECTED' && app.rejection_reason && (
        <div className="lp-reveal-d rounded-2xl border border-rose-200 bg-rose-50/60 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-700">
            <XCircle className="h-4 w-4" /> Rejection reason
          </h3>
          <p className="mt-1.5 pl-6 text-sm font-medium text-slate-700">{app.rejection_reason}</p>
        </div>
      )}

      {/* Plan financials */}
      <div className="lp-reveal-d grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Submitted</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(app.submitted_at)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Reviewed</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(app.reviewed_at)}</p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-blue-600">Coverage</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{formatINR(app.plan.coverage_amount)}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-600">Premium</p>
          <p className="mt-1 text-sm font-bold text-slate-900">
            {formatINR(app.plan.premium_amount)}<span className="font-normal text-slate-500"> / {app.plan.premium_frequency}</span>
          </p>
        </div>
      </div>

      {/* Applicant profile */}
      <div className="lp-reveal-d">
        <SectionCard icon={User} title="Applicant profile & address">
          <DetailGrid cols={3}>
            <InfoField label="Full name" value={app.customer.full_name} />
            <InfoField label="Email" value={app.customer.email} />
            <InfoField label="Phone" value={app.customer.phone} />
            <InfoField label="Date of birth" value={app.date_of_birth} />
            <InfoField label="Gender" value={app.gender} />
            <InfoField label="Pincode" value={app.pincode} />
          </DetailGrid>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <InfoField label="Residential address" value={`${app.address}, ${app.city}, ${app.state}`} />
          </div>
        </SectionCard>
      </div>

      {/* Nominee */}
      <div className="lp-reveal-d">
        <SectionCard icon={HeartHandshake} title="Nominee details">
          <DetailGrid cols={3}>
            <InfoField label="Nominee name" value={app.nominee_name} />
            <InfoField label="Relationship" value={app.nominee_relationship} />
            <InfoField label="Nominee phone" value={app.nominee_phone} />
          </DetailGrid>
        </SectionCard>
      </div>

      {/* Occupation & health */}
      <div className="lp-reveal-d">
        <SectionCard icon={Briefcase} title="Occupation & medical declaration">
          <DetailGrid cols={2}>
            <InfoField label="Occupation" value={app.occupation} />
            <InfoField label="Annual income" value={formatINR(app.annual_income)} />
          </DetailGrid>
          <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
              <HeartPulse className="h-3.5 w-3.5" /> Health declaration
            </p>
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-800">
              {app.health_declaration}
            </p>
          </div>
        </SectionCard>
      </div>

      {/* Rejection modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="flex items-center gap-2 text-base font-bold text-rose-700">
                <XCircle className="h-5 w-5 text-rose-600" /> Reject application
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400 transition-colors hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            {rejectionError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{rejectionError}</div>
            )}
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Rejection reason *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide a clear, detailed reason for rejecting this application."
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowRejectModal(false)} className={subtleBtn}>Cancel</button>
                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                >
                  Confirm rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create-policy modal */}
      {showCreatePolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <PlusCircle className="h-5 w-5 text-blue-600" /> Issue insurance policy
              </h3>
              <button onClick={() => setShowCreatePolicyModal(false)} className="text-slate-400 transition-colors hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            {policyError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{policyError}</div>
            )}
            <form onSubmit={handleCreatePolicySubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Policy effective start date *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={startDateInput}
                  onChange={(e) => setStartDateInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-500">
                  End date is calculated automatically from the plan term ({app.plan.policy_term_years || 1} year(s)).
                </p>
              </div>
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Coverage</span>
                  <span className="font-bold text-slate-900">{formatINR(app.plan.coverage_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Premium</span>
                  <span className="font-bold text-blue-600">{formatINR(app.plan.premium_amount)} / {app.plan.premium_frequency}</span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowCreatePolicyModal(false)} className={subtleBtn}>Cancel</button>
                <button type="submit" disabled={updating} className={primaryBtn}>
                  <PlusCircle className="h-4 w-4" /> Issue policy now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsurerApplicationDetailsPage;
