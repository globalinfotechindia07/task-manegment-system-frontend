import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft } from 'react-icons/hi2';
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
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-4 group cursor-pointer">
          <HiOutlineArrowLeft className="w-4 h-4 mr-1.5 transform group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {isEditMode ? 'Edit Company Profile' : 'Add New Company'}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {isEditMode ? 'Update the details for this organization.' : 'Enter the details of the organization to add it to your portfolio.'}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                Company Name *
              </label>
              <input
                id="name"
                type="text"
                className={`w-full bg-white border ${errors.name ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'} rounded-lg px-4 py-2 text-slate-900 placeholder-slate-400 text-sm outline-none transition-all`}
                placeholder="e.g. Acme Corporation"
                {...register('name', { required: 'Company name is required' })}
              />
              {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-slate-700 mb-1">
                  Industry *
                </label>
                <input
                  id="industry"
                  type="text"
                  className={`w-full bg-white border ${errors.industry ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'} rounded-lg px-4 py-2 text-slate-900 placeholder-slate-400 text-sm outline-none transition-all`}
                  placeholder="e.g. Technology, Healthcare"
                  {...register('industry', { required: 'Industry is required' })}
                />
                {errors.industry && <p className="mt-1 text-xs text-rose-600">{errors.industry.message}</p>}
              </div>

              <div>
                <label htmlFor="employeeCount" className="block text-sm font-medium text-slate-700 mb-1">
                  Employee Count *
                </label>
                <input
                  id="employeeCount"
                  type="number"
                  min="1"
                  className={`w-full bg-white border ${errors.employeeCount ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'} rounded-lg px-4 py-2 text-slate-900 placeholder-slate-400 text-sm outline-none transition-all`}
                  placeholder="e.g. 250"
                  {...register('employeeCount', { 
                    required: 'Employee count is required',
                    min: { value: 1, message: 'Must be at least 1' }
                  })}
                />
                {errors.employeeCount && <p className="mt-1 text-xs text-rose-600">{errors.employeeCount.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1">
                Headquarters Location *
              </label>
              <input
                id="location"
                type="text"
                className={`w-full bg-white border ${errors.location ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'} rounded-lg px-4 py-2 text-slate-900 placeholder-slate-400 text-sm outline-none transition-all`}
                placeholder="e.g. San Francisco, CA"
                {...register('location', { required: 'Location is required' })}
              />
              {errors.location && <p className="mt-1 text-xs text-rose-600">{errors.location.message}</p>}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer flex items-center"
            >
              {mutation.isPending ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Company')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyForm;