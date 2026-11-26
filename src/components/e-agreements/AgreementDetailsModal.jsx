import React from 'react';
import {
  HiOutlineXMark,
  HiOutlineDocumentCheck,
  HiOutlineShieldCheck,
  HiOutlineArrowDownTray,
  HiOutlineGlobeAlt,
  HiOutlineFingerPrint,
  HiOutlineCalendarDays,
} from 'react-icons/hi2';

const AgreementDetailsModal = ({ isOpen, onClose, agreement, onCheckStatus, isCheckingStatus, onViewDocument }) => {
  if (!isOpen || !agreement) return null;

  const signing = agreement.signing_details || {};
  const parties = agreement.parties || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <HiOutlineDocumentCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-heading font-extrabold text-slate-900">
                {agreement.title || 'Agreement Overview'}
              </h3>
              <p className="text-xs text-slate-500 font-mono-tech mt-0.5">
                ID: {agreement.agreement_id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status Badge & Actions Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 gap-3">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-heading font-bold uppercase tracking-wider ${
                agreement.status === 'Signed'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                ● {agreement.status || 'Initiated'}
              </span>
              <span className="text-xs font-mono-tech text-slate-500">
                Mode: <strong className="uppercase">{agreement.environment || 'sandbox'}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onCheckStatus && onCheckStatus(agreement.agreement_id)}
                disabled={isCheckingStatus}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-heading font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
              >
                {isCheckingStatus ? 'Checking...' : '🔄 Sync Live Status'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onViewDocument) {
                    onViewDocument(agreement);
                  } else {
                    window.open(`/api/agreements/${agreement.agreement_id}/view`, '_blank');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-heading font-bold transition-colors cursor-pointer shadow-xs"
              >
                <HiOutlineArrowDownTray className="w-3.5 h-3.5" />
                <span>View &amp; Print PDF</span>
              </button>
            </div>
          </div>

          {/* Certificate & Audit Details */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 font-heading font-bold text-xs">
              <HiOutlineShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Digital eSign Certificate &amp; Verification Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-500 uppercase font-mono-tech block">Verification Method</span>
                <span className="font-heading font-bold text-slate-800 mt-0.5 block">
                  {signing.verification_method || 'Aadhaar eSign (Simulated Sandbox)'}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-500 uppercase font-mono-tech block">Certificate Validity</span>
                <span className="font-heading font-bold text-emerald-700 mt-0.5 block">
                  {signing.certificate_validity || 'Valid (Sandbox Simulation)'}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-500 uppercase font-mono-tech block">Signed Timestamp</span>
                <span className="font-mono-tech text-slate-800 mt-0.5 block">
                  {signing.signed_at ? new Date(signing.signed_at).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-500 uppercase font-mono-tech block">Signer Origin IP</span>
                <span className="font-mono-tech text-slate-800 mt-0.5 block">
                  {signing.signer_ip || '223.185.40.148 (India)'}
                </span>
              </div>
            </div>
          </div>

          {/* Associated Company User */}
          {agreement.user && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-heading font-extrabold flex items-center justify-center text-sm shadow-sm">
                  {agreement.user.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-heading font-extrabold text-indigo-950">
                      {agreement.user.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-tech font-bold bg-white text-indigo-700 border border-indigo-200">
                      {agreement.user.role || 'Staff User'}
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-700/80 font-sans-modern">
                    {agreement.user.email} {agreement.user.phone ? `• ${agreement.user.phone}` : ''} {agreement.user.employeeId ? `• Emp ID: ${agreement.user.employeeId}` : ''}
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-mono-tech font-bold text-indigo-600 px-2 py-1 rounded-md bg-white border border-indigo-200">
                Linked User
              </span>
            </div>
          )}

          {/* Parties Involved */}
          <div className="space-y-2">
            <span className="text-xs font-mono-tech font-bold uppercase tracking-wider text-slate-500">
              SIGNING PARTIES &amp; RECIPIENTS
            </span>
            <div className="space-y-2">
              {parties.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
                  <div>
                    <span className="text-xs font-heading font-bold text-slate-900 block">{p.name}</span>
                    <span className="text-[11px] text-slate-500">{p.email} • {p.phone || 'N/A'}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-tech font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {p.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Parameter Values Injected */}
          {agreement.variable_data && Object.keys(agreement.variable_data).length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-mono-tech font-bold uppercase tracking-wider text-slate-500">
                INJECTED DYNAMIC PARAMETERS
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(agreement.variable_data).map(([k, v]) => (
                  <div key={k} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-[10px] font-mono-tech text-slate-500 uppercase block">{k}</span>
                    <span className="font-heading font-bold text-slate-800 block mt-0.5">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-heading font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgreementDetailsModal;
