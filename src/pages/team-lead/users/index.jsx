import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  HiOutlinePlus, 
  HiOutlinePencilSquare, 
  HiOutlineCheck, 
  HiOutlineNoSymbol, 
  HiOutlineUsers, 
  HiOutlineXMark 
} from 'react-icons/hi2';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';

const roleTypes = {
  'User': [
    'Full Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'App Developer',
    'Marketing Executive'
  ]
};

const TeamLeadUsersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'User',
      designation: 'Full Stack Developer',
      department: 'IT',
      status: 'Active'
    }
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['team-users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
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
      queryClient.invalidateQueries({ queryKey: ['team-users'] });
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
      queryClient.invalidateQueries({ queryKey: ['team-users'] });
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
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
      status: 'Active'
    });
  };

  const usersList = Array.isArray(users) ? users : [];
  const paginatedUsers = usersList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(usersList.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Team Members</h1>
          <p className="text-sm text-slate-500">Manage users in your team.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-xs cursor-pointer"
        >
          <HiOutlinePlus className="w-5 h-5" />
          Add User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !users || users.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12">
            <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <HiOutlineUsers className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">No team members</h3>
            <p className="text-sm text-slate-500 max-w-sm">Click "Add User" to add members to your team.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Department</th>
                  <th className="px-6 py-4 font-semibold">Designation</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Joined</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers?.map((user) => (
                  <tr key={user._id} className={`hover:bg-slate-50/80 transition-colors ${user.status === 'Inactive' ? 'opacity-60 bg-slate-50/40' : ''}`}>
                    <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{user.department || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{user.designation}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        user.status === 'Inactive' 
                          ? 'bg-slate-100 text-slate-600 border-slate-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {user.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEdit(user)}
                          title="Edit User"
                          className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <HiOutlinePencilSquare className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          title={user.status === 'Inactive' ? 'Activate User' : 'Deactivate User'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            user.status === 'Inactive' 
                              ? 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50' 
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                        >
                          {user.status === 'Inactive' ? (
                            <HiOutlineCheck className="w-5 h-5" />
                          ) : (
                            <HiOutlineNoSymbol className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50">
                <div className="text-xs text-slate-500">
                  Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(currentPage * itemsPerPage, users?.length || 0)}</span> of <span className="font-semibold text-slate-900">{users?.length}</span> results
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-7 h-7 text-xs font-semibold rounded-lg flex items-center justify-center border transition-colors cursor-pointer ${
                        currentPage === i + 1 
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={closeModal}></div>
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">{editingUser ? 'Edit User' : 'Add New Team Member'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                <HiOutlineXMark className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="John Doe"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="john@globalinfotech.com"
                  {...register('email', { required: 'Email is required' })}
                />
                {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password {editingUser && <span className="text-slate-500 text-xs font-normal">(Leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="••••••••"
                  {...register('password', {
                    required: editingUser ? false : 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' }
                  })}
                />
                {errors.password && <p className="text-xs text-rose-600 mt-1">{errors.password.message}</p>}
              </div>

              {/* Role is implicitly User */}
              <input type="hidden" {...register('role')} value="User" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <select
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    {...register('department')}
                  >
                    <option value="IT">IT</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
                  <select
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    {...register('designation')}
                  >
                    {roleTypes['User'].map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {editingUser && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    {...register('status')}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-50 flex items-center cursor-pointer"
                >
                  {addMutation.isPending || updateMutation.isPending ? 'Saving...' : editingUser ? 'Update User' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamLeadUsersPage;