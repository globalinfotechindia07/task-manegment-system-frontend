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
  HiOutlineClipboardDocumentList
} from 'react-icons/hi2';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';
import { useSocket } from '../../../context/SocketContext';

const TeamLeadReportsPage = () => {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const selectedTaskRef = useRef(null);
  const isDetailsModalOpenRef = useRef(false);

  useEffect(() => {
    selectedTaskRef.current = selectedTask;
    isDetailsModalOpenRef.current = isDetailsModalOpen;
  }, [selectedTask, isDetailsModalOpen]);

  const [commentText, setCommentText] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  
  // Filters
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

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      assignedTo: '',
      startDate: '',
      dueDate: '',
      estimatedTimeDuration: '',
      priority: 'Normal',
      status: 'Pending'
    }
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return data;
    }
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    }
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await api.get('/projects');
      return data;
    }
  });

  // Filter tasks
  const displayedTasks = tasks?.filter(t => {
    // Project filter
    if (selectedProjectId && t.project?._id !== selectedProjectId) return false;
    
    // Assignee filter
    if (selectedUserId && t.assignedTo?._id !== selectedUserId) return false;

    // Status filter
    if (filterStatus && t.status !== filterStatus) return false;

    // Search filter (name or assigned to)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const titleMatch = t.title?.toLowerCase().includes(q);
      const assigneeMatch = t.assignedTo?.name?.toLowerCase().includes(q);
      if (!titleMatch && !assigneeMatch) return false;
    }

    // Date filter
    if (filterDate) {
      const selectedDate = new Date(filterDate).setHours(0,0,0,0);
      const start = t.startDate ? new Date(t.startDate).setHours(0,0,0,0) : null;
      const end = t.dueDate ? new Date(t.dueDate).setHours(0,0,0,0) : null;
      
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
  const paginatedTasks = displayedTasks?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || [];

  const openDetails = async (task) => {
    try {
      const { data } = await api.get(`/tasks/${task._id || task}`);
      setSelectedTask(data);
      setIsDetailsModalOpen(true);
    } catch (error) {
      toast.error('Failed to load task details');
    }
  };

  // Real-time task updates
  useEffect(() => {
    if (socket) {
      const handleTaskUpdated = async (updatedTaskPayload) => {
        queryClient.invalidateQueries(['tasks']);
        if (isDetailsModalOpenRef.current && selectedTaskRef.current?._id === updatedTaskPayload._id) {
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
      setIsTaskModalOpen(false);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create task');
    }
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
    }
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
    }
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
    }
  });

  const onSubmitTask = (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'attachments') {
        if (data.attachments && data.attachments.length > 0) {
          Array.from(data.attachments).forEach(file => {
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
        updateData: { status: e.target.value }
      });
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate({ taskId: selectedTask._id, text: commentText });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Task Management</h1>
          <p className="text-sm text-slate-500">Assign and monitor tasks for specific projects.</p>
        </div>
        
        <button 
          onClick={() => {
            if (!selectedProjectId) {
              toast.error('Please select a project first to assign a task');
              return;
            }
            setEditingTaskId(null);
            reset();
            setIsTaskModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-xs whitespace-nowrap cursor-pointer"
        >
          <HiOutlinePlus className="w-5 h-5" />
          Assign Task
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Project</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="">All Projects</option>
            {projects?.map(p => (
              <option key={p._id} value={p._id}>{p.name} ({p.status})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned To</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="">All Members</option>
            {users?.map(u => (
              <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Search Name</label>
          <input
            type="text"
            placeholder="Task or Assignee Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {tasksLoading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !Array.isArray(displayedTasks) || displayedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-400">
              <HiOutlineClipboardDocumentList className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">No tasks found</h3>
            <p className="text-slate-500 text-xs max-w-sm">Select a project and click "Assign Task" to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Task Name</th>
                  <th className="px-6 py-4">Assigned To</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Start Date</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTasks.map(task => (
                  <tr key={task._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {task.title}
                      {!selectedProjectId && task.project && (
                        <div className="text-xs text-indigo-600 font-normal mt-0.5">{task.project.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-700">{task.assignedTo?.name || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                        task.priority === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        task.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                        task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        task.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{task.startDate ? new Date(task.startDate).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingTaskId(task._id);
                            setSelectedProjectId(task.project?._id || '');
                            setValue('title', task.title);
                            setValue('description', task.description);
                            setValue('assignedTo', task.assignedTo?._id || '');
                            setValue('priority', task.priority);
                            setValue('startDate', task.startDate ? new Date(task.startDate).toISOString().slice(0, 16) : '');
                            setValue('dueDate', task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '');
                            setValue('estimatedTimeDuration', task.estimatedTimeDuration || '');
                            setValue('status', task.status);
                            setIsTaskModalOpen(true);
                          }}
                          className="text-slate-600 hover:text-indigo-600 p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center justify-center cursor-pointer"
                          title="Edit Task"
                        >
                          <HiOutlinePencilSquare className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openDetails(task)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <HiOutlineEye className="w-3.5 h-3.5" />
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to permanently delete task "${task.title}"?`)) {
                              deleteTaskMutation.mutate(task._id);
                            }
                          }}
                          title="Delete Task"
                          className="text-slate-400 hover:text-rose-600 p-1.5 border border-slate-200 rounded-lg hover:bg-rose-50 transition-colors inline-flex items-center justify-center cursor-pointer"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-3 border-t border-slate-200 bg-slate-50 gap-4 text-xs">
                <span className="text-slate-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, displayedTasks.length)} of {displayedTasks.length} entries
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 disabled:opacity-40 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-slate-600 flex items-center font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 disabled:opacity-40 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assign Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsTaskModalOpen(false)}></div>
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 sticky top-0 bg-slate-50 z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{editingTaskId ? 'Edit Task' : 'Assign New Task'}</h3>
                <p className="text-xs text-indigo-600 font-medium mt-0.5">
                  Project: {projects?.find(p => p._id === selectedProjectId)?.name || 'Unknown'}
                </p>
              </div>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-start sm:items-center text-xs">
              <div className="flex items-center text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
                <HiOutlineCalendarDays className="w-4 h-4 text-indigo-600 mr-1.5" />
                <span>Working Days: <strong className="text-slate-900">Mon - Fri</strong></span>
              </div>
              <div className="flex items-center text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
                <HiOutlineClock className="w-4 h-4 text-indigo-600 mr-1.5" />
                <span>Working Hours: <strong className="text-slate-900">9:00 AM - 7:00 PM</strong></span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmitTask)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Name</label>
                <input
                  type="text"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  {...register('title', { required: 'Task Name is required' })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows="3"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"
                  {...register('description', { required: 'Description is required' })}
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
                  <select
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    {...register('assignedTo', { required: 'Please assign to a user' })}
                  >
                    <option value="">Select User</option>
                    {users?.filter(u => u.status !== 'Inactive').map(user => (
                      <option key={user._id} value={user._id}>{user.name} ({user.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    {...register('priority')}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Normal">Normal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    {...register('startDate')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date & Time (Optional)</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    {...register('dueDate')}
                  />
                  <p className="text-xs text-slate-500 mt-1">If blank, it's calculated using estimated hours.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Time Duration (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  {...register('estimatedTimeDuration')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Attachments (Optional)</label>
                <input
                  type="file"
                  multiple
                  className="w-full text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors bg-white border border-slate-300 rounded-lg p-1.5 text-xs"
                  {...register('attachments')}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white pb-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {createTaskMutation.isPending || updateTaskMutation.isPending ? 'Saving...' : (editingTaskId ? 'Update Task' : 'Assign Task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {isDetailsModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsDetailsModalOpen(false)}></div>
          <div className="relative bg-white border-0 sm:border border-slate-200 rounded-none sm:rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 h-[100dvh] sm:h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50 shrink-0">
              <h3 className="text-lg font-bold text-slate-900">{selectedTask.title}</h3>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                <HiOutlineXMark className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Details */}
              <div className="col-span-2 space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Description</h4>
                  <p className="text-slate-800 bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm leading-relaxed">{selectedTask.description}</p>
                </div>

                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Attachments</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.attachments.map((file, i) => (
                        <a key={i} href={`${API_BASE_URL}${file}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-700 transition-colors">
                          <HiOutlinePaperClip className="w-4 h-4 text-slate-400" />
                          Attachment {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-200 pb-2">Comments & Updates</h4>
                  <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto pr-2">
                    {selectedTask.comments?.map((comment, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="font-semibold text-xs text-indigo-700">{comment.user?.name || 'User'}</span>
                          <span className="text-[11px] text-slate-400">{new Date(comment.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-700 text-xs leading-relaxed">{comment.text}</p>
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
                      placeholder="Add a comment or update..."
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={addCommentMutation.isPending || !commentText.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      Send
                    </button>
                  </form>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-200 pb-2">Daily Reports</h4>
                  <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto pr-2">
                    {selectedTask.reports?.map((report, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl border-l-4 border-l-emerald-500">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="font-semibold text-xs text-emerald-700">{report.user?.name || 'User'}</span>
                          <span className="text-[11px] text-slate-400">{new Date(report.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-700 text-xs whitespace-pre-wrap leading-relaxed">{report.description}</p>
                      </div>
                    ))}
                    {(!selectedTask.reports || selectedTask.reports.length === 0) && (
                      <p className="text-slate-400 italic text-xs">No daily reports submitted yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Meta & History */}
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                    <select
                      value={selectedTask.status}
                      onChange={handleUpdateStatus}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:border-indigo-500 outline-none font-medium"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  
                  <div>
                    <span className="block text-xs font-semibold text-slate-500">Assigned To</span>
                    <span className="text-slate-900 text-xs font-medium mt-0.5 block">{selectedTask.assignedTo?.name}</span>
                  </div>
                  
                  <div>
                    <span className="block text-xs font-semibold text-slate-500">Priority</span>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold mt-1 ${
                      selectedTask.priority === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      selectedTask.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {selectedTask.priority}
                    </span>
                  </div>

                  {selectedTask.startDate && (
                    <div>
                      <span className="block text-xs font-semibold text-slate-500">Start Date</span>
                      <span className="text-slate-900 text-xs font-medium mt-0.5 block">{new Date(selectedTask.startDate).toLocaleString()}</span>
                    </div>
                  )}

                  {selectedTask.dueDate && (
                    <div>
                      <span className="block text-xs font-semibold text-slate-500">Due Date</span>
                      <span className="text-slate-900 text-xs font-medium mt-0.5 block">{new Date(selectedTask.dueDate).toLocaleString()}</span>
                    </div>
                  )}
                  
                  {selectedTask.estimatedTimeDuration && (
                    <div>
                      <span className="block text-xs font-semibold text-slate-500">Estimated Duration</span>
                      <span className="text-slate-900 text-xs font-medium mt-0.5 block">{selectedTask.estimatedTimeDuration} Hours</span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-200 pb-2">Activity History</h4>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {selectedTask.history?.slice().reverse().map((log, i) => (
                      <div key={i} className="text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                        <p className="text-slate-700">
                          <span className="font-semibold text-slate-900">{log.user?.name || 'User'}</span> {log.action}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
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