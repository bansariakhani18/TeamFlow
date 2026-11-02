import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BrandLogo from '../components/BrandLogo';
import AuthHeroIllustration from '../components/AuthHeroIllustration';
import { User, Mail, Lock, Loader2 } from 'lucide-react';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { register } = useAuth();
  const { success } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errors = {};
    if (!name.trim()) {
      errors.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (name.trim().length > 60) {
      errors.name = 'Name cannot exceed 60 characters';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please provide a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    const result = await register(name.trim(), email.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      success('Account created successfully!');
      navigate('/projects');
    } else {
      setError(result.message || 'Registration failed');
      if (result.errors && Array.isArray(result.errors)) {
        const mapped = {};
        result.errors.forEach((err) => {
          if (err.field) mapped[err.field] = err.message;
        });
        setFieldErrors(mapped);
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#F4F3EF] flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans selection:bg-[#E8F2EC] selection:text-[#2D5A40]">
      {/* Master Shell Container */}
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-stone-200/80 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        
        {/* ======================================================== */}
        {/* LEFT HERO HALF (FLUSH PHOTO WITH TYPOGRAPHY OVERLAY)     */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 relative flex flex-col justify-end overflow-hidden min-h-[320px] lg:min-h-full">
          <AuthHeroIllustration />
        </div>

        {/* ======================================================== */}
        {/* RIGHT FORM HALF (CLEAN INTEGRATED AUTH FORM)             */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 p-8 lg:p-12 flex flex-col justify-center bg-white">
          
          {/* Top Branding Bar */}
          <div className="flex items-center justify-between pb-6 border-b border-stone-200/70 mb-5">
            <BrandLogo className="h-8 w-8" />

            <div className="inline-flex p-1 bg-stone-100 rounded-xl border border-stone-200/60">
              <Link
                to="/login"
                className="px-3.5 py-1 rounded-lg text-xs font-semibold text-stone-500 hover:text-stone-800 transition"
              >
                Sign In
              </Link>
              <span className="px-3.5 py-1 rounded-lg text-xs font-semibold bg-white text-[#4E8765] shadow-sm">
                Register
              </span>
            </div>
          </div>

          {/* Welcome Heading */}
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-stone-800 tracking-tight">
              Create an Account
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Start collaborating with your team on TeamFlow.
            </p>
          </div>

          {/* Server Error Alert */}
          {error && (
            <div
              className="mb-4 p-3.5 rounded-xl bg-[#FFE5D9] border border-[#FBC4B8] text-[#D97767] text-xs font-semibold"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            <div>
              <label
                htmlFor="register-name"
                className="text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1 block"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }));
                  }}
                  placeholder="Alex Rivera"
                  autoComplete="name"
                  className={`w-full pl-10 pr-4 py-2.5 bg-stone-50/80 border ${
                    fieldErrors.name
                      ? 'border-[#D97767] focus:ring-[#D97767]'
                      : 'border-stone-200 focus:ring-[#4E8765] focus:border-[#4E8765]'
                  } rounded-xl text-stone-800 text-sm focus:bg-white focus:outline-none focus:ring-2 transition-all shadow-sm`}
                />
              </div>
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-[#D97767] font-medium">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="register-email"
                className="text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1 block"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
                  }}
                  placeholder="alex@company.com"
                  autoComplete="email"
                  className={`w-full pl-10 pr-4 py-2.5 bg-stone-50/80 border ${
                    fieldErrors.email
                      ? 'border-[#D97767] focus:ring-[#D97767]'
                      : 'border-stone-200 focus:ring-[#4E8765] focus:border-[#4E8765]'
                  } rounded-xl text-stone-800 text-sm focus:bg-white focus:outline-none focus:ring-2 transition-all shadow-sm`}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-[#D97767] font-medium">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="register-password"
                className="text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1 block"
              >
                Password (min. 8 characters)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
                  }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full pl-10 pr-4 py-2.5 bg-stone-50/80 border ${
                    fieldErrors.password
                      ? 'border-[#D97767] focus:ring-[#D97767]'
                      : 'border-stone-200 focus:ring-[#4E8765] focus:border-[#4E8765]'
                  } rounded-xl text-stone-800 text-sm focus:bg-white focus:outline-none focus:ring-2 transition-all shadow-sm`}
                />
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-[#D97767] font-medium">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#4E8765] hover:bg-[#3B6B50] text-white font-semibold py-3.5 rounded-xl shadow-md transition-all duration-200 w-full text-center mt-2 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4E8765] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account →'
              )}
            </button>
          </form>

          {/* Footer Link */}
          <footer className="mt-6 pt-5 border-t border-stone-200/70 flex items-center justify-between text-xs text-stone-500">
            <span>Already have an account?</span>
            <Link
              to="/login"
              className="font-semibold text-[#4E8765] hover:underline transition"
            >
              Sign in &rarr;
            </Link>
          </footer>

        </div>

      </div>
    </main>
  );
};

export default RegisterPage;
