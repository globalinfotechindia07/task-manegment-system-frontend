import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlinePlay,
  HiOutlinePause,
  HiOutlineStop,
  HiOutlineClock,
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
  HiOutlineXMark,
  HiOutlineBuildingStorefront,
  HiOutlineFire,
  HiOutlineChatBubbleLeftRight,
  HiOutlinePhone,
  HiOutlineExclamationTriangle,
  HiOutlineComputerDesktop,
  HiOutlineBriefcase,
  HiOutlinePencilSquare,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import api from '../../api/axios';

// Preset Pause Reasons
const PAUSE_REASONS = [
  { id: 'Lunch Break', label: 'Lunch Break', icon: HiOutlineBuildingStorefront },
  { id: 'Tea / Coffee Break', label: 'Tea / Coffee Break', icon: HiOutlineFire },
  { id: 'Internal Team Meeting', label: 'Internal Team Meeting', icon: HiOutlineChatBubbleLeftRight },
  { id: 'Client Discussion / Call', label: 'Client Discussion / Call', icon: HiOutlinePhone },
  { id: 'Waiting for Review / Client', label: 'Waiting for Review / Client', icon: HiOutlineExclamationTriangle },
  { id: 'System / Network Issue', label: 'System / Network Issue', icon: HiOutlineComputerDesktop },
  { id: 'Personal Emergency', label: 'Personal Emergency', icon: HiOutlineBriefcase },
  { id: 'Other Reason...', label: 'Other Reason...', icon: HiOutlinePencilSquare },
];

const formatSeconds = (totalSec) => {
  const s = Math.max(0, Math.floor(totalSec || 0));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  return `${mins}m ${secs}s`;
};

const formatShortMinutes = (mins) => {
  if (!mins || mins <= 0) return 'Open';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ''}`;
  return `${m}m`;
};

const TaskTimerSection = ({
  task,
  currentUser,
  variant = 'card', // 'card' | 'inline'
  onUpdate,
}) => {
  const queryClient = useQueryClient();
  const auth = useAuth?.() || {};
  const activeUser = currentUser || auth.user;

  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [selectedPauseReason, setSelectedPauseReason] = useState('Lunch Break');
  const [customPauseReason, setCustomPauseReason] = useState('');

  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Check assigned ownership & Admin / Manager control
  const assignedUserId = task?.assignedTo?._id
    ? task.assignedTo._id.toString()
    : task?.assignedTo
    ? task.assignedTo.toString()
    : null;

  const currentUserId = (activeUser?._id || activeUser?.id || '').toString();
  const isAssignedToMe = Boolean(assignedUserId && currentUserId && assignedUserId === currentUserId);
  const assigneeName = task?.assignedTo?.name || 'Assigned User';

  const rawRole = typeof activeUser?.role === 'object' ? activeUser?.role?.name || '' : activeUser?.role || '';
  const userRole = (rawRole || '').toLowerCase();
  const isAdminOrManager =
    userRole === 'admin' ||
    userRole === 'super admin' ||
    userRole === 'cto' ||
    userRole.includes('lead') ||
    userRole.includes('manager') ||
    Boolean(task?.assignedBy && (task.assignedBy._id || task.assignedBy).toString() === currentUserId);

  const canControl = isAssignedToMe || isAdminOrManager;

  // Active Session info
  const activeSession = task?.activeTimeSession;
  const isRunning = Boolean(activeSession && activeSession.status === 'running');
  const isPaused = Boolean(activeSession && activeSession.status === 'paused');
  const pauseReason = activeSession?.currentPauseReason || 'On Break';

  // Live Timer ticker for running session
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!activeSession) {
      setElapsedSec(0);
      return;
    }

    const calcElapsed = () => {
      const now = Date.now();
      const start = new Date(activeSession.startTime || now).getTime();
      const totalPause = (activeSession.totalPauseSeconds || 0) * 1000;
      let curPause = 0;
      if (activeSession.status === 'paused') {
        const lastPause = activeSession.pauses?.[activeSession.pauses.length - 1];
        if (lastPause?.pausedAt) {
          curPause = now - new Date(lastPause.pausedAt).getTime();
        }
      }
      const rawProductive = Math.max(0, Math.floor((now - start - totalPause - curPause) / 1000));
      setElapsedSec(rawProductive);
    };

    calcElapsed();
    const timer = setInterval(calcElapsed, 1000);
    return () => clearInterval(timer);
  }, [activeSession]);

  const refreshQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['myDailyTasks'] });
    queryClient.invalidateQueries({ queryKey: ['adminTasks'] });
    queryClient.invalidateQueries({ queryKey: ['activeTimeSession'] });
    if (typeof onUpdate === 'function') {
      onUpdate();
    }
  };

  // Start Timer
  const handleStart = async (e) => {
    e?.stopPropagation();
    if (!canControl) {
      toast.error(`Only ${assigneeName} or Admin can start this task's timer.`);
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/time-sessions/task/${task._id}/start`);
      toast.success('Work timer started!');
      refreshQueries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start timer');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Pause Modal
  const openPauseDialog = (e) => {
    e?.stopPropagation();
    if (!canControl) {
      toast.error(`Only ${assigneeName} or Admin can pause this task's timer.`);
      return;
    }
    setSelectedPauseReason('Lunch Break');
    setCustomPauseReason('');
    setIsPauseModalOpen(true);
  };

  // Confirm Pause
  const handleConfirmPause = async (e) => {
    e?.preventDefault();
    const finalReason =
      selectedPauseReason === 'Other Reason...'
        ? customPauseReason.trim()
        : customPauseReason.trim()
        ? `${selectedPauseReason} - ${customPauseReason.trim()}`
        : selectedPauseReason;

    if (!finalReason) {
      toast.error('Please specify a pause reason');
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/time-sessions/task/${task._id}/pause`, { reason: finalReason });
      toast.success(`Timer paused: ${finalReason}`);
      setIsPauseModalOpen(false);
      refreshQueries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to pause timer');
    } finally {
      setActionLoading(false);
    }
  };

  // Resume Timer
  const handleResume = async (e) => {
    e?.stopPropagation();
    if (!canControl) {
      toast.error(`Only ${assigneeName} or Admin can resume this task's timer.`);
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/time-sessions/task/${task._id}/resume`);
      toast.success('Work timer resumed!');
      refreshQueries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resume timer');
    } finally {
      setActionLoading(false);
    }
  };

  // Open End Modal
  const openEndDialog = (e) => {
    e?.stopPropagation();
    if (!canControl) {
      toast.error(`Only ${assigneeName} or Admin can end this task's timer.`);
      return;
    }
    setCompletionNotes('');
    setIsEndModalOpen(true);
  };

  // Confirm End
  const handleConfirmEnd = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    try {
      await api.post(`/time-sessions/task/${task._id}/end`, {
        completionNotes: completionNotes.trim(),
      });
      toast.success('Work timer ended & productive time saved to task!');
      setIsEndModalOpen(false);
      refreshQueries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end timer');
    } finally {
      setActionLoading(false);
    }
  };

  const targetMins =
    task?.targetDurationMinutes ||
    (task?.estimatedTimeDuration ? Math.round(task.estimatedTimeDuration * 60) : 0);

  const totalLogged = task?.totalLoggedSeconds || 0;

  // Calculate planned window duration between task startDate and dueDate
  const scheduledDuration = useMemo(() => {
    if (!task?.startDate || !task?.dueDate) return null;
    const start = new Date(task.startDate).getTime();
    const end = new Date(task.dueDate).getTime();
    const diffMs = end - start;
    if (isNaN(diffMs) || diffMs <= 0) return null;
    const totalMins = Math.round(diffMs / (1000 * 60));
    const days = Math.floor(totalMins / (60 * 24));
    const hrs = Math.floor((totalMins % (60 * 24)) / 60);
    const mins = totalMins % 60;
    let text = '';
    if (days > 0) text += `${days}d `;
    if (hrs > 0) text += `${hrs}h `;
    if (mins > 0 || !text) text += `${mins}m`;
    return {
      totalMins,
      text: text.trim(),
    };
  }, [task?.startDate, task?.dueDate]);

  // ==========================================
  // INLINE VARIANT (For Table Rows & Kanban)
  // ==========================================
  if (variant === 'inline') {
    return (
      <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
        {/* Duration / Target Display */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {scheduledDuration ? (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
              title={`Total Planned Duration: ${scheduledDuration.text} (${scheduledDuration.totalMins} mins)`}
            >
              <HiOutlineClock className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Total: {scheduledDuration.text}</span>
            </span>
          ) : null}

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <HiOutlineClock className="w-3 h-3 text-indigo-500 shrink-0" />
            <span>Target: {formatShortMinutes(targetMins)}</span>
          </span>

          {totalLogged > 0 && (
            <span className="text-[10px] font-mono text-slate-500 font-semibold">
              Logged: {formatSeconds(totalLogged)}
            </span>
          )}
        </div>

        {/* Live Status indicator */}
        {isRunning && (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Live: {formatSeconds(elapsedSec)}</span>
          </div>
        )}

        {isPaused && (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="truncate max-w-[130px]">Paused: {pauseReason}</span>
          </div>
        )}

        {/* Action Controls: Start / Pause / Resume / End */}
        {canControl ? (
          <div className="flex items-center gap-1.5 pt-1">
            {!isRunning && !isPaused && task?.status !== 'Completed' && (
              <button
                type="button"
                onClick={handleStart}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-[11px] shadow-xs transition-all cursor-pointer disabled:opacity-50"
                title="Start tracking time on this task"
              >
                <HiOutlinePlay className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Start Timer</span>
              </button>
            )}

            {task?.status === 'Completed' && !isRunning && !isPaused && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <HiOutlineCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Completed</span>
              </span>
            )}

            {isRunning && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={openPauseDialog}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Pause timer (Specify break reason)"
                >
                  <HiOutlinePause className="w-3 h-3 stroke-[2.5]" />
                  <span>Pause</span>
                </button>
                <button
                  type="button"
                  onClick={openEndDialog}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Complete work session"
                >
                  <HiOutlineStop className="w-3 h-3" />
                  <span>End</span>
                </button>
              </div>
            )}

            {isPaused && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleResume}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Resume working on this task"
                >
                  <HiOutlinePlay className="w-3 h-3" />
                  <span>Resume</span>
                </button>
                <button
                  type="button"
                  onClick={openEndDialog}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Complete work session"
                >
                  <HiOutlineStop className="w-3 h-3" />
                  <span>End</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5" title={`Assigned to ${assigneeName}`}>
            <HiOutlineLockClosed className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[120px]">{assigneeName} only</span>
          </div>
        )}

        {/* Modals for Pause & End */}
        {renderModals()}
      </div>
    );
  }

  // ==========================================
  // CARD VARIANT (For Task Details Modal)
  // ==========================================
  return (
    <div className="bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 rounded-2xl border border-indigo-100 p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
            <HiOutlineClock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Work Timer &amp; Target Timeline
            </h4>
            <p className="text-[11px] text-slate-500">
              Assigned time tracking with live pause reasons &amp; logs
            </p>
          </div>
        </div>

        {isRunning && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Live Running
          </span>
        )}
        {isPaused && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Paused ({pauseReason})
          </span>
        )}
      </div>

      {/* Target & Logged Metrics */}
      <div className={`grid gap-3 text-xs ${scheduledDuration ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'}`}>
        {scheduledDuration && (
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Total Planned Window
            </span>
            <span className="font-bold text-indigo-700 text-sm font-mono mt-0.5 block">
              {scheduledDuration.text}
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              Start to Due Date
            </span>
          </div>
        )}

        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Target Timeline
          </span>
          <span className="font-bold text-slate-900 text-sm font-mono mt-0.5 block">
            {targetMins > 0 ? `${Math.floor(targetMins / 60)}h ${targetMins % 60}m` : 'Open Stopwatch'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
            {targetMins > 0 ? `${targetMins} minutes target` : 'No time cap'}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Total Logged Time
          </span>
          <span className="font-bold text-emerald-700 text-sm font-mono mt-0.5 block">
            {formatSeconds(totalLogged)}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
            Productive work tracked
          </span>
        </div>
      </div>

      {/* Target Timeline Progress Bar */}
      {targetMins > 0 && (
        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
            <span>Timeline Progress</span>
            <span className="font-mono font-bold text-indigo-600">
              {Math.min(100, Math.round(((totalLogged + (isRunning ? elapsedSec : 0)) / (targetMins * 60)) * 100))}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.round(((totalLogged + (isRunning ? elapsedSec : 0)) / (targetMins * 60)) * 100))}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Live Timer Readout if active */}
      {(isRunning || isPaused) && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-inner">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
              {isRunning ? 'Current Active Session' : 'Current Paused Session'}
            </span>
            <div className="text-xl sm:text-2xl font-mono font-black text-white tabular-nums mt-0.5">
              {formatSeconds(elapsedSec)}
            </div>
          </div>
          {isPaused && (
            <div className="text-right">
              <span className="text-[10px] font-semibold text-amber-400 block">Pause Reason</span>
              <span className="text-xs font-bold text-white block">{pauseReason}</span>
            </div>
          )}
        </div>
      )}

      {/* ACTION BUTTONS (Assignee & Admin/Manager Control) */}
      {canControl ? (
        <div className="pt-1 space-y-2">
          {!isRunning && !isPaused ? (
            <button
              type="button"
              onClick={handleStart}
              disabled={actionLoading || task?.status === 'Completed'}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <HiOutlinePlay className="w-4 h-4 stroke-[2.5]" />
              <span>{task?.status === 'Completed' ? 'Task Completed' : 'Start Task Work Timer'}</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {isRunning ? (
                <button
                  type="button"
                  onClick={openPauseDialog}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <HiOutlinePause className="w-4 h-4 stroke-[2.5]" />
                  <span>Pause Work</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResume}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <HiOutlinePlay className="w-4 h-4 stroke-[2.5]" />
                  <span>Resume Work</span>
                </button>
              )}

              <button
                type="button"
                onClick={openEndDialog}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <HiOutlineStop className="w-4 h-4 stroke-[2.5]" />
                <span>End Session</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 justify-center text-[10px] text-indigo-700 font-medium">
            <HiOutlineShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>
              {isAssignedToMe
                ? 'Assigned to you • You have Start, Pause & End control'
                : `Assigned to ${assigneeName} • Admin / Manager control active (You can Start, Pause or End)`}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
          <HiOutlineLockClosed className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Timer Locked: </span>
            This task is assigned to <strong>{assigneeName}</strong>. Only the assigned employee or Admin has authorization to Start, Pause, or End this work timer.
          </div>
        </div>
      )}

      {renderModals()}
    </div>
  );

  // ==========================================
  // RENDER POPUP MODALS (PAUSE & END)
  // ==========================================
  function renderModals() {
    return (
      <>
        {/* PAUSE REASON MODAL */}
        {isPauseModalOpen &&
          createPortal(
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
              <div
                className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <HiOutlinePause className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Pause Work Timer</h3>
                      <p className="text-xs text-slate-500">Please select why you are pausing this task</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPauseModalOpen(false)}
                    className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-1"
                  >
                    <HiOutlineXMark className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleConfirmPause} className="p-6 space-y-4">
                  {/* Preset Reasons */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Reason for Pause <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {PAUSE_REASONS.map((r) => {
                        const Icon = r.icon;
                        const isSelected = selectedPauseReason === r.id;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setSelectedPauseReason(r.id)}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                            <span className="truncate">{r.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Note / Detail */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {selectedPauseReason === 'Other Reason...'
                        ? 'Specify Custom Reason *'
                        : 'Additional Pause Note (Optional)'}
                    </label>
                    <textarea
                      rows="2"
                      required={selectedPauseReason === 'Other Reason...'}
                      value={customPauseReason}
                      onChange={(e) => setCustomPauseReason(e.target.value)}
                      placeholder={
                        selectedPauseReason === 'Other Reason...'
                          ? 'Explain reason for taking a break...'
                          : 'e.g. quick discussion with manager, tea with team...'
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsPauseModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <HiOutlinePause className="w-4 h-4 stroke-[2.5]" />
                      <span>{actionLoading ? 'Pausing...' : 'Confirm Pause'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )}

        {/* END WORK CONFIRMATION MODAL */}
        {isEndModalOpen &&
          createPortal(
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
              <div
                className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                      <HiOutlineStop className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">End Work Session</h3>
                      <p className="text-xs text-slate-500">Log productive hours and finalize task timer</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEndModalOpen(false)}
                    className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-1"
                  >
                    <HiOutlineXMark className="w-5 h-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleConfirmEnd} className="p-6 space-y-4">
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
                    <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>
                      Productive elapsed time of <strong>{formatSeconds(elapsedSec)}</strong> will be added to this task's total logged time.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Work Summary / Completion Notes (Optional)
                    </label>
                    <textarea
                      rows="3"
                      value={completionNotes}
                      onChange={(e) => setCompletionNotes(e.target.value)}
                      placeholder="Briefly describe what you completed or accomplished in this session..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEndModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <HiOutlineStop className="w-4 h-4 stroke-[2.5]" />
                      <span>{actionLoading ? 'Ending...' : 'Confirm End Work'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )}
      </>
    );
  }
};

export default TaskTimerSection;
