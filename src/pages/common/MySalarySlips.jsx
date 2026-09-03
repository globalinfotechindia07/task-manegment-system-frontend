import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';

const MySalarySlips = () => {
  const { data: slips, isLoading } = useQuery({
    queryKey: ['mySalarySlips'],
    queryFn: async () => {
      const { data } = await api.get('/payroll/my-slips');
      return data;
    }
  });

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-200">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-bold text-white mb-2">My Salary Slips</h1>
        <p className="text-slate-400">View your monthly generated payroll information.</p>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center p-12 text-slate-500">Loading your salary slips...</div>
        ) : slips?.length === 0 ? (
          <div className="bg-slate-900 border border-slate-700 p-12 rounded-2xl text-center text-slate-400">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            No salary slips have been generated for you yet.
          </div>
        ) : (
          slips?.map(slip => (
            <div key={slip._id} className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-slate-800/80 p-5 flex justify-between items-center border-b border-slate-700">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex flex-col items-center justify-center font-bold">
                    <span className="text-[10px] uppercase leading-none mb-1">
                      {new Date(0, slip.month - 1).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-lg leading-none">{slip.year}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Payslip for {new Date(0, slip.month - 1).toLocaleString('default', { month: 'long' })} {slip.year}</h3>
                    <p className="text-xs text-slate-400">Generated on: {new Date(slip.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 mb-1">Net Payable</p>
                  <p className="text-2xl font-black text-emerald-400">₹{slip.netPay.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Earnings */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-4 border-b border-slate-700 pb-2">Earnings</h4>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-400 text-sm">Basic Salary</span>
                    <span className="text-white font-medium">₹{slip.grossSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between items-center mt-6 pt-3 border-t border-slate-700">
                    <span className="text-slate-300 font-semibold">Total Gross</span>
                    <span className="text-emerald-400 font-bold">₹{slip.grossSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
                
                {/* Deductions */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-4 border-b border-slate-700 pb-2">Deductions</h4>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-400 text-sm">Provident Fund (PF)</span>
                    <span className="text-red-400 font-medium">-₹{slip.deductions.pf.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-400 text-sm">Professional Tax</span>
                    <span className="text-red-400 font-medium">-₹{slip.deductions.pt.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  {slip.deductions.lateDeduction > 0 && (
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-slate-400 text-sm">Late Deductions ({slip.stats?.lateDays} late)</span>
                      <span className="text-orange-400 font-medium">-₹{slip.deductions.lateDeduction.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-6 pt-3 border-t border-slate-700">
                    <span className="text-slate-300 font-semibold">Total Deductions</span>
                    <span className="text-red-400 font-bold">
                      -₹{(slip.deductions.pf + slip.deductions.pt + slip.deductions.lateDeduction).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MySalarySlips;
