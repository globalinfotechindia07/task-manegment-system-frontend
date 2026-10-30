import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import AnnouncementsWidget from '../../../components/AnnouncementsWidget';
import {
  HiOutlineUsers,
  HiOutlineClipboardDocumentList,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineEllipsisHorizontalCircle,
  HiOutlineExclamationTriangle
} from 'react-icons/hi2';

const TeamLeadDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['team-users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return Array.isArray(data) ? data : [];
    }
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return Array.isArray(data) ? data : [];
    }
  });

  if (usersLoading || tasksLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const teamMembersCount = users?.length || 0;
  
  // Tasks stats
  let totalTasks = 0;
  let inProgressTasks = 0;
  let completedTasks = 0;
  let pendingTasks = 0;
  let overdueTasks = 0;
  
  const now = new Date();

  if (tasks) {
    totalTasks = tasks.length;
    tasks.forEach(task => {
      if (task.status === 'In Progress') inProgressTasks++;
      if (task.status === 'Completed') completedTasks++;
      if (task.status === 'Pending') pendingTasks++;
      
      if (task.dueDate && new Date(task.dueDate) < now && task.status !== 'Completed') {
        overdueTasks++;
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Operations Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back, {user?.name}. Real-time tracking of team members and deliverables.</p>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          onClick={() => navigate('/admin/users')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs border-t-4 border-t-blue-500 cursor-pointer hover:border-slate-300 hover:shadow transition-all"
        >
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Team Members</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-extrabold text-slate-900">{teamMembersCount}</h3>
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
              <HiOutlineUsers className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/admin/tasks')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs border-t-4 border-t-indigo-600 cursor-pointer hover:border-slate-300 hover:shadow transition-all"
        >
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Assigned Tasks</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-extrabold text-slate-900">{totalTasks}</h3>
            <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
              <HiOutlineClipboardDocumentList className="w-5 h-5" />
            </div>
          </div>
        </div>
        
        <div 
          onClick={() => navigate('/admin/tasks')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs border-t-4 border-t-emerald-500 cursor-pointer hover:border-slate-300 hover:shadow transition-all"
        >
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Completed Tasks</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-extrabold text-emerald-600">{completedTasks}</h3>
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
              <HiOutlineCheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/admin/tasks')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs border-t-4 border-t-amber-500 cursor-pointer hover:border-slate-300 hover:shadow transition-all"
        >
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">In Progress</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-extrabold text-amber-600">{inProgressTasks}</h3>
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
              <HiOutlineClock className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/admin/tasks')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs border-t-4 border-t-slate-400 cursor-pointer hover:border-slate-300 hover:shadow transition-all"
        >
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Pending</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-extrabold text-slate-700">{pendingTasks}</h3>
            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
              <HiOutlineEllipsisHorizontalCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/admin/tasks')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs border-t-4 border-t-rose-500 cursor-pointer hover:border-slate-300 hover:shadow transition-all"
        >
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Overdue Tasks</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-extrabold text-rose-600">{overdueTasks}</h3>
            <div className="w-9 h-9 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600">
              <HiOutlineExclamationTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col h-full">
          <div className="border-b border-slate-100 pb-3 mb-4 shrink-0">
            <h2 className="text-base font-bold text-slate-900">Recent Deliverables & Tasks</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-3">
              {tasks?.slice(0, 5).map(task => (
                <div key={task._id} className="flex items-center gap-3.5 bg-slate-50 border border-slate-200/80 p-3 rounded-xl hover:bg-slate-100/60 transition-colors">
                  <div className={`w-1.5 h-9 rounded-full shrink-0 ${
                    task.status === 'Completed' ? 'bg-emerald-500' :
                    task.status === 'In Progress' ? 'bg-indigo-600' :
                    'bg-slate-400'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">{task.title}</h4>
                    <p className="text-[11px] text-slate-500 truncate">Assigned: {task.assignedTo?.name || 'Unassigned'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                      task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      task.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                      'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
              {(!tasks || tasks.length === 0) && (
                <p className="text-slate-400 text-xs italic py-8 text-center">No recent activities found.</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <AnnouncementsWidget />
        </div>
      </div>

    </div>
  );
};

export default TeamLeadDashboard;
