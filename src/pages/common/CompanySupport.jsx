import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  HiOutlineVideoCamera,
  HiOutlineEye,
  HiOutlineArrowDownTray,
  HiOutlineBuildingOffice2,
  HiOutlineGlobeAlt,
  HiOutlineMagnifyingGlass,
  HiOutlineUserGroup,
  HiOutlineWrenchScrewdriver,
  HiOutlineWifi,
  HiOutlineComputerDesktop,
  HiOutlineKey,
  HiOutlineTag,
  HiOutlineArrowRight,
  HiOutlineCheck,
} from 'react-icons/hi2';
import api from '../../api/axios';
import { API_BASE_URL } from '../../config';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'Hardware Issue', label: 'Hardware Issue', icon: HiOutlineComputerDesktop, desc: 'Laptop, mouse, keyboard, monitor, printer' },
  { id: 'Internet & Network', label: 'Internet & Network', icon: HiOutlineWifi, desc: 'Wi-Fi connection, LAN port, slow speed, VPN' },
  { id: 'Software & Tools', label: 'Software & Tools', icon: HiOutlineWrenchScrewdriver, desc: 'OS error, code editor, MS Office, licenses' },
  { id: 'Account & Access', label: 'Account & Access', icon: HiOutlineKey, desc: 'Portal login, server/DB access, credentials' },
  { id: 'Facilities & Office', label: 'Facilities & Office', icon: HiOutlineBuildingOffice2, desc: 'Electricity, AC, desk, chair, keycard' },
  { id: 'HR & Admin', label: 'HR & Admin', icon: HiOutlineUserGroup, desc: 'ID card, stationeries, asset handover, policy' },
  { id: 'Other Internal Issue', label: 'Other Internal Issue', icon: HiOutlineTag, desc: 'Any other internal workplace request' },
];

const getMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const isVideoAttachment = (att) => {
  if (!att) return false;
  if (typeof att === 'object' && att.fileType === 'video') return true;
  const url = typeof att === 'string' ? att : att.url || '';
  return /\.(mp4|webm|mov|mkv)$/i.test(url);
};

const CompanySupport = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { socket } = useSocket();

  // Selected ticket & views
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [viewFilter, setViewFilter] = useState('all'); // 'all', 'my', 'assigned', 'active', 'resolved'
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // Raise Ticket Form
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Hardware Issue');
  const [priority, setPriority] = useState('Medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [raiseMediaFile, setRaiseMediaFile] = useState(null);
  const [raiseMediaPreview, setRaiseMediaPreview] = useState(null);
  const raiseFileInputRef = useRef(null);

  // Chat message state
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatMediaFile, setChatMediaFile] = useState(null);
  const [chatMediaPreview, setChatMediaPreview] = useState(null);
  const chatFileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Reassign & Resolve form state
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [reassignNote, setReassignNote] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // 1. Fetch Company Solvers (Company members)
  const { data: solversData } = useQuery({
    queryKey: ['companySolvers'],
    queryFn: async () => {
      const { data } = await api.get('/company-tickets/solvers');
      return data?.solvers || [];
    },
  });
  const companySolvers = solversData || [];

  // 2. Fetch Ticket Stats
  const { data: statsData } = useQuery({
    queryKey: ['companyTicketStats'],
    queryFn: async () => {
      const { data } = await api.get('/company-tickets/stats');
      return data?.stats || {};
    },
    refetchInterval: 15000,
  });
  const stats = statsData || {
    total: 0,
    open: 0,
    inProgress: 0,
    waiting: 0,
    resolved: 0,
    closed: 0,
    assignedToMe: 0,
    myRaised: 0,
  };

  // 3. Fetch Company Tickets
  const {
    data: ticketsData,
    isLoading: ticketsLoading,
    refetch: refetchTickets,
  } = useQuery({
    queryKey: ['companyTickets', viewFilter, categoryFilter, priorityFilter, statusFilter, searchQuery],
    queryFn: async () => {
      const params = {};
      if (viewFilter === 'my') params.view = 'my';
      if (viewFilter === 'assigned') params.view = 'assigned';
      if (viewFilter === 'active') params.status = 'In Progress';
      if (viewFilter === 'resolved') params.status = 'Resolved';
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const { data } = await api.get('/company-tickets', { params });
      return data?.tickets || [];
    },
    refetchInterval: 12000,
  });

  const tickets = ticketsData || [];

  // Auto-select first ticket if none selected
  useEffect(() => {
    if (tickets.length > 0 && !selectedTicketId) {
      setSelectedTicketId(tickets[0]._id);
    }
  }, [tickets, selectedTicketId]);

  // 4. Fetch Selected Ticket Full Detail
  const { data: selectedTicketResponse, refetch: refetchSelectedTicket } = useQuery({
    queryKey: ['companyTicketDetail', selectedTicketId],
    queryFn: async () => {
      if (!selectedTicketId) return null;
      const { data } = await api.get(`/company-tickets/${selectedTicketId}`);
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

  // Socket setup: Join ticket room
  useEffect(() => {
    if (!socket || !selectedTicketId) return;

    socket.emit('join-ticket', selectedTicketId);

    const handleTicketMessage = (newMsg) => {
      setChatMessages((prev) => {
        // Prevent duplicate
        if (newMsg._id && prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
      queryClient.invalidateQueries(['companyTickets']);
    };

    const handleStatusUpdate = (updatePayload) => {
      toast.success(`Ticket marked as ${updatePayload.status}`);
      queryClient.invalidateQueries(['companyTicketDetail', selectedTicketId]);
      queryClient.invalidateQueries(['companyTickets']);
      queryClient.invalidateQueries(['companyTicketStats']);
    };

    socket.on('ticket_message', handleTicketMessage);
    socket.on('ticket_status_update', handleStatusUpdate);

    return () => {
      socket.emit('leave-ticket', selectedTicketId);
      socket.off('ticket_message', handleTicketMessage);
      socket.off('ticket_status_update', handleStatusUpdate);
    };
  }, [socket, selectedTicketId, queryClient]);

  // Scroll to bottom on message change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Upload media helper
  const uploadMedia = async (file) => {
    const formData = new FormData();
    formData.append('media', file);
    const { data } = await api.post('/company-tickets/upload-media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.files[0];
  };

  // Submit Raise Ticket
  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error('Subject and problem description are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const attachments = [];
      if (raiseMediaFile) {
        toast.loading('Uploading photo / attachment...', { id: 'raise-upload' });
        const uploaded = await uploadMedia(raiseMediaFile);
        attachments.push(uploaded);
        toast.dismiss('raise-upload');
      }

      const { data } = await api.post('/company-tickets', {
        subject: subject.trim(),
        category,
        priority,
        assignedTo: assignedTo || null,
        description: description.trim(),
        attachments,
      });

      toast.success(data.message || 'Internal company ticket raised successfully!');
      setIsRaiseModalOpen(false);
      setSubject('');
      setDescription('');
      setCategory('Hardware Issue');
      setPriority('Medium');
      setAssignedTo('');
      setRaiseMediaFile(null);
      setRaiseMediaPreview(null);

      await queryClient.invalidateQueries(['companyTickets']);
      await queryClient.invalidateQueries(['companyTicketStats']);

      if (data?.ticket?._id) {
        setSelectedTicketId(data.ticket._id);
      }
    } catch (err) {
      toast.dismiss('raise-upload');
      toast.error(err.response?.data?.message || 'Failed to raise ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!messageInput.trim() && !chatMediaFile) || !selectedTicketId) return;

    const currentText = messageInput.trim();
    const currentMediaFile = chatMediaFile;
    const currentMediaPreview = chatMediaPreview;

    setMessageInput('');
    setChatMediaFile(null);
    setChatMediaPreview(null);

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      sender: user?._id,
      senderName: user?.name || 'You',
      senderRole: user?.role || 'Staff',
      senderAvatar: user?.profilePicture || '',
      message: currentText || (currentMediaPreview?.fileType === 'video' ? 'Shared a video' : 'Shared a file'),
      attachments: currentMediaPreview
        ? [
            {
              url: currentMediaPreview.url,
              name: currentMediaPreview.name,
              fileType: currentMediaPreview.fileType,
              size: currentMediaPreview.size,
            },
          ]
        : [],
      createdAt: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, optimisticMsg]);
    setIsSendingMessage(true);

    try {
      const attachments = [];
      if (currentMediaFile) {
        toast.loading('Uploading file...', { id: 'chat-media-upload' });
        const uploaded = await uploadMedia(currentMediaFile);
        attachments.push(uploaded);
        toast.dismiss('chat-media-upload');
      }

      const { data } = await api.post(`/company-tickets/${selectedTicketId}/messages`, {
        message: currentText,
        attachments,
      });

      if (data?.newMessage) {
        setChatMessages((prev) => prev.map((m) => (m._id === tempId ? data.newMessage : m)));
      }
      queryClient.invalidateQueries(['companyTickets']);
    } catch (err) {
      toast.dismiss('chat-media-upload');
      toast.error(err.response?.data?.message || 'Failed to send message');
      setChatMessages((prev) => prev.filter((m) => m._id !== tempId));
      setMessageInput(currentText);
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
      const { data } = await api.put(`/company-tickets/${selectedTicketId}/status`, {
        status: newStatus,
      });
      toast.success(data.message || `Status updated to ${newStatus}`);
      queryClient.invalidateQueries(['companyTicketDetail', selectedTicketId]);
      queryClient.invalidateQueries(['companyTickets']);
      queryClient.invalidateQueries(['companyTicketStats']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Submit Resolve
  const handleConfirmResolve = async (e) => {
    e.preventDefault();
    if (!selectedTicketId) return;

    try {
      const { data } = await api.put(`/company-tickets/${selectedTicketId}/status`, {
        status: 'Resolved',
        resolutionNotes: resolutionNotes.trim(),
      });
      toast.success(data.message || 'Ticket marked as Resolved!');
      setIsResolveModalOpen(false);
      setResolutionNotes('');
      queryClient.invalidateQueries(['companyTicketDetail', selectedTicketId]);
      queryClient.invalidateQueries(['companyTickets']);
      queryClient.invalidateQueries(['companyTicketStats']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve ticket');
    }
  };

  // Reassign Solver
  const handleConfirmReassign = async (e) => {
    e.preventDefault();
    if (!selectedTicketId || !newAssigneeId) {
      toast.error('Please select a company member to assign');
      return;
    }

    try {
      const { data } = await api.put(`/company-tickets/${selectedTicketId}/reassign`, {
        assignedTo: newAssigneeId,
        notes: reassignNote.trim(),
      });
      toast.success(data.message || 'Ticket successfully re-assigned!');
      setIsReassignModalOpen(false);
      setNewAssigneeId('');
      setReassignNote('');
      queryClient.invalidateQueries(['companyTicketDetail', selectedTicketId]);
      queryClient.invalidateQueries(['companyTickets']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reassign ticket');
    }
  };

  // Badges
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
      case 'Waiting on User':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Waiting on User
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

  const getCategoryIcon = (catName) => {
    const found = CATEGORIES.find((c) => c.id === catName);
    const IconComp = found?.icon || HiOutlineTag;
    return <IconComp className="w-4 h-4 text-indigo-600 shrink-0" />;
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP 3-WAY MODE PILL SWITCHER */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center p-1 bg-slate-100/80 rounded-xl w-full md:w-auto overflow-x-auto">
          <button
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all bg-white text-indigo-600 shadow-xs whitespace-nowrap cursor-default"
          >
            <HiOutlineBuildingOffice2 className="w-4 h-4" />
            <span>Company Support</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Internal
            </span>
          </button>

          <Link
            to="/software-support"
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
          >
            <HiOutlineComputerDesktop className="w-4 h-4 text-slate-400" />
            <span>Softwares Support</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
              Client API
            </span>
          </Link>

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
            Organization: <strong className="text-slate-900">{user?.company?.name || 'Your Company Workspace'}</strong>
          </span>
        </div>
      </div>

      {/* 2. HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Company Support &amp; Internal Helpdesk
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Report hardware breakdowns, Wi-Fi &amp; network issues, software requests, or office facilities directly to your manager or solving team.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              refetchTickets();
              refetchSelectedTicket();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <HiOutlineArrowPath className="w-4 h-4 text-slate-500" />
            Refresh
          </button>

          <button
            onClick={() => setIsRaiseModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Raise Internal Ticket
          </button>
        </div>
      </div>

      {/* 3. KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Tickets</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <HiOutlineTicket className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{stats.total || 0}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">All company requests</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs ring-1 ring-amber-500/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 uppercase tracking-wider">Assigned to Me</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <HiOutlineUser className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{stats.assignedToMe || 0}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Needs your action</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-700 uppercase tracking-wider">My Raised</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <HiOutlineTicket className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-600">{stats.myRaised || 0}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Pending my issues</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-sky-700 uppercase tracking-wider">In Progress</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <HiOutlineClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-600">{stats.inProgress || 0}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Under investigation</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Resolved</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <HiOutlineCheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            {(stats.resolved || 0) + (stats.closed || 0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Successfully solved</p>
        </div>
      </div>

      {/* 4. FILTER CONTROLS & SEARCH BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* View Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {[
            { id: 'all', label: 'All Tickets' },
            { id: 'assigned', label: 'Assigned to Me', badge: stats.assignedToMe },
            { id: 'my', label: 'My Tickets', badge: stats.myRaised },
            { id: 'active', label: 'Active In Progress' },
            { id: 'resolved', label: 'Resolved / Closed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewFilter(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                viewFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    viewFilter === tab.id ? 'bg-white text-indigo-700' : 'bg-rose-500 text-white'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticket #, subject, member name..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. MASTER-DETAIL SPLIT SCREEN (TICKETS LIST + ACTIVE DISCUSSION) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[620px]">
        {/* LEFT COLUMN: TICKETS LIST (4 cols on lg) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              Showing <strong>{tickets.length}</strong> tickets
            </span>
            <span className="text-[11px] text-slate-400">Click a ticket to view conversation</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[680px]">
            {ticketsLoading ? (
              <div className="p-12 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs">Loading company tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <HiOutlineTicket className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-800">No tickets found</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  {searchQuery || categoryFilter !== 'ALL' || viewFilter !== 'all'
                    ? 'No tickets match your filter criteria.'
                    : 'No internal tickets have been reported in your company yet.'}
                </p>
                <button
                  onClick={() => setIsRaiseModalOpen(true)}
                  className="mt-3 text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                >
                  + Raise First Ticket
                </button>
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicketId === t._id;
                const isUrgent = t.priority === 'Urgent';
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
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {t.ticketNumber}
                        </span>
                        {getStatusBadge(t.status)}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {getPriorityBadge(t.priority)}
                      </div>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 mb-1">
                      {t.subject}
                    </h4>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2.5">
                      {t.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {t.creatorName?.charAt(0) || 'U'}
                        </span>
                        <span className="font-medium truncate max-w-[110px]">{t.creatorName}</span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <span>Solver:</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[100px]">
                          {t.assignedToName || 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE TICKET DETAIL & LIVE DISCUSSION (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
          {!selectedTicket ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
              <HiOutlineChatBubbleLeftRight className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-800">Select a Ticket</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
                Click any ticket from the left panel to review details, chat with the solver or creator, and track resolution.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full">
              {/* Workspace Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-xs">
                        {selectedTicket.ticketNumber}
                      </span>
                      {getStatusBadge(selectedTicket.status)}
                      {getPriorityBadge(selectedTicket.priority)}
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                        {getCategoryIcon(selectedTicket.category)}
                        {selectedTicket.category}
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                      {selectedTicket.subject}
                    </h2>
                  </div>

                  {/* Quick Solver Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
                    >
                      <option value="Open">Status: Open</option>
                      <option value="In Progress">Status: In Progress</option>
                      <option value="Waiting on User">Status: Waiting on User</option>
                      <option value="Resolved">Status: Resolved</option>
                      <option value="Closed">Status: Closed</option>
                    </select>

                    <button
                      onClick={() => {
                        setNewAssigneeId(selectedTicket.assignedTo?._id || selectedTicket.assignedTo || '');
                        setIsReassignModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      title="Re-assign to another team member"
                    >
                      Reassign
                    </button>

                    {selectedTicket.status !== 'Resolved' && selectedTicket.status !== 'Closed' && (
                      <button
                        onClick={() => setIsResolveModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>

                {/* Meta details bar */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3.5 pt-3 border-t border-slate-200/70 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Reported By</span>
                    <span className="font-semibold text-slate-800">
                      {selectedTicket.creatorName || selectedTicket.creator?.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {selectedTicket.creatorRole || 'Staff'} • {selectedTicket.creatorDepartment || 'General'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Solver</span>
                    <span className="font-semibold text-indigo-700">
                      {selectedTicket.assignedToName || selectedTicket.assignedTo?.name || 'Unassigned'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {selectedTicket.assignedToRole || selectedTicket.assignedToDepartment || 'Resolving Person'}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Created On</span>
                    <span className="text-slate-700">
                      {new Date(selectedTicket.createdAt).toLocaleDateString()} at{' '}
                      {new Date(selectedTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Resolution Notes Banner (if resolved) */}
                {selectedTicket.resolutionNotes && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                    <div className="flex items-center gap-1.5 font-bold mb-0.5 text-emerald-800">
                      <HiOutlineCheckCircle className="w-4 h-4 text-emerald-600" />
                      Resolution Solution:
                    </div>
                    <p className="leading-relaxed whitespace-pre-line">{selectedTicket.resolutionNotes}</p>
                    {selectedTicket.resolvedByName && (
                      <span className="text-[10px] text-emerald-700 mt-1 block">
                        Resolved by {selectedTicket.resolvedByName} on {new Date(selectedTicket.resolvedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Chat / Discussion History */}
              <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 max-h-[460px] bg-slate-50/30">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No messages in this discussion yet.
                  </div>
                ) : (
                  chatMessages.map((msg, index) => {
                    const isCurrentUser = msg.sender === user?._id || msg.sender?._id === user?._id;
                    return (
                      <div
                        key={msg._id || index}
                        className={`flex gap-2.5 max-w-[85%] ${isCurrentUser ? 'ml-auto flex-row-reverse' : ''}`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isCurrentUser ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {msg.senderName?.charAt(0) || 'U'}
                        </div>

                        <div
                          className={`rounded-2xl p-3.5 text-xs shadow-xs ${
                            isCurrentUser
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                          }`}
                        >
                          <div
                            className={`flex items-center gap-2 mb-1 text-[10px] font-semibold ${
                              isCurrentUser ? 'text-indigo-200' : 'text-slate-500'
                            }`}
                          >
                            <span>{msg.senderName}</span>
                            <span>•</span>
                            <span>{msg.senderRole}</span>
                            <span>•</span>
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <p className="leading-relaxed whitespace-pre-line text-xs sm:text-sm font-normal">
                            {msg.message}
                          </p>

                          {/* Attachments rendering */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-1.5 pt-2 border-t border-white/20">
                              {msg.attachments.map((att, attIdx) => {
                                const isVideo = isVideoAttachment(att);
                                const mediaUrl = getMediaUrl(typeof att === 'string' ? att : att.url);
                                const fileName = typeof att === 'object' ? att.name || 'Attachment' : 'Attachment';

                                if (isVideo) {
                                  return (
                                    <video
                                      key={attIdx}
                                      controls
                                      src={mediaUrl}
                                      className="rounded-lg max-h-48 w-full bg-black"
                                    />
                                  );
                                }

                                return (
                                  <div key={attIdx} className="group relative">
                                    <img
                                      src={mediaUrl}
                                      alt={fileName}
                                      onClick={() => setLightboxUrl(mediaUrl)}
                                      className="max-h-44 rounded-lg object-cover border border-black/10 cursor-pointer hover:opacity-95"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 sm:p-4 border-t border-slate-200 bg-white">
                {/* File preview chip */}
                {chatMediaPreview && (
                  <div className="mb-2 p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {chatMediaPreview.fileType === 'video' ? (
                        <HiOutlineVideoCamera className="w-4 h-4 text-indigo-600 shrink-0" />
                      ) : (
                        <HiOutlinePhoto className="w-4 h-4 text-indigo-600 shrink-0" />
                      )}
                      <span className="text-xs text-slate-700 truncate">{chatMediaPreview.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        setChatMediaFile(null);
                        setChatMediaPreview(null);
                      }}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <HiOutlineXMark className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={chatFileInputRef}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const isVideo = file.type.startsWith('video/');
                      setChatMediaFile(file);
                      setChatMediaPreview({
                        name: file.name,
                        fileType: isVideo ? 'video' : 'image',
                        url: URL.createObjectURL(file),
                      });
                    }}
                    accept="image/*,video/*"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => chatFileInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Attach screenshot or photo"
                  >
                    <HiOutlinePaperClip className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a reply to solver / creator..."
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />

                  <button
                    type="submit"
                    disabled={isSendingMessage || (!messageInput.trim() && !chatMediaFile)}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <HiOutlinePaperAirplane className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. MODAL: RAISE NEW COMPANY TICKET */}
      {isRaiseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsRaiseModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Raise Internal Company Ticket</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Report a workplace issue to your reporting manager or dedicated solver.
                </p>
              </div>
              <button onClick={() => setIsRaiseModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRaiseTicket} className="space-y-4">
              {/* Category Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Issue Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => {
                    const IconComp = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-600 text-indigo-900 ring-1 ring-indigo-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <IconComp className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                          <span className="text-xs font-bold leading-none">{cat.label}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{cat.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Assignee / Solving Person */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign Solving Person / Manager
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="">Auto-assign (Reporting Manager / Admin)</option>
                    {companySolvers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.role || s.designation || 'Staff'} - {s.department || 'General'})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">Leave empty to auto-route to your manager</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Urgency Priority *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="Low">Low - Minor convenience issue</option>
                    <option value="Medium">Medium - Regular work hindrance</option>
                    <option value="High">High - Blocking urgent task</option>
                    <option value="Urgent">Urgent - Workstation completely stalled</option>
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ticket Subject *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Mouse left button broken, Wi-Fi dropping on 2nd floor, License expired"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Problem Details */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Problem Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the exact issue, error code, room/desk location, or troubleshooting already attempted..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              {/* File Attachment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attach Photo / Screenshot (Optional)
                </label>
                <input
                  type="file"
                  ref={raiseFileInputRef}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setRaiseMediaFile(file);
                    setRaiseMediaPreview({
                      name: file.name,
                      url: URL.createObjectURL(file),
                    });
                  }}
                  accept="image/*,video/*"
                  className="hidden"
                />

                {!raiseMediaPreview ? (
                  <button
                    type="button"
                    onClick={() => raiseFileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-300 hover:border-indigo-500 p-3 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer text-xs"
                  >
                    <HiOutlinePhoto className="w-4 h-4" />
                    <span>Upload photo of hardware or screenshot of error</span>
                  </button>
                ) : (
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <HiOutlinePhoto className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="truncate text-slate-800">{raiseMediaPreview.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRaiseMediaFile(null);
                        setRaiseMediaPreview(null);
                      }}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <HiOutlineXMark className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRaiseModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting Ticket...' : 'Submit Internal Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: RESOLVE TICKET */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsResolveModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Mark Ticket as Resolved</h3>
              <button onClick={() => setIsResolveModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmResolve} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resolution Summary / Solution Notes *
                </label>
                <textarea
                  rows={4}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Mouse replaced with new wireless Logitech unit; Wi-Fi access point rebooted and tested at 120 Mbps..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
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

      {/* 8. MODAL: REASSIGN SOLVER */}
      {isReassignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsReassignModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Reassign Internal Ticket</h3>
              <button onClick={() => setIsReassignModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReassign} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Solving Person / Colleague *
                </label>
                <select
                  required
                  value={newAssigneeId}
                  onChange={(e) => setNewAssigneeId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="">Select Company Member...</option>
                  {companySolvers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.role || s.designation || 'Staff'} - {s.department || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Handover Notes / Instructions
                </label>
                <textarea
                  rows={3}
                  value={reassignNote}
                  onChange={(e) => setReassignNote(e.target.value)}
                  placeholder="e.g. Assigning to Rajesh from Hardware team as new replacement stock arrived..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsReassignModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Reassign Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. LIGHTBOX IMAGE PREVIEW */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs cursor-pointer"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={lightboxUrl} alt="Preview" className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl" />
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black cursor-pointer"
            >
              <HiOutlineXMark className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySupport;

