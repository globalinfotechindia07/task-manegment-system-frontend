import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  HiOutlineXMark,
  HiOutlineBriefcase,
  HiOutlineUserCircle,
  HiOutlineBuildingOffice2,
  HiOutlinePlus,
  HiOutlineCog6Tooth,
} from 'react-icons/hi2';
import api from '../../../api/axios';

const SettingsPage = () => {
  const queryClient = useQueryClient();
  const [newRole, setNewRole] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [newDepartment, setNewDepartment] = useState('');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedSettings) => {
      const { data } = await api.put('/settings', updatedSettings);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      toast.success('Settings updated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error updating settings');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16 min-h-[400px]">
        <div className="w-9 h-9 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const handleAddItem = (category, value, setter) => {
    if (!value.trim()) return;
    const currentList = settings?.[category] || [];
    if (currentList.includes(value.trim())) {
      toast.error('Item already exists');
      return;
    }
    updateMutation.mutate({ [category]: [...currentList, value.trim()] });
    setter('');
  };

  const handleDeleteItem = (category, itemToDelete) => {
    const currentList = settings?.[category] || [];
    updateMutation.mutate({
      [category]: currentList.filter((item) => item !== itemToDelete),
    });
  };

  const renderSection = (title, category, inputValue, setInputValue, Icon) => {
    const items = settings?.[category] || [];
    const singularLabel = title.slice(0, -1).toLowerCase();

    return (
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">

        {/* Section Header */}
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-200">
          <span className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">{title}</h3>
            <p className="text-[11px] text-slate-500">
              {items.length} {items.length === 1 ? 'item' : 'items'} configured
            </p>
          </div>
        </div>

        {/* Add Input Row */}
        <div className="flex flex-col xs:flex-row sm:flex-row gap-2 mb-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Add new ${singularLabel}`}
            className="flex-1 bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem(category, inputValue, setInputValue)}
          />
          <button
            type="button"
            onClick={() => handleAddItem(category, inputValue, setInputValue)}
            disabled={updateMutation.isPending || !inputValue.trim()}
            className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm cursor-pointer"
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>

        {/* Items List */}
        <div className="flex flex-wrap gap-2">
          {items.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              No {title.toLowerCase()} added yet.
            </p>
          ) : (
            items.map((item, idx) => (
              <div
                key={`${item}-${idx}`}
                className="group inline-flex items-center gap-1.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 transition-colors"
              >
                <span className="truncate max-w-[160px]" title={item}>{item}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteItem(category, item)}
                  className="text-slate-400 hover:text-rose-600 transition-colors ml-0.5 shrink-0 cursor-pointer rounded p-0.5 hover:bg-rose-50"
                  title="Remove"
                  aria-label={`Remove ${item}`}
                >
                  <HiOutlineXMark className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ===================== PAGE HEADER ===================== */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
          <HiOutlineCog6Tooth className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            System Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure dynamic values for users like Roles, Designations, and Departments.
          </p>
        </div>
      </div>

      {/* ===================== SECTIONS GRID ===================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {renderSection('Roles', 'roles', newRole, setNewRole, HiOutlineBriefcase)}
        {renderSection('Designations', 'designations', newDesignation, setNewDesignation, HiOutlineUserCircle)}
        {renderSection('Departments', 'departments', newDepartment, setNewDepartment, HiOutlineBuildingOffice2)}
      </div>
    </div>
  );
};

export default SettingsPage;