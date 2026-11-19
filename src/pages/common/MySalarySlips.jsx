import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { API_BASE_URL } from '../../config';
import {
  HiOutlineDocumentText,
  HiOutlineBanknotes,
  HiOutlineInformationCircle,
  HiOutlinePrinter,
  HiOutlineEye,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineArrowDownTray,
  HiOutlineCalendarDays,
  HiOutlineBuildingOffice2,
  HiOutlineIdentification,
} from 'react-icons/hi2';

// Helper to convert number to Indian Currency words (e.g. "Fifty Thousand Rupees Only")
const numberToWords = (num) => {
  if (!num || isNaN(num) || num <= 0) return 'Zero Rupees Only';
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen ',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if ((n = n.toString()).length > 9) return 'Overflow';
    const n_array = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n_array) return '';
    let str = '';
    str += Number(n_array[1]) !== 0 ? (a[Number(n_array[1])] || b[n_array[1][0]] + ' ' + a[n_array[1][1]]) + 'Crore ' : '';
    str += Number(n_array[2]) !== 0 ? (a[Number(n_array[2])] || b[n_array[2][0]] + ' ' + a[n_array[2][1]]) + 'Lakh ' : '';
    str += Number(n_array[3]) !== 0 ? (a[Number(n_array[3])] || b[n_array[3][0]] + ' ' + a[n_array[3][1]]) + 'Thousand ' : '';
    str += Number(n_array[4]) !== 0 ? (a[Number(n_array[4])] || b[n_array[4][0]] + ' ' + a[n_array[4][1]]) + 'Hundred ' : '';
    str += Number(n_array[5]) !== 0 ? ((str !== '' ? 'and ' : '') + (a[Number(n_array[5])] || b[n_array[5][0]] + ' ' + a[n_array[5][1]])) : '';
    return str.trim();
  };

  const words = inWords(Math.round(num));
  return `Rupees ${words} Only`;
};

const MySalarySlips = () => {
  const [selectedSlip, setSelectedSlip] = useState(null); // For Letterhead Payslip Modal

  // 1. Fetch user salary config
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['mySalaryConfig'],
    queryFn: async () => {
      const { data } = await api.get('/payroll/my-config');
      return data;
    },
  });

  // 2. Fetch user salary slips
  const { data: slips, isLoading } = useQuery({
    queryKey: ['mySalarySlips'],
    queryFn: async () => {
      const { data } = await api.get('/payroll/my-slips');
      return Array.isArray(data) ? data : [];
    },
  });

  // 3. Fetch Company letterhead branding
  const { data: companyLetterheadData } = useQuery({
    queryKey: ['companyLetterhead'],
    queryFn: async () => {
      const { data } = await api.get('/companies/letterhead');
      return data;
    },
  });

  const getFullImgUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('blob:') || path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    return `${API_BASE_URL.replace(/\/api\/?$/, '')}${path}`;
  };

  const letterheadSettings =
    selectedSlip?.company?.letterhead || companyLetterheadData?.letterhead || {};
  const activeLetterheadUrl = letterheadSettings.url ? getFullImgUrl(letterheadSettings.url) : '';
  const activeSignatureUrl = letterheadSettings.signatureUrl ? getFullImgUrl(letterheadSettings.signatureUrl) : '';
  const activeSealUrl = letterheadSettings.sealUrl ? getFullImgUrl(letterheadSettings.sealUrl) : '';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
      {/* ===================== PAGE HEADER ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            My Salary Slips & Official Payslips
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View monthly salary credits, deductions, and download official payslips on company blank letterhead.
          </p>
        </div>
      </div>

      {/* ===================== APPROVED CTC STRUCTURE ===================== */}
      {!configLoading && config && config.fixedCTC > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                <HiOutlineInformationCircle className="w-3.5 h-3.5" />
              </span>
              Approved CTC Compensation Package
            </h3>
            {config.salaryStructure?.name && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Plan: {config.salaryStructure.name}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 pt-1">
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
                Monthly Gross
              </p>
              <p className="text-base sm:text-xl font-bold text-slate-800 font-mono truncate">
                ₹{Math.round(config.fixedCTC / 12).toLocaleString('en-IN')}
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
                Net Monthly Take-Home
              </p>
              <p className="text-base sm:text-xl font-extrabold text-emerald-600 font-mono truncate">
                ₹{(config.netMonthlyTakeHome || Math.round(config.fixedCTC / 12) - (config.deductions?.pf || 0) - (config.deductions?.professionalTax || 0)).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===================== SLIPS LIST ===================== */}
      <div className="space-y-5 sm:space-y-6">
        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 flex justify-center shadow-sm">
            <div className="w-9 h-9 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : !slips || slips.length === 0 ? (
          <div className="bg-white border border-slate-200 p-10 sm:p-12 rounded-2xl text-center shadow-sm">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <HiOutlineDocumentText className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-1">No salary slips generated yet</p>
            <p className="text-xs text-slate-500">
              Your payslips will appear here each month once HR processes payroll.
            </p>
          </div>
        ) : (
          slips.map((slip) => {
            const monthName = new Date(0, slip.month - 1).toLocaleString('default', { month: 'long' });
            const netAmount = slip.netPay || slip.netSalary || 0;

            return (
              <div
                key={slip._id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
              >
                {/* ---------- Slip Header ---------- */}
                <div className="bg-slate-50 p-4 sm:px-6 sm:py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex flex-col items-center justify-center font-bold shrink-0 shadow-xs">
                      <span className="text-[10px] uppercase leading-none mb-0.5">
                        {monthName.slice(0, 3)}
                      </span>
                      <span className="text-xs leading-none">{slip.year}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 truncate">
                        Salary Slip for {monthName} {slip.year}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">
                        Disbursed on:{' '}
                        {new Date(slip.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {slip.salaryStructure?.name ? ` • Plan: ${slip.salaryStructure.name}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                        Net Payout (Credit)
                      </p>
                      <p className="text-xl sm:text-2xl font-black text-indigo-700 font-mono">
                        ₹{netAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                    </div>

                    {/* Button to open official Payslip on blank letterhead */}
                    <button
                      type="button"
                      onClick={() => setSelectedSlip(slip)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer shadow-2xs"
                      title="View & Print Official Payslip on Company Letterhead"
                    >
                      <HiOutlinePrinter className="w-4 h-4 text-indigo-600" />
                      <span>Official Payslip (Letterhead)</span>
                    </button>
                  </div>
                </div>

                {/* ---------- Quick Breakdown Table ---------- */}
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: Earnings (Credits) */}
                    <div className="border border-emerald-200 rounded-xl overflow-hidden bg-emerald-50/20">
                      <div className="bg-emerald-100/70 px-4 py-2 border-b border-emerald-200 flex justify-between items-center font-bold text-xs text-emerald-900">
                        <span>Earnings / Credits</span>
                        <span>Amount (₹)</span>
                      </div>
                      <div className="p-3 space-y-1.5 text-xs">
                        {slip.earnings?.basic > 0 && (
                          <div className="flex justify-between text-slate-700">
                            <span>Basic Salary</span>
                            <span className="font-mono font-medium">₹{slip.earnings.basic.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {slip.earnings?.hra > 0 && (
                          <div className="flex justify-between text-slate-700">
                            <span>House Rent Allowance (HRA)</span>
                            <span className="font-mono font-medium">₹{slip.earnings.hra.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {slip.earnings?.splAllowance > 0 && (
                          <div className="flex justify-between text-slate-700">
                            <span>Special Allowance</span>
                            <span className="font-mono font-medium">₹{slip.earnings.splAllowance.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {slip.earnings?.exGratia > 0 && (
                          <div className="flex justify-between text-slate-700">
                            <span>Ex-Gratia</span>
                            <span className="font-mono font-medium">₹{slip.earnings.exGratia.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {/* Dynamic Custom Earnings */}
                        {Array.isArray(slip.dynamicEarnings) &&
                          slip.dynamicEarnings.map((de, idx) => (
                            <div key={idx} className="flex justify-between text-slate-700">
                              <span>{de.name}</span>
                              <span className="font-mono font-medium">₹{(de.amount || 0).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        <div className="pt-2 border-t border-emerald-200 flex justify-between font-bold text-emerald-900 text-sm">
                          <span>Total Gross Earnings (A)</span>
                          <span className="font-mono">₹{(slip.grossEarnings || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Deductions (Debits) */}
                    <div className="border border-rose-200 rounded-xl overflow-hidden bg-rose-50/20">
                      <div className="bg-rose-100/70 px-4 py-2 border-b border-rose-200 flex justify-between items-center font-bold text-xs text-rose-900">
                        <span>Deductions / Debits</span>
                        <span>Amount (₹)</span>
                      </div>
                      <div className="p-3 space-y-1.5 text-xs">
                        {slip.deductions?.pf > 0 && (
                          <div className="flex justify-between text-slate-700">
                            <span>Provident Fund (Employee PF)</span>
                            <span className="font-mono font-medium text-rose-600">-₹{slip.deductions.pf.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {slip.deductions?.esic > 0 && (
                          <div className="flex justify-between text-slate-700">
                            <span>ESIC (Employee)</span>
                            <span className="font-mono font-medium text-rose-600">-₹{slip.deductions.esic.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {slip.deductions?.professionalTax > 0 && (
                          <div className="flex justify-between text-slate-700">
                            <span>Professional Tax (PT)</span>
                            <span className="font-mono font-medium text-rose-600">-₹{slip.deductions.professionalTax.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {slip.deductions?.labourWelfareFund > 0 && (
                          <div className="flex justify-between text-slate-700">
                            <span>Labour Welfare Fund</span>
                            <span className="font-mono font-medium text-rose-600">-₹{slip.deductions.labourWelfareFund.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {slip.deductions?.lateDeduction > 0 && (
                          <div className="flex justify-between text-amber-700 font-semibold">
                            <span>Late Marks Penalty ({slip.stats?.lateDays || 0} days)</span>
                            <span className="font-mono text-rose-600">-₹{slip.deductions.lateDeduction.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {/* Dynamic Custom Deductions */}
                        {Array.isArray(slip.dynamicDeductions) &&
                          slip.dynamicDeductions.map((dd, idx) => (
                            <div key={idx} className="flex justify-between text-slate-700">
                              <span>{dd.name}</span>
                              <span className="font-mono font-medium text-rose-600">-₹{(dd.amount || 0).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        <div className="pt-2 border-t border-rose-200 flex justify-between font-bold text-rose-900 text-sm">
                          <span>Total Deductions (B)</span>
                          <span className="font-mono">-₹{(slip.totalDeductions || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Net Strip */}
                  <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="text-xs text-indigo-900">
                      <strong>Take-Home Formula:</strong> Gross Earnings (A) − Deductions (B) ={' '}
                      <span className="font-bold text-indigo-700">Net Pay</span>
                    </div>
                    <div className="text-sm font-black text-indigo-700 font-mono">
                      Net Payout: ₹{netAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ===================== MODAL: OFFICIAL A4 PAYSLIP ON BLANK LETTERHEAD ===================== */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full my-4 flex flex-col overflow-hidden max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:m-0 print:w-full">
            {/* Action Bar (Hidden during Print) */}
            <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h4 className="text-sm font-bold text-white">
                  Official Salary Payslip • {new Date(0, selectedSlip.month - 1).toLocaleString('default', { month: 'long' })} {selectedSlip.year}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                >
                  <HiOutlinePrinter className="w-4 h-4 text-indigo-600" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSlip(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 flex justify-center print:p-0 print:bg-white print:overflow-visible">
              <div
                className="bg-white w-full max-w-[794px] min-h-[1123px] shadow-lg rounded-sm relative flex flex-col justify-between text-slate-800 text-[13px] leading-relaxed border border-slate-200 print:border-none print:shadow-none print:m-0 print:w-full print:min-h-0 print:rounded-none"
                style={{
                  backgroundImage: activeLetterheadUrl ? `url("${activeLetterheadUrl}")` : 'none',
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                }}
              >
                {/* Fallback Corporate Header if no blank letterhead uploaded */}
                {!activeLetterheadUrl && (
                  <div className="p-8 border-b-2 border-indigo-600 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/20">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {selectedSlip.company?.name || companyLetterheadData?.name || 'GLOBAL INFOTECH INDIA'}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1 max-w-md">
                        {selectedSlip.company?.address || companyLetterheadData?.address || 'Corporate Park, IT City, Sector 4'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        GSTIN: {selectedSlip.company?.gstNumber || companyLetterheadData?.gstNumber || '27AABCU9603R1ZM'} | CIN: {selectedSlip.company?.registrationNumber || companyLetterheadData?.registrationNumber || 'U72900MH2026PTC123456'}
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xl shadow-sm">
                      {(selectedSlip.company?.name || companyLetterheadData?.name || 'GI').slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                )}

                {/* Content Container (Padded based on Letterhead Margin) */}
                <div
                  className="flex-1 px-8 sm:px-12 flex flex-col justify-between"
                  style={{
                    paddingTop: activeLetterheadUrl ? `${letterheadSettings.headerHeight || 130}px` : '24px',
                    paddingBottom: activeLetterheadUrl ? `${letterheadSettings.footerHeight || 80}px` : '24px',
                  }}
                >
                  <div className="space-y-4">
                    {/* Payslip Title Banner */}
                    <div className="text-center pb-2 border-b-2 border-slate-900">
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                        PAYSLIP FOR THE MONTH OF{' '}
                        {new Date(0, selectedSlip.month - 1).toLocaleString('default', { month: 'long' })}{' '}
                        {selectedSlip.year}
                      </h3>
                      <p className="text-xs text-slate-500">Confidential & Private Document</p>
                    </div>

                    {/* Employee & Payslip Metadata Grid */}
                    <div className="border border-slate-300 rounded-lg p-3 text-xs bg-slate-50/60 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Employee Name</p>
                        <p className="font-bold text-slate-900">{selectedSlip.user?.name || 'Employee'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Designation</p>
                        <p className="font-bold text-slate-800">{selectedSlip.user?.designation || 'Staff'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Department</p>
                        <p className="font-bold text-slate-800">{selectedSlip.user?.department || 'General'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Email</p>
                        <p className="font-mono text-slate-700 truncate">{selectedSlip.user?.email || 'N/A'}</p>
                      </div>

                      {/* Attendance stats */}
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Calendar Days</p>
                        <p className="font-mono font-bold text-slate-800">{selectedSlip.stats?.totalDays || 30}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Working Days</p>
                        <p className="font-mono font-bold text-slate-800">{selectedSlip.stats?.workingDays || 22}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Days Present</p>
                        <p className="font-mono font-bold text-emerald-700">{selectedSlip.stats?.presentDays || 22}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Late Marks / Days</p>
                        <p className="font-mono font-bold text-rose-700">{selectedSlip.stats?.lateDays || 0}</p>
                      </div>
                    </div>

                    {/* Two-Column Side-by-Side Earnings (Credits) vs Deductions (Debits) Table */}
                    <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 text-[11px]">
                            <th className="py-2 px-3 border-r border-slate-300 w-1/2 text-left">
                              EARNINGS (CREDITS)
                            </th>
                            <th className="py-2 px-3 w-1/2 text-left">
                              DEDUCTIONS (DEBITS)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          <tr>
                            {/* Left Side: Earnings */}
                            <td className="p-3 border-r border-slate-300 align-top space-y-1.5">
                              {selectedSlip.earnings?.basic > 0 && (
                                <div className="flex justify-between">
                                  <span>Basic Salary</span>
                                  <span className="font-mono font-bold">₹{selectedSlip.earnings.basic.toLocaleString('en-IN')}</span>
                                </div>
                              )}
                              {selectedSlip.earnings?.hra > 0 && (
                                <div className="flex justify-between">
                                  <span>House Rent Allowance (HRA)</span>
                                  <span className="font-mono font-bold">₹{selectedSlip.earnings.hra.toLocaleString('en-IN')}</span>
                                </div>
                              )}
                              {selectedSlip.earnings?.splAllowance > 0 && (
                                <div className="flex justify-between">
                                  <span>Special Allowance</span>
                                  <span className="font-mono font-bold">₹{selectedSlip.earnings.splAllowance.toLocaleString('en-IN')}</span>
                                </div>
                              )}
                              {selectedSlip.earnings?.exGratia > 0 && (
                                <div className="flex justify-between">
                                  <span>Ex-Gratia</span>
                                  <span className="font-mono font-bold">₹{selectedSlip.earnings.exGratia.toLocaleString('en-IN')}</span>
                                </div>
                              )}
                              {Array.isArray(selectedSlip.dynamicEarnings) &&
                                selectedSlip.dynamicEarnings.map((de, idx) => (
                                  <div key={idx} className="flex justify-between">
                                    <span>{de.name}</span>
                                    <span className="font-mono font-bold">₹{(de.amount || 0).toLocaleString('en-IN')}</span>
                                  </div>
                                ))}
                            </td>

                            {/* Right Side: Deductions */}
                            <td className="p-3 align-top space-y-1.5">
                              {selectedSlip.deductions?.pf > 0 && (
                                <div className="flex justify-between text-rose-700">
                                  <span>Employee PF</span>
                                  <span className="font-mono font-bold">₹{selectedSlip.deductions.pf.toLocaleString('en-IN')}</span>
                                </div>
                              )}
                              {selectedSlip.deductions?.esic > 0 && (
                                <div className="flex justify-between text-rose-700">
                                  <span>Employee ESIC</span>
                                  <span className="font-mono font-bold">₹{selectedSlip.deductions.esic.toLocaleString('en-IN')}</span>
                                </div>
                              )}
                              {selectedSlip.deductions?.professionalTax > 0 && (
                                <div className="flex justify-between text-rose-700">
                                  <span>Professional Tax (PT)</span>
                                  <span className="font-mono font-bold">₹{selectedSlip.deductions.professionalTax.toLocaleString('en-IN')}</span>
                                </div>
                              )}
                              {selectedSlip.deductions?.labourWelfareFund > 0 && (
                                <div className="flex justify-between text-rose-700">
                                  <span>Labour Welfare Fund</span>
                                  <span className="font-mono font-bold">₹{selectedSlip.deductions.labourWelfareFund.toLocaleString('en-IN')}</span>
                                </div>
                              )}
                              {selectedSlip.deductions?.lateDeduction > 0 && (
                                <div className="flex justify-between text-rose-700 font-semibold">
                                  <span>Late Penalty ({selectedSlip.stats?.lateDays || 0} marks)</span>
                                  <span className="font-mono font-bold">₹{selectedSlip.deductions.lateDeduction.toLocaleString('en-IN')}</span>
                                </div>
                              )}
                              {Array.isArray(selectedSlip.dynamicDeductions) &&
                                selectedSlip.dynamicDeductions.map((dd, idx) => (
                                  <div key={idx} className="flex justify-between text-rose-700">
                                    <span>{dd.name}</span>
                                    <span className="font-mono font-bold">₹{(dd.amount || 0).toLocaleString('en-IN')}</span>
                                  </div>
                                ))}
                            </td>
                          </tr>

                          {/* Subtotals Row */}
                          <tr className="bg-slate-50 font-bold text-xs">
                            <td className="py-2 px-3 border-r border-slate-300 text-emerald-900 flex justify-between">
                              <span>Total Gross Earnings (A):</span>
                              <span className="font-mono">₹{(selectedSlip.grossEarnings || 0).toLocaleString('en-IN')}</span>
                            </td>
                            <td className="py-2 px-3 text-rose-900 flex justify-between">
                              <span>Total Deductions (B):</span>
                              <span className="font-mono">₹{(selectedSlip.totalDeductions || 0).toLocaleString('en-IN')}</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Net Pay Box */}
                    <div className="bg-indigo-50/80 border-2 border-indigo-300 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold text-indigo-950 uppercase tracking-wider">
                          Net Payable Amount (Take-Home Payout)
                        </p>
                        <p className="text-xs font-semibold text-indigo-700 mt-0.5 italic">
                          {numberToWords(selectedSlip.netPay || selectedSlip.netSalary || 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-indigo-800 font-mono">
                          ₹{(selectedSlip.netPay || selectedSlip.netSalary || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {/* Employer Contributions Note */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] text-slate-600 flex justify-between items-center">
                      <span>Employer Provident Fund & Benefits Contribution:</span>
                      <span className="font-mono font-bold text-slate-800">
                        ₹{(selectedSlip.totalEmployerContributions || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Signatures & Seal Section */}
                  <div className="pt-6 border-t border-slate-200 flex items-end justify-between">
                    <div className="text-xs text-slate-500">
                      <p>Employee Signature: __________________</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        System Generated On:{' '}
                        {new Date().toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="text-right flex flex-col items-end text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        {activeSealUrl && (
                          <img
                            src={activeSealUrl}
                            alt="Official Stamp"
                            className="w-16 h-16 object-contain opacity-90"
                          />
                        )}
                        {activeSignatureUrl && (
                          <img
                            src={activeSignatureUrl}
                            alt="Authorized Signature"
                            className="h-10 object-contain"
                          />
                        )}
                      </div>
                      <p className="font-bold text-slate-900 text-sm">
                        {letterheadSettings.authorizedSignatoryName || 'Authorized Signatory'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {letterheadSettings.authorizedSignatoryDesignation || 'Human Resources Department'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fallback Corporate Footer if no blank letterhead uploaded */}
                {!activeLetterheadUrl && (
                  <div className="p-4 border-t border-slate-200 text-center text-[10px] text-slate-400 bg-slate-50">
                    This is an electronically verified payroll voucher. No physical signature is mandatory.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySalarySlips;
