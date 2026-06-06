import { Video } from "../types";
import { Bookmark, Play, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Helper to extract File ID from various Google Drive URL patterns client-side
export function parseGoogleDriveUrl(url: string): string | null {
  if (!url) return null;
  const dPattern = /\/file\/d\/([a-zA-Z0-9_-]{25,100})/;
  const dMatch = url.match(dPattern);
  if (dMatch && dMatch[1]) return dMatch[1];

  const idPattern = /[?&]id=([a-zA-Z0-9_-]{25,100})/;
  const idMatch = url.match(idPattern);
  if (idMatch && idMatch[1]) return idMatch[1];

  const docsPattern = /\/d\/([a-zA-Z0-9_-]{25,100})/;
  const docsMatch = url.match(docsPattern);
  if (docsMatch && docsMatch[1]) return docsMatch[1];

  const cleanIdPattern = /^[a-zA-Z0-9_-]{25,50}$/;
  if (cleanIdPattern.test(url.trim())) {
    return url.trim();
  }
  return null;
}

interface WatchlistProps {
  watchlistIds: string[];
  videos: Video[];
  onSelectVideo: (video: Video) => void;
  onRemoveFromWatchlist: (id: string) => void;
}

export default function Watchlist({ 
  watchlistIds, 
  videos, 
  onSelectVideo, 
  onRemoveFromWatchlist 
}: WatchlistProps) {
  
  // Find full videos matching stored list IDs
  const watchlistVideos = videos.filter(v => watchlistIds.includes(v.id));

  if (watchlistVideos.length === 0) return null;

  return (
    <div className="mt-4 sm:mt-0 bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-slate-800/80 shadow-lg flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Bookmark className="w-4.5 h-4.5 text-amber-400 fill-amber-400" />
          <span>My Saved Watch Later ({watchlistVideos.length})</span>
        </h3>
        <p className="text-[10px] text-slate-400 italic">Saved in your local storage</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
        <AnimatePresence mode="popLayout">
          {watchlistVideos.map((video) => (
            <motion.div
              key={`watchlist-${video.id}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-36 shrink-0 group cursor-pointer"
            >
              {/* Thumbnail Container */}
              <div 
                onClick={() => onSelectVideo(video)}
                className="relative aspect-video rounded-lg overflow-hidden bg-slate-950 border border-slate-800/80 hover:border-emerald-500/50 transition-all duration-350"
              >
                {video.thumbnailUrl ? (
                  <img 
                    src={video.thumbnailUrl} 
                    alt={video.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : parseGoogleDriveUrl(video.videoUrl) ? (
                  <img 
                    src={`https://drive.google.com/thumbnail?id=${parseGoogleDriveUrl(video.videoUrl)}&sz=w600`} 
                    alt={video.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const driveId = parseGoogleDriveUrl(video.videoUrl);
                      if (driveId) {
                        (e.target as HTMLImageElement).src = `https://lh3.googleusercontent.com/d/${driveId}`;
                      }
                    }}
                  />
                ) : (
                  <video 
                    src={video.videoUrl} 
                    preload="metadata"
                    muted
                    playsInline
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                
                {/* Overlay hover play */}
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/45 transition-colors duration-300 flex items-center justify-center">
                  <Play fill="currentColor" className="w-5 h-5 text-transparent group-hover:text-white transition-opacity duration-300 scale-90 group-hover:scale-100" />
                </div>
              </div>

              {/* Title & Creator */}
              <div className="mt-2 text-[11px] font-bold text-slate-200 line-clamp-1 group-hover:text-emerald-450 transition-colors" onClick={() => onSelectVideo(video)}>
                {video.title}
              </div>

              {/* Absolute top action button to quick remove */}
              <button
                id={`remove-watchlist-${video.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFromWatchlist(video.id);
                }}
                className="absolute -top-1.5 -right-1.5 p-1 bg-slate-950 text-slate-400 hover:text-rose-400 rounded-full border border-slate-800 shadow-md hover:scale-110 active:scale-95 transition-all opacity-80 group-hover:opacity-100"
                title="Remove from Watchlist"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
