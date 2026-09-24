import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Building2,
  Mail,
  Lock,
  Phone,
  Calendar,
  MapPin,
  Building,
  FileText,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Upload,
  CheckCircle2
} from 'lucide-react';
import api from '../../services/api';

export const RegisterPage = () => {
  // STRICT RULE: Only 'customer' or 'insurer' allowed. Admin registration is PROHIBITED.
  const [role, setRole] = useState('customer'); // customer | insurer
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const navigate = useNavigate();

  // Customer Form State
  const [customerData, setCustomerData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    nominee_name: '',
    nominee_relationship: '',
    nominee_phone: ''
  });

  // Insurer Form State
  const [insurerData, setInsurerData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    company_name: '',
    license_number: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  // Password validation helper
  const validatePasswordStrength = (pwd) => {
    if (pwd.length < 8) return "Password must be at least 8 characters long";
    if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(pwd)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(pwd)) return "Password must contain at least one number";
    return null;
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    const errors = {};
    if (!customerData.full_name.trim()) errors.full_name = "Full name is required";
    if (!customerData.email.trim()) errors.email = "Email is required";
    
    const pwdErr = validatePasswordStrength(customerData.password);
    if (pwdErr) errors.password = pwdErr;

    if (customerData.password !== customerData.confirm_password) {
      errors.confirm_password = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...customerData,
        date_of_birth: customerData.date_of_birth || null
      };

      const response = await api.post('/auth/register/customer', payload);

      navigate('/login', {
        state: {
          message: response.data.message || "Customer account created successfully. Please sign in."
        }
      });
    } catch (err) {
      console.error("Customer registration error:", err);
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          setErrorMsg(err.response.data.detail);
        } else if (Array.isArray(err.response.data.detail)) {
          // Pydantic validation errors array
          setErrorMsg(err.response.data.detail[0]?.msg || "Invalid input parameters.");
        }
      } else {
        setErrorMsg("Registration failed. Please check your internet connection or try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleInsurerSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    const errors = {};
    if (!insurerData.full_name.trim()) errors.full_name = "Contact representative name is required";
    if (!insurerData.email.trim()) errors.email = "Email is required";
    if (!insurerData.company_name.trim()) errors.company_name = "Company name is required";
    if (!insurerData.license_number.trim()) errors.license_number = "License number is required";

    const pwdErr = validatePasswordStrength(insurerData.password);
    if (pwdErr) errors.password = pwdErr;

    if (insurerData.password !== insurerData.confirm_password) {
      errors.confirm_password = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/auth/register/insurer', insurerData);

      navigate('/login', {
        state: {
          message: response.data.message || "Insurer registration submitted successfully. Your account is pending admin verification."
        }
      });
    } catch (err) {
      console.error("Insurer registration error:", err);
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          setErrorMsg(err.response.data.detail);
        } else if (Array.isArray(err.response.data.detail)) {
          setErrorMsg(err.response.data.detail[0]?.msg || "Invalid input parameters.");
        }
      } else {
        setErrorMsg("Registration failed. Please check your network connection.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create Your Account</h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Choose your account role below to get started with InsurManage
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Registration Error</p>
              <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Role Selection Tabs - STRICTLY CUSTOMER & INSURER ONLY */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              setRole('customer');
              setErrorMsg(null);
              setFieldErrors({});
            }}
            className={`p-4 border rounded-xl flex items-center justify-center gap-3 transition-all ${
              role === 'customer'
                ? 'border-blue-600 bg-blue-50/60 text-blue-700 ring-2 ring-blue-500/20 font-bold shadow-xs'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <User className="h-5 w-5 text-blue-600" />
            <span className="text-sm">Customer Account</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole('insurer');
              setErrorMsg(null);
              setFieldErrors({});
            }}
            className={`p-4 border rounded-xl flex items-center justify-center gap-3 transition-all ${
              role === 'insurer'
                ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700 ring-2 ring-indigo-500/20 font-bold shadow-xs'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Building2 className="h-5 w-5 text-indigo-600" />
            <span className="text-sm">Insurer Vendor Account</span>
          </button>
        </div>

        {/* Form Container */}
        {role === 'customer' ? (
          /* ================= CUSTOMER REGISTRATION FORM ================= */
          <form onSubmit={handleCustomerSubmit} className="space-y-6">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" /> Account Credentials
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerData.full_name}
                  onChange={(e) => setCustomerData({ ...customerData, full_name: e.target.value })}
                  placeholder="Jane Doe"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {fieldErrors.full_name && <p className="text-xs text-red-500 mt-1">{fieldErrors.full_name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={customerData.email}
                  onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                  placeholder="jane@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={customerData.password}
                    onChange={(e) => setCustomerData({ ...customerData, password: e.target.value })}
                    placeholder="Min 8 chars (1 upper, 1 lower, 1 number)"
                    className="w-full pr-10 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={customerData.confirm_password}
                  onChange={(e) => setCustomerData({ ...customerData, confirm_password: e.target.value })}
                  placeholder="Repeat password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {fieldErrors.confirm_password && <p className="text-xs text-red-500 mt-1">{fieldErrors.confirm_password}</p>}
              </div>
            </div>

            {/* Personal Info */}
            <div className="border-b border-slate-200 pb-2 pt-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" /> Personal Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={customerData.date_of_birth}
                  onChange={(e) => setCustomerData({ ...customerData, date_of_birth: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={customerData.gender}
                  onChange={(e) => setCustomerData({ ...customerData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div className="border-b border-slate-200 pb-2 pt-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" /> Residence & Nominee
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={customerData.city}
                  onChange={(e) => setCustomerData({ ...customerData, city: e.target.value })}
                  placeholder="Mumbai"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={customerData.state}
                  onChange={(e) => setCustomerData({ ...customerData, state: e.target.value })}
                  placeholder="Maharashtra"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={customerData.pincode}
                  onChange={(e) => setCustomerData({ ...customerData, pincode: e.target.value })}
                  placeholder="400001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nominee Name</label>
                <input
                  type="text"
                  value={customerData.nominee_name}
                  onChange={(e) => setCustomerData({ ...customerData, nominee_name: e.target.value })}
                  placeholder="Full Name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nominee Relationship</label>
                <input
                  type="text"
                  value={customerData.nominee_relationship}
                  onChange={(e) => setCustomerData({ ...customerData, nominee_relationship: e.target.value })}
                  placeholder="Spouse / Parent"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nominee Phone</label>
                <input
                  type="tel"
                  value={customerData.nominee_phone}
                  onChange={(e) => setCustomerData({ ...customerData, nominee_phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? 'Creating Customer Account...' : 'Complete Customer Registration'} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        ) : (
          /* ================= INSURER REGISTRATION FORM ================= */
          <form onSubmit={handleInsurerSubmit} className="space-y-6">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-600" /> Representative Account Credentials
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Representative Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={insurerData.full_name}
                  onChange={(e) => setInsurerData({ ...insurerData, full_name: e.target.value })}
                  placeholder="Contact Person Name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {fieldErrors.full_name && <p className="text-xs text-red-500 mt-1">{fieldErrors.full_name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Login Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={insurerData.email}
                  onChange={(e) => setInsurerData({ ...insurerData, email: e.target.value })}
                  placeholder="rep@insurercompany.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={insurerData.password}
                    onChange={(e) => setInsurerData({ ...insurerData, password: e.target.value })}
                    placeholder="Min 8 chars (1 upper, 1 lower, 1 number)"
                    className="w-full pr-10 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={insurerData.confirm_password}
                  onChange={(e) => setInsurerData({ ...insurerData, confirm_password: e.target.value })}
                  placeholder="Repeat password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {fieldErrors.confirm_password && <p className="text-xs text-red-500 mt-1">{fieldErrors.confirm_password}</p>}
              </div>
            </div>

            {/* Company Info */}
            <div className="border-b border-slate-200 pb-2 pt-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building className="h-4 w-4 text-indigo-600" /> Insurance Vendor Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={insurerData.company_name}
                  onChange={(e) => setInsurerData({ ...insurerData, company_name: e.target.value })}
                  placeholder="Acme Insurance Ltd."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {fieldErrors.company_name && <p className="text-xs text-red-500 mt-1">{fieldErrors.company_name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  License Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={insurerData.license_number}
                  onChange={(e) => setInsurerData({ ...insurerData, license_number: e.target.value })}
                  placeholder="LIC-1234-5678"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {fieldErrors.license_number && <p className="text-xs text-red-500 mt-1">{fieldErrors.license_number}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Description</label>
              <textarea
                rows={2}
                value={insurerData.description}
                onChange={(e) => setInsurerData({ ...insurerData, description: e.target.value })}
                placeholder="Brief summary of insurance services offered..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={insurerData.city}
                  onChange={(e) => setInsurerData({ ...insurerData, city: e.target.value })}
                  placeholder="New Delhi"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={insurerData.state}
                  onChange={(e) => setInsurerData({ ...insurerData, state: e.target.value })}
                  placeholder="Delhi"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={insurerData.pincode}
                  onChange={(e) => setInsurerData({ ...insurerData, pincode: e.target.value })}
                  placeholder="110001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? 'Submitting Registration...' : 'Submit Insurer Registration (Pending Verification)'} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Sign In to your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
