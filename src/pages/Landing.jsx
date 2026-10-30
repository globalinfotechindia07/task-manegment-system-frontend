import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import CompanyOnboardingModal from '../components/subscription/CompanyOnboardingModal';

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Modals for Legal Docs & Contact
  const [activeLegalModal, setActiveLegalModal] = useState(null); // 'terms', 'privacy'
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState(null);
  const [selectedPlanForOnboarding, setSelectedPlanForOnboarding] = useState(null);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  // Inquiry Form State
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

  // Fetch Public CMS Content
  const { data: siteData, isLoading: contentLoading } = useQuery({
    queryKey: ['publicSiteContent'],
    queryFn: async () => {
      const { data } = await api.get('/site-content/public');
      return data;
    }
  });

  // Fetch Public Subscription Plans
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['publicPlansList'],
    queryFn: async () => {
      const { data } = await api.get('/plans');
      return data;
    }
  });

  // Default Fallbacks
  const hero = siteData?.hero || {
    badge: 'Enterprise Multi-Branch Workspace',
    title: 'Modern Company & Employee',
    highlight: 'Management Ecosystem',
    subtitle: 'Consolidate geofenced attendance, dynamic salary breakups, real-time team collaboration, and multi-office tenant segregation into one secure cloud platform.',
    primaryCta: 'Explore Subscription Plans',
    secondaryCta: 'Access Portal'
  };

  const aboutUs = siteData?.aboutUs || {
    badge: 'About Global Infotech',
    title: 'Pioneering Future-Ready Cloud Operating Systems for Growing Enterprises',
    description: 'We build enterprise-grade software architectures engineered to eliminate administrative overhead, guarantee compliance, and unify multi-branch offices seamlessly.',
    mission: 'Deliver high-performance, intuitive, and secure management software tailored for scaling organizations.',
    vision: 'Empower modern businesses with a reliable multi-tenant operational backbone.',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    stats: [
      { label: 'Enterprises & Offices', value: '500+' },
      { label: 'Active Employees Managed', value: '25,000+' },
      { label: 'Salary Slips Disbursed', value: '₹120M+' },
      { label: 'Platform Uptime', value: '99.98%' }
    ]
  };

  const contactInfo = siteData?.contactInfo || {
    title: 'Let’s Discuss Your Enterprise Needs',
    description: 'Have questions about tenant onboarding, custom policies, or multi-branch deployments? Our technical consultants are ready to help.',
    email: 'contact@globalinfotech.com',
    phone: '+91 98765 43210',
    address: 'Global Infotech Towers, Powai IT Park, Mumbai, Maharashtra 400076',
    supportHours: 'Monday - Saturday: 9:00 AM - 7:00 PM IST'
  };

  const testimonials = siteData?.testimonials || [];
  const paymentGateway = siteData?.paymentGateway || { isEnabled: false, razorpayKeyId: '' };

  // Load Razorpay Checkout Script Dynamically
  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingInquiry(true);
    try {
      const { data } = await api.post('/site-content/inquiry', inquiryForm);
      toast.success(data.message || 'Inquiry submitted successfully!');
      setInquiryForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit inquiry');
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  // Onboarding Wizard Trigger
  const handleInitiatePayment = (plan) => {
    setSelectedPlanForOnboarding(plan);
    setIsOnboardingModalOpen(true);
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    const roleRoutes = {
      'Super Admin': '/super-admin/dashboard',
      'Admin': '/admin/dashboard',
      'CTO': '/admin/dashboard',
      'Team Head': '/team-lead/dashboard',
      'User': '/user/dashboard',
      'HR Manager': '/hr/dashboard',
    };
    return roleRoutes[user.role] || '/';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500/20 selection:text-indigo-900">
      {/* 1. TOP HEADER / NAVBAR */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors block">
                Global Infotech
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-600 block -mt-1">
                Enterprise Cloud Hub
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#plans" className="hover:text-indigo-600 transition-colors">Plans & Pricing</a>
            <a href="#about" className="hover:text-indigo-600 transition-colors">About Us</a>
            <a href="#reviews" className="hover:text-indigo-600 transition-colors">User Reviews</a>
            <a href="#contact" className="hover:text-indigo-600 transition-colors">Contact</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={getDashboardPath()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20"
              >
                Go to Dashboard
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                >
                  Sign In
                </Link>
                <a
                  href="#plans"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20"
                >
                  Get Started
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-20 lg:pb-32 bg-gradient-to-b from-white via-slate-50 to-indigo-50/40">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-indigo-200/30 via-violet-200/20 to-sky-200/30 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-8 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            {hero.badge}
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
            {hero.title}{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 bg-clip-text text-transparent">
              {hero.highlight}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {hero.subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-wrap justify-center items-center gap-4">
            <a
              href="#plans"
              className="px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 transform hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              {hero.primaryCta}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <Link
              to="/login"
              className="px-7 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-base border border-slate-200 shadow-sm transition-all"
            >
              {hero.secondaryCta}
            </Link>
          </div>

          {/* Trust Highlights */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-10 border-t border-slate-200/80">
            {aboutUs.stats?.map((st, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl lg:text-3xl font-extrabold text-slate-900">{st.value}</div>
                <div className="text-xs font-medium text-slate-500 mt-1">{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CORE FEATURES & MODULES */}
      <section id="features" className="py-20 lg:py-28 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Complete Operational Suite
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              Engineered for Complete Enterprise Productivity
            </h2>
            <p className="text-slate-600 text-base mt-3">
              One centralized platform replacing disjointed tools for attendance, task management, dynamic salary slips, and team video meetings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Geofenced Mobile Attendance</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Radius validation, camera verification, punch-in/out timestamps, and automatic late mark calculation for accurate presence tracking.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Automated Dynamic Payroll</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Configurable CTC annexures, PF & ESIC rules, professional tax deductions, and printable monthly salary slips generated in one click.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Task & Project Tracking</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Project scoping, team head assignments, paginated task tables, priority tags, and comprehensive daily progress reporting.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Real-Time Chat & Meetings</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Direct messaging, group collaboration rooms, media sharing, and instant HD video conferences with Jitsi Meet integration.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Multi-Office Tenant Isolation</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Each company operates as an isolated tenant. Separate employee quotas, dedicated admins, and zero data leakage across branches.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Automated Policy & Security</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                JWT token authentication, bcrypt password hashing, buffer-time rule engines, push notifications, and detailed performance audit logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SUBSCRIPTION PLANS SHOWCASE (DYNAMIC) */}
      <section id="plans" className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100/70 px-3 py-1 rounded-full border border-indigo-200">
              Transparent Pricing
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              Subscription Plans Built for Every Scale
            </h2>
            <p className="text-slate-600 text-base mt-3">
              Choose the right capacity for your office. All plans include full tenant segregation and standard encryption.
            </p>
          </div>

          {plansLoading ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
              {plans?.map((plan) => {
                const isPro = plan.name.toLowerCase().includes('pro');
                return (
                  <div
                    key={plan._id}
                    className={`rounded-3xl p-8 transition-all flex flex-col justify-between relative bg-white ${
                      isPro
                        ? 'border-2 border-indigo-600 shadow-2xl shadow-indigo-600/10 scale-105 z-10'
                        : 'border border-slate-200 shadow-lg shadow-slate-200/50 hover:shadow-xl'
                    }`}
                  >
                    {isPro && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[11px] font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        Most Popular Choice
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                          {plan.billingCycle || 'Monthly'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 min-h-[32px]">{plan.description || 'Full enterprise office management suite.'}</p>

                      {/* Price */}
                      <div className="mt-6 mb-6 pb-6 border-b border-slate-100 flex items-baseline gap-1.5">
                        <span className="text-4xl font-extrabold text-slate-900">₹{plan.price?.toLocaleString('en-IN')}</span>
                        <span className="text-xs text-slate-500 font-medium">/ {plan.billingCycle?.toLowerCase() || 'month'}</span>
                      </div>

                      {/* Quota Highlights */}
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50 text-slate-700 font-medium border border-slate-100">
                          <span>Employee Quota</span>
                          <span className="font-bold text-indigo-700">Up to {plan.maxEmployees} Seats</span>
                        </div>
                        <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50 text-slate-700 font-medium border border-slate-100">
                          <span>Validity Period</span>
                          <span className="font-bold text-indigo-700">{plan.durationDays || 30} Days</span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Included Features</p>
                        <ul className="space-y-2.5">
                          {plan.features?.map((feat, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                              <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <button
                        onClick={() => handleInitiatePayment(plan)}
                        className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all shadow-md ${
                          isPro
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {paymentGateway.isEnabled ? 'Subscribe with Razorpay' : 'Choose This Plan'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 5. ABOUT US SECTION (DYNAMIC) */}
      <section id="about" className="py-20 lg:py-28 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                {aboutUs.badge}
              </span>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
                {aboutUs.title}
              </h2>
              <p className="mt-5 text-base text-slate-600 leading-relaxed">
                {aboutUs.description}
              </p>

              <div className="mt-8 space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    Our Mission
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{aboutUs.mission}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-600"></span>
                    Our Vision
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{aboutUs.vision}</p>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-indigo-900/10 border-4 border-white">
                <img
                  src={aboutUs.imageUrl}
                  alt="Team collaboration"
                  className="w-full h-[420px] object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-5 rounded-2xl shadow-xl border border-slate-100 hidden sm:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Multi-Tenant Verified</p>
                    <p className="text-xs text-slate-500">100% Cryptographic Segregation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. USER REVIEWS / TESTIMONIALS (DYNAMIC) */}
      <section id="reviews" className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100/70 px-3 py-1 rounded-full border border-indigo-200">
              Trusted by Industry Leaders
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              What Business Owners Say About Us
            </h2>
            <p className="text-slate-600 text-base mt-3">
              Real testimonials from corporate managers, directors, and HR heads using Global Infotech every day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials?.map((t, idx) => (
              <div key={idx} className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-md shadow-slate-200/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-4 text-sm">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed italic mb-6">
                    "{t.review}"
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-indigo-100"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{t.name}</h4>
                    <p className="text-xs text-slate-500">{t.designation}, <span className="text-indigo-600 font-medium">{t.company}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CONTACT US & INQUIRY SECTION (DYNAMIC) */}
      <section id="contact" className="py-20 lg:py-28 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Details */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Get In Touch
              </span>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
                {contactInfo.title}
              </h2>
              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                {contactInfo.description}
              </p>

              <div className="mt-8 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Email Us Directly</p>
                    <a href={`mailto:${contactInfo.email}`} className="text-sm font-bold text-slate-900 hover:text-indigo-600">
                      {contactInfo.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Call Support Hotline</p>
                    <a href={`tel:${contactInfo.phone}`} className="text-sm font-bold text-slate-900 hover:text-indigo-600">
                      {contactInfo.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Corporate Headquarters</p>
                    <p className="text-sm font-medium text-slate-900">{contactInfo.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Working Hours</p>
                    <p className="text-sm font-medium text-slate-900">{contactInfo.supportHours}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Inquiry Form */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-md">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Send Us a Direct Message</h3>
              <p className="text-xs text-slate-500 mb-6">Our enterprise onboarding specialist will respond within 24 hours.</p>

              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={inquiryForm.name}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                      placeholder="e.g. Ramesh Patel"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Official Email *</label>
                    <input
                      type="email"
                      required
                      value={inquiryForm.email}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                      placeholder="ramesh@company.com"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={inquiryForm.phone}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                      placeholder="+91 98765 00000"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={inquiryForm.subject}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, subject: e.target.value })}
                      placeholder="e.g. Plan inquiry for 100 employees"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Your Message *</label>
                  <textarea
                    rows={4}
                    required
                    value={inquiryForm.message}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                    placeholder="Tell us about your organization requirements, current challenges, and questions..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingInquiry}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isSubmittingInquiry ? 'Sending Inquiry...' : 'Submit Enterprise Inquiry'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
            {/* Col 1: Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                  GI
                </div>
                <span className="font-bold text-lg text-white">Global Infotech SaaS</span>
              </div>
              <p className="text-xs text-slate-400 mt-3 max-w-sm leading-relaxed">
                Empowering businesses with intelligent workforce analytics, geofenced mobile attendance, dynamic payroll breakdown, and secure multi-branch tenant infrastructure.
              </p>
            </div>

            {/* Col 2: Navigation */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Quick Navigation</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#features" className="hover:text-white transition-colors">Platform Features</a></li>
                <li><a href="#plans" className="hover:text-white transition-colors">Subscription Plans</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#reviews" className="hover:text-white transition-colors">Customer Reviews</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact Support</a></li>
              </ul>
            </div>

            {/* Col 3: Legal & Portal */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Legal & Compliance</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button onClick={() => setActiveLegalModal('terms')} className="hover:text-white transition-colors text-left cursor-pointer">
                    Terms & Conditions
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveLegalModal('privacy')} className="hover:text-white transition-colors text-left cursor-pointer">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveLegalModal('payment')} className="hover:text-white transition-colors text-left cursor-pointer">
                    Payment Policy & Billing
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveLegalModal('refund')} className="hover:text-white transition-colors text-left cursor-pointer">
                    Refund & Cancellation
                  </button>
                </li>
                <li className="pt-2 border-t border-slate-800">
                  <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                    Employee / Admin Login →
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} Global Infotech India Pvt. Ltd. All rights reserved.</p>
            <p>Designed with enterprise-grade multi-tenant architecture.</p>
          </div>
        </div>
      </footer>

      {/* 9. MODAL: LEGAL & POLICIES DRAWER */}
      {activeLegalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 my-8 border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-xl font-extrabold text-slate-900">
                {activeLegalModal === 'terms' && 'Terms & Conditions'}
                {activeLegalModal === 'privacy' && 'Privacy Policy'}
                {activeLegalModal === 'payment' && 'Payment Policy & Billing Terms'}
                {activeLegalModal === 'refund' && 'Refund & Cancellation Policy'}
              </h3>
              <button
                onClick={() => setActiveLegalModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="py-6 overflow-y-auto flex-1 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
              {activeLegalModal === 'terms' && renderFormattedPolicy(siteData?.termsAndConditions?.content)}
              {activeLegalModal === 'privacy' && renderFormattedPolicy(siteData?.privacyPolicy?.content)}
              {activeLegalModal === 'payment' && renderFormattedPolicy(siteData?.paymentPolicy?.content)}
              {activeLegalModal === 'refund' && renderFormattedPolicy(siteData?.refundPolicy?.content)}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveLegalModal(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. MODAL: PLAN PURCHASE CONTACT FALLBACK */}
      {selectedPlanForCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
              ₹
            </div>
            <h3 className="text-lg font-bold text-slate-900">Subscribe to {selectedPlanForCheckout.name}</h3>
            <p className="text-xs text-slate-600 mt-2">
              Price: <span className="font-bold text-indigo-600 text-base">₹{selectedPlanForCheckout.price?.toLocaleString('en-IN')}</span> / {selectedPlanForCheckout.billingCycle || 'month'}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Capacity: Up to {selectedPlanForCheckout.maxEmployees} employees provisioned.
            </p>

            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-2">
              <p>To finalize your office account creation or payment:</p>
              <p className="font-medium text-slate-800">• Contact our onboarding desk at <a href={`mailto:${contactInfo.email}`} className="text-indigo-600 underline">{contactInfo.email}</a></p>
              <p className="font-medium text-slate-800">• Or call <a href={`tel:${contactInfo.phone}`} className="text-indigo-600 underline">{contactInfo.phone}</a></p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSelectedPlanForCheckout(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200"
              >
                Close
              </button>
              <Link
                to="/login"
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 text-center"
              >
                Sign In to Portal
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 11. STEP-BY-STEP COMPANY ONBOARDING & RAZORPAY WIZARD */}
      <CompanyOnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => {
          setIsOnboardingModalOpen(false);
          setSelectedPlanForOnboarding(null);
        }}
        selectedPlan={selectedPlanForOnboarding}
        paymentGateway={paymentGateway}
      />
    </div>
  );
};

// Helper to format inline markdown like **bold**
const formatInlineMarkdown = (text) => {
  if (!text) return text;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

// Helper to render markdown into clean structured HTML preview
const renderFormattedPolicy = (content) => {
  if (!content || !content.trim()) {
    return <p className="text-slate-400 italic">No policy content specified yet.</p>;
  }

  const blocks = content.split(/\n\n+/);

  return (
    <div className="space-y-4">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-sm sm:text-base font-bold text-slate-900 mt-4 pb-1 border-b border-slate-200">
              {trimmed.replace(/^###\s+/, '')}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-base sm:text-lg font-extrabold text-indigo-600 mt-5 pb-1 border-b border-indigo-100">
              {trimmed.replace(/^##\s+/, '')}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-lg sm:text-xl font-black text-slate-900 mt-6 pb-2 border-b border-slate-200">
              {trimmed.replace(/^#\s+/, '')}
            </h2>
          );
        }

        if (trimmed.includes('\n- ') || trimmed.startsWith('- ') || trimmed.includes('\n* ') || trimmed.startsWith('* ')) {
          const lines = trimmed.split('\n');
          return (
            <ul key={idx} className="list-disc list-inside space-y-1.5 text-slate-700 pl-1">
              {lines.map((line, lIdx) => {
                const bulletText = line.replace(/^[-*]\s+/, '').trim();
                if (!bulletText) return null;
                return <li key={lIdx}>{formatInlineMarkdown(bulletText)}</li>;
              })}
            </ul>
          );
        }

        return (
          <p key={idx} className="text-slate-700 leading-relaxed text-xs sm:text-sm">
            {formatInlineMarkdown(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

export default Landing;
