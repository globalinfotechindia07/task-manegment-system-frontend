import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../api/axios';

const UserTasksPage = () => {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [attachments, setAttachments] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return data;
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, formData }) => {
      const { data } = await api.put(`/tasks/${taskId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data;
    },
    onSuccess: (updatedTask) => {
      toast.success('Task updated');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      // If we are updating the task via the modal, reload the details to get the populated history
      openDetails({ _id: updatedTask._id });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update task');
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ taskId, text }) => {
      const { data } = await api.post(`/tasks/${taskId}/comments`, { text });
      return data;
    },
    onSuccess: (updatedTask) => {
      toast.success('Comment added');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSelectedTask(updatedTask);
      setCommentText('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    }
  });

  const handleUpdateStatus = (e) => {
    if (selectedTask) {
      const formData = new FormData();
      formData.append('status', e.target.value);
      updateTaskMutation.mutate({ taskId: selectedTask._id, formData });
    }
  };

  const handleFileUpload = (e) => {
    e.preventDefault();
    if (!attachments || attachments.length === 0) {
      toast.error('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    Array.from(attachments).forEach(file => {
      formData.append('attachments', file);
    });

    updateTaskMutation.mutate({ taskId: selectedTask._id, formData });
    setAttachments(null);
    e.target.reset(); // Clear the file input
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate({ taskId: selectedTask._id, text: commentText });
  };

  const openDetails = async (task) => {
    try {
      const { data } = await api.get(`/tasks/${task._id}`);
      setSelectedTask(data);
      setIsDetailsModalOpen(true);
    } catch (error) {
      toast.error('Failed to load task details');
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white">My Daily Tasks</h1>
          <p className="text-slate-400">View and update your assigned tasks.</p>
        </div>
      </div>
      
      <div className="glass-panel overflow-hidden">
        {tasksLoading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : !Array.isArray(tasks) || tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-1">No tasks assigned</h3>
            <p className="text-slate-400 max-w-sm">You currently have no tasks assigned to you.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-slate-200 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Task Name</th>
                  <th className="px-6 py-4 font-semibold">Assigned By</th>
                  <th className="px-6 py-4 font-semibold">Priority</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Due Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {tasks.map(task => (
                  <tr key={task._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{task.title}</td>
                    <td className="px-6 py-4">{task.assignedBy?.name || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                        task.priority === 'High' ? 'bg-red-500/10 text-red-400' :
                        task.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                        task.status === 'Completed' ? 'bg-green-500/10 text-green-400' :
                        task.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400' :
                        task.status === 'On Hold' ? 'bg-orange-500/10 text-orange-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openDetails(task)}
                        className="text-indigo-400 hover:text-indigo-300 px-3 py-1 border border-indigo-500/30 rounded hover:bg-indigo-500/10 transition-colors"
                      >
                        Update Task
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {isDetailsModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm" onClick={() => setIsDetailsModalOpen(false)}></div>
          <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-800 shrink-0">
              <h3 className="text-xl font-bold text-white">{selectedTask.title}</h3>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Details */}
              <div className="md:col-span-2 space-y-6 min-w-0">
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-2">Description</h4>
                  <p className="text-slate-200 bg-slate-800/50 p-4 rounded-lg">{selectedTask.description}</p>
                </div>

                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-400 mb-2">Attachments</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.attachments.map((file, i) => (
                        <a key={i} href={`https://task-manegment-system-backend.onrender.com${file}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm text-indigo-400 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          Attachment {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                  <h4 className="text-sm font-semibold text-slate-400 mb-3">Upload New File</h4>
                  <form onSubmit={handleFileUpload} className="flex flex-col lg:flex-row gap-3 items-start lg:items-center w-full">
                    <div className="w-full lg:flex-1 min-w-0 overflow-hidden">
                      <input
                        type="file"
                        multiple
                        onChange={(e) => setAttachments(e.target.files)}
                        className="w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-slate-300 hover:file:bg-slate-600 transition-colors cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={updateTaskMutation.isPending || !attachments}
                      className="w-full lg:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
                    >
                      Upload Files
                    </button>
                  </form>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-4 border-b border-slate-700 pb-2">Comments & Updates</h4>
                  <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto pr-2">
                    {selectedTask.comments?.map((comment, i) => (
                      <div key={i} className="bg-slate-800 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-indigo-400">{comment.user?.name || 'User'}</span>
                          <span className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-300 text-sm">{comment.text}</p>
                      </div>
                    ))}
                    {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                      <p className="text-slate-500 italic text-sm">No comments yet.</p>
                    )}
                  </div>
                  
                  <form onSubmit={handleAddComment} className="flex flex-col sm:flex-row gap-2 w-full">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a progress update..."
                      className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    />
                    <button
                      type="submit"
                      disabled={addCommentMutation.isPending || !commentText.trim()}
                      className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shrink-0"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column - Meta & History */}
              <div className="space-y-6 min-w-0">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Update Status</label>
                    <select
                      value={selectedTask.status}
                      onChange={handleUpdateStatus}
                      className="w-full bg-slate-800 border border-indigo-500/50 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none appearance-none cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  
                  <div>
                    <span className="block text-xs font-semibold text-slate-400">Assigned By</span>
                    <span className="text-white text-sm">{selectedTask.assignedBy?.name}</span>
                  </div>
                  
                  <div>
                    <span className="block text-xs font-semibold text-slate-400">Priority</span>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold mt-1 ${
                      selectedTask.priority === 'High' ? 'bg-red-500/10 text-red-400' :
                      selectedTask.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>
                      {selectedTask.priority}
                    </span>
                  </div>

                  {selectedTask.startDate && (
                    <div>
                      <span className="block text-xs font-semibold text-slate-400">Start Date</span>
                      <span className="text-white text-sm">{new Date(selectedTask.startDate).toLocaleString()}</span>
                    </div>
                  )}

                  {selectedTask.dueDate && (
                    <div>
                      <span className="block text-xs font-semibold text-slate-400">Due Date</span>
                      <span className="text-white text-sm">{new Date(selectedTask.dueDate).toLocaleString()}</span>
                    </div>
                  )}
                  
                  {selectedTask.estimatedTimeDuration && (
                    <div>
                      <span className="block text-xs font-semibold text-slate-400">Estimated Duration</span>
                      <span className="text-white text-sm">{selectedTask.estimatedTimeDuration} Hours</span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-3 border-b border-slate-700 pb-2">Activity History</h4>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {selectedTask.history?.slice().reverse().map((log, i) => (
                      <div key={i} className="text-sm">
                        <p className="text-slate-300 break-words whitespace-normal">
                          <span className="font-medium text-slate-200">{log.user?.name || 'User'}</span> {log.action}
                        </p>
                        <span className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTasksPage;
