import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const Meeting = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

  const [inMeeting, setInMeeting] = useState(!!roomId);
  const [meetingIdInput, setMeetingIdInput] = useState('');
  const [peers, setPeers] = useState([]);
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Fetch users for invite
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
    enabled: inMeeting
  });

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef({}); // { [userId]: RTCPeerConnection }
  const remoteStreamsRef = useRef({}); // { [userId]: MediaStream }

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  };

  useEffect(() => {
    if (!inMeeting || !socket || !user) return;

    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        socket.emit('join-meeting', roomId, user._id);

        // When a new user joins, we (the existing user) create an offer for them
        socket.on('user-connected', async (newUserId) => {
          console.log('User connected:', newUserId);
          const peer = createPeer(newUserId, socket.id, stream);
          peersRef.current[newUserId] = peer;
        });

        // When we receive an offer from an existing user (we just joined)
        socket.on('offer', async (payload) => {
          console.log('Received offer from:', payload.caller);
          const peer = addPeer(payload.caller, payload.sdp, stream);
          peersRef.current[payload.caller] = peer;
        });

        // When we receive an answer to our offer
        socket.on('answer', (payload) => {
          console.log('Received answer from:', payload.from);
          const peer = peersRef.current[payload.from];
          if (peer) {
            peer.setRemoteDescription(new RTCSessionDescription(payload.answer));
          }
        });

        // When we receive an ICE candidate
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
          toast(`${userId} left the meeting`, { icon: '👋' });
        });

      } catch (err) {
        toast.error('Could not access camera or microphone');
        console.error(err);
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

      // Cleanup local streams
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Cleanup peer connections
      Object.values(peersRef.current).forEach(peer => peer.close());
      peersRef.current = {};
      remoteStreamsRef.current = {};
    };
  }, [inMeeting, roomId, socket, user]);

  const createPeer = (userToSignal, callerId, stream) => {
    const peer = new RTCPeerConnection(iceServers);
    
    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { to: userToSignal, candidate: event.candidate, from: user._id });
      }
    };

    peer.ontrack = (event) => {
      handleRemoteStream(userToSignal, event.streams[0]);
    };

    peer.createOffer().then(offer => {
      peer.setLocalDescription(offer);
      socket.emit('offer', { to: userToSignal, caller: user._id, sdp: offer });
    });

    return peer;
  };

  const addPeer = (callerId, incomingOffer, stream) => {
    const peer = new RTCPeerConnection(iceServers);
    
    stream.getTracks().forEach(track => peer.addTrack(track, stream));

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

  // Controls
  const toggleAudio = () => {
    const enabled = !isAudioEnabled;
    setIsAudioEnabled(enabled);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks()[0].enabled = enabled;
    }
  };

  const toggleVideo = () => {
    const enabled = !isVideoEnabled;
    setIsVideoEnabled(enabled);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks()[0].enabled = enabled;
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
        screenStreamRef.current = stream;
        
        // Replace video track in all peers
        const videoTrack = stream.getVideoTracks()[0];
        
        Object.values(peersRef.current).forEach(peer => {
          const sender = peer.getSenders().find(s => s.track.kind === 'video');
          if (sender) sender.replaceTrack(videoTrack);
        });

        // Show local screen share
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

  const leaveMeeting = () => {
    navigate('/team-meeting');
    setInMeeting(false);
    // Cleanup happens in useEffect unmount
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

  const inviteUser = (targetUserId) => {
    socket.emit('invite-to-meeting', { roomId, fromName: user.name, toUserId: targetUserId });
    toast.success('Invitation sent!');
  };

  // Video component to handle refs
  const VideoPlayer = ({ stream, isLocal = false }) => {
    const videoRef = useRef(null);
    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream]);
    
    return (
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/50 shadow-lg aspect-video">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal && !isScreenSharing ? 'scale-x-[-1]' : ''}`}
        />
        <div className="absolute bottom-3 left-3 bg-slate-900/70 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm border border-slate-700/50">
          {isLocal ? 'You' : 'Peer'}
        </div>
      </div>
    );
  };

  if (!inMeeting) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="glass-panel max-w-md w-full p-8 text-center flex flex-col items-center">
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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
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
                className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
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
    <div className="h-[calc(100vh-8rem)] flex flex-col relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between bg-slate-900/80 backdrop-blur-md z-10 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/30">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Meeting Room</h2>
            <p className="text-xs text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 inline-block mt-1 select-all">{roomId}</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <button 
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            Invite
          </button>
          <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live
          </span>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        <div className={`grid gap-4 w-full h-full ${peers.length === 0 ? 'grid-cols-1' : peers.length === 1 ? 'grid-cols-2' : peers.length <= 3 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {/* Local Video */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/50 shadow-lg aspect-video h-fit">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted
              className={`w-full h-full object-cover ${!isScreenSharing ? 'scale-x-[-1]' : ''}`}
            />
            <div className="absolute bottom-3 left-3 bg-slate-900/70 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm border border-slate-700/50 flex items-center gap-2">
              You
              {!isAudioEnabled && (
                <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg> // Assuming mic off icon, fallback to just red color indicator below
              )}
            </div>
            {isScreenSharing && (
              <div className="absolute top-3 left-3 bg-blue-500/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
                Sharing Screen
              </div>
            )}
          </div>

          {/* Remote Videos */}
          {peers.map(peer => (
            <VideoPlayer key={peer.peerId} stream={peer.stream} />
          ))}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="px-6 py-4 bg-slate-900/90 backdrop-blur-lg flex justify-center gap-4 border-t border-slate-800 z-10">
        
        <button
          onClick={toggleAudio}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isAudioEnabled ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
          }`}
        >
          {isAudioEnabled ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          ) : (
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
          )}
        </button>

        <button
          onClick={toggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isVideoEnabled ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
          }`}
        >
          {isVideoEnabled ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4l16 16" /></svg>
          )}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isScreenSharing ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-700 hover:bg-slate-600 text-white'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        </button>

        <button
          onClick={leaveMeeting}
          className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white transition-all shadow-lg shadow-red-600/30 ml-4"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" /></svg>
        </button>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-sm p-5 max-h-[80vh] flex flex-col border border-slate-700 shadow-2xl rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Invite Team Members</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {users?.filter(u => u._id !== user._id).map(u => (
                <div key={u._id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700 hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold overflow-hidden border border-indigo-500/30">
                      {u.profilePicture ? (
                        <img src={`http://localhost:5000${u.profilePicture}`} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        u.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{u.name}</p>
                      <p className="text-[10px] text-slate-400">{u.designation || u.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => inviteUser(u._id)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Invite
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meeting;
