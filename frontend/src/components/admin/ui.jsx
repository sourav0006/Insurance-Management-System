import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, PauseCircle } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* Admin control-center shared UI. Speaks the InsurManage visual language     */
/* (slate/blue/sky/emerald/amber/rose). Formatting helpers, SectionCard,      */
/* InfoField, EmptyState, ErrorState etc. are reused from components/customer  */
/* to keep ONE product design system. This file only adds the pieces unique   */
/* to the admin surface: the verification status badge, KPI stat cards, and   */
/* the lightweight SVG donut chart (no chart dependency).                     */
/* -------------------------------------------------------------------------- */

/* AdminStatusBadge — insurer verification lifecycle (PENDING/APPROVED/
   REJECTED/SUSPENDED). Amber=pending, emerald=approved, rose=rejected,
   neutral=suspended. */
const VERIFICATION_MAP = {
  PENDING: { cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Clock, label: 'Pending' },
  APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2, label: 'Approved' },
  REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', Icon: XCircle, label: 'Rejected' },
  SUSPENDED: { cls: 'bg-slate-100 text-slate-600 border-slate-200', Icon: PauseCircle, label: 'Suspended' },
};

export const AdminStatusBadge = ({ status, size = 'sm' }) => {
  const s = VERIFICATION_MAP[status] || {
    cls: 'bg-slate-100 text-slate-600 border-slate-200',
    Icon: Clock,
    label: status,
  };
  const { Icon } = s;
  const pad = size === 'lg' ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-[11px]';
  const ic = size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border font-semibold ${pad} ${s.cls}`}>
      <Icon className={ic} /> {s.label}
    </span>
  );
};

/* Semantic colours for the verification donut segments — kept in sync with
   the badge palette so chart and table read as one system. */
export const VERIFICATION_COLORS = {
  PENDING: '#f59e0b', // amber-500
  APPROVED: '#10b981', // emerald-500
  REJECTED: '#f43f5e', // rose-500
  SUSPENDED: '#94a3b8', // slate-400
};

export const VERIFICATION_ORDER = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

export const VERIFICATION_LABELS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  SUSPENDED: 'Suspended',
};

const ACCENT_CLS = {
  blue: 'bg-blue-50 text-blue-600',
  sky: 'bg-sky-50 text-sky-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  slate: 'bg-slate-100 text-slate-600',
};

/* AdminStatCard — KPI tile: label, value, icon, optional description + accent.
   Renders as a Link when `to` is supplied (adds hover affordance + cursor). */
export const AdminStatCard = ({
  label, value, icon: Icon, description, accent = 'blue', to, actionRequired = false,
}) => {
  const iconCls = ACCENT_CLS[accent] || ACCENT_CLS.blue;
  const interactive = Boolean(to);
  const base =
    'group flex flex-col justify-between rounded-2xl border bg-white p-5 transition-all';
  const borderCls = actionRequired
    ? 'border-amber-200 hover:border-amber-300'
    : 'border-slate-200 hover:border-slate-300';
  const hoverLift = interactive ? 'hover:shadow-[0_10px_30px_-18px_rgba(15,23,42,0.4)] cursor-pointer' : '';

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconCls}`}>
          {Icon && <Icon className="h-5 w-5" />}
        </span>
      </div>
      <div className="mt-5 flex items-end justify-between gap-2">
        <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        {actionRequired ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
            Action required
          </span>
        ) : description ? (
          <span className="pb-1 text-[11px] text-slate-500">{description}</span>
        ) : null}
      </div>
    </>
  );

  if (interactive) {
    return (
      <Link to={to} className={`${base} ${borderCls} ${hoverLift}`}>
        {inner}
      </Link>
    );
  }
  return <div className={`${base} ${borderCls}`}>{inner}</div>;
};

/* AdminChartCard — titled white panel used to frame charts + panels. */
export const AdminChartCard = ({ icon: Icon, title, subtitle, action, children, className = '' }) => (
  <section className={`rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 ${className}`}>
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          {Icon && <Icon className="h-4 w-4 text-blue-600" />}
          {title}
        </h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

/* DonutChart — dependency-free SVG donut driven by stroke-dasharray.
   `data` = [{ key, label, value, color }]. Renders a centred total + accessible
   title. Empty/zero data shows a neutral ring so the panel never looks broken. */
export const DonutChart = ({ data = [], size = 168, thickness = 22, centerLabel = 'Total' }) => {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;
  const segments = total
    ? data
        .filter((d) => d.value > 0)
        .map((d) => {
          const fraction = d.value / total;
          const dash = fraction * circumference;
          const seg = {
            key: d.key,
            color: d.color,
            dasharray: `${dash} ${circumference - dash}`,
            dashoffset: -offset,
          };
          offset += dash;
          return seg;
        })
    : [];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${centerLabel}: ${total}`}>
      {/* track */}
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={thickness} />
      {segments.map((s) => (
        <circle
          key={s.key}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={s.color}
          strokeWidth={thickness}
          strokeDasharray={s.dasharray}
          strokeDashoffset={s.dashoffset}
          strokeLinecap="butt"
          transform={`rotate(-90 ${cx} ${cy})`}
        >
          <title>{s.key}</title>
        </circle>
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" className="fill-slate-900" style={{ fontSize: 26, fontWeight: 700 }}>
        {total}
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em' }}>
        {centerLabel.toUpperCase()}
      </text>
    </svg>
  );
};
