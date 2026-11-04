import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlinePrinter,
  HiOutlineArrowDownTray,
  HiOutlineXMark,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';

const InvoiceModal = ({ isOpen, invoice, onClose }) => {
  // Listen for Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open so background doesn't scroll
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const originalTitle = document.title;
    document.title = `Tax-Invoice-${invoice.invoiceNumber || 'Official'}.pdf`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-slate-900 sm:rounded-2xl w-full sm:max-w-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto print:m-0 print:border-none print:shadow-none print:w-full max-h-[92vh] flex flex-col relative z-[10000]"
      >
        {/* ===================== STICKY TOP TOOLBAR (Hidden in print) ===================== */}
        <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2.5 print:hidden shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-800 truncate block">
                Invoice: {invoice.invoiceNumber}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold uppercase">
                Paid & Verified • GST Compliant
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              title="Download or save as PDF"
            >
              <HiOutlineArrowDownTray className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              title="Print Invoice"
            >
              <HiOutlinePrinter className="w-4 h-4" />
              <span>Print</span>
            </button>

            {/* Prominent High-Contrast Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
              aria-label="Close Invoice"
              title="Close (Esc)"
            >
              <HiOutlineXMark className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* ===================== PRINTABLE INVOICE SHEET (Scrollable) ===================== */}
        <div className="overflow-y-auto p-4 sm:p-8 lg:p-12 print:p-0 space-y-5 sm:space-y-6 bg-white font-sans text-slate-800 text-[11px] sm:text-xs lg:text-sm flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between pb-5 border-b-2 border-slate-900 gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                  GI
                </div>
                <span className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
                  GLOBAL INFOTECH
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 font-semibold">{invoice.seller?.companyName}</p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 max-w-xs leading-relaxed">
                {invoice.seller?.address}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-mono mt-1 break-all">
                GSTIN: <strong className="text-slate-800">{invoice.seller?.gstNumber}</strong>
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 break-all">
                Email: {invoice.seller?.email} • Phone: {invoice.seller?.phone}
              </p>
            </div>

            <div className="sm:text-right shrink-0">
              <span className="inline-block px-2.5 py-1 rounded-md bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider mb-2">
                TAX INVOICE
              </span>
              <div className="text-xs sm:text-sm font-black text-slate-900 font-mono break-all">
                {invoice.invoiceNumber}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-1">
                Date:{' '}
                <strong className="text-slate-800">
                  {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </strong>
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500">
                SAC Code: <strong className="text-slate-800">{invoice.seller?.sacCode || '998313'}</strong>
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500">
                Place of Supply: <strong className="text-slate-800">Maharashtra (27)</strong>
              </div>
            </div>
          </div>

          {/* Billed To */}
          <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-[11px] sm:text-xs">
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Billed To (Tenant)
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 break-words">
                {invoice.buyer?.companyName}
              </h4>
              <p className="text-slate-600 mt-0.5 break-words">{invoice.buyer?.address}</p>
              {invoice.buyer?.location && (
                <p className="text-slate-500 break-words">Location: {invoice.buyer.location}</p>
              )}
              <p className="text-slate-500 mt-1 font-mono break-all">
                Company Code: <strong className="text-slate-800">{invoice.buyer?.companyCode}</strong>
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <div className="break-all">
                <span className="text-slate-500">GSTIN: </span>
                <strong className="font-mono text-slate-800">{invoice.buyer?.gstNumber || 'Unregistered'}</strong>
              </div>
              <div className="break-all">
                <span className="text-slate-500">Registration / CIN: </span>
                <strong className="font-mono text-slate-800">{invoice.buyer?.registrationNumber || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-slate-500">Admin Officer: </span>
                <strong className="text-slate-800 break-words">{invoice.buyer?.adminName}</strong>
              </div>
              <div className="break-all">
                <span className="text-slate-500">Email: </span>
                <span className="text-slate-800">{invoice.buyer?.contactEmail}</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-[11px] sm:text-xs min-w-[560px]">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">Service Description</th>
                  <th className="p-2.5">SAC</th>
                  <th className="p-2.5 text-right">Taxable Amount</th>
                  <th className="p-2.5 text-right">GST Rate</th>
                  <th className="p-2.5 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="p-2.5 text-slate-400">01</td>
                  <td className="p-2.5">
                    <div className="font-bold text-slate-900 break-words">
                      {invoice.item?.description}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Billing Cycle: {invoice.item?.billingCycle || 'Monthly'} • Validity: {invoice.item?.validity}
                    </div>
                  </td>
                  <td className="p-2.5 font-mono text-slate-600">{invoice.item?.sacCode || '998313'}</td>
                  <td className="p-2.5 text-right font-mono text-slate-800 whitespace-nowrap">
                    ₹{Number(invoice.item?.basePrice || 0).toLocaleString('en-IN')}.00
                  </td>
                  <td className="p-2.5 text-right text-slate-600 whitespace-nowrap">18% (9% CGST + 9% SGST)</td>
                  <td className="p-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    ₹{Number(invoice.item?.totalAmount || 0).toLocaleString('en-IN')}.00
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Calculations & Payment Info */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-6 pt-2">
            <div className="text-[11px] space-y-2 max-w-sm">
              <p className="font-semibold text-slate-800">Payment Authorization Details</p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 font-mono text-[10px] sm:text-[11px] text-slate-600">
                <div className="break-all">Gateway: <strong className="text-slate-800">{invoice.payment?.gateway}</strong></div>
                <div className="break-all">Payment ID: <strong className="text-slate-800">{invoice.payment?.paymentId}</strong></div>
                <div className="break-all">Order ID: <strong className="text-slate-800">{invoice.payment?.orderId}</strong></div>
                <div>Status: <span className="text-emerald-700 font-bold uppercase">PAID & CAP-ACTIVATED</span></div>
              </div>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-[11px] sm:text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Amount</span>
                <span className="font-mono font-medium text-slate-900">
                  ₹{Number(invoice.item?.basePrice || 0).toLocaleString('en-IN')}.00
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>CGST (9%)</span>
                <span className="font-mono font-medium text-slate-900">
                  ₹{Number(invoice.item?.cgst || 0).toLocaleString('en-IN')}.00
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SGST (9%)</span>
                <span className="font-mono font-medium text-slate-900">
                  ₹{Number(invoice.item?.sgst || 0).toLocaleString('en-IN')}.00
                </span>
              </div>
              <div className="pt-2 border-t-2 border-slate-900 flex justify-between text-sm font-black text-slate-900">
                <span>Total Invoice Value</span>
                <span className="font-mono text-sm sm:text-base font-extrabold text-indigo-700 whitespace-nowrap">
                  ₹{Number(invoice.item?.totalAmount || 0).toLocaleString('en-IN')}.00
                </span>
              </div>
            </div>
          </div>

          {/* Declaration & Signatory */}
          <div className="pt-6 mt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-end justify-between text-[10px] sm:text-[11px] text-slate-500 gap-4">
            <div className="max-w-md space-y-1">
              <p className="font-bold text-slate-700">Declaration & Terms:</p>
              <p>1. Computer-generated tax invoice — no physical signature required under Indian IT Act.</p>
              <p>2. Subscription and add-on capacity fees are billed in advance per multi-tenant cloud agreement.</p>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <div className="h-8 flex items-center sm:justify-end text-indigo-600 font-serif italic text-sm font-bold">
                Global Infotech India Pvt. Ltd.
              </div>
              <p className="font-bold text-slate-800">Authorized Signatory</p>
            </div>
          </div>
        </div>

        {/* ===================== BOTTOM FOOTER ACTIONS (Hidden in print) ===================== */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 print:hidden shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <HiOutlineShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Digital Tax Invoice • Questions? Contact billing@globalinfotech.com</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
            >
              <HiOutlineArrowDownTray className="w-4 h-4" />
              Download PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
            >
              <HiOutlineXMark className="w-4 h-4" />
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default InvoiceModal;

