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
  HiOutlineCommandLine,
  HiOutlineLifebuoy,
  HiOutlineBriefcase,
  HiOutlineUserGroup,
  HiOutlineChartBarSquare,
  HiOutlineBuildingStorefront,
  HiOutlineRocketLaunch,
  HiOutlineXMark,
  HiOutlineArrowRightOnRectangle,
  HiChevronDown,
  HiOutlineEnvelope,
  HiOutlineComputerDesktop,
  HiOutlineBookmark,
  HiOutlineFolderArrowDown,
  HiOutlineDocumentArrowDown,
  HiOutlineServer,
  HiOutlineMagnifyingGlass,
  HiOutlineBookOpen,
} from 'react-icons/hi2';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { unreadChatsCount, newTasksCount, meetingInvitesCount } = useSocket();

  const [openMenus, setOpenMenus] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = React.useRef(null);

  // Keyboard shortcut: Ctrl+K / Cmd+K to focus search, Esc to clear
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

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
      '/super-admin/dashboard',
      '/client/portal',
      '/accountant/billing',
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
          isDirect: true,
        },
        {
          id: 'platform-control',
          name: 'Platform Control',
          icon: HiOutlineBuildingOffice2,
          children: [
            { name: 'Offices & Branches', path: '/super-admin/offices', icon: HiOutlineBuildingOffice2 },
            { name: 'Subscription Plans', path: '/super-admin/plans', icon: HiOutlineCreditCard },
            { name: 'Billing & Invoices', path: '/super-admin/billing', icon: HiOutlineBanknotes },
            { name: 'Website CMS & Gateway', path: '/super-admin/cms', icon: HiOutlineGlobeAlt },
            { name: 'Audit Logs', path: '/super-admin/audit-logs', icon: HiOutlineCommandLine },
            { name: 'Support Tickets', path: '/super-admin/tickets', icon: HiOutlineLifebuoy },
            { name: 'Employee Documents Hub', path: '/admin/documents', icon: HiOutlineFolderArrowDown },
            { name: 'Company Time Logs', path: '/time-tracker', icon: HiOutlineClock },
            { name: 'Salary Process & Status', path: '/salary-process', icon: HiOutlineBanknotes },
            { name: 'Reports & Export Hub', path: '/admin/reports-center', icon: HiOutlineDocumentArrowDown },
            { name: 'Company Backup & Restore', path: '/admin/backup', icon: HiOutlineServer },
          ],
        },
        {
          id: 'super-admin-account',
          name: 'Account Settings',
          icon: HiOutlineUser,
          children: [{ name: 'My Profile', path: '/super-admin/profile', icon: HiOutlineUser }],
        },
      ];
    }

    // 2. Client Portal Navigation (Dedicated strictly for Clients)
    if (user.role === 'Client' || (user.role || '').toLowerCase() === 'client') {
      return [
        {
          id: 'client-dashboard',
          name: 'Portal Overview',
          path: '/client/portal',
          icon: HiOutlineSquares2X2,
          isDirect: true,
        },
        {
          id: 'client-projects',
          name: 'Projects & Progress',
          path: '/client/projects',
          icon: HiOutlineFolder,
          isDirect: true,
        },
        {
          id: 'client-invoices',
          name: 'Billings & Invoices',
          path: '/client/invoices',
          icon: HiOutlineBanknotes,
          isDirect: true,
        },
        {
          id: 'client-support',
          name: 'Project Queries',
          path: '/client/support',
          icon: HiOutlineChatBubbleLeftRight,
          isDirect: true,
        },
        {
          id: 'client-profile',
          name: 'My Profile',
          path: '/admin/profile',
          icon: HiOutlineUser,
          isDirect: true,
        },
      ];
    }

    // 3. Accountant / Finance Navigation (Dedicated for Accountant role)
    const r = (user.role || '').toLowerCase();
    if (user.role === 'Accountant' || r.includes('accountant') || r.includes('finance')) {
      return [
        {
          id: 'accountant-billing-dashboard',
          name: 'Client Billing Overview',
          path: '/accountant/billing?tab=dashboard',
          icon: HiOutlineSquares2X2,
          isDirect: true,
        },
        {
          id: 'accountant-invoices',
          name: 'Client Invoices',
          path: '/accountant/billing?tab=invoices',
          icon: HiOutlineDocumentText,
          isDirect: true,
        },
        {
          id: 'accountant-payments',
          name: 'Receipts & Vouchers',
          path: '/accountant/billing?tab=payments',
          icon: HiOutlineBanknotes,
          isDirect: true,
        },
        {
          id: 'accountant-ledger',
          name: 'Customer Ledgers',
          path: '/accountant/billing?tab=ledger',
          icon: HiOutlineClipboardDocumentList,
          isDirect: true,
        },
        {
          id: 'accountant-gst',
          name: 'GST & Tax Reports',
          path: '/accountant/billing?tab=gst',
          icon: HiOutlineDocumentChartBar,
          isDirect: true,
        },
        {
          id: 'accountant-salary-process',
          name: 'Salary Process & Status',
          path: '/salary-process',
          icon: HiOutlineBanknotes,
          isDirect: true,
        },
        {
          id: 'accountant-reports-center',
          name: 'Reports & Export Hub',
          path: '/admin/reports-center',
          icon: HiOutlineDocumentArrowDown,
          isDirect: true,
        },
        {
          id: 'accountant-payroll',
          name: 'Payroll Settings',
          path: '/admin/payroll-settings',
          icon: HiOutlineCreditCard,
          isDirect: true,
        },
        {
          id: 'accountant-salary-management',
          name: 'Salary Management',
          path: '/admin/salary-management',
          icon: HiOutlineBanknotes,
          isDirect: true,
        },
        {
          id: 'accountant-documents',
          name: 'Document Management',
          path: '/admin/documents',
          icon: HiOutlineFolderArrowDown,
          isDirect: true,
        },
        {
          id: 'accountant-my-documents',
          name: 'My Documents & KYC',
          path: '/my-documents',
          icon: HiOutlineDocumentCheck,
          isDirect: true,
        },
        {
          id: 'accountant-sticky-notes',
          name: 'Sticky Notes & Reminders',
          path: '/sticky-notes',
          icon: HiOutlineBookmark,
          isDirect: true,
        },
        {
          id: 'accountant-time-tracker',
          name: 'Work Timer & Tracker',
          path: '/time-tracker',
          icon: HiOutlineClock,
          isDirect: true,
        },
        {
          id: 'accountant-profile',
          name: 'My Profile',
          path: '/admin/profile',
          icon: HiOutlineUser,
          isDirect: true,
        },
        {
          id: 'accountant-user-manual',
          name: 'User Manual & Guide',
          path: '/user-manual',
          icon: HiOutlineBookOpen,
          isDirect: true,
        },
      ];
    }

    // 4. Company Office Navigation
    const isAdmin = user.role === 'Admin' || user.role === 'CTO';
    const perms = user.permissions || {};

    const hasSubmenuAccess = (submenuId, fallbackCondition = true) => {
      if (isAdmin) return true;
      if (perms?.submenus && typeof perms.submenus[submenuId] !== 'undefined') {
        return Boolean(perms.submenus[submenuId]);
      }
      return Boolean(fallbackCondition);
    };

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

    structure.push({
      id: 'dashboard',
      name: 'Dashboard',
      path: dashboardPath,
      icon: HiOutlineSquares2X2,
      isDirect: true,
    });

    // Work & Projects
    const workChildren = [];
    if (hasSubmenuAccess('work_projects', isAdmin || perms.projects?.view || r === 'user' || r === 'employee' || r === 'team head' || r.includes('lead'))) {
      workChildren.push({ name: 'Projects', path: '/admin/projects', icon: HiOutlineFolder });
    }
    if (hasSubmenuAccess('work_client_portal', isAdmin || perms.projects?.edit || perms.projects?.create)) {
      workChildren.push({ name: 'Client Portal & Billings', path: '/admin/client-portal', icon: HiOutlineBanknotes });
    }
    if (hasSubmenuAccess('work_sprints', isAdmin || perms.sprints?.view || perms.projects?.view || perms.tasks?.view)) {
      workChildren.push({ name: 'Sprints & Timeline', path: '/admin/sprints', icon: HiOutlineRocketLaunch });
    }
    if (hasSubmenuAccess('work_tasks', isAdmin || perms.tasks?.view)) {
      workChildren.push({
        name: 'Daily Tasks',
        path: '/admin/tasks',
        icon: HiOutlineClipboardDocumentList,
        badge: newTasksCount > 0 ? newTasksCount : null,
      });
    }
    if (hasSubmenuAccess('work_task_reports', isAdmin || perms.reports?.view)) {
      workChildren.push({ name: 'Task Reports', path: '/admin/reports', icon: HiOutlineDocumentText });
    }
    if (hasSubmenuAccess('work_reports_center', isAdmin || perms.reports?.view)) {
      workChildren.push({ name: 'Reports & Export Hub', path: '/admin/reports-center', icon: HiOutlineDocumentArrowDown });
    }
    if (hasSubmenuAccess('work_time_tracker', true)) {
      workChildren.push({
        name: 'Time Tracker & Logs',
        path: '/time-tracker',
        icon: HiOutlineClock,
      });
    }
    if (hasSubmenuAccess('work_performance', isAdmin || perms.performance?.view)) {
      workChildren.push({ name: 'Performance Analysis', path: '/admin/performance', icon: HiOutlineChartBar });
    }
    if (workChildren.length > 0) {
      structure.push({
        id: 'work-projects',
        name: 'Work & Projects',
        icon: HiOutlineFolder,
        children: workChildren,
      });
    }

    // CRM & Sales
    const crmChildren = [];
    if (hasSubmenuAccess('crm_overview', isAdmin || perms.crm?.view)) {
      crmChildren.push({ name: 'CRM Overview', path: '/admin/crm', icon: HiOutlineChartBarSquare });
    }
    if (hasSubmenuAccess('crm_leads', isAdmin || perms.crm?.view)) {
      crmChildren.push({ name: 'Leads & Inquiries', path: '/admin/crm/leads', icon: HiOutlineUserGroup });
    }
    if (hasSubmenuAccess('crm_deals', isAdmin || perms.crm?.view)) {
      crmChildren.push({ name: 'Deals & Pipeline', path: '/admin/crm/deals', icon: HiOutlineBriefcase });
    }
    if (hasSubmenuAccess('crm_customers', isAdmin || perms.crm?.view)) {
      crmChildren.push({ name: 'Customer Accounts', path: '/admin/crm/customers', icon: HiOutlineBuildingStorefront });
    }
    if (crmChildren.length > 0) {
      structure.push({
        id: 'crm-sales',
        name: 'CRM & Sales',
        icon: HiOutlineBriefcase,
        children: crmChildren,
      });
    }

    // Human Resources
    const teamChildren = [];
    if (hasSubmenuAccess('hr_users', isAdmin || perms.users?.view)) {
      teamChildren.push({ name: 'Users & Staff', path: '/admin/users', icon: HiOutlineUsers });
    }
    if (hasSubmenuAccess('hr_offer_letters', isAdmin || perms.users?.view || perms.payroll?.view)) {
      teamChildren.push({ name: 'Offer Letters', path: '/admin/offer-letters', icon: HiOutlineDocumentText });
    }
    if (hasSubmenuAccess('hr_documents', isAdmin || perms.documents?.view || perms.users?.view)) {
      teamChildren.push({ name: 'Document Management', path: '/admin/documents', icon: HiOutlineFolderArrowDown });
    }
    if (hasSubmenuAccess('hr_attendance', isAdmin || perms.attendance?.view || perms.attendance?.edit)) {
      teamChildren.push({ name: 'Daily Attendance & Edit', path: '/admin/attendance', icon: HiOutlineCalendarDays });
    }
    if (hasSubmenuAccess('hr_attendance_settings', isAdmin || perms.attendance?.view || perms.attendance?.edit)) {
      teamChildren.push({ name: 'Attendance Policy', path: '/admin/attendance-settings', icon: HiOutlineClock });
    }
    if (hasSubmenuAccess('hr_leaves', isAdmin || perms.attendance?.view || perms.users?.view || perms.leaves?.view)) {
      teamChildren.push({ name: 'Leaves & Holidays', path: '/admin/leaves', icon: HiOutlineCalendarDays });
    }
    if (hasSubmenuAccess('hr_announcements', isAdmin || perms.announcements?.view)) {
      teamChildren.push({ name: 'Announcements', path: '/admin/announcements', icon: HiOutlineMegaphone });
    }
    if (teamChildren.length > 0) {
      structure.push({
        id: 'team-hr',
        name: 'Human Resources',
        icon: HiOutlineUsers,
        children: teamChildren,
      });
    }

    // Payroll & Finance
    const payrollChildren = [];
    if (hasSubmenuAccess('payroll_salary_process', isAdmin || perms.payroll?.view)) {
      payrollChildren.push({ name: 'Salary Process & Status', path: '/salary-process', icon: HiOutlineBanknotes });
    }
    if (hasSubmenuAccess('payroll_billing', isAdmin || perms.payroll?.view)) {
      payrollChildren.push({ name: 'Client Invoicing & Billing', path: '/accountant/billing', icon: HiOutlineBanknotes });
    }
    if (hasSubmenuAccess('payroll_salary_management', isAdmin || perms.payroll?.view)) {
      payrollChildren.push({ name: 'Salary Management', path: '/admin/salary-management', icon: HiOutlineBanknotes });
    }
    if (hasSubmenuAccess('payroll_settings', isAdmin || perms.payroll?.view)) {
      payrollChildren.push({ name: 'Payroll Settings', path: '/admin/payroll-settings', icon: HiOutlineCog6Tooth });
    }
    if (payrollChildren.length > 0) {
      structure.push({
        id: 'payroll-finance',
        name: 'Payroll & Finance',
        icon: HiOutlineBanknotes,
        children: payrollChildren,
      });
    }

    // Collaboration
    const commChildren = [];
    if (hasSubmenuAccess('collab_chat', isAdmin || perms.chat?.view)) {
      commChildren.push({
        name: 'Team Chat',
        path: '/admin/chat',
        icon: HiOutlineChatBubbleLeftRight,
        badge: unreadChatsCount > 0 ? unreadChatsCount : null,
      });
    }
    if (hasSubmenuAccess('collab_meeting', isAdmin || perms.chat?.view)) {
      commChildren.push({
        name: 'Team Meeting',
        path: '/team-meeting',
        icon: HiOutlineVideoCamera,
        badge: meetingInvitesCount > 0 ? meetingInvitesCount : null,
      });
    }
    if (commChildren.length > 0) {
      structure.push({
        id: 'communication',
        name: 'Collaboration',
        icon: HiOutlineChatBubbleLeftRight,
        children: commChildren,
      });
    }

    // Self Service
    const selfChildren = [];
    if (hasSubmenuAccess('self_punch', true)) {
      selfChildren.push({ name: 'Punch In / Out', path: '/punch-in', icon: HiOutlineFingerPrint });
    }
    if (hasSubmenuAccess('self_attendance', true)) {
      selfChildren.push({ name: 'My Attendance', path: '/my-attendance', icon: HiOutlineCalendarDays });
    }
    if (hasSubmenuAccess('self_leaves', true)) {
      selfChildren.push({ name: 'My Leaves & Apply', path: '/my-leaves', icon: HiOutlineCalendarDays });
    }
    if (hasSubmenuAccess('self_salary_slips', true)) {
      selfChildren.push({ name: 'My Salary Slips', path: '/my-salary-slips', icon: HiOutlineDocumentCheck });
    }
    if (hasSubmenuAccess('self_documents', true)) {
      selfChildren.push({ name: 'My Documents & KYC', path: '/my-documents', icon: HiOutlineFolderArrowDown });
    }
    if (hasSubmenuAccess('self_sticky_notes', true)) {
      selfChildren.push({ name: 'Sticky Notes & Reminders', path: '/sticky-notes', icon: HiOutlineBookmark });
    }
    if (hasSubmenuAccess('self_time_tracker', true)) {
      selfChildren.push({ name: 'Work Timer & Tracker', path: '/time-tracker', icon: HiOutlineClock });
    }
    if (hasSubmenuAccess('self_user_manual', true)) {
      selfChildren.push({ name: 'User Manual & Guide', path: '/user-manual', icon: HiOutlineBookOpen });
    }
    if (hasSubmenuAccess('self_profile', true)) {
      selfChildren.push({ name: 'My Profile', path: '/admin/profile', icon: HiOutlineUser });
    }
    if (selfChildren.length > 0) {
      structure.push({
        id: 'self-service',
        name: 'My Self-Service',
        icon: HiOutlineFingerPrint,
        children: selfChildren,
      });
    }

    // System Admin
    const adminChildren = [];
    if (hasSubmenuAccess('admin_roles', isAdmin || perms.settings?.view)) {
      adminChildren.push({ name: 'Roles & Permissions', path: '/admin/roles', icon: HiOutlineShieldCheck });
    }
    if (hasSubmenuAccess('admin_billing', isAdmin)) {
      adminChildren.push({ name: 'Billing & Invoices', path: '/admin/billing', icon: HiOutlineCreditCard });
    }
    if (hasSubmenuAccess('admin_settings_org', isAdmin || perms.settings?.view)) {
      adminChildren.push({ name: 'Office Settings', path: '/admin/settings?tab=org', icon: HiOutlineCog6Tooth });
    }
    if (hasSubmenuAccess('admin_settings_email', isAdmin || perms.settings?.view)) {
      adminChildren.push({ name: 'Company SMTP & Mail', path: '/admin/settings?tab=email', icon: HiOutlineEnvelope });
    }
    if (hasSubmenuAccess('admin_backup', isAdmin || perms.settings?.view)) {
      adminChildren.push({ name: 'Data Backup & Restore', path: '/admin/backup', icon: HiOutlineServer });
    }
    if (adminChildren.length > 0) {
      structure.push({
        id: 'administration',
        name: 'System Admin',
        icon: HiOutlineCog6Tooth,
        children: adminChildren,
      });
    }

    // Configurations & External Third-Party APIs
    const configChildren = [];
    if (hasSubmenuAccess('config_website_feeds', isAdmin || perms.settings?.view || perms.integrations?.view)) {
      configChildren.push({ name: 'Website Feeds & Overview', path: '/admin/integrations', icon: HiOutlineGlobeAlt });
    }
    if (hasSubmenuAccess('config_contacts', isAdmin || perms.settings?.view || perms.integrations?.view)) {
      configChildren.push({ name: 'Contact Enquiries', path: '/admin/integrations?tab=contacts', icon: HiOutlineEnvelope });
    }
    if (hasSubmenuAccess('config_appointments', isAdmin || perms.settings?.view || perms.integrations?.view)) {
      configChildren.push({ name: 'Appointments', path: '/admin/integrations?tab=appointments', icon: HiOutlineCalendarDays });
    }
    if (hasSubmenuAccess('config_careers', isAdmin || perms.settings?.view || perms.integrations?.view)) {
      configChildren.push({ name: 'Career Applications', path: '/admin/integrations?tab=careers', icon: HiOutlineBriefcase });
    }
    if (hasSubmenuAccess('config_api_endpoints', isAdmin || perms.settings?.view || perms.integrations?.view)) {
      configChildren.push({ name: 'API Endpoints Setup', path: '/admin/integrations?tab=config', icon: HiOutlineCog6Tooth });
    }
    if (hasSubmenuAccess('config_integration_docs', isAdmin || perms.settings?.view || perms.integrations?.view)) {
      configChildren.push({ name: 'Integration Docs', path: '/admin/integrations?tab=docs', icon: HiOutlineCommandLine });
    }
    if (configChildren.length > 0) {
      structure.push({
        id: 'configurations',
        name: 'Configurations',
        icon: HiOutlineGlobeAlt,
        children: configChildren,
      });
    }

    // Help & Support (Company Support + Softwares Support + System Support)
    const supportChildren = [];
    if (hasSubmenuAccess('support_company', true)) {
      supportChildren.push({
        name: 'Company Support',
        path: '/company-support',
        icon: HiOutlineBuildingOffice2,
      });
    }
    if (hasSubmenuAccess('support_software', true)) {
      supportChildren.push({
        name: 'Softwares Support',
        path: '/software-support',
        icon: HiOutlineComputerDesktop,
      });
    }
    if (hasSubmenuAccess('self_user_manual', true)) {
      supportChildren.push({
        name: 'User Manual & Guide',
        path: '/user-manual',
        icon: HiOutlineBookOpen,
      });
    }
    if (hasSubmenuAccess('support_system', true)) {
      supportChildren.push({
        name: 'System Support',
        path: '/support-tickets',
        icon: HiOutlineLifebuoy,
      });
    }
    if (supportChildren.length > 0) {
      structure.push({
        id: 'support-help',
        name: 'Help & Support',
        icon: HiOutlineLifebuoy,
        children: supportChildren,
      });
    }

    return structure;
  };

  const navItems = getNavStructure();

  // Flatten all accessible menu items for fast search
  const allSearchableItems = React.useMemo(() => {
    const list = [];
    navItems.forEach((menu) => {
      if (menu.isDirect) {
        list.push({
          id: menu.id || menu.path,
          name: menu.name,
          path: menu.path,
          icon: menu.icon,
          category: 'Main Menu',
          badge: menu.badge,
        });
      }
      if (Array.isArray(menu.children)) {
        menu.children.forEach((child) => {
          list.push({
            id: `${menu.id}-${child.path}-${child.name}`,
            name: child.name,
            path: child.path,
            icon: child.icon || menu.icon,
            category: menu.name,
            badge: child.badge,
          });
        });
      }
    });
    return list;
  }, [navItems]);

  // Filtered search results
  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allSearchableItems.filter((item) => {
      const matchName = item.name.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchPath = item.path && item.path.toLowerCase().includes(q);
      return matchName || matchCat || matchPath;
    });
  }, [searchQuery, allSearchableItems]);

  // Auto-expand menu if current path is a sub-item
  useEffect(() => {
    navItems.forEach((menu) => {
      if (menu.children && menu.children.some((child) => isRouteActive(child.path))) {
        setOpenMenus((prev) => ({
          ...prev,
          [menu.id]: true,
        }));
      }
    });
  }, [location.pathname]);

  const toggleMenu = (menuId) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 lg:z-0 w-72 lg:w-64 min-h-[100dvh] h-[100dvh] bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out flex flex-col shadow-xl lg:shadow-none pt-[env(safe-area-inset-top,0px)] ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        aria-label="Sidebar navigation"
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 sm:px-5 border-b border-slate-200 bg-white shrink-0">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 group min-w-0 flex-1"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-600 group-hover:bg-indigo-700 flex items-center justify-center transition-colors shadow-sm shrink-0">
              <HiOutlineBuildingOffice2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-slate-900 text-sm tracking-tight leading-tight group-hover:text-indigo-600 transition-colors truncate">
                {user?.company?.name || 'Enterprise'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider truncate">
                {user?.company?.companyCode || 'CORP-ID'}
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 -mr-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Search Box */}
        <div className="px-3 pt-2.5 pb-2 shrink-0 border-b border-slate-100 bg-white">
          <div className="relative flex items-center">
            <HiOutlineMagnifyingGlass className="absolute left-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search menu (Ctrl+K)..."
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Clear search (Esc)"
              >
                <HiOutlineXMark className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block absolute right-2 pointer-events-none text-[9px] font-mono font-semibold text-slate-400 bg-slate-200/60 border border-slate-300/70 px-1 py-0.5 rounded leading-none">
                ⌘K
              </kbd>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2.5 sm:px-3 py-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          {searchQuery.trim() ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-400">
                <span>
                  Found {searchResults.length} {searchResults.length === 1 ? 'match' : 'matches'}
                </span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </div>

              {searchResults.length > 0 ? (
                searchResults.map((item) => {
                  const ItemIcon = item.icon;
                  const isActive = isRouteActive(item.path);
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => {
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={`group relative flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-xs transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <ItemIcon
                          className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                            isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="truncate font-medium text-slate-800 group-hover:text-slate-900">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate group-hover:text-slate-500">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      {item.badge ? (
                        <span className="min-w-[16px] h-4 px-1 inline-flex items-center justify-center text-[10px] font-bold rounded-full bg-rose-500 text-white shrink-0">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      ) : isActive ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                      ) : null}
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-8 px-3 bg-slate-50/70 rounded-xl border border-dashed border-slate-200 mt-2">
                  <HiOutlineMagnifyingGlass className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-700">No menu matches found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Try searching for "salary", "timer", "backup", "task", "leave"...
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-3 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                  >
                    Reset Search
                  </button>
                </div>
              )}
            </div>
          ) : (
            navItems.map((menu) => {
            const Icon = menu.icon;

            // Case 1: Direct Link
            if (menu.isDirect) {
              const isActive = isRouteActive(menu.path);
              return (
                <Link
                  key={menu.id}
                  to={menu.path}
                  onClick={() => setIsOpen(false)}
                  className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${isActive
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                  />
                  <span className="truncate">{menu.name}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                  )}
                </Link>
              );
            }

            // Case 2: Expandable Menu
            const isMenuOpen = !!openMenus[menu.id];
            const hasActiveChild = menu.children?.some((child) => isRouteActive(child.path));
            const totalBadges =
              menu.children?.reduce((acc, child) => acc + (child.badge || 0), 0) || 0;

            return (
              <div key={menu.id} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => toggleMenu(menu.id)}
                  className={`w-full group flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${hasActiveChild
                    ? 'bg-slate-50 text-slate-900'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  aria-expanded={isMenuOpen}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Icon
                      className={`w-[18px] h-[18px] shrink-0 transition-colors ${hasActiveChild ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                    />
                    <span className="truncate text-left">{menu.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isMenuOpen && totalBadges > 0 && (
                      <span className="min-w-[16px] h-4 px-1 inline-flex items-center justify-center text-[10px] font-bold rounded-full bg-rose-500 text-white leading-none">
                        {totalBadges > 9 ? '9+' : totalBadges}
                      </span>
                    )}
                    <HiChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${isMenuOpen ? 'rotate-180 text-slate-700' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                    />
                  </div>
                </button>

                {/* Submenu */}
                <div
                  className={`grid transition-all duration-200 ease-in-out ${isMenuOpen
                    ? 'grid-rows-[1fr] opacity-100 mt-0.5 mb-1'
                    : 'grid-rows-[0fr] opacity-0'
                    }`}
                >
                  <div className="overflow-hidden">
                    <div className="ml-4 pl-3 border-l border-slate-200 space-y-0.5 py-0.5">
                      {menu.children?.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = isRouteActive(subItem.path);

                        return (
                          <Link
                            key={subItem.path + subItem.name}
                            to={subItem.path}
                            onClick={() => setIsOpen(false)}
                            className={`group relative flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${isSubActive
                              ? 'bg-indigo-50 text-indigo-700 font-semibold'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                              }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <SubIcon
                                className={`w-4 h-4 shrink-0 transition-colors ${isSubActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                                  }`}
                              />
                              <span className="truncate">{subItem.name}</span>
                            </div>

                            {subItem.badge && (
                              <span
                                className={`min-w-[16px] h-4 px-1 inline-flex items-center justify-center text-[10px] font-bold rounded-full shrink-0 leading-none ${isSubActive
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-rose-500 text-white'
                                  }`}
                              >
                                {subItem.badge > 9 ? '9+' : subItem.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          }))}
        </nav>

        {/* User Footer */}
        <div className="p-2.5 sm:p-3 border-t border-slate-200 bg-slate-50 shrink-0 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-3">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors">
            <Link
              to="/admin/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 min-w-0 group flex-1"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
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
                <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                  {user?.name || 'User'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium truncate">
                  {user?.roleRef?.displayName || user?.role || 'Staff'}
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => logout()}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
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