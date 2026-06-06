import { Video } from "../types";

export interface UploadResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
  durationSeconds?: number;
  formattedDuration?: string;
}

/**
 * Shared utility to upload a physical MP4 file to the Express server folder.
 * This acts as the single source-of-truth for sending binary parts to /api/upload.
 */
export async function uploadVideoFile(file: File): Promise<UploadResult> {
  let durationSeconds = 15;
  let formattedDuration = "0:15";

  // 1. Pre-calculate duration client-side immediately on the raw local file blob
  try {
    const objectUrl = URL.createObjectURL(file);
    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";
    tempVideo.src = objectUrl;

    const durationSec = await new Promise<number>((resolve) => {
      tempVideo.onloadedmetadata = () => resolve(tempVideo.duration || 15);
      tempVideo.onerror = () => resolve(15);
    });

    const secTotal = Math.round(durationSec);
    const minutes = Math.floor(secTotal / 60);
    const seconds = secTotal % 60;
    formattedDuration = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    durationSeconds = secTotal;

    // Clean up transient object URL
    URL.revokeObjectURL(objectUrl);
  } catch (durErr) {
    console.warn("Could not probe file duration locally:", durErr);
  }

  // 2. Proactively prevent 413 Payload Too Large by checking if file exceeds 12MB limit
  const MAX_SIZE_BYTES = 12 * 1024 * 1024; // 12 Megabytes
  if (file.size > MAX_SIZE_BYTES) {
    return {
      success: false,
      error: `Size limit exceeded (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max local server storage limit is 12MB. Playback has fallen back to direct client-side stream.`,
      durationSeconds,
      formattedDuration
    };
  }

  // 3. Perform actual fetch request for small-sized files
  const formData = new FormData();
  formData.append("videoFile", file);

  try {
    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text().catch(() => "");
      let parsedError = "Physical server file writing failed.";
      try {
        const data = JSON.parse(errorText);
        parsedError = data.error || parsedError;
      } catch {
        parsedError = errorText || `HTTP Status ${uploadRes.status}`;
      }
      return { 
        success: false, 
        error: parsedError,
        durationSeconds,
        formattedDuration
      };
    }

    const uploadData = await uploadRes.json();
    if (!uploadData.success) {
      return { 
        success: false, 
        error: uploadData.error || "Storage failed on back-end server node.",
        durationSeconds,
        formattedDuration
      };
    }

    return {
      success: true,
      videoUrl: uploadData.videoUrl,
      durationSeconds,
      formattedDuration,
    };
  } catch (err: any) {
    console.error("Shared upload utility exception", err);
    return {
      success: false,
      error: err.message || "Network error. Server storage offline stream style.",
      durationSeconds,
      formattedDuration
    };
  }
}

