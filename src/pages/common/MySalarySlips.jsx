import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';

const MySalarySlips = () => {
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['mySalaryConfig'],
    queryFn: async () => {
      const { data } = await api.get('/payroll/my-config');
      return data;
    }
  });

  const { data: slips, isLoading } = useQuery({
    queryKey: ['mySalarySlips'],
    queryFn: async () => {
      const { data } = await api.get('/payroll/my-slips');
      return data;
    }
  });

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-200">
      <div className="mb-8 text-center md:text-left flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Salary Slips</h1>
          <p className="text-slate-400">View your monthly generated payroll information.</p>
        </div>
      </div>

      {!configLoading && config && config.fixedCTC > 0 && (
        <div className="mb-10 bg-slate-800/40 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <svg className="w-32 h-32 text-indigo-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.43-2.96 3.11-3.32V4h2.67v1.92c1.38.3 2.5 1.15 2.76 2.75h-1.96c-.19-1.01-.98-1.42-2.14-1.42-1.52 0-2.22.82-2.22 1.48 0 .82.68 1.46 2.8 1.98 2.61.64 4.05 1.77 4.05 3.82 0 1.82-1.45 2.88-3.29 3.26z"/></svg>
          </div>
          <h3 className="text-lg font-bold text-indigo-400 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Current Salary Structure
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
            <div>
              <p className="text-xs text-slate-400 mb-1">Annual Fixed CTC</p>
              <p className="text-xl font-bold text-white">₹{config.fixedCTC.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Monthly Basic</p>
              <p className="text-xl font-bold text-slate-200">₹{(config.earnings?.basic || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Monthly HRA</p>
              <p className="text-xl font-bold text-slate-200">₹{(config.earnings?.hra || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Total Fixed PF Deduction</p>
              <p className="text-xl font-bold text-rose-400">-₹{(config.deductions?.pf || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

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
              
              <div className="p-6">
                <div className="text-center mb-6">
                  <h4 className="text-lg font-bold text-white uppercase tracking-wider">Annexure – Salary Breakup</h4>
                </div>
                
                <div className="border border-slate-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-800 text-slate-300">
                      <tr>
                        <th className="px-4 py-3 font-semibold border-b border-r border-slate-700 w-1/2">Salary Components</th>
                        <th className="px-4 py-3 font-semibold border-b border-slate-700 w-1/2 text-right">Amount Per Month (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {/* EARNINGS */}
                      <tr>
                        <td className="px-4 py-2 text-slate-400 border-r border-slate-700">Basic</td>
                        <td className="px-4 py-2 text-white text-right font-mono">{(slip.earnings?.basic || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-400 border-r border-slate-700">HRA</td>
                        <td className="px-4 py-2 text-white text-right font-mono">{(slip.earnings?.hra || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-400 border-r border-slate-700">Ex-Gratia</td>
                        <td className="px-4 py-2 text-white text-right font-mono">{(slip.earnings?.exGratia || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-400 border-r border-slate-700">SPL Allowance</td>
                        <td className="px-4 py-2 text-white text-right font-mono">{(slip.earnings?.splAllowance || 0).toLocaleString()}</td>
                      </tr>
                      <tr className="bg-emerald-500/10">
                        <td className="px-4 py-2 font-bold text-emerald-400 border-r border-slate-700">Total Earning (A)</td>
                        <td className="px-4 py-2 font-bold text-emerald-400 text-right font-mono">{(slip.grossEarnings || 0).toLocaleString()}</td>
                      </tr>

                      {/* EMPLOYEE DEDUCTIONS */}
                      <tr>
                        <td className="px-4 py-2 text-slate-400 border-r border-slate-700">PF (Employee)</td>
                        <td className="px-4 py-2 text-rose-400 text-right font-mono">-{(slip.deductions?.pf || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-400 border-r border-slate-700">ESIC (Employee)</td>
                        <td className="px-4 py-2 text-rose-400 text-right font-mono">-{(slip.deductions?.esic || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-400 border-r border-slate-700">Labour Welfare Fund</td>
                        <td className="px-4 py-2 text-rose-400 text-right font-mono">-{(slip.deductions?.labourWelfareFund || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-400 border-r border-slate-700">Professional Tax</td>
                        <td className="px-4 py-2 text-rose-400 text-right font-mono">-{(slip.deductions?.professionalTax || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-400 border-r border-slate-700">Welfare Fund</td>
                        <td className="px-4 py-2 text-rose-400 text-right font-mono">-{(slip.deductions?.welfareFund || 0).toLocaleString()}</td>
                      </tr>
                      {slip.deductions?.lateDeduction > 0 && (
                        <tr>
                          <td className="px-4 py-2 text-slate-400 border-r border-slate-700">Late Marks Deduction ({slip.stats?.lateDays} days)</td>
                          <td className="px-4 py-2 text-rose-400 text-right font-mono">-{(slip.deductions?.lateDeduction || 0).toLocaleString()}</td>
                        </tr>
                      )}
                      <tr className="bg-rose-500/10">
                        <td className="px-4 py-2 font-bold text-rose-400 border-r border-slate-700">Employee Contribution (B)</td>
                        <td className="px-4 py-2 font-bold text-rose-400 text-right font-mono">-{(slip.totalDeductions || 0).toLocaleString()}</td>
                      </tr>

                      {/* NET PAY */}
                      <tr className="bg-indigo-500/20 border-y-2 border-indigo-500/50">
                        <td className="px-4 py-4 font-black text-indigo-300 border-r border-slate-700 text-base">Net Pay (A-B)</td>
                        <td className="px-4 py-4 font-black text-indigo-400 text-right font-mono text-lg">{(slip.netPay || 0).toLocaleString()}</td>
                      </tr>

                      {/* EMPLOYER CONTRIBUTIONS */}
                      <tr>
                        <td className="px-4 py-2 text-slate-400 border-r border-slate-700">PF (Employer)</td>
                        <td className="px-4 py-2 text-white text-right font-mono">{(slip.employerContributions?.pf || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-400 border-r border-slate-700">ESIC (Employer)</td>
                        <td className="px-4 py-2 text-white text-right font-mono">{(slip.employerContributions?.esic || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-400 border-r border-slate-700">Labour Welfare Fund</td>
                        <td className="px-4 py-2 text-white text-right font-mono">{(slip.employerContributions?.labourWelfareFund || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-400 border-r border-slate-700">Professional Tax</td>
                        <td className="px-4 py-2 text-white text-right font-mono">{(slip.employerContributions?.professionalTax || 0).toLocaleString()}</td>
                      </tr>
                      <tr className="bg-orange-500/10">
                        <td className="px-4 py-2 font-bold text-orange-400 border-r border-slate-700">Employer Contribution (C)</td>
                        <td className="px-4 py-2 font-bold text-orange-400 text-right font-mono">{(slip.totalEmployerContributions || 0).toLocaleString()}</td>
                      </tr>

                      {/* FIXED CTC */}
                      <tr className="bg-slate-800 border-t-2 border-slate-600">
                        <td className="px-4 py-3 font-bold text-white border-r border-slate-700">Fixed CTC (A+C) Monthly Equivalent</td>
                        <td className="px-4 py-3 font-bold text-white text-right font-mono">{((slip.grossEarnings || 0) + (slip.totalEmployerContributions || 0)).toLocaleString()}</td>
                      </tr>
                      <tr className="bg-slate-700">
                        <td className="px-4 py-3 font-black text-white border-r border-slate-700">Annual Fixed CTC</td>
                        <td className="px-4 py-3 font-black text-white text-right font-mono text-lg">{(slip.fixedCTC || 0).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
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
