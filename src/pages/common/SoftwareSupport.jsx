import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  HiOutlineLifebuoy,
  HiOutlineTicket,
  HiOutlinePlus,
  HiOutlineChatBubbleLeftRight,
  HiOutlinePaperAirplane,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineXMark,
  HiOutlineArrowPath,
  HiOutlineShieldCheck,
  HiOutlineInformationCircle,
  HiOutlineUser,
  HiOutlinePaperClip,
  HiOutlinePhoto,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineBuildingOffice2,
  HiOutlineGlobeAlt,
  HiOutlineMagnifyingGlass,
  HiOutlineCommandLine,
  HiOutlineKey,
  HiOutlineClipboardDocument,
  HiOutlineClipboardDocumentCheck,
  HiOutlineComputerDesktop,
  HiOutlineDevicePhoneMobile,
  HiOutlineTag,
  HiOutlineCheck,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineDocumentText,
  HiOutlineArrowRight,
  HiOutlineCodeBracket,
} from 'react-icons/hi2';
import api from '../../api/axios';
import { API_BASE_URL } from '../../config';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const SOFTWARE_CATEGORIES = [
  'Web Application',
  'Mobile App (Android/iOS)',
  'Desktop ERP',
  'SaaS Platform',
  'API & Microservice',
  'E-Commerce & Portal',
  'Custom Software',
];

const TICKET_CATEGORIES = [
  'Bug / Error',
  'Feature Request',
  'Performance / Slow',
  'Data / Calculation Issue',
  'Integration / API',
  'UI / Display Glitch',
  'Billing / Licensing',
  'General Query',
];

const SoftwareSupport = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();

  // Top navigation sub-tab ('tickets', 'apps', 'docs')
  const activeMainTab = searchParams.get('tab') || 'tickets';
  const setActiveMainTab = (tab) => setSearchParams({ tab });

  // Filtering state
  const [selectedSoftwareFilter, setSelectedSoftwareFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected ticket for master-detail view
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  // Modals state
  const [isRegisterAppModalOpen, setIsRegisterAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Register App Form
  const [appName, setAppName] = useState('');
  const [softwareIdInput, setSoftwareIdInput] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [appCategory, setAppCategory] = useState('Web Application');
  const [appPlatform, setAppPlatform] = useState('Web & Cloud');
  const [appAssignedLead, setAppAssignedLead] = useState('');
  const [appWebhookUrl, setAppWebhookUrl] = useState('');

  // Agent Chat / Message input
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);

  // Status & Resolution Notes
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState('');

  // Show/Hide API keys toggle map
  const [visibleKeys, setVisibleKeys] = useState({});
  const toggleKeyVisibility = (id) => {
    setVisibleKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Copied code or key feedback
  const [copiedKeyId, setCopiedKeyId] = useState(null);
  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedKeyId(null), 2500);
  };

  // 1. Fetch Registered Softwares
  const { data: appsData, isLoading: appsLoading, refetch: refetchApps } = useQuery({
    queryKey: ['softwareAppsList'],
    queryFn: async () => {
      const { data } = await api.get('/software-support/apps');
      return data?.apps || [];
    },
  });
  const softwareApps = appsData || [];

  // 2. Fetch Software Support Stats
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['softwareSupportStats'],
    queryFn: async () => {
      const { data } = await api.get('/software-support/stats');
      return data?.stats || {};
    },
    refetchInterval: 15000,
  });
  const stats = statsData || {
    totalSoftwares: 0,
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    waitingTickets: 0,
    resolvedTickets: 0,
    urgentTickets: 0,
    activeTickets: 0,
  };

  // 3. Fetch Company Solvers (for assigning leads or agents)
  const { data: solversData } = useQuery({
    queryKey: ['companySolvers'],
    queryFn: async () => {
      const { data } = await api.get('/company-tickets/solvers');
      return data?.solvers || [];
    },
  });
  const companySolvers = solversData || [];

  // 4. Fetch Software Tickets
  const {
    data: ticketsData,
    isLoading: ticketsLoading,
    refetch: refetchTickets,
  } = useQuery({
    queryKey: ['softwareTickets', selectedSoftwareFilter, statusFilter, priorityFilter, searchQuery],
    queryFn: async () => {
      const params = {};
      if (selectedSoftwareFilter !== 'ALL') params.softwareId = selectedSoftwareFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const { data } = await api.get('/software-support/tickets', { params });
      return data?.tickets || [];
    },
    refetchInterval: 12000,
  });
  const tickets = ticketsData || [];

  // Auto select first ticket
  useEffect(() => {
    if (tickets.length > 0 && !selectedTicketId) {
      setSelectedTicketId(tickets[0]._id);
    }
  }, [tickets, selectedTicketId]);

  // 5. Fetch Single Ticket Full Details
  const { data: selectedTicketResponse, refetch: refetchSelectedTicket } = useQuery({
    queryKey: ['softwareTicketDetail', selectedTicketId],
    queryFn: async () => {
      if (!selectedTicketId) return null;
      const { data } = await api.get(`/software-support/tickets/${selectedTicketId}`);
      return data?.ticket || null;
    },
    enabled: !!selectedTicketId,
  });
  const selectedTicket = selectedTicketResponse || tickets.find((t) => t._id === selectedTicketId);

  // Sync messages
  useEffect(() => {
    if (selectedTicket?.messages) {
      setChatMessages(selectedTicket.messages);
    }
  }, [selectedTicket?.messages]);

  // Socket room join
  useEffect(() => {
    if (!socket || !selectedTicketId) return;

    socket.emit('join-ticket', selectedTicketId);

    const handleTicketMessage = (newMsg) => {
      setChatMessages((prev) => {
        if (newMsg._id && prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
      queryClient.invalidateQueries(['softwareTickets']);
    };

    const handleStatusUpdate = (updatePayload) => {
      toast.success(`Ticket marked as ${updatePayload.status}`);
      queryClient.invalidateQueries(['softwareTicketDetail', selectedTicketId]);
      queryClient.invalidateQueries(['softwareTickets']);
      queryClient.invalidateQueries(['softwareSupportStats']);
    };

    socket.on('ticket_message', handleTicketMessage);
    socket.on('ticket_status_update', handleStatusUpdate);

    return () => {
      socket.emit('leave-ticket', selectedTicketId);
      socket.off('ticket_message', handleTicketMessage);
      socket.off('ticket_status_update', handleStatusUpdate);
    };
  }, [socket, selectedTicketId, queryClient]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Save / Register Software App
  const handleSaveSoftwareApp = async (e) => {
    e.preventDefault();
    if (!appName.trim() || !softwareIdInput.trim()) {
      toast.error('Software Name and Software ID are required');
      return;
    }

    try {
      if (editingApp) {
        await api.put(`/software-support/apps/${editingApp._id}`, {
          name: appName.trim(),
          description: appDescription.trim(),
          category: appCategory,
          platform: appPlatform.trim(),
          assignedLead: appAssignedLead || null,
          webhookUrl: appWebhookUrl.trim(),
        });
        toast.success('Software details updated successfully!');
      } else {
        await api.post('/software-support/apps', {
          name: appName.trim(),
          softwareId: softwareIdInput.trim(),
          description: appDescription.trim(),
          category: appCategory,
          platform: appPlatform.trim(),
          assignedLead: appAssignedLead || null,
          webhookUrl: appWebhookUrl.trim(),
        });
        toast.success(`Software "${appName}" registered with API credentials!`);
      }

      setIsRegisterAppModalOpen(false);
      setEditingApp(null);
      setAppName('');
      setSoftwareIdInput('');
      setAppDescription('');
      setAppWebhookUrl('');
      setAppAssignedLead('');
      refetchApps();
      refetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save software');
    }
  };

  // Open edit modal
  const handleOpenEditApp = (app) => {
    setEditingApp(app);
    setAppName(app.name);
    setSoftwareIdInput(app.softwareId);
    setAppDescription(app.description || '');
    setAppCategory(app.category || 'Web Application');
    setAppPlatform(app.platform || 'Web & Cloud');
    setAppAssignedLead(app.assignedLead?._id || app.assignedLead || '');
    setAppWebhookUrl(app.webhookUrl || '');
    setIsRegisterAppModalOpen(true);
  };

  // Regenerate API Key
  const handleRegenerateKey = async (appId) => {
    if (!window.confirm('Regenerating this key will break existing API integrations until updated. Continue?')) {
      return;
    }
    try {
      const { data } = await api.post(`/software-support/apps/${appId}/regenerate-key`);
      toast.success(data.message || 'API Key regenerated!');
      refetchApps();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to regenerate key');
    }
  };

  // Delete App
  const handleDeleteApp = async (appId) => {
    if (!window.confirm('Are you sure you want to remove or deprecate this software?')) return;
    try {
      const { data } = await api.delete(`/software-support/apps/${appId}`);
      toast.success(data.message || 'Software updated');
      refetchApps();
      refetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete software');
    }
  };

  // Send Agent Reply to Client
  const handleSendAgentReply = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedTicketId) return;

    const text = messageInput.trim();
    setMessageInput('');

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      _id: tempId,
      senderType: 'agent',
      senderName: user?.name || 'Support Agent',
      senderEmail: user?.email,
      message: text,
      isInternalNote,
      createdAt: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, optimistic]);
    setIsSendingMessage(true);

    try {
      const { data } = await api.post(`/software-support/tickets/${selectedTicketId}/messages`, {
        message: text,
        isInternalNote,
      });

      if (data?.newMessage) {
        setChatMessages((prev) => prev.map((m) => (m._id === tempId ? data.newMessage : m)));
      }
      queryClient.invalidateQueries(['softwareTickets']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
      setChatMessages((prev) => prev.filter((m) => m._id !== tempId));
      setMessageInput(text);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Update Status directly
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTicketId) return;
    if (newStatus === 'Resolved') {
      setIsResolveModalOpen(true);
      return;
    }

    try {
      const { data } = await api.put(`/software-support/tickets/${selectedTicketId}/status`, {
        status: newStatus,
      });
      toast.success(data.message || `Status set to ${newStatus}`);
      queryClient.invalidateQueries(['softwareTicketDetail', selectedTicketId]);
      queryClient.invalidateQueries(['softwareTickets']);
      queryClient.invalidateQueries(['softwareSupportStats']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Confirm Resolve
  const handleConfirmResolve = async (e) => {
    e.preventDefault();
    if (!selectedTicketId) return;

    try {
      const { data } = await api.put(`/software-support/tickets/${selectedTicketId}/status`, {
        status: 'Resolved',
        resolutionNotes: resolutionNotes.trim(),
      });
      toast.success('Ticket marked as Resolved & notified to client API!');
      setIsResolveModalOpen(false);
      setResolutionNotes('');
      queryClient.invalidateQueries(['softwareTicketDetail', selectedTicketId]);
      queryClient.invalidateQueries(['softwareTickets']);
      queryClient.invalidateQueries(['softwareSupportStats']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve ticket');
    }
  };

  // Confirm Assign
  const handleConfirmAssign = async (e) => {
    e.preventDefault();
    if (!selectedTicketId || !newAssigneeId) {
      toast.error('Please select an agent / developer to assign');
      return;
    }

    try {
      const { data } = await api.put(`/software-support/tickets/${selectedTicketId}/assign`, {
        assignedTo: newAssigneeId,
      });
      toast.success(data.message || 'Ticket assigned successfully');
      setIsAssignModalOpen(false);
      setNewAssigneeId('');
      queryClient.invalidateQueries(['softwareTicketDetail', selectedTicketId]);
      queryClient.invalidateQueries(['softwareTickets']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign ticket');
    }
  };

  // Helper Badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            Open
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <HiOutlineClock className="w-3.5 h-3.5" />
            In Progress
          </span>
        );
      case 'Waiting on Client':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Waiting on Client
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <HiOutlineCheckCircle className="w-3.5 h-3.5" />
            Resolved
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wide">
            Urgent
          </span>
        );
      case 'High':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
            Low
          </span>
        );
      default:
        return null;
    }
  };

  // Active software for documentation samples
  const [docSoftwareId, setDocSoftwareId] = useState('');
  const selectedDocApp =
    softwareApps.find((a) => a.softwareId === docSoftwareId) ||
    softwareApps[0] || {
      softwareId: 'SW-HOSP-01',
      name: 'Sample Hospital ERP',
      apiKey: 'swk_demo_9876543210abcdef',
    };

  return (
    <div className="space-y-6">
      {/* 1. TOP 3-WAY MODE PILL SWITCHER */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center p-1 bg-slate-100/80 rounded-xl w-full md:w-auto overflow-x-auto">
          <Link
            to="/company-support"
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
          >
            <HiOutlineBuildingOffice2 className="w-4 h-4 text-slate-400" />
            <span>Company Support</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
              Internal
            </span>
          </Link>

          <button
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all bg-white text-indigo-600 shadow-xs whitespace-nowrap cursor-default"
          >
            <HiOutlineComputerDesktop className="w-4 h-4" />
            <span>Softwares Support</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Client API
            </span>
          </button>

          <Link
            to="/support-tickets"
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
          >
            <HiOutlineGlobeAlt className="w-4 h-4 text-slate-400" />
            <span>System Support</span>
          </Link>
        </div>

        <div className="text-right hidden xl:block pr-3">
          <span className="text-[11px] font-medium text-slate-500">
            Managing <strong className="text-indigo-600 font-bold">{stats.totalSoftwares} Softwares</strong> for{' '}
            <strong className="text-slate-900">{user?.company?.name || 'Company Workspace'}</strong>
          </span>
        </div>
      </div>

      {/* 2. HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Softwares Support &amp; Client Ingestion Hub
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Ingest and resolve support tickets from multiple external client software applications via authenticated GET &amp; POST REST APIs.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              refetchTickets();
              refetchApps();
              refetchStats();
              refetchSelectedTicket();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <HiOutlineArrowPath className="w-4 h-4 text-slate-500" />
            Refresh
          </button>

          <button
            onClick={() => {
              setEditingApp(null);
              setAppName('');
              setSoftwareIdInput('');
              setAppDescription('');
              setAppWebhookUrl('');
              setAppAssignedLead('');
              setIsRegisterAppModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Register New Software
          </button>
        </div>
      </div>

      {/* 3. KPI METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Softwares</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <HiOutlineComputerDesktop className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{stats.totalSoftwares || 0}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Connected client products</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Tickets</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <HiOutlineTicket className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{stats.totalTickets || 0}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Ingested via REST API</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs ring-1 ring-sky-500/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-sky-700 uppercase tracking-wider">Active Open</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <HiOutlineClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-600">{stats.activeTickets || 0}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Need resolution</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs ring-1 ring-rose-500/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-700 uppercase tracking-wider">Urgent Issues</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <HiOutlineExclamationTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600">{stats.urgentTickets || 0}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">High priority bugs</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Resolved</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <HiOutlineCheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{stats.resolvedTickets || 0}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Closed &amp; solved</p>
        </div>
      </div>

      {/* 4. MAIN TABS (Tickets Queue | Registered Softwares | API Docs) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'tickets', label: 'Tickets Queue', icon: HiOutlineTicket, count: stats.activeTickets },
          { id: 'apps', label: 'Registered Softwares', icon: HiOutlineComputerDesktop, count: stats.totalSoftwares },
          { id: 'docs', label: 'REST API Documentation & Code', icon: HiOutlineCodeBracket },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeMainTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <IconComp className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white text-indigo-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* TAB 1: TICKETS QUEUE (Master-Detail View) */}
      {/* ============================================================ */}
      {activeMainTab === 'tickets' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="relative flex-1">
              <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ticket #, external ID, client email, or subject..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Software Filter */}
              <select
                value={selectedSoftwareFilter}
                onChange={(e) => setSelectedSoftwareFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Softwares ({softwareApps.length})</option>
                {softwareApps.map((a) => (
                  <option key={a._id} value={a.softwareId}>
                    {a.softwareId} - {a.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Waiting on Client">Waiting on Client</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Priorities</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Master Detail Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[620px]">
            {/* Left list: Tickets */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
              <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>
                  Showing <strong>{tickets.length}</strong> external tickets
                </span>
                <span className="text-[11px] text-slate-400">Click to inspect</span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[660px]">
                {ticketsLoading ? (
                  <div className="p-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">Loading ingested tickets...</p>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <HiOutlineTicket className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-sm font-semibold text-slate-800">No tickets found</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      {searchQuery || selectedSoftwareFilter !== 'ALL'
                        ? 'No external tickets match your filters.'
                        : 'No client applications have pushed tickets to the API yet.'}
                    </p>
                    <button
                      onClick={() => setActiveMainTab('docs')}
                      className="mt-3 text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                    >
                      View API Integration Docs ➔
                    </button>
                  </div>
                ) : (
                  tickets.map((t) => {
                    const isSelected = selectedTicketId === t._id;
                    return (
                      <div
                        key={t._id}
                        onClick={() => setSelectedTicketId(t._id)}
                        className={`p-4 cursor-pointer transition-all border-l-4 ${
                          isSelected
                            ? 'bg-indigo-50/50 border-indigo-600 shadow-xs'
                            : 'border-transparent hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              {t.ticketNumber}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {t.softwareId}
                            </span>
                            {getStatusBadge(t.status)}
                          </div>
                          {getPriorityBadge(t.priority)}
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 mb-1">
                          {t.subject}
                        </h4>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2">
                          {t.description}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                          <div className="truncate max-w-[170px] text-slate-600">
                            <strong>{t.clientName}</strong> ({t.clientEmail})
                          </div>
                          <span className="shrink-0 text-[10px]">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Panel: Active Ticket Workspace */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
              {!selectedTicket ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
                  <HiOutlineChatBubbleLeftRight className="w-12 h-12 text-slate-300 mb-3" />
                  <h3 className="text-base font-bold text-slate-800">Select an Ingested Ticket</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
                    Choose any ticket from the left panel to review client payload, test API responses, and chat with the end user.
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col h-full">
                  {/* Ticket Header */}
                  <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded shadow-xs">
                            {selectedTicket.ticketNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded">
                            {selectedTicket.softwareName} ({selectedTicket.softwareId})
                          </span>
                          {getStatusBadge(selectedTicket.status)}
                          {getPriorityBadge(selectedTicket.priority)}
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                          {selectedTicket.subject}
                        </h2>
                      </div>

                      {/* Quick Agent Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={selectedTicket.status}
                          onChange={(e) => handleUpdateStatus(e.target.value)}
                          className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
                        >
                          <option value="Open">Status: Open</option>
                          <option value="In Progress">Status: In Progress</option>
                          <option value="Waiting on Client">Status: Waiting on Client</option>
                          <option value="Resolved">Status: Resolved</option>
                          <option value="Closed">Status: Closed</option>
                        </select>

                        <button
                          onClick={() => {
                            setNewAssigneeId(selectedTicket.assignedTo?._id || selectedTicket.assignedTo || '');
                            setIsAssignModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs cursor-pointer"
                        >
                          Assign Agent
                        </button>

                        {selectedTicket.status !== 'Resolved' && selectedTicket.status !== 'Closed' && (
                          <button
                            onClick={() => setIsResolveModalOpen(true)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5 pt-3 border-t border-slate-200/70 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Client Contact</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {selectedTicket.clientName}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate block">
                          {selectedTicket.clientEmail}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">External Ticket ID</span>
                        <span className="font-mono text-slate-700">
                          {selectedTicket.externalTicketId || 'None'}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Org: {selectedTicket.clientOrg || 'Individual'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Environment &amp; Ver</span>
                        <span className="font-semibold text-slate-700">
                          {selectedTicket.environment} ({selectedTicket.appVersion || 'v1.0'})
                        </span>
                        <span className="text-[10px] text-slate-500 truncate block">
                          {selectedTicket.deviceInfo || 'Standard Web/App'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Engineer</span>
                        <span className="font-semibold text-indigo-700">
                          {selectedTicket.assignedToName || 'Unassigned'}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {selectedTicket.assignedToRole || 'Support Queue'}
                        </span>
                      </div>
                    </div>

                    {/* Resolution Banner if resolved */}
                    {selectedTicket.resolutionNotes && (
                      <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                        <div className="flex items-center gap-1.5 font-bold mb-0.5 text-emerald-800">
                          <HiOutlineCheckCircle className="w-4 h-4 text-emerald-600" />
                          Resolution Solution (Dispatched to Client GET API):
                        </div>
                        <p className="leading-relaxed whitespace-pre-line">{selectedTicket.resolutionNotes}</p>
                        {selectedTicket.resolvedByName && (
                          <span className="text-[10px] text-emerald-700 mt-1 block">
                            Resolved by {selectedTicket.resolvedByName} on{' '}
                            {new Date(selectedTicket.resolvedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Conversation Feed */}
                  <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 max-h-[440px] bg-slate-50/30">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">No discussion entries.</div>
                    ) : (
                      chatMessages.map((msg, idx) => {
                        const isAgent = msg.senderType === 'agent';
                        const isInternal = msg.isInternalNote;

                        return (
                          <div
                            key={msg._id || idx}
                            className={`flex gap-2.5 max-w-[85%] ${isAgent ? 'ml-auto flex-row-reverse' : ''}`}
                          >
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isInternal
                                  ? 'bg-amber-500 text-white'
                                  : isAgent
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-emerald-600 text-white'
                              }`}
                            >
                              {msg.senderName?.charAt(0) || (isAgent ? 'A' : 'C')}
                            </div>

                            <div
                              className={`rounded-2xl p-3.5 text-xs shadow-xs ${
                                isInternal
                                  ? 'bg-amber-50 border border-amber-300 text-amber-950'
                                  : isAgent
                                  ? 'bg-indigo-600 text-white rounded-tr-none'
                                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                              }`}
                            >
                              <div
                                className={`flex items-center gap-2 mb-1 text-[10px] font-semibold ${
                                  isInternal
                                    ? 'text-amber-800'
                                    : isAgent
                                    ? 'text-indigo-200'
                                    : 'text-slate-500'
                                }`}
                              >
                                <span>{msg.senderName}</span>
                                <span>•</span>
                                <span className="uppercase">
                                  {isInternal ? 'Internal Developer Note' : isAgent ? 'Support Engineer' : 'External Client'}
                                </span>
                                <span>•</span>
                                <span>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <p className="leading-relaxed whitespace-pre-line text-xs sm:text-sm font-normal">
                                {msg.message}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Agent Reply Input */}
                  <div className="p-3 sm:p-4 border-t border-slate-200 bg-white">
                    <form onSubmit={handleSendAgentReply} className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isInternalNote}
                            onChange={(e) => setIsInternalNote(e.target.checked)}
                            className="w-3.5 h-3.5 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                          />
                          <span className={isInternalNote ? 'text-amber-700 font-bold' : ''}>
                            Internal Note Only (Hidden from client GET API)
                          </span>
                        </label>
                        <span className="text-[11px] text-slate-400">
                          {isInternalNote ? 'Team internal' : 'Dispatched to Client Software'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder={
                            isInternalNote
                              ? 'Write an internal developer note...'
                              : 'Write reply to send to external client application...'
                          }
                          className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />

                        <button
                          type="submit"
                          disabled={isSendingMessage || !messageInput.trim()}
                          className={`p-2.5 rounded-xl shadow-xs transition-colors disabled:opacity-40 text-white cursor-pointer ${
                            isInternalNote ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
                          }`}
                        >
                          <HiOutlinePaperAirplane className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: REGISTERED SOFTWARES APPS */}
      {/* ============================================================ */}
      {activeMainTab === 'apps' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">Registered Client Applications &amp; API Keys</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Each software product receives a unique Software ID and API key to authenticate GET and POST requests.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingApp(null);
                setAppName('');
                setSoftwareIdInput('');
                setAppDescription('');
                setAppWebhookUrl('');
                setAppAssignedLead('');
                setIsRegisterAppModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
            >
              <HiOutlinePlus className="w-4 h-4" />
              Register New Software
            </button>
          </div>

          {appsLoading ? (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading registered softwares...</p>
            </div>
          ) : softwareApps.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
              <HiOutlineComputerDesktop className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No softwares registered yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Register your first client application (e.g., Hospital ERP, School App) to generate API credentials.
              </p>
              <button
                onClick={() => setIsRegisterAppModalOpen(true)}
                className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg cursor-pointer shadow-xs"
              >
                + Register First Software
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {softwareApps.map((app) => {
                const isKeyVisible = visibleKeys[app._id];
                return (
                  <div
                    key={app._id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded uppercase">
                            {app.softwareId}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 mt-1">{app.name}</h3>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            app.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                        {app.description || 'No description provided.'}
                      </p>

                      <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Category:</span>
                          <span className="font-semibold">{app.category}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Platform:</span>
                          <span className="font-semibold">{app.platform}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Lead Resolver:</span>
                          <span className="font-semibold text-indigo-600">
                            {app.assignedLeadName || app.assignedLead?.name || 'Unassigned'}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Active / Total:</span>
                          <span className="font-bold text-slate-900">
                            {app.activeTickets || 0} active / {app.ticketsCount || 0} total
                          </span>
                        </div>
                      </div>

                      {/* API Key Box */}
                      <div className="mb-4">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          API Key (x-api-key)
                        </span>
                        <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-300 rounded-lg p-1.5 text-xs font-mono">
                          <span className="truncate flex-1 text-slate-800">
                            {isKeyVisible ? app.apiKey : `${app.apiKey?.slice(0, 8)}••••••••••••••••`}
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleKeyVisibility(app._id)}
                            className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                            title={isKeyVisible ? 'Hide Key' : 'Show Key'}
                          >
                            {isKeyVisible ? <HiOutlineEyeSlash className="w-3.5 h-3.5" /> : <HiOutlineEye className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyText(app.apiKey, app._id)}
                            className="p-1 text-slate-500 hover:text-indigo-600 cursor-pointer"
                            title="Copy API Key"
                          >
                            {copiedKeyId === app._id ? (
                              <HiOutlineClipboardDocumentCheck className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <HiOutlineClipboardDocument className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setSelectedSoftwareFilter(app.softwareId);
                          setActiveMainTab('tickets');
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        View Tickets ({app.activeTickets || 0}) ➔
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRegenerateKey(app._id)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                          title="Regenerate API Key"
                        >
                          <HiOutlineArrowPath className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditApp(app)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                          title="Edit Software"
                        >
                          <HiOutlinePencilSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteApp(app._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                          title="Delete / Deprecate"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: API INTEGRATION DOCS & CODE SAMPLES */}
      {/* ============================================================ */}
      {activeMainTab === 'docs' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Quick Guide Banner */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  RESTful Support Ingestion API v1
                </span>
                <h2 className="text-xl sm:text-2xl font-bold mt-2">External Software Integration Guide</h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Integrate these GET &amp; POST endpoints into your software applications (React, Angular, Android, iOS, Laravel, Python, Node). When users raise issues inside your apps, tickets appear here in real time!
                </p>
              </div>

              {/* Dynamic Software Selector for Docs */}
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 shrink-0">
                <span className="text-[10px] uppercase font-bold text-indigo-200 block mb-1">
                  Preview Credentials For:
                </span>
                <select
                  value={selectedDocApp.softwareId}
                  onChange={(e) => setDocSoftwareId(e.target.value)}
                  className="bg-slate-800 text-white border border-slate-600 rounded-lg px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-400"
                >
                  {softwareApps.map((a) => (
                    <option key={a._id} value={a.softwareId}>
                      {a.name} ({a.softwareId})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick Credential Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Base API URL</span>
              <code className="text-xs font-mono text-indigo-600 font-bold block mt-0.5 break-all">
                {window.location.origin}/api/software-support/v1
              </code>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Selected Software ID</span>
              <code className="text-xs font-mono text-slate-800 font-bold block mt-0.5">
                {selectedDocApp.softwareId}
              </code>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Software API Key</span>
              <div className="flex items-center gap-1 mt-0.5">
                <code className="text-xs font-mono text-slate-800 truncate">{selectedDocApp.apiKey}</code>
                <button
                  type="button"
                  onClick={() => handleCopyText(selectedDocApp.apiKey, 'doc-key')}
                  className="p-1 text-slate-500 hover:text-indigo-600 cursor-pointer"
                >
                  {copiedKeyId === 'doc-key' ? (
                    <HiOutlineClipboardDocumentCheck className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <HiOutlineClipboardDocument className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ENDPOINT 1: POST /v1/tickets */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-emerald-600 text-white">
                  POST
                </span>
                <span className="font-mono text-xs sm:text-sm font-bold text-slate-900">
                  /api/software-support/v1/tickets
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">Inbound Ticket Ingestion (External App ➔ ERP)</span>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Call this endpoint from your external software when an end user submits the support or bug report form.
              </p>

              {/* Headers */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">Required Headers</h4>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs space-y-1">
                  <div><strong>Content-Type:</strong> application/json</div>
                  <div><strong>x-api-key:</strong> {selectedDocApp.apiKey}</div>
                  <div><strong>x-software-id:</strong> {selectedDocApp.softwareId}</div>
                </div>
              </div>

              {/* JSON Payload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Request Body (JSON)</h4>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText(
                        JSON.stringify(
                          {
                            software_id: selectedDocApp.softwareId,
                            external_ticket_id: 'EXT-9821',
                            client_name: 'Dinesh Tawade',
                            client_email: 'dinesh@clienthospital.com',
                            client_phone: '+91 9876543210',
                            client_org: 'City Care Hospital',
                            subject: 'Billing invoice thermal printer margin cut issue',
                            description: 'When printing invoice on thermal printer, lines are overlapping on footer.',
                            category: 'Bug / Error',
                            priority: 'High',
                            app_version: 'v2.4.1',
                            environment: 'Production',
                            device_info: 'Chrome 122 on Windows 11',
                            metadata: { branch_id: 'BR-01', user_id: 'USR-890' },
                          },
                          null,
                          2
                        ),
                        'code-post'
                      )
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    <HiOutlineClipboardDocument className="w-3.5 h-3.5" />
                    Copy JSON
                  </button>
                </div>

                <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
{`{
  "software_id": "${selectedDocApp.softwareId}",
  "external_ticket_id": "EXT-9821",
  "client_name": "Dinesh Tawade",
  "client_email": "dinesh@clienthospital.com",
  "client_phone": "+91 9876543210",
  "client_org": "City Care Hospital",
  "subject": "Billing invoice thermal printer margin cut issue",
  "description": "When printing invoice on thermal printer, lines are overlapping on footer.",
  "category": "Bug / Error",
  "priority": "High",
  "app_version": "v2.4.1",
  "environment": "Production",
  "device_info": "Chrome 122 on Windows 11",
  "metadata": {
    "branch_id": "BR-01",
    "user_id": "USR-890"
  }
}`}
                </pre>
              </div>

              {/* Sample Response */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5">
                  Sample Success Response (201 Created)
                </h4>
                <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
{`{
  "success": true,
  "message": "Support ticket logged successfully.",
  "data": {
    "ticket_id": "STK-10023",
    "external_ticket_id": "EXT-9821",
    "software_id": "${selectedDocApp.softwareId}",
    "status": "Open",
    "priority": "High",
    "subject": "Billing invoice thermal printer margin cut issue",
    "client_email": "dinesh@clienthospital.com",
    "created_at": "2026-11-05T04:30:00.000Z"
  }
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* ENDPOINT 2: GET /v1/tickets */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-sky-600 text-white">
                  GET
                </span>
                <span className="font-mono text-xs sm:text-sm font-bold text-slate-900">
                  /api/software-support/v1/tickets?client_email=user@example.com
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">Fetch Client Tickets History</span>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Call this GET endpoint to render a "My Tickets" or "Support History" tab in your client application so users can check status and public engineer replies.
              </p>

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">Supported Query Parameters</h4>
                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                        <th className="p-2.5">Parameter</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      <tr>
                        <td className="p-2.5 text-indigo-600">client_email</td>
                        <td className="p-2.5 text-slate-500">string</td>
                        <td className="p-2.5 font-sans">Filter tickets created by specific client email address</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-indigo-600">external_ticket_id</td>
                        <td className="p-2.5 text-slate-500">string</td>
                        <td className="p-2.5 font-sans">Look up by your external ticket reference</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-indigo-600">status</td>
                        <td className="p-2.5 text-slate-500">string</td>
                        <td className="p-2.5 font-sans">Filter by Open, In Progress, Resolved, Closed</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sample Response */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5">
                  Sample Success Response (200 OK)
                </h4>
                <pre className="bg-slate-900 text-sky-300 p-4 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
{`{
  "success": true,
  "data": [
    {
      "ticket_id": "STK-10023",
      "external_ticket_id": "EXT-9821",
      "software_id": "${selectedDocApp.softwareId}",
      "subject": "Billing invoice thermal printer margin cut issue",
      "status": "Resolved",
      "priority": "High",
      "resolution_notes": "Updated print CSS style sheet in v2.4.2 patch. Please restart thermal service.",
      "resolved_at": "2026-11-05T05:00:00.000Z",
      "messages": [
        {
          "sender_type": "client",
          "sender_name": "Dinesh Tawade",
          "message": "When printing invoice on thermal printer, lines are overlapping.",
          "created_at": "2026-11-05T04:30:00.000Z"
        },
        {
          "sender_type": "agent",
          "sender_name": "Suresh Dev",
          "message": "We have identified the CSS margin issue on 80mm paper and pushed a fix.",
          "created_at": "2026-11-05T04:55:00.000Z"
        }
      ]
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 20 }
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* Code Snippets Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Ready-to-Use Code Snippet (cURL)</h3>
            <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
{`curl -X POST "${window.location.origin}/api/software-support/v1/tickets" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${selectedDocApp.apiKey}" \\
  -H "x-software-id: ${selectedDocApp.softwareId}" \\
  -d '{
    "client_name": "Dinesh Tawade",
    "client_email": "dinesh@example.com",
    "subject": "Problem in module",
    "description": "Getting error 500 when saving report",
    "priority": "High"
  }'`}
            </pre>
          </div>
        </div>
      )}

      {/* 5. MODAL: REGISTER / EDIT SOFTWARE APP */}
      {isRegisterAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsRegisterAppModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingApp ? 'Edit Software Product' : 'Register New Software Product'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure software identifier and generate API key for ticket ingestion.
                </p>
              </div>
              <button onClick={() => setIsRegisterAppModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSoftwareApp} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Software ID Slug *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingApp}
                    value={softwareIdInput}
                    onChange={(e) => setSoftwareIdInput(e.target.value.toUpperCase())}
                    placeholder="e.g. SW-HOSP-01, APP-LMS-202"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500 uppercase disabled:bg-slate-100"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Unique ID passed in API header</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Software Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="e.g. CarePlus Hospital ERP"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Category *
                  </label>
                  <select
                    value={appCategory}
                    onChange={(e) => setAppCategory(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    {SOFTWARE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Platform
                  </label>
                  <input
                    type="text"
                    value={appPlatform}
                    onChange={(e) => setAppPlatform(e.target.value)}
                    placeholder="Web, Android, iOS, Windows"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Lead Support Engineer / Developer
                </label>
                <select
                  value={appAssignedLead}
                  onChange={(e) => setAppAssignedLead(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Unassigned (General Support Queue)</option>
                  {companySolvers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.role || 'Member'} - {s.department || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Software Description
                </label>
                <textarea
                  rows={2}
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  placeholder="Summary of client application, tech stack, or modules covered..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Outbound Webhook URL (Optional Callback)
                </label>
                <input
                  type="url"
                  value={appWebhookUrl}
                  onChange={(e) => setAppWebhookUrl(e.target.value)}
                  placeholder="https://clientapp.com/api/webhooks/support"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  When our support team resolves or replies to a ticket, our system will POST updates to this URL.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRegisterAppModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {editingApp ? 'Save Changes' : 'Register Software'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: RESOLVE TICKET */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsResolveModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Resolve External Software Ticket</h3>
              <button onClick={() => setIsResolveModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmResolve} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resolution Solution Notes *
                </label>
                <textarea
                  rows={4}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Explain fix details, patch version released, or instructions for the client..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  This resolution text will be exposed to the external app via GET API so the client can read the fix.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Confirm Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: ASSIGN ENGINEER */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsAssignModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Assign Support Engineer</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAssign} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Engineer / Developer *
                </label>
                <select
                  required
                  value={newAssigneeId}
                  onChange={(e) => setNewAssigneeId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="">Select Team Member...</option>
                  {companySolvers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.role || s.designation || 'Staff'} - {s.department || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Assign Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoftwareSupport;

