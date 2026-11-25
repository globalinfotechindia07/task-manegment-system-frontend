import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth, getRoleDashboard } from '../context/AuthContext';
import CompanyOnboardingModal from '../components/subscription/CompanyOnboardingModal';
import ModuleShowcase from '../components/landing/ModuleShowcase';
import RoleWorkflows from '../components/landing/RoleWorkflows';
import HowItWorks from '../components/landing/HowItWorks';
import ScrollingFeatureTicker from '../components/landing/ScrollingFeatureTicker';
import DemoCredentialsSection from '../components/landing/DemoCredentialsSection';
import { 
  HiOutlineCheck, 
  HiStar, 
  HiOutlineBars3, 
  HiOutlineXMark, 
  HiOutlineArrowRightOnRectangle,
  HiOutlineSquares2X2,
  HiOutlineArrowRight,
  HiOutlineChevronDown,
  HiOutlineQuestionMarkCircle,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';

const DEFAULT_FAQS = [
  {
    _id: 'default-1',
    question: 'How does geofenced mobile attendance work?',
    answer: 'Employees punch in and out using their mobile browser or app. The system securely verifies their GPS coordinates against the pre-configured geofence perimeter and radius of your office branches, preventing off-site punch-ins.',
    category: 'Attendance',
    order: 1,
    isPublished: true,
  },
  {
    _id: 'default-2',
    question: 'Can we manage multiple branches and company entities under one account?',
    answer: 'Yes! Our multi-tenant architecture enables you to configure multiple branches, departments, and shifts under one organization. Admins can view aggregated analytics or branch-specific reports with granular role-based permissions.',
    category: 'Branches & Roles',
    order: 2,
    isPublished: true,
  },
  {
    _id: 'default-3',
    question: 'How is payroll calculated and are Indian statutory compliances supported?',
    answer: 'Payroll dynamically calculates gross salary, working days, overtime, paid leaves, and statutory deductions including Provident Fund (EPF), ESI, and Professional Tax. Computerized salary slips are generated automatically for employees to download.',
    category: 'Payroll',
    order: 3,
    isPublished: true,
  },
  {
    _id: 'default-4',
    question: 'Can we upgrade our subscription plan or add more employee quotas later?',
    answer: 'Absolutely. You can easily upgrade your tier or expand employee user limits directly from your billing settings at any time. Unutilized days on your current billing period are credited on a pro-rata basis.',
    category: 'Billing',
    order: 4,
    isPublished: true,
  },
  {
    _id: 'default-5',
    question: 'Is organizational data encrypted and isolated securely?',
    answer: 'Yes. Enterprise data is cryptographically isolated per organization with AES-256 encryption at rest and strict SSL/TLS in transit. Role-based access control (RBAC) ensures only authorized officers access sensitive workforce and salary records.',
    category: 'Security',
    order: 5,
    isPublished: true,
  },
];

/* ============================================================
   DESIGN TOKENS (consistent with all pages)
   ============================================================ */
const tokens = {
  btnPrimary:
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ' +
    'hover:bg-indigo-700 active:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ' +
    'transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  btnSecondary:
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl bg-white text-slate-800 border border-slate-200 shadow-sm ' +
    'hover:bg-slate-50 active:bg-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  input:
    'w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 ' +
    'placeholder:text-slate-400 transition-colors ' +
    'focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20',
  label:
    'block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5',
};

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeLegalModal, setActiveLegalModal] = useState(null);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState(null);
  const [selectedPlanForOnboarding, setSelectedPlanForOnboarding] = useState(null);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [billingInterval, setBillingInterval] = useState('monthly');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedFaqId, setExpandedFaqId] = useState(null);
  const [activeFaqCategory, setActiveFaqCategory] = useState('All');

  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

  const { data: siteData } = useQuery({
    queryKey: ['publicSiteContent'],
    queryFn: async () => {
      const { data } = await api.get('/site-content/public');
      return data;
    },
  });

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['publicPlansList'],
    queryFn: async () => {
      const { data } = await api.get('/plans');
      return data;
    },
  });

  const hero = siteData?.hero || {
    badge: 'Enterprise Multi-Branch Workspace',
    title: 'Modern Company & Employee',
    highlight: 'Management Ecosystem',
    subtitle:
      'Consolidate geofenced attendance, dynamic salary breakups, real-time team collaboration, and multi-office tenant segregation into one secure cloud platform.',
    primaryCta: 'Explore Subscription Plans',
    secondaryCta: 'Access Portal',
  };

  const aboutUs = siteData?.aboutUs || {
    badge: 'About Global Infotech',
    title: 'Pioneering Future-Ready Cloud Operating Systems for Growing Enterprises',
    description:
      'We build enterprise-grade software architectures engineered to eliminate administrative overhead, guarantee compliance, and unify multi-branch offices seamlessly.',
    mission:
      'Deliver high-performance, intuitive, and secure management software tailored for scaling organizations.',
    vision:
      'Empower modern businesses with a reliable multi-tenant operational backbone.',
    imageUrl:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    stats: [
      { label: 'Enterprises & Offices', value: '500+' },
      { label: 'Active Employees Managed', value: '25,000+' },
      { label: 'Salary Slips Disbursed', value: '₹120M+' },
      { label: 'Platform Uptime', value: '99.98%' },
    ],
  };

  const contactInfo = siteData?.contactInfo || {
    title: 'Let’s Discuss Your Enterprise Needs',
    description:
      'Have questions about tenant onboarding, custom policies, or multi-branch deployments? Our technical consultants are ready to help.',
    email: 'contact@globalinfotech.com',
    phone: '+91 98765 43210',
    address: 'Global Infotech Towers, Powai IT Park, Mumbai, Maharashtra 400076',
    supportHours: 'Monday - Saturday: 9:00 AM - 7:00 PM IST',
  };

  const testimonials = siteData?.testimonials || [];
  const paymentGateway = siteData?.paymentGateway || {
    isEnabled: false,
    razorpayKeyId: '',
  };

  // FAQ Data processing
  const rawFaqs = siteData?.faqs && siteData.faqs.length > 0 ? siteData.faqs : DEFAULT_FAQS;
  const publishedFaqs = rawFaqs
    .filter((f) => f.isPublished !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const faqCategories = ['All', ...new Set(publishedFaqs.map((f) => f.category).filter(Boolean))];
  const displayedFaqs = publishedFaqs.filter(
    (f) => activeFaqCategory === 'All' || f.category === activeFaqCategory
  );

  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // If user is already logged in, immediately redirect to their dashboard
  useEffect(() => {
    if (user && user.token) {
      navigate(getRoleDashboard(user), { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  const handleInitiatePayment = (plan) => {
    setSelectedPlanForOnboarding(plan);
    setIsOnboardingModalOpen(true);
  };

  const getDashboardPath = () => {
    return getRoleDashboard(user);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500/20 selection:text-indigo-900 pt-[15px] pb-[30px] sm:pt-0 sm:pb-0">
      {/* ===================== 1. HEADER ===================== */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform shrink-0">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-base sm:text-xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors block truncate">
                Global Infotech
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-indigo-600 block -mt-0.5 sm:-mt-1">
                Enterprise Cloud Hub
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-sm font-semibold text-slate-600">
            <a href="#modules" className="hover:text-indigo-600 transition-colors">
              Platform Tour
            </a>
            <a href="#roles" className="hover:text-indigo-600 transition-colors">
              Role Workflows
            </a>
            <a href="#features" className="hover:text-indigo-600 transition-colors">
              Features
            </a>
            <a href="#plans" className="hover:text-indigo-600 transition-colors">
              Plans &amp; Pricing
            </a>
            <a href="#demo" className="text-amber-600 font-bold hover:text-amber-700 transition-colors flex items-center gap-1">
              <span>⚡ Demo Accounts</span>
            </a>
            <a href="#about" className="hover:text-indigo-600 transition-colors">
              About
            </a>
            <a href="#reviews" className="hover:text-indigo-600 transition-colors">
              Reviews
            </a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">
              FAQs
            </a>
            <a href="#contact" className="hover:text-indigo-600 transition-colors">
              Contact
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {user ? (
              <Link
                to={getDashboardPath()}
                className={`${tokens.btnPrimary} px-5 py-2.5 text-sm`}
              >
                <span>Go to Dashboard</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </Link>
            ) : (
              <>
                <a
                  href="#demo"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <HiOutlineSparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Live Demo</span>
                </a>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                >
                  Sign In
                </Link>
                <a
                  href="#plans"
                  className={`${tokens.btnPrimary} px-5 py-2.5 text-sm`}
                >
                  Get Started
                </a>
              </>
            )}
          </div>

          {/* Mobile Bar: Quick Sign-In / Dashboard Button + Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            {user ? (
              <Link
                to={getDashboardPath()}
                className={`${tokens.btnPrimary} px-3 py-1.5 text-xs font-semibold`}
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
              >
                Sign In
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <HiOutlineXMark className="w-6 h-6" />
              ) : (
                <HiOutlineBars3 className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/90 bg-white/98 backdrop-blur-md shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 max-h-[calc(100dvh-5rem-30px)] overflow-y-auto">
            <div className="px-4 py-4 space-y-4">
              {/* Navigation Links */}
              <nav className="flex flex-col space-y-1">
                <a
                  href="#modules"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                >
                  <span>Interactive Platform Tour</span>
                  <HiOutlineArrowRight className="w-4 h-4 text-slate-400" />
                </a>
                <a
                  href="#roles"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                >
                  <span>Role Workflows</span>
                  <HiOutlineArrowRight className="w-4 h-4 text-slate-400" />
                </a>
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                >
                  <span>Features &amp; Modules</span>
                  <HiOutlineArrowRight className="w-4 h-4 text-slate-400" />
                </a>
                <a
                  href="#plans"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                >
                  <span>Plans &amp; Pricing</span>
                  <HiOutlineArrowRight className="w-4 h-4 text-slate-400" />
                </a>
                <a
                  href="#demo"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold text-amber-700 bg-amber-50/80 border border-amber-200/60 hover:bg-amber-100 transition-colors"
                >
                  <span className="flex items-center gap-1.5">⚡ Public Demo Accounts</span>
                  <HiOutlineArrowRight className="w-4 h-4 text-amber-600" />
                </a>
                <a
                  href="#about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                >
                  <span>About Us</span>
                  <HiOutlineArrowRight className="w-4 h-4 text-slate-400" />
                </a>
                <a
                  href="#reviews"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                >
                  <span>User Reviews</span>
                  <HiOutlineArrowRight className="w-4 h-4 text-slate-400" />
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                >
                  <span>Frequently Asked Questions</span>
                  <HiOutlineArrowRight className="w-4 h-4 text-slate-400" />
                </a>
                <a
                  href="#contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                >
                  <span>Contact Support</span>
                  <HiOutlineArrowRight className="w-4 h-4 text-slate-400" />
                </a>
              </nav>

              {/* Mobile Auth / Actions */}
              <div className="pt-3 border-t border-slate-200/90 space-y-2">
                {user ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {user.name || 'User'}
                        </p>
                        <p className="text-[11px] text-indigo-600 font-medium truncate">
                          {user.roleRef?.displayName || user.role || 'Member'}
                        </p>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    </div>
                    <Link
                      to={getDashboardPath()}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`${tokens.btnPrimary} w-full py-2.5 text-sm font-bold justify-center`}
                    >
                      <HiOutlineSquares2X2 className="w-4 h-4" />
                      <span>Go to Dashboard</span>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors border border-slate-200"
                    >
                      <HiOutlineArrowRightOnRectangle className="w-4 h-4 text-slate-600" />
                      <span>Sign In to Portal</span>
                    </Link>
                    <a
                      href="#plans"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`${tokens.btnPrimary} w-full py-2.5 text-sm font-bold justify-center`}
                    >
                      <span>Explore Plans &amp; Get Started</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ===================== 2. HERO ===================== */}
      <section className="relative overflow-hidden pt-12 sm:pt-16 pb-16 sm:pb-24 lg:pt-20 lg:pb-32 bg-gradient-to-b from-white via-slate-50 to-indigo-50/40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] sm:w-[1000px] h-[400px] sm:h-[500px] bg-gradient-to-tr from-indigo-200/30 via-violet-200/20 to-sky-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-6 sm:mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="truncate max-w-[220px] sm:max-w-none">{hero.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-[1.15] max-w-4xl mx-auto px-2">
            {hero.title}{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 bg-clip-text text-transparent">
              {hero.highlight}
            </span>
          </h1>

          <p className="mt-4 sm:mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed px-2">
            {hero.subtitle}
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap justify-center items-stretch sm:items-center gap-3 sm:gap-4 px-2">
            <a
              href="#demo"
              className="inline-flex items-center justify-center gap-2 font-bold rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/25 px-6 sm:px-7 py-3 sm:py-3.5 text-sm sm:text-base transition-all hover:scale-[1.02] cursor-pointer"
            >
              <span>⚡ Test Live Demo Accounts</span>
              <HiOutlineSparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200" />
            </a>
            <a
              href="#modules"
              className={`${tokens.btnPrimary} px-6 sm:px-7 py-3 sm:py-3.5 text-sm sm:text-base`}
            >
              <span>Explore Platform Tour</span>
              <HiOutlineArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
            <a
              href="#plans"
              className={`${tokens.btnSecondary} px-6 sm:px-7 py-3 sm:py-3.5 text-sm sm:text-base`}
            >
              View Pricing &amp; Plans
            </a>
          </div>

          {/* Interactive Hero Software Preview Mockup */}
          <div className="mt-10 sm:mt-14 max-w-5xl mx-auto rounded-3xl bg-slate-900/90 p-2 sm:p-3 shadow-2xl shadow-indigo-950/20 border border-slate-800 text-left">
            <div className="rounded-2xl bg-slate-950 overflow-hidden border border-slate-850">
              {/* Window Titlebar */}
              <div className="px-4 py-3 bg-slate-900 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  <span className="ml-3 text-[11px] font-mono text-slate-400 hidden sm:inline-block">
                    https://app.globalinfotech.com/admin/dashboard
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Multi-Branch Connected
                  </span>
                </div>
              </div>

              {/* Window Content */}
              <div className="p-3 sm:p-5 bg-slate-900 text-slate-100">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5">
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 font-semibold block">Geofenced Punch-Ins</span>
                    <span className="text-base sm:text-lg font-extrabold text-emerald-400 block mt-0.5">118 / 124</span>
                    <span className="text-[9px] text-slate-400">95.2% On-Site Present</span>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 font-semibold block">Monthly Payroll</span>
                    <span className="text-base sm:text-lg font-extrabold text-indigo-400 block mt-0.5">₹24,80,000</span>
                    <span className="text-[9px] text-slate-400">Net Disbursed</span>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 font-semibold block">Active Tasks</span>
                    <span className="text-base sm:text-lg font-extrabold text-white block mt-0.5">38 Running</span>
                    <span className="text-[9px] text-emerald-400 font-bold">Live Timers Active</span>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 font-semibold block">Deliverables Completed</span>
                    <span className="text-base sm:text-lg font-extrabold text-amber-400 block mt-0.5">142 Sprints</span>
                    <span className="text-[9px] text-slate-400">98% Quality SLA</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-white">Live Time Tracking &amp; Task Deliverables</span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">● Dinesh Tawade (Running: 01:42:15)</span>
                    </div>
                    <div className="space-y-1.5 text-[10px]">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-700/60">
                        <span className="font-medium text-slate-200 truncate">Payment Gateway Webhook Sync &amp; Testing</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300">In Progress</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-700/60">
                        <span className="font-medium text-slate-200 truncate">Reports Center: Export Attendance &amp; Payroll PDF</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">Completed</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-700 to-violet-800 p-3 rounded-xl flex flex-col justify-between text-white">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-indigo-200">1-Click Action Hub</span>
                      <p className="font-bold text-xs mt-0.5">Attendance, Salary &amp; Reports</p>
                      <p className="text-[10px] text-indigo-100 mt-1">Export instant RFC 4180 Excel &amp; Printable PDF</p>
                    </div>
                    <div className="pt-2">
                      <a href="#modules" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-indigo-900 font-bold text-[10px] hover:bg-indigo-50 transition-colors shadow-xs">
                        <span>Explore All Modules Tour</span>
                        <HiOutlineArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto pt-8 sm:pt-10 border-t border-slate-200/80 px-2">
            {aboutUs.stats?.map((st, i) => (
              <div key={i} className="text-center">
                <div className="text-xl sm:text-3xl font-extrabold text-slate-900">
                  {st.value}
                </div>
                <div className="text-[10px] sm:text-xs font-medium text-slate-500 mt-1">
                  {st.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== SCROLLING ICONS & FEATURES MARQUEE ===================== */}
      <ScrollingFeatureTicker />

      {/* ===================== 3. SUBSCRIPTION PLANS & PRICING (BROUGHT UP) ===================== */}
      <section id="plans" className="py-16 sm:py-24 lg:py-28 bg-gradient-to-b from-slate-50 via-indigo-50/20 to-white relative overflow-hidden">
        {/* Ambient subtle glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/80 px-3.5 py-1.5 rounded-full border border-indigo-200 inline-flex items-center gap-1.5 shadow-xs">
              <HiOutlineSparkles className="w-3.5 h-3.5 text-indigo-600" />
              Transparent Multi-Branch Pricing
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mt-3">
              Scalable Subscription Plans for Growing Teams
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
              Get complete multi-branch management, geofenced mobile attendance, dynamic salary slips, and dedicated cloud isolation.
            </p>

            {/* Monthly / Annual Billing Toggle */}
            <div className="mt-6 sm:mt-8 flex items-center justify-center">
              <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center gap-1 border border-slate-300/80 shadow-xs">
                <button
                  type="button"
                  onClick={() => setBillingInterval('monthly')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    billingInterval === 'monthly'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  onClick={() => setBillingInterval('annual')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    billingInterval === 'annual'
                      ? 'bg-white text-indigo-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Annual Billing</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>
          </div>

          {plansLoading ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
              {plans?.map((plan) => {
                const isPro = plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('growth') || plan.name.toLowerCase().includes('premium');
                const basePrice = plan.price || 0;
                const displayPrice = billingInterval === 'annual' ? Math.round(basePrice * 0.8) : basePrice;

                return (
                  <div
                    key={plan._id}
                    className={`rounded-3xl p-6 sm:p-8 transition-all flex flex-col justify-between relative bg-white hover:-translate-y-1 duration-200 ${
                      isPro
                        ? 'border-2 border-indigo-600 ring-4 ring-indigo-500/10 shadow-2xl shadow-indigo-600/15 lg:scale-105 lg:z-10 bg-gradient-to-b from-indigo-50/40 via-white to-white'
                        : 'border border-slate-200/90 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:border-slate-300'
                    }`}
                  >
                    {isPro && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 text-white text-[10px] sm:text-[11px] font-extrabold px-4 py-1 rounded-full uppercase tracking-wider shadow-md shadow-indigo-600/30 whitespace-nowrap flex items-center gap-1.5 animate-pulse-subtle">
                        <HiOutlineSparkles className="w-3.5 h-3.5" />
                        <span>Most Popular Choice</span>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                          {plan.name}
                        </h3>
                        <span className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                          {billingInterval === 'annual' ? 'Billed Annually' : (plan.billingCycle || 'Monthly')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 min-h-[32px] leading-relaxed">
                        {plan.description || 'Full enterprise office management suite with tenant isolation.'}
                      </p>

                      <div className="mt-5 mb-5 pb-5 border-b border-slate-100 flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                          ₹{displayPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          / seat / month
                        </span>
                        {billingInterval === 'annual' && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            20% Discounted
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 mb-6">
                        <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50 text-slate-700 font-medium border border-slate-100 gap-2">
                          <span className="shrink-0 text-slate-500">Employee Capacity</span>
                          <span className="font-bold text-indigo-700 text-right">
                            Up to {plan.maxEmployees} Seats
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50 text-slate-700 font-medium border border-slate-100 gap-2">
                          <span className="shrink-0 text-slate-500">Validity Cycle</span>
                          <span className="font-bold text-indigo-700 text-right">
                            {plan.durationDays || 30} Days Guaranteed
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50 text-slate-700 font-medium border border-slate-100 gap-2">
                          <span className="shrink-0 text-slate-500">Cloud Isolation</span>
                          <span className="font-bold text-emerald-700 text-right">
                            100% Dedicated Tenant
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                          Included Modules &amp; Privileges
                        </p>
                        <ul className="space-y-2.5">
                          {plan.features?.map((feat, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2.5 text-xs text-slate-700"
                            >
                              <HiOutlineCheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="leading-tight">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-6 sm:mt-8 pt-5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleInitiatePayment(plan)}
                        className={`w-full py-3 sm:py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer ${
                          isPro
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30 active:scale-98'
                            : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-98'
                        }`}
                      >
                        {paymentGateway.isEnabled
                          ? 'Subscribe with Razorpay'
                          : 'Get Started with Plan'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ===================== LIVE DEMO ACCOUNTS & SANDBOX ===================== */}
      <DemoCredentialsSection />

      {/* ===================== 4. INTERACTIVE MODULES SHOWCASE ===================== */}
      <ModuleShowcase />

      {/* ===================== 4. HOW IT WORKS (WORKFLOW) ===================== */}
      <HowItWorks />

      {/* ===================== 5. ROLE-BASED WORKFLOWS ===================== */}
      <RoleWorkflows />

      {/* ===================== 6. FEATURES ===================== */}
      <section
        id="features"
        className="py-16 sm:py-20 lg:py-28 bg-white border-y border-slate-200/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Complete Operational Suite
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              Engineered for Complete Enterprise Productivity
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3">
              One centralized platform replacing disjointed tools for attendance,
              task management, dynamic salary slips, and team video meetings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Feature 1 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mb-4 sm:mb-5 group-hover:scale-110 transition-transform">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                Geofenced Mobile Attendance
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Radius validation, camera verification, punch-in/out timestamps, and
                automatic late mark calculation for accurate presence tracking.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-4 sm:mb-5 group-hover:scale-110 transition-transform">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                Automated Dynamic Payroll
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Configurable CTC annexures, PF &amp; ESIC rules, professional tax
                deductions, and printable monthly salary slips generated in one click.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold mb-4 sm:mb-5 group-hover:scale-110 transition-transform">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                Task &amp; Project Tracking
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Project scoping, team head assignments, paginated task tables,
                priority tags, and comprehensive daily progress reporting.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold mb-4 sm:mb-5 group-hover:scale-110 transition-transform">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                Real-Time Chat &amp; Meetings
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Direct messaging, group collaboration rooms, media sharing, and
                instant HD video conferences with Jitsi Meet integration.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold mb-4 sm:mb-5 group-hover:scale-110 transition-transform">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                Multi-Office Tenant Isolation
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Each company operates as an isolated tenant. Separate employee
                quotas, dedicated admins, and zero data leakage across branches.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold mb-4 sm:mb-5 group-hover:scale-110 transition-transform">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                Automated Policy &amp; Security
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                JWT token authentication, bcrypt password hashing, buffer-time rule
                engines, push notifications, and detailed performance audit logs.
              </p>
            </div>
            {/* Feature 7: Reports & Export Hub */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-4 sm:mb-5 group-hover:scale-110 transition-transform">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                Reports &amp; Export Hub
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Download month-wise Attendance Registers, Payroll Deductions, and "Kisne Kitna Kaam Kiya" Project Contribution breakdowns in instant Excel CSV &amp; printable PDF.
              </p>
            </div>

            {/* Feature 8: CRM & Client Portal */}
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center font-bold mb-4 sm:mb-5 group-hover:scale-110 transition-transform">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                CRM Pipeline &amp; Client Portal
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Manage incoming sales deals through interactive stages, and provide corporate clients with an isolated guest portal to track deliverables, review sprints, and download invoices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== ABOUT ===================== */}
      <section
        id="about"
        className="py-16 sm:py-20 lg:py-28 bg-white border-y border-slate-200/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                {aboutUs.badge}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
                {aboutUs.title}
              </h2>
              <p className="mt-4 sm:mt-5 text-sm sm:text-base text-slate-600 leading-relaxed">
                {aboutUs.description}
              </p>

              <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    Our Mission
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {aboutUs.mission}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-600" />
                    Our Vision
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {aboutUs.vision}
                  </p>
                </div>
              </div>
            </div>

            {/* Right image */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl shadow-indigo-900/10 border-4 border-white">
                <img
                  src={aboutUs.imageUrl}
                  alt="Team collaboration"
                  className="w-full h-[280px] sm:h-[420px] object-cover"
                />
              </div>
              <div className="absolute -bottom-5 sm:-bottom-6 -left-3 sm:-left-6 bg-white p-3 sm:p-5 rounded-2xl shadow-xl border border-slate-100 hidden sm:block">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                    <HiOutlineCheck className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">
                      Multi-Tenant Verified
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-500">
                      100% Cryptographic Segregation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== 6. TESTIMONIALS ===================== */}
      <section id="reviews" className="py-16 sm:py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100/70 px-3 py-1 rounded-full border border-indigo-200">
              Trusted by Industry Leaders
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              What Business Owners Say About Us
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3">
              Real testimonials from corporate managers, directors, and HR heads
              using Global Infotech every day.
            </p>
          </div>

          {testimonials?.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm italic">
              No testimonials yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {testimonials?.map((t, idx) => (
                <div
                  key={idx}
                  className="p-5 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-md shadow-slate-200/40 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1 text-amber-400 mb-3 sm:mb-4">
                      {[...Array(t.rating || 5)].map((_, i) => (
                        <HiStar key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic mb-4 sm:mb-6">
                      "{t.review}"
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-indigo-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {t.name}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                        {t.designation},{' '}
                        <span className="text-indigo-600 font-medium">{t.company}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===================== FAQ ACCORDION ===================== */}
      <section
        id="faq"
        className="py-16 sm:py-20 lg:py-28 bg-white border-t border-slate-200/80"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              Frequently Asked Questions
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3">
              Everything you need to know about attendance tracking, multi-tenant workspace isolation, pricing, and system security.
            </p>

            {/* Category Filter Pills (if multiple categories exist) */}
            {faqCategories.length > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                {faqCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveFaqCategory(category)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      activeFaqCategory === category
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Accordion Items List */}
          <div className="space-y-3 sm:space-y-4">
            {displayedFaqs.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs sm:text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No FAQs available under this category.
              </div>
            ) : (
              displayedFaqs.map((faq) => {
                const isOpen = expandedFaqId === faq._id;
                return (
                  <div
                    key={faq._id}
                    className={`rounded-2xl transition-all duration-200 border ${
                      isOpen
                        ? 'bg-slate-50/70 border-indigo-200 shadow-sm'
                        : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaqId(isOpen ? null : faq._id)}
                      className="w-full px-5 sm:px-6 py-4 sm:py-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isOpen
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <HiOutlineQuestionMarkCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                          {faq.category && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-0.5">
                              {faq.category}
                            </span>
                          )}
                          <span className="text-sm sm:text-base font-bold text-slate-900 leading-snug block">
                            {faq.question}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <HiOutlineChevronDown className="w-4 h-4" />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-5 pt-1 border-t border-slate-100 animate-in fade-in duration-150">
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-10 sm:pl-11 whitespace-pre-line">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Need more help banner */}
          <div className="mt-10 sm:mt-12 bg-slate-50 rounded-2xl border border-slate-200 p-6 sm:p-8 text-center shadow-xs">
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Have a question that is not answered here?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Our enterprise consultants are available to walk you through any custom requirement or schedule an interactive demo.
            </p>
            <div className="mt-4">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <span>Send Us a Direct Message Below</span>
                <HiOutlineArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== 7. CONTACT ===================== */}
      <section
        id="contact"
        className="py-16 sm:py-20 lg:py-28 bg-white border-t border-slate-200/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
            {/* Contact details */}
            <div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Get In Touch
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
                {contactInfo.title}
              </h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                {contactInfo.description}
              </p>

              <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase">
                      Email Us Directly
                    </p>
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="text-xs sm:text-sm font-bold text-slate-900 hover:text-indigo-600 break-all"
                    >
                      {contactInfo.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase">
                      Call Support Hotline
                    </p>
                    <a
                      href={`tel:${contactInfo.phone}`}
                      className="text-xs sm:text-sm font-bold text-slate-900 hover:text-indigo-600"
                    >
                      {contactInfo.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase">
                      Corporate Headquarters
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-slate-900">
                      {contactInfo.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase">
                      Working Hours
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-slate-900">
                      {contactInfo.supportHours}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Inquiry form */}
            <div className="bg-slate-50 p-5 sm:p-8 rounded-3xl border border-slate-200 shadow-md">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                Send Us a Direct Message
              </h3>
              <p className="text-xs text-slate-500 mb-5 sm:mb-6">
                Our enterprise onboarding specialist will respond within 24 hours.
              </p>

              <form onSubmit={handleInquirySubmit} className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className={tokens.label}>Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={inquiryForm.name}
                      onChange={(e) =>
                        setInquiryForm({ ...inquiryForm, name: e.target.value })
                      }
                      placeholder="e.g. Ramesh Patel"
                      className={tokens.input}
                    />
                  </div>

                  <div>
                    <label className={tokens.label}>Official Email *</label>
                    <input
                      type="email"
                      required
                      value={inquiryForm.email}
                      onChange={(e) =>
                        setInquiryForm({ ...inquiryForm, email: e.target.value })
                      }
                      placeholder="ramesh@company.com"
                      className={tokens.input}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className={tokens.label}>Phone Number</label>
                    <input
                      type="text"
                      value={inquiryForm.phone}
                      onChange={(e) =>
                        setInquiryForm({ ...inquiryForm, phone: e.target.value })
                      }
                      placeholder="+91 98765 00000"
                      className={tokens.input}
                    />
                  </div>

                  <div>
                    <label className={tokens.label}>Subject</label>
                    <input
                      type="text"
                      value={inquiryForm.subject}
                      onChange={(e) =>
                        setInquiryForm({ ...inquiryForm, subject: e.target.value })
                      }
                      placeholder="e.g. Plan inquiry"
                      className={tokens.input}
                    />
                  </div>
                </div>

                <div>
                  <label className={tokens.label}>Your Message *</label>
                  <textarea
                    rows={4}
                    required
                    value={inquiryForm.message}
                    onChange={(e) =>
                      setInquiryForm({ ...inquiryForm, message: e.target.value })
                    }
                    placeholder="Tell us about your organization requirements, current challenges, and questions..."
                    className={`${tokens.input} resize-none`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingInquiry}
                  className={`${tokens.btnPrimary} w-full py-3 sm:py-3.5 text-sm`}
                >
                  {isSubmittingInquiry && (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>
                    {isSubmittingInquiry
                      ? 'Sending Inquiry…'
                      : 'Submit Enterprise Inquiry'}
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== 8. FOOTER ===================== */}
      <footer className="bg-slate-900 text-slate-400 py-10 sm:py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8 pb-8 sm:pb-12 border-b border-slate-800">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                  GI
                </div>
                <span className="font-bold text-base sm:text-lg text-white">
                  Global Infotech SaaS
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-3 max-w-sm leading-relaxed">
                Empowering businesses with intelligent workforce analytics,
                geofenced mobile attendance, dynamic payroll breakdown, and secure
                multi-branch tenant infrastructure.
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white mb-3">
                Quick Navigation
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Platform Features
                  </a>
                </li>
                <li>
                  <a href="#plans" className="hover:text-white transition-colors">
                    Subscription Plans
                  </a>
                </li>
                <li>
                  <a href="#about" className="hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#reviews" className="hover:text-white transition-colors">
                    Customer Reviews
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    Frequently Asked Questions
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-white transition-colors">
                    Contact Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white mb-3">
                Legal &amp; Compliance
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveLegalModal('terms')}
                    className="hover:text-white transition-colors text-left"
                  >
                    Terms &amp; Conditions
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveLegalModal('privacy')}
                    className="hover:text-white transition-colors text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveLegalModal('payment')}
                    className="hover:text-white transition-colors text-left"
                  >
                    Payment Policy &amp; Billing
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveLegalModal('refund')}
                    className="hover:text-white transition-colors text-left"
                  >
                    Refund &amp; Cancellation
                  </button>
                </li>
                <li className="pt-2 border-t border-slate-800">
                  <Link
                    to="/login"
                    className="text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Employee / Admin Login →
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-xs text-slate-500 gap-3 sm:gap-4">
            <p>
              © {new Date().getFullYear()} Global Infotech India Pvt. Ltd. All rights
              reserved.
            </p>
            <p>Designed with enterprise-grade multi-tenant architecture.</p>
          </div>
        </div>
      </footer>

      {/* ===================== 9. LEGAL MODAL ===================== */}
      {activeLegalModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-t-2xl sm:rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl my-0 sm:my-8 border border-slate-100 max-h-[92dvh] sm:max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 gap-3 shrink-0">
              <h3 className="text-base sm:text-xl font-extrabold text-slate-900 truncate">
                {activeLegalModal === 'terms' && 'Terms & Conditions'}
                {activeLegalModal === 'privacy' && 'Privacy Policy'}
                {activeLegalModal === 'payment' && 'Payment Policy & Billing Terms'}
                {activeLegalModal === 'refund' && 'Refund & Cancellation Policy'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveLegalModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="py-4 sm:py-6 overflow-y-auto flex-1 text-xs sm:text-sm text-slate-700 leading-relaxed">
              {activeLegalModal === 'terms' &&
                renderFormattedPolicy(siteData?.termsAndConditions?.content)}
              {activeLegalModal === 'privacy' &&
                renderFormattedPolicy(siteData?.privacyPolicy?.content)}
              {activeLegalModal === 'payment' &&
                renderFormattedPolicy(siteData?.paymentPolicy?.content)}
              {activeLegalModal === 'refund' &&
                renderFormattedPolicy(siteData?.refundPolicy?.content)}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setActiveLegalModal(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== 10. PLAN FALLBACK MODAL ===================== */}
      {selectedPlanForCheckout && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-t-2xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
              ₹
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Subscribe to {selectedPlanForCheckout.name}
            </h3>
            <p className="text-xs text-slate-600 mt-2">
              Price:{' '}
              <span className="font-bold text-indigo-600 text-base">
                ₹{selectedPlanForCheckout.price?.toLocaleString('en-IN')}
              </span>{' '}
              / {selectedPlanForCheckout.billingCycle || 'month'}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Capacity: Up to {selectedPlanForCheckout.maxEmployees} employees
              provisioned.
            </p>

            <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-2">
              <p>To finalize your office account creation or payment:</p>
              <p className="font-medium text-slate-800">
                • Contact our onboarding desk at{' '}
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="text-indigo-600 underline break-all"
                >
                  {contactInfo.email}
                </a>
              </p>
              <p className="font-medium text-slate-800">
                • Or call{' '}
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="text-indigo-600 underline"
                >
                  {contactInfo.phone}
                </a>
              </p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setSelectedPlanForCheckout(null)}
                className={`${tokens.btnSecondary} flex-1 px-3 py-2.5 text-xs`}
              >
                Close
              </button>
              <Link
                to="/login"
                className={`${tokens.btnPrimary} flex-1 px-3 py-2.5 text-xs text-center`}
              >
                Sign In to Portal
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ===================== 11. ONBOARDING WIZARD ===================== */}
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

/* ============================================================
   Markdown helpers (UNCHANGED — preserved exactly)
   ============================================================ */
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
            <h4
              key={idx}
              className="text-sm sm:text-base font-bold text-slate-900 mt-4 pb-1 border-b border-slate-200"
            >
              {trimmed.replace(/^###\s+/, '')}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3
              key={idx}
              className="text-base sm:text-lg font-extrabold text-indigo-600 mt-5 pb-1 border-b border-indigo-100"
            >
              {trimmed.replace(/^##\s+/, '')}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2
              key={idx}
              className="text-lg sm:text-xl font-black text-slate-900 mt-6 pb-2 border-b border-slate-200"
            >
              {trimmed.replace(/^#\s+/, '')}
            </h2>
          );
        }

        if (
          trimmed.includes('\n- ') ||
          trimmed.startsWith('- ') ||
          trimmed.includes('\n* ') ||
          trimmed.startsWith('* ')
        ) {
          const lines = trimmed.split('\n');
          return (
            <ul
              key={idx}
              className="list-disc list-inside space-y-1.5 text-slate-700 pl-1"
            >
              {lines.map((line, lIdx) => {
                const bulletText = line.replace(/^[-*]\s+/, '').trim();
                if (!bulletText) return null;
                return <li key={lIdx}>{formatInlineMarkdown(bulletText)}</li>;
              })}
            </ul>
          );
        }

        return (
          <p
            key={idx}
            className="text-slate-700 leading-relaxed text-xs sm:text-sm"
          >
            {formatInlineMarkdown(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

export default Landing;