import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../api/axios';

const SuperAdminCMS = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('gateway'); // gateway, about, testimonials, contact, legal
  const [showSecret, setShowSecret] = useState(false);

  // Modal for Add/Edit Testimonial
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [editingTestimonialIdx, setEditingTestimonialIdx] = useState(null);
  const [testimonialForm, setTestimonialForm] = useState({
    name: '',
    designation: '',
    company: '',
    rating: 5,
    review: '',
    avatar: ''
  });

  // Fetch full content including secret keys
  const { data: content, isLoading } = useQuery({
    queryKey: ['adminSiteContent'],
    queryFn: async () => {
      const { data } = await api.get('/site-content/admin');
      return data;
    }
  });

  // Form states initialized after loading
  const [paymentGateway, setPaymentGateway] = useState({
    razorpayKeyId: '',
    razorpayKeySecret: '',
    isEnabled: false,
    currency: 'INR'
  });

  const [aboutUs, setAboutUs] = useState({
    badge: '',
    title: '',
    description: '',
    mission: '',
    vision: '',
    imageUrl: ''
  });

  const [contactInfo, setContactInfo] = useState({
    title: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    supportHours: ''
  });

  const [termsContent, setTermsContent] = useState('');
  const [privacyContent, setPrivacyContent] = useState('');
  const [paymentPolicyContent, setPaymentPolicyContent] = useState('');
  const [refundPolicyContent, setRefundPolicyContent] = useState('');
  const [testimonialsList, setTestimonialsList] = useState([]);

  // Sync state once data loads
  const [hasInitialized, setHasInitialized] = useState(false);
  if (content && !hasInitialized) {
    setPaymentGateway({
      razorpayKeyId: content.paymentGateway?.razorpayKeyId || '',
      razorpayKeySecret: content.paymentGateway?.razorpayKeySecret || '',
      isEnabled: !!content.paymentGateway?.isEnabled,
      currency: content.paymentGateway?.currency || 'INR'
    });
    setAboutUs({
      badge: content.aboutUs?.badge || '',
      title: content.aboutUs?.title || '',
      description: content.aboutUs?.description || '',
      mission: content.aboutUs?.mission || '',
      vision: content.aboutUs?.vision || '',
      imageUrl: content.aboutUs?.imageUrl || ''
    });
    setContactInfo({
      title: content.contactInfo?.title || '',
      description: content.contactInfo?.description || '',
      email: content.contactInfo?.email || '',
      phone: content.contactInfo?.phone || '',
      address: content.contactInfo?.address || '',
      supportHours: content.contactInfo?.supportHours || ''
    });
    setTermsContent(content.termsAndConditions?.content || '');
    setPrivacyContent(content.privacyPolicy?.content || '');
    setPaymentPolicyContent(content.paymentPolicy?.content || '');
    setRefundPolicyContent(content.refundPolicy?.content || '');
    setTestimonialsList(content.testimonials || []);
    setHasInitialized(true);
  }

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.put('/site-content', payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Changes saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['adminSiteContent'] });
      queryClient.invalidateQueries({ queryKey: ['publicSiteContent'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save changes');
    }
  });

  const handleSaveGateway = (e) => {
    e.preventDefault();
    let keyId = (paymentGateway.razorpayKeyId || '').trim();
    if (keyId.startsWith('zp_test_')) keyId = 'r' + keyId;
    if (keyId.startsWith('zp_live_')) keyId = 'r' + keyId;
    const sanitized = {
      ...paymentGateway,
      razorpayKeyId: keyId,
      razorpayKeySecret: (paymentGateway.razorpayKeySecret || '').trim()
    };
    updateMutation.mutate({ paymentGateway: sanitized });
  };

  const handleSaveAbout = (e) => {
    e.preventDefault();
    updateMutation.mutate({ aboutUs });
  };

  const handleSaveContact = (e) => {
    e.preventDefault();
    updateMutation.mutate({ contactInfo });
  };

  const handleSavePrivacy = (e) => {
    if (e) e.preventDefault();
    updateMutation.mutate({ privacyPolicy: { content: privacyContent } });
  };

  const handleSavePaymentPolicy = (e) => {
    if (e) e.preventDefault();
    updateMutation.mutate({ paymentPolicy: { content: paymentPolicyContent } });
  };

  const handleSaveRefundPolicy = (e) => {
    if (e) e.preventDefault();
    updateMutation.mutate({ refundPolicy: { content: refundPolicyContent } });
  };

  const handleSaveTerms = (e) => {
    if (e) e.preventDefault();
    updateMutation.mutate({ termsAndConditions: { content: termsContent } });
  };

  // Testimonial Handlers
  const handleOpenAddTestimonial = () => {
    setEditingTestimonialIdx(null);
    setTestimonialForm({
      name: '',
      designation: '',
      company: '',
      rating: 5,
      review: '',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    });
    setIsTestimonialModalOpen(true);
  };

  const handleOpenEditTestimonial = (idx) => {
    setEditingTestimonialIdx(idx);
    setTestimonialForm(testimonialsList[idx]);
    setIsTestimonialModalOpen(true);
  };

  const handleDeleteTestimonial = (idx) => {
    if (window.confirm('Are you sure you want to remove this testimonial?')) {
      const updated = testimonialsList.filter((_, i) => i !== idx);
      setTestimonialsList(updated);
      updateMutation.mutate({ testimonials: updated });
    }
  };

  const handleSaveTestimonialModal = (e) => {
    e.preventDefault();
    let updated;
    if (editingTestimonialIdx !== null) {
      updated = [...testimonialsList];
      updated[editingTestimonialIdx] = testimonialForm;
    } else {
      updated = [...testimonialsList, testimonialForm];
    }
    setTestimonialsList(updated);
    setIsTestimonialModalOpen(false);
    updateMutation.mutate({ testimonials: updated });
  };

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Main Website CMS & Payment Gateway</h1>
        <p className="text-slate-400 text-sm mt-1">
          Dynamically manage the public landing page content, terms, privacy, reviews, and Razorpay API credentials.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'gateway', name: 'Razorpay Gateway', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
          { id: 'privacy', name: 'Privacy Policy', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
          { id: 'payment-policy', name: 'Payment Policy & Billing', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          { id: 'refund-policy', name: 'Refund & Cancellation', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
          { id: 'terms', name: 'Terms & Conditions', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { id: 'about', name: 'About Us Page', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          { id: 'testimonials', name: 'User Reviews', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
          { id: 'contact', name: 'Contact Us', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            {tab.name}
          </button>
        ))}
      </div>

      {/* TAB 1: RAZORPAY PAYMENT GATEWAY */}
      {activeTab === 'gateway' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-3xl animate-in fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Razorpay API Credentials</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Enable online payments so organizations can directly subscribe and renew plans via cards, UPI, and NetBanking.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Gateway Status:</span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  paymentGateway.isEnabled
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {paymentGateway.isEnabled ? 'Enabled & Live' : 'Disabled'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveGateway} className="space-y-5">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <input
                type="checkbox"
                id="enableGateway"
                checked={paymentGateway.isEnabled}
                onChange={(e) => setPaymentGateway({ ...paymentGateway, isEnabled: e.target.checked })}
                className="w-5 h-5 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
              />
              <label htmlFor="enableGateway" className="text-sm font-medium text-slate-200 cursor-pointer">
                Enable Online Razorpay Gateway on Subscription Plans
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                RAZORPAY_KEY_ID *
              </label>
              <input
                type="text"
                value={paymentGateway.razorpayKeyId}
                onChange={(e) => setPaymentGateway({ ...paymentGateway, razorpayKeyId: e.target.value })}
                placeholder="rzp_live_xxxxxxxx or rzp_test_xxxxxxxx"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">This key is exposed to the frontend checkout modal safely.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                RAZORPAY_KEY_SECRET *
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={paymentGateway.razorpayKeySecret}
                  onChange={(e) => setPaymentGateway({ ...paymentGateway, razorpayKeySecret: e.target.value })}
                  placeholder="Enter your confidential Razorpay Key Secret"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showSecret ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Kept strictly secret on the backend for signature verification.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Currency Code</label>
              <input
                type="text"
                value={paymentGateway.currency}
                onChange={(e) => setPaymentGateway({ ...paymentGateway, currency: e.target.value.toUpperCase() })}
                placeholder="INR"
                className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Razorpay Credentials'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: ABOUT US */}
      {activeTab === 'about' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-3xl animate-in fade-in">
          <h2 className="text-lg font-bold text-white mb-1">About Us Page Content</h2>
          <p className="text-xs text-slate-400 mb-6">Manage company overview, mission, vision, and hero image shown on the landing page.</p>

          <form onSubmit={handleSaveAbout} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Section Badge Tag</label>
                <input
                  type="text"
                  value={aboutUs.badge}
                  onChange={(e) => setAboutUs({ ...aboutUs, badge: e.target.value })}
                  placeholder="e.g. About Global Infotech"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Feature Image URL</label>
                <input
                  type="text"
                  value={aboutUs.imageUrl}
                  onChange={(e) => setAboutUs({ ...aboutUs, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Main Headline</label>
              <input
                type="text"
                value={aboutUs.title}
                onChange={(e) => setAboutUs({ ...aboutUs, title: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Company Description</label>
              <textarea
                rows={4}
                value={aboutUs.description}
                onChange={(e) => setAboutUs({ ...aboutUs, description: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Our Mission</label>
                <textarea
                  rows={3}
                  value={aboutUs.mission}
                  onChange={(e) => setAboutUs({ ...aboutUs, mission: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Our Vision</label>
                <textarea
                  rows={3}
                  value={aboutUs.vision}
                  onChange={(e) => setAboutUs({ ...aboutUs, vision: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save About Us Content'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: USER REVIEWS & TESTIMONIALS */}
      {activeTab === 'testimonials' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Client Testimonials & Reviews</h2>
              <p className="text-xs text-slate-400 mt-0.5">Customer feedback showcased on the landing page.</p>
            </div>
            <button
              onClick={handleOpenAddTestimonial}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
            >
              + Add Review
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonialsList?.map((item, idx) => (
              <div key={idx} className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 mb-2 text-amber-400">
                    {[...Array(item.rating || 5)].map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-300 italic mb-4">"{item.review}"</p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src={item.avatar} alt={item.name} className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                    <div>
                      <p className="text-xs font-semibold text-white">{item.name}</p>
                      <p className="text-[10px] text-slate-400">{item.designation}, {item.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditTestimonial(idx)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTestimonial(idx)}
                      className="p-1 rounded text-rose-400 hover:text-rose-300"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CONTACT US */}
      {activeTab === 'contact' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-3xl animate-in fade-in">
          <h2 className="text-lg font-bold text-white mb-1">Contact Us Settings</h2>
          <p className="text-xs text-slate-400 mb-6">Contact details displayed on the landing page and footer.</p>

          <form onSubmit={handleSaveContact} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Section Title</label>
              <input
                type="text"
                value={contactInfo.title}
                onChange={(e) => setContactInfo({ ...contactInfo, title: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Subtitle / Description</label>
              <input
                type="text"
                value={contactInfo.description}
                onChange={(e) => setContactInfo({ ...contactInfo, description: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Support Email</label>
                <input
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={contactInfo.phone}
                  onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Office Address</label>
              <input
                type="text"
                value={contactInfo.address}
                onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Working / Support Hours</label>
              <input
                type="text"
                value={contactInfo.supportHours}
                onChange={(e) => setContactInfo({ ...contactInfo, supportHours: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Contact Info'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: PRIVACY POLICY */}
      {activeTab === 'privacy' && (
        <PolicyEditorTab
          title="Privacy Policy Editor"
          subtitle="Configure platform data privacy clauses, employee information policies, and security commitments shown to visitors and clients."
          badgeText="Legal & Compliance"
          lastUpdated={content?.privacyPolicy?.lastUpdated}
          value={privacyContent}
          onChange={setPrivacyContent}
          onSave={handleSavePrivacy}
          isPending={updateMutation.isPending}
          defaultTemplate={DEFAULT_PRIVACY_TEMPLATE}
          saveButtonText="Save Privacy Policy"
        />
      )}

      {/* TAB 6: PAYMENT POLICY & BILLING */}
      {activeTab === 'payment-policy' && (
        <PolicyEditorTab
          title="Payment Policy & Billing Terms"
          subtitle="Configure subscription payment terms, invoice dispatch, GST billing rules, and upgrade policies."
          badgeText="Billing & Gateway"
          lastUpdated={content?.paymentPolicy?.lastUpdated}
          value={paymentPolicyContent}
          onChange={setPaymentPolicyContent}
          onSave={handleSavePaymentPolicy}
          isPending={updateMutation.isPending}
          defaultTemplate={DEFAULT_PAYMENT_POLICY_TEMPLATE}
          saveButtonText="Save Payment Policy"
        />
      )}

      {/* TAB 7: REFUND & CANCELLATION */}
      {activeTab === 'refund-policy' && (
        <PolicyEditorTab
          title="Refund & Cancellation Policy"
          subtitle="Define money-back guarantee terms, refund request windows, processing timelines, and cancellation guidelines."
          badgeText="Returns & Cancellation"
          lastUpdated={content?.refundPolicy?.lastUpdated}
          value={refundPolicyContent}
          onChange={setRefundPolicyContent}
          onSave={handleSaveRefundPolicy}
          isPending={updateMutation.isPending}
          defaultTemplate={DEFAULT_REFUND_POLICY_TEMPLATE}
          saveButtonText="Save Refund Policy"
        />
      )}

      {/* TAB 8: TERMS & CONDITIONS */}
      {activeTab === 'terms' && (
        <PolicyEditorTab
          title="Terms & Conditions Agreement"
          subtitle="Platform master services agreement, tenant usage restrictions, and organizational responsibilities."
          badgeText="User Agreement"
          lastUpdated={content?.termsAndConditions?.lastUpdated}
          value={termsContent}
          onChange={setTermsContent}
          onSave={handleSaveTerms}
          isPending={updateMutation.isPending}
          defaultTemplate={DEFAULT_TERMS_TEMPLATE}
          saveButtonText="Save Terms & Conditions"
        />
      )}

      {/* MODAL: ADD / EDIT TESTIMONIAL */}
      {isTestimonialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-4">
              {editingTestimonialIdx !== null ? 'Edit Testimonial' : 'Add Testimonial'}
            </h3>

            <form onSubmit={handleSaveTestimonialModal} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Client Full Name *</label>
                <input
                  type="text"
                  required
                  value={testimonialForm.name}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, name: e.target.value })}
                  placeholder="e.g. Sumanth Rao"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Designation</label>
                  <input
                    type="text"
                    value={testimonialForm.designation}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, designation: e.target.value })}
                    placeholder="CEO, Director, etc."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Company</label>
                  <input
                    type="text"
                    value={testimonialForm.company}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, company: e.target.value })}
                    placeholder="Apex Systems"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Avatar Image URL</label>
                <input
                  type="text"
                  value={testimonialForm.avatar}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, avatar: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Rating (1 to 5 Stars)</label>
                <select
                  value={testimonialForm.rating}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, rating: parseInt(e.target.value) || 5 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={5}>★★★★★ (5 Stars)</option>
                  <option value={4}>★★★★☆ (4 Stars)</option>
                  <option value={3}>★★★☆☆ (3 Stars)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Review Quote *</label>
                <textarea
                  rows={3}
                  required
                  value={testimonialForm.review}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, review: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTestimonialModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
            <h4 key={idx} className="text-sm font-bold text-slate-900 mt-4 pb-1 border-b border-slate-200">
              {trimmed.replace(/^###\s+/, '')}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-base font-extrabold text-indigo-600 mt-5 pb-1 border-b border-indigo-100">
              {trimmed.replace(/^##\s+/, '')}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-lg font-black text-slate-900 mt-6 pb-2 border-b border-slate-200">
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

// Sub-component: Policy Editor Tab with Live Preview & Markdown Toolbar
const PolicyEditorTab = ({
  title,
  subtitle,
  badgeText,
  lastUpdated,
  value,
  onChange,
  onSave,
  isPending,
  defaultTemplate,
  saveButtonText
}) => {
  const [activeSubTab, setActiveSubTab] = useState('editor'); // 'editor', 'preview', 'split'

  const handleResetToDefault = () => {
    if (window.confirm('Reset this policy to the recommended standard template? Any unsaved edits will be replaced.')) {
      onChange(defaultTemplate);
      toast.success('Loaded recommended template. Click Save to persist.');
    }
  };

  const lineCount = value ? value.split('\n').length : 0;
  const wordCount = value ? value.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = value ? value.length : 0;

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-5xl animate-in fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {badgeText}
            </span>
            {lastUpdated && (
              <span className="text-[11px] text-slate-400">
                Last modified: {new Date(lastUpdated).toLocaleDateString()} at {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          {defaultTemplate && (
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              title="Load clean default draft"
            >
              Reset to Template
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Saving Changes...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {saveButtonText}
              </>
            )}
          </button>
        </div>
      </div>

      {/* View Toggle Tabs & Stats */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveSubTab('editor')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeSubTab === 'editor'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Markdown Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('preview')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeSubTab === 'preview'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Preview
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('split')}
            className={`hidden lg:block px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeSubTab === 'split'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Side-by-Side
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-slate-400 font-mono text-[11px]">
          <span>{lineCount} lines</span>
          <span>•</span>
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} characters</span>
        </div>
      </div>

      {/* Layout: Editor / Preview */}
      <div className={`grid gap-4 ${activeSubTab === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Textarea Editor */}
        {(activeSubTab === 'editor' || activeSubTab === 'split') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Supports Markdown headings (###), bullet lists (-), and **bold**</span>
              <span className="text-indigo-400 font-medium">Publicly visible</span>
            </div>
            <textarea
              rows={18}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Enter comprehensive policy terms here..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 leading-relaxed resize-y shadow-inner"
            />
          </div>
        )}

        {/* Live Formatted Preview */}
        {(activeSubTab === 'preview' || activeSubTab === 'split') && (
          <div className="flex flex-col">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 mb-2">
              <span className="font-semibold text-slate-300">Live Client View (Public Modal Preview)</span>
              <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px]">Real-time rendering</span>
            </div>
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-6 text-slate-800 text-xs sm:text-sm leading-relaxed overflow-y-auto max-h-[500px] shadow-sm">
              {renderFormattedPolicy(value)}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Save Bar */}
      <div className="pt-5 mt-6 border-t border-slate-800 flex items-center justify-between">
        <p className="text-[11px] text-slate-400">
          Changes will reflect immediately on the main landing page footer and customer checkout modal.
        </p>
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
        >
          {isPending ? 'Saving...' : saveButtonText}
        </button>
      </div>
    </div>
  );
};

// Recommended Templates
const DEFAULT_PRIVACY_TEMPLATE = `### 1. Information Collection & Usage
We collect company identity, official email addresses, authorized employee contact information, and branch-level parameters strictly to operate tenant workspaces and process payroll calculations.

### 2. Geofence & Location Data
Location coordinates recorded during attendance punch-in and punch-out events are exclusively utilized to verify adherence to designated branch premises. Background location is never monitored.

### 3. Financial & Payroll Security
Salary structures, employee bank account numbers, tax deductions, and EPF/ESI records are encrypted at rest with AES-256 and accessible strictly by authorized payroll controllers and respective employees.

### 4. Data Ownership & Multi-Tenant Isolation
All data generated by your organization remains the exclusive intellectual property of your enterprise. Tenant databases and cloud storage are isolated cryptographically to prevent data leakage.

### 5. Third-Party Disclosures
We never sell, rent, or trade your organization's business records or employee personal data to external marketing vendors.`;

const DEFAULT_PAYMENT_POLICY_TEMPLATE = `### 1. Payment Terms & Billing Cycle
All multi-tenant subscription tiers are billed upfront on a recurring monthly or annual billing cycle, as selected by your organization at checkout.

### 2. Supported Payment Methods
We support secure digital transactions via Razorpay, including Visa, MasterCard, RuPay, Corporate NetBanking, Unified Payments Interface (UPI), and authorized business wallets.

### 3. Taxation & GST Compliance
All listed subscription fees are subject to 18% GST under applicable Indian taxation statutes. A computerized GST tax invoice will be dispatched to your registered billing email immediately upon successful payment.

### 4. Upgrade & Proration
You can upgrade your subscription tier or expand employee quota limits at any time during an active billing cycle. The unutilized portion of your existing subscription will be credited on a pro-rata basis.

### 5. Renewal Grace Period
In the event of an automated renewal failure, organizations are granted a 3-day grace period to update billing details before tenant features transition to restricted mode.`;

const DEFAULT_REFUND_POLICY_TEMPLATE = `### 1. 7-Day Money-Back Guarantee
We provide a 7-day money-back guarantee for initial subscription purchases if our software platform does not meet your documented organizational requirements.

### 2. Refund Eligibility & Request Process
To qualify for a refund, the primary office administrator must submit an official request to contact@globalinfotech.com from the registered account email within 7 calendar days of initial plan activation.

### 3. Refund Processing Timeline
Once approved, refund transactions are credited back to the original funding source (credit card, UPI, or bank account) via Razorpay within 5 to 7 business days.

### 4. Non-Refundable Scenarios
- Plan renewals following the initial 7-day trial period.
- Custom software integration or enterprise data migration fees.
- Workspaces where active business operations exceed 7 days of platform usage.

### 5. Subscription Cancellation
You may terminate recurring billing at any point from your billing panel. Your account remains fully operational until the end of your prepaid billing period without renewal fees.`;

const DEFAULT_TERMS_TEMPLATE = `### 1. Acceptance of Terms
By subscribing to or accessing the Global Infotech SaaS platform, your enterprise agrees to be legally bound by these Terms and Conditions.

### 2. Authorized Account Usage
Organizations are responsible for maintaining confidentiality of admin credentials and ensuring user quotas adhere to the selected subscription plan.

### 3. Service Level Agreement (SLA)
We maintain a 99.9% uptime objective across all multi-tenant cluster regions, excluding scheduled maintenance windows announced at least 24 hours in advance.

### 4. Account Suspension & Termination
We reserve the right to suspend accounts engaged in abusive automated requests, intentional security circumvention, or non-payment of active subscriptions.`;

export default SuperAdminCMS;
