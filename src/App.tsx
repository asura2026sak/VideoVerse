import { useState, useEffect, useRef } from "react";
import { INITIAL_VIDEOS } from "./data/videos";
import { Video, Comment } from "./types";
import VideoPlayer from "./components/VideoPlayer";
import VideoList from "./components/VideoList";
import Watchlist from "./components/Watchlist";
import AdminPanel from "./components/AdminPanel";
import SEODashboard from "./components/SEODashboard";
import BannerAd468 from "./components/BannerAd468";
import NativeBannerAd from "./components/NativeBannerAd";
import AboutFeedbackForm from "./components/AboutFeedbackForm";
import BottomRightAd from "./components/BottomRightAd";
import { Tv, Play, Radio, Users, Heart, Sparkles, Film, ArrowLeft, LayoutDashboard, Database, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [videos, setVideos] = useState<Video[]>(INITIAL_VIDEOS);
  const [activeVideo, setActiveVideo] = useState<Video>(INITIAL_VIDEOS[0]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  
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
      // Use dynamic timestamp to prevent browser caching of GET replies
      const response = await fetch(`/api/videos?_t=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && data.videos && data.videos.length > 0) {
        setVideos(data.videos);
        setActiveVideo(prev => {
          if (!prev) return data.videos[0];
          const exists = data.videos.find((v: Video) => v.id === prev.id);
          return exists || data.videos[0];
        });
        
        // Ensure any newly fetched or manually added videos have comment slots initialized
        setCommentsMap(prev => {
          const updated = { ...prev };
          let changed = false;
          data.videos.forEach((v: Video) => {
            if (!updated[v.id]) {
              updated[v.id] = v.comments || [];
              changed = true;
            }
          });
          return changed ? updated : prev;
        });
      } else {
        console.warn("No videos, using backup INITIAL_VIDEOS");
        setVideos(INITIAL_VIDEOS);
      }
    } catch (err) {
      console.error("Failed to fetch custom catalog from backend", err);
      setVideos(INITIAL_VIDEOS);
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
    setIsVideoModalOpen(true);
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

  // Add Interactive Comments and associate them with selected video IDs
  const handleAddComment = (videoId: string, text: string, author: string) => {
    const newComment: Comment = {
      id: `c_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      author: author || "Anonymous Viewer",
      avatar: "",
      text,
      timestamp: "Just now"
    };

    setCommentsMap(prev => {
      const updated = { ...prev };
      updated[videoId] = [newComment, ...(updated[videoId] || [])];
      return updated;
    });
  };



  const handleSelectVideo = (video: Video) => {
    setActiveVideo(video);
    setIsVideoModalOpen(true);
  };

  // Simulated metrics
  const totalLikesCalculated = likedVideoIds.length;
  const watchlistCount = bookmarkedVideoIds.length;

  const isAdminView = currentPath === "/admin" || currentPath === "/admin/";
  const isAboutView = currentPath === "/about" || currentPath === "/about/";

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* 2. Top Navigation Hub (Sleek dark design with logo theme) */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900 px-4 md:px-6 lg:px-8 xl:px-12 py-3.5">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between">
          {/* Futuristic logo trademark 'VideoVerse' with Desktop Navigation Links */}
          <div className="flex items-center gap-6 md:gap-8">
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

            {/* Desktop Navigation Link Tabs */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3 col-nav">
              <button
                onClick={() => navigateTo("/")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono tracking-wider uppercase transition-all duration-150 cursor-pointer ${
                  currentPath === "/" || currentPath === ""
                    ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/50 border border-transparent"
                }`}
              >
                Explore
              </button>
              <button
                onClick={() => navigateTo("/about")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono tracking-wider uppercase transition-all duration-150 cursor-pointer ${
                  currentPath === "/about" || currentPath === "/about/"
                    ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/50 border border-transparent"
                }`}
              >
                About App
              </button>
            </div>
          </div>

          {/* Header Sponsored Ad Banner */}
          <div className="hidden lg:flex items-center justify-center mx-4 overflow-hidden h-[60px]">
            <BannerAd468 inHeader={true} />
          </div>

          {/* Live Simulator Indicators */}
          <div className="flex items-center gap-2 lg:gap-6 text-xs text-slate-400 font-medium">
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

            {/* Admin Console Switcher Link */}
            <button
              onClick={() => navigateTo(isAdminView ? "/" : "/admin")}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 text-emerald-400 hover:text-emerald-350 rounded-lg text-[10px] font-mono transition-all cursor-pointer font-bold"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{isAdminView ? "USER FEED" : "ADMIN STUDIO"}</span>
            </button>

            {/* Mobile Menu Action Toggle Banner */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex md:hidden p-2 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all cursor-pointer focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-emerald-400" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* 2.5 Dynamic Accordor sliding dropdown drawer for responsive mobile layout */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-slate-950 border-b border-slate-900 text-slate-200 overflow-hidden sticky top-[69px] z-45"
          >
            <div className="px-4 py-5 flex flex-col gap-4">
              <div className="text-[9px] uppercase text-emerald-500 font-extrabold font-mono tracking-wider">
                Browse VideoVerse Directory
              </div>
              
              <button
                onClick={() => {
                  navigateTo("/");
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold font-mono transition-all border ${
                  (!isAdminView && !isAboutView) 
                    ? "bg-slate-900/80 text-emerald-400 border-emerald-500/20" 
                    : "text-slate-300 hover:bg-slate-900/50 border-transparent"
                }`}
              >
                <Film className="w-4 h-4 text-emerald-400" />
                <span className="uppercase tracking-wider">🍿 Explore Live Feed</span>
              </button>

              <button
                onClick={() => {
                  navigateTo("/about");
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold font-mono transition-all border ${
                  isAboutView 
                    ? "bg-slate-900/80 text-emerald-400 border-emerald-500/20" 
                    : "text-slate-300 hover:bg-slate-900/50 border-transparent"
                }`}
              >
                <span className="w-4 h-4 text-emerald-400 flex items-center justify-center text-xs">📝</span>
                <span className="uppercase tracking-wider">About VideoVerse</span>
              </button>

              <button
                onClick={() => {
                  navigateTo("/admin");
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold font-mono transition-all border ${
                  isAdminView 
                    ? "bg-slate-950 text-teal-405 border-teal-500/20" 
                    : "text-slate-300 hover:bg-slate-900/50 border-transparent"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-teal-400" />
                <span className="uppercase tracking-wider">🛠️ Administrative Studio</span>
              </button>

              <div className="h-px bg-slate-900/80 my-1" />

              <div className="flex flex-col gap-2">
                <div className="text-[9px] uppercase text-slate-500 font-extrabold font-mono tracking-wider">
                  Live Stats Summary
                </div>

                <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/40 rounded-xl text-xs font-mono border border-slate-900/50">
                  <span className="flex items-center gap-1.5 text-slate-405">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/25" />
                    <span>Liked Streams count:</span>
                  </span>
                  <span className="text-emerald-400 font-bold">{totalLikesCalculated}</span>
                </div>

                <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/40 rounded-xl text-xs font-mono border border-slate-900/50">
                  <span className="flex items-center gap-1.5 text-slate-405">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>My Queued watchlist:</span>
                  </span>
                  <span className="text-emerald-400 font-bold">{watchlistCount}</span>
                </div>

                <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/40 rounded-xl text-xs font-mono border border-slate-900/50">
                  <span className="flex items-center gap-1.5 text-slate-405">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>System Server Engine:</span>
                  </span>
                  <span className="text-emerald-400 font-bold">ONLINE</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        ) : isAboutView ? (
          /* ================== ABOUT ROUTE VIEW PAGE ================== */
          <motion.main 
            key="about-route"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 w-full px-4 md:px-6 lg:px-8 xl:px-12 pt-6 pb-6 md:pb-8 flex flex-col gap-6 md:gap-8 max-w-5xl mx-auto"
          >
            {/* About Page Hero Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-8 md:p-12 rounded-3xl relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 max-w-3xl">
                <span className="text-[10px] bg-emerald-400/10 border border-emerald-500/20 text-emerald-400 font-mono uppercase tracking-widest font-bold px-3 py-1 rounded-md">
                  Who We Are
                </span>
                <h1 className="text-3xl md:text-5xl font-extrabold text-white mt-4 tracking-tight leading-tight">
                  Next-Generation <br />
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
                    Video Streaming Suite
                  </span>
                </h1>
                <p className="text-slate-300 text-sm md:text-base mt-4 leading-relaxed font-sans">
                  VideoVerse is engineered with optimum delivery speeds, an integrated administrative control portal, and customizable media indexing systems to connect viewers instantly to fresh viral content.
                </p>
              </div>
            </div>

            {/* SECTION ABOVE DESCRIPTION - SPONSORED BANNER ADS (Matches requirement: "section above descipton add banner ads") */}
            <div className="flex flex-col gap-5 bg-slate-950/40 p-5 border border-slate-900 rounded-2xl shadow-inner my-2">
              <div className="text-center">
                <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 font-extrabold">Sponsored Platform Support</span>
              </div>
              <BannerAd468 />
              <NativeBannerAd />
            </div>

            {/* Detailed Description and Mission statement */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="about-detailed-descriptions">
              
              {/* Product Mission Box */}
              <div className="bg-slate-900/40 border border-slate-850 p-6 md:p-8 rounded-2xl flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Film className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Our Mission</h3>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-sans">
                  Through seamless media rendering, real-time caching nodes, and structured category filters, VideoVerse's objective is to solve video discovery fatigue. We empower casual creators and administrators to launch their self-hosted video libraries within minutes.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-800/60 flex flex-col gap-2 font-mono text-[11px] text-slate-500">
                  <div className="flex justify-between">
                    <span>Live Catalogs Online:</span>
                    <span className="text-emerald-400 font-bold">{videos.length} Streams</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Infrastructure Status:</span>
                    <span className="text-emerald-400">Low-Latency Static CDN</span>
                  </div>
                </div>
              </div>

              {/* Core Architecture Box */}
              <div className="bg-slate-900/40 border border-slate-850 p-6 md:p-8 rounded-2xl flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500/10 to-amber-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Technical Architecture</h3>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-sans">
                  The application operates as a full-stack system using Vite and Express. Admin users use multipart-data pipelines to post video metadata and write directly to <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-500">/uploads/</code>, allowing the client-side React framework to auto-sync state safely.
                </p>
                <button
                  onClick={() => navigateTo("/admin")}
                  className="mt-auto px-4 py-2.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Launch Admin Suite Control Panel</span>
                </button>
              </div>

            </div>

            {/* Interactive Feedback / Support Ticket Component */}
            <AboutFeedbackForm />

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
            <div className="order-1">
              <Watchlist 
                watchlistIds={bookmarkedVideoIds}
                videos={videos}
                onSelectVideo={handleSelectVideo}
                onRemoveFromWatchlist={handleToggleBookmark}
              />
            </div>

            {/* Banner Ads Center Stage (above video play and list on desktop, ordered below on mobile) */}
            <div className="flex flex-col gap-5 order-3 lg:order-2">
              <BannerAd468 />
              <NativeBannerAd />
            </div>

            {/* Major Stacked Layout */}
            <div className="flex flex-col gap-10 order-2 lg:order-3 w-full animate-fadeIn" ref={playerSectionRef}>
              
              {/* Bottom Section: Full Width Stream Listing (exactly 3 cards per row) */}
              <div className="w-full flex flex-col gap-6 font-sans">
                
                {/* Full-featured Category selectors and video cards queue */}
                <VideoList
                  videos={videos}
                  activeVideoId={activeVideo.id}
                  onSelectVideo={handleSelectVideo}
                />

              </div>

            </div>

            {/* Sponsored ads directly above description (Matches requirement: "section above descipton add banner ads") */}
            <div className="order-4 mt-10 w-full flex flex-col gap-4">
              <div className="text-center">
                <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 font-extrabold">Sponsored Platform Support</span>
              </div>
              <BannerAd468 />
              <NativeBannerAd />
            </div>

            {/* Elegant About Us and Brand Information */}
            <div className="bg-slate-900/30 border border-slate-900/80 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mt-4 order-4">
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

      {/* Elegant Popup/Lightbox Video Player Modal when video is clicked */}
      <AnimatePresence>
        {isVideoModalOpen && (
          <div
            id="video-player-modal"
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 md:p-6"
            onClick={() => setIsVideoModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 10 }}
              transition={{ ease: "easeOut", duration: 0.22 }}
              className="relative w-full h-full sm:h-auto sm:max-h-[92vh] max-w-4xl overflow-y-auto bg-slate-900 border-0 sm:border border-slate-800 rounded-none sm:rounded-2xl shadow-2xl shadow-black flex flex-col gap-0 sm:gap-4 p-0 sm:p-5 scrollbar-thin"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header inside modal */}
              <div className="flex items-center justify-between border-b border-slate-850 px-4 sm:px-0 py-3.5 sm:py-0 sm:pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-extrabold">Active Cinema Stream</span>
                </div>
                <button
                  id="close-modal-btn"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="p-1 px-2.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700/50 hover:border-slate-600 transition-all flex items-center gap-1 cursor-pointer text-xs font-semibold"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>CLOSE</span>
                </button>
              </div>

              {/* Video player view container */}
              <div className="w-full">
                <VideoPlayer
                  video={activeVideo}
                  isLiked={likedVideoIds.includes(activeVideo.id)}
                  isBookmarked={bookmarkedVideoIds.includes(activeVideo.id)}
                  onToggleLike={handleToggleLike}
                  onToggleBookmark={handleToggleBookmark}
                  onImportVideo={handleImportVideo}
                  isModal={true}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Interactive CPM Network Social Bar / Push Ad overlay in bottom right */}
      <BottomRightAd />

    </div>
  );
}
