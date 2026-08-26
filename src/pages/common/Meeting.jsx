import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { JitsiMeeting } from '@jitsi/react-sdk';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const Meeting = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [inMeeting, setInMeeting] = useState(false);
  const [meetingIdInput, setMeetingIdInput] = useState('');
  
  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteConversations, setInviteConversations] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    if (roomId) {
      setInMeeting(true);
    } else {
      setInMeeting(false);
    }
  }, [roomId]);

  const handleCreate = () => {
    const newRoomId = Math.random().toString(36).substring(2, 10);
    window.open(`/team-meeting/${newRoomId}`, '_blank');
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (meetingIdInput.trim()) {
      window.open(`/team-meeting/${meetingIdInput.trim()}`, '_blank');
    }
  };

  const openInviteModal = async () => {
    setShowInviteModal(true);
    setInviteLoading(true);
    try {
      const res = await api.get('/chat/conversations');
      setInviteConversations(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load contacts');
    } finally {
      setInviteLoading(false);
    }
  };

  const sendInvite = async (conversation) => {
    try {
      const link = `${window.location.origin}/team-meeting/${roomId}`;
      const payload = conversation.isGroup 
        ? { groupId: conversation._id, text: `Please join my meeting: ${link}` }
        : { receiverId: conversation._id, text: `Please join my meeting: ${link}` };
        
      await api.post('/chat/send', payload);
      toast.success(`Invite sent to ${conversation.name}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to send invite');
    }
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
    <div className="h-screen w-full flex flex-col bg-slate-950 relative overflow-hidden">
      
      {/* Floating Invite Button over Jitsi */}
      <div className="absolute top-4 left-4 z-[100]">
        <button 
          onClick={openInviteModal}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 bg-indigo-600/90 hover:bg-indigo-500 backdrop-blur-md text-white rounded-xl shadow-xl shadow-indigo-500/20 border border-indigo-500/50 transition-all hover:-translate-y-0.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Invite Teammates
        </button>
      </div>

      <div className="flex-1 w-full h-full relative z-0">
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={`gii-company-management-${roomId}`}
          configOverwrite={{
            startWithAudioMuted: true,
            startWithVideoMuted: false,
            disableModeratorIndicator: true,
            enableEmailInStats: false,
            prejoinPageEnabled: false,
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
            SHOW_CHROME_EXTENSION_BANNER: false
          }}
          userInfo={{
            displayName: user?.name || 'Teammate',
            email: user?.email
          }}
          onApiReady={(externalApi) => {
            externalApi.addListener('readyToClose', () => {
              navigate('/team-meeting');
            });
          }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
            iframeRef.style.border = 'none';
          }}
        />
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
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