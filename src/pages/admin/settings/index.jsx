import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineXMark,
  HiOutlineBriefcase,
  HiOutlineUserCircle,
  HiOutlineBuildingOffice2,
  HiOutlinePlus,
  HiOutlineCog6Tooth,
  HiOutlineEnvelope,
  HiOutlinePaperAirplane,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineShieldCheck,
  HiOutlineKey,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineArrowPath,
  HiOutlineInformationCircle,
  HiOutlineServer,
  HiOutlineLockClosed,
  HiOutlineSparkles,
  HiOutlineDocumentText,
} from 'react-icons/hi2';
import api from '../../../api/axios';
import CompanyLetterheadSettings from './CompanyLetterheadSettings';

const SettingsPage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab: 'org' (Roles/Designations/Departments) | 'email' (Company SMTP Settings)
  const activeTab = searchParams.get('tab') || 'org';
  const setActiveTab = (tab) => setSearchParams({ tab });

  // Organization structure states
  const [newRole, setNewRole] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [newDepartment, setNewDepartment] = useState('');

  // SMTP Settings Form State
  const [smtpForm, setSmtpForm] = useState({
    enabled: false,
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    authUser: '',
    authPass: '',
    fromName: '',
    fromEmail: '',
    tlsRejectUnauthorized: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // 1. Fetch Dynamic Values (Roles, Designations, Departments)
  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data;
    },
  });

  // 2. Fetch Company SMTP Settings
  const { data: emailSettingsData, isLoading: loadingEmailSettings } = useQuery({
    queryKey: ['companyEmailSettings'],
    queryFn: async () => {
      const { data } = await api.get('/company/email-settings');
      return data;
    },
  });

  // 3. Fetch Company Email Logs
  const {
    data: emailLogsData = [],
    refetch: refetchLogs,
    isLoading: loadingEmailLogs,
  } = useQuery({
    queryKey: ['companyEmailLogs'],
    queryFn: async () => {
      const { data } = await api.get('/company/email-settings/logs');
      return Array.isArray(data?.logs) ? data.logs : [];
    },
    initialData: [],
    enabled: activeTab === 'email',
  });

  // Sync loaded SMTP settings into form state
  useEffect(() => {
    if (emailSettingsData?.smtpSettings) {
      const s = emailSettingsData.smtpSettings;
      setSmtpForm({
        enabled: Boolean(s.enabled),
        host: s.host || 'smtp.gmail.com',
        port: s.port || 587,
        secure: Boolean(s.secure),
        authUser: s.authUser || '',
        authPass: s.hasPassword ? '••••••••' : '',
        fromName: s.fromName || emailSettingsData.company?.name || '',
        fromEmail: s.fromEmail || s.authUser || '',
        tlsRejectUnauthorized: Boolean(s.tlsRejectUnauthorized),
      });
    }
  }, [emailSettingsData]);

  // MUTATION: Update Organization Structure (Roles, etc.)
  const updateMutation = useMutation({
    mutationFn: async (updatedSettings) => {
      const { data } = await api.put('/settings', updatedSettings);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      toast.success('Organization settings updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error updating settings');
    },
  });

  // MUTATION: Save Company SMTP Settings
  const saveSmtpMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.put('/company/email-settings', payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['companyEmailSettings']);
      toast.success(data.message || 'Company SMTP settings saved successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save SMTP settings');
    },
  });

  // MUTATION: Test SMTP Connection & Send Test Email
  const testSmtpMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/company/email-settings/test', payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'SMTP verified and test email sent!');
      queryClient.invalidateQueries(['companyEmailSettings']);
      queryClient.invalidateQueries(['companyEmailLogs']);
      setIsTestModalOpen(false);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'SMTP test failed';
      const hint = err.response?.data?.hint;
      toast.error(hint ? `${msg}: ${hint}` : msg, { duration: 6000 });
      queryClient.invalidateQueries(['companyEmailSettings']);
    },
  });

  // Handle Quick Presets (Gmail, Outlook, Zoho)
  const applyPreset = (presetName) => {
    if (presetName === 'gmail') {
      setSmtpForm((prev) => ({
        ...prev,
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
      }));
      toast.success('Applied Gmail SMTP settings (Port 587 / STARTTLS). Use a 16-character Google App Password.');
    } else if (presetName === 'outlook') {
      setSmtpForm((prev) => ({
        ...prev,
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
      }));
      toast.success('Applied Microsoft 365 / Outlook SMTP settings.');
    } else if (presetName === 'zoho') {
      setSmtpForm((prev) => ({
        ...prev,
        host: 'smtp.zoho.com',
        port: 465,
        secure: true,
      }));
      toast.success('Applied Zoho Mail SMTP settings (Port 465 / SSL).');
    }
  };

  const handleSaveSmtp = (e) => {
    e.preventDefault();
    if (!smtpForm.host || !smtpForm.authUser) {
      toast.error('Host and Username / Email are required');
      return;
    }
    saveSmtpMutation.mutate(smtpForm);
  };

  const handleSendTestEmail = (e) => {
    e.preventDefault();
    if (!testEmailRecipient || !testEmailRecipient.trim()) {
      toast.error('Please enter a recipient email address for testing');
      return;
    }
    testSmtpMutation.mutate({
      ...smtpForm,
      testRecipient: testEmailRecipient.trim(),
    });
  };

  const handleAddItem = (category, value, setter) => {
    if (!value.trim()) return;
    const currentList = settings?.[category] || [];
    if (currentList.includes(value.trim())) {
      toast.error('Item already exists');
      return;
    }
    updateMutation.mutate({ [category]: [...currentList, value.trim()] });
    setter('');
  };

  const handleDeleteItem = (category, itemToDelete) => {
    const currentList = settings?.[category] || [];
    updateMutation.mutate({
      [category]: currentList.filter((item) => item !== itemToDelete),
    });
  };

  const renderSection = (title, category, inputValue, setInputValue, Icon) => {
    const items = settings?.[category] || [];
    const singularLabel = title.slice(0, -1).toLowerCase();

    return (
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        {/* Section Header */}
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-200">
          <span className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">{title}</h3>
            <p className="text-[11px] text-slate-500">
              {items.length} {items.length === 1 ? 'item' : 'items'} configured
            </p>
          </div>
        </div>

        {/* Add Input Row */}
        <div className="flex flex-col xs:flex-row sm:flex-row gap-2 mb-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Add new ${singularLabel}`}
            className="flex-1 bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem(category, inputValue, setInputValue)}
          />
          <button
            type="button"
            onClick={() => handleAddItem(category, inputValue, setInputValue)}
            disabled={updateMutation.isPending || !inputValue.trim()}
            className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm cursor-pointer"
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>

        {/* Items List */}
        <div className="flex flex-wrap gap-2">
          {items.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              No {title.toLowerCase()} added yet.
            </p>
          ) : (
            items.map((item, idx) => (
              <div
                key={`${item}-${idx}`}
                className="group inline-flex items-center gap-1.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 transition-colors"
              >
                <span className="truncate max-w-[160px]" title={item}>{item}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteItem(category, item)}
                  className="text-slate-400 hover:text-rose-600 transition-colors ml-0.5 shrink-0 cursor-pointer rounded p-0.5 hover:bg-rose-50"
                  title="Remove"
                  aria-label={`Remove ${item}`}
                >
                  <HiOutlineXMark className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const isConfigured = Boolean(
    emailSettingsData?.smtpSettings?.enabled && emailSettingsData?.smtpSettings?.host
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ===================== PAGE HEADER ===================== */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
            <HiOutlineCog6Tooth className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Office & System Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Configure company organizational hierarchy, designations, departments, and custom SMTP email server.
            </p>
          </div>
        </div>

        {activeTab === 'email' && (
          <button
            type="button"
            onClick={() => setIsTestModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-700 shadow-2xs transition-colors cursor-pointer"
          >
            <HiOutlinePaperAirplane className="w-4 h-4 text-indigo-600" />
            <span>Send Test Email</span>
          </button>
        )}
      </div>

      {/* ===================== TABS NAVIGATION ===================== */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('org')}
          className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'org'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HiOutlineBriefcase className="w-4 h-4" />
          Organization Hierarchy
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('email')}
          className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition cursor-pointer relative ${
            activeTab === 'email'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HiOutlineEnvelope className="w-4 h-4" />
          Company SMTP & Email Setup
          {isConfigured ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Custom SMTP Enabled" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Using Global Fallback" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('letterhead')}
          className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'letterhead'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HiOutlineDocumentText className="w-4 h-4" />
          Blank Letterhead & Branding
        </button>
      </div>

      {/* ===================== TAB 1: ORGANIZATION STRUCTURE ===================== */}
      {activeTab === 'org' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {renderSection('Roles', 'roles', newRole, setNewRole, HiOutlineBriefcase)}
          {renderSection('Designations', 'designations', newDesignation, setNewDesignation, HiOutlineUserCircle)}
          {renderSection('Departments', 'departments', newDepartment, setNewDepartment, HiOutlineBuildingOffice2)}
        </div>
      )}

      {/* ===================== TAB 2: COMPANY SMTP EMAIL SETUP ===================== */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          {/* Status Indicator Card */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              smtpForm.enabled
                ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    smtpForm.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <HiOutlineServer className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base">
                      {smtpForm.enabled
                        ? 'Custom Company SMTP Gateway Active'
                        : 'Custom Company SMTP Disabled (Using System Default)'}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        smtpForm.enabled
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {smtpForm.enabled ? 'Custom SMTP' : 'Fallback'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {smtpForm.enabled
                      ? `All emails for tasks, announcements, reports, and tickets will be dispatched from ${smtpForm.fromEmail || smtpForm.authUser || 'your company mailbox'}.`
                      : 'Emails are currently dispatched via the platform fallback server. Enable your company SMTP below to send emails under your own domain and company name.'}
                  </p>
                </div>
              </div>

              {emailSettingsData?.smtpSettings?.lastTestStatus && emailSettingsData?.smtpSettings?.lastTestStatus !== 'None' && (
                <div className="flex items-center gap-1.5 text-xs font-medium self-start sm:self-center">
                  <span className="text-slate-500">Last Test:</span>
                  {emailSettingsData.smtpSettings.lastTestStatus === 'Success' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                      <HiOutlineCheckCircle className="w-4 h-4 text-emerald-600" />
                      Passed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-white px-2.5 py-1 rounded-lg border border-rose-200" title={emailSettingsData.smtpSettings.lastTestError}>
                      <HiOutlineXCircle className="w-4 h-4 text-rose-600" />
                      Failed
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Configuration Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HiOutlineKey className="w-5 h-5 text-indigo-600" />
                  SMTP Connection Credentials
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your company's mail server details. For Gmail and Workspace, generate an App Password in your Google Account security settings.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-400 mr-1">Presets:</span>
                <button
                  type="button"
                  onClick={() => applyPreset('gmail')}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 transition"
                >
                  Gmail / G Suite
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('outlook')}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 transition"
                >
                  Outlook 365
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('zoho')}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 transition"
                >
                  Zoho Mail
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveSmtp} className="space-y-5">
              {/* Enable Toggle Switch */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label htmlFor="smtp-enable-toggle" className="text-sm font-bold text-slate-900 cursor-pointer">
                    Enable Company Custom SMTP
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    When enabled, emails for your company's staff and users will be delivered through this server.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="smtp-enable-toggle"
                    type="checkbox"
                    checked={smtpForm.enabled}
                    onChange={(e) => setSmtpForm({ ...smtpForm, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Host & Port Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    SMTP Host / Server *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="smtp.gmail.com"
                    value={smtpForm.host}
                    onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Your mail provider's outgoing SMTP hostname.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    SMTP Port *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="587"
                    value={smtpForm.port}
                    onChange={(e) => setSmtpForm({ ...smtpForm, port: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Common: 587 (TLS), 465 (SSL), 25
                  </p>
                </div>
              </div>

              {/* Username & App Password Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    SMTP Username / Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="hr@yourcompany.com"
                    value={smtpForm.authUser}
                    onChange={(e) => setSmtpForm({ ...smtpForm, authUser: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    The authenticated email address used to log into the SMTP server.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    App Password / Secret Key *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={emailSettingsData?.smtpSettings?.hasPassword ? '••••••••' : 'Enter App Password'}
                      value={smtpForm.authPass}
                      onChange={(e) => setSmtpForm({ ...smtpForm, authPass: e.target.value })}
                      className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    For Gmail, use a 16-character Google App Password (not your normal password).
                  </p>
                </div>
              </div>

              {/* Sender Name & From Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Sender Display Name (From Name)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp HR or Office Portal"
                    value={smtpForm.fromName}
                    onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    The name that will appear in employees' inboxes.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Sender Email Address (From Email)
                  </label>
                  <input
                    type="email"
                    placeholder="no-reply@yourcompany.com"
                    value={smtpForm.fromEmail}
                    onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Defaults to your SMTP user email if left blank.
                  </p>
                </div>
              </div>

              {/* Security & SSL/TLS Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={smtpForm.secure}
                    onChange={(e) => setSmtpForm({ ...smtpForm, secure: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Use SSL/TLS Connection</span>
                    <span className="text-[11px] text-slate-500">Enable for port 465 (SSL). Keep unchecked for port 587 (STARTTLS).</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={smtpForm.tlsRejectUnauthorized}
                    onChange={(e) => setSmtpForm({ ...smtpForm, tlsRejectUnauthorized: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Enforce Strict TLS Certificate Check</span>
                    <span className="text-[11px] text-slate-500">Uncheck if using self-signed internal mail servers.</span>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  <HiOutlinePaperAirplane className="w-4 h-4 text-slate-600" />
                  <span>Test Connection & Send Email</span>
                </button>

                <button
                  type="submit"
                  disabled={saveSmtpMutation.isPending}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 transition cursor-pointer disabled:opacity-50"
                >
                  <HiOutlineShieldCheck className="w-4 h-4" />
                  <span>{saveSmtpMutation.isPending ? 'Saving...' : 'Save SMTP Settings'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Setup Guide Accordion / Information Card */}
          <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-5 space-y-3">
            <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
              <HiOutlineInformationCircle className="w-5 h-5 text-indigo-600 shrink-0" />
              How to configure Gmail / Google Workspace App Password:
            </h3>
            <ol className="text-xs text-indigo-900/80 space-y-1.5 list-decimal pl-5">
              <li>Log in to your Google Account at <strong>myaccount.google.com</strong>.</li>
              <li>Go to <strong>Security</strong> &rarr; ensure <strong>2-Step Verification</strong> is turned <strong>ON</strong>.</li>
              <li>Under 2-Step Verification, scroll down and click <strong>App passwords</strong>.</li>
              <li>Enter an app name like <code>Company ERP</code> and click <strong>Create</strong>.</li>
              <li>Copy the generated <strong>16-letter password</strong> (without spaces) and paste it into the <strong>App Password</strong> field above.</li>
              <li>Keep Host as <code>smtp.gmail.com</code> and Port as <code>587</code>.</li>
            </ol>
          </div>

          {/* Email Delivery Audit Logs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Company Email Dispatch Log</h3>
                <p className="text-xs text-slate-500">Live delivery records of emails sent through your company system.</p>
              </div>
              <button
                type="button"
                onClick={() => refetchLogs()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                title="Refresh log"
              >
                <HiOutlineArrowPath className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Recipient</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Sender Type</th>
                    <th className="py-2.5 px-3">Sent Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingEmailLogs ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        <div className="inline-flex items-center gap-2 text-xs">
                          <HiOutlineArrowPath className="w-4 h-4 animate-spin text-indigo-500" />
                          Loading email delivery logs...
                        </div>
                      </td>
                    </tr>
                  ) : !emailLogsData || emailLogsData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                        No email activity recorded yet for your company.
                      </td>
                    </tr>
                  ) : (
                    (emailLogsData || []).map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-2.5 px-3">
                          {log.status === 'Sent' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <HiOutlineCheckCircle className="w-3 h-3" /> Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200" title={log.error}>
                              <HiOutlineXCircle className="w-3 h-3" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{log.recipient}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-xs truncate" title={log.subject}>
                          {log.subject}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              log.senderType === 'CompanySMTP'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {log.senderType || 'Default'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: BLANK LETTERHEAD & BRANDING ===================== */}
      {activeTab === 'letterhead' && <CompanyLetterheadSettings />}

      {/* ===================== MODAL: SEND TEST EMAIL ===================== */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HiOutlinePaperAirplane className="w-5 h-5 text-indigo-600" />
                  Test SMTP Connection
                </h3>
                <p className="text-xs text-slate-500">
                  Verify your SMTP credentials by sending a live test email.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTestModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendTestEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Recipient Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="your.email@company.com"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  A verification email will be dispatched to this address using your configured SMTP server.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div><strong>Host:</strong> {smtpForm.host}:{smtpForm.port}</div>
                <div><strong>User:</strong> {smtpForm.authUser || '(not entered)'}</div>
                <div><strong>Encryption:</strong> {smtpForm.secure ? 'SSL/TLS (465)' : 'STARTTLS (587)'}</div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={testSmtpMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 transition disabled:opacity-50 cursor-pointer"
                >
                  <HiOutlinePaperAirplane className="w-3.5 h-3.5" />
                  <span>{testSmtpMutation.isPending ? 'Verifying & Sending...' : 'Send Test Email'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
