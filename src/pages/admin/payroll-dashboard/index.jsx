import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';
import { HiOutlineDocumentChartBar, HiOutlineSparkles, HiOutlineUserGroup } from 'react-icons/hi2';

const PayrollDashboard = () => {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() || 12);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()
  );

  const { data: slips, isLoading } = useQuery({
    queryKey: ['allSalarySlips', selectedMonth, selectedYear],
    queryFn: async () => {
      const { data } = await api.get(`/payroll/all?month=${selectedMonth}&year=${selectedYear}`);
      return Array.isArray(data) ? data : [];
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/payroll/generate', {
        month: selectedMonth,
        year: selectedYear,
      });
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['allSalarySlips', selectedMonth, selectedYear] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to generate payroll');
    },
  });

  const monthLabel = new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' });

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ===================== HEADER ===================== */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Payroll Processing Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Generate and view organization salary slips for the selected month.
          </p>
        </div>

        {/* Controls — stacks on mobile, row on desktop */}
        <div className="flex flex-col xs:flex-row sm:flex-row items-stretch xs:items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto">
          <div className="flex items-center gap-2 flex-1 xs:flex-initial">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="flex-1 xs:flex-initial bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors cursor-pointer"
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
              className="flex-1 xs:flex-initial bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors cursor-pointer"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  `Generate salary slips for ${monthLabel} ${selectedYear}? This will recalculate slips for this period.`
                )
              ) {
                generateMutation.mutate();
              }
            }}
            disabled={generateMutation.isPending}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            {generateMutation.isPending ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <HiOutlineSparkles className="w-3.5 h-3.5" />
            )}
            <span>{generateMutation.isPending ? 'Generating...' : 'Generate Payroll'}</span>
          </button>
        </div>
      </div>

      {/* ===================== TABLE ===================== */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm text-slate-700 min-w-[720px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-[10px] sm:text-xs border-b border-slate-200 uppercase font-semibold">
                <th className="p-3 sm:p-4 whitespace-nowrap">Employee</th>
                <th className="p-3 sm:p-4 text-right whitespace-nowrap">Annual CTC</th>
                <th className="p-3 sm:p-4 text-emerald-700 text-right whitespace-nowrap">Gross (A)</th>
                <th className="p-3 sm:p-4 text-rose-700 text-right whitespace-nowrap">Ded. (B)</th>
                <th className="p-3 sm:p-4 text-amber-700 text-right whitespace-nowrap">Late Ded.</th>
                <th className="p-3 sm:p-4 text-indigo-700 text-right font-bold whitespace-nowrap">Net Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center">
                    <div className="inline-block w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                  </td>
                </tr>
              ) : !slips || slips.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 sm:p-12 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                      <HiOutlineDocumentChartBar className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">No salary slips generated</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Click &quot;Generate Payroll&quot; above to process {monthLabel} {selectedYear}.
                    </p>
                  </td>
                </tr>
              ) : (
                slips.map((slip) => (
                  <tr key={slip._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                          {slip.user?.profilePicture ? (
                            <img
                              src={`${API_BASE_URL}${slip.user.profilePicture}`}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            slip.user?.name?.charAt(0) || 'U'
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-xs truncate max-w-[140px]">
                            {slip.user?.name}
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-slate-500 truncate max-w-[140px]">
                            {slip.user?.designation || 'Employee'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 text-slate-700 font-medium font-mono text-right whitespace-nowrap">
                      ₹{(slip.fixedCTC || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="p-3 sm:p-4 text-emerald-700 font-semibold text-right font-mono whitespace-nowrap">
                      ₹{(slip.grossEarnings || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="p-3 sm:p-4 text-rose-700 font-semibold text-right font-mono whitespace-nowrap">
                      -₹{(slip.totalDeductions || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="p-3 sm:p-4 text-amber-700 text-right font-medium font-mono whitespace-nowrap">
                      -₹{(slip.deductions?.lateDeduction || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}{' '}
                      <span className="text-[10px] text-slate-400 font-sans">
                        ({slip.stats?.lateDays || 0}d)
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 text-indigo-700 font-extrabold text-right text-xs sm:text-sm border-l border-slate-100 font-mono whitespace-nowrap">
                      ₹{(slip.netPay || slip.netSalary || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
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

export default PayrollDashboard;