import { useState, useRef } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  HiOutlineSquares2X2,
  HiOutlineFolder,
  HiOutlineBanknotes,
  HiOutlineChatBubbleLeftRight,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineArrowTopRightOnSquare,
  HiOutlinePrinter,
  HiOutlineXMark,
  HiOutlinePaperAirplane,
  HiOutlineUser,
  HiOutlineArrowPath,
  HiOutlineDocumentText,
  HiOutlineCurrencyRupee,
  HiOutlineSparkles,
  HiOutlineCalendarDays,
  HiOutlineShieldCheck,
  HiOutlineRocketLaunch,
  HiOutlinePlus,
} from 'react-icons/hi2';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const formatCurrency = (amount = 0, currency = 'INR') => {
  const num = Number(amount) || 0;
  if (currency === 'INR') {
    return `₹${num.toLocaleString('en-IN')}`;
  }
  if (currency === 'USD') {
    return `$${num.toLocaleString('en-US')}`;
  }
  return `${currency} ${num.toLocaleString()}`;
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
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <HiOutlineClock className="w-3.5 h-3.5" />
          Payment Pending
        </span>
      );
  }
};

const getProjectStatusColor = (status) => {
  switch (status) {
    case 'Completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'In Progress':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'On Hold':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const ClientPortal = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Active Tab ('overview', 'projects', 'invoices', 'support')
  const getComputedTab = () => {
    const qTab = searchParams.get('tab');
    if (qTab) return qTab;
    if (location.pathname.includes('/projects')) return 'projects';
    if (location.pathname.includes('/invoices') || location.pathname.includes('/billing')) return 'invoices';
    if (location.pathname.includes('/support') || location.pathname.includes('/queries')) return 'support';
    return 'overview';
  };

  const activeTab = getComputedTab();
  const setActiveTab = (tab) => {
    if (tab === 'overview') {
      navigate('/client/portal');
    } else {
      navigate(`/client/portal?tab=${tab}`);
    }
  };

  // Modal states
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [preselectedProjectId, setPreselectedProjectId] = useState('');

  // New query form state
  const [querySubject, setQuerySubject] = useState('');
  const [queryCategory, setQueryCategory] = useState('Progress Update');
  const [queryMessage, setQueryMessage] = useState('');
  const [selectedProjectForQuery, setSelectedProjectForQuery] = useState('');

  // Printable invoice ref
  const invoicePrintRef = useRef(null);

  // 1. Fetch Client Dashboard Data
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['clientPortalDashboard'],
    queryFn: async () => {
      const { data } = await api.get('/client-portal/dashboard');
      return data;
    },
    refetchInterval: 15000,
  });

  const summary = dashboardData?.summary || {
    totalProjects: 0,
    activeProjects: 0,
    totalCost: 0,
    totalPaid: 0,
    totalPending: 0,
    paidPercentage: 0,
    averageProgress: 0,
    totalInvoices: 0,
  };

  const projects = dashboardData?.projects || [];
  const invoices = dashboardData?.invoices || [];
  const recentQueries = dashboardData?.recentQueries || [];

  // Submit Query Mutation
  const submitQueryMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/client-portal/queries', payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Query sent to Project Manager!');
      setIsQueryModalOpen(false);
      setQuerySubject('');
      setQueryMessage('');
      queryClient.invalidateQueries(['clientPortalDashboard']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit query');
    },
  });

  const handleSubmitQuery = (e) => {
    e.preventDefault();
    if (!selectedProjectForQuery || !querySubject.trim() || !queryMessage.trim()) {
      toast.error('Please fill in all required query fields');
      return;
    }
    submitQueryMutation.mutate({
      projectId: selectedProjectForQuery,
      subject: querySubject.trim(),
      category: queryCategory,
      message: queryMessage.trim(),
    });
  };

  const handleOpenQueryModal = (projectId = '') => {
    if (projectId) {
      setSelectedProjectForQuery(projectId);
    } else if (projects.length > 0) {
      setSelectedProjectForQuery(projects[0]._id);
    }
    setIsQueryModalOpen(true);
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Loading your client portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. WELCOME BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Client Portal
              </span>
              <span className="text-xs text-slate-400">
                Organization: <strong className="text-white">{user?.company?.name || 'Workspace'}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Client'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Track real-time development progress, milestones delivery, live deployment links, and comprehensive payment &amp; invoice records.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all cursor-pointer border border-white/10"
            >
              <HiOutlineArrowPath className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => handleOpenQueryModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <HiOutlineChatBubbleLeftRight className="w-4 h-4" />
              Ask Project Manager
            </button>
          </div>
        </div>
      </div>

      {/* 2. FINANCIAL & PROGRESS KPI CARDS (THE CORE REQUIREMENT) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Project Cost */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Project Cost
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <HiOutlineBanknotes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 tracking-tight">
            {formatCurrency(summary.totalCost)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Total contract value</p>
        </div>

        {/* Total Amount Paid */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Total Paid
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
              {summary.paidPercentage}% Paid
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-600 tracking-tight">
            {formatCurrency(summary.totalPaid)}
          </div>
          <p className="text-[11px] text-emerald-600/80 mt-0.5">Settled milestone bills</p>
        </div>

        {/* Pending Balance Due */}
        <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-xs bg-rose-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
              Pending Balance
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
              {100 - summary.paidPercentage}% Due
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-rose-600 tracking-tight">
            {formatCurrency(summary.totalPending)}
          </div>
          <p className="text-[11px] text-rose-600/80 mt-0.5">Remaining contract balance</p>
        </div>

        {/* Active Projects */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
              Active Projects
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <HiOutlineFolder className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-indigo-600 tracking-tight">
            {summary.activeProjects} / {summary.totalProjects}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Ongoing developments</p>
        </div>

        {/* Average Progress */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Overall Progress
            </span>
            <span className="text-xs font-black text-slate-900">{summary.averageProgress}%</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${summary.averageProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">Across all deliverables</p>
        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'overview', label: 'Overview & Summary', icon: HiOutlineSquares2X2 },
          { id: 'projects', label: 'Projects & Live Progress', icon: HiOutlineFolder, count: projects.length },
          { id: 'invoices', label: 'Invoices & Billings', icon: HiOutlineBanknotes, count: invoices.length },
          { id: 'support', label: 'Ask PM / Queries', icon: HiOutlineChatBubbleLeftRight, count: recentQueries.length },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <IconComp className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-white text-indigo-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* TAB 1: OVERVIEW & COMPARISON */}
      {/* ============================================================ */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Progress vs Payment Comparison Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Project Progress vs Payment Settlement
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visual alignment of actual work delivered against milestone payments paid.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-indigo-600">
                  <span className="w-3 h-3 rounded bg-indigo-600" />
                  Work Delivered: <strong>{summary.averageProgress}%</strong>
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-3 h-3 rounded bg-emerald-500" />
                  Payments Cleared: <strong>{summary.paidPercentage}%</strong>
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Development Completion Progress</span>
                  <span>{summary.averageProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${summary.averageProgress}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Billings Paid Ratio ({formatCurrency(summary.totalPaid)} of {formatCurrency(summary.totalCost)})</span>
                  <span>{summary.paidPercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${summary.paidPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Projects Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Your Assigned Projects</h3>
              <button
                onClick={() => setActiveTab('projects')}
                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                View Full Progress ➔
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
                <HiOutlineFolder className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">No projects linked yet</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Your project manager will link your projects and milestone contract here shortly.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((p) => (
                  <div
                    key={p._id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getProjectStatusColor(
                            p.status
                          )}`}
                        >
                          {p.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                        {p.description || 'Custom software development contract.'}
                      </p>

                      {/* Progress bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                          <span>Progress</span>
                          <span className="text-indigo-600 font-bold">{p.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${p.progress || 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Financial Snippet */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Cost:</span>
                          <span className="font-bold text-slate-900">
                            {formatCurrency(p.financials?.totalCost, p.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Paid so far:</span>
                          <span className="font-bold text-emerald-600">
                            {formatCurrency(p.financials?.totalPaid, p.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200/70">
                          <span className="text-slate-500 font-semibold">Remaining Due:</span>
                          <span className="font-bold text-rose-600">
                            {formatCurrency(p.financials?.totalPending, p.currency)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">
                        Target: {p.endDate ? new Date(p.endDate).toLocaleDateString() : 'TBD'}
                      </span>
                      <button
                        onClick={() => setActiveTab('projects')}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        Details ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Invoices Schedule */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Recent Milestone Invoices</h3>
              <button
                onClick={() => setActiveTab('invoices')}
                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                All Invoices ({invoices.length}) ➔
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Milestone Description</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.slice(0, 5).map((inv) => (
                      <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{inv.projectName}</td>
                        <td className="py-3 px-4 text-slate-600">{inv.title}</td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'Upon Delivery'}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(inv.amount, inv.currency)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">{getStatusBadge(inv.status)}</td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                          >
                            <HiOutlinePrinter className="w-3.5 h-3.5" />
                            View Invoice
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: PROJECTS & LIVE PROGRESS */}
      {/* ============================================================ */}
      {activeTab === 'projects' && (
        <div className="space-y-6 animate-in fade-in">
          {projects.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
              <HiOutlineFolder className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No projects found</h4>
              <p className="text-xs text-slate-500 mt-1">
                You currently have no projects assigned under your client account.
              </p>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
              >
                {/* Project Header Banner */}
                <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/60">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                          {project.name}
                        </h2>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getProjectStatusColor(
                            project.status
                          )}`}
                        >
                          {project.status}
                        </span>
                        {project.clientCompany && (
                          <span className="text-xs text-slate-500 font-medium">
                            Client: <strong>{project.clientCompany}</strong>
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
                        {project.description || 'Enterprise software project development contract.'}
                      </p>
                    </div>

                    {/* Live Preview Links */}
                    <div className="flex items-center gap-2 shrink-0">
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                        >
                          <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5" />
                          Live Production Site
                        </a>
                      )}
                      {project.stagingUrl && (
                        <a
                          href={project.stagingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors"
                        >
                          <HiOutlineRocketLaunch className="w-3.5 h-3.5" />
                          Staging Preview
                        </a>
                      )}
                      <button
                        onClick={() => handleOpenQueryModal(project._id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5" />
                        Ask PM
                      </button>
                    </div>
                  </div>

                  {/* Progress & Timeline Bar */}
                  <div className="mt-5 pt-4 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Visual Progress */}
                    <div className="md:col-span-2">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <HiOutlineSparkles className="w-4 h-4 text-indigo-600" />
                          Live Project Completion Progress
                        </span>
                        <span className="text-sm font-black text-indigo-600">
                          {project.progress || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200/70 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Timeline dates */}
                    <div className="flex items-center justify-between md:justify-end gap-6 text-xs text-slate-500">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Start Date</span>
                        <span className="font-semibold text-slate-800">
                          {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Delivery</span>
                        <span className="font-semibold text-slate-800">
                          {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body: Financial Breakdown & Milestones */}
                <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left 2 cols: Billing Milestones & Invoices for this project */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">
                        Contract Billing Milestones ({project.billingMilestones?.length || 0})
                      </h3>
                      <span className="text-xs text-slate-500">
                        Paid: <strong className="text-emerald-600">{formatCurrency(project.financials?.totalPaid, project.currency)}</strong> of{' '}
                        <strong className="text-slate-900">{formatCurrency(project.financials?.totalCost, project.currency)}</strong>
                      </span>
                    </div>

                    {(!project.billingMilestones || project.billingMilestones.length === 0) ? (
                      <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                        No billing milestones configured for this project yet.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {project.billingMilestones.map((m, idx) => (
                          <div
                            key={m._id || idx}
                            className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                {m.milestoneNumber || idx + 1}
                              </span>
                              <div>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                  {m.title}
                                </h4>
                                {m.description && (
                                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                    {m.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                                  <span>Due: {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'Upon Delivery'}</span>
                                  {m.paymentReference && (
                                    <>
                                      <span>•</span>
                                      <span className="font-mono text-emerald-700">Ref: {m.paymentReference}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200">
                              <div className="text-right">
                                <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                                  {formatCurrency(m.amount, project.currency)}
                                </span>
                                {getStatusBadge(m.status)}
                              </div>

                              <button
                                onClick={() =>
                                  setSelectedInvoice({
                                    ...m.toObject?.() || m,
                                    projectName: project.name,
                                    currency: project.currency,
                                    clientCompany: project.clientCompany,
                                  })
                                }
                                className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer shadow-xs"
                                title="View Receipt"
                              >
                                <HiOutlinePrinter className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right 1 col: Deliverables Checklist & PM Contact Card */}
                  <div className="space-y-4">
                    {/* Assigned Project Manager Card */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                        Assigned Project Manager
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                          {project.projectManager?.name?.charAt(0) || 'P'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {project.projectManager?.name || project.projectManagerName || 'Project Lead'}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {project.projectManager?.email || 'pm@company.com'}
                          </p>
                          {project.projectManager?.phone && (
                            <p className="text-[11px] text-indigo-600 font-medium">
                              {project.projectManager.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenQueryModal(project._id)}
                        className="mt-3 w-full py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5" />
                        Send Direct Query to PM
                      </button>
                    </div>

                    {/* Financial Summary Card */}
                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-2 text-xs">
                      <span className="text-[10px] uppercase font-bold text-indigo-800 block">
                        Project Financial Statement
                      </span>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Agreed Project Cost:</span>
                        <strong className="text-slate-900 font-bold">
                          {formatCurrency(project.financials?.totalCost, project.currency)}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Paid Amount:</span>
                        <strong className="text-emerald-600 font-bold">
                          {formatCurrency(project.financials?.totalPaid, project.currency)}
                        </strong>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-indigo-200/60 text-sm">
                        <span className="font-bold text-slate-800">Pending Due:</span>
                        <strong className="font-black text-rose-600">
                          {formatCurrency(project.financials?.totalPending, project.currency)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: INVOICES & BILLINGS */}
      {/* ============================================================ */}
      {activeTab === 'invoices' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Milestone Invoices &amp; Billing Schedule
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official invoices, tax receipts, and payment milestone records across all your contracts.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Total Balance Due</span>
              <span className="text-xl font-black text-rose-600">
                {formatCurrency(summary.totalPending)}
              </span>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Invoice #</th>
                    <th className="py-3.5 px-4">Project</th>
                    <th className="py-3.5 px-4">Milestone Description</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Payment Method &amp; Ref</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No invoices generated yet.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{inv.projectName}</td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{inv.title}</td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'Upon Delivery'}
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900 whitespace-nowrap text-xs sm:text-sm">
                          {formatCurrency(inv.amount, inv.currency)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(inv.status)}</td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {inv.status === 'Paid' ? (
                            <span className="text-emerald-700">
                              {inv.paymentMethod || 'Settled'} {inv.paymentReference ? `(${inv.paymentReference})` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400">Awaiting Settlement</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <HiOutlinePrinter className="w-3.5 h-3.5" />
                            View &amp; Print Invoice
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

      {/* ============================================================ */}
      {/* TAB 4: ASK PM / QUERIES */}
      {/* ============================================================ */}
      {activeTab === 'support' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">Project Queries &amp; Support</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Send inquiries directly to your assigned project manager regarding timeline, scope changes, or billings.
              </p>
            </div>
            <button
              onClick={() => handleOpenQueryModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              <HiOutlinePlus className="w-4 h-4" />
              Ask a New Question
            </button>
          </div>

          {/* Queries List */}
          {recentQueries.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
              <HiOutlineChatBubbleLeftRight className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No questions asked yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Have a question about your project progress, deliverables, or invoice? Click below to send a note to your manager.
              </p>
              <button
                onClick={() => handleOpenQueryModal()}
                className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                + Ask Question
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentQueries.map((q) => (
                <div key={q._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                          {q.category}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          Project: <strong>{q.projectName}</strong>
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{q.subject}</h4>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        q.status === 'Answered'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    "{q.message}"
                  </p>

                  {/* PM Response */}
                  {q.response && (
                    <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-emerald-800 font-bold text-[11px]">
                        <span>Response from {q.respondedByName || 'Project Manager'}:</span>
                        <span>{new Date(q.respondedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-800 leading-relaxed">{q.response}</p>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 text-right">
                    Sent on {new Date(q.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: PRINTABLE TAX INVOICE RECEIPT */}
      {/* ============================================================ */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setSelectedInvoice(null)}
          />
          <div className="relative bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            {/* Modal Actions Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md p-4 border-b border-slate-200 flex items-center justify-between z-10 print:hidden">
              <span className="text-xs font-bold text-slate-500 uppercase">
                Invoice Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintInvoice}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  <HiOutlinePrinter className="w-4 h-4" />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Container */}
            <div ref={invoicePrintRef} className="p-8 sm:p-10 space-y-6 font-sans text-slate-800">
              {/* Invoice Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center">
                      GI
                    </div>
                    <span className="font-extrabold text-base tracking-tight text-slate-900">
                      {user?.company?.name || 'Global Infotech Systems'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                    Enterprise Software Architecture &amp; Cloud Platform Services
                  </p>
                </div>

                <div className="text-right">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    TAX INVOICE
                  </h3>
                  <p className="text-xs font-mono font-bold text-indigo-600 mt-0.5">
                    {selectedInvoice.invoiceNumber}
                  </p>
                  <div className="mt-2 inline-block">
                    {selectedInvoice.status === 'Paid' ? (
                      <span className="px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                        PAID IN FULL
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                        PAYMENT PENDING
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Billed To / From */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    BILLED TO
                  </span>
                  <p className="font-bold text-slate-900 text-sm">
                    {user?.name}
                  </p>
                  {selectedInvoice.clientCompany && (
                    <p className="text-slate-600 font-medium">{selectedInvoice.clientCompany}</p>
                  )}
                  <p className="text-slate-500">{user?.email}</p>
                </div>

                <div className="text-right space-y-1">
                  <div>
                    <span className="text-slate-400 text-[11px]">Invoice Date:</span>{' '}
                    <span className="font-bold text-slate-800">
                      {selectedInvoice.invoiceDate ? new Date(selectedInvoice.invoiceDate).toLocaleDateString() : new Date().toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Due Date:</span>{' '}
                    <span className="font-bold text-slate-800">
                      {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : 'Upon Delivery'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Project:</span>{' '}
                    <span className="font-bold text-indigo-700">{selectedInvoice.projectName}</span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-4">Item &amp; Scope Description</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-900 text-sm">{selectedInvoice.title}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {selectedInvoice.description || 'Milestone contract phase deliverable.'}
                        </p>
                        {selectedInvoice.projectName && (
                          <span className="text-[10px] font-mono text-indigo-600 mt-1 block">
                            Contract: {selectedInvoice.projectName}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right font-black text-slate-900 text-base">
                        {formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total Calculation */}
              <div className="flex justify-end pt-2 text-xs">
                <div className="w-64 space-y-1.5">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Applicable Tax / GST:</span>
                    <span>Included in Contract</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Amount:</span>
                    <span className="text-indigo-600 font-black">
                      {formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Receipt Acknowledgement */}
              {selectedInvoice.status === 'Paid' && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1 text-emerald-900">
                  <div className="flex items-center gap-1 font-bold text-emerald-800">
                    <HiOutlineCheckCircle className="w-4 h-4 text-emerald-600" />
                    Payment Acknowledged &amp; Verified
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-emerald-800">
                    <div>
                      <span>Settled On:</span>{' '}
                      <strong>{new Date(selectedInvoice.paidAt || Date.now()).toLocaleDateString()}</strong>
                    </div>
                    <div>
                      <span>Payment Method:</span>{' '}
                      <strong>{selectedInvoice.paymentMethod || 'Bank Transfer'}</strong>
                    </div>
                    {selectedInvoice.paymentReference && (
                      <div className="col-span-2">
                        <span>Transaction Reference / UTR:</span>{' '}
                        <strong className="font-mono">{selectedInvoice.paymentReference}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom Notice */}
              <div className="pt-6 border-t border-slate-200 text-center text-[11px] text-slate-400">
                This is a computerized tax invoice generated directly from your Client Portal. No physical signature is required.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: ASK QUESTION / DIRECT QUERY TO PM */}
      {/* ============================================================ */}
      {isQueryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setIsQueryModalOpen(false)}
          />
          <div className="relative bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Ask Project Manager</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Send a query regarding project progress, delivery schedule, or billings.
                </p>
              </div>
              <button
                onClick={() => setIsQueryModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitQuery} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Project *
                </label>
                <select
                  required
                  value={selectedProjectForQuery}
                  onChange={(e) => setSelectedProjectForQuery(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select project...</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Query Category *
                </label>
                <select
                  value={queryCategory}
                  onChange={(e) => setQueryCategory(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="Progress Update">Progress Update</option>
                  <option value="Billing & Invoice">Billing &amp; Invoice</option>
                  <option value="Feature / Scope Change">Feature / Scope Change</option>
                  <option value="Feedback">Feedback</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={querySubject}
                  onChange={(e) => setQuerySubject(e.target.value)}
                  placeholder="e.g. When will the beta release build be deployed on staging?"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detailed Message *
                </label>
                <textarea
                  rows={4}
                  required
                  value={queryMessage}
                  onChange={(e) => setQueryMessage(e.target.value)}
                  placeholder="Explain your question or requirement clearly..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsQueryModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitQueryMutation.isPending}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {submitQueryMutation.isPending ? 'Sending...' : 'Send Query to PM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;
