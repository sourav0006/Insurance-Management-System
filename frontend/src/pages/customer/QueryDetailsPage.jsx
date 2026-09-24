import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, Calendar, Clock, CheckCircle2, AlertCircle, Lock, MessageSquare, User, X,
} from 'lucide-react';
import { getMyQueryById, closeMyQuery } from '../../services/api';
import { usePageReveal, StatusBadge, ErrorState, formatDateTime, subtleBtn } from '../../components/customer/ui';

const QueryDetailsPage = () => {
  const { queryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [query, setQuery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(location.state?.successMessage || null);

  const fetchQueryDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyQueryById(queryId);
      setQuery(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load query details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueryDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryId]);

  const handleCloseQuery = async () => {
    if (!window.confirm('Are you sure you want to mark this query as CLOSED?')) return;
    try {
      setActionLoading(true);
      const updated = await closeMyQuery(queryId);
      setQuery(updated);
      setSuccessMsg('Query has been marked as CLOSED.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to close query.');
    } finally {
      setActionLoading(false);
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

  if (error || !query) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <ErrorState
          icon={AlertCircle}
          title={error || 'Query not found'}
          description="You can head back to your support conversations."
          onRetry={() => navigate('/customer/queries')}
          retryLabel="Back to Customer Support"
        />
      </div>
    );
  }

  return (
    <div ref={scope} className="mx-auto max-w-4xl space-y-5">
      {/* Top nav */}
      <div className="flex items-center justify-between">
        <Link
          to="/customer/queries"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Customer Support
        </Link>
        <StatusBadge status={query.status} size="md" />
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

      {/* Conversation card */}
      <div className="lp-reveal-d overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {/* Header */}
        <div className="space-y-3 border-b border-slate-100 bg-slate-50/60 p-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-bold text-slate-900">{query.subject}</h1>
            {query.status !== 'CLOSED' && (
              <button onClick={handleCloseQuery} disabled={actionLoading} className={`${subtleBtn} shrink-0`}>
                <Lock className="h-3.5 w-3.5" />
                {actionLoading ? 'Closing…' : 'Close query'}
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span className="font-medium text-slate-700">{query.company_name}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400" /> Submitted {formatDateTime(query.created_at)}
            </span>
          </div>
        </div>

        {/* Conversation body */}
        <div className="space-y-6 p-6">
          {/* Customer message */}
          <div className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
              <User className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="mb-1.5 text-xs font-semibold text-slate-500">You asked</p>
              <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
                {query.message}
              </div>
            </div>
          </div>

          {/* Insurer response */}
          {query.status === 'OPEN' ? (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
              <Clock className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Waiting for the insurer's response</p>
                <p className="mt-0.5 text-xs text-amber-700">
                  The insurer has been notified of your query and will respond shortly.
                </p>
              </div>
            </div>
          ) : query.response ? (
            <div className="flex flex-row-reverse gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sky-300">
                <Building2 className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">{query.company_name} responded</p>
                  {query.responded_at && (
                    <p className="text-[11px] text-slate-400">{formatDateTime(query.responded_at)}</p>
                  )}
                </div>
                <div className="rounded-2xl rounded-tr-sm border border-blue-200 bg-blue-50/60 p-4 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
                  {query.response}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm italic text-slate-500">
              No response was provided for this query.
            </div>
          )}

          {query.status === 'CLOSED' && (
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-3 text-xs text-slate-500">
              <Lock className="h-4 w-4 text-slate-400" />
              <span>This conversation is closed and read-only.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueryDetailsPage;
