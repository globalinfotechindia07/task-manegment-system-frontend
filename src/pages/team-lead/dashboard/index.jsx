import { useQuery } from '@tanstack/react-query';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import AnnouncementsWidget from '../../../components/AnnouncementsWidget';

const TeamLeadDashboard = () => {
  const { user } = useAuth();

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['team-users'],
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
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const teamMembersCount = users?.length || 0;
  
  // Tasks stats
  let totalTasks = 0;
  let inProgressTasks = 0;
  let completedTasks = 0;
  let pendingTasks = 0;
  let overdueTasks = 0;
  
  const now = new Date();

  if (tasks) {
    totalTasks = tasks.length;
    tasks.forEach(task => {
      if (task.status === 'In Progress') inProgressTasks++;
      if (task.status === 'Completed') completedTasks++;
      if (task.status === 'Pending') pendingTasks++;
      
      if (task.dueDate && new Date(task.dueDate) < now && task.status !== 'Completed') {
        overdueTasks++;
      }
    });
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Team Dashboard</h1>
        <p className="text-slate-400">Welcome back, {user?.name}. Here is an overview of your team's performance.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6 border-t-4 border-t-blue-500">
          <p className="text-slate-400 text-sm font-medium mb-2">Team Members</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-bold text-white">{teamMembersCount}</h3>
            <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 border-t-4 border-t-indigo-500">
          <p className="text-slate-400 text-sm font-medium mb-2">Total Tasks Assigned</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-bold text-white">{totalTasks}</h3>
            <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="glass-panel p-6 border-t-4 border-t-green-500">
          <p className="text-slate-400 text-sm font-medium mb-2">Completed Tasks</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-bold text-white">{completedTasks}</h3>
            <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 border-t-4 border-t-yellow-500">
          <p className="text-slate-400 text-sm font-medium mb-2">In Progress</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-bold text-white">{inProgressTasks}</h3>
            <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 border-t-4 border-t-slate-500">
          <p className="text-slate-400 text-sm font-medium mb-2">Pending</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-bold text-white">{pendingTasks}</h3>
            <div className="w-10 h-10 bg-slate-500/10 rounded-full flex items-center justify-center text-slate-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 border-t-4 border-t-red-500">
          <p className="text-slate-400 text-sm font-medium mb-2">Overdue Tasks</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-bold text-white">{overdueTasks}</h3>
            <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center text-red-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-slate-700/50 shrink-0">
            <h2 className="text-lg font-bold text-white">Recent Activities</h2>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="space-y-4">
              {tasks?.slice(0, 5).map(task => (
                <div key={task._id} className="flex items-center gap-4 bg-slate-800/30 p-4 rounded-lg">
                  <div className={`w-2 h-10 rounded-full ${
                    task.status === 'Completed' ? 'bg-green-500' :
                    task.status === 'In Progress' ? 'bg-indigo-500' :
                    'bg-slate-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{task.title}</h4>
                    <p className="text-xs text-slate-400 truncate">Assigned to: {task.assignedTo?.name || 'Unassigned'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                      task.status === 'Completed' ? 'bg-green-500/10 text-green-400' :
                      task.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400' :
                      'bg-slate-500/10 text-slate-400'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
              {(!tasks || tasks.length === 0) && (
                <p className="text-slate-500 text-sm italic">No recent activities found.</p>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <AnnouncementsWidget />
        </div>
      </div>

    </div>
  );
};

export default TeamLeadDashboard;
