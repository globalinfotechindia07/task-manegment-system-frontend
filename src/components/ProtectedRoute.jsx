import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Force password change check
    if (user.requiresPasswordChange && window.location.pathname !== '/force-password-change') {
      return <Navigate to="/force-password-change" replace />;
    }
    // Redirect to their respective dashboard if they don't have permission for this route
    const roleRoutes = {
      'Admin': '/admin/dashboard',
      'Team Head': '/team-lead/dashboard',
      'User': '/user/dashboard',
      'HR Manager': '/hr/dashboard',
    };
    return <Navigate to={roleRoutes[user.role] || '/'} replace />;
  }

  // Force password change check (for generic protected routes)
  if (user.requiresPasswordChange && window.location.pathname !== '/force-password-change') {
    return <Navigate to="/force-password-change" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
