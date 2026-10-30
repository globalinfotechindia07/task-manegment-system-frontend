import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineBuildingOffice2,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
} from 'react-icons/hi2';

/* ============================================================
   DESIGN TOKENS (consistent with all other pages)
   ============================================================ */
const tokens = {
  btnPrimary:
    'w-full inline-flex items-center justify-center gap-2 font-semibold rounded-xl bg-indigo-600 text-white shadow-sm ' +
    'hover:bg-indigo-700 active:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ' +
    'transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  input:
    'w-full bg-white border border-slate-300 rounded-xl pl-11 pr-11 py-2.5 text-sm text-slate-900 ' +
    'placeholder:text-slate-400 transition-colors shadow-sm ' +
    'focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20',
  label:
    'block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5',
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await login(email, password);

    if (result.success) {
      const r = (result.user.role || '').toLowerCase();
      if (r === 'super admin') {
        navigate('/super-admin/dashboard');
      } else if (r === 'hr manager' || r === 'hr' || r.includes('human resource')) {
        navigate('/hr/dashboard');
      } else if (
        r === 'team head' ||
        r === 'team lead' ||
        r.includes('project lead') ||
        r.includes('team lead')
      ) {
        navigate('/team-lead/dashboard');
      } else if (r === 'user' || r === 'employee' || r.includes('staff')) {
        navigate('/user/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-indigo-500/20">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <Link
            to="/"
            aria-label="Back to home"
            className="inline-flex p-3 bg-indigo-50 rounded-xl border border-indigo-200 mb-4 hover:bg-indigo-100 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
          >
            <HiOutlineBuildingOffice2 className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600" />
          </Link>
          <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Enterprise ERP Sign In
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            Sign in to access your company dashboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
          {/* Email */}
          <div>
            <label htmlFor="email" className={tokens.label}>
              Work Email Address *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <HiOutlineEnvelope className="w-5 h-5" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={tokens.input}
                placeholder="name@company.com"
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className={tokens.label}>
              Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <HiOutlineLockClosed className="w-5 h-5" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={tokens.input}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <HiOutlineEyeSlash className="w-5 h-5" />
                ) : (
                  <HiOutlineEye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${tokens.btnPrimary} py-2.5 px-4 text-sm mt-2`}
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing in…</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-100 text-center text-[10px] sm:text-xs text-slate-400">
          <span>Enterprise Management Portal • Global IT Solutions</span>
        </div>
      </div>
    </div>
  );
};

export default Login;