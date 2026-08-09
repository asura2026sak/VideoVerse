import React, { useState, useRef, useEffect } from "react";
import { 
  ShieldCheck, UploadCloud, Film, Trash2, 
  Lock, KeyRound, AlertTriangle, CheckCircle, 
  Settings, ArrowLeftRight, Play, Eye,
  FolderClosed, RefreshCw, FileVideo, Link, Cloud
} from "lucide-react";
import { Video } from "../types";
import { uploadVideoFile } from "../utils/uploadVideo";
import { motion, AnimatePresence } from "motion/react";

// Helper to extract File ID from various Google Drive URL patterns
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

interface AdminPanelProps {
  videos: Video[];
  onVideoCreated: () => void;
  onSelectVideo: (video: Video) => void;
  activeVideoId: string;
}

export default function AdminPanel({ 
  videos, 
  onVideoCreated, 
  onSelectVideo,
  activeVideoId 
}: AdminPanelProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const [pinError, setPinError] = useState("");
  
  // Custom Method Switcher
  const [publishMethod, setPublishMethod] = useState<"upload" | "drive">("upload");
  const [driveUrl, setDriveUrl] = useState("");
  
  // Upload States
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("Cinematic");
  const [description, setDescription] = useState("");
  
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [backendError, setBackendError] = useState("");

  // Physical Disk scanned files
  const [scannedFiles, setScannedFiles] = useState<any[]>([]);
  const [isLoadingScannedFiles, setIsLoadingScannedFiles] = useState(false);

  const fetchScannedFiles = async () => {
    try {
      setIsLoadingScannedFiles(true);
      const res = await fetch("/api/uploads-files");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setScannedFiles(data.files || []);
        }
      }
    } catch (err) {
      console.warn("Could not load physical disk attachments:", err);
    } finally {
      setIsLoadingScannedFiles(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchScannedFiles();
    }
  }, [isAdmin]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "vpxx123" || password === "admin" || password === "1234") {
      setIsAdmin(true);
      setPinError("");
      setPassword("");
    } else {
      setPinError("Invalid administration code pattern. Try 'admin' or '1234'.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.endsWith(".mp4") && selected.type !== "video/mp4") {
        setBackendError("Only (.mp4) formats are supported for native streaming.");
        return;
      }
      setFile(selected);
      // Auto-populate clean default title
      const cleanName = selected.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setTitle(cleanName);
      setAuthor("Admin");
      setBackendError("");
    }
  };

  const handleUploadAndPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setBackendError("Please choose a physical .mp4 video file.");
      return;
    }

    setUploadStatus("uploading");
    setUploadProgress(25);

    try {
      setUploadProgress(50);
      
      // Use the shared, single upload video file utility
      const result = await uploadVideoFile(file);

      if (!result.success || !result.videoUrl) {
        throw new Error(result.error || "Physical video upload on server failed.");
      }

      setUploadProgress(85);

      const fallbackThumbnails: Record<string, string> = {
        Animation: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=70",
        "Sci-Fi": "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=400&q=70",
        Landscape: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=70",
        Cinematic: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=70",
        Action: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=400&q=70",
      };

      const selectedThumb = fallbackThumbnails[category] || fallbackThumbnails["Cinematic"];

      // 3. Assemble full video state and post metadata to the database
      const payload: Video = {
        id: `vpxx_upload_${Date.now()}`,
        title: title.trim(),
        description: description.trim() || `Official release of high quality stream: ${title}`,
        category: category,
        tags: ["vpxx", "admin", "premium", category.toLowerCase()],
        duration: result.formattedDuration || "0:15",
        durationSeconds: result.durationSeconds || 15,
        views: 0,
        uploadDate: "Just now",
        videoUrl: result.videoUrl,
        thumbnailUrl: selectedThumb,
        author: author.trim() || "VPXX Administrator",
        likes: 0,
        comments: []
      };

      setUploadProgress(95);

      const resMeta = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!resMeta.ok) {
        throw new Error("Metadata registration failed on backend DB.");
      }

      setUploadProgress(100);
      setUploadStatus("success");

      // Success cleanup
      setTimeout(() => {
        setFile(null);
        setTitle("");
        setAuthor("");
        setDescription("");
        setUploadStatus("idle");
        onVideoCreated(); // Trigger global list re-fetch!
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setBackendError(err.message || "Something went wrong during publisher steps.");
      setUploadStatus("error");
    }
  };

  const handlePublishGoogleDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveUrl.trim()) {
      setBackendError("Please enter a Google Drive shared file URL.");
      return;
    }

    const fileId = parseGoogleDriveUrl(driveUrl);
    if (!fileId) {
      setBackendError("Could not extract a valid file ID. Please verify the URL contains a valid Google Drive file ID.");
      return;
    }

    setUploadStatus("uploading");
    setUploadProgress(40);

    try {
      setUploadProgress(70);
      
      const fallbackThumbnails: Record<string, string> = {
        Animation: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=70",
        "Sci-Fi": "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=400&q=70",
        Landscape: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=70",
        Cinematic: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=70",
        Action: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=400&q=70",
      };

      const selectedThumb = fallbackThumbnails[category] || fallbackThumbnails["Cinematic"];
      const directVideoUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

      const payload: Video = {
        id: `vpxx_drive_${Date.now()}`,
        title: title.trim() || `Google Drive Media ${fileId.slice(0, 6)}`,
        description: description.trim() || `Cloud-streamed MP4 media served directly from shared Google Drive file storage space (File ID: ${fileId}). Requires public 'Anyone with the link can view' permission.`,
        category: category,
        tags: ["vpxx", "google-drive", "cloud", category.toLowerCase()],
        duration: "0:15",
        durationSeconds: 15,
        views: Math.floor(Math.random() * 50) + 15,
        uploadDate: "Google Drive Cloud Link",
        videoUrl: directVideoUrl,
        thumbnailUrl: selectedThumb,
        author: author.trim() || "Drive Publisher",
        likes: Math.floor(Math.random() * 5) + 1,
        comments: []
      };

      setUploadProgress(90);

      const resMeta = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!resMeta.ok) {
        throw new Error("Metadata registration failed on backend DB.");
      }

      setUploadProgress(100);
      setUploadStatus("success");

      // Success cleanup
      setTimeout(() => {
        setDriveUrl("");
        setTitle("");
        setAuthor("");
        setDescription("");
        setUploadStatus("idle");
        onVideoCreated(); // Trigger global list re-fetch!
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setBackendError(err.message || "Something went wrong registering Google Drive Cloud URL.");
      setUploadStatus("error");
    }
  };

  const handleDeleteVideo = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this video from the system?")) return;

    try {
      const res = await fetch(`/api/videos/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        onVideoCreated(); // Re-fetch list
        fetchScannedFiles(); // Re-scan physical storage
      } else {
        alert("Failed to delete video from database on the server.");
      }
    } catch (err) {
      console.error(err);
      alert("Network exception occurred while deleting.");
    }
  };

  const handlePlayPhysicalFile = (fileObj: any) => {
    // Probe/Build a clean display Video metadata container immediately and pass it to user stream player
    const cleanTitle = fileObj.filename.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    const tempVideoEntry: Video = {
      id: `physical_play_${Date.now()}`,
      title: cleanTitle,
      description: `Physical file stored directly inside the server folder /uploads/${fileObj.filename}. Loaded instantly in low latency streaming.`,
      category: "Cinematic",
      tags: ["physical", "disk", "mp4", "direct"],
      duration: "0:15",
      durationSeconds: 15,
      views: 125,
      uploadDate: "Existing Stored File",
      videoUrl: fileObj.url,
      thumbnailUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=70",
      author: "Server Folder Stream",
      likes: 12,
      comments: []
    };
    onSelectVideo(tempVideoEntry);
  };

  const handleRegisterPhysicalFile = async (fileObj: any) => {
    const cleanTitle = fileObj.filename.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    const exists = videos.some(v => v.videoUrl === fileObj.url);
    if (exists) {
      alert("This file is already registered in the database catalog!");
      return;
    }

    const payload: Video = {
      id: `vpxx_upload_${Date.now()}`,
      title: cleanTitle,
      description: `Existing file discovered and registered from the server physical filesystem storage. Original name: ${fileObj.filename}`,
      category: "Cinematic",
      tags: ["vpxx", "folder-scan", "cinematic"],
      duration: "0:15",
      durationSeconds: 15,
      views: 1,
      uploadDate: "Scanned & Appended",
      videoUrl: fileObj.url,
      thumbnailUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=70",
      author: "Discovered Media",
      likes: 0,
      comments: []
    };

    try {
      const resMeta = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (resMeta.ok) {
        onVideoCreated(); // refresh DB feed
        fetchScannedFiles(); // refresh disk scan list
      } else {
        alert("Metadata registration failed on backend DB.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong registering physical file details.");
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-lg flex flex-col gap-4">
      
      {/* Title Segment */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className={`w-4.5 h-4.5 ${isAdmin ? "text-red-400" : "text-amber-500"}`} />
          <span>VPXX Administrative Console</span>
        </h3>
        {isAdmin && (
          <button 
            type="button" 
            onClick={() => setIsAdmin(false)}
            className="text-[10px] bg-slate-805 hover:bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-bold tracking-tight cursor-pointer"
          >
            Lock Mode
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!isAdmin ? (
          /* Login Mode Screen */
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-2"
          >
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Access the stream library as an editor. Publish physical video binaries directly to standard users.
            </p>

            <form onSubmit={handleAdminLogin} className="flex flex-col gap-2.5">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="Enter pin (try 'admin' or '1234')"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (pinError) setPinError("");
                  }}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-950/80 border border-slate-850 text-slate-200 placeholder-slate-600 focus:border-red-500 focus:outline-none transition-colors outline-none font-mono"
                />
              </div>

              {pinError && (
                <div className="text-[11px] text-rose-450 font-semibold flex items-center gap-1.5 px-0.5">
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  <span>{pinError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-slate-800 hover:bg-red-500 hover:text-slate-950 text-slate-200 text-xs font-bold rounded-xl transition-all active:scale-98 cursor-pointer"
              >
                Access Administration
              </button>
            </form>
          </motion.div>
        ) : (
          /* Real Admin Control Dashboard */
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-5 text-xs"
          >
            
            {/* Choose & Upload / Google Drive Link form panel */}
            <form 
              onSubmit={publishMethod === "upload" ? handleUploadAndPublish : handlePublishGoogleDrive} 
              className="flex flex-col gap-3 border-b border-slate-800/50 pb-5"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  {publishMethod === "upload" ? (
                    <>
                      <UploadCloud className="w-3.5 h-3.5 text-red-400" />
                      <span>Publish Video File</span>
                    </>
                  ) : (
                    <>
                      <Link className="w-3.5 h-3.5 text-red-400" />
                      <span>Link Google Drive Stream</span>
                    </>
                  )}
                </div>
              </div>

              {/* Tab Switcher buttons */}
              <div className="grid grid-cols-2 bg-slate-950/60 rounded-xl p-0.5 border border-slate-850 gap-1 mb-1">
                <button
                  type="button"
                  onClick={() => {
                    setPublishMethod("upload");
                    setBackendError("");
                    setUploadStatus("idle");
                  }}
                  className={`py-1.5 px-3 rounded-lg font-bold text-[10px] tracking-wide uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    publishMethod === "upload"
                      ? "bg-red-500 text-slate-950 shadow-xs"
                      : "text-slate-400 hover:text-slate-300"
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Local File</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPublishMethod("drive");
                    setBackendError("");
                    setUploadStatus("idle");
                  }}
                  className={`py-1.5 px-3 rounded-lg font-bold text-[10px] tracking-wide uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    publishMethod === "drive"
                      ? "bg-red-500 text-slate-950 shadow-xs"
                      : "text-slate-400 hover:text-slate-300"
                  }`}
                >
                  <Link className="w-3.5 h-3.5" />
                  <span>Google Drive Link</span>
                </button>
              </div>

              {publishMethod === "upload" ? (
                /* Upload Part */
                <>
                  {!file ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-800 bg-slate-950/40 rounded-xl p-6 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer hover:border-red-500/40 transition-colors"
                    >
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="video/mp4"
                        className="hidden"
                      />
                      <Film className="w-8 h-8 text-slate-600" />
                      <div className="font-semibold text-slate-300">Choose MP4 Video File</div>
                      <p className="text-[10px] text-slate-500">Fast multipart server loading (max 12MB)</p>
                    </div>
                  ) : (
                    <div className="bg-slate-950/70 border border-slate-850 p-2.5 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <Film className="w-4.5 h-4.5 text-red-400 shrink-0" />
                        <span className="font-mono text-slate-205 truncate">{file.name}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          setFile(null);
                          setTitle("");
                        }} 
                        className="text-rose-400 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* Google Drive Link Part */
                <div className="flex flex-col gap-2.5 bg-slate-950/45 p-3.5 rounded-xl border border-slate-850/60">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-300 font-bold uppercase tracking-wider text-[10px] flex items-center justify-between">
                      <span>Paste Google Drive Share Link</span>
                      <span className="text-[9px] text-red-450 normal-case font-normal">(Shared as 'Anyone with link view')</span>
                    </label>
                    <input
                      type="text"
                      value={driveUrl}
                      onChange={(e) => {
                        setDriveUrl(e.target.value);
                        setBackendError("");
                        // Auto-populate title if empty or default drive title
                        const parsedId = parseGoogleDriveUrl(e.target.value);
                        if (parsedId && !title) {
                          setTitle(`Google Drive Stream ${parsedId.slice(0, 6)}`);
                        }
                      }}
                      placeholder="e.g. https://drive.google.com/file/d/FILE_ID/view?usp=sharing"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 focus:border-red-500 rounded-lg text-slate-200 text-xs text-left"
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 leading-relaxed space-y-1 bg-slate-950/20 p-2.5 rounded border border-slate-900">
                    <p className="font-bold text-amber-500">Google Drive share requirements:</p>
                    <ol className="list-decimal pl-4 space-y-0.5 text-[9px] text-slate-400">
                      <li>Open files details in Drive and click <strong className="text-slate-300">Share</strong>.</li>
                      <li>Change permission from "Restricted" to <strong className="text-red-450">"Anyone with the link can view"</strong>.</li>
                      <li>Copy that URL and paste it here. We'll play it natively!</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Common Metadata Fields (only show if file is loaded OR in Google Drive mode) */}
              {((publishMethod === "upload" && file) || publishMethod === "drive") && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-slate-450 font-semibold uppercase tracking-wide">Video Title</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="px-3 py-1.5 bg-slate-950/80 border border-slate-850 focus:border-red-500 focus:outline-none rounded-lg text-slate-200 text-xs"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-slate-450 font-semibold uppercase tracking-wide">Author / Publisher</label>
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="e.g. Cloud Archivist"
                        className="px-3 py-1.5 bg-slate-950/80 border border-slate-850 focus:border-red-500 focus:outline-none rounded-lg text-slate-200 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-slate-450 font-semibold uppercase tracking-wide">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-950/80 border border-slate-850 focus:border-red-500 focus:outline-none rounded-lg text-slate-200 text-xs cursor-pointer"
                      >
                        {["Cinematic", "Animation", "Sci-Fi", "Landscape", "Action"].map(cat => (
                          <option key={cat} value={cat} className="bg-slate-950 text-slate-100">{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-slate-450 font-semibold uppercase tracking-wide">Short Description</label>
                      <input
                        type="text"
                        placeholder="Write dynamic synopsis"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="px-3 py-1.5 bg-slate-950/80 border border-slate-850 focus:border-red-500 focus:outline-none rounded-lg text-slate-200 text-xs"
                      />
                    </div>
                  </div>

                  {uploadStatus === "uploading" && (
                    <div className="flex flex-col gap-1 pt-1.5">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>{publishMethod === "upload" ? "Uploading byte chunks to network server..." : "Mapping Google Drive link parameters..."}</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {uploadStatus === "success" && (
                    <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg font-semibold flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Uploaded successfully! Active instantly on Stream Feed.
                    </div>
                  )}

                  {backendError && (
                    <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg flex items-center gap-1.5 text-rose-300">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                      <span>{backendError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={uploadStatus === "uploading"}
                    className="w-full mt-1.5 py-2 bg-red-500 hover:bg-red-400 text-slate-950 font-bold rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50 text-xs"
                  >
                    {uploadStatus === "uploading" 
                      ? "Broadcasting Stream..." 
                      : publishMethod === "upload" 
                        ? "Publish Local Video File" 
                        : "Publish Google Drive Stream Link"
                    }
                  </button>
                </div>
              )}
            </form>

            {/* List existing streams for cleanups */}
            <div className="flex flex-col gap-2.5">
              <div className="text-xs font-bold text-slate-450 uppercase tracking-widest flex items-center justify-between">
                <span>Manage Published Streams</span>
                <span className="font-mono lowercase text-[10px] text-slate-500">({videos.length} items total)</span>
              </div>

              <div className="flex flex-col gap-2 max-h-[190px] overflow-y-auto pr-1">
                {videos.map(video => (
                  <div 
                    key={`manage-${video.id}`}
                    onClick={() => onSelectVideo(video)}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                      video.id === activeVideoId 
                        ? "bg-slate-800/40 border-red-500/30" 
                        : "bg-slate-950/40 border-slate-850 hover:bg-slate-900/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate flex-1 mr-2">
                      <div className="w-8 aspect-video rounded overflow-hidden shrink-0 bg-slate-950">
                        {video.thumbnailUrl ? (
                          <img 
                            src={video.thumbnailUrl.replace("w=600&q=80", "w=120&q=60")} 
                            alt="" 
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              const driveId = parseGoogleDriveUrl(video.videoUrl);
                              if (driveId) {
                                (e.target as HTMLImageElement).src = `https://drive.google.com/thumbnail?id=${driveId}&sz=w200`;
                              } else {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=120&q=60";
                              }
                            }}
                          />
                        ) : parseGoogleDriveUrl(video.videoUrl) ? (
                          <img 
                            src={`https://drive.google.com/thumbnail?id=${parseGoogleDriveUrl(video.videoUrl)}&sz=w200`} 
                            alt="" 
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
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
                            className="w-full h-full object-cover" 
                          />
                        )}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="font-bold text-[11px] text-slate-200 truncate">{video.title}</span>
                        <span className="text-[9px] text-slate-500">{video.category} • {video.author}</span>
                      </div>
                    </div>

                    <button
                      id={`delete-btn-${video.id}`}
                      onClick={(e) => handleDeleteVideo(video.id, e)}
                      className="p-1.5 bg-slate-950 hover:bg-rose-500/15 text-slate-500 hover:text-rose-400 border border-slate-850 rounded-md transition-colors"
                      title="Permanently Delete file and database record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Folder scanner section */}
            <div className="flex flex-col gap-2.5 border-t border-slate-800/50 pt-5 mt-2">
              <div className="text-xs font-bold text-slate-450 uppercase tracking-widest flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <FolderClosed className="w-4 h-4" />
                  Physical /uploads Folder Stream Storage
                </span>
                <button
                  type="button"
                  onClick={fetchScannedFiles}
                  disabled={isLoadingScannedFiles}
                  className="p-1 px-2 border border-slate-800 hover:border-indigo-450 text-slate-450 hover:text-indigo-400 rounded-md flex items-center gap-1 cursor-pointer transition-colors text-[10px] bg-slate-950/30"
                  title="Force re-scan physical folder on disk"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingScannedFiles ? "animate-spin" : ""}`} />
                  <span>Scan Folder</span>
                </button>
              </div>

              {isLoadingScannedFiles ? (
                <div className="py-6 text-center text-slate-500 font-mono tracking-tight text-[10px]">
                  Scanning filesystem sectors on Node server node...
                </div>
              ) : scannedFiles.length === 0 ? (
                <div className="py-4 text-center rounded-xl border border-slate-850 bg-slate-950/20 text-slate-500 font-mono text-[10.5px]">
                  No physical files found in active storage. Select a video above to upload.
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[170px] overflow-y-auto pr-1">
                  {scannedFiles.map((fileObj) => {
                    const isRegistered = videos.some(v => v.videoUrl === fileObj.url);

                    return (
                      <div 
                        key={fileObj.filename}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-850 bg-slate-950/50 hover:bg-slate-900/20 transition-all"
                      >
                        <div className="flex items-start gap-2.5 truncate flex-1 min-w-0">
                          <FileVideo className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                          <div className="flex flex-col min-w-0">
                            <span className="font-mono text-[10.5px] text-slate-300 truncate" title={fileObj.filename}>
                              {fileObj.filename}
                            </span>
                            <span className="text-[9px] text-slate-500">
                              Size: {fileObj.sizeMB} MB • Added: {new Date(fileObj.created).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 justify-end">
                          <button
                            type="button"
                            onClick={() => handlePlayPhysicalFile(fileObj)}
                            className="px-2 py-1 bg-slate-850 hover:bg-indigo-500 hover:text-slate-950 text-slate-300 text-[10px] font-bold rounded-md flex items-center gap-1 transition-all"
                            title="Play file immediately without database persistence"
                          >
                            <Play className="w-3 h-3" />
                            <span>Play Now</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRegisterPhysicalFile(fileObj)}
                            disabled={isRegistered}
                            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                              isRegistered 
                                ? "bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-850" 
                                : "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20"
                            }`}
                            title={isRegistered ? "Already published on main stream" : "Publish to database list so everyone can see it"}
                          >
                            {isRegistered ? "Published" : "Publish"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
