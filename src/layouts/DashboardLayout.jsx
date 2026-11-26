import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MorningPunchInModal from '../components/attendance/MorningPunchInModal';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const isChatRoute =
    location.pathname.startsWith('/admin/chat') ||
    location.pathname.startsWith('/chat') ||
    location.pathname.endsWith('/chat');

  // Close mobile sidebar on route change (extra safety)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  return (
    <div className="flex min-h-[100dvh] h-[100dvh] bg-slate-50 text-slate-900 overflow-hidden selection:bg-indigo-500/20 antialiased">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col w-full min-w-0 h-full relative overflow-hidden bg-slate-50">
        <Header toggleSidebar={() => setIsSidebarOpen((v) => !v)} />

        <main
          className={`flex-1 min-w-0 relative flex flex-col ${
            isChatRoute
              ? 'overflow-hidden p-0 pb-0'
              : 'overflow-y-auto overflow-x-hidden bg-slate-50 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:pb-8 touch-scroll'
          }`}
        >
          <div
            className={
              isChatRoute
                ? 'w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden'
                : 'mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-5 lg:py-6'
            }
          >
            <Outlet />
          </div>
        </main>
      </div>

      {/* Auto Morning Greeting & Punch In Modal (7:00 AM - 11:00 AM) */}
      <MorningPunchInModal />
    </div>
  );
};

export default DashboardLayout;
