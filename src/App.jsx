import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSocket } from './context/SocketContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import ForcePasswordChange from './pages/ForcePasswordChange';
import Profile from './pages/common/Profile';
import Chat from './pages/common/Chat';
import Meeting from './pages/common/Meeting';
import PerformanceReport from './pages/common/PerformanceReport';

// Admin Pages
import AdminDashboard from './pages/admin/dashboard';
import AdminUsers from './pages/admin/users';
import AdminReports from './pages/admin/reports';
import AdminSettings from './pages/admin/settings';
import AdminAnnouncements from './pages/admin/announcements';
import AdminProjects from './pages/admin/projects';

// Other Role Dashboards
import TeamLeadDashboard from './pages/team-lead/dashboard';
import TeamLeadUsers from './pages/team-lead/users';
import TeamLeadReports from './pages/team-lead/reports';
import UserDashboard from './pages/user/dashboard';
import UserTasks from './pages/user/tasks';
import UserReports from './pages/user/reports';
import HRDashboard from './pages/hr/dashboard';
import HRTasks from './pages/hr/tasks';
import HRAnnouncements from './pages/hr/announcements';
import HRReports from './pages/hr/reports';

import './App.css';

const App = () => {
  const location = useLocation();
  const { clearUnreadChats, clearNewTasks, clearMeetingInvites } = useSocket();

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/chat')) {
      clearUnreadChats();
    }
    if (path.includes('/tasks') || path.includes('/reports')) {
      clearNewTasks();
    }
    if (path.includes('/team-meeting')) {
      clearMeetingInvites();
    }
  }, [location.pathname, clearUnreadChats, clearNewTasks, clearMeetingInvites]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 selection:bg-indigo-500/30">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        
        {/* Force Password Change Route - Needs protection but without dashboard layout */}
        <Route element={<ProtectedRoute />}>
          <Route path="/force-password-change" element={<ForcePasswordChange />} />
        </Route>

        {/* Global Protected Routes (Accessible by any authenticated user) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/team-meeting" element={<Meeting />} />
            <Route path="/team-meeting/:roomId" element={<Meeting />} />
          </Route>
        </Route>

        {/* Protected Admin & CTO Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Admin', 'CTO']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/projects" element={<AdminProjects />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/performance" element={<PerformanceReport />} />
            <Route path="/admin/announcements" element={<AdminAnnouncements />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/profile" element={<Profile />} />
            <Route path="/admin/chat" element={<Chat />} />
          </Route>
        </Route>

        {/* Protected Team Lead Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Team Head']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/team-lead/dashboard" element={<TeamLeadDashboard />} />
            <Route path="/team-lead/users" element={<TeamLeadUsers />} />
            <Route path="/team-lead/reports" element={<TeamLeadReports />} />
            <Route path="/team-lead/performance" element={<PerformanceReport />} />
            <Route path="/team-lead/profile" element={<Profile />} />
            <Route path="/team-lead/chat" element={<Chat />} />
          </Route>
        </Route>

        {/* Protected User Routes */}
        <Route element={<ProtectedRoute allowedRoles={['User']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/tasks" element={<UserTasks />} />
            <Route path="/user/reports" element={<UserReports />} />
            <Route path="/user/profile" element={<Profile />} />
            <Route path="/user/chat" element={<Chat />} />
          </Route>
        </Route>

        {/* Protected HR Manager Routes */}
        <Route element={<ProtectedRoute allowedRoles={['HR Manager']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/hr/dashboard" element={<HRDashboard />} />
            <Route path="/hr/tasks" element={<HRTasks />} />
            <Route path="/hr/announcements" element={<HRAnnouncements />} />
            <Route path="/hr/performance" element={<PerformanceReport />} />
            <Route path="/hr/reports" element={<HRReports />} />
            <Route path="/hr/profile" element={<Profile />} />
            <Route path="/hr/chat" element={<Chat />} />
          </Route>
        </Route>
      </Routes>

      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: '#1e293b',
          color: '#f8fafc',
          border: '1px solid #334155'
        }
      }}/>
    </div>
  );
}

export default App;
