import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, User, FileText, MapPin,
  CheckCircle2, X, AlertCircle, ChevronRight, ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';
import {
  usePageReveal, SectionCard, InfoField, DetailGrid, ErrorState, formatDate, subtleBtn,
} from '../../components/customer/ui';
import { AdminStatusBadge } from '../../components/admin/ui';

export const AdminInsurerDetailsPage = () => {
  const { insurerId } = useParams();
  const navigate = useNavigate();

  const [insurer, setInsurer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Action Modal state
  const [actionModal, setActionModal] = useState({ isOpen: false, type: null, reason: '' });

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insurerId]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/admin/insurers/${insurerId}`);
      setInsurer(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch insurer details.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleApprove = async () => {
    try {
      setProcessing(true);
      const res = await api.patch(`/admin/insurers/${insurerId}/approve`);
      setInsurer(res.data);
      showToast('Insurer vendor approved successfully.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to approve insurer.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReinstate = async () => {
    try {
      setProcessing(true);
      const res = await api.patch(`/admin/insurers/${insurerId}/reinstate`);
      setInsurer(res.data);
      showToast('Insurer vendor reinstated to APPROVED status.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reinstate insurer.');
    } finally {
      setProcessing(false);
    }
  };

  const closeActionModal = () => setActionModal({ isOpen: false, type: null, reason: '' });

  const handleConfirmActionModal = async (e) => {
    e.preventDefault();
    if (!actionModal.reason.trim()) {
      alert('Please enter a valid reason.');
      return;
    }
    setProcessing(true);
    try {
      let res;
      if (actionModal.type === 'REJECT') {
        res = await api.patch(`/admin/insurers/${insurerId}/reject`, {
          rejection_reason: actionModal.reason.trim(),
        });
        showToast('Insurer application rejected.');
      } else if (actionModal.type === 'SUSPEND') {
        res = await api.patch(`/admin/insurers/${insurerId}/suspend`, {
          suspension_reason: actionModal.reason.trim(),
        });
        showToast('Insurer account suspended.');
      }
      setInsurer(res.data);
      closeActionModal();
    } catch (err) {
      setError(err.response?.data?.detail || 'Action failed.');
    } finally {
      setProcessing(false);
    }
  };

  const { scope } = usePageReveal([loading]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200/70" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="h-52 animate-pulse rounded-2xl bg-slate-200/70" />
      </div>
    );
  }

  if (error && !insurer) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <ErrorState
          icon={AlertCircle}
          title={error || 'Insurer vendor not found'}
          description="You can head back to the insurer verification list."
          onRetry={() => navigate('/admin/insurers')}
          retryLabel="Back to Insurers"
        />
      </div>
    );
  }

  const status = insurer.verification_status;
  const actionBtn =
    'inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer';

  return (
    <div ref={scope} className="mx-auto max-w-4xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          onClick={() => navigate('/admin/insurers')}
          className="flex items-center gap-1 font-medium transition-colors hover:text-blue-600 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Insurer verification
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="truncate font-semibold text-slate-800">{insurer.company_name}</span>
      </div>

      {/* Inline error (when record already loaded) */}
      {error && insurer && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/60 p-4 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success toast */}
      {toastMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Record header */}
      <div className="lp-reveal-d rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Building2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Official verification record
              </span>
              <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {insurer.company_name}
              </h1>
              <p className="mt-0.5 font-mono text-xs text-slate-500">License {insurer.license_number}</p>
            </div>
          </div>
          <AdminStatusBadge status={status} size="lg" />
        </div>

        {/* Status-driven actions */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
          {status === 'PENDING' && (
            <>
              <button onClick={handleApprove} disabled={processing} className={`${actionBtn} bg-emerald-600 hover:bg-emerald-700`}>
                <CheckCircle2 className="h-4 w-4" /> Approve vendor
              </button>
              <button
                onClick={() => setActionModal({ isOpen: true, type: 'REJECT', reason: '' })}
                disabled={processing}
                className={`${actionBtn} bg-rose-600 hover:bg-rose-700`}
              >
                <X className="h-4 w-4" /> Reject vendor
              </button>
            </>
          )}
          {status === 'APPROVED' && (
            <button
              onClick={() => setActionModal({ isOpen: true, type: 'SUSPEND', reason: '' })}
              disabled={processing}
              className={`${actionBtn} bg-amber-600 hover:bg-amber-700`}
            >
              Suspend account
            </button>
          )}
          {(status === 'REJECTED' || status === 'SUSPENDED') && (
            <button onClick={handleReinstate} disabled={processing} className={`${actionBtn} bg-blue-600 hover:bg-blue-700`}>
              <ShieldCheck className="h-4 w-4" /> Reinstate vendor
            </button>
          )}
          {status === 'PENDING' && (
            <span className="text-xs text-slate-400">This vendor is awaiting verification.</span>
          )}
        </div>
      </div>

      {/* Representative */}
      <div className="lp-reveal-d">
        <SectionCard icon={User} title="Primary representative">
          <DetailGrid cols={3}>
            <InfoField label="Full name" value={insurer.full_name} />
            <InfoField label="Account email" value={insurer.email} />
            <InfoField label="Phone" value={insurer.phone || 'N/A'} />
          </DetailGrid>
        </SectionCard>
      </div>

      {/* Company & contact */}
      <div className="lp-reveal-d">
        <SectionCard icon={FileText} title="Company & contact profile">
          <DetailGrid cols={2}>
            <InfoField label="Contact email" value={insurer.contact_email || insurer.email} />
            <InfoField label="Contact phone" value={insurer.contact_phone || insurer.phone || 'N/A'} />
          </DetailGrid>
          {insurer.description && (
            <div className="mt-4 space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Description</p>
              <p className="rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                {insurer.description}
              </p>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Registration & location */}
      <div className="lp-reveal-d">
        <SectionCard icon={MapPin} title="Registration & location">
          <DetailGrid cols={2}>
            <InfoField
              label="Registered address"
              value={[insurer.address, insurer.city, insurer.state, insurer.pincode].filter(Boolean).join(', ') || 'N/A'}
            />
            <InfoField label="Registration date" value={formatDate(insurer.created_at)} />
          </DetailGrid>
        </SectionCard>
      </div>

      {/* Plans, Policies, Claims Summary */}
      <div className="lp-reveal-d grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Plans Created</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{insurer.plans?.length || 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Policies Issued</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{insurer.policies?.length || 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Covered Customers</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{insurer.covered_customers_count || 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Claims Filed</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{insurer.claims?.length || 0}</p>
        </div>
      </div>

      {/* Insurance Plans List */}
      {insurer.plans && insurer.plans.length > 0 && (
        <div className="lp-reveal-d">
          <SectionCard icon={FileText} title={`Insurance Plans (${insurer.plans.length})`}>
            <div className="divide-y divide-slate-100">
              {insurer.plans.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{p.plan_name}</span> ({p.category})
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{p.status}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Rejection / suspension reason */}
      {insurer.rejection_reason && (
        <div className="lp-reveal-d rounded-2xl border border-rose-200 bg-rose-50/60 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-700">
            <AlertCircle className="h-4 w-4" /> Rejection / suspension reason
          </h3>
          <p className="mt-1.5 pl-6 text-sm text-slate-700 whitespace-pre-wrap">{insurer.rejection_reason}</p>
        </div>
      )}

      {/* Action modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {actionModal.type === 'REJECT' ? 'Reject insurer application' : 'Suspend insurer account'}
              </h3>
              <button onClick={closeActionModal} className="text-slate-400 transition-colors hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Provide a clear reason for {actionModal.type === 'REJECT' ? 'rejecting' : 'suspending'} vendor{' '}
              <strong className="text-slate-900">"{insurer.company_name}"</strong>.
            </p>
            <form onSubmit={handleConfirmActionModal} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={actionModal.reason}
                  onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                  placeholder="Enter reason…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={closeActionModal} className={subtleBtn}>Cancel</button>
                <button
                  type="submit"
                  disabled={processing}
                  className={`${actionBtn} ${
                    actionModal.type === 'REJECT' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  Confirm {actionModal.type === 'REJECT' ? 'rejection' : 'suspension'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInsurerDetailsPage;
