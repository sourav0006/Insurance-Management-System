import React, { useEffect, useRef, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Store, FileText, ShieldCheck, MessageSquare, ChevronDown, UserRound, Mail, FileCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/common/NotificationBell';
import { BrandMark } from '../components/ui/BrandLogo';

const navItems = [
  { to: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/customer/marketplace', label: 'Marketplace', icon: Store },
  { to: '/customer/applications', label: 'My Applications', icon: FileText },
  { to: '/customer/policies', label: 'My Policies', icon: ShieldCheck },
  { to: '/customer/claims', label: 'My Claims', icon: FileCheck },
  { to: '/customer/queries', label: 'Queries', icon: MessageSquare },
];

export const CustomerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (item) =>
    item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);

  const initials = (user?.full_name || 'Customer')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 md:h-screen md:flex-row md:overflow-hidden">
      {/* Sidebar — fixed full-height shell on desktop, stacked bar on mobile */}
      <aside className="flex w-full shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-300 md:h-screen md:w-64">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-5">
          <Link to="/" className="flex items-center" aria-label="InsurManage home">
            <span className="inline-flex items-center gap-2.5">
              <span className="text-sky-400">
                <BrandMark className="h-7 w-7" />
              </span>
              <span
                className="text-lg font-semibold tracking-tight text-white"
                style={{ fontFamily: "'IBM Plex Sans', 'Inter', sans-serif" }}
              >
                Insur<span className="text-sky-400">Manage</span>
              </span>
            </span>
          </Link>
        </div>

        <nav className="flex flex-row gap-1 overflow-x-auto p-3 md:flex-1 md:flex-col md:gap-1 md:overflow-visible md:p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-blue-600 text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.8)]'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 hidden h-5 w-1 -translate-y-1/2 rounded-r-full bg-sky-300 md:block" />
                )}
                <Icon className={`h-4 w-4 shrink-0 transition-colors ${active ? 'text-white' : 'text-slate-500 group-hover:text-sky-400'}`} />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden border-t border-slate-800 p-4 md:block">
          <button
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-rose-400"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content — independently scrollable application shell */}
      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-hidden">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-5 py-3.5 backdrop-blur-md sm:px-8">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Customer workspace</p>
            <h1 className="truncate text-base font-semibold text-slate-900">
              {user?.full_name || 'Customer'}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />

            {/* Account menu — entry point for the future profile/account area */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-2.5 transition-colors hover:border-slate-300 hover:bg-slate-100 sm:pr-3"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white">
                  {initials}
                </span>
                <span className="hidden text-xs font-medium text-slate-600 sm:inline">Account</span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
                >
                  <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 p-3.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{user?.full_name || 'Customer'}</p>
                      <p className="flex items-center gap-1 truncate text-[11px] text-slate-500">
                        <Mail className="h-3 w-3 shrink-0" /> {user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="p-1.5">
                    <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-400">
                      <UserRound className="h-4 w-4" />
                      <span>Profile &amp; account</span>
                      <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Soon
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-5 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CustomerLayout;
