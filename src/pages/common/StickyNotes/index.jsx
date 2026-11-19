import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import {
  HiOutlinePlus,
  HiOutlineBell,
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
} from 'react-icons/hi2';

// 8 Authentic Vibrant Pastel Card Background Palettes
const STICKY_THEMES = {
  yellow: {
    id: 'yellow',
    name: 'Canary Yellow',
    bg: 'bg-[#fef9c3]',
    cardBorder: 'border-amber-300',
    defaultText: '#713f12',
    pinBg: 'bg-rose-500 shadow-rose-300',
    dot: 'bg-amber-400',
  },
  pink: {
    id: 'pink',
    name: 'Rose Pink',
    bg: 'bg-[#fce7f3]',
    cardBorder: 'border-rose-300',
    defaultText: '#831843',
    pinBg: 'bg-indigo-500 shadow-indigo-300',
    dot: 'bg-rose-400',
  },
  blue: {
    id: 'blue',
    name: 'Sky Blue',
    bg: 'bg-[#e0f2fe]',
    cardBorder: 'border-sky-300',
    defaultText: '#0c4a6e',
    pinBg: 'bg-amber-500 shadow-amber-300',
    dot: 'bg-sky-400',
  },
  green: {
    id: 'green',
    name: 'Mint Green',
    bg: 'bg-[#dcfce7]',
    cardBorder: 'border-emerald-300',
    defaultText: '#14532d',
    pinBg: 'bg-rose-500 shadow-rose-300',
    dot: 'bg-emerald-400',
  },
  purple: {
    id: 'purple',
    name: 'Lavender',
    bg: 'bg-[#f3e8ff]',
    cardBorder: 'border-purple-300',
    defaultText: '#581c87',
    pinBg: 'bg-emerald-500 shadow-emerald-300',
    dot: 'bg-purple-400',
  },
  orange: {
    id: 'orange',
    name: 'Warm Peach',
    bg: 'bg-[#ffedd5]',
    cardBorder: 'border-orange-300',
    defaultText: '#7c2d12',
    pinBg: 'bg-sky-500 shadow-sky-300',
    dot: 'bg-orange-400',
  },
  teal: {
    id: 'teal',
    name: 'Seafoam Teal',
    bg: 'bg-[#ccfbf1]',
    cardBorder: 'border-teal-300',
    defaultText: '#134e4a',
    pinBg: 'bg-rose-500 shadow-rose-300',
    dot: 'bg-teal-400',
  },
  white: {
    id: 'white',
    name: 'Pearl White',
    bg: 'bg-[#ffffff]',
    cardBorder: 'border-slate-300',
    defaultText: '#0f172a',
    pinBg: 'bg-slate-700 shadow-slate-300',
    dot: 'bg-white border border-slate-300',
  },
};

// 6 Fancy & Stylish Typography Options
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

// 8 Font / Ink Color Options
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

const StickyNotesPage = () => {
  const queryClient = useQueryClient();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'pinned' | 'reminders' | 'completed'
  const [selectedColor, setSelectedColor] = useState('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [reminderModalNote, setReminderModalNote] = useState(null);
  const [stylePopoverNoteId, setStylePopoverNoteId] = useState(null); // card id for quick styling menu

  // New Note Form State (in Stick It Modal)
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

  // ===================== MUTATIONS =====================

  // Create Note Mutation
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/sticky-notes', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stickyNotes']);
      setIsCreateModalOpen(false);
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
      toast.success('Sticky note stuck on board! 📌');
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

  // Quick Style Update Mutation (Color, Font Style, Text Color)
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
    onSuccess: (data) => {
      queryClient.invalidateQueries(['stickyNotes']);
      toast.success(data.message);
    },
  });

  // Toggle Complete Mutation
  const completeMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.patch(`/sticky-notes/${id}/complete`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['stickyNotes']);
      toast.success(data.message);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/sticky-notes/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stickyNotes']);
      toast.success('Note removed from board');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete note');
    },
  });

  // Instant Test Reminder Mutation
  const testReminderMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/sticky-notes/${id}/test-reminder`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Test reminder sent to in-app notification & company email!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error dispatching test reminder');
    },
  });

  // Open Create Modal
  const handleOpenCreate = () => {
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
    setIsCreateModalOpen(true);
  };

  // Submit Create Form
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newForm.content.trim()) {
      toast.error('Please write something in your sticky note!');
      return;
    }

    let reminderAt = null;
    if (newForm.reminderDate) {
      const timeStr = newForm.reminderTime || '09:00';
      reminderAt = new Date(`${newForm.reminderDate}T${timeStr}:00`);
    }

    createMutation.mutate({
      title: newForm.title.trim(),
      content: newForm.content.trim(),
      color: newForm.color,
      fontStyle: newForm.fontStyle,
      textColor: newForm.textColor,
      isPinned: newForm.isPinned,
      priority: newForm.priority,
      tags: newForm.tags ? newForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      reminderAt,
      sendEmailReminder: newForm.sendEmailReminder,
      sendInAppReminder: newForm.sendInAppReminder,
    });
  };

  // Open Edit Modal
  const handleOpenEdit = (note) => {
    let dateStr = '';
    let timeStr = '';
    if (note.reminderAt) {
      const d = new Date(note.reminderAt);
      dateStr = d.toISOString().split('T')[0];
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      timeStr = `${hours}:${minutes}`;
    }

    setEditingNote(note);
    setEditForm({
      title: note.title || '',
      content: note.content || '',
      color: note.color || 'yellow',
      fontStyle: note.fontStyle || 'caveat',
      textColor: note.textColor || '#0f172a',
      tags: (note.tags || []).join(', '),
      priority: note.priority || 'Medium',
      reminderDate: dateStr,
      reminderTime: timeStr,
      sendEmailReminder: note.sendEmailReminder !== undefined ? note.sendEmailReminder : true,
      sendInAppReminder: note.sendInAppReminder !== undefined ? note.sendInAppReminder : true,
    });
  };

  // Submit Edit Form
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editForm.content.trim()) {
      toast.error('Note content is required');
      return;
    }

    let reminderAt = null;
    if (editForm.reminderDate) {
      const timeStr = editForm.reminderTime || '09:00';
      reminderAt = new Date(`${editForm.reminderDate}T${timeStr}:00`);
    }

    updateMutation.mutate({
      id: editingNote._id,
      payload: {
        title: editForm.title.trim(),
        content: editForm.content.trim(),
        color: editForm.color,
        fontStyle: editForm.fontStyle,
        textColor: editForm.textColor,
        priority: editForm.priority,
        tags: editForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
        reminderAt,
        sendEmailReminder: editForm.sendEmailReminder,
        sendInAppReminder: editForm.sendInAppReminder,
      },
    });
  };

  // Open Reminder Quick Setup Modal
  const handleOpenReminderModal = (note) => {
    let dateStr = '';
    let timeStr = '';
    if (note.reminderAt) {
      const d = new Date(note.reminderAt);
      dateStr = d.toISOString().split('T')[0];
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      timeStr = `${hours}:${minutes}`;
    } else {
      const inOneHour = new Date(Date.now() + 60 * 60 * 1000);
      dateStr = inOneHour.toISOString().split('T')[0];
      timeStr = `${String(inOneHour.getHours()).padStart(2, '0')}:${String(inOneHour.getMinutes()).padStart(2, '0')}`;
    }

    setReminderModalNote(note);
    setReminderForm({
      date: dateStr,
      time: timeStr,
      sendEmailReminder: note.sendEmailReminder !== undefined ? note.sendEmailReminder : true,
      sendInAppReminder: note.sendInAppReminder !== undefined ? note.sendInAppReminder : true,
    });
  };

  // Save Reminder Modal
  const handleSaveReminderModal = (e) => {
    e.preventDefault();
    if (!reminderForm.date) {
      toast.error('Please select a reminder date');
      return;
    }
    const timeStr = reminderForm.time || '09:00';
    const reminderAt = new Date(`${reminderForm.date}T${timeStr}:00`);

    updateMutation.mutate({
      id: reminderModalNote._id,
      payload: {
        reminderAt,
        sendEmailReminder: reminderForm.sendEmailReminder,
        sendInAppReminder: reminderForm.sendInAppReminder,
      },
    });
  };

  // Quick Preset Helper for Reminder
  const applyReminderPreset = (minutesFromNow, targetFormSetter) => {
    const target = new Date(Date.now() + minutesFromNow * 60 * 1000);
    const dateStr = target.toISOString().split('T')[0];
    const timeStr = `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')}`;
    targetFormSetter((prev) => ({ ...prev, reminderDate: dateStr, reminderTime: timeStr }));
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* ===================== BOARD TOP HEADER ===================== */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0 shadow-xs text-xl">
            📌
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Sticky Notes Board
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                {stats.total || 0}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Jot quick ideas with fancy fonts, customize card & text colors, and set date & time email reminders.
            </p>
          </div>
        </div>

        {/* Primary Action Button: "+ Stick It" */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-md shadow-amber-300/60 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <span className="text-base leading-none">📌</span>
            <span>+ Stick It</span>
          </button>
        </div>
      </div>

      {/* ===================== SEARCH, FILTER & COLOR TOOLBAR ===================== */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search sticky notes by keyword, title, or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
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
          <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
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
                  selectedColor === th.id ? 'ring-2 ring-slate-800 scale-110' : 'opacity-60 hover:opacity-100'
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

      {/* ===================== STICKY NOTES CANVAS BOARD ===================== */}
      <div className="bg-slate-100/70 border border-slate-200/80 rounded-3xl p-5 sm:p-7 min-h-[560px] shadow-inner">
        {isLoading ? (
          <div className="py-24 flex justify-center">
            <div className="w-9 h-9 border-[3px] border-amber-200 border-t-amber-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
            {/* Card 1: Interactive "+ Stick It" Card */}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="bg-white/80 hover:bg-amber-50/90 border-2 border-dashed border-amber-300 hover:border-amber-400 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col items-center justify-center text-center group min-h-[240px] cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center text-2xl group-hover:scale-110 transition shadow-xs mb-3">
                📌
              </div>
              <h3 className="text-base font-extrabold text-amber-950 group-hover:text-amber-800">
                + Stick It!
              </h3>
              <p className="text-xs text-amber-800/80 mt-1 max-w-[180px]">
                Click to jot down a new note with fancy fonts and custom colors.
              </p>
            </button>

            {/* Render User's Sticky Notes */}
            {notes.map((note, index) => {
              const theme = STICKY_THEMES[note.color] || STICKY_THEMES.yellow;
              const font = FONT_STYLES[note.fontStyle] || FONT_STYLES.caveat;
              const textColor = note.textColor || theme.defaultText;
              const rotationClass = index % 3 === 0 ? '-rotate-1' : index % 3 === 1 ? 'rotate-1' : 'rotate-0';
              const hasReminder = Boolean(note.reminderAt);
              const isReminderPast = hasReminder && new Date(note.reminderAt) <= new Date();

              const isStylePopoverOpen = stylePopoverNoteId === note._id;

              return (
                <div
                  key={note._id}
                  className={`${theme.bg} ${theme.cardBorder} border-2 rounded-2xl p-4 sm:p-4.5 shadow-md hover:shadow-2xl transition-all duration-200 relative flex flex-col justify-between group ${rotationClass} hover:rotate-0 hover:scale-[1.02] min-h-[250px]`}
                  style={{
                    boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
                  }}
                >
                  {/* Pushpin Graphic at top center */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
                    <span
                      className={`w-4 h-4 rounded-full ${theme.pinBg} border-2 border-white shadow-md block`}
                    />
                  </div>

                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 pb-2 pt-1 border-b border-black/5">
                    {/* Pin to Top Button */}
                    <button
                      type="button"
                      onClick={() => pinMutation.mutate(note._id)}
                      className={`transition cursor-pointer p-1 rounded-lg ${
                        note.isPinned
                          ? 'text-amber-600 scale-125 font-bold bg-amber-200/60'
                          : 'text-black/25 hover:text-black/70 hover:bg-black/5'
                      }`}
                      title={note.isPinned ? 'Unpin Note' : 'Pin to Top of Board'}
                    >
                      📌
                    </button>

                    {/* Font Style Badge preview */}
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/5 text-black/60 cursor-pointer hover:bg-black/10 transition"
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
                          : 'border-black/30 hover:border-black/60 bg-white/60'
                      }`}
                      title={note.isCompleted ? 'Mark as Active' : 'Mark as Completed'}
                    >
                      {note.isCompleted && <HiOutlineCheck className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  </div>

                  {/* Card Body with Fancy Typography */}
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

                    {/* Tags */}
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

                  {/* Card Footer: Reminder & Actions */}
                  <div className="pt-2.5 mt-2 border-t border-black/10 space-y-2">
                    {/* Reminder Status Pill */}
                    {hasReminder ? (
                      <div
                        className={`flex items-center justify-between text-[11px] font-bold px-2 py-1 rounded-lg border ${
                          isReminderPast
                            ? 'bg-slate-200/80 text-slate-700 border-slate-300'
                            : 'bg-white/90 text-indigo-950 border-indigo-200 shadow-2xs'
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
                          className="text-[10px] text-indigo-600 hover:underline shrink-0 ml-1.5 cursor-pointer"
                          title="Change Reminder Time"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenReminderModal(note)}
                        className="w-full text-center py-1 rounded-lg border border-dashed border-black/20 hover:border-black/40 text-[10px] font-bold text-black/60 hover:text-black/90 transition cursor-pointer bg-white/40"
                      >
                        + Set Date & Time Alert
                      </button>
                    )}

                    {/* Bottom Actions Bar */}
                    <div className="flex items-center justify-between pt-1 relative">
                      {/* 1-Click Quick Appearance Palette Button */}
                      <button
                        type="button"
                        onClick={() => setStylePopoverNoteId(isStylePopoverOpen ? null : note._id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer border ${
                          isStylePopoverOpen
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white/70 hover:bg-white text-black/70 border-black/15 shadow-2xs'
                        }`}
                        title="Customize Card Color, Font Style & Font Color"
                      >
                        <HiOutlinePaintBrush className="w-3 h-3 text-indigo-600" />
                        <span>Style</span>
                      </button>

                      {/* Right icons */}
                      <div className="flex items-center gap-1">
                        {/* Instant Test Alert */}
                        <button
                          type="button"
                          onClick={() => testReminderMutation.mutate(note._id)}
                          disabled={testReminderMutation.isPending}
                          className="p-1 rounded text-black/45 hover:text-indigo-700 hover:bg-black/5 transition cursor-pointer"
                          title="Test Reminder Now (Sends in-app alert & company email)"
                        >
                          <HiOutlinePaperAirplane className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Note */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(note)}
                          className="p-1 rounded text-black/45 hover:text-black/90 hover:bg-black/5 transition cursor-pointer"
                          title="Edit Note"
                        >
                          <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Note */}
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

                      {/* Popover Menu for In-Place Styling (Card Color + Font Style + Font Color) */}
                      {isStylePopoverOpen && (
                        <div className="absolute bottom-9 left-0 z-30 w-64 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-3 space-y-2.5 animate-fadeIn text-left">
                          {/* Close popover */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                            <span className="text-[11px] font-bold text-slate-800">Card Appearance</span>
                            <button
                              type="button"
                              onClick={() => setStylePopoverNoteId(null)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                            >
                              <HiOutlineXMark className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* 1. Card Background Color (8 options) */}
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

                          {/* 2. Font Style (6 options) */}
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

                          {/* 3. Font / Text Ink Color (8 options) */}
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
        )}
      </div>

      {/* ===================== MODAL: CREATE NEW STICKY NOTE (STICK IT) ===================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div
            className={`rounded-2xl border-2 ${STICKY_THEMES[newForm.color]?.cardBorder || 'border-amber-300'} ${
              STICKY_THEMES[newForm.color]?.bg || 'bg-amber-100'
            } shadow-2xl max-w-lg w-full my-6 p-6 space-y-4 relative transition-colors duration-200`}
            style={{
              boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.15)',
            }}
          >
            {/* Pushpin Graphic */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none">
              <span className="w-5 h-5 rounded-full bg-rose-500 border-2 border-white shadow-md block" />
            </div>

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>📌</span> Stick a New Note
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-black/40 hover:text-black/80 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Note Title Input with Selected Font & Text Color */}
              <div>
                <input
                  type="text"
                  placeholder="Title (optional, e.g. Call Client, Sprint Idea)..."
                  value={newForm.title}
                  onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                  style={{
                    fontFamily: FONT_STYLES[newForm.fontStyle]?.fontFamily,
                    color: newForm.textColor,
                  }}
                  className={`w-full px-3.5 py-2 ${
                    FONT_STYLES[newForm.fontStyle]?.titleSizeClass || 'text-sm'
                  } rounded-xl border border-black/15 bg-white/90 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-black/35`}
                />
              </div>

              {/* Note Content Textarea with Selected Font & Text Color */}
              <div>
                <textarea
                  required
                  rows={4}
                  placeholder="Write your note here... (e.g. Discuss deployment with team lead, submit reports by 4 PM)"
                  value={newForm.content}
                  onChange={(e) => setNewForm({ ...newForm, content: e.target.value })}
                  style={{
                    fontFamily: FONT_STYLES[newForm.fontStyle]?.fontFamily,
                    color: newForm.textColor,
                  }}
                  className={`w-full px-3.5 py-2.5 ${
                    FONT_STYLES[newForm.fontStyle]?.fontSizeClass || 'text-sm'
                  } rounded-xl border border-black/15 bg-white/95 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-black/35`}
                />
              </div>

              {/* 1. Card Background Color (8 options) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-black/75">
                    1. Card Color (8 Options)
                  </label>
                  <span className="text-[10px] font-bold text-black/60 font-mono">
                    {STICKY_THEMES[newForm.color]?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-black/10 overflow-x-auto">
                  {Object.values(STICKY_THEMES).map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setNewForm({ ...newForm, color: th.id })}
                      className={`w-7 h-7 rounded-full ${th.dot} transition cursor-pointer border shrink-0 ${
                        newForm.color === th.id
                          ? 'ring-2 ring-slate-900 scale-110 shadow-sm'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      title={th.name}
                    />
                  ))}
                </div>
              </div>

              {/* 2. Fancy Font Style (6 options) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black/75 mb-1.5">
                  2. Font Style (Fancy Typography)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white/80 p-2 rounded-xl border border-black/10">
                  {Object.values(FONT_STYLES).map((fs) => (
                    <button
                      key={fs.id}
                      type="button"
                      onClick={() => setNewForm({ ...newForm, fontStyle: fs.id })}
                      className={`px-3 py-2 rounded-xl text-left border transition cursor-pointer ${
                        newForm.fontStyle === fs.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="text-xs font-bold leading-tight" style={{ fontFamily: fs.fontFamily }}>
                        {fs.name}
                      </p>
                      <p className="text-[10px] opacity-70 mt-0.5" style={{ fontFamily: fs.fontFamily }}>
                        {fs.sample}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Font / Text Color (8 options) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-black/75">
                    3. Font Ink Color (8 Options)
                  </label>
                  <span className="text-[10px] font-bold text-black/60 font-mono">
                    {TEXT_COLORS.find((tc) => tc.hex === newForm.textColor)?.name || 'Custom'}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-black/10 overflow-x-auto">
                  {TEXT_COLORS.map((tc) => (
                    <button
                      key={tc.id}
                      type="button"
                      onClick={() => setNewForm({ ...newForm, textColor: tc.hex })}
                      className={`w-7 h-7 rounded-full ${tc.bgClass} transition cursor-pointer border shrink-0 ${
                        newForm.textColor === tc.hex
                          ? 'ring-2 ring-slate-900 scale-110 shadow-sm'
                          : 'opacity-75 hover:opacity-100'
                      }`}
                      title={tc.name}
                    />
                  ))}
                </div>
              </div>

              {/* Scheduled Reminder & Email Alert */}
              <div className="bg-white/90 p-4 rounded-xl border border-black/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <HiOutlineBellAlert className="w-4 h-4 text-indigo-600" />
                    Set Date & Time Alert (Optional)
                  </span>
                  {newForm.reminderDate && (
                    <button
                      type="button"
                      onClick={() => setNewForm({ ...newForm, reminderDate: '', reminderTime: '' })}
                      className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyReminderPreset(15, setNewForm)}
                    className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md cursor-pointer"
                  >
                    +15 Mins
                  </button>
                  <button
                    type="button"
                    onClick={() => applyReminderPreset(60, setNewForm)}
                    className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md cursor-pointer"
                  >
                    +1 Hour
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
                    className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md cursor-pointer"
                  >
                    Tomorrow 9:30 AM
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Alert Date</label>
                    <input
                      type="date"
                      value={newForm.reminderDate}
                      onChange={(e) => setNewForm({ ...newForm, reminderDate: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Alert Time</label>
                    <input
                      type="time"
                      value={newForm.reminderTime}
                      onChange={(e) => setNewForm({ ...newForm, reminderTime: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={newForm.sendInAppReminder}
                      onChange={(e) => setNewForm({ ...newForm, sendInAppReminder: e.target.checked })}
                      className="rounded accent-indigo-600"
                    />
                    <span>In-App Notification Popup</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={newForm.sendEmailReminder}
                      onChange={(e) => setNewForm({ ...newForm, sendEmailReminder: e.target.checked })}
                      className="rounded accent-indigo-600"
                    />
                    <span>Send Email Alert from Company Mail</span>
                  </label>
                </div>
              </div>

              {/* Tags & Pin Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black/70 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Urgent, Meeting, Idea"
                    value={newForm.tags}
                    onChange={(e) => setNewForm({ ...newForm, tags: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-black/15 bg-white/90 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black/70 mb-1">
                    Pin Note to Top?
                  </label>
                  <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-black/15 bg-white/90 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={newForm.isPinned}
                      onChange={(e) => setNewForm({ ...newForm, isPinned: e.target.checked })}
                      className="rounded accent-amber-600"
                    />
                    <span>📌 Pin to Top</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/80 hover:bg-white text-slate-700 border border-black/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !newForm.content.trim()}
                  className="inline-flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-slate-900 hover:bg-black text-white shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <HiOutlinePlus className="w-4 h-4" />
                  <span>{createMutation.isPending ? 'Sticking...' : 'Stick It to Board! 📌'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: EDIT STICKY NOTE ===================== */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div
            className={`rounded-2xl border-2 ${STICKY_THEMES[editForm.color]?.cardBorder || 'border-amber-300'} ${
              STICKY_THEMES[editForm.color]?.bg || 'bg-amber-100'
            } shadow-2xl max-w-lg w-full my-6 p-6 space-y-4 relative`}
          >
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <HiOutlinePencilSquare className="w-5 h-5 text-indigo-600" />
                Edit Sticky Note
              </h3>
              <button
                type="button"
                onClick={() => setEditingNote(null)}
                className="p-1.5 rounded-lg text-black/40 hover:text-black/80 cursor-pointer"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Title (optional)"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  style={{
                    fontFamily: FONT_STYLES[editForm.fontStyle]?.fontFamily,
                    color: editForm.textColor,
                  }}
                  className={`w-full px-3.5 py-2 ${
                    FONT_STYLES[editForm.fontStyle]?.titleSizeClass || 'text-sm'
                  } rounded-xl border border-black/15 bg-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />
              </div>

              <div>
                <textarea
                  required
                  rows={4}
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  style={{
                    fontFamily: FONT_STYLES[editForm.fontStyle]?.fontFamily,
                    color: editForm.textColor,
                  }}
                  className={`w-full px-3.5 py-2.5 ${
                    FONT_STYLES[editForm.fontStyle]?.fontSizeClass || 'text-sm'
                  } rounded-xl border border-black/15 bg-white/95 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />
              </div>

              {/* 1. Card Background Color (8 options) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black/75 mb-1.5">
                  Card Color (8 Options)
                </label>
                <div className="flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-black/10 overflow-x-auto">
                  {Object.values(STICKY_THEMES).map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, color: th.id })}
                      className={`w-7 h-7 rounded-full ${th.dot} transition cursor-pointer border shrink-0 ${
                        editForm.color === th.id
                          ? 'ring-2 ring-slate-900 scale-110 shadow-sm'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      title={th.name}
                    />
                  ))}
                </div>
              </div>

              {/* 2. Font Style (6 options) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black/75 mb-1.5">
                  Font Style (6 Options)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white/80 p-2 rounded-xl border border-black/10">
                  {Object.values(FONT_STYLES).map((fs) => (
                    <button
                      key={fs.id}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, fontStyle: fs.id })}
                      className={`px-3 py-2 rounded-xl text-left border transition cursor-pointer ${
                        editForm.fontStyle === fs.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="text-xs font-bold leading-tight" style={{ fontFamily: fs.fontFamily }}>
                        {fs.name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Font Ink Color (8 options) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black/75 mb-1.5">
                  Font Color (8 Options)
                </label>
                <div className="flex items-center gap-2 bg-white/80 p-2 rounded-xl border border-black/10 overflow-x-auto">
                  {TEXT_COLORS.map((tc) => (
                    <button
                      key={tc.id}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, textColor: tc.hex })}
                      className={`w-7 h-7 rounded-full ${tc.bgClass} transition cursor-pointer border shrink-0 ${
                        editForm.textColor === tc.hex
                          ? 'ring-2 ring-slate-900 scale-110 shadow-sm'
                          : 'opacity-75 hover:opacity-100'
                      }`}
                      title={tc.name}
                    />
                  ))}
                </div>
              </div>

              {/* Date & Time Reminder */}
              <div className="p-3.5 bg-white/90 rounded-xl border border-black/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <HiOutlineBellAlert className="w-4 h-4 text-indigo-600" />
                    Scheduled Alert / Reminder
                  </span>
                  {editForm.reminderDate && (
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, reminderDate: '', reminderTime: '' })}
                      className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                    >
                      Clear Reminder
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Date</label>
                    <input
                      type="date"
                      value={editForm.reminderDate}
                      onChange={(e) => setEditForm({ ...editForm, reminderDate: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Time</label>
                    <input
                      type="time"
                      value={editForm.reminderTime}
                      onChange={(e) => setEditForm({ ...editForm, reminderTime: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={editForm.sendEmailReminder}
                      onChange={(e) => setEditForm({ ...editForm, sendEmailReminder: e.target.checked })}
                      className="rounded accent-indigo-600"
                    />
                    <span>Send Company Email Notification</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/80 hover:bg-white text-slate-700 border border-black/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-black text-white shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <HiOutlineCheckCircle className="w-4 h-4" />
                  <span>{updateMutation.isPending ? 'Updating...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: QUICK SET REMINDER & EMAIL NOTIFICATION ===================== */}
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
