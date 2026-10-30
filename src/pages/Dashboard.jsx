import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineBuildingOffice2,
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineMapPin,
  HiOutlineUsers,
  HiOutlineExclamationTriangle,
  HiOutlineArrowPath,
} from 'react-icons/hi2';
import api from '../api/axios';

/* ============================================================
   DESIGN TOKENS (consistent with all other pages)
   ============================================================ */
const tokens = {
  btnPrimary:
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg bg-indigo-600 text-white shadow-sm ' +
    'hover:bg-indigo-700 active:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ' +
    'transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  btnSecondary:
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg bg-white text-slate-700 border border-slate-300 shadow-sm ' +
    'hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  card: 'bg-white border border-slate-200 rounded-xl shadow-sm',
};

/* ============================================================
   API helpers (UNCHANGED)
   ============================================================ */
const fetchCompanies = async () => {
  const { data } = await api.get('/companies');
  return data;
};

const deleteCompany = async (id) => {
  const { data } = await api.delete(`/companies/${id}`);
  return data;
};

/* ============================================================
   HELPERS
   ============================================================ */
const Loader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
  </div>
);

const initials = (name) => (name ? name.trim().charAt(0).toUpperCase() : '?');

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const Dashboard = () => {
  const queryClient = useQueryClient();

  const { data: companies, isLoading, isError, refetch } = useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
  });

  const mutation = useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => {
      toast.success('Company deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: () => {
      toast.error('Failed to delete company');
    },
  });

  /* ---------------- Loading ---------------- */
  if (isLoading) {
    return <Loader />;
  }

  /* ---------------- Error ---------------- */
  if (isError) {
    return (
      <div className={`${tokens.card} max-w-lg mx-auto py-10 px-6 text-center`}>
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
          <HiOutlineExclamationTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-base font-bold text-slate-900 mb-1">
          Could not load companies
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mb-4 max-w-xs mx-auto">
          We couldn't connect to the server. Is the backend running?
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className={`${tokens.btnSecondary} px-4 py-2 text-sm`}
        >
          <HiOutlineArrowPath className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  const hasCompanies = Array.isArray(companies) && companies.length > 0;

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-6">
      {/* ===================== HEADER ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900">
            Company Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage and monitor your corporate portfolio
          </p>
        </div>
        <Link
          to="/add-company"
          className={`${tokens.btnPrimary} w-full sm:w-auto px-4 py-2.5 text-sm`}
        >
          <HiOutlinePlus className="w-4 h-4" />
          <span>Add Company</span>
        </Link>
      </div>

      {/* ===================== BODY ===================== */}
      {!hasCompanies ? (
        <div className={`${tokens.card} py-12 px-6 text-center`}>
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
            <HiOutlineBuildingOffice2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            No companies found
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-5 max-w-sm mx-auto">
            Get started by adding your first company to the management system.
          </p>
          <Link
            to="/add-company"
            className={`${tokens.btnPrimary} px-4 py-2.5 text-sm`}
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span>Add First Company</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {companies.map((company) => (
            <div
              key={company._id}
              className={`${tokens.card} p-4 sm:p-5 hover:border-slate-300 hover:shadow-md transition-all h-full flex flex-col`}
            >
              {/* Header row */}
              <div className="flex items-start gap-3 mb-3">
                {/* Icon avatar */}
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-sm shrink-0">
                  {initials(company.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1">
                    {company.name}
                  </h3>
                  <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 max-w-full">
                    <span className="truncate">{company.industry}</span>
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  <Link
                    to={`/edit-company/${company._id}`}
                    className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
                    title="Edit"
                    aria-label={`Edit ${company.name}`}
                  >
                    <HiOutlinePencilSquare className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          'Are you sure you want to delete this company?'
                        )
                      ) {
                        mutation.mutate(company._id);
                      }
                    }}
                    className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete"
                    aria-label={`Delete ${company.name}`}
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Meta footer */}
              <div className="mt-auto pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <HiOutlineMapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{company.location || '—'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <HiOutlineUsers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {company.employeeCount?.toLocaleString() || 0} Employees
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;