import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { API_BASE_URL } from '../../config';
import { HiOutlineCalendarDays } from 'react-icons/hi2';

const MyAttendance = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: logs, isLoading } = useQuery({
    queryKey: ['myAttendanceReport', selectedMonth, selectedYear],
    queryFn: async () => {
      const { data } = await api.get(`/attendance/my-report?month=${selectedMonth}&year=${selectedYear}`);
      return Array.isArray(data) ? data : [];
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Late': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Half Day': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Absent': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Personal Attendance Records</h1>
          <p className="text-sm text-slate-500 mt-1">View your daily time logs, punctuality metrics, and verification selfies.</p>
        </div>

        <div className="flex items-center gap-2.5 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs font-semibold focus:border-indigo-600 outline-none"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs font-semibold focus:border-indigo-600 outline-none"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold uppercase">
                <th className="p-4">Date</th>
                <th className="p-4">Punch In</th>
                <th className="p-4">Punch Out</th>
                <th className="p-4">Punctuality</th>
                <th className="p-4">Status</th>
                <th className="p-4">In Selfie</th>
                <th className="p-4">Out Selfie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-slate-400">
                    <div className="inline-block w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : logs?.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-slate-400">
                    No attendance records found for this period.
                  </td>
                </tr>
              ) : (
                logs?.map(log => (
                  <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-semibold text-slate-900">
                      {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-4 text-slate-700 font-mono font-medium">
                      {new Date(log.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 text-slate-700 font-mono font-medium">
                      {log.punchOut ? new Date(log.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="p-4">
                      {log.lateByMinutes > 0 ? (
                        <span className="text-amber-700 text-xs font-semibold bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                          {Math.floor(log.lateByMinutes / 60) > 0 ? `${Math.floor(log.lateByMinutes / 60)}h ` : ''}{log.lateByMinutes % 60}m late
                        </span>
                      ) : (
                        <span className="text-emerald-700 text-xs font-semibold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                          On Time
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {log.punchInPhoto ? (
                        <a href={`${API_BASE_URL}${log.punchInPhoto}`} target="_blank" rel="noreferrer" className="block w-9 h-9 rounded-lg border border-slate-200 overflow-hidden hover:opacity-80 transition-opacity shadow-xs" title="View Punch In Photo">
                          <img src={`${API_BASE_URL}${log.punchInPhoto}`} alt="In" className="w-full h-full object-cover" />
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs">N/A</span>
                      )}
                    </td>
                    <td className="p-4">
                      {log.punchOutPhoto ? (
                        <a href={`${API_BASE_URL}${log.punchOutPhoto}`} target="_blank" rel="noreferrer" className="block w-9 h-9 rounded-lg border border-slate-200 overflow-hidden hover:opacity-80 transition-opacity shadow-xs" title="View Punch Out Photo">
                          <img src={`${API_BASE_URL}${log.punchOutPhoto}`} alt="Out" className="w-full h-full object-cover" />
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyAttendance;
