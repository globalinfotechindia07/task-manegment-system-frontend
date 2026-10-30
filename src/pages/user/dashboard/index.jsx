import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import AnnouncementsWidget from '../../../components/AnnouncementsWidget';
import {
  HiOutlineClipboardDocumentList,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineEllipsisHorizontalCircle,
  HiOutlineExclamationTriangle,
  HiOutlineCalendarDays,
  HiOutlineUser,
  HiOutlineBolt,
  HiOutlineMegaphone,
} from 'react-icons/hi2';

/* ============================================================
   DESIGN TOKENS (consistent with all other pages)
   ============================================================ */
const tokens = {
  card: 'bg-white border border-slate-200 rounded-xl shadow-sm',
  label:
    'text-[11px] font-semibold uppercase tracking-wider text-slate-500',
  sectionTitle: 'text-sm sm:text-base font-bold text-slate-900',
};

/* ============================================================
   PRIORITY BADGE (reusable)
   ============================================================ */
const priorityStyles = {
  High: 'bg-rose-50 text-rose-700 border-rose-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Normal: 'bg-blue-50 text-blue-700 border-blue-200',
};

const PriorityBadge = ({ priority }) => {
  const cls = priorityStyles[priority] || priorityStyles.Normal;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold whitespace-nowrap ${cls}`}
    >
      {priority || 'Normal'}
    </span>
  );
};

/* ============================================================
   KPI CARD
   ============================================================ */
const KpiCard = ({ label, value, icon: Icon, accent, iconBg, valueClass }) => (
  <div
    className={`${tokens.card} border-t-4 ${accent} p-3.5 sm:p-5`}
  >
    <div className="flex items-start justify-between gap-2 mb-1.5">
      <p className={`${tokens.label} line-clamp-2`}>{label}</p>
      <div
        className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${iconBg}`}
      >
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <p className={`text-2xl sm:text-3xl font-extrabold leading-none ${valueClass}`}>
      {value}
    </p>
  </div>
);

/* ============================================================
   EMPTY STATE (small)
   ============================================================ */
const EmptyMini = ({ icon: Icon, title, subtitle }) => (
  <div className="py-8 text-center">
    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
      <Icon className="w-6 h-6" />
    </div>
    <p className="text-sm font-semibold text-slate-700">{title}</p>
    {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
  </div>
);

/* ============================================================
   HELPERS
   ============================================================ */
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    : '—';

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : '—';

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['myTasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks?myTasks=true');
      return Array.isArray(data) ? data : [];
    },
  });

  /* ---------------- Compute stats (UNCHANGED logic) ---------------- */
  const tasksList = Array.isArray(tasks) ? tasks : [];
  const total = tasksList.length;
  const completed = tasksList.filter((t) => t.status === 'Completed').length;
  const pending = tasksList.filter((t) => t.status === 'Pending').length;
  const inProgress = tasksList.filter((t) => t.status === 'In Progress').length;
  const onHold = tasksList.filter((t) => t.status === 'On Hold').length;

  const now = new Date();
  const overdue = tasksList.filter(
    (t) => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < now
  ).length;

  const upcomingDeadlines = tasksList
    .filter((t) => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const recentActivities = tasksList
    .flatMap(
      (task) =>
        task.history?.map((h) => ({ ...h, taskTitle: task.title, taskId: task._id })) || []
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  /* ---------------- Loading ---------------- */
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  /* ---------------- Donut circumference ---------------- */
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - completionRate / 100);

  const kpiConfig = [
    {
      label: 'Total Assigned',
      value: total,
      icon: HiOutlineClipboardDocumentList,
      accent: 'border-t-slate-400',
      iconBg: 'bg-slate-100 text-slate-600 border-slate-200',
      valueClass: 'text-slate-900',
    },
    {
      label: 'In Progress',
      value: inProgress,
      icon: HiOutlineClock,
      accent: 'border-t-indigo-600',
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      valueClass: 'text-indigo-700',
    },
    {
      label: 'Completed',
      value: completed,
      icon: HiOutlineCheckCircle,
      accent: 'border-t-emerald-500',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      valueClass: 'text-emerald-600',
    },
    {
      label: 'Pending/Hold',
      value: pending + onHold,
      icon: HiOutlineEllipsisHorizontalCircle,
      accent: 'border-t-amber-500',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
      valueClass: 'text-amber-600',
    },
    {
      label: 'Overdue',
      value: overdue,
      icon: HiOutlineExclamationTriangle,
      accent: 'border-t-rose-500',
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
      valueClass: 'text-rose-600',
    },
  ];

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-6">
      {/* ===================== HEADER ===================== */}
      <div className={`${tokens.card} p-4 sm:p-6`}>
        <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
          Staff Workspace Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Welcome back,{' '}
          <strong className="text-slate-800">{user?.name}</strong>{' '}
          <span className="text-slate-400">({user?.designation || user?.role})</span>
        </p>
      </div>

      {/* ===================== KPI CARDS ===================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {kpiConfig.map((cfg) => (
          <KpiCard
            key={cfg.label}
            label={cfg.label}
            value={cfg.value}
            icon={cfg.icon}
            accent={cfg.accent}
            iconBg={cfg.iconBg}
            valueClass={cfg.valueClass}
          />
        ))}
      </div>

      {/* ===================== MIDDLE ROW ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Productivity Summary */}
        <div className={`${tokens.card} p-4 sm:p-6 flex flex-col`}>
          <h3 className={`${tokens.sectionTitle} mb-4`}>Productivity Summary</h3>

          <div className="flex-1 flex flex-col items-center justify-center">
            <div
              className="relative w-36 h-36 sm:w-40 sm:h-40 mb-4"
              role="progressbar"
              aria-valuenow={completionRate}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Productivity completion ${completionRate}%`}
            >
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className="text-slate-100 stroke-current"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className="text-indigo-600 stroke-current transition-all duration-700 ease-out"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">
                  {completionRate}%
                </span>
                <span className="text-[11px] text-slate-500 font-medium mt-1">
                  Completed
                </span>
              </div>
            </div>

            <p className="text-slate-600 text-xs text-center max-w-[240px]">
              You resolved{' '}
              <span className="font-bold text-slate-900">{completed}</span> out of{' '}
              <span className="font-bold text-slate-900">{total}</span> deliverables
              assigned to you.
            </p>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className={`${tokens.card} p-4 sm:p-6 lg:col-span-2 flex flex-col`}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className={tokens.sectionTitle}>Upcoming Deadlines</h3>
            {upcomingDeadlines.length > 0 && (
              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-full px-2 py-0.5">
                {upcomingDeadlines.length} pending
              </span>
            )}
          </div>

          {upcomingDeadlines.length === 0 ? (
            <EmptyMini
              icon={HiOutlineCalendarDays}
              title="No upcoming deadlines"
              subtitle="You're all caught up. 🎉"
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcomingDeadlines.map((task) => (
                <li
                  key={task._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2.5 first:pt-0 last:pb-0 -mx-2 px-2 rounded-lg hover:bg-slate-50/70 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-slate-900 text-xs truncate">
                      {task.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                      <HiOutlineUser className="w-3 h-3 text-slate-400 shrink-0" />
                      Assigned by:{' '}
                      <span className="text-slate-700 font-medium truncate">
                        {task.assignedBy?.name || 'Manager'}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center sm:flex-col sm:items-end gap-1.5 sm:gap-0.5 shrink-0">
                    <PriorityBadge priority={task.priority} />
                    <p className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                      <span className="text-slate-400 font-normal">Due </span>
                      {fmtDate(task.dueDate)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ===================== BOTTOM ROW ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Activities */}
        <div className={`${tokens.card} p-4 sm:p-6 flex flex-col`}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className={tokens.sectionTitle}>Recent Task Activities</h3>
            {recentActivities.length > 0 && (
              <button
                type="button"
                onClick={() => navigate('/tasks')}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
              >
                View all →
              </button>
            )}
          </div>

          {recentActivities.length === 0 ? (
            <EmptyMini
              icon={HiOutlineBolt}
              title="No recent activity"
              subtitle="Your task updates will appear here."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentActivities.map((activity, i) => (
                <li
                  key={i}
                  className="py-2.5 first:pt-0 last:pb-0 -mx-2 px-2 rounded-lg hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-0.5">
                    <span className="font-semibold text-slate-900 text-xs truncate">
                      {activity.taskTitle}
                    </span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                      {fmtDateTime(activity.createdAt)}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                    {activity.action}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Announcements */}
        <div className={`${tokens.card} p-4 sm:p-6`}>
          <AnnouncementsWidget />
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;