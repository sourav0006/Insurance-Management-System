import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Building2, CheckCircle2, AlertCircle, Send, User, HeartHandshake,
  Briefcase, MapPin, HeartPulse, ShieldCheck, Store, ArrowRight,
} from 'lucide-react';
import { getMarketplacePlanById, createApplication } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { usePageReveal, formatINR, primaryBtn, subtleBtn } from '../../components/customer/ui';

/* Shared field styling for a consistent, premium form feel. */
const labelCls = 'text-xs font-semibold text-slate-700';
const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-800 transition-colors placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500';

const FormSection = ({ icon: Icon, title, step, children }) => (
  <section className="space-y-4">
    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Step {step}</p>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
    </div>
    {children}
  </section>
);

export const ApplyForPlanPage = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submittedApp, setSubmittedApp] = useState(null);

  const [formData, setFormData] = useState({
    date_of_birth: '',
    gender: 'Male',
    address: '',
    city: '',
    state: '',
    pincode: '',
    nominee_name: '',
    nominee_relationship: 'Spouse',
    nominee_phone: '',
    occupation: '',
    annual_income: '',
    health_declaration: 'I hereby declare that I am in good health and free from any chronic diseases.',
  });

  useEffect(() => {
    const loadPlanAndPrefill = async () => {
      setLoading(true);
      setError(null);
      try {
        const planData = await getMarketplacePlanById(planId);
        setPlan(planData);

        if (user && user.customer_profile) {
          const cp = user.customer_profile;
          setFormData((prev) => ({
            ...prev,
            date_of_birth: cp.date_of_birth || prev.date_of_birth,
            gender: cp.gender || prev.gender,
            address: cp.address || prev.address,
            city: cp.city || prev.city,
            state: cp.state || prev.state,
            pincode: cp.pincode || prev.pincode,
            nominee_name: cp.nominee_name || prev.nominee_name,
            nominee_relationship: cp.nominee_relationship || prev.nominee_relationship,
            nominee_phone: cp.nominee_phone || prev.nominee_phone,
          }));
        }
      } catch (err) {
        console.error('Failed to load plan for application:', err);
        setError('Insurance plan not available for application.');
      } finally {
        setLoading(false);
      }
    };
    if (planId) loadPlanAndPrefill();
  }, [planId, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        plan_id: parseInt(planId, 10),
        ...formData,
        annual_income: parseFloat(formData.annual_income || 0),
      };
      const res = await createApplication(payload);
      setSubmittedApp(res);
    } catch (err) {
      console.error('Application submission failed:', err);
      if (err.response && err.response.status === 409) {
        setError('You already have an active or approved application for this insurance plan.');
      } else if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to submit application. Please check form fields and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const { scope } = usePageReveal([loading, submittedApp]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200/70" />
        <div className="h-28 animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-200/70" />
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div className="mx-auto max-w-2xl py-8 text-center">
        <div className="mb-4 inline-flex rounded-full bg-rose-50 p-4 text-rose-600">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">{error}</h2>
        <button onClick={() => navigate('/customer/marketplace')} className={`mt-4 ${primaryBtn}`}>
          <ArrowLeft className="h-4 w-4" /> Back to Marketplace
        </button>
      </div>
    );
  }

  // Success confirmation
  if (submittedApp) {
    return (
      <div ref={scope} className="mx-auto max-w-2xl space-y-5">
        <div className="lp-reveal-d rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Application submitted</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Your insurance application has been securely transmitted to the insurer for review.
          </p>

          <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <span className="text-xs font-semibold text-slate-500">Application number</span>
              <span className="font-mono text-sm font-bold text-blue-600">{submittedApp.application_number}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <span className="text-xs font-semibold text-slate-500">Plan</span>
              <span className="text-xs font-bold text-slate-900">{submittedApp.plan.plan_name}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <span className="text-xs font-semibold text-slate-500">Insurer</span>
              <span className="text-xs font-medium text-slate-700">{submittedApp.insurer.company_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Status</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                {submittedApp.status}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to={`/customer/applications/${submittedApp.id}`} className={primaryBtn}>
              View my application <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link to="/customer/marketplace" className={subtleBtn}>
              <Store className="h-4 w-4" /> Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={scope} className="mx-auto max-w-3xl space-y-5">
      {/* Header */}
      <div className="lp-reveal-d flex items-center gap-3">
        <button
          onClick={() => navigate(`/customer/marketplace/plans/${planId}`)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Insurance application</h1>
          <p className="text-xs text-slate-500">Provide accurate personal and nominee details to complete your application.</p>
        </div>
      </div>

      {/* Plan summary */}
      <div className="lp-reveal-d relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-5 text-white">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-sky-300">
              <ShieldCheck className="h-3 w-3" /> Selected plan
            </span>
            <h2 className="mt-2 text-lg font-bold">{plan?.plan_name}</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-300">
              <Building2 className="h-3.5 w-3.5 text-sky-300" /> {plan?.company_name}
            </p>
          </div>
          <div className="shrink-0 rounded-xl border border-white/10 bg-white/5 p-3 text-left sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-300">Coverage / Premium</p>
            <p className="mt-0.5 text-sm font-bold text-white">{formatINR(plan?.coverage_amount)}</p>
            <p className="text-xs font-semibold text-sky-300">
              {formatINR(plan?.premium_amount)} / {plan?.premium_frequency}
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="lp-reveal-d flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50/60 p-4 text-xs">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <div>
            <p className="font-semibold text-rose-700">{error}</p>
            {error.includes('already have an active') && (
              <Link to="/customer/applications" className="mt-1 block font-semibold text-blue-600 underline">
                View my existing applications →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="lp-reveal-d space-y-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        {/* Applicant */}
        <FormSection icon={User} title="Personal details" step="01">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={labelCls}>Date of birth *</label>
              <input
                type="date"
                name="date_of_birth"
                required
                max={new Date().toISOString().split('T')[0]}
                value={formData.date_of_birth}
                onChange={handleChange}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Gender *</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className={`${inputCls} cursor-pointer`}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </FormSection>

        {/* Contact / address */}
        <FormSection icon={MapPin} title="Contact & address" step="02">
          <div className="space-y-1.5">
            <label className={labelCls}>Residential address *</label>
            <input
              type="text"
              name="address"
              required
              placeholder="House / Flat No., Street, Area"
              value={formData.address}
              onChange={handleChange}
              className={inputCls}
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className={labelCls}>City *</label>
              <input type="text" name="city" required placeholder="City" value={formData.city} onChange={handleChange} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>State *</label>
              <input type="text" name="state" required placeholder="State" value={formData.state} onChange={handleChange} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Pincode *</label>
              <input type="text" name="pincode" required placeholder="6-digit pincode" value={formData.pincode} onChange={handleChange} className={inputCls} />
            </div>
          </div>
        </FormSection>

        {/* Nominee */}
        <FormSection icon={HeartHandshake} title="Nominee information" step="03">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className={labelCls}>Nominee name *</label>
              <input type="text" name="nominee_name" required placeholder="Full name of nominee" value={formData.nominee_name} onChange={handleChange} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Relationship *</label>
              <select name="nominee_relationship" value={formData.nominee_relationship} onChange={handleChange} className={`${inputCls} cursor-pointer`}>
                <option value="Spouse">Spouse</option>
                <option value="Parent">Parent</option>
                <option value="Child">Child</option>
                <option value="Sibling">Sibling</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Nominee phone *</label>
              <input type="tel" name="nominee_phone" required placeholder="Contact number" value={formData.nominee_phone} onChange={handleChange} className={inputCls} />
            </div>
          </div>
        </FormSection>

        {/* Additional */}
        <FormSection icon={Briefcase} title="Additional information" step="04">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={labelCls}>Occupation *</label>
              <input type="text" name="occupation" required placeholder="e.g. Engineer, Business, Doctor" value={formData.occupation} onChange={handleChange} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Annual income (₹) *</label>
              <input type="number" name="annual_income" required min="0" placeholder="Annual income in INR" value={formData.annual_income} onChange={handleChange} className={inputCls} />
            </div>
          </div>
        </FormSection>

        {/* Health declaration */}
        <FormSection icon={HeartPulse} title="Health declaration" step="05">
          <div className="space-y-1.5">
            <label className={labelCls}>Declaration *</label>
            <textarea
              name="health_declaration"
              required
              rows={3}
              value={formData.health_declaration}
              onChange={handleChange}
              className={`${inputCls} resize-y`}
            />
          </div>
        </FormSection>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
          <button type="button" onClick={() => navigate(`/customer/marketplace/plans/${planId}`)} className={subtleBtn}>
            Cancel
          </button>
          <button type="submit" disabled={submitting} className={primaryBtn}>
            {submitting ? (
              'Submitting…'
            ) : (
              <>
                <Send className="h-4 w-4" /> Submit application
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplyForPlanPage;
