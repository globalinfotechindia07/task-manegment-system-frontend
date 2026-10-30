import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineCheck,
  HiOutlineNoSymbol,
  HiOutlineUsers,
  HiOutlineXMark,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineEnvelope,
  HiOutlineBuildingOffice2,
  HiOutlineBriefcase,
} from 'react-icons/hi2';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';

/* ============================================================
   ROLE TYPES (UNCHANGED)
   ============================================================ */
const roleTypes = {
  User: [
    'Full Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'App Developer',
    'Marketing Executive',
  ],
};

/* ============================================================
   DESIGN TOKENS (same as all other pages)
   ============================================================ */
const tokens = {
  btnPrimary:
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg bg-indigo-600 text-white shadow-sm ' +
    'hover:bg-indigo-700 active:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ' +
    'transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  btnSecondary:
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg bg-white text-slate-700 border border-slate-300 shadow-sm ' +
    'hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
  input:
    'w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 ' +
    'placeholder:text-slate-400 transition-colors ' +
    'focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ' +
    'disabled:bg-slate-50 disabled:text-slate-500',
  label:
    'block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5',
  error: 'text-[11px] text-rose-600 mt-1',
  card: 'bg-white border border-slate-200 rounded-xl shadow-sm',
  tableHead:
    'bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200',
};

/* ============================================================
   HELPERS
   ============================================================ */
const Loader = () => (
  <div className="flex justify-center items-center py-12">
    <div className="w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
  </div>
);

const EmptyState = () => (
  <div className="py-12 px-6 text-center">
    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
      <HiOutlineUsers className="w-7 h-7" />
    </div>
    <h3 className="text-base font-semibold text-slate-900 mb-1">No team members</h3>
    <p className="text-xs text-slate-500 max-w-sm mx-auto">
      Click "Add User" to add members to your team.
    </p>
  </div>
);

const getPageNumbers = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const arr = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  arr.forEach((p, i) => {
    if (i > 0 && p - arr[i - 1] > 1) out.push('...');
    out.push(p);
  });
  return out;
};

const initials = (name) => (name ? name.trim().charAt(0).toUpperCase() : '?');

/* ============================================================
   BADGES
   ============================================================ */
const UserStatusBadge = ({ status }) => {
  const isInactive = status === 'Inactive';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${isInactive
        ? 'bg-slate-100 text-slate-600 border-slate-200'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isInactive ? 'bg-slate-400' : 'bg-emerald-500'
          }`}
      />
      {status || 'Active'}
    </span>
  );
};

const RoleBadge = ({ role }) => (
  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap">
    {role}
  </span>
);

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const TeamLeadUsersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const {
    register,
    handleSubmit,
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
      status: 'Active',
    },
  });

  /* ---------------- Query (UNCHANGED) ---------------- */
  const { data: users, isLoading } = useQuery({
    queryKey: ['team-users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });

  /* ---------------- Mutations (UNCHANGED) ---------------- */
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
    },
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
    },
  });

  /* ---------------- Handlers (UNCHANGED logic) ---------------- */
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
      status: 'Active',
    });
  };

  const openCreateModal = () => {
    setEditingUser(null);
    reset({
      name: '',
      email: '',
      password: '',
      role: 'User',
      designation: 'Full Stack Developer',
      department: 'IT',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  /* ---------------- ESC to close modal ---------------- */
  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  /* ---------------- Pagination (UNCHANGED logic) ---------------- */
  const usersList = Array.isArray(users) ? users : [];
  const paginatedUsers = usersList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(usersList.length / itemsPerPage);

  const isSaving = addMutation.isPending || updateMutation.isPending;

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      : '—';

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-6">
      {/* ===================== HEADER ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
            My Team Members
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage users in your team.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className={`${tokens.btnPrimary} w-full sm:w-auto px-4 py-2.5 text-sm`}
        >
          <HiOutlinePlus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* ===================== LIST ===================== */}
      <div className={`${tokens.card} overflow-hidden`}>
        {isLoading ? (
          <Loader />
        ) : !users || users.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* ---------- MOBILE CARDS ---------- */}
            <ul className="md:hidden divide-y divide-slate-100">
              {paginatedUsers.map((user) => (
                <li
                  key={user._id}
                  className={`p-4 hover:bg-slate-50/70 transition-colors ${user.status === 'Inactive' ? 'opacity-60' : ''
                    }`}
                >
                  {/* Header row: avatar + name + status */}
                  <div className="flex items-start gap-3 mb-2.5">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-sm shrink-0">
                      {initials(user.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 text-sm truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <UserStatusBadge status={user.status} />
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <RoleBadge role={user.role} />
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-700 text-[10px] font-semibold">
                      <HiOutlineBuildingOffice2 className="w-3 h-3" />
                      {user.department || '—'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-700 text-[10px] font-semibold">
                      <HiOutlineBriefcase className="w-3 h-3" />
                      {user.designation || '—'}
                    </span>
                  </div>

                  {/* Footer: joined + actions */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-medium">
                      Joined {fmtDate(user.createdAt)}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEdit(user)}
                        className="inline-flex items-center justify-center gap-1 px-2.5 min-h-[36px] rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
                        aria-label="Edit user"
                      >
                        <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user)}
                        className={`inline-flex items-center justify-center gap-1 px-2.5 min-h-[36px] rounded-lg text-xs font-semibold border transition-colors ${user.status === 'Inactive'
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                          }`}
                        aria-label={
                          user.status === 'Inactive' ? 'Activate user' : 'Deactivate user'
                        }
                      >
                        {user.status === 'Inactive' ? (
                          <HiOutlineCheck className="w-3.5 h-3.5" />
                        ) : (
                          <HiOutlineNoSymbol className="w-3.5 h-3.5" />
                        )}
                        {user.status === 'Inactive' ? 'Activate' : 'Deactivate'}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* ---------- DESKTOP TABLE ---------- */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 min-w-[900px]">
                <thead className={tokens.tableHead}>
                  <tr>
                    <th className="px-4 lg:px-5 py-3">Name</th>
                    <th className="px-4 lg:px-5 py-3">Email</th>
                    <th className="px-4 lg:px-5 py-3 w-24">Role</th>
                    <th className="px-4 lg:px-5 py-3 w-32">Department</th>
                    <th className="px-4 lg:px-5 py-3 w-40">Designation</th>
                    <th className="px-4 lg:px-5 py-3 w-24">Status</th>
                    <th className="px-4 lg:px-5 py-3 w-32 whitespace-nowrap">Joined</th>
                    <th className="px-4 lg:px-5 py-3 w-32 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user._id}
                      className={`hover:bg-slate-50/70 transition-colors ${user.status === 'Inactive' ? 'opacity-60 bg-slate-50/40' : ''
                        }`}
                    >
                      <td className="px-4 lg:px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold flex items-center justify-center shrink-0">
                            {initials(user.name)}
                          </div>
                          <span className="font-semibold text-slate-900 text-xs truncate max-w-[150px]">
                            {user.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-5 py-3 text-xs text-slate-600 truncate max-w-[180px]">
                        {user.email}
                      </td>
                      <td className="px-4 lg:px-5 py-3">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-4 lg:px-5 py-3 text-xs text-slate-600 truncate max-w-[110px]">
                        {user.department || '-'}
                      </td>
                      <td className="px-4 lg:px-5 py-3 text-xs text-slate-600 truncate max-w-[140px]">
                        {user.designation}
                      </td>
                      <td className="px-4 lg:px-5 py-3">
                        <UserStatusBadge status={user.status} />
                      </td>
                      <td className="px-4 lg:px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {fmtDate(user.createdAt)}
                      </td>
                      <td className="px-4 lg:px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(user)}
                            title="Edit User"
                            aria-label="Edit user"
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <HiOutlinePencilSquare className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user)}
                            title={
                              user.status === 'Inactive'
                                ? 'Activate User'
                                : 'Deactivate User'
                            }
                            aria-label={
                              user.status === 'Inactive'
                                ? 'Activate user'
                                : 'Deactivate user'
                            }
                            className={`p-2 rounded-lg transition-colors ${user.status === 'Inactive'
                              ? 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                          >
                            {user.status === 'Inactive' ? (
                              <HiOutlineCheck className="w-4 h-4" />
                            ) : (
                              <HiOutlineNoSymbol className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ---------- PAGINATION ---------- */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-3 border-t border-slate-200 bg-slate-50">
                <span className="text-xs text-slate-500 text-center sm:text-left">
                  Showing{' '}
                  <strong className="text-slate-700">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </strong>
                  –
                  <strong className="text-slate-700">
                    {Math.min(currentPage * itemsPerPage, usersList.length)}
                  </strong>{' '}
                  of <strong className="text-slate-700">{usersList.length}</strong> members
                </span>

                <div className="flex items-center justify-center sm:justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`${tokens.btnSecondary} px-2.5 py-1.5 text-xs`}
                    aria-label="Previous page"
                  >
                    <HiOutlineChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Prev</span>
                  </button>

                  <div className="flex gap-1 max-w-[200px] sm:max-w-none overflow-x-auto">
                    {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                      p === '...' ? (
                        <span
                          key={`dots-${idx}`}
                          className="w-7 h-7 flex items-center justify-center text-xs text-slate-400"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${currentPage === p
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`${tokens.btnSecondary} px-2.5 py-1.5 text-xs`}
                    aria-label="Next page"
                  >
                    <span className="hidden sm:inline mr-1">Next</span>
                    <HiOutlineChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===================== ADD / EDIT USER MODAL ===================== */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-modal-title"
        >
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl border-0 sm:border border-slate-200 shadow-2xl w-full sm:max-w-lg max-h-[95dvh] sm:max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="min-w-0">
                <h3
                  id="user-modal-title"
                  className="text-base sm:text-lg font-bold text-slate-900 truncate"
                >
                  {editingUser ? 'Edit User' : 'Add New Team Member'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">
                  {editingUser
                    ? 'Update user details and status.'
                    : 'Add a new member to your team.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 -mr-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors shrink-0"
                aria-label="Close"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1"
            >
              <div>
                <label className={tokens.label}>Full Name *</label>
                <input
                  type="text"
                  className={tokens.input}
                  placeholder="John Doe"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && <p className={tokens.error}>{errors.name.message}</p>}
              </div>

              <div>
                <label className={tokens.label}>Email Address *</label>
                <input
                  type="email"
                  className={tokens.input}
                  placeholder="john@globalinfotech.com"
                  {...register('email', { required: 'Email is required' })}
                />
                {errors.email && <p className={tokens.error}>{errors.email.message}</p>}
              </div>

              <div>
                <label className={tokens.label}>
                  Password{' '}
                  {editingUser && (
                    <span className="text-slate-400 font-normal normal-case">
                      (Leave blank to keep current)
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  className={tokens.input}
                  placeholder="••••••••"
                  {...register('password', {
                    required: editingUser ? false : 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' },
                  })}
                />
                {errors.password && (
                  <p className={tokens.error}>{errors.password.message}</p>
                )}
              </div>

              {/* Hidden role — value→defaultValue fixes React controlled warning */}
              <input type="hidden" {...register('role')} defaultValue="User" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className={tokens.label}>Department</label>
                  <select className={tokens.input} {...register('department')}>
                    <option value="IT">IT</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>

                <div>
                  <label className={tokens.label}>Designation</label>
                  <select className={tokens.input} {...register('designation')}>
                    {roleTypes['User'].map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {editingUser && (
                <div>
                  <label className={tokens.label}>Status</label>
                  <select className={tokens.input} {...register('status')}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}

              {/* Footer */}
              <div className="pt-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className={`${tokens.btnSecondary} px-4 py-2.5 text-sm`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`${tokens.btnPrimary} px-4 py-2.5 text-sm`}
                >
                  {isSaving && (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>
                    {isSaving
                      ? 'Saving…'
                      : editingUser
                        ? 'Update User'
                        : 'Add User'}
                  </span>
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