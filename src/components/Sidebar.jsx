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
    const currentFull = location.pathname + (location.search || '');
    if (path.includes('?')) {
      return (
        currentFull === path ||
        (location.pathname === path.split('?')[0] && location.search === `?${path.split('?')[1]}`)
      );
    }
    if (location.pathname === path && !location.search) return true;
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

    // 1. Super Admin Navigation (Divided cleanly into Operations, Website & Security, Enterprise Hub)
    if (user.role === 'Super Admin') {
      return [
        {
          id: 'super-admin-dashboard',
          name: 'Dashboard',
          path: '/super-admin/dashboard',
          icon: HiOutlineSquares2X2,
          isDirect: true,
          section: 'Platform Overview',
        },
        {
          id: 'super-admin-platform',
          name: 'Platform Operations',
          icon: HiOutlineBuildingOffice2,
          section: 'Platform Operations',
          children: [
            { name: 'Offices & Branches', path: '/super-admin/offices', icon: HiOutlineBuildingOffice2 },
            { name: 'Subscription Plans', path: '/super-admin/plans', icon: HiOutlineCreditCard },
            { name: 'Platform Billing & Invoices', path: '/super-admin/billing', icon: HiOutlineBanknotes },
          ],
        },
        {
          id: 'super-admin-security',
          name: 'Website & Security',
          icon: HiOutlineGlobeAlt,
          section: 'Platform Operations',
          children: [
            { name: 'Website CMS & Gateway', path: '/super-admin/cms', icon: HiOutlineGlobeAlt },
            { name: 'Audit Logs & Security', path: '/super-admin/audit-logs', icon: HiOutlineCommandLine },
            { name: 'Support Tickets Desk', path: '/super-admin/tickets', icon: HiOutlineLifebuoy },
          ],
        },
        {
          id: 'super-admin-enterprise',
          name: 'Enterprise Hub',
          icon: HiOutlineDocumentCheck,
          section: 'Enterprise Management',
          children: [
            { name: 'E-Agreements & Contracts', path: '/admin/e-agreements', icon: HiOutlineDocumentCheck },
            { name: 'Reports & Export Hub', path: '/admin/reports-center', icon: HiOutlineDocumentArrowDown },
            { name: 'Employee Documents Hub', path: '/admin/documents', icon: HiOutlineFolderArrowDown },
            { name: 'Salary Process & Status', path: '/salary-process', icon: HiOutlineBanknotes },
            { name: 'Company Time Logs', path: '/time-tracker', icon: HiOutlineClock },
            { name: 'Company Backup & Restore', path: '/admin/backup', icon: HiOutlineServer },
          ],
        },
        {
          id: 'super-admin-account',
          name: 'My Account',
          icon: HiOutlineUser,
          section: 'Account & Profile',
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
          section: 'Client Workspace',
        },
        {
          id: 'client-projects',
          name: 'Projects & Progress',
          path: '/client/projects',
          icon: HiOutlineFolder,
          isDirect: true,
          section: 'Deliverables & Billing',
        },
        {
          id: 'client-invoices',
          name: 'Billings & Invoices',
          path: '/client/invoices',
          icon: HiOutlineBanknotes,
          isDirect: true,
          section: 'Deliverables & Billing',
        },
        {
          id: 'client-support',
          name: 'Project Queries',
          path: '/client/support',
          icon: HiOutlineChatBubbleLeftRight,
          isDirect: true,
          section: 'Support & Profile',
        },
        {
          id: 'client-profile',
          name: 'My Profile',
          path: '/admin/profile',
          icon: HiOutlineUser,
          isDirect: true,
          section: 'Support & Profile',
        },
      ];
    }

    // 3. Accountant / Finance Navigation (Dedicated, cleanly categorized for Accountant role)
    const r = (user.role || '').toLowerCase();
    if (user.role === 'Accountant' || r.includes('accountant') || r.includes('finance')) {
      return [
        {
          id: 'accountant-dashboard',
          name: 'Finance Dashboard',
          path: '/accountant/billing?tab=dashboard',
          icon: HiOutlineSquares2X2,
          isDirect: true,
          section: 'Finance & Invoicing',
        },
        {
          id: 'accountant-billing-menu',
          name: 'Client Invoicing & Ledgers',
          icon: HiOutlineBanknotes,
          section: 'Finance & Invoicing',
          children: [
            { name: 'Billing Overview', path: '/accountant/billing?tab=dashboard', icon: HiOutlineSquares2X2 },
            { name: 'Client Invoices', path: '/accountant/billing?tab=invoices', icon: HiOutlineDocumentText },
            { name: 'Receipts & Vouchers', path: '/accountant/billing?tab=payments', icon: HiOutlineBanknotes },
            { name: 'Customer Ledgers', path: '/accountant/billing?tab=ledger', icon: HiOutlineClipboardDocumentList },
            { name: 'GST & Tax Reports', path: '/accountant/billing?tab=gst', icon: HiOutlineDocumentChartBar },
          ],
        },
        {
          id: 'accountant-payroll-menu',
          name: 'Payroll Management',
          icon: HiOutlineCreditCard,
          section: 'Finance & Invoicing',
          children: [
            { name: 'Salary Process & Status', path: '/salary-process', icon: HiOutlineBanknotes },
            { name: 'Salary Management', path: '/admin/salary-management', icon: HiOutlineBanknotes },
            { name: 'Payroll Settings', path: '/admin/payroll-settings', icon: HiOutlineCog6Tooth },
          ],
        },
        {
          id: 'accountant-contracts-menu',
          name: 'Contracts & Documents',
          icon: HiOutlineDocumentCheck,
          section: 'Compliance & Audit',
          children: [
            { name: 'E-Agreements & Contracts', path: '/admin/e-agreements', icon: HiOutlineDocumentCheck },
            { name: 'Document Management', path: '/admin/documents', icon: HiOutlineFolderArrowDown },
            { name: 'Reports & Export Hub', path: '/admin/reports-center', icon: HiOutlineDocumentArrowDown },
          ],
        },
        {
          id: 'accountant-workspace-menu',
          name: 'My Workspace & Tools',
          icon: HiOutlineFingerPrint,
          section: 'Personal Workspace',
          children: [
            { name: 'My Documents & KYC', path: '/my-documents', icon: HiOutlineDocumentCheck },
            { name: 'Sticky Notes & Reminders', path: '/sticky-notes', icon: HiOutlineBookmark },
            { name: 'Work Timer & Tracker', path: '/time-tracker', icon: HiOutlineClock },
            { name: 'User Manual & Guide', path: '/user-manual', icon: HiOutlineBookOpen },
            { name: 'My Profile', path: '/admin/profile', icon: HiOutlineUser },
          ],
        },
      ];
    }

    // 4. Company Office Navigation (Admin, HR, Team Head, Staff)
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

    // ========================================================
    // SECTION 1: WORK & OPERATIONS
    // ========================================================
    structure.push({
      id: 'dashboard',
      name: 'Dashboard',
      path: dashboardPath,
      icon: HiOutlineSquares2X2,
      isDirect: true,
      section: 'Work & Operations',
    });

    // 1.1 Work & Projects (Projects, Sprints, Daily Tasks, Task Progress)
    const workChildren = [];
    if (
      hasSubmenuAccess(
        'work_projects',
        isAdmin || perms.projects?.view || r === 'user' || r === 'employee' || r === 'team head' || r.includes('lead')
      )
    ) {
      workChildren.push({ name: 'Projects', path: '/admin/projects', icon: HiOutlineFolder });
    }
    if (
      hasSubmenuAccess(
        'work_sprints',
        isAdmin || perms.sprints?.view || perms.projects?.view || perms.tasks?.view
      )
    ) {
      workChildren.push({ name: 'Sprints & Roadmap', path: '/admin/sprints', icon: HiOutlineRocketLaunch });
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
      workChildren.push({ name: 'Task Progress Reports', path: '/admin/reports', icon: HiOutlineDocumentText });
    }
    if (workChildren.length > 0) {
      structure.push({
        id: 'work-projects',
        name: 'Work & Projects',
        icon: HiOutlineFolder,
        section: 'Work & Operations',
        children: workChildren,
      });
    }

    // 1.2 Time & Productivity (Timer, Punch In/Out, Sticky Notes)
    const timeChildren = [];
    if (hasSubmenuAccess('work_time_tracker', true)) {
      timeChildren.push({
        name: 'Work Timer & Stopwatch',
        path: '/time-tracker',
        icon: HiOutlineClock,
      });
    }
    if (hasSubmenuAccess('self_punch', true)) {
      timeChildren.push({
        name: 'Daily Punch In / Out',
        path: '/punch-in',
        icon: HiOutlineFingerPrint,
      });
    }
    if (hasSubmenuAccess('self_sticky_notes', true)) {
      timeChildren.push({
        name: 'Sticky Notes & Reminders',
        path: '/sticky-notes',
        icon: HiOutlineBookmark,
      });
    }
    if (timeChildren.length > 0) {
      structure.push({
        id: 'time-productivity',
        name: 'Time & Productivity',
        icon: HiOutlineClock,
        section: 'Work & Operations',
        children: timeChildren,
      });
    }

    // 1.3 CRM & Sales (Overview, Leads, Deals, Customers)
    const crmChildren = [];
    if (hasSubmenuAccess('crm_overview', isAdmin || perms.crm?.view)) {
      crmChildren.push({ name: 'Sales CRM Overview', path: '/admin/crm', icon: HiOutlineChartBarSquare });
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
        section: 'Work & Operations',
        children: crmChildren,
      });
    }

    // 1.4 E-Agreements Hub (Overview, Template Designer, All Agreements, Gateway Settings)
    const agreementChildren = [];
    if (
      hasSubmenuAccess(
        'e_agreements_dashboard',
        isAdmin || perms.agreements?.view || r === 'hr manager' || r === 'hr' || r === 'team head' || r.includes('lead') || r.includes('accountant')
      )
    ) {
      agreementChildren.push({ name: 'Agreements Overview', path: '/admin/e-agreements', icon: HiOutlineDocumentCheck });
    }
    if (hasSubmenuAccess('e_agreements_templates', isAdmin || perms.agreements?.view || r === 'hr manager' || r === 'hr')) {
      agreementChildren.push({ name: 'Template Designer', path: '/admin/e-agreements/templates', icon: HiOutlineDocumentText });
    }
    if (
      hasSubmenuAccess(
        'e_agreements_generated',
        isAdmin || perms.agreements?.view || r === 'hr manager' || r === 'hr' || r === 'team head' || r.includes('lead') || r.includes('accountant')
      )
    ) {
      agreementChildren.push({ name: 'All Generated Agreements', path: '/admin/e-agreements/list', icon: HiOutlineShieldCheck });
    }
    if (hasSubmenuAccess('e_agreements_settings', isAdmin)) {
      agreementChildren.push({ name: 'Gateway API Settings', path: '/admin/e-agreements/settings', icon: HiOutlineCog6Tooth });
    }
    if (agreementChildren.length > 0) {
      structure.push({
        id: 'e-agreements',
        name: 'E-Agreements Hub',
        icon: HiOutlineDocumentCheck,
        section: 'Work & Operations',
        children: agreementChildren,
      });
    }

    // ========================================================
    // SECTION 2: PEOPLE & FINANCE
    // ========================================================

    // 2.1 Human Resources (Users, Offer Letters, Document KYC, Announcements)
    const teamChildren = [];
    if (hasSubmenuAccess('hr_users', isAdmin || perms.users?.view)) {
      teamChildren.push({ name: 'Users & Staff Directory', path: '/admin/users', icon: HiOutlineUsers });
    }
    if (hasSubmenuAccess('hr_offer_letters', isAdmin || perms.users?.view || perms.payroll?.view)) {
      teamChildren.push({ name: 'Staff Offer Letters', path: '/admin/offer-letters', icon: HiOutlineDocumentText });
    }
    if (hasSubmenuAccess('hr_documents', isAdmin || perms.documents?.view || perms.users?.view)) {
      teamChildren.push({ name: 'Employee KYC Documents', path: '/admin/documents', icon: HiOutlineFolderArrowDown });
    }
    if (hasSubmenuAccess('hr_announcements', isAdmin || perms.announcements?.view)) {
      teamChildren.push({ name: 'Company Announcements', path: '/admin/announcements', icon: HiOutlineMegaphone });
    }
    if (teamChildren.length > 0) {
      structure.push({
        id: 'team-hr',
        name: 'Human Resources',
        icon: HiOutlineUsers,
        section: 'People & Finance',
        children: teamChildren,
      });
    }

    // 2.2 Attendance & Leaves (Daily Attendance, Leaves & Holidays, Attendance Policy)
    const attendanceChildren = [];
    if (hasSubmenuAccess('hr_attendance', isAdmin || perms.attendance?.view || perms.attendance?.edit)) {
      attendanceChildren.push({ name: 'Daily Attendance & Regularization', path: '/admin/attendance', icon: HiOutlineCalendarDays });
    }
    if (hasSubmenuAccess('hr_leaves', isAdmin || perms.attendance?.view || perms.users?.view || perms.leaves?.view)) {
      attendanceChildren.push({ name: 'Leave Requests & Holidays', path: '/admin/leaves', icon: HiOutlineCalendarDays });
    }
    if (hasSubmenuAccess('hr_attendance_settings', isAdmin || perms.attendance?.view || perms.attendance?.edit)) {
      attendanceChildren.push({ name: 'Shift & Geofence Policy', path: '/admin/attendance-settings', icon: HiOutlineClock });
    }
    if (attendanceChildren.length > 0) {
      structure.push({
        id: 'attendance-leaves',
        name: 'Attendance & Leaves',
        icon: HiOutlineCalendarDays,
        section: 'People & Finance',
        children: attendanceChildren,
      });
    }

    // 2.3 Finance & Billing (Client Billing, Invoices, Receipts, Ledgers, GST, Client Deliverables)
    const financeChildren = [];
    if (hasSubmenuAccess('payroll_billing', isAdmin || perms.payroll?.view)) {
      financeChildren.push({ name: 'Client Invoicing & Billing', path: '/accountant/billing', icon: HiOutlineBanknotes });
      financeChildren.push({ name: 'Client Invoices', path: '/accountant/billing?tab=invoices', icon: HiOutlineDocumentText });
      financeChildren.push({ name: 'Receipts & Vouchers', path: '/accountant/billing?tab=payments', icon: HiOutlineCreditCard });
      financeChildren.push({ name: 'Customer Ledgers', path: '/accountant/billing?tab=ledger', icon: HiOutlineClipboardDocumentList });
      financeChildren.push({ name: 'GST & Tax Reports', path: '/accountant/billing?tab=gst', icon: HiOutlineDocumentChartBar });
    }
    if (hasSubmenuAccess('work_client_portal', isAdmin || perms.projects?.edit || perms.projects?.create)) {
      financeChildren.push({ name: 'Client Portal & Deliverables', path: '/admin/client-portal', icon: HiOutlineBuildingStorefront });
    }
    if (financeChildren.length > 0) {
      structure.push({
        id: 'finance-billing',
        name: 'Finance & Billing',
        icon: HiOutlineBanknotes,
        section: 'People & Finance',
        children: financeChildren,
      });
    }

    // 2.4 Payroll Management (Salary Process, Salary Structure Management, Formulas)
    const payrollChildren = [];
    if (hasSubmenuAccess('payroll_salary_process', isAdmin || perms.payroll?.view)) {
      payrollChildren.push({ name: 'Salary Process & Status', path: '/salary-process', icon: HiOutlineBanknotes });
    }
    if (hasSubmenuAccess('payroll_salary_management', isAdmin || perms.payroll?.view)) {
      payrollChildren.push({ name: 'Salary Structure Management', path: '/admin/salary-management', icon: HiOutlineCreditCard });
    }
    if (hasSubmenuAccess('payroll_settings', isAdmin || perms.payroll?.view)) {
      payrollChildren.push({ name: 'Payroll Settings Formula', path: '/admin/payroll-settings', icon: HiOutlineCog6Tooth });
    }
    if (payrollChildren.length > 0) {
      structure.push({
        id: 'payroll-management',
        name: 'Payroll Management',
        icon: HiOutlineCreditCard,
        section: 'People & Finance',
        children: payrollChildren,
      });
    }

    // 2.5 Reports & Analytics Hub (Central Hub, Performance, Task Reports)
    const reportsChildren = [];
    if (hasSubmenuAccess('work_reports_center', isAdmin || perms.reports?.view)) {
      reportsChildren.push({ name: 'Central Reports & Export Hub', path: '/admin/reports-center', icon: HiOutlineDocumentArrowDown });
    }
    if (hasSubmenuAccess('work_performance', isAdmin || perms.performance?.view)) {
      reportsChildren.push({ name: 'Team Performance Analysis', path: '/admin/performance', icon: HiOutlineChartBar });
    }
    if (hasSubmenuAccess('work_task_reports', isAdmin || perms.reports?.view)) {
      reportsChildren.push({ name: 'Task Completion Reports', path: '/admin/reports', icon: HiOutlineDocumentText });
    }
    if (reportsChildren.length > 0) {
      structure.push({
        id: 'reports-analytics',
        name: 'Reports & Analytics Hub',
        icon: HiOutlineDocumentArrowDown,
        section: 'People & Finance',
        children: reportsChildren,
      });
    }

    // ========================================================
    // SECTION 3: COLLABORATION & PERSONAL
    // ========================================================

    // 3.1 Collaboration (Chat, Video Meeting)
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
        name: 'Team Video Meeting',
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
        section: 'Collaboration & Personal',
        children: commChildren,
      });
    }

    // 3.2 My Self-Service (Employee Personal Punch, Attendance, Leaves, Slips, Profile)
    const selfChildren = [];
    if (hasSubmenuAccess('self_punch', true)) {
      selfChildren.push({ name: 'Punch In / Out', path: '/punch-in', icon: HiOutlineFingerPrint });
    }
    if (hasSubmenuAccess('self_attendance', true)) {
      selfChildren.push({ name: 'My Attendance History', path: '/my-attendance', icon: HiOutlineCalendarDays });
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
    if (hasSubmenuAccess('self_profile', true)) {
      selfChildren.push({ name: 'My Profile', path: '/admin/profile', icon: HiOutlineUser });
    }
    if (selfChildren.length > 0) {
      structure.push({
        id: 'self-service',
        name: 'My Self-Service',
        icon: HiOutlineFingerPrint,
        section: 'Collaboration & Personal',
        children: selfChildren,
      });
    }

    // ========================================================
    // SECTION 4: SYSTEM & SUPPORT
    // ========================================================

    // 4.1 Website & Integrations (Feeds, Contacts, Appointments, Careers, API Endpoints, Docs)
    const configChildren = [];
    if (hasSubmenuAccess('config_website_feeds', isAdmin || perms.settings?.view || perms.integrations?.view)) {
      configChildren.push({ name: 'Website Feeds & Webhooks', path: '/admin/integrations', icon: HiOutlineGlobeAlt });
    }
    if (hasSubmenuAccess('config_contacts', isAdmin || perms.settings?.view || perms.integrations?.view)) {
      configChildren.push({ name: 'Contact Form Enquiries', path: '/admin/integrations?tab=contacts', icon: HiOutlineEnvelope });
    }
    if (hasSubmenuAccess('config_appointments', isAdmin || perms.settings?.view || perms.integrations?.view)) {
      configChildren.push({ name: 'Demo & Appointments', path: '/admin/integrations?tab=appointments', icon: HiOutlineCalendarDays });
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
        name: 'Website & Integrations',
        icon: HiOutlineGlobeAlt,
        section: 'System & Support',
        children: configChildren,
      });
    }

    // 4.2 System Administration (Roles, Office Settings, Mail SMTP, Subscription Billing, Backup)
    const adminChildren = [];
    if (hasSubmenuAccess('admin_roles', isAdmin || perms.settings?.view)) {
      adminChildren.push({ name: 'Roles & User Permissions', path: '/admin/roles', icon: HiOutlineShieldCheck });
    }
    if (hasSubmenuAccess('admin_settings_org', isAdmin || perms.settings?.view)) {
      adminChildren.push({ name: 'Office Settings & Profile', path: '/admin/settings?tab=org', icon: HiOutlineCog6Tooth });
    }
    if (hasSubmenuAccess('admin_settings_email', isAdmin || perms.settings?.view)) {
      adminChildren.push({ name: 'Company SMTP & Mail', path: '/admin/settings?tab=email', icon: HiOutlineEnvelope });
    }
    if (hasSubmenuAccess('admin_billing', isAdmin)) {
      adminChildren.push({ name: 'Subscription & Billing', path: '/admin/billing', icon: HiOutlineCreditCard });
    }
    if (hasSubmenuAccess('admin_backup', isAdmin || perms.settings?.view)) {
      adminChildren.push({ name: 'Data Backup & Restore', path: '/admin/backup', icon: HiOutlineServer });
    }
    if (adminChildren.length > 0) {
      structure.push({
        id: 'administration',
        name: 'System Admin',
        icon: HiOutlineCog6Tooth,
        section: 'System & Support',
        children: adminChildren,
      });
    }

    // 4.3 Help & Support (Manual, Company Support, Software Support, Ticket Desk)
    const supportChildren = [];
    if (hasSubmenuAccess('self_user_manual', true)) {
      supportChildren.push({
        name: 'User Manual & Operating Guide',
        path: '/user-manual',
        icon: HiOutlineBookOpen,
      });
    }
    if (hasSubmenuAccess('support_company', true)) {
      supportChildren.push({
        name: 'Company Support Desk',
        path: '/company-support',
        icon: HiOutlineBuildingOffice2,
      });
    }
    if (hasSubmenuAccess('support_software', true)) {
      supportChildren.push({
        name: 'Software Tech Support',
        path: '/software-support',
        icon: HiOutlineComputerDesktop,
      });
    }
    if (hasSubmenuAccess('support_system', true)) {
      supportChildren.push({
        name: 'System Support Desk',
        path: '/support-tickets',
        icon: HiOutlineLifebuoy,
      });
    }
    if (supportChildren.length > 0) {
      structure.push({
        id: 'support-help',
        name: 'Help & Support',
        icon: HiOutlineLifebuoy,
        section: 'System & Support',
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
          category: menu.section || 'Direct',
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
  }, [location.pathname, location.search]);

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
        className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 lg:z-0 w-72 lg:w-64 min-h-[100dvh] h-[100dvh] bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out flex flex-col shadow-xl lg:shadow-none pt-[env(safe-area-inset-top,0px)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
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
        <nav className="flex-1 overflow-y-auto px-2.5 sm:px-3 py-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
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
                      className={`group relative flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
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
                          <span className="text-[10px] text-slate-400 truncate group-hover:text-slate-500 font-normal">
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
                    Try searching for "salary", "timer", "attendance", "agreement", "leads"...
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
            navItems.map((menu, index) => {
              const Icon = menu.icon;
              const isFirstOfSection =
                menu.section &&
                (index === 0 || navItems[index - 1]?.section !== menu.section);

              return (
                <React.Fragment key={menu.id || menu.path}>
                  {/* Subtle Enterprise Section Heading Divider */}
                  {isFirstOfSection && (
                    <div className={`px-2.5 ${index === 0 ? 'pt-1 pb-1' : 'pt-3.5 pb-1'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                          {menu.section}
                        </span>
                        <div className="h-px bg-slate-100 flex-1" />
                      </div>
                    </div>
                  )}

                  {/* Case 1: Direct Link */}
                  {menu.isDirect ? (
                    <Link
                      to={menu.path}
                      onClick={() => setIsOpen(false)}
                      className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        isRouteActive(menu.path)
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon
                        className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                          isRouteActive(menu.path)
                            ? 'text-indigo-600'
                            : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      <span className="truncate">{menu.name}</span>
                      {isRouteActive(menu.path) && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                      )}
                    </Link>
                  ) : (
                    /* Case 2: Expandable Menu */
                    (() => {
                      const isMenuOpen = !!openMenus[menu.id];
                      const hasActiveChild = menu.children?.some((child) => isRouteActive(child.path));
                      const totalBadges =
                        menu.children?.reduce((acc, child) => acc + (child.badge || 0), 0) || 0;

                      return (
                        <div className="space-y-0.5">
                          <button
                            type="button"
                            onClick={() => toggleMenu(menu.id)}
                            className={`w-full group flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              hasActiveChild
                                ? 'bg-slate-50 text-slate-900'
                                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                            aria-expanded={isMenuOpen}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <Icon
                                className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                                  hasActiveChild ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
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
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  isMenuOpen ? 'rotate-180 text-slate-700' : 'text-slate-400 group-hover:text-slate-600'
                                }`}
                              />
                            </div>
                          </button>

                          {/* Submenu Dropdown */}
                          <div
                            className={`grid transition-all duration-200 ease-in-out ${
                              isMenuOpen
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
                                      className={`group relative flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                        isSubActive
                                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <SubIcon
                                          className={`w-4 h-4 shrink-0 transition-colors ${
                                            isSubActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                                          }`}
                                        />
                                        <span className="truncate">{subItem.name}</span>
                                      </div>

                                      {subItem.badge && (
                                        <span
                                          className={`min-w-[16px] h-4 px-1 inline-flex items-center justify-center text-[10px] font-bold rounded-full shrink-0 leading-none ${
                                            isSubActive
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
                    })()
                  )}
                </React.Fragment>
              );
            })
          )}
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
