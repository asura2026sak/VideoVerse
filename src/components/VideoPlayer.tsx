import React, { useState, useRef, useEffect } from "react";
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, 
  RotateCcw, ThumbsUp, Bookmark, Share2, 
  Settings, Monitor, Minimize2, X, Sparkles,
  ArrowLeft, RotateCw, ExternalLink, Lock,
  Scaling
} from "lucide-react";
import { Video } from "../types";
import { uploadVideoFile } from "../utils/uploadVideo";
import { motion, AnimatePresence } from "motion/react";

// Helper to extract File ID from various Google Drive URL patterns inside the player
export function parseGoogleDriveUrl(url: string): string | null {
  if (!url) return null;
  
  // 1. Standard file/d/FILE_ID/view
  const dPattern = /\/file\/d\/([a-zA-Z0-9_-]{25,100})/;
  const dMatch = url.match(dPattern);
  if (dMatch && dMatch[1]) return dMatch[1];

  // 2. Query param ?id=FILE_ID
  const idPattern = /[?&]id=([a-zA-Z0-9_-]{25,100})/;
  const idMatch = url.match(idPattern);
  if (idMatch && idMatch[1]) return idMatch[1];

  // 3. docs.google.com/d/FILE_ID/edit
  const docsPattern = /\/d\/([a-zA-Z0-9_-]{25,100})/;
  const docsMatch = url.match(docsPattern);
  if (docsMatch && docsMatch[1]) return docsMatch[1];

  // 4. Return raw string if it looks like a clean 33-char Google Drive ID itself
  const cleanIdPattern = /^[a-zA-Z0-9_-]{25,50}$/;
  if (cleanIdPattern.test(url.trim())) {
    return url.trim();
  }

  return null;
}

interface VideoPlayerProps {
  video: Video;
  isLiked: boolean;
  isBookmarked: boolean;
  onToggleLike: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onImportVideo: (video: Video) => void;
  isModal?: boolean;
}

export default function VideoPlayer({ 
  video, 
  isLiked, 
  isBookmarked, 
  onToggleLike, 
  onToggleBookmark,
  onImportVideo,
  isModal = false
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedControls, setShowSpeedControls] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModalDetails, setShowModalDetails] = useState(false);
  
  const [driveVideoStarted, setDriveVideoStarted] = useState(false);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState<string>("16/9");
  const [videoFitMode, setVideoFitMode] = useState<"contain" | "cover" | "fill">("contain");
  const [showFitControls, setShowFitControls] = useState(false);
  const [useBorderPadding, setUseBorderPadding] = useState(false);
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set and check the 15-minute ad cookie + localStorage tracker
  const handleAdTrackingAndNewTab = () => {
    // 1. Check if cookie exists
    const hasAdCookie = document.cookie.split(";").some((item) => item.trim().startsWith("vidverse_ad_played="));
    
    // 2. Check if localStorage fallback exists and is still valid
    const adExpireVal = localStorage.getItem("vidverse_ad_expire");
    const isLSPermitted = adExpireVal ? parseInt(adExpireVal, 10) > Date.now() : false;

    if (hasAdCookie || isLSPermitted) {
      // Cookie is still valid, let player run normally (no new tab)
      return;
    }

    // Cookie is expired or not set, open the smartlink in a new tab!
    try {
      window.open("https://www.effectivecpmnetwork.com/hswm92uqx?key=910b8f90bb4e41f71cf53632f2325bcb", "_blank", "noopener,noreferrer");
    } catch (e) {
      console.warn("Failed to open smartlink new tab directly, fallback handled.", e);
    }

    // Set cookie to expire in 15 minutes (900 seconds)
    document.cookie = "vidverse_ad_played=true; max-age=900; path=/; SameSite=Lax";
    // Set localStorage fallback (timestamp 15 minutes from now)
    localStorage.setItem("vidverse_ad_expire", (Date.now() + 15 * 60 * 1000).toString());
  };

  // Load new video when source changes
  useEffect(() => {
    setIsExpanded(false);
    setDriveVideoStarted(false);
    setUseIframeFallback(false);
    setHasError(false);
    setVideoAspectRatio("16/9");
    setVideoFitMode("contain");
    setShowFitControls(false);

    const videoNode = videoRef.current;
    if (videoNode) {
      setIsLoading(true);
      videoNode.load();
      setIsPlaying(false);
      setCurrentTime(0);
      setIsLoading(false);
    }
  }, [video.videoUrl]);

  // Handle auto-fade of controls on mouse inactivity in fullscreen
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && isFullscreen) {
        setShowControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, isFullscreen]);

  const togglePlay = () => {
    const videoNode = videoRef.current;
    if (!videoNode) return;

    if (isPlaying) {
      videoNode.pause();
      setIsPlaying(false);
    } else {
      handleAdTrackingAndNewTab();
      videoNode.play().then(() => {
        setIsPlaying(true);
      }).catch(err => console.log("Play failed: ", err));
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (videoRef.current.videoWidth && videoRef.current.videoHeight) {
        setVideoAspectRatio(`${videoRef.current.videoWidth}/${videoRef.current.videoHeight}`);
      }
      setIsLoading(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const seekTime = parseFloat(e.target.value);
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetVolume = parseFloat(e.target.value);
    setVolume(targetVolume);
    if (videoRef.current) {
      videoRef.current.volume = targetVolume;
      videoRef.current.muted = targetVolume === 0;
      setIsMuted(targetVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (newMuted) {
        videoRef.current.volume = 0;
      } else {
        videoRef.current.volume = volume;
      }
    }
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedControls(false);
  };

  const handleFullscreenToggle = () => {
    setIsFullscreen(prev => !prev);
  };

  // Exit fullscreen via Esc key naturally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  const handleShare = () => {
    const simulateUrl = `${window.location.origin}${window.location.pathname}?video=${video.id}`;
    navigator.clipboard.writeText(simulateUrl).then(() => {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    });
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handlePipToggle = async () => {
    const videoNode = videoRef.current;
    if (!videoNode) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoNode.requestPictureInPicture) {
        await videoNode.requestPictureInPicture();
      }
    } catch (e) {
      console.error("Picture-in-picture failed:", e);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleVideoDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    setHasError(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".mp4") || droppedFile.type === "video/mp4") {
        setIsLoading(true);
        try {
          const result = await uploadVideoFile(droppedFile);

          let finalUrl = "";
          let uploadErrorMsg = "";

          if (result.success && result.videoUrl) {
            finalUrl = result.videoUrl;
          } else {
            console.warn("Direct upload failed. Falling back to local Client-side Blob playback.", result.error);
            uploadErrorMsg = result.error || "Transient server storage error";
            finalUrl = URL.createObjectURL(droppedFile);
          }

          // Calculate clean title
          const cleanTitle = droppedFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");

          const newVideo: Video = {
            id: `dropped_v_${Date.now()}`,
            title: cleanTitle,
            description: uploadErrorMsg 
              ? `Local playback fallback (Warning: Server folder save failed due to: ${uploadErrorMsg})`
              : `Dragged & dropped local multimedia MP4 file. High-performance server folder rendering.`,
            category: "Cinematic",
            tags: ["local", "mp4", "dropped", "vpxx"],
            duration: result.formattedDuration || "0:15",
            durationSeconds: result.durationSeconds || 15,
            views: 1,
            uploadDate: "Just imported",
            videoUrl: finalUrl,
            thumbnailUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
            author: "Local Reader",
            likes: 0,
            comments: []
          };

          onImportVideo(newVideo);
        } catch (err) {
          console.error("Drop upload error", err);
          setHasError(true);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleManualFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const activeFile = e.target.files[0];
      setHasError(false);
      setIsLoading(true);
      try {
        const result = await uploadVideoFile(activeFile);

        let finalUrl = "";
        let uploadErrorMsg = "";

        if (result.success && result.videoUrl) {
          finalUrl = result.videoUrl;
        } else {
          console.warn("Direct manual upload failed. Falling back to local Client-side Blob playback.", result.error);
          uploadErrorMsg = result.error || "Transient server storage error";
          finalUrl = URL.createObjectURL(activeFile);
        }

        const cleanTitle = activeFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");

        const newVideo: Video = {
          id: `local_v_${Date.now()}`,
          title: cleanTitle,
          description: uploadErrorMsg 
            ? `Local playback fallback (Warning: Server folder save failed due to: ${uploadErrorMsg})`
            : `Manually chosen local MP4 file. Permanent server file.`,
          category: "Cinematic",
          tags: ["local", "mp4", "vpxx"],
          duration: result.formattedDuration || "0:15",
          durationSeconds: result.durationSeconds || 15,
          views: 1,
          uploadDate: "Just imported",
          videoUrl: finalUrl,
          thumbnailUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
          author: "Local Reader",
          likes: 0,
          comments: []
        };

        onImportVideo(newVideo);
      } catch (err) {
        console.error("Manual selection upload error", err);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const driveId = parseGoogleDriveUrl(video.videoUrl);
  const nativeVideoSrc = driveId 
    ? `/api/video-proxy?id=${driveId}`
    : video.videoUrl;
  const thumbnailSrc = video.thumbnailUrl || (driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000` : "");

  return (
    <div className={`flex flex-col ${isModal ? 'bg-transparent border-none shadow-none -mx-0' : 'bg-slate-950 sm:bg-slate-900/60 sm:backdrop-blur-md rounded-none sm:rounded-2xl border-x-0 border-t-0 sm:border border-slate-800/80 shadow-none sm:shadow-2xl -mx-4 sm:mx-0'} overflow-hidden transition-all duration-300`}>
      
      {/* 2. Hidden manual input */}
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleManualFileChange}
        accept="video/mp4"
        className="hidden"
      />

      {/* 1. Custom Player Wrapper */}
      <div 
        ref={containerRef}
        style={!isFullscreen ? { aspectRatio: videoAspectRatio } : undefined}
        className={`bg-black group overflow-hidden transition-all duration-300 ${
          isFullscreen 
            ? "fixed inset-0 z-[9999] w-screen h-[100dvh] flex items-center justify-center bg-black" 
            : "relative w-full shrink-0"
        } ${isDraggingOver ? "ring-4 ring-emerald-500 scale-[0.99] p-1" : ""}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && isFullscreen && setShowControls(false)}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleVideoDrop}
      >
        {isFullscreen && (
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 z-[10000] p-3 rounded-full bg-black/60 hover:bg-slate-800/80 hover:text-emerald-400 border border-slate-705 text-white cursor-pointer hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-lg"
            title="Exit Fullscreen"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}

        {driveId && useIframeFallback ? (
          <div className="absolute inset-0 w-full h-full bg-black z-10">
            <iframe
              src={`https://drive.google.com/file/d/${driveId}/preview`}
              className="w-full h-full border-0 absolute inset-0 z-10"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        ) : (
          <div className={`absolute inset-0 w-full h-full flex items-center justify-center bg-slate-950/90 transition-all duration-300 ${useBorderPadding ? "p-3.5 sm:p-6 md:p-8" : ""}`}>
            {/* Blurred background of standard HTML5 video if not playing yet */}
            {!isPlaying && thumbnailSrc && (
              <img 
                src={thumbnailSrc}
                alt=""
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover opacity-25 filter blur-lg scale-105 pointer-events-none"
              />
            )}
            <video
              ref={videoRef}
              src={nativeVideoSrc}
              poster={thumbnailSrc}
              className={`w-full h-full max-h-full pointer-events-auto cursor-pointer relative z-10 transition-all duration-300 ${
                useBorderPadding 
                  ? "border border-slate-700/80 rounded-xl shadow-2xl shadow-black ring-4 ring-slate-900/60" 
                  : "bg-transparent"
              } ${
                videoFitMode === "contain" 
                  ? "object-contain" 
                  : videoFitMode === "cover" 
                  ? "object-cover" 
                  : "object-fill"
              }`}
              onClick={togglePlay}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onWaiting={() => setIsLoading(true)}
              onPlaying={() => setIsLoading(false)}
              onEnded={() => setIsPlaying(false)}
              onError={() => {
                if (driveId) {
                  console.warn("Direct stream failed for Google Drive video, falling back to Iframe preview.");
                  setUseIframeFallback(true);
                  setDriveVideoStarted(true);
                } else {
                  setIsLoading(false);
                  setHasError(true);
                }
              }}
              playsInline
            />
          </div>
        )}

        {/* Drag Overlay visual indicator */}
        {isDraggingOver && (
          <div className="absolute inset-0 bg-emerald-520/20 backdrop-blur-xs flex flex-col items-center justify-center gap-2 border border-emerald-500 text-emerald-400 z-50">
            <svg className="w-12 h-12 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="font-bold text-sm tracking-wide">Drop MP4 here to play!</span>
          </div>
        )}

        {/* Loading Spinner */}
        {!(driveId && useIframeFallback) && isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs transition-opacity duration-300">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Error / Offline Fallback placeholder */}
        {!(driveId && useIframeFallback) && hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 px-6 text-center z-10 border border-slate-900">
            <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center mb-2.5">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Stream Offline or CORS Restriction</h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
              Remote sample video servers might be blocked by browser iframe guidelines.
            </p>
            <p className="text-[11px] text-emerald-400 font-bold mt-1 max-w-sm">
              We highly recommend selecting or dragging any local <span className="underline">.mp4</span> computer video file directly here to load.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-[10px] transition-all cursor-pointer uppercase tracking-wider"
            >
              Choose local .mp4 File
            </button>
          </div>
        )}

        {/* Big Centered Play Button (Fades out when playing) */}
        {!(driveId && useIframeFallback) && !isPlaying && !isLoading && !hasError && (
          <div 
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-transparent cursor-pointer transition-colors duration-300 hover:bg-black/15 z-20"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-3 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 hover:bg-emerald-450 hover:scale-110 active:scale-95 transition-all duration-200"
            >
              <Play fill="currentColor" className="w-5 h-5 translate-x-0.5" />
            </motion.div>
          </div>
        )}

        {/* Custom Controller Bar Overlay */}
        {!(driveId && useIframeFallback) && (
          <div 
            className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/65 to-transparent pt-12 pb-4 px-4 flex flex-col gap-3 transition-opacity duration-300 ${
              showControls ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
          {/* Time Scrubber */}
          <div className="flex items-center gap-3 group/scrub">
            <span className="text-xs font-mono text-slate-300 tabular-nums">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 rounded-lg bg-slate-700/80 cursor-pointer accent-emerald-500 hover:h-2 transition-all duration-150 outline-none"
            />
            <span className="text-xs font-mono text-slate-300 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between">
            {/* Play & Vol controls */}
            <div className="flex items-center gap-4">
              <button
                id="play-btn"
                onClick={togglePlay}
                className="p-1.5 text-slate-250 hover:text-white rounded-lg hover:bg-white/10 active:scale-95 transition-all"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause fill="currentColor" className="w-5 h-5" />
                ) : (
                  <Play fill="currentColor" className="w-5 h-5" />
                )}
              </button>

              <button
                id="replay-btn"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    if (!isPlaying) togglePlay();
                  }
                }}
                className="p-1.5 text-slate-250 hover:text-white rounded-lg hover:bg-white/10 active:scale-90 transition-all"
                title="Replay"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2 group/vol">
                <button
                  id="mute-btn"
                  onClick={toggleMute}
                  className="p-1.5 text-slate-250 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover/vol:w-20 transition-all duration-300 h-1 rounded-lg bg-slate-705 accent-emerald-500 cursor-pointer overflow-hidden"
                />
              </div>
            </div>

            {/* Right Side Options */}
            <div className="flex items-center gap-3">
              {/* Full Frame Border & Padding Toggle */}
              <button
                id="border-padding-toggle"
                onClick={() => setUseBorderPadding(!useBorderPadding)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                  useBorderPadding 
                    ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20" 
                    : "text-slate-400 border-transparent hover:text-white hover:bg-white/10"
                }`}
                title="Toggle Outer frame border & padding"
              >
                <Sparkles className={`w-3.5 h-3.5 ${useBorderPadding ? "animate-pulse" : ""}`} />
                <span className="uppercase text-[10px] tracking-wider hidden sm:inline">Frame Padding</span>
                <span className="uppercase text-[10px] tracking-wider inline sm:hidden">Frame</span>
              </button>

              {/* Video Zoom Selector */}
              <div className="relative">
                <button
                  id="fit-settings"
                  onClick={() => {
                    setShowFitControls(!showFitControls);
                    setShowSpeedControls(false);
                  }}
                  className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold hover:text-white px-2.5 py-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-slate-800"
                  title="Video Frame fit"
                >
                  <Scaling className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="uppercase text-[10px] tracking-wider">{videoFitMode === 'contain' ? "Zoom Out" : videoFitMode === 'cover' ? "Zoom In" : "Stretch"}</span>
                </button>

                {showFitControls && (
                  <div className="absolute bottom-full right-0 mb-2 py-1 bg-slate-950 border border-slate-800 rounded-lg shadow-xl flex flex-col min-w-[140px] text-xs z-50 overflow-hidden">
                    {[
                      { mode: "contain", label: "Zoom Out (Original)" },
                      { mode: "cover", label: "Zoom In (Fill)" },
                      { mode: "fill", label: "Stretch Frame" }
                    ].map((item) => (
                      <button
                        key={item.mode}
                        onClick={() => {
                          setVideoFitMode(item.mode as any);
                          setShowFitControls(false);
                        }}
                        className={`px-3 py-2 text-left hover:bg-slate-800/80 transition-colors flex items-center justify-between cursor-pointer ${
                          videoFitMode === item.mode ? "text-emerald-400 font-bold bg-slate-900" : "text-slate-300"
                        }`}
                      >
                        <span>{item.label}</span>
                        {videoFitMode === item.mode && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Playback speed selector */}
              <div className="relative">
                <button
                  id="speed-settings"
                  onClick={() => {
                    setShowSpeedControls(!showSpeedControls);
                    setShowFitControls(false);
                  }}
                  className="flex items-center gap-1 text-xs text-slate-300 font-medium hover:text-white px-2 py-1 rounded-md hover:bg-white/10 transition-colors"
                  title="Playback Speed"
                >
                  <Settings className="w-4 h-4" />
                  <span>{playbackRate === 1 ? "1.0x" : `${playbackRate}x`}</span>
                </button>

                {showSpeedControls && (
                  <div className="absolute bottom-full right-0 mb-2 py-1 bg-slate-950 border border-slate-800 rounded-lg shadow-xl flex flex-col min-w-[70px] text-xs z-50 overflow-hidden">
                    {[0.5, 1, 1.5, 2].map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          handleSpeedChange(r);
                          setShowSpeedControls(false);
                        }}
                        className={`px-3 py-1.5 text-left hover:bg-slate-800 transition-colors ${
                          playbackRate === r ? "text-emerald-400 font-bold bg-slate-900" : "text-slate-300"
                        }`}
                      >
                        {r === 1 ? "Normal" : `${r}x`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Picture in picture */}
              <button
                id="pip-btn"
                onClick={handlePipToggle}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-all"
                title="Picture-in-Picture"
              >
                <Monitor className="w-4.5 h-4.5" />
              </button>

              {/* Fullscreen */}
              <button
                id="fullscreen-btn"
                onClick={handleFullscreenToggle}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-all"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4.5 h-4.5" />
                ) : (
                  <Maximize2 className="w-4.5 h-4.5" />
                )}
              </button>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* 2. Metadata details under current player */}
      <div className={`${isModal ? "px-4 sm:px-0 py-4" : "px-4 py-5 sm:p-6"} flex flex-col gap-4 bg-transparent`}>
        {/* Author Details under Player */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">
              by <span className="text-slate-200 font-bold">{video.author}</span>
            </span>
          </div>
        </div>

        {/* Video Title and Interaction Controls */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold font-sans tracking-tight text-white select-text">
              {video.title}
            </h1>
            <div className="flex gap-4 mt-1.5 text-xs text-slate-400 font-mono transition-all">
              <span>{video.views.toLocaleString()} views</span>
              <span>•</span>
              <span>Uploaded {video.uploadDate}</span>
            </div>
          </div>

          {/* User Interaction Buttons (Likes, Bookmarks, Copy Share Link) */}
          <div className="flex items-center gap-2.5">
            {/* Like */}
            <button
              id={`like-btn-${video.id}`}
              onClick={() => onToggleLike(video.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border transition-all duration-200 active:scale-95 ${
                isLiked 
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-400/30 shadow-md shadow-emerald-500/15" 
                  : "bg-slate-800/40 text-slate-300 border-slate-700/80 hover:bg-slate-850 hover:text-white"
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${isLiked ? "fill-white" : ""}`} />
              <span>{isLiked ? video.likes + 1 : video.likes}</span>
            </button>

            {/* Bookmark */}
            <button
              id={`bookmark-btn-${video.id}`}
              onClick={() => onToggleBookmark(video.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border transition-all duration-200 active:scale-95 ${
                isBookmarked 
                  ? "bg-slate-200 text-slate-900 border-white shadow-xs" 
                  : "bg-slate-800/40 text-slate-300 border-slate-700/80 hover:bg-slate-850 hover:text-white"
              }`}
              title={isBookmarked ? "Remove from Watchlist" : "Save to Watchlist"}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
              <span>{isBookmarked ? "Saved" : "Watch Later"}</span>
            </button>

            {/* Share */}
            <div className="relative">
              <button
                id="share-btn"
                onClick={handleShare}
                className="p-2.5 bg-slate-800/40 text-slate-300 border border-slate-700/80 rounded-xl hover:bg-slate-850 hover:text-white transition-all duration-200 active:scale-95"
                title="Copy Share Link"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showShareToast && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    className="absolute bottom-full right-0 mb-3 px-3 py-1.5 bg-slate-950 text-emerald-400 text-xs font-semibold rounded-lg border border-slate-800 shadow-xl whitespace-nowrap flex items-center gap-1.5 z-50"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Link copied to clipboard!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-slate-800/70" />

          {/* Long Text Description */}
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2">Description</h3>
            <p className={`text-sm text-slate-300 leading-relaxed max-w-none text-justify whitespace-pre-line select-text transition-all ${
              !isExpanded ? "line-clamp-3" : ""
            }`}>
              {video.description}
            </p>
            {video.description.length > 150 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-xs font-bold text-emerald-400 hover:text-emerald-350 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer select-none"
              >
                <span>{isExpanded ? "Read Less" : "Read More..."}</span>
              </button>
            )}
          </div>
        </div>
    </div>
  );
}
