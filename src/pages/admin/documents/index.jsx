import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';
import { useAuth } from '../../../context/AuthContext';
import {
  HiOutlineDocumentCheck,
  HiOutlineFolderArrowDown,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineEye,
  HiOutlineArrowDownTray,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineUserGroup,
  HiOutlineUser,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineXMark,
  HiOutlineDocumentText,
  HiOutlineTrash,
  HiOutlineShieldCheck,
  HiOutlineExclamationTriangle,
  HiOutlineArrowPath,
  HiOutlineSquares2X2,
  HiOutlineTableCells,
  HiOutlineCog6Tooth,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineSparkles,
  HiOutlineCheck,
  HiOutlineIdentification,
} from 'react-icons/hi2';

const AdminDocumentsManagement = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlUserId = searchParams.get('userId') || '';

  const queryClient = useQueryClient();

  const [mainTab, setMainTab] = useState('hub'); // 'hub' | 'config'
  const [activeView, setActiveView] = useState('grouped'); // 'grouped' | 'table'
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [docTypeFilter, setDocTypeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUsers, setExpandedUsers] = useState({});

  // Multi-select for ZIP download per user: { [userId]: Set of docIds }
  const [selectedDocsByUser, setSelectedDocsByUser] = useState({});

  // Modals state
  const [previewDoc, setPreviewDoc] = useState(null);
  const [rejectingDoc, setRejectingDoc] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [downloadingZipUser, setDownloadingZipUser] = useState(null);
  const [downloadingSingleDocId, setDownloadingSingleDocId] = useState(null);

  // Field Configuration state
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [fieldFormData, setFieldFormData] = useState({
    name: '',
    category: 'Identity Proof',
    description: '',
    isRequired: true,
    subFields: [],
    fileUpload: {
      enabled: true,
      required: true,
      label: 'Upload Document / Photo (PDF, PNG, JPG)',
    },
  });

  // Check permissions
  const roleName = (user?.role || '').toLowerCase();
  const isAdminOrHR =
    roleName === 'admin' ||
    roleName === 'super admin' ||
    roleName === 'cto' ||
    roleName === 'hr manager' ||
    roleName === 'hr';

  const canReview = isAdminOrHR || user?.permissions?.documents?.edit || user?.permissions?.documents?.create;
  const canDelete = isAdminOrHR || user?.permissions?.documents?.delete;

  // 1. Fetch all employee submitted documents
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['adminDocuments', statusFilter, departmentFilter, docTypeFilter, searchQuery, urlUserId],
    queryFn: async () => {
      const res = await api.get('/documents/admin/all', {
        params: {
          status: statusFilter,
          department: departmentFilter,
          documentType: docTypeFilter,
          search: searchQuery,
          userId: urlUserId || undefined,
        },
      });
      return res.data;
    },
  });

  // 2. Fetch Document Field Configurations
  const {
    data: documentFields = [],
    isLoading: fieldsLoading,
    refetch: refetchFields,
    isFetching: isFetchingFields,
  } = useQuery({
    queryKey: ['adminDocumentFields'],
    queryFn: async () => {
      const res = await api.get('/documents/fields?all=true');
      return res.data?.data || [];
    },
  });

  const documents = data?.data || [];
  const groupedEmployees = data?.groupedEmployees || [];
  const stats = data?.stats || {
    totalDocuments: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    totalEmployeesWithDocs: 0,
  };

  // Review Document Mutation (Approve / Reject)
  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }) => {
      const res = await api.put(`/documents/admin/review/${id}`, {
        status,
        rejectionReason,
      });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Status updated successfully');
      queryClient.invalidateQueries(['adminDocuments']);
      setRejectingDoc(null);
      setRejectionReason('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to review document');
    },
  });

  // Admin Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/documents/admin/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Document deleted permanently');
      queryClient.invalidateQueries(['adminDocuments']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete document');
    },
  });

  // Create Field Mutation
  const createFieldMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/documents/fields', payload);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Field created successfully');
      queryClient.invalidateQueries(['adminDocumentFields']);
      setIsFieldModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create field');
    },
  });

  // Update Field Mutation
  const updateFieldMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.put(`/documents/fields/${id}`, payload);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Field updated successfully');
      queryClient.invalidateQueries(['adminDocumentFields']);
      setIsFieldModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update field');
    },
  });

  // Delete Field Mutation
  const deleteFieldMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/documents/fields/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Document field deleted successfully');
      queryClient.invalidateQueries(['adminDocumentFields']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete field');
    },
  });

  // Toggle Active Mutation
  const toggleFieldMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.patch(`/documents/fields/${id}/toggle`);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Status updated');
      queryClient.invalidateQueries(['adminDocumentFields']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update field status');
    },
  });

  // Seed Default Fields Mutation
  const seedDefaultsMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/documents/fields/seed-defaults');
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Standard KYC templates seeded successfully');
      queryClient.invalidateQueries(['adminDocumentFields']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to seed templates');
    },
  });

  const handleOpenCreateField = () => {
    setEditingFieldId(null);
    setFieldFormData({
      name: '',
      category: 'Identity Proof',
      description: '',
      isRequired: true,
      subFields: [
        {
          key: 'documentNumber',
          label: 'Document Number',
          type: 'text',
          required: true,
          validationType: 'numeric',
          minLength: '',
          maxLength: '',
          placeholder: 'e.g. 1234 5678 9012',
          errorMessage: 'Must be numeric digits only',
        },
      ],
      fileUpload: {
        enabled: true,
        required: true,
        label: 'Upload Document / Photo (PDF, PNG, JPG)',
      },
    });
    setIsFieldModalOpen(true);
  };

  const handleOpenEditField = (field) => {
    setEditingFieldId(field._id);
    setFieldFormData({
      name: field.name || '',
      category: field.category || 'Identity Proof',
      description: field.description || '',
      isRequired: field.isRequired !== false,
      subFields: Array.isArray(field.subFields)
        ? field.subFields.map((sf) => ({
            key: sf.key || '',
            label: sf.label || '',
            type: sf.type || 'text',
            required: Boolean(sf.required),
            validationType: sf.validationType || 'any',
            minLength: sf.minLength != null ? String(sf.minLength) : '',
            maxLength: sf.maxLength != null ? String(sf.maxLength) : '',
            placeholder: sf.placeholder || '',
            errorMessage: sf.errorMessage || '',
          }))
        : [],
      fileUpload: {
        enabled: field.fileUpload?.enabled !== false,
        required: field.fileUpload?.required !== false,
        label: field.fileUpload?.label || 'Upload Document / Photo (PDF, PNG, JPG)',
      },
    });
    setIsFieldModalOpen(true);
  };

  const handleAddSubField = () => {
    setFieldFormData((prev) => ({
      ...prev,
      subFields: [
        ...prev.subFields,
        {
          key: `subfield_${prev.subFields.length + 1}`,
          label: '',
          type: 'text',
          required: false,
          validationType: 'any',
          minLength: '',
          maxLength: '',
          placeholder: '',
          errorMessage: '',
        },
      ],
    }));
  };

  const handleRemoveSubField = (index) => {
    setFieldFormData((prev) => ({
      ...prev,
      subFields: prev.subFields.filter((_, i) => i !== index),
    }));
  };

  const handleSubFieldChange = (index, prop, val) => {
    setFieldFormData((prev) => {
      const updated = [...prev.subFields];
      const current = { ...updated[index], [prop]: val };
      if (prop === 'label' && (!current.key || current.key.startsWith('subfield_'))) {
        current.key =
          val
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '') || `field_${index + 1}`;
      }
      updated[index] = current;
      return { ...prev, subFields: updated };
    });
  };

  const handleFieldFormSubmit = (e) => {
    e.preventDefault();
    if (!fieldFormData.name.trim()) {
      toast.error('Please enter a document field name');
      return;
    }

    const payload = {
      ...fieldFormData,
      name: fieldFormData.name.trim(),
      subFields: fieldFormData.subFields.map((sf) => ({
        ...sf,
        minLength: sf.minLength ? parseInt(sf.minLength, 10) : null,
        maxLength: sf.maxLength ? parseInt(sf.maxLength, 10) : null,
      })),
    };

    if (editingFieldId) {
      updateFieldMutation.mutate({ id: editingFieldId, payload });
    } else {
      createFieldMutation.mutate(payload);
    }
  };

  const handleDeleteFieldConfirm = (field) => {
    Swal.fire({
      title: 'Delete Document Field?',
      text: `Are you sure you want to delete "${field.name}" from your company's document requirements?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete field',
    }).then((result) => {
      if (result.isConfirmed) {
        deleteFieldMutation.mutate(field._id);
      }
    });
  };

  // Toggle user accordion expansion
  const toggleUserExpand = (userId) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Checkbox toggle for specific doc in user's selection
  const handleToggleDocSelect = (userId, docId) => {
    setSelectedDocsByUser((prev) => {
      const currentSet = new Set(prev[userId] || []);
      if (currentSet.has(docId)) {
        currentSet.delete(docId);
      } else {
        currentSet.add(docId);
      }
      return {
        ...prev,
        [userId]: Array.from(currentSet),
      };
    });
  };

  // Select all docs of user toggle
  const handleSelectAllDocsOfUser = (userId, userDocs) => {
    setSelectedDocsByUser((prev) => {
      const current = prev[userId] || [];
      if (current.length === userDocs.length) {
        return {
          ...prev,
          [userId]: [],
        };
      } else {
        return {
          ...prev,
          [userId]: userDocs.map((d) => d._id),
        };
      }
    });
  };

  // Download User ZIP (all or selected)
  const handleDownloadUserZip = async (emp, selectedDocIds = null) => {
    if (!emp || !emp._id) return;
    try {
      setDownloadingZipUser(emp._id);
      const isPartial = selectedDocIds && selectedDocIds.length > 0;
      toast.loading(
        isPartial
          ? `Packaging ${selectedDocIds.length} selected document(s) for ${emp.name}...`
          : `Packaging all documents for ${emp.name} in ZIP archive...`,
        { id: 'zip-download' }
      );

      let res;
      if (isPartial) {
        res = await api.post(
          '/documents/admin/download-zip-batch',
          {
            userId: emp._id,
            documentIds: selectedDocIds,
          },
          { responseType: 'blob' }
        );
      } else {
        res = await api.get(`/documents/admin/download-zip/${emp._id}`, {
          responseType: 'blob',
        });
      }

      if (res.data.type === 'application/json') {
        const text = await res.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || 'Failed to download ZIP');
      }

      const blob = new Blob([res.data], { type: 'application/zip' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const cleanEmpName = (emp.name || 'Employee').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.setAttribute('download', `${cleanEmpName}_Documents_${Date.now()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success(
        isPartial
          ? `Downloaded ${selectedDocIds.length} selected document(s) in ZIP!`
          : `Downloaded ${emp.name}'s complete documents ZIP!`,
        { id: 'zip-download' }
      );
    } catch (err) {
      console.error('ZIP download failed:', err);
      toast.error(err.message || 'Failed to download ZIP file.', { id: 'zip-download' });
    } finally {
      setDownloadingZipUser(null);
    }
  };

  // Single file device download handler
  const handleDownloadFile = async (doc) => {
    if (!doc || !doc._id) return;
    try {
      setDownloadingSingleDocId(doc._id);
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
      setDownloadingSingleDocId(null);
    }
  };

  const getFullFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE_URL.replace('/api', '')}${url}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleApprove = (doc) => {
    Swal.fire({
      title: 'Approve Document?',
      text: `Approve "${doc.customTitle || doc.documentType}" submitted by ${doc.user?.name}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Approve Document',
    }).then((res) => {
      if (res.isConfirmed) {
        reviewMutation.mutate({ id: doc._id, status: 'Approved' });
      }
    });
  };

  const handleOpenRejectModal = (doc) => {
    setRejectingDoc(doc);
    setRejectionReason('');
  };

  const handleConfirmReject = (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error('Please specify reason for rejection');
      return;
    }
    reviewMutation.mutate({
      id: rejectingDoc._id,
      status: 'Rejected',
      rejectionReason: rejectionReason.trim(),
    });
  };

  const handleDeleteDoc = (doc) => {
    Swal.fire({
      title: 'Permanently Delete Record?',
      text: `Delete "${doc.customTitle || doc.documentType}" uploaded by ${doc.user?.name}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete Permanently',
    }).then((res) => {
      if (res.isConfirmed) {
        deleteMutation.mutate(doc._id);
      }
    });
  };

  const departments = useMemo(() => {
    const set = new Set();
    documents.forEach((d) => {
      if (d.user?.department) set.add(d.user.department);
    });
    return Array.from(set);
  }, [documents]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold tracking-wide uppercase">
              <HiOutlineShieldCheck className="w-4 h-4 text-emerald-400" />
              HR & Verification Central Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Employee Documents Management
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
              Centralized repository for all staff KYC documents. Review, approve, reject with reasons, download individual or batch employee files in ZIP archives, and dynamically configure custom document fields and validations.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => {
                if (mainTab === 'hub') refetch();
                else refetchFields();
              }}
              disabled={isFetching || isFetchingFields}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-medium backdrop-blur-md transition-all text-white border border-white/10 cursor-pointer"
              title="Refresh Records"
            >
              <HiOutlineArrowPath className={`w-4 h-4 ${isFetching || isFetchingFields ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Main Mode Navigation Tabs: Documents Hub vs Configuration */}
      <div className="flex items-center gap-2 sm:gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setMainTab('hub')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            mainTab === 'hub'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <HiOutlineFolderArrowDown className="w-5 h-5 text-indigo-400" />
          <span>Employee Documents Hub</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              mainTab === 'hub' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {stats.totalDocuments}
          </span>
        </button>

        <button
          onClick={() => setMainTab('config')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            mainTab === 'config'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <HiOutlineCog6Tooth className="w-5 h-5 text-indigo-400" />
          <span>Document Fields & KYC Configuration</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              mainTab === 'config' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {documentFields.length}
          </span>
        </button>
      </div>

      {mainTab === 'config' ? (
        /* ============================================================
           TAB 2: DOCUMENT FIELDS & KYC CONFIGURATION (ADMIN DYNAMIC BUILDER)
           ============================================================ */
        <div className="space-y-6">
          {/* Top Actions & Subtitle */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <HiOutlineCog6Tooth className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Company Document Fields & KYC Requirements
                  </h2>
                  <p className="text-xs text-slate-500">
                    Configure dynamic documents, define custom subfields (like Aadhaar Number, PAN Number), validation rules (numbers only, alphanumeric, exact digits), and photo upload options.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => seedDefaultsMutation.mutate()}
                disabled={seedDefaultsMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
                title="Seed standard Aadhaar, PAN, Degree, Bank Passbook and Resume templates"
              >
                <HiOutlineSparkles className="w-4 h-4 text-indigo-600" />
                <span>Seed Standard KYC Fields</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreateField}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all cursor-pointer"
              >
                <HiOutlinePlus className="w-4 h-4" />
                <span>Add Document Field</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Fields</div>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{documentFields.length}</div>
            </div>
            <div className="bg-white border border-rose-100 rounded-xl p-4 shadow-xs">
              <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">Mandatory KYC</div>
              <div className="text-2xl font-black text-rose-700 mt-1 font-mono">
                {documentFields.filter((f) => f.isRequired).length}
              </div>
            </div>
            <div className="bg-white border border-sky-100 rounded-xl p-4 shadow-xs">
              <div className="text-xs font-bold text-sky-600 uppercase tracking-wider">Optional Docs</div>
              <div className="text-2xl font-black text-sky-700 mt-1 font-mono">
                {documentFields.filter((f) => !f.isRequired).length}
              </div>
            </div>
            <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-xs">
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Active Status</div>
              <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
                {documentFields.filter((f) => f.isActive).length} / {documentFields.length}
              </div>
            </div>
          </div>

          {/* Fields Cards Grid */}
          {fieldsLoading ? (
            <div className="p-12 text-center text-slate-500">
              <HiOutlineArrowPath className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
              <p className="text-sm font-semibold">Loading document field configurations...</p>
            </div>
          ) : documentFields.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <HiOutlineDocumentText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Document Requirements Configured</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                You can create custom document fields for your company (e.g. Aadhaar Card, PAN Card, Licenses) or auto-seed standard Indian KYC templates with one click.
              </p>
              <button
                onClick={() => seedDefaultsMutation.mutate()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
              >
                <HiOutlineSparkles className="w-4 h-4" />
                Seed Standard KYC Templates
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documentFields.map((field) => (
                <div
                  key={field._id}
                  className={`bg-white rounded-2xl border transition-all p-5 shadow-xs flex flex-col justify-between ${
                    field.isActive
                      ? 'border-slate-200 hover:border-indigo-300'
                      : 'border-slate-200 bg-slate-50/60 opacity-75'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900 leading-tight">
                            {field.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {field.category || 'Identity Proof'}
                          </span>
                        </div>
                        {field.description && (
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {field.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {field.isRequired ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Mandatory
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Optional
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleFieldMutation.mutate(field._id)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                            field.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300'
                          }`}
                          title="Click to toggle Active / Inactive"
                        >
                          {field.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </div>
                    </div>

                    {/* File Upload Status Pill */}
                    <div className="flex items-center gap-2 text-xs">
                      {field.fileUpload?.enabled ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-emerald-800 bg-emerald-50 border border-emerald-200 font-medium text-[11px]">
                          <HiOutlineCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Photo / PDF Upload Required {field.fileUpload?.required ? '(Mandatory)' : '(Optional)'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-600 bg-slate-100 border border-slate-200 font-medium text-[11px]">
                          <HiOutlineXMark className="w-3.5 h-3.5 text-slate-400" />
                          No File Upload (Details Submission Only)
                        </span>
                      )}
                    </div>

                    {/* Sub-fields Section */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                        <span>Configured Sub-fields ({field.subFields?.length || 0})</span>
                      </div>

                      {field.subFields && field.subFields.length > 0 ? (
                        <div className="space-y-1.5">
                          {field.subFields.map((sf, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-150 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-800">{sf.label}</span>
                                {sf.required && <span className="text-rose-500 font-bold">*</span>}
                              </div>

                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span
                                  className={`px-1.5 py-0.5 rounded font-mono font-medium ${
                                    sf.validationType === 'numeric'
                                      ? 'bg-amber-100 text-amber-800'
                                      : sf.validationType === 'alphanumeric'
                                      ? 'bg-sky-100 text-sky-800'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {sf.validationType === 'numeric'
                                    ? 'Numbers only'
                                    : sf.validationType === 'alphanumeric'
                                    ? 'Alphanumeric'
                                    : sf.validationType}
                                </span>
                                {sf.minLength && sf.maxLength && sf.minLength === sf.maxLength && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                                    {sf.minLength} chars
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No sub-fields (Only document file upload)</p>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOpenEditField(field)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer"
                    >
                      <HiOutlinePencil className="w-3.5 h-3.5" />
                      <span>Edit Field</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteFieldConfirm(field)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                    >
                      <HiOutlineTrash className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ============================================================
           TAB 1: EMPLOYEE DOCUMENTS HUB (EXISTING REVIEW & VERIFICATION)
           ============================================================ */
        <div className="space-y-6">
          {/* KPI Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <HiOutlineDocumentText className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.totalDocuments}</div>
                <div className="text-xs text-slate-500 font-medium">Total Documents</div>
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

            <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <HiOutlineCheckCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">{stats.approved}</div>
                <div className="text-xs text-emerald-700 font-medium">Verified & Approved</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <HiOutlineUserGroup className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-700">{stats.totalEmployeesWithDocs}</div>
                <div className="text-xs text-purple-700 font-medium">Staff with KYC</div>
              </div>
            </div>
          </div>

          {/* Filter and Control Bar */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Left: View Mode Toggle & Status Tabs */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* View Toggle */}
              <div className="flex items-center p-1 bg-slate-100 rounded-lg shrink-0">
                <button
                  onClick={() => setActiveView('grouped')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    activeView === 'grouped'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <HiOutlineUserGroup className="w-4 h-4" />
                  By Employee
                </button>
                <button
                  onClick={() => setActiveView('table')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    activeView === 'table'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <HiOutlineTableCells className="w-4 h-4" />
                  All Documents
                </button>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
                {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      statusFilter === status
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {status}
                    {status === 'Pending' && stats.pending > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800">
                        {stats.pending}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Search and Department Filters */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
              {/* Department Dropdown */}
              <div className="relative w-full sm:w-44">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none text-slate-700 font-medium cursor-pointer"
                >
                  <option value="All">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <HiOutlineChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search staff, doc, or UTR..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Views Rendering */}
          {activeView === 'grouped' ? (
            /* ============================================================
               GROUPED BY EMPLOYEE ACCORDION VIEW
               ============================================================ */
            <div className="space-y-4">
              {groupedEmployees.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <HiOutlineDocumentCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">No Documents Found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    No documents matching the active status, department, or search filters.
                  </p>
                </div>
              ) : (
                groupedEmployees.map((group) => {
                  const emp = group.user;
                  const userId = emp._id;
                  const empDocs = group.documents;
                  const isExpanded = expandedUsers[userId] !== false; // Default expanded
                  const selectedDocIds = selectedDocsByUser[userId] || [];
                  const isAllSelected = selectedDocIds.length === empDocs.length && empDocs.length > 0;
                  const isSomeSelected = selectedDocIds.length > 0;
                  const isDownloading = downloadingZipUser === userId;

                  return (
                    <div
                      key={userId}
                      className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden transition-all"
                    >
                      {/* Employee Accordion Header */}
                      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70 border-b border-slate-100">
                        <div
                          onClick={() => toggleUserExpand(userId)}
                          className="flex items-center gap-3.5 cursor-pointer select-none flex-1"
                        >
                          {/* Avatar */}
                          <div className="relative">
                            {emp.profilePicture ? (
                              <img
                                src={getFullFileUrl(emp.profilePicture)}
                                alt={emp.name}
                                className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-2xs"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold flex items-center justify-center text-sm shadow-2xs">
                                {emp.name
                                  ? emp.name
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')
                                      .substring(0, 2)
                                      .toUpperCase()
                                  : 'U'}
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-sm">{emp.name}</h3>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200/70 text-slate-700">
                                {emp.department || 'General'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{emp.email}</span>
                              <span>•</span>
                              <span className="font-medium text-slate-700">{emp.designation || 'Staff'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Stats & Batch Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Document count pill */}
                          <div className="text-xs flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                            <span className="text-slate-500 font-medium">Docs:</span>
                            <span className="font-bold text-slate-800">{group.stats.total}</span>
                            {group.stats.approved > 0 && (
                              <span className="text-emerald-600 font-semibold text-[11px]">
                                • {group.stats.approved} Approved
                              </span>
                            )}
                            {group.stats.pending > 0 && (
                              <span className="text-amber-600 font-semibold text-[11px]">
                                • {group.stats.pending} Pending
                              </span>
                            )}
                          </div>

                          {/* Download Selected as ZIP (if any selected) */}
                          {isSomeSelected && (
                            <button
                              onClick={() => handleDownloadUserZip(emp, selectedDocIds)}
                              disabled={isDownloading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                            >
                              <HiOutlineFolderArrowDown className="w-4 h-4" />
                              Download Selected ({selectedDocIds.length}) ZIP
                            </button>
                          )}

                          {/* Download All in ZIP */}
                          <button
                            onClick={() => handleDownloadUserZip(emp)}
                            disabled={isDownloading || empDocs.length === 0}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                            title={`Download all ${empDocs.length} documents for ${emp.name} in one ZIP archive`}
                          >
                            {isDownloading ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Packaging ZIP...
                              </>
                            ) : (
                              <>
                                <HiOutlineFolderArrowDown className="w-4 h-4" />
                                Download All ZIP
                              </>
                            )}
                          </button>

                          {/* Toggle Accordion */}
                          <button
                            onClick={() => toggleUserExpand(userId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                          >
                            {isExpanded ? (
                              <HiOutlineChevronUp className="w-5 h-5" />
                            ) : (
                              <HiOutlineChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Accordion Content: Employee Documents */}
                      {isExpanded && (
                        <div className="p-4 sm:p-5 bg-white space-y-4">
                          {/* Selection Bar */}
                          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                              <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={() => handleSelectAllDocsOfUser(userId, empDocs)}
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                              />
                              Select All {empDocs.length} Documents for ZIP Export
                            </label>

                            <span className="text-slate-400">
                              {selectedDocIds.length} of {empDocs.length} selected
                            </span>
                          </div>

                          {/* Document Grid for this user */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {empDocs.map((doc) => {
                              const isSelected = selectedDocIds.includes(doc._id);
                              const isPdf = doc.fileType?.includes('pdf');
                              const isImage = doc.fileType?.startsWith('image/');

                              return (
                                <div
                                  key={doc._id}
                                  className={`border rounded-xl p-4 transition-all flex flex-col justify-between ${
                                    isSelected
                                      ? 'border-indigo-400 bg-indigo-50/20 shadow-xs'
                                      : 'border-slate-200 hover:border-slate-300 bg-white shadow-2xs'
                                  }`}
                                >
                                  <div className="space-y-2.5">
                                    {/* Top Item Row */}
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-start gap-2.5">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => handleToggleDocSelect(userId, doc._id)}
                                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 mt-1 cursor-pointer"
                                        />
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold shrink-0">
                                          {isPdf ? (
                                            <span className="text-rose-600">PDF</span>
                                          ) : isImage ? (
                                            <span className="text-indigo-600">IMG</span>
                                          ) : (
                                            <HiOutlineDocumentText className="w-4 h-4 text-slate-600" />
                                          )}
                                        </div>
                                        <div>
                                          <h4 className="text-xs font-bold text-slate-900 leading-tight">
                                            {doc.customTitle || doc.documentType}
                                          </h4>
                                          <div className="text-[11px] text-indigo-600 font-medium">
                                            {doc.documentType}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Status badge */}
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                                          doc.status === 'Approved'
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : doc.status === 'Rejected'
                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}
                                      >
                                        {doc.status}
                                      </span>
                                    </div>

                                    {doc.documentNumber && (
                                      <div className="text-[11px] font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                        No: {doc.documentNumber}
                                      </div>
                                    )}

                                    {/* Dynamic Subfield values badge display */}
                                    {doc.subFieldValues &&
                                      typeof doc.subFieldValues === 'object' &&
                                      Object.keys(doc.subFieldValues).length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {Object.entries(doc.subFieldValues).map(([k, v]) => (
                                            <span
                                              key={k}
                                              className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-mono"
                                            >
                                              <span className="font-semibold text-slate-500">{k}:</span> {String(v)}
                                            </span>
                                          ))}
                                        </div>
                                      )}

                                    {doc.status === 'Rejected' && (
                                      <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-700 space-y-0.5">
                                        <span className="font-semibold">Rejection Note:</span>
                                        <p>{doc.rejectionReason}</p>
                                      </div>
                                    )}

                                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                                      <span>{formatFileSize(doc.fileSize)}</span>
                                      <span>
                                        {new Date(doc.createdAt).toLocaleDateString('en-IN', {
                                          day: 'numeric',
                                          month: 'short',
                                        })}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Card Bottom Actions */}
                                  <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100">
                                    <div className="flex items-center gap-1.5">
                                      {/* Preview Button */}
                                      <button
                                        onClick={() => setPreviewDoc(doc)}
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                        title="Preview Document"
                                      >
                                        <HiOutlineEye className="w-4 h-4" />
                                      </button>

                                      {/* Direct Device Download */}
                                      {doc.fileUrl && (
                                        <button
                                          onClick={() => handleDownloadFile(doc)}
                                          disabled={downloadingSingleDocId === doc._id}
                                          className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer disabled:opacity-50"
                                          title="Download directly to device"
                                        >
                                          <HiOutlineArrowDownTray className="w-4 h-4" />
                                        </button>
                                      )}

                                      {/* Delete Button */}
                                      {canDelete && (
                                        <button
                                          onClick={() => handleDeleteDoc(doc)}
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                          title="Delete Document Record"
                                        >
                                          <HiOutlineTrash className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>

                                    {/* Verification Review Buttons */}
                                    {canReview && (
                                      <div className="flex items-center gap-1.5">
                                        {doc.status !== 'Approved' && (
                                          <button
                                            onClick={() => handleApprove(doc)}
                                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors cursor-pointer"
                                          >
                                            Approve
                                          </button>
                                        )}
                                        {doc.status !== 'Rejected' && (
                                          <button
                                            onClick={() => handleOpenRejectModal(doc)}
                                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
                                          >
                                            Reject
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* ============================================================
               ALL DOCUMENTS TABLE VIEW
               ============================================================ */
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Document Type</th>
                      <th className="py-3 px-4">Title / Number / Details</th>
                      <th className="py-3 px-4">File Details</th>
                      <th className="py-3 px-4">Upload Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {documents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          No documents found matching filters.
                        </td>
                      </tr>
                    ) : (
                      documents.map((doc) => (
                        <tr key={doc._id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Employee */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {doc.user?.profilePicture ? (
                                <img
                                  src={getFullFileUrl(doc.user.profilePicture)}
                                  alt={doc.user?.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                                  {doc.user?.name
                                    ? doc.user.name
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .substring(0, 2)
                                    : 'U'}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-slate-900">{doc.user?.name || 'Staff'}</div>
                                <div className="text-[11px] text-slate-400">{doc.user?.department || 'General'}</div>
                              </div>
                            </div>
                          </td>

                          {/* Document Type */}
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800">{doc.documentType}</span>
                            {doc.customTitle && (
                              <div className="text-[11px] text-slate-500">{doc.customTitle}</div>
                            )}
                          </td>

                          {/* Title / Number / Subfields */}
                          <td className="py-3 px-4">
                            {doc.documentNumber && (
                              <div className="font-mono text-xs text-slate-700">{doc.documentNumber}</div>
                            )}
                            {doc.subFieldValues &&
                              typeof doc.subFieldValues === 'object' &&
                              Object.keys(doc.subFieldValues).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {Object.entries(doc.subFieldValues).map(([k, v]) => (
                                    <span
                                      key={k}
                                      className="inline-block px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 font-mono"
                                    >
                                      {k}: {String(v)}
                                    </span>
                                  ))}
                                </div>
                              )}
                          </td>

                          {/* File Details */}
                          <td className="py-3 px-4 text-slate-500">
                            <div>{formatFileSize(doc.fileSize)}</div>
                            <div className="text-[10px] uppercase text-slate-400">
                              {doc.fileType?.split('/')[1] || 'FILE'}
                            </div>
                          </td>

                          {/* Upload Date */}
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            {new Date(doc.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                doc.status === 'Approved'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : doc.status === 'Rejected'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {doc.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setPreviewDoc(doc)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                title="Preview Document"
                              >
                                <HiOutlineEye className="w-4 h-4" />
                              </button>

                              {doc.fileUrl && (
                                <button
                                  onClick={() => handleDownloadFile(doc)}
                                  disabled={downloadingSingleDocId === doc._id}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer disabled:opacity-50"
                                  title="Download to device"
                                >
                                  <HiOutlineArrowDownTray className="w-4 h-4" />
                                </button>
                              )}

                              {canReview && (
                                <>
                                  {doc.status !== 'Approved' && (
                                    <button
                                      onClick={() => handleApprove(doc)}
                                      className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold transition-colors cursor-pointer"
                                    >
                                      Approve
                                    </button>
                                  )}
                                  {doc.status !== 'Rejected' && (
                                    <button
                                      onClick={() => handleOpenRejectModal(doc)}
                                      className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold transition-colors cursor-pointer"
                                    >
                                      Reject
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Document Field Create / Edit Modal */}
      {isFieldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-auto overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <HiOutlineCog6Tooth className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingFieldId ? 'Edit Document Field & Validations' : 'Create Custom Document Field'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define document title, mandatory status, sub-fields, and input validation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFieldModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFieldFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Field Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Document Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aadhaar Card, Driving License"
                    value={fieldFormData.name}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={fieldFormData.category}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="Identity Proof">Identity Proof</option>
                    <option value="Address Proof">Address Proof</option>
                    <option value="Academic">Academic Certificate</option>
                    <option value="Experience">Experience / Relieving</option>
                    <option value="Financial">Financial / Banking</option>
                    <option value="Other">Other Document</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instructions / Description for Employee
                </label>
                <input
                  type="text"
                  placeholder="e.g. Please upload clear front and back scanned copy"
                  value={fieldFormData.description}
                  onChange={(e) => setFieldFormData({ ...fieldFormData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Mandatory Toggle */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="isRequiredField"
                  checked={fieldFormData.isRequired}
                  onChange={(e) => setFieldFormData({ ...fieldFormData, isRequired: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="isRequiredField" className="text-xs font-medium text-slate-800 cursor-pointer">
                  <span className="font-bold">Mandatory KYC Requirement</span> — Employee must submit this document.
                </label>
              </div>

              {/* Sub-fields Builder */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Document Sub-fields (Number / Details inputs)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Add input fields like Document Number, Expiry Date, or Name on card with strict validations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSubField}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer"
                  >
                    <HiOutlinePlus className="w-3.5 h-3.5" />
                    <span>Add Sub-field</span>
                  </button>
                </div>

                {fieldFormData.subFields.length === 0 ? (
                  <div className="p-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                    No custom subfields added yet. Click "+ Add Sub-field" above if this document needs number or text inputs.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fieldFormData.subFields.map((sf, index) => (
                      <div key={index} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2 relative">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            Sub-field #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubField(index)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                            title="Remove this subfield"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                              Label / Name
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Aadhaar Number"
                              value={sf.label}
                              onChange={(e) => handleSubFieldChange(index, 'label', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                              Validation Type
                            </label>
                            <select
                              value={sf.validationType}
                              onChange={(e) => handleSubFieldChange(index, 'validationType', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                            >
                              <option value="numeric">Numbers Only (0-9 Digits)</option>
                              <option value="alphanumeric">Alphanumeric (Letters & Digits)</option>
                              <option value="pan">PAN Format (ABCDE1234F)</option>
                              <option value="aadhaar">Aadhaar Format (12 Digits)</option>
                              <option value="any">Any Text / Format</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                              Input Type
                            </label>
                            <select
                              value={sf.type}
                              onChange={(e) => handleSubFieldChange(index, 'type', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                            >
                              <option value="text">Text / Number String</option>
                              <option value="number">Numeric Value</option>
                              <option value="date">Date</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                              Exact / Min Length
                            </label>
                            <input
                              type="number"
                              placeholder="e.g. 12"
                              value={sf.minLength}
                              onChange={(e) => handleSubFieldChange(index, 'minLength', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                              Max Length
                            </label>
                            <input
                              type="number"
                              placeholder="e.g. 12"
                              value={sf.maxLength}
                              onChange={(e) => handleSubFieldChange(index, 'maxLength', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                              Placeholder Hint
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 1234 5678 9012"
                              value={sf.placeholder}
                              onChange={(e) => handleSubFieldChange(index, 'placeholder', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id={`sf_req_${index}`}
                            checked={sf.required}
                            onChange={(e) => handleSubFieldChange(index, 'required', e.target.checked)}
                            className="w-3.5 h-3.5 rounded text-indigo-600"
                          />
                          <label htmlFor={`sf_req_${index}`} className="text-[11px] text-slate-700 font-medium cursor-pointer">
                            Required sub-field (Employee must enter this value)
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* File Upload Settings */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Document File / Photo Upload Settings
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      id="fileUploadEnabled"
                      checked={fieldFormData.fileUpload.enabled}
                      onChange={(e) =>
                        setFieldFormData({
                          ...fieldFormData,
                          fileUpload: { ...fieldFormData.fileUpload, enabled: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    <label htmlFor="fileUploadEnabled" className="text-xs font-semibold text-slate-800 cursor-pointer">
                      Enable File / Photo Upload
                    </label>
                  </div>

                  {fieldFormData.fileUpload.enabled && (
                    <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <input
                        type="checkbox"
                        id="fileUploadRequired"
                        checked={fieldFormData.fileUpload.required}
                        onChange={(e) =>
                          setFieldFormData({
                            ...fieldFormData,
                            fileUpload: { ...fieldFormData.fileUpload, required: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded text-indigo-600"
                      />
                      <label htmlFor="fileUploadRequired" className="text-xs font-semibold text-slate-800 cursor-pointer">
                        File Upload is Mandatory
                      </label>
                    </div>
                  )}
                </div>

                {fieldFormData.fileUpload.enabled && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                      Upload Prompt Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Upload Clear Photo / PDF"
                      value={fieldFormData.fileUpload.label}
                      onChange={(e) =>
                        setFieldFormData({
                          ...fieldFormData,
                          fileUpload: { ...fieldFormData.fileUpload, label: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFieldModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createFieldMutation.isPending || updateFieldMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition cursor-pointer"
                >
                  {createFieldMutation.isPending || updateFieldMutation.isPending ? (
                    <>
                      <HiOutlineArrowPath className="w-4 h-4 animate-spin" />
                      <span>Saving Field...</span>
                    </>
                  ) : (
                    <>
                      <HiOutlineCheck className="w-4 h-4" />
                      <span>{editingFieldId ? 'Update Field' : 'Save Document Field'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                  <HiOutlineExclamationTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Reject Document</h3>
                  <p className="text-xs text-rose-700">Please provide a reason to the employee</p>
                </div>
              </div>
              <button
                onClick={() => setRejectingDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-6 space-y-4">
              <div>
                <div className="text-xs text-slate-600 mb-2">
                  Rejecting: <span className="font-semibold text-slate-900">{rejectingDoc.customTitle || rejectingDoc.documentType}</span>
                  {rejectingDoc.user?.name && <span> submitted by {rejectingDoc.user.name}</span>}
                </div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Rejection <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Scanned copy is blurry, document expired, incorrect number or missing signature..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingDoc(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewMutation.isPending || !rejectionReason.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {reviewMutation.isPending ? 'Saving...' : 'Confirm Rejection'}
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
                    <span className="font-medium text-slate-700">{previewDoc.user?.name || 'Employee'}</span>
                    <span>•</span>
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
                    disabled={downloadingSingleDocId === previewDoc._id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                    title="Download file to device"
                  >
                    <HiOutlineArrowDownTray className="w-4 h-4" />
                    {downloadingSingleDocId === previewDoc._id ? 'Downloading...' : 'Download File'}
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
                      Please download this file directly to inspect it.
                    </p>
                    <button
                      onClick={() => handleDownloadFile(previewDoc)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-all cursor-pointer"
                    >
                      <HiOutlineArrowDownTray className="w-4 h-4" />
                      Download File Now
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

export default AdminDocumentsManagement;
