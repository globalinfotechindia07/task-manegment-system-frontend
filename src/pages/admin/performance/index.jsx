const PerformancePage = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Performance Analysis</h1>
        <p className="text-slate-400">Analyze team and individual performance metrics.</p>
      </div>
      
      <div className="glass-panel p-6">
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-1">Insufficient Data</h3>
          <p className="text-slate-400 max-w-sm">Performance metrics will populate as tasks are completed.</p>
        </div>
      </div>
    </div>
  );
};

export default PerformancePage;
