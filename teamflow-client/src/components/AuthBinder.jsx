import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Logo from './Logo';
import { Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';

export const AuthBinder = ({ initialMode = 'login' }) => {
  const [isFlipped, setIsFlipped] = useState(initialMode === 'register');
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { success } = useToast();

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginFieldErrors, setLoginFieldErrors] = useState({});
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFieldErrors, setRegFieldErrors] = useState({});
  const [regError, setRegError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Toggle Flip Handler
  const toggleFlip = (targetMode) => {
    if (targetMode === 'register') {
      setIsFlipped(true);
      window.history.replaceState(null, '', '/register');
    } else {
      setIsFlipped(false);
      window.history.replaceState(null, '', '/login');
    }
  };

  // Login Submit Handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    const errors = {};
    if (!loginEmail.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim())) {
      errors.email = 'Please provide a valid email address';
    }
    if (!loginPassword) {
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      setLoginFieldErrors(errors);
      return;
    }

    setIsLoggingIn(true);
    const result = await login(loginEmail.trim(), loginPassword);
    setIsLoggingIn(false);

    if (result.success) {
      success(`Welcome back, ${result.user?.name || 'User'}!`);
      navigate('/projects');
    } else {
      setLoginError(result.message || 'Invalid email or password');
      if (result.errors && Array.isArray(result.errors)) {
        const mapped = {};
        result.errors.forEach((err) => {
          if (err.field) mapped[err.field] = err.message;
        });
        setLoginFieldErrors(mapped);
      }
    }
  };

  // Register Submit Handler
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');

    const errors = {};
    if (!regName.trim()) {
      errors.name = 'Full name is required';
    } else if (regName.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (regName.trim().length > 60) {
      errors.name = 'Name cannot exceed 60 characters';
    }

    if (!regEmail.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      errors.email = 'Please provide a valid email address';
    }

    if (!regPassword) {
      errors.password = 'Password is required';
    } else if (regPassword.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (Object.keys(errors).length > 0) {
      setRegFieldErrors(errors);
      return;
    }

    setIsRegistering(true);
    const result = await register(regName.trim(), regEmail.trim(), regPassword);
    setIsRegistering(false);

    if (result.success) {
      success('Account created successfully!');
      navigate('/projects');
    } else {
      setRegError(result.message || 'Registration failed');
      if (result.errors && Array.isArray(result.errors)) {
        const mapped = {};
        result.errors.forEach((err) => {
          if (err.field) mapped[err.field] = err.message;
        });
        setRegFieldErrors(mapped);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F9FAFB]">
      {/* Perspective Container */}
      <div className="perspective-1200 w-full max-w-md py-6">
        {/* Flipping 3D Binder Card */}
        <div
          className={`relative w-full min-h-[580px] preserve-3d transition-transform duration-700 ease-in-out ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT FACE: LOGIN */}
          <section
            className={`w-full min-h-[580px] bg-white rounded-2xl shadow-xl border border-slate-200/90 binder-spine pl-8 pr-6 sm:pr-8 py-8 backface-hidden flex flex-col justify-between ${
              isFlipped ? 'pointer-events-none' : 'pointer-events-auto'
            }`}
          >
            <div>
              {/* Binder Header with Typographic Logo */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <Logo size="md" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60">
                  Sign In
                </span>
              </div>

              <div className="mt-6 mb-6">
                <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">
                  Welcome back
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Access your team projects and workspace tasks.
                </p>
              </div>

              {loginError && (
                <div
                  className="mb-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5]/60 text-[#B91C1C] text-xs font-medium"
                  role="alert"
                >
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        if (loginFieldErrors.email)
                          setLoginFieldErrors((prev) => ({ ...prev, email: null }));
                      }}
                      placeholder="name@university.edu"
                      autoComplete="email"
                      className={`w-full pl-9 pr-3.5 py-2 rounded-lg text-sm bg-slate-50/70 border ${
                        loginFieldErrors.email
                          ? 'border-rose-400 focus:ring-rose-500'
                          : 'border-slate-200 focus:ring-[#0D5C46]'
                      } focus:outline-none focus:ring-1 focus:bg-white text-slate-900 transition`}
                    />
                  </div>
                  {loginFieldErrors.email && (
                    <p className="mt-1 text-xs text-[#B91C1C] font-medium">
                      {loginFieldErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (loginFieldErrors.password)
                          setLoginFieldErrors((prev) => ({ ...prev, password: null }));
                      }}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className={`w-full pl-9 pr-3.5 py-2 rounded-lg text-sm bg-slate-50/70 border ${
                        loginFieldErrors.password
                          ? 'border-rose-400 focus:ring-rose-500'
                          : 'border-slate-200 focus:ring-[#0D5C46]'
                      } focus:outline-none focus:ring-1 focus:bg-white text-slate-900 transition`}
                    />
                  </div>
                  {loginFieldErrors.password && (
                    <p className="mt-1 text-xs text-[#B91C1C] font-medium">
                      {loginFieldErrors.password}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-[#0D5C46] hover:bg-[#094232] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#0D5C46] disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Flip Trigger to Register */}
            <footer className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Need a new account?</span>
              <button
                type="button"
                onClick={() => toggleFlip('register')}
                className="font-semibold text-[#0D5C46] hover:underline flex items-center gap-1 transition"
              >
                Create Account &rarr;
              </button>
            </footer>
          </section>

          {/* BACK FACE: REGISTER */}
          <section
            className={`absolute inset-0 w-full min-h-[580px] bg-white rounded-2xl shadow-xl border border-slate-200/90 binder-spine pl-8 pr-6 sm:pr-8 py-8 backface-hidden rotate-y-180 flex flex-col justify-between ${
              !isFlipped ? 'pointer-events-none' : 'pointer-events-auto'
            }`}
          >
            <div>
              {/* Binder Header with Typographic Logo */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <Logo size="md" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0D5C46] bg-[#E6F0EC] px-2.5 py-1 rounded-md border border-[#0D5C46]/20">
                  Register
                </span>
              </div>

              <div className="mt-5 mb-5">
                <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">
                  Create workspace account
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Start collaborating with your student team on TeamFlow.
                </p>
              </div>

              {regError && (
                <div
                  className="mb-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5]/60 text-[#B91C1C] text-xs font-medium"
                  role="alert"
                >
                  {regError}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5" noValidate>
                <div>
                  <label
                    htmlFor="reg-name"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="reg-name"
                      type="text"
                      value={regName}
                      onChange={(e) => {
                        setRegName(e.target.value);
                        if (regFieldErrors.name)
                          setRegFieldErrors((prev) => ({ ...prev, name: null }));
                      }}
                      placeholder="Alex Rivera"
                      autoComplete="name"
                      className={`w-full pl-9 pr-3.5 py-2 rounded-lg text-sm bg-slate-50/70 border ${
                        regFieldErrors.name
                          ? 'border-rose-400 focus:ring-rose-500'
                          : 'border-slate-200 focus:ring-[#0D5C46]'
                      } focus:outline-none focus:ring-1 focus:bg-white text-slate-900 transition`}
                    />
                  </div>
                  {regFieldErrors.name && (
                    <p className="mt-1 text-xs text-[#B91C1C] font-medium">
                      {regFieldErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="reg-email"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="reg-email"
                      type="email"
                      value={regEmail}
                      onChange={(e) => {
                        setRegEmail(e.target.value);
                        if (regFieldErrors.email)
                          setRegFieldErrors((prev) => ({ ...prev, email: null }));
                      }}
                      placeholder="alex@university.edu"
                      autoComplete="email"
                      className={`w-full pl-9 pr-3.5 py-2 rounded-lg text-sm bg-slate-50/70 border ${
                        regFieldErrors.email
                          ? 'border-rose-400 focus:ring-rose-500'
                          : 'border-slate-200 focus:ring-[#0D5C46]'
                      } focus:outline-none focus:ring-1 focus:bg-white text-slate-900 transition`}
                    />
                  </div>
                  {regFieldErrors.email && (
                    <p className="mt-1 text-xs text-[#B91C1C] font-medium">
                      {regFieldErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="reg-password"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Password (min. 8 characters)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="reg-password"
                      type="password"
                      value={regPassword}
                      onChange={(e) => {
                        setRegPassword(e.target.value);
                        if (regFieldErrors.password)
                          setRegFieldErrors((prev) => ({ ...prev, password: null }));
                      }}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className={`w-full pl-9 pr-3.5 py-2 rounded-lg text-sm bg-slate-50/70 border ${
                        regFieldErrors.password
                          ? 'border-rose-400 focus:ring-rose-500'
                          : 'border-slate-200 focus:ring-[#0D5C46]'
                      } focus:outline-none focus:ring-1 focus:bg-white text-slate-900 transition`}
                    />
                  </div>
                  {regFieldErrors.password && (
                    <p className="mt-1 text-xs text-[#B91C1C] font-medium">
                      {regFieldErrors.password}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-[#0D5C46] hover:bg-[#094232] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#0D5C46] disabled:opacity-50"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Flip Trigger to Login */}
            <footer className="pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Already registered?</span>
              <button
                type="button"
                onClick={() => toggleFlip('login')}
                className="font-semibold text-[#0D5C46] hover:underline flex items-center gap-1 transition"
              >
                Sign In &rarr;
              </button>
            </footer>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AuthBinder;
