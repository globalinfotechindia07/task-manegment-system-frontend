import { useState, useEffect } from 'react';
import {
  HiOutlineXMark,
  HiOutlineDocumentText,
  HiOutlineArrowUpTray,
  HiOutlineShieldCheck,
  HiOutlineUser,
  HiOutlineUserPlus,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const GenerateAgreementModal = ({ isOpen, onClose, template, onGenerate, isGenerating }) => {
  const [variableData, setVariableData] = useState({});
  const [selectedUserId, setSelectedUserId] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [signerPhone, setSignerPhone] = useState('');
  const [signerRole, setSignerRole] = useState('Borrower');
  const [addEStamp, setAddEStamp] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({});

  // Company users list for dropdown
  const [usersList, setUsersList] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (template && isOpen) {
      // Initialize dynamic variables
      const initialVars = {};
      (template.variables || []).forEach((v) => {
        initialVars[v] = '';
      });
      setVariableData(initialVars);

      setSelectedUserId('');
      setSignerName('');
      setSignerEmail('');
      setSignerPhone('');
      setSignerRole('Borrower');
      setAddEStamp(false);
      setUploadedFiles({});
    }
  }, [template, isOpen]);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await api.get('/agreements/signers/users');
      if (res.data?.data) {
        setUsersList(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch company signer users:', err.message);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  if (!isOpen || !template) return null;

  const handleSelectUser = (e) => {
    const uId = e.target.value;
    setSelectedUserId(uId);

    if (!uId) {
      return;
    }

    const foundUser = usersList.find((u) => u._id === uId);
    if (foundUser) {
      setSignerName(foundUser.name || '');
      setSignerEmail(foundUser.email || '');
      setSignerPhone(foundUser.phone || '');
      setSignerRole(foundUser.role || 'Borrower');

      // Auto fill common template variable names
      setVariableData((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          const lk = k.toLowerCase();
          if (
            lk.includes('borrower') ||
            lk.includes('client') ||
            lk.includes('receiving') ||
            lk.includes('employee') ||
            lk === 'name' ||
            lk === 'party_name'
          ) {
            if (!next[k]) next[k] = foundUser.name;
          } else if (lk.includes('email')) {
            if (!next[k]) next[k] = foundUser.email;
          } else if (lk.includes('phone') || lk.includes('mobile')) {
            if (!next[k]) next[k] = foundUser.phone || '';
          }
        });
        return next;
      });

      toast.success(`Selected ${foundUser.name} - Signer & matching variables populated!`);
    }
  };

  const handleVariableChange = (key, val) => {
    setVariableData((prev) => ({ ...prev, [key]: val }));
  };

  const handleFileChange = (docName, file) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [docName]: file ? file.name : null,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check required fields
    for (const v of template.variables || []) {
      if (!variableData[v] || !variableData[v].trim()) {
        toast.error(`Please fill required template field: ${v}`);
        return;
      }
    }

    if (!signerName.trim()) {
      toast.error('Signer Full Name is required');
      return;
    }

    const payload = {
      template_id: template.template_id,
      title: `${template.name} - ${signerName.trim()}`,
      userId: selectedUserId || null,
      variable_data: variableData,
      parties: [
        {
          name: signerName.trim(),
          email: signerEmail.trim() || 'signer@example.com',
          phone: signerPhone.trim() || '+91-9876543210',
          role: signerRole.trim() || 'Signer',
        },
      ],
      addEStamp,
    };

    onGenerate(payload);
  };

  const docRequirements = template.document_requirements || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[94vh] flex flex-col overflow-hidden my-auto">
        {/* Header matching Screenshot 2 */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-white shrink-0">
          <div>
            <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
              Generate Agreement
            </h2>
            <p className="text-xs text-slate-500 font-sans-modern mt-0.5">
              Template: <strong className="text-slate-800">{template.name}</strong> ({template.template_id})
            </p>
            <div className="mt-2">
              <span className="inline-block px-3 py-1 rounded-md text-xs font-heading font-extrabold text-amber-900 bg-amber-100/80 border border-amber-200/80">
                Agreement Cost: ₹{(template.price || 0).toFixed(2)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Target User / Employee Selection */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-heading font-bold text-indigo-950 flex items-center gap-1.5">
                <HiOutlineUser className="w-4 h-4 text-indigo-600" />
                <span>Assign to Particular User / Employee</span>
              </label>
              {selectedUserId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserId('');
                    setSignerName('');
                    setSignerEmail('');
                    setSignerPhone('');
                  }}
                  className="text-[11px] text-rose-600 hover:underline font-heading font-bold cursor-pointer"
                >
                  Clear / Manual
                </button>
              )}
            </div>

            <select
              value={selectedUserId}
              onChange={handleSelectUser}
              className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-sans-modern cursor-pointer"
            >
              <option value="">-- Select Company User / Employee (or fill manually) --</option>
              {usersList.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email}) - {u.role || 'Staff'} {u.employeeId ? `[${u.employeeId}]` : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-indigo-700/80 font-sans-modern">
              Selecting a user will link this agreement directly to their account and auto-fill details.
            </p>
          </div>

          {/* Signer Primary Details */}
          <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
            <span className="text-[11px] font-mono-tech font-bold uppercase tracking-wider text-slate-600 block">
              PRIMARY SIGNER / PARTY DETAILS
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-heading font-bold text-slate-800 mb-1">
                  Signer Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-bold text-slate-800 mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  placeholder="rahul.sharma@example.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-bold text-slate-800 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={signerPhone}
                  onChange={(e) => setSignerPhone(e.target.value)}
                  placeholder="+91-9876543210"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-bold text-slate-800 mb-1">
                  Role in Agreement
                </label>
                <input
                  type="text"
                  value={signerRole}
                  onChange={(e) => setSignerRole(e.target.value)}
                  placeholder="Borrower / Receiving Party"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* REQUIRED TEMPLATE FIELDS matching Screenshot 2 */}
          <div className="space-y-4">
            <span className="text-xs font-mono-tech font-bold uppercase tracking-wider text-slate-500 block">
              REQUIRED TEMPLATE FIELDS
            </span>

            {(template.variables || []).length === 0 ? (
              <p className="text-xs text-slate-400 italic">No variables required for this template.</p>
            ) : (
              (template.variables || []).map((v) => (
                <div key={v} className="space-y-1">
                  <label className="block text-xs font-heading font-bold text-slate-800">
                    {v} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={variableData[v] || ''}
                    onChange={(e) => handleVariableChange(v, e.target.value)}
                    placeholder={`Enter ${v}`}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-800 shadow-2xs font-sans-modern"
                  />
                </div>
              ))
            )}
          </div>

          {/* REQUIRED SUPPORTING DOCUMENTS matching Screenshot 2 */}
          {docRequirements.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-mono-tech font-bold uppercase tracking-wider text-slate-500 block">
                REQUIRED SUPPORTING DOCUMENTS
              </span>

              {docRequirements.map((doc, idx) => {
                const docName = typeof doc === 'string' ? doc : doc.name;
                const fileName = uploadedFiles[docName];

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl border border-slate-300 bg-white flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <label className="px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-heading font-bold text-xs border border-emerald-200 cursor-pointer transition-colors shrink-0">
                        <span>Choose File</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFileChange(docName, e.target.files?.[0])}
                        />
                      </label>
                      <span className="text-xs text-slate-500 truncate font-sans-modern">
                        {fileName || 'No file chosen'}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono-tech font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                      {docName}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* E-Stamp Checkbox matching Screenshot 2 */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={addEStamp}
                onChange={(e) => setAddEStamp(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
              />
              <span className="text-xs font-heading font-bold text-slate-800">
                Do you want to add an E-Stamp to this agreement?
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-heading font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-heading font-bold transition-all shadow-md shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate Agreement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateAgreementModal;
