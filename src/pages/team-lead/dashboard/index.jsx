import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import AnnouncementsWidget from '../../../components/AnnouncementsWidget';
import {
  HiOutlineUsers,
  HiOutlineClipboardDocumentList,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineEllipsisHorizontalCircle,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';

/* ============================================================
   DESIGN TOKENS (matches AdminProjects / RolesPage / TasksPage / Chat)
   ============================================================ */
const tokens = {
  card: 'bg-white border border-slate-200 rounded-xl shadow-sm',
  label:
    'text-[11px] font-semibold uppercase tracking-wider text-slate-500',
};

/* ============================================================
   KPI CARD CONFIG — single source of truth
   ============================================================ */
const KPI_CONFIG = [
  {
    key: 'teamMembers',
    label: 'Team Members',
    icon: HiOutlineUsers,
    accent: 'border-t-blue-500',
    iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
    valueClass: 'text-slate-900',
    route: '/admin/users',
    valueKey: 'teamMembersCount',
  },
  {
    key: 'totalTasks',
    label: 'Total Assigned Tasks',
    icon: HiOutlineClipboardDocumentList,
    accent: 'border-t-indigo-600',
    iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    valueClass: 'text-slate-900',
    route: '/admin/tasks',
    valueKey: 'totalTasks',
  },
  {
    key: 'completedTasks',
    label: 'Completed Tasks',
    icon: HiOutlineCheckCircle,
    accent: 'border-t-emerald-500',
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    valueClass: 'text-emerald-600',
    route: '/admin/tasks',
    valueKey: 'completedTasks',
  },
  {
    key: 'inProgressTasks',
    label: 'In Progress',
    icon: HiOutlineClock,
    accent: 'border-t-amber-500',
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
    valueClass: 'text-amber-600',
    route: '/admin/tasks',
    valueKey: 'inProgressTasks',
  },
  {
    key: 'pendingTasks',
    label: 'Pending',
    icon: HiOutlineEllipsisHorizontalCircle,
    accent: 'border-t-slate-400',
    iconBg: 'bg-slate-100 text-slate-600 border-slate-200',
    valueClass: 'text-slate-700',
    route: '/admin/tasks',
    valueKey: 'pendingTasks',
  },
  {
    key: 'overdueTasks',
    label: 'Overdue Tasks',
    icon: HiOutlineExclamationTriangle,
    accent: 'border-t-rose-500',
    iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
    valueClass: 'text-rose-600',
    route: '/admin/tasks',
    valueKey: 'overdueTasks',
  },
];

/* ============================================================
   STATUS BADGE (reusable, same as other pages)
   ============================================================ */
const statusStyles = {
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'In Progress': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Pending: 'bg-slate-100 text-slate-700 border-slate-200',
  'On Hold': 'bg-amber-50 text-amber-700 border-amber-200',
};

const StatusBadge = ({ status }) => {
  const cls = statusStyles[status] || statusStyles.Pending;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold whitespace-nowrap ${cls}`}
    >
      {status}
    </span>
  );
};

/* ============================================================
   KPI CARD COMPONENT
   ============================================================ */
const KpiCard = ({ config, value, onClick }) => {
  const Icon = config.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${config.label}: ${value}. Click to view.`}
      className={`${tokens.card} border-t-4 ${config.accent} p-4 text-left w-full ` +
        'hover:shadow-md hover:border-slate-300 active:scale-[0.99] ' +
        'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40'}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className={`${tokens.label} line-clamp-2`}>{config.label}</p>
        <div
          className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${config.iconBg}`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <h3 className={`text-2xl sm:text-3xl font-extrabold leading-none ${config.valueClass}`}>
        {value}
      </h3>
    </button>
  );
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const TeamLeadDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['team-users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return Array.isArray(data) ? data : [];
    },
  });

  /* ---------------- Loading ---------------- */
  if (usersLoading || tasksLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  /* ---------------- Compute stats (UNCHANGED logic) ---------------- */
  const teamMembersCount = users?.length || 0;
  let totalTasks = 0;
  let inProgressTasks = 0;
  let completedTasks = 0;
  let pendingTasks = 0;
  let overdueTasks = 0;

  const now = new Date();

  if (tasks) {
    totalTasks = tasks.length;
    tasks.forEach((task) => {
      if (task.status === 'In Progress') inProgressTasks++;
      if (task.status === 'Completed') completedTasks++;
      if (task.status === 'Pending') pendingTasks++;
      if (task.dueDate && new Date(task.dueDate) < now && task.status !== 'Completed') {
        overdueTasks++;
      }
    });
  }

  const kpiValues = {
    teamMembersCount,
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    overdueTasks,
  };

  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-6">
      {/* ===================== HEADER ===================== */}
      <div className={`${tokens.card} p-4 sm:p-6`}>
        <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
          Team Operations Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Welcome back, <strong className="text-slate-700">{user?.name}</strong>. Real-time tracking of team members and deliverables.
        </p>
      </div>

      {/* ===================== KPI CARDS ===================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {KPI_CONFIG.map((cfg) => (
          <KpiCard
            key={cfg.key}
            config={cfg}
            value={kpiValues[cfg.valueKey]}
            onClick={() => navigate(cfg.route)}
          />
        ))}
      </div>

      {/* ===================== BOTTOM PANELS ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Tasks */}
        <div className={`${tokens.card} p-4 sm:p-6 flex flex-col h-full`}>
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4 shrink-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Recent Deliverables &amp; Tasks
            </h2>
            {tasks?.length > 0 && (
              <button
                type="button"
                onClick={() => navigate('/admin/tasks')}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
              >
                View all →
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {tasks?.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {tasks.slice(0, 5).map((task) => {
                  const accent =
                    task.status === 'Completed'
                      ? 'bg-emerald-500'
                      : task.status === 'In Progress'
                        ? 'bg-indigo-600'
                        : task.status === 'On Hold'
                          ? 'bg-amber-500'
                          : 'bg-slate-400';
                  return (
                    <li
                      key={task._id}
                      className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 hover:bg-slate-50/70 -mx-2 px-2 rounded-lg transition-colors"
                    >
                      <div className={`w-1 h-9 rounded-full shrink-0 ${accent}`} />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-slate-900 truncate">
                          {task.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          Assigned: {task.assignedTo?.name || 'Unassigned'}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <StatusBadge status={task.status} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="py-10 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                  <HiOutlineClipboardDocumentList className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700">No recent tasks</p>
                <p className="text-xs text-slate-500 mt-1">
                  Task activity will appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className={`${tokens.card} p-4 sm:p-6`}>
          <AnnouncementsWidget />
        </div>
      </div>
    </div>
  );
};

export default TeamLeadDashboard;