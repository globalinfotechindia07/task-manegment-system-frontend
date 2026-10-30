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
import {
  HiOutlineClock,
  HiOutlineDocumentCheck,
  HiOutlineBanknotes,
  HiOutlineUsers,
  HiOutlineClipboardDocumentList,
  HiOutlineFolder,
  HiOutlineArrowRight
} from 'react-icons/hi2';

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
  const { data: users = [] } = useQuery({
    queryKey: ['dashboardUsers'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return Array.isArray(data) ? data : [];
    },
    enabled: hasUsersPerm || hasPayrollPerm
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['dashboardTasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return Array.isArray(data) ? data : [];
    },
    enabled: hasTasksPerm
  });

  const { data: myTasks = [] } = useQuery({
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

  const { data: salarySlips = [] } = useQuery({
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
    { name: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length, color: '#4f46e5' },
    { name: 'Completed', value: completedTasks, color: '#10b981' }
  ];

  // Payroll Financial Breakdown Chart Data
  const payrollBreakdownData = [
    { name: 'Net Payout', amount: payrollStats.totalNet, fill: '#10b981' },
    { name: 'Statutory Ded.', amount: Math.max(0, payrollStats.totalDeductions - payrollStats.totalLateDeductions), fill: '#f43f5e' },
    { name: 'Late Ded.', amount: payrollStats.totalLateDeductions, fill: '#f97316' },
  ];

  return (
    <div className="space-y-6">
      {/* ERP Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
              {user?.roleRef?.displayName || user?.role || 'Staff Member'}
            </span>
            {user?.department && (
              <span className="text-xs text-slate-500">• {user.department}</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview and real-time operations for <span className="text-slate-800 font-semibold">{user?.company?.name || 'Your Workspace'}</span>.
          </p>
        </div>

        {/* Quick Personal Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/punch-in"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
          >
            <HiOutlineClock className="w-4 h-4" />
            Punch In / Out
          </Link>
          <Link
            to="/my-salary-slips"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
          >
            <HiOutlineDocumentCheck className="w-4 h-4 text-slate-500" />
            My Salary Slips
          </Link>
        </div>
      </div>

      {/* Dynamic ERP KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {/* Accountant / Payroll Special KPIs */}
        {hasPayrollPerm && (
          <>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs border-t-4 border-t-emerald-500">
              <p className="text-slate-500 text-xs font-medium mb-1">Monthly Gross Budget</p>
              <h3 className="text-2xl font-bold text-slate-900">₹{payrollStats.totalGross.toLocaleString('en-IN')}</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">Period: {new Date(0, currentMonth - 1).toLocaleString('default', { month: 'short' })} {currentYear}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs border-t-4 border-t-rose-500">
              <p className="text-slate-500 text-xs font-medium mb-1">Total Deductions</p>
              <h3 className="text-2xl font-bold text-rose-600">₹{payrollStats.totalDeductions.toLocaleString('en-IN')}</h3>
              <p className="text-[11px] text-slate-400 mt-1">PF, ESIC, Tax & Late Ded.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs border-t-4 border-t-indigo-600">
              <p className="text-slate-500 text-xs font-medium mb-1">Net Payable Salary</p>
              <h3 className="text-2xl font-bold text-indigo-700">₹{payrollStats.totalNet.toLocaleString('en-IN')}</h3>
              <p className="text-[11px] text-slate-500 mt-1">{payrollStats.slipsCount} Slips Processed</p>
            </div>
          </>
        )}

        {/* Users KPI */}
        {hasUsersPerm && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs border-t-4 border-t-blue-500">
            <p className="text-slate-500 text-xs font-medium mb-1">Total Staff Members</p>
            <h3 className="text-2xl font-bold text-slate-900">{totalStaff}</h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">{activeStaff} Active Employees</p>
          </div>
        )}

        {/* Tasks KPIs */}
        {hasTasksPerm && (
          <>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs border-t-4 border-t-amber-500">
              <p className="text-slate-500 text-xs font-medium mb-1">Active Deliverables</p>
              <h3 className="text-2xl font-bold text-slate-900">{activeTasks}</h3>
              <p className="text-[11px] text-amber-600 font-medium mt-1">{pendingTasks} Pending / In Progress</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs border-t-4 border-t-emerald-500">
              <p className="text-slate-500 text-xs font-medium mb-1">Completed Tasks</p>
              <h3 className="text-2xl font-bold text-emerald-600">{completedTasks}</h3>
              <p className="text-[11px] text-slate-400 mt-1">Total Resolved</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs border-t-4 border-t-rose-500">
              <p className="text-slate-500 text-xs font-medium mb-1">High Priority Tasks</p>
              <h3 className="text-2xl font-bold text-rose-600">{highPriorityTasks}</h3>
              <p className="text-[11px] text-rose-600 font-medium mt-1">Requires Attention</p>
            </div>
          </>
        )}

        {/* Projects KPI */}
        {hasProjectsPerm && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs border-t-4 border-t-purple-500">
            <p className="text-slate-500 text-xs font-medium mb-1">Active Projects</p>
            <h3 className="text-2xl font-bold text-slate-900">{projects.length}</h3>
            <p className="text-[11px] text-purple-600 font-medium mt-1">Company Projects</p>
          </div>
        )}

        {/* Personal Deliverables KPI */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs border-t-4 border-t-cyan-500">
          <p className="text-slate-500 text-xs font-medium mb-1">My Pending Tasks</p>
          <h3 className="text-2xl font-bold text-cyan-600">{myPendingTasks}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Assigned directly to you</p>
        </div>
      </div>

      {/* Accountant & Payroll Spotlight Section */}
      {hasPayrollPerm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Payroll & Deductions Financial Analytics
              </h2>
              <p className="text-xs text-slate-500">Current month salary disbursements and deduction breakdown.</p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/admin/salary-management"
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors"
              >
                Salary Structures
              </Link>
              <Link
                to="/admin/payroll-dashboard"
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
              >
                Generate & View Slips
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Financial Bar Chart */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Payout vs Deductions</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={payrollBreakdownData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                      formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Amount']}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Financial Overview Table */}
            <div className="lg:col-span-2 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Recent Salary Slips ({salarySlips.length})</h3>
              {salarySlips.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No salary slips generated for this month yet. Click "Generate & View Slips" to process payroll.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-48 scrollbar-thin scrollbar-thumb-slate-200">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-white text-slate-600 sticky top-0 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="p-2.5">Employee</th>
                        <th className="p-2.5 text-right text-emerald-700">Gross (A)</th>
                        <th className="p-2.5 text-right text-rose-700">Deduction (B)</th>
                        <th className="p-2.5 text-right text-indigo-700">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {salarySlips.slice(0, 6).map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2.5 font-medium text-slate-900">{s.employeeName || s.user?.name}</td>
                          <td className="p-2.5 text-right font-medium text-emerald-700">₹{Number(s.grossEarnings || 0).toLocaleString('en-IN')}</td>
                          <td className="p-2.5 text-right font-medium text-rose-700">₹{Number(s.totalDeductions || 0).toLocaleString('en-IN')}</td>
                          <td className="p-2.5 text-right font-bold text-indigo-700">₹{Number(s.netSalary || 0).toLocaleString('en-IN')}</td>
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
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Task Deliverable Status</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={taskStatusData} innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={5}>
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {taskStatusData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
          </div>

          {/* Urgent Tasks requiring attention */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900">High Priority & Active Deliverables</h3>
              <Link to="/admin/tasks" className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
                View All Tasks <HiOutlineArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Task</th>
                    <th className="p-2.5">Project</th>
                    <th className="p-2.5">Assignee</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.filter(t => t.priority === 'High' || t.status === 'In Progress').slice(0, 5).map(t => (
                    <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-medium text-slate-900 max-w-xs truncate">{t.title}</td>
                      <td className="p-2.5 text-slate-500">{t.project?.name || 'General'}</td>
                      <td className="p-2.5 text-slate-600">{t.assignedTo?.name || 'Unassigned'}</td>
                      <td className="p-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                          t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          t.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {tasks.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-6 text-center text-slate-400">No tasks currently assigned.</td>
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
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-900">My Deliverables ({myTasks.length})</h3>
            <Link to="/admin/tasks" className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
              Open Task Board <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {myTasks.slice(0, 5).map(t => (
              <div key={t._id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center hover:bg-slate-100/60 transition-colors">
                <div>
                  <div className="font-semibold text-xs text-slate-900">{t.title}</div>
                  <div className="text-[11px] text-slate-500">{t.project?.name || 'General Project'} • Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  t.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                  'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {t.status}
                </span>
              </div>
            ))}
            {myTasks.length === 0 && (
              <p className="text-xs text-slate-400 italic py-6 text-center">No tasks assigned to you right now.</p>
            )}
          </div>
        </div>

        {/* Announcements Widget */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <AnnouncementsWidget />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
