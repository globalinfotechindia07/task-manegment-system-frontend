import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const CompanyOnboardingModal = ({ isOpen, onClose, selectedPlan, paymentGateway }) => {
  const navigate = useNavigate();
  const { setAuthSession } = useAuth();

  // Wizard Step: 1 = Company Details, 2 = Admin Setup, 3 = Plan Review & Payment, 4 = Success
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [onboardedResult, setOnboardedResult] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Company / Office Details
    companyName: '',
    location: '',
    address: '',
    registrationNumber: '',
    gstNumber: '',
    employeeSize: '1-15',
    industry: 'Information Technology',
    phone: '',
    contactEmail: '',

    // Step 2: Admin Account Credentials
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    adminDesignation: 'Company Administrator',
    adminPhone: ''
  });

  if (!isOpen || !selectedPlan) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Step 1 Validation
  const handleNextToAdminSetup = (e) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      return toast.error('Please enter the Company / Office name');
    }
    if (!formData.location.trim()) {
      return toast.error('Please enter the City / Location');
    }
    if (!formData.phone.trim()) {
      return toast.error('Please enter the official phone number');
    }
    setStep(2);
  };

  // Step 2 Validation
  const handleNextToPayment = (e) => {
    e.preventDefault();
    if (!formData.adminName.trim()) {
      return toast.error('Please enter the Administrator Full Name');
    }
    if (!formData.adminEmail.trim()) {
      return toast.error('Please enter the Administrator Email');
    }
    if (!formData.adminPassword || formData.adminPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    if (formData.adminPassword !== formData.confirmPassword) {
      return toast.error('Password and Confirm Password do not match');
    }
    setStep(3);
  };

  // Complete Onboarding API Call
  const executeOnboarding = async (paymentPayload = {}) => {
    setIsSubmitting(true);
    try {
      const payload = {
        companyName: formData.companyName,
        location: formData.location,
        address: formData.address,
        registrationNumber: formData.registrationNumber,
        gstNumber: formData.gstNumber,
        employeeSize: formData.employeeSize,
        industry: formData.industry,
        phone: formData.phone,
        contactEmail: formData.contactEmail || formData.adminEmail,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        adminDesignation: formData.adminDesignation,
        planId: selectedPlan._id,
        ...paymentPayload
      };

      const { data } = await api.post('/companies/public-onboard', payload);
      
      // Store user session for immediate login
      if (data.user && data.token) {
        setAuthSession({ ...data.user, token: data.token });
      }

      setOnboardedResult(data);
      setStep(4);
      toast.success(data.message || 'Workspace onboarded successfully!');
    } catch (err) {
      console.error('Onboarding failed:', err);
      toast.error(err.response?.data?.message || 'Failed to complete company onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to dynamically load Razorpay Checkout Script
  const loadRazorpaySDK = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        return resolve(true);
      }
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

  // Initiate Razorpay Checkout or Direct Onboarding
  const handleProceedToPayment = async () => {
    // 1. If Gateway is disabled in Super Admin, allow sandbox direct activation
    if (!paymentGateway?.isEnabled) {
      await executeOnboarding({
        razorpayPaymentId: `sandbox_pay_${Date.now()}`,
        razorpayOrderId: `sandbox_ord_${Date.now()}`
      });
      return;
    }

    // 2. Ensure Razorpay SDK script is loaded
    setIsSubmitting(true);
    const isSdkLoaded = await loadRazorpaySDK();
    if (!isSdkLoaded) {
      setIsSubmitting(false);
      toast.error('Could not connect to Razorpay SDK. Please check your internet connection.');
      return;
    }

    try {
      // 3. Create server-side Razorpay order
      const { data: orderData } = await api.post('/site-content/create-order', {
        planId: selectedPlan._id
      });

      const keyId = orderData.keyId || paymentGateway.razorpayKeyId;

      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: formData.companyName || 'Global Infotech SaaS',
        description: `Subscription: ${selectedPlan.name}`,
        order_id: orderData.orderId,
        prefill: {
          name: formData.adminName,
          email: formData.adminEmail,
          contact: formData.phone
        },
        theme: {
          color: '#4f46e5'
        },
        handler: async function (response) {
          toast.success('Payment authorized via Razorpay! Provisioning workspace...');
          await executeOnboarding({
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature
          });
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
            toast('Payment process was cancelled by user.', { icon: 'ℹ️' });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setIsSubmitting(false);
        toast.error(`Payment failed: ${response.error?.description || 'Transaction declined'}`);
      });
      
      rzp.open();
      setIsSubmitting(false);
    } catch (err) {
      console.error('Razorpay initialization error:', err);
      setIsSubmitting(false);
      const serverErrMsg = err.response?.data?.message || err.message;
      toast.error(`Gateway Error: ${serverErrMsg}`);

      // Fallback option only if the user explicitly requests it
      if (window.confirm(`Payment Gateway Error: ${serverErrMsg}\n\nWould you like to activate this company in sandbox/trial mode instead?`)) {
        await executeOnboarding({
          razorpayPaymentId: `fallback_pay_${Date.now()}`
        });
      }
    }
  };

  // Calculate pricing breakdown
  const basePrice = Number(selectedPlan.price) || 0;
  const gstAmount = Math.round(basePrice * 0.18);
  const totalAmount = basePrice + gstAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-8 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header with Step Progress */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 sm:px-8 py-5 text-white flex items-center justify-between border-b border-indigo-900/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                New Enterprise Subscription
              </span>
              <span className="text-xs text-indigo-200/80 font-medium">
                Plan: <strong className="text-white">{selectedPlan.name}</strong>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-1">
              {step === 1 && 'Step 1: Company & Business Information'}
              {step === 2 && 'Step 2: Setup Admin Account & Login'}
              {step === 3 && 'Step 3: Review Plan & Razorpay Checkout'}
              {step === 4 && 'Onboarding Completed! 🎉'}
            </h2>
          </div>

          {step !== 4 && (
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Wizard Steps Indicator */}
        {step !== 4 && (
          <div className="bg-slate-50 border-b border-slate-200 px-6 sm:px-8 py-3">
            <div className="flex items-center justify-between text-xs">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  1
                </span>
                <span>Company Details</span>
              </div>
              <div className="h-0.5 w-8 sm:w-16 bg-slate-200">
                <div className={`h-full bg-indigo-600 transition-all duration-300 ${step >= 2 ? 'w-full' : 'w-0'}`} />
              </div>
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  2
                </span>
                <span>Admin Credentials</span>
              </div>
              <div className="h-0.5 w-8 sm:w-16 bg-slate-200">
                <div className={`h-full bg-indigo-600 transition-all duration-300 ${step >= 3 ? 'w-full' : 'w-0'}`} />
              </div>
              <div className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  3
                </span>
                <span>Payment & Launch</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">

          {/* STEP 1: COMPANY / OFFICE DETAILS */}
          {step === 1 && (
            <form onSubmit={handleNextToAdminSetup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Company / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="e.g. Apex Infotech Solutions Pvt Ltd"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    City / Branch Location *
                  </label>
                  <input
                    type="text"
                    required
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Mumbai, Bangalore, Pune"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Estimated Employee Size *
                  </label>
                  <select
                    name="employeeSize"
                    value={formData.employeeSize}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  >
                    <option value="1-15">1 to 15 Employees</option>
                    <option value="16-50">16 to 50 Employees</option>
                    <option value="51-250">51 to 250 Employees</option>
                    <option value="250+">250+ Enterprise Scale</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Complete Office Address
                </label>
                <textarea
                  rows={2}
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. Unit 402, High Street IT Park, Powai, Mumbai - 400076"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Company Registration / CIN No.
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    placeholder="e.g. U72200MH2021PTC123456"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    GST Number (Optional)
                  </label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    placeholder="e.g. 27ABCDE1234F1Z5"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Official Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Official Billing Email
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="e.g. billing@apextech.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  Next: Setup Admin Account →
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: ADMIN CREDENTIALS SETUP */}
          {step === 2 && (
            <form onSubmit={handleNextToPayment} className="space-y-4">
              <div className="bg-indigo-50/80 border border-indigo-200/60 p-4 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold text-sm">
                  👑
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-950">Master Administrator Account</h4>
                  <p className="text-[11px] text-indigo-700 mt-0.5 leading-relaxed">
                    This account will hold primary managerial control for <strong>{formData.companyName}</strong>. 
                    You will use these credentials to sign in, approve employee attendance, and process payroll.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Admin Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    name="adminName"
                    value={formData.adminName}
                    onChange={handleChange}
                    placeholder="e.g. Vikram Malhotra"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    name="adminDesignation"
                    value={formData.adminDesignation}
                    onChange={handleChange}
                    placeholder="e.g. Director, Managing Partner, HR Head"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin Login Email (Username) *
                </label>
                <input
                  type="email"
                  required
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  placeholder="e.g. admin@apextech.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm font-medium"
                />
                <p className="text-[11px] text-slate-500 mt-1">This email will be used as the Login ID on the portal.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Create Admin Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      name="adminPassword"
                      value={formData.adminPassword}
                      onChange={handleChange}
                      placeholder="Minimum 6 characters"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-medium"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm Admin Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-medium"
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  ← Back to Company Info
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  Next: Review Plan & Payment →
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: PLAN REVIEW & RAZORPAY PAYMENT */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Plan Summary Card */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl border border-indigo-900/50 shadow-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Selected Plan</span>
                    <h3 className="text-xl font-black text-white">{selectedPlan.name}</h3>
                    <p className="text-xs text-slate-300 mt-0.5">{selectedPlan.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white">₹{basePrice.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-slate-300 block">/ {selectedPlan.billingCycle || 'month'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Employee Seat Quota:</span>
                    <span className="font-bold text-white">Up to {selectedPlan.maxEmployees} Employees</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Validity Duration:</span>
                    <span className="font-bold text-white">{selectedPlan.durationDays || (selectedPlan.billingCycle === 'yearly' ? 365 : 30)} Days</span>
                  </div>
                </div>
              </div>

              {/* Price Calculation & Tax Invoice Table */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Plan Subscription Fee</span>
                  <span className="font-medium text-slate-900 font-mono">₹{basePrice.toLocaleString('en-IN')}.00</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Applicable GST (18%)</span>
                  <span className="font-medium text-slate-900 font-mono">₹{gstAmount.toLocaleString('en-IN')}.00</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                  <span>Total Payable Amount</span>
                  <span className="text-indigo-600 font-mono text-base font-extrabold">₹{totalAmount.toLocaleString('en-IN')}.00</span>
                </div>
              </div>

              {/* Summary of Onboarding Account */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white text-xs space-y-1.5">
                <h4 className="font-bold text-slate-900 mb-2">Registration Account Preview:</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div><strong className="text-slate-800">Company:</strong> {formData.companyName}</div>
                  <div><strong className="text-slate-800">Location:</strong> {formData.location}</div>
                  <div><strong className="text-slate-800">Admin:</strong> {formData.adminName}</div>
                  <div><strong className="text-slate-800">Login Email:</strong> {formData.adminEmail}</div>
                  {formData.gstNumber && <div><strong className="text-slate-800">GSTIN:</strong> {formData.gstNumber}</div>}
                  {formData.registrationNumber && <div><strong className="text-slate-800">Reg No:</strong> {formData.registrationNumber}</div>}
                </div>
              </div>

              {/* Payment Gateway Status Badge */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Payment Gateway: <strong>Razorpay Encrypted Online Checkout</strong></span>
                </div>
                <span className="text-[11px] text-slate-500">Cards • UPI • NetBanking</span>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  ← Back to Admin Setup
                </button>
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={isSubmitting}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      Provisioning Workspace & Payment...
                    </>
                  ) : (
                    <>
                      <span>Pay ₹{totalAmount.toLocaleString('en-IN')} with Razorpay</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS & INSTANT ONBOARDING LAUNCH */}
          {step === 4 && onboardedResult && (
            <div className="text-center py-4 space-y-6 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-3xl shadow-inner">
                ✓
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Congratulations! Workspace Activated
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto">
                  <strong>{onboardedResult.company?.name}</strong> has been onboarded with a provisioned multi-tenant environment.
                </p>
              </div>

              {/* Account Details Card */}
              <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left text-xs space-y-2.5 shadow-sm">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Company Unique Code:</span>
                  <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {onboardedResult.company?.companyCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Admin Login Email:</span>
                  <span className="font-bold text-slate-900">{onboardedResult.user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Subscription Plan:</span>
                  <span className="font-semibold text-emerald-600">
                    {onboardedResult.company?.subscription?.planName} (Active)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Allowed Employee Seats:</span>
                  <span className="font-semibold text-slate-800">
                    Up to {onboardedResult.company?.subscription?.maxEmployees} Employees
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <button
                  onClick={() => {
                    onClose();
                    navigate('/admin/dashboard');
                  }}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Launch Admin Dashboard Now →</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    navigate('/login');
                  }}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Go to Login Screen
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CompanyOnboardingModal;
