import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MorningPunchInModal from '../components/attendance/MorningPunchInModal';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hideHeaderOnMobile, setHideHeaderOnMobile] = useState(false);
  const location = useLocation();

  const isChatRoute =
    location.pathname.startsWith('/admin/chat') ||
    location.pathname.startsWith('/chat') ||
    location.pathname.endsWith('/chat');

  // Track visualViewport on mobile (resizes dynamically when on-screen keyboard opens)
  const [viewportHeight, setViewportHeight] = useState(() => {
    if (typeof window !== 'undefined' && window.visualViewport) {
      return window.visualViewport.height;
    }
    return typeof window !== 'undefined' ? window.innerHeight : null;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateHeight = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateHeight);
      window.visualViewport.addEventListener('scroll', updateHeight);
    }
    window.addEventListener('resize', updateHeight);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateHeight);
        window.visualViewport.removeEventListener('scroll', updateHeight);
      }
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  // Lock window scroll on chat route to completely prevent Android WebView pan jitter when typing
  useEffect(() => {
    if (!isChatRoute) return;

    const lockScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('scroll', lockScroll, { passive: true });
    return () => window.removeEventListener('scroll', lockScroll);
  }, [isChatRoute]);

  // Close mobile sidebar on route change (extra safety)
  useEffect(() => {
    setIsSidebarOpen(false);
    setHideHeaderOnMobile(false);
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
    <div
      style={
        isChatRoute && viewportHeight
          ? {
              height: `${viewportHeight}px`,
              minHeight: `${viewportHeight}px`,
              maxHeight: `${viewportHeight}px`,
            }
          : undefined
      }
      className={`flex bg-slate-50 text-slate-900 overflow-hidden selection:bg-indigo-500/20 antialiased ${
        isChatRoute
          ? 'fixed inset-0 w-full'
          : 'min-h-[100dvh] h-[100dvh]'
      }`}
    >
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col w-full min-w-0 h-full relative overflow-hidden bg-slate-50">
        <Header
          toggleSidebar={() => setIsSidebarOpen((v) => !v)}
          className={isChatRoute && hideHeaderOnMobile ? 'hidden sm:block' : ''}
        />

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
            <Outlet context={{ hideHeaderOnMobile, setHideHeaderOnMobile }} />
          </div>
        </main>
      </div>

      {/* Auto Morning Greeting & Punch In Modal (7:00 AM - 11:00 AM) */}
      <MorningPunchInModal />
    </div>
  );
};

export default DashboardLayout;
