import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl border px-4 py-2.5 backdrop-blur-md transition-all duration-300 sm:px-6 ${
          scrolled
            ? 'border-slate-200/80 bg-white/85 shadow-[0_8px_30px_-12px_rgba(11,31,51,0.25)]'
            : 'border-white/60 bg-white/55 shadow-[0_2px_12px_-6px_rgba(11,31,51,0.15)]'
        }`}
      >
        <Link to="/" className="flex items-center" aria-label="InsurManage home">
          <BrandLogo variant="light" markClassName="h-7 w-7 sm:h-8 sm:w-8" />
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <Link
            to="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:text-[var(--lp-blue,#0369a1)] sm:px-4"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-[var(--lp-blue,#0369a1)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#025687]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
