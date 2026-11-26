import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  HiOutlineDocumentCheck,
  HiOutlineDocumentText,
  HiOutlinePlus,
  HiOutlineSparkles,
  HiOutlineCog6Tooth,
  HiOutlineArrowPath,
  HiOutlineShieldCheck,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowDownTray,
  HiOutlineClock,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineSquares2X2,
  HiOutlineTableCells,
  HiOutlineEye,
  HiOutlineBuildingOffice2,
  HiOutlineUser,
  HiOutlineUsers,
  HiOutlineXMark,
  HiOutlineFunnel,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import { useViewMode } from '../../../hooks/useViewMode';
import TemplateDesignModal from '../../../components/e-agreements/TemplateDesignModal';
import GenerateAgreementModal from '../../../components/e-agreements/GenerateAgreementModal';
import AgreementDetailsModal from '../../../components/e-agreements/AgreementDetailsModal';
import AgreementSettingsModal from '../../../components/e-agreements/AgreementSettingsModal';
import AgreementDocumentViewerModal from '../../../components/e-agreements/AgreementDocumentViewerModal';

const EAgreementsHub = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview'); // overview, templates, agreements, settings
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');

  // Persistent Mobile View Mode (cached in localStorage via useViewMode)
  const [viewMode, setViewMode] = useViewMode('eagreements_mobile_view', 'table');

  // Modals state
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const [selectedTemplateForEdit, setSelectedTemplateForEdit] = useState(null);

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedTemplateForGenerate, setSelectedTemplateForGenerate] = useState(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAgreementForDetails, setSelectedAgreementForDetails] = useState(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // In-app Document Viewer & PDF Generator state
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);
  const [selectedAgreementForViewer, setSelectedAgreementForViewer] = useState(null);

  const handleOpenDocViewer = (agr) => {
    setSelectedAgreementForViewer(agr);
    setIsDocViewerOpen(true);
  };

  // Queries
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['agreementStats'],
    queryFn: async () => {
      const res = await api.get('/agreements/stats');
      return res.data?.data || {};
    },
  });

  const { data: companyUsers = [] } = useQuery({
    queryKey: ['companySignerUsers'],
    queryFn: async () => {
      const res = await api.get('/agreements/signers/users');
      return res.data?.data || [];
    },
  });

  const { data: templatesData, isLoading: isTemplatesLoading, refetch: refetchTemplates } = useQuery({
    queryKey: ['agreementTemplates'],
    queryFn: async () => {
      const res = await api.get('/agreements/templates');
      return res.data?.data || [];
    },
  });

  const { data: agreementsData, isLoading: isAgreementsLoading, refetch: refetchAgreements } = useQuery({
    queryKey: ['agreementsList', statusFilter, selectedUserFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (selectedUserFilter !== 'all') params.append('userId', selectedUserFilter);
      const res = await api.get(`/agreements?${params.toString()}`);
      return res.data?.data || [];
    },
  });

  const { data: configData } = useQuery({
    queryKey: ['agreementConfig'],
    queryFn: async () => {
      const res = await api.get('/agreements/config');
      return res.data?.data || {};
    },
  });

  // Mutations
  const saveTemplateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/agreements/templates', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Template saved and synced successfully!');
      queryClient.invalidateQueries({ queryKey: ['agreementTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['agreementStats'] });
      setIsDesignModalOpen(false);
      setSelectedTemplateForEdit(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save template');
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/agreements/templates/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Template deleted');
      queryClient.invalidateQueries({ queryKey: ['agreementTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['agreementStats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete template');
    },
  });

  const generateAgreementMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/agreements/initiate', payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('e-Agreement generated successfully!');
      queryClient.invalidateQueries({ queryKey: ['agreementsList'] });
      queryClient.invalidateQueries({ queryKey: ['agreementStats'] });
      setIsGenerateModalOpen(false);
      if (data.data) {
        setSelectedAgreementForDetails(data.data);
        setIsDetailsModalOpen(true);
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to generate agreement');
    },
  });

  const checkStatusMutation = useMutation({
    mutationFn: async (agreementId) => {
      const res = await api.get(`/agreements/${agreementId}/status`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Status updated!');
      queryClient.invalidateQueries({ queryKey: ['agreementsList'] });
      if (selectedAgreementForDetails && selectedAgreementForDetails.agreement_id === data.data?.agreement_id) {
        setSelectedAgreementForDetails(data.data);
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Could not verify status');
    },
  });

  const handleSyncFromGateway = async () => {
    toast.loading('Syncing templates from Gateway...', { id: 'sync-gateway' });
    try {
      await api.get('/agreements/templates?sync=true');
      toast.success('Templates synced from Gateway successfully!', { id: 'sync-gateway' });
      queryClient.invalidateQueries({ queryKey: ['agreementTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['agreementStats'] });
    } catch (err) {
      toast.error('Sync failed. Please check Gateway API key.', { id: 'sync-gateway' });
    }
  };

  const handleOpenDesign = (tpl = null) => {
    setSelectedTemplateForEdit(tpl);
    setIsDesignModalOpen(true);
  };

  const handleOpenGenerate = (tpl) => {
    setSelectedTemplateForGenerate(tpl);
    setIsGenerateModalOpen(true);
  };

  // Filtered lists
  const filteredTemplates = useMemo(() => {
    if (!templatesData) return [];
    if (!searchQuery) return templatesData;
    const q = searchQuery.toLowerCase();
    return templatesData.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.template_id?.toLowerCase().includes(q) ||
        (t.variables || []).some((v) => v.toLowerCase().includes(q))
    );
  }, [templatesData, searchQuery]);

  const filteredAgreements = useMemo(() => {
    if (!agreementsData) return [];
    if (!searchQuery) return agreementsData;
    const q = searchQuery.toLowerCase();
    return agreementsData.filter(
      (a) =>
        a.title?.toLowerCase().includes(q) ||
        a.signer_name?.toLowerCase().includes(q) ||
        a.agreement_id?.toLowerCase().includes(q) ||
        a.template_id?.toLowerCase().includes(q) ||
        a.user?.name?.toLowerCase().includes(q) ||
        a.user?.email?.toLowerCase().includes(q)
    );
  }, [agreementsData, searchQuery]);

  const selectedUserObj = useMemo(() => {
    if (selectedUserFilter === 'all') return null;
    return companyUsers.find((u) => u._id === selectedUserFilter);
  }, [selectedUserFilter, companyUsers]);

  // Group agreements by user for quick filters in Overview
  const usersWithAgreements = useMemo(() => {
    if (!agreementsData) return [];
    const map = {};
    agreementsData.forEach((a) => {
      if (a.user && a.user._id) {
        const uId = a.user._id;
        if (!map[uId]) {
          map[uId] = {
            id: uId,
            name: a.user.name,
            email: a.user.email,
            role: a.user.role,
            total: 0,
            signed: 0,
          };
        }
        map[uId].total += 1;
        if (a.status === 'Signed') map[uId].signed += 1;
      }
    });
    return Object.values(map);
  }, [agreementsData]);

  return (
    <div className="space-y-6 pt-[15px] pb-[30px] sm:pt-0 sm:pb-0 max-w-full overflow-x-hidden font-sans-modern">
      {/* Top Header & Quick Actions */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono-tech font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
              E-Sign &amp; Legal Framework
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-tech font-bold uppercase ${
              configData?.hasApiKey
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {configData?.hasApiKey ? `Connected (${configData.environment})` : 'Sandbox Simulator Active'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 tracking-tight">
            E-Agreements &amp; Contract Automation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-sans-modern">
            Design multi-page agreement templates, plug dynamic fields, and trigger 1-click Aadhaar eSign contracts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSyncFromGateway}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-heading font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
            title="Pull latest templates from chitraguptccrms gateway"
          >
            <HiOutlineArrowPath className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Sync from Gateway</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-heading font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            <HiOutlineCog6Tooth className="w-4 h-4 text-indigo-600" />
            <span>API Settings</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenDesign(null)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-heading font-bold transition-all shadow-md shadow-slate-900/20 cursor-pointer"
          >
            <HiOutlinePlus className="w-4 h-4 text-white" />
            <span>Design Template</span>
          </button>

          {templatesData && templatesData.length > 0 && (
            <button
              type="button"
              onClick={() => handleOpenGenerate(templatesData[0])}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-heading font-bold transition-all shadow-md shadow-emerald-600/25 cursor-pointer"
            >
              <HiOutlineSparkles className="w-4 h-4 text-emerald-200" />
              <span>Generate Agreement</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-mono-tech font-bold text-slate-400 uppercase">
              Total Agreements
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <HiOutlineDocumentText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900">
            {statsData?.totalAgreements || 0}
          </div>
          <span className="text-[10px] text-slate-400 font-mono-tech block mt-0.5">
            Initiated Across Office
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-mono-tech font-bold text-slate-400 uppercase">
              Signed &amp; Verified
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <HiOutlineShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-heading font-extrabold text-emerald-600">
            {statsData?.signedAgreements || 0}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
            Aadhaar eSign Verified
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-mono-tech font-bold text-slate-400 uppercase">
              Pending Signing
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <HiOutlineClock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-heading font-extrabold text-amber-600">
            {statsData?.pendingAgreements || 0}
          </div>
          <span className="text-[10px] text-slate-400 font-mono-tech block mt-0.5">
            Awaiting Signatures
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-mono-tech font-bold text-slate-400 uppercase">
              Active Templates
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <HiOutlineDocumentCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-heading font-extrabold text-teal-700">
            {statsData?.totalTemplates || (templatesData?.length || 0)}
          </div>
          <span className="text-[10px] text-slate-400 font-mono-tech block mt-0.5">
            Ready for Dynamic Generation
          </span>
        </div>
      </div>

      {/* Tabs Bar & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Overview &amp; Recent
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'templates'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Templates &amp; Designer ({templatesData?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('agreements')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'agreements'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Agreements ({agreementsData?.length || 0})
          </button>
        </div>

        {/* View Switcher (Table vs Card) + Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID or variable..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
            />
          </div>

          {/* Table / Card View Toggle with persistent useViewMode */}
          <div className="flex items-center border border-slate-200 rounded-xl bg-slate-100 p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <HiOutlineTableCells className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'card' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Card View"
            >
              <HiOutlineSquares2X2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ===================== TAB 1: OVERVIEW & RECENT ===================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Template Launchers Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="max-w-2xl relative z-10">
              <span className="px-3 py-1 rounded-full text-xs font-mono-tech font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 inline-block mb-3">
                ⚡ Rapid Contract Generator
              </span>
              <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-white">
                Launch Agreements with Real-Time Aadhaar eSign
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200 mt-2 leading-relaxed">
                Choose any pre-built template below to immediately initiate an agreement. All dynamic variables will be automatically converted to form inputs.
              </p>

              <div className="mt-5 flex flex-wrap gap-2.5">
                {(templatesData || []).slice(0, 4).map((tpl) => (
                  <button
                    key={tpl._id}
                    type="button"
                    onClick={() => handleOpenGenerate(tpl)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-heading font-bold text-white transition-all cursor-pointer backdrop-blur-xs"
                  >
                    <span>{tpl.name}</span>
                    <span className="text-[10px] font-mono-tech px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300">
                      ₹{tpl.price || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Agreements Section */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-heading font-extrabold text-slate-900">
                  Recent Generated Agreements
                </h3>
                <p className="text-xs text-slate-500 font-sans-modern">
                  Latest contracts submitted and signed in your organization
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('agreements')}
                className="text-xs font-heading font-bold text-indigo-600 hover:text-indigo-700"
              >
                View All Agreements →
              </button>
            </div>

            {isAgreementsLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading agreements...</div>
            ) : filteredAgreements.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <HiOutlineDocumentCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-heading font-bold text-slate-700">No agreements generated yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Click on "Generate Agreement" or choose a template to create your first legal document.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredAgreements.slice(0, 5).map((agr) => (
                  <div
                    key={agr._id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                        <HiOutlineDocumentCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-heading font-bold text-slate-900 truncate">
                          {agr.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono-tech mt-0.5">
                          <span>ID: {agr.agreement_id}</span>
                          <span>•</span>
                          <span>Signer: {agr.signer_name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase ${
                        agr.status === 'Signed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {agr.status}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAgreementForDetails(agr);
                          setIsDetailsModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-heading font-bold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                      >
                        Inspect
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDocViewer(agr)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="View & Download PDF"
                      >
                        <HiOutlineArrowDownTray className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Agreements by Particular User / Employee Widget */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <HiOutlineUsers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-heading font-extrabold text-slate-900">
                    Agreements by Particular Users &amp; Signers
                  </h3>
                  <p className="text-xs text-slate-500 font-sans-modern">
                    Click any staff member or user to quickly inspect and filter all agreements generated for them
                  </p>
                </div>
              </div>
            </div>

            {usersWithAgreements.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No user-linked agreements recorded yet. When initiating agreements, select a user from the dropdown to track them here.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {usersWithAgreements.map((uItem) => (
                  <button
                    key={uItem.id}
                    type="button"
                    onClick={() => {
                      setSelectedUserFilter(uItem.id);
                      setActiveTab('agreements');
                    }}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition-all flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-heading font-bold flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                        {uItem.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-heading font-bold text-slate-900 block truncate group-hover:text-indigo-600">
                          {uItem.name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-sans-modern block truncate">
                          {uItem.email}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-heading font-bold bg-indigo-100 text-indigo-800 block">
                        {uItem.total} Agr.
                      </span>
                      <span className="text-[10px] text-emerald-600 font-mono-tech mt-0.5 block">
                        {uItem.signed} Signed
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 2: TEMPLATES & DESIGNER ===================== */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-heading font-extrabold text-slate-900">
                Agreement Templates ({filteredTemplates.length})
              </h3>
              <p className="text-xs text-slate-500 font-sans-modern">
                Click "Design Template" to add a new multi-page agreement or modify existing formats.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenDesign(null)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-heading font-bold transition-all shadow-xs cursor-pointer"
            >
              <HiOutlinePlus className="w-4 h-4" />
              <span>Create Multi-Page Template</span>
            </button>
          </div>

          {isTemplatesLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading templates...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white">
              <HiOutlineDocumentText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-heading font-bold text-slate-700">No agreement templates found.</p>
              <p className="text-xs text-slate-400 mt-1">
                Create your first template or click "Sync from Gateway" above.
              </p>
            </div>
          ) : viewMode === 'card' ? (
            /* Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredTemplates.map((tpl) => (
                <div
                  key={tpl._id}
                  className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono-tech font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {tpl.template_id}
                      </span>
                      <span className={`text-[10px] font-heading font-bold px-2 py-0.5 rounded-full ${
                        tpl.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {tpl.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-heading font-bold text-slate-900 mb-1 leading-snug">
                      {tpl.name}
                    </h4>

                    <div className="flex items-center gap-2 text-xs font-mono-tech text-slate-600 mb-3">
                      <span>Price: <strong>₹{(tpl.price || 0).toFixed(2)}</strong></span>
                      <span>•</span>
                      <span>{tpl.pages?.length || 1} Page(s)</span>
                    </div>

                    {/* Variables pill list */}
                    <div className="space-y-1 mb-4">
                      <span className="text-[10px] font-mono-tech text-slate-400 uppercase block">
                        Variables ({(tpl.variables || []).length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {(tpl.variables || []).slice(0, 4).map((v, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-[10px] font-mono-tech font-bold bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {v}
                          </span>
                        ))}
                        {(tpl.variables || []).length > 4 && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono-tech text-slate-500 bg-slate-50">
                            +{tpl.variables.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenGenerate(tpl)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-heading font-bold transition-colors cursor-pointer text-center shadow-2xs"
                    >
                      ⚡ Generate
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDesign(tpl)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"
                      title="Edit Template"
                    >
                      <HiOutlinePencilSquare className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete template "${tpl.name}"?`)) {
                          deleteTemplateMutation.mutate(tpl._id);
                        }
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600"
                      title="Delete"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono-tech uppercase">
                    <tr>
                      <th className="py-3 px-4">Template Unique ID</th>
                      <th className="py-3 px-4">Template Name</th>
                      <th className="py-3 px-4">Price (₹)</th>
                      <th className="py-3 px-4">Dynamic Fields</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans-modern">
                    {filteredTemplates.map((tpl) => (
                      <tr key={tpl._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono-tech font-bold text-indigo-700">
                          {tpl.template_id}
                        </td>
                        <td className="py-3 px-4 font-heading font-bold text-slate-900">
                          {tpl.name}
                        </td>
                        <td className="py-3 px-4 font-mono-tech font-bold text-slate-800">
                          ₹{(tpl.price || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(tpl.variables || []).slice(0, 3).map((v, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono-tech bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {v}
                              </span>
                            ))}
                            {(tpl.variables || []).length > 3 && (
                              <span className="text-[10px] text-slate-400 font-mono-tech self-center">
                                +{tpl.variables.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase ${
                            tpl.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {tpl.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenGenerate(tpl)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-[11px] shadow-2xs"
                            >
                              ⚡ Generate
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDesign(tpl)}
                              className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"
                              title="Edit Template"
                            >
                              <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete template "${tpl.name}"?`)) {
                                  deleteTemplateMutation.mutate(tpl._id);
                                }
                              }}
                              className="p-1 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600"
                              title="Delete"
                            >
                              <HiOutlineTrash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 3: ALL GENERATED AGREEMENTS ===================== */}
      {activeTab === 'agreements' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-heading font-extrabold text-slate-900">
                All Generated Agreements ({filteredAgreements.length})
              </h3>
              <p className="text-xs text-slate-500 font-sans-modern">
                Track verification status, signer IP, and download signed PDF contracts.
              </p>
            </div>

            {/* Filter by User & Status */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* User filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <HiOutlineUser className="w-3.5 h-3.5 text-indigo-500" />
                  <span>User:</span>
                </span>
                <select
                  value={selectedUserFilter}
                  onChange={(e) => setSelectedUserFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-heading font-bold rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[190px] truncate cursor-pointer"
                >
                  <option value="all">All Users / Signers</option>
                  {companyUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-semibold">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-heading font-bold rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="Signed">Signed</option>
                  <option value="Initiated">Initiated</option>
                  <option value="Pending Sign">Pending Sign</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active User Filter Banner */}
          {selectedUserObj && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-heading font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                  {selectedUserObj.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-heading font-extrabold text-indigo-950">
                    Showing Agreements for: <strong className="text-indigo-600">{selectedUserObj.name}</strong> ({selectedUserObj.email})
                  </p>
                  <p className="text-[11px] text-indigo-700/80 font-sans-modern">
                    Position: {selectedUserObj.role || 'Staff'} • Found {filteredAgreements.length} matching agreement(s)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserFilter('all')}
                className="px-3 py-1.5 rounded-xl bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 text-xs font-heading font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              >
                <HiOutlineXMark className="w-3.5 h-3.5" />
                <span>Clear User Filter</span>
              </button>
            </div>
          )}

          {isAgreementsLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading agreements...</div>
          ) : filteredAgreements.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white">
              <HiOutlineDocumentCheck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-heading font-bold text-slate-700">No agreements found.</p>
              <p className="text-xs text-slate-400 mt-1">
                {selectedUserFilter !== 'all'
                  ? `No agreements generated for ${selectedUserObj?.name || 'this user'}. You can generate a new one from the Templates tab.`
                  : 'Try clearing filters or generate a new agreement from templates.'}
              </p>
              {selectedUserFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedUserFilter('all')}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-heading font-bold hover:bg-indigo-100"
                >
                  <HiOutlineXMark className="w-3.5 h-3.5" />
                  <span>Show All Users</span>
                </button>
              )}
            </div>
          ) : viewMode === 'card' ? (
            /* Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAgreements.map((agr) => (
                <div
                  key={agr._id}
                  className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase ${
                        agr.status === 'Signed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        ● {agr.status}
                      </span>
                      <span className="text-[10px] font-mono-tech text-slate-400 uppercase">
                        {agr.environment || 'sandbox'}
                      </span>
                    </div>

                    <h4 className="text-sm font-heading font-bold text-slate-900 mb-2 leading-snug">
                      {agr.title}
                    </h4>

                    {/* Associated User Box */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-heading font-bold flex items-center justify-center text-[10px] shrink-0">
                          {(agr.user?.name || agr.signer_name || 'U').charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-heading font-bold text-slate-900 block truncate">
                            {agr.user ? agr.user.name : agr.signer_name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-sans-modern block truncate">
                            {agr.user ? `${agr.user.email} (${agr.user.role || 'Staff'})` : (agr.parties?.[0]?.email || 'Direct Signer')}
                          </span>
                        </div>
                      </div>
                      {agr.user && selectedUserFilter !== agr.user._id && (
                        <button
                          type="button"
                          onClick={() => setSelectedUserFilter(agr.user._id)}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-heading font-bold hover:bg-indigo-200 transition-colors cursor-pointer shrink-0"
                          title="Filter only this user"
                        >
                          Filter
                        </button>
                      )}
                    </div>

                    <div className="text-xs space-y-1 mb-4 text-slate-600">
                      <p><span className="text-slate-400">ID:</span> <code className="font-mono-tech text-[10px]">{agr.agreement_id}</code></p>
                      <p><span className="text-slate-400">Role:</span> {agr.parties?.[0]?.role || 'Borrower'}</p>
                      <p><span className="text-slate-400">Method:</span> {agr.signing_details?.verification_method || 'Aadhaar eSign'}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenDocViewer(agr)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-heading font-bold transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <HiOutlineEye className="w-3.5 h-3.5" />
                      <span>View Agreement</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAgreementForDetails(agr);
                        setIsDetailsModalOpen(true);
                      }}
                      className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-heading font-bold transition-colors cursor-pointer text-center"
                    >
                      Audit Trail
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDocViewer(agr)}
                      className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
                      title="Download PDF"
                    >
                      <HiOutlineArrowDownTray className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono-tech uppercase">
                    <tr>
                      <th className="py-3 px-4">Agreement ID</th>
                      <th className="py-3 px-4">Title / Template</th>
                      <th className="py-3 px-4">Signer / Target User</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Created Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans-modern">
                    {filteredAgreements.map((agr) => (
                      <tr key={agr._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono-tech font-bold text-slate-700 text-[11px]">
                          {agr.agreement_id}
                        </td>
                        <td className="py-3 px-4 font-heading font-bold text-slate-900">
                          {agr.title}
                        </td>
                        <td className="py-3 px-4">
                          {agr.user ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {agr.user.name?.charAt(0) || 'U'}
                              </div>
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => setSelectedUserFilter(agr.user._id)}
                                  className="text-xs font-heading font-bold text-indigo-600 hover:text-indigo-800 hover:underline block truncate text-left cursor-pointer"
                                  title="Click to view only this user's agreements"
                                >
                                  {agr.user.name}
                                </button>
                                <span className="text-[10px] text-slate-500 font-sans-modern block truncate">
                                  {agr.user.email} • {agr.user.role || 'Staff'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="text-xs font-medium text-slate-800 block">
                                {agr.signer_name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-sans-modern">
                                {agr.parties?.[0]?.email || 'Direct Signer'}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase ${
                            agr.status === 'Signed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {agr.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px] font-mono-tech">
                          {new Date(agr.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenDocViewer(agr)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-heading font-bold text-[11px] cursor-pointer"
                            >
                              View PDF
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAgreementForDetails(agr);
                                setIsDetailsModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-heading font-bold text-[11px] cursor-pointer"
                            >
                              Audit
                            </button>

                            <button
                              type="button"
                              onClick={() => checkStatusMutation.mutate(agr.agreement_id)}
                              className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                              title="Sync status"
                            >
                              <HiOutlineArrowPath className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenDocViewer(agr)}
                              className="p-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 cursor-pointer"
                              title="Print / Save PDF"
                            >
                              <HiOutlineArrowDownTray className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== MODALS ===================== */}
      {/* 1. Multi-Page Template Design Modal (Screenshot 1) */}
      <TemplateDesignModal
        isOpen={isDesignModalOpen}
        onClose={() => {
          setIsDesignModalOpen(false);
          setSelectedTemplateForEdit(null);
        }}
        template={selectedTemplateForEdit}
        onSave={(payload) => saveTemplateMutation.mutate(payload)}
        isSaving={saveTemplateMutation.isPending}
      />

      {/* 2. Generate Agreement Modal (Screenshot 2) */}
      <GenerateAgreementModal
        isOpen={isGenerateModalOpen}
        onClose={() => {
          setIsGenerateModalOpen(false);
          setSelectedTemplateForGenerate(null);
        }}
        template={selectedTemplateForGenerate}
        onGenerate={(payload) => generateAgreementMutation.mutate(payload)}
        isGenerating={generateAgreementMutation.isPending}
      />

      {/* 3. Agreement Inspection & Digital Certificate Modal */}
      <AgreementDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedAgreementForDetails(null);
        }}
        agreement={selectedAgreementForDetails}
        onCheckStatus={(id) => checkStatusMutation.mutate(id)}
        isCheckingStatus={checkStatusMutation.isPending}
        onViewDocument={handleOpenDocViewer}
      />

      {/* 4. Gateway Integration Credentials Modal */}
      <AgreementSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['agreementConfig'] });
        }}
      />

      {/* 5. In-App Agreement Document Viewer & PDF Generator Modal */}
      <AgreementDocumentViewerModal
        isOpen={isDocViewerOpen}
        onClose={() => {
          setIsDocViewerOpen(false);
          setSelectedAgreementForViewer(null);
        }}
        agreement={selectedAgreementForViewer}
      />
    </div>
  );
};

export default EAgreementsHub;
