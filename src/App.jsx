import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Landing from './pages/Landing';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import ForcePasswordChange from './pages/ForcePasswordChange';
import Profile from './pages/common/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/dashboard';
import AdminUsers from './pages/admin/users';
import AdminReports from './pages/admin/reports';
import AdminPerformance from './pages/admin/performance';
import AdminSettings from './pages/admin/settings';
import AdminAnnouncements from './pages/admin/announcements';
import AdminProjects from './pages/admin/projects';

// Other Role Dashboards
import TeamLeadDashboard from './pages/team-lead/dashboard';
import TeamLeadUsers from './pages/team-lead/users';
import TeamLeadReports from './pages/team-lead/reports';
import TeamLeadPerformance from './pages/team-lead/performance';
import UserDashboard from './pages/user/dashboard';
import UserTasks from './pages/user/tasks';
import UserReports from './pages/user/reports';
import HRDashboard from './pages/hr/dashboard';
import HRTasks from './pages/hr/tasks';
import HRAnnouncements from './pages/hr/announcements';
import HRPerformance from './pages/hr/performance';
import HRReports from './pages/hr/reports';

import './App.css';

function App() {
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

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/projects" element={<AdminProjects />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/performance" element={<AdminPerformance />} />
            <Route path="/admin/announcements" element={<AdminAnnouncements />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Protected Team Lead Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Team Head']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/team-lead/dashboard" element={<TeamLeadDashboard />} />
            <Route path="/team-lead/users" element={<TeamLeadUsers />} />
            <Route path="/team-lead/reports" element={<TeamLeadReports />} />
            <Route path="/team-lead/performance" element={<TeamLeadPerformance />} />
            <Route path="/team-lead/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Protected User Routes */}
        <Route element={<ProtectedRoute allowedRoles={['User']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/tasks" element={<UserTasks />} />
            <Route path="/user/reports" element={<UserReports />} />
            <Route path="/user/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Protected HR Manager Routes */}
        <Route element={<ProtectedRoute allowedRoles={['HR Manager']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/hr/dashboard" element={<HRDashboard />} />
            <Route path="/hr/tasks" element={<HRTasks />} />
            <Route path="/hr/announcements" element={<HRAnnouncements />} />
            <Route path="/hr/performance" element={<HRPerformance />} />
            <Route path="/hr/reports" element={<HRReports />} />
            <Route path="/hr/profile" element={<Profile />} />
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
