import { useQuery } from '@tanstack/react-query';
import api from '../../../api/axios';

const TeamLeadPerformancePage = () => {
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

  // Calculate metrics per user
  const userMetrics = users?.map(user => {
    const userTasks = tasks?.filter(task => task.assignedTo?._id === user._id) || [];
    const total = userTasks.length;
    let completed = 0;
    let pending = 0;
    let inProgress = 0;
    let overdue = 0;
    
    const now = new Date();

    userTasks.forEach(task => {
      if (task.status === 'Completed') completed++;
      if (task.status === 'Pending') pending++;
      if (task.status === 'In Progress') inProgress++;
      
      if (task.dueDate && new Date(task.dueDate) < now && task.status !== 'Completed') {
        overdue++;
      }
    });

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      ...user,
      metrics: {
        total,
        completed,
        pending,
        inProgress,
        overdue,
        completionRate
      }
    };
  }).sort((a, b) => b.metrics.completionRate - a.metrics.completionRate) || [];

  return (
    <div>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white">Performance Analysis</h1>
          <p className="text-slate-400">Analyze individual employee performance within your team.</p>
        </div>
      </div>
      
      {userMetrics.length === 0 ? (
        <div className="glass-panel p-6 flex flex-col items-center justify-center text-center py-12">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-1">No Team Members Found</h3>
          <p className="text-slate-400 max-w-sm">Add users to your team to start analyzing performance.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {userMetrics.map(member => (
            <div key={member._id} className="glass-panel p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* User Info */}
                <div className="flex items-center gap-4 min-w-[200px]">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{member.name}</h3>
                    <p className="text-sm text-slate-400">{member.designation}</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 text-center">
                    <p className="text-xs text-slate-400 mb-1">Total Assigned</p>
                    <p className="text-xl font-bold text-white">{member.metrics.total}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 text-center">
                    <p className="text-xs text-slate-400 mb-1">Completed</p>
                    <p className="text-xl font-bold text-green-400">{member.metrics.completed}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 text-center relative">
                    <p className="text-xs text-slate-400 mb-1">In Progress</p>
                    <p className="text-xl font-bold text-indigo-400">{member.metrics.inProgress}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 text-center">
                    <p className="text-xs text-slate-400 mb-1">Overdue</p>
                    <p className="text-xl font-bold text-red-400">{member.metrics.overdue}</p>
                  </div>
                </div>

                {/* Completion Progress Bar */}
                <div className="min-w-[150px]">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-medium text-slate-300">Completion</span>
                    <span className="text-lg font-bold text-white">{member.metrics.completionRate}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        member.metrics.completionRate > 75 ? 'bg-green-500' : 
                        member.metrics.completionRate > 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} 
                      style={{ width: `${member.metrics.completionRate}%` }}
                    ></div>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamLeadPerformancePage;
