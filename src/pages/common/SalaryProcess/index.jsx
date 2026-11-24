import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';
import {
  HiOutlineBanknotes,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlinePauseCircle,
  HiOutlineExclamationCircle,
  HiOutlineCalendarDays,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowPath,
  HiOutlineArrowDownTray,
  HiOutlineEnvelope,
  HiOutlineEye,
  HiOutlinePencilSquare,
  HiOutlineXMark,
  HiOutlinePrinter,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineBuildingOffice2,
  HiOutlineCurrencyRupee,
  HiOutlineCreditCard,
  HiOutlineDocumentText,
  HiOutlineSparkles,
  HiOutlineUsers,
  HiOutlineArrowRight,
  HiOutlineCheck,
} from 'react-icons/hi2';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Helper to convert number to Indian Currency words (e.g. "Fifty Thousand Rupees Only")
const numberToWords = (num) => {
  if (!num || isNaN(num) || num <= 0) return 'Zero Rupees Only';
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen ',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if ((n = n.toString()).length > 9) return 'Overflow';
    const n_array = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n_array) return '';
    let str = '';
    str += Number(n_array[1]) !== 0 ? (a[Number(n_array[1])] || b[n_array[1][0]] + ' ' + a[n_array[1][1]]) + 'Crore ' : '';
    str += Number(n_array[2]) !== 0 ? (a[Number(n_array[2])] || b[n_array[2][0]] + ' ' + a[n_array[2][1]]) + 'Lakh ' : '';
    str += Number(n_array[3]) !== 0 ? (a[Number(n_array[3])] || b[n_array[3][0]] + ' ' + a[n_array[3][1]]) + 'Thousand ' : '';
    str += Number(n_array[4]) !== 0 ? (a[Number(n_array[4])] || b[n_array[4][0]] + ' ' + a[n_array[4][1]]) + 'Hundred ' : '';
    str += Number(n_array[5]) !== 0 ? ((str !== '' ? 'and ' : '') + (a[Number(n_array[5])] || b[n_array[5][0]] + ' ' + a[n_array[5][1]])) : '';
    return str.trim();
  };

  const words = inWords(Math.round(num));
  return `Rupees ${words} Only`;
};

const SalaryProcess = () => {
  const queryClient = useQueryClient();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selection for bulk operations
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Modals
  const [activeUpdateRecord, setActiveUpdateRecord] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [activeSlipPreview, setActiveSlipPreview] = useState(null);

  // Single Update Form State
  const [updateFormData, setUpdateFormData] = useState({
    status: 'Paid',
    paymentMode: 'Bank Transfer',
    paymentDate: new Date().toISOString().split('T')[0],
    transactionRef: '',
    remarks: '',
    sendEmailNotice: true,
  });

  // Bulk Update Form State
  const [bulkFormData, setBulkFormData] = useState({
    status: 'Paid',
    paymentMode: 'Bank Transfer',
    paymentDate: new Date().toISOString().split('T')[0],
    transactionRef: '',
    remarks: '',
  });

  // Query: Salary Process List
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['salaryProcessList', selectedMonth, selectedYear, statusFilter, departmentFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        month: selectedMonth,
        year: selectedYear,
        status: statusFilter,
        department: departmentFilter,
        search: searchQuery,
      });
      const res = await api.get(`/payroll/process-status?${params.toString()}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  // Query: Company Letterhead for Slip Preview
  const { data: companyLetterheadData } = useQuery({
    queryKey: ['companyLetterhead'],
    queryFn: async () => {
      try {
        const res = await api.get('/companies/letterhead');
        return res.data;
      } catch (err) {
        return null;
      }
    },
  });

  const records = data?.records || [];
  const summary = data?.summary || {
    totalEmployees: 0,
    totalPayrollAmount: 0,
    paidCount: 0,
    paidAmount: 0,
    inProcessCount: 0,
    inProcessAmount: 0,
    pendingCount: 0,
    pendingAmount: 0,
    onHoldCount: 0,
    onHoldAmount: 0,
  };
  const departments = data?.departments || [];

  // Mutation: Single Update Status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, payload }) => {
      const res = await api.patch(`/payroll/process-status/${userId}`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Salary status updated successfully');
      queryClient.invalidateQueries(['salaryProcessList']);
      setActiveUpdateRecord(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update salary status');
    },
  });

  // Mutation: Bulk Update Status
  const bulkUpdateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/payroll/bulk-process-status', payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || `Successfully updated ${data.count} employees`);
      queryClient.invalidateQueries(['salaryProcessList']);
      setShowBulkModal(false);
      setSelectedUserIds([]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to bulk update salary status');
    },
  });

  // Mutation: Send Slip Email
  const sendEmailMutation = useMutation({
    mutationFn: async (slipId) => {
      const res = await api.post(`/payroll/send-slip-email/${slipId}`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Salary slip email sent successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send salary slip email');
    },
  });

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
    setSelectedUserIds([]);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
    setSelectedUserIds([]);
  };

  const handleResetToCurrent = () => {
    setSelectedMonth(currentDate.getMonth() + 1);
    setSelectedYear(currentDate.getFullYear());
    setSelectedUserIds([]);
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUserIds(records.map((r) => r.user._id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleToggleSelect = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Open single update modal
  const handleOpenUpdateModal = (record) => {
    setActiveUpdateRecord(record);
    const slip = record.salarySlip;
    setUpdateFormData({
      status: record.status || 'Paid',
      paymentMode: slip?.paymentMode || 'Bank Transfer',
      paymentDate: slip?.paymentDate
        ? new Date(slip.paymentDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      transactionRef: slip?.transactionRef || '',
      remarks: slip?.remarks || '',
      sendEmailNotice: record.status !== 'Paid',
    });
  };

  // Handle single update submit
  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    if (!activeUpdateRecord) return;
    updateStatusMutation.mutate({
      userId: activeUpdateRecord.user._id,
      payload: {
        month: selectedMonth,
        year: selectedYear,
        ...updateFormData,
      },
    });
  };

  // Handle bulk submit
  const handleBulkSubmit = (e) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) return;
    bulkUpdateMutation.mutate({
      userIds: selectedUserIds,
      month: selectedMonth,
      year: selectedYear,
      ...bulkFormData,
    });
  };

  // Quick mark selected as In Process
  const handleQuickMarkInProcess = () => {
    if (selectedUserIds.length === 0) return;
    bulkUpdateMutation.mutate({
      userIds: selectedUserIds,
      month: selectedMonth,
      year: selectedYear,
      status: 'In Process',
      remarks: 'Bulk marked in process for banking disbursement',
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!records || records.length === 0) {
      toast.error('No salary records available to export');
      return;
    }

    const headers = [
      'Employee Name',
      'Email',
      'Department',
      'Designation',
      'Month',
      'Year',
      'Gross Earnings (₹)',
      'Total Deductions (₹)',
      'Net Pay (₹)',
      'Status',
      'Payment Mode',
      'Payment Date',
      'Transaction Ref / UTR',
      'Remarks',
    ];

    const rows = records.map((r) => [
      `"${r.user.name || ''}"`,
      `"${r.user.email || ''}"`,
      `"${r.user.department || ''}"`,
      `"${r.user.designation || ''}"`,
      MONTH_NAMES[selectedMonth - 1],
      selectedYear,
      r.grossEarnings || 0,
      r.totalDeductions || 0,
      r.netPay || 0,
      r.status,
      `"${r.paymentMode || ''}"`,
      r.paymentDate ? new Date(r.paymentDate).toLocaleDateString('en-IN') : '',
      `"${r.transactionRef || ''}"`,
      `"${r.remarks || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Salary_Process_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Disbursement sheet downloaded as CSV');
  };

  const getFullImgUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('blob:') || path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    return `${API_BASE_URL.replace(/\/api\/?$/, '')}${path}`;
  };

  const letterheadSettings =
    activeSlipPreview?.company?.letterhead || companyLetterheadData?.letterhead || {};
  const activeLetterheadUrl = letterheadSettings.url ? getFullImgUrl(letterheadSettings.url) : '';
  const activeSignatureUrl = letterheadSettings.signatureUrl ? getFullImgUrl(letterheadSettings.signatureUrl) : '';
  const activeSealUrl = letterheadSettings.sealUrl ? getFullImgUrl(letterheadSettings.sealUrl) : '';

  // Calculate selected total net pay
  const selectedTotalNet = useMemo(() => {
    return records
      .filter((r) => selectedUserIds.includes(r.user._id))
      .reduce((acc, curr) => acc + (curr.netPay || 0), 0);
  }, [records, selectedUserIds]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4">
      {/* ===================== PAGE HEADER & MONTH PICKER ===================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <HiOutlineBanknotes className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Salary Process & Status
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  Admin & Accountant
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Track, process, and disburse employee salaries with bank references and instant slips.
              </p>
            </div>
          </div>
        </div>

        {/* Month & Year Navigation Toolbar */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-slate-700">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition shadow-2xs"
              title="Previous Month"
            >
              <HiOutlineChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center px-3 py-1 gap-1 text-sm font-bold text-slate-800">
              <HiOutlineCalendarDays className="w-4 h-4 text-indigo-600" />
              <span>{MONTH_NAMES[selectedMonth - 1]}</span>
              <span className="text-indigo-600">{selectedYear}</span>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition shadow-2xs"
              title="Next Month"
            >
              <HiOutlineChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleResetToCurrent}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
          >
            Current Month
          </button>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition"
            title="Refresh Data"
          >
            <HiOutlineArrowPath className={`w-4 h-4 ${isFetching ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
            title="Download Excel / CSV Disbursement Sheet"
          >
            <HiOutlineArrowDownTray className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ===================== SUMMARY STAT METRIC CARDS ===================== */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Payroll */}
        <div className="bg-gradient-to-br from-indigo-50/70 to-white p-4 rounded-2xl border border-indigo-100 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-indigo-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Net Payroll</span>
            <HiOutlineBanknotes className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            ₹{summary.totalPayrollAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <HiOutlineUsers className="w-3.5 h-3.5 text-slate-400" />
            <span>{summary.totalEmployees} Employees Total</span>
          </div>
        </div>

        {/* Paid / Disbursed */}
        <div className="bg-gradient-to-br from-emerald-50/70 to-white p-4 rounded-2xl border border-emerald-100 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Paid / Disbursed</span>
            <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
            ₹{summary.paidAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            {summary.paidCount} / {summary.totalEmployees} Paid ({summary.totalEmployees > 0 ? Math.round((summary.paidCount / summary.totalEmployees) * 100) : 0}%)
          </div>
        </div>

        {/* In Process */}
        <div className="bg-gradient-to-br from-sky-50/70 to-white p-4 rounded-2xl border border-sky-100 shadow-2xs">
          <div className="flex items-center justify-between text-sky-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-800">In Process</span>
            <HiOutlineClock className="w-5 h-5 text-sky-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-700 font-mono">
            ₹{summary.inProcessAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-sky-600 font-semibold mt-1">
            {summary.inProcessCount} Employees in Pipeline
          </div>
        </div>

        {/* Pending */}
        <div className="bg-gradient-to-br from-amber-50/70 to-white p-4 rounded-2xl border border-amber-100 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Pending</span>
            <HiOutlineExclamationCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 font-mono">
            ₹{summary.pendingAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-amber-600 font-semibold mt-1">
            {summary.pendingCount} Employees Unpaid
          </div>
        </div>

        {/* On Hold */}
        <div className="bg-gradient-to-br from-rose-50/70 to-white p-4 rounded-2xl border border-rose-100 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">On Hold</span>
            <HiOutlinePauseCircle className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-700 font-mono">
            ₹{summary.onHoldAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-rose-600 font-semibold mt-1">
            {summary.onHoldCount} Employees Paused
          </div>
        </div>
      </div>

      {/* ===================== FILTERS & BULK ACTIONS BAR ===================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'All', label: 'All', count: summary.totalEmployees, color: 'slate' },
              { id: 'Paid', label: 'Paid', count: summary.paidCount, color: 'emerald' },
              { id: 'In Process', label: 'In Process', count: summary.inProcessCount, color: 'sky' },
              { id: 'Pending', label: 'Pending', count: summary.pendingCount, color: 'amber' },
              { id: 'On Hold', label: 'On Hold', count: summary.onHoldCount, color: 'rose' },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setSelectedUserIds([]);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      active ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Department Filter & Search */}
          <div className="flex items-center gap-2">
            {departments.length > 0 && (
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setSelectedUserIds([]);
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}

            <div className="relative flex-1 sm:w-64">
              <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, email, UTR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Bulk Action Floating Bar */}
        {selectedUserIds.length > 0 && (
          <div className="flex items-center justify-between flex-wrap gap-2 p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                {selectedUserIds.length}
              </span>
              <span className="text-xs font-bold text-indigo-900">
                Employees Selected
              </span>
              <span className="text-xs text-indigo-700 font-mono">
                (Total Net: ₹{selectedTotalNet.toLocaleString('en-IN')})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleQuickMarkInProcess}
                disabled={bulkUpdateMutation.isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-sky-700 border border-sky-300 hover:bg-sky-50 transition cursor-pointer shadow-2xs"
              >
                <HiOutlineClock className="w-4 h-4 text-sky-600" />
                <span>Mark as In Process</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBulkModal(true)}
                disabled={bulkUpdateMutation.isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer shadow-2xs"
              >
                <HiOutlineCheckCircle className="w-4 h-4" />
                <span>Bulk Disburse / Mark Paid</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedUserIds([])}
                className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1"
              >
                Deselect All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===================== EMPLOYEES SALARY TABLE ===================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <HiOutlineArrowPath className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
            <p className="text-sm font-semibold">Loading salary process records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <HiOutlineBanknotes className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Employee Salary Records Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              No employee matches the selected month, status filter, or search term.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.length === records.length && records.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department & Role</th>
                  <th className="py-3 px-4 text-right">Gross Earnings</th>
                  <th className="py-3 px-4 text-right">Deductions</th>
                  <th className="py-3 px-4 text-right">Net Payable</th>
                  <th className="py-3 px-4 text-center">Salary Status</th>
                  <th className="py-3 px-4">Payment Details & UTR</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {records.map((r) => {
                  const isSelected = selectedUserIds.includes(r.user._id);
                  const isPaid = r.status === 'Paid';
                  const isInProcess = r.status === 'In Process';
                  const isOnHold = r.status === 'On Hold';
                  const isPending = !isPaid && !isInProcess && !isOnHold;

                  return (
                    <tr
                      key={r.user._id}
                      className={`hover:bg-slate-50/70 transition ${isSelected ? 'bg-indigo-50/30' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(r.user._id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Employee Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                            {r.user.avatar ? (
                              <img
                                src={getFullImgUrl(r.user.avatar)}
                                alt={r.user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              r.user.name?.charAt(0)?.toUpperCase() || 'U'
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{r.user.name}</p>
                            <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{r.user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Department & Role */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {r.user.department || 'General'}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">{r.user.designation || 'Staff'}</p>
                      </td>

                      {/* Gross Earnings */}
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">
                        ₹{(r.grossEarnings || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Deductions */}
                      <td className="py-3 px-4 text-right font-mono font-medium text-rose-600">
                        {r.totalDeductions > 0 ? `-₹${r.totalDeductions.toLocaleString('en-IN')}` : '₹0'}
                      </td>

                      {/* Net Payable */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-black font-mono text-emerald-700 bg-emerald-50/70 px-2 py-1 rounded-lg border border-emerald-200">
                          ₹{(r.netPay || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 text-center">
                        {isPaid && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <HiOutlineCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Paid</span>
                          </span>
                        )}
                        {isInProcess && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
                            <HiOutlineClock className="w-3.5 h-3.5 text-sky-600" />
                            <span>In Process</span>
                          </span>
                        )}
                        {isOnHold && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <HiOutlinePauseCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>On Hold</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <HiOutlineExclamationCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      {/* Payment Details / UTR */}
                      <td className="py-3 px-4">
                        {isPaid ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 font-semibold text-slate-800">
                              <HiOutlineCreditCard className="w-3.5 h-3.5 text-slate-400" />
                              <span>{r.paymentMode || 'Bank Transfer'}</span>
                              {r.paymentDate && (
                                <span className="text-[10px] text-slate-500 font-normal">
                                  ({new Date(r.paymentDate).toLocaleDateString('en-IN')})
                                </span>
                              )}
                            </div>
                            {r.transactionRef && (
                              <p className="text-[10px] font-mono text-slate-500 truncate max-w-[160px]" title={r.transactionRef}>
                                Ref: {r.transactionRef}
                              </p>
                            )}
                          </div>
                        ) : isInProcess ? (
                          <span className="text-[11px] text-sky-700 italic">Processing with accounts</span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Awaiting disbursement</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Update Status / Record Payment */}
                          <button
                            type="button"
                            onClick={() => handleOpenUpdateModal(r)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition cursor-pointer"
                            title="Update Status / Record Payment"
                          >
                            <HiOutlinePencilSquare className="w-4 h-4" />
                          </button>

                          {/* View Payslip */}
                          <button
                            type="button"
                            onClick={() => setActiveSlipPreview(r)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition cursor-pointer"
                            title="View / Print Salary Slip"
                          >
                            <HiOutlineEye className="w-4 h-4" />
                          </button>

                          {/* Send Email */}
                          {r.salarySlip?._id && (
                            <button
                              type="button"
                              onClick={() => sendEmailMutation.mutate(r.salarySlip._id)}
                              disabled={sendEmailMutation.isLoading}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-sky-600 hover:bg-sky-50 hover:border-sky-200 transition cursor-pointer"
                              title="Send Salary Slip via Email"
                            >
                              <HiOutlineEnvelope className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================== SINGLE STATUS / PAYMENT MODAL ===================== */}
      {activeUpdateRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <HiOutlineBanknotes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Salary Process: {activeUpdateRecord.user.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Month: {MONTH_NAMES[selectedMonth - 1]} {selectedYear} • Net Pay: ₹{(activeUpdateRecord.netPay || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveUpdateRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleUpdateSubmit} className="p-5 space-y-4">
              {/* Status Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Salary Disbursement Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { val: 'Paid', label: 'Paid', color: 'emerald' },
                    { val: 'In Process', label: 'In Process', color: 'sky' },
                    { val: 'Pending', label: 'Pending', color: 'amber' },
                    { val: 'On Hold', label: 'On Hold', color: 'rose' },
                  ].map((s) => {
                    const isSelected = updateFormData.status === s.val;
                    return (
                      <button
                        type="button"
                        key={s.val}
                        onClick={() => setUpdateFormData({ ...updateFormData, status: s.val })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Details (Visible when Paid or In Process) */}
              {updateFormData.status === 'Paid' && (
                <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Payment Mode
                      </label>
                      <select
                        value={updateFormData.paymentMode}
                        onChange={(e) => setUpdateFormData({ ...updateFormData, paymentMode: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                      >
                        <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                        <option value="UPI / IMPS">UPI / IMPS Instant</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Cash">Cash</option>
                        <option value="Other">Other Gateway</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Disbursement Date
                      </label>
                      <input
                        type="date"
                        value={updateFormData.paymentDate}
                        onChange={(e) => setUpdateFormData({ ...updateFormData, paymentDate: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Bank Transaction Ref / UTR / Cheque Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UTR123456789 or CHQ-998822"
                      value={updateFormData.transactionRef}
                      onChange={(e) => setUpdateFormData({ ...updateFormData, transactionRef: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Accounting Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional note for finance records..."
                  value={updateFormData.remarks}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Send email notification */}
              {updateFormData.status === 'Paid' && (
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={updateFormData.sendEmailNotice}
                    onChange={(e) => setUpdateFormData({ ...updateFormData, sendEmailNotice: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-600 font-medium">
                    Send official Salary Slip email notification to employee now
                  </span>
                </label>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveUpdateRecord(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateStatusMutation.isLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-2xs flex items-center gap-1.5"
                >
                  {updateStatusMutation.isLoading ? (
                    <>
                      <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <HiOutlineCheck className="w-4 h-4" />
                      <span>Save Status</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== BULK DISBURSEMENT MODAL ===================== */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <HiOutlineCheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Bulk Salary Disbursement
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedUserIds.length} employees selected • Total Net: ₹{selectedTotalNet.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleBulkSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Update Status To
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Paid', 'In Process', 'On Hold'].map((st) => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setBulkFormData({ ...bulkFormData, status: st })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center ${
                        bulkFormData.status === st
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {bulkFormData.status === 'Paid' && (
                <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Payment Mode
                      </label>
                      <select
                        value={bulkFormData.paymentMode}
                        onChange={(e) => setBulkFormData({ ...bulkFormData, paymentMode: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
                      >
                        <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                        <option value="UPI / IMPS">UPI / IMPS</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Cash">Cash</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Payment Date
                      </label>
                      <input
                        type="date"
                        value={bulkFormData.paymentDate}
                        onChange={(e) => setBulkFormData({ ...bulkFormData, paymentDate: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Batch Ref / Transaction Prefix
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BATCH-SALARY-NOV2026"
                      value={bulkFormData.transactionRef}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, transactionRef: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Common Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional bulk remarks..."
                  value={bulkFormData.remarks}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkUpdateMutation.isLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-2xs flex items-center gap-1.5"
                >
                  {bulkUpdateMutation.isLoading ? (
                    <>
                      <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                      <span>Applying...</span>
                    </>
                  ) : (
                    <>
                      <HiOutlineCheck className="w-4 h-4" />
                      <span>Apply to {selectedUserIds.length} Staff</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== VIEW OFFICIAL PAYSLIP MODAL ===================== */}
      {activeSlipPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
            {/* Modal Actions Bar (Not Printed) */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 print:hidden">
              <div className="flex items-center gap-2">
                <HiOutlineDocumentText className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-sm text-slate-900">
                  Official Salary Slip Preview • {activeSlipPreview.user.name} ({MONTH_NAMES[selectedMonth - 1]} {selectedYear})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-2xs"
                >
                  <HiOutlinePrinter className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setActiveSlipPreview(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Payslip Body */}
            <div className="p-6 sm:p-8 space-y-6 text-slate-800 bg-white">
              {/* Header with Letterhead or Generic */}
              {activeLetterheadUrl ? (
                <div className="w-full border-b border-slate-200 pb-4 mb-4 text-center">
                  <img
                    src={activeLetterheadUrl}
                    alt="Company Letterhead"
                    className="max-h-24 mx-auto object-contain"
                  />
                </div>
              ) : (
                <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      PAYSLIP FOR {MONTH_NAMES[selectedMonth - 1].toUpperCase()} {selectedYear}
                    </h2>
                    <p className="text-xs text-slate-500">Official Monthly Salary Statement & Disbursement Voucher</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        activeSlipPreview.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : activeSlipPreview.status === 'In Process'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {activeSlipPreview.status}
                    </span>
                  </div>
                </div>
              )}

              {/* Employee & Bank Info */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px] mb-0.5">Employee Name</p>
                  <p className="font-bold text-slate-900 text-sm">{activeSlipPreview.user.name}</p>
                  <p className="text-slate-500 mt-1">Email: {activeSlipPreview.user.email}</p>
                  <p className="text-slate-500">Designation: {activeSlipPreview.user.designation || 'Staff'}</p>
                  <p className="text-slate-500">Department: {activeSlipPreview.user.department || 'General'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px] mb-0.5">Disbursement Details</p>
                  <p className="font-bold text-slate-900">
                    Mode: {activeSlipPreview.paymentMode || 'Bank Transfer'}
                  </p>
                  {activeSlipPreview.paymentDate && (
                    <p className="text-slate-500 mt-1">
                      Date: {new Date(activeSlipPreview.paymentDate).toLocaleDateString('en-IN')}
                    </p>
                  )}
                  {activeSlipPreview.transactionRef && (
                    <p className="text-slate-500 font-mono">
                      Ref/UTR: {activeSlipPreview.transactionRef}
                    </p>
                  )}
                  {activeSlipPreview.remarks && (
                    <p className="text-slate-500 italic mt-0.5">Note: {activeSlipPreview.remarks}</p>
                  )}
                </div>
              </div>

              {/* Earnings & Deductions Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Earnings */}
                <div className="border border-emerald-200 rounded-xl overflow-hidden">
                  <div className="bg-emerald-100 px-4 py-2 font-bold text-emerald-900 flex justify-between">
                    <span>Earnings (Credits)</span>
                    <span>Amount (₹)</span>
                  </div>
                  <div className="p-3 space-y-1.5">
                    {activeSlipPreview.salarySlip?.earnings ? (
                      <>
                        {activeSlipPreview.salarySlip.earnings.basic > 0 && (
                          <div className="flex justify-between">
                            <span>Basic Salary</span>
                            <span className="font-mono">₹{activeSlipPreview.salarySlip.earnings.basic.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {activeSlipPreview.salarySlip.earnings.hra > 0 && (
                          <div className="flex justify-between">
                            <span>HRA</span>
                            <span className="font-mono">₹{activeSlipPreview.salarySlip.earnings.hra.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {activeSlipPreview.salarySlip.earnings.splAllowance > 0 && (
                          <div className="flex justify-between">
                            <span>Special Allowance</span>
                            <span className="font-mono">₹{activeSlipPreview.salarySlip.earnings.splAllowance.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {activeSlipPreview.salarySlip.earnings.exGratia > 0 && (
                          <div className="flex justify-between">
                            <span>Ex-Gratia</span>
                            <span className="font-mono">₹{activeSlipPreview.salarySlip.earnings.exGratia.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {Array.isArray(activeSlipPreview.salarySlip.dynamicEarnings) &&
                          activeSlipPreview.salarySlip.dynamicEarnings.map((de, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>{de.name}</span>
                              <span className="font-mono">₹{(de.amount || 0).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                      </>
                    ) : (
                      <div className="flex justify-between">
                        <span>Standard Fixed Monthly Pay</span>
                        <span className="font-mono">₹{(activeSlipPreview.grossEarnings || 0).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-emerald-200 flex justify-between font-bold text-emerald-900 text-sm">
                      <span>Total Gross Earnings</span>
                      <span className="font-mono">₹{(activeSlipPreview.grossEarnings || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="border border-rose-200 rounded-xl overflow-hidden">
                  <div className="bg-rose-100 px-4 py-2 font-bold text-rose-900 flex justify-between">
                    <span>Deductions (Debits)</span>
                    <span>Amount (₹)</span>
                  </div>
                  <div className="p-3 space-y-1.5">
                    {activeSlipPreview.salarySlip?.deductions ? (
                      <>
                        {activeSlipPreview.salarySlip.deductions.pf > 0 && (
                          <div className="flex justify-between text-rose-600">
                            <span>Provident Fund (PF)</span>
                            <span className="font-mono">-₹{activeSlipPreview.salarySlip.deductions.pf.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {activeSlipPreview.salarySlip.deductions.esic > 0 && (
                          <div className="flex justify-between text-rose-600">
                            <span>ESIC</span>
                            <span className="font-mono">-₹{activeSlipPreview.salarySlip.deductions.esic.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {activeSlipPreview.salarySlip.deductions.professionalTax > 0 && (
                          <div className="flex justify-between text-rose-600">
                            <span>Professional Tax (PT)</span>
                            <span className="font-mono">-₹{activeSlipPreview.salarySlip.deductions.professionalTax.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {activeSlipPreview.salarySlip.deductions.lateMarkDeduction > 0 && (
                          <div className="flex justify-between text-rose-600">
                            <span>Late Mark / Unapproved Leaves</span>
                            <span className="font-mono">-₹{activeSlipPreview.salarySlip.deductions.lateMarkDeduction.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-slate-400 italic">No deductions recorded</div>
                    )}
                    <div className="pt-2 border-t border-rose-200 flex justify-between font-bold text-rose-900 text-sm">
                      <span>Total Deductions</span>
                      <span className="font-mono">-₹{(activeSlipPreview.totalDeductions || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Payable Highlight */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Net Salary Payable</p>
                  <p className="text-xs text-slate-300 italic mt-0.5">{numberToWords(activeSlipPreview.netPay || 0)}</p>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-400">
                  ₹{(activeSlipPreview.netPay || 0).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Signatures / Seals */}
              <div className="flex items-end justify-between pt-6 border-t border-slate-200 text-xs text-slate-500">
                <div>
                  <p className="font-semibold text-slate-700">Employee Signature</p>
                  <div className="h-10 mt-2 border-b border-dashed border-slate-300 w-36" />
                </div>

                <div className="text-right">
                  {activeSealUrl && (
                    <img src={activeSealUrl} alt="Seal" className="max-h-16 inline-block mb-1 opacity-90" />
                  )}
                  {activeSignatureUrl && (
                    <img src={activeSignatureUrl} alt="Signature" className="max-h-12 inline-block mb-1" />
                  )}
                  <p className="font-semibold text-slate-700">Authorized Signatory / Accountant</p>
                  <p className="text-[10px] text-slate-400">System Generated Disbursement Slip</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryProcess;
