import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  HiOutlineLifebuoy,
  HiOutlineTicket,
  HiOutlineChatBubbleLeftRight,
  HiOutlinePaperAirplane,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineExclamationTriangle,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowPath,
  HiOutlineBuildingOffice2,
  HiOutlineUser,
  HiOutlineTag,
  HiOutlineShieldCheck,
  HiOutlineChevronRight,
  HiOutlineInformationCircle,
  HiOutlinePaperClip,
  HiOutlinePhoto,
  HiOutlineVideoCamera,
  HiOutlineEye,
  HiOutlineXMark,
} from 'react-icons/hi2';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved', 'Closed'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

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

const SuperAdminTickets = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Form states for selected ticket
  const [statusForm, setStatusForm] = useState('Open');
  const [priorityForm, setPriorityForm] = useState('Medium');
  const [resolutionNotesForm, setResolutionNotesForm] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Live Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatMediaFile, setChatMediaFile] = useState(null);
  const [chatMediaPreview, setChatMediaPreview] = useState(null);
  const chatFileInputRef = useRef(null);

  // Lightbox preview for full images
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const messagesEndRef = useRef(null);

  // 1. Fetch Ticket Statistics
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['ticketStatsSummary'],
    queryFn: async () => {
      const { data } = await api.get('/tickets/stats/summary');
      return data?.stats || {};
    },
    refetchInterval: 12000,
  });

  // 2. Fetch Tickets List
  const { data: ticketsData, isLoading: ticketsLoading, refetch: refetchTickets } = useQuery({
    queryKey: ['superAdminTickets', statusFilter, priorityFilter, categoryFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const { data } = await api.get(`/tickets?${params.toString()}`);
      return data?.tickets || [];
    },
    refetchInterval: 10000,
  });

  const tickets = ticketsData || [];

  // Auto-select first ticket if none selected
  useEffect(() => {
    if (!selectedTicketId && tickets.length > 0) {
      setSelectedTicketId(tickets[0]._id);
    }
  }, [tickets, selectedTicketId]);

  // 3. Fetch Selected Ticket Details
  const { data: activeTicketData, isLoading: activeTicketLoading, refetch: refetchActiveTicket } = useQuery({
    queryKey: ['activeTicket', selectedTicketId],
    queryFn: async () => {
      if (!selectedTicketId) return null;
      const { data } = await api.get(`/tickets/${selectedTicketId}`);
      return data?.ticket || null;
    },
    enabled: Boolean(selectedTicketId),
  });

  const activeTicket = activeTicketData;

  // Sync active ticket forms & initial messages
  useEffect(() => {
    if (activeTicket) {
      setStatusForm(activeTicket.status || 'Open');
      setPriorityForm(activeTicket.priority || 'Medium');
      setResolutionNotesForm(activeTicket.resolutionNotes || '');
      setChatMessages(activeTicket.messages || []);
    }
  }, [activeTicket]);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, chatMediaPreview]);

  // Socket.io Real-time Ticket Room Connection
  useEffect(() => {
    if (!socket || !selectedTicketId) return;

    socket.emit('join-ticket', selectedTicketId);

    const handleTicketMessage = (msg) => {
      setChatMessages((prev) => {
        const exists = prev.some(
          (m) =>
            m._id === msg._id ||
            (m.sender === msg.sender && m.message === msg.message && Math.abs(new Date(m.createdAt) - new Date(msg.createdAt)) < 2000)
        );
        if (exists) return prev;
        return [...prev, msg];
      });
      queryClient.invalidateQueries({ queryKey: ['superAdminTickets'] });
    };

    const handleStatusUpdate = (update) => {
      if (update.ticketId === selectedTicketId) {
        setStatusForm(update.status);
        setPriorityForm(update.priority);
        if (update.resolutionNotes !== undefined) {
          setResolutionNotesForm(update.resolutionNotes);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['superAdminTickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticketStatsSummary'] });
    };

    socket.on('ticket_message', handleTicketMessage);
    socket.on('ticket_status_update', handleStatusUpdate);

    return () => {
      socket.emit('leave-ticket', selectedTicketId);
      socket.off('ticket_message', handleTicketMessage);
      socket.off('ticket_status_update', handleStatusUpdate);
    };
  }, [socket, selectedTicketId, queryClient]);

  // File validation helper (Image <= 1MB, Video <= 2MB)
  const validateAndHandleChatFile = (file) => {
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast.error('Only image and video files are supported.');
      return;
    }

    // Image rule: <= 1MB
    if (isImage && file.size > 1 * 1024 * 1024) {
      toast.error(
        `Image size cannot exceed 1 MB. Selected file is ${(file.size / (1024 * 1024)).toFixed(2)} MB.`
      );
      return;
    }

    // Video rule: <= 2MB
    if (isVideo && file.size > 2 * 1024 * 1024) {
      toast.error(
        `Video size cannot exceed 2 MB. Selected video is ${(file.size / (1024 * 1024)).toFixed(2)} MB.`
      );
      return;
    }

    setChatMediaFile(file);
    const objectUrl = URL.createObjectURL(file);
    setChatMediaPreview({
      url: objectUrl,
      fileType: isVideo ? 'video' : 'image',
      name: file.name,
      size: file.size,
    });
  };

  // Upload helper
  const uploadMedia = async (file) => {
    const formData = new FormData();
    formData.append('media', file);
    const { data } = await api.post('/tickets/upload-media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data?.file;
  };

  // Update Status & Resolution Notes
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedTicketId) return;

    try {
      setIsUpdatingStatus(true);
      const { data } = await api.put(`/tickets/${selectedTicketId}/status`, {
        status: statusForm,
        priority: priorityForm,
        resolutionNotes: resolutionNotesForm,
      });

      toast.success(data.message || 'Ticket status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['activeTicket', selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ['superAdminTickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticketStatsSummary'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update ticket status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Send Live Chat Message (with optional Image/Video attachment)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!messageInput.trim() && !chatMediaFile) || !selectedTicketId) return;

    const currentText = messageInput.trim();
    const currentMediaFile = chatMediaFile;
    const currentMediaPreview = chatMediaPreview;

    setMessageInput('');
    setChatMediaFile(null);
    setChatMediaPreview(null);

    // Optimistic push
    const optimisticMsg = {
      _id: `temp-${Date.now()}`,
      sender: user?._id,
      senderName: user?.name || 'Super Admin',
      senderRole: 'Super Admin',
      isSuperAdmin: true,
      message: currentText || (currentMediaPreview?.fileType === 'video' ? 'Shared a video' : 'Shared an image'),
      attachments: currentMediaPreview
        ? [
            {
              url: currentMediaPreview.url,
              fileType: currentMediaPreview.fileType,
              originalName: currentMediaPreview.name,
              size: currentMediaPreview.size,
            },
          ]
        : [],
      createdAt: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, optimisticMsg]);

    try {
      setIsSendingMessage(true);

      let attachments = [];
      if (currentMediaFile) {
        const uploaded = await uploadMedia(currentMediaFile);
        attachments = [uploaded];
      }

      const { data } = await api.post(`/tickets/${selectedTicketId}/messages`, {
        message: currentText,
        attachments,
      });

      if (data?.ticket?.messages) {
        setChatMessages(data.ticket.messages);
      }
      queryClient.invalidateQueries({ queryKey: ['superAdminTickets'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
      setChatMessages((prev) => prev.filter((m) => m._id !== optimisticMsg._id));
      setMessageInput(currentText);
      setChatMediaFile(currentMediaFile);
      setChatMediaPreview(currentMediaPreview);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Open
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <HiOutlineClock className="w-3.5 h-3.5" />
            In Progress
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <HiOutlineCheckCircle className="w-3.5 h-3.5" />
            Resolved
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
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

  const renderAttachmentBubble = (att, idx) => {
    const isVideo = isVideoAttachment(att);
    const mediaUrl = getMediaUrl(typeof att === 'string' ? att : att.url);
    const originalName = typeof att === 'object' ? att.originalName : '';
    const size = typeof att === 'object' ? att.size : 0;

    if (isVideo) {
      return (
        <div key={idx} className="mt-1.5 rounded-xl overflow-hidden border border-slate-200 bg-slate-950 max-w-sm">
          <video
            controls
            preload="metadata"
            className="w-full max-h-60 object-contain bg-black"
            src={mediaUrl}
          >
            Your browser does not support video playback.
          </video>
          <div className="p-2 bg-slate-900/90 text-[10px] text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1 truncate max-w-[200px]">
              <HiOutlineVideoCamera className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              {originalName || 'Video attachment'}
            </span>
            {size > 0 && <span className="text-slate-400 shrink-0">{(size / (1024 * 1024)).toFixed(2)} MB</span>}
          </div>
        </div>
      );
    }

    return (
      <div key={idx} className="mt-1.5 max-w-xs">
        <div
          onClick={() => setLightboxUrl(mediaUrl)}
          className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-50 hover:shadow-md transition-all"
        >
          <img
            src={mediaUrl}
            alt={originalName || 'Attachment preview'}
            className="w-full max-h-56 object-cover transition-transform duration-200 group-hover:scale-102"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="bg-white/90 text-slate-800 text-[11px] font-semibold px-2 py-1 rounded-md shadow-xs flex items-center gap-1">
              <HiOutlineEye className="w-3.5 h-3.5" />
              Enlarge
            </span>
          </div>
        </div>
        {originalName && (
          <div className="text-[10px] text-slate-400 mt-1 truncate max-w-xs flex items-center justify-between">
            <span className="truncate">{originalName}</span>
            {size > 0 && <span>{(size / 1024).toFixed(0)} KB</span>}
          </div>
        )}
      </div>
    );
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const stats = statsData || {
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    urgentTickets: 0,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Support Helpdesk & Tickets</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Socket
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Resolve issues raised by office administrators & staff, inspect video/image evidence, and communicate in real time.
          </p>
        </div>

        <button
          onClick={() => {
            refetchStats();
            refetchTickets();
            refetchActiveTicket();
            toast.success('Tickets refreshed');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-xs transition-colors self-start cursor-pointer"
        >
          <HiOutlineArrowPath className="w-4 h-4 text-slate-500" />
          Refresh
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase">Total Tickets</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.totalTickets}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
          <span className="text-[11px] font-medium text-amber-600 uppercase">Open</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{stats.openTickets}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
          <span className="text-[11px] font-medium text-indigo-600 uppercase">In Progress</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{stats.inProgressTickets}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
          <span className="text-[11px] font-medium text-emerald-600 uppercase">Resolved</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.resolvedTickets}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-medium text-rose-600 uppercase">Urgent Priority</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">{stats.urgentTickets}</div>
        </div>
      </div>

      {/* Main Workspace Layout (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
        {/* Left Column: Ticket List & Search (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {/* Search & Filter Header */}
          <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/50 shrink-0">
            <div className="relative">
              <HiOutlineMagnifyingGlass className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ticket #, subject, company, email..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Priorities</option>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ticket Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[600px]">
            {ticketsLoading ? (
              <div className="py-12 text-center text-slate-400">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-12 text-center text-slate-400 px-4">
                <HiOutlineTicket className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs">No support tickets found.</p>
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicketId === t._id;
                return (
                  <div
                    key={t._id}
                    onClick={() => setSelectedTicketId(t._id)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-50/60 border-l-4 border-indigo-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {t.ticketNumber}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getPriorityBadge(t.priority)}
                        {getStatusBadge(t.status)}
                      </div>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-900 line-clamp-1 mb-1">
                      {t.subject}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 truncate max-w-[170px]">
                        <HiOutlineBuildingOffice2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{t.companyName || 'Company Workspace'}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatTimeAgo(t.lastMessageAt || t.createdAt)}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                      <div className="flex items-center gap-1 truncate">
                        <HiOutlineUser className="w-3 h-3 text-slate-400" />
                        <span>{t.userName}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">{t.category}</span>
                      </div>
                      {t.attachments && t.attachments.length > 0 && (
                        <span className="flex items-center gap-0.5 text-indigo-600 shrink-0 font-medium">
                          <HiOutlinePaperClip className="w-3 h-3" />
                          {t.attachments.length}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Ticket Detail Workspace & Live Chat (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {!selectedTicketId || !activeTicket ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 text-center">
              <HiOutlineLifebuoy className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-semibold text-slate-700">No Ticket Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Select a ticket from the left panel to review issue details, update resolution status, and live chat with the user.
              </p>
            </div>
          ) : (
            <>
              {/* Ticket Top Header */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono font-bold text-xs bg-slate-200/80 text-slate-800 px-2 py-0.5 rounded">
                        {activeTicket.ticketNumber}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{activeTicket.category}</span>
                      {getPriorityBadge(activeTicket.priority)}
                      {getStatusBadge(activeTicket.status)}
                    </div>
                    <h2 className="text-base font-bold text-slate-900 leading-snug">
                      {activeTicket.subject}
                    </h2>
                  </div>
                </div>

                {/* Reporter Metadata */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2.5 pt-2.5 border-t border-slate-200/60">
                  <div className="flex items-center gap-1 text-slate-700 font-medium">
                    <HiOutlineUser className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeTicket.userName}</span>
                    <span className="text-[11px] text-indigo-600 font-semibold">({activeTicket.userRole})</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <HiOutlineBuildingOffice2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeTicket.companyName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Created {new Date(activeTicket.createdAt).toLocaleString()}
                  </div>
                </div>

                {/* Initial Ticket Attachments (if provided by reporter) */}
                {activeTicket.attachments && activeTicket.attachments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/70">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 flex items-center gap-1">
                      <HiOutlinePaperClip className="w-3.5 h-3.5 text-indigo-600" />
                      Reporter's Uploaded Evidence:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {activeTicket.attachments.map((att, idx) => renderAttachmentBubble(att, idx))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status & Resolution Update Form (Super Admin Control Panel) */}
              <div className="p-4 border-b border-slate-200 bg-white shrink-0">
                <form onSubmit={handleUpdateStatus} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <HiOutlineShieldCheck className="w-4 h-4 text-indigo-600" />
                      Super Admin Status & Diagnosis Advice
                    </span>
                    <button
                      type="submit"
                      disabled={isUpdatingStatus}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      {isUpdatingStatus ? 'Updating...' : 'Save Status & Advice'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Change Ticket Status
                      </label>
                      <select
                        value={statusForm}
                        onChange={(e) => setStatusForm(e.target.value)}
                        className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Set Priority Level
                      </label>
                      <select
                        value={priorityForm}
                        onChange={(e) => setPriorityForm(e.target.value)}
                        className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      >
                        {PRIORITY_OPTIONS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Official Resolution Explanation & Advice (Visible to user)
                    </label>
                    <textarea
                      rows="2"
                      value={resolutionNotesForm}
                      onChange={(e) => setResolutionNotesForm(e.target.value)}
                      placeholder="Explain what the issue was, how it was resolved, or next steps for the user..."
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                </form>
              </div>

              {/* Live Chat Thread */}
              <div className="flex-1 flex flex-col bg-slate-50/40 min-h-[300px]">
                {/* Chat Room Subheader */}
                <div className="px-4 py-2 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <HiOutlineChatBubbleLeftRight className="w-4 h-4 text-indigo-600" />
                    <span>Live Ticket Chat</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      (Connected to {activeTicket.userName})
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Live 2-Way Stream
                  </span>
                </div>

                {/* Message Stream */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[340px]">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-slate-400 py-8 text-xs">
                      No messages yet. Send a response to begin communicating.
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => {
                      const isMe = msg.isSuperAdmin || msg.senderRole === 'Super Admin';
                      return (
                        <div
                          key={msg._id || idx}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <span className="text-[11px] font-semibold text-slate-700">
                              {msg.senderName}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                isMe
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {isMe ? 'Super Admin' : msg.senderRole || 'User'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div
                            className={`p-3 rounded-2xl text-xs max-w-[85%] break-words shadow-2xs ${
                              isMe
                                ? 'bg-indigo-600 text-white rounded-tr-xs'
                                : 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs'
                            }`}
                          >
                            {msg.message && <p className="whitespace-pre-wrap">{msg.message}</p>}

                            {/* Render attachments in message bubble */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="space-y-1.5 mt-1">
                                {msg.attachments.map((att, attIdx) => renderAttachmentBubble(att, attIdx))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Pending Media Preview Banner in Chat */}
                {chatMediaPreview && (
                  <div className="px-4 py-2 bg-indigo-50/70 border-t border-indigo-100 flex items-center justify-between gap-3 text-xs shrink-0">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {chatMediaPreview.fileType === 'video' ? (
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                          <HiOutlineVideoCamera className="w-4 h-4" />
                        </div>
                      ) : (
                        <img
                          src={chatMediaPreview.url}
                          alt="Upload preview"
                          className="w-8 h-8 object-cover rounded-lg border border-slate-200 shrink-0"
                        />
                      )}
                      <div className="truncate">
                        <span className="font-semibold text-slate-800 truncate block">
                          {chatMediaPreview.name}
                        </span>
                        <span className="text-[10px] text-indigo-700 font-medium">
                          Ready to send ({chatMediaPreview.fileType === 'video' ? 'Video' : 'Image'} •{' '}
                          {(chatMediaPreview.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setChatMediaFile(null);
                        setChatMediaPreview(null);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-slate-200 cursor-pointer shrink-0"
                    >
                      <HiOutlineXMark className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Chat Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0"
                >
                  <input
                    type="file"
                    ref={chatFileInputRef}
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      validateAndHandleChatFile(f);
                      e.target.value = '';
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => chatFileInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Attach Image (≤ 1MB) or Video (≤ 2MB)"
                  >
                    <HiOutlinePhoto className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={`Reply live to ${activeTicket.userName}...`}
                    className="flex-1 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={(!messageInput.trim() && !chatMediaFile) || isSendingMessage}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                  >
                    <HiOutlinePaperAirplane className="w-3.5 h-3.5" />
                    {isSendingMessage ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Enlarged Lightbox Modal */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-150"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <HiOutlineXMark className="w-6 h-6" />
            </button>
            <img
              src={lightboxUrl}
              alt="Enlarged attachment"
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminTickets;
