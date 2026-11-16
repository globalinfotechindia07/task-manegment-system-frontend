import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import {
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlinePlus,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineExclamationTriangle,
  HiOutlineInformationCircle,
  HiOutlineDocumentCheck,
  HiOutlineXMark,
} from 'react-icons/hi2';

const MyLeaves = () => {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  // Active view tab: 'my-requests' | 'holidays'
  const [activeTab, setActiveTab] = useState('my-requests');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Apply Modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({
    leaveType: 'Paid Leave',
    isHalfDay: false,
    halfDayType: 'First Half',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
  });

  // ============================================================
  // DATA QUERIES
  // ============================================================

  // 1. Fetch current user's leave balance
  const { data: balanceData, isLoading: loadingBalance } = useQuery({
    queryKey: ['myLeaveBalance', currentYear],
    queryFn: async () => {
      const res = await api.get(`/leaves/my-balance?year=${currentYear}`);
      return res.data;
    },
  });

  // 2. Fetch current user's leave requests history
  const { data: requestsData, isLoading: loadingRequests } = useQuery({
    queryKey: ['myLeaveRequests'],
    queryFn: async () => {
      const res = await api.get('/leaves/my-requests');
      return res.data?.requests || [];
    },
  });

  // 3. Fetch Company Holidays for this year
  const { data: holidaysData, isLoading: loadingHolidays } = useQuery({
    queryKey: ['companyHolidays', currentYear],
    queryFn: async () => {
      const res = await api.get(`/leaves/holidays?year=${currentYear}`);
      return res.data?.holidays || [];
    },
  });

  // ============================================================
  // MUTATIONS
  // ============================================================

  // Submit Leave Application
  const applyMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/leaves/apply', payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Leave application submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['myLeaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myLeaveBalance'] });
      setApplyModalOpen(false);
      setApplyForm({
        leaveType: 'Paid Leave',
        isHalfDay: false,
        halfDayType: 'First Half',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: '',
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit leave application');
    },
  });

  // Cancel Pending Leave Request
  const cancelMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.put(`/leaves/my-requests/${id}/cancel`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Leave request cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['myLeaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myLeaveBalance'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to cancel request');
    },
  });

  const balance = balanceData?.balance || {
    paidLeave: { total: 0, used: 0, remaining: 0 },
    sickLeave: { total: 0, used: 0, remaining: 0 },
    casualLeave: { total: 0, used: 0, remaining: 0 },
    carryForward: { fromPreviousYear: 0, used: 0, remaining: 0 },
    unpaidLeaveUsed: 0,
    totalAvailable: 0,
  };

  const requests = requestsData || [];
  const filteredRequests = requests.filter((r) => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  // Calculate days for the apply form
  const getRequestedDays = () => {
    if (applyForm.isHalfDay) return 0.5;
    if (!applyForm.startDate || !applyForm.endDate) return 1;
    const s = new Date(applyForm.startDate);
    const e = new Date(applyForm.endDate);
    if (e < s) return 0;
    const diffTime = Math.abs(e - s);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const requestedDays = getRequestedDays();

  // Check remaining for selected leave type
  const getSelectedTypeBalance = () => {
    switch (applyForm.leaveType) {
      case 'Paid Leave':
        return balance.paidLeave?.remaining ?? 0;
      case 'Sick Leave':
        return balance.sickLeave?.remaining ?? 0;
      case 'Casual Leave':
        return balance.casualLeave?.remaining ?? 0;
      case 'Carry Forward Leave':
        return balance.carryForward?.remaining ?? 0;
      default:
        return 999; // Unpaid leave has no hard cap
    }
  };

  const selectedRemaining = getSelectedTypeBalance();
  const hasInsufficientBalance =
    applyForm.leaveType !== 'Unpaid Leave' && requestedDays > selectedRemaining;

  const handleSubmitApplication = (e) => {
    e.preventDefault();
    if (!applyForm.reason.trim()) {
      toast.error('Please specify a reason for leave');
      return;
    }
    if (hasInsufficientBalance) {
      toast.error(
        `Insufficient ${applyForm.leaveType} balance. You only have ${selectedRemaining} day(s) remaining.`
      );
      return;
    }

    applyMutation.mutate({
      leaveType: applyForm.leaveType,
      isHalfDay: applyForm.isHalfDay,
      halfDayType: applyForm.isHalfDay ? applyForm.halfDayType : 'None',
      startDate: applyForm.startDate,
      endDate: applyForm.isHalfDay ? applyForm.startDate : applyForm.endDate,
      reason: applyForm.reason.trim(),
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <HiOutlineCalendarDays className="w-8 h-8 text-indigo-600" />
            My Leaves & Application Portal
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your leave quotas, submit full or half-day leave applications, and view approved company holidays.
          </p>
        </div>
        <button
          onClick={() => setApplyModalOpen(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm flex items-center gap-2 transition shadow-sm"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Apply for Leave
        </button>
      </div>

      {/* Real-time Leave Balance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Paid Leave Card */}
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Paid Leave (PL)
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-2">
              {balance.paidLeave?.remaining ?? 0}
              <span className="text-xs font-medium text-slate-400"> days</span>
            </p>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {balance.paidLeave?.used ?? 0} used / {balance.paidLeave?.total ?? 0} total
          </p>
        </div>

        {/* Sick Leave Card */}
        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
              Sick Leave (SL)
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-2">
              {balance.sickLeave?.remaining ?? 0}
              <span className="text-xs font-medium text-slate-400"> days</span>
            </p>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {balance.sickLeave?.used ?? 0} used / {balance.sickLeave?.total ?? 0} total
          </p>
        </div>

        {/* Casual Leave Card */}
        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              Casual Leave (CL)
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-2">
              {balance.casualLeave?.remaining ?? 0}
              <span className="text-xs font-medium text-slate-400"> days</span>
            </p>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {balance.casualLeave?.used ?? 0} used / {balance.casualLeave?.total ?? 0} total
          </p>
        </div>

        {/* Carry Forward Card */}
        <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
              Carry Forward
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-2">
              {balance.carryForward?.remaining ?? 0}
              <span className="text-xs font-medium text-slate-400"> days</span>
            </p>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {balance.carryForward?.used ?? 0} used / {balance.carryForward?.fromPreviousYear ?? 0} rolled
          </p>
        </div>

        {/* Unpaid Used Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              Unpaid Leaves
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-2">
              {balance.unpaidLeaveUsed ?? 0}
              <span className="text-xs font-medium text-slate-400"> days</span>
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Deducted from salary</p>
        </div>

        {/* Total Available Balance Hero Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-4 rounded-xl shadow-sm flex flex-col justify-between text-white">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded">
              Available Total
            </span>
            <p className="text-3xl font-black mt-2 leading-none">
              {balance.totalAvailable ?? 0}
            </p>
          </div>
          <p className="text-[11px] text-indigo-100 font-medium mt-2">Total paid quota ready to use</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('my-requests')}
          className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'my-requests'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HiOutlineClock className="w-4 h-4" />
          My Leave Applications ({requests.length})
        </button>

        <button
          onClick={() => setActiveTab('holidays')}
          className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'holidays'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HiOutlineCalendarDays className="w-4 h-4" />
          Company Holidays ({(holidaysData || []).length})
        </button>
      </div>

      {/* TAB 1: MY LEAVE REQUESTS */}
      {activeTab === 'my-requests' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Status Filter */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">
              Status:
            </span>
            {['ALL', 'Pending', 'Approved', 'Rejected', 'Cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {loadingRequests ? (
            <div className="p-12 text-center text-slate-400">Loading your leave records...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No leave applications found. Click "Apply for Leave" above to request time off.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Duration & Mode</th>
                    <th className="py-3 px-4">Date(s)</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status & Reviewer</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            req.leaveType === 'Paid Leave'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : req.leaveType === 'Sick Leave'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : req.leaveType === 'Casual Leave'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : req.leaveType === 'Carry Forward Leave'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {req.leaveType}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {req.isHalfDay ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                              {req.halfDayType === 'First Half' ? (
                                <HiOutlineSun className="w-3.5 h-3.5 text-amber-500" />
                              ) : (
                                <HiOutlineMoon className="w-3.5 h-3.5 text-indigo-500" />
                              )}
                              Half Day ({req.halfDayType})
                            </span>
                            <span className="text-xs text-slate-400 font-mono">0.5 day</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              Full Day
                            </span>
                            <span className="text-xs font-semibold text-slate-600 font-mono">
                              {req.totalDays} {req.totalDays === 1 ? 'day' : 'days'}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-xs font-medium text-slate-800">
                          {new Date(req.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                          {!req.isHalfDay && req.startDate !== req.endDate && (
                            <span className="text-slate-400 block font-normal">
                              to{' '}
                              {new Date(req.endDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-xs text-slate-700 line-clamp-2" title={req.reason}>
                          {req.reason}
                        </p>
                        {req.rejectionReason && (
                          <p className="text-[11px] text-rose-600 mt-0.5 font-medium">
                            HR Note: {req.rejectionReason}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            req.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : req.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : req.status === 'Cancelled'
                              ? 'bg-slate-100 text-slate-600 border border-slate-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {req.status === 'Approved' && <HiOutlineCheckCircle className="w-3.5 h-3.5" />}
                          {req.status === 'Rejected' && <HiOutlineXCircle className="w-3.5 h-3.5" />}
                          {req.status === 'Pending' && <HiOutlineClock className="w-3.5 h-3.5" />}
                          {req.status}
                        </span>
                        {req.approvedByName && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            Reviewed by {req.approvedByName}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {req.status === 'Pending' ? (
                          <button
                            onClick={() => {
                              if (window.confirm('Cancel this pending leave request?')) {
                                cancelMutation.mutate(req._id);
                              }
                            }}
                            disabled={cancelMutation.isPending}
                            className="text-xs font-medium text-rose-600 hover:text-rose-800 transition"
                          >
                            Cancel Request
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMPANY HOLIDAYS */}
      {activeTab === 'holidays' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 text-base">
              Official Company Holidays ({currentYear})
            </h3>
            <p className="text-xs text-slate-500">
              Non-working paid holidays recognized by company policy.
            </p>
          </div>

          {loadingHolidays ? (
            <div className="p-12 text-center text-slate-400">Loading holidays...</div>
          ) : (holidaysData || []).length === 0 ? (
            <div className="p-12 text-center text-slate-400">No holidays published yet for this year.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(holidaysData || []).map((h) => {
                const dateObj = new Date(h.date);
                const dayNum = dateObj.toLocaleDateString('en-US', { day: '2-digit' });
                const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' });
                const weekdayStr = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

                return (
                  <div
                    key={h._id}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-start gap-4"
                  >
                    <div className="w-14 h-14 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center flex-shrink-0 text-indigo-700">
                      <span className="text-[10px] uppercase font-bold tracking-wider leading-none">
                        {monthStr}
                      </span>
                      <span className="text-xl font-extrabold leading-tight">{dayNum}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{h.title}</h4>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            h.type === 'National'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : h.type === 'Festival'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {h.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mb-1">{weekdayStr}</p>
                      {h.description && (
                        <p className="text-xs text-slate-600 line-clamp-2">{h.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          MODAL: APPLY FOR LEAVE
          ============================================================ */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Apply for Leave</h3>
                <p className="text-xs text-slate-500">Fill in details and duration for HR review</p>
              </div>
              <button
                onClick={() => setApplyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-4">
              {/* Leave Type Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Leave Category *
                </label>
                <select
                  value={applyForm.leaveType}
                  onChange={(e) => setApplyForm({ ...applyForm, leaveType: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Paid Leave">
                    Paid Leave (PL) — Available: {balance.paidLeave?.remaining ?? 0} days
                  </option>
                  <option value="Sick Leave">
                    Sick Leave (SL) — Available: {balance.sickLeave?.remaining ?? 0} days
                  </option>
                  <option value="Casual Leave">
                    Casual Leave (CL) — Available: {balance.casualLeave?.remaining ?? 0} days
                  </option>
                  <option value="Carry Forward Leave">
                    Carry Forward (CF) — Available: {balance.carryForward?.remaining ?? 0} days
                  </option>
                  <option value="Unpaid Leave">Unpaid Leave (Loss of Pay)</option>
                </select>
              </div>

              {/* Duration Mode: Full Day vs Half Day */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Duration Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setApplyForm({ ...applyForm, isHalfDay: false })}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 transition ${
                      !applyForm.isHalfDay
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Full Day / Date Range
                  </button>

                  <button
                    type="button"
                    onClick={() => setApplyForm({ ...applyForm, isHalfDay: true })}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 transition ${
                      applyForm.isHalfDay
                        ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Half Day (0.5 Day)
                  </button>
                </div>
              </div>

              {/* If Half Day: 1st Half vs 2nd Half Shift Choice */}
              {applyForm.isHalfDay && (
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 space-y-2">
                  <label className="block text-xs font-bold text-amber-900">
                    Select Half-Day Session:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs font-medium transition ${
                        applyForm.halfDayType === 'First Half'
                          ? 'bg-white border-amber-400 text-amber-900 font-bold shadow-xs'
                          : 'bg-white/60 border-amber-200 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="halfDayType"
                        value="First Half"
                        checked={applyForm.halfDayType === 'First Half'}
                        onChange={(e) =>
                          setApplyForm({ ...applyForm, halfDayType: e.target.value })
                        }
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <HiOutlineSun className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <div>
                        <span>First Half</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Morning Shift</span>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs font-medium transition ${
                        applyForm.halfDayType === 'Second Half'
                          ? 'bg-white border-indigo-400 text-indigo-900 font-bold shadow-xs'
                          : 'bg-white/60 border-amber-200 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="halfDayType"
                        value="Second Half"
                        checked={applyForm.halfDayType === 'Second Half'}
                        onChange={(e) =>
                          setApplyForm({ ...applyForm, halfDayType: e.target.value })
                        }
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <HiOutlineMoon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <div>
                        <span>Second Half</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Post-Lunch Shift</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Date Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {applyForm.isHalfDay ? 'Leave Date *' : 'Start Date *'}
                  </label>
                  <input
                    type="date"
                    value={applyForm.startDate}
                    onChange={(e) =>
                      setApplyForm({
                        ...applyForm,
                        startDate: e.target.value,
                        endDate: applyForm.isHalfDay ? e.target.value : applyForm.endDate,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                {!applyForm.isHalfDay && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={applyForm.endDate}
                      min={applyForm.startDate}
                      onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Total Calculation & Balance Validation */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500">Requested Duration:</span>
                  <p className="text-sm font-bold text-slate-800">
                    {requestedDays} {requestedDays === 1 ? 'Day' : 'Days'}{' '}
                    {applyForm.isHalfDay && `(${applyForm.halfDayType})`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">Category Balance:</span>
                  <p
                    className={`text-sm font-bold ${
                      hasInsufficientBalance ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {applyForm.leaveType === 'Unpaid Leave'
                      ? 'Unlimited (Loss of Pay)'
                      : `${selectedRemaining} Days Available`}
                  </p>
                </div>
              </div>

              {hasInsufficientBalance && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs">
                  <HiOutlineExclamationTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Insufficient Balance</p>
                    <p className="mt-0.5 text-[11px]">
                      You requested {requestedDays} day(s), but only have {selectedRemaining} day(s) of{' '}
                      {applyForm.leaveType}. Please reduce days or apply for "Unpaid Leave".
                    </p>
                  </div>
                </div>
              )}

              {/* Reason for leave */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Reason for Leave *
                </label>
                <textarea
                  rows="3"
                  placeholder="Please state the reason for taking leave (e.g., family function, fever/medical checkup, urgent personal work)..."
                  value={applyForm.reason}
                  onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                  className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyMutation.isPending || hasInsufficientBalance}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLeaves;

