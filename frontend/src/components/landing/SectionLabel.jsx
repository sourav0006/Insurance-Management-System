import React from 'react';

/** Small editorial eyebrow label used to open each section. */
export const SectionLabel = ({ children, tone = 'light' }) => (
  <span
    className={`lp-eyebrow inline-flex items-center gap-2 ${
      tone === 'dark' ? 'text-[var(--lp-blue-bright)]' : 'text-[var(--lp-blue)]'
    }`}
  >
    <span
      className={`h-px w-6 ${tone === 'dark' ? 'bg-[var(--lp-blue-bright)]' : 'bg-[var(--lp-blue)]'}`}
    />
    {children}
  </span>
);

export default SectionLabel;
