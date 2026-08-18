import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Performance Analysis</h1>
        <p className="text-slate-400">Analyze team and individual performance metrics.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Total Tasks</p>
              <h3 className="text-3xl font-bold text-white">{metrics?.totalTasks || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Completed</p>
              <h3 className="text-3xl font-bold text-white">{metrics?.completedTasks || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Success Rate</p>
              <h3 className="text-3xl font-bold text-white">{metrics?.completionRate || 0}%</h3>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Overdue Tasks</p>
              <h3 className="text-3xl font-bold text-white">{metrics?.overdueTasks || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-rose-500/20 rounded-lg flex items-center justify-center text-rose-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Task Status Chart */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Task Status Distribution</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Completion Bar Chart */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Top Performers</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={userMetrics.slice(0, 5)}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  cursor={{ fill: '#334155', opacity: 0.4 }}
                />
                <Legend />
                <Bar dataKey="completedTasks" name="Completed" fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="inProgressTasks" name="In Progress" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed User Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Individual Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-slate-200 border-b border-slate-700/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Employee</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold text-center">Total Tasks</th>
                <th className="px-6 py-4 font-semibold text-center">Completed</th>
                <th className="px-6 py-4 font-semibold text-center">In Progress</th>
                <th className="px-6 py-4 font-semibold">Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {userMetrics.map(user => (
                <tr key={user._id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase">
                      {user.name?.substring(0, 2)}
                    </div>
                    {user.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">{user.totalTasks}</td>
                  <td className="px-6 py-4 text-center text-emerald-400 font-medium">{user.completedTasks}</td>
                  <td className="px-6 py-4 text-center text-indigo-400">{user.inProgressTasks}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-full bg-slate-700 rounded-full h-2 max-w-[100px]">
                        <div 
                          className={`h-2 rounded-full ${
                            user.completionRate >= 80 ? 'bg-emerald-500' :
                            user.completionRate >= 50 ? 'bg-yellow-500' :
                            'bg-rose-500'
                          }`}
                          style={{ width: `${user.completionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold">{user.completionRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {userMetrics.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
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
