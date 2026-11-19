import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';
import {
  HiOutlineDocumentText,
  HiOutlinePhoto,
  HiOutlineArrowUpTray,
  HiOutlineCheckCircle,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineSparkles,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineBuildingOffice2,
  HiOutlineIdentification,
  HiOutlineArrowPath,
} from 'react-icons/hi2';

const CompanyLetterheadSettings = () => {
  const queryClient = useQueryClient();

  // Form states
  const [headerHeight, setHeaderHeight] = useState(130);
  const [footerHeight, setFooterHeight] = useState(80);
  const [authorizedSignatoryName, setAuthorizedSignatoryName] = useState('');
  const [authorizedSignatoryDesignation, setAuthorizedSignatoryDesignation] = useState('Authorized HR Signatory');
  const [showWatermark, setShowWatermark] = useState(false);
  const [defaultOfferTerms, setDefaultOfferTerms] = useState('');

  // Selected files & local previews for new uploads
  const [letterheadFile, setLetterheadFile] = useState(null);
  const [letterheadPreview, setLetterheadPreview] = useState('');
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState('');
  const [sealFile, setSealFile] = useState(null);
  const [sealPreview, setSealPreview] = useState('');

  // Preview document mode: 'offer' or 'payslip'
  const [previewDocType, setPreviewDocType] = useState('offer');

  // Fetch company letterhead & branding
  const { data: companyData, isLoading, refetch } = useQuery({
    queryKey: ['companyLetterhead'],
    queryFn: async () => {
      const { data } = await api.get('/companies/letterhead');
      return data;
    },
  });

  // Populate form when data arrives
  useEffect(() => {
    if (companyData) {
      const lh = companyData.letterhead || {};
      setHeaderHeight(lh.headerHeight !== undefined ? lh.headerHeight : 130);
      setFooterHeight(lh.footerHeight !== undefined ? lh.footerHeight : 80);
      setAuthorizedSignatoryName(lh.authorizedSignatoryName || '');
      setAuthorizedSignatoryDesignation(lh.authorizedSignatoryDesignation || 'Authorized HR Signatory');
      setShowWatermark(Boolean(lh.showWatermark));
      setDefaultOfferTerms(lh.defaultOfferTerms || '');
    }
  }, [companyData]);

  // Clean local blob URLs
  useEffect(() => {
    return () => {
      if (letterheadPreview && letterheadPreview.startsWith('blob:')) URL.revokeObjectURL(letterheadPreview);
      if (signaturePreview && signaturePreview.startsWith('blob:')) URL.revokeObjectURL(signaturePreview);
      if (sealPreview && sealPreview.startsWith('blob:')) URL.revokeObjectURL(sealPreview);
    };
  }, [letterheadPreview, signaturePreview, sealPreview]);

  // Handle file selections
  const handleLetterheadSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLetterheadFile(file);
      setLetterheadPreview(URL.createObjectURL(file));
    }
  };

  const handleSignatureSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSignatureFile(file);
      setSignaturePreview(URL.createObjectURL(file));
    }
  };

  const handleSealSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSealFile(file);
      setSealPreview(URL.createObjectURL(file));
    }
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('headerHeight', headerHeight);
      formData.append('footerHeight', footerHeight);
      formData.append('authorizedSignatoryName', authorizedSignatoryName);
      formData.append('authorizedSignatoryDesignation', authorizedSignatoryDesignation);
      formData.append('showWatermark', showWatermark);
      formData.append('defaultOfferTerms', defaultOfferTerms);

      if (letterheadFile) formData.append('letterhead', letterheadFile);
      if (signatureFile) formData.append('signature', signatureFile);
      if (sealFile) formData.append('seal', sealFile);

      const { data } = await api.put('/companies/letterhead', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['companyLetterhead']);
      setLetterheadFile(null);
      setSignatureFile(null);
      setSealFile(null);
      toast.success(data.message || 'Letterhead branding saved successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save letterhead settings');
    },
  });

  // Remove file mutation
  const removeFileMutation = useMutation({
    mutationFn: async (type) => {
      const { data } = await api.delete(`/companies/letterhead/file/${type}`);
      return data;
    },
    onSuccess: (_, type) => {
      queryClient.invalidateQueries(['companyLetterhead']);
      if (type === 'letterhead') {
        setLetterheadFile(null);
        setLetterheadPreview('');
      } else if (type === 'signature') {
        setSignatureFile(null);
        setSignaturePreview('');
      } else if (type === 'seal') {
        setSealFile(null);
        setSealPreview('');
      }
      toast.success(`Removed ${type} image successfully`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error removing file');
    },
  });

  const getFullImgUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('blob:') || path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    return `${API_BASE_URL.replace(/\/api\/?$/, '')}${path}`;
  };

  const activeLetterheadUrl = letterheadPreview || (companyData?.letterhead?.url ? getFullImgUrl(companyData.letterhead.url) : '');
  const activeSignatureUrl = signaturePreview || (companyData?.letterhead?.signatureUrl ? getFullImgUrl(companyData.letterhead.signatureUrl) : '');
  const activeSealUrl = sealPreview || (companyData?.letterhead?.sealUrl ? getFullImgUrl(companyData.letterhead.sealUrl) : '');

  if (isLoading) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 flex justify-center shadow-sm">
        <div className="w-9 h-9 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-white p-5 rounded-2xl border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <HiOutlineDocumentText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Official Company Letterhead & Document Branding
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Upload your company's blank official letterhead image, authorized signature, and official seal. These are automatically applied to generate official Offer Letters and Salary Payslips.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
            title="Reload settings"
          >
            <HiOutlineArrowPath className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 transition disabled:opacity-50 cursor-pointer"
          >
            <HiOutlineCheckCircle className="w-4 h-4" />
            <span>{saveMutation.isPending ? 'Saving Settings...' : 'Save Letterhead Branding'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ===================== LEFT: SETTINGS FORM (7 COLS) ===================== */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Blank Letterhead Image Upload Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HiOutlinePhoto className="w-4 h-4 text-indigo-600" />
                  Blank Letterhead Template (Background)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload an A4-proportioned image of your blank printed letterhead (with logo, header & footer graphics).
                </p>
              </div>
              {activeLetterheadUrl && (
                <button
                  type="button"
                  onClick={() => removeFileMutation.mutate('letterhead')}
                  disabled={removeFileMutation.isPending}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <HiOutlineTrash className="w-3.5 h-3.5" />
                  Remove
                </button>
              )}
            </div>

            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-4 text-center bg-slate-50/50 hover:bg-indigo-50/20 transition group">
              {activeLetterheadUrl ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-24 h-32 border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs shrink-0 flex items-center justify-center p-1">
                    <img
                      src={activeLetterheadUrl}
                      alt="Letterhead Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {letterheadFile ? letterheadFile.name : 'Current Blank Letterhead Image'}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                      <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                      Active on Offer Letters & Payslips
                    </p>
                    <label className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer">
                      <HiOutlineArrowUpTray className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Replace Image</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleLetterheadSelect}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer block py-4">
                  <HiOutlineArrowUpTray className="w-8 h-8 text-slate-400 mx-auto group-hover:text-indigo-600 transition" />
                  <p className="text-xs font-bold text-slate-700 mt-2">
                    Click to browse or drag & drop blank letterhead image
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, or WebP (A4 ratio recommended, max 5MB)</p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleLetterheadSelect}
                  />
                </label>
              )}
            </div>

            {/* Margin Spacing Sliders */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Top Header Margin</span>
                  <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{headerHeight}px</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="260"
                  step="5"
                  value={headerHeight}
                  onChange={(e) => setHeaderHeight(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Space reserved so text does not overlap top logo/header.</p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Bottom Footer Margin</span>
                  <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{footerHeight}px</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="200"
                  step="5"
                  value={footerHeight}
                  onChange={(e) => setFooterHeight(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Space reserved above bottom footer address.</p>
              </div>
            </div>
          </div>

          {/* 2. Authorized Signatory & Official Stamp Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HiOutlineIdentification className="w-4 h-4 text-indigo-600" />
              Signatory Credentials & Official Seal
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Authorized Signer Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={authorizedSignatoryName}
                  onChange={(e) => setAuthorizedSignatoryName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Signer Title / Designation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Head of Human Resources"
                  value={authorizedSignatoryDesignation}
                  onChange={(e) => setAuthorizedSignatoryDesignation(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Signature Upload */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">Authorized Signature</span>
                  {activeSignatureUrl && (
                    <button
                      type="button"
                      onClick={() => removeFileMutation.mutate('signature')}
                      className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>

                {activeSignatureUrl ? (
                  <div className="h-16 flex items-center justify-center bg-white border border-slate-200 rounded-lg p-1">
                    <img src={activeSignatureUrl} alt="Signature" className="max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="h-16 flex items-center justify-center border border-dashed border-slate-300 rounded-lg text-slate-400 text-xs">
                    No signature uploaded
                  </div>
                )}

                <label className="mt-2.5 inline-flex items-center justify-center w-full gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer">
                  <HiOutlineArrowUpTray className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{activeSignatureUrl ? 'Change Signature (PNG)' : 'Upload Signature (PNG)'}</span>
                  <input type="file" accept="image/png" className="hidden" onChange={handleSignatureSelect} />
                </label>
              </div>

              {/* Seal / Stamp Upload */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">Official Company Seal / Stamp</span>
                  {activeSealUrl && (
                    <button
                      type="button"
                      onClick={() => removeFileMutation.mutate('seal')}
                      className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>

                {activeSealUrl ? (
                  <div className="h-16 flex items-center justify-center bg-white border border-slate-200 rounded-lg p-1">
                    <img src={activeSealUrl} alt="Seal" className="max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="h-16 flex items-center justify-center border border-dashed border-slate-300 rounded-lg text-slate-400 text-xs">
                    No stamp/seal uploaded
                  </div>
                )}

                <label className="mt-2.5 inline-flex items-center justify-center w-full gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer">
                  <HiOutlineArrowUpTray className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{activeSealUrl ? 'Change Seal (PNG)' : 'Upload Company Seal (PNG)'}</span>
                  <input type="file" accept="image/png" className="hidden" onChange={handleSealSelect} />
                </label>
              </div>
            </div>
          </div>

          {/* 3. Default Offer Letter Terms & Conditions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HiOutlineAdjustmentsHorizontal className="w-4 h-4 text-indigo-600" />
              Standard Corporate Terms (Default for Offer Letters)
            </h4>
            <p className="text-xs text-slate-500">
              These clauses will be pre-filled when creating new offer letters (and can be customized per candidate).
            </p>
            <textarea
              rows={6}
              value={defaultOfferTerms}
              onChange={(e) => setDefaultOfferTerms(e.target.value)}
              placeholder="Enter standard clauses (Appointment, Probation, Working Hours, Non-Disclosure, Notice Period, etc.). Leave empty to use system enterprise default."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
            />
          </div>
        </div>

        {/* ===================== RIGHT: LIVE INTERACTIVE PREVIEW (5 COLS) ===================== */}
        <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-24">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <HiOutlineEye className="w-4 h-4 text-indigo-600" />
              Interactive Paper Preview
            </span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPreviewDocType('offer')}
                className={`px-3 py-1 rounded-md transition cursor-pointer ${
                  previewDocType === 'offer' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Offer Letter
              </button>
              <button
                type="button"
                onClick={() => setPreviewDocType('payslip')}
                className={`px-3 py-1 rounded-md transition cursor-pointer ${
                  previewDocType === 'payslip' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Salary Payslip
              </button>
            </div>
          </div>

          {/* Mini A4 Sheet Preview Container */}
          <div
            className="w-full bg-slate-200 p-4 rounded-2xl flex justify-center overflow-hidden border border-slate-300 shadow-inner"
            style={{ minHeight: '520px' }}
          >
            <div
              className="w-full max-w-[420px] bg-white rounded-lg shadow-xl relative overflow-hidden flex flex-col border border-slate-300 text-[10px] leading-tight"
              style={{
                aspectRatio: '1 / 1.414',
                backgroundImage: activeLetterheadUrl ? `url("${activeLetterheadUrl}")` : 'none',
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
              }}
            >
              {/* Fallback Corporate Header if no image uploaded */}
              {!activeLetterheadUrl && (
                <div className="p-3 border-b border-indigo-100 bg-gradient-to-r from-slate-50 to-indigo-50/30 flex items-center justify-between">
                  <div>
                    <h5 className="font-extrabold text-[12px] text-slate-900 tracking-tight">
                      {companyData?.name || 'GLOBAL INFOTECH INDIA'}
                    </h5>
                    <p className="text-[9px] text-slate-500">
                      {companyData?.address || 'IT Park, Cyber City, Sector 4'}
                    </p>
                    <p className="text-[8px] text-slate-400">
                      GSTIN: {companyData?.gstNumber || '27AABCU9603R1ZM'} | CIN: U72900MH2026PTC123456
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {(companyData?.name || 'GI').slice(0, 2).toUpperCase()}
                  </div>
                </div>
              )}

              {/* Dynamic Content Area with Margins */}
              <div
                className="flex-1 px-4 text-slate-800 flex flex-col justify-between"
                style={{
                  paddingTop: `${Math.round(headerHeight * 0.35)}px`,
                  paddingBottom: `${Math.round(footerHeight * 0.35)}px`,
                }}
              >
                {previewDocType === 'offer' ? (
                  /* SAMPLE OFFER LETTER PREVIEW */
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[9px] text-slate-500 border-b border-slate-100 pb-1">
                      <span>Ref: OL-2026-0042</span>
                      <span>Date: 18 Nov 2026</span>
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">To: Amit Kumar Sharma</p>
                      <p className="text-slate-500">Pune, Maharashtra</p>
                    </div>

                    <p className="font-bold text-indigo-700 text-[10px]">
                      Sub: Letter of Offer - Senior Full Stack Engineer
                    </p>

                    <p className="text-slate-600 text-[9px]">
                      We are pleased to offer you the position of <strong>Senior Full Stack Engineer</strong> at{' '}
                      <strong>{companyData?.name || 'Our Company'}</strong>. Your annual fixed CTC will be{' '}
                      <strong>₹12,00,000</strong>.
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded p-1.5 space-y-0.5">
                      <p className="font-bold text-slate-800 text-[9px]">Annexure A: Monthly Compensation</p>
                      <div className="flex justify-between text-[8px] text-slate-600">
                        <span>Basic + HRA + Allowances:</span>
                        <span className="font-mono font-bold">₹1,00,000 / mo</span>
                      </div>
                      <div className="flex justify-between text-[8px] text-rose-600">
                        <span>Deductions (PF, PT):</span>
                        <span className="font-mono">-₹4,200 / mo</span>
                      </div>
                      <div className="flex justify-between text-[8px] text-indigo-700 font-bold border-t border-slate-200 pt-0.5">
                        <span>Net Take Home:</span>
                        <span className="font-mono">₹95,800 / mo</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* SAMPLE PAYSLIP PREVIEW */
                  <div className="space-y-2">
                    <div className="text-center pb-1 border-b border-slate-200">
                      <p className="font-extrabold text-[11px] text-slate-900 uppercase">
                        Salary Payslip • November 2026
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[8px] bg-slate-50 p-1.5 rounded border border-slate-200">
                      <div>Employee: <strong>Rohit Verma</strong></div>
                      <div>Dept: <strong>Engineering</strong></div>
                      <div>Designation: <strong>Tech Lead</strong></div>
                      <div>Days Worked: <strong>22 / 22</strong></div>
                    </div>

                    <div className="border border-slate-200 rounded overflow-hidden">
                      <table className="w-full text-[8px]">
                        <thead className="bg-slate-100 font-bold">
                          <tr>
                            <th className="p-1 text-left">Earnings (Credits)</th>
                            <th className="p-1 text-right">Deductions (Debits)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="p-1">Basic: ₹50,000</td>
                            <td className="p-1 text-right text-rose-600">PF: ₹2,400</td>
                          </tr>
                          <tr>
                            <td className="p-1">HRA: ₹25,000</td>
                            <td className="p-1 text-right text-rose-600">PT: ₹200</td>
                          </tr>
                          <tr className="bg-indigo-50/70 font-bold text-indigo-900">
                            <td className="p-1">Gross: ₹95,000</td>
                            <td className="p-1 text-right">Net: ₹92,400</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Bottom Signature & Seal in Preview */}
                <div className="pt-2 border-t border-slate-100 flex items-end justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[8px] text-slate-500">Candidate Acceptance:</p>
                    <div className="w-20 border-b border-slate-300 h-4" />
                    <p className="text-[7px] text-slate-400">Signature & Date</p>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <div className="flex items-center gap-1 mb-0.5">
                      {activeSealUrl && (
                        <img src={activeSealUrl} alt="Seal" className="w-8 h-8 object-contain opacity-80" />
                      )}
                      {activeSignatureUrl && (
                        <img src={activeSignatureUrl} alt="Sign" className="h-6 object-contain" />
                      )}
                    </div>
                    <p className="font-bold text-[9px] text-slate-900">
                      {authorizedSignatoryName || 'Authorized Signatory'}
                    </p>
                    <p className="text-[8px] text-slate-500">
                      {authorizedSignatoryDesignation || 'HR Department'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fallback Corporate Footer if no image uploaded */}
              {!activeLetterheadUrl && (
                <div className="p-2 border-t border-slate-100 bg-slate-50 text-center text-[7px] text-slate-400">
                  This is a system generated document authenticated by {companyData?.name || 'Company Portal'}.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyLetterheadSettings;
