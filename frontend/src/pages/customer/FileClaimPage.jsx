import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, FileCheck, ShieldCheck, AlertCircle, CheckCircle2, ChevronRight, IndianRupee, Calendar } from 'lucide-react';
import { getMyPolicies, createClaim } from '../../services/api';
import { usePageReveal, SectionCard, InfoField, DetailGrid, ErrorState, formatINR } from '../../components/customer/ui';

export const FileClaimPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPolicyId = searchParams.get('policy_id') || '';

  const [policies, setPolicies] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    policy_id: initialPolicyId,
    claim_type: 'Medical Hospitalization',
    incident_date: new Date().toISOString().split('T')[0],
    claim_amount: '',
    description: '',
  });

  useEffect(() => {
    const fetchPolicies = async () => {
      setLoadingPolicies(true);
      try {
        const data = await getMyPolicies();
        // Filter only ACTIVE policies
        const activeOnly = (data || []).filter((p) => p.status === 'ACTIVE');
        setPolicies(activeOnly);

        if (!formData.policy_id && activeOnly.length > 0) {
          setFormData((prev) => ({ ...prev, policy_id: activeOnly[0].id.toString() }));
        }
      } catch (err) {
        console.error('Failed to load active policies:', err);
        setError('Failed to fetch active policies. Please ensure you have an active policy.');
      } finally {
        setLoadingPolicies(false);
      }
    };

    fetchPolicies();
  }, []);

  const { scope } = usePageReveal([loadingPolicies]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.policy_id) {
      setError('Please select an active policy.');
      return;
    }

    if (!formData.claim_amount || parseFloat(formData.claim_amount) <= 0) {
      setError('Please enter a valid claim amount greater than zero.');
      return;
    }

    if (!formData.description || formData.description.trim().length < 5) {
      setError('Please provide a detailed description (at least 5 characters).');
      return;
    }

    setSubmitLoading(true);

    try {
      const payload = {
        policy_id: parseInt(formData.policy_id, 10),
        claim_type: formData.claim_type,
        incident_date: formData.incident_date,
        claim_amount: parseFloat(formData.claim_amount),
        description: formData.description.trim(),
      };

      const newClaim = await createClaim(payload);
      setSuccessMsg(`Claim ${newClaim.claim_number} successfully submitted!`);
      setTimeout(() => {
        navigate(`/customer/claims/${newClaim.id}`);
      }, 1500);
    } catch (err) {
      console.error('Failed to submit claim:', err);
      const detail = err.response?.data?.detail || 'Failed to submit insurance claim. Please verify form values.';
      setError(detail);
    } finally {
      setSubmitLoading(false);
    }
  };

  const selectedPolicy = policies.find((p) => p.id.toString() === formData.policy_id);

  return (
    <div ref={scope} className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/customer/claims" className="flex items-center gap-1 font-medium transition-colors hover:text-blue-600">
          <ArrowLeft className="h-3.5 w-3.5" /> My Claims
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="font-semibold text-slate-800">File New Claim</span>
      </div>

      {/* Header */}
      <div className="lp-reveal-d rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <FileCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">File an Insurance Claim</h1>
            <p className="text-xs text-slate-500 sm:text-sm">
              Submit your claim details against an active policy for insurer review.
            </p>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="lp-reveal-d flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <div>
            <p className="font-semibold">Submission Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="lp-reveal-d flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* Main Form */}
      {loadingPolicies ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200/70" />
      ) : policies.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />
          <h3 className="mt-3 text-base font-bold text-slate-900">No Active Policies Available</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            You currently do not have any active policies eligible for claims. Claims can only be filed against approved and active policies.
          </p>
          <button
            type="button"
            onClick={() => navigate('/customer/marketplace')}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Browse Marketplace
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="lp-reveal-d space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            {/* Policy Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Select Active Policy <span className="text-rose-500">*</span>
              </label>
              <select
                name="policy_id"
                value={formData.policy_id}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              >
                {policies.map((pol) => (
                  <option key={pol.id} value={pol.id}>
                    {pol.policy_number} — {pol.plan?.plan_name || 'Policy'} ({pol.insurer?.company_name || 'Insurer'})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Policy Card */}
            {selectedPolicy && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-700 uppercase tracking-wider text-[10px]">Selected Policy Overview</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">ACTIVE</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-700">
                  <div><strong>Plan:</strong> {selectedPolicy.plan?.plan_name}</div>
                  <div><strong>Coverage:</strong> {formatINR(selectedPolicy.financial?.coverage_amount)}</div>
                  <div><strong>Insurer:</strong> {selectedPolicy.insurer?.company_name}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Claim Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Claim Category / Type <span className="text-rose-500">*</span>
                </label>
                <select
                  name="claim_type"
                  value={formData.claim_type}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="Medical Hospitalization">Medical Hospitalization</option>
                  <option value="Vehicle Damage">Vehicle Damage</option>
                  <option value="Accidental Injury">Accidental Injury</option>
                  <option value="Property Loss / Damage">Property Loss / Damage</option>
                  <option value="Theft & Burglary">Theft &amp; Burglary</option>
                  <option value="Critical Illness">Critical Illness</option>
                  <option value="Emergency Care">Emergency Care</option>
                  <option value="Other Claim">Other Claim</option>
                </select>
              </div>

              {/* Incident Date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Incident Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="incident_date"
                  value={formData.incident_date}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Requested Amount */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Requested Claim Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  name="claim_amount"
                  step="0.01"
                  min="1"
                  placeholder="e.g. 25000"
                  value={formData.claim_amount}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-8 pr-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Incident &amp; Claim Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="description"
                rows={4}
                placeholder="Provide a detailed explanation of the incident, hospitalization details, damage assessment, or medical diagnosis..."
                value={formData.description}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Form Action */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/customer/claims')}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md transition-colors hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {submitLoading ? 'Submitting Claim...' : 'Submit Insurance Claim'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default FileClaimPage;
