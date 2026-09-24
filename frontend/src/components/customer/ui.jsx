import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, CheckCircle2, XCircle, MessageCircle, ArrowRight, FileEdit, CircleSlash,
} from 'lucide-react';
import { useGsapContext } from '../landing/useGsapContext';

/* -------------------------------------------------------------------------- */
/* Formatting helpers                                                         */
/* -------------------------------------------------------------------------- */

export const formatINR = (val) =>
  val === null || val === undefined
    ? 'N/A'
    : new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(val);

export const formatDate = (d) =>
  !d
    ? 'N/A'
    : new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

export const formatDateTime = (d) =>
  !d
    ? 'N/A'
    : new Date(d).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

/* -------------------------------------------------------------------------- */
/* Page entrance reveal — shared GSAP pattern (fromTo + clearProps).          */
/* Elements marked `.lp-reveal-d` fade/slide in; always end visible.          */
/* -------------------------------------------------------------------------- */

export const usePageReveal = (deps = []) => {
  const [reduced, setReduced] = useState(false);
  const scope = useGsapContext(({ gsap, reduced: r }) => {
    setReduced(r);
    const targets = scope.current?.querySelectorAll('.lp-reveal-d');
    if (!targets || !targets.length) return;
    if (r) {
      gsap.set(targets, { opacity: 1, y: 0 });
      return;
    }
    gsap.fromTo(
      targets,
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.07, clearProps: 'transform,opacity' }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { scope, reduced };
};

/* -------------------------------------------------------------------------- */
/* PageHeader — consistent title block with optional primary action.          */
/* -------------------------------------------------------------------------- */

export const PageHeader = ({ title, subtitle, action, className = '' }) => (
  <div
    className={`lp-reveal-d flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between ${className}`}
  >
    <div className="min-w-0">
      <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

/* -------------------------------------------------------------------------- */
/* SectionCard — titled content section with an icon.                         */
/* -------------------------------------------------------------------------- */

export const SectionCard = ({ icon: Icon, title, action, children, className = '' }) => (
  <section className={`rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 ${className}`}>
    {(title || action) && (
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          {Icon && <Icon className="h-4 w-4 text-blue-600" />}
          {title}
        </h3>
        {action}
      </div>
    )}
    {children}
  </section>
);

/* -------------------------------------------------------------------------- */
/* InfoField — label + value pair for detail grids.                           */
/* -------------------------------------------------------------------------- */

export const InfoField = ({ label, value, valueClass = 'text-slate-900', mono = false }) => (
  <div className="space-y-1">
    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
    <p className={`text-sm font-semibold ${mono ? 'font-mono' : ''} ${valueClass}`}>
      {value ?? 'N/A'}
    </p>
  </div>
);

export const DetailGrid = ({ children, cols = 3, className = '' }) => {
  const colClass =
    cols === 2 ? 'sm:grid-cols-2' : cols === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3';
  return (
    <div className={`grid grid-cols-1 gap-x-6 gap-y-4 ${colClass} ${className}`}>{children}</div>
  );
};

/* -------------------------------------------------------------------------- */
/* StatusBadge — unified status treatment across all customer pages.          */
/* -------------------------------------------------------------------------- */

const STATUS_MAP = {
  // Applications
  SUBMITTED: { cls: 'bg-blue-50 text-blue-700 border-blue-200', Icon: Clock, label: 'Submitted' },
  UNDER_REVIEW: { cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Clock, label: 'Under review' },
  APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2, label: 'Approved' },
  REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', Icon: XCircle, label: 'Rejected' },
  // Policies
  ACTIVE: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2, label: 'Active' },
  EXPIRED: { cls: 'bg-slate-100 text-slate-600 border-slate-200', Icon: Clock, label: 'Expired' },
  CANCELLED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', Icon: XCircle, label: 'Cancelled' },
  // Queries
  OPEN: { cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Clock, label: 'Open' },
  RESPONDED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: MessageCircle, label: 'Responded' },
  CLOSED: { cls: 'bg-slate-100 text-slate-600 border-slate-200', Icon: CheckCircle2, label: 'Closed' },
  // Plans (insurer-managed)
  DRAFT: { cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: FileEdit, label: 'Draft' },
  INACTIVE: { cls: 'bg-slate-100 text-slate-600 border-slate-200', Icon: CircleSlash, label: 'Inactive' },
};

export const StatusBadge = ({ status, size = 'sm' }) => {
  const s = STATUS_MAP[status] || {
    cls: 'bg-slate-100 text-slate-600 border-slate-200',
    Icon: Clock,
    label: status,
  };
  const { Icon } = s;
  const pad = size === 'lg' ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-[11px]';
  const ic = size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${pad} ${s.cls}`}>
      <Icon className={ic} /> {s.label}
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/* EmptyState — consistent illustrationless empty block with optional CTA.    */
/* -------------------------------------------------------------------------- */

export const EmptyState = ({ icon: Icon, title, description, ctaLabel, ctaTo, ctaOnClick }) => (
  <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
      {Icon && <Icon className="h-7 w-7" />}
    </span>
    <div className="space-y-1">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mx-auto max-w-sm text-xs text-slate-500">{description}</p>}
    </div>
    {ctaLabel && ctaTo && (
      <Link
        to={ctaTo}
        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 cursor-pointer"
      >
        {ctaLabel} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    )}
    {ctaLabel && ctaOnClick && !ctaTo && (
      <button
        onClick={ctaOnClick}
        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 cursor-pointer"
      >
        {ctaLabel} <ArrowRight className="h-3.5 w-3.5" />
      </button>
    )}
  </div>
);

/* -------------------------------------------------------------------------- */
/* ErrorState — calm, non-alarming error block with optional retry.           */
/* -------------------------------------------------------------------------- */

export const ErrorState = ({ icon: Icon, title, description, onRetry, retryLabel = 'Retry' }) => (
  <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-10 text-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
      {Icon && <Icon className="h-6 w-6" />}
    </span>
    <div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 cursor-pointer"
      >
        {retryLabel}
      </button>
    )}
  </div>
);

/* -------------------------------------------------------------------------- */
/* PrimaryButton / SecondaryButton — consistent button styling.               */
/* -------------------------------------------------------------------------- */

export const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

export const darkBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

export const subtleBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 cursor-pointer';
