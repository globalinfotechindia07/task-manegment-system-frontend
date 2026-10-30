import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineBuildingOffice2,
  HiOutlineBriefcase,
  HiOutlineMapPin,
  HiOutlineUsers,
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
  input:
    'w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 ' +
    'placeholder:text-slate-400 transition-colors ' +
    'focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ' +
    'disabled:bg-slate-50 disabled:text-slate-500',
  inputError:
    'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20',
  label:
    'block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5',
  error: 'text-[11px] text-rose-600 mt-1',
  card: 'bg-white border border-slate-200 rounded-xl shadow-sm',
};

/* ============================================================
   API helpers (UNCHANGED)
   ============================================================ */
const fetchCompany = async (id) => {
  const { data } = await api.get(`/companies/${id}`);
  return data;
};

const createCompany = async (companyData) => {
  const { data } = await api.post('/companies', companyData);
  return data;
};

const updateCompany = async ({ id, companyData }) => {
  const { data } = await api.put(`/companies/${id}`, companyData);
  return data;
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const CompanyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      industry: '',
      location: '',
      employeeCount: '',
    },
  });

  /* ---------------- Queries (UNCHANGED) ---------------- */
  const { data: company, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['company', id],
    queryFn: () => fetchCompany(id),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (company && isEditMode) {
      reset({
        name: company.name,
        industry: company.industry,
        location: company.location,
        employeeCount: company.employeeCount,
      });
    }
  }, [company, isEditMode, reset]);

  /* ---------------- Mutations (UNCHANGED) ---------------- */
  const mutation = useMutation({
    mutationFn: isEditMode ? updateCompany : createCompany,
    onSuccess: () => {
      toast.success(`Company ${isEditMode ? 'updated' : 'created'} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      navigate('/');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Something went wrong');
    },
  });

  const onSubmit = (data) => {
    const formattedData = {
      ...data,
      employeeCount: Number(data.employeeCount),
    };

    if (isEditMode) {
      mutation.mutate({ id, companyData: formattedData });
    } else {
      mutation.mutate(formattedData);
    }
  };

  /* ---------------- Loading ---------------- */
  if (isEditMode && isLoadingCompany) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6">
      {/* ===================== HEADER ===================== */}
      <div className="min-w-0">
        <Link
          to="/"
          className="inline-flex items-center text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-3 sm:mb-4 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 rounded"
        >
          <HiOutlineArrowLeft className="w-4 h-4 mr-1.5 transform group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        <div className="flex items-start gap-3">
          <div className="hidden sm:flex w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 items-center justify-center text-indigo-700 shrink-0">
            <HiOutlineBuildingOffice2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900">
              {isEditMode ? 'Edit Company Profile' : 'Add New Company'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {isEditMode
                ? 'Update the details for this organization.'
                : 'Enter the details of the organization to add it to your portfolio.'}
            </p>
          </div>
        </div>
      </div>

      {/* ===================== FORM CARD ===================== */}
      <div className={`${tokens.card} p-4 sm:p-6`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Company Name */}
          <div>
            <label htmlFor="name" className={tokens.label}>
              Company Name *
            </label>
            <div className="relative">
              <HiOutlineBuildingOffice2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="name"
                type="text"
                aria-invalid={errors.name ? 'true' : 'false'}
                className={`${tokens.input} pl-9 ${errors.name ? tokens.inputError : ''
                  }`}
                placeholder="e.g. Acme Corporation"
                {...register('name', { required: 'Company name is required' })}
              />
            </div>
            {errors.name && <p className={tokens.error}>{errors.name.message}</p>}
          </div>

          {/* Industry + Employee Count */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label htmlFor="industry" className={tokens.label}>
                Industry *
              </label>
              <div className="relative">
                <HiOutlineBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="industry"
                  type="text"
                  aria-invalid={errors.industry ? 'true' : 'false'}
                  className={`${tokens.input} pl-9 ${errors.industry ? tokens.inputError : ''
                    }`}
                  placeholder="e.g. Technology"
                  {...register('industry', { required: 'Industry is required' })}
                />
              </div>
              {errors.industry && (
                <p className={tokens.error}>{errors.industry.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="employeeCount" className={tokens.label}>
                Employee Count *
              </label>
              <div className="relative">
                <HiOutlineUsers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="employeeCount"
                  type="number"
                  min="1"
                  aria-invalid={errors.employeeCount ? 'true' : 'false'}
                  className={`${tokens.input} pl-9 ${errors.employeeCount ? tokens.inputError : ''
                    }`}
                  placeholder="e.g. 250"
                  {...register('employeeCount', {
                    required: 'Employee count is required',
                    min: { value: 1, message: 'Must be at least 1' },
                  })}
                />
              </div>
              {errors.employeeCount && (
                <p className={tokens.error}>{errors.employeeCount.message}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className={tokens.label}>
              Headquarters Location *
            </label>
            <div className="relative">
              <HiOutlineMapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="location"
                type="text"
                aria-invalid={errors.location ? 'true' : 'false'}
                className={`${tokens.input} pl-9 ${errors.location ? tokens.inputError : ''
                  }`}
                placeholder="e.g. San Francisco, CA"
                {...register('location', { required: 'Location is required' })}
              />
            </div>
            {errors.location && (
              <p className={tokens.error}>{errors.location.message}</p>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
            <Link
              to="/"
              className={`${tokens.btnSecondary} px-4 py-2.5 text-sm`}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending}
              className={`${tokens.btnPrimary} px-4 py-2.5 text-sm`}
            >
              {mutation.isPending && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>
                {mutation.isPending
                  ? 'Saving…'
                  : isEditMode
                    ? 'Save Changes'
                    : 'Create Company'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyForm;