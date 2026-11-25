import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import AnnouncementsWidget from '../../../components/AnnouncementsWidget';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  HiOutlineClock,
  HiOutlineDocumentCheck,
  HiOutlineBanknotes,
  HiOutlineUsers,
  HiOutlineClipboardDocumentList,
  HiOutlineFolder,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineChartPie,
  HiOutlineSparkles,
  HiOutlineServer,
  HiOutlineBookmark,
  HiOutlinePlay,
  HiOutlinePause,
  HiOutlineArrowPath,
  HiOutlineCalendarDays,
  HiOutlineShieldCheck,
  HiOutlineLifebuoy,
  HiOutlinePlus,
  HiOutlineArrowTrendingUp,
  HiOutlineBriefcase,
  HiOutlineUserGroup,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineArrowsPointingOut,
} from 'react-icons/hi2';

const AdminDashboard = () => {
  const { user } = useAuth();
  const isOfficeAdmin =
    user?.role === 'Admin' ||
    user?.role === 'CTO' ||
    (user?.role || '').toLowerCase().includes('admin') ||
    (user?.role || '').toLowerCase().includes('cto');
  const perms = user?.permissions || {};

  const hasPayrollPerm = isOfficeAdmin || Boolean(perms.payroll?.view);
  const hasTasksPerm = isOfficeAdmin || Boolean(perms.tasks?.view);
  const hasUsersPerm = isOfficeAdmin || Boolean(perms.users?.view);
  const hasProjectsPerm = isOfficeAdmin || Boolean(perms.projects?.view);
  const hasReportsPerm = isOfficeAdmin || Boolean(perms.reports?.view);
  const hasLeavesPerm = isOfficeAdmin || Boolean(perms.attendance?.view || perms.users?.view);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'projects' | 'leaves' | 'tools'
  const [liveTimerTab, setLiveTimerTab] = useState('working'); // 'working' | 'paused'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const todayString = new Date().toISOString().split('T')[0];

  // 1. Users
  const { data: users = [], refetch: refetchUsers } = useQuery({
    queryKey: ['dashboardUsers'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return Array.isArray(data) ? data : [];
    },
    enabled: hasUsersPerm || hasPayrollPerm,
  });

  // 2. Tasks
  const { data: tasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ['dashboardTasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return Array.isArray(data) ? data : [];
    },
    enabled: hasTasksPerm,
  });

  // 3. My Tasks
  const { data: myTasks = [], refetch: refetchMyTasks } = useQuery({
    queryKey: ['dashboardMyTasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks?myTasks=true');
      return Array.isArray(data) ? data : [];
    },
  });

  // 4. KYC Documents Stats
  const { data: documentStats, refetch: refetchDocs } = useQuery({
    queryKey: ['dashboardDocStats'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/documents/admin/all');
        return data?.stats || null;
      } catch (e) {
        return null;
      }
    },
    enabled: isOfficeAdmin || Boolean(perms.users?.view || perms.documents?.view),
  });

  // 5. Projects
  const { data: projects = [], refetch: refetchProjects } = useQuery({
    queryKey: ['dashboardProjects'],
    queryFn: async () => {
      const { data } = await api.get('/projects');
      return Array.isArray(data) ? data : [];
    },
    enabled: hasProjectsPerm,
  });

  // 6. Salary Slips
  const { data: salarySlips = [], refetch: refetchSalary } = useQuery({
    queryKey: ['dashboardSalarySlips', currentMonth, currentYear],
    queryFn: async () => {
      const { data } = await api.get(`/payroll/all?month=${currentMonth}&year=${currentYear}`);
      return Array.isArray(data) ? data : [];
    },
    enabled: hasPayrollPerm,
  });

  // 7. Today's Office Attendance Pulse
  const { data: dailyAttendance, refetch: refetchAttendance } = useQuery({
    queryKey: ['dashboardDailyAttendance', todayString],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/attendance/daily-overview?date=${todayString}`);
        return data || null;
      } catch (e) {
        return null;
      }
    },
    enabled: isOfficeAdmin || Boolean(perms.attendance?.view),
  });

  // 8. Live Work Sessions & Timer Stats (New Timer Module Integration)
  const { data: timeSessionData, refetch: refetchTimer } = useQuery({
    queryKey: ['dashboardTimeStats'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/time-sessions/admin/stats');
        return data || null;
      } catch (e) {
        return null;
      }
    },
    enabled: isOfficeAdmin || Boolean(perms.attendance?.view || perms.reports?.view),
    refetchInterval: 30000, // Auto-refresh active sessions every 30s
  });

  // 9. Pending Leave Requests
  const { data: pendingLeaves = [], refetch: refetchLeaves } = useQuery({
    queryKey: ['dashboardPendingLeaves'],
    queryFn: async () => {
      try {
        const res = await api.get('/leaves/requests?status=Pending');
        return res.data?.requests || [];
      } catch (e) {
        return [];
      }
    },
    enabled: hasLeavesPerm,
  });

  // 10. Support Tickets Stats
  const { data: ticketData, refetch: refetchTickets } = useQuery({
    queryKey: ['dashboardTicketStats'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/tickets/stats');
        return data?.stats || null;
      } catch (e) {
        return null;
      }
    },
  });

  // 11. Backup & Security Health
  const { data: backupStats, refetch: refetchBackup } = useQuery({
    queryKey: ['dashboardBackupStats'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/backup/stats');
        return data || null;
      } catch (e) {
        return null;
      }
    },
    enabled: isOfficeAdmin,
  });

  // 12. Quick Sticky Notes Preview
  const { data: stickyNotes = [], refetch: refetchNotes } = useQuery({
    queryKey: ['dashboardStickyNotes'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/sticky-notes');
        const list = Array.isArray(data) ? data : data?.notes || [];
        return list.slice(0, 4);
      } catch (e) {
        return [];
      }
    },
  });

  // Manual Full Refresh
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await Promise.allSettled([
      refetchUsers(),
      refetchTasks(),
      refetchMyTasks(),
      refetchDocs(),
      refetchProjects(),
      refetchSalary(),
      refetchAttendance(),
      refetchTimer(),
      refetchLeaves(),
      refetchTickets(),
      refetchBackup(),
      refetchNotes(),
    ]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Calculations
  const totalStaff = users.length;
  const activeStaff = users.filter((u) => u.status !== 'Inactive').length;

  const activeTasks = tasks.filter((t) => t.status === 'In Progress' || t.status === 'Pending').length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const pendingTasks = tasks.filter((t) => t.status === 'Pending').length;
  const highPriorityTasks = tasks.filter((t) => t.priority === 'High' && t.status !== 'Completed').length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const myPendingTasks = myTasks.filter((t) => t.status !== 'Completed').length;

  // Payroll Metrics
  const payrollStats = useMemo(() => {
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let totalLateDeductions = 0;

    salarySlips.forEach((slip) => {
      totalGross += Number(slip.grossEarnings || 0);
      totalDeductions += Number(slip.totalDeductions || 0);
      totalNet += Number(slip.netSalary || 0);
      totalLateDeductions += Number(slip.lateDeduction || 0);
    });

    return {
      totalGross: Math.round(totalGross),
      totalDeductions: Math.round(totalDeductions),
      totalNet: Math.round(totalNet),
      totalLateDeductions: Math.round(totalLateDeductions),
      slipsCount: salarySlips.length,
    };
  }, [salarySlips]);

  // Attendance metrics
  const attSummary = dailyAttendance?.summary || {
    totalStaff: totalStaff,
    presentCount: 0,
    lateCount: 0,
    halfDayCount: 0,
    absentCount: 0,
    onLeaveCount: 0,
  };
  const attendanceRate = totalStaff > 0 ? Math.round(((attSummary.presentCount + attSummary.lateCount) / totalStaff) * 100) : 0;

  // Timer metrics
  const currentlyWorking = timeSessionData?.currentlyWorking || [];
  const currentlyPaused = timeSessionData?.currentlyPaused || [];
  const timerStats = timeSessionData?.stats || {
    todayTotalProductiveHours: 0,
    todayTotalPauseHours: 0,
  };

  // Charts data
  const taskStatusData = [
    { name: 'Pending', value: pendingTasks, color: '#f59e0b' },
    { name: 'In Progress', value: tasks.filter((t) => t.status === 'In Progress').length, color: '#4f46e5' },
    { name: 'Completed', value: completedTasks, color: '#10b981' },
  ];

  const payrollBreakdownData = [
    { name: 'Net Payout', amount: payrollStats.totalNet, fill: '#10b981' },
    {
      name: 'Statutory Ded.',
      amount: Math.max(0, payrollStats.totalDeductions - payrollStats.totalLateDeductions),
      fill: '#f43f5e',
    },
    { name: 'Late Ded.', amount: payrollStats.totalLateDeductions, fill: '#f97316' },
  ];

  const currentDateFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-5 sm:space-y-6 pb-8">
      {/* ===================== HERO EXECUTIVE HEADER ===================== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white p-5 sm:p-7 shadow-xl">
        {/* Ambient glow decoration */}
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Left Greeting & Meta */}
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {user?.company?.name || 'Company Workspace'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-slate-800/80 text-slate-300 border border-slate-700">
                {user?.roleRef?.displayName || user?.role || 'Administrator'}
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">• {currentDateFormatted}</span>
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>Welcome back, {user?.name}!</span>
              <span className="text-2xl animate-bounce">👋</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Enterprise Command Center • Live tracking of team deliverables, payroll velocity, KYC compliance, and attendance pulse.
            </p>
          </div>

          {/* Right Live Actions & Status */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title="Refresh all dashboard metrics"
            >
              <HiOutlineArrowPath className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Data'}</span>
            </button>

            <Link
              to="/time-tracker"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <HiOutlineClock className="w-4 h-4" />
              <span>Live Time Tracker</span>
              {currentlyWorking.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-white/20 text-white rounded-full text-[10px] font-bold">
                  {currentlyWorking.length} active
                </span>
              )}
            </Link>

            <Link
              to="/punch-in"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <HiOutlineCalendarDays className="w-4 h-4" />
              <span>Punch In / Out</span>
            </Link>
          </div>
        </div>

        {/* Quick Launchers Bar */}
        <div className="relative z-10 mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs overflow-x-auto no-scrollbar touch-scroll pb-1">
          <span className="text-slate-400 font-semibold mr-1 flex items-center gap-1 text-[11px] uppercase tracking-wider shrink-0">
            <HiOutlineSparkles className="w-3.5 h-3.5 text-indigo-400" /> Quick Launch:
          </span>

          <Link
            to="/admin/tasks"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/60 hover:bg-indigo-600/30 text-slate-300 hover:text-white border border-slate-700/60 hover:border-indigo-500/40 transition-colors shrink-0"
          >
            <HiOutlinePlus className="w-3.5 h-3.5 text-indigo-400" />
            <span>New Task</span>
          </Link>

          <Link
            to="/sticky-notes"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/60 hover:bg-amber-600/30 text-slate-300 hover:text-white border border-slate-700/60 hover:border-amber-500/40 transition-colors shrink-0"
          >
            <HiOutlineBookmark className="w-3.5 h-3.5 text-amber-400" />
            <span>3D Notes</span>
          </Link>

          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/60 hover:bg-blue-600/30 text-slate-300 hover:text-white border border-slate-700/60 hover:border-blue-500/40 transition-colors shrink-0"
          >
            <HiOutlineUsers className="w-3.5 h-3.5 text-blue-400" />
            <span>Staff</span>
          </Link>

          <Link
            to="/salary-process"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/60 hover:bg-emerald-600/30 text-slate-300 hover:text-white border border-slate-700/60 hover:border-emerald-500/40 transition-colors shrink-0"
          >
            <HiOutlineBanknotes className="w-3.5 h-3.5 text-emerald-400" />
            <span>Salaries</span>
          </Link>

          <Link
            to="/admin/documents"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/60 hover:bg-purple-600/30 text-slate-300 hover:text-white border border-slate-700/60 hover:border-purple-500/40 transition-colors shrink-0"
          >
            <HiOutlineDocumentCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>KYC Docs</span>
          </Link>

          <Link
            to="/admin/backup"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/60 hover:bg-teal-600/30 text-slate-300 hover:text-white border border-slate-700/60 hover:border-teal-500/40 transition-colors shrink-0"
          >
            <HiOutlineServer className="w-3.5 h-3.5 text-teal-400" />
            <span>Backup</span>
          </Link>
        </div>
      </div>

      {/* ===================== AI INSIGHTS & ANOMALY BANNER ===================== */}
      {(highPriorityTasks > 0 || (documentStats?.pending ?? 0) > 0 || (ticketData?.urgent ?? 0) > 0 || currentlyWorking.length > 0) && (
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-sky-50 border border-indigo-200/80 rounded-xl p-4 sm:p-4.5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
                <HiOutlineSparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Executive AI Insights & Action Items</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wide">
                    Live
                  </span>
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-600">
                  {highPriorityTasks > 0 && (
                    <span className="flex items-center gap-1 text-rose-700 font-semibold">
                      <HiOutlineExclamationTriangle className="w-3.5 h-3.5 text-rose-500" />
                      {highPriorityTasks} high-priority deliverables require attention.
                    </span>
                  )}
                  {(documentStats?.pending ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-amber-700 font-semibold">
                      <HiOutlineDocumentCheck className="w-3.5 h-3.5 text-amber-500" />
                      {documentStats?.pending} employee KYC documents awaiting verification.
                    </span>
                  )}
                  {currentlyWorking.length > 0 && (
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <HiOutlinePlay className="w-3.5 h-3.5 text-emerald-500" />
                      {currentlyWorking.length} team members actively logging time right now.
                    </span>
                  )}
                  {(ticketData?.urgent ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-red-700 font-semibold">
                      <HiOutlineLifebuoy className="w-3.5 h-3.5 text-red-500" />
                      {ticketData?.urgent} urgent support tickets need resolution.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
              <Link
                to="/admin/tasks"
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
              >
                Review Tasks &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ===================== 6 HIGH-IMPACT KPI CARDS ===================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* KPI 1: Staff & Presence */}
        {hasUsersPerm && (
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm hover:shadow-md transition-all border-t-4 border-t-blue-500 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <HiOutlineUsers className="w-4 h-4 text-blue-500" /> Staff
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                  {totalStaff} Total
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {activeStaff} <span className="text-xs font-normal text-slate-500">active</span>
              </h3>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-emerald-600 font-semibold">{attSummary.presentCount} In Office</span>
              <span className="text-slate-400">{attSummary.onLeaveCount} Leave</span>
            </div>
          </div>
        )}

        {/* KPI 2: Live Work Sessions (Timer) */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm hover:shadow-md transition-all border-t-4 border-t-emerald-500 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <HiOutlineClock className="w-4 h-4 text-emerald-500" /> Live Timer
              </span>
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Live
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {currentlyWorking.length}{' '}
              <span className="text-xs font-normal text-slate-500">working</span>
            </h3>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-amber-600 font-semibold">{currentlyPaused.length} Paused</span>
            <span className="text-slate-500 font-mono">{timerStats.todayTotalProductiveHours}h logged</span>
          </div>
        </div>

        {/* KPI 3: Monthly Net Payroll */}
        {hasPayrollPerm && (
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm hover:shadow-md transition-all border-t-4 border-t-indigo-600 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <HiOutlineBanknotes className="w-4 h-4 text-indigo-500" /> Net Payroll
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                  {salarySlips.length} Slips
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-indigo-700 font-mono mt-1 truncate">
                ₹{payrollStats.totalNet.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Gross: ₹{payrollStats.totalGross.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}

        {/* KPI 4: Active Deliverables */}
        {hasTasksPerm && (
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm hover:shadow-md transition-all border-t-4 border-t-amber-500 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <HiOutlineClipboardDocumentList className="w-4 h-4 text-amber-500" /> Tasks
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold">
                  {taskCompletionRate}% Done
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {activeTasks} <span className="text-xs font-normal text-slate-500">active</span>
              </h3>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-rose-600 font-semibold">{highPriorityTasks} High Priority</span>
              <span className="text-emerald-600 font-semibold">{completedTasks} Done</span>
            </div>
          </div>
        )}

        {/* KPI 5: Dynamic KYC Documents */}
        <Link
          to="/admin/documents"
          className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm hover:shadow-md transition-all border-t-4 border-t-purple-600 flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <HiOutlineDocumentCheck className="w-4 h-4 text-purple-600" /> KYC Docs
              </span>
              <HiOutlineArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {documentStats?.totalDocuments ?? 0}{' '}
              <span className="text-xs font-normal text-slate-500">files</span>
            </h3>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className={`${(documentStats?.pending ?? 0) > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
              {documentStats?.pending ?? 0} pending review
            </span>
            <span className="text-purple-600 font-medium group-hover:underline">Verify &rarr;</span>
          </div>
        </Link>

        {/* KPI 6: Support Tickets */}
        <Link
          to="/company-support"
          className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm hover:shadow-md transition-all border-t-4 border-t-cyan-500 flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <HiOutlineLifebuoy className="w-4 h-4 text-cyan-500" /> Support
              </span>
              <HiOutlineArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {ticketData?.open ?? 0}{' '}
              <span className="text-xs font-normal text-slate-500">open</span>
            </h3>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className={`${(ticketData?.urgent ?? 0) > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
              {ticketData?.urgent ?? 0} urgent
            </span>
            <span className="text-emerald-600 font-semibold">{ticketData?.resolved ?? 0} resolved</span>
          </div>
        </Link>
      </div>

      {/* ===================== LIVE OPERATIONS COMMAND CENTER ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* WIDGET A: LIVE WORK SESSIONS (TIMER MODULE SPOTLIGHT) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <HiOutlineClock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Live Team Work Sessions</span>
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </h3>
                  <p className="text-[11px] text-slate-500">Real-time task tracking & pause reason monitor</p>
                </div>
              </div>

              {/* Sub-tabs: Working vs Paused */}
              <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setLiveTimerTab('working')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    liveTimerTab === 'working'
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Working ({currentlyWorking.length})
                </button>
                <button
                  onClick={() => setLiveTimerTab('paused')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    liveTimerTab === 'paused'
                      ? 'bg-white text-amber-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Paused ({currentlyPaused.length})
                </button>
              </div>
            </div>

            {/* Live Sessions List */}
            <div className="space-y-2.5 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 pr-1">
              {liveTimerTab === 'working' ? (
                currentlyWorking.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                    <HiOutlineClock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No active work sessions right now</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Team members can clock in from the Work Timer in their sidebar.
                    </p>
                  </div>
                ) : (
                  currentlyWorking.map((s) => (
                    <div
                      key={s._id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-3 hover:bg-emerald-50/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {s.user?.name ? s.user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{s.user?.name || 'Staff User'}</h4>
                          <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                            <span className="text-indigo-600 font-medium">{s.taskTitle || 'General Workspace Task'}</span>
                            {s.user?.department && <span>• {s.user.department}</span>}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          Working
                        </span>
                        <div className="text-[10px] font-mono text-slate-400 mt-1">
                          Started: {s.startTime ? new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : (
                currentlyPaused.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                    <HiOutlineCheckCircle className="w-8 h-8 mx-auto text-emerald-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No users currently on pause</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">All active timers are running productively.</p>
                  </div>
                ) : (
                  currentlyPaused.map((s) => (
                    <div
                      key={s._id}
                      className="p-3 rounded-xl bg-amber-50/40 border border-amber-200/70 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {s.user?.name ? s.user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{s.user?.name || 'Staff User'}</h4>
                          <p className="text-[11px] text-amber-800 font-medium truncate flex items-center gap-1">
                            <span>Reason:</span>
                            <span className="font-bold underline decoration-amber-300">
                              {s.currentPauseReason || 'Break / Pause'}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <HiOutlinePause className="w-3 h-3" /> Paused
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">{s.taskTitle || 'Task'}</div>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>

          {/* Bottom Summary Bar */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3 text-slate-500 text-[11px]">
              <span>
                Today Productive: <strong className="text-slate-900 font-mono">{timerStats.todayTotalProductiveHours}h</strong>
              </span>
              <span>•</span>
              <span>
                Break Time: <strong className="text-slate-700 font-mono">{timerStats.todayTotalPauseHours}h</strong>
              </span>
            </div>
            <Link
              to="/time-tracker"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
            >
              Full Time Audit <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* WIDGET B: TODAY'S OFFICE ATTENDANCE & PUNCTUALITY PULSE */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <HiOutlineCalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Today's Attendance Pulse</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {attendanceRate}% Present
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Live biometric/photo punch-in records</p>
                </div>
              </div>

              <Link
                to="/punch-in"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
              >
                Punch In &rarr;
              </Link>
            </div>

            {/* Attendance Counters Grid */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 text-center">
                <div className="text-base sm:text-lg font-bold text-emerald-700 font-mono">{attSummary.presentCount}</div>
                <div className="text-[10px] font-semibold text-emerald-800">On Time</div>
              </div>
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 text-center">
                <div className="text-base sm:text-lg font-bold text-amber-700 font-mono">{attSummary.lateCount}</div>
                <div className="text-[10px] font-semibold text-amber-800">Late</div>
              </div>
              <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-2.5 text-center">
                <div className="text-base sm:text-lg font-bold text-indigo-700 font-mono">{attSummary.onLeaveCount}</div>
                <div className="text-[10px] font-semibold text-indigo-800">On Leave</div>
              </div>
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-center">
                <div className="text-base sm:text-lg font-bold text-slate-700 font-mono">{attSummary.absentCount}</div>
                <div className="text-[10px] font-semibold text-slate-600">Absent</div>
              </div>
            </div>

            {/* Recent Check-Ins Stream */}
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 pr-1">
              {(dailyAttendance?.records || []).slice(0, 5).map((r, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {r.user?.name ? r.user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate text-[11px]">{r.user?.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{r.user?.designation || r.user?.role}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {r.hasPunched ? (
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          r.status === 'Late'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {r.punchIn ? new Date(r.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Punched'}
                        {r.lateByMinutes > 0 && ` (+${r.lateByMinutes}m)`}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">
                        {r.status === 'On Leave' ? 'Approved Leave' : 'Not Clocked In'}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {(!dailyAttendance?.records || dailyAttendance.records.length === 0) && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Attendance data syncing for today.
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">
              Total Staff: <strong className="text-slate-900">{totalStaff} employees</strong>
            </span>
            <Link
              to="/admin/leaves"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Leaves & Holidays <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ===================== SECTION TABS FOR DEEP DIVES ===================== */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-6 overflow-x-auto no-scrollbar touch-scroll py-0.5" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-1 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            📊 Finance & Deliverables
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`py-3 px-1 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'projects'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            📁 Projects & Milestones ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`py-3 px-1 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'leaves'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            👥 HR & Leave Approvals {pendingLeaves.length > 0 && `(${pendingLeaves.length})`}
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`py-3 px-1 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'tools'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            📌 3D Notes & System Tools
          </button>
        </nav>
      </div>

      {/* ===================== TAB 1: FINANCE & DELIVERABLES ===================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* PAYROLL SPOTLIGHT */}
          {hasPayrollPerm && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Payroll & Deductions Breakdown</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Disbursements for {new Date(0, currentMonth - 1).toLocaleString('default', { month: 'long' })} {currentYear}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/salary-process"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    Salary Process Module &rarr;
                  </Link>
                  <Link
                    to="/admin/salary-management"
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Salary Structures
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
                    Payout vs Statutory Deductions
                  </h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={payrollBreakdownData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            color: '#0f172a',
                            fontSize: '12px',
                          }}
                          formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Amount']}
                        />
                        <Bar dataKey="amount" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 text-center text-xs text-slate-500">
                    Net Payout:{' '}
                    <strong className="text-emerald-700 font-mono">₹{payrollStats.totalNet.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                {/* Recent Slips Table */}
                <div className="lg:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Recent Processed Salary Slips ({salarySlips.length})
                    </h3>
                    <Link to="/admin/payroll-dashboard" className="text-xs font-bold text-indigo-600 hover:underline">
                      View All Slips
                    </Link>
                  </div>

                  {salarySlips.length === 0 ? (
                    <div className="text-center py-10 px-4">
                      <HiOutlineDocumentCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-semibold text-slate-600">No salary slips generated for this month</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Click "Salary Process Module" above to review and process salaries.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-56 scrollbar-thin scrollbar-thumb-slate-300">
                      <table className="w-full text-left text-xs text-slate-700 min-w-[500px]">
                        <thead className="bg-white text-slate-600 sticky top-0 border-b border-slate-200 font-semibold">
                          <tr>
                            <th className="p-2.5">Employee</th>
                            <th className="p-2.5 text-right text-emerald-700">Gross</th>
                            <th className="p-2.5 text-right text-rose-700">Deduction</th>
                            <th className="p-2.5 text-right text-indigo-700">Net Payable</th>
                            <th className="p-2.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {salarySlips.slice(0, 6).map((s, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="p-2.5 font-medium text-slate-900 truncate max-w-[140px]">
                                {s.employeeName || s.user?.name}
                              </td>
                              <td className="p-2.5 text-right font-mono text-emerald-700">
                                ₹{Number(s.grossEarnings || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="p-2.5 text-right font-mono text-rose-700">
                                ₹{Number(s.totalDeductions || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-indigo-700">
                                ₹{Number(s.netSalary || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="p-2.5 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {s.paymentStatus || 'Processed'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TASKS & OPERATIONS */}
          {hasTasksPerm && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pie Chart */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <HiOutlineChartPie className="w-4 h-4 text-indigo-600" />
                  Task Status Distribution
                </h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={taskStatusData} innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={5}>
                        {taskStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          color: '#0f172a',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {taskStatusData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span>
                        {d.name} ({d.value})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* High Priority Table */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <HiOutlineExclamationTriangle className="w-4 h-4 text-rose-500" />
                    High Priority & Active Deliverables
                  </h3>
                  <Link
                    to="/admin/tasks"
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                  >
                    View All Tasks <HiOutlineArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 min-w-[500px]">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Task Title</th>
                        <th className="p-2.5">Project</th>
                        <th className="p-2.5">Assignee</th>
                        <th className="p-2.5 text-center">Priority</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tasks
                        .filter((t) => t.priority === 'High' || t.status === 'In Progress')
                        .slice(0, 5)
                        .map((t) => (
                          <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 font-medium text-slate-900 max-w-xs truncate">{t.title}</td>
                            <td className="p-2.5 text-slate-500 truncate max-w-[110px]">{t.project?.name || 'General'}</td>
                            <td className="p-2.5 text-slate-600 truncate max-w-[110px]">
                              {t.assignedTo?.name || 'Unassigned'}
                            </td>
                            <td className="p-2.5 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  t.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {t.priority || 'Normal'}
                              </span>
                            </td>
                            <td className="p-2.5 text-center">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  t.status === 'Completed'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : t.status === 'In Progress'
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      {tasks.length === 0 && (
                        <tr>
                          <td colSpan="5" className="p-6 text-center text-slate-400">
                            No tasks currently in progress.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 2: PROJECTS & MILESTONES ===================== */}
      {activeTab === 'projects' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HiOutlineFolder className="w-5 h-5 text-indigo-600" />
                Active Company Projects ({projects.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Track deliverables, milestone billing, and timelines</p>
            </div>
            <Link
              to="/admin/projects"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Manage Projects &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {projects.map((p) => {
              const deliverables = p.deliverables || [];
              const completedCount = deliverables.filter((d) => d.status === 'Completed').length;
              const progressPct = deliverables.length > 0 ? Math.round((completedCount / deliverables.length) * 100) : 0;

              return (
                <div
                  key={p._id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
                        {p.status || 'Active'}
                      </span>
                      {p.deadline && (
                        <span className="text-[11px] text-slate-500 font-mono">
                          Due: {new Date(p.deadline).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 truncate">{p.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      Client: <span className="text-slate-800 font-medium">{p.client?.name || p.clientName || 'Direct'}</span>
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200">
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Deliverables Progress</span>
                      <span className="font-bold">{progressPct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
                      <span>{deliverables.length} Deliverables</span>
                      {p.budget > 0 && <span className="font-mono text-slate-600">Budget: ₹{p.budget.toLocaleString('en-IN')}</span>}
                    </div>
                  </div>
                </div>
              );
            })}

            {projects.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-400">
                <HiOutlineFolder className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">No active projects created yet.</p>
                <Link to="/admin/projects" className="text-xs font-bold text-indigo-600 mt-2 inline-block">
                  Create Project &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 3: HR, LEAVES & APPROVALS ===================== */}
      {activeTab === 'leaves' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HiOutlineCalendarDays className="w-5 h-5 text-indigo-600" />
                Pending Leave Approvals ({pendingLeaves.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Review staff time-off requests and verify leave balances</p>
            </div>
            <Link
              to="/admin/leaves"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              All Leaves Management &rarr;
            </Link>
          </div>

          {pendingLeaves.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <HiOutlineCheckCircle className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
              <p className="text-sm font-bold text-slate-800">All caught up!</p>
              <p className="text-xs text-slate-500 mt-1">There are no pending employee leave requests requiring your review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {pendingLeaves.map((req) => (
                <div
                  key={req._id}
                  className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/30 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                        {req.leaveType} Leave
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {req.startDate ? new Date(req.startDate).toLocaleDateString('en-IN') : ''} →{' '}
                        {req.endDate ? new Date(req.endDate).toLocaleDateString('en-IN') : ''}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{req.user?.name || 'Employee'}</h4>
                    <p className="text-xs text-slate-500">{req.user?.department || req.user?.designation || 'Staff'}</p>

                    <div className="mt-2.5 p-2 rounded-lg bg-white/80 border border-slate-200 text-xs text-slate-700 italic">
                      "{req.reason || 'No reason provided'}"
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">{req.days || 1} day(s) requested</span>
                    <Link
                      to="/admin/leaves"
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold transition-colors"
                    >
                      Action Request &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 4: 3D NOTES & SYSTEM TOOLS ===================== */}
      {activeTab === 'tools' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Sticky Notes Preview */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <HiOutlineBookmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">3D Sticky Notes</h3>
                    <p className="text-[11px] text-slate-500">Pinned workspace reminders & ideas</p>
                  </div>
                </div>
                <Link
                  to="/sticky-notes"
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  Open 3D Board &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stickyNotes.map((note) => (
                  <div
                    key={note._id}
                    className="p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between"
                    style={{ backgroundColor: note.color || '#fef08a' }}
                  >
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{note.title || 'Note'}</h4>
                      <p className="text-xs text-slate-700 mt-1 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                        {note.content || 'Empty note'}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-black/10 flex items-center justify-between text-[10px] text-slate-600 font-medium">
                      <span>{note.category || 'General'}</span>
                      {note.isPinned && <span>📌 Pinned</span>}
                    </div>
                  </div>
                ))}

                {stickyNotes.length === 0 && (
                  <div className="col-span-full text-center py-8 text-slate-400 text-xs">
                    No sticky notes created yet. Click "Open 3D Board" to add notes anywhere!
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-500 text-[11px]">3D spatial positioning enabled</span>
              <Link to="/sticky-notes" className="text-xs font-bold text-amber-700 hover:underline">
                Create New Note &rarr;
              </Link>
            </div>
          </div>

          {/* Backup & System Security Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                    <HiOutlineServer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Data Backup & Security Engine</h3>
                    <p className="text-[11px] text-slate-500">Automated weekly backups & JSON snapshot export</p>
                  </div>
                </div>
                <Link
                  to="/admin/backup"
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  Manage Backups &rarr;
                </Link>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-200/70 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HiOutlineShieldCheck className="w-6 h-6 text-teal-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Auto-Backup Status</div>
                      <div className="text-[11px] text-teal-800">
                        {backupStats?.company?.autoBackup?.enabled !== false
                          ? 'Active (Weekly Automatic Download)'
                          : 'Disabled'}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                    Protected
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">Last Verified Backup:</span>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {backupStats?.recentBackupLog?.createdAt
                        ? new Date(backupStats.recentBackupLog.createdAt).toLocaleString('en-IN')
                        : 'No backup logged yet'}
                    </div>
                  </div>
                  <Link
                    to="/admin/backup"
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Download Now
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-500 text-[11px]">Multi-tenant isolated company backup</span>
              <Link to="/admin/backup" className="text-xs font-bold text-teal-700 hover:underline">
                Restore / Inspect Backup &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MY DELIVERABLES + ANNOUNCEMENTS ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* My Tasks */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex justify-between items-center gap-2 mb-4">
            <h3 className="text-sm font-bold text-slate-900 truncate">
              My Personal Deliverables ({myTasks.length})
            </h3>
            <Link
              to="/admin/tasks"
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              Task Board <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {myTasks.slice(0, 5).map((t) => (
              <div
                key={t._id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 hover:bg-slate-100/70 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-slate-900 truncate">{t.title}</div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {t.project?.name || 'General Project'} • Due:{' '}
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-IN') : 'N/A'}
                  </div>
                </div>
                <span
                  className={`self-start sm:self-auto px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${
                    t.status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : t.status === 'In Progress'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {t.status}
                </span>
              </div>
            ))}
            {myTasks.length === 0 && (
              <div className="text-center py-8">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                  <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-xs font-semibold text-slate-700">No tasks assigned</p>
                <p className="text-[11px] text-slate-400 mt-0.5">You're all caught up with your personal deliverables!</p>
              </div>
            )}
          </div>
        </div>

        {/* Announcements Widget */}
        <div>
          <AnnouncementsWidget />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
