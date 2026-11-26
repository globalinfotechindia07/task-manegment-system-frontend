import { useMemo } from 'react';
import {
  HiOutlineXMark,
  HiOutlinePrinter,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineShieldCheck,
  HiOutlineDocumentCheck,
  HiOutlineBuildingOffice2,
  HiOutlineUser,
} from 'react-icons/hi2';

const AgreementDocumentViewerModal = ({ isOpen, onClose, agreement }) => {
  if (!isOpen || !agreement) return null;

  const signing = agreement.signing_details || {};
  const parties = agreement.parties || [];
  const signerName = agreement.signer_name || agreement.user?.name || parties[0]?.name || 'Signer';
  const signerRole = parties[0]?.role || 'Borrower / Signer';
  const signerEmail = agreement.user?.email || parties[0]?.email || 'signer@example.com';
  const certNumber = 'IN-DL' + (agreement.agreement_id?.replace(/[^a-zA-Z0-9]/g, '').slice(0, 14).toUpperCase() || 'SAMPLE');
  const signedDate = signing.signed_at
    ? new Date(signing.signed_at).toLocaleString('en-IN')
    : new Date(agreement.createdAt || Date.now()).toLocaleString('en-IN');

  // Replace variable placeholders with values and extract multi-page sheets
  const pagesList = useMemo(() => {
    let pages = [];
    if (Array.isArray(agreement.pages) && agreement.pages.length > 0) {
      pages = agreement.pages.map((p, idx) => ({
        pageNumber: p.pageNumber || idx + 1,
        content: p.content || '',
      }));
    } else {
      const rawBody = agreement.content_preview || agreement.template?.body || '<p>Agreement Document</p>';
      const parts = rawBody.split(/<!--\s*PAGE_BREAK\s*-->/i);
      pages = parts.map((part, idx) => ({
        pageNumber: idx + 1,
        content: part,
      }));
    }

    const vMap = agreement.variable_data && typeof agreement.variable_data === 'object'
      ? (agreement.variable_data instanceof Map ? Object.fromEntries(agreement.variable_data) : agreement.variable_data)
      : {};

    return pages.map((pg) => {
      let content = pg.content || '';
      Object.entries(vMap).forEach(([k, v]) => {
        const reg = new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'gi');
        content = content.replace(reg, `<strong class="text-slate-900 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 font-bold">${v}</strong>`);
      });
      return {
        pageNumber: pg.pageNumber,
        content,
      };
    });
  }, [agreement]);

  const handlePrint = () => {
    // Open dedicated printable backend route in new window which automatically triggers window.print()
    const printUrl = `/api/agreements/${agreement.agreement_id}/view?print=true`;
    window.open(printUrl, '_blank');
  };

  const handleOpenNewTab = () => {
    const viewUrl = `/api/agreements/${agreement.agreement_id}/view`;
    window.open(viewUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <style>{`
        .agreement-rendered-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          font-size: 0.85rem;
        }
        .agreement-rendered-content th,
        .agreement-rendered-content td {
          border: 1px solid #94a3b8;
          padding: 6px 10px;
          text-align: left;
        }
        .agreement-rendered-content th {
          background-color: #f8fafc;
          font-weight: 700;
        }
        .agreement-rendered-content p {
          margin-bottom: 0.75rem;
        }
      `}</style>
      <div className="bg-slate-100 rounded-3xl shadow-2xl border border-slate-300 max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden my-auto">
        {/* Sticky Header Toolbar */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <HiOutlineDocumentCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-heading font-extrabold text-white truncate">
                  {agreement.title}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-heading font-extrabold bg-emerald-500 text-slate-950 uppercase shrink-0">
                  ● {agreement.status || 'Signed'}
                </span>
              </div>
              <p className="text-[11px] font-mono-tech text-slate-400 truncate mt-0.5">
                ID: {agreement.agreement_id} • {pagesList.length} Page(s) • Environment: {agreement.environment || 'sandbox'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-heading font-bold transition-all shadow-md shadow-emerald-900/30 cursor-pointer"
              title="Print or Save as PDF"
            >
              <HiOutlinePrinter className="w-4 h-4" />
              <span className="hidden sm:inline">Download / Print PDF</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNewTab}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
              title="Open Fullscreen in New Tab"
            >
              <HiOutlineArrowTopRightOnSquare className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Viewer Scroll Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/70 space-y-6">
          {pagesList.map((pg, idx) => {
            const isFirstPage = idx === 0;
            const isLastPage = idx === pagesList.length - 1;

            return (
              <div
                key={idx}
                className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl border border-slate-300 p-6 sm:p-12 text-slate-900 font-serif min-h-[900px] flex flex-col justify-between"
              >
                <div className="space-y-6">
                  {isFirstPage ? (
                    <>
                      {/* 1. Official e-Stamp Certificate Header */}
                      <div className="border-2 border-emerald-800 bg-emerald-50/50 p-4 rounded-md font-sans text-xs space-y-3">
                        <div className="text-center border-b-2 border-emerald-800 pb-2">
                          <h2 className="text-sm sm:text-base font-extrabold text-emerald-950 uppercase tracking-wider font-heading">
                            Government of National Capital Territory of Delhi
                          </h2>
                          <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                            e-Stamp Certificate of Agreement
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[11px]">
                          <div className="flex justify-between border-b border-dashed border-emerald-200 pb-1">
                            <span className="text-emerald-900 font-semibold">Certificate No.:</span>
                            <span className="font-mono-tech font-bold text-emerald-950">{certNumber}</span>
                          </div>
                          <div className="flex justify-between border-b border-dashed border-emerald-200 pb-1">
                            <span className="text-emerald-900 font-semibold">Certificate Issued Date:</span>
                            <span className="font-bold text-emerald-950">{signedDate.split(',')[0]}</span>
                          </div>
                          <div className="flex justify-between border-b border-dashed border-emerald-200 pb-1">
                            <span className="text-emerald-900 font-semibold">First Party:</span>
                            <span className="font-bold text-emerald-950">Enterprise Corporation Ltd.</span>
                          </div>
                          <div className="flex justify-between border-b border-dashed border-emerald-200 pb-1">
                            <span className="text-emerald-900 font-semibold">Second Party:</span>
                            <span className="font-bold text-emerald-950">{signerName}</span>
                          </div>
                          <div className="flex justify-between border-b border-dashed border-emerald-200 pb-1">
                            <span className="text-emerald-900 font-semibold">Stamp Duty Paid By:</span>
                            <span className="font-bold text-emerald-950">{signerName}</span>
                          </div>
                          <div className="flex justify-between border-b border-dashed border-emerald-200 pb-1">
                            <span className="text-emerald-900 font-semibold">Stamp Duty Amount:</span>
                            <span className="font-bold text-emerald-950">₹ 100.00 (One Hundred Only)</span>
                          </div>
                          <div className="flex justify-between border-b border-dashed border-emerald-200 pb-1">
                            <span className="text-emerald-900 font-semibold">Description of Document:</span>
                            <span className="font-bold text-emerald-950">Article 5 Agreement &amp; Contract</span>
                          </div>
                          <div className="flex justify-between border-b border-dashed border-emerald-200 pb-1">
                            <span className="text-emerald-900 font-semibold">Security Code:</span>
                            <span className="font-mono-tech text-[10px] text-emerald-800">SEC-{agreement.agreement_id?.slice(0, 8)}</span>
                          </div>
                        </div>
                      </div>

                      {/* 2. Document Title & Date */}
                      <div className="text-center border-b-2 border-slate-900 pb-4">
                        <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-wide text-slate-950 font-heading">
                          {agreement.title}
                        </h1>
                        <p className="text-xs text-slate-600 font-sans mt-1">
                          Agreement Unique ID: <strong className="font-mono-tech">{agreement.agreement_id}</strong> • Effective Date: {signedDate.split(',')[0]}
                        </p>
                      </div>
                    </>
                  ) : (
                    /* Running header for subsequent pages */
                    <div className="flex items-center justify-between pb-3 border-b border-slate-300 text-[11px] font-sans text-slate-500 uppercase tracking-wide">
                      <span className="font-bold text-slate-800 truncate max-w-sm">{agreement.title}</span>
                      <span className="font-mono">Doc ID: {agreement.agreement_id?.slice(0, 8)}... • Page {pg.pageNumber} of {pagesList.length}</span>
                    </div>
                  )}

                  {/* 3. Document Body Content (Rendered HTML) */}
                  <div
                    className="agreement-rendered-content text-sm leading-relaxed text-slate-900 space-y-4 text-justify"
                    dangerouslySetInnerHTML={{ __html: pg.content }}
                  />

                  {isLastPage && (
                    <>
                      {/* 4. Execution Signatures Section */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-slate-300 font-sans">
                        <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-2">
                          <span className="text-[10px] uppercase font-mono-tech font-extrabold text-slate-500 block">
                            FIRST PARTY / AUTHORIZED SIGNATORY
                          </span>
                          <p className="text-sm font-extrabold text-slate-900">
                            Enterprise Corporation Ltd.
                          </p>
                          <p className="text-xs text-slate-500">
                            Corporate Legal Authority
                          </p>
                          <div className="pt-2">
                            <span className="inline-block px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
                              ✓ Digitally Signed &amp; Sealed
                            </span>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-2">
                          <span className="text-[10px] uppercase font-mono-tech font-extrabold text-slate-500 block">
                            SECOND PARTY / RECIPIENT SIGNATURE
                          </span>
                          <p className="text-sm font-extrabold text-slate-900">
                            {signerName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {signerRole} • {signerEmail}
                          </p>
                          <div className="pt-2">
                            <span className="inline-block px-2.5 py-1 rounded bg-blue-100 text-blue-800 text-[10px] font-extrabold border border-blue-300">
                              ✓ Signed via Aadhaar eSign
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 5. Digital eSign Audit Trail & Electronic Signature Certificate */}
                      <div className="p-4 rounded-xl border-2 border-emerald-600 bg-emerald-50/70 font-sans space-y-3">
                        <div className="flex items-center gap-2 text-emerald-950 font-heading font-extrabold text-xs">
                          <HiOutlineShieldCheck className="w-5 h-5 text-emerald-600" />
                          <span>Digital eSign Audit Trail &amp; Electronic Signature Certificate</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                            <span className="text-[10px] text-slate-500 uppercase font-mono-tech block">Verification Engine</span>
                            <span className="font-heading font-bold text-slate-900 mt-0.5 block">
                              {signing.verification_method || 'Aadhaar eSign (Simulated Sandbox)'}
                            </span>
                          </div>

                          <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                            <span className="text-[10px] text-slate-500 uppercase font-mono-tech block">Certificate Status</span>
                            <span className="font-heading font-bold text-emerald-700 mt-0.5 block">
                              {signing.certificate_validity || 'Valid (Sandbox Simulation)'}
                            </span>
                          </div>

                          <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                            <span className="text-[10px] text-slate-500 uppercase font-mono-tech block">Signer Origin IP</span>
                            <span className="font-mono-tech text-slate-900 mt-0.5 block">
                              {signing.signer_ip || '223.185.40.148'}
                            </span>
                          </div>

                          <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                            <span className="text-[10px] text-slate-500 uppercase font-mono-tech block">Signed Timestamp</span>
                            <span className="font-mono-tech text-slate-900 mt-0.5 block">
                              {signedDate}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Running Page Sheet Footer */}
                <div className="pt-6 mt-6 border-t border-slate-200 flex items-center justify-between font-sans text-[10px] text-slate-400">
                  <span>Official E-Agreement Document • Confidentially Protected</span>
                  <span className="font-mono font-bold text-slate-600">Page {pg.pageNumber} of {pagesList.length}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-sans-modern">
            Official E-Agreement Document • All signatures verified electronically
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-heading font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <HiOutlinePrinter className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-heading font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgreementDocumentViewerModal;
