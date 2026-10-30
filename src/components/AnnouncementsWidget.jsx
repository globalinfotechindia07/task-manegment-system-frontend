import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { API_BASE_URL } from '../config';
import { HiOutlineMegaphone, HiOutlinePaperClip } from 'react-icons/hi2';

const isImage = (filename) => {
  if (!filename) return false;
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
};

const AnnouncementsWidget = () => {
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data } = await api.get('/announcements');
      return Array.isArray(data) ? data : [];
    }
  });

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 h-full flex justify-center items-center shadow-xs">
        <div className="w-7 h-7 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeAnnouncements = announcements.filter(
    ann => !ann.expireDate || new Date(ann.expireDate) >= new Date()
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <HiOutlineMegaphone className="w-4 h-4 text-amber-500" />
          Company Announcements
        </h2>
      </div>
      
      <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
        {activeAnnouncements.length === 0 ? (
          <p className="text-slate-400 text-xs italic py-6 text-center">No recent announcements.</p>
        ) : (
          activeAnnouncements.map(ann => (
            <div key={ann._id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start mb-1.5">
                <h4 className="text-slate-900 font-semibold text-xs leading-snug">{ann.title}</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ml-2 ${
                  ann.priority === 'Urgent' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                  ann.priority === 'Important' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {ann.priority}
                </span>
              </div>
              <p className="text-xs text-slate-600 whitespace-pre-wrap break-words mb-3">{ann.content}</p>
              
              {ann.attachments && ann.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2.5">
                  {ann.attachments.map((file, idx) => (
                    isImage(file) ? (
                      <a 
                        key={idx} 
                        href={`${API_BASE_URL}${file}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="block w-full mt-1"
                      >
                        <img 
                          src={`${API_BASE_URL}${file}`} 
                          alt={`Attachment ${idx + 1}`} 
                          className="max-w-full h-auto max-h-40 object-cover rounded-lg border border-slate-200 hover:border-indigo-500 transition-colors"
                        />
                      </a>
                    ) : (
                      <a 
                        key={idx} 
                        href={`${API_BASE_URL}${file}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 px-2.5 py-1 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-xs"
                      >
                        <HiOutlinePaperClip className="w-3.5 h-3.5" />
                        Attachment {idx + 1}
                      </a>
                    )
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-200/60">
                <span>By {ann.createdBy?.name || 'HR'}</span>
                <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnnouncementsWidget;
