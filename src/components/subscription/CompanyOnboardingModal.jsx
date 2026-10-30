import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { 
  HiOutlineXMark, 
  HiOutlineShieldCheck, 
  HiOutlineCheckCircle, 
  HiOutlineArrowRight, 
  HiOutlineArrowLeft 
} from 'react-icons/hi2';

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
            toast('Payment process was cancelled by user.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 my-8 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header with Step Progress */}
        <div className="bg-white px-6 sm:px-8 py-5 text-slate-900 flex items-center justify-between border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                New Enterprise Subscription
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Plan: <strong className="text-slate-900">{selectedPlan.name}</strong>
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 mt-1.5">
              {step === 1 && 'Step 1: Company & Business Information'}
              {step === 2 && 'Step 2: Setup Admin Account & Login'}
              {step === 3 && 'Step 3: Review Plan & Razorpay Checkout'}
              {step === 4 && 'Onboarding Completed Successfully'}
            </h2>
          </div>

          {step !== 4 && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Wizard Steps Indicator */}
        {step !== 4 && (
          <div className="bg-slate-50 border-b border-slate-200 px-6 sm:px-8 py-3">
            <div className="flex items-center justify-between text-xs">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  1
                </span>
                <span>Company Details</span>
              </div>
              <div className="h-0.5 w-8 sm:w-16 bg-slate-200">
                <div className={`h-full bg-indigo-600 transition-all duration-300 ${step >= 2 ? 'w-full' : 'w-0'}`} />
              </div>
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  2
                </span>
                <span>Admin Credentials</span>
              </div>
              <div className="h-0.5 w-8 sm:w-16 bg-slate-200">
                <div className={`h-full bg-indigo-600 transition-all duration-300 ${step >= 3 ? 'w-full' : 'w-0'}`} />
              </div>
              <div className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
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
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Company / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="e.g. Apex Infotech Solutions Pvt Ltd"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    City / Branch Location *
                  </label>
                  <input
                    type="text"
                    required
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Mumbai, Bangalore, Pune"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Estimated Employee Size *
                  </label>
                  <select
                    name="employeeSize"
                    value={formData.employeeSize}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                  >
                    <option value="1-15">1 to 15 Employees</option>
                    <option value="16-50">16 to 50 Employees</option>
                    <option value="51-250">51 to 250 Employees</option>
                    <option value="250+">250+ Enterprise Scale</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Complete Office Address
                </label>
                <textarea
                  rows={2}
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. Unit 402, High Street IT Park, Powai, Mumbai - 400076"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Company Registration / CIN No.
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    placeholder="e.g. U72200MH2021PTC123456"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    GST Number (Optional)
                  </label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    placeholder="e.g. 27ABCDE1234F1Z5"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Official Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Official Billing Email
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="e.g. billing@apextech.com"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Next: Setup Admin Account</span>
                  <HiOutlineArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: ADMIN CREDENTIALS SETUP */}
          {step === 2 && (
            <form onSubmit={handleNextToPayment} className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                  <HiOutlineShieldCheck className="w-5 h-5" />
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
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Admin Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    name="adminName"
                    value={formData.adminName}
                    onChange={handleChange}
                    placeholder="e.g. Vikram Malhotra"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    name="adminDesignation"
                    value={formData.adminDesignation}
                    onChange={handleChange}
                    placeholder="e.g. Director, Managing Partner, HR Head"
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin Login Email (Username) *
                </label>
                <input
                  type="email"
                  required
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  placeholder="e.g. admin@apextech.com"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs font-medium"
                />
                <p className="text-[11px] text-slate-500 mt-1">This email will be used as the Login ID on the portal.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
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
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <HiOutlineArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Company Info</span>
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Next: Review Plan & Payment</span>
                  <HiOutlineArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: PLAN REVIEW & RAZORPAY PAYMENT */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Plan Summary Card */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">Selected Plan</span>
                    <h3 className="text-lg font-bold text-slate-900 mt-2">{selectedPlan.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedPlan.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900">₹{basePrice.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-slate-500 block">/ {selectedPlan.billingCycle || 'month'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Employee Seat Quota:</span>
                    <span className="font-bold text-slate-900">Up to {selectedPlan.maxEmployees} Employees</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Validity Duration:</span>
                    <span className="font-bold text-slate-900">{selectedPlan.durationDays || (selectedPlan.billingCycle === 'yearly' ? 365 : 30)} Days</span>
                  </div>
                </div>
              </div>

              {/* Price Calculation & Tax Invoice Table */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
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
              <div className="border border-slate-200 rounded-xl p-4 bg-white text-xs space-y-1.5">
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
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
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
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <HiOutlineArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Admin Setup</span>
                </button>
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs disabled:opacity-50 cursor-pointer inline-flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Provisioning Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>Pay ₹{totalAmount.toLocaleString('en-IN')} with Razorpay</span>
                      <HiOutlineArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS & INSTANT ONBOARDING LAUNCH */}
          {step === 4 && onboardedResult && (
            <div className="text-center py-4 space-y-6 animate-in fade-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 mx-auto flex items-center justify-center shadow-xs">
                <HiOutlineCheckCircle className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  Congratulations! Workspace Activated
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  <strong>{onboardedResult.company?.name}</strong> has been onboarded with a provisioned multi-tenant environment.
                </p>
              </div>

              {/* Account Details Card */}
              <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-xl p-5 text-left text-xs space-y-2.5 shadow-xs">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Company Unique Code:</span>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {onboardedResult.company?.companyCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Admin Login Email:</span>
                  <span className="font-bold text-slate-900">{onboardedResult.user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Subscription Plan:</span>
                  <span className="font-semibold text-emerald-700">
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
                  className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <span>Launch Admin Dashboard Now</span>
                  <HiOutlineArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    onClose();
                    navigate('/login');
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
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
