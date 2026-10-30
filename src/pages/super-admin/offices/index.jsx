import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  HiOutlinePlus, 
  HiOutlineMagnifyingGlass, 
  HiOutlineBuildingOffice2, 
  HiOutlinePencilSquare, 
  HiOutlineTrash, 
  HiOutlineXMark 
} from 'react-icons/hi2';
import api from '../../../api/axios';

const OfficesManager = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState(null);

  // New Office Form State
  const [newOffice, setNewOffice] = useState({
    name: '',
    companyCode: '',
    industry: 'Information Technology',
    location: '',
    address: '',
    contactEmail: '',
    phone: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    planId: '',
    durationDays: 30
  });

  // Subscription Edit State
  const [subForm, setSubForm] = useState({
    planId: '',
    durationDays: 30,
    status: 'Active',
    maxEmployees: 20
  });

  // Edit Office State
  const [editForm, setEditForm] = useState({
    name: '',
    industry: '',
    location: '',
    address: '',
    contactEmail: '',
    phone: '',
    status: 'Active'
  });

  // Fetch Companies
  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ['allCompanies'],
    queryFn: async () => {
      const { data } = await api.get('/companies');
      return data;
    }
  });

  // Fetch Subscription Plans
  const { data: plans } = useQuery({
    queryKey: ['plansList'],
    queryFn: async () => {
      const { data } = await api.get('/plans');
      return data;
    }
  });

  // Register Mutation
  const registerMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/companies/register-office', payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Office & Admin registered successfully!');
      queryClient.invalidateQueries({ queryKey: ['allCompanies'] });
      queryClient.invalidateQueries({ queryKey: ['platformStats'] });
      setIsRegisterOpen(false);
      setNewOffice({
        name: '',
        companyCode: '',
        industry: 'Information Technology',
        location: '',
        address: '',
        contactEmail: '',
        phone: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        planId: '',
        durationDays: 30
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to register office');
    }
  });

  // Update Subscription Mutation
  const subscriptionMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.put(`/companies/${id}/subscription`, payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Subscription updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['allCompanies'] });
      queryClient.invalidateQueries({ queryKey: ['platformStats'] });
      setIsSubscriptionOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update subscription');
    }
  });

  // Edit Office Profile Mutation
  const editMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.put(`/companies/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Office profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['allCompanies'] });
      setIsEditOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update office details');
    }
  });

  // Delete Office Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/companies/${id}`);
      return data;
    },
    onSuccess: () => {
      toast.success('Office deleted permanently!');
      queryClient.invalidateQueries({ queryKey: ['allCompanies'] });
      queryClient.invalidateQueries({ queryKey: ['platformStats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete office');
    }
  });

  const handleOpenSubscription = (comp) => {
    setSelectedOffice(comp);
    setSubForm({
      planId: comp.subscription?.plan?._id || comp.subscription?.plan || '',
      durationDays: 30,
      status: comp.subscription?.status || 'Active',
      maxEmployees: comp.subscription?.maxEmployees || 20
    });
    setIsSubscriptionOpen(true);
  };

  const handleOpenEdit = (comp) => {
    setSelectedOffice(comp);
    setEditForm({
      name: comp.name || '',
      industry: comp.industry || '',
      location: comp.location || '',
      address: comp.address || '',
      contactEmail: comp.contactEmail || '',
      phone: comp.phone || '',
      status: comp.status || 'Active'
    });
    setIsEditOpen(true);
  };

  const handleDelete = (comp) => {
    if (window.confirm(`Are you sure you want to delete "${comp.name}"? This will remove all associated users, policies, and company data!`)) {
      deleteMutation.mutate(comp._id);
    }
  };

  const filteredCompanies = companies?.filter((comp) => {
    const matchesSearch =
      comp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.companyCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.adminUser?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || comp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Registered Offices & Branches</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage multi-office tenant organizations, assign subscription plans, and monitor resource quotas.
          </p>
        </div>
        <button
          onClick={() => setIsRegisterOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-xs cursor-pointer"
        >
          <HiOutlinePlus className="w-5 h-5" />
          Register New Office
        </button>
      </div>

      {/* Controls & Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search by company, code, admin, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
          <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 font-semibold">Status:</span>
          {['All', 'Active', 'Suspended', 'Inactive'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Offices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {companiesLoading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredCompanies?.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <HiOutlineBuildingOffice2 className="w-6 h-6" />
            </div>
            <h3 className="text-slate-900 font-semibold text-base">No offices found</h3>
            <p className="text-slate-500 text-xs mt-1">Try adjusting your search criteria or register a new office.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Office & Branch</th>
                  <th className="py-3.5 px-4 font-semibold">Admin Lead</th>
                  <th className="py-3.5 px-4 font-semibold">Subscription Plan</th>
                  <th className="py-3.5 px-4 font-semibold">Seat Allocation</th>
                  <th className="py-3.5 px-4 font-semibold">Status & Validity</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCompanies?.map((comp) => {
                  const maxLimit = comp.subscription?.maxEmployees || 20;
                  const currentCount = comp.currentEmployeeCount || 0;
                  const usagePercent = Math.min(100, Math.round((currentCount / maxLimit) * 100));
                  const startDate = comp.subscription?.startDate ? new Date(comp.subscription.startDate) : (comp.createdAt ? new Date(comp.createdAt) : null);
                  const expiryDate = comp.subscription?.endDate ? new Date(comp.subscription.endDate) : null;
                  const isExpired = expiryDate && expiryDate < new Date();
                  const remainingDays = expiryDate && !isExpired ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : null;

                  return (
                    <tr key={comp._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{comp.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                            {comp.companyCode}
                          </span>
                          <span>{comp.industry || 'IT'}</span>
                          {comp.location && <span>• {comp.location}</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 font-medium text-xs">{comp.adminUser?.name || 'Unassigned'}</div>
                        <div className="text-xs text-slate-500">{comp.adminUser?.email || comp.contactEmail}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold">
                          {comp.subscription?.planName || 'Pro Plan'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className={`h-full rounded-full transition-all ${
                                usagePercent >= 90 ? 'bg-rose-500' : 'bg-indigo-600'
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-mono text-slate-700 font-medium">
                            {currentCount} / {maxLimit}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {maxLimit - currentCount > 0 ? `${maxLimit - currentCount} seats free` : 'Max limit reached'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                              isExpired
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : comp.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {isExpired ? 'Expired' : comp.status}
                          </span>
                          {remainingDays !== null && !isExpired && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                              remainingDays <= 5
                                ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {remainingDays} days left
                            </span>
                          )}
                        </div>
                        <div className="space-y-0.5 text-[11px]">
                          <div className="text-slate-500 flex items-center justify-between gap-2">
                            <span>Subscribed:</span>
                            <span className="text-slate-700 font-medium font-mono">
                              {startDate ? startDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                            </span>
                          </div>
                          <div className="text-slate-500 flex items-center justify-between gap-2">
                            <span>Expires:</span>
                            <span className={`font-medium font-mono ${isExpired ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                              {expiryDate ? expiryDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenSubscription(comp)}
                            className="px-2.5 py-1 text-xs rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors font-medium cursor-pointer"
                            title="Manage Subscription"
                          >
                            Subscription
                          </button>
                          <button
                            onClick={() => handleOpenEdit(comp)}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer"
                            title="Edit Office Details"
                          >
                            <HiOutlinePencilSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(comp)}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Office"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Register Office & Admin */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsRegisterOpen(false)}></div>
          <div className="relative bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Register New Company / Office</h3>
                <p className="text-xs text-slate-500 mt-0.5">Provision a new isolated tenant with office admin credentials.</p>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                registerMutation.mutate(newOffice);
              }}
              className="mt-4 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Office Name *</label>
                  <input
                    type="text"
                    required
                    value={newOffice.name}
                    onChange={(e) => setNewOffice({ ...newOffice, name: e.target.value })}
                    placeholder="e.g. Apex Technologies Pune"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company Code (Optional)</label>
                  <input
                    type="text"
                    value={newOffice.companyCode}
                    onChange={(e) => setNewOffice({ ...newOffice, companyCode: e.target.value.toUpperCase() })}
                    placeholder="Auto-generated if empty (e.g. APEX-101)"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Industry</label>
                  <input
                    type="text"
                    value={newOffice.industry}
                    onChange={(e) => setNewOffice({ ...newOffice, industry: e.target.value })}
                    placeholder="Information Technology, Healthcare, etc."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City / Location</label>
                  <input
                    type="text"
                    value={newOffice.location}
                    onChange={(e) => setNewOffice({ ...newOffice, location: e.target.value })}
                    placeholder="Pune, Maharashtra"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Admin Details Section */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase text-indigo-600 tracking-wider mb-2">Office Admin Credentials</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Full Name *</label>
                    <input
                      type="text"
                      required
                      value={newOffice.adminName}
                      onChange={(e) => setNewOffice({ ...newOffice, adminName: e.target.value })}
                      placeholder="Rohit Sharma"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Email *</label>
                    <input
                      type="email"
                      required
                      value={newOffice.adminEmail}
                      onChange={(e) => setNewOffice({ ...newOffice, adminEmail: e.target.value })}
                      placeholder="admin@apextech.com"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Password *</label>
                    <input
                      type="password"
                      required
                      value={newOffice.adminPassword}
                      onChange={(e) => setNewOffice({ ...newOffice, adminPassword: e.target.value })}
                      placeholder="Min 6 characters"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Subscription Plan Picker */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase text-indigo-600 tracking-wider mb-2">Subscription & Plan Allocation</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Select Subscription Tier</label>
                    <select
                      value={newOffice.planId}
                      onChange={(e) => setNewOffice({ ...newOffice, planId: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">-- Choose Plan Tier --</option>
                      {plans?.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} - ₹{p.price} ({p.maxEmployees} users)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Subscription Validity (Days)</label>
                    <input
                      type="number"
                      min="1"
                      value={newOffice.durationDays}
                      onChange={(e) => setNewOffice({ ...newOffice, durationDays: parseInt(e.target.value) || 30 })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {registerMutation.isPending ? 'Registering...' : 'Provision Office'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manage Subscription */}
      {isSubscriptionOpen && selectedOffice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsSubscriptionOpen(false)}></div>
          <div className="relative bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Manage Subscription</h3>
                <p className="text-xs text-slate-500 mt-0.5">Office: <span className="text-indigo-600 font-semibold">{selectedOffice.name}</span></p>
              </div>
              <button
                onClick={() => setIsSubscriptionOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Current Dates Display */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs grid grid-cols-2 gap-2 mt-4">
              <div>
                <span className="text-slate-500 block text-[11px]">Subscribed On:</span>
                <span className="font-mono text-slate-900 font-semibold">
                  {selectedOffice.subscription?.startDate
                    ? new Date(selectedOffice.subscription.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : (selectedOffice.createdAt ? new Date(selectedOffice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Current Expiry Date:</span>
                <span className="font-mono text-indigo-700 font-semibold">
                  {selectedOffice.subscription?.endDate
                    ? new Date(selectedOffice.subscription.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'N/A'}
                </span>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                subscriptionMutation.mutate({ id: selectedOffice._id, payload: subForm });
              }}
              className="mt-3 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Upgrade / Change Plan</label>
                <select
                  value={subForm.planId}
                  onChange={(e) => setSubForm({ ...subForm, planId: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Keep Existing Plan</option>
                  {plans?.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} - ₹{p.price} ({p.maxEmployees} employees max)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Extend Validity (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={subForm.durationDays}
                    onChange={(e) => setSubForm({ ...subForm, durationDays: parseInt(e.target.value) || 30 })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Seats Override</label>
                  <input
                    type="number"
                    min="1"
                    value={subForm.maxEmployees}
                    onChange={(e) => setSubForm({ ...subForm, maxEmployees: parseInt(e.target.value) || 20 })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subscription Status</label>
                <select
                  value={subForm.status}
                  onChange={(e) => setSubForm({ ...subForm, status: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Active">Active (Unrestricted)</option>
                  <option value="Suspended">Suspended (Access Blocked)</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSubscriptionOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subscriptionMutation.isPending}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {subscriptionMutation.isPending ? 'Updating...' : 'Save Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Office Info */}
      {isEditOpen && selectedOffice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsEditOpen(false)}></div>
          <div className="relative bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Edit Office Information</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                editMutation.mutate({ id: selectedOffice._id, payload: editForm });
              }}
              className="mt-4 space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Industry</label>
                  <input
                    type="text"
                    value={editForm.industry}
                    onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={editForm.contactEmail}
                    onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Overall Office Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editMutation.isPending}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {editMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficesManager;