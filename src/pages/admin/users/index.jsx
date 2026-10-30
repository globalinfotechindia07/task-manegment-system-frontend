import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import Swal from 'sweetalert2';
import api from '../../../api/axios';

// Hardcoded fallback in case settings fail
const fallbackRoleTypes = {
  'User': [
    'Full Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'App Developer',
    'Marketing Executive',
    'UI/UX Designer',
    'QA Engineer'
  ],
  'Team Head': ['Project Manager', 'Marketing Manager', 'Technical Lead'],
  'HR Manager': ['HR Manager', 'Talent Acquisition']
};

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const queryClient = useQueryClient();

  const canCreateUser = currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin' || !!currentUser?.permissions?.users?.create;
  const canEditUser = currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin' || !!currentUser?.permissions?.users?.edit;
  const canDeleteUser = currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin' || !!currentUser?.permissions?.users?.delete;

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'User',
      designation: 'Full Stack Developer',
      department: 'IT',
      teamHead: '',
      status: 'Active'
    }
  });

  const selectedRole = watch('role');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    }
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await api.get('/roles');
      return data;
    }
  });

  const availableRoles = (rolesData && Array.isArray(rolesData) && rolesData.length > 0)
    ? rolesData.filter(r => r.name !== 'Super Admin' && r.name !== 'Admin')
    : [
        { name: 'User', displayName: 'User' },
        { name: 'Team Head', displayName: 'Team Head' },
        { name: 'HR Manager', displayName: 'HR Manager' }
      ];

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data;
    }
  });

  const addMutation = useMutation({
    mutationFn: async (userData) => {
      const { data } = await api.post('/users', userData);
      return data;
    },
    onSuccess: () => {
      toast.success('User added successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add user');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (userData) => {
      const { data } = await api.put(`/users/${userData._id}`, userData);
      return data;
    },
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId) => {
      const { data } = await api.delete(`/users/${userId}`);
      return data;
    },
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  });

  const onSubmit = (data) => {
    if (editingUser) {
      updateMutation.mutate({ ...data, _id: editingUser._id });
    } else {
      addMutation.mutate(data);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setValue('name', user.name);
    setValue('email', user.email);
    setValue('role', user.role);
    setValue('designation', user.designation);
    setValue('department', user.department || 'IT');
    setValue('teamHead', user.teamHead?._id || user.teamHead || '');
    setValue('status', user.status || 'Active');
    // We don't set password when editing, let it be empty unless they want to change it
    setValue('password', '');
    setIsModalOpen(true);
  };

  const handleToggleStatus = (user) => {
    const newStatus = user.status === 'Inactive' ? 'Active' : 'Inactive';
    updateMutation.mutate({ ...user, status: newStatus });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    reset({
      name: '',
      email: '',
      password: '',
      role: 'User',
      designation: 'Full Stack Developer',
      department: 'IT',
      teamHead: '',
      status: 'Active'
    });
  };

  const usersList = Array.isArray(users) ? users : [];
  const paginatedUsers = usersList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(usersList.length / itemsPerPage);

  const teamHeads = users?.filter(u => u.role === 'Team Head' && u.status !== 'Inactive') || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User & Staff Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage system roles, department assignments, and access levels.</p>
        </div>
        {canCreateUser && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            + Add Staff Member
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Department</th>
                  <th className="px-6 py-4 font-semibold">Team Head</th>
                  <th className="px-6 py-4 font-semibold">Designation</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Joined</th>
                  {(canEditUser || canDeleteUser) && (
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers?.map((user) => (
                  <tr key={user._id} className={`hover:bg-slate-50 transition-colors ${user.status === 'Inactive' ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 font-semibold text-slate-900">{user.name}</td>
                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                        user.role === 'Admin' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        user.role === 'Team Head' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        user.role === 'HR Manager' ? 'bg-pink-50 text-pink-700 border border-pink-200' :
                        user.role === 'User' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {user.roleRef?.displayName || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{user.department || 'Administration'}</td>
                    <td className="px-6 py-4 text-slate-600">{user.teamHead?.name || 'Head'}</td>
                    <td className="px-6 py-4 text-slate-600">{user.designation}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${user.status === 'Inactive' ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                        {user.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                    {(canEditUser || canDeleteUser) && (
                      <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                        {canEditUser && (
                          <button
                            onClick={() => handleEdit(user)}
                            title="Edit User"
                            className="text-indigo-400 hover:text-indigo-300 p-1.5 border border-indigo-500/30 rounded hover:bg-indigo-500/10 transition-colors inline-flex items-center justify-center"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        )}
                        {canEditUser && (
                          <button
                            onClick={() => handleToggleStatus(user)}
                            title={user.status === 'Inactive' ? 'Activate User' : 'Deactivate User'}
                            className={`${user.status === 'Inactive' ? 'text-green-400 hover:text-green-300 border-green-500/30 hover:bg-green-500/10' : 'text-red-400 hover:text-red-300 border-red-500/30 hover:bg-red-500/10'} p-1.5 border rounded transition-colors inline-flex items-center justify-center`}
                          >
                            {user.status === 'Inactive' ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            )}
                          </button>
                        )}
                        {canDeleteUser && (
                          <button
                            onClick={() => {
                              Swal.fire({
                                title: 'Are you sure?',
                                text: `You are about to permanently delete user ${user.name}. This action cannot be undone.`,
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#ef4444',
                                cancelButtonColor: '#334155',
                                confirmButtonText: 'Yes, delete it!',
                                background: '#1e293b',
                                color: '#f8fafc',
                                customClass: {
                                  popup: 'border border-slate-700 rounded-xl shadow-2xl',
                                }
                              }).then((result) => {
                                if (result.isConfirmed) {
                                  deleteMutation.mutate(user._id);
                                }
                              });
                            }}
                            title="Delete User"
                            className="text-red-400 hover:text-red-300 p-1.5 border border-red-500/30 rounded hover:bg-red-500/10 transition-colors inline-flex items-center justify-center"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 flex items-center justify-between border-t border-slate-200 bg-slate-50 text-xs">
                <div className="text-slate-600">
                  Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(currentPage * itemsPerPage, users?.length || 0)}</span> of <span className="font-semibold text-slate-900">{users?.length}</span> results
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-7 h-7 rounded flex items-center justify-center border font-medium cursor-pointer ${currentPage === i + 1 ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'} transition-colors`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={closeModal}></div>
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/70">
              <h3 className="text-base font-bold text-slate-900">{editingUser ? 'Edit Staff Member' : 'Add New Staff Member'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all"
                  placeholder="John Doe"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all"
                  placeholder="john@globalinfotech.com"
                  {...register('email', { required: 'Email is required' })}
                />
                {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Password {editingUser && <span className="text-slate-400 text-xs font-normal">(Leave blank to keep current)</span>}</label>
                <input
                  type="password"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all"
                  placeholder="••••••••"
                  {...register('password', {
                    required: editingUser ? false : 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' }
                  })}
                />
                {errors.password && <p className="text-xs text-rose-600 mt-1">{errors.password.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Role</label>
                  <select
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all"
                    {...register('role')}
                  >
                    {availableRoles.map(role => (
                      <option key={role._id || role.name} value={role.name}>{role.displayName || role.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Type / Designation</label>
                  <select
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all"
                    {...register('designation')}
                  >
                    {settings?.designations ? settings.designations.map(type => (
                      <option key={type} value={type}>{type}</option>
                    )) : fallbackRoleTypes[selectedRole]?.map(type => (
                      <option key={type} value={type}>{type}</option>
                    )) || (
                      <>
                        <option value="Staff">Staff</option>
                        <option value="Lead">Lead</option>
                        <option value="Executive">Executive</option>
                        <option value="Manager">Manager</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {selectedRole !== 'Admin' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Department</label>
                    <select
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all"
                      {...register('department')}
                    >
                      {settings?.departments ? settings.departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      )) : (
                        <>
                          <option value="IT">IT</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Operations">Operations</option>
                          <option value="Support">Support</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Team Head</label>
                    <select
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all"
                      {...register('teamHead', { required: selectedRole === 'User' ? 'Team Head is required' : false })}
                    >
                      <option value="">Select Team Head (Optional)</option>
                      {teamHeads.map(th => (
                        <option key={th._id} value={th._id}>{th.name}</option>
                      ))}
                    </select>
                    {errors.teamHead && <p className="text-xs text-rose-600 mt-1">{errors.teamHead.message}</p>}
                  </div>
                </div>
              )}

              {editingUser && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Status</label>
                  <select
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none transition-all"
                    {...register('status')}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-300 shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-50 flex items-center"
                >
                  {addMutation.isPending || updateMutation.isPending ? 'Saving...' : editingUser ? 'Update Staff' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
