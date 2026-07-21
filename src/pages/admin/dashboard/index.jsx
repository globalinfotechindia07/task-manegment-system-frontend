import AnnouncementsWidget from '../../../components/AnnouncementsWidget';

const AdminDashboard = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-slate-400">Welcome to the central admin panel.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5">
          <p className="text-slate-400 text-sm font-medium mb-1">Total Users</p>
          <h3 className="text-3xl font-bold text-white">24</h3>
        </div>
        <div className="glass-panel p-5">
          <p className="text-slate-400 text-sm font-medium mb-1">Active Tasks</p>
          <h3 className="text-3xl font-bold text-white">12</h3>
        </div>
        <div className="glass-panel p-5">
          <p className="text-slate-400 text-sm font-medium mb-1">Completed Tasks</p>
          <h3 className="text-3xl font-bold text-white">89</h3>
        </div>
        <div className="glass-panel p-5">
          <p className="text-slate-400 text-sm font-medium mb-1">System Status</p>
          <h3 className="text-3xl font-bold text-green-400">Online</h3>
        </div>
      </div>


      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <AnnouncementsWidget />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
