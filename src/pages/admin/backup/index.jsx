import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import {
  HiOutlineServer,
  HiOutlineArrowDownTray,
  HiOutlineArrowUpTray,
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineArrowPath,
  HiOutlineDocumentText,
  HiOutlineBuildingOffice2,
  HiOutlineUsers,
  HiOutlineClock,
  HiOutlineSparkles,
  HiOutlineFolder,
  HiOutlineClipboardDocumentList,
  HiOutlineBanknotes,
  HiOutlineCalendarDays,
  HiOutlineFolderArrowDown,
  HiOutlineBookmark,
  HiOutlineXMark,
  HiOutlineArrowTrendingUp,
  HiOutlineBolt,
} from 'react-icons/hi2';

const BackupAndRestore = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const autoTriggeredRef = useRef(false);

  // States for download & restore
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [rawFileContent, setRawFileContent] = useState(null);
  const [inspectionResult, setInspectionResult] = useState(null);
  const [restoreMode, setRestoreMode] = useState('merge'); // 'merge' | 'replace'
  const [confirmText, setConfirmText] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [restoreSuccessSummary, setRestoreSuccessSummary] = useState(null);

  // Auto-backup configuration state
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [autoFrequency, setAutoFrequency] = useState('weekly');
  const [isTestingAuto, setIsTestingAuto] = useState(false);

  // ===================== QUERIES =====================

  // 1. Fetch Company Data Stats & Auto-backup status
  const {
    data: statsData,
    isLoading: loadingStats,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['backupStats'],
    queryFn: async () => {
      const { data } = await api.get('/backup/stats');
      return data;
    },
  });

  // 2. Fetch Backup & Restore Audit History
  const {
    data: historyData,
    isLoading: loadingHistory,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['backupHistory'],
    queryFn: async () => {
      const { data } = await api.get('/backup/history');
      return data?.logs || [];
    },
  });

  const company = statsData?.company || {};
  const counts = statsData?.counts || {};
  const autoConfig = statsData?.autoBackup || {};
  const lastBackupDate = statsData?.lastBackupDate || statsData?.lastBackup?.createdAt || null;
  const lastBackupAdmin = statsData?.lastBackupAdmin || statsData?.lastBackup?.userName || 'Admin';
  const lastRestore = statsData?.lastRestore;

  // Sync loaded auto-backup settings to local form
  useEffect(() => {
    if (statsData?.autoBackup) {
      setAutoEnabled(statsData.autoBackup.enabled !== false);
      setAutoFrequency(statsData.autoBackup.frequency || 'weekly');
    }
  }, [statsData]);

  // ===================== MUTATIONS =====================

  // Inspect Backup File Mutation
  const inspectMutation = useMutation({
    mutationFn: async (content) => {
      const { data } = await api.post('/backup/inspect', { backupContent: content });
      return data;
    },
    onSuccess: (data) => {
      setInspectionResult(data);
      toast.success('Backup file verified successfully! Review details below.');
    },
    onError: (err) => {
      setInspectionResult(null);
      toast.error(err.response?.data?.message || 'Failed to inspect backup file');
    },
  });

  // Restore Mutation
  const restoreMutation = useMutation({
    mutationFn: async ({ backupContent, mode, confirmText }) => {
      const { data } = await api.post('/backup/restore', {
        backupContent,
        mode,
        confirmText,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['backupStats']);
      queryClient.invalidateQueries(['backupHistory']);
      setIsConfirmModalOpen(false);
      setRestoreSuccessSummary(data.restoredSummary);
      setSelectedFile(null);
      setRawFileContent(null);
      setInspectionResult(null);
      setConfirmText('');
      toast.success('Company data successfully restored! 🎉');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to restore backup');
    },
  });

  // Update Auto-Backup Schedule Mutation
  const updateAutoConfigMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.patch('/backup/auto-config', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['backupStats']);
      toast.success('Auto-backup settings updated successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update auto-backup settings');
    },
  });

  // ===================== AUTOMATED DOWNLOAD ENGINE =====================

  // Generic Download Executor
  const executeDownload = async ({ isAuto = false, isTest = false } = {}) => {
    try {
      const response = await api.get('/backup/export', {
        params: { isAuto },
        responseType: 'blob',
      });

      const disposition = response.headers['content-disposition'];
      let filename = `${isAuto ? 'AUTO_BACKUP_' : 'COMPANY_BACKUP_'}${
        new Date().toISOString().slice(0, 10)
      }.json`;
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      queryClient.invalidateQueries(['backupStats']);
      queryClient.invalidateQueries(['backupHistory']);

      if (isTest) {
        toast.success('Test Auto-Backup: Downloaded to your local device! 💾', { duration: 5000 });
      } else if (isAuto) {
        toast.success(
          'Weekly Auto-Backup Triggered: Your company data has been automatically downloaded to your local device! 💾',
          { duration: 8000 }
        );
      } else {
        toast.success('Backup downloaded to your local device! 💾');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate backup download');
    }
  };

  // Automated Weekly / Scheduled Check on Mount
  useEffect(() => {
    if (!statsData || autoTriggeredRef.current) return;
    const cfg = statsData.autoBackup;
    if (!cfg || cfg.enabled === false) return;

    const freqDaysMap = {
      daily: 1,
      weekly: 7,
      biweekly: 14,
      monthly: 30,
    };
    const freqDays = freqDaysMap[cfg.frequency || 'weekly'] || 7;

    const lastCheck = cfg.lastAutoBackupAt || cfg.lastBackupAt;
    let shouldAutoDownload = false;

    if (!lastCheck) {
      // First time automatic backup
      shouldAutoDownload = true;
    } else {
      const diffDays = (Date.now() - new Date(lastCheck).getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays >= freqDays) {
        shouldAutoDownload = true;
      }
    }

    if (shouldAutoDownload) {
      autoTriggeredRef.current = true;
      executeDownload({ isAuto: true });
    }
  }, [statsData]);

  // Manual Download Click
  const handleDownloadBackup = async () => {
    setIsDownloading(true);
    await executeDownload({ isAuto: false });
    setIsDownloading(false);
  };

  // Test Auto-Download Click
  const handleTestAutoDownload = async () => {
    setIsTestingAuto(true);
    await executeDownload({ isAuto: true, isTest: true });
    setIsTestingAuto(false);
  };

  // Save Auto-Backup Settings
  const handleSaveAutoSettings = (newEnabled, newFreq) => {
    updateAutoConfigMutation.mutate({
      enabled: newEnabled !== undefined ? newEnabled : autoEnabled,
      frequency: newFreq !== undefined ? newFreq : autoFrequency,
    });
  };

  // Process Uploaded File
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file) => {
    if (!file.name.toLowerCase().endsWith('.json')) {
      toast.error('Please select a valid .json backup file');
      return;
    }

    setSelectedFile(file);
    setRestoreSuccessSummary(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setRawFileContent(content);
      inspectMutation.mutate(content);
    };
    reader.onerror = () => {
      toast.error('Error reading the selected file');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleInitiateRestore = () => {
    if (!rawFileContent || !inspectionResult) {
      toast.error('Please inspect a valid backup file first');
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmRestore = () => {
    if (restoreMode === 'replace' && confirmText.trim() !== 'RESTORE') {
      toast.error('Please type RESTORE exactly to proceed with replacement');
      return;
    }

    restoreMutation.mutate({
      backupContent: rawFileContent,
      mode: restoreMode,
      confirmText: confirmText.trim(),
    });
  };

  // Relative Backup Age Calculation
  const getBackupAgeInfo = (dateStr) => {
    if (!dateStr) {
      return {
        badge: 'No Backup Yet',
        relative: 'Never backed up',
        pillClass: 'bg-rose-50 text-rose-700 border-rose-300',
        isWarning: true,
      };
    }
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) {
      return {
        badge: 'Backed Up Today',
        relative: `${diffHours === 0 ? 'Just now' : `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`}`,
        pillClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        isWarning: false,
      };
    }
    if (diffDays < 7) {
      return {
        badge: `${diffDays} Day${diffDays > 1 ? 's' : ''} Ago`,
        relative: `Backed up ${diffDays} day${diffDays > 1 ? 's' : ''} ago`,
        pillClass: 'bg-blue-50 text-blue-800 border-blue-300',
        isWarning: false,
      };
    }
    return {
      badge: 'Backup Recommended',
      relative: `Over ${diffDays} days old`,
      pillClass: 'bg-amber-50 text-amber-800 border-amber-300',
      isWarning: true,
    };
  };

  const backupAge = getBackupAgeInfo(lastBackupDate);

  // Next Auto-Backup Due Date Calculation
  const getNextAutoBackupDue = () => {
    const freqDaysMap = { daily: 1, weekly: 7, biweekly: 14, monthly: 30 };
    const intervalDays = freqDaysMap[autoFrequency] || 7;
    const baseDate = autoConfig.lastAutoBackupAt || autoConfig.lastBackupAt || lastBackupDate;
    if (!baseDate) return 'Due upon your next login';
    const nextDate = new Date(new Date(baseDate).getTime() + intervalDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    if (nextDate <= now) return 'Due today (will auto-download)';
    const remainingDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `${nextDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} (in ${remainingDays} day${remainingDays > 1 ? 's' : ''})`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* ========================================================
          1. TOP APP BAR: BRANDING & QUICK ACTIONS
          ======================================================== */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25">
            <HiOutlineServer className="w-8 h-8 stroke-[1.8]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Company Data Backup & Restore
              </h1>
              {company.name && (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 shadow-2xs">
                  <HiOutlineBuildingOffice2 className="w-3.5 h-3.5" />
                  {company.name}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Export full company database snapshot to your device or safely restore previous backups anytime.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            refetchStats();
            refetchHistory();
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer self-start md:self-auto shrink-0"
          title="Refresh statistics"
        >
          <HiOutlineArrowPath className="w-4 h-4 text-slate-500" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* ========================================================
          2. PROMINENT "LAST BACKUP DATE & HEALTH STATUS" BANNER
          ======================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl shadow-xs ${
              lastBackupDate ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {lastBackupDate ? '💾' : '⚠️'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Last Company Backup Date:
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${backupAge.pillClass}`}>
                {backupAge.badge}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {lastBackupDate ? (
                  new Date(lastBackupDate).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                ) : (
                  <span className="text-rose-600">No backup taken yet</span>
                )}
              </h2>
              {lastBackupDate && (
                <span className="text-xs text-slate-500 font-medium">
                  • {backupAge.relative} {lastBackupAdmin && `(by ${lastBackupAdmin})`}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadBackup}
          disabled={isDownloading || loadingStats}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25 transition active:scale-95 cursor-pointer shrink-0"
        >
          {isDownloading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Downloading...</span>
            </>
          ) : (
            <>
              <HiOutlineArrowDownTray className="w-4 h-4 stroke-[2.5]" />
              <span>Download Backup Now</span>
            </>
          )}
        </button>
      </div>

      {/* ========================================================
          3. AUTOMATIC LOCAL BACKUP SCHEDULER (WEEKLY AUTO-DOWNLOAD)
          ======================================================== */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-5 border border-indigo-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-amber-400 flex items-center justify-center shrink-0 text-xl shadow-inner">
              <HiOutlineBolt className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Automatic Weekly Backup to Local Device
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {autoEnabled ? 'ACTIVE' : 'PAUSED'}
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Automatically downloads full JSON backup directly to this device every week without manual work.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 self-start md:self-auto">
            <span className="text-xs font-bold text-indigo-100">Auto-Download:</span>
            <button
              type="button"
              onClick={() => {
                const nextVal = !autoEnabled;
                setAutoEnabled(nextVal);
                handleSaveAutoSettings(nextVal, autoFrequency);
              }}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                autoEnabled ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform shadow-md ${
                  autoEnabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Schedule Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Frequency Selector */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 block">
              Download Frequency
            </span>
            <select
              value={autoFrequency}
              onChange={(e) => {
                const val = e.target.value;
                setAutoFrequency(val);
                handleSaveAutoSettings(autoEnabled, val);
              }}
              disabled={!autoEnabled}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-800/90 text-white border border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer disabled:opacity-50"
            >
              <option value="weekly">📅 Every Week (7 Days) • Recommended</option>
              <option value="daily">⚡ Every Day (Daily Snapshot)</option>
              <option value="biweekly">📆 Every 2 Weeks (14 Days)</option>
              <option value="monthly">🗓️ Every Month (30 Days)</option>
            </select>
          </div>

          {/* Next Auto-Download Due */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 block">
              Next Scheduled Auto-Download
            </span>
            <p className="text-sm font-black text-amber-300 font-mono">
              {autoEnabled ? getNextAutoBackupDue() : 'Disabled'}
            </p>
            <p className="text-[10px] text-indigo-200/60">
              Triggered automatically when Admin opens the software.
            </p>
          </div>

          {/* Test Auto-Download Button */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 block mb-1">
              Verify Local Download
            </span>
            <button
              type="button"
              onClick={handleTestAutoDownload}
              disabled={isTestingAuto || isDownloading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 transition active:scale-95 shadow-md shadow-amber-500/25 cursor-pointer disabled:opacity-50"
            >
              {isTestingAuto ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  <span>Downloading Test...</span>
                </>
              ) : (
                <>
                  <HiOutlineArrowDownTray className="w-4 h-4 stroke-[2.5]" />
                  <span>Test Auto-Download Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. LIVE DATABASE RECORD COUNTS METRIC TILES
          ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          { label: 'Staff / Users', count: counts.users || 0, icon: HiOutlineUsers, color: 'text-blue-600 bg-blue-50 border-blue-200' },
          { label: 'Projects', count: counts.projects || 0, icon: HiOutlineFolder, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
          { label: 'Tasks & Sprints', count: (counts.tasks || 0) + (counts.sprints || 0), icon: HiOutlineClipboardDocumentList, color: 'text-violet-600 bg-violet-50 border-violet-200' },
          { label: 'Attendance', count: counts.attendance || 0, icon: HiOutlineCalendarDays, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
          { label: 'Payroll Slips', count: counts.payroll || 0, icon: HiOutlineBanknotes, color: 'text-amber-600 bg-amber-50 border-amber-200' },
          { label: 'Employee Docs', count: counts.documents || 0, icon: HiOutlineFolderArrowDown, color: 'text-rose-600 bg-rose-50 border-rose-200' },
          { label: 'Timer Sessions', count: counts.timeSessions || 0, icon: HiOutlineClock, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
          { label: 'Sticky Notes', count: counts.stickyNotes || 0, icon: HiOutlineBookmark, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
          { label: 'CRM & Clients', count: (counts.customers || 0) + (counts.leads || 0) + (counts.deals || 0), icon: HiOutlineBuildingOffice2, color: 'text-teal-600 bg-teal-50 border-teal-200' },
          { label: 'Holidays', count: counts.holidays || 0, icon: HiOutlineSparkles, color: 'text-orange-600 bg-orange-50 border-orange-200' },
          { label: 'Offer Letters', count: counts.offerLetters || 0, icon: HiOutlineDocumentText, color: 'text-slate-700 bg-slate-100 border-slate-300' },
          { label: 'Total Records', count: counts.total || 0, icon: HiOutlineServer, color: 'text-slate-900 bg-slate-900 text-white border-slate-900', isTotal: true },
        ].map((item, idx) => (
          <div
            key={idx}
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
              item.isTotal
                ? 'bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-slate-800 shadow-md'
                : 'bg-white border-slate-200/80 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${item.color}`}>
                <item.icon className="w-4 h-4" />
              </span>
              <span
                className={`text-lg sm:text-xl font-black font-mono ${
                  item.isTotal ? 'text-amber-400' : 'text-slate-900'
                }`}
              >
                {loadingStats ? '...' : item.count.toLocaleString()}
              </span>
            </div>
            <p
              className={`text-[11px] font-bold truncate ${
                item.isTotal ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              {item.label}
            </p>
          </div>
        ))}
      </div>

      {/* ========================================================
          5. TWO COLUMN MAIN INTERACTION: EXPORT vs RESTORE
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ==================== LEFT: EXPORT BACKUP ==================== */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 flex flex-col justify-between min-h-[460px]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-2xs shrink-0">
                <HiOutlineArrowDownTray className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">1. Download Company Backup</h2>
                <p className="text-xs text-slate-500">
                  Export complete company data into a portable, structured JSON archive file.
                </p>
              </div>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs text-slate-700">
              <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <HiOutlineShieldCheck className="w-4 h-4 text-emerald-600" />
                What is included in your backup?
              </p>
              <ul className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  All Employees & Staff Profiles
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Projects, Sprints & Tasks
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Daily Attendance & Policies
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Payroll & Salary Slips
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Dynamic Documents & KYC
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Time Tracker Sessions & Logs
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  3D Sticky Notes & Alerts
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Holidays, Leaves & Roles
                </li>
              </ul>
            </div>

            {/* Last Backup Summary */}
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between text-xs text-indigo-950">
              <span className="flex items-center gap-1.5 font-medium">
                <HiOutlineClock className="w-4 h-4 text-indigo-600" />
                Last Saved Backup:
              </span>
              <span className="font-bold">
                {lastBackupDate
                  ? new Date(lastBackupDate).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : 'Never'}
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={handleDownloadBackup}
              disabled={isDownloading || loadingStats}
              className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-black bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating Backup File...</span>
                </>
              ) : (
                <>
                  <HiOutlineArrowDownTray className="w-5 h-5 stroke-[2.5]" />
                  <span>Download Full Company Backup (.JSON)</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-2 font-medium">
              Save this JSON file in a safe location or cloud drive for disaster recovery.
            </p>
          </div>
        </div>

        {/* ==================== RIGHT: UPLOAD & RESTORE BACKUP ==================== */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 flex flex-col justify-between min-h-[460px]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-2xs shrink-0">
                <HiOutlineArrowUpTray className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">2. Upload & Restore Backup</h2>
                <p className="text-xs text-slate-500">
                  Select a previous backup JSON file to inspect and restore records into your company.
                </p>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition cursor-pointer group min-h-[180px]"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-indigo-100 text-slate-500 group-hover:text-indigo-600 flex items-center justify-center text-xl mb-2.5 transition">
                  <HiOutlineDocumentText className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  Click to select backup file, or drag and drop
                </p>
                <p className="text-xs text-slate-400 mt-1">Accepts standard ERP JSON backup files (.json)</p>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl shrink-0">
                      <HiOutlineDocumentText className="w-5 h-5" />
                    </span>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 truncate">{selectedFile.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB • JSON File
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setRawFileContent(null);
                      setInspectionResult(null);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                    title="Remove file"
                  >
                    <HiOutlineXMark className="w-4 h-4" />
                  </button>
                </div>

                {inspectMutation.isPending ? (
                  <div className="py-6 flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-slate-600 font-medium">Verifying backup schema & integrity...</p>
                  </div>
                ) : inspectionResult ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Backup Company</span>
                        <span className="font-extrabold text-slate-800 truncate block">
                          {inspectionResult.backupCompany?.name}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Backup Date</span>
                        <span className="font-extrabold text-slate-800 truncate block">
                          {inspectionResult.exportTimestamp
                            ? new Date(inspectionResult.exportTimestamp).toLocaleDateString()
                            : 'Unknown'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                        Users: {inspectionResult.counts?.users || 0}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        Projects: {inspectionResult.counts?.projects || 0}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-100 text-violet-800">
                        Tasks: {inspectionResult.counts?.tasks || 0}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Attendance: {inspectionResult.counts?.attendance || 0}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                        Salary: {inspectionResult.counts?.salarySlips || 0}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">
                        Docs: {inspectionResult.counts?.employeeDocuments || 0}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 text-white font-mono">
                        Total: {inspectionResult.totalRecords || 0}
                      </span>
                    </div>

                    {inspectionResult.warnings?.length > 0 && (
                      <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                        {inspectionResult.warnings.map((w, i) => (
                          <p key={i} className="flex items-start gap-1.5 text-[11px] font-medium">
                            <HiOutlineExclamationTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span>{w}</span>
                          </p>
                        ))}
                      </div>
                    )}

                    <div className="pt-2">
                      <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1.5">
                        Choose Restore Mode:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <label
                          className={`p-2.5 rounded-xl border cursor-pointer text-xs transition flex flex-col justify-between ${
                            restoreMode === 'merge'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <input
                              type="radio"
                              name="restoreMode"
                              value="merge"
                              checked={restoreMode === 'merge'}
                              onChange={() => setRestoreMode('merge')}
                              className="accent-emerald-600"
                            />
                            <span>Merge & Update</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-normal mt-1">
                            Safe mode: keeps existing data, inserts missing.
                          </span>
                        </label>

                        <label
                          className={`p-2.5 rounded-xl border cursor-pointer text-xs transition flex flex-col justify-between ${
                            restoreMode === 'replace'
                              ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <input
                              type="radio"
                              name="restoreMode"
                              value="replace"
                              checked={restoreMode === 'replace'}
                              onChange={() => setRestoreMode('replace')}
                              className="accent-rose-600"
                            />
                            <span>Complete Replace</span>
                          </div>
                          <span className="text-[10px] text-rose-600 font-normal mt-1">
                            Clears existing data & replaces with snapshot.
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={handleInitiateRestore}
              disabled={!inspectionResult || restoreMutation.isPending}
              className={`w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-black text-white shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer ${
                restoreMode === 'replace'
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 shadow-rose-600/30'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-600/30'
              }`}
            >
              <HiOutlineArrowUpTray className="w-5 h-5 stroke-[2.5]" />
              <span>Restore Backup into Company</span>
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-2 font-medium">
              Data will be mapped directly to your active company database.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          6. SUCCESS RESTORE SUMMARY BANNER
          ======================================================== */}
      {restoreSuccessSummary && (
        <div className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-3xl p-6 shadow-xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl">
                ✅
              </div>
              <div>
                <h3 className="text-base font-black">Data Restoration Completed Successfully!</h3>
                <p className="text-xs text-white/80">
                  All records have been mapped and loaded into your company database.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRestoreSuccessSummary(null)}
              className="p-1 rounded-lg text-white/70 hover:text-white cursor-pointer"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            {Object.entries(restoreSuccessSummary).map(([key, val]) => (
              <span key={key} className="px-3 py-1 rounded-xl bg-white/20 font-bold backdrop-blur-xs">
                {key}: {val}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          7. RECENT BACKUP & RESTORE AUDIT LOGS
          ======================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-sm font-bold">
              📜
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                Backup & Restore Audit History
              </h3>
              <p className="text-[11px] text-slate-500">
                Recent exports, auto-downloads and restores performed by company administrators.
              </p>
            </div>
          </div>
        </div>

        {loadingHistory ? (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : historyData.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">
            No backup or restore activities recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Admin</th>
                  <th className="py-2.5 px-3">Details</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyData.map((log) => {
                  const isExport = log.action === 'EXPORT_BACKUP';
                  const isAuto = log.action === 'AUTO_BACKUP_DOWNLOAD';
                  return (
                    <tr key={log._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isAuto
                              ? 'bg-amber-50 text-amber-800 border border-amber-300'
                              : isExport
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isAuto ? '⚡ AUTO DOWNLOAD' : isExport ? '💾 EXPORT' : '🔄 RESTORE'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-bold whitespace-nowrap">
                        {log.userName || log.userEmail || 'Admin'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-[11px] max-w-md truncate">
                        {log.details || 'Standard company backup operation'}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          8. MODAL: SAFETY CONFIRMATION BEFORE RESTORATION
          ======================================================== */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 ${
                  restoreMode === 'replace'
                    ? 'bg-rose-100 text-rose-700 border border-rose-300'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                }`}
              >
                {restoreMode === 'replace' ? '⚠️' : '🛡️'}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {restoreMode === 'replace' ? 'Confirm Complete Data Replacement' : 'Confirm Data Merge & Restore'}
                </h3>
                <p className="text-xs text-slate-500">Target Company: {company.name}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              {restoreMode === 'replace' ? (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 space-y-1.5 font-medium">
                  <p className="font-black text-rose-950 flex items-center gap-1.5">
                    <HiOutlineExclamationTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    High Impact Action:
                  </p>
                  <p className="text-[11px]">
                    This will delete all existing operational records (tasks, attendance, payroll, documents, sticky notes) for{' '}
                    <strong>{company.name}</strong> and replace them entirely with the uploaded backup snapshot.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-1 font-medium">
                  <p className="font-bold">Safe Merge Mode Selected:</p>
                  <p className="text-[11px]">
                    Existing records will be preserved. Any new users, projects, tasks, attendance, and documents will be imported cleanly.
                  </p>
                </div>
              )}

              {restoreMode === 'replace' && (
                <div className="space-y-1 pt-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Type <span className="font-mono text-rose-700 font-black">RESTORE</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="RESTORE"
                    className="w-full px-3 py-2 rounded-xl border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-xs font-bold text-rose-950 bg-rose-50/40"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={
                  restoreMutation.isPending ||
                  (restoreMode === 'replace' && confirmText.trim() !== 'RESTORE')
                }
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md disabled:opacity-50 cursor-pointer transition ${
                  restoreMode === 'replace'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {restoreMutation.isPending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Restoring Database...</span>
                  </>
                ) : (
                  <>
                    <HiOutlineCheckCircle className="w-4 h-4" />
                    <span>Confirm & Execute Restore</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupAndRestore;
