import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';
import {
  HiOutlineDocumentText,
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlinePaperAirplane,
  HiOutlinePrinter,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiOutlineBuildingOffice2,
  HiOutlineUser,
  HiOutlineCalendarDays,
  HiOutlineBriefcase,
  HiOutlineCog6Tooth,
  HiOutlineXMark,
  HiOutlineSparkles,
} from 'react-icons/hi2';

const OfferLettersPage = () => {
  const queryClient = useQueryClient();
  const printRef = useRef(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null); // null = new, object = edit
  const [previewOffer, setPreviewOffer] = useState(null); // offer object to preview on letterhead

  // Form State
  const [editorTab, setEditorTab] = useState('candidate'); // 'candidate' | 'salary' | 'terms'
  const [formData, setFormData] = useState({
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    candidateAddress: '',
    designation: '',
    department: 'Engineering',
    employmentType: 'Full-Time',
    workLocation: 'Office - Headquarters',
    joiningDate: '',
    expiryDate: '',
    probationPeriodMonths: 3,
    salaryStructureId: '',
    annualCTC: 600000,
    monthlyGross: 50000,
    netMonthlyTakeHome: 45000,
    salaryBreakup: [],
    termsAndConditions: '',
    customNotes: '',
    useLetterhead: true,
    includeSignAndSeal: true,
    status: 'Draft',
  });

  // ===================== QUERIES =====================

  // 1. Fetch Company Letterhead & Profile
  const { data: companyLetterheadData } = useQuery({
    queryKey: ['companyLetterhead'],
    queryFn: async () => {
      const { data } = await api.get('/companies/letterhead');
      return data;
    },
  });

  // 2. Fetch Available Salary Structure Packages
  const { data: salaryStructures = [] } = useQuery({
    queryKey: ['salaryStructures'],
    queryFn: async () => {
      const { data } = await api.get('/payroll/structures');
      return Array.isArray(data) ? data : [];
    },
  });

  // 3. Fetch Offer Letters
  const {
    data: offerData,
    isLoading: loadingOffers,
    refetch: refetchOffers,
  } = useQuery({
    queryKey: ['offerLetters', statusFilter, searchTerm],
    queryFn: async () => {
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const { data } = await api.get('/offer-letters', { params });
      return data;
    },
  });

  const offers = offerData?.offers || [];
  const stats = offerData?.stats || { total: 0, draft: 0, sent: 0, accepted: 0, rejected: 0, totalCTC: 0 };

  // ===================== SALARY CALCULATION HELPER =====================
  const calculateBreakup = (plan, ctcVal) => {
    const annualVal = parseFloat(ctcVal) || 0;
    const monthlyVal = annualVal > 0 ? annualVal / 12 : 0;

    if (!plan || !Array.isArray(plan.components) || plan.components.length === 0) {
      // Basic 50-40-10 fallback
      const basicM = monthlyVal * 0.5;
      const hraM = basicM * 0.4;
      const splM = Math.max(0, monthlyVal - basicM - hraM);
      const pfM = Math.round(basicM * 0.12);
      const ptM = 200;
      const netM = Math.round(monthlyVal - pfM - ptM);

      return {
        monthlyGross: Math.round(monthlyVal),
        netMonthlyTakeHome: Math.max(0, netM),
        breakup: [
          { name: 'Basic Salary', type: 'Earning', calculationType: 'PercentageOfCTC', value: 50, monthlyAmount: Math.round(basicM), annualAmount: Math.round(basicM * 12) },
          { name: 'House Rent Allowance (HRA)', type: 'Earning', calculationType: 'PercentageOfBasic', value: 40, monthlyAmount: Math.round(hraM), annualAmount: Math.round(hraM * 12) },
          { name: 'Special Allowance', type: 'Earning', calculationType: 'Fixed', value: splM, monthlyAmount: Math.round(splM), annualAmount: Math.round(splM * 12) },
          { name: 'Employee PF (12%)', type: 'Deduction', calculationType: 'PercentageOfBasic', value: 12, monthlyAmount: Math.round(pfM), annualAmount: Math.round(pfM * 12) },
          { name: 'Professional Tax (PT)', type: 'Deduction', calculationType: 'Fixed', value: 200, monthlyAmount: ptM, annualAmount: ptM * 12 },
        ],
      };
    }

    // Dynamic from plan
    let basicMonthly = 0;
    const basicComp = plan.components.find(
      (c) => c.type === 'Earning' && (c.name.toLowerCase().includes('basic') || c.key === 'basic')
    );
    if (basicComp) {
      if (basicComp.calculationType === 'PercentageOfCTC') {
        basicMonthly = (monthlyVal * (basicComp.value || 0)) / 100;
      } else {
        basicMonthly = basicComp.value || 0;
      }
    } else {
      basicMonthly = monthlyVal * 0.5;
    }

    let totalEarningsMonthly = 0;
    let totalDeductionsMonthly = 0;

    const breakup = plan.components.map((c) => {
      let mAmount = 0;
      if (c.calculationType === 'PercentageOfCTC') {
        mAmount = (monthlyVal * (c.value || 0)) / 100;
      } else if (c.calculationType === 'PercentageOfBasic') {
        mAmount = (basicMonthly * (c.value || 0)) / 100;
      } else {
        mAmount = c.value || 0;
      }

      mAmount = Math.round(mAmount);
      const aAmount = Math.round(mAmount * 12);

      if (c.type === 'Earning') totalEarningsMonthly += mAmount;
      if (c.type === 'Deduction') totalDeductionsMonthly += mAmount;

      return {
        name: c.name,
        type: c.type,
        calculationType: c.calculationType,
        value: c.value,
        monthlyAmount: mAmount,
        annualAmount: aAmount,
      };
    });

    if (totalEarningsMonthly === 0) totalEarningsMonthly = monthlyVal;
    const netM = Math.max(0, Math.round(totalEarningsMonthly - totalDeductionsMonthly));

    return {
      monthlyGross: Math.round(totalEarningsMonthly),
      netMonthlyTakeHome: netM,
      breakup,
    };
  };

  // When Salary Plan or Annual CTC changes in form
  const handleSalaryOrPlanChange = (planId, ctcVal) => {
    const targetPlan = salaryStructures.find((p) => p._id === planId) || null;
    const calc = calculateBreakup(targetPlan, ctcVal);
    setFormData((prev) => ({
      ...prev,
      salaryStructureId: planId,
      annualCTC: Number(ctcVal) || 0,
      monthlyGross: calc.monthlyGross,
      netMonthlyTakeHome: calc.netMonthlyTakeHome,
      salaryBreakup: calc.breakup,
    }));
  };

  // Open Form for New Offer
  const handleOpenNew = () => {
    setEditingOffer(null);
    const defaultPlan = salaryStructures.find((p) => p.isDefault) || salaryStructures[0] || null;
    const initialCTC = 600000;
    const calc = calculateBreakup(defaultPlan, initialCTC);

    setFormData({
      candidateName: '',
      candidateEmail: '',
      candidatePhone: '',
      candidateAddress: '',
      designation: '',
      department: 'Engineering',
      employmentType: 'Full-Time',
      workLocation: 'Office - Headquarters',
      joiningDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      probationPeriodMonths: 3,
      salaryStructureId: defaultPlan?._id || '',
      annualCTC: initialCTC,
      monthlyGross: calc.monthlyGross,
      netMonthlyTakeHome: calc.netMonthlyTakeHome,
      salaryBreakup: calc.breakup,
      termsAndConditions: companyLetterheadData?.letterhead?.defaultOfferTerms || '',
      customNotes: '',
      useLetterhead: true,
      includeSignAndSeal: true,
      status: 'Draft',
    });
    setEditorTab('candidate');
    setIsEditorOpen(true);
  };

  // Open Form for Editing Existing Offer
  const handleOpenEdit = (offer) => {
    setEditingOffer(offer);
    setFormData({
      candidateName: offer.candidateName || '',
      candidateEmail: offer.candidateEmail || '',
      candidatePhone: offer.candidatePhone || '',
      candidateAddress: offer.candidateAddress || '',
      designation: offer.designation || '',
      department: offer.department || 'General',
      employmentType: offer.employmentType || 'Full-Time',
      workLocation: offer.workLocation || 'Office - Headquarters',
      joiningDate: offer.joiningDate ? offer.joiningDate.split('T')[0] : '',
      expiryDate: offer.expiryDate ? offer.expiryDate.split('T')[0] : '',
      probationPeriodMonths: offer.probationPeriodMonths || 3,
      salaryStructureId: offer.salaryStructure?._id || offer.salaryStructure || '',
      annualCTC: offer.annualCTC || 0,
      monthlyGross: offer.monthlyGross || 0,
      netMonthlyTakeHome: offer.netMonthlyTakeHome || 0,
      salaryBreakup: offer.salaryBreakup || [],
      termsAndConditions: offer.termsAndConditions || '',
      customNotes: offer.customNotes || '',
      useLetterhead: offer.useLetterhead !== undefined ? offer.useLetterhead : true,
      includeSignAndSeal: offer.includeSignAndSeal !== undefined ? offer.includeSignAndSeal : true,
      status: offer.status || 'Draft',
    });
    setEditorTab('candidate');
    setIsEditorOpen(true);
  };

  // Save Mutation (Create or Update)
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingOffer) {
        const { data } = await api.put(`/offer-letters/${editingOffer._id}`, payload);
        return data;
      } else {
        const { data } = await api.post('/offer-letters', payload);
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['offerLetters']);
      toast.success(editingOffer ? 'Offer letter updated successfully' : 'Offer letter created successfully');
      setIsEditorOpen(false);
      // Auto open preview of the saved offer
      if (data.offer) {
        setPreviewOffer(data.offer);
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save offer letter');
    },
  });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.candidateName.trim() || !formData.candidateEmail.trim() || !formData.designation.trim() || !formData.joiningDate) {
      toast.error('Please fill in candidate name, email, designation, and joining date');
      return;
    }

    const payload = {
      ...formData,
      salaryStructure: formData.salaryStructureId || undefined,
    };
    saveMutation.mutate(payload);
  };

  // Status Change Mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.patch(`/offer-letters/${id}/status`, { status });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['offerLetters']);
      toast.success(data.message || 'Status updated');
      if (previewOffer && previewOffer._id === data.offer?._id) {
        setPreviewOffer((prev) => ({ ...prev, status: data.offer.status }));
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error updating status');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/offer-letters/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['offerLetters']);
      toast.success('Offer letter deleted');
      if (previewOffer) setPreviewOffer(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete offer');
    },
  });

  // Send Email Mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/offer-letters/${id}/send-email`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['offerLetters']);
      toast.success(data.message || 'Offer letter email sent successfully!');
      if (previewOffer) {
        setPreviewOffer((prev) => ({ ...prev, status: 'Sent', sentAt: data.sentAt }));
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send offer letter email');
    },
  });

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  const getFullImgUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('blob:') || path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    return `${API_BASE_URL.replace(/\/api\/?$/, '')}${path}`;
  };

  const letterheadSettings = companyLetterheadData?.letterhead || {};
  const activeLetterheadUrl = letterheadSettings.url ? getFullImgUrl(letterheadSettings.url) : '';
  const activeSignatureUrl = letterheadSettings.signatureUrl ? getFullImgUrl(letterheadSettings.signatureUrl) : '';
  const activeSealUrl = letterheadSettings.sealUrl ? getFullImgUrl(letterheadSettings.sealUrl) : '';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ===================== PAGE HEADER ===================== */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
            <HiOutlineDocumentText className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Offer Letter Generator & Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Create, customize, and issue professional appointment letters rendered on your uploaded company blank letterhead.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/admin/settings?tab=letterhead"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
          >
            <HiOutlineCog6Tooth className="w-4 h-4 text-indigo-600" />
            <span>Letterhead Settings</span>
          </Link>
          <button
            type="button"
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 transition cursor-pointer"
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span>Create Offer Letter</span>
          </button>
        </div>
      </div>

      {/* ===================== KPI STATS CARDS ===================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Issued</p>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-1">{stats.total || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Drafts</p>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-600 font-mono mt-1">{stats.draft || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Dispatched / Sent</p>
          <p className="text-xl sm:text-2xl font-extrabold text-indigo-600 font-mono mt-1">{stats.sent || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Accepted</p>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 font-mono mt-1">{stats.accepted || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Declined / Revoked</p>
          <p className="text-xl sm:text-2xl font-extrabold text-rose-600 font-mono mt-1">{stats.rejected || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total CTC Committed</p>
          <p className="text-base sm:text-lg font-bold text-slate-900 font-mono mt-1 truncate">
            ₹{(stats.totalCTC || 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* ===================== SEARCH & FILTER BAR ===================== */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate name, email, designation, or offer reference #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {['All', 'Draft', 'Sent', 'Accepted', 'Rejected'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {st}
            </button>
          ))}
          <button
            type="button"
            onClick={() => refetchOffers()}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
            title="Refresh"
          >
            <HiOutlineArrowPath className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ===================== OFFERS TABLE ===================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loadingOffers ? (
          <div className="p-16 flex justify-center">
            <div className="w-9 h-9 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : offers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HiOutlineDocumentText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Offer Letters Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Get started by creating a customized offer letter. You can preview it directly on your uploaded company blank letterhead.
            </p>
            <button
              type="button"
              onClick={handleOpenNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              <HiOutlinePlus className="w-4 h-4" />
              Create First Offer Letter
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Ref Number</th>
                  <th className="py-3 px-4">Candidate Details</th>
                  <th className="py-3 px-4">Position & Dept</th>
                  <th className="py-3 px-4">Compensation (CTC)</th>
                  <th className="py-3 px-4">Joining Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {offers.map((offer) => {
                  const statusColors = {
                    Draft: 'bg-slate-100 text-slate-700 border-slate-200',
                    Sent: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    Accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
                    Revoked: 'bg-amber-50 text-amber-700 border-amber-200',
                  };

                  return (
                    <tr key={offer._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                        {offer.offerNumber}
                      </td>
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <p className="font-bold text-slate-900 text-sm">{offer.candidateName}</p>
                        <p className="text-slate-500 text-[11px]">{offer.candidateEmail}</p>
                        {offer.candidatePhone && (
                          <p className="text-slate-400 text-[10px]">{offer.candidatePhone}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-semibold text-slate-800">{offer.designation}</p>
                        <p className="text-slate-500 text-[11px]">
                          {offer.department} • <span className="text-slate-400">{offer.employmentType}</span>
                        </p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-mono font-bold text-emerald-700 text-sm">
                          ₹{(offer.annualCTC || 0).toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          ₹{(offer.monthlyGross || 0).toLocaleString('en-IN')}/mo Gross
                        </p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-medium text-slate-800">
                          {new Date(offer.joiningDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Probation: {offer.probationPeriodMonths || 3} mo
                        </p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            statusColors[offer.status] || statusColors.Draft
                          }`}
                        >
                          {offer.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* Preview on Letterhead */}
                          <button
                            type="button"
                            onClick={() => setPreviewOffer(offer)}
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                            title="View Letterhead Document"
                          >
                            <HiOutlineEye className="w-4 h-4" />
                          </button>

                          {/* Send Email */}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Send official offer letter to ${offer.candidateEmail}?`)) {
                                sendEmailMutation.mutate(offer._id);
                              }
                            }}
                            disabled={sendEmailMutation.isPending}
                            className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 transition cursor-pointer"
                            title="Send via Company SMTP Email"
                          >
                            <HiOutlinePaperAirplane className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(offer)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            title="Edit Details"
                          >
                            <HiOutlinePencilSquare className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete offer letter ${offer.offerNumber}?`)) {
                                deleteMutation.mutate(offer._id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Offer"
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

      {/* ===================== MODAL: CREATE / EDIT OFFER LETTER ===================== */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HiOutlineDocumentText className="w-5 h-5 text-indigo-600" />
                  {editingOffer ? `Edit Offer Letter (${editingOffer.offerNumber})` : 'Create New Offer Letter'}
                </h3>
                <p className="text-xs text-slate-500">
                  Fill in candidate details, customize CTC compensation breakup, and review corporate clauses.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Step / Tab navigation */}
            <div className="flex border-b border-slate-200 px-6 gap-6 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setEditorTab('candidate')}
                className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer ${
                  editorTab === 'candidate' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
                }`}
              >
                <HiOutlineUser className="w-4 h-4" />
                1. Candidate & Position
              </button>
              <button
                type="button"
                onClick={() => setEditorTab('salary')}
                className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer ${
                  editorTab === 'salary' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
                }`}
              >
                <HiOutlineCurrencyRupee className="w-4 h-4" />
                2. Salary Package & CTC
              </button>
              <button
                type="button"
                onClick={() => setEditorTab('terms')}
                className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer ${
                  editorTab === 'terms' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'
                }`}
              >
                <HiOutlineBriefcase className="w-4 h-4" />
                3. Terms & Branding
              </button>
            </div>

            {/* Form Body (Scrollable) */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* TAB 1: CANDIDATE & POSITION */}
              {editorTab === 'candidate' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Candidate Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Amit Kumar Sharma"
                        value={formData.candidateName}
                        onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Candidate Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. amit.sharma@example.com"
                        value={formData.candidateEmail}
                        onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +91 9876543210"
                        value={formData.candidatePhone}
                        onChange={(e) => setFormData({ ...formData, candidatePhone: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Current Residential Address
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Flat 402, Shivajinagar, Pune, MH"
                        value={formData.candidateAddress}
                        onChange={(e) => setFormData({ ...formData, candidateAddress: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Designation / Job Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Senior Full Stack Engineer"
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Engineering, Sales, HR"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Employment Type
                      </label>
                      <select
                        value={formData.employmentType}
                        onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800"
                      >
                        <option value="Full-Time">Full-Time</option>
                        <option value="Part-Time">Part-Time</option>
                        <option value="Intern">Intern</option>
                        <option value="Contract">Contract</option>
                        <option value="Consultant">Consultant</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Work Location
                      </label>
                      <input
                        type="text"
                        placeholder="Office - HQ / Remote / Hybrid"
                        value={formData.workLocation}
                        onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Probation Period (Months)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="12"
                        value={formData.probationPeriodMonths}
                        onChange={(e) => setFormData({ ...formData, probationPeriodMonths: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Official Joining Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.joiningDate}
                        onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Offer Validity / Expiry Date
                      </label>
                      <input
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SALARY & CTC */}
              {editorTab === 'salary' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Select Salary Package Plan
                      </label>
                      <select
                        value={formData.salaryStructureId}
                        onChange={(e) => handleSalaryOrPlanChange(e.target.value, formData.annualCTC)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800 font-semibold"
                      >
                        <option value="">Standard Core Plan (Default)</option>
                        {salaryStructures.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} ({p.employmentType}) {p.isDefault ? '★ Default' : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Select from your configured plans in Payroll Settings.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Annual CTC (Cost to Company in ₹) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          value={formData.annualCTC}
                          onChange={(e) => handleSalaryOrPlanChange(formData.salaryStructureId, e.target.value)}
                          className="w-full pl-8 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-mono font-bold"
                        />
                      </div>
                      <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                        Monthly Gross: ₹{(formData.monthlyGross || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Calculated Annexure A Table */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Annexure A: Computed Salary Breakup Table
                    </h5>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                          <tr>
                            <th className="py-2.5 px-3">Component Name</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3 text-right">Monthly (₹)</th>
                            <th className="py-2.5 px-3 text-right">Annual (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {formData.salaryBreakup.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 font-medium text-slate-800">{item.name}</td>
                              <td className="py-2 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    item.type === 'Earning'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : item.type === 'Deduction'
                                      ? 'bg-rose-50 text-rose-700'
                                      : 'bg-amber-50 text-amber-700'
                                  }`}
                                >
                                  {item.type}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">
                                ₹{(item.monthlyAmount || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-medium text-slate-600">
                                ₹{(item.annualAmount || 0).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-indigo-50/80 font-bold text-indigo-900">
                            <td colSpan={2} className="py-2 px-3">
                              Estimated Net Monthly Take Home
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-sm">
                              ₹{(formData.netMonthlyTakeHome || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-sm text-slate-700">
                              ₹{((formData.netMonthlyTakeHome || 0) * 12).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TERMS & BRANDING */}
              {editorTab === 'terms' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-6 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.useLetterhead}
                        onChange={(e) => setFormData({ ...formData, useLetterhead: e.target.checked })}
                        className="rounded accent-indigo-600"
                      />
                      <span>Render on Blank Letterhead (Background)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.includeSignAndSeal}
                        onChange={(e) => setFormData({ ...formData, includeSignAndSeal: e.target.checked })}
                        className="rounded accent-indigo-600"
                      />
                      <span>Include Official Signature & Company Seal</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Terms & Conditions / Appointment Clauses
                    </label>
                    <textarea
                      rows={10}
                      value={formData.termsAndConditions}
                      onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                      placeholder="Enter company appointment clauses..."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Custom Notes / Special Instructions
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Please bring original degree certificates & relieving letter on Day 1"
                      value={formData.customNotes}
                      onChange={(e) => setFormData({ ...formData, customNotes: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="flex gap-2">
                  {editorTab !== 'candidate' && (
                    <button
                      type="button"
                      onClick={() => setEditorTab(editorTab === 'terms' ? 'salary' : 'candidate')}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                    >
                      Back
                    </button>
                  )}
                  {editorTab !== 'terms' && (
                    <button
                      type="button"
                      onClick={() => setEditorTab(editorTab === 'candidate' ? 'salary' : 'terms')}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 cursor-pointer"
                    >
                      Next Step →
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 disabled:opacity-50 cursor-pointer"
                  >
                    <HiOutlineCheckCircle className="w-4 h-4" />
                    <span>{saveMutation.isPending ? 'Saving Offer...' : editingOffer ? 'Update Offer' : 'Save & Preview'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: INTERACTIVE A4 LETTERHEAD PREVIEW & PRINT ===================== */}
      {previewOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full my-4 flex flex-col overflow-hidden max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:m-0 print:w-full">
            {/* Modal Action Header (Hidden during print) */}
            <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h4 className="text-sm font-bold text-white">
                  Official Letterhead Preview • {previewOffer.offerNumber}
                </h4>
                <span className="text-xs text-slate-400">({previewOffer.candidateName})</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Print Button */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                >
                  <HiOutlinePrinter className="w-4 h-4 text-indigo-600" />
                  <span>Print / Save PDF</span>
                </button>

                {/* Send Email */}
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Send official offer letter email to ${previewOffer.candidateEmail}?`)) {
                      sendEmailMutation.mutate(previewOffer._id);
                    }
                  }}
                  disabled={sendEmailMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50 cursor-pointer"
                >
                  <HiOutlinePaperAirplane className="w-4 h-4" />
                  <span>{sendEmailMutation.isPending ? 'Sending...' : 'Send to Candidate Email'}</span>
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={() => setPreviewOffer(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body (Printable Area) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 flex justify-center print:p-0 print:bg-white print:overflow-visible">
              <div
                ref={printRef}
                className="bg-white w-full max-w-[794px] min-h-[1123px] shadow-lg rounded-sm relative flex flex-col justify-between text-slate-800 text-[13px] leading-relaxed border border-slate-200 print:border-none print:shadow-none print:m-0 print:w-full print:min-h-0 print:rounded-none"
                style={{
                  backgroundImage:
                    previewOffer.useLetterhead && activeLetterheadUrl
                      ? `url("${activeLetterheadUrl}")`
                      : 'none',
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                }}
              >
                {/* Fallback Corporate Header if no blank letterhead image */}
                {(!previewOffer.useLetterhead || !activeLetterheadUrl) && (
                  <div className="p-8 border-b-2 border-indigo-600 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/20">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {previewOffer.company?.name || companyLetterheadData?.name || 'GLOBAL INFOTECH INDIA'}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1 max-w-md">
                        {previewOffer.company?.address || companyLetterheadData?.address || 'Corporate Headquarters, IT Park'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        GSTIN: {previewOffer.company?.gstNumber || companyLetterheadData?.gstNumber || '27AABCU9603R1ZM'} | CIN: {previewOffer.company?.registrationNumber || companyLetterheadData?.registrationNumber || 'U72900MH2026PTC123456'}
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xl shadow-sm">
                      {(previewOffer.company?.name || companyLetterheadData?.name || 'GI').slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                )}

                {/* Content Container (Padded based on Letterhead Margin) */}
                <div
                  className="flex-1 px-8 sm:px-12 flex flex-col justify-between"
                  style={{
                    paddingTop:
                      previewOffer.useLetterhead && activeLetterheadUrl
                        ? `${letterheadSettings.headerHeight || 130}px`
                        : '28px',
                    paddingBottom:
                      previewOffer.useLetterhead && activeLetterheadUrl
                        ? `${letterheadSettings.footerHeight || 80}px`
                        : '28px',
                  }}
                >
                  <div className="space-y-4">
                    {/* Reference & Date */}
                    <div className="flex justify-between items-center text-xs text-slate-600 border-b border-slate-200 pb-2">
                      <p>
                        <strong>Ref No:</strong> <span className="font-mono">{previewOffer.offerNumber}</span>
                      </p>
                      <p>
                        <strong>Date:</strong>{' '}
                        {new Date(previewOffer.createdAt || Date.now()).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    {/* Addressed to */}
                    <div className="text-xs space-y-0.5 pt-1">
                      <p className="font-bold text-slate-900 text-sm">{previewOffer.candidateName}</p>
                      {previewOffer.candidateAddress && <p className="text-slate-600">{previewOffer.candidateAddress}</p>}
                      <p className="text-slate-500">{previewOffer.candidateEmail}</p>
                      {previewOffer.candidatePhone && <p className="text-slate-500">{previewOffer.candidatePhone}</p>}
                    </div>

                    {/* Subject Line */}
                    <div className="py-1">
                      <p className="text-sm font-bold text-indigo-950 uppercase tracking-tight border-b border-indigo-200 pb-1">
                        Subject: Formal Offer of Employment – {previewOffer.designation}
                      </p>
                    </div>

                    {/* Salutation & Body */}
                    <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                      <p>
                        Dear <strong>{previewOffer.candidateName}</strong>,
                      </p>
                      <p>
                        We are delighted to offer you employment with{' '}
                        <strong>
                          {previewOffer.company?.name || companyLetterheadData?.name || 'the Company'}
                        </strong>{' '}
                        as <strong>{previewOffer.designation}</strong> in the <strong>{previewOffer.department}</strong>{' '}
                        department. We believe that your skills and background make you a valuable addition to our team.
                      </p>
                      <p>
                        Your scheduled date of joining will be{' '}
                        <strong>
                          {new Date(previewOffer.joiningDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </strong>
                        , and your working location will be <strong>{previewOffer.workLocation}</strong> on a{' '}
                        <strong>{previewOffer.employmentType}</strong> basis. You will undergo a probationary period of{' '}
                        <strong>{previewOffer.probationPeriodMonths || 3} months</strong>.
                      </p>
                    </div>

                    {/* Annexure A: Salary Breakup Table */}
                    <div className="pt-2 space-y-2">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        Annexure A: Compensation & Benefits Structure
                      </h4>

                      <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-300 text-[11px]">
                            <tr>
                              <th className="py-2 px-3">Salary Component</th>
                              <th className="py-2 px-3 text-right">Monthly (₹)</th>
                              <th className="py-2 px-3 text-right">Annual (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {(previewOffer.salaryBreakup || []).map((b, i) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="py-1.5 px-3 text-slate-800">
                                  {b.name}{' '}
                                  {b.type === 'Deduction' && (
                                    <span className="text-[10px] text-rose-600 font-semibold">(Deduction)</span>
                                  )}
                                </td>
                                <td className="py-1.5 px-3 text-right font-mono font-medium text-slate-900">
                                  ₹{(b.monthlyAmount || 0).toLocaleString('en-IN')}
                                </td>
                                <td className="py-1.5 px-3 text-right font-mono text-slate-600">
                                  ₹{(b.annualAmount || 0).toLocaleString('en-IN')}
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-emerald-50/70 font-bold text-emerald-900 border-t-2 border-emerald-300">
                              <td className="py-2 px-3">Gross Total CTC (Cost to Company)</td>
                              <td className="py-2 px-3 text-right font-mono">
                                ₹{(previewOffer.monthlyGross || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-sm">
                                ₹{(previewOffer.annualCTC || 0).toLocaleString('en-IN')}
                              </td>
                            </tr>
                            <tr className="bg-indigo-50/60 font-semibold text-indigo-900">
                              <td className="py-1.5 px-3">Estimated Net Monthly Payout</td>
                              <td className="py-1.5 px-3 text-right font-mono font-bold">
                                ₹{(previewOffer.netMonthlyTakeHome || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono">
                                ₹{((previewOffer.netMonthlyTakeHome || 0) * 12).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Terms & Clauses */}
                    <div className="pt-2 space-y-1.5">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Key Terms & Employment Conditions
                      </h4>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] leading-relaxed text-slate-600 font-mono whitespace-pre-line max-h-48 overflow-y-auto print:max-h-none print:overflow-visible">
                        {previewOffer.termsAndConditions}
                      </div>
                    </div>
                  </div>

                  {/* Sign-off & Signatory Section */}
                  <div className="pt-6 border-t border-slate-200 flex items-end justify-between">
                    {/* Candidate Acceptance */}
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-slate-900">Candidate Acceptance:</p>
                      <p className="text-[11px] text-slate-500">I accept the terms and conditions outlined above.</p>
                      <div className="w-44 border-b border-slate-400 h-8 mt-2" />
                      <p className="text-[10px] text-slate-500 mt-1">Signature & Date: _________________</p>
                    </div>

                    {/* Company Signatory & Seal */}
                    <div className="text-right flex flex-col items-end text-xs">
                      <p className="text-[11px] text-slate-500 mb-1">
                        For <strong>{previewOffer.company?.name || companyLetterheadData?.name || 'the Company'}</strong>
                      </p>

                      <div className="flex items-center gap-2 mb-1">
                        {previewOffer.includeSignAndSeal && activeSealUrl && (
                          <img
                            src={activeSealUrl}
                            alt="Company Seal"
                            className="w-16 h-16 object-contain opacity-90"
                          />
                        )}
                        {previewOffer.includeSignAndSeal && activeSignatureUrl && (
                          <img
                            src={activeSignatureUrl}
                            alt="Signature"
                            className="h-10 object-contain"
                          />
                        )}
                      </div>

                      <p className="font-bold text-slate-900 text-sm">
                        {letterheadSettings.authorizedSignatoryName || 'Authorized Signatory'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {letterheadSettings.authorizedSignatoryDesignation || 'Human Resources Department'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fallback Corporate Footer if no blank letterhead image */}
                {(!previewOffer.useLetterhead || !activeLetterheadUrl) && (
                  <div className="p-4 border-t border-slate-200 text-center text-[10px] text-slate-400 bg-slate-50">
                    This document is digitally verified and issued on behalf of{' '}
                    {previewOffer.company?.name || companyLetterheadData?.name || 'Company Management'}.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferLettersPage;
