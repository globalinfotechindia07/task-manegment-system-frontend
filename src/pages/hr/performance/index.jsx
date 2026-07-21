import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/axios';

const HRPerformance = () => {
  const [groupBy, setGroupBy] = useState('Period'); // Period, Employee
  const [filterPeriod, setFilterPeriod] = useState('Monthly'); // Monthly, Quarterly, Yearly
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterTeam, setFilterTeam] = useState('All');
  const [filterUser, setFilterUser] = useState('All');

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

  const departments = useMemo(() => Array.from(new Set(users.map(u => u.department).filter(Boolean))), [users]);
  const teams = useMemo(() => users.filter(u => u.role === 'Team Head'), [users]);
  const employees = useMemo(() => users.filter(u => u.role === 'User' || u.role === 'Team Head'), [users]);

  // Filter tasks based on selected filters and period
  const performanceData = useMemo(() => {
    const now = new Date();
    
    // Filter by User/Team/Dept
    let filteredTasks = tasks.filter(task => {
      const assignedUser = users.find(u => u._id === task.assignedTo?._id);
      if (!assignedUser) return false;

      let matchDept = filterDepartment === 'All' || assignedUser.department === filterDepartment;
      let matchTeam = filterTeam === 'All' || assignedUser.teamHead?._id === filterTeam || assignedUser.teamHead === filterTeam;
      let matchUser = filterUser === 'All' || assignedUser._id === filterUser;

      return matchDept && matchTeam && matchUser;
    });

    // Group by period or employee
    const groups = {};

    filteredTasks.forEach(task => {
      let groupKey = '';
      let groupLabel = '';

      if (groupBy === 'Period') {
        if (!task.createdAt) return;
        const date = new Date(task.createdAt);
        if (filterPeriod === 'Monthly') {
          groupKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          groupLabel = groupKey;
        } else if (filterPeriod === 'Quarterly') {
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          groupKey = `${date.getFullYear()}-Q${quarter}`;
          groupLabel = groupKey;
        } else if (filterPeriod === 'Yearly') {
          groupKey = `${date.getFullYear()}`;
          groupLabel = groupKey;
        }
      } else if (groupBy === 'Employee') {
        const assignedUser = users.find(u => u._id === task.assignedTo?._id);
        if (!assignedUser) return;
        groupKey = assignedUser._id;
        groupLabel = assignedUser.name;
      }

      if (!groupKey) return;

      if (!groups[groupKey]) {
        groups[groupKey] = { label: groupLabel, total: 0, completed: 0, overdue: 0, pending: 0, delayed: 0 };
      }

      groups[groupKey].total++;

      if (task.status === 'Completed') {
        groups[groupKey].completed++;
      } else {
        groups[groupKey].pending++;
      }

      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (task.status !== 'Completed' && dueDate < now) {
          groups[groupKey].overdue++;
        }
        // If completed after due date, it was delayed
        if (task.status === 'Completed' && task.history) {
          const completedLog = task.history.find(h => h.action.includes('status updated to Completed'));
          if (completedLog && new Date(completedLog.createdAt) > dueDate) {
            groups[groupKey].delayed++;
          }
        }
      }
    });

    return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(key => ({
      key: key,
      label: groups[key].label,
      total: groups[key].total,
      completed: groups[key].completed,
      pending: groups[key].pending,
      overdue: groups[key].overdue,
      delayed: groups[key].delayed,
      completionRate: groups[key].total > 0 ? ((groups[key].completed / groups[key].total) * 100).toFixed(1) : 0
    }));
  }, [tasks, users, filterPeriod, filterDepartment, filterTeam, filterUser, groupBy]);

  const exportCSV = () => {
    const headerTitle = groupBy === 'Period' ? 'Period' : 'Employee Name';
    const headers = [headerTitle, 'Total Tasks', 'Completed', 'Pending', 'Overdue (Active)', 'Delayed (Completed late)', 'Completion Rate (%)'];
    const csvContent = [
      headers.join(','),
      ...performanceData.map(row => 
        [`"${row.label}"`, row.total, row.completed, row.pending, row.overdue, row.delayed, row.completionRate].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `performance_report_${groupBy.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white">Performance Reports</h1>
          <p className="text-slate-400">Analyze task completion rates and productivity trends.</p>
        </div>
        <button 
          onClick={exportCSV}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="glass-panel p-5 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Group By</label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none appearance-none"
          >
            <option value="Period">Period</option>
            <option value="Employee">Employee</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Period Filter</label>
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none appearance-none"
          >
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Yearly">Yearly</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Department</label>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none appearance-none"
          >
            <option value="All">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Team Head</label>
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none appearance-none"
          >
            <option value="All">All Teams</option>
            {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Employee</label>
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none appearance-none"
          >
            <option value="All">All Employees</option>
            {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
          </select>
        </div>
      </div>

      {/* Performance Data Table */}
      <div className="glass-panel overflow-hidden">
        {performanceData.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No performance data available for the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-slate-200 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">{groupBy === 'Period' ? `${filterPeriod} Period` : 'Employee Name'}</th>
                  <th className="px-6 py-4 font-semibold text-center">Total Tasks</th>
                  <th className="px-6 py-4 font-semibold text-center text-emerald-400">Completed</th>
                  <th className="px-6 py-4 font-semibold text-center text-red-400">Overdue</th>
                  <th className="px-6 py-4 font-semibold text-center text-orange-400">Delayed</th>
                  <th className="px-6 py-4 font-semibold text-right">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {performanceData.map(row => (
                  <tr key={row.key} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{row.label}</td>
                    <td className="px-6 py-4 text-center">{row.total}</td>
                    <td className="px-6 py-4 text-center">{row.completed}</td>
                    <td className="px-6 py-4 text-center">{row.overdue}</td>
                    <td className="px-6 py-4 text-center">{row.delayed}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              parseFloat(row.completionRate) >= 80 ? 'bg-emerald-500' :
                              parseFloat(row.completionRate) >= 50 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${row.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-white w-12">{row.completionRate}%</span>
                      </div>
                    </td>
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

export default HRPerformance;
