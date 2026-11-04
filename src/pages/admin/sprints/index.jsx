import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  HiOutlineRocketLaunch,
  HiOutlinePlus,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineClipboardDocumentList,
  HiOutlineUser,
  HiOutlineUsers,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineArrowPath,
  HiOutlineFunnel,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineFlag,
  HiOutlineChartBar,
  HiOutlineViewColumns,
  HiOutlineArrowTrendingUp,
  HiOutlineExclamationTriangle,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineFolder,
  HiOutlinePlay,
  HiOutlineCheck,
  HiOutlineArrowsRightLeft,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import api from '../../../api/axios';

const SPRINT_STATUS_CONFIG = {
  Planned: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-800',
  },
  Active: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  Completed: {
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
    badge: 'bg-purple-100 text-purple-800',
  },
  Cancelled: {
    bg: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    badge: 'bg-slate-200 text-slate-700',
  },
};

const TASK_STATUS_COLORS = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'On Hold': 'bg-slate-100 text-slate-600 border-slate-200',
  'Awaiting Approval': 'bg-rose-50 text-rose-700 border-rose-200',
};

const SprintsManager = () => {
  const queryClient = useQueryClient();

  // Active view tab: 'sprints' | 'daily' | 'timeline' | 'team'
  const [activeTab, setActiveTab] = useState('sprints');

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Sprint for task drawer or deep inspection
  const [selectedSprintId, setSelectedSprintId] = useState(null);
  const [expandedSprintIds, setExpandedSprintIds] = useState({});

  // Modals state
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [sprintToDelete, setSprintToDelete] = useState(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [targetSprintForTask, setTargetSprintForTask] = useState(null);
  const [preSelectedUserForTask, setPreSelectedUserForTask] = useState(null);

  // Divide / Batch Tasks Modal state
  const [isDivideModalOpen, setIsDivideModalOpen] = useState(false);
  const [targetSprintForDivide, setTargetSprintForDivide] = useState(null);
  const [dividedTaskRows, setDividedTaskRows] = useState([
    { title: '', description: '', assignedTo: '', estimatedTimeDuration: 4, priority: 'Normal', sprintDay: 1, scheduledDate: '' },
    { title: '', description: '', assignedTo: '', estimatedTimeDuration: 4, priority: 'Normal', sprintDay: 2, scheduledDate: '' },
    { title: '', description: '', assignedTo: '', estimatedTimeDuration: 4, priority: 'Normal', sprintDay: 3, scheduledDate: '' },
  ]);

  // Sprint Form State
  const initialSprintForm = {
    project: '',
    name: '',
    goal: '',
    startDate: '',
    endDate: '',
    status: 'Planned',
    targetHours: 0,
    notes: '',
    members: [],
  };
  const [sprintForm, setSprintForm] = useState(initialSprintForm);

  // Single Sprint Task Form State
  const initialTaskForm = {
    title: '',
    description: '',
    assignedTo: '',
    priority: 'Normal',
    startDate: '',
    dueDate: '',
    estimatedTimeDuration: 4,
    scheduledDate: '',
    sprintDay: '',
  };
  const [taskForm, setTaskForm] = useState(initialTaskForm);

  // 1. Fetch Projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projectsList'],
    queryFn: async () => {
      const { data } = await api.get('/projects');
      return Array.isArray(data) ? data : [];
    },
  });

  // 2. Fetch Company Team Members (Always loaded with workload & active tasks)
  const {
    data: users = [],
    isLoading: isUsersLoading,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['sprintTeamMembers'],
    queryFn: async () => {
      const { data } = await api.get('/sprints/team-members');
      return Array.isArray(data) ? data : [];
    },
  });

  // 3. Fetch Sprints (with real-time metrics & populated members)
  const {
    data: sprints = [],
    isLoading: isSprintsLoading,
    isRefetching,
    refetch: refetchSprints,
  } = useQuery({
    queryKey: ['sprintsList', selectedProjectId, statusFilter],
    queryFn: async () => {
      const params = {};
      if (selectedProjectId !== 'All') params.project = selectedProjectId;
      if (statusFilter !== 'All') params.status = statusFilter;
      const { data } = await api.get('/sprints', { params });
      return data;
    },
  });

  // 4. Fetch Project Timeline & Analytics
  const activeTimelineProjectId = useMemo(() => {
    if (selectedProjectId !== 'All') return selectedProjectId;
    if (projects.length > 0) return projects[0]._id;
    return null;
  }, [selectedProjectId, projects]);

  const { data: timelineData, isLoading: isTimelineLoading } = useQuery({
    queryKey: ['projectTimeline', activeTimelineProjectId],
    queryFn: async () => {
      if (!activeTimelineProjectId) return null;
      const { data } = await api.get(`/sprints/project/${activeTimelineProjectId}/timeline`);
      return data;
    },
    enabled: !!activeTimelineProjectId,
  });

  // 5. Fetch Daily Schedule for currently inspected sprint
  const activeDailySprintId = useMemo(() => {
    if (selectedSprintId) return selectedSprintId;
    const activeSprint = sprints.find((s) => s.status === 'Active');
    if (activeSprint) return activeSprint._id;
    if (sprints.length > 0) return sprints[0]._id;
    return null;
  }, [selectedSprintId, sprints]);

  const { data: dailyScheduleData, isLoading: isDailyLoading } = useQuery({
    queryKey: ['sprintDailySchedule', activeDailySprintId],
    queryFn: async () => {
      if (!activeDailySprintId) return null;
      const { data } = await api.get(`/sprints/${activeDailySprintId}/daily-schedule`);
      return data;
    },
    enabled: !!activeDailySprintId,
  });

  // ===================== MUTATIONS =====================
  // Create Sprint
  const createSprintMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/sprints', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sprintsList']);
      queryClient.invalidateQueries(['projectTimeline']);
      toast.success('Sprint created and members assigned!');
      closeSprintModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create sprint');
    },
  });

  // Update Sprint
  const updateSprintMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.put(`/sprints/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sprintsList']);
      queryClient.invalidateQueries(['projectTimeline']);
      queryClient.invalidateQueries(['sprintDailySchedule']);
      toast.success('Sprint updated successfully!');
      closeSprintModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update sprint');
    },
  });

  // Delete Sprint
  const deleteSprintMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/sprints/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sprintsList']);
      queryClient.invalidateQueries(['projectTimeline']);
      toast.success('Sprint removed and tasks safely unassigned');
      setSprintToDelete(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete sprint');
    },
  });

  // Create Single Task in Sprint
  const createTaskMutation = useMutation({
    mutationFn: async ({ sprintId, payload }) => {
      const { data } = await api.post(`/sprints/${sprintId}/tasks`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sprintsList']);
      queryClient.invalidateQueries(['projectTimeline']);
      queryClient.invalidateQueries(['sprintDailySchedule']);
      queryClient.invalidateQueries(['sprintTeamMembers']);
      toast.success('Task created and assigned!');
      closeTaskModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create task in sprint');
    },
  });

  // Batch Divide & Assign Tasks Mutation
  const batchDivideMutation = useMutation({
    mutationFn: async ({ sprintId, tasks }) => {
      const { data } = await api.post(`/sprints/${sprintId}/divide-tasks`, { tasks });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['sprintsList']);
      queryClient.invalidateQueries(['projectTimeline']);
      queryClient.invalidateQueries(['sprintDailySchedule']);
      queryClient.invalidateQueries(['sprintTeamMembers']);
      toast.success(data?.message || 'Tasks divided and assigned to team members successfully!');
      closeDivideModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to divide tasks');
    },
  });

  // Quick Task Status / Schedule Update
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, payload }) => {
      const { data } = await api.put(`/sprints/tasks/${taskId}/schedule`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sprintsList']);
      queryClient.invalidateQueries(['projectTimeline']);
      queryClient.invalidateQueries(['sprintDailySchedule']);
      queryClient.invalidateQueries(['sprintTeamMembers']);
      toast.success('Task updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update task');
    },
  });

  // Filtered Sprints list
  const filteredSprints = useMemo(() => {
    let list = [...sprints];
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name?.toLowerCase().includes(term) ||
          s.goal?.toLowerCase().includes(term) ||
          s.project?.name?.toLowerCase().includes(term)
      );
    }
    return list;
  }, [sprints, searchTerm]);

  // Modal Openers
  const openCreateSprintModal = () => {
    setEditingSprint(null);
    setSprintForm({
      ...initialSprintForm,
      project: selectedProjectId !== 'All' ? selectedProjectId : projects[0]?._id || '',
      members: [],
    });
    setIsSprintModalOpen(true);
  };

  const openEditSprintModal = (sprint) => {
    setEditingSprint(sprint);
    const existingMembers = (sprint.members || []).map((m) => m._id || m);
    setSprintForm({
      project: sprint.project?._id || sprint.project || '',
      name: sprint.name || '',
      goal: sprint.goal || '',
      startDate: sprint.startDate ? new Date(sprint.startDate).toISOString().split('T')[0] : '',
      endDate: sprint.endDate ? new Date(sprint.endDate).toISOString().split('T')[0] : '',
      status: sprint.status || 'Planned',
      targetHours: sprint.targetHours || 0,
      notes: sprint.notes || '',
      members: existingMembers,
    });
    setIsSprintModalOpen(true);
  };

  const closeSprintModal = () => {
    setIsSprintModalOpen(false);
    setEditingSprint(null);
    setSprintForm(initialSprintForm);
  };

  const openCreateTaskModal = (sprint, userToPreSelect = null) => {
    setTargetSprintForTask(sprint);
    setPreSelectedUserForTask(userToPreSelect);
    const sprintStart = sprint?.startDate
      ? new Date(sprint.startDate).toISOString().split('T')[0]
      : '';
    const sprintEnd = sprint?.endDate ? new Date(sprint.endDate).toISOString().split('T')[0] : '';
    setTaskForm({
      ...initialTaskForm,
      assignedTo: userToPreSelect?._id || (sprint?.members?.[0]?._id || ''),
      startDate: sprintStart,
      dueDate: sprintEnd,
      scheduledDate: sprintStart,
    });
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setTargetSprintForTask(null);
    setPreSelectedUserForTask(null);
    setTaskForm(initialTaskForm);
  };

  // Open Divide Tasks Modal
  const openDivideTasksModal = (sprint) => {
    const targetSp = sprint || sprints[0];
    if (!targetSp) {
      return toast.error('Please create or select a sprint first');
    }
    setTargetSprintForDivide(targetSp);

    // Default rows distributed among sprint members or loaded users
    const defaultAssignees = targetSp.members && targetSp.members.length > 0 ? targetSp.members : users;
    const initialRows = [
      {
        title: '',
        description: '',
        assignedTo: defaultAssignees[0]?._id || '',
        estimatedTimeDuration: 4,
        priority: 'Normal',
        sprintDay: 1,
        scheduledDate: targetSp.startDate ? new Date(targetSp.startDate).toISOString().split('T')[0] : '',
      },
      {
        title: '',
        description: '',
        assignedTo: defaultAssignees[1]?._id || defaultAssignees[0]?._id || '',
        estimatedTimeDuration: 4,
        priority: 'Normal',
        sprintDay: 2,
        scheduledDate: targetSp.startDate ? new Date(targetSp.startDate).toISOString().split('T')[0] : '',
      },
      {
        title: '',
        description: '',
        assignedTo: defaultAssignees[2]?._id || defaultAssignees[0]?._id || '',
        estimatedTimeDuration: 4,
        priority: 'Normal',
        sprintDay: 3,
        scheduledDate: targetSp.startDate ? new Date(targetSp.startDate).toISOString().split('T')[0] : '',
      },
    ];

    setDividedTaskRows(initialRows);
    setIsDivideModalOpen(true);
  };

  const closeDivideModal = () => {
    setIsDivideModalOpen(false);
    setTargetSprintForDivide(null);
  };

  // Divide Tasks Row Handlers
  const addDivideRow = () => {
    const nextDay = Math.min(14, dividedTaskRows.length + 1);
    setDividedTaskRows((prev) => [
      ...prev,
      {
        title: '',
        description: '',
        assignedTo: users[prev.length % users.length]?._id || '',
        estimatedTimeDuration: 4,
        priority: 'Normal',
        sprintDay: nextDay,
        scheduledDate: targetSprintForDivide?.startDate
          ? new Date(targetSprintForDivide.startDate).toISOString().split('T')[0]
          : '',
      },
    ]);
  };

  const removeDivideRow = (index) => {
    setDividedTaskRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDivideRow = (index, field, value) => {
    setDividedTaskRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Quick Round-Robin Auto-Distribute
  const handleAutoDistributeUsers = () => {
    if (!users || users.length === 0) return toast.error('No team members found');
    const sprintMembers = targetSprintForDivide?.members && targetSprintForDivide.members.length > 0
      ? targetSprintForDivide.members
      : users;

    setDividedTaskRows((prev) =>
      prev.map((row, idx) => ({
        ...row,
        assignedTo: sprintMembers[idx % sprintMembers.length]?._id || row.assignedTo,
      }))
    );
    toast.success('Tasks distributed evenly across team members!');
  };

  const handleDivideSubmit = (e) => {
    e.preventDefault();
    if (!targetSprintForDivide) return;

    // Filter valid task rows with a title and default description to title if blank
    const validRows = dividedTaskRows
      .filter((r) => r.title.trim())
      .map((r) => ({
        ...r,
        title: r.title.trim(),
        description: r.description?.trim() || r.title.trim(),
      }));

    if (validRows.length === 0) {
      return toast.error('Please enter at least one task title to divide');
    }

    const unassignedRow = validRows.find((r) => !r.assignedTo);
    if (unassignedRow) {
      return toast.error('Please select an assigned user for every task');
    }

    batchDivideMutation.mutate({
      sprintId: targetSprintForDivide._id,
      tasks: validRows,
    });
  };

  // Member toggle for Sprint creation/edit
  const toggleSprintMember = (userId) => {
    setSprintForm((prev) => {
      const current = prev.members || [];
      if (current.includes(userId)) {
        return { ...prev, members: current.filter((id) => id !== userId) };
      }
      return { ...prev, members: [...current, userId] };
    });
  };

  const handleSprintSubmit = (e) => {
    e.preventDefault();
    if (!sprintForm.project) return toast.error('Please select a project');
    if (!sprintForm.name.trim()) return toast.error('Sprint name is required');
    if (!sprintForm.startDate || !sprintForm.endDate) {
      return toast.error('Start and end dates are required');
    }
    if (new Date(sprintForm.endDate) < new Date(sprintForm.startDate)) {
      return toast.error('End date cannot be earlier than start date');
    }

    if (editingSprint) {
      updateSprintMutation.mutate({ id: editingSprint._id, payload: sprintForm });
    } else {
      createSprintMutation.mutate(sprintForm);
    }
  };

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    if (!targetSprintForTask) return;
    if (!taskForm.title.trim()) return toast.error('Task title is required');
    if (!taskForm.assignedTo) return toast.error('Please assign a team member');

    createTaskMutation.mutate({
      sprintId: targetSprintForTask._id,
      payload: {
        ...taskForm,
        estimatedTimeDuration: Number(taskForm.estimatedTimeDuration) || 0,
        sprintDay: taskForm.sprintDay ? Number(taskForm.sprintDay) : null,
      },
    });
  };

  const toggleExpandSprint = (id) => {
    setExpandedSprintIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ===================== PAGE HEADER ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Sprint Planner & Project Timeline
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <HiOutlineRocketLaunch className="w-3.5 h-3.5" />
              Agile Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Plan sprints, assign team members, divide tasks across users, and track project duration timelines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              refetchSprints();
              refetchUsers();
            }}
            disabled={isRefetching}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
            title="Refresh Sprints & Team"
          >
            <HiOutlineArrowPath
              className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`}
            />
          </button>

          {/* Quick Divide Tasks Button */}
          <button
            onClick={() => openDivideTasksModal(sprints[0])}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-indigo-300 hover:bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Divide multiple project tasks among team members"
          >
            <HiOutlineArrowsRightLeft className="w-4 h-4 text-indigo-600" />
            <span>Divide & Assign Tasks</span>
          </button>

          <button
            onClick={openCreateSprintModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span>New Sprint</span>
          </button>
        </div>
      </div>

      {/* ===================== PROJECT SELECTOR & VIEW TABS ===================== */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Project Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
            <HiOutlineFolder className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-700">Project:</span>
          </div>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 font-medium focus:bg-white focus:outline-hidden focus:border-indigo-500 cursor-pointer min-w-[200px]"
          >
            <option value="All">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* View Switcher Tabs */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 shadow-2xs flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('sprints')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'sprints'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HiOutlineViewColumns className="w-4 h-4" />
            <span>Sprint Board</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HiOutlineCalendarDays className="w-4 h-4" />
            <span>Daily Task Planner</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HiOutlineArrowTrendingUp className="w-4 h-4" />
            <span>Project Timeline & Gantt</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'team'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HiOutlineUsers className="w-4 h-4" />
            <span>Team Workload ({users.length})</span>
          </button>
        </div>
      </div>

      {/* ===================== OVERALL PROJECT DURATION BANNER ===================== */}
      {timelineData && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                  Total Project Duration & Timeline
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    timelineData.durationMetrics?.healthStatus === 'Ahead of Schedule'
                      ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700'
                      : timelineData.durationMetrics?.healthStatus === 'On Track'
                      ? 'bg-blue-900/50 text-blue-300 border-blue-700'
                      : timelineData.durationMetrics?.healthStatus === 'Completed'
                      ? 'bg-purple-900/50 text-purple-300 border-purple-700'
                      : 'bg-rose-900/50 text-rose-300 border-rose-700'
                  }`}
                >
                  {timelineData.durationMetrics?.healthStatus}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold mt-1 text-white">
                {timelineData.project?.name}
              </h2>

              <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-2 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <HiOutlineCalendarDays className="w-4 h-4 text-indigo-400" />
                  <span>
                    {timelineData.durationMetrics?.projectStartDate
                      ? new Date(timelineData.durationMetrics.projectStartDate).toLocaleDateString(
                          'en-IN',
                          { day: 'numeric', month: 'short', year: 'numeric' }
                        )
                      : 'Not set'}
                    {' → '}
                    {timelineData.durationMetrics?.projectEndDate
                      ? new Date(timelineData.durationMetrics.projectEndDate).toLocaleDateString(
                          'en-IN',
                          { day: 'numeric', month: 'short', year: 'numeric' }
                        )
                      : 'Not set'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <HiOutlineClock className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white">
                    {timelineData.durationMetrics?.totalProjectDurationDays || 0} Total Days Duration
                  </span>
                  <span className="text-slate-400">
                    ({timelineData.durationMetrics?.daysElapsed || 0} elapsed,{' '}
                    {timelineData.durationMetrics?.daysRemaining || 0} left)
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Progress Bar & KPI Cards */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 min-w-[280px]">
              <div className="flex-1 bg-white/10 rounded-lg p-3 border border-white/10">
                <div className="flex items-center justify-between text-xs text-slate-200 mb-1">
                  <span>Task Completion</span>
                  <span className="font-bold text-white">
                    {timelineData.durationMetrics?.overallProgressPercent || 0}%
                  </span>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                    style={{
                      width: `${timelineData.durationMetrics?.overallProgressPercent || 0}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>
                    {timelineData.taskMetrics?.completedTasks || 0} of{' '}
                    {timelineData.taskMetrics?.totalTasks || 0} Tasks Done
                  </span>
                  <span>
                    {timelineData.sprintMetrics?.completedSprintsCount || 0}/
                    {timelineData.sprintMetrics?.totalSprints || 0} Sprints
                  </span>
                </div>
              </div>

              <div className="bg-white/10 rounded-lg p-3 border border-white/10 text-center min-w-[110px]">
                <span className="text-[10px] uppercase tracking-wider text-slate-300 block">
                  Work Hours
                </span>
                <span className="text-base sm:text-lg font-bold text-white mt-0.5 block">
                  {timelineData.taskMetrics?.completedHours || 0}/
                  {timelineData.taskMetrics?.totalEstimatedHours || 0} hrs
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 1: SPRINTS BOARD VIEW
          ========================================================================= */}
      {activeTab === 'sprints' && (
        <div className="space-y-4">
          {/* Sprints Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search sprints by title, goal, or project..."
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <HiOutlineXMark className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:bg-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
              >
                <option value="All">All ({sprints.length})</option>
                <option value="Active">Active</option>
                <option value="Planned">Planned</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Sprints Grid / Cards */}
          {isSprintsLoading ? (
            <div className="flex justify-center items-center py-20 min-h-[300px]">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredSprints.length === 0 ? (
            <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <HiOutlineRocketLaunch className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Sprints Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Create a sprint, assign team members, and divide project tasks across users.
              </p>
              <button
                onClick={openCreateSprintModal}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <HiOutlinePlus className="w-4 h-4" />
                <span>Create First Sprint</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSprints.map((sprint) => {
                const conf = SPRINT_STATUS_CONFIG[sprint.status] || SPRINT_STATUS_CONFIG.Planned;
                const isExpanded = !!expandedSprintIds[sprint._id];
                const sprintMembers = sprint.members || [];

                return (
                  <div
                    key={sprint._id}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:border-slate-300 transition-all"
                  >
                    {/* Sprint Header Row */}
                    <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${conf.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                            {sprint.status}
                          </span>

                          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {sprint.project?.name || 'Project'}
                          </span>

                          <span className="text-xs font-bold text-indigo-600">
                            Sprint #{sprint.sprintNumber || 1}
                          </span>

                          {sprint.isOverdue && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <HiOutlineExclamationTriangle className="w-3 h-3" />
                              Past Due
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                          {sprint.name}
                        </h3>

                        {sprint.goal && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">
                            Goal: &quot;{sprint.goal}&quot;
                          </p>
                        )}

                        {/* Assigned Team Members Avatars / Badges */}
                        <div className="mt-2.5 flex items-center gap-2 text-xs">
                          <span className="text-[11px] font-semibold text-slate-500">
                            Assigned Team ({sprintMembers.length}):
                          </span>
                          {sprintMembers.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic">
                              No team members assigned yet
                            </span>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {sprintMembers.slice(0, 4).map((m) => (
                                <span
                                  key={m._id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-800 border border-indigo-200"
                                  title={`${m.name} (${m.role || m.designation || 'Staff'})`}
                                >
                                  <span className="w-3.5 h-3.5 rounded-full bg-indigo-200 text-indigo-700 text-[9px] font-bold flex items-center justify-center">
                                    {m.name.charAt(0).toUpperCase()}
                                  </span>
                                  <span>{m.name}</span>
                                </span>
                              ))}
                              {sprintMembers.length > 4 && (
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                                  +{sprintMembers.length - 4} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Timeline & Duration Badges */}
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-600 shrink-0">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">
                            Timeline
                          </span>
                          <span className="font-semibold text-slate-800">
                            {new Date(sprint.startDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}{' '}
                            →{' '}
                            {new Date(sprint.endDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-center">
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">
                            Duration
                          </span>
                          <span className="font-bold text-slate-900">
                            {sprint.totalDays || sprint.totalDurationDays} Days
                          </span>
                        </div>

                        {/* Progress Bar Mini */}
                        <div className="min-w-[120px]">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-medium text-slate-600">
                              {sprint.completedTasks}/{sprint.totalTasks} Tasks
                            </span>
                            <span className="font-bold text-indigo-700">
                              {sprint.progressPercentage}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full transition-all"
                              style={{ width: `${sprint.progressPercentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                          <button
                            type="button"
                            onClick={() => openDivideTasksModal(sprint)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer"
                            title="Divide multiple tasks across users for this sprint"
                          >
                            <HiOutlineArrowsRightLeft className="w-3.5 h-3.5" />
                            <span>Divide Tasks</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openCreateTaskModal(sprint)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Add Single Task"
                          >
                            <HiOutlinePlus className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditSprintModal(sprint)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Sprint & Members"
                          >
                            <HiOutlinePencilSquare className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setSprintToDelete(sprint)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Sprint"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleExpandSprint(sprint._id)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title={isExpanded ? 'Collapse Tasks' : 'Expand Tasks'}
                          >
                            {isExpanded ? (
                              <HiOutlineChevronDown className="w-4 h-4" />
                            ) : (
                              <HiOutlineChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Tasks Backlog & Member Workload inside Sprint */}
                    {isExpanded && (
                      <SprintTasksSection
                        sprintId={sprint._id}
                        onAddTask={() => openCreateTaskModal(sprint)}
                        onDivideTasks={() => openDivideTasksModal(sprint)}
                        onUpdateTask={(taskId, payload) =>
                          updateTaskMutation.mutate({ taskId, payload })
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: DAILY TASK ASSIGNMENT & PLANNER
          ========================================================================= */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {/* Daily Schedule Sprint Selector */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Sprint Focus:</span>
              <select
                value={activeDailySprintId || ''}
                onChange={(e) => setSelectedSprintId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 font-semibold focus:bg-white focus:outline-hidden focus:border-indigo-500 cursor-pointer min-w-[240px]"
              >
                {sprints.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.status} — {s.totalDays || s.totalDurationDays} Days)
                  </option>
                ))}
              </select>
            </div>

            {dailyScheduleData?.sprint && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  Timeline:{' '}
                  <span className="font-semibold text-slate-800">
                    {new Date(dailyScheduleData.sprint.startDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    to{' '}
                    {new Date(dailyScheduleData.sprint.endDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() =>
                    openDivideTasksModal(
                      sprints.find((s) => s._id === activeDailySprintId)
                    )
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors"
                >
                  <HiOutlineArrowsRightLeft className="w-3.5 h-3.5" />
                  <span>Divide Daily Tasks</span>
                </button>
              </div>
            )}
          </div>

          {/* Today's High Priority Daily Focus */}
          {dailyScheduleData?.todayTasks && dailyScheduleData.todayTasks.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Today&apos;s Scheduled Tasks ({dailyScheduleData.todayTasks.length})
                  </h4>
                </div>
                <span className="text-[11px] text-amber-700 font-semibold">
                  Due Today: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {dailyScheduleData.todayTasks.map((t) => (
                  <div
                    key={t._id}
                    className="bg-white border border-amber-200 rounded-lg p-3 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 line-clamp-1">
                          {t.title}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                            TASK_STATUS_COLORS[t.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                        <HiOutlineUser className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{t.assignedTo?.name || 'Unassigned'}</span>
                        <span className="text-slate-300">•</span>
                        <span>{t.estimatedTimeDuration || 0} hrs</span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <select
                        value={t.status}
                        onChange={(e) =>
                          updateTaskMutation.mutate({
                            taskId: t._id,
                            payload: { status: e.target.value },
                          })
                        }
                        className="text-[10px] font-semibold bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 cursor-pointer"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                      </select>

                      {t.status === 'Completed' ? (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                          <HiOutlineCheck className="w-3 h-3" /> Done
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            updateTaskMutation.mutate({
                              taskId: t._id,
                              payload: { status: 'Completed' },
                            })
                          }
                          className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          Mark Done
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Day-by-Day Timeline Planner Lanes */}
          {isDailyLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !dailyScheduleData?.dayByDay || dailyScheduleData.dayByDay.length === 0 ? (
            <div className="p-10 text-center bg-white border border-slate-200 rounded-xl text-slate-400">
              No days timeline configured for this sprint.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Sprint Daily Task Timeline Lanes (Day 1 to Day{' '}
                    {dailyScheduleData.dayByDay.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Track daily task allocations, scheduled execution dates, and team member workload per day.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {dailyScheduleData.dayByDay.map((day) => {
                  const isToday =
                    new Date(day.date).toISOString().split('T')[0] ===
                    new Date().toISOString().split('T')[0];

                  return (
                    <div
                      key={day.dayNumber}
                      className={`rounded-xl border p-3 transition-colors ${
                        isToday
                          ? 'bg-indigo-50/40 border-indigo-300'
                          : 'bg-slate-50/60 border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isToday ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {day.dayNumber}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-slate-900">
                              Day {day.dayNumber} —{' '}
                              {new Date(day.date).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                            {isToday && (
                              <span className="ml-2 text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                                TODAY
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>
                            {day.completedTasks}/{day.totalTasks} Done
                          </span>
                          <span className="font-semibold text-slate-700">
                            {day.totalHours} Estimated Hrs
                          </span>
                        </div>
                      </div>

                      {/* Tasks on this Day */}
                      {day.tasks.length === 0 ? (
                        <div className="py-2 px-3 text-[11px] text-slate-400 italic">
                          No tasks scheduled for Day {day.dayNumber}.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {day.tasks.map((t) => (
                            <div
                              key={t._id}
                              className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-2xs hover:border-indigo-300 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-1.5">
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {t.title}
                                </span>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                                    TASK_STATUS_COLORS[t.status] || 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {t.status}
                                </span>
                              </div>

                              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                                <span className="font-medium text-slate-700 truncate">
                                  {t.assignedTo?.name || 'Unassigned'}
                                </span>
                                <span className="font-semibold text-slate-700">
                                  {t.estimatedTimeDuration || 0}h
                                </span>
                              </div>

                              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                                <select
                                  value={t.status}
                                  onChange={(e) =>
                                    updateTaskMutation.mutate({
                                      taskId: t._id,
                                      payload: { status: e.target.value },
                                    })
                                  }
                                  className="text-[10px] font-semibold bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 cursor-pointer"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Completed">Completed</option>
                                  <option value="On Hold">On Hold</option>
                                </select>

                                {t.status === 'Completed' ? (
                                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                                    <HiOutlineCheck className="w-3 h-3" /> Done
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateTaskMutation.mutate({
                                        taskId: t._id,
                                        payload: { status: 'Completed' },
                                      })
                                    }
                                    className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
                                  >
                                    Mark Done
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: VISUAL PROJECT TIMELINE & GANTT ROADMAP
          ========================================================================= */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          {isTimelineLoading ? (
            <div className="flex justify-center items-center py-20 min-h-[300px]">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !timelineData || !timelineData.timelineItems || timelineData.timelineItems.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
              <HiOutlineChartBar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-900">No Timeline Data</h3>
              <p className="text-xs text-slate-500 mt-1">
                Create sprints for this project to visualize duration timelines and completion roadmaps.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-6">
              {/* Gantt Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Visual Gantt Roadmap & Milestone Timeline
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chronological roadmap of all sprints and constituent task delivery deadlines.
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500" />
                    <span className="text-slate-600">Active</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-blue-500" />
                    <span className="text-slate-600">Planned</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-purple-500" />
                    <span className="text-slate-600">Completed</span>
                  </span>
                </div>
              </div>

              {/* Gantt Bars Stack */}
              <div className="space-y-5">
                {timelineData.timelineItems.map((item) => {
                  const startStr = new Date(item.startDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  });
                  const endStr = new Date(item.endDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={item.id}
                      className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3"
                    >
                      {/* Sprint Bar Meta */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            Sprint #{item.sprintNumber}
                          </span>
                          <span className="text-sm font-bold text-slate-900">{item.name}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              SPRINT_STATUS_CONFIG[item.status]?.bg ||
                              'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-600">
                          <span>
                            {startStr} → {endStr}
                          </span>
                          <span className="font-bold text-slate-900">
                            {item.durationDays} Days Duration
                          </span>
                          <span className="font-semibold text-indigo-700">
                            {item.completedCount}/{item.tasksCount} Tasks Done ({item.progress}%)
                          </span>
                        </div>
                      </div>

                      {/* Visual Horizontal Timeline Bar */}
                      <div>
                        <div className="w-full h-4 bg-slate-200/80 rounded-md overflow-hidden relative shadow-inner">
                          <div
                            className={`h-full transition-all duration-300 rounded-md ${
                              item.status === 'Completed'
                                ? 'bg-purple-600'
                                : item.status === 'Active'
                                ? 'bg-emerald-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.max(5, item.progress)}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-800 drop-shadow-xs">
                            {item.progress}% Completed
                          </span>
                        </div>
                      </div>

                      {/* Task Breakdown list inside sprint */}
                      {item.tasks && item.tasks.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60">
                          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                            Task Timeline Breakdown ({item.tasks.length} Tasks)
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {item.tasks.map((task) => (
                              <div
                                key={task.id}
                                className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs shadow-2xs"
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <span className="font-semibold text-slate-900 truncate">
                                    {task.title}
                                  </span>
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                                      TASK_STATUS_COLORS[task.status] ||
                                      'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {task.status}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                                  <span>{task.assignedTo}</span>
                                  <span>{task.estimatedHours} hrs</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: TEAM WORKLOAD & USER ALLOCATION CAPACITY
          ========================================================================= */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Company Team Workload & Task Distribution ({users.length} Users)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review each team member&apos;s active tasks, allocated hours, and assign work with balanced capacity.
              </p>
            </div>
            <button
              onClick={() => openDivideTasksModal(sprints[0])}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <HiOutlineArrowsRightLeft className="w-4 h-4" />
              <span>Divide Tasks</span>
            </button>
          </div>

          {isUsersLoading ? (
            <div className="flex justify-center items-center py-20 min-h-[300px]">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-slate-400">
              No active team members found in this company workspace.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {users.map((user) => {
                const activeTasksCount = user.activeTasksCount || 0;
                const allocatedHours = user.allocatedHours || 0;

                return (
                  <div
                    key={user._id}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-indigo-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0 border border-indigo-200">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{user.name}</h4>
                          <span className="text-[11px] text-slate-500 truncate block">
                            {user.email}
                          </span>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {user.role || user.designation || 'Staff'}
                          </span>
                        </div>
                      </div>

                      {/* Workload Metrics */}
                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                          <span className="text-[10px] text-slate-400 uppercase font-medium block">
                            Active Tasks
                          </span>
                          <span className="text-sm font-bold text-slate-800 block mt-0.5">
                            {activeTasksCount}
                          </span>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                          <span className="text-[10px] text-slate-400 uppercase font-medium block">
                            Allocated Time
                          </span>
                          <span className="text-sm font-bold text-indigo-600 block mt-0.5">
                            {allocatedHours} hrs
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {allocatedHours > 30 ? (
                          <span className="text-amber-600 font-semibold">High Load</span>
                        ) : allocatedHours > 0 ? (
                          <span className="text-emerald-600 font-semibold">Normal</span>
                        ) : (
                          <span className="text-slate-400 italic">Available</span>
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={() => openCreateTaskModal(sprints[0], user)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors cursor-pointer"
                      >
                        <HiOutlinePlus className="w-3.5 h-3.5" />
                        <span>Assign Task</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================== CREATE / EDIT SPRINT MODAL (WITH MEMBER ASSIGNMENT) ===================== */}
      {isSprintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingSprint ? 'Edit Sprint & Team Assignment' : 'Create New Sprint'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Set sprint duration, define goals, and assign responsible team members.
                </p>
              </div>
              <button
                type="button"
                onClick={closeSprintModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSprintSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={sprintForm.project}
                  onChange={(e) => setSprintForm({ ...sprintForm, project: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="">-- Select Project --</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sprint Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sprintForm.name}
                  onChange={(e) => setSprintForm({ ...sprintForm, name: e.target.value })}
                  placeholder="e.g. Sprint 1: Architecture & DB Setup"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sprint Goal / Key Deliverables
                </label>
                <textarea
                  rows="2"
                  value={sprintForm.goal}
                  onChange={(e) => setSprintForm({ ...sprintForm, goal: e.target.value })}
                  placeholder="e.g. Complete authentication, multi-tenant DB migrations, and user access roles."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={sprintForm.startDate}
                    onChange={(e) => setSprintForm({ ...sprintForm, startDate: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={sprintForm.endDate}
                    onChange={(e) => setSprintForm({ ...sprintForm, endDate: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sprint Status
                  </label>
                  <select
                    value={sprintForm.status}
                    onChange={(e) => setSprintForm({ ...sprintForm, status: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Planned">Planned</option>
                    <option value="Active">Active (In Progress)</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Work Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sprintForm.targetHours}
                    onChange={(e) => setSprintForm({ ...sprintForm, targetHours: e.target.value })}
                    placeholder="e.g. 80"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* ===================== SPRINT TEAM MEMBERS ASSIGNMENT SELECTOR ===================== */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Assign Team Members to Sprint ({sprintForm.members?.length || 0} selected)
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() =>
                        setSprintForm((prev) => ({
                          ...prev,
                          members: users.map((u) => u._id),
                        }))
                      }
                      className="text-indigo-600 hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSprintForm((prev) => ({ ...prev, members: [] }))}
                      className="text-slate-500 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {users.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
                    Loading team members...
                  </div>
                ) : (
                  <div className="max-h-44 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    {users.map((u) => {
                      const isSelected = sprintForm.members?.includes(u._id);
                      return (
                        <div
                          key={u._id}
                          onClick={() => toggleSprintMember(u._id)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                            isSelected
                              ? 'bg-indigo-50 border border-indigo-200 text-indigo-900'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                            />
                            <div className="min-w-0">
                              <span className="font-semibold block truncate">{u.name}</span>
                              <span className="text-[10px] text-slate-500 block truncate">
                                {u.role || u.designation || 'Staff'} • {u.email}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 shrink-0 ml-2">
                            {u.activeTasksCount || 0} active tasks
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes & Retrospective
                </label>
                <textarea
                  rows="2"
                  value={sprintForm.notes}
                  onChange={(e) => setSprintForm({ ...sprintForm, notes: e.target.value })}
                  placeholder="Additional context or sprint notes..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={closeSprintModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSprintMutation.isPending || updateSprintMutation.isPending}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  {createSprintMutation.isPending || updateSprintMutation.isPending
                    ? 'Saving Sprint...'
                    : editingSprint
                    ? 'Save Changes'
                    : 'Create Sprint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== DIVIDE & ASSIGN TASKS BATCH MODAL ===================== */}
      {isDivideModalOpen && targetSprintForDivide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Divide Project Tasks Across Team Members
                  </h3>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                    {targetSprintForDivide.name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Split sprint deliverables into multiple tasks, assign them to team members, and balance workload.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoDistributeUsers}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors shadow-2xs cursor-pointer"
                  title="Evenly distribute tasks round-robin among team members"
                >
                  <HiOutlineSparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Auto-Distribute Users</span>
                </button>

                <button
                  type="button"
                  onClick={closeDivideModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleDivideSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-3">
                {dividedTaskRows.map((row, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5 transition-all hover:border-indigo-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        Task #{idx + 1}
                      </span>
                      {dividedTaskRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDivideRow(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 cursor-pointer"
                          title="Remove task row"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                      {/* Task Title */}
                      <div className="md:col-span-5">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Task Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={row.title}
                          onChange={(e) => updateDivideRow(idx, 'title', e.target.value)}
                          placeholder={`e.g. Sub-task ${idx + 1} specification`}
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>

                      {/* Assigned User */}
                      <div className="md:col-span-4">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Assign To Member <span className="text-rose-500">*</span>
                        </label>
                        <select
                          required
                          value={row.assignedTo}
                          onChange={(e) => updateDivideRow(idx, 'assignedTo', e.target.value)}
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                        >
                          <option value="">-- Choose Member --</option>
                          {users.map((u) => (
                            <option key={u._id} value={u._id}>
                              {u.name} ({u.role || u.designation || 'Staff'} • {u.activeTasksCount || 0} tasks)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Estimated Duration */}
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Hours
                        </label>
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={row.estimatedTimeDuration}
                          onChange={(e) =>
                            updateDivideRow(idx, 'estimatedTimeDuration', e.target.value)
                          }
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Task Description (Optional) */}
                    <div>
                      <input
                        type="text"
                        value={row.description || ''}
                        onChange={(e) => updateDivideRow(idx, 'description', e.target.value)}
                        placeholder="Description / acceptance criteria (optional — defaults to task title)"
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>

                    {/* Secondary Row: Priority & Daily Schedule */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Sprint Day #
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={row.sprintDay}
                          onChange={(e) => updateDivideRow(idx, 'sprintDay', e.target.value)}
                          placeholder="Day 1"
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Daily Schedule Date
                        </label>
                        <input
                          type="date"
                          value={row.scheduledDate}
                          onChange={(e) => updateDivideRow(idx, 'scheduledDate', e.target.value)}
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Priority
                        </label>
                        <select
                          value={row.priority}
                          onChange={(e) => updateDivideRow(idx, 'priority', e.target.value)}
                          className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-hidden focus:border-indigo-500"
                        >
                          <option value="Normal">Normal</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Task Row Button */}
              <button
                type="button"
                onClick={addDivideRow}
                className="w-full py-2.5 rounded-xl border border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50/50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <HiOutlinePlus className="w-4 h-4" />
                <span>+ Add Another Task to Divide</span>
              </button>

              {/* Summary Stats */}
              <div className="bg-slate-100 rounded-lg p-3 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
                <span>
                  Total Divided Tasks:{' '}
                  <span className="font-bold text-slate-900">{dividedTaskRows.length}</span>
                </span>
                <span>
                  Total Planned Workload:{' '}
                  <span className="font-bold text-indigo-700">
                    {dividedTaskRows.reduce(
                      (acc, r) => acc + (Number(r.estimatedTimeDuration) || 0),
                      0
                    )}{' '}
                    Hours
                  </span>
                </span>
                <span>
                  Team Members Involved:{' '}
                  <span className="font-bold text-slate-900">
                    {new Set(dividedTaskRows.map((r) => r.assignedTo).filter(Boolean)).size}
                  </span>
                </span>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={closeDivideModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={batchDivideMutation.isPending}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <HiOutlineArrowsRightLeft className="w-4 h-4" />
                  <span>
                    {batchDivideMutation.isPending
                      ? 'Dividing & Assigning...'
                      : `Divide & Assign ${dividedTaskRows.length} Tasks`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== CREATE SINGLE SPRINT TASK MODAL ===================== */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Assign Task to {targetSprintForTask?.name || 'Sprint'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Set daily assignment timeline, estimated hours, and responsible team member.
                </p>
              </div>
              <button
                type="button"
                onClick={closeTaskModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleTaskSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Build JWT auth token refresh and cookie persistence"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Description
                </label>
                <textarea
                  rows="2"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Details of deliverables, endpoints, or acceptance criteria..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign To <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="">-- Select Member --</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.role || u.designation || 'Staff'} • {u.activeTasksCount || 0} tasks)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimated Duration (Hours)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={taskForm.estimatedTimeDuration}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, estimatedTimeDuration: e.target.value })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Daily Schedule Date
                  </label>
                  <input
                    type="date"
                    value={taskForm.scheduledDate}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, scheduledDate: e.target.value })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sprint Day # (e.g. 1 to 14)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={taskForm.sprintDay}
                    onChange={(e) => setTaskForm({ ...taskForm, sprintDay: e.target.value })}
                    placeholder="e.g. 1"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={taskForm.startDate}
                    onChange={(e) => setTaskForm({ ...taskForm, startDate: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deadline / Due Date
                  </label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeTaskModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  {createTaskMutation.isPending ? 'Assigning Task...' : 'Assign to Sprint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRMATION MODAL ===================== */}
      {sprintToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 text-center">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <HiOutlineTrash className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Delete Sprint?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to remove{' '}
              <span className="font-semibold text-slate-800">{sprintToDelete.name}</span>? Existing
              tasks will be safely unlinked from this sprint without being deleted.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setSprintToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteSprintMutation.mutate(sprintToDelete._id)}
                disabled={deleteSprintMutation.isPending}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                {deleteSprintMutation.isPending ? 'Deleting...' : 'Delete Sprint'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===================== EXPANDABLE SPRINT TASKS COMPONENT (WITH TEAM WORKLOAD) =====================
const SprintTasksSection = ({ sprintId, onAddTask, onDivideTasks, onUpdateTask }) => {
  const { data: sprintDetails, isLoading } = useQuery({
    queryKey: ['sprintTasksDetails', sprintId],
    queryFn: async () => {
      const { data } = await api.get(`/sprints/${sprintId}`);
      return data;
    },
  });

  const tasks = sprintDetails?.tasks || [];
  const membersWorkload = sprintDetails?.membersWorkload || [];

  if (isLoading) {
    return (
      <div className="p-6 text-center text-xs text-slate-400 bg-slate-50/50">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-1" />
        Loading sprint backlog tasks...
      </div>
    );
  }

  return (
    <div className="bg-slate-50/60 p-4 border-t border-slate-100 space-y-4">
      {/* Team Member Workload Strip for this Sprint */}
      {membersWorkload.length > 0 && (
        <div className="bg-white rounded-xl p-3 border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
            Sprint Team Members Workload & Division
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {membersWorkload.map((mw, i) => (
              <div
                key={i}
                className="p-2 bg-slate-50 rounded-lg border border-slate-200/80 text-center text-xs"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center mx-auto mb-1">
                  {(mw.member?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="font-bold text-slate-800 block truncate">
                  {mw.member?.name || 'Member'}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {mw.tasksCount} Tasks ({mw.totalHours} hrs)
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 block mt-0.5">
                  {mw.completedCount}/{mw.tasksCount} Done
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Backlog Table Header & Actions */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Sprint Backlog ({tasks.length} Assigned Tasks)
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDivideTasks}
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer"
          >
            <HiOutlineArrowsRightLeft className="w-3.5 h-3.5" />
            <span>Divide Tasks</span>
          </button>
          <button
            type="button"
            onClick={onAddTask}
            className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer"
          >
            <HiOutlinePlus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="p-6 text-center rounded-lg border border-dashed border-slate-200 bg-white/60">
          <p className="text-xs text-slate-400">No tasks assigned to this sprint yet.</p>
          <button
            type="button"
            onClick={onDivideTasks}
            className="mt-2 text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
          >
            Divide & assign tasks among users now →
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs bg-white rounded-lg border border-slate-200 overflow-hidden">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Task Title</th>
                <th className="py-2.5 px-3">Assigned Team Member</th>
                <th className="py-2.5 px-3">Daily Schedule</th>
                <th className="py-2.5 px-3">Deadline</th>
                <th className="py-2.5 px-3">Est. Duration</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {tasks.map((task) => (
                <tr key={task._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-[200px] truncate">
                    {task.title}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0 border border-indigo-200">
                        {(task.assignedTo?.name || 'U').charAt(0).toUpperCase()}
                      </span>
                      <span className="truncate">{task.assignedTo?.name || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {task.scheduledDate
                      ? new Date(task.scheduledDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : task.sprintDay
                      ? `Day ${task.sprintDay}`
                      : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : '—'}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    {task.estimatedTimeDuration || 0} hrs
                  </td>
                  <td className="py-2.5 px-3">
                    <select
                      value={task.status}
                      onChange={(e) => onUpdateTask(task._id, { status: e.target.value })}
                      className="text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-700 font-medium cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {task.status !== 'Completed' ? (
                      <button
                        type="button"
                        onClick={() => onUpdateTask(task._id, { status: 'Completed' })}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        Complete
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                        <HiOutlineCheck className="w-3.5 h-3.5" /> Done
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SprintsManager;
