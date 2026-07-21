import { useQuery } from '@tanstack/react-query';
import api from '../../../api/axios';
import { useMemo } from 'react';

const HRDashboard = () => {
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    }
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return data;
    }
  });

  const { data: announcements = [], isLoading: isLoadingAnnouncements } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data } = await api.get('/announcements');
      return data;
    }
  });

  const activeUsers = useMemo(() => users.filter(u => u.status === 'Active' || u.status === undefined), [users]);
  
  const inProgressTasks = useMemo(() => tasks.filter(t => t.status === 'In Progress'), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t => t.status === 'Completed'), [tasks]);
  const pendingTasks = useMemo(() => tasks.filter(t => t.status === 'Pending' || t.status === 'On Hold'), [tasks]);
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const todaysTasks = useMemo(() => tasks.filter(t => {
    if (!t.startDate) return false;
    const sDate = new Date(t.startDate);
    return sDate >= today && sDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
  }), [tasks, today]);

  const overdueTasks = useMemo(() => tasks.filter(t => {
    if (t.status === 'Completed' || !t.dueDate) return false;
    const dDate = new Date(t.dueDate);
    return dDate < now;
  }), [tasks, now]);

  const usersWorking = useMemo(() => {
    const workingIds = new Set(inProgressTasks.map(t => t.assignedTo?._id?.toString()));
    return activeUsers.filter(u => workingIds.has(u._id?.toString()));
  }, [inProgressTasks, activeUsers]);

  if (isLoadingUsers || isLoadingTasks || isLoadingAnnouncements) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">HR Overview</h1>
        <p className="text-slate-400">Monitor organization-wide activities and employee performance.</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-400 mb-1">Total Active Users</p>
            <h3 className="text-3xl font-bold text-white">{activeUsers.length}</h3>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-400 mb-1">Users Working</p>
            <h3 className="text-3xl font-bold text-emerald-400">{usersWorking.length}</h3>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-400 mb-1">Today's Tasks</p>
            <h3 className="text-3xl font-bold text-indigo-400">{todaysTasks.length}</h3>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-5 border border-red-500/30 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-400 mb-1">Overdue Tasks</p>
            <h3 className="text-3xl font-bold text-red-400">{overdueTasks.length}</h3>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Organization Task Status & Summaries */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Task Overview
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-emerald-400 mb-1">{completedTasks.length}</p>
                <p className="text-sm text-slate-400">Completed</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-indigo-400 mb-1">{inProgressTasks.length}</p>
                <p className="text-sm text-slate-400">In Progress</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-slate-300 mb-1">{pendingTasks.length}</p>
                <p className="text-sm text-slate-400">Pending</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h2 className="text-lg font-bold text-white mb-6">Delayed Tasks Tracking</h2>
            {overdueTasks.length === 0 ? (
              <p className="text-slate-400 text-sm">No tasks are currently overdue. Great job team!</p>
            ) : (
              <div className="space-y-4">
                {overdueTasks.slice(0, 5).map(task => {
                  const hoursOverdue = Math.floor((now - new Date(task.dueDate)) / (1000 * 60 * 60));
                  const daysOverdue = Math.floor(hoursOverdue / 24);
                  const delayText = daysOverdue > 0 ? `${daysOverdue} days` : `${hoursOverdue} hours`;

                  return (
                    <div key={task._id} className="flex items-center justify-between p-4 bg-slate-800/50 border border-red-500/20 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">{task.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">Assigned to: <span className="text-slate-300">{task.assignedTo?.name || 'Unknown'}</span></p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">
                          Overdue by {delayText}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Announcements */}
        <div className="space-y-6">
          <div className="glass-panel p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                Recent Announcements
              </h2>
            </div>
            
            <div className="space-y-4">
              {announcements.length === 0 ? (
                <p className="text-slate-400 text-sm">No recent announcements.</p>
              ) : (
                announcements.slice(0, 4).map(ann => (
                  <div key={ann._id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-indigo-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-white font-medium text-sm leading-tight">{ann.title}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ml-2 ${
                        ann.priority === 'Urgent' ? 'bg-red-500/20 text-red-400' :
                        ann.priority === 'Important' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {ann.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">{ann.content}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                      <span>By {ann.createdBy?.name || 'HR'}</span>
                      <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
