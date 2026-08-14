import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const socket = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;
    
    const handleMeetingInvite = ({ roomId, fromName }) => {
      toast(
        (t) => (
          <div className="flex flex-col gap-2">
            <span className="font-medium text-white">{fromName} invited you to a video meeting!</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  navigate(`/team-meeting/${roomId}`);
                }}
                className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white text-xs rounded-md shadow-sm"
              >
                Join Now
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-md"
              >
                Decline
              </button>
            </div>
          </div>
        ),
        { duration: 10000, icon: '🎥' }
      );
    };

    socket.on('meeting-invite', handleMeetingInvite);
    
    return () => {
      socket.off('meeting-invite', handleMeetingInvite);
    };
  }, [socket, navigate]);

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-100 overflow-hidden selection:bg-indigo-500/30">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
        
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative z-0">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
