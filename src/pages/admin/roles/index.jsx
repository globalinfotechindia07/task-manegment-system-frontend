import { useState, useMemo } from 'react';
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
  HiOutlineMinus
} from 'react-icons/hi2';

// Standard System Module Definitions
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
  { key: 'settings', label: 'Office Roles & Settings', icon: HiOutlineCog6Tooth, desc: 'Role permissions, office policies, and system defaults.' }
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
      settings: { view: false, create: false, edit: false, delete: false }
    }
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
      settings: { view: false, create: false, edit: false, delete: false }
    }
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
      settings: { view: false, create: false, edit: false, delete: false }
    }
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
      settings: { view: false, create: false, edit: false, delete: false }
    }
  }
];

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
    return {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      tag: 'border-amber-200 bg-amber-50 text-amber-800'
    };
  }
  if (r === 'hr manager' || r === 'hr') {
    return {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      tag: 'border-purple-200 bg-purple-50 text-purple-800'
    };
  }
  if (r === 'team head' || r === 'team lead') {
    return {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      tag: 'border-blue-200 bg-blue-50 text-blue-800'
    };
  }
  if (r === 'user' || r === 'employee') {
    return {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      tag: 'border-emerald-200 bg-emerald-50 text-emerald-800'
    };
  }
  if (r === 'accountant') {
    return {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      tag: 'border-amber-200 bg-amber-50 text-amber-800'
    };
  }
  return {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    tag: 'border-indigo-200 bg-indigo-50 text-indigo-800'
  };
};

const RolesPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [filterTab, setFilterTab] = useState('all'); // 'all', 'default', 'custom'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRoleId, setExpandedRoleId] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: {}
  });

  // Custom module addition in modal
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleKey, setNewModuleKey] = useState('');
  const [showAddModuleInput, setShowAddModuleInput] = useState(false);
  const [customModules, setCustomModules] = useState([]);

  // Fetch Roles
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await api.get('/roles');
      return Array.isArray(data) ? data : [];
    }
  });

  // Calculate all active module keys from all roles
  const allAvailableModules = useMemo(() => {
    const defaultKeys = new Set(DEFAULT_MODULE_DEFINITIONS.map(m => m.key));
    const dynamicList = [...DEFAULT_MODULE_DEFINITIONS];

    roles.forEach(r => {
      if (r.permissions && typeof r.permissions === 'object') {
        Object.keys(r.permissions).forEach(k => {
          if (!defaultKeys.has(k) && !dynamicList.some(m => m.key === k)) {
            dynamicList.push({
              key: k,
              label: k.charAt(0).toUpperCase() + k.slice(1),
              icon: HiOutlineSparkles,
              desc: `Custom module: ${k}`
            });
          }
        });
      }
    });

    customModules.forEach(cm => {
      if (!dynamicList.some(m => m.key === cm.key)) {
        dynamicList.push(cm);
      }
    });

    return dynamicList;
  }, [roles, customModules]);

  const initEmptyMatrix = (modules) => {
    const matrix = {};
    modules.forEach(m => {
      matrix[m.key] = { view: false, create: false, edit: false, delete: false };
    });
    return matrix;
  };

  // Create Role Mutation
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
    }
  });

  // Update Role Mutation
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
    }
  });

  // Delete Role Mutation
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
    }
  });

  // Reset Defaults Mutation
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
    }
  });

  const handleOpenCreate = (presetKey = null) => {
    setEditingRole(null);
    setShowAddModuleInput(false);

    if (presetKey) {
      const tmpl = ROLE_TEMPLATES.find(t => t.key === presetKey);
      if (tmpl) {
        handleApplyTemplate(tmpl);
        setIsModalOpen(true);
        return;
      }
    }

    const defaultTmpl = ROLE_TEMPLATES[0]; // HR Manager
    setSelectedTemplateKey(defaultTmpl.key);
    const newPerms = initEmptyMatrix(allAvailableModules);
    Object.entries(defaultTmpl.permissions).forEach(([k, v]) => {
      newPerms[k] = { ...v };
    });

    setRoleForm({
      name: defaultTmpl.name,
      displayName: defaultTmpl.displayName,
      description: defaultTmpl.description,
      permissions: newPerms
    });
    setIsModalOpen(true);
  };

  const handleApplyTemplate = (tmpl) => {
    setSelectedTemplateKey(tmpl.key);
    setRoleForm(prev => {
      const newPerms = initEmptyMatrix(allAvailableModules);
      Object.entries(tmpl.permissions).forEach(([modKey, acts]) => {
        newPerms[modKey] = {
          view: Boolean(acts.view),
          create: Boolean(acts.create),
          edit: Boolean(acts.edit),
          delete: Boolean(acts.delete)
        };
      });

      return {
        ...prev,
        name: editingRole ? prev.name : tmpl.name,
        displayName: (!editingRole || prev.displayName === prev.name) ? tmpl.displayName : prev.displayName,
        description: (!editingRole || !prev.description) ? tmpl.description : prev.description,
        permissions: newPerms
      };
    });
    toast.success(`Standard default permissions for "${tmpl.displayName}" loaded`);
  };

  const handleOpenEdit = (role) => {
    setEditingRole(role);
    const matchedTmpl = ROLE_TEMPLATES.find(t => 
      t.name.toLowerCase() === role.name.toLowerCase() || 
      (t.key === 'HR Manager' && (role.name === 'HR' || role.name === 'HR Manager')) ||
      (t.key === 'Team Head' && (role.name === 'Team Lead' || role.name === 'Team Head')) ||
      (t.key === 'User' && (role.name === 'Employee' || role.name === 'User')) ||
      (t.key === 'Accountant' && role.name.toLowerCase().includes('account'))
    );
    setSelectedTemplateKey(matchedTmpl ? matchedTmpl.key : null);

    const existingPerms = role.permissions || {};
    const filledPerms = {};

    allAvailableModules.forEach(m => {
      filledPerms[m.key] = {
        view: Boolean(existingPerms[m.key]?.view),
        create: Boolean(existingPerms[m.key]?.create),
        edit: Boolean(existingPerms[m.key]?.edit),
        delete: Boolean(existingPerms[m.key]?.delete)
      };
    });

    setRoleForm({
      name: role.name,
      displayName: role.displayName || role.name,
      description: role.description || '',
      permissions: filledPerms
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
      confirmButtonText: 'Yes, Reset Defaults'
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
    setRoleForm(prev => {
      const current = prev.permissions[moduleKey] || { view: false, create: false, edit: false, delete: false };
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
        permissions: {
          ...prev.permissions,
          [moduleKey]: updatedModule
        }
      };
    });
  };

  const handleRowToggle = (moduleKey) => {
    setRoleForm(prev => {
      const current = prev.permissions[moduleKey] || { view: false, create: false, edit: false, delete: false };
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
            delete: nextVal
          }
        }
      };
    });
  };

  const handleBulkSetPermissions = (type) => {
    setRoleForm(prev => {
      const updated = {};
      allAvailableModules.forEach(m => {
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
    const rawKey = newModuleKey.trim() || newModuleName.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
    if (!rawKey) {
      toast.error('Module name or key is required');
      return;
    }

    if (allAvailableModules.some(m => m.key === rawKey)) {
      toast.error(`Module '${rawKey}' already exists`);
      return;
    }

    const newModuleObj = {
      key: rawKey,
      label: newModuleName.trim() || rawKey,
      icon: HiOutlineSparkles,
      desc: `Custom module: ${newModuleName || rawKey}`
    };

    setCustomModules(prev => [...prev, newModuleObj]);

    setRoleForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [rawKey]: { view: true, create: false, edit: false, delete: false }
      }
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
          permissions: roleForm.permissions
        }
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
      confirmButtonText: 'Yes, Delete'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(role._id);
      }
    });
  };

  const isDefaultCoreRole = (name) => {
    return ['Admin', 'HR Manager', 'HR', 'Team Head', 'Team Lead', 'User', 'Employee', 'Accountant'].includes(name);
  };

  const filteredRoles = useMemo(() => {
    return roles.filter(r => {
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

  // Metrics
  const totalStaffCount = useMemo(() => {
    return roles.reduce((sum, r) => sum + (r.userCount || 0), 0);
  }, [roles]);

  const defaultRolesCount = useMemo(() => {
    return roles.filter(r => r.isSystemRole || isDefaultCoreRole(r.name)).length;
  }, [roles]);

  const customRolesCount = useMemo(() => {
    return roles.filter(r => !r.isSystemRole && !isDefaultCoreRole(r.name)).length;
  }, [roles]);

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
              <HiOutlineShieldCheck className="w-4 h-4 text-indigo-400" />
              Access Control & Permissions
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Roles & Permissions Matrix
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Configure default roles (HR Manager, Team Head, Staff) and add custom positions with granular Read, Create, Edit and Delete capabilities.
          </p>
        </div>

        {/* Action Buttons with React Icons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleOpenCreate('HR Manager')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <HiOutlineBriefcase className="w-4 h-4 text-purple-600" />
            + HR Role
          </button>
          <button
            onClick={() => handleOpenCreate('Team Head')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <HiOutlineUserGroup className="w-4 h-4 text-blue-600" />
            + Team Head
          </button>
          <button
            onClick={() => handleOpenCreate('User')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <HiOutlineUser className="w-4 h-4 text-emerald-600" />
            + Staff Role
          </button>
          <button
            onClick={() => handleOpenCreate('Accountant')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <HiOutlineBanknotes className="w-4 h-4 text-amber-600" />
            + Accountant
          </button>
          <button
            onClick={() => handleOpenCreate()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs whitespace-nowrap"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Create Custom Role
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Configured Roles</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{roles.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <HiOutlineShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">System Core Roles</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{defaultRolesCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <HiOutlineCheckBadge className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Custom Positions</p>
            <p className="text-2xl font-bold text-indigo-700 mt-0.5">{customRolesCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <HiOutlineSparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Assigned Staff</p>
            <p className="text-2xl font-bold text-blue-600 mt-0.5">{totalStaffCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <HiOutlineUsers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 shadow-xs">
        {/* Tabs */}
        <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-1 gap-1">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Roles ({roles.length})
          </button>
          <button
            onClick={() => setFilterTab('default')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'default' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Default Roles
          </button>
          <button
            onClick={() => setFilterTab('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'custom' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Custom Positions ({customRolesCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roles or positions..."
            className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-600 transition-colors shadow-xs"
          />
        </div>
      </div>

      {/* Roles List Table View */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-16 flex justify-center">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <HiOutlineShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-white mb-1">No matching roles found</p>
            <p className="text-xs text-slate-500">Try adjusting your search query or create a new role.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Role / Position</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Staff Count</th>
                  <th className="px-6 py-4">Allowed Modules Summary</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRoles.map(role => {
                  const isSystemAdmin = role.name === 'Admin';
                  const isDefaultCore = role.isSystemRole || isDefaultCoreRole(role.name);
                  const isExpanded = expandedRoleId === role._id;
                  const styling = getRoleStyling(role.name);
                  const RoleIconComp = getRoleIcon(role.name);

                  const permEntries = Object.entries(role.permissions || {});
                  const allowedModules = permEntries.filter(([_, act]) => act?.view);

                  return (
                    <tr key={role._id} className="group">
                      <td colSpan="5" className="p-0">
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between p-4 sm:px-6 hover:bg-slate-50 transition-colors border-b border-slate-100">
                            {/* Role Name & Icon */}
                            <div className="flex items-center gap-3.5 min-w-[240px]">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${styling.bg} ${styling.border} ${styling.text}`}>
                                <RoleIconComp className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                  {role.displayName || role.name}
                                </div>
                                <div className="text-[11px] font-mono text-indigo-600 mt-0.5">
                                  ID: <span className="text-slate-500">{role.name}</span>
                                </div>
                                {role.description && (
                                  <p className="text-xs text-slate-500 mt-0.5 max-w-sm line-clamp-1">{role.description}</p>
                                )}
                              </div>
                            </div>

                            {/* Role Type */}
                            <div className="hidden sm:block min-w-[150px]">
                              {isSystemAdmin ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <HiOutlineShieldCheck className="w-3.5 h-3.5" />
                                  Full System Admin
                                </span>
                              ) : isDefaultCore ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                  <HiOutlineCheckBadge className="w-3.5 h-3.5 text-emerald-600" />
                                  Default Core Role
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  <HiOutlineSparkles className="w-3.5 h-3.5" />
                                  Custom Position
                                </span>
                              )}
                            </div>

                            {/* Staff Count */}
                            <div className="hidden md:block min-w-[110px]">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700">
                                <HiOutlineUsers className="w-3.5 h-3.5 text-indigo-600" />
                                {role.userCount || 0} Staff
                              </span>
                            </div>

                            {/* Allowed Modules Summary */}
                            <div className="hidden lg:block flex-1 px-4">
                              {isSystemAdmin ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                                  <HiOutlineShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                                  All Modules (Unrestricted Access)
                                </span>
                              ) : (
                                <div className="flex flex-wrap gap-1 max-w-md">
                                  {allowedModules.slice(0, 4).map(([mod, act]) => (
                                    <span key={mod} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 border border-slate-200 text-slate-700">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      {mod.charAt(0).toUpperCase() + mod.slice(1)}
                                      <span className="text-[10px] text-slate-500">
                                        ({[act.create && 'C', act.edit && 'E', act.delete && 'D'].filter(Boolean).join('') || 'R'})
                                      </span>
                                    </span>
                                  ))}
                                  {allowedModules.length > 4 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                      +{allowedModules.length - 4} more
                                    </span>
                                  )}
                                  {allowedModules.length === 0 && (
                                    <span className="text-xs text-slate-500 italic">No modules granted</span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setExpandedRoleId(isExpanded ? null : role._id)}
                                className="px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-300 transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <span>{isExpanded ? 'Hide' : 'Permissions'}</span>
                                <HiOutlineChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>

                              {!isSystemAdmin && (
                                <button
                                  onClick={() => handleOpenEdit(role)}
                                  className="px-2.5 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                                  Edit
                                </button>
                              )}

                              {isDefaultCore && !isSystemAdmin && (
                                <button
                                  onClick={() => handleResetRoleDefaults(role)}
                                  title="Reset all permissions to standard default template"
                                  className="px-2.5 py-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <HiOutlineArrowPath className="w-3.5 h-3.5 text-amber-600" />
                                  Reset
                                </button>
                              )}

                              {!isDefaultCore && (
                                <button
                                  onClick={() => handleDelete(role)}
                                  title="Delete Role"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                                >
                                  <HiOutlineTrash className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expanded Permissions Drawer */}
                          {isExpanded && (
                            <div className="p-5 bg-slate-50 border-b border-slate-200 animate-in fade-in slide-in-from-top-1 duration-200">
                              <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                    Resolved Permissions Grid for {role.displayName || role.name}
                                  </h4>
                                </div>
                                {!isSystemAdmin && (
                                  <button
                                    onClick={() => handleOpenEdit(role)}
                                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                                    Modify Matrix
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                                {allAvailableModules.map(mod => {
                                  const perm = role.permissions?.[mod.key] || { view: false, create: false, edit: false, delete: false };
                                  const hasAny = perm.view || perm.create || perm.edit || perm.delete;
                                  const ModIcon = mod.icon || HiOutlineSparkles;

                                  return (
                                    <div
                                      key={mod.key}
                                      className={`p-3 rounded-xl border transition-all ${
                                        hasAny
                                          ? 'bg-white border-slate-200 shadow-xs'
                                          : 'bg-slate-100/60 border-slate-200 opacity-60'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900 mb-2 truncate">
                                        <ModIcon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                        <span className="truncate">{mod.label}</span>
                                      </div>

                                      <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                                        <div className={`p-1 rounded ${perm.view ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
                                          R
                                        </div>
                                        <div className={`p-1 rounded ${perm.create ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200' : 'bg-slate-100 text-slate-400'}`}>
                                          C
                                        </div>
                                        <div className={`p-1 rounded ${perm.edit ? 'bg-amber-50 text-amber-700 font-bold border border-amber-200' : 'bg-slate-100 text-slate-400'}`}>
                                          E
                                        </div>
                                        <div className={`p-1 rounded ${perm.delete ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200' : 'bg-slate-100 text-slate-400'}`}>
                                          D
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={closeModal}></div>
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex justify-between items-center shrink-0 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <HiOutlineShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    {editingRole ? `Edit Role: ${editingRole.displayName || editingRole.name}` : 'Create New Position & Permissions'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Assign fine-grained access (View, Create, Edit, Delete) across software modules.
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form id="role-matrix-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Quick Base Role Template Cards */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2.5">
                  <div>
                    <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                      <HiOutlineSparkles className="w-4 h-4 text-indigo-600" />
                      Select Base Role Template (Loads Default Permissions)
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pick a template to instantly apply default capabilities for HR, Team Head, Staff or Accountant.
                    </p>
                  </div>

                  {selectedTemplateKey && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      "{selectedTemplateKey}" Defaults Loaded
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
                  {ROLE_TEMPLATES.map(tmpl => {
                    const isSelected = selectedTemplateKey === tmpl.key || (!editingRole && roleForm.name === tmpl.name);
                    const TmplIcon = tmpl.icon;
                    return (
                      <button
                        key={tmpl.key}
                        type="button"
                        onClick={() => handleApplyTemplate(tmpl)}
                        className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:text-indigo-600'
                          }`}>
                            <TmplIcon className="w-4 h-4" />
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isSelected ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {tmpl.badge}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 truncate">{tmpl.displayName}</div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">{tmpl.category}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Role Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Role Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={roleForm.displayName}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="e.g. Senior Accountant / Operations Lead"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Unique System Key * {editingRole && <span className="text-slate-400 font-normal">(Permanent)</span>}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingRole}
                    value={roleForm.name}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Accountant or Operations_Manager"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50 disabled:bg-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Position Purpose / Description
                  </label>
                  <textarea
                    rows={2}
                    value={roleForm.description}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe responsibility scope, reporting structure, or department ownership..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none transition-all"
                  />
                </div>
              </div>

              {/* Permissions Header & Bulk Tools */}
              <div className="border-t border-slate-200 pt-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      Modular Capabilities Matrix
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">Toggle exact View, Create, Edit, and Delete actions below.</p>
                  </div>

                  {/* Bulk Actions with React Icons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedTemplateKey && (
                      <button
                        type="button"
                        onClick={() => {
                          const tmpl = ROLE_TEMPLATES.find(t => t.key === selectedTemplateKey);
                          if (tmpl) handleApplyTemplate(tmpl);
                        }}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <HiOutlineArrowPath className="w-3.5 h-3.5" />
                        Reset to {selectedTemplateKey} Defaults
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleBulkSetPermissions('full')}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <HiOutlineCheck className="w-3.5 h-3.5" />
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkSetPermissions('read')}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <HiOutlineEye className="w-3.5 h-3.5" />
                      Read-Only
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkSetPermissions('clear')}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <HiOutlineXMark className="w-3.5 h-3.5" />
                      Clear
                    </button>
                  </div>
                </div>

                {/* Modules Matrix Table */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Module / Capability</th>
                        <th className="px-4 py-3 text-center">View (Read)</th>
                        <th className="px-4 py-3 text-center">Create (Add)</th>
                        <th className="px-4 py-3 text-center">Edit (Update)</th>
                        <th className="px-4 py-3 text-center">Delete (Remove)</th>
                        <th className="px-4 py-3 text-right">Row Toggle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allAvailableModules.map(mod => {
                        const perm = roleForm.permissions[mod.key] || { view: false, create: false, edit: false, delete: false };
                        const activeTemplate = ROLE_TEMPLATES.find(t => t.key === selectedTemplateKey);
                        const ModIcon = mod.icon || HiOutlineSparkles;

                        return (
                          <tr key={mod.key} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
                                  <ModIcon className="w-3.5 h-3.5" />
                                </div>
                                <span>{mod.label}</span>
                                {activeTemplate?.permissions?.[mod.key]?.view && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                    Base Default
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 ml-8">{mod.desc}</div>
                            </td>

                            {/* View */}
                            <td className="px-4 py-3 text-center">
                              <div className="inline-flex items-center gap-1 justify-center">
                                <input
                                  type="checkbox"
                                  checked={perm.view}
                                  onChange={() => handlePermissionToggle(mod.key, 'view')}
                                  className={`w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer ${
                                    activeTemplate?.permissions?.[mod.key]?.view ? 'ring-1 ring-emerald-500' : ''
                                  }`}
                                />
                                {perm.view && activeTemplate && !activeTemplate.permissions?.[mod.key]?.view && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded">
                                    <HiOutlinePlus className="w-2.5 h-2.5" /> Added
                                  </span>
                                )}
                                {!perm.view && activeTemplate?.permissions?.[mod.key]?.view && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded">
                                    <HiOutlineMinus className="w-2.5 h-2.5" /> Revoked
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Create */}
                            <td className="px-4 py-3 text-center">
                              <div className="inline-flex items-center gap-1 justify-center">
                                <input
                                  type="checkbox"
                                  checked={perm.create}
                                  onChange={() => handlePermissionToggle(mod.key, 'create')}
                                  className={`w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer ${
                                    activeTemplate?.permissions?.[mod.key]?.create ? 'ring-1 ring-emerald-500' : ''
                                  }`}
                                />
                                {perm.create && activeTemplate && !activeTemplate.permissions?.[mod.key]?.create && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded">
                                    <HiOutlinePlus className="w-2.5 h-2.5" /> Added
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Edit */}
                            <td className="px-4 py-3 text-center">
                              <div className="inline-flex items-center gap-1 justify-center">
                                <input
                                  type="checkbox"
                                  checked={perm.edit}
                                  onChange={() => handlePermissionToggle(mod.key, 'edit')}
                                  className={`w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer ${
                                    activeTemplate?.permissions?.[mod.key]?.edit ? 'ring-1 ring-emerald-500' : ''
                                  }`}
                                />
                                {perm.edit && activeTemplate && !activeTemplate.permissions?.[mod.key]?.edit && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded">
                                    <HiOutlinePlus className="w-2.5 h-2.5" /> Added
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Delete */}
                            <td className="px-4 py-3 text-center">
                              <div className="inline-flex items-center gap-1 justify-center">
                                <input
                                  type="checkbox"
                                  checked={perm.delete}
                                  onChange={() => handlePermissionToggle(mod.key, 'delete')}
                                  className={`w-4 h-4 rounded text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer ${
                                    activeTemplate?.permissions?.[mod.key]?.delete ? 'ring-1 ring-rose-500' : ''
                                  }`}
                                />
                                {perm.delete && activeTemplate && !activeTemplate.permissions?.[mod.key]?.delete && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1 py-0.2 rounded">
                                    <HiOutlinePlus className="w-2.5 h-2.5" /> Added
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Quick Row Toggle */}
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRowToggle(mod.key)}
                                className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-800 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 cursor-pointer"
                              >
                                <HiOutlineArrowsRightLeft className="w-3 h-3" />
                                Toggle
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Add New Custom Module / Tab Bar */}
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <HiOutlineSparkles className="w-4 h-4 text-indigo-600" />
                      Extend System with a Custom Module
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">Define permissions for custom features like 'Inventory', 'CRM Leads', 'Fleet', etc.</span>
                  </div>

                  {!showAddModuleInput ? (
                    <button
                      type="button"
                      onClick={() => setShowAddModuleInput(true)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-indigo-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <HiOutlinePlus className="w-3.5 h-3.5" />
                      Add Custom Module
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        value={newModuleName}
                        onChange={(e) => setNewModuleName(e.target.value)}
                        placeholder="Module name (e.g. Inventory)"
                        className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewModule}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddModuleInput(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
                      >
                        <HiOutlineXMark className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <HiOutlineCheck className="w-4 h-4" />
                  {editingRole
                    ? (updateMutation.isPending ? 'Updating...' : 'Update Permissions')
                    : (createMutation.isPending ? 'Creating...' : 'Create Role & Permissions')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPage;
