import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { API_BASE_URL } from '../config';

const isImage = (filename) => {
  if (!filename) return false;
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
};

const AnnouncementsWidget = () => {
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data } = await api.get('/announcements');
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="glass-panel p-6 h-full flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          Company Announcements
        </h2>
      </div>
      
      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        {announcements.filter(ann => !ann.expireDate || new Date(ann.expireDate) >= new Date()).length === 0 ? (
          <p className="text-slate-400 text-sm">No recent announcements.</p>
        ) : (
          announcements
            .filter(ann => !ann.expireDate || new Date(ann.expireDate) >= new Date())
            .map(ann => (
            <div key={ann._id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-indigo-500/50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-white font-medium text-sm leading-tight">{ann.title}</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ml-2 ${
                  ann.priority === 'Urgent' ? 'bg-red-500/20 text-red-400' :
                  ann.priority === 'Important' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {ann.priority}
                </span>
              </div>
              <p className="text-xs text-slate-400 whitespace-pre-wrap break-words mb-3">{ann.content}</p>
              
              {ann.attachments && ann.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
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
                          className="max-w-full h-auto max-h-40 object-cover rounded-lg border border-slate-700 hover:border-indigo-500 transition-colors"
                        />
                      </a>
                    ) : (
                      <a 
                        key={idx} 
                        href={`${API_BASE_URL}${file}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs flex items-center gap-1 bg-slate-900 border border-slate-700 text-slate-300 px-3 py-1.5 rounded hover:bg-slate-800 hover:text-indigo-400 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Attachment {idx + 1}
                      </a>
                    )
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
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
