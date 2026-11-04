import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  HiOutlineSun,
  HiOutlineFingerPrint,
  HiOutlineClock,
  HiOutlineXMark,
  HiOutlineCalendarDays,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const MorningPunchInModal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Today's date string YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch today's attendance status
  const { data: todayStatus, isLoading } = useQuery({
    queryKey: ['todayAttendanceStatus'],
    queryFn: async () => {
      const { data } = await api.get('/attendance/today-status');
      return data;
    },
    enabled: !!user && user?.role !== 'Super Admin',
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    // 1. If not logged in or is Super Admin, don't show
    if (!user || user.role === 'Super Admin') {
      setIsOpen(false);
      return;
    }

    // 2. If already on /punch-in page, don't show
    if (location.pathname === '/punch-in') {
      setIsOpen(false);
      return;
    }

    // 3. If loading today's status, wait
    if (isLoading) return;

    // 4. If already punched in today, never show
    if (todayStatus?.hasPunchedIn) {
      setIsOpen(false);
      return;
    }

    // 5. Check time window: 7:00 AM to 11:00 AM
    const currentHour = currentTime.getHours();
    const isMorningTimeWindow = currentHour >= 7 && currentHour < 11;

    // Also support testing flag in query param (?testMorning=1) or localStorage for instant verification
    const isTesting =
      new URLSearchParams(window.location.search).get('testMorning') === '1' ||
      localStorage.getItem('testMorning') === '1';

    if (!isMorningTimeWindow && !isTesting) {
      setIsOpen(false);
      return;
    }

    // 6. Check if user dismissed it during this browser session for today
    const sessionDismissed = sessionStorage.getItem(`morning_punchin_dismissed_${todayStr}`);
    if (sessionDismissed === 'true' && !isTesting) {
      setIsOpen(false);
      return;
    }

    // Trigger modal automatically!
    setIsOpen(true);
  }, [user, location.pathname, todayStatus, isLoading, todayStr]);

  const handleClose = () => {
    sessionStorage.setItem(`morning_punchin_dismissed_${todayStr}`, 'true');
    setIsOpen(false);
  };

  const handlePunchInNow = () => {
    setIsOpen(false);
    navigate('/punch-in');
  };

  if (!isOpen || typeof document === 'undefined') return null;

  // Format time and date
  const timeFormatted = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dateFormatted = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const firstName = user?.name ? user.name.split(' ')[0] : 'Colleague';

  return createPortal(
    <div
      onClick={handleClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200/80 overflow-hidden relative my-auto animate-in zoom-in-95 duration-200"
      >
        {/* Top Decorative Banner with Warm Morning Accent */}
        <div className="relative bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-6 pb-4 border-b border-amber-100/60">
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors cursor-pointer"
            title="Remind me later"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0">
              <HiOutlineSun className="w-7 h-7 animate-spin-slow" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100/80 border border-amber-200 text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-1">
                <HiOutlineSparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Morning Attendance Window</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Good Morning, {firstName}! ☀️
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-600 mt-3 leading-relaxed">
            Welcome to work! Today is a great day to achieve big milestones. Please record your
            morning attendance to officially start your shift.
          </p>
        </div>

        {/* Live Clock & Schedule Card */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                <HiOutlineCalendarDays className="w-4 h-4 text-indigo-600" />
                <span>{dateFormatted}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {timeFormatted}
                </span>
                <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Live
                </span>
              </div>
            </div>

            <div className="text-right border-l border-slate-200 pl-4 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Shift In-Time
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                {todayStatus?.shiftInTime || '09:30'} AM
              </span>
              <span className="text-[10px] text-slate-500 block">
                {todayStatus?.bufferMinutes || 15}m buffer
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handlePunchInNow}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <HiOutlineFingerPrint className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>PUNCH IN NOW (START SHIFT)</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl font-semibold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <HiOutlineClock className="w-4 h-4 text-slate-400" />
              <span>Remind Me Later</span>
            </button>
          </div>

          {/* Safety Notice Footer */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
            <HiOutlineShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Geo-verified attendance logs ensure your presence is recorded accurately.</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MorningPunchInModal;

