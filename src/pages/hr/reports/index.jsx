import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  HiOutlineArrowDownTray, 
  HiOutlineMagnifyingGlass, 
  HiOutlineEye, 
  HiOutlinePaperClip, 
  HiOutlineXMark 
} from 'react-icons/hi2';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';

const HRReports = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('All');
  const [selectedProjectId, setSelectedProjectId] = useState('All');
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

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await api.get('/projects');
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

    // Filter by project
    if (selectedProjectId !== 'All') {
      tasksToFilter = tasksToFilter.filter(t => t.project?._id === selectedProjectId);
    }

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
  }, [tasks, filteredUsers, selectedUserId, filterPeriod, searchQuery, selectedProjectId]);

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
         <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employee Work Reports</h1>
          <p className="text-sm text-slate-500">View detailed task history and progress updates for all users.</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-xs cursor-pointer"
        >
          <HiOutlineArrowDownTray className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Project</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="All">All Projects</option>
            {projects.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Search Users</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, role, dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
            <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Select Employee</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="All">All Filtered Employees</option>
            {filteredUsers.map(u => (
              <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Time Period</label>
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
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
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Total Tasks</p>
          <p className="text-2xl font-bold text-slate-900">{total}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-emerald-600 text-xs font-medium uppercase tracking-wider mb-1">Completed</p>
          <p className="text-2xl font-bold text-emerald-600">{completed}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-indigo-600 text-xs font-medium uppercase tracking-wider mb-1">In Progress</p>
          <p className="text-2xl font-bold text-indigo-600">{inProgress}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Pending/Hold</p>
          <p className="text-2xl font-bold text-slate-700">{pendingHold}</p>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">Work Report Details</h3>
        </div>
        
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No work reports match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Task Name</th>
                  <th className="px-6 py-4 font-semibold">Assigned To</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Priority</th>
                  <th className="px-6 py-4 font-semibold">Last Updated</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map(task => (
                  <tr key={task._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 max-w-[200px] truncate" title={task.title}>{task.title}</td>
                    <td className="px-6 py-4 text-slate-600">{task.assignedTo?.name || 'Unknown'}</td>
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
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        task.priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        task.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{new Date(task.updatedAt).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          setSelectedTask(task);
                          setIsDetailsModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 px-3 py-1 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-medium hover:bg-indigo-50 transition-colors cursor-pointer"
                      >
                        <HiOutlineEye className="w-3.5 h-3.5" />
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
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsDetailsModalOpen(false)}></div>
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 h-[100dvh] sm:h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedTask.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Read-only view for HR Monitoring</p>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                <HiOutlineXMark className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Details */}
              <div className="md:col-span-2 space-y-6 min-w-0">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Description</h4>
                  <p className="text-slate-800 bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm leading-relaxed break-words">{selectedTask.description}</p>
                </div>

                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Attachments</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.attachments.map((file, i) => (
                        <a key={i} href={`${API_BASE_URL}${file}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:border-indigo-300 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                          <HiOutlinePaperClip className="w-4 h-4 text-slate-400" />
                          Attachment {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-100 pb-2">Comments & Progress Updates</h4>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                    {selectedTask.comments?.map((comment, i) => (
                      <div key={i} className="bg-white p-3.5 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="font-semibold text-indigo-600 text-xs">{comment.user?.name || 'User'}</span>
                          <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-700 text-xs leading-relaxed break-words">{comment.text}</p>
                      </div>
                    ))}
                    {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                      <p className="text-slate-400 italic text-xs">No comments yet.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-100 pb-2">Daily Reports</h4>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                    {selectedTask.reports?.map((report, i) => (
                      <div key={i} className="bg-white p-3.5 rounded-xl border-l-4 border-l-emerald-500 border border-slate-200">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="font-semibold text-emerald-600 text-xs">{report.user?.name || 'User'}</span>
                          <span className="text-xs text-slate-400">{new Date(report.createdAt).toLocaleDateString()}</span>
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
              <div className="space-y-6 min-w-0">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3.5">
                  <div>
                    <span className="block text-xs font-medium text-slate-500 mb-1">Status</span>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      selectedTask.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      selectedTask.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      selectedTask.status === 'On Hold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {selectedTask.status}
                    </span>
                  </div>
                  
                  <div>
                    <span className="block text-xs font-medium text-slate-500">Assigned To</span>
                    <span className="text-slate-900 text-sm font-semibold">{selectedTask.assignedTo?.name}</span>
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
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-100 pb-2">Activity Logs</h4>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                    {selectedTask.history?.slice().reverse().map((log, i) => (
                      <div key={i} className="text-xs border-b border-slate-100 pb-2 last:border-0">
                        <p className="text-slate-700 break-words">
                          <span className="font-semibold text-slate-900">{log.user?.name || 'User'}</span> {log.action}
                        </p>
                        <span className="text-[11px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
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