import { Link, useLocation } from 'react-router-dom';
import { HiOutlineBuildingOffice2, HiOutlinePlus } from 'react-icons/hi2';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-xs">
            <HiOutlineBuildingOffice2 className="w-5 h-5" />
          </div>
          <span className="font-bold text-base tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
            NexusCorp
          </span>
        </Link>
        
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              location.pathname === '/' 
                ? 'bg-slate-100 text-slate-900 font-bold' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/add-company"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs"
          >
            <HiOutlinePlus className="w-3.5 h-3.5" />
            <span>Add Company</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
