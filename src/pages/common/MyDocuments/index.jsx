import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';
import {
  HiOutlineDocumentText,
  HiOutlineCloudArrowUp,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineArrowDownTray,
  HiOutlineShieldCheck,
  HiOutlineExclamationTriangle,
  HiOutlineInformationCircle,
  HiOutlineXMark,
  HiOutlineFolder,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineIdentification,
  HiOutlineArrowPath,
  HiOutlineSparkles,
} from 'react-icons/hi2';

const MyDocuments = () => {
  const queryClient = useQueryClient();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingDocId, setDownloadingDocId] = useState(null);

  // Dynamic Upload Form State
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [subFieldValues, setSubFieldValues] = useState({});
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);

  // 1. Fetch user's uploaded personal documents
  const { data, isLoading } = useQuery({
    queryKey: ['myDocuments'],
    queryFn: async () => {
      const res = await api.get('/documents/my');
      return res.data;
    },
  });

  // 2. Fetch company's dynamic document field configurations
  const { data: fieldsData = [], isLoading: fieldsLoading } = useQuery({
    queryKey: ['myDocumentFields'],
    queryFn: async () => {
      const res = await api.get('/documents/fields');
      return res.data?.data || [];
    },
  });

  const documents = data?.data || [];
  const stats = data?.stats || { total: 0, approved: 0, pending: 0, rejected: 0 };

  // Currently selected document field configuration
  const currentField =
    fieldsData.find((f) => f._id === selectedFieldId) || fieldsData[0] || null;

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await api.post('/documents/my', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Document uploaded successfully!');
      queryClient.invalidateQueries(['myDocuments']);
      handleCloseUploadModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to upload document');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/documents/my/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Document deleted successfully.');
      queryClient.invalidateQueries(['myDocuments']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete document');
    },
  });

  const handleOpenUploadModal = (fieldToSelect = null) => {
    const target = fieldToSelect || currentField || fieldsData[0] || null;
    if (target) {
      setSelectedFieldId(target._id);
      const initialValues = {};
      (target.subFields || []).forEach((sf) => {
        initialValues[sf.key] = '';
      });
      setSubFieldValues(initialValues);
    }
    setCustomTitle('');
    setNotes('');
    setSelectedFile(null);
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setFilePreviewUrl(null);
    setIsUploadModalOpen(true);
  };

  const handleSelectFieldChange = (newFieldId) => {
    setSelectedFieldId(newFieldId);
    const target = fieldsData.find((f) => f._id === newFieldId);
    if (target) {
      const newValues = {};
      (target.subFields || []).forEach((sf) => {
        newValues[sf.key] = '';
      });
      setSubFieldValues(newValues);
    }
  };

  const handleSubFieldInput = (sf, rawVal) => {
    let val = rawVal;
    if (sf.validationType === 'numeric') {
      val = val.replace(/\D/g, '');
      if (sf.maxLength) val = val.slice(0, sf.maxLength);
    } else if (sf.validationType === 'alphanumeric') {
      val = val.replace(/[^a-zA-Z0-9]/g, '');
      if (sf.maxLength) val = val.slice(0, sf.maxLength);
    } else if (sf.validationType === 'pan') {
      val = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    } else if (sf.validationType === 'aadhaar') {
      val = val.replace(/\D/g, '').slice(0, 12);
    }

    setSubFieldValues((prev) => ({
      ...prev,
      [sf.key]: val,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size exceeds 15MB limit.');
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      setFilePreviewUrl(URL.createObjectURL(file));
    } else {
      setFilePreviewUrl(null);
    }
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
    setCustomTitle('');
    setNotes('');
    setSubFieldValues({});
    setSelectedFile(null);
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setFilePreviewUrl(null);
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!currentField) {
      toast.error('Please select a document requirement');
      return;
    }

    // Validate required subfields & rules
    if (Array.isArray(currentField.subFields)) {
      for (const sf of currentField.subFields) {
        const val = (subFieldValues[sf.key] || '').trim();
        if (sf.required && !val) {
          toast.error(`Please enter "${sf.label}"`);
          return;
        }

        if (val) {
          if (sf.validationType === 'numeric' && !/^\d+$/.test(val)) {
            toast.error(sf.errorMessage || `"${sf.label}" must contain numbers only`);
            return;
          }
          if (sf.validationType === 'alphanumeric' && !/^[a-zA-Z0-9]+$/.test(val)) {
            toast.error(sf.errorMessage || `"${sf.label}" must be letters and digits only`);
            return;
          }
          if (sf.validationType === 'pan' && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val)) {
            toast.error('Invalid PAN Card format (e.g. ABCDE1234F)');
            return;
          }
          if (sf.validationType === 'aadhaar' && val.length !== 12) {
            toast.error('Aadhaar Number must be exactly 12 numeric digits');
            return;
          }
          if (sf.minLength && val.length < sf.minLength) {
            toast.error(`"${sf.label}" must be at least ${sf.minLength} characters`);
            return;
          }
        }
      }
    }

    // Validate file upload if enabled & required
    if (currentField.fileUpload?.enabled && currentField.fileUpload?.required && !selectedFile) {
      toast.error('Please choose a document/photo file to upload');
      return;
    }

    const formData = new FormData();
    if (selectedFile) {
      formData.append('file', selectedFile);
    }
    formData.append('documentConfigId', currentField._id);
    formData.append('documentType', currentField.name);
    if (customTitle.trim()) formData.append('customTitle', customTitle.trim());
    formData.append('subFieldValues', JSON.stringify(subFieldValues));
    if (notes.trim()) formData.append('notes', notes.trim());

    uploadMutation.mutate(formData);
  };

  const handleDelete = (doc) => {
    if (doc.status === 'Approved') {
      toast.error('Verified & Approved documents cannot be deleted.');
      return;
    }

    Swal.fire({
      title: 'Delete Document?',
      text: `Are you sure you want to delete "${doc.customTitle || doc.documentType}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it',
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(doc._id);
      }
    });
  };

  // Direct Device Download Handler
  const handleDownloadFile = async (doc) => {
    if (!doc || !doc._id || !doc.fileUrl) return;
    try {
      setDownloadingDocId(doc._id);
      toast.loading(`Downloading ${doc.customTitle || doc.documentType}...`, { id: 'file-download' });

      const res = await api.get(`/documents/download-file/${doc._id}`, {
        responseType: 'blob',
      });

      if (res.data.type === 'application/json') {
        const text = await res.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || 'Failed to download file');
      }

      let fileName = doc.originalFileName;
      if (!fileName) {
        const ext = doc.fileType?.includes('pdf')
          ? '.pdf'
          : doc.fileType?.startsWith('image/')
          ? '.jpg'
          : '.pdf';
        const cleanType = (doc.documentType || 'Document').replace(/[^a-zA-Z0-9_-]/g, '_');
        const cleanTitle = (doc.customTitle || '').replace(/[^a-zA-Z0-9_-]/g, '_');
        fileName = `${cleanType}${cleanTitle ? '_' + cleanTitle : ''}${ext}`;
      }

      const blob = new Blob([res.data], { type: doc.fileType || 'application/octet-stream' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success('Downloaded to your device!', { id: 'file-download' });
    } catch (err) {
      console.error('File download failed:', err);
      toast.error(err.message || 'Failed to download file to device.', { id: 'file-download' });
    } finally {
      setDownloadingDocId(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFullFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE_URL.replace('/api', '')}${url}`;
  };

  // Filtered documents
  const filteredDocuments = documents.filter((doc) => {
    if (filterStatus !== 'All' && doc.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchType = doc.documentType?.toLowerCase().includes(q);
      const matchTitle = doc.customTitle?.toLowerCase().includes(q);
      const matchNum = doc.documentNumber?.toLowerCase().includes(q);
      const matchSubfields = doc.subFieldValues && JSON.stringify(doc.subFieldValues).toLowerCase().includes(q);
      return matchType || matchTitle || matchNum || matchSubfields;
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold tracking-wide uppercase">
              <HiOutlineShieldCheck className="w-4 h-4 text-emerald-400" />
              Employee KYC & Document Vault
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              My Personal & KYC Documents
            </h1>
            <p className="text-indigo-200 text-xs sm:text-sm max-w-2xl">
              Submit your company-mandated verification records (Aadhaar, PAN, certificates, bank passbook). Fill the required document details and upload photos or PDF copies for HR verification.
            </p>
          </div>

          <button
            onClick={() => handleOpenUploadModal()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 active:scale-95 text-xs sm:text-sm font-bold shadow-lg transition-all self-start md:self-auto shrink-0 cursor-pointer"
          >
            <HiOutlineCloudArrowUp className="w-5 h-5 text-indigo-600" />
            Upload Document
          </button>
        </div>

        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <HiOutlineDocumentText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-xs text-slate-500 font-medium">Uploaded Documents</div>
          </div>
        </div>

        <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <HiOutlineCheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">{stats.approved}</div>
            <div className="text-xs text-emerald-700 font-medium">Verified & Approved</div>
          </div>
        </div>

        <div className="bg-white border border-amber-100 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <HiOutlineClock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <div className="text-xs text-amber-700 font-medium">Pending Review</div>
          </div>
        </div>

        <div className="bg-white border border-rose-100 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <HiOutlineXCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-600">{stats.rejected}</div>
            <div className="text-xs text-rose-700 font-medium">Needs Attention</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-full sm:w-auto overflow-x-auto">
          {['All', 'Approved', 'Pending', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterStatus === status
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
              {status === 'Pending' && stats.pending > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800">
                  {stats.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search document type, number or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Documents Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <HiOutlineDocumentText className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No Documents Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || filterStatus !== 'All'
              ? 'No documents matched your filters. Try clearing your search.'
              : 'You have not uploaded any personal or KYC documents yet. Click the button below to upload your required records.'}
          </p>
          <button
            onClick={() => handleOpenUploadModal()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-700 transition-all mt-2 cursor-pointer"
          >
            <HiOutlineCloudArrowUp className="w-4 h-4" />
            Upload Document Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocuments.map((doc) => {
            const isImage = doc.fileType?.startsWith('image/');
            const isPdf = doc.fileType?.includes('pdf');

            return (
              <div
                key={doc._id}
                className="bg-white border border-slate-200/90 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Top Card Header */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-indigo-600 shrink-0">
                        {isImage ? (
                          <span className="text-xs font-bold uppercase text-indigo-600">IMG</span>
                        ) : isPdf ? (
                          <span className="text-xs font-bold uppercase text-rose-600">PDF</span>
                        ) : (
                          <HiOutlineDocumentText className="w-5 h-5 text-indigo-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">
                          {doc.customTitle || doc.documentType}
                        </h4>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-medium text-indigo-600">{doc.documentType}</span>
                          {doc.documentNumber && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-slate-600">{doc.documentNumber}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 ${
                        doc.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : doc.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {doc.status === 'Approved' && <HiOutlineCheckCircle className="w-3.5 h-3.5" />}
                      {doc.status === 'Rejected' && <HiOutlineXCircle className="w-3.5 h-3.5" />}
                      {doc.status === 'Pending' && <HiOutlineClock className="w-3.5 h-3.5" />}
                      {doc.status}
                    </span>
                  </div>

                  {/* Dynamic Subfield values badge display */}
                  {doc.subFieldValues &&
                    typeof doc.subFieldValues === 'object' &&
                    Object.keys(doc.subFieldValues).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {Object.entries(doc.subFieldValues).map(([k, v]) => (
                          <span
                            key={k}
                            className="inline-block px-2 py-0.5 rounded-lg text-[10px] bg-slate-100 text-slate-700 font-mono border border-slate-200"
                          >
                            <span className="font-semibold text-slate-500">{k}:</span> {String(v)}
                          </span>
                        ))}
                      </div>
                    )}

                  {/* Rejection Alert Box */}
                  {doc.status === 'Rejected' && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-rose-800">
                        <HiOutlineExclamationTriangle className="w-4 h-4 shrink-0" />
                        Rejection Reason from HR/Admin:
                      </div>
                      <p className="text-rose-700 pl-5">
                        {doc.rejectionReason || 'Document could not be verified. Please re-upload a clear copy.'}
                      </p>
                      <button
                        onClick={() => handleOpenUploadModal(doc.documentConfig)}
                        className="mt-1 ml-5 px-3 py-1 rounded-lg bg-rose-600 text-white font-semibold text-[11px] hover:bg-rose-700 transition cursor-pointer"
                      >
                        Re-upload Document
                      </button>
                    </div>
                  )}

                  {/* Notes / Meta details */}
                  <div className="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span>File Details:</span>
                      <span className="font-medium text-slate-700">
                        {doc.fileUrl ? formatFileSize(doc.fileSize) : 'Details Only (No file)'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Uploaded on:</span>
                      <span className="font-medium text-slate-700">
                        {new Date(doc.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    {doc.reviewedAt && (
                      <div className="flex items-center justify-between">
                        <span>Reviewed by:</span>
                        <span className="font-medium text-slate-700">
                          {doc.reviewedBy?.name || 'Admin'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                    >
                      <HiOutlineEye className="w-4 h-4" />
                      Preview
                    </button>
                    {doc.fileUrl && (
                      <button
                        onClick={() => handleDownloadFile(doc)}
                        disabled={downloadingDocId === doc._id}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors ml-3 disabled:opacity-50 cursor-pointer"
                        title="Download file to device"
                      >
                        <HiOutlineArrowDownTray className="w-4 h-4" />
                        {downloadingDocId === doc._id ? 'Downloading...' : 'Download'}
                      </button>
                    )}
                  </div>

                  {doc.status !== 'Approved' && (
                    <button
                      onClick={() => handleDelete(doc)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Document"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full my-auto overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <HiOutlineCloudArrowUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Upload KYC Document</h3>
                  <p className="text-xs text-slate-500">
                    {currentField?.name || 'Company Required Document'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseUploadModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Document Category / Dynamic Field Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Type <span className="text-rose-500">*</span>
                </label>
                {fieldsData.length > 0 ? (
                  <select
                    value={selectedFieldId || currentField?._id || ''}
                    onChange={(e) => handleSelectFieldChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-800"
                    required
                  >
                    {fieldsData.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.name} {f.isRequired ? '(Mandatory)' : '(Optional)'} • {f.category}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-slate-400 italic">No document fields configured yet.</p>
                )}
                {currentField?.description && (
                  <p className="text-[11px] text-slate-500 mt-1">{currentField.description}</p>
                )}
              </div>

              {/* Dynamic Sub-fields Configured by Admin */}
              {currentField?.subFields && currentField.subFields.length > 0 && (
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Document Number & Details</span>
                    <span className="text-indigo-600 font-normal">Real-time validated</span>
                  </div>

                  {currentField.subFields.map((sf) => {
                    const currentVal = subFieldValues[sf.key] || '';
                    return (
                      <div key={sf.key}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700">
                            {sf.label} {sf.required && <span className="text-rose-500">*</span>}
                          </label>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {sf.validationType === 'numeric'
                              ? 'Digits only'
                              : sf.validationType === 'pan'
                              ? 'PAN (ABCDE1234F)'
                              : sf.validationType === 'aadhaar'
                              ? '12 Digits'
                              : sf.validationType}
                            {sf.maxLength && ` • Max ${sf.maxLength}`}
                          </span>
                        </div>

                        {sf.type === 'date' ? (
                          <input
                            type="date"
                            required={sf.required}
                            value={currentVal}
                            onChange={(e) => handleSubFieldInput(sf, e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        ) : (
                          <input
                            type="text"
                            required={sf.required}
                            placeholder={sf.placeholder || `Enter ${sf.label}`}
                            value={currentVal}
                            onChange={(e) => handleSubFieldInput(sf, e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono font-medium"
                          />
                        )}
                        {sf.minLength && sf.maxLength && sf.minLength === sf.maxLength && (
                          <div className="text-[10px] text-slate-400 mt-0.5 text-right font-mono">
                            {currentVal.length} / {sf.maxLength} characters
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Optional Custom Title / Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Custom Title / Note <span className="text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scanned copy / Front & Back"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              {/* File Dropzone (If File Upload is Enabled for this field) */}
              {currentField?.fileUpload?.enabled !== false ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      {currentField?.fileUpload?.label || 'Attach Document File'}{' '}
                      {currentField?.fileUpload?.required !== false && (
                        <span className="text-rose-500">*</span>
                      )}
                    </label>
                    <span className="text-[10px] text-slate-400">PDF, JPG, PNG up to 15MB</span>
                  </div>

                  <div className="relative border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl p-5 text-center bg-indigo-50/30 hover:bg-indigo-50/60 transition-all cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required={currentField?.fileUpload?.required !== false}
                    />
                    {selectedFile ? (
                      <div className="space-y-2">
                        {filePreviewUrl ? (
                          <img
                            src={filePreviewUrl}
                            alt="Preview"
                            className="h-28 mx-auto rounded-lg object-contain shadow-sm border border-slate-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center mx-auto text-xs uppercase">
                            {selectedFile.name.split('.').pop()}
                          </div>
                        )}
                        <div className="text-xs font-semibold text-slate-800 truncate max-w-xs mx-auto">
                          {selectedFile.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {formatFileSize(selectedFile.size)} • Click to replace file
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <HiOutlineCloudArrowUp className="w-8 h-8 text-indigo-500 mx-auto" />
                        <div className="text-xs font-semibold text-slate-800">
                          Click or drag document file here
                        </div>
                        <div className="text-[11px] text-slate-400">PDF, JPG, PNG up to 15MB</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                  <HiOutlineInformationCircle className="w-5 h-5 text-indigo-600 shrink-0" />
                  <span>
                    No document photo upload is required for this category. Only the above details will be submitted for verification.
                  </span>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Notes for HR <span className="text-slate-400">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Any additional details or remarks for HR..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseUploadModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <HiOutlineCloudArrowUp className="w-4 h-4" />
                      Submit Document
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document In-App Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[88vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <HiOutlineDocumentText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-tight">
                    {previewDoc.customTitle || previewDoc.documentType}
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{previewDoc.documentType}</span>
                    <span>•</span>
                    <span
                      className={`font-semibold ${
                        previewDoc.status === 'Approved'
                          ? 'text-emerald-600'
                          : previewDoc.status === 'Rejected'
                          ? 'text-rose-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {previewDoc.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {previewDoc.fileUrl && (
                  <button
                    onClick={() => handleDownloadFile(previewDoc)}
                    disabled={downloadingDocId === previewDoc._id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                    title="Download file to device"
                  >
                    <HiOutlineArrowDownTray className="w-4 h-4" />
                    {downloadingDocId === previewDoc._id ? 'Downloading...' : 'Download File'}
                  </button>
                )}
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dynamic Metadata / Subfields Banner */}
            {previewDoc.subFieldValues &&
              typeof previewDoc.subFieldValues === 'object' &&
              Object.keys(previewDoc.subFieldValues).length > 0 && (
                <div className="px-6 py-2.5 bg-indigo-50/70 border-b border-indigo-100 flex flex-wrap items-center gap-3 text-xs shrink-0">
                  <span className="font-bold text-indigo-900 flex items-center gap-1">
                    <HiOutlineIdentification className="w-4 h-4 text-indigo-600" />
                    Submitted Details:
                  </span>
                  {Object.entries(previewDoc.subFieldValues).map(([key, val]) => (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white border border-indigo-200 text-slate-800 font-mono shadow-2xs"
                    >
                      <span className="text-slate-500 font-normal">{key}:</span>
                      <span className="font-bold">{String(val)}</span>
                    </span>
                  ))}
                </div>
              )}

            {/* Modal Body Previewer */}
            <div className="flex-1 bg-slate-100 p-4 overflow-auto flex items-center justify-center">
              {previewDoc.fileUrl ? (
                previewDoc.fileType?.startsWith('image/') ? (
                  <img
                    src={getFullFileUrl(previewDoc.fileUrl)}
                    alt={previewDoc.documentType}
                    className="max-h-full max-w-full object-contain rounded-lg shadow-md bg-white"
                  />
                ) : previewDoc.fileType?.includes('pdf') ? (
                  <iframe
                    src={getFullFileUrl(previewDoc.fileUrl)}
                    title="PDF Preview"
                    className="w-full h-full rounded-lg shadow-md border-0 bg-white"
                  />
                ) : (
                  <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200 max-w-md">
                    <HiOutlineDocumentText className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
                    <h4 className="font-bold text-slate-800 text-sm">Preview not supported in browser</h4>
                    <p className="text-xs text-slate-500 mt-1 mb-4">
                      This file format cannot be directly previewed. Please download the file to inspect it.
                    </p>
                    <button
                      onClick={() => handleDownloadFile(previewDoc)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-all cursor-pointer"
                    >
                      <HiOutlineArrowDownTray className="w-4 h-4" />
                      Download File to Device
                    </button>
                  </div>
                )
              ) : (
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200 max-w-md">
                  <HiOutlineDocumentCheck className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-800 text-sm">Details Submitted Successfully</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    This document was configured as a details-only submission (no file upload required).
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDocuments;
