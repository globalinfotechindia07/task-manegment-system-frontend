import { useQuery } from '@tanstack/react-query';
import { HiOutlineUsers, HiOutlineTrophy } from 'react-icons/hi2';
import api from '../../../api/axios';

/* ============================================================
   DESIGN TOKENS (consistent with all pages)
   ============================================================ */
const tokens = {
  card: 'bg-white border border-slate-200 rounded-xl shadow-sm',
  label:
    'text-[11px] font-semibold uppercase tracking-wider text-slate-500',
};

/* ============================================================
   HELPERS
   ============================================================ */
const getRateColor = (rate) => {
  if (rate >= 75) return { bar: 'bg-emerald-500', text: 'text-emerald-600' };
  if (rate >= 40) return { bar: 'bg-amber-500', text: 'text-amber-600' };
  return { bar: 'bg-rose-500', text: 'text-rose-600' };
};

const getRankBadge = (index) => {
  if (index === 0)
    return { cls: 'bg-amber-100 text-amber-800 border-amber-300', label: '#1' };
  if (index === 1)
    return { cls: 'bg-slate-100 text-slate-700 border-slate-300', label: '#2' };
  if (index === 2)
    return { cls: 'bg-orange-100 text-orange-800 border-orange-300', label: '#3' };
  return null;
};

/* ============================================================
   MINI STAT CARD
   ============================================================ */
const StatChip = ({ label, value, tone = 'slate' }) => {
  const toneMap = {
    slate: { label: 'text-slate-500', value: 'text-slate-900', border: 'border-slate-200' },
    emerald: { label: 'text-emerald-600', value: 'text-emerald-600', border: 'border-slate-200' },
    indigo: { label: 'text-indigo-600', value: 'text-indigo-600', border: 'border-slate-200' },
    rose: { label: 'text-rose-600', value: 'text-rose-600', border: 'border-slate-200' },
  };
  const t = toneMap[tone] || toneMap.slate;
  return (
    <div className={`bg-slate-50 rounded-lg p-2.5 sm:p-3 border ${t.border} text-center`}>
      <p className={`text-[10px] sm:text-[11px] font-medium mb-0.5 truncate ${t.label}`}>
        {label}
      </p>
      <p className={`text-base sm:text-lg font-bold ${t.value}`}>{value}</p>
    </div>
  );
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const TeamLeadPerformancePage = () => {
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['team-users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return data;
    },
  });

  if (usersLoading || tasksLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  /* ---------------- Compute per-user metrics (UNCHANGED logic) ---------------- */
  const userMetrics =
    users
      ?.map((user) => {
        const userTasks = tasks?.filter((task) => task.assignedTo?._id === user._id) || [];
        const total = userTasks.length;
        let completed = 0;
        let pending = 0;
        let inProgress = 0;
        let overdue = 0;

        const now = new Date();

        userTasks.forEach((task) => {
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
          metrics: { total, completed, pending, inProgress, overdue, completionRate },
        };
      })
      .sort((a, b) => b.metrics.completionRate - a.metrics.completionRate) || [];

  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-6">
      {/* ===================== HEADER ===================== */}
      <div className="min-w-0">
        <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
          Performance Analysis
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Analyze individual employee performance within your team.
        </p>
      </div>

      {/* ===================== BODY ===================== */}
      {userMetrics.length === 0 ? (
        <div className={`${tokens.card} py-12 px-6 text-center`}>
          <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <HiOutlineUsers className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            No Team Members Found
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Add users to your team to start analyzing performance.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {userMetrics.map((member, index) => {
            const rateColors = getRateColor(member.metrics.completionRate);
            const rank = getRankBadge(index);

            return (
              <div
                key={member._id}
                className={`${tokens.card} p-4 sm:p-5 hover:border-slate-300 hover:shadow-md transition-all`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
                  {/* ---------- USER INFO ---------- */}
                  <div className="flex items-center gap-3 min-w-0 lg:w-56 shrink-0">
                    <div className="w-11 h-11 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-base overflow-hidden shrink-0">
                      {member.profilePicture ? (
                        <img
                          src={`${import.meta.env?.VITE_API_BASE_URL || ''}${member.profilePicture}`}
                          alt={member.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        member.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                          {member.name}
                        </h3>
                        {rank && (
                          <span
                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold border ${rank.cls} shrink-0`}
                            title={`Rank ${index + 1}`}
                          >
                            <HiOutlineTrophy className="w-2.5 h-2.5" />
                            {rank.label}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                        {member.designation || 'Team Member'}
                      </p>
                    </div>
                  </div>

                  {/* ---------- STATS GRID ---------- */}
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <StatChip label="Total" value={member.metrics.total} tone="slate" />
                    <StatChip
                      label="Completed"
                      value={member.metrics.completed}
                      tone="emerald"
                    />
                    <StatChip
                      label="In Progress"
                      value={member.metrics.inProgress}
                      tone="indigo"
                    />
                    <StatChip
                      label="Overdue"
                      value={member.metrics.overdue}
                      tone="rose"
                    />
                  </div>

                  {/* ---------- PROGRESS ---------- */}
                  <div className="w-full lg:w-44 lg:shrink-0">
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Completion
                      </span>
                      <span className={`text-base font-bold ${rateColors.text}`}>
                        {member.metrics.completionRate}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${rateColors.bar}`}
                        style={{ width: `${member.metrics.completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamLeadPerformancePage;