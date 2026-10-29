import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';

const SalaryManagement = () => {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  
  const { register, handleSubmit, reset } = useForm();

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['usersList'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data.filter(u => u.role !== 'Admin');
    }
  });

  const { data: salaryConfig, isLoading: configLoading } = useQuery({
    queryKey: ['salaryConfig', selectedUser?._id],
    queryFn: async () => {
      if (!selectedUser) return null;
      const { data } = await api.get(`/payroll/config/${selectedUser._id}`);
      reset(data);
      return data;
    },
    enabled: !!selectedUser
  });

  const updateMutation = useMutation({
    mutationFn: async (formData) => {
      formData.userId = selectedUser._id;
      const { data } = await api.post('/payroll/config', formData);
      return data;
    },
    onSuccess: () => {
      toast.success('Salary config updated successfully');
      queryClient.invalidateQueries({ queryKey: ['salaryConfig', selectedUser._id] });
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update config');
    }
  });

  const onSubmit = (data) => {
    const payload = {
      fixedCTC: parseFloat(data.fixedCTC) || 0,
      earnings: {
        basic: parseFloat(data.earnings?.basic) || 0,
        hra: parseFloat(data.earnings?.hra) || 0,
        exGratia: parseFloat(data.earnings?.exGratia) || 0,
        splAllowance: parseFloat(data.earnings?.splAllowance) || 0
      },
      deductions: {
        pf: parseFloat(data.deductions?.pf) || 0,
        esic: parseFloat(data.deductions?.esic) || 0,
        labourWelfareFund: parseFloat(data.deductions?.labourWelfareFund) || 0,
        professionalTax: parseFloat(data.deductions?.professionalTax) || 0,
        welfareFund: parseFloat(data.deductions?.welfareFund) || 0
      },
      employerContributions: {
        pf: parseFloat(data.employerContributions?.pf) || 0,
        esic: parseFloat(data.employerContributions?.esic) || 0,
        labourWelfareFund: parseFloat(data.employerContributions?.labourWelfareFund) || 0,
        professionalTax: parseFloat(data.employerContributions?.professionalTax) || 0
      }
    };
    updateMutation.mutate(payload);
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-200">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Salary Management</h1>
        <p className="text-slate-400">Configure detailed Earnings, Deductions, and Employer Contributions (Annexure-style).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User List */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Role / Dept</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {usersLoading ? (
                  <tr>
                    <td colSpan="3" className="p-4 text-center">Loading...</td>
                  </tr>
                ) : (
                  users?.map(user => (
                    <tr key={user._id} className={`hover:bg-slate-700/20 transition-colors ${selectedUser?._id === user._id ? 'bg-indigo-500/10' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden shrink-0">
                            {user.profilePicture ? (
                              <img src={`${API_BASE_URL}${user.profilePicture}`} className="w-full h-full object-cover" alt=""/>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-white text-xs">{user.name.charAt(0)}</div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-white">{user.name}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-300">{user.designation}</div>
                        <div className="text-xs text-slate-500">{user.department}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="text-indigo-400 hover:text-indigo-300 font-medium text-xs bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-md transition-colors"
                        >
                          Configure
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl flex flex-col shadow-xl h-[calc(100vh-12rem)] sticky top-6">
          <div className="p-6 border-b border-slate-700 shrink-0">
            <h2 className="text-lg font-semibold text-white">
              Configuration
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {!selectedUser ? (
              <div className="text-center py-10 text-slate-500 h-full flex flex-col items-center justify-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Select an employee to configure their salary.
              </div>
            ) : configLoading ? (
              <div className="text-center py-10">Loading...</div>
            ) : (
              <form id="salary-config-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{selectedUser.name}</div>
                    <div className="text-slate-400 text-xs">Editing Configuration</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-emerald-400 mb-2">Annual Fixed CTC (₹)</label>
                  <input type="number" step="any" {...register('fixedCTC', { required: true })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none font-bold" />
                </div>

                <div className="border-t border-slate-700/50 pt-4">
                  <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">Monthly Earnings (A)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Basic (₹)</label>
                      <input type="number" step="any" {...register('earnings.basic')} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">HRA (₹)</label>
                      <input type="number" step="any" {...register('earnings.hra')} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Ex-Gratia (₹)</label>
                      <input type="number" step="any" {...register('earnings.exGratia')} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">SPL Allowance (₹)</label>
                      <input type="number" step="any" {...register('earnings.splAllowance')} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none text-sm" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-700/50 pt-4">
                  <h3 className="text-sm font-bold text-rose-400 mb-3 uppercase tracking-wider">Employee Deductions (B)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">PF (₹)</label>
                      <input type="number" step="any" {...register('deductions.pf')} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-rose-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">ESIC (₹)</label>
                      <input type="number" step="any" {...register('deductions.esic')} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-rose-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Labour Welfare Fund (₹)</label>
                      <input type="number" step="any" {...register('deductions.labourWelfareFund')} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-rose-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Professional Tax (₹)</label>
                      <input type="number" step="any" {...register('deductions.professionalTax')} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-rose-500 outline-none text-sm" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-400 mb-1">Welfare Fund (₹)</label>
                      <input type="number" step="any" {...register('deductions.welfareFund')} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-rose-500 outline-none text-sm" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-700/50 pt-4">
                  <h3 className="text-sm font-bold text-orange-400 mb-3 uppercase tracking-wider">Employer Contributions (C)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">PF (₹)</label>
                      <input type="number" step="any" {...register('employerContributions.pf')} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-orange-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">ESIC (₹)</label>
                      <input type="number" step="any" {...register('employerContributions.esic')} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-orange-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Labour Welfare Fund (₹)</label>
                      <input type="number" step="any" {...register('employerContributions.labourWelfareFund')} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-orange-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Professional Tax (₹)</label>
                      <input type="number" step="any" {...register('employerContributions.professionalTax')} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-orange-500 outline-none text-sm" />
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
          
          {selectedUser && (
            <div className="p-4 border-t border-slate-700 shrink-0 bg-slate-800/30">
              <div className="flex gap-3">
                <button type="button" onClick={() => setSelectedUser(null)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors border border-slate-700">Cancel</button>
                <button type="submit" form="salary-config-form" disabled={updateMutation.isPending} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
                  {updateMutation.isPending ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalaryManagement;
