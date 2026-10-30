import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';

const AdminBilling = () => {
  const { user } = useAuth();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isFetchingInvoice, setIsFetchingInvoice] = useState(false);

  // Fetch Company Billing & Transactions
  const { data: billingData, isLoading, error } = useQuery({
    queryKey: ['companyBillingTransactions'],
    queryFn: async () => {
      const { data } = await api.get('/companies/my-transactions');
      return data;
    }
  });

  const company = billingData?.company;
  const transactions = billingData?.transactions || [];

  // Open Invoice Modal
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

  // Subscription Calculations
  const subscription = company?.subscription || {};
  const startDate = subscription.startDate ? new Date(subscription.startDate) : null;
  const endDate = subscription.endDate ? new Date(subscription.endDate) : null;
  const isExpired = endDate && endDate < new Date();
  const remainingDays = endDate && !isExpired ? Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  const maxLimit = subscription.maxEmployees || 20;
  const currentCount = company?.currentEmployeeCount || 0;
  const seatUsagePercent = Math.min(100, Math.round((currentCount / maxLimit) * 100));

  // Lifetime Spend calculation
  const totalSpend = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center items-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-rose-500/30 text-center max-w-xl mx-auto my-8">
        <h3 className="text-white font-bold text-lg mb-2">Error Loading Billing Information</h3>
        <p className="text-slate-400 text-xs">{error.response?.data?.message || error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Subscription & Billing History</h1>
          <p className="text-slate-400 text-xs mt-1">
            Review active plan limits, renewal timeline, and download official GST tax invoices for accounting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            Tenant: {company?.companyCode || 'ACME-0000'}
          </span>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Subscription Plan */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Active Plan</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isExpired
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : subscription.status === 'Active'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {isExpired ? 'Expired' : subscription.status || 'Active'}
              </span>
            </div>
            <h3 className="text-xl font-black text-white">{subscription.planName || 'Enterprise Plan'}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{company?.name}</p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Billing: <strong className="text-slate-200 uppercase">{subscription.plan?.billingCycle || 'Monthly'}</strong>
          </div>
        </div>

        {/* Card 2: Validity & Remaining Days */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Subscription Validity</span>
              <span className={`text-[11px] font-bold ${isExpired ? 'text-rose-400' : 'text-indigo-400'}`}>
                {isExpired ? 'Expired' : `${remainingDays} Days Left`}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-100 font-mono">
              {endDate ? endDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Started: {startDate ? startDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Renewal Mode: <span className="text-indigo-300 font-medium">Auto-invoice supported</span>
          </div>
        </div>

        {/* Card 3: Employee Seats Quota */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Seat Quota</span>
              <span className="font-mono text-indigo-400 text-xs font-semibold">
                {currentCount} / {maxLimit} Seats
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700 my-2">
              <div
                className={`h-full rounded-full transition-all ${
                  seatUsagePercent >= 90 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${seatUsagePercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {maxLimit - currentCount > 0 ? `${maxLimit - currentCount} employee seats available` : 'Plan limit reached'}
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Capacity: <strong className="text-slate-200">{maxLimit} Max Team Members</strong>
          </div>
        </div>

        {/* Card 4: Total Subscription Investment */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <div>
            <span className="text-xs text-slate-400 block mb-1">Lifetime Invoiced Spend</span>
            <h3 className="text-2xl font-black text-white font-mono">₹{totalSpend.toLocaleString('en-IN')}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Across {transactions.length} Payment Cycle(s)</p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-800 text-[11px] text-slate-400">
            GST Compliance: <span className="text-emerald-400 font-medium">18% Invoices Generated</span>
          </div>
        </div>
      </div>

      {/* Transaction & Invoices Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Payment & Transaction History</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified Razorpay payment transactions with downloadable computerized tax invoices.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Gateway Verified</span>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No transactions found for this company.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/60 text-slate-400 text-xs uppercase font-medium">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Plan & Validity</th>
                  <th className="py-3.5 px-4">Base Fee</th>
                  <th className="py-3.5 px-4">GST (18%)</th>
                  <th className="py-3.5 px-4">Total Paid</th>
                  <th className="py-3.5 px-4">Payment ID</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Tax Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {transactions.map((tx) => {
                  const txDate = tx.paidAt ? new Date(tx.paidAt) : new Date(tx.createdAt);
                  return (
                    <tr key={tx._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-indigo-400 text-xs bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                          {tx.invoiceNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        <div>{txDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div className="text-[10px] text-slate-500">{txDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white text-xs">{tx.planName}</div>
                        <div className="text-[11px] text-slate-400 capitalize">{tx.billingCycle} cycle</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                        ₹{Number(tx.basePrice || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                        ₹{Number(tx.gstAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-emerald-400">
                        ₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                        <span className="truncate block max-w-[120px]" title={tx.paymentId || 'Direct'}>
                          {tx.paymentId || 'Direct'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {tx.status || 'Success'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleViewInvoice(tx._id)}
                          disabled={isFetchingInvoice}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View Invoice
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: PRINTABLE GST TAX INVOICE */}
      {isInvoiceModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 print:m-0 print:border-none print:shadow-none print:w-full">
            
            {/* Modal Control Toolbar (Hidden in Print) */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Tax Invoice Preview: {selectedInvoice.invoiceNumber}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print / Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Invoice Paper Sheet */}
            <div className="p-8 sm:p-12 print:p-4 space-y-6 bg-white font-sans text-slate-800 text-xs sm:text-sm">
              
              {/* Header: Company & Tax Notice */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b-2 border-slate-900 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                      GI
                    </div>
                    <span className="text-xl font-black text-slate-900 tracking-tight">
                      GLOBAL INFOTECH
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold">{selectedInvoice.seller?.companyName}</p>
                  <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">{selectedInvoice.seller?.address}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">GSTIN: <strong className="text-slate-800">{selectedInvoice.seller?.gstNumber}</strong></p>
                  <p className="text-[11px] text-slate-500">Email: {selectedInvoice.seller?.email} • Phone: {selectedInvoice.seller?.phone}</p>
                </div>

                <div className="sm:text-right">
                  <span className="inline-block px-3 py-1 rounded-md bg-slate-900 text-white text-xs font-black uppercase tracking-wider mb-2">
                    TAX INVOICE
                  </span>
                  <div className="text-sm font-black text-slate-900 font-mono">{selectedInvoice.invoiceNumber}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Invoice Date: <strong className="text-slate-800">{new Date(selectedInvoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                  </div>
                  <div className="text-xs text-slate-500">
                    SAC Code: <strong className="text-slate-800">{selectedInvoice.seller?.sacCode}</strong> (Cloud Software Services)
                  </div>
                  <div className="text-xs text-slate-500">
                    Place of Supply: <strong className="text-slate-800">Maharashtra (27)</strong>
                  </div>
                </div>
              </div>

              {/* Billed To (Buyer Info) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Billed To (Customer / Client):
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{selectedInvoice.buyer?.companyName}</h4>
                  <p className="text-slate-600 mt-0.5">{selectedInvoice.buyer?.address}</p>
                  {selectedInvoice.buyer?.location && <p className="text-slate-500">City/Location: {selectedInvoice.buyer.location}</p>}
                  <p className="text-slate-500 mt-1 font-mono">Company Code: <strong className="text-slate-800">{selectedInvoice.buyer?.companyCode}</strong></p>
                </div>

                <div className="sm:text-right space-y-1">
                  <div>
                    <span className="text-slate-500">GSTIN: </span>
                    <strong className="font-mono text-slate-800">{selectedInvoice.buyer?.gstNumber || 'Unregistered'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">CIN / Registration: </span>
                    <strong className="font-mono text-slate-800">{selectedInvoice.buyer?.registrationNumber || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Authorized Admin: </span>
                    <strong className="text-slate-800">{selectedInvoice.buyer?.adminName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Official Email: </span>
                    <span className="text-slate-800">{selectedInvoice.buyer?.contactEmail}</span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Service Description</th>
                      <th className="p-3">SAC</th>
                      <th className="p-3 text-right">Taxable Value</th>
                      <th className="p-3 text-right">GST Rate</th>
                      <th className="p-3 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr>
                      <td className="p-3 text-slate-400">01</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{selectedInvoice.item?.description}</div>
                        <div className="text-[11px] text-slate-500">Validity Period: {selectedInvoice.item?.validity}</div>
                      </td>
                      <td className="p-3 font-mono text-slate-600">{selectedInvoice.item?.sacCode}</td>
                      <td className="p-3 text-right font-mono text-slate-800">₹{selectedInvoice.item?.basePrice?.toLocaleString('en-IN')}.00</td>
                      <td className="p-3 text-right text-slate-600">18% (9% CGST + 9% SGST)</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">₹{selectedInvoice.item?.totalAmount?.toLocaleString('en-IN')}.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Calculations Box */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
                <div className="text-xs space-y-2 max-w-sm">
                  <p className="font-semibold text-slate-800">Payment Information:</p>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 font-mono text-[11px] text-slate-600">
                    <div>Mode: <strong className="text-slate-800">{selectedInvoice.payment?.gateway}</strong></div>
                    <div>Payment ID: <strong className="text-slate-800">{selectedInvoice.payment?.paymentId}</strong></div>
                    <div>Order ID: <strong className="text-slate-800">{selectedInvoice.payment?.orderId}</strong></div>
                    <div>Status: <span className="text-emerald-600 font-bold uppercase">PAID & VERIFIED</span></div>
                  </div>
                </div>

                <div className="w-full sm:w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Amount</span>
                    <span className="font-mono font-medium text-slate-900">₹{selectedInvoice.item?.basePrice?.toLocaleString('en-IN')}.00</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST (9.0%)</span>
                    <span className="font-mono font-medium text-slate-900">₹{selectedInvoice.item?.cgst?.toLocaleString('en-IN')}.00</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST (9.0%)</span>
                    <span className="font-mono font-medium text-slate-900">₹{selectedInvoice.item?.sgst?.toLocaleString('en-IN')}.00</span>
                  </div>
                  <div className="pt-2 border-t-2 border-slate-900 flex justify-between text-sm font-black text-slate-900">
                    <span>Total Amount (INR)</span>
                    <span className="font-mono text-base font-extrabold text-indigo-700">₹{selectedInvoice.item?.totalAmount?.toLocaleString('en-IN')}.00</span>
                  </div>
                </div>
              </div>

              {/* Signatory & Legal Terms */}
              <div className="pt-8 mt-8 border-t border-slate-200 flex flex-col sm:flex-row items-end justify-between text-[11px] text-slate-500 gap-4">
                <div className="max-w-md space-y-1">
                  <p className="font-bold text-slate-700">Declaration & Terms:</p>
                  <p>1. This is a computer-generated tax invoice and requires no physical signature under Indian IT Act.</p>
                  <p>2. Subscription fees are billed in advance according to the chosen multi-tenant quota agreement.</p>
                </div>

                <div className="text-center sm:text-right">
                  <div className="h-12 flex items-center justify-center sm:justify-end text-indigo-600 font-serif italic text-sm font-bold">
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
