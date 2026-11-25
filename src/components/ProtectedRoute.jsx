import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROUTE_SUBMENU_MAP = [
  { prefix: '/admin/projects', id: 'work_projects' },
  { prefix: '/projects', id: 'work_projects' },
  { prefix: '/user/projects', id: 'work_projects' },
  { prefix: '/admin/client-portal', id: 'work_client_portal' },
  { prefix: '/admin/sprints', id: 'work_sprints' },
  { prefix: '/admin/tasks', id: 'work_tasks' },
  { prefix: '/user/tasks', id: 'work_tasks' },
  { prefix: '/admin/reports-center', id: 'work_reports_center' },
  { prefix: '/reports-center', id: 'work_reports_center' },
  { prefix: '/user/reports-center', id: 'work_reports_center' },
  { prefix: '/admin/reports', id: 'work_task_reports' },
  { prefix: '/user/reports', id: 'work_task_reports' },
  { prefix: '/admin/performance', id: 'work_performance' },
  { prefix: '/time-tracker', id: 'work_time_tracker' },
  { prefix: '/admin/crm/leads', id: 'crm_leads' },
  { prefix: '/admin/crm/deals', id: 'crm_deals' },
  { prefix: '/admin/crm/customers', id: 'crm_customers' },
  { prefix: '/admin/crm', id: 'crm_overview' },
  { prefix: '/admin/users', id: 'hr_users' },
  { prefix: '/admin/offer-letters', id: 'hr_offer_letters' },
  { prefix: '/admin/documents', id: 'hr_documents' },
  { prefix: '/admin/attendance-settings', id: 'hr_attendance_settings' },
  { prefix: '/admin/attendance', id: 'hr_attendance' },
  { prefix: '/admin/leaves', id: 'hr_leaves' },
  { prefix: '/admin/announcements', id: 'hr_announcements' },
  { prefix: '/salary-process', id: 'payroll_salary_process' },
  { prefix: '/accountant/billing', id: 'payroll_billing' },
  { prefix: '/admin/salary-management', id: 'payroll_salary_management' },
  { prefix: '/admin/payroll-settings', id: 'payroll_settings' },
  { prefix: '/admin/chat', id: 'collab_chat' },
  { prefix: '/team-meeting', id: 'collab_meeting' },
  { prefix: '/punch-in', id: 'self_punch' },
  { prefix: '/my-attendance', id: 'self_attendance' },
  { prefix: '/my-leaves', id: 'self_leaves' },
  { prefix: '/my-salary-slips', id: 'self_salary_slips' },
  { prefix: '/my-documents', id: 'self_documents' },
  { prefix: '/sticky-notes', id: 'self_sticky_notes' },
  { prefix: '/user-manual', id: 'self_user_manual' },
  { prefix: '/admin/roles', id: 'admin_roles' },
  { prefix: '/admin/billing', id: 'admin_billing' },
  { prefix: '/admin/backup', id: 'admin_backup' },
  { prefix: '/admin/integrations', id: 'config_website_feeds' },
  { prefix: '/company-support', id: 'support_company' },
  { prefix: '/software-support', id: 'support_software' },
  { prefix: '/support-tickets', id: 'support_system' },
];

const ProtectedRoute = ({ allowedRoles, requiredPermission, children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // 1. Not authenticated → login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Force password change (skip if already on that page)
  if (user.requiresPasswordChange && location.pathname !== '/force-password-change') {
    return <Navigate to="/force-password-change" replace />;
  }

  const isSuperAdmin = user.role === 'Super Admin';
  const isOfficeAdmin = user.role === 'Admin' || user.role === 'CTO';

  // 3. Super Admin — full access to their portal routes
  if (isSuperAdmin) {
    if (allowedRoles && !allowedRoles.includes('Super Admin')) {
      return <Navigate to="/super-admin/dashboard" replace />;
    }
    return children ? children : <Outlet />;
  }

  // 4. Super Admin only route (Super Admin is allowed, but current user is not permitted)
  if (
    allowedRoles &&
    allowedRoles.includes('Super Admin') &&
    !allowedRoles.some(
      (role) =>
        role !== 'Super Admin' &&
        (role === user.role || (isOfficeAdmin && (role === 'Admin' || role === 'CTO')))
    )
  ) {
    return <Navigate to="/" replace />;
  }

  // 4.1 Strict Client Isolation: Clients can only access client portal routes and personal profile
  if (user.role === 'Client' || (user.role || '').toLowerCase() === 'client') {
    const isAllowedForClient =
      location.pathname.startsWith('/client') ||
      location.pathname === '/admin/profile' ||
      location.pathname === '/force-password-change';
    if (!isAllowedForClient) {
      return <Navigate to="/client/portal" replace />;
    }
    return children ? children : <Outlet />;
  }

  // 5. Compute access
  let hasAccess = false;

  if (isOfficeAdmin) {
    hasAccess = true;
  } else {
    // 5.1 Check granular sub-menu permission first
    const matchedSubmenu = ROUTE_SUBMENU_MAP.find((m) =>
      location.pathname === m.prefix || location.pathname.startsWith(m.prefix + '/')
    );

    if (matchedSubmenu && user.permissions?.submenus) {
      if (typeof user.permissions.submenus[matchedSubmenu.id] !== 'undefined') {
        hasAccess = Boolean(user.permissions.submenus[matchedSubmenu.id]);
      } else if (requiredPermission) {
        const [moduleName, action = 'view'] = requiredPermission;
        hasAccess = Boolean(user.permissions?.[moduleName]?.[action]);
      } else if (allowedRoles) {
        hasAccess = allowedRoles.includes(user.role);
      } else {
        hasAccess = true;
      }
    } else if (requiredPermission) {
      const [moduleName, action = 'view'] = requiredPermission;
      hasAccess = Boolean(user.permissions?.[moduleName]?.[action]);
    } else if (allowedRoles) {
      hasAccess = allowedRoles.includes(user.role);
    } else {
      hasAccess = true;
    }
  }

  if (!hasAccess) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;