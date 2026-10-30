import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { 
  HiOutlineBuildingOffice2, 
  HiOutlinePlus, 
  HiOutlinePencilSquare, 
  HiOutlineTrash, 
  HiOutlineMapPin, 
  HiOutlineUsers 
} from 'react-icons/hi2';

const fetchCompanies = async () => {
  const { data } = await api.get('/companies');
  return data;
};

const deleteCompany = async (id) => {
  const { data } = await api.delete(`/companies/${id}`);
  return data;
};

const Dashboard = () => {
  const queryClient = useQueryClient();

  const { data: companies, isLoading, isError } = useQuery({
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-rose-600 py-12 bg-white rounded-xl border border-rose-200">
        <h2 className="text-xl font-bold mb-2">Error Loading Data</h2>
        <p className="text-sm text-slate-500">Could not connect to the server. Is the backend running?</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Company Overview
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage and monitor your corporate portfolio
          </p>
        </div>
        <Link
          to="/add-company"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <HiOutlinePlus className="w-4 h-4" />
          <span>Add Company</span>
        </Link>
      </div>

      {companies?.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 text-slate-500 mb-4">
            <HiOutlineBuildingOffice2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No companies found</h3>
          <p className="text-slate-500 text-sm mb-5 max-w-sm mx-auto">
            Get started by adding your first company to the management system.
          </p>
          <Link
            to="/add-company"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-xs"
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span>Add First Company</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies?.map((company) => (
            <div 
              key={company._id} 
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 pr-2">
                    <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-1">
                      {company.name}
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {company.industry}
                    </span>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Link
                      to={`/edit-company/${company._id}`}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                      title="Edit"
                    >
                      <HiOutlinePencilSquare className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => {
                        if(window.confirm('Are you sure you want to delete this company?')) {
                          mutation.mutate(company._id);
                        }
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <HiOutlineMapPin className="w-4 h-4 text-slate-400" />
                  <span>{company.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <HiOutlineUsers className="w-4 h-4 text-slate-400" />
                  <span>{company.employeeCount?.toLocaleString()} Employees</span>
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
