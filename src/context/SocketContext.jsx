import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const audioRef = useRef(null);

  // Global Notification Counters
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [newTasksCount, setNewTasksCount] = useState(0);
  const [meetingInvitesCount, setMeetingInvitesCount] = useState(0);

  const clearUnreadChats = () => setUnreadChatsCount(0);
  const clearNewTasks = () => setNewTasksCount(0);
  const clearMeetingInvites = () => setMeetingInvitesCount(0);

  useEffect(() => {
    // Create audio element for notifications (simple short beep)
    audioRef.current = new Audio('data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq');
    audioRef.current.volume = 0.5;

    if (user && user.token) {
      // Connect to Socket.IO server
      const newSocket = io(API_BASE_URL, {
        auth: {
          token: user.token
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to socket server');
      });

      // Global notification listener
      newSocket.on('notification', (notification) => {
        // Increment tasks counter if it's task related
        if (notification.type === 'Task' || (notification.message && notification.message.toLowerCase().includes('task'))) {
          setNewTasksCount(prev => prev + 1);
        }

        // Play sound
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.log('Audio play failed:', e));
        }

        // Show toast
        toast(notification.message, {
          style: {
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            fontSize: '13px',
            fontWeight: 500,
          }
        });
      });

      // Listen for meeting invites globally
      newSocket.on('receive_message', (message) => {
        const isMeetingLink = message.text && (message.text.includes('team-meeting/') || message.text.includes('Room ID:'));
        
        if (isMeetingLink) {
          setMeetingInvitesCount(prev => prev + 1);
          
          let roomIdMatch = 'unknown';
          if (message.text.includes('Room ID:')) {
            roomIdMatch = message.text.split('Room ID:')[1].trim();
          } else if (message.text.includes('team-meeting/')) {
            roomIdMatch = message.text.split('team-meeting/')[1].trim().split(' ')[0];
          }
          
          const senderName = typeof message.sender === 'object' ? message.sender.name : 'A teammate';
          
          // Play sound
          if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Audio play failed:', e));
          }

          toast.custom((t) => (
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-lg flex items-center gap-4 min-w-[320px]">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center border border-indigo-100 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900 text-sm">Meeting Invite</p>
                <p className="text-xs text-slate-500 mt-0.5">{senderName} is inviting you.</p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button 
                  onClick={() => {
                    toast.dismiss(t.id);
                    window.location.href = `/team-meeting/${roomIdMatch}`;
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Join
                </button>
                <button 
                  onClick={() => toast.dismiss(t.id)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Decline
                </button>
              </div>
            </div>
          ), { duration: 30000, id: `meeting-${roomIdMatch}` });
        } else {
          // Normal chat message
          if (!window.location.pathname.includes('chat')) {
             setUnreadChatsCount(prev => prev + 1);
          }
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      unreadChatsCount, 
      newTasksCount, 
      meetingInvitesCount,
      clearUnreadChats,
      clearNewTasks,
      clearMeetingInvites
    }}>
      {children}
    </SocketContext.Provider>
  );
};
