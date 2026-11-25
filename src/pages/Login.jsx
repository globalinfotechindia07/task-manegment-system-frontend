import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth, getRoleDashboard } from '../context/AuthContext';
import {
  HiOutlineBuildingOffice2,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineArrowRight,
  HiOutlineTrash,
} from 'react-icons/hi2';

const DEMO_PRESETS = [
  { label: 'Admin', email: 'demo.admin@globalinfotech.com', role: 'Office Administrator', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' },
  { label: 'HR', email: 'demo.hr@globalinfotech.com', role: 'HR Manager', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  { label: 'Lead', email: 'demo.lead@globalinfotech.com', role: 'Team Lead', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  { label: 'Employee', email: 'demo.user@globalinfotech.com', role: 'Employee Staff', color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' },
  { label: 'Accountant', email: 'demo.accountant@globalinfotech.com', role: 'Accountant', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
  { label: 'Client', email: 'demo.client@globalinfotech.com', role: 'Client Portal', color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' },
];

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
  const [selectedDemoRole, setSelectedDemoRole] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, automatically redirect to user's dashboard
  useEffect(() => {
    if (user && user.token) {
      navigate(getRoleDashboard(user), { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e, directEmail, directPassword) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSubmitting(true);

    const loginEmail = directEmail || email;
    const loginPass = directPassword || password;

    const result = await login(loginEmail, loginPass);

    if (result.success && result.user) {
      toast.success(`Welcome ${result.user.name || result.user.role}!`);
      navigate(getRoleDashboard(result.user), { replace: true });
    }

    setIsSubmitting(false);
  };

  const handleSelectPreset = (preset, autoLogin = false) => {
    setEmail(preset.email);
    setPassword('demo123');
    setSelectedDemoRole(preset.label);
    if (autoLogin) {
      handleSubmit(null, preset.email, 'demo123');
    } else {
      toast.success(`Loaded credentials for ${preset.role} (Pass: demo123)`, { id: 'demo-preset' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-indigo-500/20">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="text-center mb-5 sm:mb-6">
          <Link
            to="/"
            aria-label="Back to home"
            className="inline-flex p-3 bg-indigo-50 rounded-xl border border-indigo-200 mb-3 hover:bg-indigo-100 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
          >
            <HiOutlineBuildingOffice2 className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600" />
          </Link>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Enterprise ERP Sign In
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Sign in to your organization or test via public demo accounts
          </p>
        </div>

        {/* 1-Click Demo Accounts Selector */}
        <div className="mb-6 rounded-xl bg-gradient-to-br from-indigo-50/70 via-slate-50 to-amber-50/50 border border-indigo-100/90 p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
              <HiOutlineSparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>⚡ Public Demo Accounts</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Pass: demo123</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {DEMO_PRESETS.map((preset) => {
              const isSelected = selectedDemoRole === preset.label;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleSelectPreset(preset, false)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-all text-center truncate cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : `${preset.color}`
                  }`}
                  title={`${preset.role} (${preset.email})`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {selectedDemoRole && (
            <div className="mt-2.5 pt-2 border-t border-indigo-100/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-600 truncate">
                Selected: <strong className="text-indigo-700">{selectedDemoRole}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  const p = DEMO_PRESETS.find((x) => x.label === selectedDemoRole);
                  if (p) handleSelectPreset(p, true);
                }}
                disabled={isSubmitting}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
              >
                <span>⚡ 1-Click Login</span>
                <HiOutlineArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
            <HiOutlineTrash className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="truncate">Demo data auto-purges after 24 hours. Real data safe.</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSelectedDemoRole(null);
                }}
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
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col items-center gap-2 text-center text-[11px] text-slate-500">
          <Link
            to="/#demo"
            className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Explore full Demo Sandbox details &amp; credentials</span>
            <HiOutlineArrowRight className="w-3 h-3" />
          </Link>
          <span className="text-[10px] text-slate-400">
            Enterprise Management Portal • Global IT Solutions
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
