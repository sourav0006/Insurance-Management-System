import React from 'react';

/**
 * InsurManage brand mark.
 * Geometric protection silhouette (shield built from an angular top facet +
 * two curved side facets) with a person figure carved out of the negative
 * space. Single-colour, uses `currentColor` so it adapts to any background.
 * Scales cleanly from favicon size up to hero size.
 */
export const BrandMark = ({ className = 'h-8 w-8', title = 'InsurManage' }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    role="img"
    aria-label={title}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* fillRule=evenodd carves the person + leaf slit out of the shield body */}
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="
        M50 6
        L88 20
        C90.2 20.8 91.5 22.9 91.3 25.2
        C89.7 47 82.9 78 53.2 93.4
        C51.2 94.4 48.8 94.4 46.8 93.4
        C17.1 78 10.3 47 8.7 25.2
        C8.5 22.9 9.8 20.8 12 20
        L50 6
        Z

        M50 20.5
        L22.5 30.6
        C21.4 31 20.7 32.1 20.8 33.3
        C22.2 51.6 27.8 74.2 50 87.5
        C72.2 74.2 77.8 51.6 79.2 33.3
        C79.3 32.1 78.6 31 77.5 30.6
        L50 20.5
        Z
      "
    />
    {/* person: head + rising body, sits in the shield window */}
    <circle cx="50" cy="40" r="7" />
    <path
      d="
        M50 51
        C56 51 61 55.5 62.5 61.8
        L54.5 66
        C53.9 63.2 52.1 61.4 50 61.4
        C47.9 61.4 46.1 63.2 45.5 66
        C46.6 69 48 72.8 50 77
        C48.6 79.8 46.4 82.6 43.4 85
        C39.5 78 37.6 70.2 37.5 62.4
        C37.5 55.7 43 51 50 51
        Z
      "
    />
  </svg>
);

/**
 * Full lockup: brand mark + "InsurManage" wordmark.
 * `variant` controls colours for light vs dark backgrounds.
 */
export const BrandLogo = ({ variant = 'light', className = '', markClassName = 'h-8 w-8' }) => {
  const inkClass = variant === 'dark' ? 'text-white' : 'text-[var(--lp-ink,#0b1f33)]';
  const accentClass = variant === 'dark' ? 'text-sky-400' : 'text-[var(--lp-blue,#0369a1)]';

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className={accentClass}>
        <BrandMark className={markClassName} />
      </span>
      <span className={`text-xl font-semibold tracking-tight ${inkClass}`} style={{ fontFamily: "'IBM Plex Sans', 'Inter', sans-serif" }}>
        Insur<span className={accentClass}>Manage</span>
      </span>
    </span>
  );
};

export default BrandLogo;
