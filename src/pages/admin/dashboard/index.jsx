import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AnnouncementsWidget from '../../../components/AnnouncementsWidget';
import api from '../../../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const AdminDashboard = () => {
  const [activeFilter, setActiveFilter] = useState(null); // 'users', 'active_tasks', 'completed_tasks', 'pending_tasks', 'high_priority'

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    }
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return data;
    }
  });

  if (usersLoading || tasksLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalUsers = users?.length || 0;
  const activeTasks = tasks?.filter(t => t.status === 'In Progress' || t.status === 'Pending').length || 0;
  const completedTasks = tasks?.filter(t => t.status === 'Completed').length || 0;
  const pendingTasks = tasks?.filter(t => t.status === 'Pending').length || 0;
  const highPriorityTasks = tasks?.filter(t => t.priority === 'High').length || 0;

  // Filter Data for Table
  const getFilteredData = () => {
    switch (activeFilter) {
      case 'users': return users || [];
      case 'active_tasks': return tasks?.filter(t => t.status === 'In Progress' || t.status === 'Pending') || [];
      case 'completed_tasks': return tasks?.filter(t => t.status === 'Completed') || [];
      case 'pending_tasks': return tasks?.filter(t => t.status === 'Pending') || [];
      case 'high_priority': return tasks?.filter(t => t.priority === 'High') || [];
      default: return null;
    }
  };

  const filteredData = getFilteredData();

  // Task Status Data for Pie Chart
  const taskStatusData = [
    { name: 'Pending', value: tasks?.filter(t => t.status === 'Pending').length || 0 },
    { name: 'In Progress', value: tasks?.filter(t => t.status === 'In Progress').length || 0 },
    { name: 'Completed', value: tasks?.filter(t => t.status === 'Completed').length || 0 },
  ];

  const COLORS = ['#6366f1', '#f59e0b', '#10b981'];

  // Tasks by Priority Data for Bar Chart
  const taskPriorityData = [
    { name: 'High', count: tasks?.filter(t => t.priority === 'High').length || 0 },
    { name: 'Medium', count: tasks?.filter(t => t.priority === 'Medium').length || 0 },
    { name: 'Normal', count: tasks?.filter(t => t.priority === 'Normal').length || 0 },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-slate-400">Welcome to the central admin panel.</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div 
          onClick={() => setActiveFilter(activeFilter === 'users' ? null : 'users')}
          className={`glass-panel p-4 border-t-4 border-indigo-500 cursor-pointer transition-all hover:scale-105 ${activeFilter === 'users' ? 'ring-2 ring-indigo-500 bg-indigo-500/10' : ''}`}
        >
          <p className="text-slate-400 text-xs font-medium mb-1">Total Users</p>
          <h3 className="text-2xl font-bold text-white">{totalUsers}</h3>
        </div>
        <div 
          onClick={() => setActiveFilter(activeFilter === 'active_tasks' ? null : 'active_tasks')}
          className={`glass-panel p-4 border-t-4 border-yellow-500 cursor-pointer transition-all hover:scale-105 ${activeFilter === 'active_tasks' ? 'ring-2 ring-yellow-500 bg-yellow-500/10' : ''}`}
        >
          <p className="text-slate-400 text-xs font-medium mb-1">Active Tasks</p>
          <h3 className="text-2xl font-bold text-white">{activeTasks}</h3>
        </div>
        <div 
          onClick={() => setActiveFilter(activeFilter === 'completed_tasks' ? null : 'completed_tasks')}
          className={`glass-panel p-4 border-t-4 border-green-500 cursor-pointer transition-all hover:scale-105 ${activeFilter === 'completed_tasks' ? 'ring-2 ring-green-500 bg-green-500/10' : ''}`}
        >
          <p className="text-slate-400 text-xs font-medium mb-1">Completed</p>
          <h3 className="text-2xl font-bold text-white">{completedTasks}</h3>
        </div>
        <div 
          onClick={() => setActiveFilter(activeFilter === 'pending_tasks' ? null : 'pending_tasks')}
          className={`glass-panel p-4 border-t-4 border-orange-500 cursor-pointer transition-all hover:scale-105 ${activeFilter === 'pending_tasks' ? 'ring-2 ring-orange-500 bg-orange-500/10' : ''}`}
        >
          <p className="text-slate-400 text-xs font-medium mb-1">Pending</p>
          <h3 className="text-2xl font-bold text-white">{pendingTasks}</h3>
        </div>
        <div 
          onClick={() => setActiveFilter(activeFilter === 'high_priority' ? null : 'high_priority')}
          className={`glass-panel p-4 border-t-4 border-red-500 cursor-pointer transition-all hover:scale-105 ${activeFilter === 'high_priority' ? 'ring-2 ring-red-500 bg-red-500/10' : ''}`}
        >
          <p className="text-slate-400 text-xs font-medium mb-1">High Priority</p>
          <h3 className="text-2xl font-bold text-white">{highPriorityTasks}</h3>
        </div>
        <div className="glass-panel p-4 border-t-4 border-blue-500">
          <p className="text-slate-400 text-xs font-medium mb-1">System</p>
          <h3 className="text-2xl font-bold text-green-400">Online</h3>
        </div>
      </div>

      {/* Dynamic Data Table based on Filter */}
      {activeFilter && filteredData && (
        <div className="mt-6 glass-panel p-5 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white capitalize">
              {activeFilter.replace('_', ' ')} List
            </h3>
            <button onClick={() => setActiveFilter(null)} className="text-slate-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/50 text-slate-400 text-sm">
                  {activeFilter === 'users' ? (
                    <>
                      <th className="pb-3 px-2 font-medium">Name</th>
                      <th className="pb-3 px-2 font-medium">Email</th>
                      <th className="pb-3 px-2 font-medium">Role</th>
                      <th className="pb-3 px-2 font-medium">Designation</th>
                    </>
                  ) : (
                    <>
                      <th className="pb-3 px-2 font-medium">Task Title</th>
                      <th className="pb-3 px-2 font-medium">Assigned To</th>
                      <th className="pb-3 px-2 font-medium">Status</th>
                      <th className="pb-3 px-2 font-medium">Priority</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500">No records found.</td>
                  </tr>
                ) : (
                  filteredData.map((item, idx) => (
                    <tr key={item._id || idx} className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                      {activeFilter === 'users' ? (
                        <>
                          <td className="py-3 px-2 text-slate-200">{item.name}</td>
                          <td className="py-3 px-2 text-slate-400">{item.email}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-medium border ${item.role === 'Admin' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                              {item.role}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-slate-400">{item.designation || '-'}</td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-2 text-slate-200">{item.title}</td>
                          <td className="py-3 px-2 text-slate-400">{item.assignedTo?.name || 'Unassigned'}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-medium border ${
                              item.status === 'Completed' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 
                              item.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 
                              'bg-slate-700 text-slate-300 border-slate-600'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-medium border ${
                              item.priority === 'High' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 
                              item.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 
                              'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            }`}>
                              {item.priority}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-5">
          <h3 className="text-lg font-bold text-white mb-4">Task Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-5">
          <h3 className="text-lg font-bold text-white mb-4">Tasks by Priority</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskPriorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <RechartsTooltip cursor={{ fill: '#334155' }} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6">
        <div>
          <AnnouncementsWidget />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
