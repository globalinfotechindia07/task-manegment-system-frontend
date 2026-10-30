import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { API_BASE_URL } from '../config';
import {
  HiOutlineSquares2X2,
  HiOutlineBuildingOffice2,
  HiOutlineCreditCard,
  HiOutlineGlobeAlt,
  HiOutlineUser,
  HiOutlineUsers,
  HiOutlineFolder,
  HiOutlineClipboardDocumentList,
  HiOutlineClock,
  HiOutlineBanknotes,
  HiOutlineDocumentChartBar,
  HiOutlineDocumentText,
  HiOutlineChartBar,
  HiOutlineMegaphone,
  HiOutlineChatBubbleLeftRight,
  HiOutlineVideoCamera,
  HiOutlineFingerPrint,
  HiOutlineCalendarDays,
  HiOutlineDocumentCheck,
  HiOutlineShieldCheck,
  HiOutlineCog6Tooth,
  HiOutlineXMark,
  HiOutlineArrowRightOnRectangle
} from 'react-icons/hi2';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { unreadChatsCount, newTasksCount, meetingInvitesCount } = useSocket();

  const getNavSections = () => {
    if (!user) return [];

    // 1. Super Admin Navigation Grouping
    if (user.role === 'Super Admin') {
      return [
        {
          title: 'Platform Overview',
          items: [
            { name: 'Platform Dashboard', path: '/super-admin/dashboard', icon: HiOutlineSquares2X2 }
          ]
        },
        {
          title: 'Platform Control',
          items: [
            { name: 'Offices & Branches', path: '/super-admin/offices', icon: HiOutlineBuildingOffice2 },
            { name: 'Subscription Plans', path: '/super-admin/plans', icon: HiOutlineCreditCard },
            { name: 'Website CMS & Gateway', path: '/super-admin/cms', icon: HiOutlineGlobeAlt }
          ]
        },
        {
          title: 'Account',
          items: [
            { name: 'My Profile', path: '/super-admin/profile', icon: HiOutlineUser }
          ]
        }
      ];
    }

    // 2. Company Office Navigation (Admin, CTO, HR, Team Lead, Accountant, Employee)
    const isAdmin = user.role === 'Admin' || user.role === 'CTO';
    const perms = user.permissions || {};
    const r = (user.role || '').toLowerCase();

    // Determine role-based dynamic dashboard route
    let dashboardPath = '/admin/dashboard';
    if (!isAdmin) {
      if (r === 'hr manager' || r === 'hr' || r.includes('human resource')) {
        dashboardPath = '/hr/dashboard';
      } else if (r === 'team head' || r === 'team lead' || r.includes('lead')) {
        dashboardPath = '/team-lead/dashboard';
      } else if (r === 'user' || r === 'employee' || r.includes('staff')) {
        dashboardPath = '/user/dashboard';
      } else {
        dashboardPath = '/dashboard';
      }
    }

    const sections = [];

    // Section 1: Overview
    sections.push({
      title: 'Overview',
      items: [
        { name: 'Dashboard', path: dashboardPath, icon: HiOutlineSquares2X2 }
      ]
    });

    // Section 2: Work & Projects
    const workItems = [];
    if (isAdmin || perms.projects?.view) {
      workItems.push({ name: 'Projects', path: '/admin/projects', icon: HiOutlineFolder });
    }
    if (isAdmin || perms.tasks?.view) {
      workItems.push({ name: 'Daily Tasks', path: '/admin/tasks', icon: HiOutlineClipboardDocumentList });
    }
    if (isAdmin || perms.reports?.view) {
      workItems.push({ name: 'Task Reports', path: '/admin/reports', icon: HiOutlineDocumentText });
    }
    if (isAdmin || perms.performance?.view) {
      workItems.push({ name: 'Performance Analysis', path: '/admin/performance', icon: HiOutlineChartBar });
    }
    if (workItems.length > 0) {
      sections.push({ title: 'Work & Projects', items: workItems });
    }

    // Section 3: Team & HR
    const teamItems = [];
    if (isAdmin || perms.users?.view) {
      teamItems.push({ name: 'Users & Staff', path: '/admin/users', icon: HiOutlineUsers });
    }
    if (isAdmin || perms.attendance?.view || perms.attendance?.edit) {
      teamItems.push({ name: 'Attendance Policy', path: '/admin/attendance-settings', icon: HiOutlineClock });
    }
    if (isAdmin || perms.payroll?.view) {
      teamItems.push({ name: 'Salary Management', path: '/admin/salary-management', icon: HiOutlineBanknotes });
      teamItems.push({ name: 'Payroll Dashboard', path: '/admin/payroll-dashboard', icon: HiOutlineDocumentChartBar });
    }
    if (isAdmin || perms.announcements?.view) {
      teamItems.push({ name: 'Announcements', path: '/admin/announcements', icon: HiOutlineMegaphone });
    }
    if (teamItems.length > 0) {
      sections.push({ title: 'Team & HR', items: teamItems });
    }

    // Section 4: Communication
    const commItems = [];
    if (isAdmin || perms.chat?.view) {
      commItems.push({ name: 'Team Chat', path: '/admin/chat', icon: HiOutlineChatBubbleLeftRight });
      commItems.push({ name: 'Team Meeting', path: '/team-meeting', icon: HiOutlineVideoCamera });
    }
    if (commItems.length > 0) {
      sections.push({ title: 'Communication', items: commItems });
    }

    // Section 5: My Daily Tools (Universal employee & admin self-service tools)
    sections.push({
      title: 'My Daily Tools',
      items: [
        { name: 'Punch In / Out', path: '/punch-in', icon: HiOutlineFingerPrint },
        { name: 'My Attendance', path: '/my-attendance', icon: HiOutlineCalendarDays },
        { name: 'My Salary Slips', path: '/my-salary-slips', icon: HiOutlineDocumentCheck },
        { name: 'My Profile', path: '/admin/profile', icon: HiOutlineUser }
      ]
    });

    // Section 6: Administration (Admin, CTO, or privileged managers)
    const adminItems = [];
    if (isAdmin || perms.settings?.view) {
      adminItems.push({ name: 'Roles & Permissions', path: '/admin/roles', icon: HiOutlineShieldCheck });
    }
    if (isAdmin) {
      adminItems.push({ name: 'Billing & Invoices', path: '/admin/billing', icon: HiOutlineCreditCard });
    }
    if (isAdmin || perms.settings?.view) {
      adminItems.push({ name: 'Office Settings', path: '/admin/settings', icon: HiOutlineCog6Tooth });
    }
    if (adminItems.length > 0) {
      sections.push({ title: 'Administration', items: adminItems });
    }

    return sections;
  };

  const navSections = getNavSections();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800/90 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Workspace Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-900/60">
          <Link to="/" className="flex items-center gap-3 group min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center transform group-hover:scale-105 transition-all shadow-md shadow-indigo-500/20 flex-shrink-0">
              <HiOutlineBuildingOffice2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-white text-sm tracking-wide leading-tight group-hover:text-indigo-400 transition-colors truncate">
                {user?.company?.name || 'Enterprise'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider truncate">
                {user?.company?.companyCode || 'CORP-ID'}
              </span>
            </div>
          </Link>

          {/* Mobile close button */}
          <button 
            type="button"
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
            title="Close sidebar"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Categorized Navigation List */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent hover:scrollbar-thumb-slate-700">
          {navSections.map((section, sIdx) => (
            <div key={section.title || sIdx} className="space-y-1">
              {/* Section Header */}
              {section.title && (
                <div className="px-2.5 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {section.title}
                </div>
              )}

              {/* Section Items */}
              <div className="space-y-0.5">
                {section.items.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path || 
                    (link.path !== '/' && 
                     link.path !== '/dashboard' && 
                     link.path !== '/admin/dashboard' && 
                     link.path !== '/hr/dashboard' && 
                     link.path !== '/team-lead/dashboard' && 
                     link.path !== '/user/dashboard' && 
                     link.path !== '/super-admin/dashboard' && 
                     location.pathname.startsWith(link.path + '/'));

                  // Dynamic badge calculation
                  let badge = null;
                  if (link.path.includes('/chat') && unreadChatsCount > 0) {
                    badge = unreadChatsCount;
                  } else if (link.path.includes('/tasks') && newTasksCount > 0) {
                    badge = newTasksCount;
                  } else if (link.path.includes('/team-meeting') && meetingInvitesCount > 0) {
                    badge = meetingInvitesCount;
                  }

                  return (
                    <Link
                      key={link.path + link.name}
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/25 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                        <span className="truncate">{link.name}</span>
                      </div>

                      {badge !== null && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 leading-none ${
                          isActive 
                            ? 'bg-white text-indigo-700 shadow-sm' 
                            : 'bg-rose-500 text-white animate-pulse'
                        }`}>
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Profile Card & Quick Actions Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/70">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800/80 hover:border-slate-700 transition-colors">
            <Link 
              to="/admin/profile" 
              onClick={() => setIsOpen(false)} 
              className="flex items-center gap-2.5 min-w-0 group flex-1"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 overflow-hidden shadow-inner ring-1 ring-white/10">
                {user?.profilePicture ? (
                  <img 
                    src={`${API_BASE_URL.replace('/api', '')}${user.profilePicture}`} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                  {user?.name || 'User'}
                </span>
                <span className="text-[10px] text-indigo-400 font-medium truncate">
                  {user?.role || 'Staff'}
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors ml-1"
            >
              <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
