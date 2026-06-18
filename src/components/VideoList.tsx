import { useState, useMemo, useRef, useEffect } from "react";
import { Search, Eye, Clock, Play, ChevronDown, SlidersHorizontal, ArrowUpDown, CalendarDays } from "lucide-react";
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
}

export default function VideoList({ videos, activeVideoId, onSelectVideo }: VideoListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "most-viewed" | "alphabetical">("most-viewed");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

        {/* Sorting Dropdown Component */}
        <div ref={dropdownRef} className="relative w-full sm:w-52 shrink-0">
          <button
            onClick={() => setIsDropdownOpen(prev => !prev)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-950/75 border border-slate-800 text-slate-100 text-sm hover:border-slate-700 hover:bg-slate-950 transition-all cursor-pointer h-10 select-none outline-none focus:border-emerald-500"
          >
            <div className="flex items-center gap-1.5 text-slate-300">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium text-xs text-slate-400">Sort:</span>
              <span className="text-xs font-semibold text-white">
                {sortBy === "newest" && "Newest"}
                {sortBy === "most-viewed" && "Most Viewed"}
                {sortBy === "alphabetical" && "Alphabetical"}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180 text-emerald-400" : ""}`} />
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
                      ? "bg-emerald-500/10 text-emerald-400" 
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <CalendarDays className={`w-3.5 h-3.5 ${sortBy === "newest" ? "text-emerald-400" : "text-slate-400"}`} />
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
                      ? "bg-emerald-500/10 text-emerald-400" 
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <Eye className={`w-3.5 h-3.5 ${sortBy === "most-viewed" ? "text-emerald-400" : "text-slate-400"}`} />
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
                      ? "bg-emerald-500/10 text-emerald-400" 
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === "alphabetical" ? "text-emerald-400" : "text-slate-400"}`} />
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
                className="mt-4 px-4 py-2 bg-emerald-500/15 text-emerald-400 rounded-xl text-xs font-semibold hover:bg-emerald-500/25 transition-all cursor-pointer border border-emerald-500/10"
              >
                Reset Search Filters
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-5">
              {filteredAndSortedVideos.map((video) => {
                const isActive = video.id === activeVideoId;
                return (
                  <div
                    key={video.id}
                    onClick={() => onSelectVideo(video)}
                    onMouseEnter={() => setHoveredVideoId(video.id)}
                    onMouseLeave={() => setHoveredVideoId(null)}
                    className={`group cursor-pointer rounded-xl border p-2.5 sm:p-3.5 flex flex-col gap-2 sm:gap-3 transition-all duration-300 transform hover:scale-[1.015] hover:-translate-y-0.5 relative ${
                      isActive 
                        ? "bg-slate-800/60 border-emerald-500/80 shadow-md shadow-emerald-500/5" 
                        : "bg-slate-900/30 border-slate-800/70 hover:bg-slate-800/30 hover:border-slate-700/80"
                    }`}
                  >
                    {/* Subtle Hover Tooltip */}
                    <AnimatePresence>
                      {hoveredVideoId === video.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 12, scale: 0.95, x: "-50%" }}
                          animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                          exit={{ opacity: 0, y: 8, scale: 0.95, x: "-50%" }}
                          transition={{ type: "spring", stiffness: 400, damping: 28 }}
                          className="absolute bottom-[calc(100%+12px)] left-1/2 w-48 bg-slate-950/95 backdrop-blur-md border border-emerald-500/35 rounded-xl p-3 shadow-2xl z-40 pointer-events-none flex flex-col gap-1.5 text-left font-sans text-xs select-none"
                        >
                          {/* Decorative down triangle arrow */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-950" />
                          
                          <div className="flex items-center gap-1.5 pb-1.5 border-b border-slate-900 justify-between">
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono">Video Profile</span>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse animate-duration-1000" />
                          </div>

                          <div className="flex flex-col gap-1.5 text-[11px]">
                            {/* Precise Duration */}
                            <div className="flex items-center justify-between text-slate-400">
                              <span className="flex items-center gap-1 text-[10.5px]">
                                <Clock className="w-3.5 h-3.5 text-emerald-400/90 shrink-0" />
                                <span>Duration</span>
                              </span>
                              <span className="font-mono font-bold text-slate-200">
                                {video.duration || "N/A"}
                              </span>
                            </div>

                            {/* Exact Views Count */}
                            <div className="flex items-center justify-between text-slate-400">
                              <span className="flex items-center gap-1 text-[10.5px]">
                                <Eye className="w-3.5 h-3.5 text-emerald-400/90 shrink-0" />
                                <span>Total Views</span>
                              </span>
                              <span className="font-mono font-bold text-slate-200">
                                {video.views.toLocaleString()}
                              </span>
                            </div>

                            {/* Category Tag */}
                            <div className="flex items-center justify-between text-slate-400 mt-0.5 pt-1.5 border-t border-slate-900/80 text-[10px] uppercase font-mono tracking-wider">
                              <span className="text-slate-500">Group</span>
                              <span className="text-emerald-450 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10 shrink-0">
                                {video.category}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Thumbnail Column */}
                    <div className="relative aspect-video w-full shrink-0 rounded-lg overflow-hidden bg-slate-950">
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

                      {/* Video Duration Badge */}
                      {video.duration && (
                        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/85 text-white font-mono text-[9px] font-bold tracking-wide z-15">
                          {video.duration}
                        </div>
                      )}

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
                        <div className="p-2 rounded-full bg-emerald-500 text-slate-950 shadow-md transform scale-90 group-hover:scale-100 transition-all duration-300">
                          <Play fill="currentColor" className="w-3.5 h-3.5 translate-x-0.5 fill-slate-950" />
                        </div>
                      </div>
                    </div>

                    {/* Metadata Content Column (Tube style) */}
                    <div className="flex-1 flex flex-col justify-between min-w-0 mt-1">
                      <div>
                        {/* Title (max 2 lines) */}
                        <h3 className="text-xs font-bold leading-tight text-slate-100 group-hover:text-emerald-455 transition-colors line-clamp-2 select-text tracking-tight">
                          {video.title}
                        </h3>

                        {/* Author/Creator name */}
                        <div className="mt-1 text-[11px] text-slate-400 font-semibold truncate hover:text-white transition-colors duration-250">
                          {video.author}
                        </div>

                        {/* Views and Upload Time info in compact row below Author */}
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 font-medium font-sans">
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
