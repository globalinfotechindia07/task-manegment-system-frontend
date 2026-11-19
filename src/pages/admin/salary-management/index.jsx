import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';
import {
  HiOutlineBanknotes,
  HiOutlineUser,
  HiOutlineUsers,
  HiOutlineSparkles,
  HiOutlineCheckCircle,
  HiOutlineCog6Tooth,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineMagnifyingGlass,
  HiOutlineCalculator,
  HiOutlineStar,
  HiOutlineArrowPath,
  HiOutlineCurrencyRupee,
} from 'react-icons/hi2';

const SalaryManagement = () => {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('All');

  // Form states for the currently selected employee
  const [selectedStructureId, setSelectedStructureId] = useState('');
  const [annualCTC, setAnnualCTC] = useState(0);
  const [dynamicComponents, setDynamicComponents] = useState([]);

  // Traditional mapped structures for backend compatibility
  const [earnings, setEarnings] = useState({ basic: 0, hra: 0, exGratia: 0, splAllowance: 0 });
  const [deductions, setDeductions] = useState({
    pf: 0,
    esic: 0,
    labourWelfareFund: 0,
    professionalTax: 0,
    welfareFund: 0,
  });
  const [employerContributions, setEmployerContributions] = useState({
    pf: 0,
    esic: 0,
    labourWelfareFund: 0,
    professionalTax: 0,
  });

  // ===================== QUERIES =====================

  // 1. Fetch all Salary Structure Packages (from Payroll Settings)
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['salaryStructures'],
    queryFn: async () => {
      const { data } = await api.get('/payroll/structures');
      return Array.isArray(data) ? data : [];
    },
  });

  // 2. Fetch Employees with their assigned Salary Packages & CTC
  const { data: employees = [], isLoading: employeesLoading, refetch: refetchEmployees } = useQuery({
    queryKey: ['employeesSalaryList'],
    queryFn: async () => {
      const { data } = await api.get('/payroll/employees-salary');
      return Array.isArray(data) ? data : [];
    },
  });

  // 3. Fetch Selected User's Config when clicked
  const { data: userConfig, isLoading: configLoading } = useQuery({
    queryKey: ['salaryConfig', selectedUser?._id],
    queryFn: async () => {
      if (!selectedUser) return null;
      const { data } = await api.get(`/payroll/config/${selectedUser._id}`);
      return data;
    },
    enabled: !!selectedUser,
  });

  // Helper to calculate components from a package
  const calculateAndSetFromPlan = (plan, ctcValue) => {
    if (!plan || !Array.isArray(plan.components)) return;

    const baseAnnual = parseFloat(ctcValue) || 0;
    const baseMonthly = baseAnnual > 0 ? baseAnnual / 12 : 0;

    // Find or calculate Basic Salary
    let basicAmount = 0;
    const basicComp = plan.components.find(
      (c) => c.type === 'Earning' && (c.name.toLowerCase().includes('basic') || c.key === 'basic')
    );
    if (basicComp) {
      if (basicComp.calculationType === 'PercentageOfCTC') {
        basicAmount = (baseMonthly * (parseFloat(basicComp.value) || 0)) / 100;
      } else {
        basicAmount = parseFloat(basicComp.value) || 0;
      }
    } else {
      basicAmount = baseMonthly * 0.5;
    }
    basicAmount = Math.round(basicAmount);

    const calculatedEarn = { basic: basicAmount, hra: 0, exGratia: 0, splAllowance: 0 };
    const calculatedDed = { pf: 0, esic: 0, labourWelfareFund: 0, professionalTax: 0, welfareFund: 0 };
    const calculatedEmp = { pf: 0, esic: 0, labourWelfareFund: 0, professionalTax: 0 };

    const calculatedDynamic = plan.components.map((c) => {
      let amt = 0;
      const v = parseFloat(c.value) || 0;

      if (c.calculationType === 'PercentageOfCTC') {
        amt = (baseMonthly * v) / 100;
      } else if (c.calculationType === 'PercentageOfBasic') {
        amt = (basicAmount * v) / 100;
      } else {
        amt = v;
      }
      amt = Math.round(amt);

      const nameLower = (c.name || '').toLowerCase();

      if (c.type === 'Earning') {
        if (nameLower.includes('basic')) calculatedEarn.basic = amt;
        else if (nameLower.includes('hra') || nameLower.includes('rent')) calculatedEarn.hra = amt;
        else if (nameLower.includes('special') || nameLower.includes('allowance')) calculatedEarn.splAllowance = amt;
        else calculatedEarn.exGratia += amt;
      } else if (c.type === 'Deduction') {
        if (nameLower.includes('pf') || nameLower.includes('provident')) calculatedDed.pf = amt;
        else if (nameLower.includes('esic')) calculatedDed.esic = amt;
        else if (nameLower.includes('professional') || nameLower.includes('pt')) calculatedDed.professionalTax = amt;
        else if (nameLower.includes('labour')) calculatedDed.labourWelfareFund = amt;
        else calculatedDed.welfareFund += amt;
      } else if (c.type === 'EmployerContribution') {
        if (nameLower.includes('pf') || nameLower.includes('provident')) calculatedEmp.pf = amt;
        else if (nameLower.includes('esic')) calculatedEmp.esic = amt;
        else if (nameLower.includes('labour')) calculatedEmp.labourWelfareFund = amt;
        else calculatedEmp.professionalTax = amt;
      }

      return {
        name: c.name,
        type: c.type,
        calculationType: c.calculationType,
        value: c.value,
        amount: amt,
        payer: c.payer || 'Employee',
      };
    });

    setEarnings(calculatedEarn);
    setDeductions(calculatedDed);
    setEmployerContributions(calculatedEmp);
    setDynamicComponents(calculatedDynamic);
  };

  // Sync loaded config into editor state when an employee is selected
  useEffect(() => {
    if (userConfig && selectedUser) {
      let structId = userConfig.salaryStructure?._id || userConfig.salaryStructure || '';
      let ctc = userConfig.fixedCTC || 0;

      // If user has no package assigned yet, default to company default or first plan
      if (!structId && plans.length > 0) {
        const defaultPlan = plans.find((p) => p.isDefault) || plans[0];
        structId = defaultPlan?._id || '';
        if (ctc === 0) {
          ctc = defaultPlan?.employmentType === 'Intern' ? 180000 : 600000;
        }
      }

      setSelectedStructureId(structId);
      setAnnualCTC(ctc);

      const targetPlan = plans.find((p) => p._id === structId);
      if (targetPlan) {
        calculateAndSetFromPlan(targetPlan, ctc);
      } else if (Array.isArray(userConfig.dynamicComponents) && userConfig.dynamicComponents.length > 0) {
        setDynamicComponents(userConfig.dynamicComponents);
      }
    }
  }, [userConfig, selectedUser, plans]);

  // When package changes
  const handlePlanChange = (planId) => {
    setSelectedStructureId(planId);
    const chosenPlan = plans.find((p) => p._id === planId);
    if (chosenPlan) {
      // If switching to intern and CTC is high, adapt reasonable stipend default
      let effectiveCTC = annualCTC;
      if (chosenPlan.employmentType === 'Intern' && annualCTC > 300000) {
        effectiveCTC = 180000; // 15k/mo
        setAnnualCTC(effectiveCTC);
      }
      calculateAndSetFromPlan(chosenPlan, effectiveCTC);
      toast.success(`Package "${chosenPlan.name}" applied!`, { id: 'pkg-applied' });
    }
  };

  // When CTC input changes
  const handleCTCChange = (newCTC) => {
    const val = parseFloat(newCTC) || 0;
    setAnnualCTC(val);
    if (selectedStructureId) {
      const chosenPlan = plans.find((p) => p._id === selectedStructureId);
      if (chosenPlan) {
        calculateAndSetFromPlan(chosenPlan, val);
      }
    }
  };

  // Update a single component amount directly
  const handleDynamicAmountChange = (index, newAmount) => {
    setDynamicComponents((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], amount: parseFloat(newAmount) || 0 };
      return copy;
    });
  };

  // ===================== SAVE MUTATION =====================
  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      payload.userId = selectedUser._id;
      const { data } = await api.post('/payroll/config', payload);
      return data;
    },
    onSuccess: () => {
      toast.success(`Salary package saved for ${selectedUser.name}!`);
      queryClient.invalidateQueries({ queryKey: ['employeesSalaryList'] });
      queryClient.invalidateQueries({ queryKey: ['salaryConfig', selectedUser._id] });
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update salary config');
    },
  });

  const handleSaveSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    const totalEarnings = dynamicComponents
      .filter((c) => c.type === 'Earning')
      .reduce((sum, c) => sum + (c.amount || 0), 0);

    const totalDeductions = dynamicComponents
      .filter((c) => c.type === 'Deduction' && c.payer !== 'Employer')
      .reduce((sum, c) => sum + (c.amount || 0), 0);

    const netMonthlyTakeHome = totalEarnings - totalDeductions;

    const payload = {
      fixedCTC: parseFloat(annualCTC) || 0,
      salaryStructure: selectedStructureId || null,
      dynamicComponents,
      netMonthlyTakeHome,
      earnings,
      deductions,
      employerContributions,
    };

    updateMutation.mutate(payload);
  };

  // ===================== CALCULATED TOTALS =====================
  const calculatedGrossEarnings = dynamicComponents
    .filter((c) => c.type === 'Earning')
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  const calculatedTotalDeductions = dynamicComponents
    .filter((c) => c.type === 'Deduction' && c.payer !== 'Employer')
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  const calculatedEmployerShare = dynamicComponents
    .filter((c) => c.type === 'EmployerContribution' || (c.type === 'Deduction' && c.payer === 'Employer'))
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  const calculatedNetTakeHome = calculatedGrossEarnings - calculatedTotalDeductions;
  const calculatedTotalMonthlyCTC = calculatedGrossEarnings + calculatedEmployerShare;

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterPlan === 'All') return true;
    if (filterPlan === 'Configured') return emp.isConfigured;
    if (filterPlan === 'Unassigned') return !emp.salaryStructure;
    return emp.salaryStructure?._id === filterPlan || emp.salaryStructure?.employmentType === filterPlan;
  });

  const selectedPlanDetails = plans.find((p) => p._id === selectedStructureId);

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* ===================== PAGE HEADER ===================== */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
            <HiOutlineBanknotes className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Employee Salary & Package Allocation
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Select compensation packages (Full-Time, Intern, Contractor), adjust package CTC, and view net in-hand pay.
            </p>
          </div>
        </div>

        {/* Shortcut to Payroll Settings */}
        <Link
          to="/admin/payroll-settings"
          className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer shrink-0"
        >
          <HiOutlineCog6Tooth className="w-4 h-4 text-indigo-600" />
          <span>Payroll Settings (Manage Packages)</span>
          <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </div>

      {/* ===================== MAIN TWO-COLUMN WORKSPACE ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* ===================== LEFT: EMPLOYEE LIST (Col 6) ===================== */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          {/* Search & Filter Toolbar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff by name, designation, dept..."
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Filter by Package */}
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="All">All Staff ({employees.length})</option>
                <option value="Configured">Configured Only</option>
                <option value="Unassigned">No Package Assigned</option>
                {plans.map((p) => (
                  <option key={p._id} value={p._id}>
                    Package: {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table / List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[520px]">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 border-b border-slate-200 font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-3 py-3">Assigned Package</th>
                  <th className="px-3 py-3 text-right">In-Hand Net Pay</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employeesLoading ? (
                  <tr>
                    <td colSpan="4" className="p-12 text-center">
                      <div className="inline-block w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                      <p className="text-xs text-slate-400 mt-2 font-medium">Loading staff compensation records...</p>
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-10 text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                        <HiOutlineUsers className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">No staff found</p>
                      <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search or filter.</p>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const isSelected = selectedUser?._id === emp._id;
                    const planName = emp.salaryStructure?.name;
                    const planType = emp.salaryStructure?.employmentType;

                    return (
                      <tr
                        key={emp._id}
                        className={`hover:bg-slate-50 transition-colors ${
                          isSelected ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600' : ''
                        }`}
                      >
                        {/* Employee Details */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                              {emp.profilePicture ? (
                                <img
                                  src={`${API_BASE_URL}${emp.profilePicture}`}
                                  className="w-full h-full object-cover"
                                  alt={emp.name}
                                />
                              ) : (
                                emp.name?.charAt(0) || 'U'
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate max-w-[150px]">{emp.name}</div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                                {[emp.designation, emp.department].filter(Boolean).join(' • ') || 'Staff'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Assigned Package Badge */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          {planName ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                planType === 'Intern'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : planType === 'Contract'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              }`}
                            >
                              {planName}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                              No Package
                            </span>
                          )}
                        </td>

                        {/* In-Hand Net Pay */}
                        <td className="px-3 py-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                          {emp.netMonthlyTakeHome > 0 ? (
                            `₹${Math.round(emp.netMonthlyTakeHome).toLocaleString('en-IN')}/mo`
                          ) : (
                            <span className="text-slate-400 font-sans text-[11px]">Pending</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedUser(emp)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition border cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-white hover:bg-indigo-50 text-indigo-700 border-slate-300'
                            }`}
                          >
                            {isSelected ? 'Editing' : 'Assign / Edit'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===================== RIGHT: PACKAGE SELECTOR & NET PAY SUMMARY (Col 6) ===================== */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col lg:sticky lg:top-20">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                <HiOutlineCalculator className="w-4 h-4" />
              </span>
              Package Compensation & Net Pay
            </h2>
            {selectedUser && (
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                {selectedUser.name}
              </span>
            )}
          </div>

          {/* Form Body */}
          <div className="p-4 sm:p-5 flex-1 max-h-[calc(100vh-16rem)] overflow-y-auto space-y-5">
            {!selectedUser ? (
              <div className="text-center py-20 text-slate-400 h-full flex flex-col items-center justify-center px-4">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  <HiOutlineBanknotes className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold text-slate-800">Select an Employee</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                  Choose a staff member from the list to assign their package (Full-Time, Intern, Contractor) and see their exact Net Pay.
                </p>
              </div>
            ) : configLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : (
              <form id="salary-package-form" onSubmit={handleSaveSubmit} className="space-y-5">
                {/* 1. EMPLOYEE BADGE */}
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                    {selectedUser.name?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-slate-900 font-bold text-sm truncate">{selectedUser.name}</div>
                    <div className="text-slate-500 text-xs truncate">
                      {[selectedUser.designation, selectedUser.department].filter(Boolean).join(' • ') || 'Staff Member'}
                    </div>
                  </div>
                </div>

                {/* 2. CHOOSE SALARY PACKAGE (INTERACTIVE CARDS) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <HiOutlineSparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Select Compensation Package
                    </label>
                    <Link
                      to="/admin/payroll-settings"
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5"
                    >
                      + New Package
                    </Link>
                  </div>

                  {plans.length === 0 ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                      No packages found. Please visit{' '}
                      <Link to="/admin/payroll-settings" className="underline font-bold">
                        Payroll Settings
                      </Link>{' '}
                      to create your packages.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {plans.map((p) => {
                        const isCurrent = selectedStructureId === p._id;
                        return (
                          <button
                            key={p._id}
                            type="button"
                            onClick={() => handlePlanChange(p._id)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isCurrent
                                ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                                : 'bg-white hover:bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1.5 mb-1">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${
                                    p.employmentType === 'Intern'
                                      ? 'bg-purple-100 text-purple-800'
                                      : p.employmentType === 'Contract'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-indigo-100 text-indigo-800'
                                  }`}
                                >
                                  {p.employmentType}
                                </span>
                                {p.isDefault && (
                                  <span className="text-[10px] text-emerald-700 font-bold">★ Default</span>
                                )}
                              </div>
                              <p className="font-bold text-xs text-slate-900">{p.name}</p>
                              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                {p.description || `${p.components?.length || 0} fields`}
                              </p>
                            </div>
                            {isCurrent && (
                              <div className="mt-2 pt-1.5 border-t border-indigo-200/60 flex items-center gap-1 text-[10px] font-bold text-indigo-700">
                                <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                                <span>Active Package</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. PACKAGE COMPENSATION (CTC / STIPEND INPUT) */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {selectedPlanDetails?.employmentType === 'Intern'
                        ? 'Annual Stipend Package (₹)'
                        : 'Annual Fixed CTC Package (₹)'}{' '}
                      <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Monthly: ₹{Math.round((annualCTC || 0) / 12).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      step="any"
                      value={annualCTC}
                      onChange={(e) => handleCTCChange(e.target.value)}
                      placeholder="e.g. 600000"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-sm font-bold font-mono text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Entering CTC automatically calculates all package credits, debits, and in-hand net pay.
                  </p>
                </div>

                {/* 4. PACKAGE FIELDS (ONLY FROM THE SELECTED PACKAGE) */}
                {dynamicComponents.length > 0 && (
                  <div className="space-y-4">
                    {/* Package Earnings (Credits) */}
                    <div className="bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-200/80 space-y-2">
                      <div className="flex items-center justify-between border-b border-emerald-100 pb-1.5">
                        <span className="text-[11px] font-bold uppercase text-emerald-800 tracking-wider">
                          Package Credits (Monthly Earnings)
                        </span>
                        <span className="text-xs font-mono font-extrabold text-emerald-800">
                          ₹{calculatedGrossEarnings.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="space-y-2 pt-1">
                        {dynamicComponents
                          .filter((c) => c.type === 'Earning')
                          .map((c, idx) => {
                            const realIndex = dynamicComponents.findIndex((x) => x === c);
                            return (
                              <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-900 truncate">{c.name}</p>
                                  <p className="text-[10px] text-slate-500">
                                    {c.calculationType === 'Fixed'
                                      ? 'Fixed Amount'
                                      : `${c.value}% ${
                                          c.calculationType === 'PercentageOfBasic' ? 'of Basic' : 'of CTC'
                                        }`}
                                  </p>
                                </div>
                                <div className="w-32 relative">
                                  <span className="absolute left-2.5 top-1 text-[11px] text-slate-400 font-bold">₹</span>
                                  <input
                                    type="number"
                                    value={c.amount}
                                    onChange={(e) => handleDynamicAmountChange(realIndex, e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-lg pl-6 pr-2.5 py-1 text-xs font-mono font-bold text-right text-emerald-800 focus:outline-none focus:border-emerald-500"
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Package Deductions (Debits) */}
                    <div className="bg-rose-50/40 p-3.5 rounded-xl border border-rose-200/80 space-y-2">
                      <div className="flex items-center justify-between border-b border-rose-100 pb-1.5">
                        <span className="text-[11px] font-bold uppercase text-rose-800 tracking-wider">
                          Package Debits (Employee Deductions)
                        </span>
                        <span className="text-xs font-mono font-extrabold text-rose-800">
                          -₹{calculatedTotalDeductions.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="space-y-2 pt-1">
                        {dynamicComponents.filter((c) => c.type === 'Deduction' && c.payer !== 'Employer').length ===
                        0 ? (
                          <div className="text-center py-2 text-[11px] text-emerald-700 font-semibold bg-white/70 rounded-lg border border-emerald-100">
                            ✓ No deductions in this package (Full 100% In-Hand Payout)
                          </div>
                        ) : (
                          dynamicComponents
                            .filter((c) => c.type === 'Deduction' && c.payer !== 'Employer')
                            .map((c, idx) => {
                              const realIndex = dynamicComponents.findIndex((x) => x === c);
                              return (
                                <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-900 truncate">{c.name}</p>
                                    <p className="text-[10px] text-slate-500">
                                      {c.calculationType === 'Fixed'
                                        ? 'Fixed Flat'
                                        : `${c.value}% ${
                                            c.calculationType === 'PercentageOfBasic' ? 'of Basic' : 'of CTC'
                                          }`}
                                    </p>
                                  </div>
                                  <div className="w-32 relative">
                                    <span className="absolute left-2.5 top-1 text-[11px] text-slate-400 font-bold">-₹</span>
                                    <input
                                      type="number"
                                      value={c.amount}
                                      onChange={(e) => handleDynamicAmountChange(realIndex, e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded-lg pl-6 pr-2.5 py-1 text-xs font-mono font-bold text-right text-rose-800 focus:outline-none focus:border-rose-500"
                                    />
                                  </div>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>

                    {/* Employer Contributions */}
                    {dynamicComponents.some(
                      (c) => c.type === 'EmployerContribution' || (c.type === 'Deduction' && c.payer === 'Employer')
                    ) && (
                      <div className="bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-200/80 space-y-2">
                        <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5">
                          <span className="text-[11px] font-bold uppercase text-indigo-900 tracking-wider">
                            Employer Contributions (Company Share)
                          </span>
                          <span className="text-xs font-mono font-extrabold text-indigo-900">
                            +₹{calculatedEmployerShare.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="space-y-2 pt-1">
                          {dynamicComponents
                            .filter(
                              (c) =>
                                c.type === 'EmployerContribution' || (c.type === 'Deduction' && c.payer === 'Employer')
                            )
                            .map((c, idx) => {
                              const realIndex = dynamicComponents.findIndex((x) => x === c);
                              return (
                                <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-900 truncate">{c.name}</p>
                                    <p className="text-[10px] text-slate-500">
                                      {c.calculationType === 'Fixed'
                                        ? 'Fixed Flat'
                                        : `${c.value}% ${
                                            c.calculationType === 'PercentageOfBasic' ? 'of Basic' : 'of CTC'
                                          }`}
                                    </p>
                                  </div>
                                  <div className="w-32 relative">
                                    <span className="absolute left-2.5 top-1 text-[11px] text-slate-400 font-bold">₹</span>
                                    <input
                                      type="number"
                                      value={c.amount}
                                      onChange={(e) => handleDynamicAmountChange(realIndex, e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded-lg pl-6 pr-2.5 py-1 text-xs font-mono font-bold text-right text-indigo-900 focus:outline-none focus:border-indigo-500"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ===================== 5. FINAL NET PAY DISPLAY (LAST ME NET PAY) ===================== */}
                <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-lg space-y-3.5 border border-slate-800">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                    <span className="text-slate-400 font-semibold">Total Monthly Earnings (Credits):</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      +₹{calculatedGrossEarnings.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                    <span className="text-slate-400 font-semibold">Total Employee Deductions (Debits):</span>
                    <span className="font-mono font-bold text-rose-400 text-sm">
                      -₹{calculatedTotalDeductions.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {calculatedEmployerShare > 0 && (
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                      <span className="text-slate-400 font-semibold">Employer Cost Share (PF/ESIC):</span>
                      <span className="font-mono font-bold text-indigo-300">
                        +₹{calculatedEmployerShare.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {/* PROMINENT NET PAY CARD */}
                  <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/90 p-4 rounded-xl border border-slate-700/80">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-400">
                          NET PAY (IN-HAND SALARY)
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Net amount credited to employee account each month
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-300 tracking-tight">
                        ₹{Math.max(0, calculatedNetTakeHome).toLocaleString('en-IN')}
                        <span className="text-xs font-normal text-slate-400 font-sans"> /mo</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Annual In-Hand: ₹{Math.max(0, calculatedNetTakeHome * 12).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Footer Actions */}
          {selectedUser && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-300 shadow-2xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="salary-package-form"
                disabled={updateMutation.isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {updateMutation.isPending ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <HiOutlineCheckCircle className="w-4 h-4" />
                )}
                <span>{updateMutation.isPending ? 'Saving Package...' : 'Save Package & Apply'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalaryManagement;
