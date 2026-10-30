import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles, requiredPermission, children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Force password change check
  if (user.requiresPasswordChange && window.location.pathname !== '/force-password-change') {
    return <Navigate to="/force-password-change" replace />;
  }

  // 1. Super Admin and Office Admin have full access to their respective portal routes
  const isOfficeAdmin = user.role === 'Admin' || user.role === 'CTO';
  const isSuperAdmin = user.role === 'Super Admin';

  if (isSuperAdmin) {
    if (allowedRoles && !allowedRoles.includes('Super Admin')) {
      return <Navigate to="/super-admin/dashboard" replace />;
    }
    return children ? children : <Outlet />;
  }

  // If this is a Super Admin only route and user is not Super Admin
  if (allowedRoles && allowedRoles.includes('Super Admin') && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  // 2. Check dynamic permission for staff
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
