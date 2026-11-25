import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import useViewMode from '../../../hooks/useViewMode';
import {
  HiOutlinePlus,
  HiOutlineBellAlert,
  HiOutlineClock,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineCheckCircle,
  HiOutlineCheck,
  HiOutlinePaperAirplane,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineArrowPath,
  HiOutlineSparkles,
  HiOutlinePaintBrush,
  HiOutlineSquares2X2,
  HiOutlineCursorArrowRays,
  HiOutlineSquare3Stack3D,
  HiOutlineSwatch,
} from 'react-icons/hi2';

// ==========================================
// 8 Authentic Vibrant Pastel Card Themes
// ==========================================
const STICKY_THEMES = {
  yellow: {
    id: 'yellow',
    name: 'Canary Yellow',
    bg: 'bg-gradient-to-br from-[#fefce8] to-[#fef08a]',
    rawBg: '#fef08a',
    cardBorder: 'border-amber-300',
    defaultText: '#713f12',
    pinColor: '#ef4444',
    pinBg: 'bg-rose-500 shadow-rose-300',
    dot: 'bg-amber-400',
  },
  pink: {
    id: 'pink',
    name: 'Rose Pink',
    bg: 'bg-gradient-to-br from-[#fdf2f8] to-[#fce7f3]',
    rawBg: '#fce7f3',
    cardBorder: 'border-rose-300',
    defaultText: '#831843',
    pinColor: '#6366f1',
    pinBg: 'bg-indigo-500 shadow-indigo-300',
    dot: 'bg-rose-400',
  },
  blue: {
    id: 'blue',
    name: 'Sky Blue',
    bg: 'bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe]',
    rawBg: '#e0f2fe',
    cardBorder: 'border-sky-300',
    defaultText: '#0c4a6e',
    pinColor: '#f59e0b',
    pinBg: 'bg-amber-500 shadow-amber-300',
    dot: 'bg-sky-400',
  },
  green: {
    id: 'green',
    name: 'Mint Green',
    bg: 'bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7]',
    rawBg: '#dcfce7',
    cardBorder: 'border-emerald-300',
    defaultText: '#14532d',
    pinColor: '#ec4899',
    pinBg: 'bg-rose-500 shadow-rose-300',
    dot: 'bg-emerald-400',
  },
  purple: {
    id: 'purple',
    name: 'Lavender',
    bg: 'bg-gradient-to-br from-[#faf5ff] to-[#f3e8ff]',
    rawBg: '#f3e8ff',
    cardBorder: 'border-purple-300',
    defaultText: '#581c87',
    pinColor: '#10b981',
    pinBg: 'bg-emerald-500 shadow-emerald-300',
    dot: 'bg-purple-400',
  },
  orange: {
    id: 'orange',
    name: 'Warm Peach',
    bg: 'bg-gradient-to-br from-[#fff7ed] to-[#ffedd5]',
    rawBg: '#ffedd5',
    cardBorder: 'border-orange-300',
    defaultText: '#7c2d12',
    pinColor: '#0284c7',
    pinBg: 'bg-sky-500 shadow-sky-300',
    dot: 'bg-orange-400',
  },
  teal: {
    id: 'teal',
    name: 'Seafoam Teal',
    bg: 'bg-gradient-to-br from-[#f0fdfa] to-[#ccfbf1]',
    rawBg: '#ccfbf1',
    cardBorder: 'border-teal-300',
    defaultText: '#134e4a',
    pinColor: '#f43f5e',
    pinBg: 'bg-rose-500 shadow-rose-300',
    dot: 'bg-teal-400',
  },
  white: {
    id: 'white',
    name: 'Pearl White',
    bg: 'bg-gradient-to-br from-[#ffffff] to-[#f8fafc]',
    rawBg: '#ffffff',
    cardBorder: 'border-slate-300',
    defaultText: '#0f172a',
    pinColor: '#334155',
    pinBg: 'bg-slate-700 shadow-slate-300',
    dot: 'bg-white border border-slate-300',
  },
};

// ==========================================
// 6 Fancy & Stylish Typography Options
// ==========================================
const FONT_STYLES = {
  caveat: {
    id: 'caveat',
    name: 'Casual Pen',
    fontFamily: "'Caveat', cursive, sans-serif",
    fontSizeClass: 'text-base sm:text-lg leading-snug',
    titleSizeClass: 'text-lg sm:text-xl font-bold tracking-tight',
    sample: 'Handwritten Pen',
  },
  kalam: {
    id: 'kalam',
    name: 'Diary Script',
    fontFamily: "'Kalam', cursive, sans-serif",
    fontSizeClass: 'text-xs sm:text-sm leading-relaxed',
    titleSizeClass: 'text-sm sm:text-base font-bold',
    sample: 'Casual Diary',
  },
  marker: {
    id: 'marker',
    name: 'Bold Marker',
    fontFamily: "'Permanent Marker', cursive, Impact, sans-serif",
    fontSizeClass: 'text-xs sm:text-sm leading-normal tracking-wide',
    titleSizeClass: 'text-sm sm:text-base font-extrabold',
    sample: 'Marker Pen',
  },
  typewriter: {
    id: 'typewriter',
    name: 'Typewriter',
    fontFamily: "'Courier Prime', 'Courier New', Courier, monospace",
    fontSizeClass: 'text-xs leading-relaxed',
    titleSizeClass: 'text-xs sm:text-sm font-bold',
    sample: 'Typewriter Memo',
  },
  playfair: {
    id: 'playfair',
    name: 'Classic Serif',
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSizeClass: 'text-xs sm:text-sm leading-relaxed italic',
    titleSizeClass: 'text-sm sm:text-base font-bold not-italic',
    sample: 'Editorial Serif',
  },
  quicksand: {
    id: 'quicksand',
    name: 'Clean Modern',
    fontFamily: "'Quicksand', -apple-system, sans-serif",
    fontSizeClass: 'text-xs sm:text-sm leading-relaxed font-semibold',
    titleSizeClass: 'text-sm sm:text-base font-bold',
    sample: 'Rounded Sans',
  },
};

// ==========================================
// 8 Font / Ink Color Options
// ==========================================
const TEXT_COLORS = [
  { id: '#0f172a', name: 'Ink Charcoal', hex: '#0f172a', bgClass: 'bg-slate-900' },
  { id: '#1e3a8a', name: 'Royal Navy', hex: '#1e3a8a', bgClass: 'bg-blue-900' },
  { id: '#9f1239', name: 'Deep Crimson', hex: '#9f1239', bgClass: 'bg-rose-800' },
  { id: '#065f46', name: 'Emerald Forest', hex: '#065f46', bgClass: 'bg-emerald-800' },
  { id: '#581c87', name: 'Royal Purple', hex: '#581c87', bgClass: 'bg-purple-900' },
  { id: '#78350f', name: 'Warm Cocoa', hex: '#78350f', bgClass: 'bg-amber-900' },
  { id: '#9a3412', name: 'Burnt Rust', hex: '#9a3412', bgClass: 'bg-orange-800' },
  { id: '#475569', name: 'Slate Gray', hex: '#475569', bgClass: 'bg-slate-600' },
];

// ==========================================
// 4 Realistic 3D Board Background Themes
// ==========================================
const BOARD_THEMES = {
  corkboard: {
    id: 'corkboard',
    name: '🪵 Corkboard Desk',
    bgStyle: {
      backgroundColor: '#c99667',
      backgroundImage: `
        radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 60%),
        radial-gradient(#ab784e 15%, transparent 16%),
        radial-gradient(#b88255 15%, transparent 16%)
      `,
      backgroundSize: '100% 100%, 22px 22px, 22px 22px',
      backgroundPosition: '0 0, 0 0, 11px 11px',
    },
    borderClass: 'border-8 border-[#7a4837] shadow-[inset_0_4px_16px_rgba(0,0,0,0.35)]',
    label: 'Corkboard',
  },
  blueprint: {
    id: 'blueprint',
    name: '📐 Blueprint Grid',
    bgStyle: {
      backgroundColor: '#0f172a',
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px),
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
      `,
      backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
    },
    borderClass: 'border-2 border-slate-700 shadow-[inset_0_2px_12px_rgba(0,0,0,0.4)]',
    label: 'Blueprint',
  },
  slate: {
    id: 'slate',
    name: '🖥️ Dark Slate Studio',
    bgStyle: {
      backgroundColor: '#1e293b',
      backgroundImage: `radial-gradient(rgba(255,255,255,0.12) 1.2px, transparent 1.2px)`,
      backgroundSize: '24px 24px',
    },
    borderClass: 'border border-slate-700 shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)]',
    label: 'Dark Slate',
  },
  whiteboard: {
    id: 'whiteboard',
    name: '📄 Soft Whiteboard',
    bgStyle: {
      backgroundColor: '#f8fafc',
      backgroundImage: `radial-gradient(#cbd5e1 1.2px, transparent 1.2px)`,
      backgroundSize: '22px 22px',
    },
    borderClass: 'border border-slate-200/90 shadow-inner',
    label: 'Whiteboard',
  },
};

// Constant Card Size on Canvas
const CARD_WIDTH = 280;
const CARD_HEIGHT = 280;

const StickyNotesPage = () => {
  const queryClient = useQueryClient();
  const boardRef = useRef(null);

  // View Mode: 'canvas' (Free-form 3D Desk) vs 'grid' (Organized 3D Grid) (cached in localStorage)
  const [viewMode, setViewMode] = useViewMode('sticky_notes_view', 'canvas');
  // Board Theme
  const [boardTheme, setBoardTheme] = useState('corkboard');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'pinned' | 'reminders' | 'completed'
  const [selectedColor, setSelectedColor] = useState('all');

  // Local positions cache for real-time smooth drag without query refetch lag
  const [localPositions, setLocalPositions] = useState({});

  // Active dragging state
  const [draggingNoteId, setDraggingNoteId] = useState(null);
  const dragRef = useRef({
    noteId: null,
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
    hasMoved: false,
  });

  // Highest z-index tracker for note elevation
  const [highestZIndex, setHighestZIndex] = useState(10);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInitialPosition, setCreateInitialPosition] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [reminderModalNote, setReminderModalNote] = useState(null);
  const [stylePopoverNoteId, setStylePopoverNoteId] = useState(null);
  const [createModalTab, setCreateModalTab] = useState('note');
  const [editModalTab, setEditModalTab] = useState('note');

  // New Note Form State
  const [newForm, setNewForm] = useState({
    title: '',
    content: '',
    color: 'yellow',
    fontStyle: 'caveat',
    textColor: '#0f172a',
    tags: '',
    priority: 'Medium',
    isPinned: false,
    reminderDate: '',
    reminderTime: '',
    sendEmailReminder: true,
    sendInAppReminder: true,
  });

  // Edit Note Form State
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    color: 'yellow',
    fontStyle: 'caveat',
    textColor: '#0f172a',
    tags: '',
    priority: 'Medium',
    reminderDate: '',
    reminderTime: '',
    sendEmailReminder: true,
    sendInAppReminder: true,
  });

  // Reminder Quick Modal State
  const [reminderForm, setReminderForm] = useState({
    date: '',
    time: '',
    sendEmailReminder: true,
    sendInAppReminder: true,
  });

  // ===================== QUERIES =====================
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['stickyNotes', searchTerm, selectedColor, filterType],
    queryFn: async () => {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedColor !== 'all') params.color = selectedColor;
      if (filterType === 'pinned') params.isPinned = 'true';
      if (filterType === 'reminders') params.hasReminder = 'true';
      if (filterType === 'completed') params.isCompleted = 'true';

      const { data } = await api.get('/sticky-notes', { params });
      return data;
    },
  });

  const notes = data?.notes || [];
  const stats = data?.stats || { total: 0, pinned: 0, withReminders: 0, completed: 0 };

  // Sync server positions to local state on initial data load
  useEffect(() => {
    if (notes.length > 0) {
      setLocalPositions((prev) => {
        const next = { ...prev };
        let maxZ = highestZIndex;

        notes.forEach((note, idx) => {
          if (!next[note._id]) {
            // If note has saved coordinates in DB, use them; otherwise space out in grid
            const col = idx % 4;
            const row = Math.floor(idx / 4);
            const defaultX = 30 + col * (CARD_WIDTH + 26);
            const defaultY = 30 + row * (CARD_HEIGHT + 26);
            const defaultRot = (idx % 5 === 0 ? -2.2 : idx % 5 === 1 ? 1.8 : idx % 5 === 2 ? -1.2 : idx % 5 === 3 ? 2.5 : 0);

            next[note._id] = {
              x: typeof note.position?.x === 'number' ? note.position.x : defaultX,
              y: typeof note.position?.y === 'number' ? note.position.y : defaultY,
              zIndex: typeof note.position?.zIndex === 'number' ? note.position.zIndex : 2,
              rotation: typeof note.position?.rotation === 'number' ? note.position.rotation : defaultRot,
            };
            if (next[note._id].zIndex > maxZ) {
              maxZ = next[note._id].zIndex;
            }
          }
        });
        setHighestZIndex(maxZ);
        return next;
      });
    }
  }, [notes]);

  // ===================== MUTATIONS =====================

  // Create Note Mutation
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/sticky-notes', payload);
      return data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(['stickyNotes']);
      setIsCreateModalOpen(false);
      setCreateInitialPosition(null);
      setNewForm({
        title: '',
        content: '',
        color: 'yellow',
        fontStyle: 'caveat',
        textColor: '#0f172a',
        tags: '',
        priority: 'Medium',
        isPinned: false,
        reminderDate: '',
        reminderTime: '',
        sendEmailReminder: true,
        sendInAppReminder: true,
      });
      toast.success('Sticky note stuck on 3D board! 📌');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create sticky note');
    },
  });

  // Update Note Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.put(`/sticky-notes/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stickyNotes']);
      setEditingNote(null);
      setReminderModalNote(null);
      toast.success('Sticky note updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update note');
    },
  });

  // Update Single Note Position Mutation (Free-form Drag & Drop)
  const updatePositionMutation = useMutation({
    mutationFn: async ({ id, x, y, zIndex, rotation }) => {
      const { data } = await api.patch(`/sticky-notes/${id}/position`, { x, y, zIndex, rotation });
      return data;
    },
    onError: (err) => {
      console.error('Failed to persist note position:', err);
    },
  });

  // Batch Positions Update (e.g. Tidy Up / Auto Arrange)
  const updateBatchPositionsMutation = useMutation({
    mutationFn: async (positions) => {
      const { data } = await api.patch('/sticky-notes/batch-positions', { positions });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stickyNotes']);
      toast.success('Board tidied up and neatly arranged! ✨');
    },
    onError: (err) => {
      toast.error('Failed to arrange board');
    },
  });

  // Quick Style Update Mutation
  const updateStyleMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.patch(`/sticky-notes/${id}/style`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stickyNotes']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error updating style');
    },
  });

  // Toggle Pin Mutation
  const pinMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.patch(`/sticky-notes/${id}/pin`);
      return data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(['stickyNotes']);
      toast.success(res.message);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to pin note');
    },
  });

  // Toggle Complete Mutation
  const completeMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.patch(`/sticky-notes/${id}/complete`);
      return data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(['stickyNotes']);
      toast.success(res.message);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error toggling completion');
    },
  });

  // Delete Note Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/sticky-notes/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stickyNotes']);
      toast.success('Sticky note removed');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete note');
    },
  });

  // Instant Test Alert Mutation
  const testReminderMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/sticky-notes/${id}/test-reminder`);
      return data;
    },
    onSuccess: (res) => {
      toast.success(res.message, { duration: 5000 });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to dispatch test alert');
    },
  });

  // ===================== DRAG & DROP ENGINE =====================

  // Start dragging a note
  const handlePointerDown = (e, noteId) => {
    // Only drag with primary pointer button
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Check if click was inside an interactive control (input, button, popover)
    const targetTag = e.target.tagName?.toLowerCase();
    if (['button', 'input', 'textarea', 'select', 'a'].includes(targetTag) || e.target.closest('button')) {
      return;
    }

    const currentPos = localPositions[noteId] || { x: 30, y: 30, zIndex: 1, rotation: 0 };
    const nextZ = highestZIndex + 1;
    setHighestZIndex(nextZ);

    // Update zIndex immediately to bring note in front of others
    setLocalPositions((prev) => ({
      ...prev,
      [noteId]: {
        ...currentPos,
        zIndex: nextZ,
      },
    }));

    dragRef.current = {
      noteId,
      startX: e.clientX,
      startY: e.clientY,
      initX: currentPos.x,
      initY: currentPos.y,
      hasMoved: false,
    };

    setDraggingNoteId(noteId);

    // Capture pointer events on the target element
    if (e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (err) {
        // Fallback
      }
    }

    // Attach document listeners for smooth dragging outside element bounds
    const onPointerMove = (moveEvt) => {
      if (!dragRef.current.noteId) return;

      const dx = moveEvt.clientX - dragRef.current.startX;
      const dy = moveEvt.clientY - dragRef.current.startY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragRef.current.hasMoved = true;
      }

      // Constrain inside board bounds if boardRef exists
      const boardWidth = boardRef.current ? boardRef.current.clientWidth : 2000;
      const boardHeight = boardRef.current ? boardRef.current.clientHeight : 1200;

      const clampedX = Math.max(10, Math.min(boardWidth - CARD_WIDTH - 10, dragRef.current.initX + dx));
      const clampedY = Math.max(10, Math.min(boardHeight - CARD_HEIGHT - 10, dragRef.current.initY + dy));

      setLocalPositions((prev) => ({
        ...prev,
        [noteId]: {
          ...prev[noteId],
          x: clampedX,
          y: clampedY,
          zIndex: nextZ,
        },
      }));
    };

    const onPointerUp = (upEvt) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      const activeId = dragRef.current.noteId;
      const moved = dragRef.current.hasMoved;
      setDraggingNoteId(null);
      dragRef.current.noteId = null;

      if (activeId && moved) {
        // Persist final position to DB
        setLocalPositions((prev) => {
          const finalPos = prev[activeId];
          if (finalPos) {
            updatePositionMutation.mutate({
              id: activeId,
              x: finalPos.x,
              y: finalPos.y,
              zIndex: finalPos.zIndex,
              rotation: finalPos.rotation,
            });
          }
          return prev;
        });
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Tidy Up / Auto Arrange all notes into a neat geometric array
  const handleTidyUp = () => {
    if (notes.length === 0) return;

    const boardWidth = boardRef.current ? boardRef.current.clientWidth : 1200;
    const cols = Math.max(1, Math.floor((boardWidth - 40) / (CARD_WIDTH + 24)));

    const nextPositions = {};
    const batchList = [];

    notes.forEach((note, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = 30 + col * (CARD_WIDTH + 24);
      const y = 30 + row * (CARD_HEIGHT + 24);
      // Subtle natural tilt for tactile 3D feel
      const rotation = idx % 4 === 0 ? -1.5 : idx % 4 === 1 ? 1.5 : idx % 4 === 2 ? -0.8 : 1.2;
      const zIndex = idx + 1;

      nextPositions[note._id] = { x, y, zIndex, rotation };
      batchList.push({ id: note._id, x, y, zIndex, rotation });
    });

    setLocalPositions(nextPositions);
    updateBatchPositionsMutation.mutate(batchList);
  };

  // Double Click on board canvas to create note at exact position
  const handleBoardDoubleClick = (e) => {
    // Only if clicking directly on the canvas desk
    if (e.target !== boardRef.current && !e.target.classList.contains('board-desk-surface')) {
      return;
    }

    const rect = boardRef.current.getBoundingClientRect();
    const clickX = Math.max(10, Math.min(rect.width - CARD_WIDTH - 20, e.clientX - rect.left - CARD_WIDTH / 2));
    const clickY = Math.max(10, Math.min(rect.height - CARD_HEIGHT - 20, e.clientY - rect.top - 40));

    setCreateInitialPosition({ x: clickX, y: clickY, zIndex: highestZIndex + 1 });
    setIsCreateModalOpen(true);
  };

  // Open Create Modal from top button
  const handleOpenCreate = () => {
    setCreateInitialPosition(null);
    setCreateModalTab('note');
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (note) => {
    setEditingNote(note);
    setEditModalTab('note');

    let rDate = '';
    let rTime = '';
    if (note.reminderAt) {
      const d = new Date(note.reminderAt);
      rDate = d.toISOString().split('T')[0];
      rTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    setEditForm({
      title: note.title || '',
      content: note.content || '',
      color: note.color || 'yellow',
      fontStyle: note.fontStyle || 'caveat',
      textColor: note.textColor || '#0f172a',
      tags: Array.isArray(note.tags) ? note.tags.join(', ') : '',
      priority: note.priority || 'Medium',
      isPinned: Boolean(note.isPinned),
      reminderDate: rDate,
      reminderTime: rTime,
      sendEmailReminder: note.sendEmailReminder !== false,
      sendInAppReminder: note.sendInAppReminder !== false,
    });
  };

  // Open Quick Reminder Modal
  const handleOpenReminderModal = (note) => {
    setReminderModalNote(note);
    let rDate = '';
    let rTime = '';
    if (note.reminderAt) {
      const d = new Date(note.reminderAt);
      rDate = d.toISOString().split('T')[0];
      rTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } else {
      const inOneHour = new Date(Date.now() + 60 * 60 * 1000);
      rDate = inOneHour.toISOString().split('T')[0];
      rTime = `${String(inOneHour.getHours()).padStart(2, '0')}:${String(inOneHour.getMinutes()).padStart(2, '0')}`;
    }

    setReminderForm({
      date: rDate,
      time: rTime,
      sendEmailReminder: note.sendEmailReminder !== false,
      sendInAppReminder: note.sendInAppReminder !== false,
    });
  };

  // Submit New Note
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newForm.content.trim()) {
      toast.error('Note content is required');
      return;
    }

    let reminderAt = null;
    if (newForm.reminderDate) {
      const timePart = newForm.reminderTime || '09:00';
      reminderAt = new Date(`${newForm.reminderDate}T${timePart}`);
    }

    const payload = {
      title: newForm.title,
      content: newForm.content,
      color: newForm.color,
      fontStyle: newForm.fontStyle,
      textColor: newForm.textColor,
      isPinned: newForm.isPinned,
      tags: newForm.tags,
      priority: newForm.priority,
      reminderAt,
      sendEmailReminder: newForm.sendEmailReminder,
      sendInAppReminder: newForm.sendInAppReminder,
      position: createInitialPosition
        ? {
            x: createInitialPosition.x,
            y: createInitialPosition.y,
            zIndex: createInitialPosition.zIndex || highestZIndex + 1,
            rotation: (Math.random() * 4 - 2),
          }
        : {
            x: 40 + (notes.length % 4) * 280,
            y: 40 + Math.floor(notes.length / 4) * 290,
            zIndex: highestZIndex + 1,
            rotation: (Math.random() * 4 - 2),
          },
    };

    createMutation.mutate(payload);
  };

  // Submit Edit
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editForm.content.trim()) {
      toast.error('Note content is required');
      return;
    }

    let reminderAt = null;
    if (editForm.reminderDate) {
      const timePart = editForm.reminderTime || '09:00';
      reminderAt = new Date(`${editForm.reminderDate}T${timePart}`);
    }

    updateMutation.mutate({
      id: editingNote._id,
      payload: {
        title: editForm.title,
        content: editForm.content,
        color: editForm.color,
        fontStyle: editForm.fontStyle,
        textColor: editForm.textColor,
        isPinned: editForm.isPinned,
        tags: editForm.tags,
        priority: editForm.priority,
        reminderAt,
        sendEmailReminder: editForm.sendEmailReminder,
        sendInAppReminder: editForm.sendInAppReminder,
      },
    });
  };

  // Submit Quick Reminder
  const handleSaveReminderModal = (e) => {
    e.preventDefault();
    if (!reminderForm.date) {
      toast.error('Date is required');
      return;
    }

    const timePart = reminderForm.time || '09:00';
    const reminderAt = new Date(`${reminderForm.date}T${timePart}`);

    updateMutation.mutate({
      id: reminderModalNote._id,
      payload: {
        reminderAt,
        sendEmailReminder: reminderForm.sendEmailReminder,
        sendInAppReminder: reminderForm.sendInAppReminder,
      },
    });
  };

  // Preset reminder helper
  const applyReminderPreset = (minutesFromNow, targetFormSetter) => {
    const target = new Date(Date.now() + minutesFromNow * 60 * 1000);
    const dateStr = target.toISOString().split('T')[0];
    const timeStr = `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')}`;
    targetFormSetter((prev) => ({ ...prev, reminderDate: dateStr, reminderTime: timeStr }));
  };

  const currentTheme = BOARD_THEMES[boardTheme] || BOARD_THEMES.corkboard;

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto select-none">
      {/* ========================================================
          1. TOP APP BAR: TITLE, STATS, ACTIONS & VIEW SWITCHER
          ======================================================== */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Branding & Tagline */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/25">
            <HiOutlineSquare3Stack3D className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                3D Sticky Notes Studio
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 font-mono shadow-2xs">
                {stats.total || 0} Notes
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Move & stick notes freely anywhere on the 3D desk board with fancy fonts & email alerts.
            </p>
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dual View Mode: 3D Free Desk vs 3D Grid */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-bold shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('canvas')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'canvas'
                  ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Free-form 3D Canvas (Drag notes anywhere on desk)"
            >
              <HiOutlineCursorArrowRays className="w-4 h-4 text-amber-600" />
              <span>3D Free Desk</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Organized 3D Grid Mode"
            >
              <HiOutlineSquares2X2 className="w-4 h-4 text-indigo-600" />
              <span>3D Grid</span>
            </button>
          </div>

          {/* Canvas Board Theme Picker */}
          <div className="relative inline-flex items-center">
            <select
              value={boardTheme}
              onChange={(e) => setBoardTheme(e.target.value)}
              className="pl-3 pr-8 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
              title="Change 3D Board Background Theme"
            >
              <option value="corkboard">🪵 Corkboard Desk</option>
              <option value="blueprint">📐 Blueprint Grid</option>
              <option value="slate">🖥️ Dark Slate Studio</option>
              <option value="whiteboard">📄 Soft Whiteboard</option>
            </select>
          </div>

          {/* Tidy Up / Auto Arrange (Visible in Canvas mode) */}
          {viewMode === 'canvas' && (
            <button
              type="button"
              onClick={handleTidyUp}
              disabled={updateBatchPositionsMutation.isPending || notes.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-50"
              title="Auto arrange all notes neatly in rows and columns"
            >
              <HiOutlineSparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Tidy Up</span>
            </button>
          )}

          {/* Primary Action Button: "+ Stick It" */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white shadow-md shadow-amber-500/30 transition-all cursor-pointer"
          >
            <HiOutlinePlus className="w-4 h-4 stroke-[3]" />
            <span>+ Stick Note</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          2. FILTER & COLOR TOOLBAR
          ======================================================== */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes by keyword, title, tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
          {[
            { id: 'all', label: `All (${stats.total || 0})` },
            { id: 'pinned', label: `📌 Pinned (${stats.pinned || 0})` },
            { id: 'reminders', label: `🔔 Alerts (${stats.withReminders || 0})` },
            { id: 'completed', label: `✅ Done (${stats.completed || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                filterType === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {/* Color filter dots */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <button
              type="button"
              onClick={() => setSelectedColor('all')}
              className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer ${
                selectedColor === 'all' ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              All
            </button>
            {Object.values(STICKY_THEMES).map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => setSelectedColor(th.id)}
                className={`w-4 h-4 rounded-full ${th.dot} transition cursor-pointer ${
                  selectedColor === th.id ? 'ring-2 ring-slate-800 scale-125 shadow-xs' : 'opacity-65 hover:opacity-100'
                }`}
                title={th.name}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            title="Refresh Board"
          >
            <HiOutlineArrowPath className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================
          3. 3D BOARD CANVAS / GRID CONTAINER
          ======================================================== */}
      <div
        ref={boardRef}
        onDoubleClick={viewMode === 'canvas' ? handleBoardDoubleClick : undefined}
        style={currentTheme.bgStyle}
        className={`board-desk-surface relative rounded-3xl ${currentTheme.borderClass} transition-all duration-300 min-h-[740px] sm:min-h-[820px] overflow-hidden`}
      >
        {/* Helper Watermark / Guide in Free Desk Mode */}
        {viewMode === 'canvas' && (
          <div className="absolute top-3 right-4 pointer-events-none select-none z-0 text-right opacity-30">
            <p className="text-[11px] font-black tracking-widest uppercase text-black/70">
              3D Interactive Desk
            </p>
            <p className="text-[10px] font-medium text-black/60">
              Drag notes anywhere • Double click empty space to stick
            </p>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-[3px] border-amber-300 border-t-amber-600 rounded-full animate-spin shadow-md" />
            <p className="text-xs font-bold text-slate-700 bg-white/80 px-3 py-1 rounded-full shadow-2xs backdrop-blur-xs">
              Loading 3D Sticky Notes...
            </p>
          </div>
        ) : notes.length === 0 ? (
          /* Empty State */
          <div className="py-24 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-3xl bg-amber-100/90 border-2 border-amber-300 text-amber-700 flex items-center justify-center text-4xl shadow-xl mb-4 animate-bounce">
              📌
            </div>
            <h3 className="text-lg font-black text-slate-900 bg-white/85 backdrop-blur-xs px-4 py-1 rounded-xl shadow-xs">
              Your Desk is Clean & Ready!
            </h3>
            <p className="text-xs text-slate-600 max-w-sm mt-2 bg-white/70 backdrop-blur-xs p-2 rounded-xl">
              Double click anywhere on the desk or click "+ Stick Note" to add your first 3D realistic sticky note.
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-4 px-6 py-2.5 rounded-xl text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-white shadow-lg transition active:scale-95 cursor-pointer"
            >
              + Stick Note Now
            </button>
          </div>
        ) : viewMode === 'canvas' ? (
          /* ========================================================
             FREE-FORM 3D DESK CANVAS (MOVE NOTES ANYWHERE)
             ======================================================== */
          <div className="w-full h-full min-h-[740px] sm:min-h-[820px] relative">
            {notes.map((note, index) => {
              const theme = STICKY_THEMES[note.color] || STICKY_THEMES.yellow;
              const font = FONT_STYLES[note.fontStyle] || FONT_STYLES.caveat;
              const textColor = note.textColor || theme.defaultText;
              const hasReminder = Boolean(note.reminderAt);
              const isReminderPast = hasReminder && new Date(note.reminderAt) <= new Date();

              const pos = localPositions[note._id] || {
                x: 30 + (index % 4) * (CARD_WIDTH + 24),
                y: 30 + Math.floor(index / 4) * (CARD_HEIGHT + 24),
                zIndex: 2,
                rotation: index % 4 === 0 ? -1.8 : index % 4 === 1 ? 1.5 : index % 4 === 2 ? -1.0 : 2.0,
              };

              const isDragging = draggingNoteId === note._id;
              const isStylePopoverOpen = stylePopoverNoteId === note._id;

              return (
                <div
                  key={note._id}
                  onPointerDown={(e) => handlePointerDown(e, note._id)}
                  style={{
                    position: 'absolute',
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    width: `${CARD_WIDTH}px`,
                    minHeight: `${CARD_HEIGHT}px`,
                    zIndex: isDragging ? 9999 : pos.zIndex || 2,
                    transform: `perspective(1000px) rotate(${isDragging ? 0 : pos.rotation}deg) scale(${
                      isDragging ? 1.06 : 1
                    })`,
                    transition: isDragging
                      ? 'none'
                      : 'transform 0.16s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.16s ease-out',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    touchAction: 'none',
                    boxShadow: isDragging
                      ? '0 28px 45px -8px rgba(0, 0, 0, 0.35), 0 16px 20px -8px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0,0,0,0.08)'
                      : '0 12px 22px -5px rgba(0, 0, 0, 0.16), 0 6px 10px -4px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0,0,0,0.1)',
                  }}
                  className={`${theme.bg} ${theme.cardBorder} border-2 rounded-2xl p-4 relative flex flex-col justify-between group select-none`}
                >
                  {/* Realistic 3D Pushpin on top center */}
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 pointer-events-none select-none z-10 flex flex-col items-center">
                    <div
                      className={`w-5 h-5 rounded-full border border-white/80 shadow-md flex items-center justify-center relative transition-transform ${
                        isDragging ? 'scale-110' : ''
                      }`}
                      style={{
                        background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${theme.pinColor} 55%, #1f2937 100%)`,
                        boxShadow: '0 4px 8px rgba(0,0,0,0.35), inset 0 -2px 3px rgba(0,0,0,0.4)',
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white/70 absolute top-0.5 left-1 blur-[0.2px]" />
                    </div>
                    {/* Shadow cast beneath pin */}
                    <div className="w-2.5 h-1 bg-black/25 rounded-full blur-[1px] -mt-0.5" />
                  </div>

                  {/* 3D Folded Dog-Ear Corner at bottom-right */}
                  <div className="absolute bottom-0 right-0 w-6 h-6 overflow-hidden pointer-events-none rounded-br-2xl">
                    <div className="absolute bottom-0 right-0 w-0 h-0 border-solid border-t-[20px] border-l-[20px] border-r-0 border-b-0 border-t-black/15 border-l-transparent" />
                    <div
                      className="absolute bottom-0 right-0 w-5 h-5 shadow-[-2px_-2px_4px_rgba(0,0,0,0.18)]"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(203,213,225,0.45) 100%)',
                        clipPath: 'polygon(0 100%, 100% 0, 100% 100%)',
                      }}
                    />
                  </div>

                  {/* Card Header Bar */}
                  <div className="flex items-center justify-between gap-1.5 pb-2 pt-1 border-b border-black/8">
                    {/* Pin to Top Button */}
                    <button
                      type="button"
                      onClick={() => pinMutation.mutate(note._id)}
                      className={`transition cursor-pointer p-1 rounded-lg ${
                        note.isPinned
                          ? 'text-amber-700 scale-125 font-bold bg-amber-300/60 shadow-xs'
                          : 'text-black/30 hover:text-black/80 hover:bg-black/5'
                      }`}
                      title={note.isPinned ? 'Unpin Note' : 'Pin to Top'}
                    >
                      📌
                    </button>

                    {/* Font Style Badge preview */}
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/5 text-black/65 cursor-pointer hover:bg-black/10 transition"
                      style={{ fontFamily: font.fontFamily }}
                      onClick={() => setStylePopoverNoteId(isStylePopoverOpen ? null : note._id)}
                      title="Click to customize font style & colors"
                    >
                      {font.name}
                    </span>

                    {/* Complete Checkbox */}
                    <button
                      type="button"
                      onClick={() => completeMutation.mutate(note._id)}
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition cursor-pointer ${
                        note.isCompleted
                          ? 'bg-emerald-600 border-emerald-700 text-white shadow-2xs'
                          : 'border-black/35 hover:border-black/65 bg-white/70'
                      }`}
                      title={note.isCompleted ? 'Mark as Active' : 'Mark as Completed'}
                    >
                      {note.isCompleted && <HiOutlineCheck className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  </div>

                  {/* Card Body with Fancy Typography */}
                  <div className="py-2 flex-1 overflow-hidden">
                    {note.title && (
                      <h3
                        className={`${font.titleSizeClass} mb-1 line-clamp-2 ${
                          note.isCompleted ? 'line-through opacity-60' : ''
                        }`}
                        style={{
                          fontFamily: font.fontFamily,
                          color: textColor,
                        }}
                      >
                        {note.title}
                      </h3>
                    )}

                    <p
                      className={`${font.fontSizeClass} whitespace-pre-wrap line-clamp-5 ${
                        note.isCompleted ? 'line-through opacity-50' : ''
                      }`}
                      style={{
                        fontFamily: font.fontFamily,
                        color: textColor,
                      }}
                    >
                      {note.content}
                    </p>

                    {/* Tags */}
                    {Array.isArray(note.tags) && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {note.tags.slice(0, 3).map((t, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/5 text-black/75 truncate max-w-[100px]"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Reminder & Action Icons */}
                  <div className="pt-2 mt-1 border-t border-black/8 space-y-1.5">
                    {/* Reminder Status Pill */}
                    {hasReminder ? (
                      <div
                        className={`flex items-center justify-between text-[11px] font-bold px-2 py-1 rounded-lg border ${
                          isReminderPast
                            ? 'bg-slate-200/90 text-slate-700 border-slate-300'
                            : 'bg-white/95 text-indigo-950 border-indigo-200 shadow-2xs'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          {isReminderPast ? (
                            <HiOutlineClock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          ) : (
                            <HiOutlineBellAlert className="w-3.5 h-3.5 text-indigo-600 animate-pulse shrink-0" />
                          )}
                          <span className="truncate">
                            {new Date(note.reminderAt).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </span>

                        <button
                          type="button"
                          onClick={() => handleOpenReminderModal(note)}
                          className="text-[10px] text-indigo-600 hover:underline shrink-0 ml-1 cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenReminderModal(note)}
                        className="w-full text-center py-1 rounded-lg border border-dashed border-black/20 hover:border-black/45 text-[10px] font-bold text-black/60 hover:text-black/90 transition cursor-pointer bg-white/40"
                      >
                        + Set Date & Time Alert
                      </button>
                    )}

                    {/* Bottom Actions Bar */}
                    <div className="flex items-center justify-between pt-0.5 relative">
                      {/* Style Button */}
                      <button
                        type="button"
                        onClick={() => setStylePopoverNoteId(isStylePopoverOpen ? null : note._id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer border ${
                          isStylePopoverOpen
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white/75 hover:bg-white text-black/75 border-black/15 shadow-2xs'
                        }`}
                        title="Customize Card Color, Font Style & Font Color"
                      >
                        <HiOutlinePaintBrush className="w-3 h-3 text-indigo-600" />
                        <span>Style</span>
                      </button>

                      {/* Right icons: Test Alert, Edit, Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => testReminderMutation.mutate(note._id)}
                          disabled={testReminderMutation.isPending}
                          className="p-1 rounded text-black/45 hover:text-indigo-700 hover:bg-black/5 transition cursor-pointer"
                          title="Test Reminder Now (Sends in-app alert & company email)"
                        >
                          <HiOutlinePaperAirplane className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(note)}
                          className="p-1 rounded text-black/45 hover:text-black/90 hover:bg-black/5 transition cursor-pointer"
                          title="Edit Note"
                        >
                          <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Delete this sticky note?')) {
                              deleteMutation.mutate(note._id);
                            }
                          }}
                          className="p-1 rounded text-black/45 hover:text-rose-600 hover:bg-black/5 transition cursor-pointer"
                          title="Delete Note"
                        >
                          <HiOutlineTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Popover Menu for In-Place Styling */}
                      {isStylePopoverOpen && (
                        <div className="absolute bottom-9 left-0 z-50 w-64 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-3 space-y-2.5 animate-fadeIn text-left cursor-default">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                            <span className="text-[11px] font-black text-slate-800">Card Appearance</span>
                            <button
                              type="button"
                              onClick={() => setStylePopoverNoteId(null)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                            >
                              <HiOutlineXMark className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* 1. Card Background Color */}
                          <div>
                            <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                              Card Color (8)
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {Object.values(STICKY_THEMES).map((th) => (
                                <button
                                  key={th.id}
                                  type="button"
                                  onClick={() =>
                                    updateStyleMutation.mutate({
                                      id: note._id,
                                      payload: { color: th.id },
                                    })
                                  }
                                  className={`w-5 h-5 rounded-full ${th.dot} transition cursor-pointer border ${
                                    note.color === th.id
                                      ? 'ring-2 ring-indigo-600 scale-110 shadow-sm'
                                      : 'opacity-75 hover:opacity-100'
                                  }`}
                                  title={th.name}
                                />
                              ))}
                            </div>
                          </div>

                          {/* 2. Font Style */}
                          <div>
                            <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                              Font Style (6)
                            </span>
                            <div className="grid grid-cols-2 gap-1">
                              {Object.values(FONT_STYLES).map((fs) => (
                                <button
                                  key={fs.id}
                                  type="button"
                                  onClick={() =>
                                    updateStyleMutation.mutate({
                                      id: note._id,
                                      payload: { fontStyle: fs.id },
                                    })
                                  }
                                  className={`px-2 py-1 rounded-lg text-xs font-semibold text-left transition cursor-pointer border truncate ${
                                    (note.fontStyle || 'caveat') === fs.id
                                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs font-bold'
                                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                  }`}
                                  style={{ fontFamily: fs.fontFamily }}
                                >
                                  {fs.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 3. Font Ink Color */}
                          <div>
                            <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                              Font Color (8)
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {TEXT_COLORS.map((tc) => (
                                <button
                                  key={tc.id}
                                  type="button"
                                  onClick={() =>
                                    updateStyleMutation.mutate({
                                      id: note._id,
                                      payload: { textColor: tc.hex },
                                    })
                                  }
                                  className={`w-5 h-5 rounded-full ${tc.bgClass} transition cursor-pointer border ${
                                    (note.textColor || theme.defaultText) === tc.hex
                                      ? 'ring-2 ring-indigo-500 scale-110 shadow-sm'
                                      : 'opacity-80 hover:opacity-100'
                                  }`}
                                  title={tc.name}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ========================================================
             ORGANIZED 3D GRID MODE
             ======================================================== */
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
              {/* "+ Stick Note" Card */}
              <button
                type="button"
                onClick={handleOpenCreate}
                className="bg-white/80 hover:bg-amber-50/95 border-2 border-dashed border-amber-400 rounded-2xl p-6 shadow-md hover:shadow-2xl transition-all duration-200 flex flex-col items-center justify-center text-center group min-h-[260px] cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 border border-amber-300 flex items-center justify-center text-2xl group-hover:scale-110 transition shadow-xs mb-3">
                  📌
                </div>
                <h3 className="text-base font-extrabold text-amber-950 group-hover:text-amber-800">
                  + Stick It!
                </h3>
                <p className="text-xs text-amber-900/80 mt-1 max-w-[190px]">
                  Click to jot down a new note with fancy fonts and custom colors.
                </p>
              </button>

              {/* Grid cards */}
              {notes.map((note, index) => {
                const theme = STICKY_THEMES[note.color] || STICKY_THEMES.yellow;
                const font = FONT_STYLES[note.fontStyle] || FONT_STYLES.caveat;
                const textColor = note.textColor || theme.defaultText;
                const hasReminder = Boolean(note.reminderAt);
                const isReminderPast = hasReminder && new Date(note.reminderAt) <= new Date();
                const isStylePopoverOpen = stylePopoverNoteId === note._id;
                const rotationClass = index % 3 === 0 ? '-rotate-1' : index % 3 === 1 ? 'rotate-1' : 'rotate-0';

                return (
                  <div
                    key={note._id}
                    className={`${theme.bg} ${theme.cardBorder} border-2 rounded-2xl p-4.5 shadow-md hover:shadow-2xl transition-all duration-200 relative flex flex-col justify-between group ${rotationClass} hover:rotate-0 hover:scale-[1.025] min-h-[260px]`}
                    style={{
                      boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    {/* Realistic 3D Pushpin on top center */}
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 pointer-events-none select-none z-10 flex flex-col items-center">
                      <div
                        className="w-5 h-5 rounded-full border border-white/80 shadow-md flex items-center justify-center relative"
                        style={{
                          background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${theme.pinColor} 55%, #1f2937 100%)`,
                          boxShadow: '0 4px 8px rgba(0,0,0,0.35), inset 0 -2px 3px rgba(0,0,0,0.4)',
                        }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white/70 absolute top-0.5 left-1 blur-[0.2px]" />
                      </div>
                      <div className="w-2.5 h-1 bg-black/25 rounded-full blur-[1px] -mt-0.5" />
                    </div>

                    {/* 3D Folded Dog-Ear Corner at bottom-right */}
                    <div className="absolute bottom-0 right-0 w-6 h-6 overflow-hidden pointer-events-none rounded-br-2xl">
                      <div className="absolute bottom-0 right-0 w-0 h-0 border-solid border-t-[20px] border-l-[20px] border-r-0 border-b-0 border-t-black/15 border-l-transparent" />
                      <div
                        className="absolute bottom-0 right-0 w-5 h-5 shadow-[-2px_-2px_4px_rgba(0,0,0,0.18)]"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(203,213,225,0.45) 100%)',
                          clipPath: 'polygon(0 100%, 100% 0, 100% 100%)',
                        }}
                      />
                    </div>

                    {/* Card Header Bar */}
                    <div className="flex items-center justify-between gap-1.5 pb-2 pt-1 border-b border-black/8">
                      <button
                        type="button"
                        onClick={() => pinMutation.mutate(note._id)}
                        className={`transition cursor-pointer p-1 rounded-lg ${
                          note.isPinned
                            ? 'text-amber-700 scale-125 font-bold bg-amber-300/60 shadow-xs'
                            : 'text-black/30 hover:text-black/80 hover:bg-black/5'
                        }`}
                        title={note.isPinned ? 'Unpin Note' : 'Pin to Top'}
                      >
                        📌
                      </button>

                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/5 text-black/65 cursor-pointer hover:bg-black/10 transition"
                        style={{ fontFamily: font.fontFamily }}
                        onClick={() => setStylePopoverNoteId(isStylePopoverOpen ? null : note._id)}
                        title="Click to customize font style & colors"
                      >
                        {font.name}
                      </span>

                      <button
                        type="button"
                        onClick={() => completeMutation.mutate(note._id)}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition cursor-pointer ${
                          note.isCompleted
                            ? 'bg-emerald-600 border-emerald-700 text-white shadow-2xs'
                            : 'border-black/35 hover:border-black/65 bg-white/70'
                        }`}
                        title={note.isCompleted ? 'Mark as Active' : 'Mark as Completed'}
                      >
                        {note.isCompleted && <HiOutlineCheck className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    </div>

                    {/* Card Body */}
                    <div className="py-2.5 flex-1">
                      {note.title && (
                        <h3
                          className={`${font.titleSizeClass} mb-1.5 ${
                            note.isCompleted ? 'line-through opacity-60' : ''
                          }`}
                          style={{
                            fontFamily: font.fontFamily,
                            color: textColor,
                          }}
                        >
                          {note.title}
                        </h3>
                      )}

                      <p
                        className={`${font.fontSizeClass} whitespace-pre-wrap ${
                          note.isCompleted ? 'line-through opacity-50' : ''
                        }`}
                        style={{
                          fontFamily: font.fontFamily,
                          color: textColor,
                        }}
                      >
                        {note.content}
                      </p>

                      {Array.isArray(note.tags) && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {note.tags.map((t, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/5 text-black/75"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="pt-2 mt-2 border-t border-black/8 space-y-1.5">
                      {hasReminder ? (
                        <div
                          className={`flex items-center justify-between text-[11px] font-bold px-2 py-1 rounded-lg border ${
                            isReminderPast
                              ? 'bg-slate-200/90 text-slate-700 border-slate-300'
                              : 'bg-white/95 text-indigo-950 border-indigo-200 shadow-2xs'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            {isReminderPast ? (
                              <HiOutlineClock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            ) : (
                              <HiOutlineBellAlert className="w-3.5 h-3.5 text-indigo-600 animate-pulse shrink-0" />
                            )}
                            <span className="truncate">
                              {new Date(note.reminderAt).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleOpenReminderModal(note)}
                            className="text-[10px] text-indigo-600 hover:underline shrink-0 ml-1 cursor-pointer"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenReminderModal(note)}
                          className="w-full text-center py-1 rounded-lg border border-dashed border-black/20 hover:border-black/45 text-[10px] font-bold text-black/60 hover:text-black/90 transition cursor-pointer bg-white/40"
                        >
                          + Set Date & Time Alert
                        </button>
                      )}

                      <div className="flex items-center justify-between pt-0.5 relative">
                        <button
                          type="button"
                          onClick={() => setStylePopoverNoteId(isStylePopoverOpen ? null : note._id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer border ${
                            isStylePopoverOpen
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-white/75 hover:bg-white text-black/75 border-black/15 shadow-2xs'
                          }`}
                        >
                          <HiOutlinePaintBrush className="w-3 h-3 text-indigo-600" />
                          <span>Style</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => testReminderMutation.mutate(note._id)}
                            disabled={testReminderMutation.isPending}
                            className="p-1 rounded text-black/45 hover:text-indigo-700 hover:bg-black/5 transition cursor-pointer"
                            title="Test Reminder Now"
                          >
                            <HiOutlinePaperAirplane className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(note)}
                            className="p-1 rounded text-black/45 hover:text-black/90 hover:bg-black/5 transition cursor-pointer"
                            title="Edit Note"
                          >
                            <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Delete this sticky note?')) {
                                deleteMutation.mutate(note._id);
                              }
                            }}
                            className="p-1 rounded text-black/45 hover:text-rose-600 hover:bg-black/5 transition cursor-pointer"
                            title="Delete Note"
                          >
                            <HiOutlineTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Popover Menu */}
                        {isStylePopoverOpen && (
                          <div className="absolute bottom-9 left-0 z-50 w-64 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-3 space-y-2.5 animate-fadeIn text-left">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                              <span className="text-[11px] font-black text-slate-800">Card Appearance</span>
                              <button
                                type="button"
                                onClick={() => setStylePopoverNoteId(null)}
                                className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                              >
                                <HiOutlineXMark className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div>
                              <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                                Card Color (8)
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {Object.values(STICKY_THEMES).map((th) => (
                                  <button
                                    key={th.id}
                                    type="button"
                                    onClick={() =>
                                      updateStyleMutation.mutate({
                                        id: note._id,
                                        payload: { color: th.id },
                                      })
                                    }
                                    className={`w-5 h-5 rounded-full ${th.dot} transition cursor-pointer border ${
                                      note.color === th.id
                                        ? 'ring-2 ring-indigo-600 scale-110 shadow-sm'
                                        : 'opacity-75 hover:opacity-100'
                                    }`}
                                    title={th.name}
                                  />
                                ))}
                              </div>
                            </div>

                            <div>
                              <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                                Font Style (6)
                              </span>
                              <div className="grid grid-cols-2 gap-1">
                                {Object.values(FONT_STYLES).map((fs) => (
                                  <button
                                    key={fs.id}
                                    type="button"
                                    onClick={() =>
                                      updateStyleMutation.mutate({
                                        id: note._id,
                                        payload: { fontStyle: fs.id },
                                      })
                                    }
                                    className={`px-2 py-1 rounded-lg text-xs font-semibold text-left transition cursor-pointer border truncate ${
                                      (note.fontStyle || 'caveat') === fs.id
                                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs font-bold'
                                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                    }`}
                                    style={{ fontFamily: fs.fontFamily }}
                                  >
                                    {fs.name}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                                Font Color (8)
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {TEXT_COLORS.map((tc) => (
                                  <button
                                    key={tc.id}
                                    type="button"
                                    onClick={() =>
                                      updateStyleMutation.mutate({
                                        id: note._id,
                                        payload: { textColor: tc.hex },
                                      })
                                    }
                                    className={`w-5 h-5 rounded-full ${tc.bgClass} transition cursor-pointer border ${
                                      (note.textColor || theme.defaultText) === tc.hex
                                        ? 'ring-2 ring-indigo-500 scale-110 shadow-sm'
                                        : 'opacity-80 hover:opacity-100'
                                    }`}
                                    title={tc.name}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          4. MODAL: CREATE NEW STICKY NOTE (STICK IT)
          ======================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-hidden animate-fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xl max-w-4xl w-full max-h-[94vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center text-base sm:text-lg shrink-0 shadow-2xs">
                  📌
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                    Stick a New Note
                  </h3>
                  <p className="text-[11px] text-slate-500 hidden sm:block">
                    Live 3D paper preview, fancy typography & reminder alerts
                  </p>
                </div>
              </div>

              {/* Mobile Tab Switcher */}
              <div className="md:hidden flex items-center p-1 bg-slate-200/80 rounded-xl text-xs font-semibold mr-2">
                <button
                  type="button"
                  onClick={() => setCreateModalTab('note')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    createModalTab === 'note'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📝 Note & Style
                </button>
                <button
                  type="button"
                  onClick={() => setCreateModalTab('reminder')}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    createModalTab === 'reminder'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ⏰ Alert & Pin
                  {newForm.reminderDate && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block" />
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Close"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 md:space-y-0 md:grid md:grid-cols-12 md:gap-6 items-start">
                {/* LEFT COLUMN: LIVE STICKY CANVAS & METADATA */}
                <div
                  className={`md:col-span-7 flex flex-col gap-4 ${
                    createModalTab !== 'note' ? 'hidden md:flex' : 'flex'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <HiOutlineSparkles className="w-3.5 h-3.5 text-amber-500" />
                      Live Sticky Note Canvas
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      WYSIWYG • Type directly on paper
                    </span>
                  </div>

                  {/* 3D Note Card Preview */}
                  <div
                    className={`relative rounded-2xl border-2 ${
                      STICKY_THEMES[newForm.color]?.cardBorder || 'border-amber-300'
                    } ${
                      STICKY_THEMES[newForm.color]?.bg || 'bg-amber-100'
                    } p-4 sm:p-5 shadow-lg transition-colors duration-200 flex flex-col justify-between min-h-[260px] sm:min-h-[290px]`}
                    style={{
                      boxShadow: '0 12px 24px -6px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    {/* Pushpin Graphic */}
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 pointer-events-none select-none z-10 flex flex-col items-center">
                      <div
                        className="w-5 h-5 rounded-full border border-white/80 shadow-md flex items-center justify-center relative"
                        style={{
                          background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${
                            STICKY_THEMES[newForm.color]?.pinColor || '#ef4444'
                          } 55%, #1f2937 100%)`,
                          boxShadow: '0 4px 8px rgba(0,0,0,0.35), inset 0 -2px 3px rgba(0,0,0,0.4)',
                        }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white/70 absolute top-0.5 left-1 blur-[0.2px]" />
                      </div>
                      <div className="w-2.5 h-1 bg-black/25 rounded-full blur-[1px] -mt-0.5" />
                    </div>

                    {/* Dog-ear Corner */}
                    <div className="absolute bottom-0 right-0 w-6 h-6 overflow-hidden pointer-events-none rounded-br-2xl">
                      <div className="absolute bottom-0 right-0 w-0 h-0 border-solid border-t-[20px] border-l-[20px] border-r-0 border-b-0 border-t-black/15 border-l-transparent" />
                      <div
                        className="absolute bottom-0 right-0 w-5 h-5 shadow-[-2px_-2px_4px_rgba(0,0,0,0.18)]"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(203,213,225,0.45) 100%)',
                          clipPath: 'polygon(0 100%, 100% 0, 100% 100%)',
                        }}
                      />
                    </div>

                    <div className="space-y-2 flex-1 flex flex-col pt-1">
                      {/* Title Input */}
                      <input
                        type="text"
                        placeholder="Note Title (Optional)..."
                        value={newForm.title}
                        onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                        style={{
                          fontFamily: FONT_STYLES[newForm.fontStyle]?.fontFamily,
                          color: newForm.textColor,
                        }}
                        className={`w-full bg-transparent border-b border-black/10 focus:border-black/30 pb-1.5 focus:outline-none placeholder:text-black/30 font-bold ${
                          FONT_STYLES[newForm.fontStyle]?.titleSizeClass || 'text-base sm:text-lg'
                        }`}
                      />

                      {/* Content Textarea */}
                      <textarea
                        required
                        rows={6}
                        placeholder="Write your note here... (e.g. Discuss deployment with team lead, submit reports by 4 PM)"
                        value={newForm.content}
                        onChange={(e) => setNewForm({ ...newForm, content: e.target.value })}
                        style={{
                          fontFamily: FONT_STYLES[newForm.fontStyle]?.fontFamily,
                          color: newForm.textColor,
                        }}
                        className={`w-full bg-transparent resize-none focus:outline-none placeholder:text-black/30 pt-1 flex-1 ${
                          FONT_STYLES[newForm.fontStyle]?.fontSizeClass || 'text-sm'
                        }`}
                      />
                    </div>

                    {/* Live Footer Badges */}
                    <div className="pt-2 border-t border-black/10 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {newForm.isPinned && (
                          <span className="px-2 py-0.5 rounded-full bg-black/10 text-black/80 font-bold flex items-center gap-1">
                            📌 Pinned
                          </span>
                        )}
                        {newForm.reminderDate && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-600/15 text-indigo-950 font-bold flex items-center gap-1">
                            ⏰ {newForm.reminderDate} {newForm.reminderTime || '09:00'}
                          </span>
                        )}
                        {newForm.tags && (
                          <span className="px-2 py-0.5 rounded-full bg-black/5 text-black/70 font-medium">
                            🏷️ {newForm.tags.split(',')[0]}
                          </span>
                        )}
                      </div>
                      <span className="text-black/40 font-mono text-[10px]">
                        {newForm.content.length} chars
                      </span>
                    </div>
                  </div>

                  {/* Tags and Pin Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Tags (comma separated)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Urgent, Client, Meeting"
                        value={newForm.tags}
                        onChange={(e) => setNewForm({ ...newForm, tags: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Pin Note to Top?
                      </label>
                      <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-700 transition-colors">
                        <input
                          type="checkbox"
                          checked={newForm.isPinned}
                          onChange={(e) => setNewForm({ ...newForm, isPinned: e.target.checked })}
                          className="w-4 h-4 rounded accent-amber-600 cursor-pointer"
                        />
                        <span>📌 Keep Pinned on Board</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: STYLE CUSTOMIZER & ALERTS */}
                <div
                  className={`md:col-span-5 space-y-4 flex flex-col ${
                    createModalTab === 'reminder' ? 'flex' : 'hidden md:flex'
                  }`}
                >
                  {/* 1. Card Background Color */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <HiOutlinePaintBrush className="w-3.5 h-3.5 text-indigo-600" />
                        1. Paper Color (8 Themes)
                      </label>
                      <span className="text-[10px] font-bold text-slate-500 font-mono">
                        {STICKY_THEMES[newForm.color]?.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 sm:flex sm:items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      {Object.values(STICKY_THEMES).map((th) => (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => setNewForm({ ...newForm, color: th.id })}
                          className={`h-8 rounded-xl ${th.dot} transition-all cursor-pointer border flex items-center justify-center shrink-0 ${
                            newForm.color === th.id
                              ? 'ring-2 ring-slate-900 scale-105 shadow-sm'
                              : 'opacity-80 hover:opacity-100 hover:scale-105'
                          }`}
                          title={th.name}
                        >
                          {newForm.color === th.id && (
                            <HiOutlineCheck className="w-4 h-4 text-slate-900 stroke-[3]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Fancy Typography */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <span>✍️</span>
                        2. Font Style (6 Styles)
                      </label>
                      <span className="text-[10px] font-bold text-slate-500 font-mono">
                        {FONT_STYLES[newForm.fontStyle]?.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                      {Object.values(FONT_STYLES).map((fs) => (
                        <button
                          key={fs.id}
                          type="button"
                          onClick={() => setNewForm({ ...newForm, fontStyle: fs.id })}
                          className={`px-2.5 py-2 rounded-xl text-left border transition-all cursor-pointer ${
                            newForm.fontStyle === fs.id
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <p
                            className="text-xs font-bold leading-tight truncate"
                            style={{ fontFamily: fs.fontFamily }}
                          >
                            {fs.name}
                          </p>
                          <p
                            className="text-[10px] opacity-70 truncate mt-0.5"
                            style={{ fontFamily: fs.fontFamily }}
                          >
                            {fs.sample}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Font Ink Color */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        3. Ink Color (8 Inks)
                      </label>
                      <span className="text-[10px] font-bold text-slate-500 font-mono">
                        {TEXT_COLORS.find((tc) => tc.hex === newForm.textColor)?.name || 'Custom'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 sm:flex sm:items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      {TEXT_COLORS.map((tc) => (
                        <button
                          key={tc.id}
                          type="button"
                          onClick={() => setNewForm({ ...newForm, textColor: tc.hex })}
                          className={`h-8 rounded-xl ${tc.bgClass} transition-all cursor-pointer border flex items-center justify-center shrink-0 ${
                            newForm.textColor === tc.hex
                              ? 'ring-2 ring-slate-900 scale-105 shadow-sm'
                              : 'opacity-80 hover:opacity-100 hover:scale-105'
                          }`}
                          title={tc.name}
                        >
                          {newForm.textColor === tc.hex && (
                            <HiOutlineCheck className="w-4 h-4 text-white stroke-[3]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Scheduled Reminder & Alerts */}
                  <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <HiOutlineBellAlert className="w-4 h-4 text-indigo-600" />
                        Scheduled Alert (Optional)
                      </span>
                      {newForm.reminderDate && (
                        <button
                          type="button"
                          onClick={() => setNewForm({ ...newForm, reminderDate: '', reminderTime: '' })}
                          className="text-[11px] text-rose-600 font-semibold hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyReminderPreset(15, setNewForm)}
                        className="px-2 py-0.5 text-[11px] font-semibold bg-white hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 cursor-pointer shadow-2xs"
                      >
                        +15m
                      </button>
                      <button
                        type="button"
                        onClick={() => applyReminderPreset(60, setNewForm)}
                        className="px-2 py-0.5 text-[11px] font-semibold bg-white hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 cursor-pointer shadow-2xs"
                      >
                        +1h
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const tmrw = new Date(Date.now() + 24 * 60 * 60 * 1000);
                          setNewForm((prev) => ({
                            ...prev,
                            reminderDate: tmrw.toISOString().split('T')[0],
                            reminderTime: '09:30',
                          }));
                        }}
                        className="px-2 py-0.5 text-[11px] font-semibold bg-white hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 cursor-pointer shadow-2xs"
                      >
                        Tomorrow 9:30 AM
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Date</label>
                        <input
                          type="date"
                          value={newForm.reminderDate}
                          onChange={(e) => setNewForm({ ...newForm, reminderDate: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Time</label>
                        <input
                          type="time"
                          value={newForm.reminderTime}
                          onChange={(e) => setNewForm({ ...newForm, reminderTime: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={newForm.sendInAppReminder}
                          onChange={(e) => setNewForm({ ...newForm, sendInAppReminder: e.target.checked })}
                          className="w-3.5 h-3.5 rounded accent-indigo-600"
                        />
                        <span>In-App Notification Popup</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={newForm.sendEmailReminder}
                          onChange={(e) => setNewForm({ ...newForm, sendEmailReminder: e.target.checked })}
                          className="w-3.5 h-3.5 rounded accent-indigo-600"
                        />
                        <span>Send Company Email Notification</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="shrink-0 px-4 sm:px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/90">
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  <span>{STICKY_THEMES[newForm.color]?.name}</span>
                  <span>•</span>
                  <span>{FONT_STYLES[newForm.fontStyle]?.name}</span>
                </div>

                <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || !newForm.content.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-black text-white shadow-md disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <HiOutlinePlus className="w-4 h-4" />
                    <span>{createMutation.isPending ? 'Sticking...' : 'Stick to Board! 📌'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          5. MODAL: EDIT STICKY NOTE
          ======================================================== */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div
            className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-4xl w-full my-auto overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="shrink-0 px-4 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-base">
                  <HiOutlinePencilSquare className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                    Edit Sticky Note
                  </h3>
                  <p className="text-[11px] text-slate-500 hidden sm:block">
                    Update note content, typography styles & reminder alerts
                  </p>
                </div>
              </div>

              {/* Mobile Tab Switcher */}
              <div className="flex md:hidden items-center bg-slate-200/70 p-0.5 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setEditModalTab('note')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    editModalTab === 'note'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📝 Note & Style
                </button>
                <button
                  type="button"
                  onClick={() => setEditModalTab('reminder')}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    editModalTab === 'reminder'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ⏰ Alert & Pin
                  {editForm.reminderDate && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block" />
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setEditingNote(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Close"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleEditSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 md:space-y-0 md:grid md:grid-cols-12 md:gap-6 items-start">
                {/* LEFT COLUMN: LIVE STICKY CANVAS & METADATA */}
                <div
                  className={`md:col-span-7 flex flex-col gap-4 ${
                    editModalTab !== 'note' ? 'hidden md:flex' : 'flex'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <HiOutlineSparkles className="w-3.5 h-3.5 text-amber-500" />
                      Live Sticky Note Canvas
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      WYSIWYG • Direct Paper Editing
                    </span>
                  </div>

                  {/* Physical Sticky Note Preview */}
                  <div
                    className={`relative rounded-2xl border-2 ${
                      STICKY_THEMES[editForm.color]?.cardBorder || 'border-amber-300'
                    } ${
                      STICKY_THEMES[editForm.color]?.bg || 'bg-amber-100'
                    } p-4 sm:p-5 shadow-lg transition-colors duration-200 flex flex-col justify-between min-h-[260px] sm:min-h-[290px]`}
                    style={{
                      boxShadow: '0 12px 24px -6px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    {/* Pushpin Graphic */}
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 pointer-events-none select-none z-10 flex flex-col items-center">
                      <div
                        className="w-5 h-5 rounded-full border border-white/80 shadow-md flex items-center justify-center relative"
                        style={{
                          background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${
                            STICKY_THEMES[editForm.color]?.pinColor || '#ef4444'
                          } 55%, #1f2937 100%)`,
                          boxShadow: '0 4px 8px rgba(0,0,0,0.35), inset 0 -2px 3px rgba(0,0,0,0.4)',
                        }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white/70 absolute top-0.5 left-1 blur-[0.2px]" />
                      </div>
                      <div className="w-2.5 h-1 bg-black/25 rounded-full blur-[1px] -mt-0.5" />
                    </div>

                    {/* Dog-ear Corner */}
                    <div className="absolute bottom-0 right-0 w-6 h-6 overflow-hidden pointer-events-none rounded-br-2xl">
                      <div className="absolute bottom-0 right-0 w-0 h-0 border-solid border-t-[20px] border-l-[20px] border-r-0 border-b-0 border-t-black/15 border-l-transparent" />
                      <div
                        className="absolute bottom-0 right-0 w-5 h-5 shadow-[-2px_-2px_4px_rgba(0,0,0,0.18)]"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(203,213,225,0.45) 100%)',
                          clipPath: 'polygon(0 100%, 100% 0, 100% 100%)',
                        }}
                      />
                    </div>

                    <div className="space-y-2 flex-1 flex flex-col pt-1">
                      {/* Title Input */}
                      <input
                        type="text"
                        placeholder="Note Title (Optional)..."
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        style={{
                          fontFamily: FONT_STYLES[editForm.fontStyle]?.fontFamily,
                          color: editForm.textColor,
                        }}
                        className={`w-full bg-transparent border-b border-black/10 focus:border-black/30 pb-1.5 focus:outline-none placeholder:text-black/30 font-bold ${
                          FONT_STYLES[editForm.fontStyle]?.titleSizeClass || 'text-base sm:text-lg'
                        }`}
                      />

                      {/* Content Textarea */}
                      <textarea
                        required
                        rows={6}
                        placeholder="Write your note here..."
                        value={editForm.content}
                        onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                        style={{
                          fontFamily: FONT_STYLES[editForm.fontStyle]?.fontFamily,
                          color: editForm.textColor,
                        }}
                        className={`w-full bg-transparent resize-none focus:outline-none placeholder:text-black/30 pt-1 flex-1 ${
                          FONT_STYLES[editForm.fontStyle]?.fontSizeClass || 'text-sm'
                        }`}
                      />
                    </div>

                    {/* Live Footer Badges */}
                    <div className="pt-2 border-t border-black/10 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {editForm.isPinned && (
                          <span className="px-2 py-0.5 rounded-full bg-black/10 text-black/80 font-bold flex items-center gap-1">
                            📌 Pinned
                          </span>
                        )}
                        {editForm.reminderDate && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-600/15 text-indigo-950 font-bold flex items-center gap-1">
                            ⏰ {editForm.reminderDate} {editForm.reminderTime || '09:00'}
                          </span>
                        )}
                        {editForm.tags && (
                          <span className="px-2 py-0.5 rounded-full bg-black/5 text-black/70 font-medium">
                            🏷️ {editForm.tags.split(',')[0]}
                          </span>
                        )}
                      </div>
                      <span className="text-black/40 font-mono text-[10px]">
                        {editForm.content.length} chars
                      </span>
                    </div>
                  </div>

                  {/* Tags and Pin Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Tags (comma separated)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Urgent, Client, Meeting"
                        value={editForm.tags}
                        onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Pin Note to Top?
                      </label>
                      <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-700 transition-colors">
                        <input
                          type="checkbox"
                          checked={editForm.isPinned || false}
                          onChange={(e) => setEditForm({ ...editForm, isPinned: e.target.checked })}
                          className="w-4 h-4 rounded accent-amber-600 cursor-pointer"
                        />
                        <span>📌 Keep Pinned on Board</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: STYLE CUSTOMIZER & ALERTS */}
                <div
                  className={`md:col-span-5 space-y-4 flex flex-col ${
                    editModalTab === 'reminder' ? 'flex' : 'hidden md:flex'
                  }`}
                >
                  {/* 1. Paper Color */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <HiOutlinePaintBrush className="w-3.5 h-3.5 text-indigo-600" />
                        1. Paper Color (8 Themes)
                      </label>
                      <span className="text-[10px] font-bold text-slate-500 font-mono">
                        {STICKY_THEMES[editForm.color]?.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 sm:flex sm:items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      {Object.values(STICKY_THEMES).map((th) => (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, color: th.id })}
                          className={`h-8 rounded-xl ${th.dot} transition-all cursor-pointer border flex items-center justify-center shrink-0 ${
                            editForm.color === th.id
                              ? 'ring-2 ring-slate-900 scale-105 shadow-sm'
                              : 'opacity-80 hover:opacity-100 hover:scale-105'
                          }`}
                          title={th.name}
                        >
                          {editForm.color === th.id && (
                            <HiOutlineCheck className="w-4 h-4 text-slate-900 stroke-[3]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Fancy Typography */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <span>✍️</span>
                        2. Font Style (6 Styles)
                      </label>
                      <span className="text-[10px] font-bold text-slate-500 font-mono">
                        {FONT_STYLES[editForm.fontStyle]?.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                      {Object.values(FONT_STYLES).map((fs) => (
                        <button
                          key={fs.id}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, fontStyle: fs.id })}
                          className={`px-2.5 py-2 rounded-xl text-left border transition-all cursor-pointer ${
                            editForm.fontStyle === fs.id
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <p
                            className="text-xs font-bold leading-tight truncate"
                            style={{ fontFamily: fs.fontFamily }}
                          >
                            {fs.name}
                          </p>
                          <p
                            className="text-[10px] opacity-70 truncate mt-0.5"
                            style={{ fontFamily: fs.fontFamily }}
                          >
                            {fs.sample}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Font Ink Color */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        3. Ink Color (8 Inks)
                      </label>
                      <span className="text-[10px] font-bold text-slate-500 font-mono">
                        {TEXT_COLORS.find((tc) => tc.hex === editForm.textColor)?.name || 'Custom'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 sm:flex sm:items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      {TEXT_COLORS.map((tc) => (
                        <button
                          key={tc.id}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, textColor: tc.hex })}
                          className={`h-8 rounded-xl ${tc.bgClass} transition-all cursor-pointer border flex items-center justify-center shrink-0 ${
                            editForm.textColor === tc.hex
                              ? 'ring-2 ring-slate-900 scale-105 shadow-sm'
                              : 'opacity-80 hover:opacity-100 hover:scale-105'
                          }`}
                          title={tc.name}
                        >
                          {editForm.textColor === tc.hex && (
                            <HiOutlineCheck className="w-4 h-4 text-white stroke-[3]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Scheduled Reminder & Alerts */}
                  <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <HiOutlineBellAlert className="w-4 h-4 text-indigo-600" />
                        Scheduled Alert (Optional)
                      </span>
                      {editForm.reminderDate && (
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, reminderDate: '', reminderTime: '' })}
                          className="text-[11px] text-rose-600 font-semibold hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyReminderPreset(15, setEditForm)}
                        className="px-2 py-0.5 text-[11px] font-semibold bg-white hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 cursor-pointer shadow-2xs"
                      >
                        +15m
                      </button>
                      <button
                        type="button"
                        onClick={() => applyReminderPreset(60, setEditForm)}
                        className="px-2 py-0.5 text-[11px] font-semibold bg-white hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 cursor-pointer shadow-2xs"
                      >
                        +1h
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const tmrw = new Date(Date.now() + 24 * 60 * 60 * 1000);
                          setEditForm((prev) => ({
                            ...prev,
                            reminderDate: tmrw.toISOString().split('T')[0],
                            reminderTime: '09:30',
                          }));
                        }}
                        className="px-2 py-0.5 text-[11px] font-semibold bg-white hover:bg-slate-200 text-slate-700 rounded-md border border-slate-200 cursor-pointer shadow-2xs"
                      >
                        Tomorrow 9:30 AM
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Date</label>
                        <input
                          type="date"
                          value={editForm.reminderDate}
                          onChange={(e) => setEditForm({ ...editForm, reminderDate: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Time</label>
                        <input
                          type="time"
                          value={editForm.reminderTime}
                          onChange={(e) => setEditForm({ ...editForm, reminderTime: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={editForm.sendInAppReminder}
                          onChange={(e) => setEditForm({ ...editForm, sendInAppReminder: e.target.checked })}
                          className="w-3.5 h-3.5 rounded accent-indigo-600"
                        />
                        <span>In-App Notification Popup</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={editForm.sendEmailReminder}
                          onChange={(e) => setEditForm({ ...editForm, sendEmailReminder: e.target.checked })}
                          className="w-3.5 h-3.5 rounded accent-indigo-600"
                        />
                        <span>Send Company Email Notification</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="shrink-0 px-4 sm:px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/90">
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                  <span>{STICKY_THEMES[editForm.color]?.name}</span>
                  <span>•</span>
                  <span>{FONT_STYLES[editForm.fontStyle]?.name}</span>
                </div>

                <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setEditingNote(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending || !editForm.content.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-black text-white shadow-md disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <HiOutlineCheckCircle className="w-4 h-4" />
                    <span>{updateMutation.isPending ? 'Updating...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          6. MODAL: QUICK SET REMINDER & EMAIL NOTIFICATION
          ======================================================== */}
      {reminderModalNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HiOutlineBellAlert className="w-5 h-5 text-indigo-600" />
                  Set Note Reminder
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Get notified in the application and via official company email.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReminderModalNote(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Note Snippet */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
              <p className="font-bold">{reminderModalNote.title || 'Untitled Note'}</p>
              <p className="text-amber-800 line-clamp-2 mt-0.5">{reminderModalNote.content}</p>
            </div>

            {/* Quick Presets */}
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Quick Presets
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const target = new Date(Date.now() + 15 * 60 * 1000);
                    setReminderForm((prev) => ({
                      ...prev,
                      date: target.toISOString().split('T')[0],
                      time: `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')}`,
                    }));
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  +15 Mins
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = new Date(Date.now() + 60 * 60 * 1000);
                    setReminderForm((prev) => ({
                      ...prev,
                      date: target.toISOString().split('T')[0],
                      time: `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')}`,
                    }));
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  +1 Hour
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tmrw = new Date(Date.now() + 24 * 60 * 60 * 1000);
                    setReminderForm((prev) => ({
                      ...prev,
                      date: tmrw.toISOString().split('T')[0],
                      time: '09:30',
                    }));
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Tomorrow (9:30 AM)
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveReminderModal} className="space-y-4 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={reminderForm.date}
                    onChange={(e) => setReminderForm({ ...reminderForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={reminderForm.time}
                    onChange={(e) => setReminderForm({ ...reminderForm, time: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={reminderForm.sendInAppReminder}
                    onChange={(e) => setReminderForm({ ...reminderForm, sendInAppReminder: e.target.checked })}
                    className="rounded accent-indigo-600"
                  />
                  <span>Send In-App Notification Alert</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={reminderForm.sendEmailReminder}
                    onChange={(e) => setReminderForm({ ...reminderForm, sendEmailReminder: e.target.checked })}
                    className="rounded accent-indigo-600"
                  />
                  <span>Send Alert to Registered Email from Company Mail</span>
                </label>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => testReminderMutation.mutate(reminderModalNote._id)}
                  disabled={testReminderMutation.isPending}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  <HiOutlinePaperAirplane className="w-3.5 h-3.5" />
                  <span>Test Alert Now</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReminderModalNote(null)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 disabled:opacity-50 cursor-pointer"
                  >
                    <HiOutlineCheckCircle className="w-4 h-4" />
                    <span>{updateMutation.isPending ? 'Scheduling...' : 'Set Reminder'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StickyNotesPage;
