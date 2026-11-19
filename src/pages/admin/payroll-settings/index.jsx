import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';
import {
  HiOutlineSparkles,
  HiOutlineDocumentChartBar,
  HiOutlineCog6Tooth,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineCheckCircle,
  HiOutlineStar,
  HiOutlineArrowPath,
  HiOutlineBanknotes,
  HiOutlineCalculator,
  HiOutlineXMark,
  HiOutlineInformationCircle,
  HiOutlineUserGroup,
  HiOutlineCreditCard,
} from 'react-icons/hi2';

const PayrollSettings = () => {
  const queryClient = useQueryClient();

  // Active top-level tab: 'plans' (Salary Structures) | 'processing' (Monthly Payroll Generation)
  const [activeTab, setActiveTab] = useState('plans');

  // Filter for Plans
  const [selectedEmploymentType, setSelectedEmploymentType] = useState('All');

  // Processing tab states (Month & Year)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() || 12);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()
  );

  // Modal states for creating/editing a Salary Structure Plan
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);

  const initialPlanForm = {
    name: '',
    code: '',
    description: '',
    employmentType: 'Full-Time',
    isDefault: false,
    status: 'Active',
    components: [
      {
        name: 'Basic Salary',
        key: 'basic',
        type: 'Earning',
        calculationType: 'PercentageOfCTC',
        value: 50,
        payer: 'Employee',
        isTaxable: true,
        description: '50% of monthly CTC',
      },
      {
        name: 'House Rent Allowance (HRA)',
        key: 'hra',
        type: 'Earning',
        calculationType: 'PercentageOfBasic',
        value: 40,
        payer: 'Employee',
        isTaxable: true,
        description: '40% of Basic Salary',
      },
      {
        name: 'Special Allowance',
        key: 'special_allowance',
        type: 'Earning',
        calculationType: 'PercentageOfCTC',
        value: 30,
        payer: 'Employee',
        isTaxable: true,
        description: 'Balancing allowance component',
      },
      {
        name: 'Employee PF (Provident Fund)',
        key: 'pf_employee',
        type: 'Deduction',
        calculationType: 'PercentageOfBasic',
        value: 12,
        payer: 'Employee',
        isTaxable: false,
        description: '12% statutory employee PF contribution',
      },
      {
        name: 'Professional Tax (PT)',
        key: 'professional_tax',
        type: 'Deduction',
        calculationType: 'Fixed',
        value: 200,
        payer: 'Employee',
        isTaxable: false,
        description: 'State professional tax',
      },
      {
        name: 'Employer PF Contribution',
        key: 'pf_employer',
        type: 'EmployerContribution',
        calculationType: 'PercentageOfBasic',
        value: 12,
        payer: 'Employer',
        isTaxable: false,
        description: '12% matching employer PF contribution',
      },
    ],
  };

  const [planForm, setPlanForm] = useState(initialPlanForm);

  // Live simulation test amount for the Plan Editor
  const [simulatorMonthlyGross, setSimulatorMonthlyGross] = useState(50000);

  // ===================== QUERIES =====================

  // 1. Fetch Salary Structures (Plans)
  const {
    data: plans = [],
    isLoading: loadingPlans,
    refetch: refetchPlans,
  } = useQuery({
    queryKey: ['salaryStructures', selectedEmploymentType],
    queryFn: async () => {
      const { data } = await api.get(
        `/payroll/structures${selectedEmploymentType !== 'All' ? `?employmentType=${selectedEmploymentType}` : ''}`
      );
      return Array.isArray(data) ? data : [];
    },
  });

  // 2. Fetch Processed Monthly Slips
  const { data: slips = [], isLoading: loadingSlips } = useQuery({
    queryKey: ['allSalarySlips', selectedMonth, selectedYear],
    queryFn: async () => {
      const { data } = await api.get(`/payroll/all?month=${selectedMonth}&year=${selectedYear}`);
      return Array.isArray(data) ? data : [];
    },
    enabled: activeTab === 'processing',
  });

  // ===================== MUTATIONS =====================

  // Create or Update Plan Mutation
  const savePlanMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingPlanId) {
        const { data } = await api.put(`/payroll/structures/${editingPlanId}`, payload);
        return data;
      } else {
        const { data } = await api.post('/payroll/structures', payload);
        return data;
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || (editingPlanId ? 'Plan updated' : 'Plan created'));
      queryClient.invalidateQueries({ queryKey: ['salaryStructures'] });
      setIsPlanModalOpen(false);
      setEditingPlanId(null);
      setPlanForm(initialPlanForm);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save salary plan');
    },
  });

  // Delete Plan Mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/payroll/structures/${id}`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Plan deleted');
      queryClient.invalidateQueries({ queryKey: ['salaryStructures'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete plan');
    },
  });

  // Set Default Plan Mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.patch(`/payroll/structures/${id}/default`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Default plan updated');
      queryClient.invalidateQueries({ queryKey: ['salaryStructures'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to set default plan');
    },
  });

  // Generate Monthly Payroll Mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/payroll/generate', {
        month: selectedMonth,
        year: selectedYear,
      });
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Payroll processed successfully');
      queryClient.invalidateQueries({ queryKey: ['allSalarySlips', selectedMonth, selectedYear] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to generate payroll');
    },
  });

  // ===================== HANDLERS =====================

  const handleOpenCreateModal = () => {
    setEditingPlanId(null);
    setPlanForm(initialPlanForm);
    setSimulatorMonthlyGross(50000);
    setIsPlanModalOpen(true);
  };

  const handleOpenEditModal = (plan) => {
    setEditingPlanId(plan._id);
    setPlanForm({
      name: plan.name || '',
      code: plan.code || '',
      description: plan.description || '',
      employmentType: plan.employmentType || 'Full-Time',
      isDefault: Boolean(plan.isDefault),
      status: plan.status || 'Active',
      components: Array.isArray(plan.components) ? JSON.parse(JSON.stringify(plan.components)) : [],
    });
    setSimulatorMonthlyGross(plan.employmentType === 'Intern' ? 15000 : 50000);
    setIsPlanModalOpen(true);
  };

  // Add Dynamic Field Component
  const handleAddComponent = () => {
    setPlanForm((prev) => ({
      ...prev,
      components: [
        ...prev.components,
        {
          name: '',
          key: '',
          type: 'Earning',
          calculationType: 'Fixed',
          value: 0,
          payer: 'Employee',
          isTaxable: true,
          description: '',
        },
      ],
    }));
  };

  // Quick preset fields
  const handleAddPresetComponent = (presetType) => {
    let newComp = null;
    if (presetType === 'pf_employee') {
      newComp = {
        name: 'Employee PF (12%)',
        key: 'pf_employee',
        type: 'Deduction',
        calculationType: 'PercentageOfBasic',
        value: 12,
        payer: 'Employee',
        isTaxable: false,
        description: '12% of Basic Salary',
      };
    } else if (presetType === 'pf_employer') {
      newComp = {
        name: 'Employer PF Contribution (12%)',
        key: 'pf_employer',
        type: 'EmployerContribution',
        calculationType: 'PercentageOfBasic',
        value: 12,
        payer: 'Employer',
        isTaxable: false,
        description: '12% matching Employer PF',
      };
    } else if (presetType === 'pt') {
      newComp = {
        name: 'Professional Tax (PT)',
        key: 'professional_tax',
        type: 'Deduction',
        calculationType: 'Fixed',
        value: 200,
        payer: 'Employee',
        isTaxable: false,
        description: 'Statutory ₹200/mo',
      };
    } else if (presetType === 'esic_employee') {
      newComp = {
        name: 'ESIC (Employee 0.75%)',
        key: 'esic_employee',
        type: 'Deduction',
        calculationType: 'PercentageOfCTC',
        value: 0.75,
        payer: 'Employee',
        isTaxable: false,
        description: '0.75% of Gross for wages <= 21k',
      };
    } else if (presetType === 'esic_employer') {
      newComp = {
        name: 'ESIC (Employer 3.25%)',
        key: 'esic_employer',
        type: 'EmployerContribution',
        calculationType: 'PercentageOfCTC',
        value: 3.25,
        payer: 'Employer',
        isTaxable: false,
        description: '3.25% of Gross',
      };
    } else if (presetType === 'tds') {
      newComp = {
        name: 'TDS (Income Tax Deduction)',
        key: 'tds',
        type: 'Deduction',
        calculationType: 'Fixed',
        value: 0,
        payer: 'Employee',
        isTaxable: false,
        description: 'Tax Deducted at Source',
      };
    } else if (presetType === 'hra') {
      newComp = {
        name: 'House Rent Allowance (HRA)',
        key: 'hra',
        type: 'Earning',
        calculationType: 'PercentageOfBasic',
        value: 40,
        payer: 'Employee',
        isTaxable: true,
        description: '40% of Basic Salary',
      };
    }

    if (newComp) {
      setPlanForm((prev) => ({
        ...prev,
        components: [...prev.components, newComp],
      }));
    }
  };

  const handleUpdateComponent = (index, field, value) => {
    setPlanForm((prev) => {
      const next = [...prev.components];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, components: next };
    });
  };

  const handleRemoveComponent = (index) => {
    setPlanForm((prev) => ({
      ...prev,
      components: prev.components.filter((_, idx) => idx !== index),
    }));
  };

  const handleSavePlanSubmit = (e) => {
    e.preventDefault();
    if (!planForm.name.trim()) {
      toast.error('Plan name is required');
      return;
    }
    if (planForm.components.length === 0) {
      toast.error('Please add at least one salary field or component');
      return;
    }
    savePlanMutation.mutate(planForm);
  };

  // ===================== LIVE SIMULATOR CALCULATION =====================
  const computeSimulation = () => {
    const base = parseFloat(simulatorMonthlyGross) || 0;
    let basicVal = 0;

    // 1. Find Basic Salary
    const basicComp = planForm.components.find(
      (c) => c.type === 'Earning' && (c.name.toLowerCase().includes('basic') || c.key === 'basic')
    );
    if (basicComp) {
      if (basicComp.calculationType === 'PercentageOfCTC') {
        basicVal = (base * (parseFloat(basicComp.value) || 0)) / 100;
      } else {
        basicVal = parseFloat(basicComp.value) || 0;
      }
    } else {
      basicVal = base * 0.5; // fallback
    }

    let totalEarnings = 0;
    let totalDeductions = 0;
    let totalEmployerContributions = 0;

    const items = planForm.components.map((c) => {
      let amt = 0;
      const v = parseFloat(c.value) || 0;
      if (c.calculationType === 'PercentageOfCTC') {
        amt = (base * v) / 100;
      } else if (c.calculationType === 'PercentageOfBasic') {
        amt = (basicVal * v) / 100;
      } else {
        amt = v;
      }
      amt = Math.round(amt * 100) / 100;

      if (c.type === 'Earning') totalEarnings += amt;
      else if (c.type === 'Deduction') totalDeductions += amt;
      else if (c.type === 'EmployerContribution') totalEmployerContributions += amt;

      return { ...c, computed: amt };
    });

    const netTakeHome = totalEarnings - totalDeductions;
    const totalCTC = totalEarnings + totalEmployerContributions;

    return {
      basicVal,
      totalEarnings,
      totalDeductions,
      totalEmployerContributions,
      netTakeHome,
      totalCTC,
      items,
    };
  };

  const simResult = computeSimulation();

  const monthLabel = new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ===================== PAGE HEADER ===================== */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
            <HiOutlineBanknotes className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Payroll Settings & Salary Plans
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Build custom dynamic salary plans (Full-Time, Intern, Contractor), configure credit/debit components, and process monthly payroll.
            </p>
          </div>
        </div>

        {activeTab === 'plans' && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-sm cursor-pointer shrink-0"
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span>Create New Salary Plan</span>
          </button>
        )}
      </div>

      {/* ===================== TABS NAVIGATION ===================== */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'plans'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HiOutlineCog6Tooth className="w-4 h-4" />
          Salary Structure Plans
          <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
            {plans.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('processing')}
          className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'processing'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HiOutlineDocumentChartBar className="w-4 h-4" />
          Monthly Payroll Generation
        </button>
      </div>

      {/* ===================== TAB 1: SALARY STRUCTURE PLANS ===================== */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-semibold text-slate-500 mr-1">Employment Type:</span>
              {['All', 'Full-Time', 'Intern', 'Contract', 'Part-Time', 'Consultant'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedEmploymentType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedEmploymentType === type
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => refetchPlans()}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 self-end sm:self-auto cursor-pointer"
            >
              <HiOutlineArrowPath className="w-3.5 h-3.5" />
              <span>Refresh Plans</span>
            </button>
          </div>

          {/* Plans Grid */}
          {loadingPlans ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
              <div className="inline-block w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-xs text-slate-500 mt-2 font-medium">Loading salary structure plans...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 sm:p-12 text-center shadow-sm">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                <HiOutlineBanknotes className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No salary plans found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                Create different compensation packages like Full-Time Core, Intern Stipend, or Consultant with dynamic credit/debit rules.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <HiOutlinePlus className="w-4 h-4" />
                <span>Create First Plan</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {plans.map((plan) => {
                const earningsCount = (plan.components || []).filter((c) => c.type === 'Earning').length;
                const deductionsCount = (plan.components || []).filter((c) => c.type === 'Deduction').length;
                const employerCount = (plan.components || []).filter(
                  (c) => c.type === 'EmployerContribution'
                ).length;

                return (
                  <div
                    key={plan._id}
                    className={`bg-white rounded-2xl border transition-all flex flex-col justify-between shadow-sm hover:shadow-md ${
                      plan.isDefault ? 'border-indigo-400 ring-1 ring-indigo-400/30' : 'border-slate-200'
                    }`}
                  >
                    <div className="p-5">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            plan.employmentType === 'Intern'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : plan.employmentType === 'Contract'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {plan.employmentType}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {plan.isDefault && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <HiOutlineStar className="w-3 h-3 text-emerald-600" /> Default Plan
                            </span>
                          )}
                          <span
                            className={`w-2 h-2 rounded-full ${
                              plan.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                            title={plan.status}
                          />
                        </div>
                      </div>

                      {/* Plan Title & Description */}
                      <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition">
                        {plan.name}
                      </h3>
                      {plan.code && (
                        <p className="text-[11px] font-mono text-slate-400 font-semibold tracking-wider">
                          CODE: {plan.code}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 min-h-[32px]">
                        {plan.description || 'Custom compensation package with dynamic credit and deduction rules.'}
                      </p>

                      {/* Component Counters */}
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                        <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                          <p className="text-[10px] font-bold text-emerald-700 uppercase">Credits</p>
                          <p className="text-sm font-extrabold text-emerald-800">{earningsCount}</p>
                        </div>
                        <div className="bg-rose-50/60 p-2 rounded-xl border border-rose-100">
                          <p className="text-[10px] font-bold text-rose-700 uppercase">Debits</p>
                          <p className="text-sm font-extrabold text-rose-800">{deductionsCount}</p>
                        </div>
                        <div className="bg-indigo-50/60 p-2 rounded-xl border border-indigo-100">
                          <p className="text-[10px] font-bold text-indigo-700 uppercase">Employer</p>
                          <p className="text-sm font-extrabold text-indigo-800">{employerCount}</p>
                        </div>
                      </div>

                      {/* Component Chips Preview */}
                      <div className="mt-3.5 space-y-1">
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          Dynamic Fields ({plan.components?.length || 0}):
                        </p>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                          {(plan.components || []).map((c, idx) => (
                            <span
                              key={idx}
                              className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                                c.type === 'Earning'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : c.type === 'Deduction'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              }`}
                              title={`${c.name} (${c.calculationType}: ${c.value})`}
                            >
                              {c.type === 'Earning' ? '+' : '-'} {c.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Card Footer */}
                    <div className="p-4 bg-slate-50/80 border-t border-slate-200 rounded-b-2xl flex items-center justify-between gap-2">
                      <div className="text-[11px] font-medium text-slate-500">
                        <span className="font-bold text-slate-700">{plan.assignedEmployeesCount || 0}</span> staff
                        assigned
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!plan.isDefault && (
                          <button
                            type="button"
                            onClick={() => setDefaultMutation.mutate(plan._id)}
                            disabled={setDefaultMutation.isPending}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                            title="Set as Default Plan"
                          >
                            <HiOutlineStar className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(plan)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          title="Edit Salary Plan"
                        >
                          <HiOutlinePencilSquare className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Are you sure you want to delete "${plan.name}"? This cannot be undone.`
                              )
                            ) {
                              deletePlanMutation.mutate(plan._id);
                            }
                          }}
                          disabled={deletePlanMutation.isPending}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Plan"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 2: MONTHLY PAYROLL GENERATION ===================== */}
      {activeTab === 'processing' && (
        <div className="space-y-6">
          {/* Month/Year Processing Control Header */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Generate Monthly Payslips ({monthLabel} {selectedYear})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculates attendance, leaves, late deductions, and applies each staff member&apos;s configured salary structure plan.
              </p>
            </div>

            <div className="flex flex-col xs:flex-row sm:flex-row items-stretch xs:items-center gap-2">
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Generate and process salary slips for ${monthLabel} ${selectedYear}? This will recalculate slips for all active employees.`
                    )
                  ) {
                    generateMutation.mutate();
                  }
                }}
                disabled={generateMutation.isPending}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {generateMutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <HiOutlineSparkles className="w-4 h-4" />
                )}
                <span>{generateMutation.isPending ? 'Processing...' : 'Generate Payroll'}</span>
              </button>
            </div>
          </div>

          {/* Generated Slips Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm text-slate-700 min-w-[760px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-[10px] sm:text-xs border-b border-slate-200 uppercase font-semibold">
                    <th className="p-3 sm:p-4 whitespace-nowrap">Employee</th>
                    <th className="p-3 sm:p-4 whitespace-nowrap">Salary Plan</th>
                    <th className="p-3 sm:p-4 text-right whitespace-nowrap">Annual CTC</th>
                    <th className="p-3 sm:p-4 text-emerald-700 text-right whitespace-nowrap">Gross (Credits)</th>
                    <th className="p-3 sm:p-4 text-rose-700 text-right whitespace-nowrap">Debits (Ded.)</th>
                    <th className="p-3 sm:p-4 text-amber-700 text-right whitespace-nowrap">Late Ded.</th>
                    <th className="p-3 sm:p-4 text-indigo-700 text-right font-bold whitespace-nowrap">Net Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loadingSlips ? (
                    <tr>
                      <td colSpan="7" className="p-12 text-center">
                        <div className="inline-block w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                      </td>
                    </tr>
                  ) : !slips || slips.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 sm:p-12 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                          <HiOutlineDocumentChartBar className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-slate-700">No salary slips generated for this period</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Click &quot;Generate Payroll&quot; above to process {monthLabel} {selectedYear}.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    slips.map((slip) => (
                      <tr key={slip._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                              {slip.user?.profilePicture ? (
                                <img
                                  src={`${API_BASE_URL}${slip.user.profilePicture}`}
                                  alt="Avatar"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                slip.user?.name?.charAt(0) || 'U'
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 text-xs truncate max-w-[140px]">
                                {slip.user?.name}
                              </p>
                              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate max-w-[140px]">
                                {slip.user?.designation || 'Staff'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {slip.salaryStructure?.name || 'Standard Package'}
                          </span>
                        </td>
                        <td className="p-3 sm:p-4 text-slate-700 font-medium font-mono text-right whitespace-nowrap">
                          ₹{(slip.fixedCTC || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="p-3 sm:p-4 text-emerald-700 font-semibold text-right font-mono whitespace-nowrap">
                          ₹{(slip.grossEarnings || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="p-3 sm:p-4 text-rose-700 font-semibold text-right font-mono whitespace-nowrap">
                          -₹{(slip.totalDeductions || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="p-3 sm:p-4 text-amber-700 text-right font-medium font-mono whitespace-nowrap">
                          -₹{(slip.deductions?.lateDeduction || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}{' '}
                          <span className="text-[10px] text-slate-400 font-sans">
                            ({slip.stats?.lateDays || 0}d)
                          </span>
                        </td>
                        <td className="p-3 sm:p-4 text-indigo-700 font-extrabold text-right text-xs sm:text-sm border-l border-slate-100 font-mono whitespace-nowrap">
                          ₹{(slip.netPay || slip.netSalary || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: CREATE / EDIT SALARY STRUCTURE PLAN ===================== */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                  <HiOutlineBanknotes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingPlanId ? 'Edit Salary Structure Plan' : 'Create Dynamic Salary Structure Plan'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure custom dynamic credits (Earnings), debits (Deductions), and Employer contributions.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Scrollable Area */}
            <form onSubmit={handleSavePlanSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Basic Plan Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Plan Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    placeholder="e.g. Full-Time Core Employee Plan, Intern Stipend Package"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Employment Type</label>
                  <select
                    value={planForm.employmentType}
                    onChange={(e) => setPlanForm({ ...planForm, employmentType: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Intern">Intern</option>
                    <option value="Contract">Contract / Consultant</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="All">All Staff</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description / Remarks</label>
                  <input
                    type="text"
                    value={planForm.description}
                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                    placeholder="Short description of who this plan applies to"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.isDefault}
                      onChange={(e) => setPlanForm({ ...planForm, isDefault: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
                  </label>
                  <span className="text-xs font-bold text-slate-700">Set as Default Plan</span>
                </div>
              </div>

              {/* Quick Add Presets Bar */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Quick Add Standard Fields:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddPresetComponent('pf_employee')}
                    className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    + Employee PF (12%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPresetComponent('pf_employer')}
                    className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    + Employer PF (12%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPresetComponent('pt')}
                    className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    + Prof. Tax (₹200)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPresetComponent('hra')}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    + HRA (40% Basic)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPresetComponent('esic_employee')}
                    className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    + ESIC Emp (0.75%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPresetComponent('esic_employer')}
                    className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    + ESIC Employer (3.25%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPresetComponent('tds')}
                    className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    + TDS Deduction
                  </button>
                </div>
              </div>

              {/* Dynamic Components Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    Dynamic Salary Components / Fields ({planForm.components.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddComponent}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    <HiOutlinePlus className="w-3.5 h-3.5" />
                    <span>Add Custom Field</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">Field Name</th>
                        <th className="py-2.5 px-3">Type (Credit / Debit)</th>
                        <th className="py-2.5 px-3">Calculation Mode</th>
                        <th className="py-2.5 px-3">Value / Rate</th>
                        <th className="py-2.5 px-3">Payer</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {planForm.components.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                            No components added yet. Click &quot;Add Custom Field&quot; or choose a preset above.
                          </td>
                        </tr>
                      ) : (
                        planForm.components.map((comp, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            {/* Field Name */}
                            <td className="py-2 px-3 min-w-[160px]">
                              <input
                                type="text"
                                value={comp.name}
                                onChange={(e) => handleUpdateComponent(idx, 'name', e.target.value)}
                                placeholder="e.g. Basic Salary, Employee PF"
                                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                                required
                              />
                            </td>

                            {/* Type */}
                            <td className="py-2 px-3 min-w-[150px]">
                              <select
                                value={comp.type}
                                onChange={(e) => handleUpdateComponent(idx, 'type', e.target.value)}
                                className={`w-full rounded-lg px-2.5 py-1 text-xs font-bold border ${
                                  comp.type === 'Earning'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : comp.type === 'Deduction'
                                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                                    : 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                }`}
                              >
                                <option value="Earning">Earning (Credit +)</option>
                                <option value="Deduction">Deduction (Debit -)</option>
                                <option value="EmployerContribution">Employer Contribution (CTC +)</option>
                              </select>
                            </td>

                            {/* Calculation Mode */}
                            <td className="py-2 px-3 min-w-[150px]">
                              <select
                                value={comp.calculationType}
                                onChange={(e) => handleUpdateComponent(idx, 'calculationType', e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                              >
                                <option value="PercentageOfCTC">% of Monthly CTC</option>
                                <option value="PercentageOfBasic">% of Basic Salary</option>
                                <option value="Fixed">Fixed Flat ₹ Amount</option>
                              </select>
                            </td>

                            {/* Value / Rate */}
                            <td className="py-2 px-3 w-28">
                              <div className="relative">
                                <input
                                  type="number"
                                  step="any"
                                  value={comp.value}
                                  onChange={(e) => handleUpdateComponent(idx, 'value', e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                                  required
                                />
                                <span className="absolute right-2 top-1 text-[10px] text-slate-400 font-bold">
                                  {comp.calculationType === 'Fixed' ? '₹' : '%'}
                                </span>
                              </div>
                            </td>

                            {/* Payer */}
                            <td className="py-2 px-3 w-28">
                              <select
                                value={comp.payer}
                                onChange={(e) => handleUpdateComponent(idx, 'payer', e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700"
                              >
                                <option value="Employee">Employee</option>
                                <option value="Employer">Employer</option>
                              </select>
                            </td>

                            {/* Delete */}
                            <td className="py-2 px-3 text-center w-12">
                              <button
                                type="button"
                                onClick={() => handleRemoveComponent(idx)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title="Remove component"
                              >
                                <HiOutlineTrash className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* LIVE SIMULATOR & BREAKDOWN CALCULATOR */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <HiOutlineCalculator className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        Live Salary Simulator & Preview
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Test your dynamic formula in real time by entering an example monthly salary.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">Test Monthly CTC:</span>
                    <div className="relative w-36">
                      <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={simulatorMonthlyGross}
                        onChange={(e) => setSimulatorMonthlyGross(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-lg pl-6 pr-2.5 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Simulation Summary Numbers */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold uppercase text-emerald-700">Gross Earnings (A)</p>
                    <p className="text-base sm:text-lg font-extrabold text-emerald-800 font-mono">
                      ₹{simResult.totalEarnings.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold uppercase text-rose-700">Total Deductions (B)</p>
                    <p className="text-base sm:text-lg font-extrabold text-rose-800 font-mono">
                      -₹{simResult.totalDeductions.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold uppercase text-indigo-700">Net Take-Home (A - B)</p>
                    <p className="text-base sm:text-lg font-extrabold text-indigo-800 font-mono">
                      ₹{simResult.netTakeHome.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold uppercase text-slate-600">Employer Cost (CTC)</p>
                    <p className="text-base sm:text-lg font-extrabold text-slate-900 font-mono">
                      ₹{simResult.totalCTC.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePlanSubmit}
                disabled={savePlanMutation.isPending}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
              >
                {savePlanMutation.isPending ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <HiOutlineCheckCircle className="w-4 h-4" />
                )}
                <span>{editingPlanId ? 'Save Changes' : 'Create Salary Plan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollSettings;
