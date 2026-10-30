import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  HiOutlineVideoCamera, 
  HiOutlinePlus, 
  HiOutlineUserPlus, 
  HiOutlineXMark, 
  HiOutlineClipboardDocument 
} from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import { JitsiMeeting } from '@jitsi/react-sdk';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { API_BASE_URL } from '../../config';

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
      <div className="min-h-[85vh] w-full flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 text-center flex flex-col items-center bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-5 border border-indigo-200 shadow-xs">
            <HiOutlineVideoCamera className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Team Meetings</h2>
          <p className="text-slate-500 text-sm mb-6">Video calls and screen sharing for your team.</p>

          <button
            onClick={handleCreate}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold mb-6 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <HiOutlinePlus className="w-5 h-5" />
            New Meeting
          </button>

          <div className="flex items-center w-full my-1">
            <hr className="flex-1 border-slate-200" />
            <span className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">OR</span>
            <hr className="flex-1 border-slate-200" />
          </div>

          <form onSubmit={handleJoin} className="w-full mt-6">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Meeting Code"
                value={meetingIdInput}
                onChange={(e) => setMeetingIdInput(e.target.value)}
                className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={!meetingIdInput.trim()}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl font-semibold text-sm transition-colors border border-slate-300 cursor-pointer"
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
    <div className="h-screen w-full flex flex-col bg-slate-900 relative overflow-hidden">
      
      {/* Floating Invite Button over Jitsi */}
      <div className="absolute top-4 left-4 z-[100]">
        <button 
          onClick={openInviteModal}
          className="flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <HiOutlineUserPlus className="w-4 h-4" />
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm p-6 max-h-[80vh] flex flex-col border border-slate-200 shadow-xl rounded-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-slate-900">Invite Teammates</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-slate-800 select-all">{roomId}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(roomId);
                  toast.success('Room ID copied to clipboard');
                }}
                className="inline-flex items-center gap-1 text-xs bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-2.5 py-1 rounded-md transition-colors font-medium cursor-pointer shadow-xs"
              >
                <HiOutlineClipboardDocument className="w-3.5 h-3.5" />
                Copy
              </button>
            </div>

            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Or send via chat</p>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 min-h-[200px]">
              {inviteLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent"></div>
                </div>
              ) : inviteConversations.length === 0 ? (
                <p className="text-slate-400 text-center py-4 text-xs">No contacts found</p>
              ) : (
                inviteConversations.map(conv => (
                  <div key={conv._id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${conv.isGroup ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'}`}>
                        {conv.isGroup ? 'G' : (conv.profilePicture ? <img src={`${API_BASE_URL}${conv.profilePicture}`} alt="" className="w-full h-full rounded-full object-cover"/> : conv.name.charAt(0))}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-900">{conv.name}</span>
                        <span className="text-[10px] text-slate-500">{conv.isGroup ? 'Group' : conv.role}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => sendInvite(conv)}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded border border-indigo-200 transition-colors cursor-pointer"
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