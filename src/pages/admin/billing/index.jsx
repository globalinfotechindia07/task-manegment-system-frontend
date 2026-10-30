import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  HiOutlineDocumentText,
  HiOutlinePrinter,
  HiOutlineXMark,
  HiOutlineCreditCard,
  HiOutlineCalendarDays,
  HiOutlineUsers,
  HiOutlineBanknotes,
} from 'react-icons/hi2';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';

const AdminBilling = () => {
  const { user } = useAuth();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isFetchingInvoice, setIsFetchingInvoice] = useState(false);

  const { data: billingData, isLoading, error } = useQuery({
    queryKey: ['companyBillingTransactions'],
    queryFn: async () => {
      const { data } = await api.get('/companies/my-transactions');
      return data;
    },
  });

  const company = billingData?.company;
  const transactions = billingData?.transactions || [];

  const handleViewInvoice = async (transactionId) => {
    setIsFetchingInvoice(true);
    try {
      const { data: invoiceData } = await api.get(`/companies/transactions/${transactionId}/invoice`);
      setSelectedInvoice(invoiceData);
      setIsInvoiceModalOpen(true);
    } catch (err) {
      console.error('Failed to load invoice:', err);
      toast.error(err.response?.data?.message || 'Could not load invoice data');
    } finally {
      setIsFetchingInvoice(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const subscription = company?.subscription || {};
  const startDate = subscription.startDate ? new Date(subscription.startDate) : null;
  const endDate = subscription.endDate ? new Date(subscription.endDate) : null;
  const isExpired = endDate && endDate < new Date();
  const remainingDays = endDate && !isExpired ? Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  const maxLimit = subscription.maxEmployees || 20;
  const currentCount = company?.currentEmployeeCount || 0;
  const seatUsagePercent = Math.min(100, Math.round((currentCount / maxLimit) * 100));

  const totalSpend = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16 min-h-[400px]">
        <div className="w-9 h-9 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-rose-200 text-center max-w-xl mx-auto my-8 shadow-sm">
        <h3 className="text-slate-900 font-bold text-base sm:text-lg mb-2">Error Loading Billing Information</h3>
        <p className="text-slate-500 text-xs">{error.response?.data?.message || error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ===================== PAGE HEADER ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Subscription & Billing History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review active plan limits, renewal timeline, and download official GST tax invoices.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 truncate max-w-[180px]">
            Tenant: {company?.companyCode || 'ACME-0000'}
          </span>
        </div>
      </div>

      {/* ===================== METRIC CARDS ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

        {/* Card 1: Active Plan */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
              <span className="flex items-center gap-1.5 font-medium">
                <HiOutlineCreditCard className="w-3.5 h-3.5 text-slate-400" />
                Active Plan
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${isExpired
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : subscription.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
              >
                {isExpired ? 'Expired' : subscription.status || 'Active'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {subscription.planName || 'Enterprise Plan'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{company?.name}</p>
          </div>
          <div className="pt-2.5 mt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Billing: <strong className="text-slate-800 uppercase">{subscription.plan?.billingCycle || 'Monthly'}</strong>
          </div>
        </div>

        {/* Card 2: Validity */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
              <span className="flex items-center gap-1.5 font-medium">
                <HiOutlineCalendarDays className="w-3.5 h-3.5 text-slate-400" />
                Validity
              </span>
              <span className={`text-[10px] font-bold shrink-0 ${isExpired ? 'text-rose-600' : 'text-indigo-600'}`}>
                {isExpired ? 'Expired' : `${remainingDays}d left`}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 font-mono">
              {endDate
                ? endDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'N/A'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              From:{' '}
              {startDate
                ? startDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'N/A'}
            </p>
          </div>
          <div className="pt-2.5 mt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Renewal: <span className="text-indigo-600 font-medium">Auto-invoice</span>
          </div>
        </div>

        {/* Card 3: Seat Usage */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
              <span className="flex items-center gap-1.5 font-medium">
                <HiOutlineUsers className="w-3.5 h-3.5 text-slate-400" />
                Seat Quota
              </span>
              <span className="font-mono text-slate-700 text-[10px] font-bold shrink-0">
                {currentCount}/{maxLimit}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200 my-2">
              <div
                className={`h-full rounded-full transition-all ${seatUsagePercent >= 90 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                style={{ width: `${seatUsagePercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {maxLimit - currentCount > 0
                ? `${maxLimit - currentCount} seats available`
                : 'Limit reached'}
            </p>
          </div>
          <div className="pt-2.5 mt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Max: <strong className="text-slate-800">{maxLimit} members</strong>
          </div>
        </div>

        {/* Card 4: Spend */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1.5">
              <HiOutlineBanknotes className="w-3.5 h-3.5 text-slate-400" />
              Lifetime Spend
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              ₹{totalSpend.toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Across {transactions.length} cycle(s)
            </p>
          </div>
          <div className="pt-2.5 mt-3 border-t border-slate-100 text-[11px] text-slate-500">
            GST: <span className="text-emerald-600 font-medium">18% Compliant</span>
          </div>
        </div>
      </div>

      {/* ===================== TRANSACTIONS TABLE ===================== */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Payment & Transaction History
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Verified Razorpay transactions with downloadable tax invoices.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-500 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Gateway Verified</span>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <HiOutlineDocumentText className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-700">No transactions yet</p>
            <p className="text-xs text-slate-500 mt-1">Your payment history will appear here.</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (< md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {transactions.map((tx) => {
                const txDate = tx.paidAt ? new Date(tx.paidAt) : new Date(tx.createdAt);
                return (
                  <div key={tx._id} className="p-4 hover:bg-slate-50/60 transition-colors">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="font-mono font-bold text-indigo-700 text-[11px] bg-indigo-50 px-2 py-1 rounded border border-indigo-200 truncate">
                        {tx.invoiceNumber}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        {tx.status || 'Success'}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Plan</span>
                        <span className="font-semibold text-slate-900 text-right truncate">
                          {tx.planName} ({tx.billingCycle})
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Date</span>
                        <span className="text-slate-700 text-right">
                          {txDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Amount</span>
                        <span className="font-mono font-bold text-emerald-600 text-right">
                          ₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Payment ID</span>
                        <span className="font-mono text-slate-600 text-[11px] text-right truncate max-w-[160px]">
                          {tx.paymentId || 'Direct'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewInvoice(tx._id)}
                      disabled={isFetchingInvoice}
                      className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <HiOutlineDocumentText className="w-3.5 h-3.5" />
                      View Invoice
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700 text-[11px] uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 whitespace-nowrap">Invoice #</th>
                    <th className="py-3 px-4 whitespace-nowrap">Date</th>
                    <th className="py-3 px-4 whitespace-nowrap">Plan</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Base</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">GST</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Total</th>
                    <th className="py-3 px-4 whitespace-nowrap">Payment ID</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => {
                    const txDate = tx.paidAt ? new Date(tx.paidAt) : new Date(tx.createdAt);
                    return (
                      <tr key={tx._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-indigo-700 text-[11px] bg-indigo-50 px-2 py-1 rounded border border-indigo-200 whitespace-nowrap">
                            {tx.invoiceNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700">
                          <div>
                            {txDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {txDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 text-xs">{tx.planName}</div>
                          <div className="text-[11px] text-slate-500 capitalize">{tx.billingCycle}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-700 text-right">
                          ₹{Number(tx.basePrice || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-500 text-right">
                          ₹{Number(tx.gstAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs font-bold text-emerald-600 text-right">
                          ₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-slate-600">
                          <span className="truncate block max-w-[120px]" title={tx.paymentId || 'Direct'}>
                            {tx.paymentId || 'Direct'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                            {tx.status || 'Success'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleViewInvoice(tx._id)}
                            disabled={isFetchingInvoice}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                          >
                            <HiOutlineDocumentText className="w-3.5 h-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ===================== INVOICE MODAL ===================== */}
      {isInvoiceModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white text-slate-900 sm:rounded-2xl w-full sm:max-w-3xl shadow-2xl border-0 sm:border border-slate-200 overflow-hidden my-0 sm:my-8 print:m-0 print:border-none print:shadow-none print:w-full">

            {/* Toolbar (hidden in print) */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 print:hidden">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 truncate">
                  Invoice: {selectedInvoice.invoiceNumber}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer flex-1 sm:flex-initial"
                >
                  <HiOutlinePrinter className="w-4 h-4" />
                  <span className="hidden sm:inline">Print / Download PDF</span>
                  <span className="sm:hidden">Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="p-1.5 -mr-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg cursor-pointer shrink-0"
                  aria-label="Close"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Sheet */}
            <div className="p-4 sm:p-8 lg:p-12 print:p-4 space-y-5 sm:space-y-6 bg-white font-sans text-slate-800 text-[11px] sm:text-xs lg:text-sm">

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
                  <p className="text-[11px] sm:text-xs text-slate-600 font-semibold">{selectedInvoice.seller?.companyName}</p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 max-w-xs leading-relaxed">
                    {selectedInvoice.seller?.address}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-mono mt-1 break-all">
                    GSTIN: <strong className="text-slate-800">{selectedInvoice.seller?.gstNumber}</strong>
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 break-all">
                    Email: {selectedInvoice.seller?.email} • Phone: {selectedInvoice.seller?.phone}
                  </p>
                </div>

                <div className="sm:text-right shrink-0">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider mb-2">
                    TAX INVOICE
                  </span>
                  <div className="text-xs sm:text-sm font-black text-slate-900 font-mono break-all">
                    {selectedInvoice.invoiceNumber}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500 mt-1">
                    Date:{' '}
                    <strong className="text-slate-800">
                      {new Date(selectedInvoice.invoiceDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </strong>
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500">
                    SAC: <strong className="text-slate-800">{selectedInvoice.seller?.sacCode}</strong>
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500">
                    POS: <strong className="text-slate-800">Maharashtra (27)</strong>
                  </div>
                </div>
              </div>

              {/* Billed To */}
              <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-[11px] sm:text-xs">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Billed To
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 break-words">
                    {selectedInvoice.buyer?.companyName}
                  </h4>
                  <p className="text-slate-600 mt-0.5 break-words">{selectedInvoice.buyer?.address}</p>
                  {selectedInvoice.buyer?.location && (
                    <p className="text-slate-500 break-words">City: {selectedInvoice.buyer.location}</p>
                  )}
                  <p className="text-slate-500 mt-1 font-mono break-all">
                    Code: <strong className="text-slate-800">{selectedInvoice.buyer?.companyCode}</strong>
                  </p>
                </div>

                <div className="sm:text-right space-y-1">
                  <div className="break-all">
                    <span className="text-slate-500">GSTIN: </span>
                    <strong className="font-mono text-slate-800">{selectedInvoice.buyer?.gstNumber || 'Unregistered'}</strong>
                  </div>
                  <div className="break-all">
                    <span className="text-slate-500">CIN: </span>
                    <strong className="font-mono text-slate-800">{selectedInvoice.buyer?.registrationNumber || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Admin: </span>
                    <strong className="text-slate-800 break-words">{selectedInvoice.buyer?.adminName}</strong>
                  </div>
                  <div className="break-all">
                    <span className="text-slate-500">Email: </span>
                    <span className="text-slate-800">{selectedInvoice.buyer?.contactEmail}</span>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-[11px] sm:text-xs min-w-[560px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Service</th>
                      <th className="p-2.5">SAC</th>
                      <th className="p-2.5 text-right">Taxable</th>
                      <th className="p-2.5 text-right">GST</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr>
                      <td className="p-2.5 text-slate-400">01</td>
                      <td className="p-2.5">
                        <div className="font-bold text-slate-900 break-words">
                          {selectedInvoice.item?.description}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Validity: {selectedInvoice.item?.validity}
                        </div>
                      </td>
                      <td className="p-2.5 font-mono text-slate-600">{selectedInvoice.item?.sacCode}</td>
                      <td className="p-2.5 text-right font-mono text-slate-800 whitespace-nowrap">
                        ₹{selectedInvoice.item?.basePrice?.toLocaleString('en-IN')}.00
                      </td>
                      <td className="p-2.5 text-right text-slate-600 whitespace-nowrap">18%</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        ₹{selectedInvoice.item?.totalAmount?.toLocaleString('en-IN')}.00
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Calculations */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-6 pt-2">
                <div className="text-[11px] space-y-2 max-w-sm">
                  <p className="font-semibold text-slate-800">Payment Information</p>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 font-mono text-[10px] sm:text-[11px] text-slate-600">
                    <div className="break-all">Mode: <strong className="text-slate-800">{selectedInvoice.payment?.gateway}</strong></div>
                    <div className="break-all">Payment ID: <strong className="text-slate-800">{selectedInvoice.payment?.paymentId}</strong></div>
                    <div className="break-all">Order ID: <strong className="text-slate-800">{selectedInvoice.payment?.orderId}</strong></div>
                    <div>Status: <span className="text-emerald-600 font-bold uppercase">PAID & VERIFIED</span></div>
                  </div>
                </div>

                <div className="w-full sm:w-64 space-y-2 text-[11px] sm:text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Amount</span>
                    <span className="font-mono font-medium text-slate-900">
                      ₹{selectedInvoice.item?.basePrice?.toLocaleString('en-IN')}.00
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST (9%)</span>
                    <span className="font-mono font-medium text-slate-900">
                      ₹{selectedInvoice.item?.cgst?.toLocaleString('en-IN')}.00
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST (9%)</span>
                    <span className="font-mono font-medium text-slate-900">
                      ₹{selectedInvoice.item?.sgst?.toLocaleString('en-IN')}.00
                    </span>
                  </div>
                  <div className="pt-2 border-t-2 border-slate-900 flex justify-between text-sm font-black text-slate-900">
                    <span>Total</span>
                    <span className="font-mono text-sm sm:text-base font-extrabold text-indigo-700 whitespace-nowrap">
                      ₹{selectedInvoice.item?.totalAmount?.toLocaleString('en-IN')}.00
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatory */}
              <div className="pt-6 mt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-end justify-between text-[10px] sm:text-[11px] text-slate-500 gap-4">
                <div className="max-w-md space-y-1">
                  <p className="font-bold text-slate-700">Declaration & Terms:</p>
                  <p>1. Computer-generated tax invoice — no physical signature required under Indian IT Act.</p>
                  <p>2. Subscription fees are billed in advance per multi-tenant quota agreement.</p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <div className="h-10 flex items-center sm:justify-end text-indigo-600 font-serif italic text-sm font-bold">
                    Global Infotech India Pvt. Ltd.
                  </div>
                  <p className="font-bold text-slate-800">Authorized Signatory</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBilling;