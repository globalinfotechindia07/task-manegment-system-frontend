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
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineChartPie,
} from 'react-icons/hi2';

const AdminDashboard = () => {
  const { user } = useAuth();
  const isOfficeAdmin = user?.role === 'Admin' || user?.role === 'CTO';
  const perms = user?.permissions || {};

  const hasPayrollPerm = isOfficeAdmin || Boolean(perms.payroll?.view);
  const hasTasksPerm = isOfficeAdmin || Boolean(perms.tasks?.view);
  const hasUsersPerm = isOfficeAdmin || Boolean(perms.users?.view);
  const hasProjectsPerm = isOfficeAdmin || Boolean(perms.projects?.view);
  const hasReportsPerm = isOfficeAdmin || Boolean(perms.reports?.view);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data: users = [] } = useQuery({
    queryKey: ['dashboardUsers'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return Array.isArray(data) ? data : [];
    },
    enabled: hasUsersPerm || hasPayrollPerm,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['dashboardTasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return Array.isArray(data) ? data : [];
    },
    enabled: hasTasksPerm,
  });

  const { data: myTasks = [] } = useQuery({
    queryKey: ['dashboardMyTasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks?myTasks=true');
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['dashboardProjects'],
    queryFn: async () => {
      const { data } = await api.get('/projects');
      return Array.isArray(data) ? data : [];
    },
    enabled: hasProjectsPerm,
  });

  const { data: salarySlips = [] } = useQuery({
    queryKey: ['dashboardSalarySlips', currentMonth, currentYear],
    queryFn: async () => {
      const { data } = await api.get(`/payroll/all?month=${currentMonth}&year=${currentYear}`);
      return Array.isArray(data) ? data : [];
    },
    enabled: hasPayrollPerm,
  });

  const totalStaff = users.length;
  const activeStaff = users.filter((u) => u.status !== 'Inactive').length;

  const activeTasks = tasks.filter((t) => t.status === 'In Progress' || t.status === 'Pending').length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const pendingTasks = tasks.filter((t) => t.status === 'Pending').length;
  const highPriorityTasks = tasks.filter((t) => t.priority === 'High').length;

  const myPendingTasks = myTasks.filter((t) => t.status !== 'Completed').length;

  const payrollStats = useMemo(() => {
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let totalLateDeductions = 0;

    salarySlips.forEach((slip) => {
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
      slipsCount: salarySlips.length,
    };
  }, [salarySlips]);

  const taskStatusData = [
    { name: 'Pending', value: pendingTasks, color: '#f59e0b' },
    { name: 'In Progress', value: tasks.filter((t) => t.status === 'In Progress').length, color: '#4f46e5' },
    { name: 'Completed', value: completedTasks, color: '#10b981' },
  ];

  const payrollBreakdownData = [
    { name: 'Net Payout', amount: payrollStats.totalNet, fill: '#10b981' },
    {
      name: 'Statutory Ded.',
      amount: Math.max(0, payrollStats.totalDeductions - payrollStats.totalLateDeductions),
      fill: '#f43f5e',
    },
    { name: 'Late Ded.', amount: payrollStats.totalLateDeductions, fill: '#f97316' },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ===================== HEADER BANNER ===================== */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold tracking-wide uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
              {user?.roleRef?.displayName || user?.role || 'Staff Member'}
            </span>
            {user?.department && (
              <span className="text-[11px] sm:text-xs text-slate-500 truncate">• {user.department}</span>
            )}
          </div>
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight truncate">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Overview for{' '}
            <span className="text-slate-800 font-semibold">{user?.company?.name || 'Your Workspace'}</span>.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col xs:flex-row sm:flex-row items-stretch xs:items-center gap-2 sm:gap-2.5 shrink-0 w-full md:w-auto">
          <Link
            to="/punch-in"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <HiOutlineClock className="w-4 h-4" />
            Punch In / Out
          </Link>
          <Link
            to="/my-salary-slips"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <HiOutlineDocumentCheck className="w-4 h-4 text-slate-500" />
            My Salary Slips
          </Link>
        </div>
      </div>

      {/* ===================== KPI CARDS ===================== */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
        {hasPayrollPerm && (
          <>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-t-4 border-t-emerald-500 flex flex-col justify-between">
              <div>
                <p className="text-slate-500 text-[11px] sm:text-xs font-medium mb-1 flex items-center gap-1.5">
                  <HiOutlineBanknotes className="w-3.5 h-3.5 text-slate-400" />
                  Monthly Gross
                </p>
                <h3 className="text-lg sm:text-2xl font-bold text-slate-900 font-mono truncate">
                  ₹{payrollStats.totalGross.toLocaleString('en-IN')}
                </h3>
              </div>
              <p className="text-[10px] sm:text-[11px] text-emerald-600 font-medium mt-2 pt-2 border-t border-slate-100">
                {new Date(0, currentMonth - 1).toLocaleString('default', { month: 'short' })} {currentYear}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-t-4 border-t-rose-500 flex flex-col justify-between">
              <div>
                <p className="text-slate-500 text-[11px] sm:text-xs font-medium mb-1">Deductions</p>
                <h3 className="text-lg sm:text-2xl font-bold text-rose-600 font-mono truncate">
                  ₹{payrollStats.totalDeductions.toLocaleString('en-IN')}
                </h3>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                PF, ESIC, Tax & Late
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-t-4 border-t-indigo-600 flex flex-col justify-between">
              <div>
                <p className="text-slate-500 text-[11px] sm:text-xs font-medium mb-1">Net Payable</p>
                <h3 className="text-lg sm:text-2xl font-bold text-indigo-700 font-mono truncate">
                  ₹{payrollStats.totalNet.toLocaleString('en-IN')}
                </h3>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                {payrollStats.slipsCount} slips
              </p>
            </div>
          </>
        )}

        {hasUsersPerm && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-t-4 border-t-blue-500 flex flex-col justify-between">
            <div>
              <p className="text-slate-500 text-[11px] sm:text-xs font-medium mb-1 flex items-center gap-1.5">
                <HiOutlineUsers className="w-3.5 h-3.5 text-slate-400" />
                Staff Members
              </p>
              <h3 className="text-lg sm:text-2xl font-bold text-slate-900">{totalStaff}</h3>
            </div>
            <p className="text-[10px] sm:text-[11px] text-emerald-600 font-medium mt-2 pt-2 border-t border-slate-100">
              {activeStaff} active
            </p>
          </div>
        )}

        {hasTasksPerm && (
          <>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-t-4 border-t-amber-500 flex flex-col justify-between">
              <div>
                <p className="text-slate-500 text-[11px] sm:text-xs font-medium mb-1">Active Deliverables</p>
                <h3 className="text-lg sm:text-2xl font-bold text-slate-900">{activeTasks}</h3>
              </div>
              <p className="text-[10px] sm:text-[11px] text-amber-600 font-medium mt-2 pt-2 border-t border-slate-100">
                {pendingTasks} pending
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-t-4 border-t-emerald-500 flex flex-col justify-between">
              <div>
                <p className="text-slate-500 text-[11px] sm:text-xs font-medium mb-1">Completed</p>
                <h3 className="text-lg sm:text-2xl font-bold text-emerald-600">{completedTasks}</h3>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                Total resolved
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-t-4 border-t-rose-500 flex flex-col justify-between">
              <div>
                <p className="text-slate-500 text-[11px] sm:text-xs font-medium mb-1 flex items-center gap-1.5">
                  <HiOutlineExclamationTriangle className="w-3.5 h-3.5 text-rose-400" />
                  High Priority
                </p>
                <h3 className="text-lg sm:text-2xl font-bold text-rose-600">{highPriorityTasks}</h3>
              </div>
              <p className="text-[10px] sm:text-[11px] text-rose-600 font-medium mt-2 pt-2 border-t border-slate-100">
                Needs attention
              </p>
            </div>
          </>
        )}

        {hasProjectsPerm && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-t-4 border-t-purple-500 flex flex-col justify-between">
            <div>
              <p className="text-slate-500 text-[11px] sm:text-xs font-medium mb-1 flex items-center gap-1.5">
                <HiOutlineFolder className="w-3.5 h-3.5 text-slate-400" />
                Active Projects
              </p>
              <h3 className="text-lg sm:text-2xl font-bold text-slate-900">{projects.length}</h3>
            </div>
            <p className="text-[10px] sm:text-[11px] text-purple-600 font-medium mt-2 pt-2 border-t border-slate-100">
              Company projects
            </p>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-t-4 border-t-cyan-500 flex flex-col justify-between">
          <div>
            <p className="text-slate-500 text-[11px] sm:text-xs font-medium mb-1 flex items-center gap-1.5">
              <HiOutlineClipboardDocumentList className="w-3.5 h-3.5 text-slate-400" />
              My Pending
            </p>
            <h3 className="text-lg sm:text-2xl font-bold text-cyan-600">{myPendingTasks}</h3>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
            Assigned to you
          </p>
        </div>
      </div>

      {/* ===================== PAYROLL SPOTLIGHT ===================== */}
      {hasPayrollPerm && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 lg:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">Payroll & Deductions Analytics</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Current month salary disbursements & breakdown.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Link
                to="/admin/salary-management"
                className="px-2.5 sm:px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] sm:text-xs font-semibold transition-colors whitespace-nowrap"
              >
                Salary Structures
              </Link>
              <Link
                to="/admin/payroll-dashboard"
                className="px-2.5 sm:px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] sm:text-xs font-semibold transition-colors whitespace-nowrap"
              >
                Generate Slips
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Bar Chart */}
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
              <h3 className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 sm:mb-4">
                Payout vs Deductions
              </h3>
              <div className="h-44 sm:h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={payrollBreakdownData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        color: '#0f172a',
                        fontSize: '12px',
                      }}
                      formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Amount']}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Slips */}
            <div className="lg:col-span-2 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
              <h3 className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Recent Salary Slips ({salarySlips.length})
              </h3>
              {salarySlips.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                    <HiOutlineDocumentCheck className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-slate-600">No salary slips yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Generate slips to process payroll.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-48 scrollbar-thin scrollbar-thumb-slate-300">
                  <table className="w-full text-left text-[11px] sm:text-xs text-slate-700 min-w-[480px]">
                    <thead className="bg-white text-slate-600 sticky top-0 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="p-2 sm:p-2.5">Employee</th>
                        <th className="p-2 sm:p-2.5 text-right text-emerald-700 whitespace-nowrap">Gross</th>
                        <th className="p-2 sm:p-2.5 text-right text-rose-700 whitespace-nowrap">Deduction</th>
                        <th className="p-2 sm:p-2.5 text-right text-indigo-700 whitespace-nowrap">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {salarySlips.slice(0, 6).map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2 sm:p-2.5 font-medium text-slate-900 truncate max-w-[120px]">
                            {s.employeeName || s.user?.name}
                          </td>
                          <td className="p-2 sm:p-2.5 text-right font-mono text-emerald-700 whitespace-nowrap">
                            ₹{Number(s.grossEarnings || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="p-2 sm:p-2.5 text-right font-mono text-rose-700 whitespace-nowrap">
                            ₹{Number(s.totalDeductions || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="p-2 sm:p-2.5 text-right font-mono font-bold text-indigo-700 whitespace-nowrap">
                            ₹{Number(s.netSalary || 0).toLocaleString('en-IN')}
                          </td>
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

      {/* ===================== TASKS & OPERATIONS ===================== */}
      {hasTasksPerm && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Pie Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
              <HiOutlineChartPie className="w-4 h-4 text-indigo-600" />
              Task Status
            </h3>
            <div className="h-48 sm:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={taskStatusData} innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={5}>
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      color: '#0f172a',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-2">
              {taskStatusData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-600 font-medium">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="whitespace-nowrap">
                    {d.name} ({d.value})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* High Priority Table */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-3 sm:mb-4">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                High Priority & Active Deliverables
              </h3>
              <Link
                to="/admin/tasks"
                className="text-[11px] sm:text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 whitespace-nowrap"
              >
                View All <HiOutlineArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-[520px] sm:min-w-0 px-4 sm:px-0">
                <table className="w-full text-left text-[11px] sm:text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2 sm:p-2.5">Task</th>
                      <th className="p-2 sm:p-2.5">Project</th>
                      <th className="p-2 sm:p-2.5">Assignee</th>
                      <th className="p-2 sm:p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tasks
                      .filter((t) => t.priority === 'High' || t.status === 'In Progress')
                      .slice(0, 5)
                      .map((t) => (
                        <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2 sm:p-2.5 font-medium text-slate-900 max-w-xs truncate">
                            {t.title}
                          </td>
                          <td className="p-2 sm:p-2.5 text-slate-500 truncate max-w-[100px]">
                            {t.project?.name || 'General'}
                          </td>
                          <td className="p-2 sm:p-2.5 text-slate-600 truncate max-w-[100px]">
                            {t.assignedTo?.name || 'Unassigned'}
                          </td>
                          <td className="p-2 sm:p-2.5">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${t.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : t.status === 'In Progress'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                            >
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    {tasks.length === 0 && (
                      <tr>
                        <td colSpan="4" className="p-6 text-center text-slate-400">
                          No tasks currently assigned.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MY DELIVERABLES + ANNOUNCEMENTS ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* My Tasks */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex justify-between items-center gap-2 mb-3 sm:mb-4">
            <h3 className="text-sm font-bold text-slate-900 truncate">
              My Deliverables ({myTasks.length})
            </h3>
            <Link
              to="/admin/tasks"
              className="text-[11px] sm:text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 whitespace-nowrap"
            >
              Task Board <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2 sm:space-y-2.5">
            {myTasks.slice(0, 5).map((t) => (
              <div
                key={t._id}
                className="p-2.5 sm:p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 hover:bg-slate-100/60 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs text-slate-900 truncate">{t.title}</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                    {t.project?.name || 'General Project'} • Due:{' '}
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-IN') : 'N/A'}
                  </div>
                </div>
                <span
                  className={`self-start sm:self-auto px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${t.status === 'Completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : t.status === 'In Progress'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                >
                  {t.status}
                </span>
              </div>
            ))}
            {myTasks.length === 0 && (
              <div className="text-center py-8">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                  <HiOutlineCheckCircle className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-600">No tasks assigned</p>
                <p className="text-[11px] text-slate-400 mt-0.5">You're all caught up!</p>
              </div>
            )}
          </div>
        </div>

        {/* Announcements Widget */}
        <div>
          <AnnouncementsWidget />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;