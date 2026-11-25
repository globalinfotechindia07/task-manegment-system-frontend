import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineXMark,
  HiOutlineKey,
  HiOutlineShieldCheck,
  HiOutlineMagnifyingGlass,
  HiOutlineCheck,
  HiOutlineArrowPath,
  HiOutlineSparkles,
  HiOutlineFolder,
  HiOutlineBriefcase,
  HiOutlineUsers,
  HiOutlineBanknotes,
  HiOutlineChatBubbleLeftRight,
  HiOutlineFingerPrint,
  HiOutlineCog6Tooth,
  HiOutlineGlobeAlt,
  HiOutlineLifebuoy,
  HiChevronDown,
} from 'react-icons/hi2';

const CATEGORY_ICONS = {
  'Work & Projects': HiOutlineFolder,
  'CRM & Sales': HiOutlineBriefcase,
  'Human Resources': HiOutlineUsers,
  'Payroll & Finance': HiOutlineBanknotes,
  'Collaboration': HiOutlineChatBubbleLeftRight,
  'My Self-Service': HiOutlineFingerPrint,
  'System Admin': HiOutlineCog6Tooth,
  'Configurations': HiOutlineGlobeAlt,
  'Help & Support': HiOutlineLifebuoy,
};

const CATEGORY_COLORS = {
  'Work & Projects': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'CRM & Sales': 'bg-blue-50 text-blue-700 border-blue-200',
  'Human Resources': 'bg-purple-50 text-purple-700 border-purple-200',
  'Payroll & Finance': 'bg-amber-50 text-amber-700 border-amber-200',
  'Collaboration': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'My Self-Service': 'bg-violet-50 text-violet-700 border-violet-200',
  'System Admin': 'bg-rose-50 text-rose-700 border-rose-200',
  'Configurations': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Help & Support': 'bg-orange-50 text-orange-700 border-orange-200',
};

const UserPermissionsModal = ({ user, isOpen, onClose }) => {
  const { user: currentUser, login } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [localSubmenus, setLocalSubmenus] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  // Fetch user permissions details from backend
  const { data, isLoading } = useQuery({
    queryKey: ['userPermissions', user?._id],
    queryFn: async () => {
      const res = await api.get(`/users/${user._id}/permissions`);
      return res.data;
    },
    enabled: !!user?._id && isOpen,
  });

  const submenusCatalog = useMemo(() => data?.submenusCatalog || [], [data]);
  const effectivePermissions = data?.effectivePermissions || {};

  // Initialize local permissions map when data loads
  useEffect(() => {
    if (data?.effectivePermissions?.submenus) {
      setLocalSubmenus({ ...data.effectivePermissions.submenus });
      setIsDirty(false);
    }
  }, [data]);

  // Mutation to save custom permissions
  const saveMutation = useMutation({
    mutationFn: async (submenus) => {
      const res = await api.put(`/users/${user._id}/permissions`, { submenus });
      return res.data;
    },
    onSuccess: (resData) => {
      toast.success(`Sub-menu permissions saved for ${user.name}!`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['userPermissions', user._id] });

      // If updating current user's own permissions, update auth context storage
      if (currentUser && currentUser._id === user._id && resData.effectivePermissions) {
        const storedUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
        storedUser.permissions = resData.effectivePermissions;
        localStorage.setItem('userInfo', JSON.stringify(storedUser));
        window.location.reload(); // Quick refresh to apply to sidebar
      }

      setIsDirty(false);
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update permissions');
    },
  });

  // Group sub-menus by category
  const groupedSubmenus = useMemo(() => {
    const groups = {};
    submenusCatalog.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [submenusCatalog]);

  // Filtered groups based on search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedSubmenus;
    const q = searchQuery.toLowerCase();
    const result = {};

    Object.entries(groupedSubmenus).forEach(([category, items]) => {
      const matched = items.filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          it.description.toLowerCase().includes(q) ||
          it.path.toLowerCase().includes(q)
      );
      if (matched.length > 0) {
        result[category] = matched;
      }
    });

    return result;
  }, [groupedSubmenus, searchQuery]);

  // Overall enabled count
  const enabledCount = useMemo(() => {
    return Object.values(localSubmenus).filter(Boolean).length;
  }, [localSubmenus]);

  const totalCount = submenusCatalog.length;

  const handleToggle = (id) => {
    setLocalSubmenus((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      setIsDirty(true);
      return next;
    });
  };

  const handleToggleCategory = (category, enable) => {
    const items = groupedSubmenus[category] || [];
    setLocalSubmenus((prev) => {
      const next = { ...prev };
      items.forEach((it) => {
        next[it.id] = enable;
      });
      setIsDirty(true);
      return next;
    });
  };

  const handleBulkAllowAll = () => {
    const next = {};
    submenusCatalog.forEach((it) => {
      next[it.id] = true;
    });
    setLocalSubmenus(next);
    setIsDirty(true);
    toast.success('Allowed all sub-menus');
  };

  const handleResetToRoleDefaults = () => {
    const roleKey = user.role;
    const next = {};
    submenusCatalog.forEach((it) => {
      next[it.id] = it.defaultRoles.includes(roleKey);
    });
    setLocalSubmenus(next);
    setIsDirty(true);
    toast.success(`Reset to standard ${roleKey} defaults`);
  };

  const toggleCategoryCollapse = (category) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
              <HiOutlineKey className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Sub-Menu Access Permissions
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Grant or restrict individual sub-menus for <strong className="text-slate-800">{user.name}</strong> ({user.email})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls & Summary Banner */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Enabled Counter */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600">Access Scope:</span>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {enabledCount} / {totalCount} Sub-Menus Enabled
                </span>
                {isDirty && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                    Unsaved changes
                  </span>
                )}
              </div>
            </div>

            {/* Quick Bulk Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleBulkAllowAll}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
              >
                Allow All
              </button>
              <button
                type="button"
                onClick={handleResetToRoleDefaults}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
              >
                Reset to {user.role} Defaults
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <HiOutlineMagnifyingGlass className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by sub-menu name, URL path, or category..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Sub-Menus Accordion Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 max-h-[55vh]">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-2">
              <HiOutlineArrowPath className="w-6 h-6 animate-spin text-indigo-600" />
              <span>Loading user permissions and sub-menus...</span>
            </div>
          ) : (
            Object.entries(filteredGroups).map(([category, items]) => {
              const Icon = CATEGORY_ICONS[category] || HiOutlineFolder;
              const colorClass = CATEGORY_COLORS[category] || 'bg-slate-50 text-slate-700 border-slate-200';
              const isCollapsed = collapsedCategories[category];
              const categoryEnabledCount = items.filter((it) => localSubmenus[it.id]).length;

              return (
                <div
                  key={category}
                  className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs"
                >
                  {/* Category Header */}
                  <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCategoryCollapse(category)}
                      className="flex items-center gap-2.5 text-left cursor-pointer flex-1"
                    >
                      <span className={`p-1.5 rounded-lg border text-xs font-bold ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-800">
                        {category}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        ({categoryEnabledCount}/{items.length})
                      </span>
                      <HiChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isCollapsed ? '-rotate-90' : ''
                        }`}
                      />
                    </button>

                    {/* Category Fast Switch */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleCategory(category, true)}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleToggleCategory(category, false)}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        None
                      </button>
                    </div>
                  </div>

                  {/* Submenu Item Rows */}
                  {!isCollapsed && (
                    <div className="divide-y divide-slate-100">
                      {items.map((it) => {
                        const isChecked = Boolean(localSubmenus[it.id]);
                        const isDefault = it.defaultRoles.includes(user.role);

                        return (
                          <div
                            key={it.id}
                            className={`px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors ${
                              isChecked ? 'bg-white' : 'bg-slate-50/30'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                                  {it.name}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {it.path}
                                </span>
                                {isChecked !== isDefault && (
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                                      isChecked
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}
                                  >
                                    {isChecked ? 'Custom Allowed' : 'Custom Restricted'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {it.description}
                              </p>
                            </div>

                            {/* Toggle Switch */}
                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggle(it.id)}
                                className="sr-only peer"
                              />
                              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {Object.keys(filteredGroups).length === 0 && !isLoading && (
            <div className="p-8 text-center text-slate-500 text-xs">
              No sub-menus match your search query "{searchQuery}".
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            Changes apply to the user's sidebar menu and protected page access instantly upon saving.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saveMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => saveMutation.mutate(localSubmenus)}
              disabled={saveMutation.isPending}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {saveMutation.isPending ? (
                <>
                  <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <HiOutlineCheck className="w-4 h-4" />
                  <span>Save Permissions</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPermissionsModal;
