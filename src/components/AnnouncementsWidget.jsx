import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { API_BASE_URL } from '../config';
import { HiOutlineMegaphone, HiOutlinePaperClip } from 'react-icons/hi2';

const isImage = (filename) => {
  if (!filename) return false;
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
};

const getPriorityStyles = (priority) => {
  switch (priority) {
    case 'Urgent':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Important':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200';
  }
};

const AnnouncementsWidget = () => {
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data } = await api.get('/announcements');
      return Array.isArray(data) ? data : [];
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 h-full min-h-[200px] flex justify-center items-center shadow-sm">
        <div className="w-7 h-7 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const activeAnnouncements = announcements.filter(
    (ann) => !ann.expireDate || new Date(ann.expireDate) >= new Date()
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-200 shrink-0">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <HiOutlineMegaphone className="w-4 h-4" />
          </span>
          <span className="truncate">Company Announcements</span>
          {activeAnnouncements.length > 0 && (
            <span className="ml-1 text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full shrink-0">
              {activeAnnouncements.length}
            </span>
          )}
        </h2>
      </div>

      {/* Body */}
      <div className="p-3 sm:p-4 space-y-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {activeAnnouncements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
              <HiOutlineMegaphone className="w-5 h-5" />
            </div>
            <p className="text-slate-500 text-xs font-medium">No recent announcements</p>
            <p className="text-slate-400 text-[11px] mt-0.5">You're all caught up!</p>
          </div>
        ) : (
          activeAnnouncements.map((ann) => (
            <div
              key={ann._id}
              className="p-3 sm:p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-white transition-colors"
            >
              {/* Title + Priority */}
              <div className="flex justify-between items-start gap-2 mb-1.5">
                <h4 className="text-slate-900 font-semibold text-xs leading-snug break-words min-w-0 flex-1">
                  {ann.title}
                </h4>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 border ${getPriorityStyles(
                    ann.priority
                  )}`}
                >
                  {ann.priority}
                </span>
              </div>

              {/* Content */}
              <p className="text-xs text-slate-600 whitespace-pre-wrap break-words mb-3 leading-relaxed">
                {ann.content}
              </p>

              {/* Attachments */}
              {ann.attachments && ann.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2.5">
                  {ann.attachments.map((file, idx) =>
                    isImage(file) ? (
                      <a
                        key={idx}
                        href={`${API_BASE_URL}${file}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full mt-1 group"
                      >
                        <img
                          src={`${API_BASE_URL}${file}`}
                          alt={`Attachment ${idx + 1}`}
                          className="w-full max-h-40 object-cover rounded-lg border border-slate-200 group-hover:border-indigo-400 transition-colors"
                          loading="lazy"
                        />
                      </a>
                    ) : (
                      <a
                        key={idx}
                        href={`${API_BASE_URL}${file}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] sm:text-xs inline-flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors shadow-sm"
                      >
                        <HiOutlinePaperClip className="w-3.5 h-3.5 shrink-0" />
                        <span>Attachment {idx + 1}</span>
                      </a>
                    )
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500 font-medium pt-2 border-t border-slate-200/70">
                <span className="truncate">By {ann.createdBy?.name || 'HR'}</span>
                <span className="shrink-0">
                  {new Date(ann.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnnouncementsWidget;