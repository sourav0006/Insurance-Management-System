/**
 * Presentation-only data for the homepage marketplace preview.
 * This is illustrative UI content — NOT live platform statistics or claims.
 * Field shapes mirror the real /marketplace/plans response so the preview
 * looks like the actual product (category, coverage, premium, frequency, term).
 */

export const formatINR = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);

export const demoPlans = [
  {
    id: 'demo-health',
    category: 'Health Insurance',
    plan_code: 'HLT-1042',
    plan_name: 'Secure Health Advantage',
    company_name: 'Meridian Assurance',
    coverage_amount: 1500000,
    premium_amount: 1499,
    premium_frequency: 'Monthly',
    policy_term_years: 3,
    eligibility_min_age: 18,
    eligibility_max_age: 65,
  },
  {
    id: 'demo-life',
    category: 'Life Insurance',
    plan_code: 'LIF-0771',
    plan_name: 'Legacy Term Protect',
    company_name: 'Northwind Life',
    coverage_amount: 10000000,
    premium_amount: 8200,
    premium_frequency: 'Yearly',
    policy_term_years: 20,
    eligibility_min_age: 21,
    eligibility_max_age: 60,
  },
  {
    id: 'demo-vehicle',
    category: 'Vehicle Insurance',
    plan_code: 'VEH-2318',
    plan_name: 'DriveShield Comprehensive',
    company_name: 'Apex General',
    coverage_amount: 800000,
    premium_amount: 3200,
    premium_frequency: 'Quarterly',
    policy_term_years: 1,
    eligibility_min_age: 18,
    eligibility_max_age: 75,
  },
  {
    id: 'demo-travel',
    category: 'Travel Insurance',
    plan_code: 'TRV-5590',
    plan_name: 'Voyager Global Cover',
    company_name: 'Meridian Assurance',
    coverage_amount: 2500000,
    premium_amount: 999,
    premium_frequency: 'Monthly',
    policy_term_years: 1,
    eligibility_min_age: 1,
    eligibility_max_age: 80,
  },
];

/* The four real marketplace categories, for the discovery section. */
export const categories = [
  { label: 'Health Insurance', code: 'HLT', blurb: 'Hospitalisation, treatment and medical coverage.' },
  { label: 'Life Insurance', code: 'LIF', blurb: 'Long-term protection and term cover for dependents.' },
  { label: 'Vehicle Insurance', code: 'VEH', blurb: 'Comprehensive and third-party motor protection.' },
  { label: 'Travel Insurance', code: 'TRV', blurb: 'Trip, baggage and medical cover while abroad.' },
];
