import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  HiOutlineMagnifyingGlass, 
  HiOutlineClock, 
  HiOutlineEye, 
  HiOutlinePaperClip, 
  HiOutlineXMark 
} from 'react-icons/hi2';
import api from '../../../api/axios';
import { API_BASE_URL } from '../../../config';

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
        <h1 className="text-2xl font-bold text-slate-900">Daily Task Monitoring</h1>
        <p className="text-sm text-slate-500">Track and monitor tasks across the entire organization.</p>
      </div>

      {/* Search and Advanced Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="max-w-md">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Search Tasks</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by task name, user, employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
            <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Team Head</label>
            <select
              value={filterTeamHead}
              onChange={(e) => setFilterTeamHead(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="All">All Team Heads</option>
              {teamHeads.map(th => <option key={th._id} value={th._id}>{th.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="All">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Employee</label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="All">All Employees</option>
              {allEmployees.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {(isLoadingTasks || isLoadingUsers) ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No tasks match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Task Name</th>
                  <th className="px-6 py-4 font-semibold">Assigned By</th>
                  <th className="px-6 py-4 font-semibold">Assigned To</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Delay / Due</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map(task => {
                  const delay = calculateDelay(task.dueDate);
                  const isOverdue = delay && task.status !== 'Completed';

                  return (
                    <tr key={task._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 max-w-[200px] truncate" title={task.title}>{task.title}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{task.assignedBy?.name || 'Unknown'}</span>
                          <span className="text-xs text-slate-500">{task.assignedBy?.role || 'User'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{task.assignedTo?.name || 'Unknown'}</span>
                          <span className="text-xs text-slate-500">{task.assignedTo?.role || 'Employee'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          task.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          task.status === 'On Hold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isOverdue ? (
                          <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1">
                            <HiOutlineClock className="w-3.5 h-3.5" />
                            Delayed: {delay}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Deadline'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => openDetails(task)}
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 px-3 py-1 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-medium hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <HiOutlineEye className="w-3.5 h-3.5" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Details Modal (Read-Only) */}
      {isDetailsModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsDetailsModalOpen(false)}></div>
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 h-[100dvh] sm:h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedTask.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Read-only view for HR Monitoring</p>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                <HiOutlineXMark className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Details */}
              <div className="md:col-span-2 space-y-6 min-w-0">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Description</h4>
                  <p className="text-slate-800 bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm leading-relaxed break-words">{selectedTask.description}</p>
                </div>

                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Attachments</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.attachments.map((file, i) => (
                        <a key={i} href={`${API_BASE_URL}${file}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:border-indigo-300 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                          <HiOutlinePaperClip className="w-4 h-4 text-slate-400" />
                          Attachment {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-100 pb-2">Comments & Progress Updates</h4>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                    {selectedTask.comments?.map((comment, i) => (
                      <div key={i} className="bg-white p-3.5 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="font-semibold text-indigo-600 text-xs">{comment.user?.name || 'User'}</span>
                          <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-700 text-xs leading-relaxed break-words">{comment.text}</p>
                      </div>
                    ))}
                    {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                      <p className="text-slate-400 italic text-xs">No comments yet.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-100 pb-2">Daily Reports</h4>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                    {selectedTask.reports?.map((report, i) => (
                      <div key={i} className="bg-white p-3.5 rounded-xl border-l-4 border-l-emerald-500 border border-slate-200">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="font-semibold text-emerald-600 text-xs">{report.user?.name || 'User'}</span>
                          <span className="text-xs text-slate-400">{new Date(report.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-700 text-xs whitespace-pre-wrap leading-relaxed">{report.description}</p>
                      </div>
                    ))}
                    {(!selectedTask.reports || selectedTask.reports.length === 0) && (
                      <p className="text-slate-400 italic text-xs">No daily reports submitted yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Meta & History */}
              <div className="space-y-6 min-w-0">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3.5">
                  <div>
                    <span className="block text-xs font-medium text-slate-500 mb-1">Status</span>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      selectedTask.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      selectedTask.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      selectedTask.status === 'On Hold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {selectedTask.status}
                    </span>
                  </div>
                  
                  <div>
                    <span className="block text-xs font-medium text-slate-500">Assigned To</span>
                    <span className="text-slate-900 text-sm font-semibold">{selectedTask.assignedTo?.name}</span>
                  </div>
                  
                  <div>
                    <span className="block text-xs font-medium text-slate-500">Assigned By</span>
                    <span className="text-slate-900 text-sm font-semibold">{selectedTask.assignedBy?.name}</span>
                  </div>
                  
                  <div>
                    <span className="block text-xs font-medium text-slate-500 mb-1">Priority</span>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      selectedTask.priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      selectedTask.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {selectedTask.priority}
                    </span>
                  </div>

                  {selectedTask.startDate && (
                    <div>
                      <span className="block text-xs font-medium text-slate-500">Start Date</span>
                      <span className="text-slate-800 text-xs font-medium">{new Date(selectedTask.startDate).toLocaleString()}</span>
                    </div>
                  )}

                  {selectedTask.dueDate && (
                    <div>
                      <span className="block text-xs font-medium text-slate-500">Due Date</span>
                      <span className="text-slate-800 text-xs font-medium">{new Date(selectedTask.dueDate).toLocaleString()}</span>
                    </div>
                  )}
                  
                  {selectedTask.estimatedTimeDuration && (
                    <div>
                      <span className="block text-xs font-medium text-slate-500">Estimated Duration</span>
                      <span className="text-slate-800 text-xs font-medium">{selectedTask.estimatedTimeDuration} Hours</span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-100 pb-2">Activity Logs</h4>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                    {selectedTask.history?.slice().reverse().map((log, i) => (
                      <div key={i} className="text-xs border-b border-slate-100 pb-2 last:border-0">
                        <p className="text-slate-700 break-words">
                          <span className="font-semibold text-slate-900">{log.user?.name || 'User'}</span> {log.action}
                        </p>
                        <span className="text-[11px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
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