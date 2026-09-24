import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Calendar, Send, Lock, AlertCircle, CheckCircle2, X, Building2,
} from 'lucide-react';
import { getInsurerQueryById, respondToQuery, closeInsurerQuery } from '../../services/api';
import {
  usePageReveal, StatusBadge, ErrorState, formatDateTime, subtleBtn,
} from '../../components/customer/ui';

const InsurerQueryDetailsPage = () => {
  const { queryId } = useParams();
  const navigate = useNavigate();

  const [query, setQuery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQueryDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryId]);

  const fetchQueryDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInsurerQueryById(queryId);
      setQuery(data);
      if (data.response) setResponseText(data.response);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load inquiry detail.');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    if (!responseText.trim()) {
      setError('Response text cannot be empty.');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const updated = await respondToQuery(queryId, responseText.trim());
      setQuery(updated);
      setSuccessMsg('Your response has been sent to the customer.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send response.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseQuery = async () => {
    if (!window.confirm('Are you sure you want to close this customer query?')) return;
    try {
      setSubmitting(true);
      setError(null);
      const updated = await closeInsurerQuery(queryId);
      setQuery(updated);
      setSuccessMsg('Query has been marked as CLOSED.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to close query.');
    } finally {
      setSubmitting(false);
    }
  };

  const { scope } = usePageReveal([loading]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200/70" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200/70" />
      </div>
    );
  }

  if (error && !query) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <ErrorState
          icon={AlertCircle}
          title={error || 'Query not found'}
          description="You can head back to your customer inquiries."
          onRetry={() => navigate('/insurer/queries')}
          retryLabel="Back to Inquiries"
        />
      </div>
    );
  }

  return (
    <div ref={scope} className="mx-auto max-w-4xl space-y-5">
      {/* Top nav */}
      <div className="flex items-center justify-between">
        <Link
          to="/insurer/queries"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Inquiries
        </Link>
        <StatusBadge status={query.status} size="lg" />
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 transition-colors hover:text-emerald-900 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Inline error */}
      {error && query && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/60 p-4 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Conversation card */}
      <div className="lp-reveal-d overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {/* Header */}
        <div className="space-y-3 border-b border-slate-100 bg-slate-50/60 p-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-bold text-slate-900">{query.subject}</h1>
            {query.status !== 'CLOSED' && (
              <button onClick={handleCloseQuery} disabled={submitting} className={`${subtleBtn} shrink-0`}>
                <Lock className="h-3.5 w-3.5" /> Mark closed
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4 text-slate-400" />
              <span className="font-medium text-slate-700">{query.customer_name}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400" /> Received {formatDateTime(query.created_at)}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-6 p-6">
          {/* Customer message */}
          <div className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
              <User className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="mb-1.5 text-xs font-semibold text-slate-500">{query.customer_name} asked</p>
              <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
                {query.message}
              </div>
            </div>
          </div>

          {/* Response form / display */}
          {query.status === 'CLOSED' ? (
            <div className="flex flex-row-reverse gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sky-300">
                <Building2 className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">Your response</p>
                  {query.responded_at && (
                    <p className="text-[11px] text-slate-400">{formatDateTime(query.responded_at)}</p>
                  )}
                </div>
                <div className="rounded-2xl rounded-tr-sm border border-blue-200 bg-blue-50/60 p-4 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
                  {query.response || 'No response was provided prior to closure.'}
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-100 p-3 text-xs text-slate-500">
                  <Lock className="h-4 w-4 text-slate-400" />
                  <span>This conversation is closed and read-only.</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Your response</p>
              <form onSubmit={handleRespond} className="space-y-4">
                <textarea
                  rows={5}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Write your official response to the customer here…"
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">
                    {query.status === 'RESPONDED'
                      ? `Last responded: ${formatDateTime(query.responded_at)}`
                      : 'Submitting a response will mark this query as RESPONDED.'}
                  </span>
                  <button
                    type="submit"
                    disabled={submitting || !responseText.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? 'Sending…' : query.status === 'RESPONDED' ? 'Update response' : 'Submit response'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsurerQueryDetailsPage;
