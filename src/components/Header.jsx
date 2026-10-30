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
  HiOutlineInbox,
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
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
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

  // Close dropdown on Escape key (accessibility + UX)
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setShowDropdown(false);
    };
    if (showDropdown) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showDropdown]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification._id);
    }
    setShowDropdown(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const roleLabel = user?.roleRef?.displayName || user?.role || 'Staff';
  const companyLabel = user?.company?.name || 'Enterprise';

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-4 lg:px-6 sticky top-0 z-30 shadow-sm">
      {/* Left: hamburger + workspace badge */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={toggleSidebar}
          className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Toggle Navigation"
          aria-label="Toggle Navigation"
        >
          <HiOutlineBars3 className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs min-w-0">
          <span className="font-semibold text-slate-800 truncate max-w-[160px] lg:max-w-[240px]">
            {companyLabel}
          </span>
          <span className="text-slate-300 shrink-0">/</span>
          <span className="text-slate-500 font-medium truncate max-w-[120px] lg:max-w-[160px]">
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Right: notifications + logout */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown((v) => !v)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Notifications"
            aria-label="Notifications"
            aria-expanded={showDropdown}
          >
            <HiOutlineBell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full border-2 border-white shadow-sm leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown — responsive width, safe on small screens */}
          {showDropdown && (
            <div
              className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-auto sm:mt-2 w-[calc(100vw-24px)] sm:w-80 lg:w-96 max-w-md bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              role="dialog"
              aria-label="Notifications"
            >
              {/* Dropdown Header */}
              <div className="flex justify-between items-center gap-2 p-3 sm:p-3.5 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm truncate">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllAsReadMutation.mutate()}
                    className="text-[11px] sm:text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors shrink-0 cursor-pointer px-1.5 py-0.5 rounded hover:bg-indigo-50"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Dropdown Body */}
              <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                      <HiOutlineInbox className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-medium text-slate-500">No notifications yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">We'll let you know when something arrives.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 sm:p-3.5 hover:bg-slate-50 cursor-pointer transition-colors border-l-2 ${!n.isRead
                        ? 'bg-indigo-50/40 border-l-indigo-500'
                        : 'border-l-transparent'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <span
                          className={`text-xs font-semibold leading-snug break-words min-w-0 ${!n.isRead ? 'text-slate-900' : 'text-slate-700'
                            }`}
                        >
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1 shrink-0" />
                        )}
                      </div>
                      <p
                        className={`text-xs leading-relaxed break-words ${!n.isRead ? 'text-slate-600' : 'text-slate-500'
                          } line-clamp-2`}
                      >
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1.5 block">
                        {new Date(n.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <span className="hidden sm:block w-px h-6 bg-slate-200 mx-0.5" aria-hidden="true" />

        {/* Logout */}
        <button
          type="button"
          onClick={logout}
          className="group flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-rose-600 bg-white hover:bg-rose-50 rounded-lg transition-colors border border-slate-200 hover:border-rose-200 cursor-pointer"
          title="Logout"
          aria-label="Logout"
        >
          <HiOutlineArrowRightOnRectangle className="w-4 h-4 text-slate-500 group-hover:text-rose-600 transition-colors" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;