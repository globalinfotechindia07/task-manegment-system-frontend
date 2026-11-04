import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  HiOutlineUserGroup,
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineArrowRightCircle,
  HiOutlineCurrencyRupee,
  HiOutlineBuildingOffice2,
  HiOutlineArrowPath,
} from 'react-icons/hi2';
import api from '../../../../api/axios';

const LeadsManager = () => {
  const queryClient = useQueryClient();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [convertingLead, setConvertingLead] = useState(null);

  // Form State for Create / Edit
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    title: '',
    value: 0,
    status: 'New',
    source: 'Website',
    priority: 'Medium',
    notes: '',
  });

  // Form State for Convert
  const [convertData, setConvertData] = useState({
    dealTitle: '',
    dealAmount: 0,
    dealStage: 'Proposal',
    createCustomer: true,
  });

  // Fetch leads
  const { data: leads = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['crmLeads', statusFilter, sourceFilter, priorityFilter],
    queryFn: async () => {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (sourceFilter !== 'ALL') params.source = sourceFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      const { data } = await api.get('/crm/leads', { params });
      return data;
    },
  });

  // Client-side search filtering
  const filteredLeads = useMemo(() => {
    if (!searchTerm.trim()) return leads;
    const term = searchTerm.trim().toLowerCase();
    return leads.filter(
      (l) =>
        l.name?.toLowerCase().includes(term) ||
        l.companyName?.toLowerCase().includes(term) ||
        l.email?.toLowerCase().includes(term) ||
        l.phone?.toLowerCase().includes(term) ||
        l.title?.toLowerCase().includes(term)
    );
  }, [leads, searchTerm]);

  // Lead metrics
  const stats = useMemo(() => {
    return {
      total: leads.length,
      newCount: leads.filter((l) => l.status === 'New').length,
      contacted: leads.filter((l) => l.status === 'Contacted').length,
      qualified: leads.filter((l) => l.status === 'Qualified').length,
      won: leads.filter((l) => l.status === 'Won').length,
      totalValue: leads.reduce((sum, l) => sum + (Number(l.value) || 0), 0),
    };
  }, [leads]);

  // Create or Update Mutation
  const saveLeadMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingLead) {
        const { data } = await api.put(`/crm/leads/${editingLead._id}`, payload);
        return data;
      } else {
        const { data } = await api.post('/crm/leads', payload);
        return data;
      }
    },
    onSuccess: () => {
      toast.success(editingLead ? 'Lead updated successfully!' : 'Lead created successfully!');
      setIsCreateModalOpen(false);
      setEditingLead(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['crmLeads'] });
      queryClient.invalidateQueries({ queryKey: ['crmStats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save lead');
    },
  });

  // Delete Mutation
  const deleteLeadMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/crm/leads/${id}`);
      return data;
    },
    onSuccess: () => {
      toast.success('Lead deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['crmLeads'] });
      queryClient.invalidateQueries({ queryKey: ['crmStats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete lead');
    },
  });

  // Convert Mutation
  const convertMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.post(`/crm/leads/${id}/convert`, payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Lead converted to deal & customer account!');
      setConvertingLead(null);
      queryClient.invalidateQueries({ queryKey: ['crmLeads'] });
      queryClient.invalidateQueries({ queryKey: ['crmDeals'] });
      queryClient.invalidateQueries({ queryKey: ['crmCustomers'] });
      queryClient.invalidateQueries({ queryKey: ['crmStats'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to convert lead');
    },
  });

  // Quick inline status change
  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await api.put(`/crm/leads/${leadId}`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      queryClient.invalidateQueries({ queryKey: ['crmLeads'] });
      queryClient.invalidateQueries({ queryKey: ['crmStats'] });
    } catch {
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      companyName: '',
      email: '',
      phone: '',
      title: '',
      value: 0,
      status: 'New',
      source: 'Website',
      priority: 'Medium',
      notes: '',
    });
  };

  const openCreateModal = () => {
    resetForm();
    setEditingLead(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name || '',
      companyName: lead.companyName || '',
      email: lead.email || '',
      phone: lead.phone || '',
      title: lead.title || '',
      value: lead.value || 0,
      status: lead.status || 'New',
      source: lead.source || 'Website',
      priority: lead.priority || 'Medium',
      notes: lead.notes || '',
    });
    setIsCreateModalOpen(true);
  };

  const openConvertModal = (lead) => {
    setConvertingLead(lead);
    setConvertData({
      dealTitle: lead.title || `${lead.companyName || lead.name} Cloud Contract`,
      dealAmount: lead.value || 0,
      dealStage: 'Proposal',
      createCustomer: true,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Lead contact person name is required');
    saveLeadMutation.mutate(formData);
  };

  const handleConvertSubmit = (e) => {
    e.preventDefault();
    if (!convertingLead) return;
    convertMutation.mutate({ id: convertingLead._id, payload: convertData });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ===================== PAGE HEADER ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Leads & Inquiries Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {stats.total} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Capture, qualify, and convert prospective business inquiries into active deals and customer accounts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            title="Refresh Leads"
          >
            <HiOutlineArrowPath className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span>Create New Lead</span>
          </button>
        </div>
      </div>

      {/* ===================== METRIC CARDS STRIP ===================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Leads</span>
          <span className="text-lg font-black text-slate-900 font-mono mt-0.5 block">{stats.total}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">New Inquiries</span>
          <span className="text-lg font-black text-blue-700 font-mono mt-0.5 block">{stats.newCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Contacted</span>
          <span className="text-lg font-black text-amber-700 font-mono mt-0.5 block">{stats.contacted}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Qualified</span>
          <span className="text-lg font-black text-purple-700 font-mono mt-0.5 block">{stats.qualified}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Won / Converted</span>
          <span className="text-lg font-black text-emerald-700 font-mono mt-0.5 block">{stats.won}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Est. Pipeline</span>
          <span className="text-lg font-black text-slate-900 font-mono mt-0.5 block">₹{stats.totalValue.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* ===================== SEARCH & FILTER BAR ===================== */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search lead person, company, email, inquiry requirement..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <HiOutlineXMark className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <HiOutlineFunnel className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-700 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Proposal">Proposal</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          {/* Source */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-transparent text-slate-700 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Sources</option>
              <option value="Website">Website</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Referral">Referral</option>
              <option value="Cold Call">Cold Call</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Social Media">Social Media</option>
              <option value="Email Campaign">Email Campaign</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-slate-700 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {(searchTerm || statusFilter !== 'ALL' || sourceFilter !== 'ALL' || priorityFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setSourceFilter('ALL');
                setPriorityFilter('ALL');
              }}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ===================== LEADS TABLE ===================== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <HiOutlineUserGroup className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No leads found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'ALL'
                ? 'Try clearing your filters to see all prospective customer inquiries.'
                : 'Get started by creating your first sales lead inquiry.'}
            </p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
            >
              <HiOutlinePlus className="w-4 h-4" />
              Add Lead Inquiry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Lead Contact & Company</th>
                  <th className="py-3 px-4">Inquiry Requirement</th>
                  <th className="py-3 px-4 text-right">Est. Value</th>
                  <th className="py-3 px-4">Channel & Priority</th>
                  <th className="py-3 px-4">Pipeline Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLeads.map((lead) => {
                  const priorityColors = {
                    Urgent: 'bg-rose-50 text-rose-700 border-rose-200',
                    High: 'bg-amber-50 text-amber-700 border-amber-200',
                    Medium: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    Low: 'bg-slate-100 text-slate-600 border-slate-200',
                  };

                  return (
                    <tr key={lead._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Company */}
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{lead.name}</span>
                          {lead.isConverted && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                              Converted
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {lead.companyName || 'Individual Contact'}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone}`}
                              className="hover:text-indigo-600 flex items-center gap-1"
                              title="Call Lead"
                            >
                              <HiOutlinePhone className="w-3 h-3" />
                              {lead.phone}
                            </a>
                          )}
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              className="hover:text-indigo-600 flex items-center gap-1 truncate max-w-[140px]"
                              title="Email Lead"
                            >
                              <HiOutlineEnvelope className="w-3 h-3" />
                              {lead.email}
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Requirement */}
                      <td className="py-3.5 px-4 min-w-[180px]">
                        <div className="font-semibold text-slate-900 truncate">
                          {lead.title || 'General Inbound Inquiry'}
                        </div>
                        {lead.notes && (
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {lead.notes}
                          </div>
                        )}
                      </td>

                      {/* Estimated Value */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          ₹{Number(lead.value || 0).toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-400">Budget</span>
                      </td>

                      {/* Channel & Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 text-xs">{lead.source}</div>
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold border mt-0.5 ${
                            priorityColors[lead.priority] || priorityColors.Medium
                          }`}
                        >
                          {lead.priority} Priority
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                          className="py-1 px-2 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Proposal">Proposal</option>
                          <option value="Negotiation">Negotiation</option>
                          <option value="Won">Won</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {!lead.isConverted && (
                            <button
                              onClick={() => openConvertModal(lead)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold cursor-pointer transition-colors inline-flex items-center gap-1"
                              title="Convert to Deal / Customer"
                            >
                              <HiOutlineArrowRightCircle className="w-3.5 h-3.5" />
                              Convert
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(lead)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                            title="Edit Lead"
                          >
                            <HiOutlinePencilSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete lead "${lead.name}"?`)) {
                                deleteLeadMutation.mutate(lead._id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                            title="Delete Lead"
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

      {/* ===================== CREATE / EDIT LEAD MODAL ===================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden my-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <HiOutlineUserGroup className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingLead ? 'Edit Lead Inquiry' : 'Add New Lead Inquiry'}
                  </h3>
                  <p className="text-xs text-slate-500">Record sales prospect and inquiry details</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Contact Person Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Organization / Company
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
                    placeholder="e.g. Apex Tech Solutions"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="client@company.com"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Inquiry Title / Requirement
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Enterprise Cloud ERP Setup for 50 Users"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Estimated Value (₹)</label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData((prev) => ({ ...prev, value: Number(e.target.value) }))}
                    min="0"
                    step="1000"
                    className="w-full py-2 px-3 font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Lead Channel</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData((prev) => ({ ...prev, source: e.target.value }))}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                  >
                    <option value="Website">Website</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Referral">Referral</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Email Campaign">Email Campaign</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Internal Notes</label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional context about client requirement, timeline, or decision maker..."
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLeadMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {saveLeadMutation.isPending ? 'Saving...' : editingLead ? 'Update Lead' : 'Save Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== CONVERT LEAD MODAL ===================== */}
      {convertingLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md overflow-hidden my-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 bg-emerald-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <HiOutlineArrowRightCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Convert Lead to Pipeline Deal</h3>
                  <p className="text-xs text-slate-600">Advance {convertingLead.name} into an active deal</p>
                </div>
              </div>
              <button
                onClick={() => setConvertingLead(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConvertSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Deal Title</label>
                <input
                  type="text"
                  required
                  value={convertData.dealTitle}
                  onChange={(e) => setConvertData((prev) => ({ ...prev, dealTitle: e.target.value }))}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Deal Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={convertData.dealAmount}
                  onChange={(e) => setConvertData((prev) => ({ ...prev, dealAmount: Number(e.target.value) }))}
                  className="w-full py-2 px-3 font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Target Pipeline Stage</label>
                <select
                  value={convertData.dealStage}
                  onChange={(e) => setConvertData((prev) => ({ ...prev, dealStage: e.target.value }))}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                >
                  <option value="Proposal">Proposal Sent</option>
                  <option value="Negotiation">In Negotiation</option>
                  <option value="Closed Won">Closed Won (Immediate)</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-slate-800 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={convertData.createCustomer}
                    onChange={(e) => setConvertData((prev) => ({ ...prev, createCustomer: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Create Account in Customer Directory automatically</span>
                </label>
                <p className="text-[10px] text-slate-400 mt-0.5 ml-6">
                  Saves contact details to customer directory for invoicing and account tracking.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setConvertingLead(null)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={convertMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {convertMutation.isPending ? 'Converting...' : 'Confirm Conversion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsManager;

