import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import AnnouncementsWidget from '../../../components/AnnouncementsWidget';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const isOfficeAdmin = user?.role === 'Admin' || user?.role === 'CTO';
  const perms = user?.permissions || {};

  // Permissions booleans
  const hasPayrollPerm = isOfficeAdmin || Boolean(perms.payroll?.view);
  const hasTasksPerm = isOfficeAdmin || Boolean(perms.tasks?.view);
  const hasUsersPerm = isOfficeAdmin || Boolean(perms.users?.view);
  const hasProjectsPerm = isOfficeAdmin || Boolean(perms.projects?.view);
  const hasReportsPerm = isOfficeAdmin || Boolean(perms.reports?.view);

  // Month & Year for Payroll preview (defaults to current month)
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Queries
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['dashboardUsers'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return Array.isArray(data) ? data : [];
    },
    enabled: hasUsersPerm || hasPayrollPerm
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['dashboardTasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return Array.isArray(data) ? data : [];
    },
    enabled: hasTasksPerm
  });

  const { data: myTasks = [], isLoading: myTasksLoading } = useQuery({
    queryKey: ['dashboardMyTasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks?myTasks=true');
      return Array.isArray(data) ? data : [];
    }
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['dashboardProjects'],
    queryFn: async () => {
      const { data } = await api.get('/projects');
      return Array.isArray(data) ? data : [];
    },
    enabled: hasProjectsPerm
  });

  const { data: salarySlips = [], isLoading: slipsLoading } = useQuery({
    queryKey: ['dashboardSalarySlips', currentMonth, currentYear],
    queryFn: async () => {
      const { data } = await api.get(`/payroll/all?month=${currentMonth}&year=${currentYear}`);
      return Array.isArray(data) ? data : [];
    },
    enabled: hasPayrollPerm
  });

  // Calculate Metrics
  const totalStaff = users.length;
  const activeStaff = users.filter(u => u.status !== 'Inactive').length;

  const activeTasks = tasks.filter(t => t.status === 'In Progress' || t.status === 'Pending').length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
  const highPriorityTasks = tasks.filter(t => t.priority === 'High').length;

  const myPendingTasks = myTasks.filter(t => t.status !== 'Completed').length;

  // Payroll Metrics (Crucial for Accountant & Admin)
  const payrollStats = useMemo(() => {
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let totalLateDeductions = 0;

    salarySlips.forEach(slip => {
      totalGross += Number(slip.grossEarnings || 0);
      totalDeductions += Number(slip.totalDeductions || 0);
      totalNet += Number(slip.netSalary || 0);
      totalLateDeductions += Number(slip.lateDeduction || 0);
    });

    return {
      totalGross: Math.round(totalGross),
      totalDeductions: Math.round(totalDeductions),
      totalNet: Math.round(totalNet),
      totalLateDeductions: Math.round(totalLateDeductions),
      slipsCount: salarySlips.length
    };
  }, [salarySlips]);

  // Tasks Chart Data
  const taskStatusData = [
    { name: 'Pending', value: pendingTasks, color: '#f59e0b' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length, color: '#6366f1' },
    { name: 'Completed', value: completedTasks, color: '#10b981' }
  ];

  // Payroll Financial Breakdown Chart Data
  const payrollBreakdownData = [
    { name: 'Net Payout', amount: payrollStats.totalNet, fill: '#10b981' },
    { name: 'Statutory/PF Ded.', amount: Math.max(0, payrollStats.totalDeductions - payrollStats.totalLateDeductions), fill: '#f43f5e' },
    { name: 'Late Deductions', amount: payrollStats.totalLateDeductions, fill: '#f97316' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-700/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {user?.roleRef?.displayName || user?.role || 'Staff Member'}
            </span>
            {user?.department && (
              <span className="text-xs text-slate-400">• {user.department}</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Here is your dynamic overview for <span className="text-slate-200 font-medium">{user?.company?.name || 'Your Workspace'}</span>.
          </p>
        </div>

        {/* Quick Personal Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/punch-in"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Punch In / Out
          </Link>
          <Link
            to="/my-salary-slips"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all"
          >
            My Salary Slips
          </Link>
        </div>
      </div>

      {/* Dynamic KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {/* Accountant / Payroll Special KPIs */}
        {hasPayrollPerm && (
          <>
            <div className="glass-panel p-4 border-t-4 border-emerald-500">
              <p className="text-slate-400 text-xs font-medium mb-1">Monthly Gross Budget</p>
              <h3 className="text-2xl font-bold text-white">₹{payrollStats.totalGross.toLocaleString('en-IN')}</h3>
              <p className="text-[11px] text-emerald-400 mt-1">Period: {new Date(0, currentMonth - 1).toLocaleString('default', { month: 'short' })} {currentYear}</p>
            </div>

            <div className="glass-panel p-4 border-t-4 border-rose-500">
              <p className="text-slate-400 text-xs font-medium mb-1">Total Deductions</p>
              <h3 className="text-2xl font-bold text-rose-400">₹{payrollStats.totalDeductions.toLocaleString('en-IN')}</h3>
              <p className="text-[11px] text-slate-400 mt-1">PF, ESIC, Tax & Late Ded.</p>
            </div>

            <div className="glass-panel p-4 border-t-4 border-indigo-500">
              <p className="text-slate-400 text-xs font-medium mb-1">Net Payable Salary</p>
              <h3 className="text-2xl font-bold text-indigo-400">₹{payrollStats.totalNet.toLocaleString('en-IN')}</h3>
              <p className="text-[11px] text-slate-400 mt-1">{payrollStats.slipsCount} Slips Processed</p>
            </div>
          </>
        )}

        {/* Users KPI */}
        {hasUsersPerm && (
          <div className="glass-panel p-4 border-t-4 border-blue-500">
            <p className="text-slate-400 text-xs font-medium mb-1">Total Staff Members</p>
            <h3 className="text-2xl font-bold text-white">{totalStaff}</h3>
            <p className="text-[11px] text-green-400 mt-1">{activeStaff} Active Employees</p>
          </div>
        )}

        {/* Tasks KPIs */}
        {hasTasksPerm && (
          <>
            <div className="glass-panel p-4 border-t-4 border-yellow-500">
              <p className="text-slate-400 text-xs font-medium mb-1">Active Deliverables</p>
              <h3 className="text-2xl font-bold text-white">{activeTasks}</h3>
              <p className="text-[11px] text-yellow-400 mt-1">{pendingTasks} Pending / In Progress</p>
            </div>

            <div className="glass-panel p-4 border-t-4 border-green-500">
              <p className="text-slate-400 text-xs font-medium mb-1">Completed Tasks</p>
              <h3 className="text-2xl font-bold text-green-400">{completedTasks}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Total Resolved</p>
            </div>

            <div className="glass-panel p-4 border-t-4 border-red-500">
              <p className="text-slate-400 text-xs font-medium mb-1">High Priority Tasks</p>
              <h3 className="text-2xl font-bold text-red-400">{highPriorityTasks}</h3>
              <p className="text-[11px] text-red-400 mt-1">Requires Immediate Action</p>
            </div>
          </>
        )}

        {/* Projects KPI */}
        {hasProjectsPerm && (
          <div className="glass-panel p-4 border-t-4 border-purple-500">
            <p className="text-slate-400 text-xs font-medium mb-1">Active Projects</p>
            <h3 className="text-2xl font-bold text-white">{projects.length}</h3>
            <p className="text-[11px] text-purple-400 mt-1">Company Projects</p>
          </div>
        )}

        {/* Personal Deliverables KPI */}
        <div className="glass-panel p-4 border-t-4 border-cyan-500">
          <p className="text-slate-400 text-xs font-medium mb-1">My Pending Tasks</p>
          <h3 className="text-2xl font-bold text-cyan-400">{myPendingTasks}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Assigned directly to you</p>
        </div>
      </div>

      {/* Accountant & Payroll Spotlight Section */}
      {hasPayrollPerm && (
        <div className="glass-panel p-6 border-slate-700/60">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Payroll & Deductions Financial Analytics
              </h2>
              <p className="text-xs text-slate-400">Current month salary disbursements and deduction breakdown.</p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/admin/salary-management"
                className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-semibold transition-colors"
              >
                Salary Structures & Config
              </Link>
              <Link
                to="/admin/payroll-dashboard"
                className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors"
              >
                Generate & View Slips
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Financial Bar Chart */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Payout vs Deductions</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={payrollBreakdownData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                      formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Amount']}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Financial Overview Table */}
            <div className="lg:col-span-2 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Recent Salary Slips ({salarySlips.length})</h3>
              {salarySlips.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No salary slips generated for this month yet. Click "Generate & View Slips" to process payroll.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-48 custom-scrollbar">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800/60 text-slate-400 sticky top-0">
                      <tr>
                        <th className="p-2 font-medium">Employee</th>
                        <th className="p-2 font-medium text-right text-emerald-400">Gross (A)</th>
                        <th className="p-2 font-medium text-right text-rose-400">Deduction (B)</th>
                        <th className="p-2 font-medium text-right text-indigo-400">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {salarySlips.slice(0, 6).map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="p-2 font-medium text-white">{s.employeeName || s.user?.name}</td>
                          <td className="p-2 text-right text-emerald-400">₹{Number(s.grossEarnings || 0).toLocaleString('en-IN')}</td>
                          <td className="p-2 text-right text-rose-400">₹{Number(s.totalDeductions || 0).toLocaleString('en-IN')}</td>
                          <td className="p-2 text-right font-bold text-indigo-400">₹{Number(s.netSalary || 0).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task & Operations Visualizations */}
      {hasTasksPerm && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Pie Chart */}
          <div className="glass-panel p-5">
            <h3 className="text-sm font-bold text-white mb-4">Task Deliverable Status</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={taskStatusData} innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={5}>
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {taskStatusData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
          </div>

          {/* Urgent Tasks requiring attention */}
          <div className="lg:col-span-2 glass-panel p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">High Priority & Active Deliverables</h3>
              <Link to="/admin/tasks" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                View All Tasks →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 text-slate-400">
                  <tr>
                    <th className="p-2.5 font-medium">Task</th>
                    <th className="p-2.5 font-medium">Project</th>
                    <th className="p-2.5 font-medium">Assignee</th>
                    <th className="p-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {tasks.filter(t => t.priority === 'High' || t.status === 'In Progress').slice(0, 5).map(t => (
                    <tr key={t._id} className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-medium text-white max-w-xs truncate">{t.title}</td>
                      <td className="p-2.5 text-slate-400">{t.project?.name || 'General'}</td>
                      <td className="p-2.5 text-slate-300">{t.assignedTo?.name || 'Unassigned'}</td>
                      <td className="p-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                          t.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                          t.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400' :
                          'bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {tasks.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-4 text-center text-slate-500">No tasks currently assigned.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Personal Work Panel & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Assigned Tasks */}
        <div className="glass-panel p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-white">My Deliverables ({myTasks.length})</h3>
            <Link to="/admin/tasks" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
              Open Task Board →
            </Link>
          </div>

          <div className="space-y-2.5">
            {myTasks.slice(0, 5).map(t => (
              <div key={t._id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-xs text-white">{t.title}</div>
                  <div className="text-[11px] text-slate-400">{t.project?.name || 'General Project'} • Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  t.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                  t.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400' :
                  'bg-amber-500/10 text-amber-400'
                }`}>
                  {t.status}
                </span>
              </div>
            ))}
            {myTasks.length === 0 && (
              <p className="text-xs text-slate-500 italic py-4 text-center">No tasks assigned to you right now.</p>
            )}
          </div>
        </div>

        {/* Announcements Widget */}
        <div className="glass-panel p-5">
          <AnnouncementsWidget />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
