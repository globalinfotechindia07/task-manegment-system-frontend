import { useState, useEffect, useRef } from 'react';
import {
  HiOutlineXMark,
  HiOutlineEye,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineTableCells,
  HiOutlineDocumentText,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import TemplatePreviewModal from './TemplatePreviewModal';

// Helper to extract unique {{variables}}
const extractVariables = (content) => {
  if (!content) return [];
  const matches = [...content.matchAll(/\{\{([a-zA-Z0-9_\s-]+)\}\}/g)];
  const set = new Set();
  matches.forEach((m) => {
    if (m[1]) {
      const clean = m[1].trim().replace(/\s+/g, '_');
      if (clean) set.add(clean);
    }
  });
  return Array.from(set);
};

const TemplateDesignModal = ({ isOpen, onClose, template, onSave, isSaving }) => {
  const [templateId, setTemplateId] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('0.00');
  const [webUserPrice, setWebUserPrice] = useState('0.00');
  const [isActiveForWebUsers, setIsActiveForWebUsers] = useState(false);
  const [docRequirements, setDocRequirements] = useState([
    { name: 'Aadhaar Card', isMandatory: true },
    { name: 'PAN Card', isMandatory: true },
  ]);

  const [pages, setPages] = useState([{ pageNumber: 1, content: '' }]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [status, setStatus] = useState('Active');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const editorRef = useRef(null);

  // Initialize form when template prop changes
  useEffect(() => {
    if (template) {
      setTemplateId(template.template_id || '');
      setName(template.name || '');
      setPrice(template.price?.toString() || '0.00');
      setWebUserPrice(template.webUserPrice?.toString() || '0.00');
      setIsActiveForWebUsers(Boolean(template.isActiveForWebUsers));

      const reqs = Array.isArray(template.document_requirements) && template.document_requirements.length > 0
        ? template.document_requirements.map((r) =>
            typeof r === 'string' ? { name: r, isMandatory: true } : r
          )
        : [{ name: 'Aadhaar Card', isMandatory: true }];
      setDocRequirements(reqs);

      const parsedPages = Array.isArray(template.pages) && template.pages.length > 0
        ? template.pages
        : [{ pageNumber: 1, content: template.body || '<p>This Agreement is entered between <strong>{{disclosing_party}}</strong> and <strong>{{receiving_party}}</strong> effective on <strong>{{effective_date}}</strong>.</p>' }];
      setPages(parsedPages);
      setCurrentPageIndex(0);
      setStatus(template.status || 'Active');
    } else {
      // New default template
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setTemplateId(`AGR_DOC_${randomSuffix}`);
      setName('Standard Non-Disclosure Agreement');
      setPrice('0.00');
      setWebUserPrice('0.00');
      setIsActiveForWebUsers(false);
      setDocRequirements([
        { name: 'PAN Card', isMandatory: true },
        { name: 'Aadhaar Card', isMandatory: true },
      ]);
      setPages([
        {
          pageNumber: 1,
          content: '<p>This Non-Disclosure Agreement is entered between <strong>{{disclosing_party}}</strong> and <strong>{{receiving_party}}</strong> effective on <strong>{{effective_date}}</strong>.</p><p>1. Purpose: The parties wish to explore business collaboration and maintain strict confidentiality of all disclosed proprietary information.</p><p>2. Obligations: The receiving party agrees to hold the confidential materials in high confidence and shall not disclose it to any third parties without prior written consent.</p>',
        },
      ]);
      setCurrentPageIndex(0);
      setStatus('Active');
    }
  }, [template, isOpen]);

  // Synchronize editor innerHTML when switching pages
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = pages[currentPageIndex]?.content || '';
    }
  }, [currentPageIndex, isOpen]);

  if (!isOpen) return null;

  // Handle live editing
  const handleEditorInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setPages((prev) => {
      const updated = [...prev];
      if (updated[currentPageIndex]) {
        updated[currentPageIndex] = { ...updated[currentPageIndex], content: html };
      }
      return updated;
    });
  };

  // Format document commands
  const executeCmd = (command, value = null) => {
    document.execCommand(command, false, value);
    handleEditorInput();
    editorRef.current?.focus();
  };

  // Table helpers
  const handleInsertTable = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 12px 0;" border="1">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: left;">Field / Parameter</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: left;">Agreed Terms</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">Party Name</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">{{party_name}}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">Effective Date</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">{{effective_date}}</td>
          </tr>
        </tbody>
      </table>
    `;
    executeCmd('insertHTML', tableHtml);
  };

  const handleAddRow = () => {
    const rowHtml = `
      <tr>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">Parameter</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">Value</td>
      </tr>
    `;
    executeCmd('insertHTML', rowHtml);
  };

  // Add new page
  const handleAddPage = () => {
    setPages((prev) => [
      ...prev,
      {
        pageNumber: prev.length + 1,
        content: '<p>Page ' + (prev.length + 1) + ' Content...</p>',
      },
    ]);
    setCurrentPageIndex(pages.length);
  };

  // Remove page
  const handleDeletePage = (index) => {
    if (pages.length <= 1) {
      toast.error('Agreement must contain at least one page');
      return;
    }
    const updated = pages.filter((_, i) => i !== index).map((p, i) => ({ ...p, pageNumber: i + 1 }));
    setPages(updated);
    if (currentPageIndex >= updated.length) {
      setCurrentPageIndex(updated.length - 1);
    }
  };

  // Requirements helpers
  const handleAddRequirement = () => {
    setDocRequirements([...docRequirements, { name: '', isMandatory: true }]);
  };

  const handleRequirementChange = (index, field, value) => {
    const updated = [...docRequirements];
    updated[index][field] = value;
    setDocRequirements(updated);
  };

  const handleRemoveRequirement = (index) => {
    setDocRequirements(docRequirements.filter((_, i) => i !== index));
  };

  // Calculate all detected variables across all pages
  const combinedContent = pages.map((p) => p.content || '').join(' ');
  const detectedVariables = extractVariables(combinedContent);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!templateId.trim()) {
      toast.error('Template Unique ID is required');
      return;
    }
    if (!name.trim()) {
      toast.error('Template Name is required');
      return;
    }

    const payload = {
      template_id: templateId.trim(),
      name: name.trim(),
      price: parseFloat(price) || 0,
      webUserPrice: parseFloat(webUserPrice) || 0,
      isActiveForWebUsers,
      document_requirements: docRequirements.filter((r) => r.name && r.name.trim()),
      pages,
      body: combinedContent,
      variables: detectedVariables,
      status,
    };

    onSave(payload);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden my-auto">
          {/* Top Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
            <div>
              <h2 className="text-base sm:text-lg font-heading font-extrabold text-slate-900">
                {template ? 'Edit Multi-Page Template Design' : 'Create Multi-Page Template Design'}
              </h2>
              <p className="text-xs text-slate-500 font-sans-modern mt-0.5">
                Add multiple pages and design layout for each page individually
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-heading font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
              >
                <HiOutlineEye className="w-4 h-4 text-indigo-600" />
                <span>Preview</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form Scrollable Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Row 1: ID, Name, Price */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
              <div className="sm:col-span-4">
                <label className="block text-xs font-heading font-bold text-slate-800 mb-1">
                  Template Unique ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value.toUpperCase())}
                  placeholder="AGR_NDA_2026"
                  className="w-full px-3 py-2 text-xs font-mono-tech uppercase rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="block text-xs font-heading font-bold text-slate-800 mb-1">
                  Template Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Standard Non-Disclosure Agreement"
                  className="w-full px-3 py-2 text-xs font-sans-modern rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-heading font-bold text-slate-800 mb-1">
                  Price (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs font-mono-tech font-bold rounded-xl border-2 border-emerald-500/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            {/* Row 2: Web User Price & Checkbox */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center">
              <div className="sm:col-span-4">
                <label className="block text-xs font-heading font-bold text-slate-700 mb-1">
                  Web User Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={webUserPrice}
                  onChange={(e) => setWebUserPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs font-mono-tech rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div className="sm:col-span-8 flex items-center gap-2 pt-4 sm:pt-5">
                <input
                  type="checkbox"
                  id="activeForWebUsers"
                  checked={isActiveForWebUsers}
                  onChange={(e) => setIsActiveForWebUsers(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="activeForWebUsers" className="text-xs font-heading font-bold text-slate-800 cursor-pointer">
                  Active for Web Users?
                </label>
              </div>
            </div>

            {/* Document Upload Requirements Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-heading font-bold text-slate-900">
                    Document Upload Requirements
                  </h4>
                  <p className="text-[11px] text-slate-500 font-sans-modern">
                    Specify supporting documents that users must upload when requesting this agreement.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddRequirement}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-heading font-bold transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
                >
                  <HiOutlinePlus className="w-3.5 h-3.5" />
                  <span>Add Document requirement</span>
                </button>
              </div>

              <div className="space-y-2 pt-1">
                {docRequirements.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2 sm:gap-3 bg-white p-2 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      value={req.name}
                      onChange={(e) => handleRequirementChange(idx, 'name', e.target.value)}
                      placeholder="e.g. Aadhaar Card, Address Proof"
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={req.isMandatory}
                        onChange={(e) => handleRequirementChange(idx, 'isMandatory', e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span>Mandatory</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement(idx)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove requirement"
                    >
                      <HiOutlineXMark className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Pages Pills Bar */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono-tech font-bold uppercase tracking-wider text-slate-600">
                  PAGES:
                </span>
                <button
                  type="button"
                  onClick={handleAddPage}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-heading font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <HiOutlinePlus className="w-3.5 h-3.5" />
                  <span>Add New Page</span>
                </button>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {pages.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setCurrentPageIndex(idx)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-heading font-bold cursor-pointer transition-all ${
                        currentPageIndex === idx
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <HiOutlineDocumentText className="w-3.5 h-3.5" />
                      <span>Page {p.pageNumber || idx + 1}</span>
                    </button>
                    {pages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeletePage(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete Page"
                      >
                        <HiOutlineTrash className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* WYSIWYG Editor Section */}
            <div className="rounded-2xl border border-slate-300 overflow-hidden bg-white shadow-xs">
              {/* Header Info & Table Tools */}
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs text-slate-600 font-sans-modern">
                  Editing <strong className="text-slate-900 font-heading">Page {currentPageIndex + 1} of {pages.length}</strong>. Type <code className="text-indigo-600 font-mono-tech bg-indigo-50 px-1 py-0.5 rounded font-bold">{`{{Borrower_Name}}`}</code> to add dynamic fields.
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleInsertTable}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-heading font-bold rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors"
                  >
                    <HiOutlineTableCells className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Insert 2x2 Table</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="px-2.5 py-1 text-[11px] font-heading font-bold rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors"
                  >
                    Add Row
                  </button>
                </div>
              </div>

              {/* Formatting Toolbar */}
              <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center gap-1 text-xs">
                {/* Font family */}
                <select
                  onChange={(e) => executeCmd('fontName', e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-300 rounded text-[11px] focus:outline-none"
                >
                  <option value="sans-serif">Sans Serif</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monospace</option>
                </select>

                {/* Heading / Format */}
                <select
                  onChange={(e) => executeCmd('formatBlock', e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-300 rounded text-[11px] focus:outline-none"
                >
                  <option value="p">Normal</option>
                  <option value="h1">Heading 1</option>
                  <option value="h2">Heading 2</option>
                  <option value="h3">Heading 3</option>
                </select>

                <div className="h-4 w-px bg-slate-300 mx-1" />

                <button
                  type="button"
                  onClick={() => executeCmd('bold')}
                  className="w-7 h-7 flex items-center justify-center font-bold hover:bg-white rounded transition-colors text-slate-700"
                  title="Bold"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => executeCmd('italic')}
                  className="w-7 h-7 flex items-center justify-center italic font-serif hover:bg-white rounded transition-colors text-slate-700"
                  title="Italic"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => executeCmd('underline')}
                  className="w-7 h-7 flex items-center justify-center underline hover:bg-white rounded transition-colors text-slate-700"
                  title="Underline"
                >
                  U
                </button>
                <button
                  type="button"
                  onClick={() => executeCmd('strikeThrough')}
                  className="w-7 h-7 flex items-center justify-center line-through hover:bg-white rounded transition-colors text-slate-700"
                  title="Strikethrough"
                >
                  S
                </button>

                <div className="h-4 w-px bg-slate-300 mx-1" />

                <button
                  type="button"
                  onClick={() => executeCmd('subscript')}
                  className="px-1.5 py-0.5 hover:bg-white rounded text-[11px] font-mono text-slate-700"
                  title="Subscript"
                >
                  X₂
                </button>
                <button
                  type="button"
                  onClick={() => executeCmd('superscript')}
                  className="px-1.5 py-0.5 hover:bg-white rounded text-[11px] font-mono text-slate-700"
                  title="Superscript"
                >
                  X²
                </button>

                <div className="h-4 w-px bg-slate-300 mx-1" />

                <button
                  type="button"
                  onClick={() => executeCmd('insertUnorderedList')}
                  className="px-2 py-0.5 hover:bg-white rounded text-[11px] text-slate-700"
                  title="Bullet List"
                >
                  • List
                </button>
                <button
                  type="button"
                  onClick={() => executeCmd('insertOrderedList')}
                  className="px-2 py-0.5 hover:bg-white rounded text-[11px] text-slate-700"
                  title="Numbered List"
                >
                  1. List
                </button>

                <div className="h-4 w-px bg-slate-300 mx-1" />

                <button
                  type="button"
                  onClick={() => executeCmd('justifyLeft')}
                  className="px-1.5 py-0.5 hover:bg-white rounded text-[11px] text-slate-700"
                  title="Align Left"
                >
                  Left
                </button>
                <button
                  type="button"
                  onClick={() => executeCmd('justifyCenter')}
                  className="px-1.5 py-0.5 hover:bg-white rounded text-[11px] text-slate-700"
                  title="Align Center"
                >
                  Center
                </button>
                <button
                  type="button"
                  onClick={() => executeCmd('justifyRight')}
                  className="px-1.5 py-0.5 hover:bg-white rounded text-[11px] text-slate-700"
                  title="Align Right"
                >
                  Right
                </button>
              </div>

              {/* Editable Page Canvas */}
              <div
                ref={editorRef}
                contentEditable
                onInput={handleEditorInput}
                className="min-h-[220px] p-4 text-xs sm:text-sm font-sans-modern leading-relaxed focus:outline-none bg-white overflow-y-auto max-h-[360px]"
              />
            </div>

            {/* Dynamic Parameters Detected Pill Bar */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2">
              <span className="text-xs font-heading font-bold text-slate-800 flex items-center gap-1.5">
                <HiOutlineSparkles className="w-4 h-4 text-emerald-600" />
                <span>Dynamic Parameters Detected ({detectedVariables.length}):</span>
              </span>

              {detectedVariables.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  No variables detected yet. Type placeholders like <code className="text-indigo-600 font-mono font-semibold">{`{{borrower_name}}`}</code> in the editor above.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {detectedVariables.map((v, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full text-xs font-mono-tech font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Template Status Radio */}
            <div className="space-y-1.5">
              <label className="block text-xs font-heading font-bold text-slate-800">
                Template Status
              </label>
              <div className="flex items-center gap-4 text-xs text-slate-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="templateStatus"
                    value="Active"
                    checked={status === 'Active'}
                    onChange={() => setStatus('Active')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-900">Active (Visible to Bank Admins)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="templateStatus"
                    value="Inactive"
                    checked={status === 'Inactive'}
                    onChange={() => setStatus('Inactive')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Inactive</span>
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-heading font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-heading font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : `Save Template Design (${pages.length} Page${pages.length > 1 ? 's' : ''})`}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Preview Modal */}
      <TemplatePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        template={{ template_id: templateId, name, variables: detectedVariables }}
        pages={pages}
      />
    </>
  );
};

export default TemplateDesignModal;
