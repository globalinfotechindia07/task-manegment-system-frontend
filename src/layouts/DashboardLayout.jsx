import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

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
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden selection:bg-indigo-500/20 antialiased">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col w-full min-w-0 h-full relative overflow-hidden bg-slate-50">
        <Header toggleSidebar={() => setIsSidebarOpen((v) => !v)} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 relative z-0">
          <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-5 lg:py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;