import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlinePaperClip, HiOutlineXMark } from 'react-icons/hi2';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';

const HRAnnouncements = () => {
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
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newAnnouncement) => {
      const data = new FormData();
      data.append('title', newAnnouncement.title);
      data.append('content', newAnnouncement.content);
      data.append('priority', newAnnouncement.priority);
      if (newAnnouncement.scheduledDate) {
        data.append('scheduledDate', newAnnouncement.scheduledDate);
      }
      if (newAnnouncement.expireDate) {
        data.append('expireDate', newAnnouncement.expireDate);
      }
      
      Array.from(newAnnouncement.attachments).forEach(file => {
        data.append('attachments', file);
      });

      return await api.post('/announcements', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      setIsModalOpen(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedAnnouncement) => {
      const data = new FormData();
      data.append('title', updatedAnnouncement.title);
      data.append('content', updatedAnnouncement.content);
      data.append('priority', updatedAnnouncement.priority);
      if (updatedAnnouncement.scheduledDate) {
        data.append('scheduledDate', updatedAnnouncement.scheduledDate);
      }
      if (updatedAnnouncement.expireDate) {
        data.append('expireDate', updatedAnnouncement.expireDate);
      }
      
      Array.from(updatedAnnouncement.attachments).forEach(file => {
        data.append('attachments', file);
      });

      return await api.put(`/announcements/${updatedAnnouncement.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      setIsModalOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await api.delete(`/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
    }
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
      expireDate: ann.expireDate ? new Date(ann.expireDate).toISOString().slice(0, 16) : ''
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

  const filteredAnnouncements = announcements.filter(ann => {
    const isExpired = ann.expireDate && new Date(ann.expireDate) < new Date();
    if (activeTab === 'Active') {
      return !isExpired;
    } else {
      return isExpired;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
          <p className="text-sm text-slate-500">Manage company-wide notices and important updates.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-xs cursor-pointer"
        >
          <HiOutlinePlus className="w-5 h-5" />
          New Announcement
        </button>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('Active')}
          className={`px-6 py-3 font-semibold text-sm transition-colors relative cursor-pointer ${activeTab === 'Active' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Active Announcements
          {activeTab === 'Active' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('Previous')}
          className={`px-6 py-3 font-semibold text-sm transition-colors relative cursor-pointer ${activeTab === 'Previous' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Previous Announcements
          {activeTab === 'Previous' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
          )}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        {isLoading ? (
          <div className="flex justify-center p-12">
             <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="text-center p-12 text-slate-500 text-sm">
            {activeTab === 'Active' ? 'No active announcements found. Create one to notify the organization.' : 'No previous announcements found.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map(ann => (
              <div key={ann._id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors shadow-xs">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-bold text-slate-900">{ann.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        ann.priority === 'Urgent' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        ann.priority === 'Important' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {ann.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Published by {ann.createdBy?.name || 'Unknown'} on {new Date(ann.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-1">
                    <button 
                      onClick={() => openEditModal(ann)}
                      className="text-slate-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit Announcement"
                    >
                      <HiOutlinePencilSquare className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(ann._id)}
                      className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Announcement"
                    >
                      <HiOutlineTrash className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="text-slate-700 text-sm whitespace-pre-wrap mb-4 leading-relaxed">
                  {ann.content}
                </div>

                {ann.attachments && ann.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                    {ann.attachments.map((file, idx) => (
                      <a 
                        key={idx} 
                        href={`${API_BASE_URL}${file}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                      >
                        <HiOutlinePaperClip className="w-4 h-4 text-slate-400" />
                        Attachment {idx + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">{isEditing ? 'Edit Announcement' : 'New Announcement'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                <HiOutlineXMark className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="Enter announcement title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content *</label>
                <textarea
                  required
                  rows="5"
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm resize-none"
                  placeholder="Type your message here..."
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.value})}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Important">Important</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Schedule For (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={e => setFormData({...formData, scheduledDate: e.target.value})}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expire Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.expireDate}
                    onChange={e => setFormData({...formData, expireDate: e.target.value})}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Attachments</label>
                <input
                  type="file"
                  multiple
                  onChange={e => setAttachments(e.target.files)}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer bg-white border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  )}
                  {isEditing ? 'Update Announcement' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRAnnouncements;