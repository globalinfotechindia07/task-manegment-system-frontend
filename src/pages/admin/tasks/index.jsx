import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  HiOutlinePaperClip,
  HiOutlineXMark,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineFunnel,
  HiOutlineMagnifyingGlass,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineUser,
  HiOutlineCalendarDays,
  HiOutlineClipboardDocumentList,
} from 'react-icons/hi2';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';

/* ============================================================
   DESIGN TOKENS (matches AdminProjects / RolesPage)
   ============================================================ */
const tokens = {
  btnPrimary:
    'inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg bg-indigo-600 text-white shadow-sm ' +
    'hover:bg-indigo-700 active:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ' +
    'transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  btnSecondary:
    'inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg bg-white text-slate-700 border border-slate-300 shadow-sm ' +
    'hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  btnDangerSoft:
    'inline-flex items-center justify-center gap-1 font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 ' +
    'hover:bg-rose-100 transition-colors cursor-pointer',
  input:
    'w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 ' +
    'placeholder:text-slate-400 transition-colors ' +
    'focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20',
  label:
    'block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5',
  error: 'text-[11px] text-rose-600 mt-1',
  card: 'bg-white border border-slate-200 rounded-xl shadow-sm',
  tableHead:
    'bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200',
};

/* ============================================================
   BADGES
   ============================================================ */
const priorityStyles = {
  High: 'bg-rose-50 text-rose-700 border-rose-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Normal: 'bg-blue-50 text-blue-700 border-blue-200',
};

const statusStyles = {
  Completed: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  'In Progress': { badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  'On Hold': { badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  Pending: { badge: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
};

const PriorityBadge = ({ priority, size = 'sm' }) => {
  const c = priorityStyles[priority] || priorityStyles.Normal;
  const pad = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';
  return (
    <span className={`inline-flex items-center rounded-full border font-semibold whitespace-nowrap ${c} ${pad}`}>
      {priority || 'Normal'}
    </span>
  );
};

const StatusBadge = ({ status, size = 'sm' }) => {
  const s = statusStyles[status] || statusStyles.Pending;
  const pad = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-semibold whitespace-nowrap ${s.badge} ${pad}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
};

/* ============================================================
   HELPERS
   ============================================================ */
const Loader = () => (
  <div className="flex justify-center items-center py-16">
    <div className="w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
  </div>
);

const getPageNumbers = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const arr = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  arr.forEach((p, i) => {
    if (i > 0 && p - arr[i - 1] > 1) out.push('...');
    out.push(p);
  });
  return out;
};

const calculateDelay = (dueDate) => {
  if (!dueDate) return null;
  const now = new Date();
  const due = new Date(dueDate);
  if (due >= now) return null;
  const diffHours = Math.floor((now - due) / (1000 * 60 * 60));
  if (diffHours >= 24) return `${Math.floor(diffHours / 24)}d overdue`;
  return `${diffHours}h overdue`;
};

const initials = (name) => (name ? name.charAt(0).toUpperCase() : '?');

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const TasksPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const isOfficeAdmin = user?.role === 'Admin' || user?.role === 'CTO';
  const perms = user?.permissions?.tasks || {};
  const canCreateTask = isOfficeAdmin || Boolean(perms.create);
  const canEditTask = isOfficeAdmin || Boolean(perms.edit);
  const canDeleteTask = isOfficeAdmin || Boolean(perms.delete);

  const [viewMode, setViewMode] = useState('all');

  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterAssignee, setFilterAssignee] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [showFilters, setShowFilters] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentAttachment, setCommentAttachment] = useState(null);
  const [taskAttachments, setTaskAttachments] = useState(null);

  /* ---------------- Queries (UNCHANGED) ---------------- */
  const { data: allTasks = [], isLoading: allTasksLoading } = useQuery({
    queryKey: ['tasks', viewMode],
    queryFn: async () => {
      const url = viewMode === 'my' ? '/tasks?myTasks=true' : '/tasks';
      const { data } = await api.get(url);
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await api.get('/projects');
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: usersList = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return Array.isArray(data) ? data : [];
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      project: '',
      assignedTo: '',
      startDate: '',
      dueDate: '',
      priority: 'Medium',
    },
  });

  /* ---------------- Mutations (UNCHANGED) ---------------- */
  const createTaskMutation = useMutation({
    mutationFn: async (formData) => {
      const { data } = await api.post('/tasks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
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
    },
  });

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
    },
  });

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
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ taskId, formData }) => {
      const { data } = await api.post(`/tasks/${taskId}/comments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
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
    },
  });

  /* ---------------- Handlers (UNCHANGED logic) ---------------- */
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

  /* ---------------- Filter + paginate (UNCHANGED logic) ---------------- */
  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
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
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const activeFiltersCount =
    (selectedProjectId ? 1 : 0) +
    (filterStatus !== 'All' ? 1 : 0) +
    (filterPriority !== 'All' ? 1 : 0) +
    (filterAssignee !== 'All' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const clearFilters = () => {
    setSelectedProjectId('');
    setFilterStatus('All');
    setFilterPriority('All');
    setFilterAssignee('All');
    setSearchQuery('');
    setCurrentPage(1);
  };

  /* ---------------- ESC to close modals ---------------- */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (isCreateModalOpen) setIsCreateModalOpen(false);
        if (isDetailsModalOpen) setIsDetailsModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isCreateModalOpen, isDetailsModalOpen]);

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-6">
      {/* ===================== HEADER ===================== */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
            Task Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create, monitor, and collaborate on team deliverables.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 border border-slate-200 rounded-lg p-1">
            <button
              type="button"
              onClick={() => {
                setViewMode('all');
                setCurrentPage(1);
              }}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${viewMode === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              All Tasks
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('my');
                setCurrentPage(1);
              }}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${viewMode === 'my'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              My Tasks
            </button>
          </div>

          {canCreateTask && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className={`${tokens.btnPrimary} px-4 py-2.5 text-sm`}
            >
              <HiOutlinePlus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      </div>

      {/* ===================== FILTER TOOLBAR ===================== */}
      <div className={tokens.card}>
        {/* Mobile toggle */}
        <div className="flex items-center justify-between px-4 py-3 sm:hidden border-b border-slate-100">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700"
          >
            <HiOutlineFunnel className="w-4 h-4 text-indigo-600" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              Clear
            </button>
          )}
        </div>

        <div
          className={`${showFilters ? 'grid' : 'hidden'
            } sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 p-4`}
        >
          <div>
            <label className={tokens.label}>Search</label>
            <div className="relative">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Title, assignee…"
                className={`${tokens.input} pl-9`}
              />
            </div>
          </div>

          <div>
            <label className={tokens.label}>Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setCurrentPage(1);
              }}
              className={tokens.input}
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={tokens.label}>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className={tokens.input}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label className={tokens.label}>Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => {
                setFilterPriority(e.target.value);
                setCurrentPage(1);
              }}
              className={tokens.input}
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Normal">Normal</option>
            </select>
          </div>

          <div>
            <label className={tokens.label}>Assignee</label>
            <select
              value={filterAssignee}
              onChange={(e) => {
                setFilterAssignee(e.target.value);
                setCurrentPage(1);
              }}
              className={tokens.input}
            >
              <option value="All">All Assignees</option>
              {usersList.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {activeFiltersCount > 0 && (
            <div className="sm:hidden lg:col-span-5 flex justify-end">
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===================== TASKS LIST ===================== */}
      <div className={`${tokens.card} overflow-hidden`}>
        {allTasksLoading ? (
          <Loader />
        ) : paginatedTasks.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <HiOutlineClipboardDocumentList className="w-7 h-7" />
            </div>
            <p className="font-semibold text-slate-900 mb-1">No tasks found</p>
            <p className="text-xs text-slate-500">
              Try adjusting your filters or click "Create Task" above.
            </p>
          </div>
        ) : (
          <>
            {/* ---------- MOBILE CARDS (< md) ---------- */}
            <ul className="md:hidden divide-y divide-slate-100">
              {paginatedTasks.map((task) => {
                const delay = calculateDelay(task.dueDate);
                return (
                  <li key={task._id} className="p-4 hover:bg-slate-50/70 transition-colors">
                    {/* Title + Priority */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 text-sm truncate">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <PriorityBadge priority={task.priority} size="xs" />
                    </div>

                    {/* Project + Status */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {task.project?.name || 'General'}
                      </span>
                      <StatusBadge status={task.status} size="xs" />
                    </div>

                    {/* Assignee + Due date */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                          Assignee
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {initials(task.assignedTo?.name)}
                          </div>
                          <span className="text-[11px] font-medium text-slate-700 truncate">
                            {task.assignedTo?.name || 'Unassigned'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                          Due Date
                        </p>
                        <p className="text-[11px] font-medium text-slate-700 mt-0.5">
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString('en-IN')
                            : '—'}
                        </p>
                        {delay && task.status !== 'Completed' && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                            <span className="w-1 h-1 rounded-full bg-rose-500" />
                            {delay}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTask(task);
                          setIsDetailsModalOpen(true);
                        }}
                        className={`${tokens.btnPrimary} flex-1 min-h-[40px] text-xs`}
                      >
                        Details
                      </button>
                      {canDeleteTask && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task)}
                          aria-label="Delete task"
                          className={`${tokens.btnDangerSoft} px-3 min-h-[40px]`}
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* ---------- DESKTOP TABLE (md+) ---------- */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 min-w-[820px]">
                <thead className={tokens.tableHead}>
                  <tr>
                    <th className="px-4 lg:px-5 py-3">Task Title</th>
                    <th className="px-4 lg:px-5 py-3 w-36">Project</th>
                    <th className="px-4 lg:px-5 py-3 w-24">Priority</th>
                    <th className="px-4 lg:px-5 py-3 w-40">Assignee</th>
                    <th className="px-4 lg:px-5 py-3 w-32">Status</th>
                    <th className="px-4 lg:px-5 py-3 w-32">Due Date</th>
                    <th className="px-4 lg:px-5 py-3 w-32 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedTasks.map((task) => {
                    const delay = calculateDelay(task.dueDate);
                    return (
                      <tr key={task._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 lg:px-5 py-3">
                          <div className="font-semibold text-slate-900 text-xs truncate max-w-[220px]">
                            {task.title}
                          </div>
                          {task.description && (
                            <div className="text-[11px] text-slate-500 truncate max-w-[220px] mt-0.5">
                              {task.description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 lg:px-5 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[140px]">
                            {task.project?.name || 'General'}
                          </span>
                        </td>
                        <td className="px-4 lg:px-5 py-3">
                          <PriorityBadge priority={task.priority} />
                        </td>
                        <td className="px-4 lg:px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {initials(task.assignedTo?.name)}
                            </div>
                            <span className="text-xs text-slate-700 truncate">
                              {task.assignedTo?.name || 'Unassigned'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 lg:px-5 py-3">
                          <StatusBadge status={task.status} />
                        </td>
                        <td className="px-4 lg:px-5 py-3">
                          <div className="text-xs text-slate-700 whitespace-nowrap">
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString('en-IN')
                              : '—'}
                          </div>
                          {delay && task.status !== 'Completed' && (
                            <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                              <span className="w-1 h-1 rounded-full bg-rose-500" />
                              {delay}
                            </span>
                          )}
                        </td>
                        <td className="px-4 lg:px-5 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTask(task);
                                setIsDetailsModalOpen(true);
                              }}
                              title="View / Collaborate"
                              className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-colors"
                            >
                              Details
                            </button>
                            {canDeleteTask && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task)}
                                title="Delete Task"
                                aria-label="Delete task"
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <HiOutlineTrash className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ---------- PAGINATION ---------- */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-3 border-t border-slate-200 bg-slate-50">
                <span className="text-xs text-slate-500 text-center sm:text-left">
                  Showing{' '}
                  <strong className="text-slate-700">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </strong>
                  –
                  <strong className="text-slate-700">
                    {Math.min(currentPage * itemsPerPage, filteredTasks.length)}
                  </strong>{' '}
                  of <strong className="text-slate-700">{filteredTasks.length}</strong> tasks
                </span>

                <div className="flex items-center justify-center sm:justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`${tokens.btnSecondary} px-2.5 py-1.5 text-xs`}
                    aria-label="Previous page"
                  >
                    <HiOutlineChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Prev</span>
                  </button>

                  <div className="flex gap-1 max-w-[200px] sm:max-w-none overflow-x-auto">
                    {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                      p === '...' ? (
                        <span
                          key={`dots-${idx}`}
                          className="w-7 h-7 flex items-center justify-center text-xs text-slate-400"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${currentPage === p
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`${tokens.btnSecondary} px-2.5 py-1.5 text-xs`}
                    aria-label="Next page"
                  >
                    <span className="hidden sm:inline mr-1">Next</span>
                    <HiOutlineChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===================== CREATE TASK MODAL ===================== */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-task-title"
        >
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setIsCreateModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl border-0 sm:border border-slate-200 shadow-2xl w-full sm:max-w-xl max-h-[95dvh] sm:max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="min-w-0">
                <h3
                  id="create-task-title"
                  className="text-base sm:text-lg font-bold text-slate-900 truncate"
                >
                  Create New Task
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">
                  Assign a deliverable with priority, dates and files.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 -mr-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors shrink-0"
                aria-label="Close"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit(onSubmitCreate)}
              className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1"
            >
              <div>
                <label className={tokens.label}>Task Title *</label>
                <input
                  type="text"
                  {...register('title', { required: 'Task title is required' })}
                  placeholder="e.g. Implement payment webhook"
                  className={tokens.input}
                />
                {errors.title && <p className={tokens.error}>{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className={tokens.label}>Project *</label>
                  <select
                    {...register('project', { required: 'Project is required' })}
                    className={tokens.input}
                  >
                    <option value="">Select Project</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {errors.project && (
                    <p className={tokens.error}>{errors.project.message}</p>
                  )}
                </div>

                <div>
                  <label className={tokens.label}>Assignee</label>
                  <select {...register('assignedTo')} className={tokens.input}>
                    <option value="">Assign to Myself</option>
                    {usersList.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.designation || u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className={tokens.label}>Priority</label>
                  <select {...register('priority')} className={tokens.input}>
                    <option value="Normal">Normal</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className={tokens.label}>Start Date</label>
                  <input type="date" {...register('startDate')} className={tokens.input} />
                </div>

                <div>
                  <label className={tokens.label}>Due Date</label>
                  <input type="date" {...register('dueDate')} className={tokens.input} />
                </div>
              </div>

              <div>
                <label className={tokens.label}>Description &amp; Requirements</label>
                <textarea
                  rows={4}
                  {...register('description')}
                  placeholder="Outline deliverables, acceptance criteria, or technical details…"
                  className={`${tokens.input} resize-none`}
                />
              </div>

              <div>
                <label className={tokens.label}>Attachments (Optional)</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setTaskAttachments(e.target.files)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:cursor-pointer cursor-pointer"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={createTaskMutation.isPending}
                  className={`${tokens.btnSecondary} px-4 py-2.5 text-sm`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className={`${tokens.btnPrimary} px-4 py-2.5 text-sm`}
                >
                  {createTaskMutation.isPending && (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>
                    {createTaskMutation.isPending ? 'Creating…' : 'Create Task'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== TASK DETAILS & COLLAB MODAL ===================== */}
      {isDetailsModalOpen && selectedTask && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="details-task-title"
        >
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setIsDetailsModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl border-0 sm:border border-slate-200 shadow-2xl w-full sm:max-w-4xl h-[96dvh] sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                  {selectedTask.project?.name || 'General Project'}
                </span>
                <h3
                  id="details-task-title"
                  className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 truncate"
                >
                  {selectedTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-1.5 -mr-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors shrink-0"
                aria-label="Close"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Body — 1 col mobile, 2 col lg */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
              {/* LEFT: description / attachments / comments */}
              <div className="lg:col-span-2 space-y-5">
                {/* Description */}
                {selectedTask.description && (
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Description
                    </h4>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed break-words">
                      {selectedTask.description}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Attachments ({selectedTask.attachments.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedTask.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={`${API_BASE_URL}${att.path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-indigo-300 text-xs text-indigo-700 transition-colors"
                        >
                          <HiOutlinePaperClip className="w-4 h-4 shrink-0 text-slate-400" />
                          <span className="truncate">
                            {att.name || `Attachment ${idx + 1}`}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Comments &amp; Updates ({selectedTask.comments?.length || 0})
                  </h4>

                  <div className="space-y-2.5 mb-3 max-h-[280px] overflow-y-auto pr-1">
                    {selectedTask.comments && selectedTask.comments.length > 0 ? (
                      selectedTask.comments.map((c, i) => (
                        <div
                          key={i}
                          className="bg-slate-50 p-3 rounded-xl border border-slate-200"
                        >
                          <div className="flex justify-between items-center gap-2 mb-1.5">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {c.user?.name || 'User'}
                            </span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                              {new Date(c.createdAt).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed break-words">
                            {c.text}
                          </p>
                          {c.attachment && (
                            <a
                              href={`${API_BASE_URL}${c.attachment}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 mt-2 text-[11px] text-indigo-700 hover:underline"
                            >
                              <HiOutlinePaperClip className="w-3.5 h-3.5" />
                              View Attachment
                            </a>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        No comments yet. Start the conversation below.
                      </p>
                    )}
                  </div>

                  {/* Add Comment Form */}
                  <form onSubmit={handleAddComment} className="flex flex-col gap-2">
                    <textarea
                      rows={2}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a progress update or note…"
                      className={`${tokens.input} resize-none text-xs`}
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <input
                        type="file"
                        onChange={(e) => setCommentAttachment(e.target.files[0])}
                        className="text-[11px] text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                      />
                      <button
                        type="submit"
                        disabled={
                          addCommentMutation.isPending ||
                          (!commentText.trim() && !commentAttachment)
                        }
                        className={`${tokens.btnPrimary} px-3 py-1.5 text-xs self-end sm:self-auto`}
                      >
                        {addCommentMutation.isPending ? 'Posting…' : 'Post Update'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* RIGHT: meta card */}
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3.5">
                  <div>
                    <span className="block text-[11px] text-slate-500 uppercase font-semibold mb-1">
                      Status
                    </span>
                    {canEditTask ? (
                      <select
                        value={selectedTask.status}
                        onChange={(e) =>
                          updateTaskMutation.mutate({
                            taskId: selectedTask._id,
                            payload: { status: e.target.value },
                          })
                        }
                        className={`${tokens.input} text-xs font-medium`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                      </select>
                    ) : (
                      <StatusBadge status={selectedTask.status} />
                    )}
                  </div>

                  <div>
                    <span className="block text-[11px] text-slate-500 uppercase font-semibold mb-1">
                      Priority
                    </span>
                    <PriorityBadge priority={selectedTask.priority} />
                  </div>

                  <div>
                    <span className="block text-[11px] text-slate-500 uppercase font-semibold">
                      Assignee
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {initials(selectedTask.assignedTo?.name)}
                      </div>
                      <span className="text-xs text-slate-900 font-medium truncate">
                        {selectedTask.assignedTo?.name || 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[11px] text-slate-500 uppercase font-semibold">
                      Due Date
                    </span>
                    <span className="text-xs text-slate-900 font-medium mt-1 block">
                      {selectedTask.dueDate
                        ? new Date(selectedTask.dueDate).toLocaleDateString('en-IN')
                        : 'N/A'}
                    </span>
                    {(() => {
                      const d = calculateDelay(selectedTask.dueDate);
                      return d && selectedTask.status !== 'Completed' ? (
                        <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                          <span className="w-1 h-1 rounded-full bg-rose-500" />
                          {d}
                        </span>
                      ) : null;
                    })()}
                  </div>

                  {selectedTask.startDate && (
                    <div>
                      <span className="block text-[11px] text-slate-500 uppercase font-semibold">
                        Start Date
                      </span>
                      <span className="text-xs text-slate-900 font-medium mt-1 block">
                        {new Date(selectedTask.startDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="border-t border-slate-200 px-4 sm:px-5 py-3 flex justify-end bg-white shrink-0">
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className={`${tokens.btnSecondary} px-4 py-2 text-sm`}
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