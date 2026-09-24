import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShieldCheck, Building2, FileText, XCircle, AlertCircle,
  Calendar, ChevronRight, IndianRupee, CalendarClock,
} from 'lucide-react';
import { getMyPolicyById } from '../../services/api';
import {
  usePageReveal, SectionCard, InfoField, DetailGrid, StatusBadge, ErrorState,
  formatINR, formatDate,
} from '../../components/customer/ui';

export const PolicyDetailsPage = () => {
  const { policyId } = useParams();
  const navigate = useNavigate();

  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPolicyDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyPolicyById(policyId);
        setPolicy(data);
      } catch (err) {
        console.error('Failed to load policy detail:', err);
        setError('Insurance policy not found or access denied.');
      } finally {
        setLoading(false);
      }
    };
    if (policyId) fetchPolicyDetail();
  }, [policyId]);

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
          title={error || 'Policy not found'}
          description="You can head back to your policies list."
          onRetry={() => navigate('/customer/policies')}
          retryLabel="Back to My Policies"
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
          onClick={() => navigate('/customer/policies')}
          className="flex items-center gap-1 font-medium transition-colors hover:text-blue-600 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> My Policies
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
            <StatusBadge status={policy.status} size="md" />
          </div>
          <p className="mt-4 font-mono text-xs tracking-wider text-sky-300">
            POLICY {policy.policy_number}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{policy.plan.plan_name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-300">
            <Building2 className="h-4 w-4 text-sky-300" />
            Insurer <strong className="font-semibold text-white">{policy.insurer.company_name}</strong>
          </p>
        </div>
      </div>

      {/* Cancellation notice */}
      {policy.status === 'CANCELLED' && policy.cancellation_reason && (
        <div className="lp-reveal-d rounded-2xl border border-rose-200 bg-rose-50/60 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-700">
            <XCircle className="h-4 w-4" /> Policy cancellation reason
          </h3>
          <p className="mt-1.5 pl-6 text-sm font-medium text-slate-700">{policy.cancellation_reason}</p>
        </div>
      )}

      {/* Coverage highlight */}
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

      {/* Overview: plan & application reference */}
      <div className="lp-reveal-d">
        <SectionCard icon={FileText} title="Policy overview">
          <DetailGrid cols={3}>
            <InfoField label="Plan category" value={policy.plan.category} />
            <InfoField label="Application number" value={policy.application.application_number} mono valueClass="text-blue-600" />
            <InfoField label="Insurer" value={policy.insurer.company_name} />
          </DetailGrid>
        </SectionCard>
      </div>
    </div>
  );
};

export default PolicyDetailsPage;
