import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const Meeting = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

  const [inMeeting, setInMeeting] = useState(false);
  const [meetingIdInput, setMeetingIdInput] = useState('');
  const [peers, setPeers] = useState([]);

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // New features state
  const [meetingMessages, setMeetingMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [activeReactions, setActiveReactions] = useState([]);
  const [showReactions, setShowReactions] = useState(false);

  const localVideoRef = useRef(null);
  
  const handleLocalVideoRef = useCallback((el) => {
    localVideoRef.current = el;
    if (el && localStreamRef.current) {
      el.srcObject = localStreamRef.current;
    }
  }, []);

  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef({});
  const remoteStreamsRef = useRef({});

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteConversations, setInviteConversations] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(false);

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  };

  useEffect(() => {
    if (!inMeeting || !socket || !user) return;

    const startMedia = async () => {
      let stream;
      try {
        // Try both video and audio
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (err) {
        console.warn('Could not access camera/mic, trying audio only...', err);
        setIsVideoEnabled(false);
        try {
          // Try audio only
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        } catch (audioErr) {
          console.warn('Could not access audio either, joining without media', audioErr);
          setIsVideoEnabled(false);
          setIsAudioEnabled(false);
          // Create empty stream so they can still receive remote streams
          stream = new MediaStream();
          toast('Joined without camera/microphone', { icon: '⚠️' });
        }
      }

      try {
        localStreamRef.current = stream;
        if (localVideoRef.current && stream.getTracks().length > 0) {
          localVideoRef.current.srcObject = stream;
        }

        socket.emit('join-meeting', roomId, { id: user._id, name: user.name });

        socket.on('user-connected', (joinedUser) => {
          const peerId = typeof joinedUser === 'object' ? joinedUser.id : joinedUser;
          const peerName = typeof joinedUser === 'object' ? joinedUser.name : 'Teammate';
          
          toast(`${peerName} joined the meeting`, { icon: '👋' });
          const peer = createPeer(peerId, { id: user._id, name: user.name }, localStreamRef.current);
          peersRef.current[peerId] = peer;
          setPeers((prev) => {
            if (prev.find(p => p.peerId === peerId)) return prev;
            return [...prev, { peerId, peer, name: peerName, isVideoEnabled: true, isAudioEnabled: true }];
          });
        });

        socket.on('offer', async (payload) => {
          const callerId = typeof payload.caller === 'object' ? payload.caller.id : payload.caller;
          const callerName = typeof payload.caller === 'object' ? payload.caller.name : 'Teammate';
          
          if (!peersRef.current[callerId]) {
            const peer = addPeer(callerId, payload.sdp, localStreamRef.current);
            peersRef.current[callerId] = peer;
            setPeers((prev) => {
              if (prev.find(p => p.peerId === callerId)) return prev;
              return [...prev, { peerId: callerId, peer, name: callerName, isVideoEnabled: true, isAudioEnabled: true }];
            });
          }
        });

        socket.on('media-state-changed', (payload) => {
          setPeers((prev) => prev.map(p => 
            p.peerId === payload.userId 
              ? { ...p, isVideoEnabled: payload.isVideoEnabled, isAudioEnabled: payload.isAudioEnabled }
              : p
          ));
        });

        socket.on('meeting-chat', (payload) => {
          setMeetingMessages((prev) => [...prev, payload]);
        });

        socket.on('meeting-reaction', (payload) => {
          const newReaction = { id: Math.random(), ...payload, timestamp: Date.now() };
          setActiveReactions((prev) => [...prev, newReaction]);
          setTimeout(() => {
             setActiveReactions((prev) => prev.filter(r => r.id !== newReaction.id));
          }, 3000);
        });

        socket.on('answer', (payload) => {
          console.log('Received answer from:', payload.from);
          const peer = peersRef.current[payload.from];
          if (peer) {
            peer.setRemoteDescription(new RTCSessionDescription(payload.answer));
          }
        });

        socket.on('ice-candidate', (payload) => {
          const peer = peersRef.current[payload.from];
          if (peer) {
            peer.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(e => console.error(e));
          }
        });

        // When a user disconnects
        socket.on('user-disconnected', (userId) => {
          if (peersRef.current[userId]) {
            peersRef.current[userId].close();
            delete peersRef.current[userId];
          }
          if (remoteStreamsRef.current[userId]) {
            delete remoteStreamsRef.current[userId];
          }
          setPeers((prev) => prev.filter(p => p.peerId !== userId));
          toast(`Someone left the meeting`, { icon: '👋' });
        });

      } catch (err) {
        console.error('Fatal error setting up meeting:', err);
        toast.error('Could not connect to meeting room');
      }
    };

    startMedia();

    return () => {
      socket.emit('leave-meeting', roomId, user._id);
      socket.off('user-connected');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-disconnected');

      stopAllMedia();
      
      Object.values(peersRef.current).forEach(peer => peer.close());
      peersRef.current = {};
      remoteStreamsRef.current = {};
    };
  }, [inMeeting, roomId, socket, user]);

  const stopAllMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        localStreamRef.current.removeTrack(track);
      });
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        track.stop();
        screenStreamRef.current.removeTrack(track);
      });
      screenStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  const createPeer = (userToSignal, callerData, stream) => {
    const peer = new RTCPeerConnection(iceServers);

    if (stream && stream.getTracks().length > 0) {
      stream.getTracks().forEach(track => peer.addTrack(track, stream));
    }

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          to: userToSignal,
          candidate: event.candidate,
          from: typeof callerData === 'object' ? callerData.id : callerData
        });
      }
    };

    peer.ontrack = (event) => {
      handleRemoteStream(userToSignal, event.streams[0]);
    };

    peer.onnegotiationneeded = async () => {
      try {
        await peer.setLocalDescription(await peer.createOffer());
        socket.emit('offer', {
          to: userToSignal,
          caller: callerData,
          sdp: peer.localDescription
        });
      } catch (err) {
        console.error(err);
      }
    };

    return peer;
  };

  const addPeer = (callerId, incomingOffer, stream) => {
    const peer = new RTCPeerConnection(iceServers);

    if (stream && stream.getTracks().length > 0) {
      stream.getTracks().forEach(track => peer.addTrack(track, stream));
    }

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { to: callerId, candidate: event.candidate, from: user._id });
      }
    };

    peer.ontrack = (event) => {
      handleRemoteStream(callerId, event.streams[0]);
    };

    peer.setRemoteDescription(new RTCSessionDescription(incomingOffer))
      .then(() => peer.createAnswer())
      .then(answer => {
        peer.setLocalDescription(answer);
        socket.emit('answer', { to: callerId, answer: answer, from: user._id });
      });

    return peer;
  };

  const handleRemoteStream = (userId, stream) => {
    if (!remoteStreamsRef.current[userId]) {
      remoteStreamsRef.current[userId] = stream;
      setPeers(prev => {
        if (!prev.find(p => p.peerId === userId)) {
          return [...prev, { peerId: userId, stream }];
        }
        return prev;
      });
    }
  };

  const toggleAudio = () => {
    const enabled = !isAudioEnabled;
    setIsAudioEnabled(enabled);
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
      }
    }
    socket.emit('media-state-changed', roomId, { userId: user._id, isVideoEnabled, isAudioEnabled: enabled });
  };

  const toggleVideo = async () => {
    const enabled = !isVideoEnabled;
    
    if (enabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = stream.getVideoTracks()[0];
        
        if (localStreamRef.current) {
          const oldTrack = localStreamRef.current.getVideoTracks()[0];
          if (oldTrack) {
            localStreamRef.current.removeTrack(oldTrack);
          }
          localStreamRef.current.addTrack(newTrack);
          
          // Replace track for all peers
          Object.values(peersRef.current).forEach(peer => {
            const sender = peer.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) {
              sender.replaceTrack(newTrack).catch(e => console.error('Replace track error', e));
            }
          });
        } else {
          localStreamRef.current = stream;
        }
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      } catch (err) {
        toast.error('Failed to access camera');
        return;
      }
    } else {
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.stop();
          localStreamRef.current.removeTrack(videoTrack);
        }
      }
    }
    
    setIsVideoEnabled(enabled);
    socket.emit('media-state-changed', roomId, { userId: user._id, isVideoEnabled: enabled, isAudioEnabled });
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
        screenStreamRef.current = stream;

        const videoTrack = stream.getVideoTracks()[0];

        Object.values(peersRef.current).forEach(peer => {
          const sender = peer.getSenders().find(s => s.track.kind === 'video');
          if (sender) sender.replaceTrack(videoTrack);
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsScreenSharing(true);

        videoTrack.onended = () => {
          stopScreenShare();
        };
      } catch (err) {
        console.error('Error sharing screen:', err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
    }
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    Object.values(peersRef.current).forEach(peer => {
      const sender = peer.getSenders().find(s => s.track.kind === 'video');
      if (sender) sender.replaceTrack(videoTrack);
    });
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    setIsScreenSharing(false);
  };

  const sendMeetingChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const payload = {
      userId: user._id,
      userName: user.name,
      text: chatInput,
      time: new Date()
    };
    
    socket.emit('meeting-chat', roomId, payload);
    setMeetingMessages(prev => [...prev, payload]);
    setChatInput('');
  };

  const sendReaction = (reaction) => {
    const payload = { userId: user._id, reaction };
    socket.emit('meeting-reaction', roomId, payload);
    const newReaction = { id: Math.random(), ...payload, timestamp: Date.now() };
    setActiveReactions(prev => [...prev, newReaction]);
    setShowReactions(false);
    setTimeout(() => {
       setActiveReactions((prev) => prev.filter(r => r.id !== newReaction.id));
    }, 3000);
  };

  const leaveMeeting = () => {
    stopAllMedia();
    socket.emit('leave-meeting', roomId, user._id);
    navigate('/team-meeting');
    setInMeeting(false);
  };

  const openInviteModal = async () => {
    setShowInviteModal(true);
    setInviteLoading(true);
    try {
      const { data } = await api.get('/chat/conversations');
      setInviteConversations(data);
    } catch (err) {
      toast.error('Failed to load contacts');
    } finally {
      setInviteLoading(false);
    }
  };

  const sendInvite = async (conversation) => {
    try {
      const payload = conversation.isGroup 
        ? { groupId: conversation._id, text: `Join my Team Meeting!\nRoom ID: ${roomId}` }
        : { receiverId: conversation._id, text: `Join my Team Meeting!\nRoom ID: ${roomId}` };
        
      await api.post('/chat/send', payload);
      toast.success(`Invite sent to ${conversation.name}`);
    } catch (err) {
      toast.error('Failed to send invite');
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (meetingIdInput.trim()) {
      navigate(`/team-meeting/${meetingIdInput}`);
      setInMeeting(true);
    }
  };

  const handleCreate = () => {
    const newRoomId = Math.random().toString(36).substring(2, 10);
    navigate(`/team-meeting/${newRoomId}`);
    setInMeeting(true);
  };

  const VideoPlayer = ({ stream, isLocal = false }) => {
    const videoRef = useRef(null);
    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream]);

    return (
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/50 shadow-lg aspect-video w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal && !isScreenSharing ? 'scale-x-[-1]' : ''}`}
        />
        <div className="absolute bottom-3 left-3 bg-slate-900/70 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm border border-slate-700/50 flex items-center gap-2">
          {isLocal ? 'You' : 'Peer'}
          {isLocal && !isAudioEnabled && (
            <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        {isLocal && isScreenSharing && (
          <div className="absolute top-3 left-3 bg-blue-500/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
            Sharing Screen
          </div>
        )}
        {!isLocal && !stream && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-600">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  if (!inMeeting) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950 p-4">
        <div className="glass-panel max-w-md w-full p-8 text-center flex flex-col items-center bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl">
          <div className="w-20 h-20 bg-indigo-500/20 text-indigo-400 rounded-3xl flex items-center justify-center mb-6 border border-indigo-500/30 rotate-3 shadow-lg">
            <svg className="w-10 h-10 -rotate-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Team Meetings</h2>
          <p className="text-slate-400 mb-8">Video calls and screen sharing for your team.</p>

          <button
            onClick={handleCreate}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold mb-6 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Meeting
          </button>

          <div className="flex items-center w-full my-2">
            <hr className="flex-1 border-slate-700/50" />
            <span className="px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">OR</span>
            <hr className="flex-1 border-slate-700/50" />
          </div>

          <form onSubmit={handleJoin} className="w-full mt-6">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Meeting Code"
                value={meetingIdInput}
                onChange={(e) => setMeetingIdInput(e.target.value)}
                className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none placeholder-slate-500"
              />
              <button
                type="submit"
                disabled={!meetingIdInput.trim()}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors border border-slate-600"
              >
                Join
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between bg-slate-900/80 backdrop-blur-md z-10 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/30 flex-shrink-0">
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="text-base md:text-lg font-bold text-white truncate flex items-center gap-2">
              Meeting Room
              <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-0.5 rounded-full border border-indigo-500/30 font-medium">
                {peers.length + 1} {peers.length + 1 === 1 ? 'Person' : 'People'}
              </span>
            </h2>
            <p className="text-[10px] md:text-xs text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 inline-block truncate max-w-[120px] md:max-w-none select-all">{roomId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={openInviteModal}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-full border border-indigo-500/30 transition-colors"
          >
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            <span className="hidden sm:inline">Invite</span>
          </button>
          <span className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 md:px-3 md:py-1.5 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="hidden sm:inline">Live</span>
          </span>
        </div>
      </div>

      {/* Video Grid - No Scroll, fits exactly */}
      <div className="flex-1 p-2 md:p-4 lg:p-6 overflow-hidden flex flex-col md:flex-row gap-2 md:gap-4">
        {/* Main Stage (Screen Share or Active Speaker) */}
        <div className={`transition-all duration-500 ease-in-out ${isScreenSharing ? 'w-full md:w-3/4 h-1/2 md:h-full' : 'hidden'}`}>
          <div className="relative rounded-xl md:rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/50 shadow-lg w-full h-full">
            <video
              ref={handleLocalVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain bg-black"
            />
            <div className="absolute top-3 left-3 bg-blue-500/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
              Sharing Your Screen
            </div>
          </div>
        </div>

        {/* Regular Grid (Side panel if screen sharing) */}
        <div className={`grid gap-2 md:gap-3 lg:gap-4 w-full ${isScreenSharing ? 'w-full md:w-1/4 grid-cols-2 md:grid-cols-1 overflow-y-auto custom-scrollbar h-1/2 md:h-full content-start' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 h-full'}`}>
          {/* Local Video (only show in grid if NOT screen sharing) */}
          {!isScreenSharing && (
            <div className="relative rounded-xl md:rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/50 shadow-lg aspect-video w-full h-full min-h-[150px]">
              <video
                ref={handleLocalVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 bg-slate-900/70 backdrop-blur-sm px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-medium text-white shadow-sm border border-slate-700/50 flex items-center gap-1.5">
              You
              {!isAudioEnabled && (
                <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-400 border border-slate-600 shadow-inner">
                  {user.name.charAt(0)}
                </div>
              </div>
            )}
          </div>
          )}

          {/* Remote Videos */}
          {peers.map(peer => (
            <div key={peer.peerId} className={`relative rounded-xl md:rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/50 shadow-lg w-full ${isScreenSharing ? 'aspect-video min-h-[100px]' : 'aspect-video h-full min-h-[150px]'}`}>
              <video
                ref={(el) => {
                  if (el && peer.stream) {
                    el.srcObject = peer.stream;
                  }
                }}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 bg-slate-900/70 backdrop-blur-sm px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-medium text-white shadow-sm border border-slate-700/50 truncate max-w-[90%]">
                {peer.name || 'Teammate'}
              </div>
            </div>
          ))}

          {/* Empty state when no peers */}
          {peers.length === 0 && (
            <div className="hidden sm:flex items-center justify-center rounded-xl md:rounded-2xl bg-slate-900/50 border border-slate-700/30 border-dashed aspect-video w-full h-full min-h-[150px]">
              <div className="text-center text-slate-500">
                <svg className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-xs md:text-sm">Waiting for others to join...</p>
              </div>
            </div>
          )}
        </div>

        {/* Chat Panel */}
        <div className={`transition-all duration-300 ${showChat ? 'w-full md:w-80 flex flex-col bg-slate-900 border border-slate-700/50 rounded-2xl shadow-lg overflow-hidden' : 'hidden'}`}>
          <div className="p-3 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-white">Meeting Chat</h3>
            <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {meetingMessages.length === 0 ? (
              <p className="text-xs text-slate-500 text-center mt-4">No messages yet. Start the conversation!</p>
            ) : (
              meetingMessages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.userId === user._id ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-slate-400 mb-0.5 px-1">{msg.userName}</span>
                  <div className={`text-sm px-3 py-1.5 rounded-xl max-w-[85%] break-words ${msg.userId === user._id ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-slate-700 text-slate-200 rounded-tl-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
          </div>
          <form onSubmit={sendMeetingChat} className="p-2 border-t border-slate-800 bg-slate-800/30 flex gap-2">
            <input
              type="text"
              placeholder="Send a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-indigo-500 outline-none"
            />
            <button type="submit" disabled={!chatInput.trim()} className="p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      </div>

      {/* Floating Reactions Overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden flex items-end justify-center pb-32">
        {activeReactions.map(reaction => (
          <div 
            key={reaction.id} 
            className="absolute text-5xl md:text-6xl filter drop-shadow-lg"
            style={{ 
              animation: 'floatUp 3s ease-out forwards',
              left: `${45 + Math.random() * 10}%`,
              bottom: '10%'
            }}
          >
            {reaction.reaction}
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          20% { transform: translateY(-50px) scale(1.2); opacity: 1; }
          80% { transform: translateY(-200px) scale(1); opacity: 1; }
          100% { transform: translateY(-300px) scale(0.8); opacity: 0; }
        }
      `}} />

      {/* Controls Bar - Fixed at bottom */}
      <div className="px-4 md:px-6 py-3 md:py-4 bg-slate-900/90 backdrop-blur-lg flex justify-center gap-2 md:gap-4 border-t border-slate-800 flex-shrink-0">
        <button
          onClick={toggleAudio}
          className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${isAudioEnabled ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
            }`}
        >
          {isAudioEnabled ? (
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          )}
        </button>

        <button
          onClick={toggleVideo}
          className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${isVideoEnabled ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
            }`}
        >
          {isVideoEnabled ? (
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4l16 16" />
            </svg>
          )}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${isScreenSharing ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </button>

        <div className="w-px h-8 bg-slate-700 my-auto mx-1 md:mx-2 hidden sm:block"></div>

        <button
          onClick={() => setShowChat(!showChat)}
          className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${showChat ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white transition-all"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          {showReactions && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-slate-800 border border-slate-700 p-2 rounded-full shadow-xl flex gap-2 animate-in slide-in-from-bottom-2 fade-in">
              {['👍', '❤️', '😂', '👏', '🎉'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="w-8 h-8 md:w-10 md:h-10 text-xl md:text-2xl hover:scale-125 hover:-translate-y-1 transition-transform flex items-center justify-center rounded-full"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={leaveMeeting}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white transition-all shadow-lg shadow-red-600/30 ml-1 md:ml-4"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
          </svg>
        </button>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-sm p-6 max-h-[80vh] flex flex-col border border-slate-700 shadow-2xl rounded-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-white">Invite Teammates</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 mb-4 flex items-center justify-between">
              <span className="font-mono text-sm text-slate-300 select-all">{roomId}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(roomId);
                  toast.success('Room ID copied to clipboard');
                }}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md transition-colors"
              >
                Copy
              </button>
            </div>

            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Or send via chat</p>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 min-h-[200px]">
              {inviteLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 border-t-transparent"></div>
                </div>
              ) : inviteConversations.length === 0 ? (
                <p className="text-slate-500 text-center py-4 text-sm">No contacts found</p>
              ) : (
                inviteConversations.map(conv => (
                  <div key={conv._id} className="flex items-center justify-between p-2 hover:bg-slate-800/50 rounded-lg border border-transparent hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${conv.isGroup ? 'bg-indigo-900/60 text-indigo-400' : 'bg-slate-700'}`}>
                        {conv.isGroup ? 'G' : (conv.profilePicture ? <img src={`http://localhost:5000${conv.profilePicture}`} alt="" className="w-full h-full rounded-full object-cover"/> : conv.name.charAt(0))}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-200">{conv.name}</span>
                        <span className="text-[10px] text-slate-500">{conv.isGroup ? 'Group' : conv.role}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => sendInvite(conv)}
                      className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white text-xs font-medium rounded border border-indigo-500/30 transition-colors"
                    >
                      Invite
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meeting;