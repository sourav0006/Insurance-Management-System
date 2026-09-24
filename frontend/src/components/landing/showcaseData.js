/**
 * Presentation-only demo data for the homepage.
 * NOT live platform data or statistics — used purely to visually communicate
 * the real marketplace experience. Field shapes mirror the actual
 * /marketplace/plans response (see services/api.js & MarketplacePage.jsx):
 *   plan_name, plan_code, category, company_name, coverage_amount,
 *   premium_amount, premium_frequency, policy_term_years.
 * Categories & frequencies match the real filters in MarketplacePage.jsx.
 */
export const SHOWCASE_PLANS = [
  {
    id: 'demo-1',
    plan_name: 'SecureHealth Family Shield',
    plan_code: 'HLT-2048',
    category: 'Health Insurance',
    company_name: 'Meridian Assurance',
    coverage_amount: 1000000,
    premium_amount: 1499,
    premium_frequency: 'Monthly',
    policy_term_years: 3,
  },
  {
    id: 'demo-2',
    plan_name: 'LifeGuard Term Protect',
    plan_code: 'LIF-3120',
    category: 'Life Insurance',
    company_name: 'Northwind Mutual',
    coverage_amount: 5000000,
    premium_amount: 8200,
    premium_frequency: 'Yearly',
    policy_term_years: 20,
  },
  {
    id: 'demo-3',
    plan_name: 'DriveSafe Comprehensive',
    plan_code: 'VEH-7756',
    category: 'Vehicle Insurance',
    company_name: 'Apex Cover',
    coverage_amount: 750000,
    premium_amount: 3600,
    premium_frequency: 'Quarterly',
    policy_term_years: 1,
  },
  {
    id: 'demo-4',
    plan_name: 'Voyager Travel Care',
    plan_code: 'TRV-1902',
    category: 'Travel Insurance',
    company_name: 'Solace Insurance',
    coverage_amount: 300000,
    premium_amount: 999,
    premium_frequency: 'Monthly',
    policy_term_years: 1,
  },
];

export const CATEGORIES = [
  'Health Insurance',
  'Life Insurance',
  'Vehicle Insurance',
  'Travel Insurance',
];

export const formatINR = (val) => {
  if (val === null || val === undefined) return 'N/A';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};
