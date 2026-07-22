import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Announcements</h1>
          <p className="text-slate-400">Manage company-wide notices and important updates.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Announcement
        </button>
      </div>

      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('Active')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'Active' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'}`}
        >
          Active Announcements
          {activeTab === 'Active' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('Previous')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'Previous' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'}`}
        >
          Previous Announcements
          {activeTab === 'Previous' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>
          )}
        </button>
      </div>

      <div className="glass-panel p-6">
        {isLoading ? (
          <div className="flex justify-center p-12">
             <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="text-center p-12 text-slate-400">
            {activeTab === 'Active' ? 'No active announcements found. Create one to notify the organization.' : 'No previous announcements found.'}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAnnouncements.map(ann => (
              <div key={ann._id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-white">{ann.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        ann.priority === 'Urgent' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                        ann.priority === 'Important' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                      }`}>
                        {ann.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Published by {ann.createdBy?.name || 'Unknown'} on {new Date(ann.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openEditModal(ann)}
                      className="text-slate-400 hover:text-indigo-400 p-2 rounded-lg hover:bg-indigo-500/10 transition-colors"
                      title="Edit Announcement"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleDelete(ann._id)}
                      className="text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Delete Announcement"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="text-slate-300 text-sm whitespace-pre-wrap mb-4">
                  {ann.content}
                </div>

                {ann.attachments && ann.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-700/50">
                    {ann.attachments.map((file, idx) => (
                      <a 
                        key={idx} 
                        href={`${API_BASE_URL}${file}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg hover:text-indigo-400 hover:border-indigo-500/30 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
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
          <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white">{isEditing ? 'Edit Announcement' : 'New Announcement'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Enter announcement title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Content *</label>
                <textarea
                  required
                  rows="5"
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"
                  placeholder="Type your message here..."
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all appearance-none"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Important">Important</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Schedule For (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={e => setFormData({...formData, scheduledDate: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Expire Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.expireDate}
                    onChange={e => setFormData({...formData, expireDate: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Attachments</label>
                <input
                  type="file"
                  multiple
                  onChange={e => setAttachments(e.target.files)}
                  className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 transition-all cursor-pointer bg-slate-800 border border-slate-700 rounded-lg p-2"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
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

export default AdminAnnouncements;
