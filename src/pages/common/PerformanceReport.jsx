import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HiOutlineDocumentText } from 'react-icons/hi2';
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

  // Fetch summary
  const { data: summary, isLoading, isError, error } = useQuery({
    queryKey: ['performanceSummary', selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await api.get(`/performance/summary?month=${selectedMonth}&year=${selectedYear}`);
      return response.data;
    }
  });

  const fetchUserLogs = async (userId) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      return;
    }
    setLogsLoading(true);
    try {
      const response = await api.get(`/performance/logs/${userId}?month=${selectedMonth}&year=${selectedYear}`);
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
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isError) {
    return <div className="p-8 text-rose-600">Error loading performance data: {error?.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Performance Analytics</h1>
          <p className="text-sm text-slate-500">Monitor employee task completion rates and overdue metrics.</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 font-semibold">Employee</th>
                <th className="p-4 font-semibold">Department</th>
                <th className="p-4 font-semibold text-center">Total Completed</th>
                <th className="p-4 font-semibold text-center text-emerald-600">On Time</th>
                <th className="p-4 font-semibold text-center text-rose-600">Overdue</th>
                <th className="p-4 font-semibold text-center">Days Late</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {summary?.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    No performance data available for this month.
                  </td>
                </tr>
              ) : (
                summary?.map(({ user: emp, stats }) => (
                  <React.Fragment key={emp._id}>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                            {emp.profilePicture ? (
                              <img src={`${API_BASE_URL}${emp.profilePicture}`} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-slate-700 text-xs">
                                {emp.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{emp.name}</p>
                            <p className="text-xs text-slate-500">{emp.designation}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600">{emp.department || 'N/A'}</td>
                      <td className="p-4 text-center font-semibold text-slate-800">{stats.totalTasks}</td>
                      <td className="p-4 text-center text-emerald-600 font-semibold">{stats.onTimeTasks}</td>
                      <td className="p-4 text-center text-rose-600 font-semibold">{stats.lateTasks}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${stats.totalDaysLate > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {stats.totalDaysLate} days
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => fetchUserLogs(emp._id)}
                          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
                        >
                          {expandedUser === emp._id ? 'Hide Logs' : 'View Logs'}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Logs Section */}
                    {expandedUser === emp._id && (
                      <tr className="bg-slate-50/50">
                        <td colSpan="7" className="p-0">
                          <div className="p-4 border-l-4 border-indigo-600 my-2 mx-4 bg-slate-50 rounded-r-lg border border-slate-200 shadow-sm">
                            <h4 className="text-slate-900 font-semibold mb-3 flex items-center gap-2 text-sm">
                              <HiOutlineDocumentText className="w-4 h-4 text-indigo-600" />
                              Detailed Task Logs
                            </h4>
                            
                            {logsLoading ? (
                              <div className="text-slate-500 text-sm animate-pulse">Loading logs...</div>
                            ) : userLogs.length === 0 ? (
                              <div className="text-slate-500 text-sm">No task completion logs found for this period.</div>
                            ) : (
                              <div className="space-y-2">
                                {userLogs.map(log => (
                                  <div key={log._id} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                                    <div className="flex-1">
                                      <p className="text-slate-800 font-medium text-sm mb-1">{log.task?.title || 'Unknown Task'}</p>
                                      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                                        <span>Due: {new Date(log.dueDate).toLocaleDateString()}</span>
                                        <span>Completed: {new Date(log.completedAt).toLocaleString()}</span>
                                      </div>
                                    </div>
                                    <div className="mt-2 md:mt-0 flex items-center gap-3 shrink-0">
                                      {log.status === 'OnTime' ? (
                                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                                          On Time
                                        </span>
                                      ) : (
                                        <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 text-xs font-semibold rounded-full border border-rose-200">
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PerformanceReport;
