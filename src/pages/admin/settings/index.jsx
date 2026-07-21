const SettingsPage = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
        <p className="text-slate-400">Configure global application settings.</p>
      </div>
      
      <div className="glass-panel p-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-white border-b border-slate-700 pb-2 mb-4">General Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">Enable Notifications</p>
                  <p className="text-slate-400 text-xs">Receive email alerts for system events.</p>
                </div>
                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                  <input type="checkbox" name="toggle" id="toggle1" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                  <label htmlFor="toggle1" className="toggle-label block overflow-hidden h-5 rounded-full bg-slate-700 cursor-pointer"></label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
