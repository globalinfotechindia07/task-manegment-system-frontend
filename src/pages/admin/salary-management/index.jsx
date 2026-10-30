import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';
import { HiOutlineBanknotes, HiOutlineUser, HiOutlineUsers } from 'react-icons/hi2';

const SalaryManagement = () => {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);

  const { register, handleSubmit, reset } = useForm();

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['usersList'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data.filter((u) => u.role !== 'Admin');
    },
  });

  const { data: salaryConfig, isLoading: configLoading } = useQuery({
    queryKey: ['salaryConfig', selectedUser?._id],
    queryFn: async () => {
      if (!selectedUser) return null;
      const { data } = await api.get(`/payroll/config/${selectedUser._id}`);
      reset(data);
      return data;
    },
    enabled: !!selectedUser,
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
    },
  });

  const onSubmit = (data) => {
    const payload = {
      fixedCTC: parseFloat(data.fixedCTC) || 0,
      earnings: {
        basic: parseFloat(data.earnings?.basic) || 0,
        hra: parseFloat(data.earnings?.hra) || 0,
        exGratia: parseFloat(data.earnings?.exGratia) || 0,
        splAllowance: parseFloat(data.earnings?.splAllowance) || 0,
      },
      deductions: {
        pf: parseFloat(data.deductions?.pf) || 0,
        esic: parseFloat(data.deductions?.esic) || 0,
        labourWelfareFund: parseFloat(data.deductions?.labourWelfareFund) || 0,
        professionalTax: parseFloat(data.deductions?.professionalTax) || 0,
        welfareFund: parseFloat(data.deductions?.welfareFund) || 0,
      },
      employerContributions: {
        pf: parseFloat(data.employerContributions?.pf) || 0,
        esic: parseFloat(data.employerContributions?.esic) || 0,
        labourWelfareFund: parseFloat(data.employerContributions?.labourWelfareFund) || 0,
        professionalTax: parseFloat(data.employerContributions?.professionalTax) || 0,
      },
    };
    updateMutation.mutate(payload);
  };

  // Reusable classes
  const inputBase =
    'w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors';
  const smallInputBase =
    'w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors font-mono';
  const labelBase = 'block text-[11px] font-semibold text-slate-600 mb-1';
  const sectionTitle = 'text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-3';

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ===================== PAGE HEADER ===================== */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Salary Structures & CTC Rules
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure Earnings, Deductions, and Employer Contributions per employee.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* ===================== EMPLOYEE LIST ===================== */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {usersLoading ? (
              <div className="p-12 flex justify-center">
                <div className="w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : !users || users.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                  <HiOutlineUsers className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-700">No employees found</p>
                <p className="text-xs text-slate-500 mt-1">Add staff to configure salary structures.</p>
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user._id}
                  className={`p-4 transition-colors ${selectedUser?._id === user._id ? 'bg-indigo-50/60' : 'hover:bg-slate-50/60'
                    }`}
                >
                  <div className="flex items-start gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                      {user.profilePicture ? (
                        <img
                          src={`${API_BASE_URL}${user.profilePicture}`}
                          className="w-full h-full object-cover"
                          alt={user.name}
                        />
                      ) : (
                        user.name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 text-xs truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                      {(user.designation || user.department) && (
                        <p className="text-[10px] text-slate-600 mt-0.5 truncate">
                          {[user.designation, user.department].filter(Boolean).join(' • ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(user)}
                    className={`w-full inline-flex items-center justify-center gap-1.5 font-semibold text-xs px-3 py-2 rounded-lg transition-colors border shadow-sm cursor-pointer ${selectedUser?._id === user._id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white hover:bg-indigo-50 text-indigo-700 border-slate-300'
                      }`}
                  >
                    <HiOutlineBanknotes className="w-3.5 h-3.5" />
                    {selectedUser?._id === user._id ? 'Selected' : 'Configure'}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-4 lg:px-5 py-3.5">Employee</th>
                  <th className="px-4 lg:px-5 py-3.5">Role / Dept</th>
                  <th className="px-4 lg:px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersLoading ? (
                  <tr>
                    <td colSpan="3" className="p-12 text-center">
                      <div className="inline-block w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    </td>
                  </tr>
                ) : !users || users.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-10 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                        <HiOutlineUsers className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-slate-700">No employees found</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user._id}
                      className={`hover:bg-slate-50 transition-colors ${selectedUser?._id === user._id ? 'bg-indigo-50/60' : ''
                        }`}
                    >
                      <td className="px-4 lg:px-5 py-3.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                            {user.profilePicture ? (
                              <img
                                src={`${API_BASE_URL}${user.profilePicture}`}
                                className="w-full h-full object-cover"
                                alt={user.name}
                              />
                            ) : (
                              user.name?.charAt(0) || 'U'
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 text-xs truncate max-w-[160px]">
                              {user.name}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-5 py-3.5">
                        <div className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">
                          {user.designation || '—'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[140px]">
                          {user.department || ''}
                        </div>
                      </td>
                      <td className="px-4 lg:px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className={`inline-flex items-center gap-1.5 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors border shadow-sm cursor-pointer whitespace-nowrap ${selectedUser?._id === user._id
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white hover:bg-indigo-50 text-indigo-700 border-slate-300'
                            }`}
                        >
                          {selectedUser?._id === user._id ? 'Selected' : 'Configure'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===================== CONFIG EDITOR PANEL ===================== */}
        <div className="bg-white border border-slate-200 rounded-xl flex flex-col shadow-sm lg:h-[calc(100vh-12rem)] lg:sticky lg:top-20 overflow-hidden">
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50 shrink-0">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                <HiOutlineBanknotes className="w-3.5 h-3.5" />
              </span>
              Salary Breakup Editor
            </h2>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {!selectedUser ? (
              <div className="text-center py-16 text-slate-400 h-full flex flex-col items-center justify-center px-4">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                  <HiOutlineUser className="w-6 h-6" />
                </div>
                <p className="text-xs font-medium text-slate-500 leading-relaxed">
                  Select an employee from the table to configure their salary structure.
                </p>
              </div>
            ) : configLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-7 h-7 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : (
              <form id="salary-config-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                {/* Selected Employee Chip */}
                <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 shadow-sm">
                    {selectedUser.name?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-slate-900 font-semibold text-xs truncate">{selectedUser.name}</div>
                    <div className="text-slate-500 text-[10px] truncate">
                      {[selectedUser.designation, selectedUser.department].filter(Boolean).join(' • ')}
                    </div>
                  </div>
                </div>

                {/* Fixed CTC */}
                <div>
                  <label className="block text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5">
                    Annual Fixed CTC (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    {...register('fixedCTC', { required: true })}
                    className={`${inputBase} font-bold font-mono`}
                  />
                </div>

                {/* Earnings (A) */}
                <div className="border-t border-slate-200 pt-4">
                  <h3 className={`${sectionTitle} text-emerald-700`}>Monthly Earnings (A)</h3>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className={labelBase}>Basic (₹)</label>
                      <input type="number" step="any" {...register('earnings.basic')} className={smallInputBase} />
                    </div>
                    <div>
                      <label className={labelBase}>HRA (₹)</label>
                      <input type="number" step="any" {...register('earnings.hra')} className={smallInputBase} />
                    </div>
                    <div>
                      <label className={labelBase}>Ex-Gratia (₹)</label>
                      <input type="number" step="any" {...register('earnings.exGratia')} className={smallInputBase} />
                    </div>
                    <div>
                      <label className={labelBase}>SPL Allowance (₹)</label>
                      <input type="number" step="any" {...register('earnings.splAllowance')} className={smallInputBase} />
                    </div>
                  </div>
                </div>

                {/* Deductions (B) */}
                <div className="border-t border-slate-200 pt-4">
                  <h3 className={`${sectionTitle} text-rose-700`}>Employee Deductions (B)</h3>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className={labelBase}>PF (₹)</label>
                      <input type="number" step="any" {...register('deductions.pf')} className={smallInputBase} />
                    </div>
                    <div>
                      <label className={labelBase}>ESIC (₹)</label>
                      <input type="number" step="any" {...register('deductions.esic')} className={smallInputBase} />
                    </div>
                    <div>
                      <label className={labelBase}>Labour WF (₹)</label>
                      <input type="number" step="any" {...register('deductions.labourWelfareFund')} className={smallInputBase} />
                    </div>
                    <div>
                      <label className={labelBase}>Prof. Tax (₹)</label>
                      <input type="number" step="any" {...register('deductions.professionalTax')} className={smallInputBase} />
                    </div>
                  </div>
                </div>

                {/* Employer Contributions (C) */}
                <div className="border-t border-slate-200 pt-4">
                  <h3 className={`${sectionTitle} text-amber-700`}>Employer Contributions (C)</h3>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className={labelBase}>PF (₹)</label>
                      <input type="number" step="any" {...register('employerContributions.pf')} className={smallInputBase} />
                    </div>
                    <div>
                      <label className={labelBase}>ESIC (₹)</label>
                      <input type="number" step="any" {...register('employerContributions.esic')} className={smallInputBase} />
                    </div>
                    <div>
                      <label className={labelBase}>Labour WF (₹)</label>
                      <input type="number" step="any" {...register('employerContributions.labourWelfareFund')} className={smallInputBase} />
                    </div>
                    <div>
                      <label className={labelBase}>Prof. Tax (₹)</label>
                      <input type="number" step="any" {...register('employerContributions.professionalTax')} className={smallInputBase} />
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Footer Actions */}
          {selectedUser && (
            <div className="p-3 sm:p-3.5 border-t border-slate-200 bg-slate-50 shrink-0">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-300 shadow-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="salary-config-form"
                  disabled={updateMutation.isPending}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {updateMutation.isPending && (
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>{updateMutation.isPending ? 'Saving...' : 'Save'}</span>
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