import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth, getRoleDashboard } from './context/AuthContext';
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
import MyLeaves from './pages/common/MyLeaves';
import StickyNotesPage from './pages/common/StickyNotes';
import TimeTracker from './pages/common/TimeTracker';
import SalaryProcess from './pages/common/SalaryProcess';
import UserManual from './pages/common/UserManual';

// Super Admin Pages
import SuperAdminDashboard from './pages/super-admin/dashboard';
import OfficesManager from './pages/super-admin/offices';
import PlansManager from './pages/super-admin/plans';
import SuperAdminCMS from './pages/super-admin/cms';
import AuditLogs from './pages/super-admin/audit-logs';
import SuperAdminTickets from './pages/super-admin/tickets';
import SuperAdminBilling from './pages/super-admin/billing';
import SupportTickets from './pages/common/SupportTickets';
import CompanySupport from './pages/common/CompanySupport';
import SoftwareSupport from './pages/common/SoftwareSupport';

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
import AdminAttendance from './pages/admin/attendance';
import SalaryManagement from './pages/admin/salary-management';
import PayrollSettings from './pages/admin/payroll-settings';
import AdminBilling from './pages/admin/billing';
import RolesPage from './pages/admin/roles';
import AdminTasks from './pages/admin/tasks';
import SprintsManager from './pages/admin/sprints';
import CRMOverview from './pages/admin/crm';
import LeadsManager from './pages/admin/crm/leads';
import DealsPipeline from './pages/admin/crm/deals';
import CustomersManager from './pages/admin/crm/customers';
import IntegrationsManager from './pages/admin/integrations';
import ClientPortal from './pages/client/ClientPortal';
import AdminClientPortal from './pages/admin/client-portal';
import AccountantBilling from './pages/accountant/billing';
import AdminLeaves from './pages/admin/leaves';
import OfferLettersPage from './pages/admin/offer-letters';
import MyDocuments from './pages/common/MyDocuments';
import AdminDocumentsManagement from './pages/admin/documents';
import AdminBackup from './pages/admin/backup';
import ReportsCenter from './pages/admin/reports-center';

import './App.css';

// Entry dispatcher for '/': if already authenticated, auto-redirect directly to their dashboard!
const RootRouteDispatcher = () => {
  const { user } = useAuth();
  if (user && user.token) {
    return <Navigate to={getRoleDashboard(user)} replace />;
  }
  return <Landing />;
};

// Entry dispatcher for '/login': if already authenticated, auto-redirect directly to their dashboard!
const LoginRouteDispatcher = () => {
  const { user } = useAuth();
  if (user && user.token) {
    return <Navigate to={getRoleDashboard(user)} replace />;
  }
  return <Login />;
};

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
    <div className="app-shell min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500/20 font-sans antialiased">
      <Routes>
        {/* Public & Entry Routes */}
        <Route path="/" element={<RootRouteDispatcher />} />
        <Route path="/login" element={<LoginRouteDispatcher />} />

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
            <Route path="/my-leaves" element={<MyLeaves />} />
            <Route path="/my-salary-slips" element={<MySalarySlips />} />
            <Route path="/my-documents" element={<MyDocuments />} />
            <Route path="/sticky-notes" element={<StickyNotesPage />} />
            <Route path="/time-tracker" element={<TimeTracker />} />
            <Route path="/admin/time-tracker" element={<TimeTracker />} />
            <Route path="/user-manual" element={<UserManual />} />
            <Route path="/user/manual" element={<UserManual />} />
            <Route path="/support-tickets" element={<SupportTickets />} />
            <Route path="/company-support" element={<CompanySupport />} />
            <Route path="/software-support" element={<SoftwareSupport />} />
            <Route path="/client/portal" element={<ClientPortal />} />
            <Route path="/client/projects" element={<ClientPortal />} />
            <Route path="/client/invoices" element={<ClientPortal />} />
            <Route path="/client/support" element={<ClientPortal />} />
          </Route>
        </Route>

        {/* Protected Super Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Super Admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/offices" element={<OfficesManager />} />
            <Route path="/super-admin/plans" element={<PlansManager />} />
            <Route path="/super-admin/billing" element={<SuperAdminBilling />} />
            <Route path="/super-admin/cms" element={<SuperAdminCMS />} />
            <Route path="/super-admin/audit-logs" element={<AuditLogs />} />
            <Route path="/super-admin/tickets" element={<SuperAdminTickets />} />
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
            <Route path="/admin/email-settings" element={<ProtectedRoute allowedRoles={['Admin', 'CTO']}><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/backup" element={<ProtectedRoute allowedRoles={['Admin', 'CTO', 'Super Admin']}><AdminBackup /></ProtectedRoute>} />
            <Route path="/admin/integrations" element={<ProtectedRoute requiredPermission={['settings', 'view']}><IntegrationsManager /></ProtectedRoute>} />
            <Route path="/admin/configurations" element={<ProtectedRoute requiredPermission={['settings', 'view']}><IntegrationsManager /></ProtectedRoute>} />
            <Route path="/admin/roles" element={<ProtectedRoute requiredPermission={['settings', 'view']}><RolesPage /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requiredPermission={['users', 'view']}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/projects" element={<ProtectedRoute requiredPermission={['projects', 'view']}><AdminProjects /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute requiredPermission={['projects', 'view']}><AdminProjects /></ProtectedRoute>} />
            <Route path="/user/projects" element={<ProtectedRoute requiredPermission={['projects', 'view']}><AdminProjects /></ProtectedRoute>} />
            <Route path="/team-lead/projects" element={<ProtectedRoute requiredPermission={['projects', 'view']}><AdminProjects /></ProtectedRoute>} />
            <Route path="/admin/client-portal" element={<ProtectedRoute requiredPermission={['projects', 'view']}><AdminClientPortal /></ProtectedRoute>} />
            <Route path="/admin/sprints" element={<ProtectedRoute requiredPermission={['projects', 'view']}><SprintsManager /></ProtectedRoute>} />
            <Route path="/admin/tasks" element={<ProtectedRoute requiredPermission={['tasks', 'view']}><AdminTasks /></ProtectedRoute>} />
            <Route path="/admin/crm" element={<ProtectedRoute requiredPermission={['crm', 'view']}><CRMOverview /></ProtectedRoute>} />
            <Route path="/admin/crm/leads" element={<ProtectedRoute requiredPermission={['crm', 'view']}><LeadsManager /></ProtectedRoute>} />
            <Route path="/admin/crm/deals" element={<ProtectedRoute requiredPermission={['crm', 'view']}><DealsPipeline /></ProtectedRoute>} />
            <Route path="/admin/crm/customers" element={<ProtectedRoute requiredPermission={['crm', 'view']}><CustomersManager /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute requiredPermission={['reports', 'view']}><AdminReports /></ProtectedRoute>} />
            <Route path="/admin/reports-center" element={<ProtectedRoute requiredPermission={['reports', 'view']}><ReportsCenter /></ProtectedRoute>} />
            <Route path="/reports-center" element={<ProtectedRoute requiredPermission={['reports', 'view']}><ReportsCenter /></ProtectedRoute>} />
            <Route path="/admin/performance" element={<ProtectedRoute requiredPermission={['performance', 'view']}><PerformanceReport /></ProtectedRoute>} />
            <Route path="/admin/announcements" element={<ProtectedRoute requiredPermission={['announcements', 'view']}><AdminAnnouncements /></ProtectedRoute>} />
            <Route path="/admin/attendance" element={<ProtectedRoute requiredPermission={['attendance', 'view']}><AdminAttendance /></ProtectedRoute>} />
            <Route path="/admin/attendance-settings" element={<ProtectedRoute requiredPermission={['attendance', 'view']}><AttendanceSettings /></ProtectedRoute>} />
            <Route path="/admin/leaves" element={<AdminLeaves />} />
            <Route path="/hr/leaves" element={<AdminLeaves />} />
            <Route path="/team-lead/leaves" element={<AdminLeaves />} />
            <Route path="/admin/offer-letters" element={<OfferLettersPage />} />
            <Route path="/admin/documents" element={<ProtectedRoute requiredPermission={['documents', 'view']}><AdminDocumentsManagement /></ProtectedRoute>} />
            <Route path="/hr/documents" element={<ProtectedRoute requiredPermission={['documents', 'view']}><AdminDocumentsManagement /></ProtectedRoute>} />
            <Route path="/admin/salary-management" element={<ProtectedRoute requiredPermission={['payroll', 'view']}><SalaryManagement /></ProtectedRoute>} />
            <Route path="/salary-process" element={<ProtectedRoute requiredPermission={['payroll', 'view']}><SalaryProcess /></ProtectedRoute>} />
            <Route path="/admin/salary-process" element={<ProtectedRoute requiredPermission={['payroll', 'view']}><SalaryProcess /></ProtectedRoute>} />
            <Route path="/accountant/salary-process" element={<ProtectedRoute requiredPermission={['payroll', 'view']}><SalaryProcess /></ProtectedRoute>} />
            <Route path="/admin/payroll-settings" element={<ProtectedRoute requiredPermission={['payroll', 'view']}><PayrollSettings /></ProtectedRoute>} />
            <Route path="/admin/payroll-dashboard" element={<ProtectedRoute requiredPermission={['payroll', 'view']}><PayrollSettings /></ProtectedRoute>} />
            <Route path="/accountant/billing" element={<AccountantBilling />} />
            <Route path="/accountant/dashboard" element={<AccountantBilling />} />
            <Route path="/admin/profile" element={<Profile />} />
            <Route path="/admin/chat" element={<Chat />} />

            {/* Legacy Role Route Aliases (Pointing to central unified modules) */}
            <Route path="/team-lead/dashboard" element={<TeamLeadDashboard />} />
            <Route path="/team-lead/users" element={<ProtectedRoute requiredPermission={['users', 'view']}><AdminUsers /></ProtectedRoute>} />
            <Route path="/team-lead/reports" element={<ProtectedRoute requiredPermission={['reports', 'view']}><AdminReports /></ProtectedRoute>} />
            <Route path="/team-lead/reports-center" element={<ProtectedRoute requiredPermission={['reports', 'view']}><ReportsCenter /></ProtectedRoute>} />
            <Route path="/team-lead/performance" element={<ProtectedRoute requiredPermission={['performance', 'view']}><PerformanceReport /></ProtectedRoute>} />
            <Route path="/team-lead/profile" element={<Profile />} />
            <Route path="/team-lead/chat" element={<Chat />} />

            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/tasks" element={<ProtectedRoute requiredPermission={['tasks', 'view']}><AdminTasks /></ProtectedRoute>} />
            <Route path="/user/reports" element={<ProtectedRoute requiredPermission={['reports', 'view']}><AdminReports /></ProtectedRoute>} />
            <Route path="/user/reports-center" element={<ProtectedRoute requiredPermission={['reports', 'view']}><ReportsCenter /></ProtectedRoute>} />
            <Route path="/user/profile" element={<Profile />} />
            <Route path="/user/chat" element={<Chat />} />

            <Route path="/hr/dashboard" element={<HRDashboard />} />
            <Route path="/hr/tasks" element={<ProtectedRoute requiredPermission={['tasks', 'view']}><AdminTasks /></ProtectedRoute>} />
            <Route path="/hr/announcements" element={<ProtectedRoute requiredPermission={['announcements', 'view']}><AdminAnnouncements /></ProtectedRoute>} />
            <Route path="/hr/performance" element={<ProtectedRoute requiredPermission={['performance', 'view']}><PerformanceReport /></ProtectedRoute>} />
            <Route path="/hr/reports" element={<ProtectedRoute requiredPermission={['reports', 'view']}><AdminReports /></ProtectedRoute>} />
            <Route path="/hr/reports-center" element={<ProtectedRoute requiredPermission={['reports', 'view']}><ReportsCenter /></ProtectedRoute>} />
            <Route path="/hr/profile" element={<Profile />} />
            <Route path="/hr/chat" element={<Chat />} />
          </Route>
        </Route>
      </Routes>

      <Toaster
        position="top-right"
        containerStyle={{
          top: 80,
          right: 16,
          left: 16,
        }}
        toastOptions={{
          duration: 3500,
          style: {
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 500,
            maxWidth: 'calc(100vw - 32px)',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
          },
          success: { iconTheme: { primary: '#4f46e5', secondary: '#ffffff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
        }}
      />
    </div>
  );
};

export default App;
