import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config';

const Chat = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const queryClient = useQueryClient();
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // Media states
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  // Modal State
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Fetch all users (used for New Group modal)
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data.filter(u => u._id !== user._id);
    }
  });

  // Fetch unified conversations (WhatsApp style)
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['chatConversations'],
    queryFn: async () => {
      const { data } = await api.get('/chat/conversations');
      return data;
    }
  });

  // Fetch messages for selected chat
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['chatMessages', selectedChat?._id],
    queryFn: async () => {
      if (!selectedChat) return [];
      const endpoint = selectedChat.isGroup ? `/chat/group/${selectedChat._id}` : `/chat/${selectedChat._id}`;
      const { data } = await api.get(endpoint);
      return data;
    },
    enabled: !!selectedChat
  });

  // Send Message Mutation
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
          formData.append('mediaType', ['image', 'video', 'audio'].includes(type) ? type : 'document');
        }

        const { data } = await api.post('/chat/send-media', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
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
        if (old && old.some(m => m._id === newMessage._id)) return old;
        return old ? [...old, newMessage] : [newMessage];
      });

      updateConversationSidebar(selectedChat._id, newMessage);

      setMessageText('');
      setSelectedFile(null);
      setAudioBlob(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  });

  const updateConversationSidebar = (chatId, newMessage, incrementUnread = false) => {
    queryClient.setQueryData(['chatConversations'], (oldConvos) => {
      if (!oldConvos) return oldConvos;
      const updated = oldConvos.map(c => {
        if (c._id === chatId) {
          return {
            ...c,
            unreadCount: incrementUnread ? (c.unreadCount || 0) + 1 : c.unreadCount,
            latestMessage: {
              text: newMessage.text,
              mediaType: newMessage.mediaType,
              createdAt: newMessage.createdAt,
              sender: newMessage.sender
            },
            updatedAt: newMessage.createdAt
          };
        }
        return c;
      });
      return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    });
  };

  const createGroupMutation = useMutation({
    mutationFn: async (groupData) => {
      const { data } = await api.post('/chat/groups', groupData);
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
    }
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({ groupId, groupData }) => {
      const { data } = await api.put(`/chat/groups/${groupId}`, groupData);
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
      if (selectedChat && selectedChat._id === updatedGroup._id) {
        setSelectedChat(prev => ({ ...prev, name: updatedGroup.name, members: updatedGroup.members }));
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update group');
    }
  });

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message) => {
      const isGroupMessage = !!message.groupId;
      const senderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
      const receiverId = typeof message.receiver === 'object' ? message.receiver._id : message.receiver;

      const conversationId = isGroupMessage
        ? message.groupId
        : (senderId === user._id ? receiverId : senderId);

      let isViewingThisChat = false;
      if (selectedChat) {
        if (selectedChat.isGroup && isGroupMessage && selectedChat._id === message.groupId) {
          isViewingThisChat = true;
        } else if (!selectedChat.isGroup && !isGroupMessage && selectedChat._id === conversationId) {
          isViewingThisChat = true;
        }
      }

      if (isViewingThisChat) {
        queryClient.setQueryData(['chatMessages', selectedChat._id], (old) => {
          if (old && old.some(m => m._id === message._id)) return old;
          return old ? [...old, message] : [message];
        });
      } else {
        // Skip chat notification if it's a meeting invite (SocketContext handles this)
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

          if ('Notification' in window && Notification.permission === 'granted' && senderId !== user._id) {
            new Notification(title, { body: message.text || (message.mediaType ? `Sent a ${message.mediaType}` : 'New message') });
          }
        }
      }

      updateConversationSidebar(conversationId, message, !isViewingThisChat);
    };

    const handleMessagesRead = ({ readerId }) => {
      if (selectedChat && !selectedChat.isGroup && selectedChat._id === readerId) {
        queryClient.setQueryData(['chatMessages', selectedChat._id], (old) => {
          if (!old) return old;
          return old.map(m => (!m.read && m.sender === user._id) ? { ...m, read: true } : m);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if ((!messageText.trim() && !selectedFile && !audioBlob) || !selectedChat) return;
    sendMessageMutation.mutate({ text: messageText, file: selectedFile, audio: audioBlob });
  };

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedMembers.length === 0) {
      toast.error('Please enter a group name and select at least one member');
      return;
    }
    if (isEditingGroup) {
      updateGroupMutation.mutate({ groupId: editingGroupId, groupData: { name: groupName, members: selectedMembers } });
    } else {
      createGroupMutation.mutate({ name: groupName, members: selectedMembers });
    }
  };

  const openCreateGroupModal = () => {
    setIsEditingGroup(false);
    setEditingGroupId(null);
    setGroupName('');
    setSelectedMembers([]);
    setShowGroupModal(true);
  };

  const openEditGroupModal = (group) => {
    setIsEditingGroup(true);
    setEditingGroupId(group._id);
    setGroupName(group.name);
    const memberIds = group.members.map(m => typeof m === 'object' ? m._id : m).filter(id => id !== user._id);
    setSelectedMembers(memberIds);
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
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error('Microphone access denied or unavailable');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearMedia = () => {
    setSelectedFile(null);
    setAudioBlob(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredConversations = conversations?.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.designation && c.designation.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Main Container */}
      <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-2 md:p-4 overflow-hidden">
        <div className="flex-1 glass-panel overflow-hidden border border-slate-700/50 shadow-2xl rounded-2xl flex flex-col bg-slate-900/80 backdrop-blur-sm">

          {/* Header */}
          <div className="p-3 md:p-4 border-b border-slate-700/50 flex flex-wrap items-center justify-between gap-2 bg-slate-800/40 backdrop-blur-sm rounded-t-2xl">
            <div className="flex items-center gap-2 md:gap-3">
              <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Messages
              </h1>
              {socket ? (
                <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Disconnected
                </span>
              )}
            </div>
            {user?.role === 'Admin' && (
              <button
                onClick={openCreateGroupModal}
                className="px-3 py-1.5 md:px-4 md:py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-indigo-500/20 flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                New Group
              </button>
            )}
          </div>

          {/* Chat Body */}
          <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
            {/* Sidebar */}
            <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-700/50 flex flex-col bg-slate-800/20">
              <div className="p-3 border-b border-slate-700/50">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search chats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {conversationsLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 opacity-60">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-slate-400 text-sm">Loading chats...</p>
                  </div>
                ) : filteredConversations?.length === 0 ? (
                  <p className="text-slate-500 text-center py-10 text-sm">No conversations found.</p>
                ) : (
                  filteredConversations?.map(chat => (
                    <button
                      key={chat._id}
                      onClick={() => {
                        setSelectedChat(chat);
                        if (chat.unreadCount > 0) {
                          queryClient.setQueryData(['chatConversations'], (old) => {
                            return old?.map(c => c._id === chat._id ? { ...c, unreadCount: 0 } : c);
                          });
                        }
                      }}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left ${selectedChat?._id === chat._id
                        ? 'bg-indigo-500/20 border border-indigo-500/30 shadow-inner'
                        : 'hover:bg-slate-700/40 border border-transparent'
                        }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 relative ${chat.isGroup ? 'bg-indigo-900/60 border border-indigo-500/30 text-indigo-400' : 'bg-slate-700'
                        }`}>
                        {chat.isGroup ? (
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        ) : chat.profilePicture ? (
                          <img src={`${API_BASE_URL}${chat.profilePicture}`} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          chat.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="overflow-hidden flex-1 mt-0.5">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <p className="text-sm font-semibold text-slate-100 truncate pr-2">{chat.name}</p>
                          {chat.latestMessage && (
                            <span className="text-[10px] text-slate-400 flex-shrink-0">
                              {new Date(chat.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        {chat.latestMessage ? (
                          <p className={`text-xs truncate pr-4 ${chat.unreadCount > 0 ? 'text-white font-medium' : 'text-slate-400'}`}>
                            {chat.isGroup && typeof chat.latestMessage.sender === 'object' && chat.latestMessage.sender._id === user._id ? 'You: ' : ''}
                            {chat.isGroup && typeof chat.latestMessage.sender === 'object' && chat.latestMessage.sender._id !== user._id ? `${chat.latestMessage.sender.name}: ` : ''}
                            {chat.latestMessage.mediaType ? `Sent a ${chat.latestMessage.mediaType}` : chat.latestMessage.text}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500 italic">Tap to start chatting</p>
                        )}
                      </div>
                      {chat.unreadCount > 0 && (
                        <div className="flex-shrink-0 flex items-center justify-center min-w-[20px] h-5 bg-indigo-500 rounded-full px-1.5 ml-1 mt-6 shadow-sm shadow-indigo-500/30">
                          <span className="text-[10px] font-bold text-white">{chat.unreadCount}</span>
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-900/40 relative">
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-3 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/40 shadow-sm z-10">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${selectedChat.isGroup ? 'bg-indigo-900/60 border border-indigo-500/30 text-indigo-400' : 'bg-slate-700 text-white'
                        }`}>
                        {selectedChat.isGroup ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        ) : selectedChat.profilePicture ? (
                          <img src={`${API_BASE_URL}${selectedChat.profilePicture}`} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          selectedChat.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold text-white truncate">{selectedChat.name}</h2>
                        <p className="text-xs text-slate-400 truncate">
                          {selectedChat.isGroup ? `${selectedChat.members?.length || 0} members` : selectedChat.role}
                        </p>
                      </div>
                    </div>
                    {user?.role === 'Admin' && selectedChat.isGroup && (
                      <button
                        onClick={() => openEditGroupModal(selectedChat)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-[url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'4\' viewBox=\'0 0 4 4\'%3E%3Cpath fill=\'%23334155\' fill-opacity=\'0.1\' d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\'/%3E%3C/svg%3E')]">
                    {messagesLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 border-t-transparent"></div>
                      </div>
                    ) : messages?.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="bg-slate-800/80 px-4 py-2 rounded-full text-slate-400 text-sm shadow-sm backdrop-blur-sm border border-slate-700/50">
                          No messages yet. Send a message to start!
                        </div>
                      </div>
                    ) : (
                      messages?.map((msg, index) => {
                        const isMine = typeof msg.sender === 'object' ? msg.sender._id === user._id : msg.sender === user._id;
                        const senderObj = typeof msg.sender === 'object' ? msg.sender : null;
                        const senderName = isMine ? 'You' : (senderObj?.name || 'Unknown');

                        return (
                          <div key={msg._id || index} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] md:max-w-[75%] flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
                              {selectedChat.isGroup && !isMine && (
                                <span className="text-[11px] font-medium text-slate-400 ml-3">{senderName}</span>
                              )}
                              <div
                                className={`rounded-2xl p-2 shadow-sm relative ${isMine
                                  ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-600/20'
                                  : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/50'
                                  }`}
                              >
                                {msg.mediaUrl && (
                                  <div className="mb-1 rounded-xl overflow-hidden max-w-[200px] sm:max-w-xs">
                                    {msg.mediaType === 'image' && (
                                      <img src={`${API_BASE_URL}${msg.mediaUrl}`} alt="Attachment" className="w-full h-auto object-cover max-h-60" />
                                    )}
                                    {msg.mediaType === 'video' && (
                                      <video src={`${API_BASE_URL}${msg.mediaUrl}`} controls className="w-full h-auto max-h-60"></video>
                                    )}
                                    {msg.mediaType === 'audio' && (
                                      <audio src={`${API_BASE_URL}${msg.mediaUrl}`} controls className="w-full max-w-[180px] h-8 mt-1"></audio>
                                    )}
                                    {msg.mediaType === 'document' && (
                                      <a href={`${API_BASE_URL}${msg.mediaUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-slate-900/40 rounded-lg text-xs hover:underline">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                        Document
                                      </a>
                                    )}
                                  </div>
                                )}
                                {msg.text && (
                                  <div className="text-sm whitespace-pre-wrap break-words leading-relaxed px-2 pt-1 pb-0">
                                    {msg.text.includes('Room ID:') ? (
                                      <>
                                        {msg.text.split('Room ID:')[0]}
                                        <br/>
                                        <span className="font-semibold">Room ID: </span>
                                        <a href={`/team-meeting/${msg.text.split('Room ID:')[1].trim()}`} className="text-indigo-400 hover:text-indigo-300 underline font-mono select-all" onClick={(e) => { e.stopPropagation(); }}>
                                          {msg.text.split('Room ID:')[1].trim()}
                                        </a>
                                      </>
                                    ) : (
                                      msg.text
                                    )}
                                  </div>
                                )}
                                <div className={`text-[10px] px-2 pb-0.5 pt-0.5 flex items-center justify-end gap-1 ${isMine ? 'text-indigo-200' : 'text-slate-400'
                                  }`}>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  {isMine && (
                                    msg.read ? (
                                      <svg className="w-3.5 h-3.5 text-red-400 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7 M5 18l4 4L19 12" />
                                      </svg>
                                    ) : (
                                      <svg className="w-3 h-3 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7 M5 18l4 4L19 12" />
                                      </svg>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="p-2 md:p-3 bg-slate-800/60 border-t border-slate-700/50 backdrop-blur-md flex flex-col gap-2">
                    {(selectedFile || audioBlob) && (
                      <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 px-3 rounded-lg border border-slate-700 w-fit">
                        {selectedFile && <span className="text-xs text-indigo-300 truncate max-w-[120px]">{selectedFile.name}</span>}
                        {audioBlob && <span className="text-xs text-indigo-300">Voice Note ({Math.round(audioBlob.size / 1024)} KB)</span>}
                        <button type="button" onClick={clearMedia} className="text-slate-400 hover:text-red-400">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}

                    <form onSubmit={handleSend} className="flex gap-2 items-center w-full">
                      <label className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white cursor-pointer transition-colors flex-shrink-0">
                        <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </label>

                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder={isRecording ? "Recording audio..." : "Type a message..."}
                        disabled={isRecording}
                        className="flex-1 bg-slate-900 border border-slate-600 rounded-full px-4 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-inner min-w-0 disabled:opacity-50"
                      />

                      {!messageText.trim() && !selectedFile && !audioBlob ? (
                        <button
                          type="button"
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${isRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                            }`}
                        >
                          {isRecording ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z" /></svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                          )}
                        </button>
                      ) : null}

                      <button
                        type="submit"
                        disabled={(!messageText.trim() && !selectedFile && !audioBlob) || sendMessageMutation.isLoading}
                        className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex-shrink-0 shadow-lg shadow-indigo-600/30"
                      >
                        <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-80 p-4">
                  <div className="w-20 h-20 mb-6 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center shadow-lg">
                    <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-xl font-medium text-slate-300">Your Messages</p>
                  <p className="text-sm mt-2 max-w-xs text-center leading-relaxed">Select a conversation from the sidebar or start a new group to begin messaging.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-md p-6 max-h-[90vh] flex flex-col border border-slate-700 shadow-2xl rounded-2xl">
            <h2 className="text-xl font-bold text-white mb-5">{isEditingGroup ? 'Edit Group' : 'Create New Group'}</h2>

            <form onSubmit={handleCreateGroup} className="flex flex-col flex-1 overflow-hidden">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Group Name</label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Engineering Team"
                />
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Select Members</label>
                <div className="flex-1 overflow-y-auto bg-slate-800/50 border border-slate-700 rounded-lg p-2 space-y-1 custom-scrollbar">
                  {users?.map(u => (
                    <label key={u._id} className="flex items-center gap-3 p-2 hover:bg-slate-700/80 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-600">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(u._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMembers([...selectedMembers, u._id]);
                          } else {
                            setSelectedMembers(selectedMembers.filter(id => id !== u._id));
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-500 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                      />
                      <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs text-white overflow-hidden shadow-sm">
                        {u.profilePicture ? (
                          <img src={`${API_BASE_URL}${u.profilePicture}`} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          u.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{u.name}</span>
                        <span className="text-[10px] text-slate-400">{u.designation || u.role}</span>
                      </div>
                    </label>
                  ))}
                  {users?.length === 0 && (
                    <p className="text-slate-500 text-center py-4 text-sm">No other users available</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createGroupMutation.isLoading || updateGroupMutation.isLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-md shadow-indigo-500/20"
                >
                  {(createGroupMutation.isLoading || updateGroupMutation.isLoading) ? 'Saving...' : (isEditingGroup ? 'Save Changes' : 'Create Group')}
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