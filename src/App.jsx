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
import PunchInOut from './pages/common/PunchInOut';
import MyAttendance from './pages/common/MyAttendance';
import MySalarySlips from './pages/common/MySalarySlips';

// Super Admin Pages
import SuperAdminDashboard from './pages/super-admin/dashboard';
import OfficesManager from './pages/super-admin/offices';
import PlansManager from './pages/super-admin/plans';
import SuperAdminCMS from './pages/super-admin/cms';

// Admin Pages
import AdminDashboard from './pages/admin/dashboard';
import HRDashboard from './pages/hr/dashboard';
import TeamLeadDashboard from './pages/team-lead/dashboard';
import UserDashboard from './pages/user/dashboard';
import DashboardDispatcher from './pages/common/DashboardDispatcher';
import AdminUsers from './pages/admin/users';
import AdminReports from './pages/admin/reports';
import AdminSettings from './pages/admin/settings';
import AdminAnnouncements from './pages/admin/announcements';
import AdminProjects from './pages/admin/projects';
import AttendanceSettings from './pages/admin/attendance-settings';
import SalaryManagement from './pages/admin/salary-management';
import PayrollDashboard from './pages/admin/payroll-dashboard';
import AdminBilling from './pages/admin/billing';
import RolesPage from './pages/admin/roles';
import AdminTasks from './pages/admin/tasks';

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
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500/20 font-sans">
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
            <Route path="/punch-in" element={<PunchInOut />} />
            <Route path="/my-attendance" element={<MyAttendance />} />
            <Route path="/my-salary-slips" element={<MySalarySlips />} />
          </Route>
        </Route>

        {/* Protected Super Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Super Admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/offices" element={<OfficesManager />} />
            <Route path="/super-admin/plans" element={<PlansManager />} />
            <Route path="/super-admin/cms" element={<SuperAdminCMS />} />
            <Route path="/super-admin/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Protected Modular Central Company Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardDispatcher />} />
            <Route path="/admin/dashboard" element={<DashboardDispatcher />} />
            <Route path="/admin/billing" element={<ProtectedRoute allowedRoles={['Admin', 'CTO']}><AdminBilling /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['Admin', 'CTO']}><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/roles" element={<ProtectedRoute requiredPermission={['settings', 'view']}><RolesPage /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requiredPermission={['users', 'view']}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/projects" element={<ProtectedRoute requiredPermission={['projects', 'view']}><AdminProjects /></ProtectedRoute>} />
            <Route path="/admin/tasks" element={<ProtectedRoute requiredPermission={['tasks', 'view']}><AdminTasks /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute requiredPermission={['reports', 'view']}><AdminReports /></ProtectedRoute>} />
            <Route path="/admin/performance" element={<ProtectedRoute requiredPermission={['performance', 'view']}><PerformanceReport /></ProtectedRoute>} />
            <Route path="/admin/announcements" element={<ProtectedRoute requiredPermission={['announcements', 'view']}><AdminAnnouncements /></ProtectedRoute>} />
            <Route path="/admin/attendance-settings" element={<ProtectedRoute requiredPermission={['attendance', 'view']}><AttendanceSettings /></ProtectedRoute>} />
            <Route path="/admin/salary-management" element={<ProtectedRoute requiredPermission={['payroll', 'view']}><SalaryManagement /></ProtectedRoute>} />
            <Route path="/admin/payroll-dashboard" element={<ProtectedRoute requiredPermission={['payroll', 'view']}><PayrollDashboard /></ProtectedRoute>} />
            <Route path="/admin/profile" element={<Profile />} />
            <Route path="/admin/chat" element={<Chat />} />

            {/* Legacy Role Route Aliases (Pointing to central unified modules) */}
            <Route path="/team-lead/dashboard" element={<TeamLeadDashboard />} />
            <Route path="/team-lead/users" element={<ProtectedRoute requiredPermission={['users', 'view']}><AdminUsers /></ProtectedRoute>} />
            <Route path="/team-lead/reports" element={<ProtectedRoute requiredPermission={['reports', 'view']}><AdminReports /></ProtectedRoute>} />
            <Route path="/team-lead/performance" element={<ProtectedRoute requiredPermission={['performance', 'view']}><PerformanceReport /></ProtectedRoute>} />
            <Route path="/team-lead/profile" element={<Profile />} />
            <Route path="/team-lead/chat" element={<Chat />} />

            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/tasks" element={<ProtectedRoute requiredPermission={['tasks', 'view']}><AdminTasks /></ProtectedRoute>} />
            <Route path="/user/reports" element={<ProtectedRoute requiredPermission={['reports', 'view']}><AdminReports /></ProtectedRoute>} />
            <Route path="/user/profile" element={<Profile />} />
            <Route path="/user/chat" element={<Chat />} />

            <Route path="/hr/dashboard" element={<HRDashboard />} />
            <Route path="/hr/tasks" element={<ProtectedRoute requiredPermission={['tasks', 'view']}><AdminTasks /></ProtectedRoute>} />
            <Route path="/hr/announcements" element={<ProtectedRoute requiredPermission={['announcements', 'view']}><AdminAnnouncements /></ProtectedRoute>} />
            <Route path="/hr/performance" element={<ProtectedRoute requiredPermission={['performance', 'view']}><PerformanceReport /></ProtectedRoute>} />
            <Route path="/hr/reports" element={<ProtectedRoute requiredPermission={['reports', 'view']}><AdminReports /></ProtectedRoute>} />
            <Route path="/hr/profile" element={<Profile />} />
            <Route path="/hr/chat" element={<Chat />} />
          </Route>
        </Route>
      </Routes>

      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: '#ffffff',
          color: '#0f172a',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)'
        }
      }}/>
    </div>
  );
}

export default App;
