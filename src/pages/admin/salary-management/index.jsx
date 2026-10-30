import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';
import { HiOutlineBanknotes, HiOutlineUser } from 'react-icons/hi2';

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Salary Structures & CTC Rules</h1>
          <p className="text-sm text-slate-500 mt-1">Configure detailed Earnings, Deductions, and Employer Contributions (Annexure-style).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Role / Dept</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersLoading ? (
                  <tr>
                    <td colSpan="3" className="p-8 text-center">
                      <div className="inline-block w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    </td>
                  </tr>
                ) : (
                  users?.map(user => (
                    <tr key={user._id} className={`hover:bg-slate-50 transition-colors ${selectedUser?._id === user._id ? 'bg-indigo-50/60' : ''}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                            {user.profilePicture ? (
                              <img src={`${API_BASE_URL}${user.profilePicture}`} className="w-full h-full object-cover" alt=""/>
                            ) : (
                              user.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{user.name}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-xs font-semibold text-slate-800">{user.designation}</div>
                        <div className="text-[11px] text-slate-500">{user.department}</div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className={`font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors border shadow-xs ${
                            selectedUser?._id === user._id 
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white hover:bg-indigo-50 text-indigo-700 border-slate-300'
                          }`}
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
        <div className="bg-white border border-slate-200 rounded-xl flex flex-col shadow-xs h-[calc(100vh-12rem)] sticky top-20">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
            <h2 className="text-sm font-bold text-slate-900">
              Salary Breakup Editor
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-slate-200">
            {!selectedUser ? (
              <div className="text-center py-16 text-slate-400 h-full flex flex-col items-center justify-center">
                <HiOutlineBanknotes className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium text-slate-500">Select an employee from the table to configure their salary structure.</p>
              </div>
            ) : configLoading ? (
              <div className="text-center py-12 text-slate-400 text-xs">Loading configuration...</div>
            ) : (
              <form id="salary-config-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-slate-900 font-semibold text-xs">{selectedUser.name}</div>
                    <div className="text-slate-500 text-[11px]">{selectedUser.designation} • {selectedUser.department}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1.5">Annual Fixed CTC (₹)</label>
                  <input type="number" step="any" {...register('fixedCTC', { required: true })} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-indigo-600 outline-none font-bold text-sm shadow-xs" />
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">Monthly Earnings (A)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Basic (₹)</label>
                      <input type="number" step="any" {...register('earnings.basic')} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:border-indigo-600 outline-none text-xs" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">HRA (₹)</label>
                      <input type="number" step="any" {...register('earnings.hra')} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:border-indigo-600 outline-none text-xs" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Ex-Gratia (₹)</label>
                      <input type="number" step="any" {...register('earnings.exGratia')} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:border-indigo-600 outline-none text-xs" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">SPL Allowance (₹)</label>
                      <input type="number" step="any" {...register('earnings.splAllowance')} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:border-indigo-600 outline-none text-xs" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <h3 className="text-xs font-bold text-rose-700 mb-3 uppercase tracking-wider">Employee Deductions (B)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">PF (₹)</label>
                      <input type="number" step="any" {...register('deductions.pf')} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:border-rose-600 outline-none text-xs" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">ESIC (₹)</label>
                      <input type="number" step="any" {...register('deductions.esic')} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:border-rose-600 outline-none text-xs" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Labour Welfare Fund (₹)</label>
                      <input type="number" step="any" {...register('deductions.labourWelfareFund')} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:border-rose-600 outline-none text-xs" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Professional Tax (₹)</label>
                      <input type="number" step="any" {...register('deductions.professionalTax')} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:border-rose-600 outline-none text-xs" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <h3 className="text-xs font-bold text-amber-700 mb-3 uppercase tracking-wider">Employer Contributions (C)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">PF (₹)</label>
                      <input type="number" step="any" {...register('employerContributions.pf')} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:border-amber-600 outline-none text-xs" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">ESIC (₹)</label>
                      <input type="number" step="any" {...register('employerContributions.esic')} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:border-amber-600 outline-none text-xs" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Labour Welfare Fund (₹)</label>
                      <input type="number" step="any" {...register('employerContributions.labourWelfareFund')} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:border-amber-600 outline-none text-xs" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Professional Tax (₹)</label>
                      <input type="number" step="any" {...register('employerContributions.professionalTax')} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:border-amber-600 outline-none text-xs" />
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
          
          {selectedUser && (
            <div className="p-3.5 border-t border-slate-200 shrink-0 bg-slate-50/70">
              <div className="flex gap-2">
                <button type="button" onClick={() => setSelectedUser(null)} className="flex-1 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-300 shadow-xs">Cancel</button>
                <button type="submit" form="salary-config-form" disabled={updateMutation.isPending} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs disabled:opacity-50">
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
