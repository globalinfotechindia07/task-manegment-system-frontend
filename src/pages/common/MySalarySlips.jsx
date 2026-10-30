import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import {
  HiOutlineDocumentText,
  HiOutlineBanknotes,
  HiOutlineInformationCircle,
} from 'react-icons/hi2';

const MySalarySlips = () => {
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['mySalaryConfig'],
    queryFn: async () => {
      const { data } = await api.get('/payroll/my-config');
      return data;
    },
  });

  const { data: slips, isLoading } = useQuery({
    queryKey: ['mySalarySlips'],
    queryFn: async () => {
      const { data } = await api.get('/payroll/my-slips');
      return Array.isArray(data) ? data : [];
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">

      {/* ===================== PAGE HEADER ===================== */}
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          My Salary Slips & CTC Breakup
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          View official payslips and salary structure details.
        </p>
      </div>

      {/* ===================== APPROVED CTC STRUCTURE ===================== */}
      {!configLoading && config && config.fixedCTC > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
              <HiOutlineInformationCircle className="w-3.5 h-3.5" />
            </span>
            Approved CTC Compensation Structure
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 pt-1">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Annual Fixed CTC
              </p>
              <p className="text-base sm:text-xl font-extrabold text-slate-900 font-mono truncate">
                ₹{config.fixedCTC.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Monthly Basic
              </p>
              <p className="text-base sm:text-xl font-bold text-slate-800 font-mono truncate">
                ₹{(config.earnings?.basic || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Monthly HRA
              </p>
              <p className="text-base sm:text-xl font-bold text-slate-800 font-mono truncate">
                ₹{(config.earnings?.hra || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Fixed PF Ded.
              </p>
              <p className="text-base sm:text-xl font-bold text-rose-600 font-mono truncate">
                -₹{(config.deductions?.pf || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===================== SLIPS LIST ===================== */}
      <div className="space-y-5 sm:space-y-6">
        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 flex justify-center shadow-sm">
            <div className="w-9 h-9 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : !slips || slips.length === 0 ? (
          <div className="bg-white border border-slate-200 p-10 sm:p-12 rounded-xl text-center shadow-sm">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <HiOutlineDocumentText className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-1">No salary slips yet</p>
            <p className="text-xs text-slate-500">
              Your payslips will appear here once HR generates them.
            </p>
          </div>
        ) : (
          slips.map((slip) => (
            <div
              key={slip._id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
            >

              {/* ---------- Slip Header ---------- */}
              <div className="bg-slate-50 p-4 sm:px-6 sm:py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex flex-col items-center justify-center font-bold shrink-0">
                    <span className="text-[9px] uppercase leading-none mb-0.5">
                      {new Date(0, slip.month - 1).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-xs leading-none">{slip.year}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      Payslip for{' '}
                      {new Date(0, slip.month - 1).toLocaleString('default', { month: 'long' })}{' '}
                      {slip.year}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">
                      Disbursed on:{' '}
                      {new Date(slip.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                    Net Payout
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-indigo-700 font-mono">
                    ₹
                    {(slip.netPay || slip.netSalary || 0).toLocaleString('en-IN', {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
              </div>

              {/* ---------- Slip Table ---------- */}
              <div className="p-3 sm:p-5 lg:p-6">
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-[11px] sm:text-xs text-left min-w-[480px]">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px] sm:text-[11px]">
                      <tr>
                        <th className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-r border-slate-200 w-1/2 whitespace-nowrap">
                          Salary Components
                        </th>
                        <th className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-slate-200 w-1/2 text-right whitespace-nowrap">
                          Amount / Month (₹)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {/* EARNINGS */}
                      <tr>
                        <td className="px-3 sm:px-4 py-2 text-slate-600 border-r border-slate-200">Basic</td>
                        <td className="px-3 sm:px-4 py-2 text-slate-900 font-medium text-right font-mono">
                          {(slip.earnings?.basic || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 sm:px-4 py-2 text-slate-600 border-r border-slate-200">HRA</td>
                        <td className="px-3 sm:px-4 py-2 text-slate-900 font-medium text-right font-mono">
                          {(slip.earnings?.hra || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 sm:px-4 py-2 text-slate-600 border-r border-slate-200">Ex-Gratia</td>
                        <td className="px-3 sm:px-4 py-2 text-slate-900 font-medium text-right font-mono">
                          {(slip.earnings?.exGratia || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 sm:px-4 py-2 text-slate-600 border-r border-slate-200">SPL Allowance</td>
                        <td className="px-3 sm:px-4 py-2 text-slate-900 font-medium text-right font-mono">
                          {(slip.earnings?.splAllowance || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr className="bg-emerald-50/80 font-bold">
                        <td className="px-3 sm:px-4 py-2 text-emerald-800 border-r border-slate-200">
                          Total Earning (A)
                        </td>
                        <td className="px-3 sm:px-4 py-2 text-emerald-800 text-right font-mono">
                          {(slip.grossEarnings || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>

                      {/* DEDUCTIONS */}
                      <tr>
                        <td className="px-3 sm:px-4 py-2 text-slate-600 border-r border-slate-200">PF (Employee)</td>
                        <td className="px-3 sm:px-4 py-2 text-rose-600 font-medium text-right font-mono">
                          -{(slip.deductions?.pf || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 sm:px-4 py-2 text-slate-600 border-r border-slate-200">ESIC (Employee)</td>
                        <td className="px-3 sm:px-4 py-2 text-rose-600 font-medium text-right font-mono">
                          -{(slip.deductions?.esic || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 sm:px-4 py-2 text-slate-600 border-r border-slate-200">Labour Welfare Fund</td>
                        <td className="px-3 sm:px-4 py-2 text-rose-600 font-medium text-right font-mono">
                          -{(slip.deductions?.labourWelfareFund || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 sm:px-4 py-2 text-slate-600 border-r border-slate-200">Professional Tax</td>
                        <td className="px-3 sm:px-4 py-2 text-rose-600 font-medium text-right font-mono">
                          -{(slip.deductions?.professionalTax || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 sm:px-4 py-2 text-slate-600 border-r border-slate-200">Welfare Fund</td>
                        <td className="px-3 sm:px-4 py-2 text-rose-600 font-medium text-right font-mono">
                          -{(slip.deductions?.welfareFund || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      {slip.deductions?.lateDeduction > 0 && (
                        <tr>
                          <td className="px-3 sm:px-4 py-2 text-amber-700 border-r border-slate-200">
                            Late Marks Deduction ({slip.stats?.lateDays} days)
                          </td>
                          <td className="px-3 sm:px-4 py-2 text-rose-600 font-medium text-right font-mono">
                            -{(slip.deductions?.lateDeduction || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-rose-50/80 font-bold">
                        <td className="px-3 sm:px-4 py-2 text-rose-800 border-r border-slate-200">
                          Employee Total Deductions (B)
                        </td>
                        <td className="px-3 sm:px-4 py-2 text-rose-800 text-right font-mono">
                          -{(slip.totalDeductions || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>

                      {/* NET PAY */}
                      <tr className="bg-indigo-50 font-bold border-y-2 border-indigo-200">
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-indigo-900 border-r border-slate-200 text-xs sm:text-sm">
                          Net Pay (A-B)
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-indigo-700 text-right font-mono text-sm sm:text-base font-black">
                          {(slip.netPay || slip.netSalary || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>

                      {/* EMPLOYER CONTRIBUTIONS */}
                      <tr>
                        <td className="px-3 sm:px-4 py-2 text-slate-600 border-r border-slate-200">
                          PF (Employer)
                        </td>
                        <td className="px-3 sm:px-4 py-2 text-slate-900 font-medium text-right font-mono">
                          {(slip.employerContributions?.pf || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 sm:px-4 py-2 text-slate-600 border-r border-slate-200">
                          ESIC (Employer)
                        </td>
                        <td className="px-3 sm:px-4 py-2 text-slate-900 font-medium text-right font-mono">
                          {(slip.employerContributions?.esic || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr className="bg-amber-50/80 font-bold">
                        <td className="px-3 sm:px-4 py-2 text-amber-800 border-r border-slate-200">
                          Total Employer Contribution (C)
                        </td>
                        <td className="px-3 sm:px-4 py-2 text-amber-800 text-right font-mono">
                          {(slip.totalEmployerContributions || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>

                      {/* FIXED CTC */}
                      <tr className="bg-slate-100 font-semibold border-t border-slate-200">
                        <td className="px-3 sm:px-4 py-2.5 text-slate-800 border-r border-slate-200">
                          Fixed Monthly CTC (A+C)
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 text-slate-900 text-right font-mono">
                          {(
                            (slip.grossEarnings || 0) + (slip.totalEmployerContributions || 0)
                          ).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr className="bg-slate-50 font-bold">
                        <td className="px-3 sm:px-4 py-2.5 text-slate-900 border-r border-slate-200">
                          Annual Fixed CTC
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 text-slate-900 text-right font-mono text-xs sm:text-sm">
                          ₹{(slip.fixedCTC || 0).toLocaleString('en-IN')}
                        </td>
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