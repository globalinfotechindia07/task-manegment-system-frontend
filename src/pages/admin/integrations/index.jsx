import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineGlobeAlt,
  HiOutlineEnvelope,
  HiOutlineCalendarDays,
  HiOutlineBriefcase,
  HiOutlineCog6Tooth,
  HiOutlineDocumentText,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineKey,
  HiOutlineCommandLine,
  HiOutlineDocumentDuplicate,
  HiOutlineEye,
  HiOutlineTrash,
  HiOutlineUserPlus,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineMagnifyingGlass,
  HiOutlineShieldCheck,
  HiOutlineInformationCircle,
  HiOutlineXMark,
  HiOutlinePaperClip,
} from 'react-icons/hi2';
import api from '../../../api/axios';

const IntegrationsManager = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab from URL or default to 'contacts'
  const activeTab = searchParams.get('tab') || 'contacts';
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  // Search & Filters state
  const [contactSearch, setContactSearch] = useState('');
  const [contactStatus, setContactStatus] = useState('all');

  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [appointmentStatus, setAppointmentStatus] = useState('all');
  const [appointmentDate, setAppointmentDate] = useState('');

  const [careerSearch, setCareerSearch] = useState('');
  const [careerStatus, setCareerStatus] = useState('all');
  const [careerPosition, setCareerPosition] = useState('all');

  // Detail & Action Modals state
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedCareer, setSelectedCareer] = useState(null);

  // Status Change Dialog
  const [statusModalItem, setStatusModalItem] = useState(null);
  const [statusModalType, setStatusModalType] = useState(''); // 'contact' | 'appointment' | 'career'
  const [newStatus, setNewStatus] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Config Form State
  const [configForm, setConfigForm] = useState({
    websiteUrl: '',
    contactUsEndpoint: '',
    appointmentsEndpoint: '',
    careersEndpoint: '',
    authType: 'None',
    authToken: '',
    apiKeyHeaderName: 'Authorization',
    autoSyncEnabled: true,
  });

  // Test Endpoint State
  const [testingEndpoint, setTestingEndpoint] = useState(null); // 'contacts' | 'appointments' | 'careers'
  const [testResult, setTestResult] = useState(null);

  // Doc code copy state
  const [copiedSnippet, setCopiedSnippet] = useState('');

  // ===================== QUERIES =====================

  // 1. Fetch Configuration & Stats
  const { data: configData, isLoading: isConfigLoading } = useQuery({
    queryKey: ['integrationConfig'],
    queryFn: async () => {
      const { data } = await api.get('/integrations/config');
      return data;
    },
  });

  useEffect(() => {
    if (configData?.config) {
      const c = configData.config;
      setConfigForm({
        websiteUrl: c.websiteUrl || '',
        contactUsEndpoint: c.contactUsEndpoint || '',
        appointmentsEndpoint: c.appointmentsEndpoint || '',
        careersEndpoint: c.careersEndpoint || '',
        authType: c.authType || 'None',
        authToken: c.authToken || '',
        apiKeyHeaderName: c.apiKeyHeaderName || 'Authorization',
        autoSyncEnabled: c.autoSyncEnabled !== false,
      });
    }
  }, [configData]);

  // 2. Fetch Contact Enquiries
  const { data: contactData, isLoading: isContactLoading } = useQuery({
    queryKey: ['contactEnquiries', contactStatus, contactSearch],
    queryFn: async () => {
      const params = {};
      if (contactStatus !== 'all') params.status = contactStatus;
      if (contactSearch) params.search = contactSearch;
      const { data } = await api.get('/integrations/contact-enquiries', { params });
      return data;
    },
    enabled: activeTab === 'contacts',
  });

  // 3. Fetch Appointments
  const { data: appointmentData, isLoading: isAppointmentLoading } = useQuery({
    queryKey: ['appointments', appointmentStatus, appointmentDate, appointmentSearch],
    queryFn: async () => {
      const params = {};
      if (appointmentStatus !== 'all') params.status = appointmentStatus;
      if (appointmentDate) params.date = appointmentDate;
      if (appointmentSearch) params.search = appointmentSearch;
      const { data } = await api.get('/integrations/appointments', { params });
      return data;
    },
    enabled: activeTab === 'appointments',
  });

  // 4. Fetch Career Applications
  const { data: careerData, isLoading: isCareerLoading } = useQuery({
    queryKey: ['careerApplications', careerStatus, careerPosition, careerSearch],
    queryFn: async () => {
      const params = {};
      if (careerStatus !== 'all') params.status = careerStatus;
      if (careerPosition !== 'all') params.position = careerPosition;
      if (careerSearch) params.search = careerSearch;
      const { data } = await api.get('/integrations/career-applications', { params });
      return data;
    },
    enabled: activeTab === 'careers',
  });

  // ===================== MUTATIONS =====================

  // Save Config
  const saveConfigMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.put('/integrations/config', payload);
      return data;
    },
    onSuccess: () => {
      toast.success('API Configuration saved successfully!');
      queryClient.invalidateQueries(['integrationConfig']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save configuration');
    },
  });

  // Regenerate Inbound API Key
  const regenerateKeyMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/integrations/config/regenerate-key');
      return data;
    },
    onSuccess: () => {
      toast.success('Inbound Webhook API Key regenerated!');
      queryClient.invalidateQueries(['integrationConfig']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to regenerate key');
    },
  });

  // Sync Outbound Feeds
  const syncMutation = useMutation({
    mutationFn: async (feed = 'all') => {
      const { data } = await api.post('/integrations/sync', { feed });
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Sync completed successfully!');
      queryClient.invalidateQueries(['integrationConfig']);
      queryClient.invalidateQueries(['contactEnquiries']);
      queryClient.invalidateQueries(['appointments']);
      queryClient.invalidateQueries(['careerApplications']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Sync failed');
    },
  });

  // Test Endpoint
  const testEndpointMutation = useMutation({
    mutationFn: async ({ url, type }) => {
      setTestingEndpoint(type);
      setTestResult(null);
      const { data } = await api.post('/integrations/test-endpoint', {
        url,
        authType: configForm.authType,
        authToken: configForm.authToken,
        apiKeyHeaderName: configForm.apiKeyHeaderName,
      });
      return data;
    },
    onSuccess: (data) => {
      setTestResult({ success: true, data });
      toast.success(`Connection OK! Found ${data.itemsCount} item(s) in response.`);
    },
    onError: (err) => {
      setTestResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Connection test failed',
      });
      toast.error(err.response?.data?.message || 'Connection test failed');
    },
    onSettled: () => {
      setTestingEndpoint(null);
    },
  });

  // Update Status / Notes
  const updateStatusMutation = useMutation({
    mutationFn: async ({ type, id, status, notes }) => {
      let endpoint = '';
      if (type === 'contact') endpoint = `/integrations/contact-enquiries/${id}`;
      else if (type === 'appointment') endpoint = `/integrations/appointments/${id}`;
      else if (type === 'career') endpoint = `/integrations/career-applications/${id}`;

      const { data } = await api.patch(endpoint, { status, internalNotes: notes });
      return data;
    },
    onSuccess: () => {
      toast.success('Status updated successfully!');
      setStatusModalItem(null);
      queryClient.invalidateQueries(['contactEnquiries']);
      queryClient.invalidateQueries(['appointments']);
      queryClient.invalidateQueries(['careerApplications']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update status');
    },
  });

  // Convert Contact Enquiry to CRM Lead
  const convertToLeadMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/integrations/contact-enquiries/${id}/convert-lead`);
      return data;
    },
    onSuccess: () => {
      toast.success('Enquiry converted to CRM Lead successfully!');
      queryClient.invalidateQueries(['contactEnquiries']);
      queryClient.invalidateQueries(['leads']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to convert to lead');
    },
  });

  // Delete Item Mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }) => {
      let endpoint = '';
      if (type === 'contact') endpoint = `/integrations/contact-enquiries/${id}`;
      else if (type === 'appointment') endpoint = `/integrations/appointments/${id}`;
      else if (type === 'career') endpoint = `/integrations/career-applications/${id}`;

      const { data } = await api.delete(endpoint);
      return data;
    },
    onSuccess: () => {
      toast.success('Item deleted successfully');
      queryClient.invalidateQueries(['contactEnquiries']);
      queryClient.invalidateQueries(['appointments']);
      queryClient.invalidateQueries(['careerApplications']);
      queryClient.invalidateQueries(['integrationConfig']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete');
    },
  });

  // Copy helper
  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(label);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedSnippet(''), 2500);
  };

  // Status badge styling helper
  const getStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'pending':
      case 'received':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'in_progress':
      case 'under_review':
      case 'contacted':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'confirmed':
      case 'shortlisted':
      case 'resolved':
      case 'hired':
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'interview_scheduled':
      case 'rescheduled':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'cancelled':
      case 'rejected':
      case 'spam':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const config = configData?.config;
  const stats = configData?.stats;

  return (
    <div className="space-y-6 pb-12">
      {/* ===================== PAGE HEADER & QUICK STATS ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Website & Third-Party API Integrations
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Connect your official company website feeds (Contact Enquiries, Appointments, and Career
            Applications) into your central dashboard.
          </p>
        </div>

        {/* Global Sync Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => syncMutation.mutate('all')}
            disabled={syncMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-60 cursor-pointer"
          >
            <HiOutlineArrowPath className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            <span>{syncMutation.isPending ? 'Syncing Feeds...' : 'Sync All Feeds'}</span>
          </button>
        </div>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div
          onClick={() => setActiveTab('contacts')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'contacts'
              ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/10'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Contact Enquiries
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <HiOutlineEnvelope className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats?.enquiries ?? 0}</span>
            <span className="text-[11px] text-slate-500">total received</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Endpoint:</span>
            <span className="font-mono text-slate-600 truncate max-w-[170px]">
              {config?.contactUsEndpoint ? 'Configured' : 'Not setup'}
            </span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('appointments')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'appointments'
              ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/10'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Appointments
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <HiOutlineCalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats?.appointments ?? 0}</span>
            <span className="text-[11px] text-slate-500">total booked</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Endpoint:</span>
            <span className="font-mono text-slate-600 truncate max-w-[170px]">
              {config?.appointmentsEndpoint ? 'Configured' : 'Not setup'}
            </span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('careers')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'careers'
              ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/10'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Career Applications
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HiOutlineBriefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats?.careers ?? 0}</span>
            <span className="text-[11px] text-slate-500">applicants</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Endpoint:</span>
            <span className="font-mono text-slate-600 truncate max-w-[170px]">
              {config?.careersEndpoint ? 'Configured' : 'Not setup'}
            </span>
          </div>
        </div>
      </div>

      {/* ===================== TABS NAVIGATION ===================== */}
      <div className="border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-2xs flex items-center gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('contacts')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'contacts'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <HiOutlineEnvelope className="w-4 h-4" />
          <span>Contact Us ({stats?.enquiries ?? 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appointments')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'appointments'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <HiOutlineCalendarDays className="w-4 h-4" />
          <span>Appointments ({stats?.appointments ?? 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('careers')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'careers'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <HiOutlineBriefcase className="w-4 h-4" />
          <span>Career Applications ({stats?.careers ?? 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'config'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <HiOutlineCog6Tooth className="w-4 h-4" />
          <span>API Configuration</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('docs')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'docs'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <HiOutlineCommandLine className="w-4 h-4" />
          <span>API Docs & Schemas</span>
        </button>
      </div>

      {/* ===================== TAB 1: CONTACT ENQUIRIES ===================== */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[240px]">
                <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Search by name, email, subject..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={contactStatus}
                onChange={(e) => setContactStatus(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="spam">Spam</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => syncMutation.mutate('contact-us')}
                disabled={syncMutation.isPending}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <HiOutlineArrowPath className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                <span>Sync Contacts</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {isContactLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <HiOutlineArrowPath className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                Loading contact enquiries...
              </div>
            ) : contactData?.enquiries?.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                  <HiOutlineEnvelope className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">No Contact Enquiries Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Connect your website API endpoint in the Configuration tab or use &quot;Sync Contacts&quot; to fetch latest messages.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Contact Person</th>
                      <th className="py-3 px-4">Subject & Message</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Received At</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {contactData?.enquiries?.map((c) => (
                      <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>{c.email}</span>
                            {c.mobile && (
                              <>
                                <span>•</span>
                                <span className="font-mono">{c.mobile}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-semibold text-slate-800 truncate">{c.subject}</div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{c.message}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(
                              c.status
                            )}`}
                          >
                            {c.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                          {c.externalCreatedAt || new Date(c.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* View Message Modal */}
                            <button
                              type="button"
                              onClick={() => setSelectedContact(c)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="View Full Message"
                            >
                              <HiOutlineEye className="w-4 h-4" />
                            </button>

                            {/* Convert to Lead */}
                            {!c.convertedToLeadId && (
                              <button
                                type="button"
                                onClick={() => convertToLeadMutation.mutate(c._id)}
                                disabled={convertToLeadMutation.isPending}
                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Convert to CRM Lead"
                              >
                                <HiOutlineUserPlus className="w-4 h-4" />
                              </button>
                            )}

                            {/* Update Status */}
                            <button
                              type="button"
                              onClick={() => {
                                setStatusModalItem(c);
                                setStatusModalType('contact');
                                setNewStatus(c.status);
                                setInternalNotes(c.internalNotes || '');
                              }}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Update Status"
                            >
                              <HiOutlinePencilSquare className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this enquiry?')) {
                                  deleteMutation.mutate({ type: 'contact', id: c._id });
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 2: APPOINTMENTS ===================== */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[220px]">
                <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={appointmentSearch}
                  onChange={(e) => setAppointmentSearch(e.target.value)}
                  placeholder="Search by client, ID, service..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={appointmentStatus}
                onChange={(e) => setAppointmentStatus(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>

              {/* Date Filter */}
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
              />
              {appointmentDate && (
                <button
                  type="button"
                  onClick={() => setAppointmentDate('')}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear date
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => syncMutation.mutate('appointments')}
                disabled={syncMutation.isPending}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <HiOutlineArrowPath className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                <span>Sync Appointments</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {isAppointmentLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <HiOutlineArrowPath className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                Loading booked appointments...
              </div>
            ) : appointmentData?.appointments?.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                  <HiOutlineCalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">No Appointments Found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Bookings submitted on your website API endpoint will appear here automatically.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Booking ID</th>
                      <th className="py-3 px-4">Client Details</th>
                      <th className="py-3 px-4">Requested Service</th>
                      <th className="py-3 px-4">Scheduled Slot</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {appointmentData?.appointments?.map((apt) => (
                      <tr key={apt._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                          {apt.appointmentId || apt.externalId || 'APT-ONLINE'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{apt.name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>{apt.email}</span>
                            {apt.mobile && (
                              <>
                                <span>•</span>
                                <span className="font-mono">{apt.mobile}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800">{apt.service}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <HiOutlineCalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{apt.appointmentDate || 'Not specified'}</span>
                          </div>
                          {apt.appointmentTime && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <HiOutlineClock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{apt.appointmentTime}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(
                              apt.status
                            )}`}
                          >
                            {apt.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Update Status */}
                            <button
                              type="button"
                              onClick={() => {
                                setStatusModalItem(apt);
                                setStatusModalType('appointment');
                                setNewStatus(apt.status);
                                setInternalNotes(apt.internalNotes || '');
                              }}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Update Status"
                            >
                              <HiOutlinePencilSquare className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this appointment?')) {
                                  deleteMutation.mutate({ type: 'appointment', id: apt._id });
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 3: CAREER APPLICATIONS ===================== */}
      {activeTab === 'careers' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[220px]">
                <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={careerSearch}
                  onChange={(e) => setCareerSearch(e.target.value)}
                  placeholder="Search candidate, role, location..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={careerStatus}
                onChange={(e) => setCareerStatus(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="received">Received</option>
                <option value="under_review">Under Review</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview_scheduled">Interview Scheduled</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>

              {/* Position Filter */}
              {careerData?.positions?.length > 0 && (
                <select
                  value={careerPosition}
                  onChange={(e) => setCareerPosition(e.target.value)}
                  className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">All Positions</option>
                  {careerData.positions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => syncMutation.mutate('careers')}
                disabled={syncMutation.isPending}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <HiOutlineArrowPath className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                <span>Sync Careers</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {isCareerLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <HiOutlineArrowPath className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                Loading job candidates...
              </div>
            ) : careerData?.applications?.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                  <HiOutlineBriefcase className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">No Job Applications Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Connect your careers endpoint or submit resumes via API to populate your talent pool.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Candidate & Role</th>
                      <th className="py-3 px-4">Experience & Location</th>
                      <th className="py-3 px-4">CTC & Notice</th>
                      <th className="py-3 px-4">Resume</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {careerData?.applications?.map((app) => (
                      <tr key={app._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{app.name}</div>
                          <div className="text-[11px] font-semibold text-indigo-600">{app.position}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>{app.email}</span>
                            {app.mobile && (
                              <>
                                <span>•</span>
                                <span className="font-mono">{app.mobile}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">
                            {app.experience || 'Not specified'}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {app.currentLocation || 'Location N/A'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-[11px] text-slate-600">
                            Current: <span className="font-bold text-slate-800">{app.currentCtc || 'N/A'}</span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            Expected: <span className="font-bold text-emerald-700">{app.expectedCtc || 'N/A'}</span>
                          </div>
                          {app.noticePeriod && (
                            <div className="text-[10px] text-slate-400 mt-0.5">Notice: {app.noticePeriod}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {app.resumeUrl ? (
                            <a
                              href={app.resumeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition-colors border border-indigo-200"
                            >
                              <HiOutlinePaperClip className="w-3.5 h-3.5" />
                              <span>View PDF</span>
                              <HiOutlineArrowTopRightOnSquare className="w-3 h-3 ml-0.5" />
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">No URL</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(
                              app.status
                            )}`}
                          >
                            {app.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Update Status */}
                            <button
                              type="button"
                              onClick={() => {
                                setStatusModalItem(app);
                                setStatusModalType('career');
                                setNewStatus(app.status);
                                setInternalNotes(app.internalNotes || '');
                              }}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Update Status"
                            >
                              <HiOutlinePencilSquare className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this candidate application?')) {
                                  deleteMutation.mutate({ type: 'career', id: app._id });
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 4: API CONFIGURATION ===================== */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <HiOutlineGlobeAlt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Third-Party & Official Website Endpoints</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Save the GET API URLs of your external website. The system will query these endpoints and
                    populate your dashboard.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveConfigMutation.mutate(configForm);
              }}
              className="p-5 sm:p-6 space-y-6"
            >
              {/* Base Website Domain */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Official Website Base URL (Domain)</label>
                <div className="relative">
                  <HiOutlineGlobeAlt className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={configForm.websiteUrl}
                    onChange={(e) => setConfigForm({ ...configForm, websiteUrl: e.target.value })}
                    placeholder="https://yourdomain.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Used as fallback base URL if relative paths are entered below.
                </p>
              </div>

              {/* Endpoint 1: Contact Us */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <HiOutlineEnvelope className="w-4 h-4 text-blue-600" />
                    <span>1. Contact Us Enquiries Endpoint (GET)</span>
                  </label>
                  {configForm.contactUsEndpoint && (
                    <button
                      type="button"
                      onClick={() =>
                        testEndpointMutation.mutate({ url: configForm.contactUsEndpoint, type: 'contacts' })
                      }
                      disabled={testingEndpoint === 'contacts'}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-indigo-600 border border-slate-200 text-[11px] font-bold shadow-2xs cursor-pointer"
                    >
                      {testingEndpoint === 'contacts' ? 'Testing...' : 'Test Endpoint'}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={configForm.contactUsEndpoint}
                  onChange={(e) => setConfigForm({ ...configForm, contactUsEndpoint: e.target.value })}
                  placeholder="https://yourdomain.com/api/v1/contact-us"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-500 block">
                  Expected JSON response: <code>{`{ "success": true, "data": [{ "id": 101, "name": "...", "email": "...", "mobile": "...", "subject": "...", "message": "..." }] }`}</code>
                </span>
              </div>

              {/* Endpoint 2: Appointments */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <HiOutlineCalendarDays className="w-4 h-4 text-purple-600" />
                    <span>2. Appointments Booking Endpoint (GET)</span>
                  </label>
                  {configForm.appointmentsEndpoint && (
                    <button
                      type="button"
                      onClick={() =>
                        testEndpointMutation.mutate({ url: configForm.appointmentsEndpoint, type: 'appointments' })
                      }
                      disabled={testingEndpoint === 'appointments'}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-indigo-600 border border-slate-200 text-[11px] font-bold shadow-2xs cursor-pointer"
                    >
                      {testingEndpoint === 'appointments' ? 'Testing...' : 'Test Endpoint'}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={configForm.appointmentsEndpoint}
                  onChange={(e) => setConfigForm({ ...configForm, appointmentsEndpoint: e.target.value })}
                  placeholder="https://yourdomain.com/api/v1/appointments"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-500 block">
                  Expected JSON response: <code>{`{ "success": true, "data": [{ "id": 201, "appointment_id": "APT-00201", "name": "...", "service": "...", "appointment_date": "YYYY-MM-DD", "appointment_time": "HH:MM" }] }`}</code>
                </span>
              </div>

              {/* Endpoint 3: Careers */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <HiOutlineBriefcase className="w-4 h-4 text-emerald-600" />
                    <span>3. Careers / Job Applications Endpoint (GET)</span>
                  </label>
                  {configForm.careersEndpoint && (
                    <button
                      type="button"
                      onClick={() =>
                        testEndpointMutation.mutate({ url: configForm.careersEndpoint, type: 'careers' })
                      }
                      disabled={testingEndpoint === 'careers'}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-indigo-600 border border-slate-200 text-[11px] font-bold shadow-2xs cursor-pointer"
                    >
                      {testingEndpoint === 'careers' ? 'Testing...' : 'Test Endpoint'}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={configForm.careersEndpoint}
                  onChange={(e) => setConfigForm({ ...configForm, careersEndpoint: e.target.value })}
                  placeholder="https://yourdomain.com/api/v1/careers/applications"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-500 block">
                  Expected JSON response: <code>{`{ "success": true, "data": [{ "id": 301, "application_id": "JOB-00301", "name": "...", "position": "...", "experience": "...", "current_ctc": "...", "resume_url": "..." }] }`}</code>
                </span>
              </div>

              {/* Authentication Settings */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center gap-2">
                  <HiOutlineShieldCheck className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-slate-900 text-xs">External API Security & Authentication</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Authentication Method</label>
                    <select
                      value={configForm.authType}
                      onChange={(e) => setConfigForm({ ...configForm, authType: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="None">None (Public API)</option>
                      <option value="Bearer Token">Bearer Token (Authorization: Bearer ...)</option>
                      <option value="API Key Header">API Key Header (x-api-key: ...)</option>
                      <option value="Custom Header">Custom Header</option>
                    </select>
                  </div>

                  {configForm.authType !== 'None' && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        {configForm.authType === 'Bearer Token' ? 'Token Value' : 'API Key Value'}
                      </label>
                      <input
                        type="password"
                        value={configForm.authToken}
                        onChange={(e) => setConfigForm({ ...configForm, authToken: e.target.value })}
                        placeholder="Paste secret token..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saveConfigMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {saveConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>

          {/* Inbound Webhook Key Card (Alternative Push Mode) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <HiOutlineKey className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Direct Webhook Inbound API Key (Push Mode)</h4>
                  <p className="text-[11px] text-slate-500">
                    If your website prefer pushing data instantly when visitors submit forms.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Regenerating this key will break existing website form integrations until updated. Continue?')) {
                    regenerateKeyMutation.mutate();
                  }
                }}
                disabled={regenerateKeyMutation.isPending}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Regenerate Key
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={config?.inboundApiKey || 'Loading...'}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 select-all"
              />
              <button
                type="button"
                onClick={() => handleCopy(config?.inboundApiKey, 'API Key')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <HiOutlineDocumentDuplicate className="w-4 h-4" />
                <span>{copiedSnippet === 'API Key' ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 5: API DOCUMENTATION & DEVELOPER GUIDE ===================== */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <HiOutlineCommandLine className="w-6 h-6 text-indigo-600" />
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Third-Party API Implementation Documentation
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Share this specification with your website developer to format your website API or webhooks so they
                seamlessly connect with your ERP dashboard.
              </p>
            </div>

            {/* Section 1: Overview */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Two Integration Modes Available:
              </span>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li>
                  <strong className="text-slate-900">Mode A - Outbound Polling (Pull)</strong>: Your official website provides
                  the 3 standard GET endpoints below. Our dashboard periodically polls/fetches them.
                </li>
                <li>
                  <strong className="text-slate-900">Mode B - Real-Time Webhook (Push)</strong>: Whenever a user submits a form on
                  your website, your server directly POSTs the payload to our webhook with your <code>x-api-key</code>.
                </li>
              </ul>
            </div>

            {/* Spec 1: Contact Us */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>1. Contact Us Enquiries Specification</span>
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      JSON.stringify(
                        {
                          success: true,
                          message: 'Contact enquiries fetched successfully.',
                          data: [
                            {
                              id: 101,
                              name: 'Dinesh Tawade',
                              email: 'dinesh@example.com',
                              mobile: '9876543210',
                              subject: 'Website Development',
                              message: 'I want to discuss a project.',
                              status: 'pending',
                              created_at: '2026-11-04 16:00:00',
                            },
                          ],
                        },
                        null,
                        2
                      ),
                      'Contact Spec'
                    )
                  }
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <HiOutlineDocumentDuplicate className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </button>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono">
                <code>GET https://yourdomain.com/api/v1/contact-us</code>
              </div>

              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto">
{`{
  "success": true,
  "message": "Contact enquiries fetched successfully.",
  "data": [
    {
      "id": 101,
      "name": "Dinesh Tawade",
      "email": "dinesh@example.com",
      "mobile": "9876543210",
      "subject": "Website Development",
      "message": "I want to discuss a project.",
      "status": "pending",
      "created_at": "2026-11-04 16:00:00"
    }
  ]
}`}
              </pre>
            </div>

            {/* Spec 2: Appointments */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>2. Appointments Booking Specification</span>
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      JSON.stringify(
                        {
                          success: true,
                          message: 'Appointments fetched successfully.',
                          data: [
                            {
                              id: 201,
                              appointment_id: 'APT-00201',
                              name: 'Dinesh Tawade',
                              email: 'dinesh@example.com',
                              mobile: '9876543210',
                              service: 'Software Consultation',
                              appointment_date: '2026-11-10',
                              appointment_time: '11:30',
                              status: 'pending',
                              created_at: '2026-11-04 16:00:00',
                            },
                          ],
                        },
                        null,
                        2
                      ),
                      'Appointments Spec'
                    )
                  }
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <HiOutlineDocumentDuplicate className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </button>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono">
                <code>GET https://yourdomain.com/api/v1/appointments</code>
              </div>

              <pre className="bg-slate-900 text-purple-300 p-4 rounded-xl text-xs font-mono overflow-x-auto">
{`{
  "success": true,
  "message": "Appointments fetched successfully.",
  "data": [
    {
      "id": 201,
      "appointment_id": "APT-00201",
      "name": "Dinesh Tawade",
      "email": "dinesh@example.com",
      "mobile": "9876543210",
      "service": "Software Consultation",
      "appointment_date": "2026-11-10",
      "appointment_time": "11:30",
      "status": "pending",
      "created_at": "2026-11-04 16:00:00"
    }
  ]
}`}
              </pre>
            </div>

            {/* Spec 3: Careers */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>3. Careers / Job Applications Specification</span>
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      JSON.stringify(
                        {
                          success: true,
                          message: 'Career applications fetched successfully.',
                          data: [
                            {
                              id: 301,
                              application_id: 'JOB-00301',
                              name: 'Dinesh Tawade',
                              email: 'dinesh@example.com',
                              mobile: '9876543210',
                              position: 'Full Stack Developer',
                              experience: '3 Years',
                              current_location: 'Nagpur',
                              current_ctc: '5.5 LPA',
                              expected_ctc: '7 LPA',
                              notice_period: '15 Days',
                              resume_url: 'https://yourdomain.com/storage/resumes/resume.pdf',
                              status: 'received',
                              created_at: '2026-11-04 16:00:00',
                            },
                          ],
                        },
                        null,
                        2
                      ),
                      'Careers Spec'
                    )
                  }
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <HiOutlineDocumentDuplicate className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </button>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono">
                <code>GET https://yourdomain.com/api/v1/careers/applications</code>
              </div>

              <pre className="bg-slate-900 text-amber-300 p-4 rounded-xl text-xs font-mono overflow-x-auto">
{`{
  "success": true,
  "message": "Career applications fetched successfully.",
  "data": [
    {
      "id": 301,
      "application_id": "JOB-00301",
      "name": "Dinesh Tawade",
      "email": "dinesh@example.com",
      "mobile": "9876543210",
      "position": "Full Stack Developer",
      "experience": "3 Years",
      "current_location": "Nagpur",
      "current_ctc": "5.5 LPA",
      "expected_ctc": "7 LPA",
      "notice_period": "15 Days",
      "resume_url": "https://yourdomain.com/storage/resumes/resume.pdf",
      "status": "received",
      "created_at": "2026-11-04 16:00:00"
    }
  ]
}`}
              </pre>
            </div>

            {/* Section 4: Webhook Push Code Snippets */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">
                Direct Webhook (Push) Integration (PHP / WordPress / JavaScript)
              </h4>
              <p className="text-xs text-slate-500">
                To push data directly on form submit, send a <code>POST</code> request with your Inbound API Key:
              </p>

              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto">
{`// cURL Example:
curl -X POST "${window.location.origin}/api/integrations/webhook/contact-us" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${config?.inboundApiKey || 'YOUR_INBOUND_API_KEY'}" \\
  -d '{
    "name": "Dinesh Tawade",
    "email": "dinesh@example.com",
    "mobile": "9876543210",
    "subject": "Website Development",
    "message": "I want to discuss a project."
  }'`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ===================== VIEW DETAIL MODAL (CONTACT ENQUIRY) ===================== */}
      {selectedContact && (
        <div
          onClick={() => setSelectedContact(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Enquiry Details</h3>
                <span className="text-[11px] text-slate-500">{selectedContact.externalCreatedAt}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Sender</span>
                  <span className="font-bold text-slate-900">{selectedContact.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Mobile</span>
                  <span className="font-mono text-slate-800">{selectedContact.mobile || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Email</span>
                  <a href={`mailto:${selectedContact.email}`} className="text-indigo-600 underline">
                    {selectedContact.email}
                  </a>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Subject</span>
                <p className="font-semibold text-slate-900">{selectedContact.subject}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Message Body</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedContact.message}
                </div>
              </div>

              {selectedContact.internalNotes && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
                    Internal Staff Notes
                  </span>
                  <p className="text-slate-600 italic bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    {selectedContact.internalNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== UPDATE STATUS & NOTES MODAL ===================== */}
      {statusModalItem && (
        <div
          onClick={() => setStatusModalItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                Update Status & Internal Notes
              </h3>
              <button
                type="button"
                onClick={() => setStatusModalItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {statusModalType === 'contact' && (
                    <>
                      <option value="pending">Pending</option>
                      <option value="contacted">Contacted</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="spam">Spam</option>
                    </>
                  )}
                  {statusModalType === 'appointment' && (
                    <>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="rescheduled">Rescheduled</option>
                    </>
                  )}
                  {statusModalType === 'career' && (
                    <>
                      <option value="received">Received</option>
                      <option value="under_review">Under Review</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="interview_scheduled">Interview Scheduled</option>
                      <option value="hired">Hired</option>
                      <option value="rejected">Rejected</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Internal Staff Notes</label>
                <textarea
                  rows={3}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Add private staff comments or follow-up details..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setStatusModalItem(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  updateStatusMutation.mutate({
                    type: statusModalType,
                    id: statusModalItem._id,
                    status: newStatus,
                    notes: internalNotes,
                  })
                }
                disabled={updateStatusMutation.isPending}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
              >
                {updateStatusMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationsManager;

