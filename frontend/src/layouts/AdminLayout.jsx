import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, LogOut, ShieldCheck, Users, FileCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/common/NotificationBell';
import { BrandMark } from '../components/ui/BrandLogo';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/insurers', label: 'Insurer Verification', icon: Building2 },
  { to: '/admin/customers', label: 'Manage Customers', icon: Users },
  { to: '/admin/claims', label: 'Claims Visibility', icon: FileCheck },
];

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (item) =>
    item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 md:h-screen md:flex-row md:overflow-hidden">
      {/* Sidebar — fixed full-height control-center shell on desktop */}
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

        {/* Workspace label — distinguishes admin shell */}
        <div className="hidden border-b border-slate-800 px-5 py-3 md:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Control Center
          </p>
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
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-5 py-3.5 backdrop-blur-md sm:px-8">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Admin Workspace</p>
            <h1 className="truncate text-base font-semibold text-slate-900">
              {user?.full_name || 'Platform Administrator'}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5" />
              Administrator
            </span>
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-5 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
