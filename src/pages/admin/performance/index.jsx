import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  HiOutlineClipboardDocumentCheck,
  HiOutlineCheckCircle,
  HiOutlineArrowTrendingUp,
  HiOutlineClock,
  HiOutlineChartPie,
  HiOutlineTrophy,
  HiOutlineUserGroup,
} from 'react-icons/hi2';
import api from '../../../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#64748b', '#ec4899'];

const AdminPerformancePage = () => {
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return data;
    },
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });

  const isLoading = tasksLoading || usersLoading;

  const metrics = useMemo(() => {
    if (!tasks || !users) return null;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
    const pendingTasks = tasks.filter((t) => t.status === 'Pending' || t.status === 'Awaiting Approval').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
    const onHoldTasks = tasks.filter((t) => t.status === 'On Hold').length;

    const overdueTasks = tasks.filter((t) => {
      if (t.status === 'Completed') return false;
      if (!t.dueDate) return false;
      return new Date(t.dueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
    }).length;

    const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      onHoldTasks,
      overdueTasks,
      completionRate,
    };
  }, [tasks, users]);

  const chartData = useMemo(() => {
    if (!metrics) return [];
    return [
      { name: 'Completed', value: metrics.completedTasks },
      { name: 'In Progress', value: metrics.inProgressTasks },
      { name: 'Pending', value: metrics.pendingTasks },
      { name: 'On Hold', value: metrics.onHoldTasks },
    ];
  }, [metrics]);

  const userMetrics = useMemo(() => {
    if (!tasks || !users) return [];

    const userStats = users.map((user) => {
      const userTasks = tasks.filter(
        (t) => t.assignedTo && (t.assignedTo._id === user._id || t.assignedTo === user._id)
      );
      const total = userTasks.length;
      const completed = userTasks.filter((t) => t.status === 'Completed').length;
      const inProgress = userTasks.filter((t) => t.status === 'In Progress').length;
      const rate = total ? Math.round((completed / total) * 100) : 0;

      return {
        ...user,
        totalTasks: total,
        completedTasks: completed,
        inProgressTasks: inProgress,
        completionRate: rate,
      };
    });

    return userStats.sort((a, b) => b.completionRate - a.completionRate || b.totalTasks - a.totalTasks);
  }, [tasks, users]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16 min-h-[400px]">
        <div className="w-9 h-9 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Reusable KPI card data
  const kpiCards = [
    {
      label: 'Total Tasks',
      value: metrics?.totalTasks || 0,
      icon: HiOutlineClipboardDocumentCheck,
      color: 'indigo',
    },
    {
      label: 'Completed',
      value: metrics?.completedTasks || 0,
      icon: HiOutlineCheckCircle,
      color: 'emerald',
    },
    {
      label: 'Success Rate',
      value: `${metrics?.completionRate || 0}%`,
      icon: HiOutlineArrowTrendingUp,
      color: 'blue',
    },
    {
      label: 'Overdue Tasks',
      value: metrics?.overdueTasks || 0,
      icon: HiOutlineClock,
      color: 'rose',
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ===================== PAGE HEADER ===================== */}
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Performance Analysis
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Analyze team and individual performance metrics.
        </p>
      </div>

      {/* ===================== KPI CARDS ===================== */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 truncate">
                    {card.label}
                  </p>
                  <h3 className="text-lg sm:text-2xl font-bold text-slate-900 font-mono truncate">
                    {card.value}
                  </h3>
                </div>
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 bg-${card.color}-50 border border-${card.color}-200 rounded-xl flex items-center justify-center text-${card.color}-700 shrink-0`}
                >
                  <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===================== CHARTS ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Pie Chart — Task Status Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-4 sm:mb-6 flex items-center gap-2">
            <HiOutlineChartPie className="w-4 h-4 text-indigo-600" />
            Task Status Distribution
          </h3>
          <div className="h-[240px] sm:h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    window.innerWidth >= 640 ? `${name} ${(percent * 100).toFixed(0)}%` : `${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={window.innerWidth >= 640 ? 95 : 75}
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    color: '#0f172a',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#0f172a', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart — Top Performers */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-4 sm:mb-6 flex items-center gap-2">
            <HiOutlineTrophy className="w-4 h-4 text-amber-500" />
            Top Performers
          </h3>
          <div className="h-[240px] sm:h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={userMetrics.slice(0, 5)}
                margin={{ top: 20, right: 16, left: 0, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#64748b"
                  width={window.innerWidth >= 640 ? 90 : 65}
                  tick={{ fontSize: window.innerWidth >= 640 ? 12 : 10 }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    color: '#0f172a',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                  }}
                  cursor={{ fill: '#f8fafc' }}
                  itemStyle={{ color: '#0f172a', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                <Bar dataKey="completedTasks" name="Completed" fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="inProgressTasks" name="In Progress" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ===================== INDIVIDUAL PERFORMANCE TABLE ===================== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <HiOutlineUserGroup className="w-4 h-4 text-slate-500" />
            Individual Performance
          </h3>
          <span className="text-[11px] sm:text-xs text-slate-500">
            {userMetrics.length} member{userMetrics.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Mobile Card View (< md) */}
        <div className="md:hidden divide-y divide-slate-100">
          {userMetrics.map((user) => (
            <div key={user._id} className="p-4 hover:bg-slate-50/60 transition-colors">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                  {user.name?.substring(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 text-xs truncate">{user.name}</p>
                  <span className="inline-flex px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-medium text-slate-600 mt-0.5">
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-2 text-center">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                  <p className="text-[9px] text-slate-500 uppercase font-semibold">Total</p>
                  <p className="text-xs font-bold text-slate-900">{user.totalTasks}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-1.5">
                  <p className="text-[9px] text-emerald-700 uppercase font-semibold">Done</p>
                  <p className="text-xs font-bold text-emerald-700">{user.completedTasks}</p>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-1.5">
                  <p className="text-[9px] text-indigo-700 uppercase font-semibold">WIP</p>
                  <p className="text-xs font-bold text-indigo-700">{user.inProgressTasks}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Success Rate</span>
                  <span className="text-[11px] font-bold text-slate-700">{user.completionRate}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full ${user.completionRate >= 80
                      ? 'bg-emerald-500'
                      : user.completionRate >= 50
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                      }`}
                    style={{ width: `${user.completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          {userMetrics.length === 0 && (
            <div className="p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                <HiOutlineUserGroup className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-700">No data available</p>
              <p className="text-xs text-slate-500 mt-1">Performance data will appear here.</p>
            </div>
          )}
        </div>

        {/* Desktop Table View (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 min-w-[720px]">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 text-[11px] uppercase font-semibold">
              <tr>
                <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap">Employee</th>
                <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap">Role</th>
                <th className="px-4 lg:px-6 py-3.5 text-center whitespace-nowrap">Total</th>
                <th className="px-4 lg:px-6 py-3.5 text-center whitespace-nowrap">Completed</th>
                <th className="px-4 lg:px-6 py-3.5 text-center whitespace-nowrap">In Progress</th>
                <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap">Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {userMetrics.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 lg:px-6 py-3.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-[11px] uppercase shrink-0">
                        {user.name?.substring(0, 2)}
                      </div>
                      <span className="font-semibold text-slate-900 text-xs truncate max-w-[160px]">
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-3.5">
                    <span className="inline-flex px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-700 whitespace-nowrap">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-3.5 text-center text-slate-900 font-semibold font-mono text-xs">
                    {user.totalTasks}
                  </td>
                  <td className="px-4 lg:px-6 py-3.5 text-center text-emerald-700 font-semibold font-mono text-xs">
                    {user.completedTasks}
                  </td>
                  <td className="px-4 lg:px-6 py-3.5 text-center text-indigo-700 font-semibold font-mono text-xs">
                    {user.inProgressTasks}
                  </td>
                  <td className="px-4 lg:px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-full bg-slate-100 rounded-full h-1.5 max-w-[100px] overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full ${user.completionRate >= 80
                            ? 'bg-emerald-500'
                            : user.completionRate >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                            }`}
                          style={{ width: `${user.completionRate}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                        {user.completionRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {userMetrics.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <p className="text-sm font-medium text-slate-700">No data available</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPerformancePage;