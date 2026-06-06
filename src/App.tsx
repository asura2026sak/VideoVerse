import { useState, useEffect, useRef } from "react";
import { INITIAL_VIDEOS } from "./data/videos";
import { Video, Comment } from "./types";
import VideoPlayer from "./components/VideoPlayer";
import VideoList from "./components/VideoList";
import Watchlist from "./components/Watchlist";
import AdminPanel from "./components/AdminPanel";
import SEODashboard from "./components/SEODashboard";
import { Tv, Play, Radio, Users, Heart, Sparkles, Film, ArrowLeft, LayoutDashboard, Database } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeVideo, setActiveVideo] = useState<Video>(INITIAL_VIDEOS[0]);
  
  // Custom router state tracking window pathname
  const [currentPath, setCurrentPath] = useState(() => {
    return window.location.pathname || "/";
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname || "/");
    };

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("pushstate-navigation", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("pushstate-navigation", handleLocationChange);
    };
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    window.dispatchEvent(new Event("pushstate-navigation"));
  };

  // Fetch full video catalogs dynamically from full-stack system backend
  const fetchVideos = async () => {
    try {
      const response = await fetch("/api/videos");
      const data = await response.json();
      if (data.success && data.videos && data.videos.length > 0) {
        setVideos(data.videos);
        setActiveVideo(prev => {
          if (!prev) return data.videos[0];
          const exists = data.videos.find((v: Video) => v.id === prev.id);
          return exists || data.videos[0];
        });
      }
    } catch (err) {
      console.error("Failed to fetch custom catalog from backend", err);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Save imported video state
  const handleImportVideo = (newVideo: Video) => {
    // Post metadata directly to live database!
    fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newVideo)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        fetchVideos();
      }
    })
    .catch(err => console.error(err));

    // Automatically select to play
    setActiveVideo(newVideo);
    // Smooth scroll back up to player
    playerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Core Interactions Local Storage Sync states
  const [likedVideoIds, setLikedVideoIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("vpxx_likes");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [bookmarkedVideoIds, setBookmarkedVideoIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("vpxx_bookmarks");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>(() => {
    try {
      const saved = localStorage.getItem("vpxx_comments");
      if (saved) return JSON.parse(saved);
      
      // Default initial comments mapped from initial mock data
      const initialMap: Record<string, Comment[]> = {};
      INITIAL_VIDEOS.forEach(v => {
        initialMap[v.id] = v.comments;
      });
      return initialMap;
    } catch {
      const initialMap: Record<string, Comment[]> = {};
      INITIAL_VIDEOS.forEach(v => {
        initialMap[v.id] = v.comments;
      });
      return initialMap;
    }
  });

  // Track scroll position to scroll up to player when video is selected
  const playerSectionRef = useRef<HTMLDivElement>(null);

  // Sync state changes to Local Storage
  useEffect(() => {
    localStorage.setItem("vpxx_likes", JSON.stringify(likedVideoIds));
  }, [likedVideoIds]);

  useEffect(() => {
    localStorage.setItem("vpxx_bookmarks", JSON.stringify(bookmarkedVideoIds));
  }, [bookmarkedVideoIds]);

  useEffect(() => {
    localStorage.setItem("vpxx_comments", JSON.stringify(commentsMap));
  }, [commentsMap]);

  // Handle Likes
  const handleToggleLike = (id: string) => {
    setLikedVideoIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Handle Bookmarks
  const handleToggleBookmark = (id: string) => {
    setBookmarkedVideoIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };



  const handleSelectVideo = (video: Video) => {
    setActiveVideo(video);
    // Smooth scroll up to player
    playerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Simulated metrics
  const totalLikesCalculated = likedVideoIds.length;
  const watchlistCount = bookmarkedVideoIds.length;

  const isAdminView = currentPath === "/admin" || currentPath === "/admin/";

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* 2. Top Navigation Hub (Sleek dark design with logo theme) */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900 px-4 md:px-6 lg:px-8 xl:px-12 py-3.5">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between">
          {/* Futuristic logo trademark 'VideoVerse' */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigateTo("/")}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/20">
              <Film className="w-4.5 h-4.5 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-slate-200 bg-clip-text text-transparent">
                VideoVerse
              </span>
              <span className="text-[9px] text-emerald-400 font-mono tracking-wider uppercase -mt-1 font-bold">
                Streaming Engine
              </span>
            </div>
          </div>

          {/* Live Simulator Indicators */}
          <div className="flex items-center gap-4 lg:gap-6 text-xs text-slate-400 font-medium">
            <div className="hidden sm:flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 text-xs">Engine Online</span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-md">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/25" />
              <span className="text-[10px] uppercase font-mono">Liked: <strong>{totalLikesCalculated}</strong></span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] uppercase font-mono">My Queue: <strong>{watchlistCount}</strong></span>
            </div>
          </div>
        </div>
      </nav>

      {/* 3. Render Route Layout */}
      <AnimatePresence mode="wait">
        {isAdminView ? (
          /* ================== ADMIN ROUTE VIEW PAGE ================== */
          <motion.main 
            key="admin-route"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6"
          >
            {/* Admin Header with navigation */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-slate-900/30 border border-slate-800/80 p-6 rounded-2xl">
              <div>
                <span className="text-xs bg-amber-400/10 border border-amber-500/20 text-amber-400 font-mono uppercase tracking-widest font-bold px-2 py-0.5 rounded-md">
                  Server Control Suite
                </span>
                <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight mt-2 flex items-center gap-2">
                  <LayoutDashboard className="w-6 h-6 text-emerald-400" />
                  <span>Administrative Media Publisher</span>
                </h1>
                <p className="text-slate-450 text-xs mt-1 leading-relaxed">
                  Upload MP4 files to the node server backend directory (<code className="bg-slate-950 px-1 py-0.5 rounded text-amber-400 font-mono text-[10px]">/uploads</code>). Normal users can stream the items automatically in real-time.
                </p>
              </div>

              <button
                onClick={() => navigateTo("/")}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-98 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back to User Feed
              </button>
            </div>

            {/* Main Admin Column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Uploader panel & metadata setup */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <AdminPanel 
                  videos={videos}
                  onVideoCreated={fetchVideos}
                  onSelectVideo={handleSelectVideo}
                  activeVideoId={activeVideo.id}
                />
              </div>

              {/* Informative system logs & metrics */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Server Status Monitor */}
                <div className="p-6 bg-slate-900/60 border border-slate-850 rounded-2xl flex flex-col gap-3 font-mono text-xs">
                  <h4 className="font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800/60 pb-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>Active Server Storage</span>
                  </h4>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Database location:</span>
                      <span className="text-slate-300">/videos-db.json</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Video assets prefix:</span>
                      <span className="text-slate-300">/uploads/*</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total stored media:</span>
                      <span className="text-emerald-400 font-bold">{videos.length} Streams</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Storage engine:</span>
                      <span className="text-slate-300">Node JS + Express Multer</span>
                    </div>
                  </div>
                </div>

                {/* Direct fallbacks instruction card */}
                <div className="p-6 bg-slate-900/40 border border-slate-850/60 rounded-2xl flex flex-col gap-3 text-xs leading-relaxed">
                  <h4 className="font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>How it works</span>
                  </h4>
                  <p className="text-slate-400">
                    When you drop or select a video here, the console pushes the raw binary data to the Express backend multipart route. 
                  </p>
                  <p className="text-slate-400">
                    The backend writes the file to the physical <code className="bg-slate-950 px-1 py-0.5 rounded text-emerald-400">/uploads</code> folder on disk where it becomes immediately accessible over http static files routing, and automatically publishes the new feed.
                  </p>
                </div>

              </div>

            </div>
            
            {/* Dynamic SEO Optimization Dashboard */}
            <SEODashboard />
          </motion.main>
        ) : (
          /* ================== USER CORE FEED VIEW PAGE ================== */
          <motion.main 
            key="user-route"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 w-full px-4 md:px-6 lg:px-8 xl:px-12 pt-0 sm:pt-6 pb-6 md:pb-8 flex flex-col gap-6 md:gap-8 max-w-[1920px] mx-auto"
          >
            {/* Dynamic Watchlist Strip (displays only if user bookmarked something) */}
            <Watchlist 
              watchlistIds={bookmarkedVideoIds}
              videos={videos}
              onSelectVideo={handleSelectVideo}
              onRemoveFromWatchlist={handleToggleBookmark}
            />

            {/* Major Split Shell layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column (Video Player + Comments section) */}
              <div ref={playerSectionRef} className="lg:col-span-8 flex flex-col gap-8">
                
                {/* Custom Interactive HTML5 Video Player */}
                <VideoPlayer
                  video={activeVideo}
                  isLiked={likedVideoIds.includes(activeVideo.id)}
                  isBookmarked={bookmarkedVideoIds.includes(activeVideo.id)}
                  onToggleLike={handleToggleLike}
                  onToggleBookmark={handleToggleBookmark}
                  onImportVideo={handleImportVideo}
                />



              </div>

               {/* Right Column (Category Slider + Search Filters + Stream Listing) */}
              <div className="lg:col-span-4 flex flex-col gap-6 sticky top-20 max-h-[90vh] overflow-y-auto pr-2 no-scrollbar pb-12 font-sans">
                


                 {/* Full-featured Category selectors and video cards queue */}
                <VideoList
                  videos={videos}
                  activeVideoId={activeVideo.id}
                  onSelectVideo={handleSelectVideo}
                />

              </div>

            </div>

            {/* Elegant About Us and Brand Information */}
            <div className="bg-slate-900/30 border border-slate-900/80 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mt-6">
              <div className="max-w-4xl">
                <span id="about-label" className="text-[10px] bg-emerald-400/10 border border-emerald-500/20 text-emerald-400 font-mono uppercase tracking-widest font-bold px-2.5 py-1 rounded-md">
                  About Us
                </span>
                <h3 className="text-lg md:text-xl font-extrabold text-slate-100 tracking-tight mt-3">
                  VideoVerse - Trending Videos Updated Daily
                </h3>
                <p className="text-slate-400 text-xs md:text-sm mt-2 leading-relaxed">
                  VideoVerse is an online video platform dedicated to helping users discover trending and popular videos. Our goal is to provide an easy and enjoyable way to explore fresh content and stay connected with the latest video trends.
                </p>
                <p className="text-slate-500 text-[11px] mt-1.5 leading-relaxed italic">
                  VideoVerse is a video discovery platform featuring trending, viral, and popular videos updated daily.
                </p>
              </div>
              <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl max-w-xs w-full text-xs font-mono text-slate-400 flex flex-col gap-1.5 shrink-0">
                <div className="text-slate-350 font-bold border-b border-slate-800 pb-1 uppercase tracking-wider text-[10px] flex items-center gap-1.5 text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Platform Metrics</span>
                </div>
                <div>⚡ Zero Server Latency</div>
                <div>🔥 Premium Smart Search</div>
                <div>🍿 Trending Curator Feed</div>
              </div>
            </div>

          </motion.main>
        )}
      </AnimatePresence>

      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 md:px-6 lg:px-8 xl:px-12 mt-16">
        <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-slate-400 tracking-wider">VideoVerse</span>
            <span>• © 2026 Sandbox Stream Engine</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="hover:text-emerald-450 transition-colors cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-emerald-450 transition-colors cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-emerald-450 transition-colors cursor-pointer">VOD Solutions</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
