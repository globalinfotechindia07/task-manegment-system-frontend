import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  HiOutlineBuildingStorefront,
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineArrowPath,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineCurrencyRupee,
  HiOutlineBuildingOffice2,
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineGlobeAlt,
  HiOutlineMapPin,
  HiOutlineXMark,
  HiOutlineStar,
  HiOutlineCheckCircle,
  HiOutlineUserGroup,
} from 'react-icons/hi2';
import api from '../../../../api/axios';

const CUSTOMER_STATUSES = ['Active', 'VIP', 'Lead Converted', 'Inactive'];

const STATUS_CONFIG = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  VIP: 'bg-purple-50 text-purple-700 border-purple-200 font-bold',
  'Lead Converted': 'bg-blue-50 text-blue-700 border-blue-200',
  Inactive: 'bg-slate-100 text-slate-600 border-slate-200',
};

const INDUSTRIES = [
  'Technology & Software',
  'Manufacturing & Industrial',
  'Financial Services & Fintech',
  'Healthcare & Pharmaceuticals',
  'Retail & E-Commerce',
  'Consulting & Professional Services',
  'Logistics & Supply Chain',
  'Education & Training',
  'Real Estate & Construction',
  'Other',
];

const CustomersManager = () => {
  const queryClient = useQueryClient();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  // Form state
  const initialFormState = {
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    industry: 'Technology & Software',
    website: '',
    address: '',
    totalSpend: 0,
    status: 'Active',
    notes: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  // Fetch Customers
  const {
    data: customers = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['customers', statusFilter],
    queryFn: async () => {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const { data } = await api.get('/crm/customers', { params });
      return data;
    },
  });

  // Create Customer Mutation
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/crm/customers', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      queryClient.invalidateQueries(['crmStats']);
      toast.success('Customer account registered!');
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create customer');
    },
  });

  // Update Customer Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.put(`/crm/customers/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      queryClient.invalidateQueries(['crmStats']);
      toast.success('Customer account updated!');
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update customer');
    },
  });

  // Delete Customer Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/crm/customers/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      queryClient.invalidateQueries(['crmStats']);
      toast.success('Customer record removed');
      setCustomerToDelete(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete customer');
    },
  });

  // Filter customers in memory by search term
  const filteredCustomers = useMemo(() => {
    let list = [...customers];
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(term) ||
          c.contactPerson?.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term) ||
          c.phone?.toLowerCase().includes(term) ||
          c.industry?.toLowerCase().includes(term) ||
          c.address?.toLowerCase().includes(term)
      );
    }
    return list;
  }, [customers, searchTerm]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const totalCount = customers.length;
    const activeCount = customers.filter((c) => c.status === 'Active').length;
    const vipCount = customers.filter((c) => c.status === 'VIP').length;
    const totalSpend = customers.reduce((sum, c) => sum + (Number(c.totalSpend) || 0), 0);

    return { totalCount, activeCount, vipCount, totalSpend };
  }, [customers]);

  // Modal Handlers
  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (cust) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name || '',
      contactPerson: cust.contactPerson || '',
      email: cust.email || '',
      phone: cust.phone || '',
      industry: cust.industry || 'Technology & Software',
      website: cust.website || '',
      address: cust.address || '',
      totalSpend: cust.totalSpend || 0,
      status: cust.status || 'Active',
      notes: cust.notes || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setFormData(initialFormState);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return toast.error('Customer / Company name is required');
    }

    const payload = {
      ...formData,
      totalSpend: Number(formData.totalSpend) || 0,
    };

    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer._id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ===================== PAGE HEADER ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Customer Accounts Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Accounts & LTV
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Central repository of corporate client accounts, key stakeholders, and customer lifetime value.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
            title="Refresh Customers"
          >
            <HiOutlineArrowPath
              className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`}
            />
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* ===================== SUMMARY STATS ROW ===================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Accounts
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <HiOutlineBuildingStorefront className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">
              {aggregateStats.totalCount}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Active corporate clients</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Active Clients
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <HiOutlineCheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-emerald-700">
              {aggregateStats.activeCount}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Engaged accounts</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              VIP Tier
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <HiOutlineStar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-purple-700">
              {aggregateStats.vipCount}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Key enterprise accounts</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Cumulative LTV
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <HiOutlineCurrencyRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">
              ₹{aggregateStats.totalSpend.toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Total client billed value</span>
        </div>
      </div>

      {/* ===================== FILTER & SEARCH BAR ===================== */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search accounts by name, contact, email, phone, industry..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <HiOutlineXMark className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <HiOutlineFunnel className="w-4 h-4 text-slate-400" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 font-medium focus:bg-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Accounts ({customers.length})</option>
            {CUSTOMER_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st} ({customers.filter((c) => c.status === st).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ===================== CUSTOMERS DIRECTORY TABLE ===================== */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Account / Organization</th>
                <th className="py-3 px-4">Primary Contact</th>
                <th className="py-3 px-4">Industry</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Lifetime Spend (LTV)</th>
                <th className="py-3 px-4">Client Since</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading customer accounts...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No customer accounts match your criteria. Click &quot;Add Customer&quot; to register your first account.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const statusBadgeClass =
                    STATUS_CONFIG[cust.status] || STATUS_CONFIG.Active;

                  return (
                    <tr key={cust._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Company Name & Website */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-[240px]">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {cust.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="truncate block font-semibold text-slate-900">
                              {cust.name}
                            </span>
                            {cust.website && (
                              <a
                                href={
                                  cust.website.startsWith('http')
                                    ? cust.website
                                    : `https://${cust.website}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-normal"
                              >
                                <HiOutlineGlobeAlt className="w-3 h-3 shrink-0" />
                                <span className="truncate">{cust.website.replace(/^https?:\/\//, '')}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact Person */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {cust.contactPerson || '—'}
                        </div>
                        <div className="text-[11px] text-slate-500 space-y-0.5 mt-0.5">
                          {cust.email && (
                            <div className="flex items-center gap-1 truncate">
                              <HiOutlineEnvelope className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{cust.email}</span>
                            </div>
                          )}
                          {cust.phone && (
                            <div className="flex items-center gap-1 truncate">
                              <HiOutlinePhone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{cust.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Industry */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                          {cust.industry || 'General'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadgeClass}`}
                        >
                          {cust.status === 'VIP' && <HiOutlineStar className="w-3 h-3 mr-1" />}
                          {cust.status}
                        </span>
                      </td>

                      {/* Lifetime Spend */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ₹{Number(cust.totalSpend || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(cust.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(cust)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Account"
                          >
                            <HiOutlinePencilSquare className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomerToDelete(cust)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Account"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================== CREATE / EDIT CUSTOMER MODAL ===================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingCustomer ? 'Edit Customer Account' : 'Register Customer Account'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Update corporate account profile, contact details, and account standing.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company / Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Zenith Tech Solutions Ltd"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Sneha Patel"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. billing@zenithtech.com"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +91 98200 12345"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Industry Sector
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="e.g. https://zenithtech.com"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    {CUSTOMER_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lifetime Spend (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.totalSpend}
                    onChange={(e) => setFormData({ ...formData, totalSpend: e.target.value })}
                    placeholder="0"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Office / Billing Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Suite 402, BKC, Bandra East, Mumbai, Maharashtra"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Notes & Relationships
                </label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Contract terms, renewal dates, preferences..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingCustomer
                    ? 'Save Changes'
                    : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRMATION MODAL ===================== */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 text-center">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <HiOutlineTrash className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Delete Customer Account?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to remove <span className="font-semibold text-slate-800">{customerToDelete.name}</span> from the directory?
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(customerToDelete._id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersManager;

