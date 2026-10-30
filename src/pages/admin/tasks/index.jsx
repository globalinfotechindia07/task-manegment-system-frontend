import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { HiOutlinePaperClip, HiOutlineXMark } from 'react-icons/hi2';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';

const TasksPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const isOfficeAdmin = user?.role === 'Admin' || user?.role === 'CTO';
  const perms = user?.permissions?.tasks || {};
  const canCreateTask = isOfficeAdmin || Boolean(perms.create);
  const canEditTask = isOfficeAdmin || Boolean(perms.edit);
  const canDeleteTask = isOfficeAdmin || Boolean(perms.delete);

  // View mode: 'all' or 'my'
  const [viewMode, setViewMode] = useState('all');

  // Filters & Pagination
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterAssignee, setFilterAssignee] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentAttachment, setCommentAttachment] = useState(null);
  const [taskAttachments, setTaskAttachments] = useState(null);

  // Queries
  const { data: allTasks = [], isLoading: allTasksLoading } = useQuery({
    queryKey: ['tasks', viewMode],
    queryFn: async () => {
      const url = viewMode === 'my' ? '/tasks?myTasks=true' : '/tasks';
      const { data } = await api.get(url);
      return Array.isArray(data) ? data : [];
    }
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await api.get('/projects');
      return Array.isArray(data) ? data : [];
    }
  });

  const { data: usersList = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return Array.isArray(data) ? data : [];
    }
  });

  // Create Task Form
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      project: '',
      assignedTo: '',
      startDate: '',
      dueDate: '',
      priority: 'Medium'
    }
  });

  // Create Task Mutation
  const createTaskMutation = useMutation({
    mutationFn: async (formData) => {
      const { data } = await api.post('/tasks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Task created successfully');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsCreateModalOpen(false);
      reset();
      setTaskAttachments(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create task');
    }
  });

  // Update Status / Progress Mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, payload }) => {
      const { data } = await api.put(`/tasks/${taskId}`, payload);
      return data;
    },
    onSuccess: (updated) => {
      toast.success('Task updated');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (selectedTask && selectedTask._id === updated._id) {
        setSelectedTask(updated);
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update task');
    }
  });

  // Delete Task Mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      const { data } = await api.delete(`/tasks/${taskId}`);
      return data;
    },
    onSuccess: () => {
      toast.success('Task deleted');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsDetailsModalOpen(false);
      setSelectedTask(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  });

  // Add Comment Mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ taskId, formData }) => {
      const { data } = await api.post(`/tasks/${taskId}/comments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data;
    },
    onSuccess: (updated) => {
      toast.success('Comment added');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSelectedTask(updated);
      setCommentText('');
      setCommentAttachment(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add comment');
    }
  });

  const onSubmitCreate = (data) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description || '');
    formData.append('project', data.project);
    formData.append('assignedTo', data.assignedTo || user._id);
    formData.append('startDate', data.startDate);
    formData.append('dueDate', data.dueDate);
    formData.append('priority', data.priority);

    if (taskAttachments && taskAttachments.length > 0) {
      for (let i = 0; i < taskAttachments.length; i++) {
        formData.append('attachments', taskAttachments[i]);
      }
    }
    createTaskMutation.mutate(formData);
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim() && !commentAttachment) return;

    const formData = new FormData();
    formData.append('text', commentText);
    if (commentAttachment) {
      formData.append('attachment', commentAttachment);
    }
    addCommentMutation.mutate({ taskId: selectedTask._id, formData });
  };

  const handleDeleteTask = (task) => {
    Swal.fire({
      title: 'Delete this task?',
      text: `Are you sure you want to delete "${task.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Yes, delete',
      background: '#1e293b',
      color: '#f8fafc',
    }).then((res) => {
      if (res.isConfirmed) {
        deleteTaskMutation.mutate(task._id);
      }
    });
  };

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return allTasks.filter(t => {
      if (selectedProjectId && t.project?._id !== selectedProjectId) return false;
      if (filterStatus !== 'All' && t.status !== filterStatus) return false;
      if (filterPriority !== 'All' && t.priority !== filterPriority) return false;
      if (filterAssignee !== 'All' && t.assignedTo?._id !== filterAssignee) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = t.title?.toLowerCase().includes(q);
        const assigneeMatch = t.assignedTo?.name?.toLowerCase().includes(q);
        const projectMatch = t.project?.name?.toLowerCase().includes(q);
        if (!titleMatch && !assigneeMatch && !projectMatch) return false;
      }
      return true;
    });
  }, [allTasks, selectedProjectId, filterStatus, filterPriority, filterAssignee, searchQuery]);

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const calculateDelay = (dueDate) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    if (due >= now) return null;
    const diffHours = Math.floor((now - due) / (1000 * 60 * 60));
    if (diffHours >= 24) return `${Math.floor(diffHours / 24)}d overdue`;
    return `${diffHours}h overdue`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Task Management</h1>
          <p className="text-slate-500 text-sm mt-1">Create, monitor, and collaborate on team deliverables.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 border border-slate-200 rounded-lg p-1">
            <button
              onClick={() => { setViewMode('all'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Office Tasks
            </button>
            <button
              onClick={() => { setViewMode('my'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'my' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Assigned Tasks
            </button>
          </div>

          {canCreateTask && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              + Create Task
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Search</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search by title, assignee..."
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-600 shadow-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Project</label>
          <select
            value={selectedProjectId}
            onChange={(e) => { setSelectedProjectId(e.target.value); setCurrentPage(1); }}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-600 shadow-xs"
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-600 shadow-xs"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Priority</label>
          <select
            value={filterPriority}
            onChange={(e) => { setFilterPriority(e.target.value); setCurrentPage(1); }}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-600 shadow-xs"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Normal">Normal</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Assignee</label>
          <select
            value={filterAssignee}
            onChange={(e) => { setFilterAssignee(e.target.value); setCurrentPage(1); }}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-600 shadow-xs"
          >
            <option value="All">All Assignees</option>
            {usersList.map(u => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks Table / Cards */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {allTasksLoading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : paginatedTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="font-semibold text-slate-900 mb-1">No tasks found</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or click "+ Create Task" above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Task Title</th>
                  <th className="px-6 py-4 font-semibold">Project</th>
                  <th className="px-6 py-4 font-semibold">Priority</th>
                  <th className="px-6 py-4 font-semibold">Assignee</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Due Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTasks.map(task => {
                  const delay = calculateDelay(task.dueDate);
                  return (
                    <tr key={task._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 max-w-xs truncate">
                        <div className="font-semibold">{task.title}</div>
                        {task.description && (
                          <div className="text-xs text-slate-500 truncate">{task.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {task.project?.name || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                          task.priority === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          task.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {task.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center justify-center">
                            {task.assignedTo?.name?.charAt(0) || '?'}
                          </div>
                          <span className="text-xs text-slate-700">{task.assignedTo?.name || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          task.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          task.status === 'On Hold' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-700">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                        </div>
                        {delay && task.status !== 'Completed' && (
                          <span className="text-[10px] text-rose-600 font-bold tracking-tight">{delay}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => { setSelectedTask(task); setIsDetailsModalOpen(true); }}
                          title="View / Collaborate"
                          className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-colors shadow-xs"
                        >
                          Details
                        </button>

                        {canDeleteTask && (
                          <button
                            onClick={() => handleDeleteTask(task)}
                            title="Delete Task"
                            className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors inline-flex items-center"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-3 flex items-center justify-between border-t border-slate-200 bg-slate-50 text-xs">
                <div className="text-slate-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTasks.length)} of {filteredTasks.length} tasks
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 text-xs rounded border border-slate-300 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-7 h-7 text-xs rounded border cursor-pointer font-medium ${currentPage === i + 1 ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 text-xs rounded border border-slate-300 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsCreateModalOpen(false)}></div>
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Create New Task</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitCreate)} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  {...register('title', { required: 'Task title is required' })}
                  placeholder="e.g. Implement payment webhook callback"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                {errors.title && <p className="text-xs text-rose-600 mt-1">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project *</label>
                  <select
                    {...register('project', { required: 'Project is required' })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Select Project</option>
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                  {errors.project && <p className="text-xs text-rose-600 mt-1">{errors.project.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee</label>
                  <select
                    {...register('assignedTo')}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Assign to Myself</option>
                    {usersList.map(u => (
                      <option key={u._id} value={u._id}>{u.name} ({u.designation || u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    {...register('priority')}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    {...register('startDate')}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    {...register('dueDate')}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Requirements</label>
                <textarea
                  rows={4}
                  {...register('description')}
                  placeholder="Outline deliverables, acceptance criteria, or technical details..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Attachments (Optional)</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setTaskAttachments(e.target.files)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 bg-white border border-slate-300 rounded-lg p-1.5"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details & Collaboration Modal */}
      {isDetailsModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsDetailsModalOpen(false)}></div>
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50 shrink-0">
              <div>
                <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">{selectedTask.project?.name || 'General Project'}</span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedTask.title}</h3>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {/* Status & Priority Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="block text-[11px] text-slate-500 uppercase font-semibold">Status</span>
                  {canEditTask ? (
                    <select
                      value={selectedTask.status}
                      onChange={(e) => updateTaskMutation.mutate({ taskId: selectedTask._id, payload: { status: e.target.value } })}
                      className="mt-1 bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 outline-none focus:border-indigo-500 font-medium"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                    </select>
                  ) : (
                    <span className="text-xs font-bold text-slate-900">{selectedTask.status}</span>
                  )}
                </div>

                <div>
                  <span className="block text-[11px] text-slate-500 uppercase font-semibold">Priority</span>
                  <span className="text-xs font-bold text-amber-700 mt-1 block">{selectedTask.priority}</span>
                </div>

                <div>
                  <span className="block text-[11px] text-slate-500 uppercase font-semibold">Assignee</span>
                  <span className="text-xs text-slate-900 font-medium mt-1 block">{selectedTask.assignedTo?.name || 'Unassigned'}</span>
                </div>

                <div>
                  <span className="block text-[11px] text-slate-500 uppercase font-semibold">Due Date</span>
                  <span className="text-xs text-slate-900 font-medium mt-1 block">
                    {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Description */}
              {selectedTask.description && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Description</h4>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {selectedTask.description}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Attachments ({selectedTask.attachments.length})</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedTask.attachments.map((att, idx) => (
                      <a
                        key={idx}
                        href={`${API_BASE_URL}${att.path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-indigo-300 text-xs text-indigo-700 transition-colors"
                      >
                        <HiOutlinePaperClip className="w-4 h-4 shrink-0 text-slate-400" />
                        <span className="truncate">{att.name || `Attachment ${idx + 1}`}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments Thread */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Comments & Updates ({selectedTask.comments?.length || 0})</h4>
                
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
                  {selectedTask.comments && selectedTask.comments.length > 0 ? (
                    selectedTask.comments.map((c, i) => (
                      <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-900">{c.user?.name || 'User'}</span>
                          <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{c.text}</p>
                        {c.attachment && (
                          <a
                            href={`${API_BASE_URL}${c.attachment}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-[11px] text-indigo-700 hover:underline"
                          >
                            <HiOutlinePaperClip className="w-3.5 h-3.5 inline mr-1" />
                            View Attachment
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No comments yet. Start the conversation below.</p>
                  )}
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="flex flex-col gap-2">
                  <textarea
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a progress update or note..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <input
                      type="file"
                      onChange={(e) => setCommentAttachment(e.target.files[0])}
                      className="text-[11px] text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                    />
                    <button
                      type="submit"
                      disabled={addCommentMutation.isPending || (!commentText.trim() && !commentAttachment)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
                    >
                      {addCommentMutation.isPending ? 'Posting...' : 'Post Update'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
