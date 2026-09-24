import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  X,
  ShieldCheck,
  Building2,
  ArrowUpDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Calendar,
  UserCheck,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { getMarketplacePlans } from '../../services/api';
import { useGsapContext } from '../../components/landing/useGsapContext';

export const MarketplacePage = () => {
  const navigate = useNavigate();

  // State
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reduced, setReduced] = useState(false);

  // Search & Filter State
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPremium, setMinPremium] = useState('');
  const [maxPremium, setMaxPremium] = useState('');
  const [minCoverage, setMinCoverage] = useState('');
  const [maxCoverage, setMaxCoverage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Mobile Filter Drawer Toggle
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Fetch plans callback
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        page_size: pageSize,
        sort_by: sortBy,
      };

      if (search.trim()) params.search = search.trim();
      if (category.trim()) params.category = category.trim();
      if (minPremium !== '' && !isNaN(minPremium)) params.min_premium = parseFloat(minPremium);
      if (maxPremium !== '' && !isNaN(maxPremium)) params.max_premium = parseFloat(maxPremium);
      if (minCoverage !== '' && !isNaN(minCoverage)) params.min_coverage = parseFloat(minCoverage);
      if (maxCoverage !== '' && !isNaN(maxCoverage)) params.max_coverage = parseFloat(maxCoverage);
      if (frequency.trim()) params.premium_frequency = frequency.trim();

      const data = await getMarketplacePlans(params);
      setPlans(data.items || []);
      setTotalPages(data.total_pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Marketplace fetch error:', err);
      setError('Unable to load insurance plans. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy, search, category, minPremium, maxPremium, minCoverage, maxCoverage, frequency]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  // Clear Filters
  const handleClearFilters = () => {
    setSearchInput('');
    setSearch('');
    setCategory('');
    setMinPremium('');
    setMaxPremium('');
    setMinCoverage('');
    setMaxCoverage('');
    setFrequency('');
    setSortBy('newest');
    setPage(1);
    setMobileFilterOpen(false);
  };

  const hasActiveFilters = search || category || minPremium || maxPremium || minCoverage || maxCoverage || frequency;

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // GSAP entrance — scoped, honours reduced motion, guarantees a visible end state.
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
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.07, clearProps: 'transform,opacity' }
    );
  }, [loading]);

  return (
    <div ref={scope} className="mx-auto max-w-6xl space-y-5">
      {/* Marketplace hero — compact, editorial navy panel */}
      <div className="lp-reveal-d relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.22), transparent 65%)' }}
        />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-sky-300">
            <ShieldCheck className="h-3.5 w-3.5" /> InsurManage verified marketplace
          </span>
          <h2 className="mt-4 text-2xl font-bold sm:text-3xl" style={{ letterSpacing: '-0.02em' }}>
            Find coverage that fits your needs.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Browse and compare active insurance products offered exclusively by platform-verified insurers.
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="lp-reveal-d flex flex-col items-stretch gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <form onSubmit={handleSearchSubmit} className="relative flex flex-1 items-center">
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search plan name, category, or insurer..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-24 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="absolute right-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setMobileFilterOpen((v) => !v)}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 md:hidden cursor-pointer"
        >
          <Filter className="h-4 w-4 text-blue-600" />
          Filters
          {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-blue-600" />}
        </button>
      </div>

      {/* Main layout: filters column + results */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
        {/* Filters */}
        <aside
          className={`lp-reveal-d h-fit space-y-5 rounded-2xl border border-slate-200 bg-white p-5 md:col-span-1 md:block ${
            mobileFilterOpen ? 'block' : 'hidden'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <SlidersHorizontal className="h-4 w-4 text-blue-600" /> Filters
            </h3>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Categories</option>
              <option value="Health Insurance">Health Insurance</option>
              <option value="Life Insurance">Life Insurance</option>
              <option value="Vehicle Insurance">Vehicle Insurance</option>
              <option value="Travel Insurance">Travel Insurance</option>
            </select>
          </div>

          {/* Premium Range */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Premium Range (₹)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPremium}
                onChange={(e) => {
                  setMinPremium(e.target.value);
                  setPage(1);
                }}
                min="0"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPremium}
                onChange={(e) => {
                  setMaxPremium(e.target.value);
                  setPage(1);
                }}
                min="0"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Coverage Range */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Coverage Range (₹)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minCoverage}
                onChange={(e) => {
                  setMinCoverage(e.target.value);
                  setPage(1);
                }}
                min="0"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxCoverage}
                onChange={(e) => {
                  setMaxCoverage(e.target.value);
                  setPage(1);
                }}
                min="0"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Payment Frequency */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Payment Frequency</label>
            <select
              value={frequency}
              onChange={(e) => {
                setFrequency(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">Any Frequency</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="w-full rounded-xl bg-slate-100 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </aside>

        {/* Results */}
        <div className="space-y-5 md:col-span-3">
          {/* Result header: count + sort */}
          <div className="lp-reveal-d flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">
              {loading ? (
                <span className="text-slate-400">Loading plans…</span>
              ) : (
                <>
                  <span className="font-bold text-slate-900">{total}</span> plan{total === 1 ? '' : 's'} available
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <ArrowUpDown className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="hidden font-medium sm:inline">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="premium_low">Premium: Low to High</option>
                <option value="premium_high">Premium: High to Low</option>
                <option value="coverage_low">Coverage: Low to High</option>
                <option value="coverage_high">Coverage: High to Low</option>
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && !loading && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium text-slate-500">Active filters</span>
              {search && (
                <span className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-700">
                  Search: "{search}"
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => {
                      setSearch('');
                      setSearchInput('');
                    }}
                  />
                </span>
              )}
              {category && (
                <span className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-700">
                  {category}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setCategory('')} />
                </span>
              )}
              {frequency && (
                <span className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-700">
                  {frequency}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setFrequency('')} />
                </span>
              )}
              <button
                onClick={handleClearFilters}
                className="ml-1 text-xs text-slate-500 underline underline-offset-2 transition-colors hover:text-slate-700 cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="h-5 w-24 animate-pulse rounded-full bg-slate-200/70" />
                  <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200/70" />
                  <div className="h-3.5 w-1/2 animate-pulse rounded bg-slate-200/70" />
                  <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
                  <div className="h-9 animate-pulse rounded-xl bg-slate-200/70" />
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <RefreshCw className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">{error}</h3>
                <p className="mt-1 text-xs text-slate-500">We couldn't reach the marketplace service. Please try again.</p>
              </div>
              <button
                onClick={fetchPlans}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && plans.length === 0 && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Compass className="h-7 w-7" />
              </span>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900">No plans match your search</h3>
                <p className="mx-auto max-w-sm text-xs text-slate-500">
                  Try adjusting your filters or clearing them to see all verified plans.
                </p>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 cursor-pointer"
                >
                  Clear filters <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Cards */}
          {!loading && !error && plans.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_16px_40px_-24px_rgba(11,31,51,0.5)]"
                >
                  <div className="flex-1 space-y-4 p-5">
                    {/* Category + verified insurer */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                        {plan.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                        <ShieldCheck className="h-3.5 w-3.5" /> Verified
                      </span>
                    </div>

                    {/* Plan name + insurer */}
                    <div>
                      <h3 className="line-clamp-1 text-base font-bold text-slate-900 transition-colors group-hover:text-blue-600">
                        {plan.plan_name}
                      </h3>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate font-medium text-slate-700">{plan.company_name}</span>
                      </p>
                    </div>

                    {/* Coverage + premium */}
                    <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Coverage</span>
                        <span className="font-bold text-slate-900">{formatCurrency(plan.coverage_amount)}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                        <span className="text-slate-500">Premium</span>
                        <span className="font-bold text-blue-600">
                          {formatCurrency(plan.premium_amount)}{' '}
                          <span className="text-[11px] font-normal text-slate-500">/ {plan.premium_frequency}</span>
                        </span>
                      </div>
                    </div>

                    {/* Term + eligibility */}
                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {plan.policy_term_years} Year{plan.policy_term_years > 1 ? 's' : ''} term
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {plan.eligibility_min_age || 0}–{plan.eligibility_max_age || 100} yrs
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer action */}
                  <div className="border-t border-slate-100 p-4">
                    <button
                      onClick={() => navigate(`/customer/marketplace/plans/${plan.id}`)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 cursor-pointer"
                    >
                      View details
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row">
              <div className="text-xs text-slate-500">
                Showing <span className="font-bold text-slate-800">{plans.length}</span> of{' '}
                <span className="font-bold text-slate-800">{total}</span> plans
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>
                <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-800">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;
