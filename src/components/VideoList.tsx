import { useState, useMemo } from "react";
import { Search, Eye, Clock, Play } from "lucide-react";
import { Video } from "../types";
import { motion, AnimatePresence } from "motion/react";

// Helper to extract File ID from various Google Drive URL patterns clientside
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

interface VideoListProps {
  videos: Video[];
  activeVideoId: string;
  onSelectVideo: (video: Video) => void;
}

export default function VideoList({ videos, activeVideoId, onSelectVideo }: VideoListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filtering & Sorting Logic
  const filteredAndSortedVideos = useMemo(() => {
    let result = [...videos];

    // 1. Text Search matching title, tags, description, or author
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        v =>
          v.title.toLowerCase().includes(q) ||
          v.author.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q) ||
          v.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }

    // Default sort by popularity (views) to keep clean
    result.sort((a, b) => b.views - a.views);

    return result;
  }, [videos, searchQuery]);

  const clearFilters = () => {
    setSearchQuery("");
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Search and Filters Hub */}
      <div className="bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl border border-slate-800/60 flex flex-col gap-4">
        
        {/* Search Input ONLY */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by title, creator, tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/75 border border-slate-800 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/25 transition-all outline-none"
          />
          {searchQuery && (
            <button
              onClick={clearFilters}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-450 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

      </div>

      {/* Main Grid View */}
      <div className="flex flex-col gap-2.5">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm font-bold text-slate-450 uppercase tracking-wider flex items-center gap-2">
            <span>Result Stream</span>
            <span className="text-xs font-mono font-medium lowercase text-slate-500">
              ({filteredAndSortedVideos.length} items found)
            </span>
          </h2>
        </div>

        <AnimatePresence mode="popLayout">
          {filteredAndSortedVideos.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 px-6 bg-slate-900/20 rounded-2xl border border-slate-800/40 text-center"
            >
              <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-500 mb-3">
                <Search className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">No match found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                Try adjusting your search keywords.
              </p>
              <button 
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-emerald-500/15 text-emerald-400 rounded-xl text-xs font-semibold hover:bg-emerald-500/25 transition-all cursor-pointer border border-emerald-500/10"
              >
                Reset Search Filters
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1 gap-4">
              {filteredAndSortedVideos.map((video) => {
                const isActive = video.id === activeVideoId;
                return (
                  <div
                    key={video.id}
                    onClick={() => onSelectVideo(video)}
                    className={`group cursor-pointer rounded-xl overflow-hidden border p-3 flex flex-col lg:flex-row gap-4 transition-all duration-300 transform hover:scale-[1.015] hover:-translate-y-0.5 ${
                      isActive 
                        ? "bg-slate-800/60 border-emerald-500/80 shadow-md shadow-emerald-500/5 relative" 
                        : "bg-slate-900/30 border-slate-800/70 hover:bg-slate-800/30 hover:border-slate-700/80"
                    }`}
                  >
                    {/* Thumbnail Column */}
                    <div className="relative aspect-video w-full lg:w-44 shrink-0 rounded-lg overflow-hidden bg-slate-950">
                      {video.thumbnailUrl ? (
                        <img 
                          src={video.thumbnailUrl} 
                          alt={video.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            // Automatically fall back to Google Drive video thumbnail if possible
                            const driveId = parseGoogleDriveUrl(video.videoUrl);
                            if (driveId) {
                              (e.target as HTMLImageElement).src = `https://drive.google.com/thumbnail?id=${driveId}&sz=w600`;
                            } else {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80";
                            }
                          }}
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
                      
                      {/* Black/overlay shadow */}
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-colors duration-300" />

                      {/* Active audio-visualizer simulation bar or standard icon */}
                      {isActive && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                          </span>
                          Playing
                        </div>
                      )}

                      {/* Hover play center circle icon */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="p-2.5 rounded-full bg-emerald-500 text-white shadow-md transform scale-90 group-hover:scale-100 transition-all duration-300">
                          <Play fill="currentColor" className="w-3.5 h-3.5 translate-x-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Metadata Content Column */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        {/* Creator/author row (no category) */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] text-slate-400 text-ellipsis overflow-hidden font-medium">
                            {video.author}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-bold leading-snug text-slate-100 group-hover:text-emerald-300 transition-colors line-clamp-1 select-text">
                          {video.title}
                        </h3>

                        {/* Description snippet */}
                        <p className="text-[11px] text-slate-400 font-normal line-clamp-2 mt-1 select-text leading-normal">
                          {video.description}
                        </p>
                      </div>

                      {/* Count elements bar */}
                      <div className="flex items-center gap-3.5 text-[10px] text-slate-500 font-mono mt-3 border-t border-slate-800/40 pt-2 shrink-0">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-slate-500" />
                          {video.views >= 1000000 
                            ? `${(video.views/1000000).toFixed(1)}M` 
                            : video.views >= 1000 
                              ? `${(video.views/1000).toFixed(0)}K` 
                              : video.views
                          }
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {video.uploadDate}
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
