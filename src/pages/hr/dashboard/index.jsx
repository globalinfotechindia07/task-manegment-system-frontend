import { useQuery } from '@tanstack/react-query';
import api from '../../../api/axios';
import { useMemo } from 'react';
import {
  HiOutlineUsers,
  HiOutlineBriefcase,
  HiOutlineCalendarDays,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineMegaphone
} from 'react-icons/hi2';

const HRDashboard = () => {
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return Array.isArray(data) ? data : [];
    }
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return Array.isArray(data) ? data : [];
    }
  });

  const { data: announcements = [], isLoading: isLoadingAnnouncements } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data } = await api.get('/announcements');
      return Array.isArray(data) ? data : [];
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ERP Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">HR Operations & Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor organization workforce, attendance, deadlines, and staff announcements.</p>
      </div>

      {/* Top ERP KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs border-t-4 border-t-blue-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Active Users</p>
          <h3 className="text-3xl font-extrabold text-slate-900">{activeUsers.length}</h3>
          <p className="text-xs text-slate-400 mt-1">Registered staff</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs border-t-4 border-t-emerald-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Active on Tasks</p>
          <h3 className="text-3xl font-extrabold text-emerald-600">{usersWorking.length}</h3>
          <p className="text-xs text-emerald-600 font-medium mt-1">Currently working</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs border-t-4 border-t-indigo-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Today's Tasks</p>
          <h3 className="text-3xl font-extrabold text-indigo-700">{todaysTasks.length}</h3>
          <p className="text-xs text-slate-400 mt-1">Scheduled for today</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs border-t-4 border-t-rose-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Overdue Deliverables</p>
          <h3 className="text-3xl font-extrabold text-rose-600">{overdueTasks.length}</h3>
          <p className="text-xs text-rose-600 font-medium mt-1">Requires follow-up</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Organization Task Status & Summaries */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
              <HiOutlineBriefcase className="w-5 h-5 text-indigo-600" />
              Workforce Task Overview
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <p className="text-3xl font-extrabold text-emerald-600 mb-1">{completedTasks.length}</p>
                <p className="text-xs font-semibold text-slate-600">Completed</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <p className="text-3xl font-extrabold text-indigo-700 mb-1">{inProgressTasks.length}</p>
                <p className="text-xs font-semibold text-slate-600">In Progress</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <p className="text-3xl font-extrabold text-amber-600 mb-1">{pendingTasks.length}</p>
                <p className="text-xs font-semibold text-slate-600">Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <HiOutlineExclamationTriangle className="w-5 h-5 text-rose-600" />
              Delayed Tasks Tracking
            </h2>
            {overdueTasks.length === 0 ? (
              <p className="text-slate-400 text-xs italic py-4">No tasks are currently overdue. All deadlines on track.</p>
            ) : (
              <div className="space-y-3">
                {overdueTasks.slice(0, 5).map(task => {
                  const hoursOverdue = Math.floor((now - new Date(task.dueDate)) / (1000 * 60 * 60));
                  const daysOverdue = Math.floor(hoursOverdue / 24);
                  const delayText = daysOverdue > 0 ? `${daysOverdue} days` : `${hoursOverdue} hours`;

                  return (
                    <div key={task._id} className="flex items-center justify-between p-3.5 bg-slate-50 border border-rose-200 rounded-xl">
                      <div>
                        <h4 className="text-slate-900 font-semibold text-xs">{task.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Assigned to: <span className="text-slate-800 font-medium">{task.assignedTo?.name || 'Unknown'}</span></p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-full">
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
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HiOutlineMegaphone className="w-5 h-5 text-amber-500" />
                Recent Announcements
              </h2>
            </div>
            
            <div className="space-y-3">
              {announcements.length === 0 ? (
                <p className="text-slate-400 text-xs italic py-6 text-center">No recent announcements.</p>
              ) : (
                announcements.slice(0, 4).map(ann => (
                  <div key={ann._id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="flex justify-between items-start mb-1.5">
                      <h4 className="text-slate-900 font-semibold text-xs leading-snug">{ann.title}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ml-2 ${
                        ann.priority === 'Urgent' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        ann.priority === 'Important' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {ann.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 mb-2">{ann.content}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-200/60">
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
