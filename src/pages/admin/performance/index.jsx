import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  HiOutlineClipboardDocumentCheck, 
  HiOutlineCheckCircle, 
  HiOutlineArrowTrendingUp, 
  HiOutlineClock 
} from 'react-icons/hi2';
import api from '../../../api/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#64748b', '#ec4899'];

const AdminPerformancePage = () => {
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return data;
    }
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    }
  });

  const isLoading = tasksLoading || usersLoading;

  // Calculate Overall Metrics
  const metrics = useMemo(() => {
    if (!tasks || !users) return null;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'Pending' || t.status === 'Awaiting Approval').length;
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
    const onHoldTasks = tasks.filter(t => t.status === 'On Hold').length;
    
    // Determine overdue tasks (status not completed and dueDate < today)
    const overdueTasks = tasks.filter(t => {
      if (t.status === 'Completed') return false;
      if (!t.dueDate) return false;
      return new Date(t.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
    }).length;

    const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      onHoldTasks,
      overdueTasks,
      completionRate
    };
  }, [tasks, users]);

  // Calculate Chart Data
  const chartData = useMemo(() => {
    if (!metrics) return [];
    return [
      { name: 'Completed', value: metrics.completedTasks },
      { name: 'In Progress', value: metrics.inProgressTasks },
      { name: 'Pending', value: metrics.pendingTasks },
      { name: 'On Hold', value: metrics.onHoldTasks },
    ];
  }, [metrics]);

  // Calculate User Metrics
  const userMetrics = useMemo(() => {
    if (!tasks || !users) return [];

    const userStats = users.map(user => {
      const userTasks = tasks.filter(t => t.assignedTo && (t.assignedTo._id === user._id || t.assignedTo === user._id));
      const total = userTasks.length;
      const completed = userTasks.filter(t => t.status === 'Completed').length;
      const inProgress = userTasks.filter(t => t.status === 'In Progress').length;
      const rate = total ? Math.round((completed / total) * 100) : 0;
      
      return {
        ...user,
        totalTasks: total,
        completedTasks: completed,
        inProgressTasks: inProgress,
        completionRate: rate
      };
    });

    // Sort by completion rate and then total tasks
    return userStats.sort((a, b) => b.completionRate - a.completionRate || b.totalTasks - a.totalTasks);
  }, [tasks, users]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Performance Analysis</h1>
        <p className="text-sm text-slate-500">Analyze team and individual performance metrics.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Tasks</p>
              <h3 className="text-2xl font-bold text-slate-900">{metrics?.totalTasks || 0}</h3>
            </div>
            <div className="w-11 h-11 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center text-indigo-700">
              <HiOutlineClipboardDocumentCheck className="w-6 h-6" />
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Completed</p>
              <h3 className="text-2xl font-bold text-slate-900">{metrics?.completedTasks || 0}</h3>
            </div>
            <div className="w-11 h-11 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center text-emerald-700">
              <HiOutlineCheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Success Rate</p>
              <h3 className="text-2xl font-bold text-slate-900">{metrics?.completionRate || 0}%</h3>
            </div>
            <div className="w-11 h-11 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center text-blue-700">
              <HiOutlineArrowTrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Overdue Tasks</p>
              <h3 className="text-2xl font-bold text-slate-900">{metrics?.overdueTasks || 0}</h3>
            </div>
            <div className="w-11 h-11 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-center text-rose-700">
              <HiOutlineClock className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-6">Task Status Distribution</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={95}
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#0f172a', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Completion Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-6">Top Performers</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={userMetrics.slice(0, 5)}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" stroke="#64748b" width={90} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                  itemStyle={{ color: '#0f172a', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
                <Bar dataKey="completedTasks" name="Completed" fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="inProgressTasks" name="In Progress" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed User Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-900">Individual Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4 font-semibold">Employee</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold text-center">Total Tasks</th>
                <th className="px-6 py-4 font-semibold text-center">Completed</th>
                <th className="px-6 py-4 font-semibold text-center">In Progress</th>
                <th className="px-6 py-4 font-semibold">Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {userMetrics.map(user => (
                <tr key={user._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
                      {user.name?.substring(0, 2)}
                    </div>
                    {user.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-medium text-slate-700">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-900 font-medium">{user.totalTasks}</td>
                  <td className="px-6 py-4 text-center text-emerald-700 font-semibold">{user.completedTasks}</td>
                  <td className="px-6 py-4 text-center text-indigo-700 font-semibold">{user.inProgressTasks}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-full bg-slate-100 rounded-full h-2 max-w-[100px] overflow-hidden border border-slate-200">
                        <div 
                          className={`h-2 rounded-full ${
                            user.completionRate >= 80 ? 'bg-emerald-500' :
                            user.completionRate >= 50 ? 'bg-amber-500' :
                            'bg-rose-500'
                          }`}
                          style={{ width: `${user.completionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{user.completionRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {userMetrics.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 text-xs">
                    No user data available.
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
