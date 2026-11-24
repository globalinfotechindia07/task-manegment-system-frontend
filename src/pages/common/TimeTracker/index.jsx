import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import toast from 'react-hot-toast';
import {
  HiOutlinePlay,
  HiOutlinePause,
  HiOutlineStop,
  HiOutlineClock,
  HiOutlineBell,
  HiOutlineBellAlert,
  HiOutlineDocumentText,
  HiOutlineUserGroup,
  HiOutlineFlag,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlineSparkles,
  HiOutlineCalendarDays,
  HiOutlineEye,
  HiOutlineArrowDownTray,
  HiOutlineBolt,
  HiOutlinePlus,
  HiOutlineChartBar,
  HiOutlineShieldCheck,
  HiOutlineChatBubbleLeftRight,
  HiOutlinePhone,
  HiOutlineBuildingStorefront,
  HiOutlineFire,
  HiOutlineExclamationTriangle,
  HiOutlineComputerDesktop,
  HiOutlineBriefcase,
  HiOutlinePencilSquare,
  HiOutlineFolder,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineForward,
  HiOutlineArrowTrendingUp,
  HiOutlineLockClosed,
} from 'react-icons/hi2';
import {
  requestDesktopNotificationPermission,
  isNotificationAllowed,
  showDesktopNotification,
  playTimerChime,
} from '../../../utils/desktopNotification';

// Common Preset Pause Reasons with Professional SVG Icons (No Emojis)
const PAUSE_REASONS = [
  {
    id: 'lunch',
    label: 'Lunch Break',
    icon: HiOutlineBuildingStorefront,
    bgClass: 'hover:border-amber-400 hover:bg-amber-50/60',
    iconClass: 'text-amber-600 bg-amber-100/70',
  },
  {
    id: 'tea',
    label: 'Tea / Coffee Break',
    icon: HiOutlineFire,
    bgClass: 'hover:border-orange-400 hover:bg-orange-50/60',
    iconClass: 'text-orange-600 bg-orange-100/70',
  },
  {
    id: 'meeting',
    label: 'Internal Team Meeting',
    icon: HiOutlineChatBubbleLeftRight,
    bgClass: 'hover:border-indigo-400 hover:bg-indigo-50/60',
    iconClass: 'text-indigo-600 bg-indigo-100/70',
  },
  {
    id: 'client_call',
    label: 'Client Discussion / Call',
    icon: HiOutlinePhone,
    bgClass: 'hover:border-blue-400 hover:bg-blue-50/60',
    iconClass: 'text-blue-600 bg-blue-100/70',
  },
  {
    id: 'bio',
    label: 'Quick Bio Break',
    icon: HiOutlineArrowPath,
    bgClass: 'hover:border-teal-400 hover:bg-teal-50/60',
    iconClass: 'text-teal-600 bg-teal-100/70',
  },
  {
    id: 'blocked',
    label: 'Waiting for Review / Client',
    icon: HiOutlineExclamationTriangle,
    bgClass: 'hover:border-rose-400 hover:bg-rose-50/60',
    iconClass: 'text-rose-600 bg-rose-100/70',
  },
  {
    id: 'system',
    label: 'System / Network Issue',
    icon: HiOutlineComputerDesktop,
    bgClass: 'hover:border-purple-400 hover:bg-purple-50/60',
    iconClass: 'text-purple-600 bg-purple-100/70',
  },
  {
    id: 'personal',
    label: 'Personal Emergency',
    icon: HiOutlineBriefcase,
    bgClass: 'hover:border-slate-400 hover:bg-slate-50/60',
    iconClass: 'text-slate-600 bg-slate-200/70',
  },
  {
    id: 'other',
    label: 'Other Reason...',
    icon: HiOutlinePencilSquare,
    bgClass: 'hover:border-slate-400 hover:bg-slate-50/60',
    iconClass: 'text-slate-600 bg-slate-200/70',
  },
];

// Target Timeline Quick Increment Options (Minutes)
const QUICK_TIMELINE_PRESETS = [
  { label: '+15m', minutes: 15 },
  { label: '+30m', minutes: 30 },
  { label: '+45m', minutes: 45 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: '3 hours', minutes: 180 },
  { label: '4 hours', minutes: 240 },
  { label: '8 hours', minutes: 480 },
];

// Format seconds into HH:MM:SS
const formatDurationHMS = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// Format short duration (e.g. 2h 15m)
const formatShortDuration = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m ${s % 60}s`;
};

const TimeTracker = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const queryTaskId = searchParams.get('taskId');

  // Role Checks
  const userRole = (user?.role || '').toLowerCase();
  const canViewAdminLogs =
    userRole === 'admin' ||
    userRole === 'super admin' ||
    userRole === 'cto' ||
    userRole.includes('hr') ||
    userRole.includes('lead') ||
    user?.permissions?.attendance?.view ||
    user?.permissions?.reports?.view;

  // Active Tab: 'timer' | 'history' | 'admin_logs'
  const [activeTab, setActiveTab] = useState('timer');

  // Desktop Notification Permission
  const [notificationPerm, setNotificationPerm] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  // Live Timer Seconds (updated every 1s when active)
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [livePauseSeconds, setLivePauseSeconds] = useState(0);

  // New Session Form State
  const [newSessionForm, setNewSessionForm] = useState({
    task: '',
    taskTitle: '',
    description: '',
    project: '',
    projectName: '',
    mode: 'stopwatch', // 'stopwatch' | 'timeline'
    targetDurationMinutes: 0,
    targetHours: 1,
    targetMins: 0,
    targetFinishTime: '',
  });

  // Modals State
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [selectedPauseReason, setSelectedPauseReason] = useState('Lunch Break');
  const [customPauseReason, setCustomPauseReason] = useState('');

  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');

  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneNote, setMilestoneNote] = useState('');

  // Target Adjust Modal (during active session)
  const [isAdjustTargetModalOpen, setIsAdjustTargetModalOpen] = useState(false);
  const [adjustTargetHours, setAdjustTargetHours] = useState(1);
  const [adjustTargetMins, setAdjustTargetMins] = useState(0);

  const [viewingSessionTimeline, setViewingSessionTimeline] = useState(null);

  // Admin Logs Filters
  const [adminFilterUser, setAdminFilterUser] = useState('all');
  const [adminFilterStatus, setAdminFilterStatus] = useState('all');
  const [adminFilterDate, setAdminFilterDate] = useState('');
  const [adminFilterSearch, setAdminFilterSearch] = useState('');
  const [adminPage, setAdminPage] = useState(1);

  // User History Filters
  const [historyPage, setHistoryPage] = useState(1);
  const [historySearch, setHistorySearch] = useState('');

  // Notifications Milestone alerts tracker
  const alertsTriggeredRef = useRef(new Set());

  // ==========================================
  // QUERIES
  // ==========================================

  // 1. Get Current User Active Session
  const {
    data: activeSessionData,
    isLoading: isActiveLoading,
    refetch: refetchActive,
  } = useQuery({
    queryKey: ['activeTimeSession'],
    queryFn: async () => {
      const { data } = await api.get('/time-sessions/active');
      return data;
    },
    refetchInterval: 15000,
  });

  const activeSession = activeSessionData?.active ? activeSessionData.session : null;

  // 2. Fetch User Projects for selector
  const { data: projects = [] } = useQuery({
    queryKey: ['trackerProjects'],
    queryFn: async () => {
      const { data } = await api.get('/projects');
      return Array.isArray(data) ? data : data?.projects || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // 2b. Fetch User's Assigned Tasks (for strict task timer linkage)
  const { data: myAssignedTasks = [] } = useQuery({
    queryKey: ['myAssignedTasksForTracker'],
    queryFn: async () => {
      const { data } = await api.get('/tasks?myTasks=true');
      return Array.isArray(data) ? data : data?.tasks || [];
    },
    staleTime: 60 * 1000,
  });

  // 3. Fetch Company Users (for Admin Filter)
  const { data: companyUsers = [] } = useQuery({
    queryKey: ['trackerCompanyUsers'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return Array.isArray(data) ? data : data?.users || [];
    },
    enabled: canViewAdminLogs,
    staleTime: 5 * 60 * 1000,
  });

  // 4. Fetch My Sessions History
  const { data: mySessionsData, isLoading: isHistoryLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['myTimeSessions', historyPage, historySearch],
    queryFn: async () => {
      const params = { page: historyPage, limit: 15 };
      if (historySearch.trim()) params.search = historySearch.trim();
      const { data } = await api.get('/time-sessions/my-sessions', { params });
      return data;
    },
    enabled: activeTab === 'history',
  });

  // 5. Fetch Admin Live Stats
  const { data: adminStats, refetch: refetchAdminStats } = useQuery({
    queryKey: ['adminTimeStats'],
    queryFn: async () => {
      const { data } = await api.get('/time-sessions/admin/stats');
      return data;
    },
    enabled: canViewAdminLogs && activeTab === 'admin_logs',
    refetchInterval: 10000,
  });

  // 6. Fetch Admin All Sessions Logs
  const { data: adminLogsData, isLoading: isAdminLogsLoading, refetch: refetchAdminLogs } = useQuery({
    queryKey: [
      'adminAllTimeSessions',
      adminFilterUser,
      adminFilterStatus,
      adminFilterDate,
      adminFilterSearch,
      adminPage,
    ],
    queryFn: async () => {
      const params = {
        page: adminPage,
        limit: 20,
      };
      if (adminFilterUser !== 'all') params.userId = adminFilterUser;
      if (adminFilterStatus !== 'all') params.status = adminFilterStatus;
      if (adminFilterDate) {
        params.startDate = adminFilterDate;
        params.endDate = adminFilterDate;
      }
      if (adminFilterSearch.trim()) params.search = adminFilterSearch.trim();

      const { data } = await api.get('/time-sessions/admin/all', { params });
      return data;
    },
    enabled: canViewAdminLogs && activeTab === 'admin_logs',
  });

  // ==========================================
  // MUTATIONS
  // ==========================================

  // Start Session
  const startMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/time-sessions/start', payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['activeTimeSession']);
      queryClient.invalidateQueries(['myTimeSessions']);
      queryClient.invalidateQueries(['adminTimeStats']);
      queryClient.invalidateQueries(['adminAllTimeSessions']);
      playTimerChime('start');
      showDesktopNotification('Work Timer Started', {
        body: `Now tracking: "${data.session.taskTitle}"`,
      });
      toast.success('Work timer started! Stay productive.');
      setNewSessionForm({
        taskTitle: '',
        description: '',
        project: '',
        projectName: '',
        mode: 'stopwatch',
        targetDurationMinutes: 0,
        targetHours: 1,
        targetMins: 0,
        targetFinishTime: '',
      });
      alertsTriggeredRef.current.clear();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to start timer');
    },
  });

  // Pause Session
  const pauseMutation = useMutation({
    mutationFn: async ({ id, reason }) => {
      const { data } = await api.post(`/time-sessions/${id}/pause`, { reason });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['activeTimeSession']);
      queryClient.invalidateQueries(['adminTimeStats']);
      queryClient.invalidateQueries(['adminAllTimeSessions']);
      setIsPauseModalOpen(false);
      setCustomPauseReason('');
      playTimerChime('pause');
      showDesktopNotification('Timer Paused', {
        body: `Paused for: "${data.session.currentPauseReason}". Remember to resume!`,
      });
      toast.success(`Timer paused (${data.session.currentPauseReason})`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to pause timer');
    },
  });

  // Resume Session
  const resumeMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/time-sessions/${id}/resume`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['activeTimeSession']);
      queryClient.invalidateQueries(['adminTimeStats']);
      queryClient.invalidateQueries(['adminAllTimeSessions']);
      playTimerChime('resume');
      showDesktopNotification('Timer Resumed', {
        body: `Back to work on "${data.session.taskTitle}". Let's stay productive!`,
      });
      toast.success('Timer resumed! Back to work.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to resume timer');
    },
  });

  // End Session
  const endMutation = useMutation({
    mutationFn: async ({ id, completionNotes }) => {
      const { data } = await api.post(`/time-sessions/${id}/end`, { completionNotes });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['activeTimeSession']);
      queryClient.invalidateQueries(['myTimeSessions']);
      queryClient.invalidateQueries(['adminTimeStats']);
      queryClient.invalidateQueries(['adminAllTimeSessions']);
      setIsEndModalOpen(false);
      setCompletionNotes('');
      playTimerChime('complete');
      const hrs = (data.session.productiveDurationSeconds / 3600).toFixed(2);
      showDesktopNotification('Session Completed', {
        body: `Logged ${hrs}h productive time on "${data.session.taskTitle}".`,
      });
      toast.success(`Session completed! (${hrs}h logged)`);
      document.title = 'NexusCorp ERP';
      alertsTriggeredRef.current.clear();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to end timer session');
    },
  });

  // Add Milestone Note
  const milestoneMutation = useMutation({
    mutationFn: async ({ id, title, note }) => {
      const { data } = await api.post(`/time-sessions/${id}/milestone`, { title, note });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['activeTimeSession']);
      queryClient.invalidateQueries(['adminAllTimeSessions']);
      setIsMilestoneModalOpen(false);
      setMilestoneTitle('');
      setMilestoneNote('');
      playTimerChime('milestone');
      toast.success('Checkpoint added to timeline!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add checkpoint');
    },
  });

  // Update Target Duration (Dynamic Adjust)
  const updateTargetMutation = useMutation({
    mutationFn: async ({ id, targetDurationMinutes, mode }) => {
      const { data } = await api.patch(`/time-sessions/${id}/target`, {
        targetDurationMinutes,
        mode: mode || 'timeline',
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['activeTimeSession']);
      setIsAdjustTargetModalOpen(false);
      playTimerChime('milestone');
      toast.success(`Target timeline updated to ${data.session.targetDurationMinutes} mins`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update target');
    },
  });

  // ==========================================
  // REAL-TIME TICKER & DOCUMENT TITLE UPDATE
  // ==========================================
  useEffect(() => {
    if (!activeSession) {
      setLiveSeconds(0);
      setLivePauseSeconds(0);
      return;
    }

    const updateTick = () => {
      const now = new Date();
      const start = new Date(activeSession.startTime);

      let completedPauses = 0;
      let activePause = 0;

      if (Array.isArray(activeSession.pauses)) {
        activeSession.pauses.forEach((p) => {
          if (p.resumedAt) {
            completedPauses +=
              p.durationSeconds || Math.max(0, Math.floor((new Date(p.resumedAt) - new Date(p.pausedAt)) / 1000));
          } else if (activeSession.status === 'paused') {
            activePause = Math.max(0, Math.floor((now - new Date(p.pausedAt)) / 1000));
          }
        });
      }

      const totalPauseSec = completedPauses + activePause;
      const totalElapsedSec = Math.max(0, Math.floor((now - start) / 1000));
      const productiveSec = Math.max(0, totalElapsedSec - totalPauseSec);

      setLiveSeconds(productiveSec);
      setLivePauseSeconds(totalPauseSec);

      // Clean Document Title without emojis
      const timeFormatted = formatDurationHMS(productiveSec);
      if (activeSession.status === 'paused') {
        document.title = `[PAUSED: ${formatDurationHMS(activePause)}] ${activeSession.currentPauseReason || 'Break'} | GII`;
      } else {
        document.title = `[${timeFormatted}] ${activeSession.taskTitle} | GII`;
      }

      // Check for Target timeline completion alert
      if (
        activeSession.mode === 'timeline' &&
        activeSession.targetDurationMinutes > 0 &&
        activeSession.status === 'running'
      ) {
        const targetSec = activeSession.targetDurationMinutes * 60;
        if (productiveSec >= targetSec && !alertsTriggeredRef.current.has('target-reached')) {
          alertsTriggeredRef.current.add('target-reached');
          playTimerChime('target');
          showDesktopNotification('Target Timeline Completed', {
            body: `You reached your ${activeSession.targetDurationMinutes} mins target for "${activeSession.taskTitle}"!`,
          });
        }
      }

      // Check for 60-minute interval periodic desktop notification
      const productiveHours = Math.floor(productiveSec / 3600);
      if (productiveHours > 0 && productiveSec % 3600 < 2) {
        const key = `hour-${productiveHours}`;
        if (!alertsTriggeredRef.current.has(key)) {
          alertsTriggeredRef.current.add(key);
          showDesktopNotification(`Working Milestone: ${productiveHours} Hour${productiveHours > 1 ? 's' : ''}`, {
            body: `Active session: "${activeSession.taskTitle}". Stay hydrated & take a quick stretch!`,
          });
        }
      }

      // Long pause warning (>15 mins)
      if (activeSession.status === 'paused' && activePause >= 900 && !alertsTriggeredRef.current.has('pause-15m')) {
        alertsTriggeredRef.current.add('pause-15m');
        showDesktopNotification('Break Inactivity Warning (15+ Mins)', {
          body: `Timer is currently paused for "${activeSession.currentPauseReason}". Click to resume work!`,
        });
      }
    };

    updateTick();
    const interval = setInterval(updateTick, 1000);

    return () => {
      clearInterval(interval);
      document.title = 'NexusCorp ERP';
    };
  }, [activeSession]);

  // Socket Listener for Live Updates across company
  useEffect(() => {
    if (socket) {
      const handleTimerEvent = () => {
        queryClient.invalidateQueries(['adminTimeStats']);
        queryClient.invalidateQueries(['adminAllTimeSessions']);
      };

      socket.on('timeSession:started', handleTimerEvent);
      socket.on('timeSession:paused', handleTimerEvent);
      socket.on('timeSession:resumed', handleTimerEvent);
      socket.on('timeSession:ended', handleTimerEvent);

      return () => {
        socket.off('timeSession:started', handleTimerEvent);
        socket.off('timeSession:paused', handleTimerEvent);
        socket.off('timeSession:resumed', handleTimerEvent);
        socket.off('timeSession:ended', handleTimerEvent);
      };
    }
  }, [socket, queryClient]);

  // Handle Request Desktop Notification
  const handleEnableNotification = async () => {
    const perm = await requestDesktopNotificationPermission();
    setNotificationPerm(perm);
    if (perm === 'granted') {
      showDesktopNotification('Notifications Enabled', {
        body: 'You will receive background alerts even when working outside this window.',
      });
      playTimerChime('chime');
      toast.success('Desktop push notifications active!');
    } else if (perm === 'denied') {
      toast.error('Notifications blocked in browser settings. Please allow from address bar.');
    }
  };

  // Helper: compute total dynamic minutes from Hours & Minutes inputs
  const dynamicTotalTargetMinutes = useMemo(() => {
    const h = Math.max(0, parseInt(newSessionForm.targetHours || 0, 10));
    const m = Math.max(0, parseInt(newSessionForm.targetMins || 0, 10));
    return h * 60 + m;
  }, [newSessionForm.targetHours, newSessionForm.targetMins]);

  // Helper: set target minutes from quick presets
  const applyTargetMinutes = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    setNewSessionForm((prev) => ({
      ...prev,
      mode: 'timeline',
      targetHours: h,
      targetMins: m,
      targetDurationMinutes: mins,
      targetFinishTime: '',
    }));
  };

  // Helper: set target minutes from a specific finish time today
  const handleFinishTimeChange = (timeStr) => {
    if (!timeStr) {
      setNewSessionForm((prev) => ({ ...prev, targetFinishTime: '' }));
      return;
    }

    const now = new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    const targetDate = new Date();
    targetDate.setHours(hours, minutes, 0, 0);

    let diffMs = targetDate.getTime() - now.getTime();
    if (diffMs <= 0) {
      targetDate.setDate(targetDate.getDate() + 1);
      diffMs = targetDate.getTime() - now.getTime();
    }

    const totalMins = Math.max(1, Math.round(diffMs / (1000 * 60)));
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;

    setNewSessionForm((prev) => ({
      ...prev,
      targetFinishTime: timeStr,
      targetHours: h,
      targetMins: m,
      targetDurationMinutes: totalMins,
      mode: 'timeline',
    }));
  };

  // Helper: Select from assigned tasks (populates fields & binds task ID for strict ownership)
  const handleSelectAssignedTask = (taskDoc) => {
    if (!taskDoc) {
      setNewSessionForm((prev) => ({
        ...prev,
        task: '',
        taskTitle: '',
        description: '',
        project: '',
        projectName: '',
        mode: 'stopwatch',
        targetDurationMinutes: 0,
        targetHours: 1,
        targetMins: 0,
      }));
      return;
    }

    const targetMins =
      taskDoc.targetDurationMinutes ||
      (taskDoc.estimatedTimeDuration ? Math.round(taskDoc.estimatedTimeDuration * 60) : 0);
    const mode =
      taskDoc.timeTrackingMode === 'timeline' || targetMins > 0 ? 'timeline' : 'stopwatch';
    const h = Math.floor(targetMins / 60);
    const m = targetMins % 60;

    setNewSessionForm((prev) => ({
      ...prev,
      task: taskDoc._id,
      taskTitle: taskDoc.title || '',
      description: taskDoc.description || '',
      project: taskDoc.project?._id || taskDoc.project || '',
      projectName: taskDoc.project?.name || '',
      mode,
      targetDurationMinutes: targetMins,
      targetHours: h > 0 ? h : (mode === 'timeline' ? 1 : 0),
      targetMins: m,
      targetFinishTime: '',
    }));
  };

  // Auto-select task if URL query contains ?taskId=...
  useEffect(() => {
    if (queryTaskId && Array.isArray(myAssignedTasks) && myAssignedTasks.length > 0 && !activeSession) {
      const found = myAssignedTasks.find((t) => t._id === queryTaskId);
      if (found) {
        handleSelectAssignedTask(found);
      }
    }
  }, [queryTaskId, myAssignedTasks, activeSession]);

  // Handle Start Form Submit
  const handleStartSubmit = (e) => {
    e.preventDefault();
    if (!newSessionForm.taskTitle.trim()) {
      toast.error('Please enter what you are working on');
      return;
    }

    const targetMinutes =
      newSessionForm.mode === 'timeline' ? dynamicTotalTargetMinutes : 0;

    startMutation.mutate({
      task: newSessionForm.task || undefined,
      taskTitle: newSessionForm.taskTitle.trim(),
      description: newSessionForm.description.trim(),
      project: newSessionForm.project || undefined,
      projectName: newSessionForm.projectName || undefined,
      mode: newSessionForm.mode,
      targetDurationMinutes: targetMinutes,
    });
  };

  // Handle Pause Form Submit
  const handlePauseSubmit = (e) => {
    e.preventDefault();
    const reasonToSubmit =
      selectedPauseReason === 'Other Reason...'
        ? customPauseReason.trim()
        : selectedPauseReason || customPauseReason.trim();

    if (!reasonToSubmit) {
      toast.error('Please specify the reason for pausing');
      return;
    }

    pauseMutation.mutate({
      id: activeSession._id,
      reason: reasonToSubmit,
    });
  };

  // Handle Milestone Submit
  const handleMilestoneSubmit = (e) => {
    e.preventDefault();
    if (!milestoneNote.trim()) {
      toast.error('Please enter checkpoint details');
      return;
    }

    milestoneMutation.mutate({
      id: activeSession._id,
      title: milestoneTitle.trim() || 'Milestone Checkpoint',
      note: milestoneNote.trim(),
    });
  };

  // Timeline percentage if target mode
  const targetProgressPercent = useMemo(() => {
    if (!activeSession || activeSession.mode !== 'timeline' || !activeSession.targetDurationMinutes) {
      return null;
    }
    const targetSeconds = activeSession.targetDurationMinutes * 60;
    const pct = Math.min(100, Math.round((liveSeconds / targetSeconds) * 100));
    return pct;
  }, [activeSession, liveSeconds]);

  // Remaining Target Time
  const remainingTargetSeconds = useMemo(() => {
    if (!activeSession || activeSession.mode !== 'timeline' || !activeSession.targetDurationMinutes) {
      return 0;
    }
    const targetSec = activeSession.targetDurationMinutes * 60;
    return Math.max(0, targetSec - liveSeconds);
  }, [activeSession, liveSeconds]);

  // Export Admin Logs to CSV
  const handleExportAdminLogs = () => {
    const list = adminLogsData?.sessions || [];
    if (!list.length) {
      toast.error('No logs available to export');
      return;
    }

    const headers = [
      'Employee Name',
      'Email',
      'Role',
      'Department',
      'Task Title',
      'Project',
      'Status',
      'Start Time',
      'End Time',
      'Productive Hours',
      'Pause Hours',
      'Pause Count',
      'Pause Reasons',
    ];

    const rows = list.map((s) => {
      const productiveHrs = (s.productiveDurationSeconds / 3600).toFixed(2);
      const pauseHrs = (s.totalPauseSeconds / 3600).toFixed(2);
      const pauseReasons = (s.pauses || []).map((p) => p.reason).filter(Boolean).join(' | ');

      return [
        `"${s.user?.name || 'N/A'}"`,
        `"${s.user?.email || 'N/A'}"`,
        `"${s.user?.role || 'Staff'}"`,
        `"${s.user?.department || 'General'}"`,
        `"${(s.taskTitle || '').replace(/"/g, '""')}"`,
        `"${s.projectName || s.project?.name || ''}"`,
        `"${s.status}"`,
        `"${new Date(s.startTime).toLocaleString()}"`,
        `"${s.endTime ? new Date(s.endTime).toLocaleString() : 'In Progress'}"`,
        productiveHrs,
        pauseHrs,
        s.pauses?.length || 0,
        `"${pauseReasons.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Time_Logs_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Logs exported to CSV successfully');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ===================== PAGE HEADER ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <HiOutlineClock className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Time Tracker
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold tracking-wide uppercase">
                  Productivity Engine
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Precision time recording, dynamic timeline targets & company audit logs
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Notification Status Banner & Enable Button */}
        <div className="flex items-center gap-2 shrink-0">
          {notificationPerm === 'granted' ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <HiOutlineBell className="w-3.5 h-3.5" />
              <span>Desktop Alerts Active</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleEnableNotification}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <HiOutlineBellAlert className="w-4 h-4 text-indigo-600" />
              <span>Enable Desktop Alerts</span>
            </button>
          )}
        </div>
      </div>

      {/* ===================== NAVIGATION TABS ===================== */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl w-fit text-xs sm:text-sm font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('timer')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'timer'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HiOutlineClock className="w-4 h-4" />
          <span>Live Timer Canvas</span>
          {activeSession && (
            <span
              className={`w-2 h-2 rounded-full ${
                activeSession.status === 'running' ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
              }`}
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HiOutlineDocumentText className="w-4 h-4" />
          <span>My Time History</span>
        </button>

        {canViewAdminLogs && (
          <button
            type="button"
            onClick={() => setActiveTab('admin_logs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'admin_logs'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-indigo-600'
            }`}
          >
            <HiOutlineUserGroup className="w-4 h-4" />
            <span>Company Live Logs & Monitoring</span>
            {adminStats?.totalActiveCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[11px] font-mono">
                {adminStats.totalActiveCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MY LIVE TIMER & ACTIVE SESSION                                     */}
      {/* ========================================================================= */}
      {activeTab === 'timer' && (
        <div className="space-y-6">
          {activeSession ? (
            /* ACTIVE RUNNING OR PAUSED TIMER DISPLAY (High-Precision Dark UI) */
            <div
              className={`rounded-3xl border-2 p-6 sm:p-8 shadow-2xl transition-all relative overflow-hidden ${
                activeSession.status === 'running'
                  ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white border-indigo-500/40 shadow-indigo-500/10'
                  : 'bg-gradient-to-br from-amber-950 via-slate-900 to-slate-950 text-white border-amber-500/40 shadow-amber-500/10'
              }`}
            >
              {/* Subtle Ambient Radial Glow */}
              <div
                className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20 ${
                  activeSession.status === 'running' ? 'bg-indigo-500' : 'bg-amber-500'
                }`}
              />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {activeSession.status === 'running' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold tracking-wide uppercase">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <HiOutlinePlay className="w-3.5 h-3.5" />
                        <span>Active Working</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold tracking-wide uppercase">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <HiOutlinePause className="w-3.5 h-3.5" />
                        <span>Paused: {activeSession.currentPauseReason || 'On Break'}</span>
                      </span>
                    )}

                    {activeSession.mode === 'timeline' && activeSession.targetDurationMinutes > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
                        <HiOutlineFlag className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Target: {activeSession.targetDurationMinutes} mins</span>
                      </span>
                    )}

                    {activeSession.projectName && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-xs font-semibold">
                        <HiOutlineFolder className="w-3.5 h-3.5 text-slate-300" />
                        <span>{activeSession.projectName}</span>
                      </span>
                    )}

                    {activeSession.task && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                        <HiOutlineShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Linked Task • Exclusive Timer</span>
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {activeSession.taskTitle}
                  </h2>
                  {activeSession.description && (
                    <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                      {activeSession.description}
                    </p>
                  )}
                </div>

                {/* Main Action Controls */}
                <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                  {activeSession.status === 'running' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPauseReason('Lunch Break');
                        setCustomPauseReason('');
                        setIsPauseModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                    >
                      <HiOutlinePause className="w-4 h-4 stroke-[2.5]" />
                      <span>Pause Work</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => resumeMutation.mutate(activeSession._id)}
                      disabled={resumeMutation.isPending}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                    >
                      <HiOutlinePlay className="w-4 h-4 stroke-[2.5]" />
                      <span>{resumeMutation.isPending ? 'Resuming...' : 'Resume Work'}</span>
                    </button>
                  )}

                  {/* Dynamic Target Adjust Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const curMins = activeSession.targetDurationMinutes || 60;
                      setAdjustTargetHours(Math.floor(curMins / 60));
                      setAdjustTargetMins(curMins % 60);
                      setIsAdjustTargetModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/15 transition-all cursor-pointer"
                    title="Adjust target timeline on the fly"
                  >
                    <HiOutlineAdjustmentsHorizontal className="w-4 h-4 text-indigo-300" />
                    <span className="hidden sm:inline">Adjust Target</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMilestoneTitle('');
                      setMilestoneNote('');
                      setIsMilestoneModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/15 transition-all cursor-pointer"
                  >
                    <HiOutlineFlag className="w-4 h-4 text-violet-300" />
                    <span>Checkpoint</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCompletionNotes('');
                      setIsEndModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600/90 hover:bg-rose-500 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                  >
                    <HiOutlineStop className="w-4 h-4 stroke-[2]" />
                    <span>End Work</span>
                  </button>
                </div>
              </div>

              {/* Digital Stopwatch Display & Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 items-center relative z-10">
                <div className="lg:col-span-6 flex flex-col items-center sm:items-start">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
                      Productive Work Duration
                    </span>
                  </div>

                  {/* Large High-Contrast Digital Readout */}
                  <div className="text-5xl sm:text-7xl font-mono font-black tracking-tight text-white drop-shadow-lg tabular-nums">
                    {formatDurationHMS(liveSeconds)}
                  </div>

                  {/* Dynamic Progress Gauge if Target Mode */}
                  {targetProgressPercent !== null && (
                    <div className="w-full mt-4 space-y-2 bg-white/5 border border-white/10 p-3.5 rounded-2xl">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                        <span className="flex items-center gap-1.5 text-indigo-300">
                          <HiOutlineFlag className="w-4 h-4" />
                          <span>Timeline Target Progress</span>
                        </span>
                        <span className="font-mono font-bold text-white">
                          {targetProgressPercent}% ({formatShortDuration(liveSeconds)} / {activeSession.targetDurationMinutes}m)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-500 rounded-full"
                          style={{ width: `${targetProgressPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                        <span>
                          {remainingTargetSeconds > 0
                            ? `Remaining: ${formatShortDuration(remainingTargetSeconds)}`
                            : 'Target Achieved! Great pace.'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              updateTargetMutation.mutate({
                                id: activeSession._id,
                                targetDurationMinutes: (activeSession.targetDurationMinutes || 0) + 15,
                              })
                            }
                            className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                          >
                            +15m
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateTargetMutation.mutate({
                                id: activeSession._id,
                                targetDurationMinutes: (activeSession.targetDurationMinutes || 0) + 30,
                              })
                            }
                            className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                          >
                            +30m
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Total Pauses
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-1 block tabular-nums">
                      {formatShortDuration(livePauseSeconds)}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {activeSession.pauses?.length || 0} break recorded
                    </span>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Started At
                    </span>
                    <span className="text-base sm:text-lg font-bold text-white font-mono mt-1 block">
                      {new Date(activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {new Date(activeSession.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 col-span-2 sm:col-span-1">
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Checkpoints
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-indigo-400 font-mono mt-1 block tabular-nums">
                      {activeSession.timeline?.filter((t) => t.type === 'milestone').length || 0}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Milestones logged</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* START NEW WORK SESSION CARD (Precision Form with Dynamic Target) */
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                    <HiOutlineBolt className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                      Start a New Work Session
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Configure your task, set a dynamic timeline target, and monitor work intervals.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleStartSubmit} className="space-y-5 pt-2">
                  {/* Quick Select from Assigned Tasks */}
                  {Array.isArray(myAssignedTasks) && myAssignedTasks.length > 0 && (
                    <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                          <HiOutlineShieldCheck className="w-4 h-4 text-indigo-600" />
                          Select from Your Assigned Tasks (Exclusive Access)
                        </span>
                        {newSessionForm.task && (
                          <button
                            type="button"
                            onClick={() => handleSelectAssignedTask(null)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                          >
                            <HiOutlineXMark className="w-3.5 h-3.5" />
                            <span>Unlink Task</span>
                          </button>
                        )}
                      </div>

                      <select
                        value={newSessionForm.task}
                        onChange={(e) => {
                          const taskId = e.target.value;
                          const selected = myAssignedTasks.find((t) => t._id === taskId);
                          handleSelectAssignedTask(selected || null);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-white text-slate-900 font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="">-- Choose an assigned task to link timer (Optional) --</option>
                        {myAssignedTasks
                          .filter((t) => t.status !== 'Completed')
                          .map((task) => {
                            const tMins =
                              task.targetDurationMinutes ||
                              (task.estimatedTimeDuration ? Math.round(task.estimatedTimeDuration * 60) : 0);
                            return (
                              <option key={task._id} value={task._id}>
                                {task.title} {task.project?.name ? `(${task.project.name})` : ''} - [{task.status}]
                                {tMins > 0 ? ` • Target: ${Math.floor(tMins / 60)}h ${tMins % 60}m` : ''}
                              </option>
                            );
                          })}
                      </select>

                      {newSessionForm.task && (
                        <div className="flex items-center justify-between text-xs text-indigo-700 bg-indigo-100/60 px-3 py-1.5 rounded-lg">
                          <span className="font-medium">
                            ✓ Linked to task. Only you have permission to start, pause, and log time for this task.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      What are you working on? <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Redesigning Dashboard UI, Writing Unit Tests, Resolving Client Ticket..."
                      value={newSessionForm.taskTitle}
                      onChange={(e) => setNewSessionForm({ ...newSessionForm, taskTitle: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium text-sm sm:text-base placeholder:text-slate-400 transition-all"
                    />

                    {/* Quick Suggestions */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[11px] font-semibold text-slate-400">Suggestions:</span>
                      {[
                        'Frontend Development',
                        'Backend API Implementation',
                        'Client Review Meeting',
                        'Bug Fixing & QA',
                        'Project Architecture',
                      ].map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setNewSessionForm({ ...newSessionForm, taskTitle: sug })}
                          className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Project Selector */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Associate Project (Optional)
                      </label>
                      <select
                        value={newSessionForm.project}
                        onChange={(e) => {
                          const pId = e.target.value;
                          const found = projects.find((p) => p._id === pId);
                          setNewSessionForm({
                            ...newSessionForm,
                            project: pId,
                            projectName: found ? found.name : '',
                          });
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">No Project Assigned (Internal Work)</option>
                        {projects.map((proj) => (
                          <option key={proj._id} value={proj._id}>
                            {proj.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Mode Selector */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Tracking Style
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setNewSessionForm({
                              ...newSessionForm,
                              mode: 'stopwatch',
                              targetDurationMinutes: 0,
                            })
                          }
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition text-center flex items-center justify-center gap-2 cursor-pointer ${
                            newSessionForm.mode === 'stopwatch'
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <HiOutlineClock className="w-4 h-4" />
                          <span>Open Stopwatch</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setNewSessionForm({
                              ...newSessionForm,
                              mode: 'timeline',
                              targetHours: newSessionForm.targetHours || 1,
                              targetMins: newSessionForm.targetMins || 0,
                              targetDurationMinutes:
                                (newSessionForm.targetHours || 1) * 60 + (newSessionForm.targetMins || 0),
                            })
                          }
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition text-center flex items-center justify-center gap-2 cursor-pointer ${
                            newSessionForm.mode === 'timeline'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <HiOutlineFlag className="w-4 h-4" />
                          <span>Dynamic Target</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* DYNAMIC TARGET TIMELINE CONFIGURATION */}
                  {newSessionForm.mode === 'timeline' && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                          <HiOutlineAdjustmentsHorizontal className="w-4 h-4 text-indigo-600" />
                          Set Dynamic Timeline Target
                        </span>
                        <span className="text-xs font-mono font-bold text-indigo-800 bg-indigo-100/80 px-2.5 py-0.5 rounded-lg">
                          Total: {dynamicTotalTargetMinutes} minutes (
                          {Math.floor(dynamicTotalTargetMinutes / 60)}h {dynamicTotalTargetMinutes % 60}m)
                        </span>
                      </div>

                      {/* Custom Hours & Minutes Input */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Duration: Hours & Minutes
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                              <input
                                type="number"
                                min="0"
                                max="24"
                                value={newSessionForm.targetHours}
                                onChange={(e) =>
                                  setNewSessionForm({
                                    ...newSessionForm,
                                    targetHours: Math.max(0, parseInt(e.target.value || 0, 10)),
                                    targetFinishTime: '',
                                  })
                                }
                                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-indigo-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-bold uppercase">
                                Hrs
                              </span>
                            </div>

                            <div className="flex-1 relative">
                              <input
                                type="number"
                                min="0"
                                max="59"
                                step="5"
                                value={newSessionForm.targetMins}
                                onChange={(e) =>
                                  setNewSessionForm({
                                    ...newSessionForm,
                                    targetMins: Math.max(0, Math.min(59, parseInt(e.target.value || 0, 10))),
                                    targetFinishTime: '',
                                  })
                                }
                                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-indigo-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <span className="absolute right-3 top-2 text-[10px] text-slate-400 font-bold uppercase">
                                Mins
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Finish by Time of Day */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Or Set Target Finish Time (Today)
                          </label>
                          <input
                            type="time"
                            value={newSessionForm.targetFinishTime}
                            onChange={(e) => handleFinishTimeChange(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-indigo-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Quick Timeline Presets */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Quick Presets:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {QUICK_TIMELINE_PRESETS.map((p) => (
                            <button
                              key={p.minutes}
                              type="button"
                              onClick={() => applyTargetMinutes(p.minutes)}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                                dynamicTotalTargetMinutes === p.minutes
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                  : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-100'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Session Description */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Session Goal / Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Add brief details about what you aim to complete..."
                      value={newSessionForm.description}
                      onChange={(e) => setNewSessionForm({ ...newSessionForm, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={startMutation.isPending || !newSessionForm.taskTitle.trim()}
                      className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-black text-sm sm:text-base shadow-md disabled:opacity-50 transition-all cursor-pointer"
                    >
                      <HiOutlinePlay className="w-5 h-5 stroke-[2.5]" />
                      <span>{startMutation.isPending ? 'Starting...' : 'Start Work Timer'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* LIVE SESSION TIMELINE LOGS (If Active Session) */}
          {activeSession && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <HiOutlineClock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Live Session Timeline Logs
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Chronological events: start, pause reasons, resumes & checkpoints
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMilestoneTitle('');
                    setMilestoneNote('');
                    setIsMilestoneModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <HiOutlinePlus className="w-4 h-4" />
                  <span>Log Checkpoint</span>
                </button>
              </div>

              {/* Vertical Timeline with Clean SVG Icons */}
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {(activeSession.timeline || []).map((item, idx) => (
                  <div key={idx} className="relative group">
                    {/* Event SVG Dot */}
                    <span
                      className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] shadow-xs ${
                        item.type === 'start'
                          ? 'bg-emerald-500 text-white'
                          : item.type === 'pause'
                          ? 'bg-amber-500 text-white'
                          : item.type === 'resume'
                          ? 'bg-indigo-500 text-white'
                          : item.type === 'milestone'
                          ? 'bg-violet-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {item.type === 'start' && <HiOutlinePlay className="w-3 h-3 stroke-[3]" />}
                      {item.type === 'pause' && <HiOutlinePause className="w-3 h-3 stroke-[3]" />}
                      {item.type === 'resume' && <HiOutlineForward className="w-3 h-3 stroke-[3]" />}
                      {item.type === 'milestone' && <HiOutlineFlag className="w-3 h-3 stroke-[2.5]" />}
                      {item.type === 'end' && <HiOutlineCheckCircle className="w-3 h-3 stroke-[2.5]" />}
                    </span>

                    <div className="bg-slate-50 hover:bg-slate-100/80 p-3.5 rounded-2xl border border-slate-200/80 transition-all">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          {item.title || item.type.toUpperCase()}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {new Date(item.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>

                      {item.reason && (
                        <div className="mt-1.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-100/80 text-amber-900 text-xs font-bold">
                            <HiOutlinePause className="w-3.5 h-3.5 text-amber-700" />
                            <span>Pause Reason: {item.reason}</span>
                          </span>
                        </div>
                      )}

                      {item.note && (
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {item.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MY TIME LOGS & HISTORY                                             */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">My Completed Sessions & Time Logs</h2>
              <p className="text-xs text-slate-500">Your personal work records, break durations and timeline details.</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search my tasks..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="px-3.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => refetchHistory()}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                title="Refresh"
              >
                <HiOutlineArrowPath className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sessions List */}
          {isHistoryLoading ? (
            <div className="py-12 text-center text-slate-400 font-medium text-xs">
              Loading your time history...
            </div>
          ) : (mySessionsData?.sessions || []).length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-medium text-xs">
              No previous work sessions recorded yet. Start a new session on the timer canvas to log your time.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {mySessionsData.sessions.map((s) => (
                <div key={s._id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          s.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : s.status === 'running'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {s.status === 'completed' && <HiOutlineCheckCircle className="w-3 h-3" />}
                        {s.status === 'running' && <HiOutlinePlay className="w-3 h-3" />}
                        {s.status === 'paused' && <HiOutlinePause className="w-3 h-3" />}
                        <span>{s.status.toUpperCase()}</span>
                      </span>

                      {s.projectName && (
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <HiOutlineFolder className="w-3 h-3" />
                          <span>{s.projectName}</span>
                        </span>
                      )}

                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(s.startTime).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{s.taskTitle}</h3>
                    {s.completionNotes && (
                      <p className="text-xs text-slate-500 italic">Notes: {s.completionNotes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="block text-xs font-mono font-bold text-slate-900">
                        {formatDurationHMS(s.productiveDurationSeconds)}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {s.totalPauseSeconds > 0
                          ? `Pauses: ${formatShortDuration(s.totalPauseSeconds)} (${s.pauses?.length || 0})`
                          : 'No breaks taken'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewingSessionTimeline(s)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <HiOutlineEye className="w-4 h-4 text-slate-600" />
                      <span>Timeline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: COMPANY LIVE LOGS & MONITORING (ADMIN / HR / LEAD ONLY)            */}
      {/* ========================================================================= */}
      {canViewAdminLogs && activeTab === 'admin_logs' && (
        <div className="space-y-6">
          {/* TOP LIVE METRICS STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Working Now</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <p className="text-3xl font-black text-slate-900 font-mono mt-2">
                {adminStats?.currentlyWorkingCount || 0}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">Active productive employees</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">On Break / Paused</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              </div>
              <p className="text-3xl font-black text-amber-600 font-mono mt-2">
                {adminStats?.currentlyPausedCount || 0}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">Paused with logged reason</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Productive Hours Today</span>
                <HiOutlineChartBar className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-3xl font-black text-indigo-600 font-mono mt-2">
                {adminStats?.todayProductiveHours || 0}h
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">Across all company departments</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Breaks Today</span>
                <HiOutlineClock className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-3xl font-black text-slate-900 font-mono mt-2">
                {adminStats?.todayPauseHours || 0}h
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">Recorded break durations</span>
            </div>
          </div>

          {/* LIVE TEAMS WORKING GRID (WHO IS WORKING & WHO IS ON BREAK RIGHT NOW) */}
          {(adminStats?.currentlyWorking?.length > 0 || adminStats?.currentlyPaused?.length > 0) && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Active Timers Right Now
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {adminStats?.totalActiveCount || 0} active sessions
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Working Employees */}
                {(adminStats?.currentlyWorking || []).map((s) => (
                  <div
                    key={s._id}
                    className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                          {s.user?.name?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{s.user?.name}</p>
                          <p className="text-[10px] text-slate-500">{s.user?.department || 'Staff'}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        <HiOutlinePlay className="w-3 h-3 text-emerald-600" />
                        <span>Working</span>
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">{s.taskTitle}</p>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-emerald-100">
                      <span>Started: {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="font-bold text-emerald-700">
                        {formatDurationHMS(s.liveMetrics?.productiveDurationSeconds)}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Paused Employees (Showing WHY they paused) */}
                {(adminStats?.currentlyPaused || []).map((s) => (
                  <div
                    key={s._id}
                    className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
                          {s.user?.name?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{s.user?.name}</p>
                          <p className="text-[10px] text-slate-500">{s.user?.department || 'Staff'}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        <HiOutlinePause className="w-3 h-3 text-amber-600" />
                        <span>Paused</span>
                      </span>
                    </div>

                    <div className="bg-amber-100/70 px-2.5 py-1 rounded-xl text-xs font-bold text-amber-900">
                      Reason: {s.currentPauseReason || 'On Break'}
                    </div>

                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">{s.taskTitle}</p>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-amber-100">
                      <span>Break duration:</span>
                      <span className="font-bold text-amber-700">
                        {formatShortDuration(s.liveMetrics?.activePauseSeconds)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ALL EMPLOYEES LOGS TABLE WITH FILTERS */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  All Employees Detailed Work Logs & Timeline
                </h3>
                <p className="text-xs text-slate-500">
                  Full company audit trails: start times, pause reasons, resume events, and completion records.
                </p>
              </div>

              {/* Export to CSV */}
              <button
                type="button"
                onClick={handleExportAdminLogs}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
              >
                <HiOutlineArrowDownTray className="w-4 h-4" />
                <span>Export Report (CSV)</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Employee</label>
                <select
                  value={adminFilterUser}
                  onChange={(e) => setAdminFilterUser(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Employees</option>
                  {companyUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Status</label>
                <select
                  value={adminFilterStatus}
                  onChange={(e) => setAdminFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="running">Working Now</option>
                  <option value="paused">Paused on Break</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Date</label>
                <input
                  type="date"
                  value={adminFilterDate}
                  onChange={(e) => setAdminFilterDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Task, pause reason..."
                  value={adminFilterSearch}
                  onChange={(e) => setAdminFilterSearch(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Task & Project</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Start Time</th>
                    <th className="py-3 px-4">Productive Time</th>
                    <th className="py-3 px-4">Breaks / Pauses</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isAdminLogsLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                        Loading employee logs...
                      </td>
                    </tr>
                  ) : (adminLogsData?.sessions || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                        No time tracking records found matching filters.
                      </td>
                    </tr>
                  ) : (
                    adminLogsData.sessions.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {s.user?.name?.[0] || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{s.user?.name || 'Unknown'}</p>
                              <p className="text-[10px] text-slate-500">{s.user?.department || 'Staff'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900 max-w-xs truncate">{s.taskTitle}</p>
                          {s.projectName && (
                            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                              <HiOutlineFolder className="w-3 h-3" />
                              <span>{s.projectName}</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {s.status === 'running' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                              Working
                            </span>
                          ) : s.status === 'paused' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                              <HiOutlinePause className="w-3 h-3 text-amber-600" />
                              <span>Paused: {s.currentPauseReason || 'Break'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                              <HiOutlineCheckCircle className="w-3 h-3 text-slate-500" />
                              <span>Completed</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-600">
                          <div>{new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(s.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {formatDurationHMS(s.productiveDurationSeconds)}
                        </td>

                        <td className="py-3 px-4">
                          {s.pauses?.length > 0 ? (
                            <div>
                              <span className="font-mono font-bold text-amber-700">
                                {formatShortDuration(s.totalPauseSeconds)}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {s.pauses.length} break(s)
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">0 breaks</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setViewingSessionTimeline(s)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition cursor-pointer"
                          >
                            <HiOutlineEye className="w-4 h-4" />
                            <span>View Timeline</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MANDATORY PAUSE REASON (WITH PROFESSIONAL ICONS)                   */}
      {/* ========================================================================= */}
      {isPauseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <HiOutlinePause className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Why are you pausing your timer?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pause reason is required for company attendance & audit logging.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPauseModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePauseSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Select Pause Reason Category <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PAUSE_REASONS.map((pr) => {
                    const IconComponent = pr.icon;
                    const isSelected = selectedPauseReason === pr.label;
                    return (
                      <button
                        key={pr.id}
                        type="button"
                        onClick={() => setSelectedPauseReason(pr.label)}
                        className={`p-2.5 rounded-2xl text-left border text-xs font-bold transition flex flex-col justify-between gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs ring-2 ring-amber-400/50'
                            : `bg-white text-slate-700 border-slate-200 ${pr.bgClass}`
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                            isSelected ? 'bg-black/15 text-slate-950' : pr.iconClass
                          }`}
                        >
                          <IconComponent className="w-4 h-4 stroke-[2]" />
                        </div>
                        <span className="leading-tight line-clamp-2">{pr.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Reason Input if 'Other Reason...' or additional note */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Specific Description / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Taking client call on mobile, going for team lunch..."
                  value={customPauseReason}
                  onChange={(e) => setCustomPauseReason(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPauseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pauseMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-extrabold shadow-sm transition cursor-pointer"
                >
                  <HiOutlinePause className="w-4 h-4 stroke-[2.5]" />
                  <span>{pauseMutation.isPending ? 'Pausing...' : 'Confirm Pause'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DYNAMIC TARGET ADJUSTMENT (DURING ACTIVE SESSION)                   */}
      {/* ========================================================================= */}
      {isAdjustTargetModalOpen && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <HiOutlineAdjustmentsHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Adjust Timeline Target
                  </h3>
                  <p className="text-xs text-slate-500">
                    Change your target duration dynamically without resetting timer.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustTargetModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={adjustTargetHours}
                    onChange={(e) => setAdjustTargetHours(Math.max(0, parseInt(e.target.value || 0, 10)))}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Minutes
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    step="5"
                    value={adjustTargetMins}
                    onChange={(e) => setAdjustTargetMins(Math.max(0, Math.min(59, parseInt(e.target.value || 0, 10))))}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Quick Add Presets */}
              <div>
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Quick Add:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '+15 Mins', mins: 15 },
                    { label: '+30 Mins', mins: 30 },
                    { label: '+1 Hour', mins: 60 },
                    { label: '+2 Hours', mins: 120 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        const curTotal = (adjustTargetHours || 0) * 60 + (adjustTargetMins || 0);
                        const newTotal = curTotal + preset.mins;
                        setAdjustTargetHours(Math.floor(newTotal / 60));
                        setAdjustTargetMins(newTotal % 60);
                      }}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustTargetModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const total = (adjustTargetHours || 0) * 60 + (adjustTargetMins || 0);
                    if (total <= 0) {
                      toast.error('Target timeline must be greater than 0 minutes');
                      return;
                    }
                    updateTargetMutation.mutate({
                      id: activeSession._id,
                      targetDurationMinutes: total,
                      mode: 'timeline',
                    });
                  }}
                  disabled={updateTargetMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  <HiOutlineCheckCircle className="w-4 h-4" />
                  <span>{updateTargetMutation.isPending ? 'Updating...' : 'Update Target'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: END WORK SESSION SUMMARY                                           */}
      {/* ========================================================================= */}
      {isEndModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                  <HiOutlineStop className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Complete & End Work Session
                  </h3>
                  <p className="text-xs text-slate-500">
                    Finalize your work records and commit to audit logs.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEndModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Task Title:</span>
                <span className="font-bold text-slate-900">{activeSession?.taskTitle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Productive Time:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {formatDurationHMS(liveSeconds)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total Breaks:</span>
                <span className="font-mono font-bold text-amber-600">
                  {formatShortDuration(livePauseSeconds)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Work Summary / Handover Note (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="What did you complete or achieve in this session?"
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsEndModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Keep Working
              </button>
              <button
                type="button"
                onClick={() =>
                  endMutation.mutate({
                    id: activeSession._id,
                    completionNotes,
                  })
                }
                disabled={endMutation.isPending}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <HiOutlineCheckCircle className="w-4 h-4" />
                <span>{endMutation.isPending ? 'Ending...' : 'Save & Complete Session'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD MILESTONE CHECKPOINT                                           */}
      {/* ========================================================================= */}
      {isMilestoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                  <HiOutlineFlag className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Add Timeline Checkpoint
                  </h3>
                  <p className="text-xs text-slate-500">
                    Record a milestone achieved during this work session.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMilestoneModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMilestoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Checkpoint Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Database Migrated, Client Call Concluded..."
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Details / Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Briefly state what was achieved at this point..."
                  value={milestoneNote}
                  onChange={(e) => setMilestoneNote(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMilestoneModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={milestoneMutation.isPending || !milestoneNote.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  <HiOutlinePlus className="w-4 h-4" />
                  <span>{milestoneMutation.isPending ? 'Adding...' : 'Add to Timeline'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW DETAILED SESSION TIMELINE (FOR ANY PREVIOUS / ADMIN LOG)      */}
      {/* ========================================================================= */}
      {viewingSessionTimeline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="shrink-0 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <HiOutlineClock className="w-5 h-5 text-indigo-600" />
                  Session Audit Timeline Log
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {viewingSessionTimeline.user?.name ? `${viewingSessionTimeline.user.name} • ` : ''}
                  {viewingSessionTimeline.taskTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingSessionTimeline(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Overview in Modal */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 shrink-0 text-center">
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-500">Productive</span>
                <span className="font-mono font-black text-sm text-emerald-600">
                  {formatDurationHMS(viewingSessionTimeline.productiveDurationSeconds)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-500">Breaks</span>
                <span className="font-mono font-black text-sm text-amber-600">
                  {formatShortDuration(viewingSessionTimeline.totalPauseSeconds)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-500">Started</span>
                <span className="font-mono font-bold text-xs text-slate-700">
                  {new Date(viewingSessionTimeline.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Scrollable Events List with Clean SVG Icons */}
            <div className="flex-1 overflow-y-auto pr-2 relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {(viewingSessionTimeline.timeline || []).map((item, idx) => (
                <div key={idx} className="relative">
                  <span
                    className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] shadow-xs ${
                      item.type === 'start'
                        ? 'bg-emerald-500 text-white'
                        : item.type === 'pause'
                        ? 'bg-amber-500 text-white'
                        : item.type === 'resume'
                        ? 'bg-indigo-500 text-white'
                        : item.type === 'milestone'
                        ? 'bg-violet-500 text-white'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {item.type === 'start' && <HiOutlinePlay className="w-3 h-3 stroke-[3]" />}
                    {item.type === 'pause' && <HiOutlinePause className="w-3 h-3 stroke-[3]" />}
                    {item.type === 'resume' && <HiOutlineForward className="w-3 h-3 stroke-[3]" />}
                    {item.type === 'milestone' && <HiOutlineFlag className="w-3 h-3 stroke-[2.5]" />}
                    {item.type === 'end' && <HiOutlineCheckCircle className="w-3 h-3 stroke-[2.5]" />}
                  </span>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">
                        {item.title || item.type.toUpperCase()}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>

                    {item.reason && (
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold">
                          <HiOutlinePause className="w-3.5 h-3.5 text-amber-700" />
                          <span>Pause Reason: {item.reason}</span>
                        </span>
                      </div>
                    )}

                    {item.note && (
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="shrink-0 flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingSessionTimeline(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-black text-white cursor-pointer"
              >
                Close Timeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTracker;
