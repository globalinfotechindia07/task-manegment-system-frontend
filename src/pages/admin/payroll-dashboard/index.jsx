import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';
import { HiOutlineDocumentChartBar, HiOutlineSparkles } from 'react-icons/hi2';

const PayrollDashboard = () => {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() || 12);
  const [selectedYear, setSelectedYear] = useState(new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear());

  const { data: slips, isLoading } = useQuery({
    queryKey: ['allSalarySlips', selectedMonth, selectedYear],
    queryFn: async () => {
      const { data } = await api.get(`/payroll/all?month=${selectedMonth}&year=${selectedYear}`);
      return Array.isArray(data) ? data : [];
    }
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/payroll/generate', { month: selectedMonth, year: selectedYear });
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['allSalarySlips', selectedMonth, selectedYear] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to generate payroll');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payroll Processing Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Generate and view organization salary slips for the selected month.</p>
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
          <button
            onClick={() => {
              if (window.confirm(`Generate salary slips for ${new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })} ${selectedYear}? This will recalculate slips for this period.`)) {
                generateMutation.mutate();
              }
            }}
            disabled={generateMutation.isPending}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5 shrink-0"
          >
            <HiOutlineSparkles className="w-3.5 h-3.5" />
            {generateMutation.isPending ? 'Generating...' : 'Generate Payroll'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm text-slate-700">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs border-b border-slate-200 uppercase font-semibold">
                <th className="p-4">Employee</th>
                <th className="p-4">Annual CTC</th>
                <th className="p-4 text-emerald-700 text-right">Gross Earnings (A)</th>
                <th className="p-4 text-rose-700 text-right">Total Ded. (B)</th>
                <th className="p-4 text-amber-700 text-right">Late Ded. (incl. in B)</th>
                <th className="p-4 text-indigo-700 text-right font-bold">Net Pay (A-B)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-slate-400">
                    <div className="inline-block w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : slips?.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-slate-400">
                    No salary slips generated for this period. Click "Generate Payroll" above.
                  </td>
                </tr>
              ) : (
                slips?.map((slip) => (
                  <tr key={slip._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                          {slip.user?.profilePicture ? (
                            <img src={`${API_BASE_URL}${slip.user.profilePicture}`} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            slip.user?.name?.charAt(0) || 'U'
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-xs">{slip.user?.name}</p>
                          <p className="text-[11px] text-slate-500">{slip.user?.designation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-700 font-medium">₹{(slip.fixedCTC || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="p-4 text-emerald-700 font-semibold text-right">₹{(slip.grossEarnings || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="p-4 text-rose-700 font-semibold text-right">-₹{(slip.totalDeductions || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="p-4 text-amber-700 text-right font-medium">-₹{(slip.deductions?.lateDeduction || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-[10px] text-slate-400">({slip.stats?.lateDays || 0}d)</span></td>
                    <td className="p-4 text-indigo-700 font-extrabold text-right text-sm border-l border-slate-100">₹{(slip.netPay || slip.netSalary || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
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
