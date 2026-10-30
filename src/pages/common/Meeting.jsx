import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HiOutlineVideoCamera,
  HiOutlinePlus,
  HiOutlineUserPlus,
  HiOutlineXMark,
  HiOutlineClipboardDocument,
  HiOutlineArrowTopRightOnSquare,
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

  // ===================== LOBBY VIEW (no active meeting) =====================
  if (!inMeeting) {
    return (
      <div className="min-h-[85vh] w-full flex items-center justify-center p-3 sm:p-4">
        <div className="max-w-md w-full p-6 sm:p-8 text-center flex flex-col items-center bg-white border border-slate-200 rounded-2xl shadow-sm">

          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 border border-indigo-200 shadow-sm">
            <HiOutlineVideoCamera className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Team Meetings</h2>
          <p className="text-slate-500 text-xs sm:text-sm mb-6">
            Video calls and screen sharing for your team.
          </p>

          <button
            type="button"
            onClick={handleCreate}
            className="w-full py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-semibold mb-6 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <HiOutlinePlus className="w-4 h-4 sm:w-5 sm:h-5" />
            New Meeting
          </button>

          <div className="flex items-center w-full my-1">
            <hr className="flex-1 border-slate-200" />
            <span className="px-3 text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
              OR
            </span>
            <hr className="flex-1 border-slate-200" />
          </div>

          <form onSubmit={handleJoin} className="w-full mt-6">
            <div className="flex flex-col xs:flex-row sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Enter Meeting Code"
                value={meetingIdInput}
                onChange={(e) => setMeetingIdInput(e.target.value)}
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!meetingIdInput.trim()}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl font-semibold text-sm transition-colors border border-slate-300 cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                Join
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ===================== ACTIVE MEETING VIEW =====================
  return (
    <div className="h-screen w-full flex flex-col bg-slate-900 relative overflow-hidden">

      {/* Floating Invite Button */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-[100]">
        <button
          type="button"
          onClick={openInviteModal}
          className="flex items-center gap-2 text-[11px] sm:text-xs font-semibold px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl shadow-lg transition-colors cursor-pointer"
          aria-label="Invite teammates"
        >
          <HiOutlineUserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden xs:inline sm:inline">Invite Teammates</span>
          <span className="xs:hidden sm:hidden">Invite</span>
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
            SHOW_CHROME_EXTENSION_BANNER: false,
          }}
          userInfo={{
            displayName: user?.name || 'Teammate',
            email: user?.email,
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

      {/* ===================== INVITE MODAL ===================== */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[200] p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl border-0 sm:border border-slate-200 shadow-2xl max-h-[85vh] sm:max-h-[80vh] flex flex-col overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-5 border-b border-slate-200 bg-slate-50 shrink-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">Invite Teammates</h2>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="p-1.5 -mr-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer shrink-0"
                aria-label="Close"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 flex flex-col flex-1 overflow-y-auto">

              {/* Room ID Copy Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 sm:p-3 mb-4 flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] sm:text-xs font-semibold text-slate-800 select-all truncate">
                  {roomId}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(roomId);
                    toast.success('Room ID copied to clipboard');
                  }}
                  className="inline-flex items-center gap-1 text-[11px] sm:text-xs bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-2 sm:px-2.5 py-1 rounded-md transition-colors font-medium cursor-pointer shadow-sm shrink-0"
                >
                  <HiOutlineClipboardDocument className="w-3.5 h-3.5" />
                  Copy
                </button>
              </div>

              <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                Or send via chat
              </p>

              {/* Contacts List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 sm:space-y-2 pr-1 min-h-[180px] sm:min-h-[200px] scrollbar-thin scrollbar-thumb-slate-300">
                {inviteLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  </div>
                ) : inviteConversations.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                      <HiOutlineUserPlus className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium text-slate-600">No contacts found</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Start a chat to add contacts.</p>
                  </div>
                ) : (
                  inviteConversations.map((conv) => (
                    <div
                      key={conv._id}
                      className="flex items-center justify-between gap-2 p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${conv.isGroup
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-slate-200 text-slate-700'
                            }`}
                        >
                          {conv.isGroup ? (
                            'G'
                          ) : conv.profilePicture ? (
                            <img
                              src={`${API_BASE_URL}${conv.profilePicture}`}
                              alt={conv.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            conv.name?.charAt(0) || 'U'
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-slate-900 truncate">
                            {conv.name}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate">
                            {conv.isGroup ? 'Group' : conv.role || 'Member'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => sendInvite(conv)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] sm:text-xs font-semibold rounded border border-indigo-200 transition-colors cursor-pointer shrink-0"
                      >
                        Invite
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meeting;