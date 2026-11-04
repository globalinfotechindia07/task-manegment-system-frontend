import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  HiOutlineCommandLine,
  HiOutlineShieldCheck,
  HiOutlineUsers,
  HiOutlineExclamationTriangle,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineArrowPath,
  HiOutlineDocumentDuplicate,
  HiOutlineXMark,
  HiOutlineEye,
  HiOutlineBuildingOffice2,
  HiOutlineClock,
  HiOutlineTrash,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineBolt,
} from 'react-icons/hi2';
import api from '../../../api/axios';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'AUTH', label: 'Authentication' },
  { value: 'WORK', label: 'Work & Tasks' },
  { value: 'ATTENDANCE', label: 'Attendance & Punches' },
  { value: 'PAYROLL', label: 'Payroll & Salary' },
  { value: 'DATABASE', label: 'Database & Queries' },
  { value: 'SYSTEM', label: 'System & Errors' },
  { value: 'SUPPORT', label: 'Helpdesk & Tickets' },
];

const STATUSES = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'SUCCESS', label: 'Success Only' },
  { value: 'WARNING', label: 'Warning Only' },
  { value: 'ERROR', label: 'Failed / Errors Only' },
];

const AuditLogs = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' or 'ERRORS'
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [inspectLog, setInspectLog] = useState(null);
  const [isCleaning, setIsCleaning] = useState(false);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Tab switch logic
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    if (tab === 'ERRORS') {
      setSelectedStatus('ERROR');
    } else {
      setSelectedStatus('ALL');
    }
  };

  // 1. Fetch Audit Stats
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['auditStats'],
    queryFn: async () => {
      const { data } = await api.get('/audit-logs/stats');
      return data?.stats || {};
    },
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // 2. Fetch Paginated Audit Logs
  const { data: logsData, isLoading: logsLoading, isFetching: logsFetching, refetch: refetchLogs } = useQuery({
    queryKey: ['auditLogs', debouncedSearch, selectedCategory, selectedStatus, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);

      const { data } = await api.get(`/audit-logs?${params.toString()}`);
      return data;
    },
    refetchInterval: autoRefresh ? 8000 : false,
    keepPreviousData: true,
  });

  const stats = statsData || {
    totalLogs: 0,
    todayLogsCount: 0,
    failedQueriesCount: 0,
    activeUsersToday: 0,
    totalUsersInSystem: 0,
    workActionsToday: 0,
  };

  const logs = logsData?.logs || [];
  const totalLogsCount = logsData?.total || 0;
  const totalPages = logsData?.pages || 1;

  // Manual Refresh
  const handleManualRefresh = () => {
    refetchStats();
    refetchLogs();
    toast.success('Audit telemetry refreshed');
  };

  // Retention Cleanup (Strict 7-day policy)
  const handleRetentionCleanup = async () => {
    if (!window.confirm('Are you sure you want to purge audit logs older than 7 days?')) return;
    try {
      setIsCleaning(true);
      const { data } = await api.delete('/audit-logs/cleanup?days=7');
      toast.success(data.message || 'Audit logs older than 7 days cleaned up successfully');
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      queryClient.invalidateQueries({ queryKey: ['auditStats'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cleanup old logs');
    } finally {
      setIsCleaning(false);
    }
  };

  // Copy JSON details to clipboard
  const copyDetailsToClipboard = (log) => {
    const jsonString = JSON.stringify(log, null, 2);
    navigator.clipboard.writeText(jsonString);
    toast.success('Log payload copied to clipboard');
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const getStatusBadge = (status) => {
    if (status === 'SUCCESS') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <HiOutlineCheckCircle className="w-3.5 h-3.5" />
          SUCCESS
        </span>
      );
    }
    if (status === 'WARNING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <HiOutlineExclamationTriangle className="w-3.5 h-3.5" />
          WARNING
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
        <HiOutlineExclamationCircle className="w-3.5 h-3.5" />
        FAILED / ERROR
      </span>
    );
  };

  const getCategoryBadge = (category) => {
    const catMap = {
      AUTH: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Auth' },
      WORK: { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Work/Task' },
      ATTENDANCE: { bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', label: 'Attendance' },
      PAYROLL: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Payroll' },
      DATABASE: { bg: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Database' },
      SYSTEM: { bg: 'bg-slate-100 text-slate-700 border-slate-300', label: 'System' },
      SUPPORT: { bg: 'bg-teal-50 text-teal-700 border-teal-200', label: 'Support' },
    };
    const c = catMap[category] || { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: category };
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${c.bg}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Audit Logs & Diagnostics</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <HiOutlineClock className="w-3.5 h-3.5" />
              Rolling 7-Day Window
            </span>
            {logsFetching && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping" />
                Live Syncing
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Rolling 7-day activity telemetry, active user monitor, and database query failure logs (Older logs are automatically purged).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle live telemetry auto-refreshing every 8s"
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {autoRefresh ? 'Live Poll: ON' : 'Live Poll: OFF'}
          </button>

          {/* Manual Refresh */}
          <button
            onClick={handleManualRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <HiOutlineArrowPath className="w-4 h-4 text-slate-500" />
            Refresh
          </button>

          {/* Cleanup */}
          <button
            onClick={handleRetentionCleanup}
            disabled={isCleaning}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Clean logs older than 7 days"
          >
            <HiOutlineTrash className="w-4 h-4 text-rose-500" />
            Purge &gt; 7d
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Events */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">7-Day Audit Events</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <HiOutlineCommandLine className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{stats.totalLogs?.toLocaleString()}</span>
            <span className="text-xs font-medium text-indigo-600">+{stats.todayLogsCount} today</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Rolling 7-day logged actions</p>
        </div>

        {/* Active Users Today */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Users Today</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <HiOutlineUsers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{stats.activeUsersToday}</span>
            <span className="text-xs font-medium text-emerald-600">
              of {stats.totalUsersInSystem || 0} registered
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Distinct users active today</p>
        </div>

        {/* Work Activity Today */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Work Actions Today</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <HiOutlineBolt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{stats.workActionsToday}</span>
            <span className="text-xs font-medium text-blue-600">Punches, tasks & payroll</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Software utilization events</p>
        </div>

        {/* Failed Queries & Errors */}
        <div
          onClick={() => handleTabChange('ERRORS')}
          className={`border rounded-xl p-4 shadow-xs cursor-pointer transition-all ${
            stats.failedQueriesCount > 0
              ? 'bg-rose-50/50 border-rose-200 hover:border-rose-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Failed Queries & Errors</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                stats.failedQueriesCount > 0
                  ? 'bg-rose-100 text-rose-600 border border-rose-200 animate-pulse'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <HiOutlineExclamationTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${stats.failedQueriesCount > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
              {stats.failedQueriesCount}
            </span>
            <span className="text-xs font-medium text-rose-600">Click to isolate</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Database & API execution exceptions</p>
        </div>
      </div>

      {/* Tabs & Search Filter Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <button
            onClick={() => handleTabChange('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Activity Telemetry
          </button>
          <button
            onClick={() => handleTabChange('ERRORS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ERRORS'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-rose-50 hover:text-rose-600'
            }`}
          >
            <HiOutlineExclamationTriangle className="w-3.5 h-3.5" />
            Failed Queries & Exceptions ({stats.failedQueriesCount})
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="lg:col-span-6 relative">
            <HiOutlineMagnifyingGlass className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by action, user name, email, office, or endpoint..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
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

          {/* Category Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
                if (e.target.value === 'ERROR') {
                  setActiveTab('ERRORS');
                } else {
                  setActiveTab('ALL');
                }
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white"
            >
              {STATUSES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor / User</th>
                <th className="py-3 px-4">Office / Tenant</th>
                <th className="py-3 px-4">Action & Category</th>
                <th className="py-3 px-4">Endpoint</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {logsLoading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      Loading audit logs...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <HiOutlineCommandLine className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No audit logs matching your current filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isError = log.status === 'ERROR' || log.action?.includes('FAIL') || log.action?.includes('ERROR');
                  return (
                    <tr
                      key={log._id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isError ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-[11px] text-slate-800 font-medium">
                          {formatDate(log.createdAt)}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <HiOutlineClock className="w-3 h-3" />
                          {log.ipAddress || '127.0.0.1'}
                        </div>
                      </td>

                      {/* Actor / User */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 truncate max-w-[150px]">
                          {log.userName || 'System Process'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                          {log.userRole ? (
                            <span className="font-medium text-indigo-600">{log.userRole}</span>
                          ) : (
                            <span className="text-slate-400">System</span>
                          )}
                          {log.userEmail && ` • ${log.userEmail}`}
                        </div>
                      </td>

                      {/* Office / Tenant */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <HiOutlineBuildingOffice2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]">{log.companyName || 'Global Platform'}</span>
                        </div>
                      </td>

                      {/* Action & Category */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-semibold text-slate-900 text-[11px]">
                            {log.action}
                          </span>
                          {getCategoryBadge(log.category)}
                        </div>
                        {log.details?.errorMessage && (
                          <div className="text-[11px] text-rose-600 font-medium truncate max-w-[280px] mt-0.5">
                            {log.details.errorMessage}
                          </div>
                        )}
                      </td>

                      {/* Endpoint */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {log.method && (
                          <span className="font-bold text-slate-800 mr-1.5">{log.method}</span>
                        )}
                        <span className="text-slate-500 truncate max-w-[150px] inline-block align-bottom">
                          {log.endpoint || '-'}
                        </span>
                        {log.statusCode && (
                          <span
                            className={`ml-1.5 px-1 py-0.5 rounded text-[10px] font-bold ${
                              log.statusCode >= 500
                                ? 'bg-rose-100 text-rose-700'
                                : log.statusCode >= 400
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {log.statusCode}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(log.status)}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setInspectLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md font-medium text-xs shadow-2xs transition-colors cursor-pointer"
                        >
                          <HiOutlineEye className="w-3.5 h-3.5 text-slate-500" />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold text-slate-900">{logs.length}</span> of{' '}
            <span className="font-semibold text-slate-900">{totalLogsCount}</span> events
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <HiOutlineChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <span className="px-2 font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <HiOutlineChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Inspect Log Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <HiOutlineCommandLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>Audit Event: {inspectLog.action}</span>
                    {getStatusBadge(inspectLog.status)}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: {inspectLog._id} • {formatDate(inspectLog.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* If Failure or Error: Special Attention Box */}
              {(inspectLog.status === 'ERROR' || inspectLog.action?.includes('FAIL')) && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
                  <div className="flex items-center gap-2 font-bold text-rose-800 mb-1">
                    <HiOutlineExclamationTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    Query Execution / Exception Detected
                  </div>
                  <p className="font-mono text-xs text-rose-800 break-words">
                    {inspectLog.details?.errorMessage || inspectLog.details?.error || 'Database query or server execution failure occurred.'}
                  </p>
                  {inspectLog.details?.stack && (
                    <div className="mt-2.5 p-2 bg-rose-100/60 rounded font-mono text-[11px] text-rose-950 overflow-x-auto whitespace-pre max-h-36">
                      {inspectLog.details.stack}
                    </div>
                  )}
                </div>
              )}

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">User Name</span>
                  <span className="font-semibold text-slate-800">{inspectLog.userName || 'System'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">User Role</span>
                  <span className="font-semibold text-indigo-600">{inspectLog.userRole || 'Automated'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Company / Office</span>
                  <span className="font-semibold text-slate-800">{inspectLog.companyName || 'Global'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Category</span>
                  <span className="font-semibold text-slate-800">{inspectLog.category}</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">HTTP Method & Code</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {inspectLog.method || '-'} {inspectLog.statusCode ? `(${inspectLog.statusCode})` : ''}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Client IP</span>
                  <span className="font-mono text-slate-800">{inspectLog.ipAddress || '127.0.0.1'}</span>
                </div>
              </div>

              {/* Endpoint & User Agent */}
              <div className="space-y-2">
                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Endpoint URL</span>
                  <span className="font-mono text-slate-800 select-all">{inspectLog.endpoint || 'N/A'}</span>
                </div>
                {inspectLog.userAgent && (
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">User Agent</span>
                    <span className="text-slate-600 break-all">{inspectLog.userAgent}</span>
                  </div>
                )}
              </div>

              {/* Complete JSON Payload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] uppercase font-bold text-slate-500">Event Details Payload</span>
                  <button
                    onClick={() => copyDetailsToClipboard(inspectLog)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    <HiOutlineDocumentDuplicate className="w-3.5 h-3.5" />
                    Copy JSON
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-56 select-all">
                  {JSON.stringify(inspectLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Audit telemetry immutable record</span>
              <button
                onClick={() => setInspectLog(null)}
                className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;

