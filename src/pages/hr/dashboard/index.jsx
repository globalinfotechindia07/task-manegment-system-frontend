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
  HiOutlineMegaphone,
  HiOutlineUserGroup,
  HiOutlineFire,
} from 'react-icons/hi2';

const getPriorityStyles = (priority) => {
  switch (priority) {
    case 'Urgent':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Important':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200';
  }
};

const HRDashboard = () => {
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: announcements = [], isLoading: isLoadingAnnouncements } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data } = await api.get('/announcements');
      return Array.isArray(data) ? data : [];
    },
  });

  const activeUsers = useMemo(
    () => users.filter((u) => u.status === 'Active' || u.status === undefined),
    [users]
  );
  const inProgressTasks = useMemo(() => tasks.filter((t) => t.status === 'In Progress'), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.status === 'Completed'), [tasks]);
  const pendingTasks = useMemo(
    () => tasks.filter((t) => t.status === 'Pending' || t.status === 'On Hold'),
    [tasks]
  );

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const todaysTasks = useMemo(
    () =>
      tasks.filter((t) => {
        if (!t.startDate) return false;
        const sDate = new Date(t.startDate);
        return sDate >= today && sDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
      }),
    [tasks, today]
  );

  const overdueTasks = useMemo(
    () =>
      tasks.filter((t) => {
        if (t.status === 'Completed' || !t.dueDate) return false;
        const dDate = new Date(t.dueDate);
        return dDate < now;
      }),
    [tasks, now]
  );

  const usersWorking = useMemo(() => {
    const workingIds = new Set(inProgressTasks.map((t) => t.assignedTo?._id?.toString()));
    return activeUsers.filter((u) => workingIds.has(u._id?.toString()));
  }, [inProgressTasks, activeUsers]);

  if (isLoadingUsers || isLoadingTasks || isLoadingAnnouncements) {
    return (
      <div className="flex items-center justify-center py-16 min-h-[400px]">
        <div className="w-9 h-9 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ===================== HEADER BANNER ===================== */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
            <HiOutlineBriefcase className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              HR Operations & Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Monitor organization workforce, attendance, deadlines, and staff announcements.
            </p>
          </div>
        </div>
      </div>

      {/* ===================== KPI CARDS ===================== */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-3.5 sm:p-5 border border-slate-200 shadow-sm border-t-4 border-t-blue-500 flex flex-col justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <HiOutlineUsers className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">Total Active Users</span>
            </p>
            <h3 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-slate-900 font-mono">
              {activeUsers.length}
            </h3>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100">
            Registered staff
          </p>
        </div>

        <div className="bg-white rounded-xl p-3.5 sm:p-5 border border-slate-200 shadow-sm border-t-4 border-t-emerald-500 flex flex-col justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <HiOutlineFire className="w-3.5 h-3.5 text-emerald-500" />
              <span className="truncate">Active on Tasks</span>
            </p>
            <h3 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-emerald-600 font-mono">
              {usersWorking.length}
            </h3>
          </div>
          <p className="text-[10px] sm:text-xs text-emerald-600 font-medium mt-2 pt-2 border-t border-slate-100">
            Currently working
          </p>
        </div>

        <div className="bg-white rounded-xl p-3.5 sm:p-5 border border-slate-200 shadow-sm border-t-4 border-t-indigo-500 flex flex-col justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <HiOutlineCalendarDays className="w-3.5 h-3.5 text-indigo-500" />
              <span className="truncate">Today's Tasks</span>
            </p>
            <h3 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-indigo-700 font-mono">
              {todaysTasks.length}
            </h3>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100">
            Scheduled today
          </p>
        </div>

        <div className="bg-white rounded-xl p-3.5 sm:p-5 border border-slate-200 shadow-sm border-t-4 border-t-rose-500 flex flex-col justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <HiOutlineExclamationTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span className="truncate">Overdue</span>
            </p>
            <h3 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-rose-600 font-mono">
              {overdueTasks.length}
            </h3>
          </div>
          <p className="text-[10px] sm:text-xs text-rose-600 font-medium mt-2 pt-2 border-t border-slate-100">
            Requires follow-up
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* ===================== LEFT COLUMN ===================== */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">

          {/* Task Status Overview */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-4 sm:mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                <HiOutlineBriefcase className="w-4 h-4" />
              </span>
              Workforce Task Overview
            </h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 sm:p-4 text-center">
                <p className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-emerald-600 mb-1 font-mono">
                  {completedTasks.length}
                </p>
                <p className="text-[10px] sm:text-xs font-semibold text-slate-600">Completed</p>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 sm:p-4 text-center">
                <p className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-indigo-700 mb-1 font-mono">
                  {inProgressTasks.length}
                </p>
                <p className="text-[10px] sm:text-xs font-semibold text-slate-600">In Progress</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4 text-center">
                <p className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-amber-600 mb-1 font-mono">
                  {pendingTasks.length}
                </p>
                <p className="text-[10px] sm:text-xs font-semibold text-slate-600">Pending</p>
              </div>
            </div>
          </div>

          {/* Delayed Tasks */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <HiOutlineExclamationTriangle className="w-4 h-4" />
              </span>
              Delayed Tasks Tracking
            </h2>

            {overdueTasks.length === 0 ? (
              <div className="text-center py-6 px-4">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <HiOutlineCheckCircle className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-600">All caught up!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No tasks currently overdue. All deadlines on track.
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {overdueTasks.slice(0, 5).map((task) => {
                  const hoursOverdue = Math.floor((now - new Date(task.dueDate)) / (1000 * 60 * 60));
                  const daysOverdue = Math.floor(hoursOverdue / 24);
                  const delayText = daysOverdue > 0 ? `${daysOverdue} days` : `${hoursOverdue} hours`;

                  return (
                    <div
                      key={task._id}
                      className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 p-3 sm:p-3.5 bg-slate-50 border border-rose-200 rounded-xl"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="text-slate-900 font-semibold text-xs truncate">
                          {task.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          Assigned to:{' '}
                          <span className="text-slate-800 font-medium">
                            {task.assignedTo?.name || 'Unknown'}
                          </span>
                        </p>
                      </div>
                      <div className="shrink-0 self-start xs:self-auto">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] sm:text-xs font-bold rounded-full whitespace-nowrap">
                          <HiOutlineClock className="w-3 h-3" />
                          Overdue {delayText}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {overdueTasks.length > 5 && (
                  <p className="text-[11px] text-slate-500 text-center pt-2">
                    +{overdueTasks.length - 5} more overdue task
                    {overdueTasks.length - 5 > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ===================== RIGHT COLUMN — ANNOUNCEMENTS ===================== */}
        <div>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 shrink-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center shrink-0">
                  <HiOutlineMegaphone className="w-4 h-4" />
                </span>
                <span className="truncate">Recent Announcements</span>
                {announcements.length > 0 && (
                  <span className="ml-1 text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full shrink-0">
                    {Math.min(announcements.length, 4)}
                  </span>
                )}
              </h2>
            </div>

            <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300">
              {announcements.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                    <HiOutlineMegaphone className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-slate-600">No announcements</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">You&apos;re all caught up.</p>
                </div>
              ) : (
                announcements.slice(0, 4).map((ann) => (
                  <div
                    key={ann._id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-white hover:border-slate-300 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <h4 className="text-slate-900 font-semibold text-xs leading-snug break-words min-w-0 flex-1">
                        {ann.title}
                      </h4>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 border ${getPriorityStyles(
                          ann.priority
                        )}`}
                      >
                        {ann.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 mb-2 break-words">
                      {ann.content}
                    </p>
                    <div className="flex justify-between items-center gap-2 text-[10px] text-slate-500 font-medium pt-2 border-t border-slate-200/60">
                      <span className="truncate">By {ann.createdBy?.name || 'HR'}</span>
                      <span className="shrink-0">
                        {new Date(ann.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
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