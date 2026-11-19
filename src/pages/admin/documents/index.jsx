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
} from 'react-icons/hi2';

const AdminDocumentsManagement = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlUserId = searchParams.get('userId') || '';

  const queryClient = useQueryClient();

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

  // Fetch all documents
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
        // Unselect all
        const next = { ...prev };
        delete next[userId];
        return next;
      } else {
        // Select all
        return {
          ...prev,
          [userId]: userDocs.map((d) => d._id),
        };
      }
    });
  };

  // Download ZIP (All or Selected for an Employee)
  const handleDownloadUserZip = async (empUser, specificDocIds = null) => {
    const userId = empUser._id;
    try {
      setDownloadingZipUser(userId);
      toast.loading(`Packaging ZIP bundle for ${empUser.name}...`, { id: 'zip-download' });

      let endpoint = `/documents/admin/download-zip/${userId}`;
      let config = { responseType: 'blob' };
      let res;
      let defaultFileName;

      if (specificDocIds && specificDocIds.length > 0) {
        endpoint = `/documents/admin/download-zip-batch`;
        defaultFileName = `${empUser.name.replace(/\s+/g, '_')}_Selected_Documents.zip`;
        res = await api.post(endpoint, { userId, documentIds: specificDocIds }, config);
      } else {
        defaultFileName = `${empUser.name.replace(/\s+/g, '_')}_KYC_Documents.zip`;
        res = await api.get(endpoint, config);
      }

      // Check if server returned an error JSON inside blob
      if (res.data.type === 'application/json') {
        const text = await res.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || 'Failed to generate ZIP');
      }

      triggerBlobDownload(res.data, defaultFileName);
      toast.success(`ZIP downloaded to your device!`, { id: 'zip-download' });
    } catch (err) {
      console.error('ZIP download failed:', err);
      toast.error(err.message || 'Failed to download ZIP bundle.', { id: 'zip-download' });
    } finally {
      setDownloadingZipUser(null);
    }
  };

  const triggerBlobDownload = (blobData, defaultFileName) => {
    const blob = new Blob([blobData], { type: 'application/zip' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', defaultFileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Direct Device Download Handler for Single Document
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

  // Single file URL helper
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

  const handleDelete = (doc) => {
    Swal.fire({
      title: 'Delete Document Permanently?',
      text: `Are you sure you want to permanently delete this file? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete file',
    }).then((res) => {
      if (res.isConfirmed) {
        deleteMutation.mutate(doc._id);
      }
    });
  };

  // List of distinct departments for filter dropdown
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
              Centralized repository for all staff KYC documents (Aadhaar, PAN, certificates, relieving letters). Review, approve, reject with reasons, and download individual or batch employee files in ZIP archives.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-medium backdrop-blur-md transition-all text-white border border-white/10"
              title="Refresh Records"
            >
              <HiOutlineArrowPath className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
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
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
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
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
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
                className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
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

        {/* Right: Search & Department Dropdown */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {departments.length > 0 && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            >
              <option value="All">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          )}

          <div className="relative flex-1 sm:w-64">
            <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee or document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Active User Filter Pill */}
      {urlUserId && (
        <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Filtered by employee:</span>
            <span>{groupedEmployees[0]?.user?.name || 'Selected Employee'}</span>
          </div>
          <button
            onClick={() => setSearchParams({})}
            className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg border border-indigo-200 transition-colors"
          >
            Clear Filter (Show All Staff)
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeView === 'grouped' ? (
        /* ============================================================
           GROUPED BY EMPLOYEE VIEW (With 1-Click ZIP Download)
           ============================================================ */
        <div className="space-y-4">
          {groupedEmployees.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-3">
              <HiOutlineDocumentCheck className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-semibold text-slate-800">No Employee Documents Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No submitted verification documents match your current filter criteria.
              </p>
            </div>
          ) : (
            groupedEmployees.map((group) => {
              const emp = group.user;
              const userId = emp._id;
              const empDocs = group.documents || [];
              const isExpanded = expandedUsers[userId] ?? true; // Default open
              const selectedDocIds = selectedDocsByUser[userId] || [];
              const isAllSelected = selectedDocIds.length === empDocs.length && empDocs.length > 0;
              const isSomeSelected = selectedDocIds.length > 0;
              const isDownloading = downloadingZipUser === userId;

              return (
                <div
                  key={userId}
                  className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden transition-all"
                >
                  {/* Employee Header Row */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70 border-b border-slate-100">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        {emp.profilePicture ? (
                          <img
                            src={getFullFileUrl(emp.profilePicture)}
                            alt={emp.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm border border-indigo-200">
                            {emp.name
                              ?.split(' ')
                              .map((n) => n[0])
                              .join('')
                              .substring(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                        {group.stats.pending > 0 && (
                          <span
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 border-2 border-white rounded-full"
                            title={`${group.stats.pending} pending document(s)`}
                          />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base leading-snug">{emp.name}</h3>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all"
                        >
                          <HiOutlineFolderArrowDown className="w-4 h-4" />
                          Download Selected ({selectedDocIds.length}) ZIP
                        </button>
                      )}

                      {/* Download All in ZIP */}
                      <button
                        onClick={() => handleDownloadUserZip(emp)}
                        disabled={isDownloading || empDocs.length === 0}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
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

                      {/* Accordion expand toggle */}
                      <button
                        onClick={() => toggleUserExpand(userId)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? (
                          <HiOutlineChevronUp className="w-5 h-5" />
                        ) : (
                          <HiOutlineChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Accordion Documents Content */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 bg-white">
                      {/* Sub-header with multi-select toggle */}
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 text-xs text-slate-500">
                        <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={() => handleSelectAllDocsOfUser(userId, empDocs)}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                          />
                          <span>Select all ({empDocs.length}) documents for ZIP download</span>
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

                              {/* Card Action Row */}
                              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setPreviewDoc(doc)}
                                    className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold inline-flex items-center gap-1"
                                  >
                                    <HiOutlineEye className="w-3.5 h-3.5" />
                                    View
                                  </button>
                                  <button
                                    onClick={() => handleDownloadFile(doc)}
                                    disabled={downloadingSingleDocId === doc._id}
                                    className="text-slate-700 hover:text-indigo-600 text-xs font-semibold inline-flex items-center gap-1 ml-2 disabled:opacity-50"
                                    title="Download file to device"
                                  >
                                    <HiOutlineArrowDownTray className="w-3.5 h-3.5" />
                                    {downloadingSingleDocId === doc._id ? 'Downloading...' : 'Download'}
                                  </button>
                                </div>

                                {canReview && (
                                  <div className="flex items-center gap-1.5">
                                    {doc.status !== 'Approved' && (
                                      <button
                                        onClick={() => handleApprove(doc)}
                                        className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold transition-colors"
                                        title="Approve Document"
                                      >
                                        Approve
                                      </button>
                                    )}
                                    {doc.status !== 'Rejected' && (
                                      <button
                                        onClick={() => handleOpenRejectModal(doc)}
                                        className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold transition-colors"
                                        title="Reject Document"
                                      >
                                        Reject
                                      </button>
                                    )}
                                    {canDelete && (
                                      <button
                                        onClick={() => handleDelete(doc)}
                                        className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                        title="Delete"
                                      >
                                        <HiOutlineTrash className="w-3.5 h-3.5" />
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
                  <th className="py-3 px-4">Title / Number</th>
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
                            <div className="font-bold text-slate-900">{doc.user?.name || 'Unknown User'}</div>
                            <div className="text-[11px] text-slate-400">{doc.user?.department || 'Staff'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Document Type */}
                      <td className="py-3 px-4 font-semibold text-indigo-700">
                        {doc.documentType}
                      </td>

                      {/* Title / Number */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {doc.customTitle || doc.originalFileName || '-'}
                        </div>
                        {doc.documentNumber && (
                          <div className="font-mono text-[11px] text-slate-500">{doc.documentNumber}</div>
                        )}
                      </td>

                      {/* File Details */}
                      <td className="py-3 px-4 text-slate-500">
                        <div>{formatFileSize(doc.fileSize)}</div>
                        <div className="text-[10px] uppercase text-slate-400">{doc.fileType?.split('/')[1]}</div>
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
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Preview Document"
                          >
                            <HiOutlineEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadFile(doc)}
                            disabled={downloadingSingleDocId === doc._id}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Download file to device"
                          >
                            <HiOutlineArrowDownTray className="w-4 h-4" />
                          </button>

                          {canReview && (
                            <>
                              {doc.status !== 'Approved' && (
                                <button
                                  onClick={() => handleApprove(doc)}
                                  className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold transition-colors"
                                >
                                  Approve
                                </button>
                              )}
                              {doc.status !== 'Rejected' && (
                                <button
                                  onClick={() => handleOpenRejectModal(doc)}
                                  className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold transition-colors"
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
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
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
                  placeholder="e.g. Scanned copy is blurry, document expired, incorrect name or missing signature..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingDoc(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewMutation.isPending || !rejectionReason.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-sm transition-all"
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
                <button
                  onClick={() => handleDownloadFile(previewDoc)}
                  disabled={downloadingSingleDocId === previewDoc._id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors disabled:opacity-50"
                  title="Download file to device"
                >
                  <HiOutlineArrowDownTray className="w-4 h-4" />
                  {downloadingSingleDocId === previewDoc._id ? 'Downloading...' : 'Download File'}
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Previewer */}
            <div className="flex-1 bg-slate-100 p-4 overflow-auto flex items-center justify-center">
              {previewDoc.fileType?.startsWith('image/') ? (
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
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-all"
                  >
                    <HiOutlineArrowDownTray className="w-4 h-4" />
                    Download File Now
                  </button>
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
