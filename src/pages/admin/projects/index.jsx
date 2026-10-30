import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineFolder,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi2';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';

const getStatusColor = (status) => {
  switch (status) {
    case 'Completed':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'In Progress':
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'On Hold':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
};

const AdminProjects = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      status: 'Planning',
      startDate: '',
      endDate: '',
    },
  });

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await api.get('/projects');
      return data;
    },
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
    },
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
    },
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
    },
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
      endDate: '',
    });
  };

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

  const isSaving = addMutation.isPending || updateMutation.isPending;

  // Reusable tokens
  const inputBase =
    'w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors';
  const labelBase = 'block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5';

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ===================== PAGE HEADER ===================== */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Company Projects</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage and track project lifecycles and milestones.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <HiOutlinePlus className="w-4 h-4" />
          <span>Add Project</span>
        </button>
      </div>

      {/* ===================== TABLE / LIST ===================== */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">

        {/* ---------- MOBILE CARD VIEW (< md) ---------- */}
        <div className="md:hidden divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : !projects || projects.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                <HiOutlineFolder className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-700">No projects yet</p>
              <p className="text-xs text-slate-500 mt-1">Create your first project to get started.</p>
            </div>
          ) : (
            currentProjects.map((project) => (
              <div key={project._id} className="p-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-start gap-3 mb-2">
                  {project.logo ? (
                    <img
                      src={`${API_BASE_URL}${project.logo}`}
                      alt={project.name}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold border border-indigo-200 shrink-0">
                      {project.name ? project.name.substring(0, 2).toUpperCase() : 'PR'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 text-xs truncate">{project.name}</p>
                    <span
                      className={`inline-flex mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                  </div>
                </div>

                {project.description && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">{project.description}</p>
                )}

                <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 mb-3">
                  <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                    <span className="font-semibold">Start:</span>{' '}
                    {project.startDate ? new Date(project.startDate).toLocaleDateString('en-IN') : '—'}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                    <span className="font-semibold">End:</span>{' '}
                    {project.endDate ? new Date(project.endDate).toLocaleDateString('en-IN') : '—'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(project)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                  >
                    <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this project?')) {
                        deleteMutation.mutate(project._id);
                      }
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                  >
                    <HiOutlineTrash className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ---------- DESKTOP TABLE VIEW (md+) ---------- */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap">Logo</th>
                <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap">Project Name</th>
                <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap">Description</th>
                <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap">Status</th>
                <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap">Start Date</th>
                <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap">End Date</th>
                <th className="px-4 lg:px-6 py-3.5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="inline-block w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                  </td>
                </tr>
              ) : !projects || projects.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                      <HiOutlineFolder className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">No projects yet</p>
                    <p className="text-xs text-slate-500 mt-1">Create your first project to get started.</p>
                  </td>
                </tr>
              ) : (
                currentProjects.map((project) => (
                  <tr key={project._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 lg:px-6 py-3.5">
                      {project.logo ? (
                        <img
                          src={`${API_BASE_URL}${project.logo}`}
                          alt={project.name}
                          className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700 text-[10px] font-bold border border-indigo-200">
                          {project.name ? project.name.substring(0, 2).toUpperCase() : 'PR'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 lg:px-6 py-3.5">
                      <span className="font-semibold text-slate-900 text-xs truncate max-w-[180px] block">
                        {project.name}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3.5 text-slate-500 max-w-xs">
                      <span className="text-xs line-clamp-2 block" title={project.description}>
                        {project.description || '—'}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${getStatusColor(
                          project.status
                        )}`}
                      >
                        {project.status}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3.5 whitespace-nowrap text-slate-600 text-xs">
                      {project.startDate
                        ? new Date(project.startDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                        : '—'}
                    </td>
                    <td className="px-4 lg:px-6 py-3.5 whitespace-nowrap text-slate-600 text-xs">
                      {project.endDate
                        ? new Date(project.endDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                        : '—'}
                    </td>
                    <td className="px-4 lg:px-6 py-3.5 whitespace-nowrap text-right text-xs">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(project)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                          aria-label="Edit project"
                        >
                          <HiOutlinePencilSquare className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this project?')) {
                              deleteMutation.mutate(project._id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                          aria-label="Delete project"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ---------- PAGINATION ---------- */}
        {!isLoading && projects?.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50">
            <span className="text-[11px] sm:text-xs text-slate-500 text-center sm:text-left">
              Showing <strong className="text-slate-700">{indexOfFirstItem + 1}</strong>–
              <strong className="text-slate-700">{Math.min(indexOfLastItem, projects.length)}</strong> of{' '}
              <strong className="text-slate-700">{projects.length}</strong>
            </span>
            <div className="flex items-center justify-center sm:justify-end gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="inline-flex items-center justify-center p-1.5 sm:px-3 sm:py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                aria-label="Previous page"
              >
                <HiOutlineChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline ml-1 text-xs font-medium">Prev</span>
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-pointer ${currentPage === page
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                      }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="inline-flex items-center justify-center p-1.5 sm:px-3 sm:py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                aria-label="Next page"
              >
                <span className="hidden sm:inline mr-1 text-xs font-medium">Next</span>
                <HiOutlineChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===================== CREATE / EDIT MODAL ===================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden="true"
          />
          <div className="relative bg-white sm:rounded-2xl rounded-t-2xl border-0 sm:border border-slate-200 shadow-2xl w-full sm:max-w-md max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <h3 className="text-base font-bold text-slate-900 truncate">
                {editingProject ? 'Edit Project' : 'New Project'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 -mr-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer shrink-0"
                aria-label="Close"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className={labelBase}>Project Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:cursor-pointer cursor-pointer"
                  {...register('logo')}
                />
              </div>

              <div>
                <label className={labelBase}>Project Name *</label>
                <input
                  type="text"
                  className={inputBase}
                  placeholder="e.g. Website Redesign"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && <p className="text-[11px] text-rose-600 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className={labelBase}>Description</label>
                <textarea
                  rows={3}
                  className={`${inputBase} resize-none`}
                  placeholder="Brief description of the project…"
                  {...register('description')}
                />
              </div>

              <div>
                <label className={labelBase}>Status</label>
                <select className={inputBase} {...register('status')}>
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className={labelBase}>Start Date</label>
                  <input type="date" className={inputBase} {...register('startDate')} />
                </div>
                <div>
                  <label className={labelBase}>End Date</label>
                  <input type="date" className={inputBase} {...register('endDate')} />
                </div>
              </div>

              <div className="pt-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-300 shadow-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSaving && (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>{isSaving ? 'Saving…' : 'Save Project'}</span>
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