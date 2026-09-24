import React from 'react';
import { Search } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* Insurer workspace shared UI — denser, operational presentation that still  */
/* speaks the InsurManage visual language (slate/blue/sky).                   */
/* Formatting helpers, StatusBadge, EmptyState, ErrorState etc. are reused    */
/* from components/customer/ui to keep ONE product design system.             */
/* -------------------------------------------------------------------------- */

/* WorkspaceHeader — compact page title block with an optional toolbar area. */
export const WorkspaceHeader = ({ title, subtitle, children, className = '' }) => (
  <div
    className={`lp-reveal-d flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between ${className}`}
  >
    <div className="min-w-0">
      <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
    {children && <div className="flex w-full shrink-0 flex-col gap-2.5 sm:flex-row sm:items-center lg:w-auto">{children}</div>}
  </div>
);

/* SearchInput — consistent search field with leading icon. */
export const SearchInput = ({ value, onChange, placeholder = 'Search…', className = '' }) => (
  <div className={`relative w-full sm:w-64 ${className}`}>
    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

/* FilterSelect — native dropdown filter styled to match. */
export const FilterSelect = ({ value, onChange, options, className = '' }) => (
  <select
    value={value}
    onChange={onChange}
    className={`cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-800 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

/* FilterTabs — segmented status filter for denser toolbars. */
export const FilterTabs = ({ value, onChange, options }) => (
  <div className="flex items-center gap-1.5 overflow-x-auto">
    {options.map((o) => (
      <button
        key={o.value}
        onClick={() => onChange(o.value)}
        className={`shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
          value === o.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

/* TableCard — white rounded shell with a horizontally scrollable table. */
export const TableCard = ({ children, className = '' }) => (
  <div className={`lp-reveal-d overflow-hidden rounded-2xl border border-slate-200 bg-white ${className}`}>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">{children}</table>
    </div>
  </div>
);

/* Th — consistent table header cell. */
export const Th = ({ children, className = '' }) => (
  <th className={`whitespace-nowrap px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${className}`}>
    {children}
  </th>
);

/* TableHead — themed thead wrapper. */
export const TableHead = ({ children }) => (
  <thead className="border-b border-slate-200 bg-slate-50/80">{children}</thead>
);
