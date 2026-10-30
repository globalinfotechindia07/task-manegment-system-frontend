import { useQuery } from '@tanstack/react-query';
import { HiOutlineUsers } from 'react-icons/hi2';
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
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
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
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Performance Analysis</h1>
          <p className="text-sm text-slate-500">Analyze individual employee performance within your team.</p>
        </div>
      </div>
      
      {userMetrics.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-xs">
          <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <HiOutlineUsers className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">No Team Members Found</h3>
          <p className="text-sm text-slate-500 max-w-sm">Add users to your team to start analyzing performance.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {userMetrics.map(member => (
            <div key={member._id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* User Info */}
                <div className="flex items-center gap-4 min-w-[200px]">
                  <div className="w-11 h-11 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-base">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{member.name}</h3>
                    <p className="text-xs text-slate-500">{member.designation || 'Team Member'}</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-center">
                    <p className="text-xs font-medium text-slate-500 mb-0.5">Total</p>
                    <p className="text-lg font-bold text-slate-900">{member.metrics.total}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-center">
                    <p className="text-xs font-medium text-emerald-600 mb-0.5">Completed</p>
                    <p className="text-lg font-bold text-emerald-600">{member.metrics.completed}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-center">
                    <p className="text-xs font-medium text-indigo-600 mb-0.5">In Progress</p>
                    <p className="text-lg font-bold text-indigo-600">{member.metrics.inProgress}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-center">
                    <p className="text-xs font-medium text-rose-600 mb-0.5">Overdue</p>
                    <p className="text-lg font-bold text-rose-600">{member.metrics.overdue}</p>
                  </div>
                </div>

                {/* Completion Progress Bar */}
                <div className="min-w-[150px]">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-xs font-medium text-slate-500">Completion</span>
                    <span className="text-base font-bold text-slate-900">{member.metrics.completionRate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        member.metrics.completionRate >= 75 ? 'bg-emerald-500' : 
                        member.metrics.completionRate >= 40 ? 'bg-amber-500' : 'bg-rose-500'
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