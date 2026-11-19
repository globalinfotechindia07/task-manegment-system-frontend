import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';
import {
  HiOutlineCalendarDays,
  HiOutlinePencilSquare,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamationTriangle,
  HiOutlineShieldCheck,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowPath,
  HiOutlineUserGroup,
  HiOutlineEye,
  HiOutlineXMark,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineInformationCircle,
  HiOutlineBuildingOffice2,
  HiOutlineArrowTopRightOnSquare,
} from 'react-icons/hi2';

const AdminAttendance = () => {
  const queryClient = useQueryClient();

  // Active view tab: 'daily' (Daily Attendance & Edit) | 'audit' (All Edit History Logs)
  const [activeTab, setActiveTab] = useState('daily');

  // Selected Date (YYYY-MM-DD), default to today
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // Modal states for Editing Attendance
  const [editingRecord, setEditingRecord] = useState(null); // { user, attendance, status, ... }
  const [editForm, setEditForm] = useState({
    status: 'Present',
    punchInTime: '09:30',
    punchOutTime: '18:30',
    reason: '',
  });

  // Modal state for viewing single employee's edit history
  const [viewHistoryRecord, setViewHistoryRecord] = useState(null);

  // Photo preview modal
  const [previewPhoto, setPreviewPhoto] = useState(null);

  // ===================== QUERIES =====================

  // 1. Fetch Daily Overview for the selected date
  const {
    data: dailyData,
    isLoading: loadingDaily,
    refetch: refetchDaily,
  } = useQuery({
    queryKey: ['dailyAttendanceOverview', selectedDate],
    queryFn: async () => {
      const { data } = await api.get(`/attendance/daily-overview?date=${selectedDate}`);
      return data;
    },
    enabled: activeTab === 'daily',
  });

  // 2. Fetch Audit Logs for Attendance
  const {
    data: auditLogs = [],
    isLoading: loadingAudit,
    refetch: refetchAudit,
  } = useQuery({
    queryKey: ['attendanceAuditLogs'],
    queryFn: async () => {
      const { data } = await api.get('/attendance/audit-logs');
      return Array.isArray(data) ? data : [];
    },
    enabled: activeTab === 'audit',
  });

  // ===================== MUTATIONS =====================

  const editMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/attendance/manual-edit', payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Attendance updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['dailyAttendanceOverview', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['attendanceAuditLogs'] });
      setEditingRecord(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update attendance');
    },
  });

  // ===================== DATE NAVIGATION HELPERS =====================
  const changeDateByDays = (days) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const formattedDateLabel = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // ===================== MODAL HANDLERS =====================
  const handleOpenEditModal = (rec) => {
    setEditingRecord(rec);

    let defaultIn = '09:30';
    let defaultOut = '18:30';

    if (rec.punchIn) {
      const d = new Date(rec.punchIn);
      defaultIn = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    if (rec.punchOut) {
      const d = new Date(rec.punchOut);
      defaultOut = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    setEditForm({
      status: rec.status === 'On Leave' ? 'On Leave' : rec.status || 'Present',
      punchInTime: defaultIn,
      punchOutTime: rec.punchOut ? defaultOut : '',
      reason: '',
    });
  };

  const handleSaveEditSubmit = (e) => {
    e.preventDefault();
    if (!editingRecord) return;

    if (!editForm.reason.trim()) {
      toast.error('Please provide a mandatory reason for this attendance change');
      return;
    }

    let pInIso = undefined;
    let pOutIso = undefined;

    if (editForm.status !== 'Absent' && editForm.status !== 'On Leave') {
      if (editForm.punchInTime) {
        pInIso = new Date(`${selectedDate}T${editForm.punchInTime}:00`).toISOString();
      }
      if (editForm.punchOutTime) {
        pOutIso = new Date(`${selectedDate}T${editForm.punchOutTime}:00`).toISOString();
      }
    }

    editMutation.mutate({
      userId: editingRecord.user._id,
      date: selectedDate,
      status: editForm.status,
      punchIn: pInIso,
      punchOut: pOutIso,
      reason: editForm.reason.trim(),
    });
  };

  // Format Time helper
  const formatTime = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Calculate Duration
  const calculateDuration = (inStr, outStr) => {
    if (!inStr || !outStr) return '—';
    const diff = new Date(outStr).getTime() - new Date(inStr).getTime();
    if (diff <= 0) return '—';
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hrs}h ${mins}m`;
  };

  // Filter records
  const records = dailyData?.records || [];
  const summary = dailyData?.summary || {
    totalStaff: 0,
    presentCount: 0,
    lateCount: 0,
    halfDayCount: 0,
    absentCount: 0,
    onLeaveCount: 0,
    editedCount: 0,
  };

  const departments = Array.from(
    new Set(records.map((r) => r.user?.department).filter(Boolean))
  );

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.user?.designation?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter !== 'All') {
      if (statusFilter === 'Edited') {
        if (!r.isManuallyEdited) return false;
      } else if (r.status !== statusFilter) {
        return false;
      }
    }

    if (departmentFilter !== 'All' && r.user?.department !== departmentFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ===================== PAGE HEADER ===================== */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
            <HiOutlineCalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Daily Attendance & Punch Corrections
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Review company-wide daily punches, correct missed clock-ins/outs, adjust statuses, and inspect audit logs.
            </p>
          </div>
        </div>

        {/* Shortcuts */}
        <div className="flex items-center gap-2">
          <Link
            to="/admin/attendance-settings"
            className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
          >
            <HiOutlineClock className="w-4 h-4 text-indigo-600" />
            <span>Attendance Policy</span>
            <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* ===================== TABS NAVIGATION ===================== */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('daily')}
          className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'daily'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HiOutlineCalendarDays className="w-4 h-4" />
          Daily Attendance Records
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'audit'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HiOutlineShieldCheck className="w-4 h-4" />
          Attendance Edit Audit Logs
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
            {summary.editedCount || auditLogs.length}
          </span>
        </button>
      </div>

      {/* ===================== TAB 1: DAILY ATTENDANCE & EDIT ===================== */}
      {activeTab === 'daily' && (
        <div className="space-y-5 sm:space-y-6">
          {/* DATE SELECTOR BAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Quick Day Stepper */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => changeDateByDays(-1)}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition cursor-pointer shadow-2xs"
                title="Previous Day"
              >
                <HiOutlineChevronLeft className="w-4 h-4" />
              </button>

              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => changeDateByDays(1)}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition cursor-pointer shadow-2xs"
                title="Next Day"
              >
                <HiOutlineChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleSetToday}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  selectedDate === new Date().toISOString().split('T')[0]
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Today
              </button>
            </div>

            {/* Date Headline */}
            <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span>{formattedDateLabel}</span>
            </div>

            <button
              type="button"
              onClick={() => refetchDaily()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer self-end md:self-auto"
            >
              <HiOutlineArrowPath className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {/* KPI SUMMARY COUNTERS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <p className="text-[10px] font-bold uppercase text-slate-500">Total Staff</p>
              <p className="text-lg font-black text-slate-900 font-mono">{summary.totalStaff}</p>
            </div>
            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 shadow-2xs">
              <p className="text-[10px] font-bold uppercase text-emerald-700">Present</p>
              <p className="text-lg font-black text-emerald-800 font-mono">{summary.presentCount}</p>
            </div>
            <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 shadow-2xs">
              <p className="text-[10px] font-bold uppercase text-amber-700">Late Mark</p>
              <p className="text-lg font-black text-amber-800 font-mono">{summary.lateCount}</p>
            </div>
            <div className="bg-orange-50/60 p-3 rounded-xl border border-orange-200/80 shadow-2xs">
              <p className="text-[10px] font-bold uppercase text-orange-700">Half Day</p>
              <p className="text-lg font-black text-orange-800 font-mono">{summary.halfDayCount}</p>
            </div>
            <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200/80 shadow-2xs">
              <p className="text-[10px] font-bold uppercase text-rose-700">Absent</p>
              <p className="text-lg font-black text-rose-800 font-mono">{summary.absentCount}</p>
            </div>
            <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-200/80 shadow-2xs">
              <p className="text-[10px] font-bold uppercase text-purple-700">On Leave</p>
              <p className="text-lg font-black text-purple-800 font-mono">{summary.onLeaveCount}</p>
            </div>
            <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-200/80 shadow-2xs">
              <p className="text-[10px] font-bold uppercase text-indigo-700">Manual Edits</p>
              <p className="text-lg font-black text-indigo-800 font-mono">{summary.editedCount}</p>
            </div>
          </div>

          {/* SEARCH & FILTER TOOLBAR */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff by name, email, designation..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Half Day">Half Day</option>
                <option value="Absent">Absent</option>
                <option value="On Leave">On Leave</option>
                <option value="Edited">Edited by Admin</option>
              </select>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="All">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ATTENDANCE RECORDS TABLE */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[760px]">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase text-slate-500 border-b border-slate-200 font-bold tracking-wider">
                    <th className="px-4 py-3.5">Employee</th>
                    <th className="px-3 py-3.5 text-center">Status</th>
                    <th className="px-3 py-3.5">Punch In</th>
                    <th className="px-3 py-3.5">Punch Out</th>
                    <th className="px-3 py-3.5 text-center">Work Duration</th>
                    <th className="px-3 py-3.5">Audit / Modification</th>
                    <th className="px-4 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingDaily ? (
                    <tr>
                      <td colSpan="7" className="p-12 text-center">
                        <div className="inline-block w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-xs text-slate-400 mt-2 font-medium">Loading attendance records...</p>
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-10 text-center">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                          <HiOutlineUserGroup className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-700">No attendance entries match your filter</p>
                        <p className="text-xs text-slate-400 mt-0.5">Try searching or changing the date.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => {
                      const u = rec.user;
                      const isEdited = rec.isManuallyEdited;

                      return (
                        <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Employee Info */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                {u.profilePicture ? (
                                  <img
                                    src={`${API_BASE_URL}${u.profilePicture}`}
                                    className="w-full h-full object-cover"
                                    alt={u.name}
                                  />
                                ) : (
                                  u.name?.charAt(0) || 'U'
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate max-w-[160px]">{u.name}</p>
                                <p className="text-[11px] text-slate-500 truncate max-w-[160px]">
                                  {[u.designation, u.department].filter(Boolean).join(' • ') || 'Staff'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="px-3 py-3.5 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                                rec.status === 'Present'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : rec.status === 'Late'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : rec.status === 'Half Day'
                                  ? 'bg-orange-50 text-orange-800 border-orange-200'
                                  : rec.status === 'On Leave'
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              {rec.status}
                              {rec.status === 'Late' && rec.lateByMinutes > 0 && (
                                <span className="font-mono lowercase text-[9px] font-normal">
                                  ({rec.lateByMinutes}m)
                                </span>
                              )}
                            </span>
                          </td>

                          {/* Punch In */}
                          <td className="px-3 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-800">
                              <span>{formatTime(rec.punchIn)}</span>
                              {rec.punchInPhoto && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewPhoto(`${API_BASE_URL}${rec.punchInPhoto}`)}
                                  className="text-indigo-600 hover:text-indigo-800 text-[10px] underline cursor-pointer"
                                  title="View Punch-In Selfie"
                                >
                                  [Photo]
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Punch Out */}
                          <td className="px-3 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-800">
                              <span>{formatTime(rec.punchOut)}</span>
                              {rec.punchOutPhoto && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewPhoto(`${API_BASE_URL}${rec.punchOutPhoto}`)}
                                  className="text-indigo-600 hover:text-indigo-800 text-[10px] underline cursor-pointer"
                                  title="View Punch-Out Selfie"
                                >
                                  [Photo]
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Work Duration */}
                          <td className="px-3 py-3.5 text-center font-mono font-bold text-slate-700 whitespace-nowrap">
                            {calculateDuration(rec.punchIn, rec.punchOut)}
                          </td>

                          {/* Audit / Edited Badge */}
                          <td className="px-3 py-3.5 whitespace-nowrap">
                            {isEdited ? (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  title={rec.editRemarks || 'Manually modified by admin'}
                                >
                                  <HiOutlinePencilSquare className="w-3 h-3 text-indigo-600" />
                                  <span>{rec.lastEditedBy?.name || 'Admin'}</span>
                                </span>
                                {(rec.editHistory || []).length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setViewHistoryRecord(rec)}
                                    className="text-[10px] text-indigo-600 hover:text-indigo-800 underline font-semibold cursor-pointer"
                                  >
                                    Log ({rec.editHistory.length})
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium italic">Biometric / Web</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(rec)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                            >
                              <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                              <span>{rec.hasPunched ? 'Edit' : 'Mark'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: AUDIT LOGS & CHANGE HISTORY ===================== */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HiOutlineShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>Attendance Modification Audit Trail</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every manual change, retroactive punch, and status correction is logged with who changed it, when, and the reason.
              </p>
            </div>

            <button
              type="button"
              onClick={() => refetchAudit()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <HiOutlineArrowPath className="w-3.5 h-3.5" />
              <span>Refresh Log</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[740px]">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase text-slate-500 border-b border-slate-200 font-bold tracking-wider">
                    <th className="px-4 py-3">Attendance Date</th>
                    <th className="px-3 py-3">Employee</th>
                    <th className="px-3 py-3">Modified By</th>
                    <th className="px-3 py-3">Status Change</th>
                    <th className="px-4 py-3">Reason / Remarks</th>
                    <th className="px-3 py-3 text-right">Modified Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingAudit ? (
                    <tr>
                      <td colSpan="6" className="p-12 text-center">
                        <div className="inline-block w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-12 text-center text-slate-400 italic">
                        No manual attendance modifications recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {log.date}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <p className="font-bold text-slate-900">{log.user?.name || 'Staff'}</p>
                          <p className="text-[10px] text-slate-400">{log.user?.email}</p>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {log.editedBy?.name || 'Admin'}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                            <span className="text-slate-400">{log.previousState?.status || 'Unset'}</span>
                            <span className="text-slate-400">→</span>
                            <span className="font-bold text-indigo-600">{log.newState?.status || 'Present'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700 max-w-xs truncate" title={log.reason}>
                          {log.reason || '—'}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(log.editedAt).toLocaleString()}
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

      {/* ===================== MODAL 1: EDIT / MARK ATTENDANCE ===================== */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                  <HiOutlinePencilSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    {editingRecord.hasPunched ? 'Modify Attendance Record' : 'Mark Manual Attendance'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Date: <strong className="text-slate-800">{selectedDate}</strong> ({formattedDateLabel})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEditSubmit} className="p-4 sm:p-5 space-y-4">
              {/* Employee Summary Chip */}
              <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  {editingRecord.user.name?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-slate-900 truncate">{editingRecord.user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {[editingRecord.user.designation, editingRecord.user.department].filter(Boolean).join(' • ')}
                  </p>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Attendance Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Present', 'Late', 'Half Day', 'Absent', 'On Leave'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, status: st })}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition border cursor-pointer text-center ${
                        editForm.status === st
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Punch Timings (Shown when Present, Late, or Half Day) */}
              {editForm.status !== 'Absent' && editForm.status !== 'On Leave' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Punch In Time</label>
                    <input
                      type="time"
                      value={editForm.punchInTime}
                      onChange={(e) => setEditForm({ ...editForm, punchInTime: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Punch Out Time</label>
                    <input
                      type="time"
                      value={editForm.punchOutTime}
                      onChange={(e) => setEditForm({ ...editForm, punchOutTime: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Mandatory Reason for Change */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Reason / Remarks for Modification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={editForm.reason}
                  onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                  placeholder="e.g. Employee forgot to punch out; Biometric device offline; Approved on-duty site visit"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  This reason will be permanently recorded in the audit log along with your name.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 border-t border-slate-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editMutation.isPending}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {editMutation.isPending ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <HiOutlineCheckCircle className="w-4 h-4" />
                  )}
                  <span>{editMutation.isPending ? 'Saving...' : 'Save & Record Audit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: VIEW RECORD EDIT HISTORY ===================== */}
      {viewHistoryRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-1.5">
                  <HiOutlineShieldCheck className="w-4 h-4 text-indigo-600" />
                  Edit History: {viewHistoryRecord.user.name}
                </h3>
                <p className="text-xs text-slate-500">Attendance Date: {selectedDate}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewHistoryRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 max-h-96 overflow-y-auto space-y-3">
              {(viewHistoryRecord.editHistory || []).length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">No edit logs found for this entry.</p>
              ) : (
                viewHistoryRecord.editHistory.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-[10px]">
                        Changed by {item.editedBy?.name || 'Admin'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.editedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-medium pt-1 text-[11px]">
                      <span className="text-slate-500">Status:</span>
                      <span className="text-rose-700">{item.previousState?.status || '—'}</span>
                      <span>→</span>
                      <span className="text-emerald-700 font-bold">{item.newState?.status || '—'}</span>
                    </div>

                    <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                      <strong>Reason:</strong> {item.reason || 'No remarks provided'}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 text-right">
              <button
                type="button"
                onClick={() => setViewHistoryRecord(null)}
                className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 3: PHOTO PREVIEW ===================== */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm cursor-pointer"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="bg-white p-3 rounded-2xl max-w-sm w-full text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img src={previewPhoto} alt="Punch Selfie" className="w-full h-80 object-cover rounded-xl" />
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="mt-3 px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendance;
