import React, { useEffect, useState } from 'react';
import {
  Building2, CheckCircle2, AlertCircle, XCircle, Save, User, ShieldCheck, Clock,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { usePageReveal, SectionCard, primaryBtn } from '../../components/customer/ui';

const fieldCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500';
const readonlyCls =
  'w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-600';
const labelCls = 'mb-1.5 block text-xs font-semibold text-slate-700';

/* Verification banner — subtle, professional treatment per state. */
const VerificationBanner = ({ status, reason }) => {
  const map = {
    APPROVED: {
      wrap: 'border-emerald-200 bg-emerald-50/70', Icon: CheckCircle2, iconCls: 'text-emerald-600',
      title: 'Verification status: Approved',
      body: 'Your vendor account is fully verified. You can publish and manage insurance plans.',
    },
    PENDING: {
      wrap: 'border-amber-200 bg-amber-50/70', Icon: Clock, iconCls: 'text-amber-600',
      title: 'Verification status: Pending',
      body: 'Your registration is submitted and awaiting Platform Admin review.',
    },
    REJECTED: {
      wrap: 'border-rose-200 bg-rose-50/70', Icon: XCircle, iconCls: 'text-rose-600',
      title: 'Verification status: Rejected',
      body: 'Your vendor application was rejected by the administrator.',
    },
    SUSPENDED: {
      wrap: 'border-slate-300 bg-slate-100/70', Icon: AlertCircle, iconCls: 'text-slate-600',
      title: 'Verification status: Suspended',
      body: 'Your vendor account has been temporarily suspended by the administrator.',
    },
  };
  const s = map[status];
  if (!s) return null;
  const { Icon } = s;
  return (
    <div className={`lp-reveal-d rounded-2xl border p-5 ${s.wrap}`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${s.iconCls}`} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{s.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{s.body}</p>
        </div>
      </div>
      {(status === 'REJECTED' || status === 'SUSPENDED') && reason && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800">
          <strong>{status === 'REJECTED' ? 'Rejection' : 'Suspension'} reason:</strong> {reason}
        </div>
      )}
    </div>
  );
};

export const InsurerProfilePage = () => {
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [profile, setProfile] = useState({
    user_id: null,
    full_name: '',
    email: '',
    phone: '',
    company_name: '',
    license_number: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    verification_status: 'PENDING',
    rejection_reason: null,
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/insurers/me');
      setProfile(res.data);
    } catch (err) {
      console.error('Failed to load insurer profile:', err);
      setErrorMsg('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const updatePayload = {
        full_name: profile.full_name,
        phone: profile.phone || null,
        company_name: profile.company_name,
        description: profile.description || null,
        contact_email: profile.contact_email || null,
        contact_phone: profile.contact_phone || null,
        address: profile.address || null,
        city: profile.city || null,
        state: profile.state || null,
        pincode: profile.pincode || null,
      };
      const res = await api.patch('/insurers/me', updatePayload);
      setProfile(res.data);
      setSuccessMsg('Insurer profile updated successfully.');
      refreshUser();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Profile update failed:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const status = profile.verification_status;
  const { scope } = usePageReveal([loading]);

  return (
    <div ref={scope} className="mx-auto max-w-4xl space-y-5">
      {/* Header */}
      <div className="lp-reveal-d flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Company profile</h1>
            <p className="mt-0.5 text-xs text-slate-500">Manage your company contact details and organization profile.</p>
          </div>
        </div>
        {successMsg && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700">
            <AlertCircle className="h-4 w-4 text-rose-600" /> {errorMsg}
          </div>
        )}
      </div>

      {/* Verification banner */}
      <VerificationBanner status={status} reason={profile.rejection_reason} />

      {/* Form */}
      {loading ? (
        <div className="h-96 animate-pulse rounded-2xl bg-slate-200/70" />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Read-only credentials */}
          <div className="lp-reveal-d">
            <SectionCard icon={ShieldCheck} title="Controlled account credentials (read-only)">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelCls}>Account login email</label>
                  <input type="text" disabled value={profile.email} className={readonlyCls} />
                </div>
                <div>
                  <label className={labelCls}>License number</label>
                  <input type="text" disabled value={profile.license_number} className={`${readonlyCls} font-mono`} />
                </div>
                <div>
                  <label className={labelCls}>Verification status</label>
                  <input type="text" disabled value={profile.verification_status} className={`${readonlyCls} uppercase`} />
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Representative & company */}
          <div className="lp-reveal-d">
            <SectionCard icon={User} title="Representative & company information">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Representative name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Company name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={profile.company_name}
                    onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                    className={fieldCls}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className={labelCls}>Company description</label>
                <textarea
                  rows={3}
                  value={profile.description || ''}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  placeholder="Overview of insurance products and services…"
                  className={`${fieldCls} resize-y`}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelCls}>Representative phone</label>
                  <input
                    type="text"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="9876543210"
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Contact email</label>
                  <input
                    type="email"
                    value={profile.contact_email || ''}
                    onChange={(e) => setProfile({ ...profile, contact_email: e.target.value })}
                    placeholder="support@company.com"
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Contact phone</label>
                  <input
                    type="text"
                    value={profile.contact_phone || ''}
                    onChange={(e) => setProfile({ ...profile, contact_phone: e.target.value })}
                    placeholder="1800-123-4567"
                    className={fieldCls}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Location */}
          <div className="lp-reveal-d">
            <SectionCard icon={Building2} title="Registered location">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelCls}>City</label>
                  <input
                    type="text"
                    value={profile.city || ''}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    placeholder="Mumbai"
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>State</label>
                  <input
                    type="text"
                    value={profile.state || ''}
                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                    placeholder="Maharashtra"
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Pincode</label>
                  <input
                    type="text"
                    value={profile.pincode || ''}
                    onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                    placeholder="400001"
                    className={fieldCls}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Submit */}
          <div className="lp-reveal-d flex justify-end">
            <button type="submit" disabled={saving} className={primaryBtn}>
              <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save profile changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default InsurerProfilePage;
