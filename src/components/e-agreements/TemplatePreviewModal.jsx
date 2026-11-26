import React from 'react';
import { HiOutlineXMark, HiOutlineDocumentText } from 'react-icons/hi2';

const TemplatePreviewModal = ({ isOpen, onClose, template, pages }) => {
  if (!isOpen || !template) return null;

  const sampleVariables = {};
  (template.variables || []).forEach((v) => {
    sampleVariables[v] = `[${v.toUpperCase()}]`;
  });

  const fillContent = (raw) => {
    if (!raw) return '<p class="text-slate-400 italic">Page is empty</p>';
    let filled = raw;
    Object.entries(sampleVariables).forEach(([k, val]) => {
      const reg = new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'gi');
      filled = filled.replace(reg, `<span class="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-mono font-bold border border-amber-300">${val}</span>`);
    });
    return filled;
  };

  const pagesToRender = Array.isArray(pages) && pages.length > 0 ? pages : [{ pageNumber: 1, content: template.body || '' }];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <HiOutlineDocumentText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Template Preview: {template.name || 'Untitled Template'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                ID: {template.template_id || 'AGR_XXX'} • {pagesToRender.length} Page(s)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 text-xs text-amber-900 flex items-center justify-between">
          <span>Variables detected are highlighted in amber tags below for demonstration.</span>
          <span className="font-bold text-[11px] bg-amber-200/80 px-2 py-0.5 rounded">
            {template.variables?.length || 0} Dynamic Field(s)
          </span>
        </div>

        {/* Document Pages Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 space-y-6">
          {pagesToRender.map((p, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl shadow-md border border-slate-200/80 p-6 sm:p-10 max-w-2xl mx-auto min-h-[500px] flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pb-3 mb-4 border-b border-slate-100">
                  <span>OFFICIAL AGREEMENT DOCUMENT</span>
                  <span>PAGE {p.pageNumber || idx + 1} OF {pagesToRender.length}</span>
                </div>
                <div
                  className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: fillContent(p.content) }}
                />
              </div>

              <div className="pt-8 mt-8 border-t border-dashed border-slate-200 flex justify-between items-end text-[10px] text-slate-500">
                <div>
                  <p className="font-semibold text-slate-700">Digital Authentication Block</p>
                  <p className="font-mono">Security: Aadhaar eSign / E-Stamp</p>
                </div>
                <div className="w-32 border-b border-slate-400 text-center pb-1 font-mono text-[9px]">
                  Authorized Signatory
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreviewModal;
