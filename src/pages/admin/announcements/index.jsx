import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlinePaperClip,
  HiOutlineXMark,
  HiOutlineMegaphone,
} from 'react-icons/hi2';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';

const getPriorityStyles = (priority) => {
  switch (priority) {
    case 'Urgent':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Important':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200';
  }
};

const AdminAnnouncements = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('Active');

  const [formData, setFormData] = useState({
    id: null,
    title: '',
    content: '',
    priority: 'Normal',
    scheduledDate: '',
    expireDate: '',
  });

  const [attachments, setAttachments] = useState([]);

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data } = await api.get('/announcements');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newAnnouncement) => {
      const data = new FormData();
      data.append('title', newAnnouncement.title);
      data.append('content', newAnnouncement.content);
      data.append('priority', newAnnouncement.priority);
      if (newAnnouncement.scheduledDate) data.append('scheduledDate', newAnnouncement.scheduledDate);
      if (newAnnouncement.expireDate) data.append('expireDate', newAnnouncement.expireDate);

      Array.from(newAnnouncement.attachments).forEach((file) => {
        data.append('attachments', file);
      });

      return await api.post('/announcements', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      setIsModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedAnnouncement) => {
      const data = new FormData();
      data.append('title', updatedAnnouncement.title);
      data.append('content', updatedAnnouncement.content);
      data.append('priority', updatedAnnouncement.priority);
      if (updatedAnnouncement.scheduledDate) data.append('scheduledDate', updatedAnnouncement.scheduledDate);
      if (updatedAnnouncement.expireDate) data.append('expireDate', updatedAnnouncement.expireDate);

      Array.from(updatedAnnouncement.attachments).forEach((file) => {
        data.append('attachments', file);
      });

      return await api.put(`/announcements/${updatedAnnouncement.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      setIsModalOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await api.delete(`/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
    },
  });

  const resetForm = () => {
    setFormData({ id: null, title: '', content: '', priority: 'Normal', scheduledDate: '', expireDate: '' });
    setAttachments([]);
    setIsEditing(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (ann) => {
    setFormData({
      id: ann._id,
      title: ann.title,
      content: ann.content,
      priority: ann.priority,
      scheduledDate: ann.scheduledDate ? new Date(ann.scheduledDate).toISOString().slice(0, 16) : '',
      expireDate: ann.expireDate ? new Date(ann.expireDate).toISOString().slice(0, 16) : '',
    });
    setAttachments([]);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      updateMutation.mutate({ ...formData, attachments });
    } else {
      createMutation.mutate({ ...formData, attachments });
    }
  };

  const filteredAnnouncements = announcements.filter((ann) => {
    const isExpired = ann.expireDate && new Date(ann.expireDate) < new Date();
    if (activeTab === 'Active') return !isExpired;
    return isExpired;
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Reusable classes
  const inputBase =
    'w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors';
  const labelBase = 'block text-xs font-semibold text-slate-700 mb-1.5';
  const btnPrimary =
    'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  const btnGhost =
    'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer';

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ===================== PAGE HEADER ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Announcements</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage company-wide notices and important updates.
          </p>
        </div>
        <button type="button" onClick={openCreateModal} className={`${btnPrimary} w-full sm:w-auto`}>
          <HiOutlinePlus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* ===================== TABS ===================== */}
      <div className="border-b border-slate-200 -mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto">
        <div className="flex min-w-max">
          {['Active', 'Previous'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${activeTab === tab
                ? 'text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              {tab === 'Active' ? 'Active Announcements' : 'Previous Announcements'}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ===================== LIST ===================== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <HiOutlineMegaphone className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              {activeTab === 'Active' ? 'No active announcements' : 'No previous announcements'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {activeTab === 'Active'
                ? 'Create one to notify the organization.'
                : 'Expired announcements will appear here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAnnouncements.map((ann) => (
              <div key={ann._id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors">
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 break-words">
                        {ann.title}
                      </h3>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${getPriorityStyles(
                          ann.priority
                        )}`}
                      >
                        {ann.priority}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-500">
                      Published by <span className="font-medium text-slate-700">{ann.createdBy?.name || 'Unknown'}</span> on{' '}
                      {new Date(ann.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Action buttons — top right on desktop, inline row on mobile */}
                  <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                    <button
                      type="button"
                      onClick={() => openEditModal(ann)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Announcement"
                      aria-label="Edit Announcement"
                    >
                      <HiOutlinePencilSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(ann._id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Announcement"
                      aria-label="Delete Announcement"
                    >
                      <HiOutlineTrash className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap break-words leading-relaxed mb-2.5">
                  {ann.content}
                </p>

                {/* Attachments */}
                {ann.attachments && ann.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                    {ann.attachments.map((file, idx) => (
                      <a
                        key={idx}
                        href={`${API_BASE_URL}${file}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs bg-white border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                      >
                        <HiOutlinePaperClip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Attachment {idx + 1}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===================== CREATE / EDIT MODAL ===================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />

          {/* Modal card — full-screen bottom sheet on mobile, centered card on desktop */}
          <div className="relative bg-white sm:rounded-2xl rounded-t-2xl border-0 sm:border border-slate-200 shadow-2xl w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {isEditing ? 'Edit Announcement' : 'New Announcement'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 -mr-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer shrink-0"
                aria-label="Close"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Form body */}
            <form
              onSubmit={handleSubmit}
              className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1"
            >
              <div>
                <label className={labelBase}>Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={inputBase}
                  placeholder="Enter announcement title"
                />
              </div>

              <div>
                <label className={labelBase}>Content *</label>
                <textarea
                  required
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className={`${inputBase} resize-none`}
                  placeholder="Type your message here..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelBase}>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className={inputBase}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Important">Important</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className={labelBase}>Schedule For (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className={inputBase}
                  />
                </div>
                <div>
                  <label className={labelBase}>Expire Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.expireDate}
                    onChange={(e) => setFormData({ ...formData, expireDate: e.target.value })}
                    className={inputBase}
                  />
                </div>
              </div>

              <div>
                <label className={labelBase}>Attachments</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setAttachments(e.target.files)}
                  className="block w-full text-xs sm:text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:cursor-pointer transition-colors cursor-pointer bg-white border border-slate-300 rounded-lg p-2"
                />
              </div>

              {/* Footer actions */}
              <div className="pt-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 border-t border-slate-200 sm:mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className={btnGhost}>
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className={btnPrimary}>
                  {isSaving && (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>{isEditing ? 'Update Announcement' : 'Publish Announcement'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;