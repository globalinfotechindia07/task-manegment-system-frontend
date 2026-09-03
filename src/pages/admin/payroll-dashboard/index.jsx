import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';

const PayrollDashboard = () => {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() || 12);
  const [selectedYear, setSelectedYear] = useState(new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear());

  const { data: slips, isLoading } = useQuery({
    queryKey: ['allSalarySlips', selectedMonth, selectedYear],
    queryFn: async () => {
      const { data } = await api.get(`/payroll/all?month=${selectedMonth}&year=${selectedYear}`);
      return data;
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
    <div className="max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Payroll Dashboard</h1>
          <p className="text-slate-400">Generate and view employee salary slips for the selected month.</p>
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
          <button
            onClick={() => {
              if (window.confirm(`Generate salary slips for ${new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })} ${selectedYear}? This will overwrite existing slips for this month.`)) {
                generateMutation.mutate();
              }
            }}
            disabled={generateMutation.isPending}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex shrink-0"
          >
            {generateMutation.isPending ? 'Generating...' : 'Generate Payroll'}
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 text-slate-300 text-sm border-b border-slate-700">
                <th className="p-4 font-semibold">Employee</th>
                <th className="p-4 font-semibold">Base LPA</th>
                <th className="p-4 font-semibold text-emerald-400 text-right">Gross (Monthly)</th>
                <th className="p-4 font-semibold text-red-400 text-right">PF</th>
                <th className="p-4 font-semibold text-red-400 text-right">PT</th>
                <th className="p-4 font-semibold text-orange-400 text-right">Late Ded.</th>
                <th className="p-4 font-semibold text-indigo-400 text-right">Net Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">Loading slips...</td>
                </tr>
              ) : slips?.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    No salary slips generated for this month. Click "Generate Payroll".
                  </td>
                </tr>
              ) : (
                slips?.map((slip) => (
                  <tr key={slip._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                          {slip.user.profilePicture ? (
                            <img src={`${API_BASE_URL}${slip.user.profilePicture}`} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-white text-xs">
                              {slip.user.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{slip.user.name}</p>
                          <p className="text-xs text-slate-400">{slip.user.designation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">₹{(slip.grossSalary * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="p-4 text-emerald-400 font-medium text-right">₹{slip.grossSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="p-4 text-red-400 text-right">-₹{slip.deductions.pf.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="p-4 text-red-400 text-right">-₹{slip.deductions.pt.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="p-4 text-orange-400 text-right">-₹{slip.deductions.lateDeduction.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs">({slip.stats?.lateDays || 0} days)</span></td>
                    <td className="p-4 text-indigo-400 font-bold text-right text-base border-l border-slate-700/50">₹{slip.netPay.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
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
