import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Send, Building2, AlertCircle, ShieldCheck, MessageSquare } from 'lucide-react';
import { getApprovedInsurersForQueries, createQuery } from '../../services/api';
import { usePageReveal, primaryBtn } from '../../components/customer/ui';

const querySchema = z.object({
  insurer_id: z.coerce.number({ invalid_type_error: 'Please select an insurer' }).min(1, 'Please select an insurer'),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(255, 'Subject cannot exceed 255 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters long'),
});

const labelCls = 'mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700';
const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500';

const CreateQueryPage = () => {
  const [insurers, setInsurers] = useState([]);
  const [loadingInsurers, setLoadingInsurers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(querySchema),
  });

  useEffect(() => {
    const fetchInsurers = async () => {
      try {
        setLoadingInsurers(true);
        const data = await getApprovedInsurersForQueries();
        setInsurers(data || []);
      } catch (err) {
        setServerError('Failed to load approved insurers.');
      } finally {
        setLoadingInsurers(false);
      }
    };
    fetchInsurers();
  }, []);

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setServerError(null);
      const newQuery = await createQuery(data);
      navigate(`/customer/queries/${newQuery.id}`, {
        state: { successMessage: 'Your query has been submitted successfully to the insurer.' },
      });
    } catch (err) {
      setServerError(err.response?.data?.detail || 'Failed to submit your query. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const { scope } = usePageReveal([loadingInsurers]);

  return (
    <div ref={scope} className="mx-auto max-w-3xl space-y-5">
      {/* Back */}
      <Link
        to="/customer/queries"
        className="lp-reveal-d inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Customer Support
      </Link>

      {/* Card */}
      <div className="lp-reveal-d overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/60 p-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <MessageSquare className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Ask your insurer</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Select a verified insurance provider and send your question directly.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6">
          {serverError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/60 p-4 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Insurer */}
          <div>
            <label className={labelCls}>
              Select insurance company <span className="text-rose-500">*</span>
            </label>
            {loadingInsurers ? (
              <div className="text-xs text-slate-500">Loading verified insurers…</div>
            ) : insurers.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                No verified insurers are available at this moment.
              </div>
            ) : (
              <div className="relative">
                <select {...register('insurer_id')} className={`${inputCls} cursor-pointer appearance-none pr-10`}>
                  <option value="">— Select verified insurer —</option>
                  {insurers.map((ins) => (
                    <option key={ins.insurer_id} value={ins.insurer_id}>
                      {ins.company_name}
                    </option>
                  ))}
                </select>
                <Building2 className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            )}
            {!loadingInsurers && insurers.length > 0 && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-600">
                <ShieldCheck className="h-3 w-3" /> Only platform-verified insurers are shown.
              </p>
            )}
            {errors.insurer_id && <p className="mt-1.5 text-xs text-rose-600">{errors.insurer_id.message}</p>}
          </div>

          {/* Subject */}
          <div>
            <label className={labelCls}>
              Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Query regarding claim process for Health Shield"
              {...register('subject')}
              className={inputCls}
            />
            {errors.subject && <p className="mt-1.5 text-xs text-rose-600">{errors.subject.message}</p>}
          </div>

          {/* Message */}
          <div>
            <label className={labelCls}>
              Your message <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={5}
              placeholder="Provide a detailed description of your question or concern…"
              {...register('message')}
              className={`${inputCls} resize-y`}
            />
            {errors.message && <p className="mt-1.5 text-xs text-rose-600">{errors.message.message}</p>}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <Link to="/customer/queries" className="px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-800">
              Cancel
            </Link>
            <button type="submit" disabled={submitting || insurers.length === 0} className={primaryBtn}>
              <Send className="h-4 w-4" />
              {submitting ? 'Submitting…' : 'Submit question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateQueryPage;
