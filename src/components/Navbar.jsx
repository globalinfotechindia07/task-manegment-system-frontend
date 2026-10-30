import { Link, useLocation } from 'react-router-dom';
import { HiOutlineBuildingOffice2, HiOutlinePlus } from 'react-icons/hi2';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-14 flex items-center justify-between gap-3">

        {/* Brand / Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-2.5 group shrink-0 min-w-0"
          aria-label="NexusCorp Home"
        >
          <div className="w-8 h-8 bg-indigo-600 group-hover:bg-indigo-700 rounded-lg flex items-center justify-center text-white shadow-sm transition-colors shrink-0">
            <HiOutlineBuildingOffice2 className="w-5 h-5" />
          </div>
          <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
            NexusCorp
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link
            to="/"
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${location.pathname === '/'
              ? 'bg-slate-100 text-slate-900'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            Dashboard
          </Link>

          <Link
            to="/add-company"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white transition-colors shadow-sm"
          >
            <HiOutlinePlus className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline sm:inline">Add Company</span>
            <span className="xs:hidden sm:hidden">Add</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;