import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlinePaperClip,
  HiOutlineXMark,
  HiOutlineClipboardDocumentList,
} from 'react-icons/hi2';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';

const getStatusStyle = (status) => {
  if (status === 'Completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'In Progress') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  if (status === 'On Hold') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

const getPriorityStyle = (priority) => {
  if (priority === 'High') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (priority === 'Medium') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-blue-50 text-blue-700 border-blue-200';
};

const HRTasks = () => {
  const [filterTeamHead, setFilterTeamHead] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterUser, setFilterUser] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return data;
    },
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });

  const departments = useMemo(() => {
    const deps = new Set(users.map((u) => u.department).filter(Boolean));
    return Array.from(deps);
  }, [users]);

  const teamHeads = useMemo(() => users.filter((u) => u.role === 'Team Head'), [users]);

  const allEmployees = useMemo(
    () => users.filter((u) => u.role === 'User' || u.role === 'Team Head'),
    [users]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const assignedUser = users.find((u) => u._id === task.assignedTo?._id);

      const matchStatus = filterStatus === 'All' || task.status === filterStatus;
      const matchPriority = filterPriority === 'All' || task.priority === filterPriority;
      const matchUser = filterUser === 'All' || task.assignedTo?._id === filterUser;

      let matchDepartment = true;
      let matchTeamHead = true;
      let matchSearch = true;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = task.title?.toLowerCase().includes(query);
        const assigneeMatch = task.assignedTo?.name?.toLowerCase().includes(query);
        const assignerMatch = task.assignedBy?.name?.toLowerCase().includes(query);
        matchSearch = titleMatch || assigneeMatch || assignerMatch;
      }

      if (assignedUser) {
        if (filterDepartment !== 'All' && assignedUser.department !== filterDepartment)
          matchDepartment = false;

        if (filterTeamHead !== 'All') {
          if (assignedUser.role === 'Team Head' && assignedUser._id !== filterTeamHead)
            matchTeamHead = false;
          else if (
            assignedUser.role === 'User' &&
            assignedUser.teamHead?._id !== filterTeamHead &&
            assignedUser.teamHead !== filterTeamHead
          )
            matchTeamHead = false;
        }
      }

      return matchStatus && matchPriority && matchUser && matchDepartment && matchTeamHead && matchSearch;
    });
  }, [
    tasks,
    users,
    filterStatus,
    filterPriority,
    filterUser,
    filterDepartment,
    filterTeamHead,
    searchQuery,
  ]);

  const openDetails = (task) => {
    setSelectedTask(task);
    setIsDetailsModalOpen(true);
  };

  const calculateDelay = (dueDate) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    if (due >= now) return null;

    const diffHours = Math.floor((now - due) / (1000 * 60 * 60));
    if (diffHours >= 24) {
      return `${Math.floor(diffHours / 24)} days`;
    }
    return `${diffHours} hours`;
  };

  // Reusable classes
  const selectBase =
    'w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors cursor-pointer';
  const labelBase =
    'block text-[10px] sm:text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5';

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ===================== PAGE HEADER ===================== */}
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Daily Task Monitoring
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Track and monitor tasks across the entire organization.
        </p>
      </div>

      {/* ===================== FILTERS ===================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5 shadow-sm space-y-3 sm:space-y-4">
        {/* Search */}
        <div className="w-full sm:max-w-md">
          <label className={labelBase}>Search Tasks</label>
          <div className="relative">
            <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by task name, user, employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${selectBase} pl-9`}
            />
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 pt-3 sm:pt-4 border-t border-slate-100">
          <div>
            <label className={labelBase}>Team Head</label>
            <select
              value={filterTeamHead}
              onChange={(e) => setFilterTeamHead(e.target.value)}
              className={selectBase}
            >
              <option value="All">All Team Heads</option>
              {teamHeads.map((th) => (
                <option key={th._id} value={th._id}>
                  {th.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelBase}>Department</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className={selectBase}
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={labelBase}>Employee</label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className={selectBase}
            >
              <option value="All">All Employees</option>
              {allEmployees.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelBase}>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={selectBase}
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div>
            <label className={labelBase}>Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className={selectBase}
            >
              <option value="All">All</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Normal">Normal</option>
            </select>
          </div>
        </div>
      </div>

      {/* ===================== TASK LIST ===================== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Header bar with count */}
        {!isLoadingTasks && !isLoadingUsers && filteredTasks.length > 0 && (
          <div className="px-4 sm:px-6 py-3 border-b border-slate-200 flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HiOutlineClipboardDocumentList className="w-4 h-4 text-indigo-600" />
              Tasks
            </h3>
            <span className="text-[11px] sm:text-xs text-slate-500">
              {filteredTasks.length} result{filteredTasks.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {isLoadingTasks || isLoadingUsers ? (
          <div className="p-12 flex justify-center">
            <div className="w-9 h-9 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <HiOutlineClipboardDocumentList className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-1">No tasks found</p>
            <p className="text-xs text-slate-500">
              Try adjusting your filters or search query.
            </p>
          </div>
        ) : (
          <>
            {/* ---------- MOBILE CARD VIEW (< md) ---------- */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredTasks.map((task) => {
                const delay = calculateDelay(task.dueDate);
                const isOverdue = delay && task.status !== 'Completed';

                return (
                  <div key={task._id} className="p-4 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-semibold text-slate-900 text-xs truncate flex-1 min-w-0">
                        {task.title}
                      </p>
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${getStatusStyle(
                          task.status
                        )}`}
                      >
                        {task.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] mb-2.5">
                      <div className="min-w-0">
                        <span className="text-slate-500 block">Assigned By</span>
                        <span className="text-slate-800 font-medium truncate block">
                          {task.assignedBy?.name || 'Unknown'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-slate-500 block">Assigned To</span>
                        <span className="text-slate-800 font-medium truncate block">
                          {task.assignedTo?.name || 'Unknown'}
                        </span>
                      </div>
                      <div className="min-w-0 col-span-2">
                        <span className="text-slate-500 block">Deadline</span>
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                            <HiOutlineClock className="w-3 h-3" />
                            Delayed: {delay}
                          </span>
                        ) : (
                          <span className="text-slate-700 text-[10px]">
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                              : 'No Deadline'}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openDetails(task)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                    >
                      <HiOutlineEye className="w-3.5 h-3.5" />
                      View Details
                    </button>
                  </div>
                );
              })}
            </div>

            {/* ---------- DESKTOP TABLE (md+) ---------- */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 min-w-[900px]">
                <thead className="bg-slate-50 text-slate-700 text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 lg:px-6 py-3.5 font-semibold whitespace-nowrap">Task Name</th>
                    <th className="px-4 lg:px-6 py-3.5 font-semibold whitespace-nowrap">Assigned By</th>
                    <th className="px-4 lg:px-6 py-3.5 font-semibold whitespace-nowrap">Assigned To</th>
                    <th className="px-4 lg:px-6 py-3.5 font-semibold whitespace-nowrap">Status</th>
                    <th className="px-4 lg:px-6 py-3.5 font-semibold whitespace-nowrap">Delay / Due</th>
                    <th className="px-4 lg:px-6 py-3.5 font-semibold text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((task) => {
                    const delay = calculateDelay(task.dueDate);
                    const isOverdue = delay && task.status !== 'Completed';

                    return (
                      <tr key={task._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 lg:px-6 py-3.5">
                          <span
                            className="font-semibold text-slate-900 text-xs truncate max-w-[220px] block"
                            title={task.title}
                          >
                            {task.title}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-3.5">
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-slate-900 text-xs truncate max-w-[140px]">
                              {task.assignedBy?.name || 'Unknown'}
                            </span>
                            <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                              {task.assignedBy?.role || 'User'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-3.5">
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-slate-900 text-xs truncate max-w-[140px]">
                              {task.assignedTo?.name || 'Unknown'}
                            </span>
                            <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                              {task.assignedTo?.role || 'Employee'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-3.5">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${getStatusStyle(
                              task.status
                            )}`}
                          >
                            {task.status}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-3.5 whitespace-nowrap">
                          {isOverdue ? (
                            <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                              <HiOutlineClock className="w-3 h-3" />
                              Delayed: {delay}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                                : 'No Deadline'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 lg:px-6 py-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openDetails(task)}
                            className="inline-flex items-center gap-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <HiOutlineEye className="w-3.5 h-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ===================== TASK DETAILS MODAL (Read-Only) ===================== */}
      {isDetailsModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setIsDetailsModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative bg-white sm:rounded-2xl rounded-t-2xl border-0 sm:border border-slate-200 shadow-2xl w-full sm:max-w-4xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-lg font-bold text-slate-900 truncate">
                  {selectedTask.title}
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">
                  Read-only view for HR Monitoring
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-1.5 -mr-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer shrink-0"
                aria-label="Close"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">

              {/* ---------- Left Column ---------- */}
              <div className="md:col-span-2 space-y-4 sm:space-y-6 min-w-0">
                <div>
                  <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Description
                  </h4>
                  <div className="bg-slate-50 border border-slate-200 p-3 sm:p-4 rounded-xl text-xs sm:text-sm text-slate-800 whitespace-pre-wrap break-words leading-relaxed">
                    {selectedTask.description || '—'}
                  </div>
                </div>

                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <div>
                    <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Attachments
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.attachments.map((file, i) => (
                        <a
                          key={i}
                          href={`${API_BASE_URL}${file}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-colors"
                        >
                          <HiOutlinePaperClip className="w-3.5 h-3.5 shrink-0" />
                          Attachment {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-200 pb-2">
                    Comments & Progress Updates ({selectedTask.comments?.length || 0})
                  </h4>
                  <div className="space-y-2 sm:space-y-3 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300">
                    {selectedTask.comments && selectedTask.comments.length > 0 ? (
                      selectedTask.comments.map((comment, i) => (
                        <div key={i} className="bg-white p-3 rounded-xl border border-slate-200">
                          <div className="flex justify-between items-start gap-2 mb-1.5">
                            <span className="font-semibold text-indigo-700 text-[11px] sm:text-xs truncate">
                              {comment.user?.name || 'User'}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(comment.createdAt).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-slate-700 text-[11px] sm:text-xs leading-relaxed break-words">
                            {comment.text}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 italic text-xs">No comments yet.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-200 pb-2">
                    Daily Reports
                  </h4>
                  <div className="space-y-2 sm:space-y-3 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300">
                    {selectedTask.reports && selectedTask.reports.length > 0 ? (
                      selectedTask.reports.map((report, i) => (
                        <div
                          key={i}
                          className="bg-white p-3 rounded-xl border border-slate-200 border-l-4 border-l-emerald-500"
                        >
                          <div className="flex justify-between items-start gap-2 mb-1.5">
                            <span className="font-semibold text-emerald-700 text-[11px] sm:text-xs truncate">
                              {report.user?.name || 'User'}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(report.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <p className="text-slate-700 text-[11px] sm:text-xs whitespace-pre-wrap leading-relaxed break-words">
                            {report.description}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 italic text-xs">No daily reports submitted yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ---------- Right Column ---------- */}
              <div className="space-y-4 sm:space-y-6 min-w-0">
                <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 space-y-3.5">
                  <div>
                    <span className="block text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Status
                    </span>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border whitespace-nowrap ${getStatusStyle(
                        selectedTask.status
                      )}`}
                    >
                      {selectedTask.status}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Assigned To
                    </span>
                    <span className="text-slate-900 text-xs sm:text-sm font-semibold block mt-0.5 truncate">
                      {selectedTask.assignedTo?.name || '—'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Assigned By
                    </span>
                    <span className="text-slate-900 text-xs sm:text-sm font-semibold block mt-0.5 truncate">
                      {selectedTask.assignedBy?.name || '—'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Priority
                    </span>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border whitespace-nowrap ${getPriorityStyle(
                        selectedTask.priority
                      )}`}
                    >
                      {selectedTask.priority}
                    </span>
                  </div>

                  {selectedTask.startDate && (
                    <div>
                      <span className="block text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Start Date
                      </span>
                      <span className="text-slate-800 text-[11px] sm:text-xs font-medium block mt-0.5">
                        {new Date(selectedTask.startDate).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                  {selectedTask.dueDate && (
                    <div>
                      <span className="block text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Due Date
                      </span>
                      <span className="text-slate-800 text-[11px] sm:text-xs font-medium block mt-0.5">
                        {new Date(selectedTask.dueDate).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                  {selectedTask.estimatedTimeDuration && (
                    <div>
                      <span className="block text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Estimated Duration
                      </span>
                      <span className="text-slate-800 text-[11px] sm:text-xs font-medium block mt-0.5">
                        {selectedTask.estimatedTimeDuration} Hours
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-200 pb-2">
                    Activity Logs ({selectedTask.history?.length || 0})
                  </h4>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300">
                    {selectedTask.history?.slice().reverse().map((log, i) => (
                      <div
                        key={i}
                        className="text-[11px] sm:text-xs border-b border-slate-100 pb-2 last:border-0"
                      >
                        <p className="text-slate-700 break-words">
                          <span className="font-semibold text-slate-900">
                            {log.user?.name || 'User'}
                          </span>{' '}
                          {log.action}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRTasks;