import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  HiOutlineCreditCard, 
  HiOutlineShieldCheck, 
  HiOutlineCurrencyRupee, 
  HiOutlineArrowPath, 
  HiOutlineDocumentText, 
  HiOutlineInformationCircle, 
  HiOutlineStar, 
  HiOutlineEnvelope, 
  HiOutlinePlus, 
  HiOutlinePencilSquare, 
  HiOutlineTrash, 
  HiOutlineXMark, 
  HiOutlineCheck 
} from 'react-icons/hi2';
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
    onSuccess: () => {
      toast.success('Website content updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['adminSiteContent'] });
      queryClient.invalidateQueries({ queryKey: ['publicSiteContent'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update content');
    }
  });

  const handleSaveGateway = (e) => {
    e.preventDefault();
    updateMutation.mutate({ paymentGateway });
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
      <div className="p-12 flex justify-center items-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'gateway', name: 'Razorpay Gateway', icon: HiOutlineCreditCard },
    { id: 'privacy', name: 'Privacy Policy', icon: HiOutlineShieldCheck },
    { id: 'payment-policy', name: 'Payment Policy & Billing', icon: HiOutlineCurrencyRupee },
    { id: 'refund-policy', name: 'Refund & Cancellation', icon: HiOutlineArrowPath },
    { id: 'terms', name: 'Terms & Conditions', icon: HiOutlineDocumentText },
    { id: 'about', name: 'About Us Page', icon: HiOutlineInformationCircle },
    { id: 'testimonials', name: 'User Reviews', icon: HiOutlineStar },
    { id: 'contact', name: 'Contact Us', icon: HiOutlineEnvelope }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Main Website CMS & Payment Gateway</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Dynamically manage the public landing page content, terms, privacy, reviews, and Razorpay API credentials.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* TAB 1: RAZORPAY PAYMENT GATEWAY */}
      {activeTab === 'gateway' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs max-w-3xl animate-in fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Razorpay API Credentials</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enable online payments so organizations can directly subscribe and renew plans via cards, UPI, and NetBanking.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  paymentGateway.isEnabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {paymentGateway.isEnabled ? 'Enabled & Live' : 'Disabled'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveGateway} className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <input
                type="checkbox"
                id="enableGateway"
                checked={paymentGateway.isEnabled}
                onChange={(e) => setPaymentGateway({ ...paymentGateway, isEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="enableGateway" className="text-sm font-medium text-slate-800 cursor-pointer">
                Enable Online Razorpay Gateway on Subscription Plans
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                RAZORPAY_KEY_ID *
              </label>
              <input
                type="text"
                value={paymentGateway.razorpayKeyId}
                onChange={(e) => setPaymentGateway({ ...paymentGateway, razorpayKeyId: e.target.value })}
                placeholder="rzp_live_xxxxxxxx or rzp_test_xxxxxxxx"
                className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">This key is exposed to the frontend checkout modal safely.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                RAZORPAY_KEY_SECRET *
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={paymentGateway.razorpayKeySecret}
                  onChange={(e) => setPaymentGateway({ ...paymentGateway, razorpayKeySecret: e.target.value })}
                  placeholder="Enter your confidential Razorpay Key Secret"
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-2 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                >
                  {showSecret ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Kept strictly secret on the backend for signature verification.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Code</label>
              <input
                type="text"
                value={paymentGateway.currency}
                onChange={(e) => setPaymentGateway({ ...paymentGateway, currency: e.target.value.toUpperCase() })}
                placeholder="INR"
                className="w-32 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Razorpay Credentials'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: ABOUT US */}
      {activeTab === 'about' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs max-w-3xl animate-in fade-in">
          <h2 className="text-lg font-bold text-slate-900 mb-0.5">About Us Page Content</h2>
          <p className="text-xs text-slate-500 mb-6">Manage company overview, mission, vision, and hero image shown on the landing page.</p>

          <form onSubmit={handleSaveAbout} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Section Badge Tag</label>
                <input
                  type="text"
                  value={aboutUs.badge}
                  onChange={(e) => setAboutUs({ ...aboutUs, badge: e.target.value })}
                  placeholder="e.g. About Global Infotech"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Feature Image URL</label>
                <input
                  type="text"
                  value={aboutUs.imageUrl}
                  onChange={(e) => setAboutUs({ ...aboutUs, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Main Headline</label>
              <input
                type="text"
                value={aboutUs.title}
                onChange={(e) => setAboutUs({ ...aboutUs, title: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Description</label>
              <textarea
                rows={4}
                value={aboutUs.description}
                onChange={(e) => setAboutUs({ ...aboutUs, description: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Our Mission</label>
                <textarea
                  rows={3}
                  value={aboutUs.mission}
                  onChange={(e) => setAboutUs({ ...aboutUs, mission: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Our Vision</label>
                <textarea
                  rows={3}
                  value={aboutUs.vision}
                  onChange={(e) => setAboutUs({ ...aboutUs, vision: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
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
              <h2 className="text-lg font-bold text-slate-900">Client Testimonials & Reviews</h2>
              <p className="text-xs text-slate-500 mt-0.5">Customer feedback showcased on the landing page.</p>
            </div>
            <button
              onClick={handleOpenAddTestimonial}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <HiOutlinePlus className="w-4 h-4" />
              Add Review
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonialsList?.map((item, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 mb-2 text-amber-500">
                    {[...Array(item.rating || 5)].map((_, i) => (
                      <HiOutlineStar key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-700 italic mb-4 leading-relaxed">"{item.review}"</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src={item.avatar} alt={item.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{item.name}</p>
                      <p className="text-[10px] text-slate-500">{item.designation}, {item.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditTestimonial(idx)}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <HiOutlinePencilSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTestimonial(idx)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
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
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs max-w-3xl animate-in fade-in">
          <h2 className="text-lg font-bold text-slate-900 mb-0.5">Contact Us Settings</h2>
          <p className="text-xs text-slate-500 mb-6">Contact details displayed on the landing page and footer.</p>

          <form onSubmit={handleSaveContact} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Section Title</label>
              <input
                type="text"
                value={contactInfo.title}
                onChange={(e) => setContactInfo({ ...contactInfo, title: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subtitle / Description</label>
              <input
                type="text"
                value={contactInfo.description}
                onChange={(e) => setContactInfo({ ...contactInfo, description: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Support Email</label>
                <input
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={contactInfo.phone}
                  onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Office Address</label>
              <input
                type="text"
                value={contactInfo.address}
                onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Working / Support Hours</label>
              <input
                type="text"
                value={contactInfo.supportHours}
                onChange={(e) => setContactInfo({ ...contactInfo, supportHours: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsTestimonialModalOpen(false)}></div>
          <div className="relative bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingTestimonialIdx !== null ? 'Edit Testimonial' : 'Add Testimonial'}
              </h3>
              <button onClick={() => setIsTestimonialModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTestimonialModal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client Full Name *</label>
                <input
                  type="text"
                  required
                  value={testimonialForm.name}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, name: e.target.value })}
                  placeholder="e.g. Sumanth Rao"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={testimonialForm.designation}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, designation: e.target.value })}
                    placeholder="CEO, Director, etc."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={testimonialForm.company}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, company: e.target.value })}
                    placeholder="Apex Systems"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Avatar Image URL</label>
                <input
                  type="text"
                  value={testimonialForm.avatar}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, avatar: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rating (1 to 5 Stars)</label>
                <select
                  value={testimonialForm.rating}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, rating: parseInt(e.target.value) || 5 })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value={5}>5 Stars</option>
                  <option value={4}>4 Stars</option>
                  <option value={3}>3 Stars</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Review Quote *</label>
                <textarea
                  rows={3}
                  required
                  value={testimonialForm.review}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, review: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsTestimonialModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
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
  const [activeSubTab, setActiveSubTab] = useState('editor');

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
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs max-w-5xl animate-in fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {badgeText}
            </span>
            {lastUpdated && (
              <span className="text-[11px] text-slate-400">
                Last modified: {new Date(lastUpdated).toLocaleDateString()} at {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          {defaultTemplate && (
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
              title="Load clean default draft"
            >
              Reset to Template
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isPending ? 'Saving...' : (
              <>
                <HiOutlineCheck className="w-4 h-4" />
                {saveButtonText}
              </>
            )}
          </button>
        </div>
      </div>

      {/* View Toggle Tabs & Stats */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveSubTab('editor')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              activeSubTab === 'editor'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Markdown Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('preview')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              activeSubTab === 'preview'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live Preview
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('split')}
            className={`hidden lg:block px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              activeSubTab === 'split'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Side-by-Side
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-slate-500 font-mono text-[11px]">
          <span>{lineCount} lines</span>
          <span>•</span>
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} characters</span>
        </div>
      </div>

      {/* Layout: Editor / Preview */}
      <div className={`grid gap-4 ${activeSubTab === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {(activeSubTab === 'editor' || activeSubTab === 'split') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>Supports Markdown headings (###), bullet lists (-), and **bold**</span>
              <span className="text-indigo-600 font-medium">Publicly visible</span>
            </div>
            <textarea
              rows={18}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Enter comprehensive policy terms here..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed resize-y"
            />
          </div>
        )}

        {(activeSubTab === 'preview' || activeSubTab === 'split') && (
          <div className="flex flex-col">
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 mb-2">
              <span className="font-semibold text-slate-700">Live Client View (Public Modal Preview)</span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px]">Real-time rendering</span>
            </div>
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-6 text-slate-800 text-xs sm:text-sm leading-relaxed overflow-y-auto max-h-[500px]">
              {renderFormattedPolicy(value)}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Save Bar */}
      <div className="pt-4 mt-6 border-t border-slate-200 flex items-center justify-between">
        <p className="text-[11px] text-slate-500">
          Changes will reflect immediately on the main landing page footer and customer checkout modal.
        </p>
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
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