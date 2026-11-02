import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Kanban, User, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const validateForm = () => {
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
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validateForm()) return;

    setIsSubmitting(true);
    const result = await register(name.trim(), email.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      success('Account created successfully!');
      navigate('/projects');
    } else {
      setFormError(result.message || 'Registration failed');
      if (result.errors && Array.isArray(result.errors)) {
        const mappedErrors = {};
        result.errors.forEach((err) => {
          if (err.field) mappedErrors[err.field] = err.message;
        });
        setFieldErrors(mappedErrors);
      }
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-xl shadow-indigo-600/25 mb-4">
            <Kanban className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Join TeamFlow to collaborate on projects and tasks
          </p>
        </div>

        {/* Card Form */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/70 dark:border-slate-800 p-6 sm:p-8 backdrop-blur-sm">
          {formError && (
            <div
              className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-sm font-medium animate-in fade-in"
              role="alert"
            >
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }));
                  }}
                  placeholder="Alex Rivera"
                  autoComplete="name"
                  className={`w-full pl-11 pr-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/60 border ${
                    fieldErrors.name
                      ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'
                  } focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white transition`}
                />
              </div>
              {fieldErrors.name && (
                <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
                  }}
                  placeholder="alex@university.edu"
                  autoComplete="email"
                  className={`w-full pl-11 pr-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/60 border ${
                    fieldErrors.email
                      ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'
                  } focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white transition`}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2"
              >
                Password (min. 8 characters)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password)
                      setFieldErrors((prev) => ({ ...prev, password: null }));
                  }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full pl-11 pr-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/60 border ${
                    fieldErrors.password
                      ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'
                  } focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white transition`}
                />
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <footer className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition"
            >
              Sign in
            </Link>
          </footer>
        </section>
      </div>
    </main>
  );
};

export default RegisterPage;
