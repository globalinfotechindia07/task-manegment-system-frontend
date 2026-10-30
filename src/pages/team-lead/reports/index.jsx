import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineEye,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlinePaperClip,
  HiOutlineClipboardDocumentList,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineFunnel,
  HiOutlineUser,
} from 'react-icons/hi2';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';
import { useSocket } from '../../../context/SocketContext';

/* ============================================================
   DESIGN TOKENS (same as all other pages)
   ============================================================ */
const tokens = {
  btnPrimary:
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg bg-indigo-600 text-white shadow-sm ' +
    'hover:bg-indigo-700 active:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ' +
    'transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  btnSecondary:
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg bg-white text-slate-700 border border-slate-300 shadow-sm ' +
    'hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  btnDangerSoft:
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 ' +
    'hover:bg-rose-100 transition-colors cursor-pointer',
  btnEditSoft:
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 ' +
    'hover:bg-indigo-100 transition-colors cursor-pointer',
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
const statusStyles = {
  Completed: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  'In Progress': { badge: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  'On Hold': { badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  Pending: { badge: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
};

const priorityStyles = {
  High: 'bg-rose-50 text-rose-700 border-rose-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Normal: 'bg-blue-50 text-blue-700 border-blue-200',
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

const PriorityBadge = ({ priority, size = 'sm' }) => {
  const c = priorityStyles[priority] || priorityStyles.Normal;
  const pad = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';
  return (
    <span className={`inline-flex items-center rounded-full border font-semibold whitespace-nowrap ${c} ${pad}`}>
      {priority || 'Normal'}
    </span>
  );
};

/* ============================================================
   HELPERS
   ============================================================ */
const Loader = () => (
  <div className="flex justify-center items-center py-12">
    <div className="w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
  </div>
);

const EmptyState = () => (
  <div className="py-12 px-6 text-center">
    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
      <HiOutlineClipboardDocumentList className="w-7 h-7" />
    </div>
    <h3 className="text-base font-semibold text-slate-900 mb-1">No tasks found</h3>
    <p className="text-slate-500 text-xs max-w-sm mx-auto">
      Select a project and click "Assign Task" to get started.
    </p>
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

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '-');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN') : '-');

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const TeamLeadReportsPage = () => {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const selectedTaskRef = useRef(null);
  const isDetailsModalOpenRef = useRef(false);

  // Mobile filter toggle
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    selectedTaskRef.current = selectedTask;
    isDetailsModalOpenRef.current = isDetailsModalOpen;
  }, [selectedTask, isDetailsModalOpen]);

  const [commentText, setCommentText] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProjectId, selectedUserId, filterStatus, searchQuery, filterDate]);

  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      assignedTo: '',
      startDate: '',
      dueDate: '',
      estimatedTimeDuration: '',
      priority: 'Normal',
      status: 'Pending',
    },
  });

  /* ---------------- Queries (UNCHANGED) ---------------- */
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await api.get('/projects');
      return data;
    },
  });

  /* ---------------- Filtering (UNCHANGED) ---------------- */
  const displayedTasks = tasks?.filter((t) => {
    if (selectedProjectId && t.project?._id !== selectedProjectId) return false;
    if (selectedUserId && t.assignedTo?._id !== selectedUserId) return false;
    if (filterStatus && t.status !== filterStatus) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const titleMatch = t.title?.toLowerCase().includes(q);
      const assigneeMatch = t.assignedTo?.name?.toLowerCase().includes(q);
      if (!titleMatch && !assigneeMatch) return false;
    }

    if (filterDate) {
      const selectedDate = new Date(filterDate).setHours(0, 0, 0, 0);
      const start = t.startDate ? new Date(t.startDate).setHours(0, 0, 0, 0) : null;
      const end = t.dueDate ? new Date(t.dueDate).setHours(0, 0, 0, 0) : null;
      if (start && end) {
        if (selectedDate < start || selectedDate > end) return false;
      } else if (start) {
        if (selectedDate !== start) return false;
      } else if (end) {
        if (selectedDate !== end) return false;
      } else {
        return false;
      }
    }
    return true;
  });

  const totalPages = Math.ceil((displayedTasks?.length || 0) / itemsPerPage);
  const paginatedTasks =
    displayedTasks?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || [];

  /* ---------------- Handlers (UNCHANGED) ---------------- */
  const openDetails = async (task) => {
    try {
      const { data } = await api.get(`/tasks/${task._id || task}`);
      setSelectedTask(data);
      setIsDetailsModalOpen(true);
    } catch (error) {
      toast.error('Failed to load task details');
    }
  };

  /* ---------------- Socket (UNCHANGED) ---------------- */
  useEffect(() => {
    if (socket) {
      const handleTaskUpdated = async (updatedTaskPayload) => {
        queryClient.invalidateQueries(['tasks']);
        if (
          isDetailsModalOpenRef.current &&
          selectedTaskRef.current?._id === updatedTaskPayload._id
        ) {
          try {
            const { data } = await api.get(`/tasks/${updatedTaskPayload._id}`);
            setSelectedTask(data);
          } catch (error) {
            console.error('Failed to auto-refresh task details', error);
          }
        }
      };

      socket.on('task_updated', handleTaskUpdated);
      socket.on('task_created', () => {
        queryClient.invalidateQueries(['tasks']);
      });

      return () => {
        socket.off('task_updated', handleTaskUpdated);
        socket.off('task_created');
      };
    }
  }, [socket, queryClient]);

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
      setIsTaskModalOpen(false);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create task');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updateData }) => {
      const { data } = await api.put(`/tasks/${taskId}`, updateData);
      return data;
    },
    onSuccess: (updatedTask) => {
      toast.success('Task updated');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSelectedTask(updatedTask);
      setIsTaskModalOpen(false);
      setEditingTaskId(null);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update task');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      const { data } = await api.delete(`/tasks/${taskId}`);
      return data;
    },
    onSuccess: () => {
      toast.success('Task deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsDetailsModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ taskId, text }) => {
      const { data } = await api.post(`/tasks/${taskId}/comments`, { text });
      return data;
    },
    onSuccess: (updatedTask) => {
      toast.success('Comment added');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSelectedTask(updatedTask);
      setCommentText('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    },
  });

  const onSubmitTask = (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (key === 'attachments') {
        if (data.attachments && data.attachments.length > 0) {
          Array.from(data.attachments).forEach((file) => {
            formData.append('attachments', file);
          });
        }
      } else {
        formData.append(key, data[key]);
      }
    });
    formData.append('project', selectedProjectId);

    if (editingTaskId) {
      updateTaskMutation.mutate({ taskId: editingTaskId, updateData: formData });
    } else {
      createTaskMutation.mutate(formData);
    }
  };

  const handleUpdateStatus = (e) => {
    if (selectedTask) {
      updateTaskMutation.mutate({
        taskId: selectedTask._id,
        updateData: { status: e.target.value },
      });
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate({ taskId: selectedTask._id, text: commentText });
  };

  const handleEditTask = (task) => {
    setEditingTaskId(task._id);
    setSelectedProjectId(task.project?._id || '');
    setValue('title', task.title);
    setValue('description', task.description);
    setValue('assignedTo', task.assignedTo?._id || '');
    setValue('priority', task.priority);
    setValue(
      'startDate',
      task.startDate ? new Date(task.startDate).toISOString().slice(0, 16) : ''
    );
    setValue(
      'dueDate',
      task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ''
    );
    setValue('estimatedTimeDuration', task.estimatedTimeDuration || '');
    setValue('status', task.status);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (task) => {
    if (window.confirm(`Are you sure you want to permanently delete task "${task.title}"?`)) {
      deleteTaskMutation.mutate(task._id);
    }
  };

  /* ---------------- ESC to close modals ---------------- */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (isTaskModalOpen) setIsTaskModalOpen(false);
        if (isDetailsModalOpen) setIsDetailsModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isTaskModalOpen, isDetailsModalOpen]);

  const isSavingTask = createTaskMutation.isPending || updateTaskMutation.isPending;
  const activeFiltersCount =
    (selectedProjectId ? 1 : 0) +
    (selectedUserId ? 1 : 0) +
    (filterStatus ? 1 : 0) +
    (filterDate ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const clearFilters = () => {
    setSelectedProjectId('');
    setSelectedUserId('');
    setFilterStatus('');
    setFilterDate('');
    setSearchQuery('');
  };

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-6">
      {/* ===================== HEADER ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
            Task Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Assign and monitor tasks for specific projects.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!selectedProjectId) {
              toast.error('Please select a project first to assign a task');
              return;
            }
            setEditingTaskId(null);
            reset();
            setIsTaskModalOpen(true);
          }}
          className={`${tokens.btnPrimary} w-full sm:w-auto px-4 py-2.5 text-sm`}
        >
          <HiOutlinePlus className="w-4 h-4" />
          <span>Assign Task</span>
        </button>
      </div>

      {/* ===================== FILTER BAR ===================== */}
      <div className={tokens.card}>
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
            <label className={tokens.label}>Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className={tokens.input}
            >
              <option value="">All Projects</option>
              {projects?.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.status})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={tokens.label}>Assigned To</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className={tokens.input}
            >
              <option value="">All Members</option>
              {users?.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={tokens.label}>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={tokens.input}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
          <div>
            <label className={tokens.label}>Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className={tokens.input}
            />
          </div>
          <div>
            <label className={tokens.label}>Search</label>
            <input
              type="text"
              placeholder="Task or Assignee…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={tokens.input}
            />
          </div>
        </div>
      </div>

      {/* ===================== LIST ===================== */}
      <div className={`${tokens.card} overflow-hidden`}>
        {tasksLoading ? (
          <Loader />
        ) : !Array.isArray(displayedTasks) || displayedTasks.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* ---------- MOBILE CARDS ---------- */}
            <ul className="md:hidden divide-y divide-slate-100">
              {paginatedTasks.map((task) => (
                <li key={task._id} className="p-4 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 text-sm truncate">
                        {task.title}
                      </p>
                      {!selectedProjectId && task.project && (
                        <p className="text-[11px] text-indigo-600 font-medium mt-0.5 truncate">
                          {task.project.name}
                        </p>
                      )}
                    </div>
                    <PriorityBadge priority={task.priority} size="xs" />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                      <HiOutlineUser className="w-3.5 h-3.5 text-slate-400" />
                      {task.assignedTo?.name || 'Unknown'}
                    </span>
                    <StatusBadge status={task.status} size="xs" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                        Start
                      </p>
                      <p className="text-[11px] font-medium text-slate-700 mt-0.5">
                        {fmtDate(task.startDate)}
                      </p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                        Due
                      </p>
                      <p className="text-[11px] font-medium text-slate-700 mt-0.5">
                        {fmtDate(task.dueDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditTask(task)}
                      className={`${tokens.btnEditSoft} flex-1 min-h-[40px] text-xs`}
                    >
                      <HiOutlinePencilSquare className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => openDetails(task)}
                      className={`${tokens.btnPrimary} flex-1 min-h-[40px] text-xs`}
                    >
                      <HiOutlineEye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task)}
                      className={`${tokens.btnDangerSoft} px-3 min-h-[40px]`}
                      aria-label="Delete task"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* ---------- DESKTOP TABLE ---------- */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 min-w-[820px]">
                <thead className={tokens.tableHead}>
                  <tr>
                    <th className="px-4 lg:px-5 py-3">Task Name</th>
                    <th className="px-4 lg:px-5 py-3">Assigned To</th>
                    <th className="px-4 lg:px-5 py-3 w-24">Priority</th>
                    <th className="px-4 lg:px-5 py-3 w-32">Status</th>
                    <th className="px-4 lg:px-5 py-3 w-28 whitespace-nowrap">Start Date</th>
                    <th className="px-4 lg:px-5 py-3 w-28 whitespace-nowrap">Due Date</th>
                    <th className="px-4 lg:px-5 py-3 w-44 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedTasks.map((task) => (
                    <tr key={task._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 lg:px-5 py-3">
                        <span className="font-semibold text-slate-900 text-xs block truncate max-w-[220px]">
                          {task.title}
                        </span>
                        {!selectedProjectId && task.project && (
                          <span className="text-[11px] text-indigo-600 font-medium mt-0.5 block truncate max-w-[220px]">
                            {task.project.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 lg:px-5 py-3 text-xs text-slate-700 truncate max-w-[150px]">
                        {task.assignedTo?.name || 'Unknown'}
                      </td>
                      <td className="px-4 lg:px-5 py-3">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="px-4 lg:px-5 py-3">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-4 lg:px-5 py-3 text-xs text-slate-600 whitespace-nowrap">
                        {fmtDate(task.startDate)}
                      </td>
                      <td className="px-4 lg:px-5 py-3 text-xs text-slate-600 whitespace-nowrap">
                        {fmtDate(task.dueDate)}
                      </td>
                      <td className="px-4 lg:px-5 py-3">
                        <div className="flex justify-end items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditTask(task)}
                            title="Edit Task"
                            aria-label="Edit task"
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <HiOutlinePencilSquare className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDetails(task)}
                            title="View Details"
                            aria-label="View task details"
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <HiOutlineEye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task)}
                            title="Delete Task"
                            aria-label="Delete task"
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
                    {Math.min(currentPage * itemsPerPage, displayedTasks.length)}
                  </strong>{' '}
                  of <strong className="text-slate-700">{displayedTasks.length}</strong> entries
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

      {/* ===================== ASSIGN / EDIT TASK MODAL ===================== */}
      {isTaskModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-modal-title"
        >
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setIsTaskModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl border-0 sm:border border-slate-200 shadow-2xl w-full sm:max-w-2xl max-h-[95dvh] sm:max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="min-w-0">
                <h3
                  id="task-modal-title"
                  className="text-base sm:text-lg font-bold text-slate-900 truncate"
                >
                  {editingTaskId ? 'Edit Task' : 'Assign New Task'}
                </h3>
                <p className="text-[11px] sm:text-xs text-indigo-600 font-medium mt-0.5 truncate">
                  Project:{' '}
                  {projects?.find((p) => p._id === selectedProjectId)?.name || 'Unknown'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1.5 -mr-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors shrink-0"
                aria-label="Close"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Working info bar */}
            <div className="bg-slate-50 px-4 sm:px-5 py-2.5 border-b border-slate-200 flex flex-wrap gap-2 text-[11px] shrink-0">
              <div className="flex items-center text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                <HiOutlineCalendarDays className="w-3.5 h-3.5 text-indigo-600 mr-1.5 shrink-0" />
                <span>
                  Working Days: <strong className="text-slate-900">Mon - Fri</strong>
                </span>
              </div>
              <div className="flex items-center text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                <HiOutlineClock className="w-3.5 h-3.5 text-indigo-600 mr-1.5 shrink-0" />
                <span>
                  Hours: <strong className="text-slate-900">9:00 AM - 7:00 PM</strong>
                </span>
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit(onSubmitTask)}
              className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1"
            >
              <div>
                <label className={tokens.label}>Task Name *</label>
                <input
                  type="text"
                  className={tokens.input}
                  placeholder="e.g. Build login page"
                  {...register('title', { required: 'Task Name is required' })}
                />
                {errors.title && <p className={tokens.error}>{errors.title.message}</p>}
              </div>

              <div>
                <label className={tokens.label}>Description *</label>
                <textarea
                  rows="3"
                  className={`${tokens.input} resize-none`}
                  placeholder="What needs to be done…"
                  {...register('description', { required: 'Description is required' })}
                />
                {errors.description && (
                  <p className={tokens.error}>{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className={tokens.label}>Assign To *</label>
                  <select
                    className={tokens.input}
                    {...register('assignedTo', { required: 'Please assign to a user' })}
                  >
                    <option value="">Select User</option>
                    {users
                      ?.filter((u) => u.status !== 'Inactive')
                      .map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.role})
                        </option>
                      ))}
                  </select>
                  {errors.assignedTo && (
                    <p className={tokens.error}>{errors.assignedTo.message}</p>
                  )}
                </div>
                <div>
                  <label className={tokens.label}>Priority</label>
                  <select className={tokens.input} {...register('priority')}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Normal">Normal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className={tokens.label}>Start Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    className={tokens.input}
                    {...register('startDate')}
                  />
                </div>
                <div>
                  <label className={tokens.label}>Due Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    className={tokens.input}
                    {...register('dueDate')}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    If blank, it's calculated using estimated hours.
                  </p>
                </div>
              </div>

              <div>
                <label className={tokens.label}>Estimated Time Duration (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  className={tokens.input}
                  placeholder="e.g. 4.5"
                  {...register('estimatedTimeDuration')}
                />
              </div>

              <div>
                <label className={tokens.label}>Attachments (Optional)</label>
                <input
                  type="file"
                  multiple
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:cursor-pointer cursor-pointer"
                  {...register('attachments')}
                />
              </div>

              {/* Footer */}
              <div className="pt-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  disabled={isSavingTask}
                  className={`${tokens.btnSecondary} px-4 py-2.5 text-sm`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTask}
                  className={`${tokens.btnPrimary} px-4 py-2.5 text-sm`}
                >
                  {isSavingTask && (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>
                    {isSavingTask
                      ? 'Saving…'
                      : editingTaskId
                        ? 'Update Task'
                        : 'Assign Task'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== TASK DETAILS MODAL ===================== */}
      {isDetailsModalOpen && selectedTask && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="details-modal-title"
        >
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setIsDetailsModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl border-0 sm:border border-slate-200 shadow-2xl w-full sm:max-w-4xl h-[96dvh] sm:h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="min-w-0 flex-1">
                <h3
                  id="details-modal-title"
                  className="text-base sm:text-lg font-bold text-slate-900 truncate"
                >
                  {selectedTask.title}
                </h3>
                {selectedTask.project && (
                  <p className="text-[11px] text-indigo-600 font-medium mt-0.5 truncate">
                    {selectedTask.project.name}
                  </p>
                )}
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

            {/* Body — 1 col mobile, 3 col lg */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              {/* LEFT: description, attachments, comments, reports */}
              <div className="md:col-span-2 space-y-5 sm:space-y-6">
                {/* Description */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Description
                  </h4>
                  <p className="text-slate-800 bg-slate-50 border border-slate-200 p-3 sm:p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {selectedTask.description || '—'}
                  </p>
                </div>

                {/* Attachments */}
                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Attachments ({selectedTask.attachments.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.attachments.map((file, i) => (
                        <a
                          key={i}
                          href={`${API_BASE_URL}${file}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-700 transition-colors"
                        >
                          <HiOutlinePaperClip className="w-3.5 h-3.5 text-slate-400" />
                          Attachment {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-200 pb-2">
                    Comments &amp; Updates ({selectedTask.comments?.length || 0})
                  </h4>
                  <div className="space-y-2.5 mb-3 max-h-[280px] overflow-y-auto pr-1">
                    {selectedTask.comments?.map((comment, i) => (
                      <div
                        key={i}
                        className="bg-slate-50 border border-slate-200 p-3 rounded-xl"
                      >
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <span className="font-semibold text-xs text-indigo-700 truncate">
                            {comment.user?.name || 'User'}
                          </span>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                            {fmtDateTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap break-words">
                          {comment.text}
                        </p>
                      </div>
                    ))}
                    {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                      <p className="text-slate-400 italic text-xs">No comments yet.</p>
                    )}
                  </div>

                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment or update…"
                      className={`${tokens.input} flex-1 text-xs`}
                    />
                    <button
                      type="submit"
                      disabled={addCommentMutation.isPending || !commentText.trim()}
                      className={`${tokens.btnPrimary} px-4 text-xs`}
                    >
                      {addCommentMutation.isPending ? '…' : 'Send'}
                    </button>
                  </form>
                </div>

                {/* Daily Reports */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-200 pb-2">
                    Daily Reports ({selectedTask.reports?.length || 0})
                  </h4>
                  <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                    {selectedTask.reports?.map((report, i) => (
                      <div
                        key={i}
                        className="bg-slate-50 border border-slate-200 p-3 rounded-xl border-l-4 border-l-emerald-500"
                      >
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <span className="font-semibold text-xs text-emerald-700 truncate">
                            {report.user?.name || 'User'}
                          </span>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                            {new Date(report.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <p className="text-slate-700 text-xs whitespace-pre-wrap leading-relaxed break-words">
                          {report.description}
                        </p>
                      </div>
                    ))}
                    {(!selectedTask.reports || selectedTask.reports.length === 0) && (
                      <p className="text-slate-400 italic text-xs">
                        No daily reports submitted yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT: meta + history */}
              <div className="space-y-5 sm:space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3.5">
                  <div>
                    <label className={tokens.label}>Status</label>
                    <select
                      value={selectedTask.status}
                      onChange={handleUpdateStatus}
                      className={`${tokens.input} text-xs font-medium`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Assigned To
                    </span>
                    <span className="text-slate-900 text-xs font-medium mt-0.5 block">
                      {selectedTask.assignedTo?.name || 'Unknown'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Priority
                    </span>
                    <div className="mt-1">
                      <PriorityBadge priority={selectedTask.priority} />
                    </div>
                  </div>

                  {selectedTask.startDate && (
                    <div>
                      <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Start Date
                      </span>
                      <span className="text-slate-900 text-xs font-medium mt-0.5 block">
                        {fmtDateTime(selectedTask.startDate)}
                      </span>
                    </div>
                  )}

                  {selectedTask.dueDate && (
                    <div>
                      <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Due Date
                      </span>
                      <span className="text-slate-900 text-xs font-medium mt-0.5 block">
                        {fmtDateTime(selectedTask.dueDate)}
                      </span>
                    </div>
                  )}

                  {selectedTask.estimatedTimeDuration && (
                    <div>
                      <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Estimated Duration
                      </span>
                      <span className="text-slate-900 text-xs font-medium mt-0.5 block">
                        {selectedTask.estimatedTimeDuration} Hours
                      </span>
                    </div>
                  )}
                </div>

                {/* History */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-200 pb-2">
                    Activity History
                  </h4>
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {selectedTask.history?.slice().reverse().map((log, i) => (
                      <div
                        key={i}
                        className="text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-lg"
                      >
                        <p className="text-slate-700">
                          <span className="font-semibold text-slate-900">
                            {log.user?.name || 'User'}
                          </span>{' '}
                          {log.action}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          {fmtDateTime(log.createdAt)}
                        </span>
                      </div>
                    ))}
                    {(!selectedTask.history || selectedTask.history.length === 0) && (
                      <p className="text-slate-400 italic text-xs">No activity yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamLeadReportsPage;