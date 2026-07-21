import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/axios';

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

const CompanyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      industry: '',
      location: '',
      employeeCount: ''
    }
  });

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
        employeeCount: company.employeeCount
      });
    }
  }, [company, isEditMode, reset]);

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
    // Ensure employeeCount is a number
    const formattedData = {
      ...data,
      employeeCount: Number(data.employeeCount)
    };
    
    if (isEditMode) {
      mutation.mutate({ id, companyData: formattedData });
    } else {
      mutation.mutate(formattedData);
    }
  };

  if (isEditMode && isLoadingCompany) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors mb-4 group">
          <svg className="w-4 h-4 mr-1 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          {isEditMode ? 'Edit Company Profile' : 'Add New Company'}
        </h1>
        <p className="text-slate-400">
          {isEditMode ? 'Update the details for this organization.' : 'Enter the details of the organization to add it to your portfolio.'}
        </p>
      </div>

      <div className="glass-panel p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
                Company Name
              </label>
              <input
                id="name"
                type="text"
                className={`w-full bg-slate-900/50 border ${errors.name ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'} rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-all`}
                placeholder="e.g. Acme Corporation"
                {...register('name', { required: 'Company name is required' })}
              />
              {errors.name && <p className="mt-1.5 text-sm text-red-400">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Industry
                </label>
                <input
                  id="industry"
                  type="text"
                  className={`w-full bg-slate-900/50 border ${errors.industry ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'} rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-all`}
                  placeholder="e.g. Technology, Healthcare"
                  {...register('industry', { required: 'Industry is required' })}
                />
                {errors.industry && <p className="mt-1.5 text-sm text-red-400">{errors.industry.message}</p>}
              </div>

              <div>
                <label htmlFor="employeeCount" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Employee Count
                </label>
                <input
                  id="employeeCount"
                  type="number"
                  min="1"
                  className={`w-full bg-slate-900/50 border ${errors.employeeCount ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'} rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-all`}
                  placeholder="e.g. 250"
                  {...register('employeeCount', { 
                    required: 'Employee count is required',
                    min: { value: 1, message: 'Must be at least 1' }
                  })}
                />
                {errors.employeeCount && <p className="mt-1.5 text-sm text-red-400">{errors.employeeCount.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-slate-300 mb-1.5">
                Headquarters Location
              </label>
              <input
                id="location"
                type="text"
                className={`w-full bg-slate-900/50 border ${errors.location ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'} rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-all`}
                placeholder="e.g. San Francisco, CA"
                {...register('location', { required: 'Location is required' })}
              />
              {errors.location && <p className="mt-1.5 text-sm text-red-400">{errors.location.message}</p>}
            </div>

          </div>

          <div className="pt-4 border-t border-slate-700/50 flex justify-end gap-3">
            <Link
              to="/"
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {mutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                isEditMode ? 'Save Changes' : 'Create Company'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyForm;
