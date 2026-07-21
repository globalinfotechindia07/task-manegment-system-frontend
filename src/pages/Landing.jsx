import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { user } = useAuth();

  if (user) {
    const roleRoutes = {
      'Admin': '/admin/dashboard',
      'Team Head': '/team-lead/dashboard',
      'User': '/user/dashboard',
      'HR Manager': '/hr/dashboard',
    };
    return <Navigate to={roleRoutes[user.role] || '/'} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a] text-slate-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px]"></div>

      <div className="z-10 text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-500/20 rounded-2xl mb-4 border border-indigo-500/30">
          <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-medium text-indigo-400 uppercase tracking-widest">
            Daily Task Management System
          </h2>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
            Global Infotech India
            <span className="block text-3xl md:text-5xl text-slate-400 mt-2 font-light">Pvt. Ltd., Nagpur</span>
          </h1>
        </div>

        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Streamline your workflow, manage daily tasks, and collaborate effectively across all departments.
        </p>

        <div className="pt-8">
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-indigo-600 rounded-full hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] transform hover:-translate-y-1"
          >
            Access Portal
            <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;
