import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileCheck, ShieldCheck, Building2, Calendar, AlertCircle, ChevronRight, XCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { getMyClaimById } from '../../services/api';
import { usePageReveal, SectionCard, InfoField, DetailGrid, StatusBadge, ErrorState, formatINR, formatDate } from '../../components/customer/ui';

export const CustomerClaimDetailPage = () => {
  const { claimId } = useParams();
  const navigate = useNavigate();

  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyClaimById(claimId);
        setClaim(data);
      } catch (err) {
        console.error('Failed to fetch claim detail:', err);
        setError('Claim not found or access denied.');
      } finally {
        setLoading(false);
      }
    };

    if (claimId) fetchDetail();
  }, [claimId]);

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

  if (error || !claim) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <ErrorState
          icon={AlertCircle}
          title={error || 'Claim details not found'}
          description="You can view your claims list."
          onRetry={() => navigate('/customer/claims')}
          retryLabel="Back to My Claims"
        />
      </div>
    );
  }

  return (
    <div ref={scope} className="mx-auto max-w-4xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/customer/claims" className="flex items-center gap-1 font-medium transition-colors hover:text-blue-600">
          <ArrowLeft className="h-3.5 w-3.5" /> My Claims
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="font-semibold text-slate-800">{claim.claim_number}</span>
      </div>

      {/* Header Banner */}
      <div className="lp-reveal-d relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white sm:p-7">
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-sky-300">
              <FileCheck className="h-3.5 w-3.5" /> Claim Details
            </span>
            <StatusBadge status={claim.status} size="md" />
          </div>

          <p className="mt-4 font-mono text-xs tracking-wider text-sky-300">
            CLAIM NUMBER: {claim.claim_number}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {claim.plan_name || 'Insurance Claim'}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-300">
            <Building2 className="h-4 w-4 text-sky-300" />
            Insurer <strong className="font-semibold text-white">{claim.company_name || claim.insurer_name}</strong>
          </p>
        </div>
      </div>

      {/* Rejection Notice */}
      {claim.status === 'REJECTED' && claim.rejection_reason && (
        <div className="lp-reveal-d rounded-2xl border border-rose-200 bg-rose-50/80 p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-rose-800">
            <XCircle className="h-5 w-5 text-rose-600" /> Claim Rejection Notice
          </h3>
          <p className="mt-2 text-xs font-medium text-slate-700 bg-white/60 p-3 rounded-xl border border-rose-100">
            {claim.rejection_reason}
          </p>
        </div>
      )}

      {/* Insurer Remarks */}
      {claim.insurer_response && (
        <div className="lp-reveal-d rounded-2xl border border-blue-200 bg-blue-50/80 p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-blue-900">
            <MessageSquare className="h-5 w-5 text-blue-600" /> Insurer Remarks &amp; Response
          </h3>
          <p className="mt-2 text-xs font-medium text-slate-700 bg-white/60 p-3 rounded-xl border border-blue-100">
            {claim.insurer_response}
          </p>
        </div>
      )}

      {/* Settlement info */}
      {(claim.status === 'SETTLED' || claim.status === 'CLOSED') && (
        <div className="lp-reveal-d rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-900">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Claim Settled &amp; Processed
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            This claim has been reviewed and settled according to policy terms.
          </p>
        </div>
      )}

      {/* Financial Overview */}
      <div className="lp-reveal-d grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Claimed Amount</p>
          <p className="mt-1.5 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {formatINR(claim.claim_amount)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Requested for reimbursement</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Claim Category</p>
          <p className="mt-1.5 text-xl font-bold text-slate-900">{claim.claim_type}</p>
          <p className="mt-1 text-[11px] text-slate-500">Incident Date: {formatDate(claim.incident_date)}</p>
        </div>
      </div>

      {/* Policy & Plan Reference */}
      <div className="lp-reveal-d">
        <SectionCard icon={ShieldCheck} title="Associated Policy & Timeline">
          <DetailGrid cols={3}>
            <InfoField label="Policy Number" value={claim.policy_number} mono valueClass="text-blue-600 font-bold" />
            <InfoField label="Submitted Date" value={formatDate(claim.submitted_at)} />
            <InfoField label="Last Reviewed" value={claim.reviewed_at ? formatDate(claim.reviewed_at) : 'Pending review'} />
          </DetailGrid>
        </SectionCard>
      </div>

      {/* Description */}
      <div className="lp-reveal-d">
        <SectionCard icon={FileCheck} title="Claim Incident Description">
          <p className="text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-line">
            {claim.description}
          </p>
        </SectionCard>
      </div>
    </div>
  );
};

export default CustomerClaimDetailPage;
