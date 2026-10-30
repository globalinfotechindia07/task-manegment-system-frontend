import { useState, useEffect, useRef, useCallback } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineUserGroup,
  HiOutlineMagnifyingGlass,
  HiOutlinePencilSquare,
  HiOutlinePaperClip,
  HiOutlineMicrophone,
  HiOutlinePaperAirplane,
  HiOutlineXMark,
  HiOutlineCamera,
  HiOutlineDocumentText,
  HiOutlineArrowLeft,
  HiOutlineArrowUpTray,
} from 'react-icons/hi2';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config';

/* ============================================================
   TOKENS (same as other pages)
   ============================================================ */
const tokens = {
  btnPrimary:
    'inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg bg-indigo-600 text-white shadow-sm ' +
    'hover:bg-indigo-700 active:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ' +
    'transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  btnSecondary:
    'inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg bg-white text-slate-700 border border-slate-300 shadow-sm ' +
    'hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  input:
    'w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 ' +
    'placeholder:text-slate-400 transition-colors ' +
    'focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20',
  label:
    'block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5',
  card: 'bg-white border border-slate-200 rounded-xl shadow-sm',
};

/* ============================================================
   HELPERS
   ============================================================ */
const renderTextWithLinks = (text) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const formatTime = (date) =>
  new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const Avatar = ({ name, src, isGroup, size = 'md' }) => {
  const sizeMap = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-11 h-11 text-base',
  };
  const cls = sizeMap[size] || sizeMap.md;
  return (
    <div
      className={`${cls} rounded-full flex items-center justify-center font-bold flex-shrink-0 overflow-hidden border ${isGroup
        ? 'bg-indigo-100 border-indigo-200 text-indigo-700'
        : 'bg-slate-200 border-slate-200 text-slate-700'
        }`}
    >
      {src ? (
        <img src={`${API_BASE_URL}${src}`} alt={name || 'avatar'} className="w-full h-full object-cover" />
      ) : isGroup ? (
        <HiOutlineUserGroup className="w-5 h-5" />
      ) : (
        (name || '?').charAt(0).toUpperCase()
      )}
    </div>
  );
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const Chat = () => {
  const { user } = useAuth();
  const { socket, clearUnreadChats } = useSocket();
  const queryClient = useQueryClient();
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // Media
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const recordingTimerRef = useRef(null);

  // Group modal
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupIcon, setGroupIcon] = useState(null);
  const [groupIconPreview, setGroupIconPreview] = useState(null);
  const groupIconInputRef = useRef(null);

  /* ---------------- Queries (UNCHANGED) ---------------- */
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data.filter((u) => u._id !== user._id);
    },
  });

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['chatConversations'],
    queryFn: async () => {
      const { data } = await api.get('/chat/conversations');
      return data;
    },
  });

  const {
    data: messagesData,
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['chatMessages', selectedChat?._id],
    queryFn: async ({ pageParam = 0 }) => {
      if (!selectedChat) return [];
      const endpoint = selectedChat.isGroup
        ? `/chat/group/${selectedChat._id}`
        : `/chat/${selectedChat._id}`;
      const { data } = await api.get(`${endpoint}?limit=50&skip=${pageParam}`);
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 50 ? allPages.length * 50 : undefined;
    },
    enabled: !!selectedChat,
  });

  const messages = messagesData?.pages ? [...messagesData.pages].reverse().flat() : [];

  /* ---------------- Mutations (UNCHANGED) ---------------- */
  const sendMessageMutation = useMutation({
    mutationFn: async ({ text, file, audio }) => {
      if (file || audio) {
        const formData = new FormData();
        if (selectedChat.isGroup) formData.append('groupId', selectedChat._id);
        else formData.append('receiverId', selectedChat._id);

        if (text) formData.append('text', text);

        if (audio) {
          formData.append('media', audio, `audio-${Date.now()}.webm`);
          formData.append('mediaType', 'audio');
        } else if (file) {
          formData.append('media', file);
          const type = file.type.split('/')[0];
          formData.append(
            'mediaType',
            ['image', 'video', 'audio'].includes(type) ? type : 'document'
          );
        }

        const { data } = await api.post('/chat/send-media', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
      } else {
        const payload = selectedChat.isGroup
          ? { groupId: selectedChat._id, text }
          : { receiverId: selectedChat._id, text };
        const { data } = await api.post('/chat/send', payload);
        return data;
      }
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData(['chatMessages', selectedChat._id], (old) => {
        if (!old || !old.pages) return old;
        const exists = old.pages.some((page) => page.some((m) => m._id === newMessage._id));
        if (exists) return old;
        const newPages = [...old.pages];
        newPages[0] = [...newPages[0], newMessage];
        return { ...old, pages: newPages };
      });

      updateConversationSidebar(selectedChat._id, newMessage);
      setMessageText('');
      setSelectedFile(null);
      setAudioBlob(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send message');
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (userId) => {
      await api.put(`/chat/read/${userId}`);
    },
    onSuccess: (_, userId) => {
      queryClient.setQueryData(['chatConversations'], (oldConvos) => {
        if (!oldConvos) return oldConvos;
        return oldConvos.map((c) =>
          c._id === userId ? { ...c, unreadCount: 0 } : c
        );
      });
      queryClient.setQueryData(['chatMessages', userId], (oldData) => {
        if (!oldData || !oldData.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) =>
            page.map((m) =>
              !m.read && m.receiver === user._id ? { ...m, read: true } : m
            )
          ),
        };
      });
    },
  });

  useEffect(() => {
    if (selectedChat && !selectedChat.isGroup) {
      const convo = conversations?.find((c) => c._id === selectedChat._id);
      if (convo && convo.unreadCount > 0) {
        markAsReadMutation.mutate(selectedChat._id);
      }
    }
  }, [selectedChat, conversations]);

  useEffect(() => {
    if (clearUnreadChats) clearUnreadChats();
  }, [clearUnreadChats]);

  const updateConversationSidebar = (chatId, newMessage, incrementUnread = false) => {
    queryClient.setQueryData(['chatConversations'], (oldConvos) => {
      if (!oldConvos) return oldConvos;
      const updated = oldConvos.map((c) => {
        if (c._id === chatId) {
          return {
            ...c,
            unreadCount: incrementUnread ? (c.unreadCount || 0) + 1 : c.unreadCount,
            latestMessage: {
              text: newMessage.text,
              mediaType: newMessage.mediaType,
              createdAt: newMessage.createdAt,
              sender: newMessage.sender,
            },
            updatedAt: newMessage.createdAt,
          };
        }
        return c;
      });
      return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    });
  };

  const createGroupMutation = useMutation({
    mutationFn: async (formData) => {
      const { data } = await api.post('/chat/groups', formData);
      return data;
    },
    onSuccess: () => {
      toast.success('Group created successfully!');
      queryClient.invalidateQueries(['chatConversations']);
      setShowGroupModal(false);
      setGroupName('');
      setSelectedMembers([]);
      setIsEditingGroup(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create group');
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({ groupId, formData }) => {
      const { data } = await api.put(`/chat/groups/${groupId}`, formData);
      return data;
    },
    onSuccess: (updatedGroup) => {
      toast.success('Group updated successfully!');
      queryClient.invalidateQueries(['chatConversations']);
      setShowGroupModal(false);
      setGroupName('');
      setSelectedMembers([]);
      setIsEditingGroup(false);
      setEditingGroupId(null);
      setGroupIcon(null);
      setGroupIconPreview(null);
      if (selectedChat && selectedChat._id === updatedGroup._id) {
        setSelectedChat((prev) => ({
          ...prev,
          name: updatedGroup.name,
          members: updatedGroup.members,
          profilePicture: updatedGroup.groupIcon,
        }));
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update group');
    },
  });

  /* ---------------- Notifications permission ---------------- */
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  /* ---------------- Socket (UNCHANGED) ---------------- */
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message) => {
      const isGroupMessage = !!message.groupId;
      const senderId =
        typeof message.sender === 'object' ? message.sender._id : message.sender;
      const receiverId =
        typeof message.receiver === 'object' ? message.receiver._id : message.receiver;

      const conversationId = isGroupMessage
        ? message.groupId
        : senderId === user._id
          ? receiverId
          : senderId;

      let isViewingThisChat = false;
      if (selectedChat) {
        if (selectedChat.isGroup && isGroupMessage && selectedChat._id === message.groupId) {
          isViewingThisChat = true;
        } else if (
          !selectedChat.isGroup &&
          !isGroupMessage &&
          selectedChat._id === conversationId
        ) {
          isViewingThisChat = true;
        }
      }

      if (isViewingThisChat) {
        queryClient.setQueryData(['chatMessages', selectedChat._id], (old) => {
          if (!old || !old.pages) return { pages: [[message]], pageParams: [0] };
          const exists = old.pages.some((page) => page.some((m) => m._id === message._id));
          if (exists) return old;
          const newPages = [...old.pages];
          newPages[0] = [...newPages[0], message];
          return { ...old, pages: newPages };
        });
        if (!isGroupMessage && senderId !== user._id) {
          api.put(`/chat/read/${conversationId}`).catch(console.error);
        }
      } else {
        if (!message.text || !message.text.includes('Room ID:')) {
          let title = 'New Message';
          if (isGroupMessage) {
            if (senderId !== user._id) {
              title = `New group message`;
              toast.success(title);
            }
          } else {
            title = `New message from ${message.sender?.name || 'someone'}`;
            toast.success(title);
          }

          if (
            'Notification' in window &&
            Notification.permission === 'granted' &&
            senderId !== user._id
          ) {
            new Notification(title, {
              body:
                message.text ||
                (message.mediaType ? `Sent a ${message.mediaType}` : 'New message'),
            });
          }
        }
      }

      updateConversationSidebar(conversationId, message, !isViewingThisChat);
    };

    const handleMessagesRead = ({ readerId }) => {
      if (selectedChat && !selectedChat.isGroup && selectedChat._id === readerId) {
        queryClient.setQueryData(['chatMessages', selectedChat._id], (oldData) => {
          if (!oldData || !oldData.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              page.map((m) =>
                !m.read && m.sender === user._id ? { ...m, read: true } : m
              )
            ),
          };
        });
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, selectedChat, queryClient, user._id]);

  /* ---------------- Scroll handling (UNCHANGED) ---------------- */
  const chatContainerRef = useRef(null);
  const [prevScrollHeight, setPrevScrollHeight] = useState(0);

  useEffect(() => {
    if (chatContainerRef.current) {
      if (prevScrollHeight > 0) {
        const diff = chatContainerRef.current.scrollHeight - prevScrollHeight;
        chatContainerRef.current.scrollTop = diff;
        setPrevScrollHeight(0);
      } else if (!isFetchingNextPage) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, isFetchingNextPage, prevScrollHeight]);

  const handleScroll = useCallback(
    (e) => {
      if (e.target.scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
        setPrevScrollHeight(e.target.scrollHeight);
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  /* ---------------- Handlers (UNCHANGED) ---------------- */
  const handleSend = (e) => {
    e.preventDefault();
    if ((!messageText.trim() && !selectedFile && !audioBlob) || !selectedChat) return;
    sendMessageMutation.mutate({ text: messageText, file: selectedFile, audio: audioBlob });
  };

  const handleEditGroup = (e) => {
    e.stopPropagation();
    openEditGroupModal(selectedChat);
  };

  const handleGroupIconChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB');
        return;
      }
      setGroupIcon(file);
      setGroupIconPreview(URL.createObjectURL(file));
    }
  };

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedMembers.length === 0) {
      toast.error('Please enter a group name and select at least one member');
      return;
    }

    const formData = new FormData();
    formData.append('name', groupName);
    formData.append('members', JSON.stringify(selectedMembers));
    if (groupIcon) formData.append('groupIcon', groupIcon);

    if (isEditingGroup) {
      updateGroupMutation.mutate({ groupId: editingGroupId, formData });
    } else {
      createGroupMutation.mutate(formData);
    }
  };

  const openCreateGroupModal = () => {
    setIsEditingGroup(false);
    setEditingGroupId(null);
    setGroupName('');
    setSelectedMembers([]);
    setGroupIcon(null);
    setGroupIconPreview(null);
    setShowGroupModal(true);
  };

  const openEditGroupModal = (group) => {
    setIsEditingGroup(true);
    setEditingGroupId(group._id);
    setGroupName(group.name);
    const memberIds = group.members
      .map((m) => (typeof m === 'object' ? m._id : m))
      .filter((id) => id !== user._id);
    setSelectedMembers(memberIds);
    setGroupIcon(null);
    setGroupIconPreview(
      group.profilePicture ? `${API_BASE_URL}${group.profilePicture}` : null
    );
    setShowGroupModal(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      toast.error('Microphone access denied or unavailable');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const clearMedia = () => {
    setSelectedFile(null);
    setAudioBlob(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredConversations = conversations?.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.designation && c.designation.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const fmtDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)] sm:h-[calc(100vh-5rem)] bg-slate-50">
      <div className="flex-1 flex flex-col w-full h-full p-0 sm:p-2 md:p-4 overflow-hidden">
        <div className="flex-1 overflow-hidden sm:border border-slate-200 sm:shadow-sm sm:rounded-xl flex flex-col bg-white">
          {/* ===================== HEADER ===================== */}
          <div className="px-3 sm:px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <HiOutlineChatBubbleLeftRight className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                Messages
              </h1>
              {socket ? (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full border border-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Disconnected
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={openCreateGroupModal}
              className={`${tokens.btnPrimary} px-3 py-2 text-xs`}
            >
              <HiOutlineUserGroup className="w-4 h-4" />
              <span>New Group</span>
            </button>
          </div>

          {/* ===================== BODY ===================== */}
          <div className="flex flex-1 overflow-hidden">
            {/* ---------- SIDEBAR ---------- */}
            <div
              className={`${selectedChat ? 'hidden md:flex' : 'flex'
                } w-full md:w-80 lg:w-96 border-r-0 md:border-r border-slate-200 flex-col bg-slate-50`}
            >
              <div className="p-3 border-b border-slate-200 bg-white">
                <div className="relative">
                  <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search chats…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${tokens.input} pl-9 text-xs`}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {conversationsLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 opacity-60">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-slate-500 text-xs">Loading chats…</p>
                  </div>
                ) : filteredConversations?.length === 0 ? (
                  <p className="text-slate-400 text-center py-10 text-xs">
                    No conversations found.
                  </p>
                ) : (
                  filteredConversations?.map((chat) => (
                    <button
                      key={chat._id}
                      type="button"
                      onClick={() => {
                        setSelectedChat(chat);
                        if (chat.unreadCount > 0) {
                          queryClient.setQueryData(['chatConversations'], (old) => {
                            return old?.map((c) =>
                              c._id === chat._id ? { ...c, unreadCount: 0 } : c
                            );
                          });
                        }
                      }}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left ${selectedChat?._id === chat._id
                        ? 'bg-indigo-50 border border-indigo-200'
                        : 'hover:bg-slate-100 border border-transparent'
                        }`}
                    >
                      <Avatar
                        name={chat.name}
                        src={chat.profilePicture}
                        isGroup={chat.isGroup}
                        size="lg"
                      />
                      <div className="overflow-hidden flex-1 mt-0.5">
                        <div className="flex justify-between items-baseline mb-0.5 gap-2">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {chat.name}
                          </p>
                          {chat.latestMessage && (
                            <span className="text-[10px] text-slate-400 flex-shrink-0">
                              {formatTime(chat.latestMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        {chat.latestMessage ? (
                          <p
                            className={`text-xs truncate ${chat.unreadCount > 0
                              ? 'text-slate-900 font-semibold'
                              : 'text-slate-500'
                              }`}
                          >
                            {chat.isGroup &&
                              typeof chat.latestMessage.sender === 'object' &&
                              chat.latestMessage.sender._id === user._id
                              ? 'You: '
                              : ''}
                            {chat.isGroup &&
                              typeof chat.latestMessage.sender === 'object' &&
                              chat.latestMessage.sender._id !== user._id
                              ? `${chat.latestMessage.sender.name}: `
                              : ''}
                            {chat.latestMessage.mediaType
                              ? `Sent a ${chat.latestMessage.mediaType}`
                              : chat.latestMessage.text}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 italic">
                            Tap to start chatting
                          </p>
                        )}
                      </div>
                      {chat.unreadCount > 0 && (
                        <div className="flex-shrink-0 flex items-center justify-center min-w-[18px] h-[18px] bg-indigo-600 rounded-full px-1.5 mt-5">
                          <span className="text-[10px] font-bold text-white">
                            {chat.unreadCount}
                          </span>
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* ---------- CHAT AREA ---------- */}
            <div
              className={`${selectedChat ? 'flex' : 'hidden md:flex'
                } flex-1 flex-col bg-white relative min-w-0`}
            >
              {selectedChat ? (
                <>
                  {/* Chat header */}
                  <div className="px-3 py-2.5 border-b border-slate-200 flex items-center justify-between gap-2 bg-white shrink-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {/* Mobile back */}
                      <button
                        type="button"
                        onClick={() => setSelectedChat(null)}
                        className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-slate-100 text-slate-500 shrink-0"
                        aria-label="Back to chats"
                      >
                        <HiOutlineArrowLeft className="w-5 h-5" />
                      </button>
                      <Avatar
                        name={selectedChat.name}
                        src={selectedChat.profilePicture}
                        isGroup={selectedChat.isGroup}
                        size="md"
                      />
                      <div className="min-w-0">
                        <h2 className="text-sm font-bold text-slate-900 truncate">
                          {selectedChat.name}
                        </h2>
                        <p className="text-[11px] text-slate-500 truncate">
                          {selectedChat.isGroup
                            ? `${selectedChat.members?.length || 0} members`
                            : selectedChat.role}
                        </p>
                      </div>
                    </div>
                    {selectedChat.isGroup && selectedChat.admin === user._id && (
                      <button
                        type="button"
                        onClick={() => openEditGroupModal(selectedChat)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors shrink-0"
                        title="Edit Group"
                      >
                        <HiOutlinePencilSquare className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Messages */}
                  <div
                    ref={chatContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50/50"
                  >
                    {isFetchingNextPage && (
                      <div className="flex justify-center py-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent" />
                      </div>
                    )}
                    {messagesLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-indigo-600 border-t-transparent" />
                      </div>
                    ) : messages?.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="bg-white px-4 py-2 rounded-full text-slate-500 text-xs shadow-sm border border-slate-200">
                          No messages yet. Send a message to start!
                        </div>
                      </div>
                    ) : (
                      messages?.map((msg, index) => {
                        const isMine =
                          typeof msg.sender === 'object'
                            ? msg.sender._id === user._id
                            : msg.sender === user._id;
                        const senderObj =
                          typeof msg.sender === 'object' ? msg.sender : null;
                        const senderName = isMine
                          ? 'You'
                          : senderObj?.name || 'Unknown';

                        return (
                          <div
                            key={msg._id || index}
                            className={`flex gap-1.5 ${isMine ? 'justify-end flex-row-reverse' : 'justify-start flex-row'
                              }`}
                          >
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 bg-slate-200 border border-slate-200 flex items-center justify-center overflow-hidden mt-auto">
                              {isMine ? (
                                user?.profilePicture ? (
                                  <img
                                    src={`${API_BASE_URL}${user.profilePicture}`}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[11px] font-bold text-indigo-700">
                                    {user?.name?.charAt(0)?.toUpperCase()}
                                  </span>
                                )
                              ) : senderObj?.profilePicture ? (
                                <img
                                  src={`${API_BASE_URL}${senderObj.profilePicture}`}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-[11px] font-bold text-slate-600">
                                  {senderName.charAt(0)?.toUpperCase()}
                                </span>
                              )}
                            </div>

                            <div
                              className={`max-w-[85%] sm:max-w-[75%] flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'
                                }`}
                            >
                              {selectedChat.isGroup && !isMine && (
                                <span className="text-[11px] font-medium text-slate-500 ml-2">
                                  {senderName}
                                </span>
                              )}
                              <div
                                className={`rounded-2xl px-3 py-2 shadow-sm relative text-xs leading-relaxed ${isMine
                                  ? 'bg-indigo-600 text-white rounded-br-md'
                                  : 'bg-white text-slate-800 rounded-bl-md border border-slate-200'
                                  }`}
                              >
                                {msg.mediaUrl && (
                                  <div className="mb-1 rounded-xl overflow-hidden max-w-[200px] sm:max-w-xs">
                                    {msg.mediaType === 'image' && (
                                      <img
                                        src={`${API_BASE_URL}${msg.mediaUrl}`}
                                        alt="Attachment"
                                        className="w-full h-auto object-cover max-h-60"
                                      />
                                    )}
                                    {msg.mediaType === 'video' && (
                                      <video
                                        src={`${API_BASE_URL}${msg.mediaUrl}`}
                                        controls
                                        className="w-full h-auto max-h-60"
                                      />
                                    )}
                                    {msg.mediaType === 'audio' && (
                                      <audio
                                        src={`${API_BASE_URL}${msg.mediaUrl}`}
                                        controls
                                        className="w-full max-w-[180px] h-8 mt-1"
                                      />
                                    )}
                                    {msg.mediaType === 'document' && (
                                      <a
                                        href={`${API_BASE_URL}${msg.mediaUrl}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs hover:underline text-indigo-700"
                                      >
                                        <HiOutlineDocumentText className="w-4 h-4" />
                                        Document
                                      </a>
                                    )}
                                  </div>
                                )}
                                {msg.text && (
                                  <div className="text-xs whitespace-pre-wrap break-words leading-relaxed">
                                    {msg.text.includes('Room ID:') ? (
                                      <>
                                        {msg.text.split('Room ID:')[0]}
                                        <br />
                                        <span className="font-semibold">Room ID: </span>
                                        <a
                                          href={`/team-meeting/${msg.text
                                            .split('Room ID:')[1]
                                            .trim()}`}
                                          className={`underline font-mono select-all ${isMine
                                            ? 'text-indigo-100 hover:text-white'
                                            : 'text-indigo-600 hover:text-indigo-800'
                                            }`}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {msg.text.split('Room ID:')[1].trim()}
                                        </a>
                                      </>
                                    ) : (
                                      renderTextWithLinks(msg.text)
                                    )}
                                  </div>
                                )}
                                <div
                                  className={`text-[10px] pt-1 flex items-center justify-end gap-1 ${isMine ? 'text-indigo-200' : 'text-slate-400'
                                    }`}
                                >
                                  {formatTime(msg.createdAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* ---------- INPUT AREA ---------- */}
                  <div className="px-2 py-2 sm:px-3 sm:py-3 bg-white border-t border-slate-200 flex flex-col gap-2 shrink-0">
                    {/* Media preview chip */}
                    {(selectedFile || audioBlob) && (
                      <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 w-fit max-w-full">
                        {selectedFile && (
                          <span className="text-xs text-indigo-700 truncate max-w-[150px] font-medium flex items-center gap-1.5">
                            <HiOutlinePaperClip className="w-3.5 h-3.5 shrink-0" />
                            {selectedFile.name}
                          </span>
                        )}
                        {audioBlob && (
                          <span className="text-xs text-indigo-700 font-medium flex items-center gap-1.5">
                            <HiOutlineMicrophone className="w-3.5 h-3.5 shrink-0" />
                            Voice Note ({Math.round(audioBlob.size / 1024)} KB)
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={clearMedia}
                          className="text-slate-400 hover:text-rose-600 shrink-0"
                          aria-label="Remove media"
                        >
                          <HiOutlineXMark className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Recording indicator */}
                    {isRecording && (
                      <div className="flex items-center gap-2 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 w-fit">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-xs font-semibold text-rose-700">
                          Recording… {fmtDuration(recordingSeconds)}
                        </span>
                      </div>
                    )}

                    <form onSubmit={handleSend} className="flex gap-1.5 items-center w-full">
                      <label className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer transition-colors flex-shrink-0">
                        <input
                          type="file"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                        <HiOutlinePaperClip className="w-5 h-5" />
                      </label>

                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder={
                          isRecording ? 'Recording audio…' : 'Type a message…'
                        }
                        disabled={isRecording}
                        className="flex-1 bg-slate-50 border border-slate-300 rounded-full px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none min-w-0 disabled:opacity-50 transition-colors"
                      />

                      {!messageText.trim() && !selectedFile && !audioBlob && (
                        <button
                          type="button"
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${isRecording
                            ? 'bg-rose-50 text-rose-600'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                            }`}
                          aria-label={isRecording ? 'Stop recording' : 'Record audio'}
                        >
                          <HiOutlineMicrophone className="w-5 h-5" />
                        </button>
                      )}

                      <button
                        type="submit"
                        disabled={
                          (!messageText.trim() && !selectedFile && !audioBlob) ||
                          sendMessageMutation.isPending
                        }
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-40 disabled:active:scale-100 flex-shrink-0 shadow-sm"
                        aria-label="Send message"
                      >
                        <HiOutlinePaperAirplane className="w-4 h-4 ml-0.5" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                /* ---------- EMPTY CHAT STATE ---------- */
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4">
                  <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                    <HiOutlineChatBubbleLeftRight className="w-8 h-8 text-indigo-600" />
                  </div>
                  <p className="text-base font-bold text-slate-900">Your Messages</p>
                  <p className="text-xs mt-1 max-w-xs text-center text-slate-500 leading-relaxed">
                    Select a conversation from the sidebar or start a new group to begin messaging.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===================== GROUP MODAL ===================== */}
      {showGroupModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="group-modal-title"
        >
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowGroupModal(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl border-0 sm:border border-slate-200 shadow-2xl w-full sm:max-w-md max-h-[95dvh] sm:max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
              <h2
                id="group-modal-title"
                className="text-base font-bold text-slate-900 truncate"
              >
                {isEditingGroup ? 'Edit Group' : 'Create New Group'}
              </h2>
              <button
                type="button"
                onClick={() => setShowGroupModal(false)}
                className="p-1.5 -mr-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors shrink-0"
                aria-label="Close"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateGroup}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {/* Icon + name */}
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center">
                      {groupIconPreview ? (
                        <img
                          src={groupIconPreview}
                          alt="Group Icon"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <HiOutlineUserGroup className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => groupIconInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white border-2 border-white hover:bg-indigo-700 transition-colors shadow-sm"
                      aria-label="Upload group icon"
                    >
                      <HiOutlineCamera className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="file"
                      ref={groupIconInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleGroupIconChange}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className={tokens.label}>Group Name *</label>
                    <input
                      type="text"
                      required
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className={tokens.input}
                      placeholder="e.g. Engineering Team"
                    />
                  </div>
                </div>

                {/* Members */}
                <div>
                  <label className={tokens.label}>
                    Select Members ({selectedMembers.length})
                  </label>
                  <div className="max-h-[280px] overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-1.5 space-y-0.5">
                    {users?.map((u) => (
                      <label
                        key={u._id}
                        className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(u._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMembers([...selectedMembers, u._id]);
                            } else {
                              setSelectedMembers(
                                selectedMembers.filter((id) => id !== u._id)
                              );
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-700 font-bold overflow-hidden shrink-0">
                          {u.profilePicture ? (
                            <img
                              src={`${API_BASE_URL}${u.profilePicture}`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            u.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-slate-900 truncate">
                            {u.name}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate">
                            {u.designation || u.role}
                          </span>
                        </div>
                      </label>
                    ))}
                    {users?.length === 0 && (
                      <p className="text-slate-400 text-center py-4 text-xs">
                        No other users available
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 px-4 sm:px-5 py-3 flex justify-end gap-2 shrink-0 bg-white">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  disabled={
                    createGroupMutation.isPending || updateGroupMutation.isPending
                  }
                  className={`${tokens.btnSecondary} px-4 py-2 text-xs`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createGroupMutation.isPending || updateGroupMutation.isPending
                  }
                  className={`${tokens.btnPrimary} px-4 py-2 text-xs`}
                >
                  {(createGroupMutation.isPending ||
                    updateGroupMutation.isPending) && (
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                  <span>
                    {createGroupMutation.isPending || updateGroupMutation.isPending
                      ? 'Saving…'
                      : isEditingGroup
                        ? 'Save Changes'
                        : 'Create Group'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;