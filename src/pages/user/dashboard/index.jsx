import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import AnnouncementsWidget from '../../../components/AnnouncementsWidget';

const UserDashboard = () => {
  const { user } = useAuth();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return data;
    }
  });

  const tasksList = Array.isArray(tasks) ? tasks : [];
  const total = tasksList.length;
  const completed = tasksList.filter(t => t.status === 'Completed').length;
  const pending = tasksList.filter(t => t.status === 'Pending').length;
  const inProgress = tasksList.filter(t => t.status === 'In Progress').length;
  const onHold = tasksList.filter(t => t.status === 'On Hold').length;
  
  const now = new Date();
  const overdue = tasksList.filter(t => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < now).length;

  const upcomingDeadlines = tasksList
    .filter(t => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  // Get the most recent history logs across all tasks
  const recentActivities = tasksList
    .flatMap(task => task.history?.map(h => ({ ...h, taskTitle: task.title, taskId: task._id })) || [])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">My Dashboard</h1>
        <p className="text-slate-400">Welcome, {user?.name} ({user?.designation})</p>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/50 shadow-lg">
          <p className="text-slate-400 text-sm font-medium mb-1">Total Assigned</p>
          <p className="text-3xl font-bold text-white">{total}</p>
        </div>
        <div className="bg-slate-800/60 p-5 rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.1)]">
          <p className="text-indigo-400 text-sm font-medium mb-1">In Progress</p>
          <p className="text-3xl font-bold text-white">{inProgress}</p>
        </div>
        <div className="bg-slate-800/60 p-5 rounded-xl border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
          <p className="text-green-400 text-sm font-medium mb-1">Completed</p>
          <p className="text-3xl font-bold text-white">{completed}</p>
        </div>
        <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-500/30 shadow-lg">
          <p className="text-slate-400 text-sm font-medium mb-1">Pending/Hold</p>
          <p className="text-3xl font-bold text-white">{pending + onHold}</p>
        </div>
        <div className="bg-slate-800/60 p-5 rounded-xl border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <p className="text-red-400 text-sm font-medium mb-1">Overdue</p>
          <p className="text-3xl font-bold text-white">{overdue}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Productivity Summary */}
        <div className="lg:col-span-1 glass-panel p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold text-white mb-6 w-full text-left">Productivity Summary</h3>
          <div className="relative w-40 h-40 mb-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" className="text-slate-800 stroke-current" strokeWidth="12" fill="none" />
              <circle 
                cx="80" cy="80" r="70" 
                className="text-indigo-500 stroke-current" 
                strokeWidth="12" 
                fill="none" 
                strokeDasharray={`${2 * Math.PI * 70}`} 
                strokeDashoffset={`${2 * Math.PI * 70 * (1 - completionRate / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{completionRate}%</span>
              <span className="text-xs text-slate-400">Completed</span>
            </div>
          </div>
          <p className="text-slate-300 text-sm">
            You have completed <span className="font-semibold text-white">{completed}</span> out of <span className="font-semibold text-white">{total}</span> tasks assigned to you.
          </p>
        </div>

        {/* Upcoming Deadlines */}
        <div className="lg:col-span-2 glass-panel p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Upcoming Deadlines</h3>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-slate-400 text-sm py-4">No upcoming deadlines.</p>
          ) : (
            <div className="space-y-4">
              {upcomingDeadlines.map(task => (
                <div key={task._id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex justify-between items-center hover:bg-slate-800 transition-colors">
                  <div>
                    <h4 className="font-medium text-white">{task.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">Assigned by: {task.assignedBy?.name || 'Unknown'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold mb-1 ${
                        task.priority === 'High' ? 'bg-red-500/10 text-red-400' :
                        task.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                      {task.priority} Priority
                    </span>
                    <p className="text-sm font-medium text-amber-400">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

        {/* Recent Activity & Announcements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="glass-panel p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Task Activities</h3>
            {recentActivities.length === 0 ? (
              <p className="text-slate-400 text-sm py-4">No recent activity found.</p>
            ) : (
              <div className="space-y-0 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:ml-[0.5rem] before:h-full before:w-0.5 before:bg-slate-700">
                {recentActivities.map((activity, i) => (
                  <div key={i} className="relative pl-6 md:pl-8 py-3 group">
                    <div className="absolute left-0 md:left-2 top-4 w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)] outline outline-4 outline-slate-900"></div>
                    <div className="bg-slate-800/40 hover:bg-slate-800/80 transition-colors p-3 rounded-lg border border-slate-700/50 inline-block">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 mb-1">
                        <span className="font-medium text-slate-200 text-sm">{activity.taskTitle}</span>
                        <span className="text-xs text-slate-500">{new Date(activity.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-400 text-sm">
                        {activity.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <AnnouncementsWidget />
          </div>
        </div>

    </div>
  );
};

export default UserDashboard;
