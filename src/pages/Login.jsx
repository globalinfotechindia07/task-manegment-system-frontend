import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineBuildingOffice2, HiOutlineEnvelope, HiOutlineLockClosed } from 'react-icons/hi2';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      } else if (r === 'team head' || r === 'team lead' || r.includes('project lead') || r.includes('team lead')) {
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
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex p-3 bg-indigo-50 rounded-xl border border-indigo-100 mb-4 hover:bg-indigo-100 transition-colors shadow-xs">
            <HiOutlineBuildingOffice2 className="w-8 h-8 text-indigo-600" />
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Enterprise ERP Sign In</h2>
          <p className="text-slate-500 text-sm mt-1.5">Sign in to access your company dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="email">
              Work Email Address
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
                className="w-full bg-white border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all shadow-xs"
                placeholder="name@company.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <HiOutlineLockClosed className="w-5 h-5" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all shadow-xs"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
          <span>Enterprise Management Portal • Global IT Solutions</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
