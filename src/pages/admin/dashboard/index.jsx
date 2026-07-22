import { useQuery } from '@tanstack/react-query';
import AnnouncementsWidget from '../../../components/AnnouncementsWidget';
import api from '../../../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const AdminDashboard = () => {
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 border-t-4 border-indigo-500">
          <p className="text-slate-400 text-sm font-medium mb-1">Total Users</p>
          <h3 className="text-3xl font-bold text-white">{totalUsers}</h3>
        </div>
        <div className="glass-panel p-5 border-t-4 border-yellow-500">
          <p className="text-slate-400 text-sm font-medium mb-1">Active Tasks</p>
          <h3 className="text-3xl font-bold text-white">{activeTasks}</h3>
        </div>
        <div className="glass-panel p-5 border-t-4 border-green-500">
          <p className="text-slate-400 text-sm font-medium mb-1">Completed Tasks</p>
          <h3 className="text-3xl font-bold text-white">{completedTasks}</h3>
        </div>
        <div className="glass-panel p-5 border-t-4 border-blue-500">
          <p className="text-slate-400 text-sm font-medium mb-1">System Status</p>
          <h3 className="text-3xl font-bold text-green-400">Online</h3>
        </div>
      </div>

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
