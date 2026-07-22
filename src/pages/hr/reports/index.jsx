import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';

const HRReports = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('All');
  const [selectedUserId, setSelectedUserId] = useState('All');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return data;
    }
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    }
  });

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const lowerQuery = searchQuery.toLowerCase();
    return users.filter(u => 
      u.name.toLowerCase().includes(lowerQuery) || 
      u.role.toLowerCase().includes(lowerQuery) || 
      (u.department && u.department.toLowerCase().includes(lowerQuery)) ||
      (u.teamHead?.name && u.teamHead.name.toLowerCase().includes(lowerQuery))
    );
  }, [users, searchQuery]);

  const filteredTasks = useMemo(() => {
    let tasksToFilter = tasks;

    // Filter by selected user
    if (selectedUserId !== 'All') {
      tasksToFilter = tasksToFilter.filter(t => t.assignedTo?._id === selectedUserId);
    } else if (searchQuery.trim()) {
      // If no specific user selected but search query is active, only show tasks of filtered users
      const validUserIds = new Set(filteredUsers.map(u => u._id));
      tasksToFilter = tasksToFilter.filter(t => validUserIds.has(t.assignedTo?._id));
    }

    // Filter by period
    return tasksToFilter.filter(task => {
      let matchPeriod = true;
      if (filterPeriod !== 'All' && task.updatedAt) {
        const updatedDate = new Date(task.updatedAt);
        const now = new Date();
        const diffTime = Math.abs(now - updatedDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (filterPeriod === 'Daily') matchPeriod = diffDays <= 1;
        if (filterPeriod === 'Weekly') matchPeriod = diffDays <= 7;
        if (filterPeriod === 'Monthly') matchPeriod = diffDays <= 30;
      }
      return matchPeriod;
    });
  }, [tasks, filteredUsers, selectedUserId, filterPeriod, searchQuery]);

  const total = filteredTasks.length;
  const completed = filteredTasks.filter(t => t.status === 'Completed').length;
  const inProgress = filteredTasks.filter(t => t.status === 'In Progress').length;
  const pendingHold = filteredTasks.filter(t => t.status === 'Pending' || t.status === 'On Hold').length;

  const exportToCSV = () => {
    if (filteredTasks.length === 0) return;
    const headers = ['Task Name', 'Assigned To', 'Department', 'Status', 'Priority', 'Start Date', 'Due Date', 'Last Updated'];
    const csvRows = [headers.join(',')];
    
    filteredTasks.forEach(task => {
      const assignedUser = users.find(u => u._id === task.assignedTo?._id);
      const row = [
        `"${task.title}"`,
        `"${assignedUser?.name || 'Unknown'}"`,
        `"${assignedUser?.department || 'N/A'}"`,
        task.status,
        task.priority,
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
    a.setAttribute('download', `HR_Work_Report_${filterPeriod}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (isLoadingTasks || isLoadingUsers) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
         <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Employee Work Reports</h1>
          <p className="text-slate-400">View detailed task history and progress updates for all users.</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20 self-start md:self-auto flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Report
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="glass-panel p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Search Users</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, role, dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            />
            <svg className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Select Employee</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none appearance-none"
          >
            <option value="All">All Filtered Employees</option>
            {filteredUsers.map(u => (
              <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Time Period</label>
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none appearance-none"
          >
            <option value="All">All Time</option>
            <option value="Daily">Daily (Last 24 Hrs)</option>
            <option value="Weekly">Weekly (Last 7 Days)</option>
            <option value="Monthly">Monthly (Last 30 Days)</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/50">
          <p className="text-slate-400 text-sm font-medium mb-1">Total Tasks</p>
          <p className="text-3xl font-bold text-white">{total}</p>
        </div>
        <div className="bg-slate-800/60 p-5 rounded-xl border border-emerald-500/30">
          <p className="text-emerald-400 text-sm font-medium mb-1">Completed</p>
          <p className="text-3xl font-bold text-emerald-400">{completed}</p>
        </div>
        <div className="bg-slate-800/60 p-5 rounded-xl border border-indigo-500/30">
          <p className="text-indigo-400 text-sm font-medium mb-1">In Progress</p>
          <p className="text-3xl font-bold text-indigo-400">{inProgress}</p>
        </div>
        <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-500/30">
          <p className="text-slate-400 text-sm font-medium mb-1">Pending/Hold</p>
          <p className="text-3xl font-bold text-slate-300">{pendingHold}</p>
        </div>
      </div>

      {/* Task List */}
      <div className="glass-panel overflow-hidden mt-6">
        <div className="p-5 border-b border-slate-700/50">
          <h3 className="text-lg font-bold text-white">Work Report Details</h3>
        </div>
        
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No work reports match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-slate-200 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Task Name</th>
                  <th className="px-6 py-4 font-semibold">Assigned To</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Priority</th>
                  <th className="px-6 py-4 font-semibold">Last Updated</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredTasks.map(task => (
                  <tr key={task._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white max-w-[200px] truncate" title={task.title}>{task.title}</td>
                    <td className="px-6 py-4">{task.assignedTo?.name || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                        task.status === 'Completed' ? 'bg-green-500/10 text-green-400' :
                        task.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400' :
                        task.status === 'On Hold' ? 'bg-orange-500/10 text-orange-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                        task.priority === 'High' ? 'bg-red-500/10 text-red-400' :
                        task.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(task.updatedAt).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          setSelectedTask(task);
                          setIsDetailsModalOpen(true);
                        }}
                        className="text-indigo-400 hover:text-indigo-300 px-3 py-1 border border-indigo-500/30 rounded hover:bg-indigo-500/10 transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Details Modal (Read-Only) */}
      {isDetailsModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm" onClick={() => setIsDetailsModalOpen(false)}></div>
          <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-800 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedTask.title}</h3>
                <p className="text-xs text-slate-400 mt-1">Read-only view for HR Monitoring</p>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Details */}
              <div className="md:col-span-2 space-y-6 min-w-0">
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-2">Description</h4>
                  <p className="text-slate-200 bg-slate-800/50 p-4 rounded-lg break-words">{selectedTask.description}</p>
                </div>

                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-400 mb-2">Attachments</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.attachments.map((file, i) => (
                        <a key={i} href={`${API_BASE_URL}${file}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm text-indigo-400 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          Attachment {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-4 border-b border-slate-700 pb-2">Comments & Progress Updates</h4>
                  <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto pr-2">
                    {selectedTask.comments?.map((comment, i) => (
                      <div key={i} className="bg-slate-800 p-4 rounded-lg border border-slate-700/50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-indigo-400">{comment.user?.name || 'User'}</span>
                          <span className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-300 text-sm break-words">{comment.text}</p>
                      </div>
                    ))}
                    {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                      <p className="text-slate-500 italic text-sm">No comments yet.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-4 border-b border-slate-700 pb-2">Daily Reports</h4>
                  <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto pr-2">
                    {selectedTask.reports?.map((report, i) => (
                      <div key={i} className="bg-slate-800 p-4 rounded-lg border-l-4 border-emerald-500">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-emerald-400">{report.user?.name || 'User'}</span>
                          <span className="text-xs text-slate-500">{new Date(report.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-300 text-sm whitespace-pre-wrap">{report.description}</p>
                      </div>
                    ))}
                    {(!selectedTask.reports || selectedTask.reports.length === 0) && (
                      <p className="text-slate-500 italic text-sm">No daily reports submitted yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Meta & History */}
              <div className="space-y-6 min-w-0">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-4">
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 mb-1">Status</span>
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                      selectedTask.status === 'Completed' ? 'bg-green-500/10 text-green-400' :
                      selectedTask.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400' :
                      selectedTask.status === 'On Hold' ? 'bg-orange-500/10 text-orange-400' :
                      'bg-slate-500/10 text-slate-400'
                    }`}>
                      {selectedTask.status}
                    </span>
                  </div>
                  
                  <div>
                    <span className="block text-xs font-semibold text-slate-400">Assigned To</span>
                    <span className="text-white text-sm">{selectedTask.assignedTo?.name}</span>
                  </div>
                  
                  <div>
                    <span className="block text-xs font-semibold text-slate-400">Assigned By</span>
                    <span className="text-white text-sm">{selectedTask.assignedBy?.name}</span>
                  </div>
                  
                  <div>
                    <span className="block text-xs font-semibold text-slate-400">Priority</span>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold mt-1 ${
                      selectedTask.priority === 'High' ? 'bg-red-500/10 text-red-400' :
                      selectedTask.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>
                      {selectedTask.priority}
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

                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-3 border-b border-slate-700 pb-2">Activity Logs</h4>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {selectedTask.history?.slice().reverse().map((log, i) => (
                      <div key={i} className="text-sm">
                        <p className="text-slate-300 break-words whitespace-normal">
                          <span className="font-medium text-slate-200">{log.user?.name || 'User'}</span> {log.action}
                        </p>
                        <span className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
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

export default HRReports;
