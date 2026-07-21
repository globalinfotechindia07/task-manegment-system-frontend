import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/axios';

const UserReportsPage = () => {
  const [filterPeriod, setFilterPeriod] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return data;
    }
  });

  const tasksList = Array.isArray(tasks) ? tasks : [];

  const filteredTasks = useMemo(() => {
    return tasksList.filter(task => {
      const matchStatus = filterStatus === 'All' || task.status === filterStatus;
      const matchPriority = filterPriority === 'All' || task.priority === filterPriority;
      
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
      
      return matchStatus && matchPriority && matchPeriod;
    });
  }, [tasksList, filterPeriod, filterStatus, filterPriority]);

  const total = filteredTasks.length;
  const completed = filteredTasks.filter(t => t.status === 'Completed').length;
  const inProgress = filteredTasks.filter(t => t.status === 'In Progress').length;
  const pendingHold = filteredTasks.filter(t => t.status === 'Pending' || t.status === 'On Hold').length;

  const exportToCSV = () => {
    if (filteredTasks.length === 0) return;
    const headers = ['Task Name', 'Assigned By', 'Status', 'Priority', 'Start Date', 'Due Date'];
    const csvRows = [headers.join(',')];
    
    filteredTasks.forEach(task => {
      const row = [
        `"${task.title}"`,
        `"${task.assignedBy?.name || 'Unknown'}"`,
        task.status,
        task.priority,
        task.startDate ? new Date(task.startDate).toLocaleDateString() : 'N/A',
        task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'
      ];
      csvRows.push(row.join(','));
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `Task_Report_${filterPeriod}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Work Reports</h1>
          <p className="text-slate-400">Track and analyze your productivity.</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20 self-start md:self-auto"
        >
          Export Report (CSV)
        </button>
      </div>
      
      {/* Filters */}
      <div className="glass-panel p-5 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-400 mb-1">Time Period</label>
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none appearance-none"
          >
            <option value="All">All Time</option>
            <option value="Daily">Last 24 Hours</option>
            <option value="Weekly">Last 7 Days</option>
            <option value="Monthly">Last 30 Days</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-400 mb-1">Status Filter</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none appearance-none"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending">Pending</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-400 mb-1">Priority Filter</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none appearance-none"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Normal">Normal</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/50">
          <p className="text-slate-400 text-sm font-medium mb-1">Total Tasks</p>
          <p className="text-3xl font-bold text-white">{total}</p>
        </div>
        <div className="bg-slate-800/60 p-5 rounded-xl border border-green-500/30">
          <p className="text-green-400 text-sm font-medium mb-1">Completed</p>
          <p className="text-3xl font-bold text-white">{completed}</p>
        </div>
        <div className="bg-slate-800/60 p-5 rounded-xl border border-indigo-500/30">
          <p className="text-indigo-400 text-sm font-medium mb-1">In Progress</p>
          <p className="text-3xl font-bold text-white">{inProgress}</p>
        </div>
        <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-500/30">
          <p className="text-slate-400 text-sm font-medium mb-1">Pending/Hold</p>
          <p className="text-3xl font-bold text-white">{pendingHold}</p>
        </div>
      </div>

      {/* Task List */}
      <div className="glass-panel overflow-hidden mt-6">
        <div className="p-5 border-b border-slate-700/50">
          <h3 className="text-lg font-bold text-white">Filtered Task Results</h3>
        </div>
        
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No tasks match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-slate-200 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Task Name</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Priority</th>
                  <th className="px-6 py-4 font-semibold">Updated At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredTasks.map(task => (
                  <tr key={task._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{task.title}</td>
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

export default UserReportsPage;
