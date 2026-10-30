import { useAuth } from '../../context/AuthContext';
import AdminDashboard from '../admin/dashboard';
import HRDashboard from '../hr/dashboard';
import TeamLeadDashboard from '../team-lead/dashboard';
import UserDashboard from '../user/dashboard';

const DashboardDispatcher = () => {
  const { user } = useAuth();
  const role = (user?.role || '').trim();
  const roleLower = role.toLowerCase();

  // 1. HR Manager / HR
  if (
    role === 'HR Manager' ||
    role === 'HR' ||
    roleLower === 'hr manager' ||
    roleLower === 'hr' ||
    roleLower.includes('human resource')
  ) {
    return <HRDashboard />;
  }

  // 2. Team Head / Team Lead
  if (
    role === 'Team Head' ||
    role === 'Team Lead' ||
    roleLower.includes('team head') ||
    roleLower.includes('team lead') ||
    roleLower.includes('project lead')
  ) {
    return <TeamLeadDashboard />;
  }

  // 3. User / Employee / Staff
  if (
    role === 'User' ||
    role === 'Employee' ||
    roleLower === 'user' ||
    roleLower === 'employee' ||
    roleLower.includes('staff')
  ) {
    return <UserDashboard />;
  }

  // 4. Admin / CTO
  if (role === 'Admin' || role === 'CTO' || roleLower === 'admin' || roleLower === 'cto') {
    return <AdminDashboard />;
  }

  // 5. Custom roles (e.g. Accountant, Finance, Operations)
  // If user has payroll view rights but not project rights → Admin overview
  if (user?.permissions?.payroll?.view && !user?.permissions?.projects?.view) {
    return <AdminDashboard />;
  }

  // 6. Fallback to standard User dashboard for any general staff
  return <UserDashboard />;
};

export default DashboardDispatcher;