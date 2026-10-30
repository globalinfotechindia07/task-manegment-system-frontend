import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

  // 4. Super Admin only route but user isn't Super Admin
  if (allowedRoles && allowedRoles.includes('Super Admin')) {
    return <Navigate to="/" replace />;
  }

  // 5. Compute access
  let hasAccess = false;

  if (isOfficeAdmin) {
    hasAccess = true;
  } else if (requiredPermission) {
    const [moduleName, action = 'view'] = requiredPermission;
    hasAccess = Boolean(user.permissions?.[moduleName]?.[action]);
  } else if (allowedRoles) {
    hasAccess = allowedRoles.includes(user.role);
  } else {
    hasAccess = true;
  }

  if (!hasAccess) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;