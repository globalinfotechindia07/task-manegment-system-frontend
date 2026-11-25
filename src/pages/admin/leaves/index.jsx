import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import {
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineArrowPath,
  HiOutlineFunnel,
  HiOutlineMagnifyingGlass,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineExclamationTriangle,
  HiOutlineInformationCircle,
  HiOutlineArrowsRightLeft,
} from 'react-icons/hi2';

const AdminLeaves = () => {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  // Active Tab state: 'requests' | 'balances' | 'holidays' | 'policy'
  const [activeTab, setActiveTab] = useState('requests');

  // Filters for Leave Requests
  const [reqStatusFilter, setReqStatusFilter] = useState('ALL');
  const [reqTypeFilter, setReqTypeFilter] = useState('ALL');
  const [reqSearch, setReqSearch] = useState('');

  // Filters for Balances
  const [balanceYear, setBalanceYear] = useState(currentYear);
  const [balanceSearch, setBalanceSearch] = useState('');

  // Filters for Holidays
  const [holidayYear, setHolidayYear] = useState(currentYear);

  // Modals state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequestForAction, setSelectedRequestForAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [holidayForm, setHolidayForm] = useState({
    title: '',
    date: '',
    type: 'Festival',
    description: '',
    isOptional: false,
  });

  const [editBalanceModalOpen, setEditBalanceModalOpen] = useState(false);
  const [selectedEmployeeBalance, setSelectedEmployeeBalance] = useState(null);
  const [balanceForm, setBalanceForm] = useState({
    paidLeaveTotal: 15,
    paidLeaveUsed: 0,
    sickLeaveTotal: 10,
    sickLeaveUsed: 0,
    casualLeaveTotal: 8,
    casualLeaveUsed: 0,
    carryForwardTotal: 0,
    carryForwardUsed: 0,
    notes: '',
  });

  const [rolloverModalOpen, setRolloverModalOpen] = useState(false);
  const [rolloverFromYear, setRolloverFromYear] = useState(currentYear - 1);
  const [rolloverToYear, setRolloverToYear] = useState(currentYear);

  // ============================================================
  // DATA FETCHING QUERIES
  // ============================================================

  // 1. Fetch Leave Requests
  const { data: requestsData, isLoading: loadingRequests } = useQuery({
    queryKey: ['adminLeaveRequests', reqStatusFilter, reqTypeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (reqStatusFilter !== 'ALL') params.append('status', reqStatusFilter);
      if (reqTypeFilter !== 'ALL') params.append('leaveType', reqTypeFilter);
      const res = await api.get(`/leaves/requests?${params.toString()}`);
      return res.data?.requests || [];
    },
  });

  // 2. Fetch Employee Leave Balances
  const { data: balancesData, isLoading: loadingBalances } = useQuery({
    queryKey: ['adminLeaveBalances', balanceYear],
    queryFn: async () => {
      const res = await api.get(`/leaves/balances?year=${balanceYear}`);
      return res.data?.balances || [];
    },
  });

  // 3. Fetch Holidays
  const { data: holidaysData, isLoading: loadingHolidays } = useQuery({
    queryKey: ['adminHolidays', holidayYear],
    queryFn: async () => {
      const res = await api.get(`/leaves/holidays?year=${holidayYear}`);
      return res.data?.holidays || [];
    },
  });

  // 4. Fetch Company Policy
  const { data: policyData, isLoading: loadingPolicy } = useQuery({
    queryKey: ['companyLeavePolicy'],
    queryFn: async () => {
      const res = await api.get('/leaves/policy');
      return res.data?.policy || {};
    },
  });

  // Policy form state
  const [policyForm, setPolicyForm] = useState({
    defaultPaidLeave: 15,
    defaultSickLeave: 10,
    defaultCasualLeave: 8,
    maxCarryForward: 10,
    allowHalfDay: true,
    carryForwardAllowed: true,
  });

  // Sync policy data into form once loaded
  React.useEffect(() => {
    if (policyData && Object.keys(policyData).length > 0) {
      setPolicyForm({
        defaultPaidLeave: policyData.defaultPaidLeave ?? 15,
        defaultSickLeave: policyData.defaultSickLeave ?? 10,
        defaultCasualLeave: policyData.defaultCasualLeave ?? 8,
        maxCarryForward: policyData.maxCarryForward ?? 10,
        allowHalfDay: policyData.allowHalfDay ?? true,
        carryForwardAllowed: policyData.carryForwardAllowed ?? true,
      });
    }
  }, [policyData]);

  // ============================================================
  // MUTATIONS
  // ============================================================

  // Review (Approve/Reject) Leave Request
  const reviewMutation = useMutation({
    mutationFn: async ({ id, action, rejectionReason }) => {
      const res = await api.put(`/leaves/requests/${id}/action`, {
        action,
        rejectionReason,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Action completed successfully');
      queryClient.invalidateQueries({ queryKey: ['adminLeaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['adminLeaveBalances'] });
      setRejectModalOpen(false);
      setSelectedRequestForAction(null);
      setRejectionReason('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to review request');
    },
  });

  // Save / Update Policy
  const policyMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.put('/leaves/policy', payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Leave policy updated successfully');
      queryClient.invalidateQueries({ queryKey: ['companyLeavePolicy'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update policy');
    },
  });

  // Add / Edit Holiday
  const holidayMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      if (id) {
        const res = await api.put(`/leaves/holidays/${id}`, payload);
        return res.data;
      } else {
        const res = await api.post('/leaves/holidays', payload);
        return res.data;
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Holiday saved successfully');
      queryClient.invalidateQueries({ queryKey: ['adminHolidays'] });
      setHolidayModalOpen(false);
      setEditingHoliday(null);
      setHolidayForm({
        title: '',
        date: '',
        type: 'Festival',
        description: '',
        isOptional: false,
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save holiday');
    },
  });

  // Delete Holiday
  const deleteHolidayMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/leaves/holidays/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Holiday deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['adminHolidays'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete holiday');
    },
  });

  // Update Employee Balance
  const updateBalanceMutation = useMutation({
    mutationFn: async ({ userId, payload }) => {
      const res = await api.put(`/leaves/balances/${userId}`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Employee leave quota updated successfully');
      queryClient.invalidateQueries({ queryKey: ['adminLeaveBalances'] });
      setEditBalanceModalOpen(false);
      setSelectedEmployeeBalance(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update quota');
    },
  });

  // Rollover Carry Forward
  const rolloverMutation = useMutation({
    mutationFn: async ({ fromYear, toYear }) => {
      const res = await api.post('/leaves/carry-forward/rollover', { fromYear, toYear });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Carry-forward rollover completed!');
      queryClient.invalidateQueries({ queryKey: ['adminLeaveBalances'] });
      setRolloverModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to rollover carry-forward leaves');
    },
  });

  // Calculations for Summary Cards
  const allRequests = requestsData || [];
  const pendingRequestsCount = allRequests.filter((r) => r.status === 'Pending').length;
  const approvedThisMonthCount = allRequests.filter((r) => {
    if (r.status !== 'Approved') return false;
    const d = new Date(r.startDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const holidaysCount = (holidaysData || []).length;
  const totalEmployeesWithBalance = (balancesData || []).length;

  // Filtered requests list
  const filteredRequests = allRequests.filter((r) => {
    if (!reqSearch.trim()) return true;
    const query = reqSearch.toLowerCase();
    const uName = (r.user?.name || '').toLowerCase();
    const uEmail = (r.user?.email || '').toLowerCase();
    const reason = (r.reason || '').toLowerCase();
    return uName.includes(query) || uEmail.includes(query) || reason.includes(query);
  });

  // Filtered balances list
  const filteredBalances = (balancesData || []).filter((b) => {
    if (!balanceSearch.trim()) return true;
    const query = balanceSearch.toLowerCase();
    const uName = (b.user?.name || '').toLowerCase();
    const uEmail = (b.user?.email || '').toLowerCase();
    const dept = (b.user?.department || '').toLowerCase();
    return uName.includes(query) || uEmail.includes(query) || dept.includes(query);
  });

  // Quick Action Handlers
  const handleApprove = (req) => {
    if (window.confirm(`Approve leave request for ${req.user?.name || 'Employee'} (${req.totalDays} day(s))?`)) {
      reviewMutation.mutate({ id: req._id, action: 'Approved' });
    }
  };

  const handleOpenReject = (req) => {
    setSelectedRequestForAction(req);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (!selectedRequestForAction) return;
    reviewMutation.mutate({
      id: selectedRequestForAction._id,
      action: 'Rejected',
      rejectionReason,
    });
  };

  const handleOpenAddHoliday = () => {
    setEditingHoliday(null);
    setHolidayForm({
      title: '',
      date: new Date().toISOString().split('T')[0],
      type: 'Festival',
      description: '',
      isOptional: false,
    });
    setHolidayModalOpen(true);
  };

  const handleOpenEditHoliday = (h) => {
    setEditingHoliday(h);
    const dateFormatted = new Date(h.date).toISOString().split('T')[0];
    setHolidayForm({
      title: h.title,
      date: dateFormatted,
      type: h.type || 'Festival',
      description: h.description || '',
      isOptional: Boolean(h.isOptional),
    });
    setHolidayModalOpen(true);
  };

  const handleSaveHoliday = (e) => {
    e.preventDefault();
    if (!holidayForm.title.trim() || !holidayForm.date) {
      toast.error('Title and Date are required');
      return;
    }
    holidayMutation.mutate({
      id: editingHoliday?._id,
      payload: holidayForm,
    });
  };

  const handleOpenEditBalance = (b) => {
    setSelectedEmployeeBalance(b);
    setBalanceForm({
      paidLeaveTotal: b.paidLeave?.total ?? 15,
      paidLeaveUsed: b.paidLeave?.used ?? 0,
      sickLeaveTotal: b.sickLeave?.total ?? 10,
      sickLeaveUsed: b.sickLeave?.used ?? 0,
      casualLeaveTotal: b.casualLeave?.total ?? 8,
      casualLeaveUsed: b.casualLeave?.used ?? 0,
      carryForwardTotal: b.carryForward?.fromPreviousYear ?? 0,
      carryForwardUsed: b.carryForward?.used ?? 0,
      notes: b.notes || '',
    });
    setEditBalanceModalOpen(true);
  };

  const handleSaveBalance = (e) => {
    e.preventDefault();
    if (!selectedEmployeeBalance) return;
    updateBalanceMutation.mutate({
      userId: selectedEmployeeBalance.user?._id,
      payload: {
        year: balanceYear,
        ...balanceForm,
      },
    });
  };

  const handleSavePolicy = (e) => {
    e.preventDefault();
    policyMutation.mutate(policyForm);
  };

  return (
    <div className="p-3.5 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <HiOutlineCalendarDays className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 flex-shrink-0" />
            Leaves & Holidays Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure company holidays, set annual leave policies, assign employee quotas, and review leave requests.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {activeTab === 'holidays' && (
            <button
              onClick={handleOpenAddHoliday}
              className="w-full sm:w-auto justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs sm:text-sm flex items-center gap-2 transition shadow-sm"
            >
              <HiOutlinePlus className="w-4 h-4" />
              Add Holiday
            </button>
          )}
          {activeTab === 'balances' && (
            <button
              onClick={() => setRolloverModalOpen(true)}
              className="w-full sm:w-auto justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-xs sm:text-sm flex items-center gap-2 transition shadow-sm"
            >
              <HiOutlineArrowPath className="w-4 h-4" />
              Rollover Carry Forward
            </button>
          )}
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold flex-shrink-0">
            <HiOutlineClock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">Pending Requests</p>
            <p className="text-lg sm:text-2xl font-bold text-slate-900 leading-tight">{pendingRequestsCount}</p>
            <span className="text-[10px] sm:text-xs text-amber-600 font-medium hidden sm:inline">Requires your review</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
            <HiOutlineCheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">Approved (Month)</p>
            <p className="text-lg sm:text-2xl font-bold text-slate-900 leading-tight">{approvedThisMonthCount}</p>
            <span className="text-[10px] sm:text-xs text-emerald-600 font-medium hidden sm:inline">Synced with attendance</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">
            <HiOutlineCalendarDays className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">Official Holidays</p>
            <p className="text-lg sm:text-2xl font-bold text-slate-900 leading-tight">{holidaysCount}</p>
            <span className="text-[10px] sm:text-xs text-indigo-600 font-medium hidden sm:inline">Year {holidayYear} Calendar</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
            <HiOutlineUserGroup className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">Staff Quotas</p>
            <p className="text-lg sm:text-2xl font-bold text-slate-900 leading-tight">{totalEmployeesWithBalance}</p>
            <span className="text-[10px] sm:text-xs text-blue-600 font-medium hidden sm:inline">Active employees enrolled</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex gap-1 shadow-sm overflow-x-auto no-scrollbar touch-scroll flex-nowrap">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-shrink-0 min-w-max py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition ${
            activeTab === 'requests'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <HiOutlineClock className="w-4 h-4 flex-shrink-0" />
          Leave Requests
          {pendingRequestsCount > 0 && (
            <span
              className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded-full font-bold ${
                activeTab === 'requests' ? 'bg-white text-indigo-700' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('balances')}
          className={`flex-shrink-0 min-w-max py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition ${
            activeTab === 'balances'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <HiOutlineUserGroup className="w-4 h-4 flex-shrink-0" />
          Leave Quotas & Balances
        </button>

        <button
          onClick={() => setActiveTab('holidays')}
          className={`flex-shrink-0 min-w-max py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition ${
            activeTab === 'holidays'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <HiOutlineCalendarDays className="w-4 h-4 flex-shrink-0" />
          Holidays Register
        </button>

        <button
          onClick={() => setActiveTab('policy')}
          className={`flex-shrink-0 min-w-max py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition ${
            activeTab === 'policy'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <HiOutlineShieldCheck className="w-4 h-4 flex-shrink-0" />
          Leave Policy
        </button>
      </div>

      {/* TAB CONTENT 1: LEAVE REQUESTS */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <HiOutlineFunnel className="w-3.5 h-3.5" /> Filter:
              </span>
              {['ALL', 'Pending', 'Approved', 'Rejected', 'Cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setReqStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    reqStatusFilter === st
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={reqTypeFilter}
                onChange={(e) => setReqTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Leave Types</option>
                <option value="Paid Leave">Paid Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Casual Leave">Casual Leave</option>
                <option value="Carry Forward Leave">Carry Forward Leave</option>
                <option value="Unpaid Leave">Unpaid Leave</option>
              </select>

              <div className="relative flex-1 md:w-60">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employee or reason..."
                  value={reqSearch}
                  onChange={(e) => setReqSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {loadingRequests ? (
            <div className="p-12 text-center text-slate-400">Loading leave applications...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No leave requests found matching filters.</div>
          ) : (
            <div className="overflow-x-auto touch-scroll">
              <div className="sm:hidden px-3 py-1.5 bg-indigo-50/70 border-b border-indigo-100/60 flex items-center justify-between text-[11px] text-indigo-700 font-medium">
                <span className="flex items-center gap-1.5">
                  <HiOutlineArrowsRightLeft className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                  Swipe horizontally to review requests & take actions
                </span>
                <span className="text-[10px] text-indigo-500 font-mono">Scroll &rarr;</span>
              </div>
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Leave Type & Details</th>
                    <th className="py-3 px-4">Duration & Timing</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {(req.user?.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 leading-tight">{req.user?.name || 'Staff'}</p>
                            <p className="text-xs text-slate-500">{req.user?.designation || req.user?.department || req.user?.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold w-max ${
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
                        </div>
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
                            <span className="text-xs text-slate-400 font-mono">0.5d</span>
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
                            Note: {req.rejectionReason}
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
                            by {req.approvedByName}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {req.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApprove(req)}
                              disabled={reviewMutation.isPending}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenReject(req)}
                              disabled={reviewMutation.isPending}
                              className="px-3 py-1 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold rounded-lg transition"
                            >
                              Reject
                            </button>
                          </div>
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

      {/* TAB CONTENT 2: LEAVE QUOTAS & BALANCES */}
      {activeTab === 'balances' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Year Selector & Search */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Year:</label>
              <select
                value={balanceYear}
                onChange={(e) => setBalanceYear(Number(e.target.value))}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-500">
                Showing annual leave allocations and utilized days
              </span>
            </div>

            <div className="relative flex-1 md:w-72">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by staff name, role, dept..."
                value={balanceSearch}
                onChange={(e) => setBalanceSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {loadingBalances ? (
            <div className="p-12 text-center text-slate-400">Loading leave quotas...</div>
          ) : filteredBalances.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No employee leave records found.</div>
          ) : (
            <div className="overflow-x-auto touch-scroll">
              <div className="sm:hidden px-3 py-1.5 bg-indigo-50/70 border-b border-indigo-100/60 flex items-center justify-between text-[11px] text-indigo-700 font-medium">
                <span className="flex items-center gap-1.5">
                  <HiOutlineArrowsRightLeft className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                  Swipe horizontally to view quotas & adjust
                </span>
                <span className="text-[10px] text-indigo-500 font-mono">Scroll &rarr;</span>
              </div>
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Paid Leave (PL)</th>
                    <th className="py-3 px-4">Sick Leave (SL)</th>
                    <th className="py-3 px-4">Casual Leave (CL)</th>
                    <th className="py-3 px-4">Carry Forward (CF)</th>
                    <th className="py-3 px-4">Unpaid Used</th>
                    <th className="py-3 px-4">Total Available</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredBalances.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {(b.user?.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 leading-tight">{b.user?.name || 'Employee'}</p>
                            <p className="text-xs text-slate-500">{b.user?.department || b.user?.role}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-xs">
                          <span className="font-semibold text-emerald-700">{b.paidLeave?.remaining} left</span>
                          <span className="text-slate-400 font-mono text-[11px] block">
                            {b.paidLeave?.used} used / {b.paidLeave?.total} total
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-xs">
                          <span className="font-semibold text-rose-700">{b.sickLeave?.remaining} left</span>
                          <span className="text-slate-400 font-mono text-[11px] block">
                            {b.sickLeave?.used} used / {b.sickLeave?.total} total
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-xs">
                          <span className="font-semibold text-blue-700">{b.casualLeave?.remaining} left</span>
                          <span className="text-slate-400 font-mono text-[11px] block">
                            {b.casualLeave?.used} used / {b.casualLeave?.total} total
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-xs">
                          <span className="font-semibold text-purple-700">{b.carryForward?.remaining} left</span>
                          <span className="text-slate-400 font-mono text-[11px] block">
                            {b.carryForward?.used} used / {b.carryForward?.fromPreviousYear} rolled
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs text-slate-600">
                        {b.unpaidLeaveUsed > 0 ? (
                          <span className="text-rose-600 font-semibold">{b.unpaidLeaveUsed} days</span>
                        ) : (
                          '0'
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-white">
                          {b.totalAvailableLeaves} Days
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenEditBalance(b)}
                          className="px-3 py-1 bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 hover:text-indigo-600 text-xs font-semibold rounded-lg transition shadow-sm flex items-center gap-1.5 ml-auto"
                        >
                          <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                          Adjust Quota
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: HOLIDAYS REGISTER */}
      {activeTab === 'holidays' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Controls */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Year:</label>
              <select
                value={holidayYear}
                onChange={(e) => setHolidayYear(Number(e.target.value))}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-500">
                Official paid non-working company holidays
              </span>
            </div>

            <button
              onClick={handleOpenAddHoliday}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-sm"
            >
              <HiOutlinePlus className="w-4 h-4" />
              Add Holiday
            </button>
          </div>

          {loadingHolidays ? (
            <div className="p-12 text-center text-slate-400">Loading holidays list...</div>
          ) : (holidaysData || []).length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No holidays added for year {holidayYear}. Click "Add Holiday" to register official holidays.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {(holidaysData || []).map((h) => {
                const dateObj = new Date(h.date);
                const dayNum = dateObj.toLocaleDateString('en-US', { day: '2-digit' });
                const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' });
                const weekdayStr = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

                return (
                  <div
                    key={h._id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition shadow-sm flex items-start gap-4 relative group"
                  >
                    {/* Calendar Badge */}
                    <div className="w-14 h-14 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center flex-shrink-0 text-indigo-700">
                      <span className="text-[10px] uppercase font-bold tracking-wider leading-none">{monthStr}</span>
                      <span className="text-xl font-extrabold leading-tight">{dayNum}</span>
                    </div>

                    {/* Holiday Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-slate-900 text-sm truncate">{h.title}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            h.type === 'National'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : h.type === 'Festival'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : h.type === 'Optional'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {h.type}
                        </span>
                        {h.isOptional && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                            Optional
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium mb-1">{weekdayStr}</p>
                      {h.description && (
                        <p className="text-xs text-slate-600 line-clamp-2">{h.description}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={() => handleOpenEditHoliday(h)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Edit Holiday"
                      >
                        <HiOutlinePencilSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete holiday "${h.title}"?`)) {
                            deleteHolidayMutation.mutate(h._id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Holiday"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: LEAVE POLICY */}
      {activeTab === 'policy' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-4xl">
          <div className="border-b border-slate-200 pb-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <HiOutlineShieldCheck className="w-5 h-5 text-indigo-600" />
              Standard Company Leave Policy
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              These defaults are automatically assigned to new employees and used when generating annual leave balances.
            </p>
          </div>

          <form onSubmit={handleSavePolicy} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Default Annual Paid Leaves (PL)
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={policyForm.defaultPaidLeave}
                  onChange={(e) =>
                    setPolicyForm({ ...policyForm, defaultPaidLeave: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Fully paid earned leaves allocated per financial/calendar year.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Default Annual Sick Leaves (SL)
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={policyForm.defaultSickLeave}
                  onChange={(e) =>
                    setPolicyForm({ ...policyForm, defaultSickLeave: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Allocated specifically for medical emergencies and illness.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Default Annual Casual Leaves (CL)
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={policyForm.defaultCasualLeave}
                  onChange={(e) =>
                    setPolicyForm({ ...policyForm, defaultCasualLeave: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Short-notice leaves for urgent personal affairs.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Max Carry-Forward Days Allowed
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={policyForm.maxCarryForward}
                  onChange={(e) =>
                    setPolicyForm({ ...policyForm, maxCarryForward: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Maximum unused leaves that can be transferred to the subsequent year.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policyForm.allowHalfDay}
                  onChange={(e) =>
                    setPolicyForm({ ...policyForm, allowHalfDay: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-800">
                    Allow Half-Day Leaves (First Half / Second Half)
                  </span>
                  <p className="text-xs text-slate-500">
                    Enables employees to apply for 0.5 day leaves choosing either morning or post-lunch shift.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policyForm.carryForwardAllowed}
                  onChange={(e) =>
                    setPolicyForm({ ...policyForm, carryForwardAllowed: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-800">
                    Enable Carry-Forward Leaves Rollover
                  </span>
                  <p className="text-xs text-slate-500">
                    Permits rolling over unused leaves at the end of each year up to the configured limit.
                  </p>
                </div>
              </label>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={policyMutation.isPending}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition shadow-sm disabled:opacity-50"
              >
                {policyMutation.isPending ? 'Saving Policy...' : 'Save Policy Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================
          MODAL: REJECT LEAVE APPLICATION
          ============================================================ */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-xl border border-slate-200 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <HiOutlineExclamationTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Reject Leave Request</h3>
                <p className="text-xs text-slate-500">
                  {selectedRequestForAction?.user?.name} ({selectedRequestForAction?.totalDays} day(s))
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Please state a reason for rejecting this leave request so the employee understands why it was declined:
            </p>

            <textarea
              rows="3"
              placeholder="e.g., Critical release scheduled this week, please postpone or speak with HR..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 mb-4 text-slate-800"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={reviewMutation.isPending}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {reviewMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: ADD / EDIT HOLIDAY
          ============================================================ */}
      {holidayModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-xl border border-slate-200 max-h-[90dvh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingHoliday ? 'Edit Official Holiday' : 'Add Official Holiday'}
            </h3>

            <form onSubmit={handleSaveHoliday} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Holiday Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Independence Day, Diwali, Eid..."
                  value={holidayForm.title}
                  onChange={(e) => setHolidayForm({ ...holidayForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={holidayForm.date}
                    onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Category Type
                  </label>
                  <select
                    value={holidayForm.type}
                    onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="National">National Holiday</option>
                    <option value="Festival">Festival</option>
                    <option value="Company">Company Holiday</option>
                    <option value="Optional">Optional / Restricted</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description / Remarks
                </label>
                <textarea
                  rows="2"
                  placeholder="Brief note about the holiday..."
                  value={holidayForm.description}
                  onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={holidayForm.isOptional}
                  onChange={(e) => setHolidayForm({ ...holidayForm, isOptional: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-slate-700">
                  Mark as Optional / Floating Holiday
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setHolidayModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={holidayMutation.isPending}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {holidayMutation.isPending ? 'Saving...' : 'Save Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: EDIT EMPLOYEE LEAVE QUOTA
          ============================================================ */}
      {editBalanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-xl border border-slate-200 max-h-[90dvh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Adjust Leave Quota ({balanceYear})
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Employee: <span className="font-semibold text-slate-800">{selectedEmployeeBalance?.user?.name}</span> (
              {selectedEmployeeBalance?.user?.email})
            </p>

            <form onSubmit={handleSaveBalance} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <label className="block text-xs font-bold text-emerald-800 mb-1">
                    Paid Leave Total
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={balanceForm.paidLeaveTotal}
                    onChange={(e) =>
                      setBalanceForm({ ...balanceForm, paidLeaveTotal: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-emerald-200 rounded-lg text-slate-800"
                    required
                  />
                  <label className="block text-[11px] text-emerald-700 mt-2 mb-0.5">
                    Paid Leave Used
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={balanceForm.paidLeaveUsed}
                    onChange={(e) =>
                      setBalanceForm({ ...balanceForm, paidLeaveUsed: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-emerald-200 rounded-lg text-slate-800"
                    required
                  />
                </div>

                <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                  <label className="block text-xs font-bold text-rose-800 mb-1">
                    Sick Leave Total
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={balanceForm.sickLeaveTotal}
                    onChange={(e) =>
                      setBalanceForm({ ...balanceForm, sickLeaveTotal: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-200 rounded-lg text-slate-800"
                    required
                  />
                  <label className="block text-[11px] text-rose-700 mt-2 mb-0.5">
                    Sick Leave Used
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={balanceForm.sickLeaveUsed}
                    onChange={(e) =>
                      setBalanceForm({ ...balanceForm, sickLeaveUsed: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-200 rounded-lg text-slate-800"
                    required
                  />
                </div>

                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  <label className="block text-xs font-bold text-blue-800 mb-1">
                    Casual Leave Total
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={balanceForm.casualLeaveTotal}
                    onChange={(e) =>
                      setBalanceForm({ ...balanceForm, casualLeaveTotal: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-blue-200 rounded-lg text-slate-800"
                    required
                  />
                  <label className="block text-[11px] text-blue-700 mt-2 mb-0.5">
                    Casual Leave Used
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={balanceForm.casualLeaveUsed}
                    onChange={(e) =>
                      setBalanceForm({ ...balanceForm, casualLeaveUsed: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-blue-200 rounded-lg text-slate-800"
                    required
                  />
                </div>

                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                  <label className="block text-xs font-bold text-purple-800 mb-1">
                    Carry Forward Total
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={balanceForm.carryForwardTotal}
                    onChange={(e) =>
                      setBalanceForm({ ...balanceForm, carryForwardTotal: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-purple-200 rounded-lg text-slate-800"
                    required
                  />
                  <label className="block text-[11px] text-purple-700 mt-2 mb-0.5">
                    Carry Forward Used
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={balanceForm.carryForwardUsed}
                    onChange={(e) =>
                      setBalanceForm({ ...balanceForm, carryForwardUsed: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-purple-200 rounded-lg text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Admin Adjustment Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Special allocation, probation clearance adjustment..."
                  value={balanceForm.notes}
                  onChange={(e) => setBalanceForm({ ...balanceForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditBalanceModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateBalanceMutation.isPending}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {updateBalanceMutation.isPending ? 'Saving...' : 'Save Adjustments'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: ROLLOVER CARRY FORWARD
          ============================================================ */}
      {rolloverModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-xl border border-slate-200 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4 text-emerald-600">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <HiOutlineArrowPath className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Carry Forward Rollover</h3>
                <p className="text-xs text-slate-500">Roll over unused leaves to new year</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              This process inspects all employees' unused Paid and Casual leaves from the source year and rolls them over into their target year's carry-forward quota, capped at max carry-forward (
              <span className="font-bold text-slate-800">{policyData?.maxCarryForward || 10} days</span>).
            </p>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  From Year (Source)
                </label>
                <input
                  type="number"
                  value={rolloverFromYear}
                  onChange={(e) => setRolloverFromYear(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  To Year (Target)
                </label>
                <input
                  type="number"
                  value={rolloverToYear}
                  onChange={(e) => setRolloverToYear(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRolloverModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  rolloverMutation.mutate({
                    fromYear: rolloverFromYear,
                    toYear: rolloverToYear,
                  })
                }
                disabled={rolloverMutation.isPending}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {rolloverMutation.isPending ? 'Processing Rollover...' : 'Run Rollover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeaves;

