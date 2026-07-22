import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../../api/axios';

const AdminProjects = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
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
    mutationFn: async (projectData) => {
      const { data } = await api.put(`/projects/${projectData._id}`, projectData);
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
    if (editingProject) {
      updateMutation.mutate({ ...data, _id: editingProject._id });
    } else {
      addMutation.mutate(data);
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
      case 'Completed': return 'bg-green-500/10 text-green-400';
      case 'In Progress': return 'bg-blue-500/10 text-blue-400';
      case 'On Hold': return 'bg-orange-500/10 text-orange-400';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white">Company Projects</h1>
          <p className="text-slate-400">Manage and track company projects.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)]"
        >
          + Add Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full p-8 flex justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : projects?.length === 0 ? (
          <div className="col-span-full glass-panel p-12 text-center">
            <h3 className="text-lg font-medium text-white mb-2">No projects found</h3>
            <p className="text-slate-400">Create a new project to get started.</p>
          </div>
        ) : (
          projects?.map((project) => (
            <div key={project._id} className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-white">{project.name}</h3>
                <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-6 flex-grow">{project.description || 'No description provided.'}</p>
              
              <div className="flex flex-col gap-2 mb-6">
                {project.startDate && (
                  <div className="flex items-center text-xs text-slate-400">
                    <span className="w-20">Start:</span>
                    <span className="text-slate-300">{new Date(project.startDate).toLocaleDateString()}</span>
                  </div>
                )}
                {project.endDate && (
                  <div className="flex items-center text-xs text-slate-400">
                    <span className="w-20">End:</span>
                    <span className="text-slate-300">{new Date(project.endDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-auto pt-4 border-t border-slate-700/50">
                <button
                  onClick={() => handleEdit(project)}
                  className="text-indigo-400 hover:text-indigo-300 p-2 hover:bg-indigo-500/10 rounded transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this project?')) {
                      deleteMutation.mutate(project._id);
                    }
                  }}
                  className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">{editingProject ? 'Edit Project' : 'New Project'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Project Name</label>
                <input
                  type="text"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none min-h-[100px]"
                  {...register('description')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none appearance-none"
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
                  <label className="block text-sm font-medium text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    {...register('startDate')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">End Date</label>
                  <input
                    type="date"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    {...register('endDate')}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center"
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

