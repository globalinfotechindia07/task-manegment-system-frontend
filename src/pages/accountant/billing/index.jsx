import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  HiOutlineBanknotes,
  HiOutlineDocumentText,
  HiOutlineClipboardDocumentList,
  HiOutlineDocumentChartBar,
  HiOutlineSquares2X2,
  HiOutlinePlus,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineArrowPath,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlinePrinter,
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiOutlineCurrencyRupee,
  HiOutlineCreditCard,
  HiOutlineBuildingOffice2,
  HiOutlineUser,
  HiOutlineBookOpen,
} from 'react-icons/hi2';
import api from '../../../api/axios';
import toast from 'react-hot-toast';

const formatCurrency = (amount = 0, currency = 'INR') => {
  const num = Number(amount) || 0;
  if (currency === 'INR') {
    return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  }
  if (currency === 'USD') {
    return `$${num.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  }
  return `${currency} ${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'Paid':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <HiOutlineCheckCircle className="w-3.5 h-3.5" />
          Paid
        </span>
      );
    case 'Partially Paid':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
          <HiOutlineClock className="w-3.5 h-3.5" />
          Partially Paid
        </span>
      );
    case 'Overdue':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <HiOutlineExclamationCircle className="w-3.5 h-3.5" />
          Overdue
        </span>
      );
    case 'Draft':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
          Draft
        </span>
      );
    case 'Cancelled':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500 line-through">
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <HiOutlineClock className="w-3.5 h-3.5" />
          Pending
        </span>
      );
  }
};

const AccountantBilling = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab: 'dashboard' | 'invoices' | 'payments' | 'ledger' | 'gst'
  const activeTab = searchParams.get('tab') || 'dashboard';
  const setActiveTab = (tab) => setSearchParams({ tab });

  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Ledger Client Selector
  const [selectedLedgerClient, setSelectedLedgerClient] = useState('');

  // Modals state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [viewInvoiceModal, setViewInvoiceModal] = useState(null);
  const [viewPaymentModal, setViewPaymentModal] = useState(null);

  // Form state: Create Invoice
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: '',
    invoiceType: 'Tax Invoice',
    clientId: '',
    clientName: '',
    clientCompany: '',
    clientEmail: '',
    clientPhone: '',
    clientGstin: '',
    clientAddress: { street: '', city: '', state: '', postalCode: '', country: 'India' },
    projectId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    currency: 'INR',
    isInterstate: false,
    discount: 0,
    items: [
      {
        description: 'Software Architecture & Development Services',
        sacHsnCode: '998314',
        quantity: 1,
        unit: 'Milestone',
        rate: 50000,
        gstRate: 18,
      },
    ],
    bankDetails: {
      bankName: 'HDFC Bank Ltd',
      accountName: 'Tech Innovations Pvt Ltd',
      accountNumber: '50200012345678',
      ifscCode: 'HDFC0000123',
      branchName: 'Main Branch',
      upiId: 'techinnovations@hdfcbank',
    },
    termsAndConditions: '1. Please remit payment by the due date.\n2. In case of delay, 18% p.a. interest applicable.\n3. Make NEFT/RTGS to the bank account specified above.',
    notes: 'Thank you for your business. We appreciate your prompt payment.',
  });

  // Form state: Record Payment
  const [paymentForm, setPaymentForm] = useState({
    invoiceId: '',
    receiptNumber: '',
    amountPaid: '',
    tdsAmount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer / NEFT',
    paymentReference: '',
    depositedToAccount: 'HDFC Current A/c - 50200012345678',
    notes: '',
  });

  // 1. Fetch Accountant Summary
  const { data: summaryData, isLoading: isSummaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['accountantSummary'],
    queryFn: async () => {
      const { data } = await api.get('/accountant/summary');
      return data;
    },
    refetchInterval: 15000,
  });

  // 2. Fetch Invoices List
  const { data: invoicesData, isLoading: isInvoicesLoading, refetch: refetchInvoices } = useQuery({
    queryKey: ['accountantInvoices', statusFilter, searchTerm],
    queryFn: async () => {
      const { data } = await api.get('/accountant/invoices', {
        params: { status: statusFilter, search: searchTerm },
      });
      return data;
    },
  });

  // 3. Fetch Payments List
  const { data: paymentsData, isLoading: isPaymentsLoading, refetch: refetchPayments } = useQuery({
    queryKey: ['accountantPayments'],
    queryFn: async () => {
      const { data } = await api.get('/accountant/payments');
      return data;
    },
  });

  // 4. Fetch Client Ledger (when a client is selected)
  const { data: ledgerData, refetch: refetchLedger } = useQuery({
    queryKey: ['accountantLedger', selectedLedgerClient],
    queryFn: async () => {
      if (!selectedLedgerClient) return null;
      const { data } = await api.get('/accountant/ledger', {
        params: { clientName: selectedLedgerClient },
      });
      return data;
    },
    enabled: Boolean(selectedLedgerClient),
  });

  // 5. Fetch GST Report
  const { data: gstReportData, refetch: refetchGst } = useQuery({
    queryKey: ['accountantGstReport'],
    queryFn: async () => {
      const { data } = await api.get('/accountant/reports/gst');
      return data;
    },
  });

  // 6. Fetch Projects (for project linking)
  const { data: projectsData = [] } = useQuery({
    queryKey: ['projectsListForAccountant'],
    queryFn: async () => {
      const { data } = await api.get('/projects');
      return Array.isArray(data) ? data : data?.projects || [];
    },
  });

  // 7. Fetch Registered Clients
  const { data: clientUsers = [] } = useQuery({
    queryKey: ['clientUsersList'],
    queryFn: async () => {
      const { data } = await api.get('/client-portal/admin/overview');
      return data?.clients || [];
    },
  });

  const summary = summaryData?.summary || {
    totalInvoiced: 0,
    totalPaid: 0,
    totalTds: 0,
    totalOutstanding: 0,
    collectionRate: 0,
    totalTaxLiability: 0,
    cgstTotal: 0,
    sgstTotal: 0,
    igstTotal: 0,
    invoiceCounts: { total: 0, draft: 0, sent: 0, partiallyPaid: 0, paid: 0, overdue: 0 },
  };

  const invoices = invoicesData?.invoices || [];
  const payments = paymentsData?.payments || [];
  const monthlyStats = summaryData?.monthlyStats || [];
  const topDebtors = summaryData?.topDebtors || [];
  const companyInfo = summaryData?.company || {};

  // Extract unique client list for Ledger dropdown
  const uniqueClients = Array.from(
    new Set(
      invoices
        .map((i) => i.clientCompany || i.clientName)
        .filter(Boolean)
    )
  );

  // Auto-select first client for ledger if none selected
  if (!selectedLedgerClient && uniqueClients.length > 0) {
    setSelectedLedgerClient(uniqueClients[0]);
  }

  // MUTATION: Create Invoice
  const createInvoiceMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/accountant/invoices', payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Invoice created successfully!');
      queryClient.invalidateQueries(['accountantInvoices']);
      queryClient.invalidateQueries(['accountantSummary']);
      setIsInvoiceModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create invoice');
    },
  });

  // MUTATION: Delete Invoice
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId) => {
      const { data } = await api.delete(`/accountant/invoices/${invoiceId}`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Invoice deleted!');
      queryClient.invalidateQueries(['accountantInvoices']);
      queryClient.invalidateQueries(['accountantSummary']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete invoice');
    },
  });

  // MUTATION: Record Payment
  const recordPaymentMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/accountant/payments', payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Payment recorded successfully!');
      queryClient.invalidateQueries(['accountantPayments']);
      queryClient.invalidateQueries(['accountantInvoices']);
      queryClient.invalidateQueries(['accountantSummary']);
      queryClient.invalidateQueries(['accountantLedger']);
      setIsPaymentModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    },
  });

  // Invoice Items helper functions
  const handleAddItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [
        ...invoiceForm.items,
        {
          description: '',
          sacHsnCode: '998314',
          quantity: 1,
          unit: 'Milestone',
          rate: 0,
          gstRate: 18,
        },
      ],
    });
  };

  const handleRemoveItem = (index) => {
    if (invoiceForm.items.length <= 1) {
      toast.error('Invoice must have at least one line item');
      return;
    }
    const updated = invoiceForm.items.filter((_, idx) => idx !== index);
    setInvoiceForm({ ...invoiceForm, items: updated });
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...invoiceForm.items];
    updated[index] = { ...updated[index], [field]: value };
    setInvoiceForm({ ...invoiceForm, items: updated });
  };

  // Live Invoice Computation
  const computeLiveTotals = () => {
    let subtotal = 0;
    let totalTax = 0;
    invoiceForm.items.forEach((item) => {
      const qty = Number(item.quantity) || 1;
      const rate = Number(item.rate) || 0;
      const amount = qty * rate;
      const gstRate = Number(item.gstRate) || 0;
      const gstAmount = (amount * gstRate) / 100;
      subtotal += amount;
      totalTax += gstAmount;
    });
    const disc = Number(invoiceForm.discount) || 0;
    const total = Math.max(0, subtotal - disc + totalTax);
    return {
      subtotal,
      discount: disc,
      tax: totalTax,
      total,
      cgst: invoiceForm.isInterstate ? 0 : totalTax / 2,
      sgst: invoiceForm.isInterstate ? 0 : totalTax / 2,
      igst: invoiceForm.isInterstate ? totalTax : 0,
    };
  };

  const liveTotals = computeLiveTotals();

  const handleOpenRecordPaymentForInvoice = (inv) => {
    setPaymentForm({
      invoiceId: inv._id,
      receiptNumber: '',
      amountPaid: inv.balanceDue || inv.totalAmount,
      tdsAmount: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'Bank Transfer / NEFT',
      paymentReference: '',
      depositedToAccount: 'Primary Bank Account',
      notes: `Payment for Invoice #${inv.invoiceNumber}`,
    });
    setIsPaymentModalOpen(true);
  };

  const handleSaveInvoice = (e) => {
    e.preventDefault();
    if (!invoiceForm.clientName.trim()) {
      toast.error('Client name is required');
      return;
    }
    createInvoiceMutation.mutate(invoiceForm);
  };

  const handleSavePayment = (e) => {
    e.preventDefault();
    if (!paymentForm.invoiceId) {
      toast.error('Please select an invoice');
      return;
    }
    if (!paymentForm.amountPaid || Number(paymentForm.amountPaid) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    recordPaymentMutation.mutate(paymentForm);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <HiOutlineDocumentText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Accountant Client Billing & Invoicing
              </h1>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Finance Workspace
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Generate GST-compliant Tax Invoices, record client receipts, reconcile customer ledgers, and track GST & TDS.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              refetchSummary();
              refetchInvoices();
              refetchPayments();
              refetchLedger();
              refetchGst();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <HiOutlineArrowPath className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm shadow-emerald-200"
          >
            <HiOutlineBanknotes className="w-4 h-4" />
            Record Payment Receipt
          </button>
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm shadow-indigo-200"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Create Tax Invoice
          </button>
        </div>
      </div>

      {/* 2. Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Total Invoiced */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Invoiced Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HiOutlineCreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {formatCurrency(summary.totalInvoiced)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {summary.invoiceCounts?.total || 0} Invoices Issued
          </div>
        </div>

        {/* KPI 2: Total Collections Paid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Collections Received
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HiOutlineCheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {formatCurrency(summary.totalPaid)}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
              {summary.collectionRate}% Realized
            </span>
          </div>
        </div>

        {/* KPI 3: Outstanding Receivables */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Outstanding Balance Due
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <HiOutlineClock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">
            {formatCurrency(summary.totalOutstanding)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {summary.invoiceCounts?.overdue > 0 ? (
              <span className="text-rose-600 font-bold">
                {summary.invoiceCounts.overdue} Overdue Invoices
              </span>
            ) : (
              'All current within credit terms'
            )}
          </div>
        </div>

        {/* KPI 4: GST Tax Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              GST Tax Liability
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <HiOutlineDocumentChartBar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {formatCurrency(summary.totalTaxLiability)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            CGST: {formatCurrency(summary.cgstTotal)} | SGST: {formatCurrency(summary.sgstTotal)}
          </div>
        </div>

        {/* KPI 5: TDS Deductions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              TDS Withheld by Clients
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <HiOutlineCurrencyRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-700">
            {formatCurrency(summary.totalTds)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Claimable on Form 26AS</div>
        </div>
      </div>

      {/* 3. Main Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-slate-200">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <HiOutlineSquares2X2 className="w-4 h-4" />
              Financial Dashboard
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'invoices'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <HiOutlineDocumentText className="w-4 h-4" />
              Client Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'payments'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <HiOutlineBanknotes className="w-4 h-4" />
              Receipt Vouchers ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'ledger'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <HiOutlineBookOpen className="w-4 h-4" />
              Customer Ledgers
            </button>
            <button
              onClick={() => setActiveTab('gst')}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === 'gst'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <HiOutlineDocumentChartBar className="w-4 h-4" />
              GSTR-1 & Tax Register
            </button>
          </div>

          {activeTab === 'invoices' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="Sent">Pending Payment</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Fully Paid</option>
                <option value="Overdue">Overdue</option>
                <option value="Draft">Draft</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <div className="relative w-full sm:w-56">
                <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search invoice or client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. Tab Content */}
        <div className="p-4 md:p-6">
          {/* ========================================================================= */}
          {/* TAB 1: Financial Dashboard */}
          {/* ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Monthly Trend & Top Debtors */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Collections vs Invoiced */}
                <div className="lg:col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
                    <span>Monthly Invoiced Revenue vs Collections Realized</span>
                    <span className="text-xs font-normal text-slate-500">Last 6 Months</span>
                  </h3>

                  <div className="space-y-3">
                    {monthlyStats.map((item, idx) => {
                      const maxVal = Math.max(
                        ...monthlyStats.map((m) => Math.max(m.billed, m.collected)),
                        1
                      );
                      const billedPct = Math.round((item.billed / maxVal) * 100);
                      const collectedPct = Math.round((item.collected / maxVal) * 100);

                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700">{item.month}</span>
                            <div className="flex items-center gap-3 text-[11px]">
                              <span className="text-indigo-700 font-semibold">
                                Invoiced: {formatCurrency(item.billed)}
                              </span>
                              <span className="text-emerald-700 font-semibold">
                                Collected: {formatCurrency(item.collected)}
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden flex gap-1 p-0.5">
                            <div
                              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${billedPct}%` }}
                              title={`Invoiced: ${formatCurrency(item.billed)}`}
                            />
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${collectedPct}%` }}
                              title={`Collected: ${formatCurrency(item.collected)}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Client Outstanding Balances */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">
                    Top Client Receivables (Aging)
                  </h3>

                  {topDebtors.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Zero outstanding client balances. All invoices paid!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topDebtors.map((deb, i) => (
                        <div
                          key={i}
                          className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-xs"
                        >
                          <div>
                            <div className="font-bold text-xs text-slate-900">
                              {deb.clientCompany || deb.clientName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {deb.invoicesCount} Invoices
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm text-rose-600">
                              {formatCurrency(deb.totalOutstanding)}
                            </div>
                            <button
                              onClick={() => {
                                setSelectedLedgerClient(deb.clientCompany || deb.clientName);
                                setActiveTab('ledger');
                              }}
                              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold underline"
                            >
                              View Statement
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Invoices & Payments */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Invoices */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900">Recent Tax Invoices</h3>
                    <button
                      onClick={() => setActiveTab('invoices')}
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      View All ({invoices.length})
                    </button>
                  </div>
                  <div className="space-y-2">
                    {invoices.slice(0, 5).map((inv) => (
                      <div
                        key={inv._id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 transition-colors"
                      >
                        <div>
                          <div className="font-mono text-xs font-bold text-slate-800">
                            {inv.invoiceNumber}
                          </div>
                          <div className="text-xs text-slate-500">
                            {inv.clientCompany || inv.clientName}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-xs text-slate-900">
                            {formatCurrency(inv.totalAmount, inv.currency)}
                          </div>
                          <div>{getStatusBadge(inv.status)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Payments */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900">Recent Payment Receipts</h3>
                    <button
                      onClick={() => setActiveTab('payments')}
                      className="text-xs font-semibold text-emerald-600 hover:underline"
                    >
                      View All ({payments.length})
                    </button>
                  </div>
                  <div className="space-y-2">
                    {payments.slice(0, 5).map((pay) => (
                      <div
                        key={pay._id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 transition-colors"
                      >
                        <div>
                          <div className="font-mono text-xs font-bold text-emerald-800">
                            {pay.receiptNumber}
                          </div>
                          <div className="text-xs text-slate-500">
                            {pay.clientCompany || pay.clientName} • {pay.paymentMethod}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-xs text-emerald-600">
                            +{formatCurrency(pay.amountPaid, pay.currency)}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(pay.paymentDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: Invoices List */}
          {/* ========================================================================= */}
          {activeTab === 'invoices' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50">
                    <th className="py-3 px-3">Invoice #</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Client / Business</th>
                    <th className="py-3 px-3">Project</th>
                    <th className="py-3 px-3 text-right">Taxable Amt</th>
                    <th className="py-3 px-3 text-right">GST Total</th>
                    <th className="py-3 px-3 text-right">Grand Total</th>
                    <th className="py-3 px-3 text-right">Paid</th>
                    <th className="py-3 px-3 text-right">Balance Due</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        No client invoices found. Click "+ Create Tax Invoice" to generate one.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {new Date(inv.invoiceDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">
                            {inv.clientCompany || inv.clientName}
                          </div>
                          {inv.clientGstin && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              GSTIN: {inv.clientGstin}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {inv.projectName || inv.project?.name || 'General'}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-700">
                          {formatCurrency(inv.subtotal - (inv.discount || 0), inv.currency)}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600">
                          {formatCurrency(inv.totalTax, inv.currency)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {formatCurrency(inv.totalAmount, inv.currency)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-600">
                          {formatCurrency(inv.paidAmount, inv.currency)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-amber-600">
                          {formatCurrency(inv.balanceDue, inv.currency)}
                        </td>
                        <td className="py-3 px-3 text-center">{getStatusBadge(inv.status)}</td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewInvoiceModal(inv)}
                              className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px]"
                              title="Print GST Tax Invoice"
                            >
                              <HiOutlinePrinter className="w-3.5 h-3.5 inline mr-1" />
                              View / Print
                            </button>
                            {inv.balanceDue > 0 && inv.status !== 'Cancelled' && (
                              <button
                                onClick={() => handleOpenRecordPaymentForInvoice(inv)}
                                className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px]"
                                title="Record incoming payment"
                              >
                                Record Pay
                              </button>
                            )}
                            {inv.paidAmount === 0 && (
                              <button
                                onClick={() => deleteInvoiceMutation.mutate(inv._id)}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                                title="Delete Invoice"
                              >
                                <HiOutlineTrash className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: Payment Receipts & Vouchers */}
          {/* ========================================================================= */}
          {activeTab === 'payments' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50">
                    <th className="py-3 px-3">Receipt #</th>
                    <th className="py-3 px-3">Payment Date</th>
                    <th className="py-3 px-3">Invoice Ref</th>
                    <th className="py-3 px-3">Client / Company</th>
                    <th className="py-3 px-3">Mode</th>
                    <th className="py-3 px-3">UTR / Cheque Ref</th>
                    <th className="py-3 px-3 text-right">Gross Paid</th>
                    <th className="py-3 px-3 text-right">TDS Deducted</th>
                    <th className="py-3 px-3 text-right">Net Bank Deposit</th>
                    <th className="py-3 px-3">Deposited Account</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        No payment receipts recorded yet. Click "+ Record Payment Receipt" above.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                          {p.receiptNumber}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {new Date(p.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-700">
                          {p.invoiceNumber}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {p.clientCompany || p.clientName}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">
                          {p.paymentReference || 'N/A'}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {formatCurrency(p.amountPaid, p.currency)}
                        </td>
                        <td className="py-3 px-3 text-right text-purple-700 font-semibold">
                          {p.tdsAmount > 0 ? formatCurrency(p.tdsAmount, p.currency) : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-600">
                          {formatCurrency(p.netReceived, p.currency)}
                        </td>
                        <td className="py-3 px-3 text-slate-600">{p.depositedToAccount}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setViewPaymentModal(p)}
                            className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px]"
                          >
                            <HiOutlinePrinter className="w-3.5 h-3.5 inline mr-1" />
                            Voucher
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: Customer Ledger Statement */}
          {/* ========================================================================= */}
          {activeTab === 'ledger' && (
            <div className="space-y-6">
              {/* Client Selector & Statement Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                    Select Customer Account:
                  </label>
                  <select
                    value={selectedLedgerClient}
                    onChange={(e) => setSelectedLedgerClient(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    {uniqueClients.map((clientName, idx) => (
                      <option key={idx} value={clientName}>
                        {clientName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  >
                    <HiOutlinePrinter className="w-4 h-4" />
                    Print Statement
                  </button>
                </div>
              </div>

              {/* Ledger Summary KPIs */}
              {ledgerData && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-bold uppercase">Total Debited (Billed)</span>
                    <div className="text-xl font-bold text-slate-900 mt-1">
                      {formatCurrency(ledgerData.summary.totalInvoiced)}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-bold uppercase">Total Credited (Paid)</span>
                    <div className="text-xl font-bold text-emerald-600 mt-1">
                      {formatCurrency(ledgerData.summary.totalPaid)}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-bold uppercase">TDS Deducted</span>
                    <div className="text-xl font-bold text-purple-700 mt-1">
                      {formatCurrency(ledgerData.summary.totalTds)}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-bold uppercase">Closing Balance Due</span>
                    <div className="text-xl font-bold text-amber-600 mt-1">
                      {formatCurrency(ledgerData.summary.closingBalance)}
                    </div>
                  </div>
                </div>
              )}

              {/* Ledger Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50">
                      <th className="py-3 px-3">S.No</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Voucher / Ref #</th>
                      <th className="py-3 px-3">Particulars</th>
                      <th className="py-3 px-3 text-right">Debit (Dr)</th>
                      <th className="py-3 px-3 text-right">Credit (Cr)</th>
                      <th className="py-3 px-3 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {!ledgerData || ledgerData.ledger.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          No ledger transactions found for {selectedLedgerClient}.
                        </td>
                      </tr>
                    ) : (
                      ledgerData.ledger.map((entry) => (
                        <tr key={entry.sn} className="hover:bg-slate-50">
                          <td className="py-3 px-3 text-slate-500">{entry.sn}</td>
                          <td className="py-3 px-3 text-slate-700">
                            {new Date(entry.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                entry.type === 'INVOICE'
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {entry.type}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-800">
                            {entry.refNumber}
                          </td>
                          <td className="py-3 px-3 text-slate-600 max-w-sm truncate">
                            {entry.particulars}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900">
                            {entry.debit > 0 ? formatCurrency(entry.debit, entry.currency) : '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-600">
                            {entry.credit > 0 ? formatCurrency(entry.credit, entry.currency) : '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900">
                            {formatCurrency(entry.balance, entry.currency)} {entry.balance > 0 ? 'Dr' : ''}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: GSTR-1 & Tax Compliance Register */}
          {/* ========================================================================= */}
          {activeTab === 'gst' && (
            <div className="space-y-6">
              {gstReportData && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-bold uppercase">Total Taxable Value</span>
                    <div className="text-xl font-bold text-slate-900 mt-1">
                      {formatCurrency(gstReportData.summary.totalTaxableValue)}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-bold uppercase">CGST Collected</span>
                    <div className="text-xl font-bold text-indigo-600 mt-1">
                      {formatCurrency(gstReportData.summary.totalCgst)}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-bold uppercase">SGST Collected</span>
                    <div className="text-xl font-bold text-indigo-600 mt-1">
                      {formatCurrency(gstReportData.summary.totalSgst)}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-bold uppercase">Total Tax Liability</span>
                    <div className="text-xl font-bold text-emerald-600 mt-1">
                      {formatCurrency(gstReportData.summary.totalTaxLiability)}
                    </div>
                  </div>
                </div>
              )}

              {/* B2B Invoices Table (With GSTIN) */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900">
                  GSTR-1 Section 4A: B2B Invoices (Registered Customers with GSTIN)
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50">
                        <th className="py-3 px-3">Invoice #</th>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">Customer Name</th>
                        <th className="py-3 px-3">Customer GSTIN</th>
                        <th className="py-3 px-3 text-right">Taxable Value</th>
                        <th className="py-3 px-3 text-right">CGST</th>
                        <th className="py-3 px-3 text-right">SGST</th>
                        <th className="py-3 px-3 text-right">Total Invoice Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {!gstReportData || gstReportData.b2bInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            No B2B invoices with customer GSTIN recorded yet.
                          </td>
                        </tr>
                      ) : (
                        gstReportData.b2bInvoices.map((inv, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                              {inv.invoiceNumber}
                            </td>
                            <td className="py-3 px-3 text-slate-600">
                              {new Date(inv.invoiceDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-900">
                              {inv.clientCompany || inv.clientName}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-700">
                              {inv.clientGstin}
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-slate-800">
                              {formatCurrency(inv.taxableValue)}
                            </td>
                            <td className="py-3 px-3 text-right text-indigo-600">
                              {formatCurrency(inv.cgst)}
                            </td>
                            <td className="py-3 px-3 text-right text-indigo-600">
                              {formatCurrency(inv.sgst)}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-900">
                              {formatCurrency(inv.totalAmount)}
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
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Create Tax Invoice Modal */}
      {/* ========================================================================= */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Generate Client Tax Invoice</h2>
                <p className="text-xs text-slate-500">
                  GST-compliant commercial tax invoice for billing clients and milestones.
                </p>
              </div>
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <HiOutlineXMark className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-5 text-xs">
              {/* Invoice Meta */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Invoice Type</label>
                  <select
                    value={invoiceForm.invoiceType}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="Tax Invoice">Tax Invoice</option>
                    <option value="Proforma Invoice">Proforma Invoice</option>
                    <option value="Commercial Invoice">Commercial Invoice</option>
                    <option value="Retainer Invoice">Retainer Invoice</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Invoice # (Auto or Custom)
                  </label>
                  <input
                    type="text"
                    placeholder="Leave empty for auto-generated"
                    value={invoiceForm.invoiceNumber}
                    onChange={(e) =>
                      setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Invoice Date *</label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.invoiceDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Due Date *</label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>

              {/* Client & Project Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Select Registered Client
                  </label>
                  <select
                    value={invoiceForm.clientId}
                    onChange={(e) => {
                      const cId = e.target.value;
                      const cObj = clientUsers.find((c) => c._id === cId);
                      setInvoiceForm({
                        ...invoiceForm,
                        clientId: cId,
                        clientName: cObj ? cObj.name : invoiceForm.clientName,
                        clientEmail: cObj ? cObj.email : invoiceForm.clientEmail,
                        clientPhone: cObj ? cObj.phone : invoiceForm.clientPhone,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="">-- Choose or Enter Below --</option>
                    {clientUsers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Client Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={invoiceForm.clientName}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, clientName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    placeholder="Acme Technologies Pvt Ltd"
                    value={invoiceForm.clientCompany}
                    onChange={(e) =>
                      setInvoiceForm({ ...invoiceForm, clientCompany: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Client Email</label>
                  <input
                    type="email"
                    placeholder="client@acme.com"
                    value={invoiceForm.clientEmail}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, clientEmail: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Client GSTIN Number</label>
                  <input
                    type="text"
                    placeholder="27ABCDE1234F1Z5"
                    value={invoiceForm.clientGstin}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, clientGstin: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Link to Project (Optional)</label>
                  <select
                    value={invoiceForm.projectId}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, projectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="">-- No project link --</option>
                    {projectsData.map((p) => {
                      const isClientProject =
                        invoiceForm.clientId &&
                        ((p.client && (p.client === invoiceForm.clientId || p.client._id === invoiceForm.clientId)) ||
                          (p.clientEmail && p.clientEmail.toLowerCase() === (invoiceForm.clientEmail || '').toLowerCase()));
                      return (
                        <option key={p._id} value={p._id}>
                          {p.name} {isClientProject ? '★ (Assigned to this Client)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold uppercase text-slate-700">Line Items & Services</h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold"
                  >
                    <HiOutlinePlus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                      <tr>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 w-24">SAC Code</th>
                        <th className="py-2 px-3 w-20">Qty</th>
                        <th className="py-2 px-3 w-28">Rate (₹)</th>
                        <th className="py-2 px-3 w-24">GST %</th>
                        <th className="py-2 px-3 w-28 text-right">Total</th>
                        <th className="py-2 px-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoiceForm.items.map((item, idx) => {
                        const rowTotal =
                          (Number(item.quantity) || 1) *
                          (Number(item.rate) || 0) *
                          (1 + (Number(item.gstRate) || 0) / 100);
                        return (
                          <tr key={idx}>
                            <td className="p-2">
                              <input
                                type="text"
                                required
                                placeholder="Milestone / Service description"
                                value={item.description}
                                onChange={(e) =>
                                  handleItemChange(idx, 'description', e.target.value)
                                }
                                className="w-full px-2 py-1 rounded border border-slate-200"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.sacHsnCode}
                                onChange={(e) =>
                                  handleItemChange(idx, 'sacHsnCode', e.target.value)
                                }
                                className="w-full px-2 py-1 rounded border border-slate-200 font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(idx, 'quantity', e.target.value)
                                }
                                className="w-full px-2 py-1 rounded border border-slate-200"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                required
                                value={item.rate}
                                onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                                className="w-full px-2 py-1 rounded border border-slate-200 font-bold"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={item.gstRate}
                                onChange={(e) =>
                                  handleItemChange(idx, 'gstRate', e.target.value)
                                }
                                className="w-full px-2 py-1 rounded border border-slate-200 bg-white"
                              >
                                <option value="18">18% (IT)</option>
                                <option value="12">12%</option>
                                <option value="5">5%</option>
                                <option value="0">0% (Exempt)</option>
                              </select>
                            </td>
                            <td className="p-2 text-right font-bold text-slate-900">
                              {formatCurrency(rowTotal)}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-rose-500 hover:text-rose-700"
                              >
                                <HiOutlineTrash className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Interstate GST Toggle & Summary Calculation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="interstateCheck"
                      checked={invoiceForm.isInterstate}
                      onChange={(e) =>
                        setInvoiceForm({ ...invoiceForm, isInterstate: e.target.checked })
                      }
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="interstateCheck" className="font-bold text-slate-700 cursor-pointer">
                      Inter-State Transaction (Apply Integrated IGST instead of CGST+SGST)
                    </label>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Discount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={invoiceForm.discount}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: e.target.value })}
                      className="w-36 px-2 py-1 rounded border border-slate-200"
                    />
                  </div>
                </div>

                {/* Live Bill Totals */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Subtotal:</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(liveTotals.subtotal)}
                    </span>
                  </div>
                  {liveTotals.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Discount:</span>
                      <span className="font-bold">-{formatCurrency(liveTotals.discount)}</span>
                    </div>
                  )}
                  {invoiceForm.isInterstate ? (
                    <div className="flex justify-between text-indigo-600">
                      <span>IGST (18%):</span>
                      <span className="font-bold">{formatCurrency(liveTotals.igst)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-indigo-600">
                        <span>CGST (9%):</span>
                        <span className="font-bold">{formatCurrency(liveTotals.cgst)}</span>
                      </div>
                      <div className="flex justify-between text-indigo-600">
                        <span>SGST (9%):</span>
                        <span className="font-bold">{formatCurrency(liveTotals.sgst)}</span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-slate-200 pt-1.5 flex justify-between text-sm font-extrabold text-slate-900">
                    <span>Total Invoice Amount:</span>
                    <span className="text-indigo-700">{formatCurrency(liveTotals.total)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createInvoiceMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200"
                >
                  {createInvoiceMutation.isPending ? 'Generating...' : 'Issue Tax Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Record Payment Receipt Modal */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Record Client Payment</h2>
                <p className="text-xs text-slate-500">
                  Generate official Payment Receipt Voucher and credit customer ledger.
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Invoice *</label>
                <select
                  required
                  value={paymentForm.invoiceId}
                  onChange={(e) => {
                    const invId = e.target.value;
                    const inv = invoices.find((i) => i._id === invId);
                    setPaymentForm({
                      ...paymentForm,
                      invoiceId: invId,
                      amountPaid: inv ? inv.balanceDue || inv.totalAmount : '',
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium"
                >
                  <option value="">-- Choose Invoice to credit --</option>
                  {invoices
                    .filter((i) => i.status !== 'Cancelled')
                    .map((i) => (
                      <option key={i._id} value={i._id}>
                        {i.invoiceNumber} - {i.clientCompany || i.clientName} (Due: {formatCurrency(i.balanceDue)})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Receipt Voucher #</label>
                  <input
                    type="text"
                    placeholder="Auto-generated"
                    value={paymentForm.receiptNumber}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, receiptNumber: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, paymentDate: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Gross Amount Credited (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="50000"
                    value={paymentForm.amountPaid}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, amountPaid: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">TDS Withheld (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={paymentForm.tdsAmount}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, tdsAmount: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
                  <option value="RTGS">RTGS</option>
                  <option value="IMPS">IMPS</option>
                  <option value="UPI / QR Code">UPI / QR Code</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Credit / Debit Card">Credit / Debit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Wire Transfer">Wire Transfer</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bank Reference / UTR / Cheque #
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR9876543210 or Cheque #123456"
                  value={paymentForm.paymentReference}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, paymentReference: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deposited To Bank Account</label>
                <input
                  type="text"
                  placeholder="Primary Current A/c"
                  value={paymentForm.depositedToAccount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, depositedToAccount: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordPaymentMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200"
                >
                  {recordPaymentMutation.isPending ? 'Saving...' : 'Acknowledge Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Printable Tax Invoice Modal */}
      {/* ========================================================================= */}
      {viewInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-8 max-h-[92vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 no-print">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                Tax Invoice Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  <HiOutlinePrinter className="w-4 h-4" /> Print / Save PDF
                </button>
                <button
                  onClick={() => setViewInvoiceModal(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <HiOutlineXMark className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Printable Tax Invoice Content */}
            <div className="space-y-6 text-slate-900 font-sans text-xs">
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-300">
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">
                    {companyInfo.name || 'Company Management System'}
                  </h1>
                  <p className="text-slate-500 mt-1 whitespace-pre-line">
                    {companyInfo.address || 'Corporate Office Address'}
                  </p>
                  <p className="text-slate-500">
                    Email: {companyInfo.contactEmail || 'accounts@company.com'} | Tel: {companyInfo.phone || '+91 9876543210'}
                  </p>
                  <p className="font-mono font-bold text-indigo-700 mt-1">
                    GSTIN: {companyInfo.gstNumber || '27AABCT1234F1Z1'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-slate-900 text-white font-extrabold text-sm uppercase rounded">
                    {viewInvoiceModal.invoiceType || 'Tax Invoice'}
                  </div>
                  <div className="mt-2 text-xs">
                    <span className="text-slate-500">Invoice No: </span>
                    <strong className="font-mono text-sm">{viewInvoiceModal.invoiceNumber}</strong>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500">Date: </span>
                    <strong>{new Date(viewInvoiceModal.invoiceDate).toLocaleDateString()}</strong>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500">Due Date: </span>
                    <strong>{new Date(viewInvoiceModal.dueDate).toLocaleDateString()}</strong>
                  </div>
                </div>
              </div>

              {/* Billed To */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Billed To / Customer Details:
                </span>
                <div className="font-bold text-sm text-slate-900">
                  {viewInvoiceModal.clientCompany || viewInvoiceModal.clientName}
                </div>
                {viewInvoiceModal.clientCompany && (
                  <div className="text-slate-700">Attn: {viewInvoiceModal.clientName}</div>
                )}
                {viewInvoiceModal.clientEmail && (
                  <div className="text-slate-500">{viewInvoiceModal.clientEmail}</div>
                )}
                {viewInvoiceModal.clientGstin && (
                  <div className="font-mono font-bold text-slate-800 mt-1">
                    Customer GSTIN: {viewInvoiceModal.clientGstin}
                  </div>
                )}
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-900 bg-slate-100 font-bold text-slate-900 uppercase">
                    <th className="py-2 px-2">#</th>
                    <th className="py-2 px-2">Description of Services</th>
                    <th className="py-2 px-2">SAC/HSN</th>
                    <th className="py-2 px-2 text-center">Qty</th>
                    <th className="py-2 px-2 text-right">Rate</th>
                    <th className="py-2 px-2 text-right">GST %</th>
                    <th className="py-2 px-2 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {viewInvoiceModal.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-2 text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-2 font-medium text-slate-900">{item.description}</td>
                      <td className="py-2 px-2 font-mono text-slate-600">{item.sacHsnCode}</td>
                      <td className="py-2 px-2 text-center">{item.quantity}</td>
                      <td className="py-2 px-2 text-right font-medium">{formatCurrency(item.rate)}</td>
                      <td className="py-2 px-2 text-right">{item.gstRate}%</td>
                      <td className="py-2 px-2 text-right font-bold text-slate-900">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Calculation */}
              <div className="flex justify-end pt-2">
                <div className="w-72 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Taxable Value:</span>
                    <span className="font-bold">{formatCurrency(viewInvoiceModal.subtotal)}</span>
                  </div>
                  {viewInvoiceModal.isInterstate ? (
                    <div className="flex justify-between text-indigo-700">
                      <span>Integrated GST (IGST 18%):</span>
                      <span className="font-bold">{formatCurrency(viewInvoiceModal.igstAmount)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-indigo-700">
                        <span>Central GST (CGST 9%):</span>
                        <span className="font-bold">{formatCurrency(viewInvoiceModal.cgstAmount)}</span>
                      </div>
                      <div className="flex justify-between text-indigo-700">
                        <span>State GST (SGST 9%):</span>
                        <span className="font-bold">{formatCurrency(viewInvoiceModal.sgstAmount)}</span>
                      </div>
                    </>
                  )}
                  <div className="border-t-2 border-slate-900 pt-1.5 flex justify-between text-sm font-extrabold text-slate-900">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(viewInvoiceModal.totalAmount, viewInvoiceModal.currency)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Paid to Date:</span>
                    <span>{formatCurrency(viewInvoiceModal.paidAmount, viewInvoiceModal.currency)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700 font-bold border-t border-slate-200 pt-1">
                    <span>Balance Due:</span>
                    <span>{formatCurrency(viewInvoiceModal.balanceDue, viewInvoiceModal.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Bank Details & Terms */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                  <strong className="block text-slate-700 uppercase tracking-wider">
                    Bank Remittance Details:
                  </strong>
                  <div>Bank Name: {viewInvoiceModal.bankDetails?.bankName || 'HDFC Bank Ltd'}</div>
                  <div>A/c Name: {viewInvoiceModal.bankDetails?.accountName || companyInfo.name}</div>
                  <div className="font-mono font-bold">
                    A/c No: {viewInvoiceModal.bankDetails?.accountNumber || '50200012345678'}
                  </div>
                  <div className="font-mono font-bold">
                    IFSC Code: {viewInvoiceModal.bankDetails?.ifscCode || 'HDFC0000123'}
                  </div>
                </div>

                <div className="text-right flex flex-col justify-between">
                  <div className="text-[11px] text-slate-500">
                    For <strong>{companyInfo.name || 'Company Management System'}</strong>
                  </div>
                  <div className="mt-8">
                    <div className="inline-block border-t border-slate-400 pt-1 text-[11px] font-bold text-slate-700">
                      Authorized Signatory / Accountant
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Printable Receipt Voucher Modal */}
      {/* ========================================================================= */}
      {viewPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 no-print">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Official Payment Receipt Voucher
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  <HiOutlinePrinter className="w-4 h-4" /> Print Receipt
                </button>
                <button
                  onClick={() => setViewPaymentModal(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Receipt Voucher Content */}
            <div className="p-6 border-2 border-slate-800 rounded-xl space-y-4 text-xs font-sans">
              <div className="flex justify-between items-start border-b border-slate-300 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 uppercase text-sm">
                    {companyInfo.name || 'Company Workspace'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Payment Receipt & Acknowledgment Voucher
                  </p>
                </div>
                <div className="text-right font-mono">
                  <div className="font-extrabold text-emerald-700 text-sm">
                    {viewPaymentModal.receiptNumber}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Date: {new Date(viewPaymentModal.paymentDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-slate-800">
                <p>
                  Received with thanks from:{' '}
                  <strong className="underline text-slate-900">
                    {viewPaymentModal.clientCompany || viewPaymentModal.clientName}
                  </strong>
                </p>
                <p>
                  The sum of Rupees:{' '}
                  <strong className="underline text-emerald-800 text-sm">
                    {formatCurrency(viewPaymentModal.amountPaid, viewPaymentModal.currency)}
                  </strong>
                </p>
                <p>
                  Payment Mode:{' '}
                  <strong>{viewPaymentModal.paymentMethod}</strong> (Ref/UTR:{' '}
                  <span className="font-mono">{viewPaymentModal.paymentReference || 'N/A'}</span>)
                </p>
                <p>
                  Credited against Invoice:{' '}
                  <strong className="font-mono text-indigo-700">
                    {viewPaymentModal.invoiceNumber}
                  </strong>
                </p>
                {viewPaymentModal.tdsAmount > 0 && (
                  <p className="text-purple-700">
                    TDS Withheld by Customer:{' '}
                    <strong>{formatCurrency(viewPaymentModal.tdsAmount)}</strong>
                  </p>
                )}
              </div>

              <div className="flex justify-between items-end pt-6 border-t border-slate-300">
                <div className="text-[11px] text-slate-500">
                  Deposited To: {viewPaymentModal.depositedToAccount}
                </div>
                <div className="text-center">
                  <div className="border-t border-slate-400 pt-1 text-[11px] font-bold">
                    Authorized Signatory
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

export default AccountantBilling;

