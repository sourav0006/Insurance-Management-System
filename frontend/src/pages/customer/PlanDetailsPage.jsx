import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Building2, 
  FileText, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  ChevronRight
} from 'lucide-react';
import { getMarketplacePlanById } from '../../services/api';

export const PlanDetailsPage = () => {
  const { planId } = useParams();
  const navigate = useNavigate();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlanDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMarketplacePlanById(planId);
        setPlan(data);
      } catch (err) {
        console.error("Plan detail fetch error:", err);
        setError("Insurance plan not found or no longer available.");
      } finally {
        setLoading(false);
      }
    };

    if (planId) {
      fetchPlanDetail();
    }
  }, [planId]);

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <div className="h-6 bg-slate-200 rounded w-1/4 animate-pulse" />
        <div className="bg-white rounded-3xl p-8 border border-slate-200 animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-2/3" />
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-24 bg-slate-100 rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-slate-100 rounded-xl" />
            <div className="h-16 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="inline-flex p-4 bg-red-50 text-red-600 rounded-full">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">{error || "Plan not found"}</h2>
        <p className="text-xs text-slate-500">The requested plan may have been deactivated or removed.</p>
        <button
          onClick={() => navigate('/customer/marketplace')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          onClick={() => navigate('/customer/marketplace')}
          className="hover:text-blue-600 transition-colors flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Marketplace
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="text-slate-800 font-semibold truncate">{plan.plan_name}</span>
      </div>

      {/* Main Card Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 sm:p-8 text-white space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="px-3 py-1 bg-white/10 text-blue-200 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/10">
              {plan.category}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{plan.plan_name}</h1>

          <div className="flex items-center gap-2 text-blue-200 text-xs sm:text-sm pt-1">
            <Building2 className="h-4 w-4 text-blue-300" />
            <span>Provided by <strong className="text-white">{plan.company_name}</strong></span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400 ml-1" />
          </div>
        </div>

        {/* Plan Specs Grid */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Key Financial Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-100 space-y-1">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Coverage Amount</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{formatCurrency(plan.coverage_amount)}</p>
              <p className="text-[11px] text-slate-500">Maximum claimable coverage policy amount</p>
            </div>

            <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100 space-y-1">
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Premium Amount</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {formatCurrency(plan.premium_amount)}
                <span className="text-xs font-normal text-slate-500 ml-1">/ {plan.premium_frequency}</span>
              </p>
              <p className="text-[11px] text-slate-500">Recurring payment requirement</p>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" /> Description & Features
            </h3>
            <div className="bg-slate-50 p-4 rounded-2xl text-xs text-slate-700 leading-relaxed border border-slate-100">
              {plan.description || "No specific detailed description provided for this insurance product."}
            </div>
          </div>

          {/* Additional Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center gap-2 text-slate-500">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="font-semibold">Policy Term</span>
              </div>
              <p className="text-base font-bold text-slate-900">{plan.policy_term_years} Year{plan.policy_term_years > 1 ? 's' : ''}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center gap-2 text-slate-500">
                <Users className="h-4 w-4 text-indigo-500" />
                <span className="font-semibold">Eligible Age Range</span>
              </div>
              <p className="text-base font-bold text-slate-900">
                {plan.eligibility_min_age !== null ? plan.eligibility_min_age : 0} to {plan.eligibility_max_age !== null ? plan.eligibility_max_age : 100} Years
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center gap-2 text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="font-semibold">Insurer Status</span>
              </div>
              <p className="text-base font-bold text-emerald-700">Verified & Approved</p>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
              <span>Apply online now with instant submission to insurer.</span>
            </div>

            <button
              onClick={() => navigate(`/customer/marketplace/plans/${plan.id}/apply`)}
              className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Apply for Plan</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanDetailsPage;
