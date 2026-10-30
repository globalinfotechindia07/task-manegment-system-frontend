import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';

const AdminProjects = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      status: 'Planning',
      startDate: '',
      endDate: ''
    }
  });

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await api.get('/projects');
      return data;
    }
  });

  const addMutation = useMutation({
    mutationFn: async (projectData) => {
      const { data } = await api.post('/projects', projectData);
      return data;
    },
    onSuccess: () => {
      toast.success('Project added successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add project');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }) => {
      const { data } = await api.put(`/projects/${id}`, formData);
      return data;
    },
    onSuccess: () => {
      toast.success('Project updated successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update project');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (projectId) => {
      const { data } = await api.delete(`/projects/${projectId}`);
      return data;
    },
    onSuccess: () => {
      toast.success('Project deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete project');
    }
  });

  const onSubmit = (data) => {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    formData.append('status', data.status);
    if (data.startDate) formData.append('startDate', data.startDate);
    if (data.endDate) formData.append('endDate', data.endDate);
    if (data.logo && data.logo.length > 0) {
      formData.append('logo', data.logo[0]);
    }

    if (editingProject) {
      updateMutation.mutate({ id: editingProject._id, formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setValue('name', project.name);
    setValue('description', project.description || '');
    setValue('status', project.status);
    setValue('startDate', project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '');
    setValue('endDate', project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    reset({
      name: '',
      description: '',
      status: 'Planning',
      startDate: '',
      endDate: ''
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'In Progress': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'On Hold': return 'bg-amber-50 text-amber-700 border border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = projects?.slice(indexOfFirstItem, indexOfLastItem) || [];
  const totalPages = projects ? Math.ceil(projects.length / itemsPerPage) : 0;

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Company Projects</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track company project lifecycles and milestones.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
        >
          + Add Project
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Logo</th>
                <th scope="col" className="px-6 py-4 font-medium">Project Name</th>
                <th scope="col" className="px-6 py-4 font-medium">Description</th>
                <th scope="col" className="px-6 py-4 font-medium">Status</th>
                <th scope="col" className="px-6 py-4 font-medium">Start Date</th>
                <th scope="col" className="px-6 py-4 font-medium">End Date</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center flex justify-center">
                    <div className="inline-block w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : projects?.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <h3 className="text-base font-semibold text-slate-900 mb-1">No projects found</h3>
                    <p className="text-xs text-slate-400">Create a new project to get started.</p>
                  </td>
                </tr>
              ) : (
                currentProjects.map((project) => (
                  <tr key={project._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      {project.logo ? (
                        <img src={`${API_BASE_URL}${project.logo}`} alt={project.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-semibold border border-slate-200">
                          {project.name ? project.name.substring(0, 2).toUpperCase() : 'PR'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{project.name}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={project.description}>
                      {project.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 text-xs">
                      {project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 text-xs">
                      {project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold space-x-1">
                      <button
                        onClick={() => handleEdit(project)}
                        className="text-indigo-600 hover:text-indigo-800 px-2 py-1 hover:bg-indigo-50 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this project?')) {
                            deleteMutation.mutate(project._id);
                          }
                        }}
                        className="text-rose-600 hover:text-rose-800 px-2 py-1 hover:bg-rose-50 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!isLoading && projects?.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs">
            <span className="text-slate-500">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, projects.length)} of {projects.length} entries
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs font-medium"
              >
                Previous
              </button>
              <div className="flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 flex items-center justify-center rounded-md font-medium transition-colors ${
                      currentPage === page 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={closeModal}></div>
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/70">
              <h3 className="text-base font-bold text-slate-900">{editingProject ? 'Edit Project' : 'New Project'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Project Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-600 outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  {...register('logo')}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Project Name</label>
                <input
                  type="text"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 outline-none"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Description</label>
                <textarea
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 outline-none min-h-[90px]"
                  {...register('description')}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Status</label>
                <select
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 outline-none"
                  {...register('status')}
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 outline-none"
                    {...register('startDate')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 outline-none"
                    {...register('endDate')}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-300 shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-50 flex items-center"
                >
                  {addMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProjects;

