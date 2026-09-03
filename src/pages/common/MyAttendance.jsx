import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { API_BASE_URL } from '../../config';

const MyAttendance = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: logs, isLoading } = useQuery({
    queryKey: ['myAttendanceReport', selectedMonth, selectedYear],
    queryFn: async () => {
      const { data } = await api.get(`/attendance/my-report?month=${selectedMonth}&year=${selectedYear}`);
      return data;
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Late': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Half Day': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'Absent': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">My Attendance Report</h1>
          <p className="text-slate-400">View your daily punch-in records and attendance status.</p>
        </div>

        <div className="flex items-center gap-4 bg-slate-800 p-2 rounded-xl border border-slate-700">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-800/50 text-slate-300 border-b border-slate-700">
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Punch In</th>
                <th className="p-4 font-medium">Punch Out</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Selfie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">Loading your report...</td>
                </tr>
              ) : logs?.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">No attendance records found for this month.</td>
                </tr>
              ) : (
                logs?.map(log => (
                  <tr key={log._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-medium text-slate-200">
                      {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-4 text-slate-300 font-mono">
                      {new Date(log.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 text-slate-300 font-mono">
                      {log.punchOut ? new Date(log.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold border ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {log.punchInPhoto ? (
                        <a href={`${API_BASE_URL}${log.punchInPhoto}`} target="_blank" rel="noreferrer" className="block w-10 h-10 rounded border border-slate-700 overflow-hidden hover:opacity-80 transition-opacity">
                          <img src={`${API_BASE_URL}${log.punchInPhoto}`} alt="Selfie" className="w-full h-full object-cover" />
                        </a>
                      ) : (
                        <span className="text-slate-500 text-xs">No Photo</span>
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
