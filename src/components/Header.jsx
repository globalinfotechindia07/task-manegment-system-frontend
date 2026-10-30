import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { 
  HiOutlineBars3, 
  HiOutlineBell, 
  HiOutlineArrowRightOnRectangle,
  HiOutlineCheck,
  HiOutlineInbox
} from 'react-icons/hi2';

const Header = ({ toggleSidebar }) => {
  const { logout, user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
  });

  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id) => {
      await api.put(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  useEffect(() => {
    if (socket) {
      socket.on('notification', () => {
        queryClient.invalidateQueries(['notifications']);
      });
    }
  }, [socket, queryClient]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification._id);
    }
    setShowDropdown(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 shadow-xs">
      {/* Mobile Drawer Trigger & Workspace Badge */}
      <div className="flex items-center gap-3">
        <button 
          type="button"
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Toggle Navigation"
        >
          <HiOutlineBars3 className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-800">{user?.company?.name || 'Enterprise'}</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500 font-medium">{user?.roleRef?.displayName || user?.role || 'Staff'}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button 
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
            title="Notifications"
          >
            <HiOutlineBell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full border-2 border-white shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex justify-between items-center p-3.5 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button 
                    type="button"
                    onClick={() => markAllAsReadMutation.mutate()}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <HiOutlineInbox className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-medium text-slate-500">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n._id} 
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                        !n.isRead ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <span className={`text-xs font-semibold ${!n.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1 shrink-0"></span>
                        )}
                      </div>
                      <p className={`text-xs ${!n.isRead ? 'text-slate-600' : 'text-slate-500'} line-clamp-2`}>
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1.5 block">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Header Logout Action */}
        <button 
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-rose-600 bg-white hover:bg-rose-50/50 rounded-lg transition-colors border border-slate-200 hover:border-rose-200"
        >
          <HiOutlineArrowRightOnRectangle className="w-4 h-4 text-slate-500 group-hover:text-rose-600" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
