import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import AnnouncementsWidget from '../../../components/AnnouncementsWidget';
import {
  HiOutlineClipboardDocumentList,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineEllipsisHorizontalCircle,
  HiOutlineExclamationTriangle
} from 'react-icons/hi2';

const UserDashboard = () => {
  const { user } = useAuth();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['myTasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks?myTasks=true');
      return Array.isArray(data) ? data : [];
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
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Workspace Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back, <span className="font-semibold text-slate-800">{user?.name}</span> ({user?.designation || user?.role})</p>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs border-t-4 border-t-slate-400">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Assigned</p>
          <p className="text-3xl font-extrabold text-slate-900">{total}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs border-t-4 border-t-indigo-600">
          <p className="text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">In Progress</p>
          <p className="text-3xl font-extrabold text-indigo-700">{inProgress}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs border-t-4 border-t-emerald-500">
          <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-1">Completed</p>
          <p className="text-3xl font-extrabold text-emerald-600">{completed}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs border-t-4 border-t-amber-500">
          <p className="text-amber-600 text-xs font-semibold uppercase tracking-wider mb-1">Pending/Hold</p>
          <p className="text-3xl font-extrabold text-amber-600">{pending + onHold}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs border-t-4 border-t-rose-500">
          <p className="text-rose-600 text-xs font-semibold uppercase tracking-wider mb-1">Overdue</p>
          <p className="text-3xl font-extrabold text-rose-600">{overdue}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Productivity Summary */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col items-center justify-center text-center">
          <h3 className="text-base font-bold text-slate-900 mb-6 w-full text-left">Productivity Summary</h3>
          <div className="relative w-40 h-40 mb-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" className="text-slate-100 stroke-current" strokeWidth="12" fill="none" />
              <circle 
                cx="80" cy="80" r="70" 
                className="text-indigo-600 stroke-current" 
                strokeWidth="12" 
                fill="none" 
                strokeDasharray={`${2 * Math.PI * 70}`} 
                strokeDashoffset={`${2 * Math.PI * 70 * (1 - completionRate / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-slate-900">{completionRate}%</span>
              <span className="text-xs text-slate-500 font-medium">Completed</span>
            </div>
          </div>
          <p className="text-slate-600 text-xs">
            You resolved <span className="font-bold text-slate-900">{completed}</span> out of <span className="font-bold text-slate-900">{total}</span> deliverables assigned to you.
          </p>
        </div>

        {/* Upcoming Deadlines */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-4">Upcoming Deadlines</h3>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-slate-400 text-xs italic py-8 text-center">No upcoming deadlines.</p>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map(task => (
                <div key={task._id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center hover:bg-slate-100/60 transition-colors">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-xs">{task.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Assigned by: <span className="text-slate-700 font-medium">{task.assignedBy?.name || 'Manager'}</span></p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold mb-1 ${
                        task.priority === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        task.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                      {task.priority} Priority
                    </span>
                    <p className="text-xs font-semibold text-slate-700">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-4">Recent Task Activities</h3>
          {recentActivities.length === 0 ? (
            <p className="text-slate-400 text-xs italic py-8 text-center">No recent activity logs.</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                    <span className="font-semibold text-slate-900 text-xs">{activity.taskTitle}</span>
                    <span className="text-[10px] text-slate-400">{new Date(activity.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-600 text-xs">
                    {activity.action}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <AnnouncementsWidget />
        </div>
      </div>

    </div>
  );
};

export default UserDashboard;
