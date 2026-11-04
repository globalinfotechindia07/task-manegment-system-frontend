import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  HiOutlineLifebuoy,
  HiOutlineTicket,
  HiOutlinePlus,
  HiOutlineChatBubbleLeftRight,
  HiOutlinePaperAirplane,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineExclamationCircle,
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
} from 'react-icons/hi2';
import api from '../../api/axios';
import { API_BASE_URL } from '../../config';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Technical Bug / Error',
  'Payroll & Salary',
  'Attendance & Clock',
  'Task & Project',
  'Access & Permissions',
  'Feature Request',
  'Billing & Plan',
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

const SupportTickets = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'ACTIVE', 'RESOLVED'

  // Raise Ticket Form
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Technical Bug / Error');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [raiseMediaFile, setRaiseMediaFile] = useState(null);
  const [raiseMediaPreview, setRaiseMediaPreview] = useState(null);
  const raiseFileInputRef = useRef(null);

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

  // 1. Fetch tickets for this user/company
  const { data: ticketsData, isLoading: ticketsLoading, refetch: refetchTickets } = useQuery({
    queryKey: ['mySupportTickets'],
    queryFn: async () => {
      const { data } = await api.get('/tickets');
      return data?.tickets || [];
    },
    refetchInterval: 12000,
  });

  const tickets = ticketsData || [];

  // Filtered tickets based on active tab
  const filteredTickets = tickets.filter((t) => {
    if (activeTab === 'ACTIVE') return t.status === 'Open' || t.status === 'In Progress';
    if (activeTab === 'RESOLVED') return t.status === 'Resolved' || t.status === 'Closed';
    return true;
  });

  // 2. Fetch Selected Ticket Details
  const { data: activeTicketData, refetch: refetchActiveTicket } = useQuery({
    queryKey: ['activeSupportTicket', selectedTicketId],
    queryFn: async () => {
      if (!selectedTicketId) return null;
      const { data } = await api.get(`/tickets/${selectedTicketId}`);
      return data?.ticket || null;
    },
    enabled: Boolean(selectedTicketId),
  });

  const activeTicket = activeTicketData;

  useEffect(() => {
    if (activeTicket) {
      setChatMessages(activeTicket.messages || []);
    }
  }, [activeTicket]);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, selectedTicketId, chatMediaPreview]);

  // Real-time Socket.io Room connection
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
      queryClient.invalidateQueries({ queryKey: ['mySupportTickets'] });
    };

    const handleStatusUpdate = (update) => {
      if (update.ticketId === selectedTicketId) {
        queryClient.invalidateQueries({ queryKey: ['activeSupportTicket', selectedTicketId] });
      }
      queryClient.invalidateQueries({ queryKey: ['mySupportTickets'] });
    };

    socket.on('ticket_message', handleTicketMessage);
    socket.on('ticket_status_update', handleStatusUpdate);

    return () => {
      socket.emit('leave-ticket', selectedTicketId);
      socket.off('ticket_message', handleTicketMessage);
      socket.off('ticket_status_update', handleStatusUpdate);
    };
  }, [socket, selectedTicketId, queryClient]);

  // Strict file validation (Image <= 1MB, Video <= 2MB)
  const validateAndHandleFile = (file, setFile, setPreview) => {
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast.error('Only image and video files are allowed.');
      return;
    }

    // Image size rule: <= 1 MB (1,048,576 bytes)
    if (isImage && file.size > 1 * 1024 * 1024) {
      toast.error(
        `Image size cannot exceed 1 MB. Selected file is ${(file.size / (1024 * 1024)).toFixed(2)} MB.`
      );
      return;
    }

    // Video size rule: <= 2 MB (2,097,152 bytes)
    if (isVideo && file.size > 2 * 1024 * 1024) {
      toast.error(
        `Video size cannot exceed 2 MB. Selected video is ${(file.size / (1024 * 1024)).toFixed(2)} MB.`
      );
      return;
    }

    setFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreview({
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

  // Handle Create Ticket Submit
  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error('Please enter a subject and describe your problem.');
      return;
    }

    try {
      setIsSubmitting(true);

      const attachments = [];
      if (raiseMediaFile) {
        toast.loading('Uploading media attachment...', { id: 'ticket-upload' });
        const uploadedFile = await uploadMedia(raiseMediaFile);
        attachments.push(uploadedFile);
        toast.dismiss('ticket-upload');
      }

      const { data } = await api.post('/tickets', {
        subject: subject.trim(),
        category,
        priority,
        description: description.trim(),
        attachments,
      });

      toast.success(data.message || 'Support ticket raised successfully!');
      setIsRaiseModalOpen(false);
      setSubject('');
      setDescription('');
      setCategory('Technical Bug / Error');
      setPriority('Medium');
      setRaiseMediaFile(null);
      setRaiseMediaPreview(null);

      await queryClient.invalidateQueries({ queryKey: ['mySupportTickets'] });
      if (data?.ticket?._id) {
        setSelectedTicketId(data.ticket._id);
      }
    } catch (err) {
      toast.dismiss('ticket-upload');
      toast.error(err.response?.data?.message || 'Failed to raise ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send message on ticket (with optional text & image/video attachment)
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
    const optimisticMsg = {
      _id: `temp-${Date.now()}`,
      sender: user?._id,
      senderName: user?.name || 'You',
      senderRole: user?.role || 'Staff',
      isSuperAdmin: false,
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
      queryClient.invalidateQueries({ queryKey: ['mySupportTickets'] });
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

  const totalCount = tickets.length;
  const activeCount = tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Help & Support Helpdesk</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Direct Super Admin Assistance
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Facing any system glitch, billing, attendance, or role problem? Raise a ticket with screenshots/videos to consult directly with Super Admin.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              refetchTickets();
              if (selectedTicketId) refetchActiveTicket();
              toast.success('Tickets refreshed');
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
            Raise Support Ticket
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Raised</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <HiOutlineTicket className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Tickets from your company</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">Active / In Progress</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <HiOutlineClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{activeCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Under investigation</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Resolved</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <HiOutlineCheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{resolvedCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Successfully concluded</p>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Tickets ({totalCount})
        </button>
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'ACTIVE'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Active / In Progress ({activeCount})
        </button>
        <button
          onClick={() => setActiveTab('RESOLVED')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'RESOLVED'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Resolved ({resolvedCount})
        </button>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {ticketsLoading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading your tickets...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            <HiOutlineLifebuoy className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No support tickets found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't raised any tickets matching this view. If you face any difficulty with the software, click "+ Raise Support Ticket".
            </p>
          </div>
        ) : (
          filteredTickets.map((t) => (
            <div
              key={t._id}
              onClick={() => setSelectedTicketId(t._id)}
              className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                    {t.ticketNumber}
                  </span>
                  <span className="text-xs font-medium text-slate-600">{t.category}</span>
                  {getPriorityBadge(t.priority)}
                  {getStatusBadge(t.status)}
                  {t.attachments && t.attachments.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                      <HiOutlinePaperClip className="w-3 h-3" />
                      {t.attachments.length} Media Attachment
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                  {t.subject}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-1">{t.description}</p>

                {t.resolutionNotes && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-md text-[11px] text-emerald-800 font-medium">
                    <HiOutlineCheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Super Admin Advice: {t.resolutionNotes}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                <span className="text-[11px] text-slate-400">
                  {new Date(t.lastMessageAt || t.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5" />
                  View & Live Chat
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Raise Ticket Modal */}
      {isRaiseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <HiOutlineTicket className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Raise New Support Ticket</h3>
                  <p className="text-xs text-slate-500">Shared directly with Super Admin engineers</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsRaiseModalOpen(false);
                  setRaiseMediaFile(null);
                  setRaiseMediaPreview(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRaiseTicket} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Ticket Subject / Problem Title *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Salary slip PDF generation fails for March"
                  className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Detailed Explanation / Error Description *
                </label>
                <textarea
                  required
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what occurred, any error message you saw on screen, or steps to reproduce..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* Image & Video Attachment Upload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                    <HiOutlinePaperClip className="w-3.5 h-3.5 text-indigo-600" />
                    Attach Image or Video (Optional)
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Image: ≤ 1MB • Video: ≤ 2MB
                  </span>
                </div>

                <input
                  type="file"
                  ref={raiseFileInputRef}
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    validateAndHandleFile(f, setRaiseMediaFile, setRaiseMediaPreview);
                    e.target.value = '';
                  }}
                />

                {!raiseMediaPreview ? (
                  <button
                    type="button"
                    onClick={() => raiseFileInputRef.current?.click()}
                    className="w-full py-3 px-4 border border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 rounded-xl text-center text-slate-600 transition-colors flex flex-col items-center gap-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs">
                      <HiOutlinePhoto className="w-4 h-4" />
                      <span>Upload Screenshot or Short Video</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Supports PNG, JPG, WEBP (&lt;1MB) and MP4, WEBM (&lt;2MB)
                    </span>
                  </button>
                ) : (
                  <div className="relative p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {raiseMediaPreview.fileType === 'video' ? (
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                          <HiOutlineVideoCamera className="w-5 h-5" />
                        </div>
                      ) : (
                        <img
                          src={raiseMediaPreview.url}
                          alt="Preview"
                          className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                        />
                      )}
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {raiseMediaPreview.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {raiseMediaPreview.fileType === 'video' ? 'Video' : 'Image'} •{' '}
                          {(raiseMediaPreview.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setRaiseMediaFile(null);
                        setRaiseMediaPreview(null);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-slate-200 cursor-pointer shrink-0"
                      title="Remove attachment"
                    >
                      <HiOutlineXMark className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-900 text-[11px] flex items-start gap-2">
                <HiOutlineInformationCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  Once raised, your ticket will appear in Super Admin's triage desk. You can chat live with them in real time as they diagnose and resolve it.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsRaiseModalOpen(false);
                    setRaiseMediaFile(null);
                    setRaiseMediaPreview(null);
                  }}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Uploading & Submitting...' : 'Raise Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Details & Live Chat Modal / Drawer */}
      {selectedTicketId && activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between gap-3 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono font-bold text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                    {activeTicket.ticketNumber}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{activeTicket.category}</span>
                  {getPriorityBadge(activeTicket.priority)}
                  {getStatusBadge(activeTicket.status)}
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {activeTicket.subject}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Raised by {activeTicket.userName} ({activeTicket.userRole}) on {new Date(activeTicket.createdAt).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedTicketId(null);
                  setChatMediaFile(null);
                  setChatMediaPreview(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto flex flex-col">
              {/* Problem Description & Initial Attachments */}
              <div className="p-4 border-b border-slate-100 bg-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Issue Description
                </span>
                <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {activeTicket.description}
                </p>

                {/* Initial Ticket Attachments */}
                {activeTicket.attachments && activeTicket.attachments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                      <HiOutlinePaperClip className="w-3 h-3 text-indigo-600" />
                      Uploaded Ticket Evidence
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {activeTicket.attachments.map((att, idx) => renderAttachmentBubble(att, idx))}
                    </div>
                  </div>
                )}
              </div>

              {/* Super Admin Resolution Box (Prominently displayed) */}
              {activeTicket.resolutionNotes && (
                <div className="p-4 bg-emerald-50/80 border-b border-emerald-200 text-emerald-900 shrink-0">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900 mb-1">
                    <HiOutlineShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Super Admin Diagnosis & Official Advice:</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                    {activeTicket.resolutionNotes}
                  </p>
                </div>
              )}

              {/* Live Chat Thread */}
              <div className="flex-1 p-4 bg-slate-50/50 space-y-3 min-h-[240px]">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <HiOutlineChatBubbleLeftRight className="w-4 h-4 text-indigo-600" />
                    Live Support Discussion
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live 2-Way Socket
                  </span>
                </div>

                {chatMessages.map((msg, idx) => {
                  const isSuperAdminMsg = msg.isSuperAdmin || msg.senderRole === 'Super Admin';
                  const isMe = msg.sender === user?._id;

                  return (
                    <div
                      key={msg._id || idx}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[11px] font-semibold text-slate-700">
                          {isMe ? 'You' : msg.senderName}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                            isSuperAdminMsg
                              ? 'bg-indigo-100 text-indigo-700 font-bold'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isSuperAdminMsg ? 'Super Admin' : msg.senderRole || 'Staff'}
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
                            : isSuperAdminMsg
                            ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 font-medium rounded-tl-xs'
                            : 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs'
                        }`}
                      >
                        {msg.message && <p className="whitespace-pre-wrap">{msg.message}</p>}

                        {/* Render attachments in message */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="space-y-1.5 mt-1">
                            {msg.attachments.map((att, attIdx) => renderAttachmentBubble(att, attIdx))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Pending Media Preview Banner in Chat */}
            {chatMediaPreview && (
              <div className="px-4 py-2 bg-indigo-50/70 border-t border-indigo-100 flex items-center justify-between gap-3 text-xs">
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

            {/* Chat Input Bar with Media Attachment */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0"
            >
              {/* Media input trigger */}
              <input
                type="file"
                ref={chatFileInputRef}
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  validateAndHandleFile(f, setChatMediaFile, setChatMediaPreview);
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
                placeholder="Type your reply or question to Super Admin..."
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
        </div>
      )}

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

export default SupportTickets;
