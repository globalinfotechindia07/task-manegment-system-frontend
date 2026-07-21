import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/axios';

const HRTasks = () => {
  const [filterTeamHead, setFilterTeamHead] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterUser, setFilterUser] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return data;
    }
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    }
  });

  const departments = useMemo(() => {
    const deps = new Set(users.map(u => u.department).filter(Boolean));
    return Array.from(deps);
  }, [users]);

  const teamHeads = useMemo(() => {
    return users.filter(u => u.role === 'Team Head');
  }, [users]);

  const allEmployees = useMemo(() => {
    return users.filter(u => u.role === 'User' || u.role === 'Team Head');
  }, [users]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const assignedUser = users.find(u => u._id === task.assignedTo?._id);
      
      const matchStatus = filterStatus === 'All' || task.status === filterStatus;
      const matchPriority = filterPriority === 'All' || task.priority === filterPriority;
      const matchUser = filterUser === 'All' || task.assignedTo?._id === filterUser;
      
      let matchDepartment = true;
      let matchTeamHead = true;
      let matchSearch = true;
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = task.title?.toLowerCase().includes(query);
        const assigneeMatch = task.assignedTo?.name?.toLowerCase().includes(query);
        const assignerMatch = task.assignedBy?.name?.toLowerCase().includes(query);
        matchSearch = titleMatch || assigneeMatch || assignerMatch;
      }

      if (assignedUser) {
        if (filterDepartment !== 'All' && assignedUser.department !== filterDepartment) matchDepartment = false;
        
        if (filterTeamHead !== 'All') {
          // If assignedUser is a Team Head, they match themselves. Otherwise check their teamHead field.
          if (assignedUser.role === 'Team Head' && assignedUser._id !== filterTeamHead) matchTeamHead = false;
          else if (assignedUser.role === 'User' && assignedUser.teamHead?._id !== filterTeamHead && assignedUser.teamHead !== filterTeamHead) matchTeamHead = false;
        }
      }

      return matchStatus && matchPriority && matchUser && matchDepartment && matchTeamHead && matchSearch;
    });
  }, [tasks, users, filterStatus, filterPriority, filterUser, filterDepartment, filterTeamHead, searchQuery]);

  const openDetails = (task) => {
    setSelectedTask(task);
    setIsDetailsModalOpen(true);
  };

  const calculateDelay = (dueDate) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    if (due >= now) return null;
    
    const diffHours = Math.floor((now - due) / (1000 * 60 * 60));
    if (diffHours >= 24) {
      return `${Math.floor(diffHours / 24)} days`;
    }
    return `${diffHours} hours`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Daily Task Monitoring</h1>
        <p className="text-slate-400">Track and monitor tasks across the entire organization.</p>
      </div>

      {/* Search and Advanced Filters */}
      <div className="glass-panel p-5 space-y-4">
        <div className="max-w-md">
          <label className="block text-xs font-semibold text-slate-400 mb-1">Search Tasks</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by task name, user, employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            />
            <svg className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-2 border-t border-slate-700/50">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Team Head</label>
            <select
              value={filterTeamHead}
              onChange={(e) => setFilterTeamHead(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none appearance-none"
            >
              <option value="All">All Team Heads</option>
            {teamHeads.map(th => <option key={th._id} value={th._id}>{th.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Department</label>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none appearance-none"
          >
            <option value="All">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Employee</label>
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none appearance-none"
          >
            <option value="All">All Employees</option>
            {allEmployees.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none appearance-none"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Priority</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none appearance-none"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Normal">Normal</option>
          </select>
        </div>
      </div>
      </div>

      {/* Task List */}
      <div className="glass-panel overflow-hidden">
        {(isLoadingTasks || isLoadingUsers) ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No tasks match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-slate-200 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Task Name</th>
                  <th className="px-6 py-4 font-semibold">Assigned By (User)</th>
                  <th className="px-6 py-4 font-semibold">Assigned To (Employee)</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Delay/Time</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredTasks.map(task => {
                  const delay = calculateDelay(task.dueDate);
                  const isOverdue = delay && task.status !== 'Completed';

                  return (
                    <tr key={task._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-white max-w-[200px] truncate" title={task.title}>{task.title}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-white">{task.assignedBy?.name || 'Unknown'}</span>
                          <span className="text-xs text-slate-500">{task.assignedBy?.role || 'User'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-white">{task.assignedTo?.name || 'Unknown'}</span>
                          <span className="text-xs text-slate-500">{task.assignedTo?.role || 'Employee'}</span>
                        </div>
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
                      <td className="px-6 py-4">
                        {isOverdue ? (
                          <span className="text-red-400 font-semibold bg-red-500/10 px-2 py-1 rounded-md text-xs flex items-center gap-1 w-max">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Delayed: {delay}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Deadline'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => openDetails(task)}
                          className="text-indigo-400 hover:text-indigo-300 px-3 py-1 border border-indigo-500/30 rounded hover:bg-indigo-500/10 transition-colors"
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Details Modal (Read-Only) */}
      {isDetailsModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm" onClick={() => setIsDetailsModalOpen(false)}></div>
          <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-800 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedTask.title}</h3>
                <p className="text-xs text-slate-400 mt-1">Read-only view for HR Monitoring</p>
              </div>
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
                  <p className="text-slate-200 bg-slate-800/50 p-4 rounded-lg break-words">{selectedTask.description}</p>
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

                <div>
                  <h4 className="text-sm font-semibold text-slate-400 mb-4 border-b border-slate-700 pb-2">Comments & Progress Updates</h4>
                  <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto pr-2">
                    {selectedTask.comments?.map((comment, i) => (
                      <div key={i} className="bg-slate-800 p-4 rounded-lg border border-slate-700/50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-indigo-400">{comment.user?.name || 'User'}</span>
                          <span className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-300 text-sm break-words">{comment.text}</p>
                      </div>
                    ))}
                    {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                      <p className="text-slate-500 italic text-sm">No comments yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Meta & History */}
              <div className="space-y-6 min-w-0">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-4">
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 mb-1">Status</span>
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                      selectedTask.status === 'Completed' ? 'bg-green-500/10 text-green-400' :
                      selectedTask.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400' :
                      selectedTask.status === 'On Hold' ? 'bg-orange-500/10 text-orange-400' :
                      'bg-slate-500/10 text-slate-400'
                    }`}>
                      {selectedTask.status}
                    </span>
                  </div>
                  
                  <div>
                    <span className="block text-xs font-semibold text-slate-400">Assigned To</span>
                    <span className="text-white text-sm">{selectedTask.assignedTo?.name}</span>
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
                  <h4 className="text-sm font-semibold text-slate-400 mb-3 border-b border-slate-700 pb-2">Activity Logs</h4>
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

export default HRTasks;
