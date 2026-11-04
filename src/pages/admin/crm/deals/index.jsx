import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineBriefcase,
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineArrowPath,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineCurrencyRupee,
  HiOutlineCalendarDays,
  HiOutlineBuildingOffice2,
  HiOutlineUser,
  HiOutlineViewColumns,
  HiOutlineTableCells,
  HiOutlineXMark,
  HiOutlineChevronRight,
  HiOutlineChevronLeft,
  HiOutlineCheckCircle,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineArrowTrendingUp,
} from 'react-icons/hi2';
import api from '../../../../api/axios';

const STAGES = ['Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

const STAGE_CONFIG = {
  Discovery: {
    color: 'border-slate-300 text-slate-700 bg-slate-50',
    headerBg: 'bg-slate-100/80 text-slate-800 border-slate-300',
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
    defaultProb: 20,
  },
  Proposal: {
    color: 'border-blue-300 text-blue-700 bg-blue-50/40',
    headerBg: 'bg-blue-50 text-blue-900 border-blue-200',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    defaultProb: 50,
  },
  Negotiation: {
    color: 'border-amber-300 text-amber-700 bg-amber-50/40',
    headerBg: 'bg-amber-50 text-amber-900 border-amber-200',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    defaultProb: 80,
  },
  'Closed Won': {
    color: 'border-emerald-300 text-emerald-700 bg-emerald-50/40',
    headerBg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    defaultProb: 100,
  },
  'Closed Lost': {
    color: 'border-rose-300 text-rose-700 bg-rose-50/40',
    headerBg: 'bg-rose-50 text-rose-900 border-rose-200',
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
    defaultProb: 0,
  },
};

const DealsPipeline = () => {
  const queryClient = useQueryClient();

  // View state: 'kanban' | 'table'
  const [viewMode, setViewMode] = useState('kanban');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [dealToDelete, setDealToDelete] = useState(null);

  // Form state
  const initialFormState = {
    title: '',
    clientName: '',
    clientCompany: '',
    clientEmail: '',
    clientPhone: '',
    amount: '',
    stage: 'Discovery',
    probability: 20,
    expectedCloseDate: '',
    assignedTo: '',
    notes: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  // Fetch Deals
  const {
    data: deals = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['deals', stageFilter],
    queryFn: async () => {
      const params = {};
      if (stageFilter !== 'ALL') params.stage = stageFilter;
      const { data } = await api.get('/crm/deals', { params });
      return data;
    },
  });

  // Fetch staff users for assignedTo dropdown
  const { data: users = [] } = useQuery({
    queryKey: ['companyUsersList'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return Array.isArray(data) ? data : data?.users || [];
    },
  });

  // Create Deal Mutation
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/crm/deals', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
      queryClient.invalidateQueries(['crmStats']);
      toast.success('Deal added to pipeline!');
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create deal');
    },
  });

  // Update Deal Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.put(`/crm/deals/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
      queryClient.invalidateQueries(['crmStats']);
      toast.success('Deal updated successfully!');
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update deal');
    },
  });

  // Stage Switch Mutation (quick advance/move)
  const stageMutation = useMutation({
    mutationFn: async ({ id, newStage }) => {
      const { data } = await api.put(`/crm/deals/${id}`, { stage: newStage });
      return data;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries(['deals']);
      queryClient.invalidateQueries(['crmStats']);
      toast.success(`Deal moved to ${updated.stage}`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update stage');
    },
  });

  // Delete Deal Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/crm/deals/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
      queryClient.invalidateQueries(['crmStats']);
      toast.success('Deal removed from pipeline');
      setDealToDelete(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete deal');
    },
  });

  // Filter deals by search term
  const filteredDeals = useMemo(() => {
    let list = [...deals];
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.title?.toLowerCase().includes(term) ||
          d.clientName?.toLowerCase().includes(term) ||
          d.clientCompany?.toLowerCase().includes(term) ||
          d.clientEmail?.toLowerCase().includes(term) ||
          d.clientPhone?.toLowerCase().includes(term)
      );
    }
    return list;
  }, [deals, searchTerm]);

  // Group deals by stage for Kanban view
  const groupedDeals = useMemo(() => {
    const groups = {};
    STAGES.forEach((s) => {
      groups[s] = [];
    });
    filteredDeals.forEach((d) => {
      if (groups[d.stage]) {
        groups[d.stage].push(d);
      } else {
        groups.Discovery.push(d);
      }
    });
    return groups;
  }, [filteredDeals]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalDeals = deals.length;
    const activePipeline = deals.filter(
      (d) => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost'
    );
    const activeValue = activePipeline.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const wonDeals = deals.filter((d) => d.stage === 'Closed Won');
    const wonRevenue = wonDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const winRate = totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0;

    return { totalDeals, activeValue, wonRevenue, winRate };
  }, [deals]);

  // Modal Handlers
  const openCreateModal = () => {
    setEditingDeal(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (deal) => {
    setEditingDeal(deal);
    setFormData({
      title: deal.title || '',
      clientName: deal.clientName || '',
      clientCompany: deal.clientCompany || '',
      clientEmail: deal.clientEmail || '',
      clientPhone: deal.clientPhone || '',
      amount: deal.amount || '',
      stage: deal.stage || 'Discovery',
      probability: deal.probability !== undefined ? deal.probability : 20,
      expectedCloseDate: deal.expectedCloseDate
        ? new Date(deal.expectedCloseDate).toISOString().split('T')[0]
        : '',
      assignedTo: deal.assignedTo?._id || deal.assignedTo || '',
      notes: deal.notes || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDeal(null);
    setFormData(initialFormState);
  };

  const handleStageSelectChange = (newStage) => {
    const defaultProb = STAGE_CONFIG[newStage]?.defaultProb ?? 20;
    setFormData((prev) => ({
      ...prev,
      stage: newStage,
      probability: defaultProb,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      return toast.error('Deal title is required');
    }
    if (!formData.clientName.trim()) {
      return toast.error('Client contact name is required');
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      return toast.error('Please enter a valid deal amount');
    }

    const payload = {
      ...formData,
      amount: Number(formData.amount),
      probability: Number(formData.probability),
      assignedTo: formData.assignedTo || null,
      expectedCloseDate: formData.expectedCloseDate || null,
    };

    if (editingDeal) {
      updateMutation.mutate({ id: editingDeal._id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Helper to step forward/backward in stages
  const stepStage = (deal, direction) => {
    const currentIndex = STAGES.indexOf(deal.stage);
    if (currentIndex === -1) return;
    const targetIndex = currentIndex + direction;
    if (targetIndex >= 0 && targetIndex < STAGES.length) {
      stageMutation.mutate({ id: deal._id, newStage: STAGES[targetIndex] });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ===================== PAGE HEADER ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Sales Pipeline & Deals
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Kanban Pipeline
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track active revenue opportunities through discovery, proposal, negotiation, and closing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <HiOutlineViewColumns className="w-4 h-4" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <HiOutlineTableCells className="w-4 h-4" />
              <span>List Table</span>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
            title="Refresh Deals"
          >
            <HiOutlineArrowPath
              className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`}
            />
          </button>

          {/* New Deal Button */}
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span>New Deal</span>
          </button>
        </div>
      </div>

      {/* ===================== SUMMARY KPI ROW ===================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Active Pipeline
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <HiOutlineCurrencyRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">
              ₹{summaryMetrics.activeValue.toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Across ongoing active negotiations
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Won Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <HiOutlineCheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-emerald-700">
              ₹{summaryMetrics.wonRevenue.toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Successfully closed deals</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Win Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <HiOutlineArrowTrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-amber-700">
              {summaryMetrics.winRate}%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Deal closing conversion efficiency
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Deals
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <HiOutlineBriefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">
              {summaryMetrics.totalDeals}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Total pipeline records</span>
        </div>
      </div>

      {/* ===================== SEARCH & FILTER BAR ===================== */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search deals by title, client name, company, email..."
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
            <span>Stage:</span>
          </div>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 font-medium focus:bg-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Stages ({deals.length})</option>
            {STAGES.map((stg) => (
              <option key={stg} value={stg}>
                {stg} ({deals.filter((d) => d.stage === stg).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ===================== VIEW: KANBAN BOARD ===================== */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1200px] items-start">
            {STAGES.map((stage) => {
              const stageDeals = groupedDeals[stage] || [];
              const stageTotal = stageDeals.reduce(
                (sum, d) => sum + (Number(d.amount) || 0),
                0
              );
              const conf = STAGE_CONFIG[stage];

              return (
                <div
                  key={stage}
                  className="flex-1 min-w-[280px] max-w-[320px] bg-slate-50/70 border border-slate-200/90 rounded-xl p-3 flex flex-col"
                >
                  {/* Column Header */}
                  <div
                    className={`rounded-lg p-2.5 border mb-3 flex items-center justify-between ${conf.headerBg}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider truncate">
                          {stage}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white/80 border border-slate-200 text-slate-800">
                          {stageDeals.length}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 block mt-0.5">
                        ₹{stageTotal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingDeal(null);
                        setFormData({
                          ...initialFormState,
                          stage,
                          probability: conf.defaultProb,
                        });
                        setIsModalOpen(true);
                      }}
                      className="p-1 rounded-md hover:bg-white/80 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                      title={`Add Deal in ${stage}`}
                    >
                      <HiOutlinePlus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Cards Stack */}
                  <div className="space-y-3 min-h-[160px]">
                    {isLoading ? (
                      <div className="flex justify-center items-center py-10">
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : stageDeals.length === 0 ? (
                      <div className="p-6 rounded-lg border border-dashed border-slate-200 text-center bg-white/60">
                        <p className="text-[11px] text-slate-400">No deals in this stage</p>
                      </div>
                    ) : (
                      stageDeals.map((deal) => {
                        const currentIndex = STAGES.indexOf(deal.stage);
                        const canMoveBack = currentIndex > 0;
                        const canMoveForward = currentIndex < STAGES.length - 1;

                        return (
                          <div
                            key={deal._id}
                            className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition-all group"
                          >
                            {/* Card Header: Title & Value */}
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                {deal.title}
                              </h4>
                              <span className="text-xs font-bold text-slate-900 shrink-0">
                                ₹{Number(deal.amount || 0).toLocaleString('en-IN')}
                              </span>
                            </div>

                            {/* Client & Company */}
                            <div className="mt-2 text-[11px] text-slate-600 space-y-0.5">
                              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                <HiOutlineUser className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{deal.clientName}</span>
                              </div>
                              {deal.clientCompany && (
                                <div className="flex items-center gap-1.5 text-slate-500">
                                  <HiOutlineBuildingOffice2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate">{deal.clientCompany}</span>
                                </div>
                              )}
                            </div>

                            {/* Probability Progress Bar */}
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                                <span>Win Confidence</span>
                                <span className="font-semibold text-slate-700">
                                  {deal.probability || 0}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all rounded-full ${
                                    deal.probability >= 80
                                      ? 'bg-emerald-500'
                                      : deal.probability >= 50
                                      ? 'bg-blue-500'
                                      : deal.probability >= 20
                                      ? 'bg-amber-500'
                                      : 'bg-slate-300'
                                  }`}
                                  style={{ width: `${deal.probability || 0}%` }}
                                />
                              </div>
                            </div>

                            {/* Meta & Footer Controls */}
                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                              {/* Expected Close Date */}
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                                <HiOutlineCalendarDays className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  {deal.expectedCloseDate
                                    ? new Date(deal.expectedCloseDate).toLocaleDateString('en-IN', {
                                        month: 'short',
                                        day: 'numeric',
                                      })
                                    : 'No date'}
                                </span>
                              </div>

                              {/* Stage Movers & Actions */}
                              <div className="flex items-center gap-1">
                                {canMoveBack && (
                                  <button
                                    type="button"
                                    onClick={() => stepStage(deal, -1)}
                                    title={`Move back to ${STAGES[currentIndex - 1]}`}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors"
                                  >
                                    <HiOutlineChevronLeft className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {canMoveForward && (
                                  <button
                                    type="button"
                                    onClick={() => stepStage(deal, 1)}
                                    title={`Advance to ${STAGES[currentIndex + 1]}`}
                                    className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer transition-colors"
                                  >
                                    <HiOutlineChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => openEditModal(deal)}
                                  title="Edit Deal"
                                  className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors ml-0.5"
                                >
                                  <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDealToDelete(deal)}
                                  title="Delete Deal"
                                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                                >
                                  <HiOutlineTrash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== VIEW: TABLE VIEW ===================== */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Deal Title</th>
                  <th className="py-3 px-4">Client Contact</th>
                  <th className="py-3 px-4">Deal Value</th>
                  <th className="py-3 px-4">Pipeline Stage</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Expected Close</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading pipeline deals...
                    </td>
                  </tr>
                ) : filteredDeals.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      No deals matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDeals.map((deal) => {
                    const conf = STAGE_CONFIG[deal.stage] || STAGE_CONFIG.Discovery;
                    return (
                      <tr key={deal._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-[220px]">
                          <span className="truncate block">{deal.title}</span>
                          {deal.notes && (
                            <span className="text-[11px] text-slate-400 font-normal truncate block">
                              {deal.notes}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800">{deal.clientName}</div>
                          {deal.clientCompany && (
                            <div className="text-[11px] text-slate-500">{deal.clientCompany}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          ₹{Number(deal.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${conf.badge}`}
                          >
                            {deal.stage}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-700">
                            {deal.probability || 0}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {deal.expectedCloseDate
                            ? new Date(deal.expectedCloseDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {deal.assignedTo?.name || 'Unassigned'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(deal)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Deal"
                            >
                              <HiOutlinePencilSquare className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDealToDelete(deal)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Deal"
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
      )}

      {/* ===================== CREATE / EDIT DEAL MODAL ===================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingDeal ? 'Edit Deal Opportunity' : 'Create New Deal Opportunity'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Enter deal financials, stage status, and client contact information.
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deal Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Enterprise Cloud ERP Implementation"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Contact Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Organization / Company
                  </label>
                  <input
                    type="text"
                    value={formData.clientCompany}
                    onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                    placeholder="e.g. Apex Industries Ltd"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    placeholder="e.g. contact@apex.com"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deal Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="e.g. 250000"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) => handleStageSelectChange(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Win Confidence ({formData.probability}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formData.probability}
                    onChange={(e) =>
                      setFormData({ ...formData, probability: Number(e.target.value) })
                    }
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expected Close Date
                  </label>
                  <input
                    type="date"
                    value={formData.expectedCloseDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expectedCloseDate: e.target.value })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Account Rep
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="">-- Unassigned --</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.role || u.designation || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deal Notes & Terms
                </label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Key requirements, pricing terms, stakeholder details..."
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
                    ? 'Saving Deal...'
                    : editingDeal
                    ? 'Save Changes'
                    : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRMATION MODAL ===================== */}
      {dealToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 text-center">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <HiOutlineTrash className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Delete Deal?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to remove <span className="font-semibold text-slate-800">{dealToDelete.title}</span> from the sales pipeline? This cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDealToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(dealToDelete._id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Deal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealsPipeline;

