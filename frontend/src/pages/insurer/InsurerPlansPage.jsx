import React, { useEffect, useState } from 'react';
import {
  FileText, Plus, Edit2, Trash2, AlertCircle, CheckCircle2, X, Tag, Lock,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  usePageReveal, StatusBadge, EmptyState, formatINR, primaryBtn, subtleBtn,
} from '../../components/customer/ui';
import {
  WorkspaceHeader, SearchInput, FilterTabs, TableCard, TableHead, Th,
} from '../../components/insurer/ui';

const FILTER_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const fieldCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelCls = 'mb-1.5 block text-xs font-semibold text-slate-700';

export const InsurerPlansPage = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [formData, setFormData] = useState({
    plan_name: '',
    plan_code: '',
    category: 'Health Insurance',
    description: '',
    coverage_amount: '',
    premium_amount: '',
    premium_frequency: 'Yearly',
    policy_term_years: '1',
    eligibility_min_age: '18',
    eligibility_max_age: '65',
    status: 'DRAFT',
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const isApproved = user?.verification_status === 'APPROVED';

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/plans/my');
      setPlans(res.data);
    } catch (err) {
      console.error('Failed to fetch insurance plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      plan_name: '',
      plan_code: `PLAN-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'Health Insurance',
      description: '',
      coverage_amount: '500000',
      premium_amount: '6000',
      premium_frequency: 'Yearly',
      policy_term_years: '1',
      eligibility_min_age: '18',
      eligibility_max_age: '65',
      status: 'DRAFT',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setFormData({
      plan_name: plan.plan_name,
      plan_code: plan.plan_code,
      category: plan.category,
      description: plan.description || '',
      coverage_amount: String(plan.coverage_amount),
      premium_amount: String(plan.premium_amount),
      premium_frequency: plan.premium_frequency,
      policy_term_years: String(plan.policy_term_years),
      eligibility_min_age: plan.eligibility_min_age !== null ? String(plan.eligibility_min_age) : '',
      eligibility_max_age: plan.eligibility_max_age !== null ? String(plan.eligibility_max_age) : '',
      status: plan.status,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const errors = {};
    if (!formData.plan_name.trim()) errors.plan_name = 'Plan name is required';
    if (!formData.plan_code.trim()) errors.plan_code = 'Plan code is required';
    if (!formData.category.trim()) errors.category = 'Category is required';

    const cov = parseFloat(formData.coverage_amount);
    if (isNaN(cov) || cov <= 0) errors.coverage_amount = 'Coverage amount must be > 0';

    const prem = parseFloat(formData.premium_amount);
    if (isNaN(prem) || prem <= 0) errors.premium_amount = 'Premium amount must be > 0';

    const term = parseInt(formData.policy_term_years, 10);
    if (isNaN(term) || term <= 0) errors.policy_term_years = 'Policy term must be > 0';

    const minAge = formData.eligibility_min_age !== '' ? parseInt(formData.eligibility_min_age, 10) : null;
    const maxAge = formData.eligibility_max_age !== '' ? parseInt(formData.eligibility_max_age, 10) : null;

    if (minAge !== null && maxAge !== null && minAge > maxAge) {
      errors.eligibility_min_age = 'Min age cannot be greater than max age';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        plan_name: formData.plan_name.trim(),
        plan_code: formData.plan_code.trim().toUpperCase(),
        category: formData.category.trim(),
        description: formData.description.trim() || null,
        coverage_amount: cov,
        premium_amount: prem,
        premium_frequency: formData.premium_frequency,
        policy_term_years: term,
        eligibility_min_age: minAge,
        eligibility_max_age: maxAge,
        status: formData.status,
      };

      if (editingPlan) {
        await api.patch(`/plans/my/${editingPlan.id}`, payload);
        showToast(`Insurance plan "${payload.plan_name}" updated successfully.`);
      } else {
        await api.post('/plans', payload);
        showToast(`Insurance plan "${payload.plan_name}" created successfully.`);
      }

      setModalOpen(false);
      fetchPlans();
    } catch (err) {
      console.error('Plan submit error:', err);
      if (err.response?.data?.detail) {
        setFormErrors({ general: err.response.data.detail });
      } else {
        setFormErrors({ general: 'Operation failed. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete insurance plan "${name}"?`)) return;
    try {
      await api.delete(`/plans/my/${id}`);
      showToast(`Plan "${name}" deleted successfully.`);
      fetchPlans();
    } catch (err) {
      console.error('Delete plan error:', err);
      alert(err.response?.data?.detail || 'Failed to delete plan.');
    }
  };

  const filteredPlans = plans.filter((p) => {
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesSearch =
      p.plan_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.plan_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const { scope } = usePageReveal([loading]);

  return (
    <div ref={scope} className="mx-auto max-w-7xl space-y-5">
      <WorkspaceHeader
        title="Insurance products & plans"
        subtitle="Create, configure, and manage coverage offerings for customers."
      >
        {toastMsg && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {toastMsg}
          </div>
        )}
        {isApproved ? (
          <button onClick={openCreateModal} className={primaryBtn}>
            <Plus className="h-4 w-4" /> Create new plan
          </button>
        ) : (
          <button disabled className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-500">
            <Lock className="h-3.5 w-3.5" /> Approval required
          </button>
        )}
      </WorkspaceHeader>

      {/* Verification warning when not approved */}
      {!isApproved && (
        <div className="lp-reveal-d flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-amber-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-xs">
            <h4 className="text-sm font-semibold">Vendor approval pending</h4>
            <p className="mt-0.5 leading-relaxed">
              Plan creation controls are disabled. Once your vendor account is approved by the Platform Administrator, you can publish insurance products.
            </p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="lp-reveal-d flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs value={statusFilter} onChange={setStatusFilter} options={FILTER_OPTIONS} />
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search name, code, category…"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : filteredPlans.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No insurance plans found"
          description={isApproved ? 'Create your first product to start receiving applications.' : 'No plans match your current filters.'}
          ctaLabel={isApproved ? 'Create new plan' : undefined}
          ctaOnClick={isApproved ? openCreateModal : undefined}
        />
      ) : (
        <TableCard>
          <TableHead>
            <tr>
              <Th>Plan Name &amp; Code</Th>
              <Th>Category</Th>
              <Th>Coverage</Th>
              <Th>Premium</Th>
              <Th>Term</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </TableHead>
          <tbody className="divide-y divide-slate-100">
            {filteredPlans.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-slate-50/80">
                <td className="px-4 py-3.5">
                  <div className="text-sm font-bold text-slate-900">{p.plan_name}</div>
                  <div className="font-mono text-[11px] text-slate-500">{p.plan_code}</div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">{p.category}</span>
                </td>
                <td className="px-4 py-3.5 font-bold text-slate-900">{formatINR(p.coverage_amount)}</td>
                <td className="px-4 py-3.5 font-bold text-blue-600">
                  {formatINR(p.premium_amount)} <span className="text-[10px] font-normal text-slate-500">/ {p.premium_frequency}</span>
                </td>
                <td className="px-4 py-3.5 font-medium text-slate-700">{p.policy_term_years} yr</td>
                <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3.5 text-right">
                  {isApproved ? (
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(p)}
                        className="rounded-lg bg-slate-100 p-2 text-slate-700 transition-colors hover:bg-slate-200 cursor-pointer"
                        title="Edit plan"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(p.id, p.plan_name)}
                        className="rounded-lg bg-rose-50 p-2 text-rose-600 transition-colors hover:bg-rose-100 cursor-pointer"
                        title="Delete plan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] italic text-slate-400">Read only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}

      {/* Create / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl space-y-5 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Tag className="h-5 w-5 text-blue-600" />
                {editingPlan ? `Edit plan (${editingPlan.plan_code})` : 'Create new plan'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 transition-colors hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formErrors.general && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                {formErrors.general}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Plan name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.plan_name}
                    onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                    placeholder="e.g. Comprehensive Health Shield"
                    className={fieldCls}
                  />
                  {formErrors.plan_name && <p className="mt-1 text-xs text-rose-500">{formErrors.plan_name}</p>}
                </div>
                <div>
                  <label className={labelCls}>Plan code <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    disabled={!!editingPlan}
                    value={formData.plan_code}
                    onChange={(e) => setFormData({ ...formData, plan_code: e.target.value })}
                    placeholder="HEALTH-1001"
                    className={`${fieldCls} font-mono uppercase ${editingPlan ? 'cursor-not-allowed bg-slate-100 text-slate-500' : ''}`}
                  />
                  {formErrors.plan_code && <p className="mt-1 text-xs text-rose-500">{formErrors.plan_code}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Category <span className="text-rose-500">*</span></label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`${fieldCls} cursor-pointer`}
                  >
                    <option value="Health Insurance">Health Insurance</option>
                    <option value="Life Insurance">Life Insurance</option>
                    <option value="Motor / Vehicle Insurance">Motor / Vehicle Insurance</option>
                    <option value="Home / Property Insurance">Home / Property Insurance</option>
                    <option value="Travel Insurance">Travel Insurance</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className={`${fieldCls} cursor-pointer`}
                  >
                    <option value="DRAFT">DRAFT (Draft mode)</option>
                    <option value="ACTIVE">ACTIVE (Published)</option>
                    <option value="INACTIVE">INACTIVE (Deactivated)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Key policy details, inclusions, exclusions…"
                  className={`${fieldCls} resize-y`}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelCls}>Coverage amount (₹) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.coverage_amount}
                    onChange={(e) => setFormData({ ...formData, coverage_amount: e.target.value })}
                    placeholder="500000"
                    className={fieldCls}
                  />
                  {formErrors.coverage_amount && <p className="mt-1 text-xs text-rose-500">{formErrors.coverage_amount}</p>}
                </div>
                <div>
                  <label className={labelCls}>Premium amount (₹) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.premium_amount}
                    onChange={(e) => setFormData({ ...formData, premium_amount: e.target.value })}
                    placeholder="6000"
                    className={fieldCls}
                  />
                  {formErrors.premium_amount && <p className="mt-1 text-xs text-rose-500">{formErrors.premium_amount}</p>}
                </div>
                <div>
                  <label className={labelCls}>Premium frequency</label>
                  <select
                    value={formData.premium_frequency}
                    onChange={(e) => setFormData({ ...formData, premium_frequency: e.target.value })}
                    className={`${fieldCls} cursor-pointer`}
                  >
                    <option value="Yearly">Yearly</option>
                    <option value="Half-Yearly">Half-Yearly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelCls}>Term (years) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    value={formData.policy_term_years}
                    onChange={(e) => setFormData({ ...formData, policy_term_years: e.target.value })}
                    placeholder="1"
                    className={fieldCls}
                  />
                  {formErrors.policy_term_years && <p className="mt-1 text-xs text-rose-500">{formErrors.policy_term_years}</p>}
                </div>
                <div>
                  <label className={labelCls}>Min age limit</label>
                  <input
                    type="number"
                    value={formData.eligibility_min_age}
                    onChange={(e) => setFormData({ ...formData, eligibility_min_age: e.target.value })}
                    placeholder="18"
                    className={fieldCls}
                  />
                  {formErrors.eligibility_min_age && <p className="mt-1 text-xs text-rose-500">{formErrors.eligibility_min_age}</p>}
                </div>
                <div>
                  <label className={labelCls}>Max age limit</label>
                  <input
                    type="number"
                    value={formData.eligibility_max_age}
                    onChange={(e) => setFormData({ ...formData, eligibility_max_age: e.target.value })}
                    placeholder="65"
                    className={fieldCls}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className={subtleBtn}>Cancel</button>
                <button type="submit" disabled={submitting} className={primaryBtn}>
                  {submitting ? 'Saving…' : editingPlan ? 'Update plan' : 'Create plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsurerPlansPage;
