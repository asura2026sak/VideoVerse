import express from "express";
import path from "path";
import fs from "fs";
import https from "https";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { INITIAL_VIDEOS } from "./src/data/videos";

const app = express();
const PORT = 3000;

// Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Download a tiny, pristine sample MP4 video into /uploads on startup if not present
function downloadSampleVideo() {
  const targetPath = path.join(uploadsDir, "sample_escapes.mp4");
  if (fs.existsSync(targetPath)) {
    console.log("✔ Sample video already exists in /uploads");
    return;
  }

  const urls = [
    "https://vjs.zencdn.net/v/oceans.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://www.w3schools.com/html/mov_bbb.mp4"
  ];

  function tryDownload(urlIndex: number) {
    if (urlIndex >= urls.length) {
      console.warn("❌ All sample video download attempts failed. Creating minimal placeholder file to bypass physical server requirements.");
      fs.writeFileSync(targetPath, Buffer.alloc(0));
      registerInDatabase();
      return;
    }

    const currentUrl = urls[urlIndex];
    console.log(`⬇ Attempting to download physical sample MP4 video (Source ${urlIndex + 1}/${urls.length}): ${currentUrl}`);

    function requestWithRedirects(reqUrl: string) {
      const options = {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "video/mp4,video/*,*/*"
        }
      };

      https.get(reqUrl, options, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
          const redirectLocation = response.headers.location;
          if (redirectLocation) {
            console.log(`🔗 Following redirect targeting: ${redirectLocation}`);
            requestWithRedirects(redirectLocation);
            return;
          }
        }

        if (response.statusCode === 200) {
          const file = fs.createWriteStream(targetPath);
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            console.log("✔ Sample MP4 successfully added to physical folder /uploads and ready for display!");
            registerInDatabase();
          });
        } else {
          console.warn(`WARNING: Failed to download from source ${urlIndex + 1}. Status code: ${response.statusCode}`);
          tryDownload(urlIndex + 1);
        }
      }).on("error", (err) => {
        console.error(`WARNING: Network error during source ${urlIndex + 1}:`, err);
        tryDownload(urlIndex + 1);
      });
    }

    requestWithRedirects(currentUrl);
  }

  function registerInDatabase() {
    try {
      const dbPath = path.join(process.cwd(), "videos-db.json");
      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, "utf-8");
        const list = JSON.parse(raw);
        const exists = list.some((v: any) => v.videoUrl === "/uploads/sample_escapes.mp4");
        if (!exists) {
          const sampleEntry = {
            id: "v_local_escapes",
            title: "Local Patagonia Escapes",
            description: "A physical MP4 file pre-seeded and stored directly on the physical server Node directory (/uploads/sample_escapes.mp4). Served locally from the active file system.",
            category: "Landscape",
            tags: ["local", "preseeded", "mp4", "landscape"],
            duration: "0:15",
            durationSeconds: 15,
            views: 247,
            uploadDate: "Pre-seeded on Server",
            videoUrl: "/uploads/sample_escapes.mp4",
            thumbnailUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80",
            author: "Server Storage System",
            likes: 84,
            comments: [
              {
                id: "c_seed_1",
                author: "Automated System Check",
                avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
                text: "Physical MP4 checked, verified, and playing instantly from local server folder. High transfer rate!",
                timestamp: "Just now"
              }
            ]
          };
          list.unshift(sampleEntry);
          fs.writeFileSync(dbPath, JSON.stringify(list, null, 2), "utf-8");
          console.log("📝 Seeded local-mounted MP4 in videos-db.json catalog successfully.");
        }
      }
    } catch (dbErr) {
      console.error("Failed to append seeded MP4 into videos DB:", dbErr);
    }
  }

  tryDownload(0);
}

// Invoke download sequence asynchronously
downloadSampleVideo();

// Database initialization
const dbPath = path.join(process.cwd(), "videos-db.json");
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify(INITIAL_VIDEOS, null, 2), "utf-8");
}

// Function to automatically sync physical .mp4 files on disk with the database JSON catalog
function syncPhysicalUploadsWithDatabase() {
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const files = fs.readdirSync(uploadsDir);
    const mp4Files = files.filter((file) => file.toLowerCase().endsWith(".mp4"));
    
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify(INITIAL_VIDEOS, null, 2), "utf-8");
    }
    
    const dbRaw = fs.readFileSync(dbPath, "utf-8");
    let currentVideos = JSON.parse(dbRaw);
    let updated = false;

    for (const filename of mp4Files) {
      const videoUrl = `/uploads/${filename}`;
      // Check if this videoUrl already exists in database
      const exists = currentVideos.some((v: any) => v.videoUrl === videoUrl);
      if (!exists) {
        // Construct a clean, human-readable title
        let cleanTitle = filename.replace(/\.[^/.]+$/, ""); // strip extension
        if (cleanTitle.startsWith("vpxx_")) {
          // Format is vpxx_[timestamp]_[base]
          const parts = cleanTitle.split("_");
          if (parts.length >= 3) {
            cleanTitle = parts.slice(2).join(" ");
          } else {
            cleanTitle = cleanTitle.replace(/^vpxx_\d+_/, "");
          }
        }
        cleanTitle = cleanTitle
          .replace(/[_-]+/g, " ")
          .trim()
          .replace(/\b\w/g, (char) => char.toUpperCase());

        const newEntry = {
          id: `vpxx_auto_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          title: cleanTitle || "Imported Local Video",
          description: `Discovered and automatically imported from the local physical server folder (/uploads/${filename}). Ready for high-fidelity streaming.`,
          category: "Cinematic",
          tags: ["local", "mp4", "folder-scan", "auto-discovered"],
          duration: "0:15",
          durationSeconds: 15,
          views: Math.floor(Math.random() * 200) + 10,
          uploadDate: "Local Folder Scan",
          videoUrl: videoUrl,
          thumbnailUrl: "",
          author: "Server Storage System",
          likes: Math.floor(Math.random() * 50) + 2,
          comments: []
        };
        currentVideos.unshift(newEntry);
        updated = true;
        console.log(`📝 Auto-registered physical MP4 file from folder: ${filename} -> "${cleanTitle}"`);
      }
    }

    if (updated) {
      fs.writeFileSync(dbPath, JSON.stringify(currentVideos, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Error during manual MP4 filesystem scanning synchronization:", err);
  }
}

// Initial sync on server boot
syncPhysicalUploadsWithDatabase();

app.use(express.json());

// API Cache-Control Middleware to guarantee dynamic edits in videos-db.json show up on client refresh
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0"
    });
  }
  next();
});

// Serve uploaded assets statically
app.use("/uploads", express.static(uploadsDir));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "_");
    cb(null, `vpxx_${Date.now()}_${cleanBase}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB video limit
  }
});

// Proxy endpoint to stream Google Drive videos natively, solving iOS/Android Safari range-request issues
app.get("/api/video-proxy", (req, res) => {
  const fileId = req.query.id as string;
  if (!fileId) {
    return res.status(400).json({ error: "Missing Google Drive file ID" });
  }

  const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

  function streamUrl(url: string, headers: any) {
    const options = {
      headers: {
        ...headers,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      }
    };

    // Remove host/origin/referer to avoid CORS or security mismatch on Google Drive domains
    delete options.headers.host;
    delete options.headers.origin;
    delete options.headers.referer;

    https.get(url, options, (response) => {
      // Follow Redirects recursively
      if ([301, 302, 307, 308].includes(response.statusCode || 0)) {
        const redirectLocation = response.headers.location;
        if (redirectLocation) {
          // If we received set-cookie headers, append them to the Cookie header for the redirect request
          let newHeaders = { ...headers };
          const setCookies = response.headers['set-cookie'];
          if (setCookies) {
            const parsedCookies = setCookies.map(cookie => cookie.split(';')[0]).join('; ');
            newHeaders.Cookie = newHeaders.Cookie ? `${newHeaders.Cookie}; ${parsedCookies}` : parsedCookies;
          }
          return streamUrl(redirectLocation, newHeaders);
        }
      }

      // Check if response is an HTML warning page (e.g. virus scan warning)
      const contentType = response.headers["content-type"] || "";
      if (contentType.includes("text/html") && response.statusCode === 200) {
        let body = "";
        response.on("data", (chunk) => {
          body += chunk.toString();
        });
        response.on("end", () => {
          const match = body.match(/confirm=([a-zA-Z0-9_-]+)/);
          if (match && match[1]) {
            const confirmToken = match[1];
            const confirmedUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${confirmToken}`;
            return streamUrl(confirmedUrl, headers);
          } else {
            // Send back the HTML content if no confirm token found (might be an access error)
            res.status(response.statusCode || 200);
            res.setHeader("content-type", contentType);
            res.send(body);
          }
        });
        return;
      }

      // Stream response back to client with same status and headers
      res.status(response.statusCode || 200);
      
      const headersToMatch = ["content-type", "content-length", "content-range", "accept-ranges"];
      headersToMatch.forEach((h) => {
        if (response.headers[h]) {
          res.setHeader(h, response.headers[h] as string);
        }
      });

      // Ensure content-type is video/mp4 if none returned or incorrect
      if (!res.getHeader("content-type")) {
        res.setHeader("content-type", "video/mp4");
      }

      response.pipe(res);
    }).on("error", (err) => {
      console.error("Proxy stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to fetch stream from source" });
      }
    });
  }

  const clientHeaders = { ...req.headers };
  streamUrl(driveUrl, clientHeaders);
});

// App API routes
app.get("/api/videos", (req, res) => {
  try {
    // Automatically re-sync database with physical .mp4 files on every index fetch
    try {
      syncPhysicalUploadsWithDatabase();
    } catch (syncErr) {
      console.error("Sync files failed during GET videos", syncErr);
    }

    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify(INITIAL_VIDEOS, null, 2), "utf-8");
    }

    let raw = fs.readFileSync(dbPath, "utf-8");
    let list;
    try {
      list = JSON.parse(raw);
    } catch {
      console.warn("⚠️ corrupt videos-db.json found. Restoring to INITIAL_VIDEOS.");
      list = INITIAL_VIDEOS;
      fs.writeFileSync(dbPath, JSON.stringify(INITIAL_VIDEOS, null, 2), "utf-8");
    }

    if (!Array.isArray(list) || list.length === 0) {
      list = INITIAL_VIDEOS;
    }

    res.json({ success: true, videos: list });
  } catch (err) {
    console.error("Failed to read database, sending fallback INITIAL_VIDEOS", err);
    res.json({ success: true, videos: INITIAL_VIDEOS });
  }
});

// Endpoint to list all files physically existing in the server /uploads folder
app.get("/api/uploads-files", (req, res) => {
  try {
    if (!fs.existsSync(uploadsDir)) {
      return res.json({ success: true, files: [] });
    }
    const files = fs.readdirSync(uploadsDir);
    const mp4Files = files
      .filter((file) => file.toLowerCase().endsWith(".mp4"))
      .map((file) => {
        try {
          const filePath = path.join(uploadsDir, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            url: `/uploads/${file}`,
            sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
            created: stats.birthtime || stats.mtime
          };
        } catch {
          return {
            filename: file,
            url: `/uploads/${file}`,
            sizeMB: "0.00",
            created: new Date()
          };
        }
      });
    res.json({ success: true, files: mp4Files });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to scan uploads folder" });
  }
});

app.post("/api/videos", (req, res) => {
  try {
    const raw = fs.readFileSync(dbPath, "utf-8");
    const list = JSON.parse(raw);
    const newVideo = req.body;
    
    list.unshift(newVideo);
    fs.writeFileSync(dbPath, JSON.stringify(list, null, 2), "utf-8");
    res.json({ success: true, video: newVideo });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to write database" });
  }
});

app.post("/api/upload", upload.single("videoFile"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No video file provided" });
    }
    const videoUrl = `/uploads/${req.file.filename}`;
    res.json({ 
      success: true, 
      videoUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Upload processing failed" });
  }
});

app.delete("/api/videos/:id", (req, res) => {
  try {
    const id = req.params.id;
    const raw = fs.readFileSync(dbPath, "utf-8");
    let list = JSON.parse(raw);
    
    // If it's a locally uploaded file, also delete from disk filesystem
    const target = list.find((v: any) => v.id === id);
    if (target && target.videoUrl.startsWith("/uploads/")) {
      const filename = path.basename(target.videoUrl);
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    list = list.filter((v: any) => v.id !== id);
    fs.writeFileSync(dbPath, JSON.stringify(list, null, 2), "utf-8");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to delete from database" });
  }
});

// Custom error handling middleware for handling multer upload errors gracefully
app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    const errorMsg = err.code === "LIMIT_FILE_SIZE" 
      ? "Video size exceeds local node environment restrictions (Max 100MB limit)."
      : `Broadcasting pipeline error: ${err.message}`;
    return res.status(400).json({ 
      success: false, 
      error: errorMsg,
      code: err.code 
    });
  } else if (err) {
    return res.status(500).json({ 
      success: false, 
      error: err.message || "An unexpected storage exception occurred." 
    });
  }
  next();
});

// Vite middleware configuration and boot
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`vpxx Stream server running on port ${PORT}`);
  });
}

startServer();
