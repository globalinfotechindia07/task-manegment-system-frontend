import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  HiOutlineDocumentText,
  HiOutlineCalendarDays,
  HiOutlineChevronDown,
  HiOutlineUsers,
} from 'react-icons/hi2';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

const PerformanceReport = () => {
  const { user } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expandedUser, setExpandedUser] = useState(null);
  const [userLogs, setUserLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const {
    data: summary,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['performanceSummary', selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await api.get(
        `/performance/summary?month=${selectedMonth}&year=${selectedYear}`
      );
      return response.data;
    },
  });

  const fetchUserLogs = async (userId) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      return;
    }
    setLogsLoading(true);
    try {
      const response = await api.get(
        `/performance/logs/${userId}?month=${selectedMonth}&year=${selectedYear}`
      );
      setUserLogs(response.data);
      setExpandedUser(userId);
    } catch (err) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16 min-h-[400px]">
        <div className="w-9 h-9 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-rose-200 text-center max-w-xl mx-auto my-8 shadow-sm">
        <h3 className="text-slate-900 font-bold text-base sm:text-lg mb-2">
          Error Loading Performance Data
        </h3>
        <p className="text-slate-500 text-xs">{error?.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ===================== PAGE HEADER ===================== */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Performance Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor employee task completion rates and overdue metrics.
          </p>
        </div>

        {/* Month / Year Selectors */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto">
          <HiOutlineCalendarDays className="w-4 h-4 text-indigo-600 shrink-0 ml-1" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="flex-1 md:flex-initial bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors cursor-pointer"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="flex-1 md:flex-initial bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors cursor-pointer"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ===================== PERFORMANCE TABLE / LIST ===================== */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">

        {!summary || summary.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <HiOutlineUsers className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-1">No performance data</p>
            <p className="text-xs text-slate-500">
              No records available for this month. Try selecting a different period.
            </p>
          </div>
        ) : (
          <>
            {/* ---------- MOBILE CARD VIEW (< md) ---------- */}
            <div className="md:hidden divide-y divide-slate-100">
              {summary.map(({ user: emp, stats }) => {
                const isExpanded = expandedUser === emp._id;
                return (
                  <div key={emp._id} className="p-4 hover:bg-slate-50/60 transition-colors">
                    {/* Header: avatar + name + dept */}
                    <div className="flex items-start gap-2.5 mb-2.5">
                      <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 overflow-hidden flex items-center justify-center font-bold text-xs shrink-0">
                        {emp.profilePicture ? (
                          <img
                            src={`${API_BASE_URL}${emp.profilePicture}`}
                            alt={emp.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          emp.name?.charAt(0) || 'U'
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 text-xs truncate">{emp.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {emp.designation || '—'} • {emp.department || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-4 gap-1.5 mb-2.5 text-center">
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                        <p className="text-[9px] text-slate-500 uppercase font-semibold">Total</p>
                        <p className="text-xs font-bold text-slate-900 font-mono">
                          {stats.totalTasks}
                        </p>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-1.5">
                        <p className="text-[9px] text-emerald-700 uppercase font-semibold">On Time</p>
                        <p className="text-xs font-bold text-emerald-700 font-mono">
                          {stats.onTimeTasks}
                        </p>
                      </div>
                      <div className="bg-rose-50 border border-rose-200 rounded-lg p-1.5">
                        <p className="text-[9px] text-rose-700 uppercase font-semibold">Late</p>
                        <p className="text-xs font-bold text-rose-700 font-mono">
                          {stats.lateTasks}
                        </p>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                        <p className="text-[9px] text-slate-500 uppercase font-semibold">Days</p>
                        <p
                          className={`text-xs font-bold font-mono ${stats.totalDaysLate > 0 ? 'text-rose-700' : 'text-slate-700'
                            }`}
                        >
                          {stats.totalDaysLate}
                        </p>
                      </div>
                    </div>

                    {/* Toggle Logs button */}
                    <button
                      type="button"
                      onClick={() => fetchUserLogs(emp._id)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                    >
                      <HiOutlineDocumentText className="w-3.5 h-3.5" />
                      {isExpanded ? 'Hide Logs' : 'View Task Logs'}
                      <HiOutlineChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''
                          }`}
                      />
                    </button>

                    {/* Expanded Logs */}
                    {isExpanded && (
                      <div className="mt-2.5 border-l-2 border-indigo-500 pl-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        {logsLoading ? (
                          <div className="flex justify-center py-4">
                            <div className="w-5 h-5 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                          </div>
                        ) : userLogs.length === 0 ? (
                          <p className="text-[11px] text-slate-500 italic py-2">
                            No task logs found for this period.
                          </p>
                        ) : (
                          userLogs.map((log) => (
                            <div
                              key={log._id}
                              className="bg-white border border-slate-200 rounded-lg p-2.5"
                            >
                              <p className="text-slate-800 font-semibold text-[11px] mb-1 truncate">
                                {log.task?.title || 'Unknown Task'}
                              </p>
                              <div className="text-[10px] text-slate-500 space-y-0.5 mb-1.5">
                                <div>
                                  Due:{' '}
                                  {new Date(log.dueDate).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </div>
                                <div>
                                  Completed:{' '}
                                  {new Date(log.completedAt).toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </div>
                              <span
                                className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${log.status === 'OnTime'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                              >
                                {log.status === 'OnTime'
                                  ? 'On Time'
                                  : `Late by ${log.daysLate} day(s)`}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ---------- DESKTOP TABLE (md+) ---------- */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <th className="px-4 lg:px-6 py-3.5 font-semibold whitespace-nowrap">Employee</th>
                    <th className="px-4 lg:px-6 py-3.5 font-semibold whitespace-nowrap">Department</th>
                    <th className="px-4 lg:px-6 py-3.5 font-semibold text-center whitespace-nowrap">Total</th>
                    <th className="px-4 lg:px-6 py-3.5 font-semibold text-center text-emerald-600 whitespace-nowrap">On Time</th>
                    <th className="px-4 lg:px-6 py-3.5 font-semibold text-center text-rose-600 whitespace-nowrap">Overdue</th>
                    <th className="px-4 lg:px-6 py-3.5 font-semibold text-center whitespace-nowrap">Days Late</th>
                    <th className="px-4 lg:px-6 py-3.5 font-semibold text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {summary.map(({ user: emp, stats }) => {
                    const isExpanded = expandedUser === emp._id;
                    return (
                      <React.Fragment key={emp._id}>
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 lg:px-6 py-3.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 overflow-hidden flex items-center justify-center font-bold text-[11px] shrink-0">
                                {emp.profilePicture ? (
                                  <img
                                    src={`${API_BASE_URL}${emp.profilePicture}`}
                                    alt={emp.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  emp.name?.charAt(0) || 'U'
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 text-xs truncate max-w-[160px]">
                                  {emp.name}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate max-w-[160px]">
                                  {emp.designation || '—'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-3.5 text-slate-600 text-xs truncate max-w-[120px]">
                            {emp.department || 'N/A'}
                          </td>
                          <td className="px-4 lg:px-6 py-3.5 text-center font-semibold text-slate-800 font-mono text-xs">
                            {stats.totalTasks}
                          </td>
                          <td className="px-4 lg:px-6 py-3.5 text-center text-emerald-600 font-semibold font-mono text-xs">
                            {stats.onTimeTasks}
                          </td>
                          <td className="px-4 lg:px-6 py-3.5 text-center text-rose-600 font-semibold font-mono text-xs">
                            {stats.lateTasks}
                          </td>
                          <td className="px-4 lg:px-6 py-3.5 text-center">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${stats.totalDaysLate > 0
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                            >
                              {stats.totalDaysLate} days
                            </span>
                          </td>
                          <td className="px-4 lg:px-6 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => fetchUserLogs(emp._id)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <HiOutlineDocumentText className="w-3.5 h-3.5" />
                              {isExpanded ? 'Hide' : 'View Logs'}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Logs Row */}
                        {isExpanded && (
                          <tr className="bg-slate-50/50">
                            <td colSpan="7" className="p-0">
                              <div className="p-4 border-l-4 border-indigo-600 my-2 mx-4 bg-slate-50 rounded-r-lg border border-slate-200 shadow-sm">
                                <h4 className="text-slate-900 font-semibold mb-3 flex items-center gap-2 text-sm">
                                  <HiOutlineDocumentText className="w-4 h-4 text-indigo-600" />
                                  Detailed Task Logs
                                </h4>

                                {logsLoading ? (
                                  <div className="flex justify-center py-6">
                                    <div className="w-6 h-6 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                                  </div>
                                ) : userLogs.length === 0 ? (
                                  <p className="text-slate-500 text-xs italic py-2">
                                    No task completion logs found for this period.
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {userLogs.map((log) => (
                                      <div
                                        key={log._id}
                                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-3 bg-white rounded-lg border border-slate-200"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <p className="text-slate-800 font-semibold text-xs mb-1 truncate">
                                            {log.task?.title || 'Unknown Task'}
                                          </p>
                                          <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
                                            <span>
                                              Due:{' '}
                                              {new Date(log.dueDate).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                              })}
                                            </span>
                                            <span>
                                              Completed:{' '}
                                              {new Date(log.completedAt).toLocaleString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                              })}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="shrink-0">
                                          {log.status === 'OnTime' ? (
                                            <span className="inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full border border-emerald-200 whitespace-nowrap">
                                              On Time
                                            </span>
                                          ) : (
                                            <span className="inline-flex px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-semibold rounded-full border border-rose-200 whitespace-nowrap">
                                              Late by {log.daysLate} day(s)
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PerformanceReport;