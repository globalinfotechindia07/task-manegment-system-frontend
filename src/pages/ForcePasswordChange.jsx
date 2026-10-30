import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineExclamationCircle,
} from 'react-icons/hi2';

/* ============================================================
   DESIGN TOKENS (consistent with all other pages)
   ============================================================ */
const tokens = {
  btnPrimary:
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg bg-indigo-600 text-white shadow-sm ' +
    'hover:bg-indigo-700 active:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ' +
    'transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  input:
    'w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 ' +
    'placeholder:text-slate-400 transition-colors ' +
    'focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ' +
    'disabled:bg-slate-50 disabled:text-slate-500',
  inputError:
    'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20',
  label:
    'block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5',
  error: 'text-[11px] text-rose-600 mt-1 flex items-center gap-1',
  hint: 'text-[11px] text-slate-500 mt-1',
  card: 'bg-white border border-slate-200 rounded-2xl shadow-sm',
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const ForcePasswordChange = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({ confirm: false });

  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const passwordsMatch = !confirmPassword || password === confirmPassword;
  const confirmError = touched.confirm && confirmPassword && !passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.put('/auth/force-password-change', { password });
      updateUser(data);
      toast.success('Password changed successfully');

      const roleRoutes = {
        Admin: '/admin/dashboard',
        'Team Head': '/team-lead/dashboard',
        User: '/user/dashboard',
        'HR Manager': '/hr/dashboard',
      };
      navigate(roleRoutes[data.role] || '/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className={`${tokens.card} w-full max-w-md p-6 sm:p-8`}>
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <HiOutlineLockClosed className="w-7 h-7" />
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-900 mb-2">
            Change Your Password
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Hi <strong className="text-slate-700">{user?.name}</strong>, as this is your
            first time logging in (or your password was reset), you are required to
            choose a new password.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className={tokens.label}>
              New Password *
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className={`${tokens.input} pr-10`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <HiOutlineEyeSlash className="w-4 h-4" />
                ) : (
                  <HiOutlineEye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className={tokens.hint}>At least 6 characters</p>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className={tokens.label}>
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                autoComplete="new-password"
                aria-invalid={confirmError ? 'true' : 'false'}
                className={`${tokens.input} pr-10 ${confirmError ? tokens.inputError : ''
                  }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showConfirm ? (
                  <HiOutlineEyeSlash className="w-4 h-4" />
                ) : (
                  <HiOutlineEye className="w-4 h-4" />
                )}
              </button>
            </div>
            {confirmError && (
              <p className={tokens.error}>
                <HiOutlineExclamationCircle className="w-3.5 h-3.5" />
                Passwords do not match
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`${tokens.btnPrimary} w-full py-2.5 px-4 text-sm mt-2`}
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{loading ? 'Updating…' : 'Update Password & Continue'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForcePasswordChange;