import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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
    }
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
    }
  });

  if (isLoading) return <div className="p-8 text-center text-slate-400">Loading settings...</div>;

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
    updateMutation.mutate({ [category]: currentList.filter(item => item !== itemToDelete) });
  };

  const renderSection = (title, category, inputValue, setInputValue) => (
    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      <div className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={`Add new ${title.toLowerCase().slice(0, -1)}`}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          onKeyDown={(e) => e.key === 'Enter' && handleAddItem(category, inputValue, setInputValue)}
        />
        <button 
          onClick={() => handleAddItem(category, inputValue, setInputValue)}
          disabled={updateMutation.isPending || !inputValue.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(settings?.[category] || []).map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-sm text-slate-300">
            <span>{item}</span>
            <button 
              onClick={() => handleDeleteItem(category, item)}
              className="text-slate-500 hover:text-red-400 transition-colors ml-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
        <p className="text-slate-400">Configure dynamic values for users like Roles, Designations, and Departments.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderSection('Roles', 'roles', newRole, setNewRole)}
        {renderSection('Designations', 'designations', newDesignation, setNewDesignation)}
        {renderSection('Departments', 'departments', newDepartment, setNewDepartment)}
      </div>
    </div>
  );
};

export default SettingsPage;

