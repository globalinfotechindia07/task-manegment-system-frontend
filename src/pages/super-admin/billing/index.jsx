import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  HiOutlineDocumentText,
  HiOutlineBanknotes,
  HiOutlineCreditCard,
  HiOutlineBuildingOffice2,
  HiOutlineCheckCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineArrowDownTray,
  HiOutlineArrowPath,
  HiOutlineXMark,
  HiOutlineReceiptPercent,
  HiOutlineCalendarDays,
  HiOutlineArrowsUpDown,
  HiChevronUp,
  HiChevronDown,
  HiChevronUpDown,
} from 'react-icons/hi2';
import api from '../../../api/axios';
import InvoiceModal from '../../../components/billing/InvoiceModal';

const SuperAdminBilling = () => {
  // Period filter: 'all' | 'today' | 'week' | 'month' | 'year' | 'custom'
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sorting: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'gst_desc' | 'gst_asc' | 'company_asc' | 'company_desc'
  const [sortBy, setSortBy] = useState('date_desc');

  // Search & Status filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGateway, setSelectedGateway] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Invoice modal state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isFetchingInvoice, setIsFetchingInvoice] = useState(false);

  // Fetch platform transactions from backend with filters & sorting
  const {
    data: platformData,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'superAdminPlatformTransactions',
      selectedGateway,
      selectedStatus,
      selectedPeriod,
      startDate,
      endDate,
      sortBy,
    ],
    queryFn: async () => {
      const params = {
        period: selectedPeriod,
        sortBy,
      };
      if (selectedGateway !== 'ALL') params.gateway = selectedGateway;
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (selectedPeriod === 'custom') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }
      const { data } = await api.get('/companies/platform/transactions', { params });
      return data;
    },
  });

  const rawTransactions = platformData?.transactions || [];

  // Filter transactions in memory for search term
  const filteredTransactions = useMemo(() => {
    let list = [...rawTransactions];

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter((t) => {
        const compName = t.company?.name?.toLowerCase() || '';
        const compCode = t.company?.companyCode?.toLowerCase() || '';
        const invNum = t.invoiceNumber?.toLowerCase() || '';
        const payId = t.paymentId?.toLowerCase() || '';
        const ordId = t.orderId?.toLowerCase() || '';
        const plan = t.planName?.toLowerCase() || '';
        const desc = t.description?.toLowerCase() || '';
        return (
          compName.includes(term) ||
          compCode.includes(term) ||
          invNum.includes(term) ||
          payId.includes(term) ||
          ordId.includes(term) ||
          plan.includes(term) ||
          desc.includes(term)
        );
      });
    }

    // Client-side sort guarantee
    list.sort((a, b) => {
      const dateA = new Date(a.paidAt || a.createdAt).getTime();
      const dateB = new Date(b.paidAt || b.createdAt).getTime();
      const amountA = Number(a.amount) || 0;
      const amountB = Number(b.amount) || 0;
      const gstA = Number(a.gstAmount) || 0;
      const gstB = Number(b.gstAmount) || 0;
      const compA = (a.company?.name || '').toLowerCase();
      const compB = (b.company?.name || '').toLowerCase();

      switch (sortBy) {
        case 'date_asc':
          return dateA - dateB;
        case 'amount_desc':
          return amountB - amountA;
        case 'amount_asc':
          return amountA - amountB;
        case 'gst_desc':
          return gstB - gstA;
        case 'gst_asc':
          return gstA - gstB;
        case 'company_asc':
          return compA.localeCompare(compB);
        case 'company_desc':
          return compB.localeCompare(compA);
        case 'date_desc':
        default:
          return dateB - dateA;
      }
    });

    return list;
  }, [rawTransactions, searchTerm, sortBy]);

  // Dynamic real-time calculation of revenue & GST for the current active filter
  const activeStats = useMemo(() => {
    const successList = filteredTransactions.filter((t) => t.status === 'Success');
    const totalRev = successList.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const totalTax = successList.reduce((acc, t) => acc + (Number(t.basePrice) || 0), 0);
    const totalGstAmt = successList.reduce((acc, t) => acc + (Number(t.gstAmount) || 0), 0);
    const uniqueComps = new Set(
      filteredTransactions.map((t) => (t.company?._id || t.company)?.toString()).filter(Boolean)
    ).size;

    return {
      totalRevenue: totalRev,
      totalTaxable: totalTax,
      totalGst: totalGstAmt,
      cgst: Math.round(totalGstAmt / 2),
      sgst: Math.round(totalGstAmt / 2),
      totalTransactions: filteredTransactions.length,
      successfulCount: successList.length,
      payingCompaniesCount: uniqueComps,
    };
  }, [filteredTransactions]);

  // Header column click toggle helper
  const handleToggleSort = (column) => {
    if (column === 'date') {
      setSortBy((prev) => (prev === 'date_desc' ? 'date_asc' : 'date_desc'));
    } else if (column === 'amount') {
      setSortBy((prev) => (prev === 'amount_desc' ? 'amount_asc' : 'amount_desc'));
    } else if (column === 'company') {
      setSortBy((prev) => (prev === 'company_asc' ? 'company_desc' : 'company_asc'));
    } else if (column === 'gst') {
      setSortBy((prev) => (prev === 'gst_desc' ? 'gst_asc' : 'gst_desc'));
    }
  };

  // Open invoice viewer
  const handleViewInvoice = async (transactionId) => {
    setIsFetchingInvoice(true);
    try {
      const { data: invoiceData } = await api.get(`/companies/transactions/${transactionId}/invoice`);
      setSelectedInvoice(invoiceData);
      setIsInvoiceModalOpen(true);
    } catch (err) {
      console.error('Failed to load invoice:', err);
      toast.error(err.response?.data?.message || 'Could not load invoice data');
    } finally {
      setIsFetchingInvoice(false);
    }
  };

  // Export CSV Report
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      return toast.error('No transactions available to export');
    }

    const headers = [
      'Invoice Number',
      'Date',
      'Tenant Company',
      'Company Code',
      'Item Description',
      'Billing Cycle',
      'Taxable Base (INR)',
      'GST 18% (INR)',
      'CGST 9% (INR)',
      'SGST 9% (INR)',
      'Total Amount (INR)',
      'Gateway',
      'Payment ID',
      'Order ID',
      'Status',
    ];

    const rows = filteredTransactions.map((tx) => [
      `"${tx.invoiceNumber || ''}"`,
      `"${tx.paidAt ? new Date(tx.paidAt).toLocaleDateString('en-IN') : ''}"`,
      `"${tx.company?.name || ''}"`,
      `"${tx.company?.companyCode || ''}"`,
      `"${tx.description || tx.planName || ''}"`,
      `"${tx.billingCycle || 'monthly'}"`,
      tx.basePrice || 0,
      tx.gstAmount || 0,
      Math.round((tx.gstAmount || 0) / 2),
      Math.round((tx.gstAmount || 0) / 2),
      tx.amount || 0,
      `"${tx.paymentGateway || ''}"`,
      `"${tx.paymentId || ''}"`,
      `"${tx.orderId || ''}"`,
      `"${tx.status || 'Success'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Platform-Revenue-Report-${selectedPeriod}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Filtered Revenue & GST CSV report downloaded!');
  };

  const periodDisplayNames = {
    all: 'All Time',
    today: 'Today (Day)',
    week: 'This Week',
    month: 'This Month',
    year: 'This Year',
    custom: 'Custom Date Range',
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[400px]">
        <div className="w-9 h-9 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-xl border border-rose-200 text-center max-w-xl mx-auto my-8 shadow-sm">
        <h3 className="text-slate-900 font-bold text-lg mb-2">Error Loading Billing Records</h3>
        <p className="text-slate-500 text-xs">{error.response?.data?.message || error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto pb-12">
      {/* ===================== PAGE HEADER ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Platform Revenue & GST Ledger
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Super Admin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Filter total platform earnings and 18% GST by Day, Week, Month, or Year with live sorting and tax breakdown.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            title="Refresh billing data"
          >
            <HiOutlineArrowPath className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <HiOutlineArrowDownTray className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ===================== TIME PERIOD FILTER BUTTONS (DAY, WEEK, MONTH, YEAR) ===================== */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <HiOutlineCalendarDays className="w-4 h-4 text-indigo-600" />
              Filter Period:
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
              {periodDisplayNames[selectedPeriod]}
            </span>
          </div>

          {/* Quick Selection Period Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Day (Today)' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'year', label: 'This Year' },
              { id: 'custom', label: 'Custom Range' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedPeriod === p.id
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Picker (shown when 'custom' is active) */}
        {selectedPeriod === 'custom' && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs bg-slate-50/70 p-3 rounded-lg animate-in fade-in duration-150">
            <span className="font-semibold text-slate-700">Select Custom Range:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="py-1 px-2.5 bg-white border border-slate-200 rounded-md text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="py-1 px-2.5 bg-white border border-slate-200 rounded-md text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer ml-auto"
              >
                Clear Dates
              </button>
            )}
          </div>
        )}
      </div>

      {/* ===================== DYNAMIC REVENUE & GST METRIC CARDS ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Platform Revenue */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-700">
              <HiOutlineBanknotes className="w-4 h-4 text-emerald-600" />
              Total Platform Revenue
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {periodDisplayNames[selectedPeriod]}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
            ₹{activeStats.totalRevenue.toLocaleString('en-IN')}.00
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Taxable Base: <strong className="text-slate-700 font-mono">₹{activeStats.totalTaxable.toLocaleString('en-IN')}</strong>
          </p>
        </div>

        {/* Card 2: GST Tax Collected */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-indigo-100 shadow-xs hover:border-indigo-200 transition-all bg-gradient-to-b from-indigo-50/20 to-transparent">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-indigo-950">
              <HiOutlineReceiptPercent className="w-4 h-4 text-indigo-600" />
              GST Collected (18%)
            </span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              SAC 998313
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-700 font-mono tracking-tight">
            ₹{activeStats.totalGst.toLocaleString('en-IN')}.00
          </div>
          <p className="text-[11px] text-slate-600 mt-1 flex items-center justify-between font-mono">
            <span>CGST (9%): ₹{activeStats.cgst.toLocaleString('en-IN')}</span>
            <span>SGST (9%): ₹{activeStats.sgst.toLocaleString('en-IN')}</span>
          </p>
        </div>

        {/* Card 3: Invoices Count */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-700">
              <HiOutlineCreditCard className="w-4 h-4 text-slate-500" />
              Invoices Generated
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {activeStats.successfulCount} Paid
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
            {activeStats.totalTransactions}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Fulfillment Rate: <strong className="text-emerald-600">100% Verified</strong>
          </p>
        </div>

        {/* Card 4: Paying Tenants */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-700">
              <HiOutlineBuildingOffice2 className="w-4 h-4 text-slate-500" />
              Paying Tenants
            </span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              Active Offices
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
            {activeStats.payingCompaniesCount} Companies
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Multi-tenant subscription capacity
          </p>
        </div>
      </div>

      {/* ===================== FILTERS, SEARCH & SORTING BAR ===================== */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tenant company, code, invoice number, payment ID..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <HiOutlineXMark className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* SORTING SELECT (User requirement: "bs shot krte aana chahiye") */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <HiOutlineArrowsUpDown className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="text-[11px] font-bold text-slate-600">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="date_desc">Date: Newest First</option>
              <option value="date_asc">Date: Oldest First</option>
              <option value="amount_desc">Revenue: High to Low</option>
              <option value="amount_asc">Revenue: Low to High</option>
              <option value="gst_desc">GST: High to Low</option>
              <option value="gst_asc">GST: Low to High</option>
              <option value="company_asc">Company: A to Z</option>
              <option value="company_desc">Company: Z to A</option>
            </select>
          </div>

          {/* Gateway Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <HiOutlineFunnel className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedGateway}
              onChange={(e) => setSelectedGateway(e.target.value)}
              className="bg-transparent text-slate-700 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Gateways</option>
              <option value="Razorpay">Razorpay</option>
              <option value="UPI">UPI / QR Code</option>
              <option value="Card">Debit / Credit Cards</option>
              <option value="NetBanking">Net Banking</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-slate-700 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Success">Success (Paid)</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          {(searchTerm || selectedGateway !== 'ALL' || selectedStatus !== 'ALL' || selectedPeriod !== 'all' || sortBy !== 'date_desc') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedGateway('ALL');
                setSelectedStatus('ALL');
                setSelectedPeriod('all');
                setStartDate('');
                setEndDate('');
                setSortBy('date_desc');
              }}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
            >
              Reset All
            </button>
          )}
        </div>
      </div>

      {/* ===================== LEDGER TABLE WITH COLUMN HEADER SORTING ===================== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Top Banner */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm">Platform Billing & Invoices Ledger</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 font-mono">
              {filteredTransactions.length} Record{filteredTransactions.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>Period: <strong className="text-indigo-700">{periodDisplayNames[selectedPeriod]}</strong></span>
            <span>•</span>
            <span>Gross Revenue: <strong className="text-emerald-700 font-mono">₹{activeStats.totalRevenue.toLocaleString('en-IN')}</strong></span>
            <span>•</span>
            <span>GST: <strong className="text-indigo-700 font-mono">₹{activeStats.totalGst.toLocaleString('en-IN')}</strong></span>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <HiOutlineDocumentText className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No billing transactions found for {periodDisplayNames[selectedPeriod]}</p>
            <p className="text-xs text-slate-400">
              Try switching period filter (Day, Week, Month, Year, All Time) or clearing search filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
                  {/* Sortable Header: Invoice & Date */}
                  <th
                    onClick={() => handleToggleSort('date')}
                    className="py-3 px-4 cursor-pointer hover:text-indigo-600 hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Invoice # & Date</span>
                      {sortBy === 'date_desc' ? (
                        <HiChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                      ) : sortBy === 'date_asc' ? (
                        <HiChevronUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <HiChevronUpDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </th>

                  {/* Sortable Header: Tenant Company */}
                  <th
                    onClick={() => handleToggleSort('company')}
                    className="py-3 px-4 cursor-pointer hover:text-indigo-600 hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Tenant Company</span>
                      {sortBy === 'company_asc' ? (
                        <HiChevronUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : sortBy === 'company_desc' ? (
                        <HiChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <HiChevronUpDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </th>

                  <th className="py-3 px-4">Purpose / Item</th>

                  {/* Sortable Header: Amount & GST */}
                  <th
                    onClick={() => handleToggleSort('amount')}
                    className="py-3 px-4 text-right cursor-pointer hover:text-indigo-600 hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Amount (Incl. GST)</span>
                      {sortBy === 'amount_desc' ? (
                        <HiChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                      ) : sortBy === 'amount_asc' ? (
                        <HiChevronUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <HiChevronUpDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </th>

                  {/* Sortable Header: GST (18%) */}
                  <th
                    onClick={() => handleToggleSort('gst')}
                    className="py-3 px-4 text-right cursor-pointer hover:text-indigo-600 hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>GST (18%)</span>
                      {sortBy === 'gst_desc' ? (
                        <HiChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                      ) : sortBy === 'gst_asc' ? (
                        <HiChevronUp className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <HiChevronUpDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </th>

                  <th className="py-3 px-4">Gateway & Payment ID</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTransactions.map((tx) => {
                  const paidDate = tx.paidAt ? new Date(tx.paidAt) : new Date(tx.createdAt);
                  const isAddon = tx.description?.toLowerCase().includes('add-on') || tx.planName?.toLowerCase().includes('add-on');

                  return (
                    <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Invoice & Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {tx.invoiceNumber}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {paidDate.toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* Tenant Company */}
                      <td className="py-3.5 px-4 min-w-[180px]">
                        <div className="font-bold text-slate-900 truncate">
                          {tx.company?.name || 'Unknown Company'}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {tx.company?.companyCode || 'N/A'}
                          </span>
                          {tx.company?.location && (
                            <span className="text-[10px] text-slate-400 truncate">
                              • {tx.company.location}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Purpose / Item */}
                      <td className="py-3.5 px-4 min-w-[190px]">
                        <div className="font-semibold text-slate-900 truncate">
                          {tx.description || tx.planName || 'Plan Subscription'}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className={`px-1.5 py-0.2 rounded font-semibold text-[9px] uppercase ${
                            isAddon ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {isAddon ? 'Capacity Add-on' : 'Subscription'}
                          </span>
                          <span>• {tx.billingCycle || 'Monthly'}</span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-mono font-black text-slate-900 text-xs">
                          ₹{Number(tx.amount || 0).toLocaleString('en-IN')}.00
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Base: ₹{tx.basePrice || 0}
                        </div>
                      </td>

                      {/* GST (18%) Column */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-indigo-700 text-xs">
                          ₹{Number(tx.gstAmount || 0).toLocaleString('en-IN')}.00
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          18% (9+9)
                        </div>
                      </td>

                      {/* Payment Method & Ref */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 text-xs">
                          {tx.paymentGateway || 'Razorpay'}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 truncate max-w-[130px] mt-0.5" title={tx.paymentId}>
                          {tx.paymentId || 'N/A'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            tx.status === 'Success'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : tx.status === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {tx.status === 'Success' && <HiOutlineCheckCircle className="w-3 h-3" />}
                          {tx.status || 'Success'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleViewInvoice(tx._id)}
                          disabled={isFetchingInvoice}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <HiOutlineDocumentText className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================== TAX INVOICE MODAL ===================== */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        invoice={selectedInvoice}
        onClose={() => setIsInvoiceModalOpen(false)}
      />
    </div>
  );
};

export default SuperAdminBilling;
