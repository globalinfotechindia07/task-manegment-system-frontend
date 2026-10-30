import React, { useState, useEffect } from 'react';
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
  HiOutlineArrowRightOnRectangle,
  HiChevronDown
} from 'react-icons/hi2';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { unreadChatsCount, newTasksCount, meetingInvitesCount } = useSocket();

  // State to track which menus are expanded/collapsed
  const [openMenus, setOpenMenus] = useState({});

  const isRouteActive = (path) => {
    if (!path) return false;
    if (location.pathname === path) return true;
    const nonPrefixRoots = [
      '/',
      '/dashboard',
      '/admin/dashboard',
      '/hr/dashboard',
      '/team-lead/dashboard',
      '/user/dashboard',
      '/super-admin/dashboard'
    ];
    if (!nonPrefixRoots.includes(path) && location.pathname.startsWith(path + '/')) {
      return true;
    }
    return false;
  };

  const getNavStructure = () => {
    if (!user) return [];

    // 1. Super Admin Navigation
    if (user.role === 'Super Admin') {
      return [
        {
          id: 'super-admin-dashboard',
          name: 'Dashboard',
          path: '/super-admin/dashboard',
          icon: HiOutlineSquares2X2,
          isDirect: true
        },
        {
          id: 'platform-control',
          name: 'Platform Control',
          icon: HiOutlineBuildingOffice2,
          children: [
            { name: 'Offices & Branches', path: '/super-admin/offices', icon: HiOutlineBuildingOffice2 },
            { name: 'Subscription Plans', path: '/super-admin/plans', icon: HiOutlineCreditCard },
            { name: 'Website CMS & Gateway', path: '/super-admin/cms', icon: HiOutlineGlobeAlt },
          ]
        },
        {
          id: 'super-admin-account',
          name: 'Account Settings',
          icon: HiOutlineUser,
          children: [
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

    const structure = [];

    // Direct Dashboard Menu Item
    structure.push({
      id: 'dashboard',
      name: 'Dashboard',
      path: dashboardPath,
      icon: HiOutlineSquares2X2,
      isDirect: true
    });

    // Work & Projects Menu
    const workChildren = [];
    if (isAdmin || perms.projects?.view) {
      workChildren.push({ name: 'Projects', path: '/admin/projects', icon: HiOutlineFolder });
    }
    if (isAdmin || perms.tasks?.view) {
      workChildren.push({
        name: 'Daily Tasks',
        path: '/admin/tasks',
        icon: HiOutlineClipboardDocumentList,
        badge: newTasksCount > 0 ? newTasksCount : null
      });
    }
    if (isAdmin || perms.reports?.view) {
      workChildren.push({ name: 'Task Reports', path: '/admin/reports', icon: HiOutlineDocumentText });
    }
    if (isAdmin || perms.performance?.view) {
      workChildren.push({ name: 'Performance Analysis', path: '/admin/performance', icon: HiOutlineChartBar });
    }
    if (workChildren.length > 0) {
      structure.push({
        id: 'work-projects',
        name: 'Work & Projects',
        icon: HiOutlineFolder,
        children: workChildren
      });
    }

    // Human Resources & Team Menu
    const teamChildren = [];
    if (isAdmin || perms.users?.view) {
      teamChildren.push({ name: 'Users & Staff', path: '/admin/users', icon: HiOutlineUsers });
    }
    if (isAdmin || perms.attendance?.view || perms.attendance?.edit) {
      teamChildren.push({ name: 'Attendance Policy', path: '/admin/attendance-settings', icon: HiOutlineClock });
    }
    if (isAdmin || perms.announcements?.view) {
      teamChildren.push({ name: 'Announcements', path: '/admin/announcements', icon: HiOutlineMegaphone });
    }
    if (teamChildren.length > 0) {
      structure.push({
        id: 'team-hr',
        name: 'Human Resources',
        icon: HiOutlineUsers,
        children: teamChildren
      });
    }

    // Payroll & Finance Menu
    const payrollChildren = [];
    if (isAdmin || perms.payroll?.view) {
      payrollChildren.push({ name: 'Salary Management', path: '/admin/salary-management', icon: HiOutlineBanknotes });
      payrollChildren.push({ name: 'Payroll Dashboard', path: '/admin/payroll-dashboard', icon: HiOutlineDocumentChartBar });
    }
    if (payrollChildren.length > 0) {
      structure.push({
        id: 'payroll-finance',
        name: 'Payroll & Finance',
        icon: HiOutlineBanknotes,
        children: payrollChildren
      });
    }

    // Collaboration & Communication Menu
    const commChildren = [];
    if (isAdmin || perms.chat?.view) {
      commChildren.push({
        name: 'Team Chat',
        path: '/admin/chat',
        icon: HiOutlineChatBubbleLeftRight,
        badge: unreadChatsCount > 0 ? unreadChatsCount : null
      });
      commChildren.push({
        name: 'Team Meeting',
        path: '/team-meeting',
        icon: HiOutlineVideoCamera,
        badge: meetingInvitesCount > 0 ? meetingInvitesCount : null
      });
    }
    if (commChildren.length > 0) {
      structure.push({
        id: 'communication',
        name: 'Collaboration',
        icon: HiOutlineChatBubbleLeftRight,
        children: commChildren
      });
    }

    // My Self-Service / Daily Tools Menu
    structure.push({
      id: 'self-service',
      name: 'My Self-Service',
      icon: HiOutlineFingerPrint,
      children: [
        { name: 'Punch In / Out', path: '/punch-in', icon: HiOutlineFingerPrint },
        { name: 'My Attendance', path: '/my-attendance', icon: HiOutlineCalendarDays },
        { name: 'My Salary Slips', path: '/my-salary-slips', icon: HiOutlineDocumentCheck },
        { name: 'My Profile', path: '/admin/profile', icon: HiOutlineUser }
      ]
    });

    // System Administration Menu (Admin, CTO, or privileged managers)
    const adminChildren = [];
    if (isAdmin || perms.settings?.view) {
      adminChildren.push({ name: 'Roles & Permissions', path: '/admin/roles', icon: HiOutlineShieldCheck });
    }
    if (isAdmin) {
      adminChildren.push({ name: 'Billing & Invoices', path: '/admin/billing', icon: HiOutlineCreditCard });
    }
    if (isAdmin || perms.settings?.view) {
      adminChildren.push({ name: 'Office Settings', path: '/admin/settings', icon: HiOutlineCog6Tooth });
    }
    if (adminChildren.length > 0) {
      structure.push({
        id: 'administration',
        name: 'System Admin',
        icon: HiOutlineCog6Tooth,
        children: adminChildren
      });
    }

    return structure;
  };

  const navItems = getNavStructure();

  // Auto-expand menu if current path is a sub-item
  useEffect(() => {
    navItems.forEach((menu) => {
      if (menu.children && menu.children.some((child) => isRouteActive(child.path))) {
        setOpenMenus((prev) => ({
          ...prev,
          [menu.id]: true
        }));
      }
    });
  }, [location.pathname]);

  const toggleMenu = (menuId) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out flex flex-col shadow-xs lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Workspace Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 bg-white">
          <Link to="/" className="flex items-center gap-3 group min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center transform group-hover:scale-105 transition-all shadow-xs flex-shrink-0">
              <HiOutlineBuildingOffice2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-slate-900 text-sm tracking-tight leading-tight group-hover:text-indigo-600 transition-colors truncate">
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
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors ml-1 cursor-pointer"
            title="Close sidebar"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Area with Menus and Submenus */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {navItems.map((menu) => {
            const Icon = menu.icon;

            // Case 1: Direct link (e.g. Dashboard)
            if (menu.isDirect) {
              const isActive = isRouteActive(menu.path);
              return (
                <Link
                  key={menu.id}
                  to={menu.path}
                  onClick={() => setIsOpen(false)}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs border border-indigo-100'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`} />
                    <span className="truncate">{menu.name}</span>
                  </div>
                </Link>
              );
            }

            // Case 2: Menu with Submenu (Accordion / Expandable)
            const isMenuOpen = !!openMenus[menu.id];
            const hasActiveChild = menu.children?.some((child) => isRouteActive(child.path));
            const totalBadges = menu.children?.reduce((acc, child) => acc + (child.badge || 0), 0) || 0;

            return (
              <div key={menu.id} className="space-y-0.5">
                {/* Parent Menu Header / Toggle */}
                <button
                  type="button"
                  onClick={() => toggleMenu(menu.id)}
                  className={`w-full group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                    hasActiveChild
                      ? 'bg-slate-50 text-slate-900 font-semibold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      hasActiveChild ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`} />
                    <span className="truncate">{menu.name}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Badge indicator when menu is closed */}
                    {!isMenuOpen && totalBadges > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white leading-none">
                        {totalBadges}
                      </span>
                    )}

                    {/* Expand/Collapse Chevron Indicator */}
                    <HiChevronDown 
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isMenuOpen ? 'transform rotate-180 text-slate-700' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                  </div>
                </button>

                {/* Submenu List (Hidden by default, open when toggled) */}
                <div
                  className={`overflow-hidden transition-all duration-200 ease-in-out ${
                    isMenuOpen 
                      ? 'max-h-96 opacity-100 mt-0.5 mb-1' 
                      : 'max-h-0 opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="ml-4 pl-3 border-l-2 border-slate-200 space-y-0.5 py-0.5">
                    {menu.children?.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = isRouteActive(subItem.path);

                      return (
                        <Link
                          key={subItem.path + subItem.name}
                          to={subItem.path}
                          onClick={() => setIsOpen(false)}
                          className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                            isSubActive
                              ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs border border-indigo-100'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <SubIcon className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                              isSubActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                            }`} />
                            <span className="truncate">{subItem.name}</span>
                          </div>

                          {subItem.badge && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 leading-none ${
                              isSubActive ? 'bg-indigo-600 text-white' : 'bg-rose-500 text-white'
                            }`}>
                              {subItem.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* User Profile Card & Quick Actions Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/60">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
            <Link 
              to="/admin/profile" 
              onClick={() => setIsOpen(false)} 
              className="flex items-center gap-2.5 min-w-0 group flex-1"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 overflow-hidden shadow-xs">
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
                <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-900 truncate">
                  {user?.name || 'User'}
                </span>
                <span className="text-[10px] text-indigo-600 font-medium truncate">
                  {user?.roleRef?.displayName || user?.role || 'Staff'}
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1 cursor-pointer"
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
