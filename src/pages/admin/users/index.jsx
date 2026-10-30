import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import Swal from 'sweetalert2';
import {
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineNoSymbol,
  HiOutlineUsers,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi2';
import api from '../../../api/axios';

const fallbackRoleTypes = {
  User: [
    'Full Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'App Developer',
    'Marketing Executive',
    'UI/UX Designer',
    'QA Engineer',
  ],
  'Team Head': ['Project Manager', 'Marketing Manager', 'Technical Lead'],
  'HR Manager': ['HR Manager', 'Talent Acquisition'],
};

const getRoleStyle = (role) => {
  switch (role) {
    case 'Admin':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    case 'Team Head':
      return 'bg-purple-50 text-purple-700 border border-purple-200';
    case 'HR Manager':
      return 'bg-pink-50 text-pink-700 border border-pink-200';
    case 'User':
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    default:
      return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
  }
};

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const queryClient = useQueryClient();

  const canCreateUser =
    currentUser?.role === 'Admin' ||
    currentUser?.role === 'Super Admin' ||
    !!currentUser?.permissions?.users?.create;
  const canEditUser =
    currentUser?.role === 'Admin' ||
    currentUser?.role === 'Super Admin' ||
    !!currentUser?.permissions?.users?.edit;
  const canDeleteUser =
    currentUser?.role === 'Admin' ||
    currentUser?.role === 'Super Admin' ||
    !!currentUser?.permissions?.users?.delete;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'User',
      designation: 'Full Stack Developer',
      department: 'IT',
      teamHead: '',
      status: 'Active',
    },
  });

  const selectedRole = watch('role');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await api.get('/roles');
      return data;
    },
  });

  const availableRoles =
    rolesData && Array.isArray(rolesData) && rolesData.length > 0
      ? rolesData.filter((r) => r.name !== 'Super Admin' && r.name !== 'Admin')
      : [
        { name: 'User', displayName: 'User' },
        { name: 'Team Head', displayName: 'Team Head' },
        { name: 'HR Manager', displayName: 'HR Manager' },
      ];

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data;
    },
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
    },
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
    },
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
    },
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
      status: 'Active',
    });
  };

  const usersList = Array.isArray(users) ? users : [];
  const paginatedUsers = usersList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(usersList.length / itemsPerPage);

  const teamHeads = users?.filter((u) => u.role === 'Team Head' && u.status !== 'Inactive') || [];

  const isSaving = addMutation.isPending || updateMutation.isPending;

  // Reusable tokens
  const inputBase =
    'w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors';
  const labelBase = 'block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5';
  const iconBtnBase = 'p-1.5 rounded-lg transition-colors cursor-pointer';

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ===================== PAGE HEADER ===================== */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            User & Staff Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage system roles, department assignments, and access levels.
          </p>
        </div>
        {canCreateUser && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Add Staff Member
          </button>
        )}
      </div>

      {/* ===================== TABLE / LIST ===================== */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="w-9 h-9 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : usersList.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <HiOutlineUsers className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-1">No staff members yet</p>
            <p className="text-xs text-slate-500">Add your first staff member to get started.</p>
          </div>
        ) : (
          <>
            {/* ---------- MOBILE CARD VIEW (< md) ---------- */}
            <div className="md:hidden divide-y divide-slate-100">
              {paginatedUsers.map((user) => (
                <div
                  key={user._id}
                  className={`p-4 hover:bg-slate-50/60 transition-colors ${user.status === 'Inactive' ? 'opacity-60' : ''
                    }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 text-xs truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                    </div>
                    <span
                      className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${getRoleStyle(
                        user.role
                      )}`}
                    >
                      {user.roleRef?.displayName || user.role}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] mb-2.5">
                    <div className="min-w-0">
                      <span className="text-slate-500 block">Designation</span>
                      <span className="text-slate-800 font-medium truncate block">
                        {user.designation || '—'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-slate-500 block">Department</span>
                      <span className="text-slate-800 font-medium truncate block">
                        {user.department || 'Administration'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-slate-500 block">Team Head</span>
                      <span className="text-slate-800 font-medium truncate block">
                        {user.teamHead?.name || 'Head'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-slate-500 block">Status</span>
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${user.status === 'Inactive'
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                      >
                        {user.status || 'Active'}
                      </span>
                    </div>
                  </div>

                  {(canEditUser || canDeleteUser) && (
                    <div className="flex gap-1.5">
                      {canEditUser && (
                        <button
                          type="button"
                          onClick={() => handleEdit(user)}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                        >
                          <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                          Edit
                        </button>
                      )}
                      {canEditUser && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          className={`flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${user.status === 'Inactive'
                            ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                            : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                            }`}
                        >
                          {user.status === 'Inactive' ? (
                            <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <HiOutlineNoSymbol className="w-3.5 h-3.5" />
                          )}
                          {user.status === 'Inactive' ? 'Activate' : 'Deactivate'}
                        </button>
                      )}
                      {canDeleteUser && (
                        <button
                          type="button"
                          onClick={() => {
                            Swal.fire({
                              title: 'Are you sure?',
                              text: `You are about to permanently delete user ${user.name}. This action cannot be undone.`,
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonColor: '#ef4444',
                              cancelButtonColor: '#64748b',
                              confirmButtonText: 'Yes, delete it!',
                            }).then((result) => {
                              if (result.isConfirmed) {
                                deleteMutation.mutate(user._id);
                              }
                            });
                          }}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                          aria-label="Delete user"
                        >
                          <HiOutlineTrash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ---------- DESKTOP TABLE (md+) ---------- */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 min-w-[1100px]">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap">Name</th>
                    <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap">Email</th>
                    <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap">Role</th>
                    <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap">Department</th>
                    <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap">Team Head</th>
                    <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap">Designation</th>
                    <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap">Status</th>
                    <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap">Joined</th>
                    {(canEditUser || canDeleteUser) && (
                      <th className="px-4 lg:px-6 py-3.5 text-right whitespace-nowrap">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user._id}
                      className={`hover:bg-slate-50 transition-colors ${user.status === 'Inactive' ? 'opacity-60' : ''
                        }`}
                    >
                      <td className="px-4 lg:px-6 py-3.5">
                        <span className="font-semibold text-slate-900 text-xs truncate max-w-[140px] block">
                          {user.name}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3.5">
                        <span className="text-slate-600 text-xs truncate max-w-[180px] block">
                          {user.email}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${getRoleStyle(
                            user.role
                          )}`}
                        >
                          {user.roleRef?.displayName || user.role}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3.5 text-slate-600 text-xs truncate max-w-[120px]">
                        {user.department || 'Administration'}
                      </td>
                      <td className="px-4 lg:px-6 py-3.5 text-slate-600 text-xs truncate max-w-[120px]">
                        {user.teamHead?.name || 'Head'}
                      </td>
                      <td className="px-4 lg:px-6 py-3.5 text-slate-600 text-xs truncate max-w-[140px]">
                        {user.designation || '—'}
                      </td>
                      <td className="px-4 lg:px-6 py-3.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${user.status === 'Inactive'
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                        >
                          {user.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      {(canEditUser || canDeleteUser) && (
                        <td className="px-4 lg:px-6 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {canEditUser && (
                              <button
                                type="button"
                                onClick={() => handleEdit(user)}
                                title="Edit User"
                                aria-label="Edit user"
                                className={`${iconBtnBase} text-slate-500 hover:text-indigo-600 hover:bg-indigo-50`}
                              >
                                <HiOutlinePencilSquare className="w-4 h-4" />
                              </button>
                            )}
                            {canEditUser && (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(user)}
                                title={user.status === 'Inactive' ? 'Activate User' : 'Deactivate User'}
                                aria-label={user.status === 'Inactive' ? 'Activate user' : 'Deactivate user'}
                                className={`${iconBtnBase} ${user.status === 'Inactive'
                                  ? 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                                  : 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                                  }`}
                              >
                                {user.status === 'Inactive' ? (
                                  <HiOutlineCheckCircle className="w-4 h-4" />
                                ) : (
                                  <HiOutlineNoSymbol className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            {canDeleteUser && (
                              <button
                                type="button"
                                onClick={() => {
                                  Swal.fire({
                                    title: 'Are you sure?',
                                    text: `You are about to permanently delete user ${user.name}. This action cannot be undone.`,
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonColor: '#ef4444',
                                    cancelButtonColor: '#64748b',
                                    confirmButtonText: 'Yes, delete it!',
                                  }).then((result) => {
                                    if (result.isConfirmed) {
                                      deleteMutation.mutate(user._id);
                                    }
                                  });
                                }}
                                title="Delete User"
                                aria-label="Delete user"
                                className={`${iconBtnBase} text-slate-500 hover:text-rose-600 hover:bg-rose-50`}
                              >
                                <HiOutlineTrash className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ---------- PAGINATION ---------- */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 text-[11px] sm:text-xs">
                <div className="text-slate-500 text-center sm:text-left">
                  Showing <strong className="text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</strong>–
                  <strong className="text-slate-700">
                    {Math.min(currentPage * itemsPerPage, usersList.length)}
                  </strong>{' '}
                  of <strong className="text-slate-700">{usersList.length}</strong>
                </div>
                <div className="flex items-center justify-center sm:justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1 bg-white border border-slate-300 rounded-lg text-slate-700 disabled:opacity-40 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Previous page"
                  >
                    <HiOutlineChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline ml-0.5 font-medium">Prev</span>
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      type="button"
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 text-[11px] sm:text-xs rounded-lg border font-semibold transition-colors cursor-pointer ${currentPage === i + 1
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1 bg-white border border-slate-300 rounded-lg text-slate-700 disabled:opacity-40 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Next page"
                  >
                    <span className="hidden sm:inline mr-0.5 font-medium">Next</span>
                    <HiOutlineChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===================== ADD/EDIT MODAL ===================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden="true"
          />
          <div className="relative bg-white sm:rounded-2xl rounded-t-2xl border-0 sm:border border-slate-200 shadow-2xl w-full sm:max-w-md max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <h3 className="text-base font-bold text-slate-900 truncate">
                {editingUser ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 -mr-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer shrink-0"
                aria-label="Close"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">

              <div>
                <label className={labelBase}>Full Name *</label>
                <input
                  type="text"
                  className={inputBase}
                  placeholder="John Doe"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && <p className="text-[11px] text-rose-600 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className={labelBase}>Email Address *</label>
                <input
                  type="email"
                  className={inputBase}
                  placeholder="john@globalinfotech.com"
                  {...register('email', { required: 'Email is required' })}
                />
                {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className={labelBase}>
                  Password {editingUser && <span className="text-slate-400 text-[10px] font-normal normal-case">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  className={inputBase}
                  placeholder="••••••••"
                  {...register('password', {
                    required: editingUser ? false : 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' },
                  })}
                />
                {errors.password && <p className="text-[11px] text-rose-600 mt-1">{errors.password.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelBase}>Role</label>
                  <select className={inputBase} {...register('role')}>
                    {availableRoles.map((role) => (
                      <option key={role._id || role.name} value={role.name}>
                        {role.displayName || role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelBase}>Designation</label>
                  <select className={inputBase} {...register('designation')}>
                    {settings?.designations
                      ? settings.designations.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))
                      : fallbackRoleTypes[selectedRole]?.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelBase}>Department</label>
                    <select className={inputBase} {...register('department')}>
                      {settings?.departments
                        ? settings.departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))
                        : (
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
                    <label className={labelBase}>Team Head</label>
                    <select
                      className={inputBase}
                      {...register('teamHead', {
                        required: selectedRole === 'User' ? 'Team Head is required' : false,
                      })}
                    >
                      <option value="">Select Team Head</option>
                      {teamHeads.map((th) => (
                        <option key={th._id} value={th._id}>
                          {th.name}
                        </option>
                      ))}
                    </select>
                    {errors.teamHead && (
                      <p className="text-[11px] text-rose-600 mt-1">{errors.teamHead.message}</p>
                    )}
                  </div>
                </div>
              )}

              {editingUser && (
                <div>
                  <label className={labelBase}>Status</label>
                  <select className={inputBase} {...register('status')}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}

              <div className="pt-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSaving && (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>{isSaving ? 'Saving…' : editingUser ? 'Update Staff' : 'Add Staff'}</span>
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