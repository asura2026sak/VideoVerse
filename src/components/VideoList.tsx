import { useState, useMemo, useRef, useEffect } from "react";
import { Search, Eye, Play, ChevronDown, SlidersHorizontal, ArrowUpDown, CalendarDays } from "lucide-react";
import { Video } from "../types";
import { motion, AnimatePresence } from "motion/react";
import AdBanner from "./AdBanner";

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
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function VideoList({ videos, activeVideoId, onSelectVideo, searchQuery: externalQuery, onSearchChange }: VideoListProps) {
  const [sortBy, setSortBy] = useState<"newest" | "most-viewed" | "alphabetical">("most-viewed");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const searchQuery = externalQuery ?? "";
  const setSearchQuery = (q: string) => {
    if (onSearchChange) onSearchChange(q);
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

    // 2. Sorting based on active dropdown selection
    if (sortBy === "most-viewed") {
      result.sort((a, b) => b.views - a.views);
    } else if (sortBy === "alphabetical") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "newest") {
      result.sort((a, b) => {
        const getPriority = (dateStr: string) => {
          if (!dateStr) return 0;
          const lower = dateStr.toLowerCase();
          if (lower.includes("now")) return 5;
          if (lower.includes("import")) return 4;
          if (lower.includes("append") || lower.includes("link")) return 3;
          if (lower.includes("synced")) return 2;
          if (lower.includes("exist") || lower.includes("store")) return 1;
          return 0;
        };
        const pA = getPriority(a.uploadDate);
        const pB = getPriority(b.uploadDate);
        if (pB !== pA) return pB - pA;
        
        // Fallback to array index in reverse: newer items are placed later
        const indexA = videos.findIndex(v => v.id === a.id);
        const indexB = videos.findIndex(v => v.id === b.id);
        return indexB - indexA;
      });
    }

    return result;
  }, [videos, searchQuery, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Dynamic Ad Placement above video filters */}
      <AdBanner />
      
      {/* Search and Filters Hub */}
      <div className="bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl border border-slate-800/60 flex flex-col sm:flex-row gap-3">
        
        {/* Search Input Box */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by title, creator, tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/75 border border-slate-800 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/25 transition-all outline-none"
          />
          {searchQuery && (
            <button
              onClick={clearFilters}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-red-450 hover:text-red-400 transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Sorting Dropdown Component */}
        <div ref={dropdownRef} className="relative w-full sm:w-52 shrink-0">
          <button
            onClick={() => setIsDropdownOpen(prev => !prev)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-950/75 border border-slate-800 text-slate-100 text-sm hover:border-slate-700 hover:bg-slate-950 transition-all cursor-pointer h-10 select-none outline-none focus:border-red-500"
          >
            <div className="flex items-center gap-1.5 text-slate-300">
              <SlidersHorizontal className="w-3.5 h-3.5 text-red-400" />
              <span className="font-medium text-xs text-slate-400">Sort:</span>
              <span className="text-xs font-semibold text-white">
                {sortBy === "newest" && "Newest"}
                {sortBy === "most-viewed" && "Most Viewed"}
                {sortBy === "alphabetical" && "Alphabetical"}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180 text-red-400" : ""}`} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-30 p-1"
              >
                <button
                  type="button"
                  onClick={() => {
                    setSortBy("newest");
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                    sortBy === "newest" 
                      ? "bg-red-500/10 text-red-400" 
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <CalendarDays className={`w-3.5 h-3.5 ${sortBy === "newest" ? "text-red-400" : "text-slate-400"}`} />
                  <span>Newest</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSortBy("most-viewed");
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                    sortBy === "most-viewed" 
                      ? "bg-red-500/10 text-red-400" 
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <Eye className={`w-3.5 h-3.5 ${sortBy === "most-viewed" ? "text-red-400" : "text-slate-400"}`} />
                  <span>Most Viewed</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSortBy("alphabetical");
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                    sortBy === "alphabetical" 
                      ? "bg-red-500/10 text-red-400" 
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === "alphabetical" ? "text-red-400" : "text-slate-400"}`} />
                  <span>Alphabetical</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
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
                className="mt-4 px-4 py-2 bg-red-500/15 text-red-400 rounded-xl text-xs font-semibold hover:bg-red-500/25 transition-all cursor-pointer border border-red-500/10"
              >
                Reset Search Filters
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredAndSortedVideos.map((video) => {
                const isActive = video.id === activeVideoId;
                return (
                  <div
                    key={video.id}
                    onClick={() => onSelectVideo(video)}
                    className={`group cursor-pointer flex flex-col gap-2 transition-all duration-200 relative`}
                  >
                    {/* Thumbnail Column */}
                    <div className={`relative aspect-video w-full shrink-0 rounded-lg overflow-hidden bg-[#212121] ${isActive ? "ring-2 ring-[#ff0000]" : ""}`}>
                      {video.thumbnailUrl ? (
                        <img 
                          src={video.thumbnailUrl.replace("w=600&q=80", "w=400&q=70")} 
                          alt={video.title}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            // Automatically fall back to Google Drive video thumbnail if possible
                            const driveId = parseGoogleDriveUrl(video.videoUrl);
                            if (driveId) {
                              (e.target as HTMLImageElement).src = `https://drive.google.com/thumbnail?id=${driveId}&sz=w360`;
                            } else {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=70";
                            }
                          }}
                        />
                      ) : parseGoogleDriveUrl(video.videoUrl) ? (
                        <img 
                          src={`https://drive.google.com/thumbnail?id=${parseGoogleDriveUrl(video.videoUrl)}&sz=w360`} 
                          alt={video.title}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          decoding="async"
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

                      {/* HD Badge */}
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-red-400 font-mono text-[9px] font-extrabold tracking-wider z-15">
                        HD
                      </div>

                      {/* Video Duration Badge */}
                      {video.duration && (
                        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/85 text-white font-mono text-[9px] font-bold tracking-wide z-15">
                          {video.duration}
                        </div>
                      )}

                      {/* Active audio-visualizer simulation bar or standard icon */}
                      {isActive && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-[#ff0000] text-white text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                          </span>
                          Playing
                        </div>
                      )}

                      {/* Hover play center circle icon */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="p-2 rounded-full bg-[#ff0000] text-slate-950 shadow-md transform scale-90 group-hover:scale-100 transition-all duration-300">
                          <Play fill="currentColor" className="w-3.5 h-3.5 translate-x-0.5 fill-slate-950" />
                        </div>
                      </div>
                    </div>

                    {/* Metadata Content Column (Card style) */}
                    <div className="flex-1 flex flex-col min-w-0 mt-0.5">
                      {/* Title (max 2 lines) */}
                      <h3 className="text-sm font-semibold leading-snug text-white group-hover:text-white line-clamp-2 select-text tracking-tight">
                        {video.title}
                      </h3>

                      {/* Author/Creator name */}
                      <div className="mt-1 text-[11px] text-slate-400 font-medium truncate hover:text-white transition-colors duration-250">
                        {video.author}
                      </div>

                      {/* Views and Upload Time info in compact row */}
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 font-medium font-sans">
                        <span>
                          {video.views >= 1000000 
                            ? `${(video.views/1000000).toFixed(1)}M` 
                            : video.views >= 1000 
                              ? `${(video.views/1000).toFixed(0)}K` 
                              : video.views
                          } views
                        </span>
                        <span>•</span>
                        <span>{video.uploadDate}</span>
                      </div>

                      {/* Category + tags */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="text-[9px] font-mono bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-red-400 font-bold uppercase tracking-wider">
                          {video.category}
                        </span>
                        {(video.tags || []).slice(0, 2).map((tag) => (
                          <span key={tag} className="text-[9px] font-mono bg-slate-800/50 border border-slate-700/50 px-2 py-0.5 rounded text-slate-400">
                            #{tag}
                          </span>
                        ))}
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
