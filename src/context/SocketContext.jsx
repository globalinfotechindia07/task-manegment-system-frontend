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
          icon: '🔔',
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid #3b82f6'
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
            <div className="bg-slate-900 border border-indigo-500/50 p-4 rounded-xl shadow-2xl flex items-center gap-4 min-w-[300px]">
              <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center animate-pulse border border-indigo-500/30">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm">Meeting Invite!</p>
                <p className="text-xs text-slate-300 mt-0.5">{senderName} is inviting you.</p>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => {
                    toast.dismiss(t.id);
                    window.location.href = `/team-meeting/${roomIdMatch}`;
                  }}
                  className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg shadow-green-600/30 transition-colors"
                >
                  Join
                </button>
                <button 
                  onClick={() => toast.dismiss(t.id)}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs transition-colors"
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
