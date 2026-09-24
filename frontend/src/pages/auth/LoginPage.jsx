import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const successBanner = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);

      // Automatic Role-Based Dashboard Navigation
      if (user.role === 'CUSTOMER') {
        navigate('/customer/dashboard');
      } else if (user.role === 'INSURER') {
        navigate('/insurer/dashboard');
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error("Login failed:", err);
      if (err.response?.data?.detail) {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg("Login failed. Please check your credentials or network connection.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-2xl mb-2">
            <LogIn className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Portal Sign In</h2>
          <p className="text-sm text-slate-600">
            Sign in with your registered email and password
          </p>
        </div>

        {/* Post Registration Success Notification */}
        {successBanner && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Clean Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 text-white text-sm font-bold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? 'Authenticating...' : 'Sign In to Portal'} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="text-center pt-4 border-t border-slate-100 space-y-2">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
              Register Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
