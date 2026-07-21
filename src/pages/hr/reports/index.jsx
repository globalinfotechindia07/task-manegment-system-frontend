import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/axios';

const HRReports = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('All');
  const [selectedUserId, setSelectedUserId] = useState('All');

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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default HRReports;
