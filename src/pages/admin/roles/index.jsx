import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';

import {
  HiOutlineShieldCheck,
  HiOutlineBriefcase,
  HiOutlineUserGroup,
  HiOutlineUser,
  HiOutlineBanknotes,
  HiOutlineSparkles,
  HiOutlinePlus,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineArrowPath,
  HiOutlineChevronDown,
  HiOutlineMagnifyingGlass,
  HiOutlineEye,
  HiOutlineFolder,
  HiOutlineClipboardDocumentList,
  HiOutlineClock,
  HiOutlineChartBar,
  HiOutlineMegaphone,
  HiOutlineChatBubbleLeftRight,
  HiOutlineDocumentText,
  HiOutlineCog6Tooth,
  HiOutlineArrowsRightLeft,
  HiOutlineUsers,
  HiOutlineCheckBadge,
  HiOutlineMinus,
} from 'react-icons/hi2';

/* ============================================================
   MODULE DEFINITIONS (unchanged data)
   ============================================================ */
const DEFAULT_MODULE_DEFINITIONS = [
  { key: 'users', label: 'User & Staff Management', icon: HiOutlineUsers, desc: 'View, create, edit, and manage staff members.' },
  { key: 'projects', label: 'Projects & Workspaces', icon: HiOutlineFolder, desc: 'Client project scopes, assignments and delivery tracking.' },
  { key: 'tasks', label: 'Tasks & Daily Activities', icon: HiOutlineClipboardDocumentList, desc: 'Task allocation, updates, completion, and delegation.' },
  { key: 'attendance', label: 'Attendance & Time Logs', icon: HiOutlineClock, desc: 'Punch-in/out policies, geofencing, and working hours.' },
  { key: 'payroll', label: 'Payroll & Salaries', icon: HiOutlineBanknotes, desc: 'Salary setup, statutory deductions (PF/ESIC/PT), and payslips.' },
  { key: 'performance', label: 'Performance Analytics', icon: HiOutlineChartBar, desc: 'Efficiency KPI ratings, monthly metrics and goals.' },
  { key: 'announcements', label: 'Office Announcements', icon: HiOutlineMegaphone, desc: 'Broadcast notices, updates, and organizational alerts.' },
  { key: 'chat', label: 'Chat & Video Meetings', icon: HiOutlineChatBubbleLeftRight, desc: 'Direct messages, team channels, and online meetings.' },
  { key: 'reports', label: 'Work & Daily Reports', icon: HiOutlineDocumentText, desc: 'Daily timesheets, task submission logs, and reporting.' },
  { key: 'settings', label: 'Office Roles & Settings', icon: HiOutlineCog6Tooth, desc: 'Role permissions, office policies, and system defaults.' },
];

export const ROLE_TEMPLATES = [
  {
    key: 'HR Manager',
    name: 'HR Manager',
    displayName: 'HR Manager',
    badge: 'HR',
    icon: HiOutlineBriefcase,
    category: 'Human Resources',
    desc: 'Full employee management, attendance monitoring, payroll configurations, and office notices.',
    colorClass: 'purple',
    permissions: {
      users: { view: true, create: true, edit: true, delete: false },
      projects: { view: false, create: false, edit: false, delete: false },
      tasks: { view: true, create: false, edit: false, delete: false },
      attendance: { view: true, create: false, edit: true, delete: false },
      payroll: { view: true, create: true, edit: true, delete: false },
      performance: { view: true, create: false, edit: false, delete: false },
      announcements: { view: true, create: true, edit: true, delete: true },
      chat: { view: true, create: true, edit: false, delete: false },
      reports: { view: true, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
    },
  },
  {
    key: 'Team Head',
    name: 'Team Head',
    displayName: 'Team Head',
    badge: 'Lead',
    icon: HiOutlineUserGroup,
    category: 'Team Lead',
    desc: 'Project assignments, daily task delegation, timesheet reviews, and member progress.',
    colorClass: 'blue',
    permissions: {
      users: { view: true, create: false, edit: false, delete: false },
      projects: { view: true, create: false, edit: false, delete: false },
      tasks: { view: true, create: true, edit: true, delete: false },
      attendance: { view: true, create: false, edit: false, delete: false },
      payroll: { view: false, create: false, edit: false, delete: false },
      performance: { view: true, create: false, edit: false, delete: false },
      announcements: { view: true, create: false, edit: false, delete: false },
      chat: { view: true, create: true, edit: false, delete: false },
      reports: { view: true, create: true, edit: true, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
    },
  },
  {
    key: 'User',
    name: 'User',
    displayName: 'Employee / Staff Member',
    badge: 'Staff',
    icon: HiOutlineUser,
    category: 'Standard Employee',
    desc: 'Individual assigned tasks execution, punch-in attendance, communications, and daily reports.',
    colorClass: 'emerald',
    permissions: {
      users: { view: false, create: false, edit: false, delete: false },
      projects: { view: false, create: false, edit: false, delete: false },
      tasks: { view: true, create: true, edit: true, delete: false },
      attendance: { view: true, create: true, edit: false, delete: false },
      payroll: { view: false, create: false, edit: false, delete: false },
      performance: { view: false, create: false, edit: false, delete: false },
      announcements: { view: true, create: false, edit: false, delete: false },
      chat: { view: true, create: true, edit: false, delete: false },
      reports: { view: true, create: true, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
    },
  },
  {
    key: 'Accountant',
    name: 'Accountant',
    displayName: 'Accountant / Finance',
    badge: 'Finance',
    icon: HiOutlineBanknotes,
    category: 'Finance Officer',
    desc: 'Salary structure calculations, deduction policies (PF/ESIC/PT), and monthly payroll slips.',
    colorClass: 'amber',
    permissions: {
      users: { view: true, create: false, edit: false, delete: false },
      projects: { view: false, create: false, edit: false, delete: false },
      tasks: { view: true, create: false, edit: false, delete: false },
      attendance: { view: true, create: false, edit: false, delete: false },
      payroll: { view: true, create: true, edit: true, delete: false },
      performance: { view: false, create: false, edit: false, delete: false },
      announcements: { view: true, create: false, edit: false, delete: false },
      chat: { view: true, create: true, edit: false, delete: false },
      reports: { view: true, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
    },
  },
];

/* ============================================================
   DESIGN TOKENS (same as other pages)
   ============================================================ */
const tokens = {
  btnPrimary:
    'inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg bg-indigo-600 text-white shadow-sm ' +
    'hover:bg-indigo-700 active:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ' +
    'transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  btnSecondary:
    'inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg bg-white text-slate-700 border border-slate-300 shadow-sm ' +
    'hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  input:
    'w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 ' +
    'placeholder:text-slate-400 transition-colors ' +
    'focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ' +
    'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
  label:
    'block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5',
  card: 'bg-white border border-slate-200 rounded-xl shadow-sm',
};

/* ============================================================
   HELPERS (unchanged)
   ============================================================ */
const getRoleIcon = (roleName) => {
  const r = (roleName || '').toLowerCase();
  if (r === 'admin' || r === 'cto' || r === 'super admin') return HiOutlineShieldCheck;
  if (r === 'hr manager' || r === 'hr') return HiOutlineBriefcase;
  if (r === 'team head' || r === 'team lead') return HiOutlineUserGroup;
  if (r === 'user' || r === 'employee') return HiOutlineUser;
  if (r === 'accountant') return HiOutlineBanknotes;
  return HiOutlineSparkles;
};

const getRoleStyling = (roleName) => {
  const r = (roleName || '').toLowerCase();
  if (r === 'admin' || r === 'cto' || r === 'super admin') {
    return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' };
  }
  if (r === 'hr manager' || r === 'hr') {
    return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' };
  }
  if (r === 'team head' || r === 'team lead') {
    return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' };
  }
  if (r === 'user' || r === 'employee') {
    return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' };
  }
  if (r === 'accountant') {
    return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' };
  }
  return { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' };
};

const Loader = () => (
  <div className="flex justify-center items-center py-16">
    <div className="w-10 h-10 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
  </div>
);

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const RolesPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [filterTab, setFilterTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRoleId, setExpandedRoleId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: {},
  });

  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleKey, setNewModuleKey] = useState('');
  const [showAddModuleInput, setShowAddModuleInput] = useState(false);
  const [customModules, setCustomModules] = useState([]);

  /* ---------------- Query (UNCHANGED) ---------------- */
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await api.get('/roles');
      return Array.isArray(data) ? data : [];
    },
  });

  /* ---------------- Derived data (UNCHANGED) ---------------- */
  const allAvailableModules = useMemo(() => {
    const defaultKeys = new Set(DEFAULT_MODULE_DEFINITIONS.map((m) => m.key));
    const dynamicList = [...DEFAULT_MODULE_DEFINITIONS];

    roles.forEach((r) => {
      if (r.permissions && typeof r.permissions === 'object') {
        Object.keys(r.permissions).forEach((k) => {
          if (!defaultKeys.has(k) && !dynamicList.some((m) => m.key === k)) {
            dynamicList.push({
              key: k,
              label: k.charAt(0).toUpperCase() + k.slice(1),
              icon: HiOutlineSparkles,
              desc: `Custom module: ${k}`,
            });
          }
        });
      }
    });

    customModules.forEach((cm) => {
      if (!dynamicList.some((m) => m.key === cm.key)) {
        dynamicList.push(cm);
      }
    });

    return dynamicList;
  }, [roles, customModules]);

  const initEmptyMatrix = (modules) => {
    const matrix = {};
    modules.forEach((m) => {
      matrix[m.key] = { view: false, create: false, edit: false, delete: false };
    });
    return matrix;
  };

  /* ---------------- Mutations (UNCHANGED) ---------------- */
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/roles', payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Role created successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create role');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.put(`/roles/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Permissions updated successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update role');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (roleId) => {
      const { data } = await api.delete(`/roles/${roleId}`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Role deleted');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Cannot delete role');
    },
  });

  const resetDefaultsMutation = useMutation({
    mutationFn: async (roleId) => {
      const { data } = await api.post(`/roles/${roleId}/reset-defaults`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Permissions reset to standard defaults');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to reset role defaults');
    },
  });

  /* ---------------- Handlers (UNCHANGED logic) ---------------- */
  const handleOpenCreate = (presetKey = null) => {
    setEditingRole(null);
    setShowAddModuleInput(false);

    if (presetKey) {
      const tmpl = ROLE_TEMPLATES.find((t) => t.key === presetKey);
      if (tmpl) {
        handleApplyTemplate(tmpl);
        setIsModalOpen(true);
        return;
      }
    }

    const defaultTmpl = ROLE_TEMPLATES[0];
    setSelectedTemplateKey(defaultTmpl.key);
    const newPerms = initEmptyMatrix(allAvailableModules);
    Object.entries(defaultTmpl.permissions).forEach(([k, v]) => {
      newPerms[k] = { ...v };
    });

    setRoleForm({
      name: defaultTmpl.name,
      displayName: defaultTmpl.displayName,
      description: defaultTmpl.description,
      permissions: newPerms,
    });
    setIsModalOpen(true);
  };

  const handleApplyTemplate = (tmpl) => {
    setSelectedTemplateKey(tmpl.key);
    setRoleForm((prev) => {
      const newPerms = initEmptyMatrix(allAvailableModules);
      Object.entries(tmpl.permissions).forEach(([modKey, acts]) => {
        newPerms[modKey] = {
          view: Boolean(acts.view),
          create: Boolean(acts.create),
          edit: Boolean(acts.edit),
          delete: Boolean(acts.delete),
        };
      });

      return {
        ...prev,
        name: editingRole ? prev.name : tmpl.name,
        displayName:
          !editingRole || prev.displayName === prev.name ? tmpl.displayName : prev.displayName,
        description:
          !editingRole || !prev.description ? tmpl.description : prev.description,
        permissions: newPerms,
      };
    });
    toast.success(`Standard default permissions for "${tmpl.displayName}" loaded`);
  };

  const handleOpenEdit = (role) => {
    setEditingRole(role);
    const matchedTmpl = ROLE_TEMPLATES.find(
      (t) =>
        t.name.toLowerCase() === role.name.toLowerCase() ||
        (t.key === 'HR Manager' && (role.name === 'HR' || role.name === 'HR Manager')) ||
        (t.key === 'Team Head' && (role.name === 'Team Lead' || role.name === 'Team Head')) ||
        (t.key === 'User' && (role.name === 'Employee' || role.name === 'User')) ||
        (t.key === 'Accountant' && role.name.toLowerCase().includes('account'))
    );
    setSelectedTemplateKey(matchedTmpl ? matchedTmpl.key : null);

    const existingPerms = role.permissions || {};
    const filledPerms = {};

    allAvailableModules.forEach((m) => {
      filledPerms[m.key] = {
        view: Boolean(existingPerms[m.key]?.view),
        create: Boolean(existingPerms[m.key]?.create),
        edit: Boolean(existingPerms[m.key]?.edit),
        delete: Boolean(existingPerms[m.key]?.delete),
      };
    });

    setRoleForm({
      name: role.name,
      displayName: role.displayName || role.name,
      description: role.description || '',
      permissions: filledPerms,
    });
    setIsModalOpen(true);
  };

  const handleResetRoleDefaults = (role) => {
    Swal.fire({
      title: 'Reset to Standard Defaults?',
      text: `All permissions for '${role.displayName || role.name}' will be reset back to the standard base template.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Reset Defaults',
    }).then((result) => {
      if (result.isConfirmed) {
        resetDefaultsMutation.mutate(role._id);
      }
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
    setSelectedTemplateKey(null);
    setShowAddModuleInput(false);
    setNewModuleName('');
    setNewModuleKey('');
  };

  const handlePermissionToggle = (moduleKey, action) => {
    setRoleForm((prev) => {
      const current = prev.permissions[moduleKey] || {
        view: false, create: false, edit: false, delete: false,
      };
      const nextVal = !current[action];
      const updatedModule = { ...current, [action]: nextVal };

      if (nextVal && (action === 'create' || action === 'edit' || action === 'delete')) {
        updatedModule.view = true;
      }
      if (!nextVal && action === 'view') {
        updatedModule.create = false;
        updatedModule.edit = false;
        updatedModule.delete = false;
      }

      return {
        ...prev,
        permissions: { ...prev.permissions, [moduleKey]: updatedModule },
      };
    });
  };

  const handleRowToggle = (moduleKey) => {
    setRoleForm((prev) => {
      const current = prev.permissions[moduleKey] || {
        view: false, create: false, edit: false, delete: false,
      };
      const isFull = current.view && current.create && current.edit && current.delete;
      const nextVal = !isFull;

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [moduleKey]: {
            view: nextVal,
            create: nextVal,
            edit: nextVal,
            delete: nextVal,
          },
        },
      };
    });
  };

  const handleBulkSetPermissions = (type) => {
    setRoleForm((prev) => {
      const updated = {};
      allAvailableModules.forEach((m) => {
        if (type === 'full') {
          updated[m.key] = { view: true, create: true, edit: true, delete: true };
        } else if (type === 'read') {
          updated[m.key] = { view: true, create: false, edit: false, delete: false };
        } else {
          updated[m.key] = { view: false, create: false, edit: false, delete: false };
        }
      });
      return { ...prev, permissions: updated };
    });
  };

  const handleAddNewModule = () => {
    const rawKey =
      newModuleKey.trim() ||
      newModuleName.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
    if (!rawKey) {
      toast.error('Module name or key is required');
      return;
    }

    if (allAvailableModules.some((m) => m.key === rawKey)) {
      toast.error(`Module '${rawKey}' already exists`);
      return;
    }

    const newModuleObj = {
      key: rawKey,
      label: newModuleName.trim() || rawKey,
      icon: HiOutlineSparkles,
      desc: `Custom module: ${newModuleName || rawKey}`,
    };

    setCustomModules((prev) => [...prev, newModuleObj]);

    setRoleForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [rawKey]: { view: true, create: false, edit: false, delete: false },
      },
    }));

    toast.success(`Module '${newModuleObj.label}' added!`);
    setNewModuleName('');
    setNewModuleKey('');
    setShowAddModuleInput(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingRole) {
      updateMutation.mutate({
        id: editingRole._id,
        payload: {
          displayName: roleForm.displayName,
          description: roleForm.description,
          permissions: roleForm.permissions,
        },
      });
    } else {
      createMutation.mutate(roleForm);
    }
  };

  const handleDelete = (role) => {
    Swal.fire({
      title: 'Delete Position?',
      text: `Are you sure you want to permanently remove '${role.displayName || role.name}'?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(role._id);
      }
    });
  };

  const isDefaultCoreRole = (name) => {
    return [
      'Admin', 'HR Manager', 'HR', 'Team Head', 'Team Lead', 'User', 'Employee', 'Accountant',
    ].includes(name);
  };

  /* ---------------- Filter + metrics (UNCHANGED) ---------------- */
  const filteredRoles = useMemo(() => {
    return roles.filter((r) => {
      if (filterTab === 'default' && !r.isSystemRole && !isDefaultCoreRole(r.name)) return false;
      if (filterTab === 'custom' && (r.isSystemRole || isDefaultCoreRole(r.name))) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = r.name?.toLowerCase().includes(q);
        const displayMatch = r.displayName?.toLowerCase().includes(q);
        const descMatch = r.description?.toLowerCase().includes(q);
        if (!nameMatch && !displayMatch && !descMatch) return false;
      }
      return true;
    });
  }, [roles, filterTab, searchQuery]);

  const totalStaffCount = useMemo(
    () => roles.reduce((sum, r) => sum + (r.userCount || 0), 0),
    [roles]
  );
  const defaultRolesCount = useMemo(
    () => roles.filter((r) => r.isSystemRole || isDefaultCoreRole(r.name)).length,
    [roles]
  );
  const customRolesCount = useMemo(
    () => roles.filter((r) => !r.isSystemRole && !isDefaultCoreRole(r.name)).length,
    [roles]
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;

  /* ---------------- ESC to close modal ---------------- */
  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-6">
      {/* ===================== HEADER ===================== */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
              <HiOutlineShieldCheck className="w-3.5 h-3.5" />
              Access Control &amp; Permissions
            </span>
          </div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
            Roles &amp; Permissions Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Configure default roles (HR Manager, Team Head, Staff) and add custom positions with granular Read, Create, Edit and Delete capabilities.
          </p>
        </div>

        {/* Actions — clean wrap on mobile */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenCreate('HR Manager')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            <HiOutlineBriefcase className="w-3.5 h-3.5" />
            HR
          </button>
          <button
            type="button"
            onClick={() => handleOpenCreate('Team Head')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            <HiOutlineUserGroup className="w-3.5 h-3.5" />
            Team Head
          </button>
          <button
            type="button"
            onClick={() => handleOpenCreate('User')}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            <HiOutlineUser className="w-3.5 h-3.5" />
            Staff
          </button>
          <button
            type="button"
            onClick={() => handleOpenCreate('Accountant')}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            <HiOutlineBanknotes className="w-3.5 h-3.5" />
            Accountant
          </button>
          <button
            type="button"
            onClick={() => handleOpenCreate()}
            className={`${tokens.btnPrimary} w-full sm:w-auto px-4 py-2.5 text-sm`}
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span>Create Custom Role</span>
          </button>
        </div>
      </div>

      {/* ===================== METRICS ===================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Roles',
            value: roles.length,
            Icon: HiOutlineShieldCheck,
            iconBg: 'bg-indigo-50 border-indigo-200 text-indigo-600',
            valueColor: 'text-slate-900',
          },
          {
            label: 'System Core',
            value: defaultRolesCount,
            Icon: HiOutlineCheckBadge,
            iconBg: 'bg-emerald-50 border-emerald-200 text-emerald-600',
            valueColor: 'text-emerald-600',
          },
          {
            label: 'Custom Positions',
            value: customRolesCount,
            Icon: HiOutlineSparkles,
            iconBg: 'bg-purple-50 border-purple-200 text-purple-600',
            valueColor: 'text-indigo-700',
          },
          {
            label: 'Assigned Staff',
            value: totalStaffCount,
            Icon: HiOutlineUsers,
            iconBg: 'bg-blue-50 border-blue-200 text-blue-600',
            valueColor: 'text-blue-600',
          },
        ].map(({ label, value, Icon, iconBg, valueColor }) => (
          <div key={label} className={`${tokens.card} p-3.5 sm:p-4 flex items-center justify-between`}>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">{label}</p>
              <p className={`text-xl sm:text-2xl font-bold mt-0.5 ${valueColor}`}>{value}</p>
            </div>
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}>
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* ===================== FILTER BAR ===================== */}
      <div className={`${tokens.card} p-3 sm:p-3.5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3`}>
        <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-1 gap-1 overflow-x-auto">
          {[
            { key: 'all', label: `All Roles (${roles.length})` },
            { key: 'default', label: `Default Roles` },
            { key: 'custom', label: `Custom (${customRolesCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${filterTab === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roles or positions…"
            className={`${tokens.input} pl-9 text-xs`}
          />
        </div>
      </div>

      {/* ===================== ROLES LIST ===================== */}
      <div className={`${tokens.card} overflow-hidden`}>
        {isLoading ? (
          <Loader />
        ) : filteredRoles.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <HiOutlineShieldCheck className="w-7 h-7" />
            </div>
            <p className="font-semibold text-slate-900 mb-1">No matching roles found</p>
            <p className="text-xs text-slate-500">
              Try adjusting your search query or create a new role.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredRoles.map((role) => {
              const isSystemAdmin = role.name === 'Admin';
              const isDefaultCore = role.isSystemRole || isDefaultCoreRole(role.name);
              const isExpanded = expandedRoleId === role._id;
              const styling = getRoleStyling(role.name);
              const RoleIconComp = getRoleIcon(role.name);

              const permEntries = Object.entries(role.permissions || {});
              const allowedModules = permEntries.filter(([_, act]) => act?.view);

              return (
                <li key={role._id} className="group">
                  {/* ---------- ROW ---------- */}
                  <div className="p-4 hover:bg-slate-50/70 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      {/* Left: icon + name + badges */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${styling.bg} ${styling.border} ${styling.text}`}>
                          <RoleIconComp className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-sm truncate">
                              {role.displayName || role.name}
                            </h3>

                            {/* Type badges inline on mobile */}
                            {isSystemAdmin ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <HiOutlineShieldCheck className="w-3 h-3" />
                                System Admin
                              </span>
                            ) : isDefaultCore ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                <HiOutlineCheckBadge className="w-3 h-3 text-emerald-600" />
                                Default
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                <HiOutlineSparkles className="w-3 h-3" />
                                Custom
                              </span>
                            )}

                            {/* Staff count chip */}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                              <HiOutlineUsers className="w-3 h-3 text-indigo-600" />
                              {role.userCount || 0}
                            </span>
                          </div>

                          <p className="text-[11px] font-mono text-indigo-600 mt-1 truncate">
                            ID: <span className="text-slate-500">{role.name}</span>
                          </p>

                          {role.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 sm:line-clamp-1">
                              {role.description}
                            </p>
                          )}

                          {/* Modules summary — mobile only */}
                          <div className="lg:hidden mt-2 flex flex-wrap gap-1">
                            {isSystemAdmin ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                <HiOutlineShieldCheck className="w-3 h-3" />
                                All Modules
                              </span>
                            ) : allowedModules.length > 0 ? (
                              <>
                                {allowedModules.slice(0, 3).map(([mod, act]) => (
                                  <span
                                    key={mod}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 border border-slate-200 text-slate-700"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    {mod.charAt(0).toUpperCase() + mod.slice(1)}
                                    <span className="text-[9px] text-slate-500">
                                      (
                                      {[act.create && 'C', act.edit && 'E', act.delete && 'D']
                                        .filter(Boolean)
                                        .join('') || 'R'}
                                      )
                                    </span>
                                  </span>
                                ))}
                                {allowedModules.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    +{allowedModules.length - 3}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">
                                No modules granted
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: modules summary (desktop) + actions */}
                      <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 shrink-0">
                        {/* Desktop modules summary */}
                        <div className="hidden lg:block max-w-[280px]">
                          {isSystemAdmin ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                              <HiOutlineShieldCheck className="w-3.5 h-3.5" />
                              All Modules (Unrestricted)
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {allowedModules.slice(0, 3).map(([mod, act]) => (
                                <span
                                  key={mod}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 border border-slate-200 text-slate-700"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  {mod.charAt(0).toUpperCase() + mod.slice(1)}
                                  <span className="text-[9px] text-slate-500">
                                    (
                                    {[act.create && 'C', act.edit && 'E', act.delete && 'D']
                                      .filter(Boolean)
                                      .join('') || 'R'}
                                    )
                                  </span>
                                </span>
                              ))}
                              {allowedModules.length > 3 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  +{allowedModules.length - 3}
                                </span>
                              )}
                              {allowedModules.length === 0 && (
                                <span className="text-[11px] text-slate-400 italic">
                                  No modules granted
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setExpandedRoleId(isExpanded ? null : role._id)}
                            className={`${tokens.btnSecondary} px-2.5 py-1.5 text-xs`}
                          >
                            <span>{isExpanded ? 'Hide' : 'Permissions'}</span>
                            <HiOutlineChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </button>

                          {!isSystemAdmin && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(role)}
                              className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                            >
                              <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                          )}

                          {isDefaultCore && !isSystemAdmin && (
                            <button
                              type="button"
                              onClick={() => handleResetRoleDefaults(role)}
                              title="Reset all permissions to standard default template"
                              className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                            >
                              <HiOutlineArrowPath className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Reset</span>
                            </button>
                          )}

                          {!isDefaultCore && (
                            <button
                              type="button"
                              onClick={() => handleDelete(role)}
                              title="Delete Role"
                              aria-label="Delete role"
                              className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                            >
                              <HiOutlineTrash className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ---------- EXPANDED PERMISSIONS ---------- */}
                  {isExpanded && (
                    <div className="px-4 pb-4 bg-slate-50 border-t border-slate-200">
                      <div className="flex flex-wrap justify-between items-center gap-2 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                          <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                            Permissions for {role.displayName || role.name}
                          </h4>
                        </div>
                        {!isSystemAdmin && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(role)}
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1"
                          >
                            <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                            Modify Matrix
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {allAvailableModules.map((mod) => {
                          const perm =
                            role.permissions?.[mod.key] || {
                              view: false, create: false, edit: false, delete: false,
                            };
                          const hasAny = perm.view || perm.create || perm.edit || perm.delete;
                          const ModIcon = mod.icon || HiOutlineSparkles;

                          return (
                            <div
                              key={mod.key}
                              className={`p-2.5 rounded-lg border transition-all ${hasAny
                                ? 'bg-white border-slate-200'
                                : 'bg-slate-100/60 border-slate-200 opacity-60'
                                }`}
                            >
                              <div className="flex items-center gap-1.5 font-semibold text-[11px] text-slate-900 mb-2">
                                <ModIcon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span className="truncate">{mod.label}</span>
                              </div>

                              <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                                <div
                                  className={`py-1 rounded font-semibold ${perm.view
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-400'
                                    }`}
                                  title="View"
                                >
                                  R
                                </div>
                                <div
                                  className={`py-1 rounded font-semibold ${perm.create
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    : 'bg-slate-100 text-slate-400'
                                    }`}
                                  title="Create"
                                >
                                  C
                                </div>
                                <div
                                  className={`py-1 rounded font-semibold ${perm.edit
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-slate-100 text-slate-400'
                                    }`}
                                  title="Edit"
                                >
                                  E
                                </div>
                                <div
                                  className={`py-1 rounded font-semibold ${perm.delete
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-slate-100 text-slate-400'
                                    }`}
                                  title="Delete"
                                >
                                  D
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ===================== CREATE / EDIT MODAL ===================== */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-3 md:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-modal-title"
        >
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl border-0 sm:border border-slate-200 shadow-2xl w-full sm:max-w-5xl h-[96dvh] sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 flex justify-between items-center gap-3 shrink-0 bg-slate-50">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
                  <HiOutlineShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h3
                    id="role-modal-title"
                    className="text-sm sm:text-lg font-bold text-slate-900 truncate"
                  >
                    {editingRole
                      ? `Edit: ${editingRole.displayName || editingRole.name}`
                      : 'Create New Position & Permissions'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 hidden sm:block">
                    Assign fine-grained access (View, Create, Edit, Delete) across modules.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 -mr-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors shrink-0"
                aria-label="Close"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form
              id="role-matrix-form"
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5"
            >
              {/* ---------- TEMPLATE SELECTOR ---------- */}
              <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                      <HiOutlineSparkles className="w-3.5 h-3.5" />
                      Select Base Role Template
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pick a template to instantly apply default capabilities.
                    </p>
                  </div>
                  {selectedTemplateKey && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      "{selectedTemplateKey}" Loaded
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ROLE_TEMPLATES.map((tmpl) => {
                    const isSelected =
                      selectedTemplateKey === tmpl.key ||
                      (!editingRole && roleForm.name === tmpl.name);
                    const TmplIcon = tmpl.icon;
                    return (
                      <button
                        key={tmpl.key}
                        type="button"
                        onClick={() => handleApplyTemplate(tmpl)}
                        className={`p-2.5 rounded-lg border text-left transition-all relative ${isSelected
                          ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                              }`}
                          >
                            <TmplIcon className="w-3.5 h-3.5" />
                          </div>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${isSelected
                              ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                          >
                            {tmpl.badge}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-slate-900 truncate">
                          {tmpl.displayName}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {tmpl.category}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ---------- BASIC INFO ---------- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className={tokens.label}>Role Display Name *</label>
                  <input
                    type="text"
                    required
                    value={roleForm.displayName}
                    onChange={(e) =>
                      setRoleForm((prev) => ({ ...prev, displayName: e.target.value }))
                    }
                    placeholder="e.g. Senior Accountant"
                    className={tokens.input}
                  />
                </div>

                <div>
                  <label className={tokens.label}>
                    Unique System Key *{' '}
                    {editingRole && <span className="text-slate-400 font-normal">(Permanent)</span>}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingRole}
                    value={roleForm.name}
                    onChange={(e) => setRoleForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Accountant"
                    className={tokens.input}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={tokens.label}>Position Purpose / Description</label>
                  <textarea
                    rows={2}
                    value={roleForm.description}
                    onChange={(e) =>
                      setRoleForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Describe responsibility scope, reporting structure…"
                    className={`${tokens.input} resize-none`}
                  />
                </div>
              </div>

              {/* ---------- PERMISSIONS MATRIX ---------- */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Modular Capabilities Matrix
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Toggle View, Create, Edit, and Delete actions.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedTemplateKey && (
                      <button
                        type="button"
                        onClick={() => {
                          const tmpl = ROLE_TEMPLATES.find((t) => t.key === selectedTemplateKey);
                          if (tmpl) handleApplyTemplate(tmpl);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <HiOutlineArrowPath className="w-3 h-3" />
                        Reset
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleBulkSetPermissions('full')}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <HiOutlineCheck className="w-3 h-3" />
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkSetPermissions('read')}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                    >
                      <HiOutlineEye className="w-3 h-3" />
                      Read
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkSetPermissions('clear')}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <HiOutlineXMark className="w-3 h-3" />
                      Clear
                    </button>
                  </div>
                </div>

                {/* Matrix — scrollable on mobile */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700 min-w-[600px]">
                      <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-3 py-2.5">Module</th>
                          <th className="px-2 py-2.5 text-center w-16">View</th>
                          <th className="px-2 py-2.5 text-center w-16">Create</th>
                          <th className="px-2 py-2.5 text-center w-16">Edit</th>
                          <th className="px-2 py-2.5 text-center w-16">Delete</th>
                          <th className="px-2 py-2.5 text-right w-20">Row</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {allAvailableModules.map((mod) => {
                          const perm =
                            roleForm.permissions[mod.key] || {
                              view: false, create: false, edit: false, delete: false,
                            };
                          const activeTemplate = ROLE_TEMPLATES.find(
                            (t) => t.key === selectedTemplateKey
                          );
                          const ModIcon = mod.icon || HiOutlineSparkles;

                          return (
                            <tr key={mod.key} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-3 py-2.5">
                                <div className="font-bold text-slate-900 text-[11px] flex items-center gap-1.5">
                                  <div className="w-5 h-5 rounded bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
                                    <ModIcon className="w-3 h-3" />
                                  </div>
                                  <span className="truncate">{mod.label}</span>
                                  {activeTemplate?.permissions?.[mod.key]?.view && (
                                    <span className="hidden sm:inline text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded shrink-0">
                                      Base
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 ml-6.5 line-clamp-1">
                                  {mod.desc}
                                </div>
                              </td>

                              {['view', 'create', 'edit', 'delete'].map((action) => (
                                <td key={action} className="px-2 py-2.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={perm[action]}
                                    onChange={() => handlePermissionToggle(mod.key, action)}
                                    className={`w-4 h-4 rounded cursor-pointer ${action === 'delete'
                                      ? 'text-rose-600 border-slate-300 focus:ring-rose-500'
                                      : 'text-indigo-600 border-slate-300 focus:ring-indigo-500'
                                      } ${activeTemplate?.permissions?.[mod.key]?.[action]
                                        ? action === 'delete'
                                          ? 'ring-1 ring-rose-400'
                                          : 'ring-1 ring-emerald-400'
                                        : ''
                                      }`}
                                  />
                                </td>
                              ))}

                              <td className="px-2 py-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRowToggle(mod.key)}
                                  className="text-[10px] font-semibold text-indigo-700 hover:text-indigo-800 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 cursor-pointer"
                                  title="Toggle all for this row"
                                >
                                  <HiOutlineArrowsRightLeft className="w-2.5 h-2.5" />
                                  All
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Add Custom Module */}
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                      <HiOutlineSparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Extend System with Custom Module
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      e.g. Inventory, CRM Leads, Fleet, etc.
                    </span>
                  </div>

                  {!showAddModuleInput ? (
                    <button
                      type="button"
                      onClick={() => setShowAddModuleInput(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-indigo-700 border border-slate-300 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
                    >
                      <HiOutlinePlus className="w-3 h-3" />
                      Add Module
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <input
                        type="text"
                        value={newModuleName}
                        onChange={(e) => setNewModuleName(e.target.value)}
                        placeholder="Module name"
                        className="flex-1 sm:flex-initial sm:w-40 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-900 outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewModule}
                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition-colors shrink-0"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddModuleInput(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 shrink-0"
                        aria-label="Cancel"
                      >
                        <HiOutlineXMark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </form>

            {/* Sticky Footer */}
            <div className="border-t border-slate-200 px-4 sm:px-5 py-3 flex items-center justify-end gap-2 shrink-0 bg-white">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className={`${tokens.btnSecondary} px-4 py-2.5 text-sm`}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="role-matrix-form"
                disabled={isSaving}
                className={`${tokens.btnPrimary} px-4 py-2.5 text-sm`}
              >
                {isSaving && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <HiOutlineCheck className="w-4 h-4" />
                <span>
                  {editingRole
                    ? isSaving
                      ? 'Updating…'
                      : 'Update Permissions'
                    : isSaving
                      ? 'Creating…'
                      : 'Create Role'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPage;