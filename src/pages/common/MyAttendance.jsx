import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { API_BASE_URL } from '../../config';
import {
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from 'react-icons/hi2';

const getStatusColor = (status) => {
  switch (status) {
    case 'Present':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Late':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Half Day':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'Absent':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const MyAttendance = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: logs, isLoading } = useQuery({
    queryKey: ['myAttendanceReport', selectedMonth, selectedYear],
    queryFn: async () => {
      const { data } = await api.get(
        `/attendance/my-report?month=${selectedMonth}&year=${selectedYear}`
      );
      return Array.isArray(data) ? data : [];
    },
  });

  const formatTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLate = (minutes) => {
    if (minutes <= 0) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m late` : `${m}m late`;
  };

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ===================== PAGE HEADER ===================== */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Personal Attendance Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View your daily time logs, punctuality metrics, and verification selfies.
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

      {/* ===================== TABLE / LIST ===================== */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="w-9 h-9 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <HiOutlineCalendarDays className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-1">No attendance records</p>
            <p className="text-xs text-slate-500">
              No records found for this period. Try selecting a different month.
            </p>
          </div>
        ) : (
          <>
            {/* ---------- MOBILE CARD VIEW (< md) ---------- */}
            <div className="md:hidden divide-y divide-slate-100">
              {logs.map((log) => {
                const lateText = formatLate(log.lateByMinutes);
                return (
                  <div key={log._id} className="p-4 hover:bg-slate-50/60 transition-colors">
                    {/* Date + Status */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-xs">
                          {new Date(log.date).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                          })}
                        </p>
                        {lateText ? (
                          <span className="inline-flex mt-1 text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {lateText}
                          </span>
                        ) : (
                          <span className="inline-flex mt-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            On Time
                          </span>
                        )}
                      </div>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${getStatusColor(
                          log.status
                        )}`}
                      >
                        {log.status}
                      </span>
                    </div>

                    {/* Punch In/Out grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] mb-2.5">
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                        <span className="text-slate-500 block text-[9px] uppercase font-semibold mb-0.5">
                          Punch In
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {formatTime(log.punchIn)}
                        </span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                        <span className="text-slate-500 block text-[9px] uppercase font-semibold mb-0.5">
                          Punch Out
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {formatTime(log.punchOut)}
                        </span>
                      </div>
                    </div>

                    {/* Selfies */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">
                        Selfies:
                      </span>
                      {log.punchInPhoto ? (
                        <a
                          href={`${API_BASE_URL}${log.punchInPhoto}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block w-9 h-9 rounded-lg border border-slate-200 overflow-hidden hover:opacity-80 transition-opacity shadow-sm"
                          title="View Punch In Photo"
                        >
                          <img
                            src={`${API_BASE_URL}${log.punchInPhoto}`}
                            alt="Punch In"
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ) : (
                        <span className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-[10px]">
                          N/A
                        </span>
                      )}
                      {log.punchOutPhoto ? (
                        <a
                          href={`${API_BASE_URL}${log.punchOutPhoto}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block w-9 h-9 rounded-lg border border-slate-200 overflow-hidden hover:opacity-80 transition-opacity shadow-sm"
                          title="View Punch Out Photo"
                        >
                          <img
                            src={`${API_BASE_URL}${log.punchOutPhoto}`}
                            alt="Punch Out"
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ) : (
                        <span className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-[10px]">
                          —
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ---------- DESKTOP TABLE (md+) ---------- */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 min-w-[800px]">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap">Date</th>
                    <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap">Punch In</th>
                    <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap">Punch Out</th>
                    <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap">Punctuality</th>
                    <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap">Status</th>
                    <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap">In Selfie</th>
                    <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap">Out Selfie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {logs.map((log) => {
                    const lateText = formatLate(log.lateByMinutes);
                    return (
                      <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 lg:px-6 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                          {new Date(log.date).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-4 lg:px-6 py-3.5 text-slate-700 font-mono font-medium whitespace-nowrap">
                          {formatTime(log.punchIn)}
                        </td>
                        <td className="px-4 lg:px-6 py-3.5 text-slate-700 font-mono font-medium whitespace-nowrap">
                          {formatTime(log.punchOut)}
                        </td>
                        <td className="px-4 lg:px-6 py-3.5">
                          {lateText ? (
                            <span className="inline-flex text-amber-700 text-[11px] font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 whitespace-nowrap">
                              {lateText}
                            </span>
                          ) : (
                            <span className="inline-flex text-emerald-700 text-[11px] font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 whitespace-nowrap">
                              On Time
                            </span>
                          )}
                        </td>
                        <td className="px-4 lg:px-6 py-3.5">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${getStatusColor(
                              log.status
                            )}`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-3.5">
                          {log.punchInPhoto ? (
                            <a
                              href={`${API_BASE_URL}${log.punchInPhoto}`}
                              target="_blank"
                              rel="noreferrer"
                              className="block w-9 h-9 rounded-lg border border-slate-200 overflow-hidden hover:opacity-80 transition-opacity shadow-sm"
                              title="View Punch In Photo"
                            >
                              <img
                                src={`${API_BASE_URL}${log.punchInPhoto}`}
                                alt="In"
                                className="w-full h-full object-cover"
                              />
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[11px]">N/A</span>
                          )}
                        </td>
                        <td className="px-4 lg:px-6 py-3.5">
                          {log.punchOutPhoto ? (
                            <a
                              href={`${API_BASE_URL}${log.punchOutPhoto}`}
                              target="_blank"
                              rel="noreferrer"
                              className="block w-9 h-9 rounded-lg border border-slate-200 overflow-hidden hover:opacity-80 transition-opacity shadow-sm"
                              title="View Punch Out Photo"
                            >
                              <img
                                src={`${API_BASE_URL}${log.punchOutPhoto}`}
                                alt="Out"
                                className="w-full h-full object-cover"
                              />
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
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
    </div>
  );
};

export default MyAttendance;