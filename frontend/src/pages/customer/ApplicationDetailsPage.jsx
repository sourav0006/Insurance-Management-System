import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, User, HeartHandshake, Briefcase, XCircle, AlertCircle,
  ChevronRight, ShieldCheck, FileCheck, MapPin, HeartPulse, ArrowRight,
} from 'lucide-react';
import { getMyApplicationById, getPolicyByApplicationId } from '../../services/api';
import {
  usePageReveal, SectionCard, InfoField, DetailGrid, StatusBadge, ErrorState,
  formatINR, formatDate, formatDateTime, darkBtn,
} from '../../components/customer/ui';

export const ApplicationDetailsPage = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [app, setApp] = useState(null);
  const [associatedPolicy, setAssociatedPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyApplicationById(applicationId);
        setApp(data);

        if (data && data.status === 'APPROVED') {
          const pol = await getPolicyByApplicationId(data.id);
          setAssociatedPolicy(pol);
        }
      } catch (err) {
        console.error('Failed to load application detail:', err);
        setError('Application details not found or access denied.');
      } finally {
        setLoading(false);
      }
    };
    if (applicationId) fetchDetail();
  }, [applicationId]);

  const { scope } = usePageReveal([loading]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200/70" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200/70" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <ErrorState
          icon={AlertCircle}
          title={error || 'Application not found'}
          description="You can head back to your applications list."
          onRetry={() => navigate('/customer/applications')}
          retryLabel="Back to My Applications"
        />
      </div>
    );
  }

  return (
    <div ref={scope} className="mx-auto max-w-4xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          onClick={() => navigate('/customer/applications')}
          className="flex items-center gap-1 font-medium transition-colors hover:text-blue-600 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> My Applications
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="font-semibold text-slate-800">{app.application_number}</span>
      </div>

      {/* Header banner */}
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
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-xs tracking-wider text-sky-300">
              APP {app.application_number}
            </span>
            <StatusBadge status={app.status} size="md" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{app.plan.plan_name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-300">
            <Building2 className="h-4 w-4 text-sky-300" />
            Insurer <strong className="font-semibold text-white">{app.insurer.company_name}</strong>
          </p>
        </div>
      </div>

      {/* Approved → policy transition */}
      {app.status === 'APPROVED' && (
        <div className="lp-reveal-d">
          {associatedPolicy ? (
            <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <FileCheck className="h-5 w-5" />
                </span>
                <div className="text-xs">
                  <p className="text-sm font-semibold text-emerald-800">Policy issued</p>
                  <p className="mt-0.5 text-slate-600">
                    Policy <strong className="font-mono text-emerald-900">{associatedPolicy.policy_number}</strong> · Valid{' '}
                    {formatDate(associatedPolicy.start_date)} – {formatDate(associatedPolicy.end_date)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/customer/policies/${associatedPolicy.id}`)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 cursor-pointer"
              >
                View policy <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-5 text-xs">
              <ShieldCheck className="h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Your application has been approved</p>
                <p className="mt-0.5 text-slate-600">Your policy is currently being prepared by the insurer.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rejection reason */}
      {app.status === 'REJECTED' && app.rejection_reason && (
        <div className="lp-reveal-d rounded-2xl border border-rose-200 bg-rose-50/60 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-700">
            <XCircle className="h-4 w-4" /> Reason for rejection
          </h3>
          <p className="mt-1.5 pl-6 text-sm font-medium text-slate-700">{app.rejection_reason}</p>
        </div>
      )}

      {/* Plan & timeline snapshot */}
      <div className="lp-reveal-d">
        <SectionCard icon={FileCheck} title="Application summary">
          <DetailGrid cols={4}>
            <InfoField label="Submitted" value={formatDateTime(app.submitted_at)} />
            <InfoField label="Reviewed" value={formatDateTime(app.reviewed_at)} />
            <InfoField label="Coverage" value={formatINR(app.plan.coverage_amount)} />
            <InfoField
              label="Premium"
              value={`${formatINR(app.plan.premium_amount)} / ${app.plan.premium_frequency}`}
              valueClass="text-blue-600"
            />
          </DetailGrid>
        </SectionCard>
      </div>

      {/* Applicant */}
      <div className="lp-reveal-d">
        <SectionCard icon={User} title="Applicant information">
          <DetailGrid cols={3}>
            <InfoField label="Date of birth" value={app.date_of_birth} />
            <InfoField label="Gender" value={app.gender} />
            <InfoField label="Occupation" value={app.occupation} />
            <InfoField label="Annual income" value={formatINR(app.annual_income)} />
          </DetailGrid>
        </SectionCard>
      </div>

      {/* Contact / address */}
      <div className="lp-reveal-d">
        <SectionCard icon={MapPin} title="Contact & address">
          <DetailGrid cols={3}>
            <InfoField label="City" value={app.city} />
            <InfoField label="State" value={app.state} />
            <InfoField label="Pincode" value={app.pincode} />
            <div className="sm:col-span-3">
              <InfoField label="Address" value={app.address} />
            </div>
          </DetailGrid>
        </SectionCard>
      </div>

      {/* Nominee */}
      <div className="lp-reveal-d">
        <SectionCard icon={HeartHandshake} title="Nominee information">
          <DetailGrid cols={3}>
            <InfoField label="Nominee name" value={app.nominee_name} />
            <InfoField label="Relationship" value={app.nominee_relationship} />
            <InfoField label="Nominee phone" value={app.nominee_phone} />
          </DetailGrid>
        </SectionCard>
      </div>

      {/* Health declaration */}
      {app.health_declaration && (
        <div className="lp-reveal-d">
          <SectionCard icon={HeartPulse} title="Health declaration">
            <p className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
              {app.health_declaration}
            </p>
          </SectionCard>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetailsPage;
