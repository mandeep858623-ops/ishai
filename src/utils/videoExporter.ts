import { VideoProject, ExportSettings } from '../types/videoEditor';
import { renderCompositeFrame } from './videoCompositor';

export interface ExportProgress {
  progress: number; // 0 - 100
  stage: string;
  currentSecond: number;
  totalSeconds: number;
}

/**
 * Real client-side video rendering and export engine.
 * Renders the multitrack timeline into a downloadable MP4 or WebM video blob.
 */
export async function renderAndExportVideo(
  project: VideoProject,
  settings: ExportSettings,
  onProgress?: (p: ExportProgress) => void,
  checkCancelled?: () => boolean
): Promise<{ blob: Blob; filename: string }> {
  const totalDuration = Math.max(1, project.duration || 10);

  // 1. Determine Export Resolution
  let targetWidth = project.canvas.width;
  let targetHeight = project.canvas.height;
  const aspectRatio = targetWidth / targetHeight;

  if (settings.resolution === '480p') {
    if (aspectRatio >= 1) {
      targetHeight = 480;
      targetWidth = Math.round(480 * aspectRatio);
    } else {
      targetWidth = 480;
      targetHeight = Math.round(480 / aspectRatio);
    }
  } else if (settings.resolution === '720p') {
    if (aspectRatio >= 1) {
      targetHeight = 720;
      targetWidth = Math.round(720 * aspectRatio);
    } else {
      targetWidth = 720;
      targetHeight = Math.round(720 / aspectRatio);
    }
  } else if (settings.resolution === '1080p') {
    if (aspectRatio >= 1) {
      targetHeight = 1080;
      targetWidth = Math.round(1080 * aspectRatio);
    } else {
      targetWidth = 1080;
      targetHeight = Math.round(1080 / aspectRatio);
    }
  }

  // Ensure dimensions are even numbers (required by video encoders like H.264 / VP8)
  targetWidth = targetWidth % 2 === 0 ? targetWidth : targetWidth + 1;
  targetHeight = targetHeight % 2 === 0 ? targetHeight : targetHeight + 1;

  onProgress?.({
    progress: 5,
    stage: 'Initializing rendering canvas & media buffers...',
    currentSecond: 0,
    totalSeconds: totalDuration,
  });

  // 2. Create offscreen render canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not initialize 2D rendering context');

  // 3. Preload all unique video and image elements
  const videoElementsMap = new Map<string, HTMLVideoElement>();
  const imageElementsMap = new Map<string, HTMLImageElement>();

  for (const clip of project.clips) {
    if (clip.type === 'video' && !videoElementsMap.has(clip.sourceUrl)) {
      const v = document.createElement('video');
      v.crossOrigin = 'anonymous';
      v.src = clip.sourceUrl;
      v.muted = true;
      v.playsInline = true;
      v.preload = 'auto';
      await new Promise<void>((resolve) => {
        v.onloadedmetadata = () => resolve();
        v.onerror = () => resolve(); // graceful fallback
        setTimeout(resolve, 3000); // 3s timeout guard
      });
      videoElementsMap.set(clip.sourceUrl, v);
    } else if (clip.type === 'image' && !imageElementsMap.has(clip.sourceUrl)) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = clip.sourceUrl;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        setTimeout(resolve, 2000);
      });
      imageElementsMap.set(clip.sourceUrl, img);
    }
  }

  // 4. Setup Web Audio API Destination for audio mixing
  let audioContext: AudioContext | null = null;
  let audioDest: MediaStreamAudioDestinationNode | null = null;
  const audioTracks: MediaStreamTrack[] = [];

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx && settings.includeAudio) {
      audioContext = new AudioCtx();
      audioDest = audioContext.createMediaStreamDestination();
      const tracks = audioDest.stream.getAudioTracks();
      if (tracks.length > 0) audioTracks.push(tracks[0]);
    }
  } catch (err) {
    console.warn('Web Audio mixer setup notice:', err);
  }

  // 5. Setup MediaRecorder with canvas stream
  const fps = settings.fps || 30;
  const canvasStream = canvas.captureStream(fps);

  // Combine video and audio tracks
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioTracks,
  ]);

  // Determine supported mime type
  let mimeType = 'video/webm;codecs=vp9,opus';
  if (settings.format === 'mp4' && MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2')) {
    mimeType = 'video/mp4;codecs=avc1.42E01E,mp4a.40.2';
  } else if (settings.format === 'mp4' && MediaRecorder.isTypeSupported('video/mp4')) {
    mimeType = 'video/mp4';
  } else if (!MediaRecorder.isTypeSupported(mimeType)) {
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
      mimeType = 'video/webm;codecs=vp8,opus';
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      mimeType = 'video/webm';
    }
  }

  // Bitrate based on quality
  let videoBitsPerSecond = 5_000_000; // 5 Mbps standard
  if (settings.quality === 'draft') videoBitsPerSecond = 2_000_000;
  else if (settings.quality === 'high') videoBitsPerSecond = 10_000_000;

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(combinedStream, {
    mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
    videoBitsPerSecond,
  });

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  recorder.start(100);

  // 6. Step through timeline frame by frame and record
  const stepTime = 1 / fps;
  let currentTime = 0;
  const totalFrames = Math.ceil(totalDuration * fps);
  let currentFrame = 0;

  try {
    while (currentTime <= totalDuration) {
      if (checkCancelled && checkCancelled()) {
        recorder.stop();
        throw new Error('Export cancelled by user.');
      }

      // Seek active video elements to correct source time
      for (const clip of project.clips) {
        if (
          clip.type === 'video' &&
          currentTime >= clip.timelineStart &&
          currentTime < clip.timelineStart + clip.duration
        ) {
          const videoEl = videoElementsMap.get(clip.sourceUrl);
          if (videoEl) {
            const desiredSeek = clip.sourceIn + (currentTime - clip.timelineStart) * (clip.speed || 1);
            if (Math.abs(videoEl.currentTime - desiredSeek) > 0.05) {
              videoEl.currentTime = desiredSeek;
              // wait briefly for seek to resolve
              await new Promise<void>((r) => {
                videoEl.onseeked = () => r();
                setTimeout(r, 40); // 40ms safety
              });
            }
          }
        }
      }

      // Render composite frame
      renderCompositeFrame(
        ctx,
        targetWidth,
        targetHeight,
        project.canvas,
        project.clips,
        currentTime,
        videoElementsMap,
        imageElementsMap,
        { showSafeZoneGuides: false }
      );

      currentFrame++;
      currentTime += stepTime;

      // Update Progress
      const percent = Math.min(95, Math.round((currentFrame / totalFrames) * 90) + 5);
      onProgress?.({
        progress: percent,
        stage: `Compositing frame ${currentFrame}/${totalFrames} (${formatTimeShort(currentTime)})...`,
        currentSecond: currentTime,
        totalSeconds: totalDuration,
      });

      // Allow event loop to process frame drawing
      await new Promise((r) => setTimeout(r, 12));
    }
  } catch (err) {
    if (recorder.state !== 'inactive') recorder.stop();
    throw err;
  }

  onProgress?.({
    progress: 96,
    stage: 'Finalizing and packaging video tracks...',
    currentSecond: totalDuration,
    totalSeconds: totalDuration,
  });

  // Stop recorder and wait for final blob
  const exportPromise = new Promise<{ blob: Blob; filename: string }>((resolve, reject) => {
    recorder.onstop = () => {
      try {
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(chunks, { type: mimeType.split(';')[0] || 'video/webm' });
        const cleanName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_') || 'AI_Video_Edit';
        const filename = `${cleanName}_${Date.now()}.${ext}`;

        onProgress?.({
          progress: 100,
          stage: 'Export complete! Triggering download...',
          currentSecond: totalDuration,
          totalSeconds: totalDuration,
        });

        // Trigger immediate browser download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);

        resolve({ blob, filename });
      } catch (e) {
        reject(e);
      }
    };
    recorder.onerror = (e) => reject(e);
  });

  recorder.stop();
  return exportPromise;
}

function formatTimeShort(seconds: number): string {
  const safeSec = Math.max(0, seconds || 0);
  const mins = Math.floor(safeSec / 60);
  const secs = Math.floor(safeSec % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
