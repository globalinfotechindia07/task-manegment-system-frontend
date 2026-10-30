import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { HiOutlineDocumentText, HiOutlineBanknotes, HiOutlineInformationCircle } from 'react-icons/hi2';

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
      return Array.isArray(data) ? data : [];
    }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Salary Slips & CTC Breakup</h1>
        <p className="text-sm text-slate-500 mt-1">View official payslips and salary structure details.</p>
      </div>

      {!configLoading && config && config.fixedCTC > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <HiOutlineInformationCircle className="w-4 h-4 text-indigo-600" />
            Approved CTC Compensation Structure
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Annual Fixed CTC</p>
              <p className="text-xl font-extrabold text-slate-900">₹{config.fixedCTC.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Monthly Basic</p>
              <p className="text-xl font-bold text-slate-800">₹{(config.earnings?.basic || 0).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Monthly HRA</p>
              <p className="text-xl font-bold text-slate-800">₹{(config.earnings?.hra || 0).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Fixed PF Ded.</p>
              <p className="text-xl font-bold text-rose-600">-₹{(config.deductions?.pf || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center p-12 text-slate-400 text-xs">
            <div className="inline-block w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : slips?.length === 0 ? (
          <div className="bg-white border border-slate-200 p-12 rounded-xl text-center text-slate-400 shadow-xs">
            <HiOutlineDocumentText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium text-slate-500">No salary slips have been generated for you yet.</p>
          </div>
        ) : (
          slips?.map(slip => (
            <div key={slip._id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-50 p-4 sm:px-6 flex justify-between items-center border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex flex-col items-center justify-center font-bold">
                    <span className="text-[10px] uppercase leading-none mb-0.5">
                      {new Date(0, slip.month - 1).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-sm leading-none">{slip.year}</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Payslip for {new Date(0, slip.month - 1).toLocaleString('default', { month: 'long' })} {slip.year}</h3>
                    <p className="text-[11px] text-slate-500">Disbursed on: {new Date(slip.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Net Payout</p>
                  <p className="text-2xl font-black text-indigo-700">₹{(slip.netPay || slip.netSalary || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
              
              <div className="p-5 sm:p-6">
                <div className="border border-slate-200 rounded-lg overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-2.5 border-b border-r border-slate-200 w-1/2">Salary Components</th>
                        <th className="px-4 py-2.5 border-b border-slate-200 w-1/2 text-right">Amount Per Month (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {/* EARNINGS */}
                      <tr>
                        <td className="px-4 py-2 text-slate-600 border-r border-slate-200">Basic</td>
                        <td className="px-4 py-2 text-slate-900 font-medium text-right font-mono">{(slip.earnings?.basic || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-600 border-r border-slate-200">HRA</td>
                        <td className="px-4 py-2 text-slate-900 font-medium text-right font-mono">{(slip.earnings?.hra || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-600 border-r border-slate-200">Ex-Gratia</td>
                        <td className="px-4 py-2 text-slate-900 font-medium text-right font-mono">{(slip.earnings?.exGratia || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-600 border-r border-slate-200">SPL Allowance</td>
                        <td className="px-4 py-2 text-slate-900 font-medium text-right font-mono">{(slip.earnings?.splAllowance || 0).toLocaleString()}</td>
                      </tr>
                      <tr className="bg-emerald-50/80 font-bold">
                        <td className="px-4 py-2 text-emerald-800 border-r border-slate-200">Total Earning (A)</td>
                        <td className="px-4 py-2 text-emerald-800 text-right font-mono">{(slip.grossEarnings || 0).toLocaleString()}</td>
                      </tr>

                      {/* EMPLOYEE DEDUCTIONS */}
                      <tr>
                        <td className="px-4 py-2 text-slate-600 border-r border-slate-200">PF (Employee)</td>
                        <td className="px-4 py-2 text-rose-600 font-medium text-right font-mono">-{(slip.deductions?.pf || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-600 border-r border-slate-200">ESIC (Employee)</td>
                        <td className="px-4 py-2 text-rose-600 font-medium text-right font-mono">-{(slip.deductions?.esic || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-600 border-r border-slate-200">Labour Welfare Fund</td>
                        <td className="px-4 py-2 text-rose-600 font-medium text-right font-mono">-{(slip.deductions?.labourWelfareFund || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-600 border-r border-slate-200">Professional Tax</td>
                        <td className="px-4 py-2 text-rose-600 font-medium text-right font-mono">-{(slip.deductions?.professionalTax || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-600 border-r border-slate-200">Welfare Fund</td>
                        <td className="px-4 py-2 text-rose-600 font-medium text-right font-mono">-{(slip.deductions?.welfareFund || 0).toLocaleString()}</td>
                      </tr>
                      {slip.deductions?.lateDeduction > 0 && (
                        <tr>
                          <td className="px-4 py-2 text-amber-700 border-r border-slate-200">Late Marks Deduction ({slip.stats?.lateDays} days)</td>
                          <td className="px-4 py-2 text-rose-600 font-medium text-right font-mono">-{(slip.deductions?.lateDeduction || 0).toLocaleString()}</td>
                        </tr>
                      )}
                      <tr className="bg-rose-50/80 font-bold">
                        <td className="px-4 py-2 text-rose-800 border-r border-slate-200">Employee Total Deductions (B)</td>
                        <td className="px-4 py-2 text-rose-800 text-right font-mono">-{(slip.totalDeductions || 0).toLocaleString()}</td>
                      </tr>

                      {/* NET PAY */}
                      <tr className="bg-indigo-50 font-bold border-y-2 border-indigo-200">
                        <td className="px-4 py-3 text-indigo-900 border-r border-slate-200 text-sm">Net Pay (A-B)</td>
                        <td className="px-4 py-3 text-indigo-700 text-right font-mono text-base font-black">{(slip.netPay || slip.netSalary || 0).toLocaleString()}</td>
                      </tr>

                      {/* EMPLOYER CONTRIBUTIONS */}
                      <tr>
                        <td className="px-4 py-2 text-slate-600 border-r border-slate-200">PF (Employer Contribution)</td>
                        <td className="px-4 py-2 text-slate-900 font-medium text-right font-mono">{(slip.employerContributions?.pf || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-slate-600 border-r border-slate-200">ESIC (Employer Contribution)</td>
                        <td className="px-4 py-2 text-slate-900 font-medium text-right font-mono">{(slip.employerContributions?.esic || 0).toLocaleString()}</td>
                      </tr>
                      <tr className="bg-amber-50/80 font-bold">
                        <td className="px-4 py-2 text-amber-800 border-r border-slate-200">Total Employer Contribution (C)</td>
                        <td className="px-4 py-2 text-amber-800 text-right font-mono">{(slip.totalEmployerContributions || 0).toLocaleString()}</td>
                      </tr>

                      {/* FIXED CTC */}
                      <tr className="bg-slate-100 font-semibold border-t border-slate-200">
                        <td className="px-4 py-2.5 text-slate-800 border-r border-slate-200">Fixed Monthly CTC Equivalent (A+C)</td>
                        <td className="px-4 py-2.5 text-slate-900 text-right font-mono">{((slip.grossEarnings || 0) + (slip.totalEmployerContributions || 0)).toLocaleString()}</td>
                      </tr>
                      <tr className="bg-slate-50 font-bold">
                        <td className="px-4 py-2.5 text-slate-900 border-r border-slate-200">Annual Fixed CTC</td>
                        <td className="px-4 py-2.5 text-slate-900 text-right font-mono text-sm">₹{(slip.fixedCTC || 0).toLocaleString()}</td>
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
