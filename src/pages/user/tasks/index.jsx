import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  HiOutlinePlus, 
  HiOutlineMagnifyingGlass, 
  HiOutlineClipboardDocumentList, 
  HiOutlinePaperClip, 
  HiOutlineXMark,
  HiOutlinePencilSquare,
  HiOutlineCheckCircle
} from 'react-icons/hi2';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';

const UserTasksPage = () => {
  const { user } = useAuth();
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const selectedTaskRef = useRef(null);
  const isDetailsModalOpenRef = useRef(false);

  useEffect(() => {
    selectedTaskRef.current = selectedTask;
    isDetailsModalOpenRef.current = isDetailsModalOpen;
  }, [selectedTask, isDetailsModalOpen]);

  const [commentText, setCommentText] = useState('');
  const [reportText, setReportText] = useState('');
  const [attachments, setAttachments] = useState(null);
  
  // Filter & Pagination States
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProjectId, filterStatus, searchQuery]);
  
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['myDailyTasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks?myTasks=true');
      return data;
    }
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await api.get('/projects');
      return data;
    }
  });

  // Filter tasks by project, status, and search query
  const displayedTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    return tasks.filter(t => {
      if (selectedProjectId && t.project?._id !== selectedProjectId) return false;
      if (filterStatus && t.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = t.title?.toLowerCase().includes(q);
        const projectMatch = t.project?.name?.toLowerCase().includes(q);
        const descMatch = t.description?.toLowerCase().includes(q);
        if (!titleMatch && !projectMatch && !descMatch) return false;
      }
      return true;
    });
  }, [tasks, selectedProjectId, filterStatus, searchQuery]);

  const totalPages = Math.ceil(displayedTasks.length / itemsPerPage);
  const paginatedTasks = displayedTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      project: '',
      startDate: '',
      dueDate: '',
      priority: 'Medium'
    }
  });

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
      queryClient.invalidateQueries({ queryKey: ['myDailyTasks'] });
      setIsTaskModalOpen(false);
      reset();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create task');
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

    formData.append('assignedTo', user._id);
    createTaskMutation.mutate(formData);
  };

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
        queryClient.invalidateQueries({ queryKey: ['myDailyTasks'] });
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
      socket.on('task_assigned', () => {
        queryClient.invalidateQueries(['tasks']);
        queryClient.invalidateQueries({ queryKey: ['myDailyTasks'] });
      });

      return () => {
        socket.off('task_updated', handleTaskUpdated);
        socket.off('task_assigned');
      };
    }
  }, [socket, queryClient]);

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, formData }) => {
      const { data } = await api.put(`/tasks/${taskId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data;
    },
    onSuccess: (updatedTask) => {
      toast.success('Task updated');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['myDailyTasks'] });
      openDetails({ _id: updatedTask._id });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update task');
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
      queryClient.invalidateQueries({ queryKey: ['myDailyTasks'] });
      setSelectedTask(updatedTask);
      setCommentText('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    }
  });

  const addDailyReportMutation = useMutation({
    mutationFn: async ({ taskId, description }) => {
      const { data } = await api.post(`/tasks/${taskId}/reports`, { description });
      return data;
    },
    onSuccess: (updatedTask) => {
      toast.success('Daily report submitted');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['myDailyTasks'] });
      setSelectedTask(updatedTask);
      setReportText('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit report');
    }
  });

  const handleUpdateStatus = (e) => {
    if (selectedTask) {
      const formData = new FormData();
      formData.append('status', e.target.value);
      updateTaskMutation.mutate({ taskId: selectedTask._id, formData });
    }
  };

  const handleFileUpload = (e) => {
    e.preventDefault();
    if (!attachments || attachments.length === 0) {
      toast.error('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    Array.from(attachments).forEach(file => {
      formData.append('attachments', file);
    });

    updateTaskMutation.mutate({ taskId: selectedTask._id, formData });
    setAttachments(null);
    e.target.reset();
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate({ taskId: selectedTask._id, text: commentText });
  };

  const handleAddDailyReport = (e) => {
    e.preventDefault();
    if (!reportText.trim()) return;
    addDailyReportMutation.mutate({ taskId: selectedTask._id, description: reportText });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Daily Tasks</h1>
          <p className="text-sm text-slate-500">Manage and track your assigned tasks.</p>
        </div>
        
        <button
          onClick={() => {
            reset();
            setIsTaskModalOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-xs cursor-pointer"
        >
          <HiOutlinePlus className="w-5 h-5" />
          New Task
        </button>
      </div>
      
      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Filter by Project</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="">All Projects</option>
            {projects?.map(p => (
              <option key={p._id} value={p._id}>{p.name} ({p.status})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
            <option value="Awaiting Approval">Awaiting Approval</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Search Task or Project</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by task title or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
            <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {tasksLoading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : displayedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12">
            <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <HiOutlineClipboardDocumentList className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">No tasks found</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              {tasks?.length === 0 ? "You currently have no tasks assigned to you." : "No tasks match the selected project or filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Task Name</th>
                  <th className="px-6 py-4 font-semibold">Assigned By</th>
                  <th className="px-6 py-4 font-semibold">Priority</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Start Date</th>
                  <th className="px-6 py-4 font-semibold">Due Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTasks.map(task => (
                  <tr key={task._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {task.title}
                      {task.project && (
                        <div className="text-xs text-indigo-600 font-normal mt-0.5">{task.project.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{task.assignedBy?.name || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        task.priority === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        task.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        task.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        task.status === 'On Hold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{task.startDate ? new Date(task.startDate).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4 text-slate-500">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openDetails(task)}
                        className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 px-3 py-1.5 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-medium hover:bg-indigo-50 transition-colors cursor-pointer"
                      >
                        <HiOutlinePencilSquare className="w-4 h-4" />
                        Update Task
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-slate-200 bg-slate-50 gap-4">
                <span className="text-xs text-slate-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, displayedTasks.length)} of {displayedTasks.length} entries
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-xs text-slate-600 font-medium flex items-center">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task Details Modal via Portal */}
      {isDetailsModalOpen && selectedTask && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsDetailsModalOpen(false)}></div>
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 h-[100dvh] sm:h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50 shrink-0">
              <h3 className="text-lg font-bold text-slate-900">{selectedTask.title}</h3>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                <HiOutlineXMark className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Details */}
              <div className="md:col-span-2 space-y-6 min-w-0">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Description</h4>
                  <p className="text-slate-800 bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm leading-relaxed">{selectedTask.description}</p>
                </div>

                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Attachments</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.attachments.map((file, i) => (
                        <a key={i} href={`${API_BASE_URL}${file}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-indigo-600 border border-slate-200 transition-colors">
                          <HiOutlinePaperClip className="w-4 h-4 text-slate-400" />
                          Attachment {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">Upload New File</h4>
                  <form onSubmit={handleFileUpload} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full">
                    <div className="w-full sm:flex-1 min-w-0 overflow-hidden">
                      <input
                        type="file"
                        multiple
                        onChange={(e) => setAttachments(e.target.files)}
                        className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors cursor-pointer bg-white border border-slate-300 rounded-lg p-1.5"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={updateTaskMutation.isPending || !attachments}
                      className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
                    >
                      Upload Files
                    </button>
                  </form>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-100 pb-2">Comments & Updates</h4>
                  <div className="space-y-3 mb-4 max-h-[250px] overflow-y-auto pr-2">
                    {selectedTask.comments?.map((comment, i) => (
                      <div key={i} className="bg-white p-3.5 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-indigo-600 text-xs">{comment.user?.name || 'User'}</span>
                          <span className="text-[11px] text-slate-400">{new Date(comment.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-700 text-xs leading-relaxed">{comment.text}</p>
                      </div>
                    ))}
                    {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                      <p className="text-slate-400 italic text-xs">No comments yet.</p>
                    )}
                  </div>
                  
                  <form onSubmit={handleAddComment} className="flex flex-col sm:flex-row gap-2 w-full">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a progress update..."
                      className="flex-1 min-w-0 bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={addCommentMutation.isPending || !commentText.trim()}
                      className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shrink-0 cursor-pointer shadow-xs"
                    >
                      Send
                    </button>
                  </form>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-100 pb-2">Daily Reports</h4>
                  <div className="space-y-3 mb-4 max-h-[250px] overflow-y-auto pr-2">
                    {selectedTask.reports?.map((report, i) => (
                      <div key={i} className="bg-white p-3.5 rounded-xl border-l-4 border-l-emerald-500 border border-slate-200">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-emerald-600 text-xs">{report.user?.name || 'User'}</span>
                          <span className="text-[11px] text-slate-400">{new Date(report.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-700 text-xs whitespace-pre-wrap leading-relaxed">{report.description}</p>
                      </div>
                    ))}
                    {(!selectedTask.reports || selectedTask.reports.length === 0) && (
                      <p className="text-slate-400 italic text-xs">No daily reports submitted yet.</p>
                    )}
                  </div>
                  
                  <form onSubmit={handleAddDailyReport} className="flex flex-col gap-2 w-full">
                    <textarea
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                      placeholder="What did you do today on this task?"
                      rows="3"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                    ></textarea>
                    <button
                      type="submit"
                      disabled={addDailyReportMutation.isPending || !reportText.trim()}
                      className="self-end px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      Submit Daily Report
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column - Meta & History */}
              <div className="space-y-6 min-w-0">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Update Status</label>
                    <select
                      value={selectedTask.status}
                      onChange={handleUpdateStatus}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:border-indigo-500 outline-none cursor-pointer font-medium"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  
                  <div>
                    <span className="block text-xs font-medium text-slate-500">Assigned By</span>
                    <span className="text-slate-900 text-sm font-semibold">{selectedTask.assignedBy?.name}</span>
                  </div>
                  
                  <div>
                    <span className="block text-xs font-medium text-slate-500 mb-1">Priority</span>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      selectedTask.priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      selectedTask.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {selectedTask.priority}
                    </span>
                  </div>

                  {selectedTask.startDate && (
                    <div>
                      <span className="block text-xs font-medium text-slate-500">Start Date</span>
                      <span className="text-slate-800 text-xs font-medium">{new Date(selectedTask.startDate).toLocaleString()}</span>
                    </div>
                  )}

                  {selectedTask.dueDate && (
                    <div>
                      <span className="block text-xs font-medium text-slate-500">Due Date</span>
                      <span className="text-slate-800 text-xs font-medium">{new Date(selectedTask.dueDate).toLocaleString()}</span>
                    </div>
                  )}
                  
                  {selectedTask.estimatedTimeDuration && (
                    <div>
                      <span className="block text-xs font-medium text-slate-500">Estimated Duration</span>
                      <span className="text-slate-800 text-xs font-medium">{selectedTask.estimatedTimeDuration} Hours</span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-100 pb-2">Activity History</h4>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                    {selectedTask.history?.slice().reverse().map((log, i) => (
                      <div key={i} className="text-xs border-b border-slate-100 pb-2 last:border-0">
                        <p className="text-slate-700 break-words">
                          <span className="font-semibold text-slate-900">{log.user?.name || 'User'}</span> {log.action}
                        </p>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Create Task Modal */}
      {isTaskModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-slate-50 z-10">
              <h2 className="text-lg font-bold text-slate-900">Create New Task</h2>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                <HiOutlineXMark className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmitTask)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title *</label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="E.g., Implement new login page"
                />
                {errors.title && <span className="text-rose-600 text-xs mt-1 block">{errors.title.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                <textarea
                  {...register('description', { required: 'Description is required' })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none h-24 resize-none"
                  placeholder="Detailed task description..."
                ></textarea>
                {errors.description && <span className="text-rose-600 text-xs mt-1 block">{errors.description.message}</span>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Project *</label>
                  <select
                    {...register('project', { required: 'Project is required' })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Select Project</option>
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                  {errors.project && <span className="text-rose-600 text-xs mt-1 block">{errors.project.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    {...register('priority')}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    {...register('startDate', { required: 'Start date is required' })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                  {errors.startDate && <span className="text-rose-600 text-xs mt-1 block">{errors.startDate.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date & Time *</label>
                  <input
                    type="datetime-local"
                    {...register('dueDate', { required: 'End date is required' })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                  {errors.dueDate && <span className="text-rose-600 text-xs mt-1 block">{errors.dueDate.message}</span>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Attachments (Max 5)</label>
                  <input
                    type="file"
                    multiple
                    {...register('attachments')}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors bg-white border border-slate-300 rounded-lg p-1.5"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 mt-6">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 rounded-lg transition-colors font-medium text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors shadow-xs font-medium text-sm flex items-center gap-2 cursor-pointer"
                >
                  {createTaskMutation.isPending && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  )}
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UserTasksPage;