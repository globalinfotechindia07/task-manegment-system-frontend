import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';

const UserReportsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('All');
  const [selectedUserId, setSelectedUserId] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterPeriod, setFilterPeriod] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [commentText, setCommentText] = useState('');

  const selectedTaskRef = useRef(null);
  const isDetailsModalOpenRef = useRef(false);

  useEffect(() => {
    selectedTaskRef.current = selectedTask;
    isDetailsModalOpenRef.current = isDetailsModalOpen;
  }, [selectedTask, isDetailsModalOpen]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProjectId, selectedUserId, filterStatus, filterPriority, filterPeriod, searchQuery]);

  // 1. Fetch All Tasks across Projects & Users
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return data;
    }
  });

  // 2. Fetch All Projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await api.get('/projects');
      return data;
    }
  });

  // 3. Fetch All Users for Assignee Filter
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    }
  });

  // Real-time synchronization via Socket.IO
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

  // Add Comment Mutation for collaboration
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

  const openDetails = async (task) => {
    try {
      const { data } = await api.get(`/tasks/${task._id || task}`);
      setSelectedTask(data);
      setIsDetailsModalOpen(true);
    } catch (error) {
      toast.error('Failed to load task details');
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTask) return;
    addCommentMutation.mutate({ taskId: selectedTask._id, text: commentText });
  };

  // Filter Tasks logic
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // 1. Project filter
      if (selectedProjectId !== 'All' && task.project?._id !== selectedProjectId) {
        return false;
      }

      // 2. Assignee filter
      if (selectedUserId === 'ME') {
        if (task.assignedTo?._id !== user?._id) return false;
      } else if (selectedUserId !== 'All' && task.assignedTo?._id !== selectedUserId) {
        return false;
      }

      // 3. Status filter
      if (filterStatus !== 'All' && task.status !== filterStatus) {
        return false;
      }

      // 4. Priority filter
      if (filterPriority !== 'All' && task.priority !== filterPriority) {
        return false;
      }

      // 5. Time Period filter
      if (filterPeriod !== 'All' && task.updatedAt) {
        const updatedDate = new Date(task.updatedAt);
        const now = new Date();
        const diffTime = Math.abs(now - updatedDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (filterPeriod === 'Daily' && diffDays > 1) return false;
        if (filterPeriod === 'Weekly' && diffDays > 7) return false;
        if (filterPeriod === 'Monthly' && diffDays > 30) return false;
      }

      // 6. Search Query (title, project name, or assignee name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = task.title?.toLowerCase().includes(q);
        const projectMatch = task.project?.name?.toLowerCase().includes(q);
        const assigneeMatch = task.assignedTo?.name?.toLowerCase().includes(q);
        if (!titleMatch && !projectMatch && !assigneeMatch) return false;
      }

      return true;
    });
  }, [tasks, selectedProjectId, selectedUserId, filterStatus, filterPriority, filterPeriod, searchQuery, user?._id]);

  // Stats calculation
  const total = filteredTasks.length;
  const completed = filteredTasks.filter(t => t.status === 'Completed').length;
  const inProgress = filteredTasks.filter(t => t.status === 'In Progress').length;
  const pendingHold = filteredTasks.filter(t => t.status === 'Pending' || t.status === 'On Hold' || t.status === 'Awaiting Approval').length;
  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Pagination
  const totalPages = Math.ceil(total / itemsPerPage);
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Selected Project details for overview header
  const currentProject = projects.find(p => p._id === selectedProjectId);

  // Export to CSV
  const exportToCSV = () => {
    if (filteredTasks.length === 0) {
      toast.error('No tasks to export');
      return;
    }
    const headers = ['Task Name', 'Project', 'Assigned To', 'Department', 'Status', 'Priority', 'Start Date', 'Due Date', 'Last Updated'];
    const csvRows = [headers.join(',')];

    filteredTasks.forEach(task => {
      const row = [
        `"${task.title || ''}"`,
        `"${task.project?.name || 'N/A'}"`,
        `"${task.assignedTo?.name || 'Unassigned'}"`,
        `"${task.assignedTo?.department || 'N/A'}"`,
        task.status || '',
        task.priority || '',
        task.startDate ? new Date(task.startDate).toLocaleDateString() : 'N/A',
        task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A',
        task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : 'N/A'
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `Task_Progress_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (isLoadingTasks || isLoadingProjects) {
    return (
      <div className="p-12 flex justify-center items-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>Task & Project Reports</span>
            <span className="text-xs bg-indigo-500/20 text-indigo-400 font-medium px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              Team Visibility
            </span>
          </h1>
          <p className="text-slate-400 mt-1">
            Track project progress, check team workloads, and view each member's tasks and reports.
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20 self-start md:self-auto flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Progress & Stat Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Project Focus</span>
              {currentProject && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  currentProject.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
                }`}>
                  {currentProject.status}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white mt-0.5">
              {currentProject ? currentProject.name : 'All Company Projects'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentProject?.description || 'Showing task breakdown across every active project and team member.'}
            </p>
          </div>

          {/* Progress Bar Display */}
          <div className="w-full lg:w-72 bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
            <div className="flex justify-between items-center text-xs font-medium mb-1.5">
              <span className="text-slate-300">Completion Progress</span>
              <span className="text-indigo-400 font-bold text-sm">{completionPercentage}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1.5">
              <span>{completed} Completed</span>
              <span>{total - completed} Remaining</span>
            </div>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
            <span className="text-xs font-medium text-slate-400">Total Tasks</span>
            <p className="text-2xl font-bold text-white mt-1">{total}</p>
          </div>
          <div className="bg-slate-800/40 p-4 rounded-xl border border-emerald-500/30">
            <span className="text-xs font-medium text-emerald-400">Completed</span>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{completed}</p>
          </div>
          <div className="bg-slate-800/40 p-4 rounded-xl border border-indigo-500/30">
            <span className="text-xs font-medium text-indigo-400">In Progress</span>
            <p className="text-2xl font-bold text-indigo-400 mt-1">{inProgress}</p>
          </div>
          <div className="bg-slate-800/40 p-4 rounded-xl border border-amber-500/30">
            <span className="text-xs font-medium text-amber-400">Pending / Hold</span>
            <p className="text-2xl font-bold text-amber-400 mt-1">{pendingHold}</p>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Project Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Project</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none appearance-none"
          >
            <option value="All">All Projects</option>
            {projects.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Assignee / Member Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Assigned To</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none appearance-none"
          >
            <option value="All">All Team Members</option>
            <option value="ME">My Tasks Only</option>
            {users.map(u => (
              <option key={u._id} value={u._id}>
                {u.name} {u.department ? `(${u.department})` : `(${u.role})`}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none appearance-none"
          >
            <option value="All">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="On Hold">On Hold</option>
            <option value="Awaiting Approval">Awaiting Approval</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Priority</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none appearance-none"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Normal">Normal</option>
          </select>
        </div>

        {/* Live Search Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Search Task / Person</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search title, member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Task List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white">Project Tasks & Progress</h3>
            <p className="text-xs text-slate-400">Click "View Details" to see daily reports, discussion comments, and attachments.</p>
          </div>
          <span className="text-xs font-medium text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} found
          </span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-base font-medium text-slate-300">No tasks match your filters</p>
            <p className="text-xs text-slate-500 mt-1">Try selecting "All Projects" or clearing the search box.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-slate-200 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Task & Project</th>
                  <th className="px-6 py-4 font-semibold">Assigned To</th>
                  <th className="px-6 py-4 font-semibold">Priority</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Due Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {paginatedTasks.map(task => {
                  const isOverdue = task.status !== 'Completed' && task.dueDate && new Date(task.dueDate) < new Date();
                  return (
                    <tr key={task._id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Task Name & Project Badge */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-white max-w-xs truncate" title={task.title}>
                          {task.title}
                        </div>
                        {task.project && (
                          <span className="inline-block mt-1 text-[11px] font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            {task.project.name}
                          </span>
                        )}
                      </td>

                      {/* Assigned To */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 font-semibold text-xs flex items-center justify-center border border-indigo-500/40 shrink-0">
                            {task.assignedTo?.name ? task.assignedTo.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm leading-tight">
                              {task.assignedTo?.name || 'Unassigned'}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              {task.assignedTo?.department || task.assignedTo?.role || ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                          task.priority === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          task.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                          'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {task.priority || 'Normal'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                          task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          task.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                          task.status === 'Awaiting Approval' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          task.status === 'On Hold' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                          'bg-slate-500/10 text-slate-300 border border-slate-500/20'
                        }`}>
                          {task.status}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="px-6 py-4">
                        {task.dueDate ? (
                          <div>
                            <span className={`text-sm ${isOverdue ? 'text-red-400 font-semibold' : 'text-slate-300'}`}>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                            {isOverdue && (
                              <span className="block text-[10px] text-red-400 uppercase font-bold tracking-wider">
                                Overdue
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* View Details Action */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openDetails(task)}
                          className="text-indigo-400 hover:text-indigo-300 px-3 py-1.5 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/10 transition-colors text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-slate-800 bg-slate-900/60 gap-4">
                <span className="text-xs text-slate-400">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, total)} of {total} tasks
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 disabled:opacity-50 hover:bg-slate-700 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-xs text-slate-400 flex items-center">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 disabled:opacity-50 hover:bg-slate-700 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task Details Modal (Full Inspection & Daily Reports) */}
      {isDetailsModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm" onClick={() => setIsDetailsModalOpen(false)}></div>
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>{selectedTask.title}</span>
                </h3>
                {selectedTask.project && (
                  <p className="text-xs text-indigo-400 mt-1">
                    Project: <span className="font-semibold text-white">{selectedTask.project.name}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Description, Attachments, Daily Reports, Comments */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
                  <div className="text-slate-200 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedTask.description}
                  </div>
                </div>

                {/* Attachments */}
                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Attachments</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.attachments.map((file, i) => (
                        <a
                          key={i}
                          href={`${API_BASE_URL}${file}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-xs font-medium text-indigo-400 border border-slate-700 transition-colors"
                        >
                          <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          Attachment {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Daily Work Reports (Employee Progress logs) */}
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Daily Work Reports ({selectedTask.reports?.length || 0})
                  </h4>
                  <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2">
                    {selectedTask.reports && selectedTask.reports.length > 0 ? (
                      selectedTask.reports.map((report, i) => (
                        <div key={i} className="bg-slate-800/80 p-4 rounded-xl border-l-4 border-emerald-500 shadow-sm">
                          <div className="flex justify-between items-start mb-1.5">
                            <span className="font-semibold text-emerald-400 text-sm">{report.user?.name || 'Assignee'}</span>
                            <span className="text-xs text-slate-500">{new Date(report.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{report.description}</p>
                        </div>
                      ))
                    ) : (
                      <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 text-slate-500 italic text-sm">
                        No daily reports submitted yet for this task.
                      </div>
                    )}
                  </div>
                </div>

                {/* Comments & Discussion */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">
                    Discussion & Comments
                  </h4>
                  <div className="space-y-3 mb-4 max-h-[220px] overflow-y-auto pr-2">
                    {selectedTask.comments && selectedTask.comments.length > 0 ? (
                      selectedTask.comments.map((comment, i) => (
                        <div key={i} className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/60">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-indigo-400 text-xs">{comment.user?.name || 'User'}</span>
                            <span className="text-[11px] text-slate-500">{new Date(comment.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-300 text-sm">{comment.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 italic text-xs">No comments yet. Start a discussion below.</p>
                    )}
                  </div>

                  {/* Add Comment Form */}
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment or query..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={addCommentMutation.isPending || !commentText.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Post
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Meta Info & Activity Timeline */}
              <div className="space-y-6">
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-3.5">
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 mb-1">Status</span>
                    <span className={`inline-flex px-2.5 py-0.5 rounded text-xs font-semibold ${
                      selectedTask.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      selectedTask.status === 'In Progress' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                      'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                    }`}>
                      {selectedTask.status}
                    </span>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-slate-400">Assigned To</span>
                    <span className="text-white text-sm font-medium">{selectedTask.assignedTo?.name || 'Unassigned'}</span>
                    {selectedTask.assignedTo?.department && (
                      <span className="block text-xs text-slate-400">{selectedTask.assignedTo.department}</span>
                    )}
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-slate-400">Assigned By</span>
                    <span className="text-white text-sm">{selectedTask.assignedBy?.name || 'Admin'}</span>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-slate-400">Priority</span>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold mt-0.5 ${
                      selectedTask.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                      selectedTask.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {selectedTask.priority || 'Normal'}
                    </span>
                  </div>

                  {selectedTask.startDate && (
                    <div>
                      <span className="block text-xs font-semibold text-slate-400">Start Date</span>
                      <span className="text-white text-sm">{new Date(selectedTask.startDate).toLocaleString()}</span>
                    </div>
                  )}

                  {selectedTask.dueDate && (
                    <div>
                      <span className="block text-xs font-semibold text-slate-400">Due Date</span>
                      <span className="text-white text-sm">{new Date(selectedTask.dueDate).toLocaleString()}</span>
                    </div>
                  )}

                  {selectedTask.estimatedTimeDuration && (
                    <div>
                      <span className="block text-xs font-semibold text-slate-400">Estimated Duration</span>
                      <span className="text-white text-sm">{selectedTask.estimatedTimeDuration} Hours</span>
                    </div>
                  )}
                </div>

                {/* Activity History */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">
                    Activity History
                  </h4>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                    {selectedTask.history?.slice().reverse().map((log, i) => (
                      <div key={i} className="text-xs bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40">
                        <p className="text-slate-300">
                          <span className="font-semibold text-slate-200">{log.user?.name || 'User'}</span> {log.action}
                        </p>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
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

export default UserReportsPage;
