/**
 * Real-Time Client-Side Face Tracking Service for HOLO AI
 * Supports MediaPipe Face Landmarker with fallback to High-Speed Canvas Optical Vision.
 * 100% On-Device Local Processing. Zero Cloud Uploads.
 */

import { FilesetResolver, FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision';

export interface FaceTrackingMetrics {
  detected: boolean;
  // Head Rotations (in radians, smoothed)
  headYaw: number;   // -1 (turned right from user view) to +1 (turned left)
  headPitch: number; // -1 (looking up) to +1 (looking down)
  headRoll: number;  // -1 (tilted left) to +1 (tilted right)

  // Expressions (0 to 1)
  mouthOpen: number;     // 0 (closed) to 1 (wide open)
  mouthSmile: number;    // 0 (neutral) to 1 (broad smile)
  eyebrowRaise: number;  // 0 to 1
  eyeBlinkLeft: number;  // 0 (open) to 1 (closed)
  eyeBlinkRight: number; // 0 (open) to 1 (closed)
  eyeGazeX: number;      // -1 to 1
  eyeGazeY: number;      // -1 to 1

  // Telemetry
  trackingFps: number;
  engine: 'mediapipe' | 'canvas_vision' | 'idle';
}

export const DEFAULT_FACE_METRICS: FaceTrackingMetrics = {
  detected: false,
  headYaw: 0,
  headPitch: 0,
  headRoll: 0,
  mouthOpen: 0,
  mouthSmile: 0,
  eyebrowRaise: 0,
  eyeBlinkLeft: 0,
  eyeBlinkRight: 0,
  eyeGazeX: 0,
  eyeGazeY: 0,
  trackingFps: 0,
  engine: 'idle',
};

export type FaceTrackingMode = 'mirror' | 'smart_assistant';

export interface VideoDeviceOption {
  deviceId: string;
  label: string;
}

class FaceTrackingService {
  private mediaStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private canvasCtx: CanvasRenderingContext2D | null = null;
  private landmarker: FaceLandmarker | null = null;
  private isInitializing = false;
  private isRunning = false;
  private animFrameId: number = 0;
  private lastVideoTime = -1;
  private frameCount = 0;
  private lastFpsCalcTime = performance.now();
  private currentFps = 0;

  // Smoothing buffers (low-pass filter)
  private smoothedMetrics: FaceTrackingMetrics = { ...DEFAULT_FACE_METRICS };
  private onMetricsCallback: ((metrics: FaceTrackingMetrics) => void) | null = null;
  private activeEngine: 'mediapipe' | 'canvas_vision' | 'idle' = 'idle';

  /**
   * Enumerate available video input cameras (webcams / front & back mobile cameras)
   */
  async getCameraDevices(): Promise<VideoDeviceOption[]> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return [];
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1}`,
        }));
    } catch (e) {
      console.warn('Camera device enumeration notice:', e);
      return [];
    }
  }

  /**
   * Initialize MediaPipe FaceLandmarker with robust error recovery
   */
  private async initMediaPipe(): Promise<boolean> {
    if (this.landmarker) return true;
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      this.landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      });
      return true;
    } catch (err) {
      console.warn('MediaPipe WASM load notice (activating Canvas Vision Engine fallback):', err);
      return false;
    }
  }

  /**
   * Start Camera Stream & Begin Face Tracking Loop
   */
  async startTracking(
    videoEl: HTMLVideoElement,
    canvasEl: HTMLCanvasElement,
    deviceId?: string,
    onMetrics?: (metrics: FaceTrackingMetrics) => void
  ): Promise<{ success: boolean; error?: string }> {
    if (this.isRunning) {
      this.stopTracking();
    }

    this.videoElement = videoEl;
    this.canvasElement = canvasEl;
    this.canvasCtx = canvasEl.getContext('2d', { willReadFrequently: true });
    this.onMetricsCallback = onMetrics || null;

    try {
      // 1. Request Camera Permission & MediaStream
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: deviceId ? undefined : 'user', // Default front-facing camera on mobile
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.mediaStream;
      await this.videoElement.play();

      this.isRunning = true;
      this.lastVideoTime = -1;

      // 2. Try MediaPipe initialization in background; fallback to Canvas Vision immediately
      this.activeEngine = 'canvas_vision';
      this.initMediaPipe().then((mpReady) => {
        if (mpReady && this.isRunning) {
          this.activeEngine = 'mediapipe';
        }
      });

      // 3. Kick off tracking loop
      this.loop();
      return { success: true };
    } catch (err: any) {
      this.stopTracking();
      const isPermissionDenied =
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      const msg = isPermissionDenied
        ? 'Camera permission denied. Please allow camera access in your browser address bar.'
        : `Camera initialization error: ${err.message || 'Device camera unavailable'}`;
      return { success: false, error: msg };
    }
  }

  /**
   * Stop Camera and Clean Up All Resources
   */
  stopTracking() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    this.activeEngine = 'idle';
    this.smoothedMetrics = { ...DEFAULT_FACE_METRICS };
    if (this.onMetricsCallback) {
      this.onMetricsCallback({ ...DEFAULT_FACE_METRICS });
    }
  }

  /**
   * Main High-Speed Tracking Loop
   */
  private loop = () => {
    if (!this.isRunning || !this.videoElement) return;

    // Track FPS
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsCalcTime >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsCalcTime));
      this.frameCount = 0;
      this.lastFpsCalcTime = now;
    }

    if (this.videoElement.readyState >= 2) {
      if (this.activeEngine === 'mediapipe' && this.landmarker) {
        this.processMediaPipeFrame(now);
      } else {
        this.processCanvasVisionFrame();
      }
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Process Frame with MediaPipe Face Landmarker
   */
  private processMediaPipeFrame(now: number) {
    if (!this.landmarker || !this.videoElement) return;

    if (this.videoElement.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.videoElement.currentTime;

      try {
        const results: FaceLandmarkerResult = this.landmarker.detectForVideo(
          this.videoElement,
          now
        );

        if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
          const landmarks = results.faceLandmarks[0];

          // Compute 3D Head Orientation from Key Facial Landmarks
          // Nose Tip: 1, Chin: 152, Left Ear/Cheek: 234, Right Ear/Cheek: 454, Forehead: 10
          const nose = landmarks[1];
          const chin = landmarks[152];
          const forehead = landmarks[10];
          const leftCheek = landmarks[234];
          const rightCheek = landmarks[454];

          // Head Yaw (Left / Right): difference between nose and mid-cheek X
          const midCheekX = (leftCheek.x + rightCheek.x) / 2;
          const rawYaw = (nose.x - midCheekX) * 3.8;

          // Head Pitch (Up / Down): difference between nose and vertical center
          const midFaceY = (forehead.y + chin.y) / 2;
          const rawPitch = (nose.y - midFaceY) * 4.2;

          // Head Roll (Tilt): angle between cheeks
          const dY = rightCheek.y - leftCheek.y;
          const dX = rightCheek.x - leftCheek.x;
          const rawRoll = Math.atan2(dY, dX);

          // Blendshapes Extraction
          let rawMouthOpen = 0;
          let rawMouthSmile = 0;
          let rawBrowRaise = 0;
          let rawBlinkL = 0;
          let rawBlinkR = 0;

          if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
            const categories = results.faceBlendshapes[0].categories;
            const findScore = (name: string) => categories.find((c) => c.categoryName === name)?.score || 0;

            rawMouthOpen = findScore('jawOpen');
            const smileL = findScore('mouthSmileLeft');
            const smileR = findScore('mouthSmileRight');
            rawMouthSmile = Math.max(smileL, smileR);

            const browUpL = findScore('browOuterUpLeft');
            const browUpR = findScore('browOuterUpRight');
            const browMid = findScore('browInnerUp');
            rawBrowRaise = Math.max(browUpL, browUpR, browMid);

            rawBlinkL = findScore('eyeBlinkLeft');
            rawBlinkR = findScore('eyeBlinkRight');
          } else {
            // Geometrical backup calculation from landmark distances
            // Mouth Height (landmark 13 upper lip to 14 lower lip)
            const upperLip = landmarks[13];
            const lowerLip = landmarks[14];
            const mouthH = Math.hypot(upperLip.x - lowerLip.x, upperLip.y - lowerLip.y);
            const faceH = Math.hypot(forehead.x - chin.x, forehead.y - chin.y) || 1;
            rawMouthOpen = Math.min(1.0, Math.max(0, (mouthH / faceH - 0.02) * 8));

            // Mouth Width (landmark 61 to 291)
            const mouthL = landmarks[61];
            const mouthR = landmarks[291];
            const mouthW = Math.hypot(mouthL.x - mouthR.x, mouthL.y - mouthR.y);
            rawMouthSmile = Math.min(1.0, Math.max(0, (mouthW / faceH - 0.28) * 5));

            // Eye Aspect Ratio for blinking
            const eyeTopL = landmarks[159];
            const eyeBotL = landmarks[145];
            const eyeDistL = Math.hypot(eyeTopL.x - eyeBotL.x, eyeTopL.y - eyeBotL.y);
            rawBlinkL = eyeDistL < 0.012 ? 1 : 0;
            rawBlinkR = rawBlinkL;
          }

          // Apply Low-Pass Smoothing Filter (Alpha = 0.35)
          this.applySmoothing({
            detected: true,
            headYaw: -rawYaw, // Invert so mirror behavior feels natural to the user
            headPitch: rawPitch,
            headRoll: -rawRoll,
            mouthOpen: rawMouthOpen,
            mouthSmile: rawMouthSmile,
            eyebrowRaise: rawBrowRaise,
            eyeBlinkLeft: rawBlinkL,
            eyeBlinkRight: rawBlinkR,
            eyeGazeX: -rawYaw * 0.5,
            eyeGazeY: rawPitch * 0.5,
            trackingFps: this.currentFps,
            engine: 'mediapipe',
          });

          // Draw small debug overlay on canvas if available
          this.drawLandmarkOverlay(landmarks);
        } else {
          this.applySmoothing({
            ...this.smoothedMetrics,
            detected: false,
            engine: 'mediapipe',
            trackingFps: this.currentFps,
          });
        }
      } catch (err) {
        console.warn('MediaPipe detection frame skip:', err);
      }
    }
  }

  /**
   * Fast Canvas Optical Vision Fallback (Works 100% Offline without External CDN/Wasm)
   */
  private processCanvasVisionFrame() {
    if (!this.videoElement || !this.canvasElement || !this.canvasCtx) return;

    const w = this.canvasElement.width || 320;
    const h = this.canvasElement.height || 240;

    this.canvasCtx.drawImage(this.videoElement, 0, 0, w, h);

    try {
      const imgData = this.canvasCtx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Skin tone / luminance centroid calculation for head tracking
      let totalSkinWeight = 0;
      let weightedX = 0;
      let weightedY = 0;
      const step = 4; // Sub-sample for 60fps performance

      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const idx = (y * w + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Normalized skin tone classifier (RGB / YCbCr heuristic)
          if (r > 60 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
            const weight = (r - g) / 255;
            totalSkinWeight += weight;
            weightedX += x * weight;
            weightedY += y * weight;
          }
        }
      }

      if (totalSkinWeight > 200) {
        const centroidX = weightedX / totalSkinWeight;
        const centroidY = weightedY / totalSkinWeight;

        // Normalized relative to center: -1 to +1
        const normX = (centroidX / w) * 2 - 1;
        const normY = (centroidY / h) * 2 - 1;

        // Simple mouth movement estimate from lower third luminance contrast
        const mouthBoxY = Math.min(h - 40, Math.max(0, Math.round(centroidY + 25)));
        const mouthBoxX = Math.min(w - 60, Math.max(0, Math.round(centroidX - 30)));
        let mouthDarkness = 0;
        let count = 0;

        for (let my = mouthBoxY; my < mouthBoxY + 30 && my < h; my += 2) {
          for (let mx = mouthBoxX; mx < mouthBoxX + 60 && mx < w; mx += 2) {
            const midx = (my * w + mx) * 4;
            const lum = 0.299 * data[midx] + 0.587 * data[midx + 1] + 0.114 * data[midx + 2];
            mouthDarkness += lum;
            count++;
          }
        }
        const avgMouthLum = count > 0 ? mouthDarkness / count : 128;
        // Darker mouth aperture corresponds to open mouth cavity
        const estMouthOpen = Math.min(1.0, Math.max(0, (95 - avgMouthLum) / 50));

        this.applySmoothing({
          detected: true,
          headYaw: -normX * 0.75, // Mirror
          headPitch: normY * 0.75,
          headRoll: -normX * 0.2,
          mouthOpen: estMouthOpen,
          mouthSmile: Math.abs(normX) > 0.3 ? 0.4 : 0.1,
          eyebrowRaise: normY < -0.3 ? 0.6 : 0,
          eyeBlinkLeft: 0,
          eyeBlinkRight: 0,
          eyeGazeX: -normX * 0.5,
          eyeGazeY: normY * 0.5,
          trackingFps: this.currentFps,
          engine: 'canvas_vision',
        });
      } else {
        this.applySmoothing({
          ...this.smoothedMetrics,
          detected: false,
          engine: 'canvas_vision',
          trackingFps: this.currentFps,
        });
      }
    } catch {
      // Ignore frame read security exceptions
    }
  }

  /**
   * Exponential Smoothing / Low-Pass Filter
   */
  private applySmoothing(target: FaceTrackingMetrics) {
    const alpha = 0.35; // Balance between instant response and butter-smooth stability
    const smooth = (curr: number, targ: number) => curr + (targ - curr) * alpha;

    this.smoothedMetrics = {
      detected: target.detected,
      headYaw: smooth(this.smoothedMetrics.headYaw, target.headYaw),
      headPitch: smooth(this.smoothedMetrics.headPitch, target.headPitch),
      headRoll: smooth(this.smoothedMetrics.headRoll, target.headRoll),
      mouthOpen: smooth(this.smoothedMetrics.mouthOpen, target.mouthOpen),
      mouthSmile: smooth(this.smoothedMetrics.mouthSmile, target.mouthSmile),
      eyebrowRaise: smooth(this.smoothedMetrics.eyebrowRaise, target.eyebrowRaise),
      eyeBlinkLeft: smooth(this.smoothedMetrics.eyeBlinkLeft, target.eyeBlinkLeft),
      eyeBlinkRight: smooth(this.smoothedMetrics.eyeBlinkRight, target.eyeBlinkRight),
      eyeGazeX: smooth(this.smoothedMetrics.eyeGazeX, target.eyeGazeX),
      eyeGazeY: smooth(this.smoothedMetrics.eyeGazeY, target.eyeGazeY),
      trackingFps: target.trackingFps,
      engine: target.engine,
    };

    if (this.onMetricsCallback) {
      this.onMetricsCallback({ ...this.smoothedMetrics });
    }
  }

  /**
   * Draw Lightweight Futuristic Landmark Mesh Overlay on Camera Preview Canvas
   */
  private drawLandmarkOverlay(landmarks: Array<{ x: number; y: number }>) {
    if (!this.canvasElement || !this.canvasCtx) return;
    const w = this.canvasElement.width;
    const h = this.canvasElement.height;

    this.canvasCtx.save();
    // Mirror drawing so preview feels like a mirror
    this.canvasCtx.scale(-1, 1);
    this.canvasCtx.translate(-w, 0);

    this.canvasCtx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    this.canvasCtx.fillStyle = 'rgba(168, 85, 247, 0.8)';
    this.canvasCtx.lineWidth = 1;

    // Draw key contour points (Nose, Eyes, Lips, Jawline)
    const keyIndices = [1, 33, 263, 61, 291, 13, 14, 159, 386, 10, 152];
    for (const idx of keyIndices) {
      const pt = landmarks[idx];
      if (pt) {
        this.canvasCtx.beginPath();
        this.canvasCtx.arc(pt.x * w, pt.y * h, 2, 0, Math.PI * 2);
        this.canvasCtx.fill();
      }
    }

    this.canvasCtx.restore();
  }
}

export const faceTrackingService = new FaceTrackingService();
