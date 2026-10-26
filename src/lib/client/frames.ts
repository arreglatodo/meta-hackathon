"use client";

/**
 * Samples frames from the walkthrough in the browser: the video never leaves
 * the phone, only ~1 frame every 2 s at 512 px (well under Vercel's 4.5 MB).
 */
export async function sampleFrames(file: File, onProgress: (n: number, total: number) => void) {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("No pudimos abrir el video."));
  });
  const duration = video.duration;
  if (!Number.isFinite(duration) || duration < 3) throw new Error("El video es muy corto.");
  const count = Math.min(30, Math.max(8, Math.ceil(duration / 2)));
  const canvas = document.createElement("canvas");
  const frames: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = (duration * (i + 0.5)) / count;
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
      video.currentTime = t;
    });
    const scale = 512 / Math.max(video.videoWidth, video.videoHeight);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push(canvas.toDataURL("image/jpeg", 0.7));
    onProgress(i + 1, count);
  }
  URL.revokeObjectURL(url);
  return frames;
}
