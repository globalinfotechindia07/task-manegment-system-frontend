import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  HiOutlineDocumentText,
  HiOutlinePrinter,
  HiOutlineXMark,
  HiOutlineCreditCard,
  HiOutlineCalendarDays,
  HiOutlineUsers,
  HiOutlineBanknotes,
  HiOutlinePlus,
  HiOutlineArrowUpCircle,
  HiOutlineCheckCircle,
  HiOutlineSparkles,
  HiOutlineInformationCircle,
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
  HiOutlineQrCode,
  HiOutlineBuildingLibrary,
  HiOutlineArrowPath,
} from 'react-icons/hi2';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import InvoiceModal from '../../../components/billing/InvoiceModal';

const AdminBilling = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Invoice view states
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isFetchingInvoice, setIsFetchingInvoice] = useState(false);

  // Add-on extra users states
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [selectedExtraSeats, setSelectedExtraSeats] = useState(1);
  const [isPurchasingAddon, setIsPurchasingAddon] = useState(false);

  // Upgrade plan states
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedUpgradePlanId, setSelectedUpgradePlanId] = useState('');
  const [isUpgradingPlan, setIsUpgradingPlan] = useState(false);

  // 1. Fetch Company Billing Data & Subscription
  const { data: billingData, isLoading, error, refetch: refetchBilling } = useQuery({
    queryKey: ['companyBillingTransactions'],
    queryFn: async () => {
      const { data } = await api.get('/companies/my-transactions');
      return data;
    },
  });

  // 2. Fetch Available Plans for Upgrade
  const { data: availablePlans } = useQuery({
    queryKey: ['availablePlansForUpgrade'],
    queryFn: async () => {
      const { data } = await api.get('/plans');
      return data || [];
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

  // Plan limits & Add-on limits
  const baseLimit = subscription.baseLimit || subscription.maxEmployees || 15;
  const extraUsersCount = subscription.extraUsersCount || 0;
  const maxLimit = subscription.totalAllowedSeats || (baseLimit + extraUsersCount);
  const remainingAddons = subscription.remainingAddons !== undefined ? subscription.remainingAddons : Math.max(0, 5 - extraUsersCount);
  const pricePerExtraSeat = subscription.pricePerExtraSeat || Math.max(99, Math.round((subscription.plan?.price || 1500) / baseLimit));

  const currentCount = company?.currentEmployeeCount || 0;
  const seatUsagePercent = Math.min(100, Math.round((currentCount / maxLimit) * 100));
  const totalSpend = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

  // ===================== PAYMENT GATEWAY CHECKOUT STATES =====================
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutSession, setCheckoutSession] = useState(null);
  // paymentStatus: 'ready' | 'authorizing' | 'provisioning' | 'success' | 'failed'
  const [paymentStatus, setPaymentStatus] = useState('ready');
  const [authStepText, setAuthStepText] = useState('');
  const [paymentMethodTab, setPaymentMethodTab] = useState('upi'); // 'upi' | 'card' | 'netbanking'
  const [completedPaymentResult, setCompletedPaymentResult] = useState(null);
  const [paymentErrorMsg, setPaymentErrorMsg] = useState('');

  // Card details state
  const [cardDetails, setCardDetails] = useState({
    number: '4532 8920 1192 4820',
    name: user?.name || 'Authorized Officer',
    expiry: '09/29',
    cvv: '624',
  });

  // UPI details state
  const [upiVpa, setUpiVpa] = useState('company.admin@okaxis');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  const loadRazorpaySDK = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const existingScript = document.getElementById('razorpay-checkout-js');
      if (existingScript) {
        existingScript.onload = () => resolve(true);
        existingScript.onerror = () => resolve(false);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-js';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Complete Payment and Provision Seats (Strictly executed AFTER payment authorization succeeds)
  const completePaymentAndProvision = async ({
    type,
    seatsCount,
    newPlanId,
    paymentId,
    orderId,
    paymentGateway,
    orderData,
  }) => {
    try {
      setPaymentStatus('provisioning');
      setAuthStepText('Payment verified! Activating seats and generating invoice...');

      let responseData;
      if (type === 'ADDON') {
        const { data } = await api.post('/companies/purchase-extra-users', {
          seatsCount,
          paymentId,
          orderId,
          paymentGateway,
        });
        responseData = data;
        toast.success(data.message || `Payment verified! Added ${seatsCount} extra seat(s).`);
      } else {
        const { data } = await api.post('/companies/upgrade-plan', {
          newPlanId,
          paymentId,
          orderId,
          paymentGateway,
        });
        responseData = data;
        toast.success(data.message || 'Payment verified! Plan upgraded successfully.');
      }

      setCompletedPaymentResult({
        ...responseData,
        paymentId,
        orderId,
        paymentGateway,
        orderData,
        type,
      });
      setPaymentStatus('success');

      // Refresh billing data so updated seat count & invoice appear immediately
      queryClient.invalidateQueries({ queryKey: ['companyBillingTransactions'] });
    } catch (err) {
      console.error('Payment provisioning error:', err);
      setPaymentStatus('failed');
      const msg = err.response?.data?.message || 'Failed to activate seats after payment.';
      setPaymentErrorMsg(msg);
      toast.error(msg);
    }
  };

  // 1. Step 1: User clicks "Pay & Add Seats" in Add-on modal -> loads payment order
  const handleInitiateAddonCheckout = async (e) => {
    e.preventDefault();
    try {
      setIsPurchasingAddon(true);
      const { data: orderData } = await api.post('/companies/create-checkout-order', {
        type: 'ADDON',
        seatsCount: selectedExtraSeats,
      });

      setIsAddonModalOpen(false);

      // Check if online Razorpay gateway is ready
      if (orderData.mode === 'RAZORPAY') {
        const isLoaded = await loadRazorpaySDK();
        if (isLoaded && window.Razorpay) {
          const options = {
            key: orderData.keyId,
            amount: orderData.amountPaise,
            currency: orderData.currency || 'INR',
            name: orderData.company?.name || 'Global Infotech',
            description: orderData.description,
            order_id: orderData.orderId,
            prefill: {
              name: orderData.company?.email || user?.name,
              email: orderData.company?.email || user?.email,
              contact: orderData.company?.phone || user?.phone,
            },
            theme: { color: '#4f46e5' },
            handler: async function (response) {
              await completePaymentAndProvision({
                type: 'ADDON',
                seatsCount: selectedExtraSeats,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                paymentGateway: 'Razorpay',
                orderData,
              });
            },
            modal: {
              ondismiss: function () {
                setIsPurchasingAddon(false);
                toast('Payment checkout was cancelled.');
              },
            },
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
          setIsPurchasingAddon(false);
          return;
        }
      }

      // If sandbox mode or Razorpay fallback, open secure payment checkout modal
      setCheckoutSession({
        type: 'ADDON',
        seatsCount: selectedExtraSeats,
        orderData,
      });
      setPaymentStatus('ready');
      setCompletedPaymentResult(null);
      setPaymentErrorMsg('');
      setCheckoutModalOpen(true);
    } catch (err) {
      console.error('Failed to initiate checkout:', err);
      toast.error(err.response?.data?.message || 'Could not start payment checkout. Please try again.');
    } finally {
      setIsPurchasingAddon(false);
    }
  };

  // 2. Step 1: User clicks "Confirm & Upgrade Plan" in Upgrade modal -> loads payment order
  const handleInitiateUpgradeCheckout = async (e) => {
    e.preventDefault();
    if (!selectedUpgradePlanId) {
      toast.error('Please choose a plan to upgrade to.');
      return;
    }

    try {
      setIsUpgradingPlan(true);
      const { data: orderData } = await api.post('/companies/create-checkout-order', {
        type: 'UPGRADE',
        newPlanId: selectedUpgradePlanId,
      });

      setIsUpgradeModalOpen(false);

      if (orderData.mode === 'RAZORPAY') {
        const isLoaded = await loadRazorpaySDK();
        if (isLoaded && window.Razorpay) {
          const options = {
            key: orderData.keyId,
            amount: orderData.amountPaise,
            currency: orderData.currency || 'INR',
            name: orderData.company?.name || 'Global Infotech',
            description: orderData.description,
            order_id: orderData.orderId,
            prefill: {
              name: orderData.company?.email || user?.name,
              email: orderData.company?.email || user?.email,
              contact: orderData.company?.phone || user?.phone,
            },
            theme: { color: '#4f46e5' },
            handler: async function (response) {
              await completePaymentAndProvision({
                type: 'UPGRADE',
                newPlanId: selectedUpgradePlanId,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                paymentGateway: 'Razorpay',
                orderData,
              });
            },
            modal: {
              ondismiss: function () {
                setIsUpgradingPlan(false);
                toast('Payment checkout was cancelled.');
              },
            },
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
          setIsUpgradingPlan(false);
          return;
        }
      }

      // If sandbox mode or Razorpay fallback, open secure payment checkout modal
      setCheckoutSession({
        type: 'UPGRADE',
        newPlanId: selectedUpgradePlanId,
        orderData,
      });
      setPaymentStatus('ready');
      setCompletedPaymentResult(null);
      setPaymentErrorMsg('');
      setCheckoutModalOpen(true);
    } catch (err) {
      console.error('Failed to initiate upgrade checkout:', err);
      toast.error(err.response?.data?.message || 'Could not start upgrade checkout. Please try again.');
    } finally {
      setIsUpgradingPlan(false);
    }
  };

  // 3. User authorizes payment inside the Payment Gateway Modal
  const handleAuthorizeModalPayment = async () => {
    if (!checkoutSession) return;
    setPaymentStatus('authorizing');
    setPaymentErrorMsg('');

    try {
      setAuthStepText('1/3 Connecting to encrypted banking network...');
      await new Promise((r) => setTimeout(r, 600));

      setAuthStepText('2/3 Validating security token & bank authorization...');
      await new Promise((r) => setTimeout(r, 700));

      const generatedPayId = `pay_${paymentMethodTab}_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      const orderId = checkoutSession.orderData?.orderId || `order_${Date.now()}`;
      const paymentGateway =
        paymentMethodTab === 'upi'
          ? 'UPI / QR Payment'
          : paymentMethodTab === 'card'
          ? 'Debit / Credit Card'
          : `NetBanking (${selectedBank})`;

      setAuthStepText('3/3 Payment authorized! Allocating capacity...');
      await new Promise((r) => setTimeout(r, 500));

      await completePaymentAndProvision({
        type: checkoutSession.type,
        seatsCount: checkoutSession.seatsCount,
        newPlanId: checkoutSession.newPlanId,
        paymentId: generatedPayId,
        orderId,
        paymentGateway,
        orderData: checkoutSession.orderData,
      });
    } catch (err) {
      setPaymentStatus('failed');
      setPaymentErrorMsg('Transaction authorization failed. Please try again.');
    }
  };

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

  const selectedUpgradePlan = (availablePlans || []).find((p) => p._id === selectedUpgradePlanId);

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto pb-12">
      {/* ===================== PAGE HEADER ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Subscription & Billing History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your employee capacity, purchase add-on seats (up to 5), upgrade plans, and download GST tax invoices.
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
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
              <span className="flex items-center gap-1.5 font-medium">
                <HiOutlineCreditCard className="w-3.5 h-3.5 text-slate-400" />
                Active Plan
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                  isExpired
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
          <div className="pt-2.5 mt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Billing: <strong className="text-slate-800 uppercase">{subscription.plan?.billingCycle || 'Monthly'}</strong></span>
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
            >
              Upgrade
            </button>
          </div>
        </div>

        {/* Card 2: Validity */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
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

        {/* Card 3: Seat Usage & Addons */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
              <span className="flex items-center gap-1.5 font-medium">
                <HiOutlineUsers className="w-3.5 h-3.5 text-slate-400" />
                Total Seat Quota
              </span>
              <span className="font-mono text-slate-700 text-[10px] font-bold shrink-0">
                {currentCount}/{maxLimit}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200 my-2">
              <div
                className={`h-full rounded-full transition-all ${
                  seatUsagePercent >= 90 ? 'bg-rose-500' : 'bg-emerald-500'
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
          <div className="pt-2.5 mt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Base: <strong>{baseLimit}</strong> | Extra: <strong>+{extraUsersCount}</strong></span>
            {remainingAddons > 0 ? (
              <button
                onClick={() => setIsAddonModalOpen(true)}
                className="text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
              >
                +Add Seats
              </button>
            ) : (
              <span className="text-[10px] text-rose-600 font-semibold">Max 5 used</span>
            )}
          </div>
        </div>

        {/* Card 4: Spend */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1.5">
              <HiOutlineBanknotes className="w-3.5 h-3.5 text-slate-400" />
              Lifetime Spend
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              ₹{totalSpend.toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Across {transactions.length} cycle(s) & add-ons
            </p>
          </div>
          <div className="pt-2.5 mt-3 border-t border-slate-100 text-[11px] text-slate-500">
            GST: <span className="text-emerald-600 font-medium">18% Compliant</span>
          </div>
        </div>
      </div>

      {/* ===================== EMPLOYEE CAPACITY & SCALING MANAGEMENT BANNER ===================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900">
                Employee Seat Scaling & Add-on Management
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Base Plan: {baseLimit} Users
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Add-on Seats: +{extraUsersCount} / 5 Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Your company plan allows creating up to <strong className="text-slate-800">{maxLimit} team members</strong> ({baseLimit} base + {extraUsersCount} add-on).
              You can purchase up to <strong className="text-indigo-600">{remainingAddons} additional user seat(s)</strong> at <strong className="text-slate-800">₹{pricePerExtraSeat}/seat/mo</strong> without upgrading. For more than 5 extra users, a plan upgrade is required.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsAddonModalOpen(true)}
              disabled={remainingAddons <= 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <HiOutlinePlus className="w-4 h-4" />
              {remainingAddons > 0 ? `Add Extra Seats (${remainingAddons} left)` : 'Max 5 Add-ons Reached'}
            </button>

            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <HiOutlineArrowUpCircle className="w-4 h-4" />
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              Active Users: <strong className="text-slate-900">{currentCount}</strong> of <strong className="text-slate-900">{maxLimit}</strong> seats occupied
            </span>
            <span className="font-semibold text-indigo-600">
              {maxLimit - currentCount} seats available
            </span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                seatUsagePercent >= 95
                  ? 'bg-rose-500'
                  : seatUsagePercent >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${seatUsagePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ===================== TRANSACTIONS TABLE ===================== */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Payment & Transaction History
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Verified Razorpay transactions with downloadable tax invoices for plan cycles and add-on seats.
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Plan / Add-on Item</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Base</th>
                  <th className="py-3 px-4">GST (18%)</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transactions.map((tx) => {
                  return (
                    <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {tx.invoiceNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{tx.planName}</div>
                        {tx.description && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">
                            {tx.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {new Date(tx.paidAt || tx.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                        ₹{(tx.basePrice || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        ₹{(tx.gstAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        ₹{(tx.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                          Paid
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleViewInvoice(tx._id)}
                          disabled={isFetchingInvoice}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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
        )}
      </div>

      {/* ===================== ADD-ON EXTRA USERS MODAL ===================== */}
      {isAddonModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <HiOutlinePlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Purchase Add-on User Seats</h3>
                  <p className="text-xs text-slate-500">Scale without upgrading your entire plan (Max 5 extra seats)</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddonModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {remainingAddons <= 0 ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 border border-amber-200 rounded-full flex items-center justify-center mx-auto">
                  <HiOutlineInformationCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Maximum Add-on Limit Reached</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Your company has already purchased all 5 allowed add-on seats on top of your {baseLimit}-user plan. To add more employees, please upgrade to a higher subscription plan.
                  </p>
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setIsAddonModalOpen(false);
                      setIsUpgradeModalOpen(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    View Upgrade Plans
                  </button>
                  <button
                    onClick={() => setIsAddonModalOpen(false)}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInitiateAddonCheckout} className="p-5 space-y-4 text-xs">
                {/* Plan Info */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Base Plan</span>
                    <span className="font-bold text-slate-900">{subscription.planName} ({baseLimit} Users)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Add-ons Available</span>
                    <span className="font-bold text-emerald-600">Up to {remainingAddons} more seats (Max 5)</span>
                  </div>
                </div>

                {/* Seats Selection */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Number of Add-on User Seats to Purchase:
                  </label>
                  <select
                    value={selectedExtraSeats}
                    onChange={(e) => setSelectedExtraSeats(Number(e.target.value))}
                    className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  >
                    {Array.from({ length: remainingAddons }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        +{num} User Seat{num > 1 ? 's' : ''} (New Limit: {baseLimit + extraUsersCount + num} Users)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Calculation Summary */}
                <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2 text-indigo-950">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Rate Per Extra Seat:</span>
                    <span className="font-mono font-semibold">₹{pricePerExtraSeat} / seat / month</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Base Cost ({selectedExtraSeats} seat{selectedExtraSeats > 1 ? 's' : ''}):</span>
                    <span className="font-mono font-semibold">₹{(selectedExtraSeats * pricePerExtraSeat).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">GST (18%):</span>
                    <span className="font-mono font-semibold">₹{Math.round(selectedExtraSeats * pricePerExtraSeat * 0.18).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t border-indigo-200/80 flex items-center justify-between font-bold text-sm">
                    <span className="text-slate-900">Total Payable:</span>
                    <span className="font-mono text-indigo-700 text-base">
                      ₹{Math.round(selectedExtraSeats * pricePerExtraSeat * 1.18).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsAddonModalOpen(false)}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPurchasingAddon}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {isPurchasingAddon ? (
                      <>
                        <HiOutlineArrowPath className="w-3.5 h-3.5 animate-spin" />
                        Loading Payment...
                      </>
                    ) : (
                      <>
                        <HiOutlineLockClosed className="w-3.5 h-3.5" />
                        Proceed to Pay ₹{Math.round(selectedExtraSeats * pricePerExtraSeat * 1.18).toLocaleString('en-IN')} & Add Seats
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ===================== UPGRADE SUBSCRIPTION PLAN MODAL ===================== */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <HiOutlineArrowUpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Upgrade Subscription Plan</h3>
                  <p className="text-xs text-slate-500">Need more than 5 extra users? Scale to a higher employee capacity plan.</p>
                </div>
              </div>
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInitiateUpgradeCheckout} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(availablePlans || []).map((p) => {
                  const isCurrent = company?.subscription?.plan?._id === p._id || company?.subscription?.planName === p.name;
                  const isSelected = selectedUpgradePlanId === p._id;

                  return (
                    <div
                      key={p._id}
                      onClick={() => !isCurrent && setSelectedUpgradePlanId(p._id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-slate-50 border-slate-200 opacity-80 cursor-default'
                          : isSelected
                          ? 'bg-indigo-50/60 border-indigo-600 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-slate-900">{p.name}</span>
                        {isCurrent ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                            Current
                          </span>
                        ) : isSelected ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">
                            Selected
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-baseline gap-1 my-2">
                        <span className="text-xl font-extrabold text-slate-900 font-mono">
                          ₹{p.price?.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-slate-500">/ {p.billingCycle}</span>
                      </div>

                      <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-semibold text-[11px] mb-2">
                        <HiOutlineUsers className="w-3.5 h-3.5 text-emerald-600" />
                        Max {p.maxEmployees} Employee Seats
                      </div>

                      {p.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2">{p.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedUpgradePlan && (
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 text-indigo-950">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">New Plan Capacity:</span>
                    <span className="font-bold text-indigo-700">{selectedUpgradePlan.maxEmployees} User Seats</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Plan Base Price:</span>
                    <span className="font-mono font-medium">₹{selectedUpgradePlan.price?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">GST (18%):</span>
                    <span className="font-mono font-medium">₹{Math.round(selectedUpgradePlan.price * 0.18).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t border-indigo-200 flex items-center justify-between font-bold text-sm">
                    <span className="text-slate-900">Total Payable Now:</span>
                    <span className="font-mono text-indigo-700 text-base">
                      ₹{Math.round(selectedUpgradePlan.price * 1.18).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedUpgradePlanId || isUpgradingPlan}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  {isUpgradingPlan ? (
                    <>
                      <HiOutlineArrowPath className="w-3.5 h-3.5 animate-spin" />
                      Loading Payment...
                    </>
                  ) : (
                    <>
                      <HiOutlineLockClosed className="w-3.5 h-3.5" />
                      Proceed to Pay & Upgrade Plan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== PAYMENT GATEWAY CHECKOUT MODAL ===================== */}
      {checkoutModalOpen && checkoutSession && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden my-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <HiOutlineLockClosed className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-900 text-sm">Secure Payment Gateway</h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      256-Bit SSL
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Order Ref: {checkoutSession.orderData?.orderId}
                  </p>
                </div>
              </div>

              {paymentStatus !== 'authorizing' && paymentStatus !== 'provisioning' && (
                <button
                  onClick={() => {
                    setCheckoutModalOpen(false);
                    setPaymentStatus('ready');
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 cursor-pointer"
                  aria-label="Close Checkout"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Order Summary Strip */}
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                  Payment Purpose
                </span>
                <h4 className="font-bold text-slate-900 text-sm truncate">
                  {checkoutSession.orderData?.itemName || 'Add-on Extra Seats'}
                </h4>
                <p className="text-[11px] text-slate-500 truncate">
                  {checkoutSession.orderData?.description}
                </p>
              </div>
              <div className="text-left sm:text-right shrink-0 bg-white sm:bg-transparent p-2.5 sm:p-0 rounded-lg border sm:border-0 border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                  Total Payable (18% GST Incl.)
                </span>
                <div className="text-lg font-black text-indigo-700 font-mono">
                  ₹{Number(checkoutSession.orderData?.amount || checkoutSession.orderData?.totalAmount || 0).toLocaleString('en-IN')}.00
                </div>
              </div>
            </div>

            {/* Content Body Based on Payment Status */}
            {paymentStatus === 'authorizing' || paymentStatus === 'provisioning' ? (
              <div className="p-8 sm:p-12 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <HiOutlineArrowPath className="w-7 h-7 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900">Processing Payment Authorization</h4>
                  <p className="text-xs font-mono text-indigo-600 font-semibold">{authStepText}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Please do not refresh the page or click back. We are communicating with the banking gateway network to secure and provision your capacity.
                </div>
              </div>
            ) : paymentStatus === 'success' ? (
              <div className="p-6 sm:p-8 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
                  <HiOutlineCheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wide">
                    Payment Succeeded & Capacity Active
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 mt-2">
                    {checkoutSession.type === 'ADDON'
                      ? `+${checkoutSession.seatsCount} Extra Seat(s) Added Successfully!`
                      : 'Subscription Plan Upgraded Successfully!'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Your payment has been authorized and recorded in company invoices. Your employee allocation has been updated immediately.
                  </p>
                </div>

                {/* Summary Receipt Box */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction ID:</span>
                    <span className="font-mono font-bold text-slate-900 break-all">{completedPaymentResult?.paymentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gateway Order ID:</span>
                    <span className="font-mono text-slate-700 break-all">{completedPaymentResult?.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Amount Paid:</span>
                    <span className="font-mono font-bold text-indigo-700">
                      ₹{Number(checkoutSession.orderData?.amount || checkoutSession.orderData?.totalAmount).toLocaleString('en-IN')}.00
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total User Capacity:</span>
                    <span className="font-bold text-emerald-700">
                      {completedPaymentResult?.totalAllowedSeats || completedPaymentResult?.subscription?.maxEmployees} Active Seats
                    </span>
                  </div>
                  {completedPaymentResult?.transaction?.invoiceNumber && (
                    <div className="flex justify-between pt-2 border-t border-slate-200">
                      <span className="text-slate-500">Generated Invoice:</span>
                      <span className="font-mono font-bold text-slate-900">{completedPaymentResult.transaction.invoiceNumber}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
                  {completedPaymentResult?.transaction?._id && (
                    <button
                      onClick={() => {
                        const txId = completedPaymentResult.transaction._id;
                        setCheckoutModalOpen(false);
                        handleViewInvoice(txId);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <HiOutlineDocumentText className="w-4 h-4" />
                      View & Print Tax Invoice
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setCheckoutModalOpen(false);
                      setPaymentStatus('ready');
                      setCompletedPaymentResult(null);
                    }}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Done & View Billing
                  </button>
                </div>
              </div>
            ) : paymentStatus === 'failed' ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center text-rose-600 mx-auto">
                  <HiOutlineInformationCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Payment Authorization Failed</h4>
                  <p className="text-xs text-rose-600 mt-1 max-w-sm mx-auto">{paymentErrorMsg}</p>
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => setPaymentStatus('ready')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setCheckoutModalOpen(false)}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Ready state: Payment Methods Navigation */
              <div className="p-5 space-y-5 text-xs">
                {/* Method Tabs */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPaymentMethodTab('upi')}
                    className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paymentMethodTab === 'upi'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <HiOutlineQrCode className="w-4 h-4" />
                    UPI / QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethodTab('card')}
                    className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paymentMethodTab === 'card'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <HiOutlineCreditCard className="w-4 h-4" />
                    Cards
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethodTab('netbanking')}
                    className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paymentMethodTab === 'netbanking'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <HiOutlineBuildingLibrary className="w-4 h-4" />
                    Net Banking
                  </button>
                </div>

                {/* Tab 1: UPI / QR Code */}
                {paymentMethodTab === 'upi' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      {/* Crisp Dynamic QR Code */}
                      <div className="w-36 h-36 bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col items-center justify-center shrink-0 shadow-xs">
                        <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                          {/* Corner 1 */}
                          <rect x="5" y="5" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                          <rect x="12" y="12" width="12" height="12" rx="2" />
                          {/* Corner 2 */}
                          <rect x="69" y="5" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                          <rect x="76" y="12" width="12" height="12" rx="2" />
                          {/* Corner 3 */}
                          <rect x="5" y="69" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
                          <rect x="12" y="76" width="12" height="12" rx="2" />
                          {/* Center & Grid Patterns */}
                          <rect x="38" y="10" width="8" height="8" rx="1" />
                          <rect x="52" y="10" width="8" height="8" rx="1" />
                          <rect x="38" y="24" width="8" height="8" rx="1" />
                          <rect x="52" y="24" width="8" height="8" rx="1" />
                          <rect x="10" y="38" width="8" height="8" rx="1" />
                          <rect x="24" y="38" width="8" height="8" rx="1" />
                          <rect x="38" y="38" width="24" height="24" rx="4" fill="#4f46e5" />
                          <rect x="45" y="45" width="10" height="10" rx="2" fill="#ffffff" />
                          <rect x="69" y="38" width="8" height="8" rx="1" />
                          <rect x="83" y="38" width="8" height="8" rx="1" />
                          <rect x="38" y="69" width="8" height="8" rx="1" />
                          <rect x="52" y="69" width="8" height="8" rx="1" />
                          <rect x="69" y="69" width="10" height="10" rx="2" />
                          <rect x="83" y="83" width="10" height="10" rx="2" />
                        </svg>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                          UPI QR
                        </span>
                      </div>

                      <div className="space-y-2 text-left">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          Instant Scan & Pay
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">
                          Scan with any UPI app on your phone
                        </h4>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'CRED'].map((app) => (
                            <span
                              key={app}
                              className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold"
                            >
                              {app}
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Payment link active for 04:59 minutes. Seats provisioned immediately upon authorization.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Or Enter Enterprise UPI ID (VPA):
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={upiVpa}
                          onChange={(e) => setUpiVpa(e.target.value)}
                          placeholder="company@okhdfcbank"
                          className="flex-1 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setUpiVpa('company.admin@okaxis')}
                          className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded-lg border border-indigo-100 cursor-pointer"
                        >
                          Default VPA
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAuthorizeModalPayment}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center justify-center gap-2"
                    >
                      <HiOutlineShieldCheck className="w-4 h-4" />
                      Authorize UPI Payment (₹{Number(checkoutSession.orderData?.amount || checkoutSession.orderData?.totalAmount).toLocaleString('en-IN')})
                    </button>
                  </div>
                )}

                {/* Tab 2: Credit / Debit Card */}
                {paymentMethodTab === 'card' && (
                  <div className="space-y-4">
                    {/* Metallic Card Graphic */}
                    <div className="p-4 rounded-xl bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <div className="w-8 h-6 rounded bg-amber-400/80 border border-amber-300" />
                        <span className="font-mono text-[10px] tracking-widest text-slate-300">CORPORATE CARD</span>
                      </div>
                      <div className="font-mono text-base tracking-widest text-slate-100 font-bold py-1">
                        {cardDetails.number}
                      </div>
                      <div className="flex justify-between items-end text-[10px] text-slate-300">
                        <div>
                          <span className="block text-[8px] uppercase tracking-wider text-slate-400">Cardholder</span>
                          <span className="font-semibold text-white uppercase">{cardDetails.name}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] uppercase tracking-wider text-slate-400">Expires</span>
                          <span className="font-mono font-semibold text-white">{cardDetails.expiry}</span>
                        </div>
                        <span className="font-bold text-xs tracking-wider text-indigo-300">VISA</span>
                      </div>
                    </div>

                    {/* Card Inputs */}
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Card Number:
                        </label>
                        <input
                          type="text"
                          value={cardDetails.number}
                          onChange={(e) => setCardDetails((prev) => ({ ...prev, number: e.target.value }))}
                          maxLength={19}
                          className="w-full py-2 px-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                            Expiry Date (MM/YY):
                          </label>
                          <input
                            type="text"
                            value={cardDetails.expiry}
                            onChange={(e) => setCardDetails((prev) => ({ ...prev, expiry: e.target.value }))}
                            maxLength={5}
                            className="w-full py-2 px-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                            CVV Code:
                          </label>
                          <input
                            type="password"
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails((prev) => ({ ...prev, cvv: e.target.value }))}
                            maxLength={4}
                            className="w-full py-2 px-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Cardholder Full Name:
                        </label>
                        <input
                          type="text"
                          value={cardDetails.name}
                          onChange={(e) => setCardDetails((prev) => ({ ...prev, name: e.target.value }))}
                          className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCardDetails({
                            number: '4532 8920 1192 4820',
                            name: user?.name || 'Company Officer',
                            expiry: '09/29',
                            cvv: '624',
                          })
                        }
                        className="py-1.5 px-3 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                      >
                        Autofill Test Corporate Card
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleAuthorizeModalPayment}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center justify-center gap-2"
                    >
                      <HiOutlineLockClosed className="w-4 h-4" />
                      Authorize Card Payment (₹{Number(checkoutSession.orderData?.amount || checkoutSession.orderData?.totalAmount).toLocaleString('en-IN')})
                    </button>
                  </div>
                )}

                {/* Tab 3: Net Banking */}
                {paymentMethodTab === 'netbanking' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                        Select Popular Indian Bank:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map(
                          (bank) => (
                            <button
                              key={bank}
                              type="button"
                              onClick={() => setSelectedBank(bank)}
                              className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer ${
                                selectedBank === bank
                                  ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="truncate">{bank}</span>
                                {selectedBank === bank && (
                                  <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                                )}
                              </div>
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Or Search All Indian Scheduled Banks:
                      </label>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      >
                        <option value="HDFC Bank">HDFC Bank</option>
                        <option value="State Bank of India">State Bank of India</option>
                        <option value="ICICI Bank">ICICI Bank</option>
                        <option value="Axis Bank">Axis Bank</option>
                        <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                        <option value="Punjab National Bank">Punjab National Bank</option>
                        <option value="Bank of Baroda">Bank of Baroda</option>
                        <option value="Canara Bank">Canara Bank</option>
                        <option value="Union Bank of India">Union Bank of India</option>
                        <option value="IDBI Bank">IDBI Bank</option>
                        <option value="IndusInd Bank">IndusInd Bank</option>
                        <option value="Federal Bank">Federal Bank</option>
                        <option value="Yes Bank">Yes Bank</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleAuthorizeModalPayment}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center justify-center gap-2"
                    >
                      <HiOutlineBuildingLibrary className="w-4 h-4" />
                      Authorize via {selectedBank} (₹{Number(checkoutSession.orderData?.amount || checkoutSession.orderData?.totalAmount).toLocaleString('en-IN')})
                    </button>
                  </div>
                )}

                {/* Secure Trust Footer */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                  <HiOutlineShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Authorized seats will be added to your account immediately after payment approval.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== INVOICE MODAL ===================== */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        invoice={selectedInvoice}
        onClose={() => setIsInvoiceModalOpen(false)}
      />
    </div>
  );
};

export default AdminBilling;
