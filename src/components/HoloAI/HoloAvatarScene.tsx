import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  HoloModelId,
  HoloEnvironmentId,
  HoloState,
  HoloGesture,
  HOLO_MODELS,
} from './types';
import { FaceTrackingMetrics, FaceTrackingMode } from './faceTrackingService';
import {
  HoloMotionPlan,
  evaluateMotionPlanAtTime,
  DEFAULT_IDLE_POSE,
  AvatarPoseTarget,
} from './proceduralMotionEngine';

interface HoloAvatarSceneProps {
  modelId: HoloModelId;
  environmentId: HoloEnvironmentId;
  avatarState: HoloState;
  gesture: HoloGesture;
  avatarScale: number;
  animationIntensity: number;
  reducedMotion: boolean;
  isSpeaking: boolean;
  audioVolume: number; // 0 to 1 real-time voice volume for lip sync
  faceMetrics?: FaceTrackingMetrics;
  trackingMode?: FaceTrackingMode;
  activeMotionPlan?: HoloMotionPlan | null;
  onMotionPlanComplete?: () => void;
  onSceneReady?: () => void;
}

export const HoloAvatarScene: React.FC<HoloAvatarSceneProps> = ({
  modelId,
  environmentId,
  avatarState,
  gesture,
  avatarScale,
  animationIntensity,
  reducedMotion,
  isSpeaking,
  audioVolume,
  faceMetrics,
  trackingMode = 'mirror',
  activeMotionPlan,
  onMotionPlanComplete,
  onSceneReady,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameIdRef = useRef<number>(0);

  // Full-Body 3D Character Mesh & Bone References
  const avatarGroupRef = useRef<THREE.Group | null>(null);
  const hipsRef = useRef<THREE.Group | null>(null);
  const torsoRef = useRef<THREE.Group | null>(null);
  const chestRef = useRef<THREE.Group | null>(null);

  // Head & Facial Features
  const neckRef = useRef<THREE.Mesh | null>(null);
  const headRef = useRef<THREE.Group | null>(null);
  const leftEyeRef = useRef<THREE.Mesh | null>(null);
  const rightEyeRef = useRef<THREE.Mesh | null>(null);
  const leftEyelidRef = useRef<THREE.Mesh | null>(null);
  const rightEyelidRef = useRef<THREE.Mesh | null>(null);
  const leftEyebrowRef = useRef<THREE.Mesh | null>(null);
  const rightEyebrowRef = useRef<THREE.Mesh | null>(null);
  const mouthRef = useRef<THREE.Mesh | null>(null);
  const jawRef = useRef<THREE.Group | null>(null);
  const visorRef = useRef<THREE.Mesh | null>(null);
  const arcCoreRef = useRef<THREE.Mesh | null>(null);

  // Articulated Arms, Hands & Fingers
  const rightArmRef = useRef<THREE.Group | null>(null);
  const rightForearmRef = useRef<THREE.Group | null>(null);
  const rightHandRef = useRef<THREE.Group | null>(null);
  const leftArmRef = useRef<THREE.Group | null>(null);
  const leftForearmRef = useRef<THREE.Group | null>(null);
  const leftHandRef = useRef<THREE.Group | null>(null);

  // Articulated Lower Body (Legs & Feet)
  const rightThighRef = useRef<THREE.Group | null>(null);
  const rightShinRef = useRef<THREE.Group | null>(null);
  const leftThighRef = useRef<THREE.Group | null>(null);
  const leftShinRef = useRef<THREE.Group | null>(null);

  // Hologram Visuals & Environment
  const holoRingsGroupRef = useRef<THREE.Group | null>(null);
  const particleSystemRef = useRef<THREE.Points | null>(null);
  const holoBeamRef = useRef<THREE.Mesh | null>(null);
  const envGroupRef = useRef<THREE.Group | null>(null);
  const keyLightRef = useRef<THREE.SpotLight | null>(null);

  // Manual Camera Orbit Drag State (ONLY active when mouse button is down)
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const orbitAngleRef = useRef({ theta: 0, phi: 0 });

  // Active Motion Plan Timer
  const motionStartTimeRef = useRef<number>(0);
  const activeMotionPlanIdRef = useRef<string | null>(null);

  // Mutable props ref for smooth 60fps animation loop
  const propsRef = useRef({
    modelId,
    environmentId,
    avatarState,
    gesture,
    avatarScale,
    animationIntensity,
    reducedMotion,
    isSpeaking,
    audioVolume,
    faceMetrics,
    trackingMode,
    activeMotionPlan,
    onMotionPlanComplete,
  });

  useEffect(() => {
    propsRef.current = {
      modelId,
      environmentId,
      avatarState,
      gesture,
      avatarScale,
      animationIntensity,
      reducedMotion,
      isSpeaking,
      audioVolume,
      faceMetrics,
      trackingMode,
      activeMotionPlan,
      onMotionPlanComplete,
    };
  }, [
    modelId,
    environmentId,
    avatarState,
    gesture,
    avatarScale,
    animationIntensity,
    reducedMotion,
    isSpeaking,
    audioVolume,
    faceMetrics,
    trackingMode,
    activeMotionPlan,
    onMotionPlanComplete,
  ]);

  // Track active motion plan changes to reset timer
  useEffect(() => {
    if (activeMotionPlan && activeMotionPlan.id !== activeMotionPlanIdRef.current) {
      activeMotionPlanIdRef.current = activeMotionPlan.id;
      motionStartTimeRef.current = performance.now();
    } else if (!activeMotionPlan) {
      activeMotionPlanIdRef.current = null;
    }
  }, [activeMotionPlan]);

  // Manual Camera Drag Handler (Does NOT track mouse gaze or move head)
  const handlePointerDown = (e: PointerEvent) => {
    if (e.isPrimary) {
      isDraggingRef.current = true;
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };
      // Prevent scrolling on touch devices while dragging avatar
      if (mountRef.current) mountRef.current.style.touchAction = 'none';
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    if (mountRef.current) mountRef.current.style.touchAction = 'auto';
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (isDraggingRef.current && e.isPrimary) {
      const dx = e.clientX - prevMousePosRef.current.x;
      const dy = e.clientY - prevMousePosRef.current.y;
      orbitAngleRef.current.theta += dx * 0.006;
      orbitAngleRef.current.phi = Math.max(-0.4, Math.min(0.4, orbitAngleRef.current.phi + dy * 0.004));
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  // Main Scene Initialization
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect Software WebGL
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // 2. Setup Scene, Camera, Renderer
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 3.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
      precision: isSoftwareGl ? 'mediump' : 'highp',
    });
    renderer.setSize(width, height);
    // Support ultra-high res smart boards and retina displays (limit to 3 for perf)
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 3));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // 3. Studio Reflections
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch {}

    // 4. Futuristic Lighting
    const ambientLight = new THREE.AmbientLight(0x0a1224, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.SpotLight(0x00f0ff, 4.8, 14, Math.PI / 3.8, 0.35, 1);
    keyLight.position.set(1.6, 3.5, 2.6);
    keyLight.target.position.set(0, 1.0, 0);
    scene.add(keyLight);
    scene.add(keyLight.target);
    keyLightRef.current = keyLight;

    const fillLight = new THREE.DirectionalLight(0x3b82f6, 2.4);
    fillLight.position.set(-2.2, 1.8, 1.5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 4.2);
    rimLight.position.set(0, 2.8, -2.6);
    scene.add(rimLight);

    const groundLight = new THREE.PointLight(0x00f0ff, 2.2, 5);
    groundLight.position.set(0, -0.4, 0);
    scene.add(groundLight);

    // 5. Environment & Pedestal
    const envGroup = new THREE.Group();
    scene.add(envGroup);
    envGroupRef.current = envGroup;
    buildEnvironment(envGroup, environmentId);

    // 6. Build Avatar 3D Group Hierarchy
    const avatarGroup = new THREE.Group();
    avatarGroup.position.set(0, 0, 0);
    scene.add(avatarGroup);
    avatarGroupRef.current = avatarGroup;

    buildAvatar(avatarGroup, modelId, {
      hipsRef,
      torsoRef,
      chestRef,
      neckRef,
      headRef,
      visorRef,
      leftEyeRef,
      rightEyeRef,
      leftEyelidRef,
      rightEyelidRef,
      leftEyebrowRef,
      rightEyebrowRef,
      jawRef,
      mouthRef,
      arcCoreRef,
      rightArmRef,
      rightForearmRef,
      rightHandRef,
      leftArmRef,
      leftForearmRef,
      leftHandRef,
      rightThighRef,
      rightShinRef,
      leftThighRef,
      leftShinRef,
    });

    // 7. Hologram Projection Beam
    const beamGeo = new THREE.CylinderGeometry(0.9, 0.5, 3.0, 32, 1, true);
    beamGeo.translate(0, 1.2, 0);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.09,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const holoBeam = new THREE.Mesh(beamGeo, beamMat);
    scene.add(holoBeam);
    holoBeamRef.current = holoBeam;

    // 8. Pedestal & Cyber Rings
    const ringsGroup = new THREE.Group();
    ringsGroup.position.set(0, -0.45, 0);
    scene.add(ringsGroup);
    holoRingsGroupRef.current = ringsGroup;
    buildHoloPedestal(ringsGroup);

    // 9. Particle Dust Matrix
    const particlePoints = buildParticleDust();
    scene.add(particlePoints);
    particleSystemRef.current = particlePoints;

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove);

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;

      // Adaptive FOV: increase FOV on mobile landscape to ensure avatar is visible
      if (h < 500 && w > h) {
        camera.fov = 50;
      } else {
        camera.fov = 40;
      }

      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    handleResize(); // Initial trigger

    if (onSceneReady) onSceneReady();

    // 10. Animation & Render Loop
    let lastTime = performance.now();
    let blinkTimer = 0;
    let nextBlinkTime = 3.2;
    let isBlinking = false;
    let blinkPhase = 0;
    let waveTime = 0;

    const animate = (currentTime: number) => {
      frameIdRef.current = requestAnimationFrame(animate);

      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const {
        avatarState: state,
        gesture: currentGesture,
        avatarScale: scale,
        animationIntensity: intensity,
        reducedMotion: isReduced,
        isSpeaking: speaking,
        audioVolume: volume,
        faceMetrics: trackingMetrics,
        trackingMode: currentTrackingMode,
        activeMotionPlan,
        onMotionPlanComplete: notifyMotionPlanComplete,
      } = propsRef.current;

      const motionScale = isReduced ? 0.2 : intensity;

      // Check Active Motion Plan Completion
      let targetPose: AvatarPoseTarget = DEFAULT_IDLE_POSE;

      if (activeMotionPlan && motionStartTimeRef.current > 0) {
        const elapsedMs = currentTime - motionStartTimeRef.current;
        const { pose: evaluatedPose, isComplete } = evaluateMotionPlanAtTime(
          activeMotionPlan,
          elapsedMs,
          DEFAULT_IDLE_POSE
        );
        targetPose = evaluatedPose;
        if (isComplete && notifyMotionPlanComplete) {
          notifyMotionPlanComplete();
        }
      }

      // A. Camera Orbit Damping (Manual drag only)
      const targetCamX = Math.sin(orbitAngleRef.current.theta) * 3.2;
      const targetCamZ = Math.cos(orbitAngleRef.current.theta) * 3.2;
      const targetCamY = 1.2 + orbitAngleRef.current.phi;

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 6, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 6, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 6, delta);
      camera.lookAt(0, 1.0, 0);

      // B. Avatar Scale
      if (avatarGroupRef.current) {
        avatarGroupRef.current.scale.setScalar(scale);
      }

      // C. Base Idle Hover & Arc Core Pulsing
      const hoverFreq = 1.5;
      const hoverOffsetY = Math.sin(currentTime * 0.001 * hoverFreq) * 0.03 * motionScale;

      if (arcCoreRef.current) {
        const coreMat = arcCoreRef.current.material as THREE.MeshStandardMaterial;
        const pulse = 1.8 + Math.sin(currentTime * 0.004) * 0.9;
        coreMat.emissiveIntensity = speaking
          ? pulse * 2.0 + volume * 2.5
          : state === 'thinking'
          ? pulse * 2.4
          : pulse;
      }

      if (holoBeamRef.current) {
        const beamMat = holoBeamRef.current.material as THREE.MeshBasicMaterial;
        const beamPulse = 0.08 + Math.sin(currentTime * 0.003) * 0.035;
        beamMat.opacity = speaking ? beamPulse * 1.6 : beamPulse;
      }

      // D. Blinking Simulation
      const isTrackingFace = trackingMetrics && trackingMetrics.detected;

      if (isTrackingFace && (trackingMetrics.eyeBlinkLeft > 0.4 || trackingMetrics.eyeBlinkRight > 0.4)) {
        if (leftEyelidRef.current && rightEyelidRef.current) {
          leftEyelidRef.current.scale.y = 1 + trackingMetrics.eyeBlinkLeft * 3.2;
          rightEyelidRef.current.scale.y = 1 + trackingMetrics.eyeBlinkRight * 3.2;
        }
      } else {
        blinkTimer += delta;
        if (!isBlinking && blinkTimer > nextBlinkTime) {
          isBlinking = true;
          blinkTimer = 0;
          blinkPhase = 0;
          nextBlinkTime = 2.4 + Math.random() * 2.8;
        }

        if (isBlinking) {
          blinkPhase += delta * 14;
          const eyelidScale = Math.sin(Math.min(blinkPhase, Math.PI));
          if (leftEyelidRef.current && rightEyelidRef.current) {
            leftEyelidRef.current.scale.y = 1 + eyelidScale * 3.0;
            rightEyelidRef.current.scale.y = 1 + eyelidScale * 3.0;
          }
          if (blinkPhase >= Math.PI) {
            isBlinking = false;
            if (leftEyelidRef.current && rightEyelidRef.current) {
              leftEyelidRef.current.scale.y = 1;
              rightEyelidRef.current.scale.y = 1;
            }
          }
        } else if (leftEyelidRef.current && rightEyelidRef.current) {
          leftEyelidRef.current.scale.y = THREE.MathUtils.damp(leftEyelidRef.current.scale.y, 1, 14, delta);
          rightEyelidRef.current.scale.y = THREE.MathUtils.damp(rightEyelidRef.current.scale.y, 1, 14, delta);
        }
      }

      // E. Mouth & Jaw Lip Sync
      let targetMouthOpen = 0;
      let targetMouthSmile = 0;
      if (speaking) {
        const syllableOsc = Math.sin(currentTime * 0.02) * 0.5 + 0.5;
        const speechEnvelope = Math.max(volume * 2.4, syllableOsc * 0.65);
        targetMouthOpen = Math.min(speechEnvelope, 1.25) * motionScale;
        const userSmile = isTrackingFace ? trackingMetrics.mouthSmile * 0.85 * motionScale : 0;
        targetMouthSmile = Math.max(
          (Math.cos(currentTime * 0.009) * 0.35 + 0.35) * motionScale,
          userSmile
        );
      } else if (isTrackingFace && currentTrackingMode === 'mirror') {
        targetMouthOpen = trackingMetrics.mouthOpen * 1.35 * motionScale;
        targetMouthSmile = trackingMetrics.mouthSmile * motionScale;
      } else if (state === 'celebrating' || state === 'greeting') {
        targetMouthSmile = 0.65 * motionScale;
      }

      if (mouthRef.current) {
        mouthRef.current.scale.y = THREE.MathUtils.damp(
          mouthRef.current.scale.y,
          1 + targetMouthOpen * 2.8,
          18,
          delta
        );
        mouthRef.current.scale.x = THREE.MathUtils.damp(
          mouthRef.current.scale.x,
          1 + targetMouthSmile * 0.7,
          14,
          delta
        );
      }
      if (jawRef.current) {
        jawRef.current.position.y = THREE.MathUtils.damp(
          jawRef.current.position.y,
          -targetMouthOpen * 0.035,
          18,
          delta
        );
      }

      // =========================================================================
      // F. FULL-BODY KINEMATIC POSE CALCULATIONS & PRIORITY BLENDING
      // =========================================================================
      // targetPose is evaluated from activeMotionPlan above. Apply fallback gestures if no plan active.
      if (!activeMotionPlan) {
        if (currentGesture === 'wave') {
          targetPose = { ...DEFAULT_IDLE_POSE, rArmRotX: -1.8, rForearmRotX: -1.2, rHandRotZ: 0.5, isOscillating: true, oscType: 'wave_right' };
        } else if (currentGesture === 'explain') {
          targetPose = { ...DEFAULT_IDLE_POSE, rArmRotX: -1.2, lArmRotX: -1.2, isOscillating: true, oscType: 'hands_up_down' };
        } else if (currentGesture === 'celebrate') {
          targetPose = { ...DEFAULT_IDLE_POSE, rArmRotX: -2.8, lArmRotX: -2.8 };
        } else if (currentGesture === 'think') {
          targetPose = { ...DEFAULT_IDLE_POSE, rArmRotX: -1.2, lArmRotX: -1.2, rForearmRotX: -1.5, lForearmRotX: -1.5, headRotX: 0.2, headRotZ: 0.15 };
        }
      }

      // 1. Root Group Translation & Y Rotation (Turn / Jump / Hover)
      if (avatarGroupRef.current && hipsRef.current) {
        let rootY = hoverOffsetY;
        let rootRotY = targetPose.hipsRotY * motionScale;

        if (targetPose.isOscillating && targetPose.oscType === 'jump') {
          rootY += Math.abs(Math.sin(currentTime * 0.009)) * 0.42 * motionScale;
        }

        avatarGroupRef.current.position.y = THREE.MathUtils.damp(
          avatarGroupRef.current.position.y,
          rootY,
          10,
          delta
        );

        avatarGroupRef.current.rotation.y = THREE.MathUtils.damp(
          avatarGroupRef.current.rotation.y,
          rootRotY,
          8,
          delta
        );
      }

      // 2. Torso / Spine (Bowing / Swaying)
      if (torsoRef.current) {
        let torsoX = targetPose.torsoRotX * motionScale;
        let torsoY = targetPose.torsoRotY * motionScale;

        if (targetPose.isOscillating && targetPose.oscType === 'dance') {
          torsoY += Math.sin(currentTime * 0.006) * 0.22 * motionScale;
          torsoX += Math.cos(currentTime * 0.005) * 0.12 * motionScale;
        }

        torsoRef.current.rotation.x = THREE.MathUtils.damp(torsoRef.current.rotation.x, torsoX, 8, delta);
        torsoRef.current.rotation.y = THREE.MathUtils.damp(torsoRef.current.rotation.y, torsoY, 8, delta);
      }

      // 3. Head & Neck (Independent of Mouse - Pure Pose / Speech / Camera Face Tracking)
      if (headRef.current) {
        let headX = targetPose.headRotX * motionScale;
        let headY = targetPose.headRotY * motionScale;
        let headZ = targetPose.headRotZ * motionScale;

        // Oscillating Head Actions (Nod / Shake / Speech Cadence)
        if (targetPose.isOscillating && targetPose.oscType === 'nod') {
          headX += Math.sin(currentTime * 0.01) * 0.25 * motionScale;
        } else if (targetPose.isOscillating && targetPose.oscType === 'shake') {
          headY += Math.sin(currentTime * 0.01) * 0.32 * motionScale;
        } else if (speaking && !activeMotionPlan) {
          headX += Math.sin(currentTime * 0.008) * 0.05 * motionScale;
          headY += Math.sin(currentTime * 0.004) * 0.04 * motionScale;
        }

        // Apply Camera Face Tracking if active and no explicit head command overriding
        if (isTrackingFace && !activeMotionPlan) {
          if (currentTrackingMode === 'mirror') {
            headX = trackingMetrics.headPitch * 0.72 * motionScale;
            headY = trackingMetrics.headYaw * 0.85 * motionScale;
            headZ = trackingMetrics.headRoll * 0.52 * motionScale;
          } else if (currentTrackingMode === 'smart_assistant') {
            headX += trackingMetrics.headPitch * 0.28 * motionScale;
            headY += trackingMetrics.headYaw * 0.38 * motionScale;
            headZ += trackingMetrics.headRoll * 0.18 * motionScale;
          }
        }

        headRef.current.rotation.x = THREE.MathUtils.damp(headRef.current.rotation.x, headX, 10, delta);
        headRef.current.rotation.y = THREE.MathUtils.damp(headRef.current.rotation.y, headY, 10, delta);
        headRef.current.rotation.z = THREE.MathUtils.damp(headRef.current.rotation.z, headZ, 10, delta);
      }

      // 4. Right Arm, Forearm & Hand Kinematics
      if (rightArmRef.current && rightForearmRef.current && rightHandRef.current) {
        let rArmX = targetPose.rArmRotX * motionScale;
        let rArmY = targetPose.rArmRotY * motionScale;
        let rArmZ = targetPose.rArmRotZ * motionScale;
        let rForearmX = targetPose.rForearmRotX * motionScale;
        let rHandZ = targetPose.rHandRotZ * motionScale;

        if (targetPose.isOscillating) {
          if (targetPose.oscType === 'wave_right' || targetPose.oscType === 'wave_both') {
            waveTime += delta * 6.5;
            rHandZ += Math.sin(waveTime) * 0.45 * motionScale;
          } else if (targetPose.oscType === 'clap') {
            rArmZ = (-0.5 + Math.sin(currentTime * 0.012) * 0.15) * motionScale;
          } else if (targetPose.oscType === 'hands_up_down') {
            rArmX = (-1.2 + Math.sin(currentTime * 0.008) * 0.5) * motionScale;
          } else if (targetPose.oscType === 'dance') {
            rArmX = (-1.1 + Math.sin(currentTime * 0.008) * 0.4) * motionScale;
            rArmZ = (-0.5 + Math.cos(currentTime * 0.007) * 0.3) * motionScale;
          } else if (targetPose.oscType === 'walk') {
            rArmX = Math.sin(currentTime * 0.008) * 0.45 * motionScale;
          }
        }

        rightArmRef.current.rotation.x = THREE.MathUtils.damp(rightArmRef.current.rotation.x, rArmX, 9, delta);
        rightArmRef.current.rotation.y = THREE.MathUtils.damp(rightArmRef.current.rotation.y, rArmY, 9, delta);
        rightArmRef.current.rotation.z = THREE.MathUtils.damp(rightArmRef.current.rotation.z, rArmZ, 9, delta);

        rightForearmRef.current.rotation.x = THREE.MathUtils.damp(
          rightForearmRef.current.rotation.x,
          rForearmX,
          9,
          delta
        );
        rightHandRef.current.rotation.z = THREE.MathUtils.damp(
          rightHandRef.current.rotation.z,
          rHandZ,
          9,
          delta
        );
      }

      // 5. Left Arm, Forearm & Hand Kinematics
      if (leftArmRef.current && leftForearmRef.current && leftHandRef.current) {
        let lArmX = targetPose.lArmRotX * motionScale;
        let lArmY = targetPose.lArmRotY * motionScale;
        let lArmZ = targetPose.lArmRotZ * motionScale;
        let lForearmX = targetPose.lForearmRotX * motionScale;
        let lHandZ = targetPose.lHandRotZ * motionScale;

        if (targetPose.isOscillating) {
          if (targetPose.oscType === 'wave_both') {
            lHandZ += -Math.sin(waveTime) * 0.45 * motionScale;
          } else if (targetPose.oscType === 'clap') {
            lArmZ = (0.5 - Math.sin(currentTime * 0.012) * 0.15) * motionScale;
          } else if (targetPose.oscType === 'hands_up_down') {
            lArmX = (-1.2 - Math.sin(currentTime * 0.008) * 0.5) * motionScale;
          } else if (targetPose.oscType === 'dance') {
            lArmX = (-1.1 - Math.sin(currentTime * 0.008) * 0.4) * motionScale;
            lArmZ = (0.5 - Math.cos(currentTime * 0.007) * 0.3) * motionScale;
          } else if (targetPose.oscType === 'walk') {
            lArmX = -Math.sin(currentTime * 0.008) * 0.45 * motionScale;
          }
        }

        leftArmRef.current.rotation.x = THREE.MathUtils.damp(leftArmRef.current.rotation.x, lArmX, 9, delta);
        leftArmRef.current.rotation.y = THREE.MathUtils.damp(leftArmRef.current.rotation.y, lArmY, 9, delta);
        leftArmRef.current.rotation.z = THREE.MathUtils.damp(leftArmRef.current.rotation.z, lArmZ, 9, delta);

        leftForearmRef.current.rotation.x = THREE.MathUtils.damp(
          leftForearmRef.current.rotation.x,
          lForearmX,
          9,
          delta
        );
        leftHandRef.current.rotation.z = THREE.MathUtils.damp(
          leftHandRef.current.rotation.z,
          lHandZ,
          9,
          delta
        );
      }

      // 6. Lower Body Kinematics (Legs & Walking / Jumping)
      if (rightThighRef.current && rightShinRef.current && leftThighRef.current && leftShinRef.current) {
        let rThighX = targetPose.rThighRotX * motionScale;
        let rShinX = targetPose.rShinRotX * motionScale;
        let lThighX = targetPose.lThighRotX * motionScale;
        let lShinX = targetPose.lShinRotX * motionScale;

        if (targetPose.isOscillating) {
          if (targetPose.oscType === 'walk') {
            const walkOsc = Math.sin(currentTime * 0.008);
            rThighX = -walkOsc * 0.55 * motionScale;
            lThighX = walkOsc * 0.55 * motionScale;
            rShinX = Math.max(0, walkOsc) * 0.65 * motionScale;
            lShinX = Math.max(0, -walkOsc) * 0.65 * motionScale;
          } else if (targetPose.oscType === 'dance') {
            const danceOsc = Math.sin(currentTime * 0.007);
            rThighX = Math.max(0, danceOsc) * 0.3 * motionScale;
            lThighX = Math.max(0, -danceOsc) * 0.3 * motionScale;
          }
        }

        rightThighRef.current.rotation.x = THREE.MathUtils.damp(rightThighRef.current.rotation.x, rThighX, 10, delta);
        rightShinRef.current.rotation.x = THREE.MathUtils.damp(rightShinRef.current.rotation.x, rShinX, 10, delta);
        leftThighRef.current.rotation.x = THREE.MathUtils.damp(leftThighRef.current.rotation.x, lThighX, 10, delta);
        leftShinRef.current.rotation.x = THREE.MathUtils.damp(leftShinRef.current.rotation.x, lShinX, 10, delta);
      }

      // Render 3D Scene
      renderer.render(scene, camera);
    };

    frameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
      }
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full relative cursor-grab active:cursor-grabbing" />;
};

/**
 * Procedural Full-Body 3D Avatar Assembler
 */
function buildAvatar(
  group: THREE.Group,
  modelId: HoloModelId,
  refs: Record<string, React.MutableRefObject<any>>
) {
  const modelDef = HOLO_MODELS.find((m) => m.id === modelId) || HOLO_MODELS[0];
  const primaryColor = modelDef.glowHex;
  const glowColor = modelDef.glowHex;

  const armorMaterial = new THREE.MeshStandardMaterial({
    color: 0x081020,
    roughness: 0.2,
    metalness: 0.9,
    transparent: true,
    opacity: 0.92,
  });

  const glowMaterial = new THREE.MeshStandardMaterial({
    color: glowColor,
    emissive: glowColor,
    emissiveIntensity: 2.8,
    roughness: 0.15,
    metalness: 0.85,
  });

  const eyeGlowMaterial = new THREE.MeshBasicMaterial({
    color: glowColor,
  });

  const darkTrimMaterial = new THREE.MeshStandardMaterial({
    color: 0x030610,
    roughness: 0.25,
    metalness: 0.95,
    transparent: true,
    opacity: 0.94,
  });

  // =========================================================================
  // 1. HIPS & PELVIS (Root of Rig)
  // =========================================================================
  const hipsGroup = new THREE.Group();
  hipsGroup.position.set(0, 0.72, 0);
  group.add(hipsGroup);
  if (refs.hipsRef) refs.hipsRef.current = hipsGroup;

  const hipsGeo = new THREE.CylinderGeometry(0.18, 0.14, 0.18, 16);
  const hipsMesh = new THREE.Mesh(hipsGeo, darkTrimMaterial);
  hipsGroup.add(hipsMesh);

  // =========================================================================
  // 2. LEGS & LOWER BODY (Articulated Thighs, Shins, Feet)
  // =========================================================================
  // RIGHT LEG
  const rightThighGroup = new THREE.Group();
  rightThighGroup.position.set(0.11, -0.09, 0);
  hipsGroup.add(rightThighGroup);
  if (refs.rightThighRef) refs.rightThighRef.current = rightThighGroup;

  const thighGeo = new THREE.CylinderGeometry(0.065, 0.05, 0.38, 16);
  thighGeo.translate(0, -0.19, 0);
  const rThigh = new THREE.Mesh(thighGeo, armorMaterial);
  rightThighGroup.add(rThigh);

  const rightShinGroup = new THREE.Group();
  rightShinGroup.position.set(0, -0.38, 0);
  rightThighGroup.add(rightShinGroup);
  if (refs.rightShinRef) refs.rightShinRef.current = rightShinGroup;

  const shinGeo = new THREE.CylinderGeometry(0.048, 0.038, 0.38, 16);
  shinGeo.translate(0, -0.19, 0);
  const rShin = new THREE.Mesh(shinGeo, darkTrimMaterial);
  rightShinGroup.add(rShin);

  const footGeo = new THREE.BoxGeometry(0.07, 0.05, 0.16);
  footGeo.translate(0, -0.025, 0.04);
  const rFoot = new THREE.Mesh(footGeo, armorMaterial);
  rFoot.position.set(0, -0.38, 0);
  rightShinGroup.add(rFoot);

  // LEFT LEG
  const leftThighGroup = new THREE.Group();
  leftThighGroup.position.set(-0.11, -0.09, 0);
  hipsGroup.add(leftThighGroup);
  if (refs.leftThighRef) refs.leftThighRef.current = leftThighGroup;

  const lThigh = new THREE.Mesh(thighGeo, armorMaterial);
  leftThighGroup.add(lThigh);

  const leftShinGroup = new THREE.Group();
  leftShinGroup.position.set(0, -0.38, 0);
  leftThighGroup.add(leftShinGroup);
  if (refs.leftShinRef) refs.leftShinRef.current = leftShinGroup;

  const lShin = new THREE.Mesh(shinGeo, darkTrimMaterial);
  leftShinGroup.add(lShin);

  const lFoot = new THREE.Mesh(footGeo, armorMaterial);
  lFoot.position.set(0, -0.38, 0);
  leftShinGroup.add(lFoot);

  // =========================================================================
  // 3. SPINE & TORSO
  // =========================================================================
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.09, 0);
  hipsGroup.add(torsoGroup);
  if (refs.torsoRef) refs.torsoRef.current = torsoGroup;

  const torsoGeo = new THREE.CylinderGeometry(0.24, 0.18, 0.44, 20);
  torsoGeo.translate(0, 0.22, 0);
  const torsoMesh = new THREE.Mesh(torsoGeo, armorMaterial);
  torsoMesh.scale.set(1.15, 1, 0.75);
  torsoGroup.add(torsoMesh);

  // Chest Group
  const chestGroup = new THREE.Group();
  chestGroup.position.set(0, 0.35, 0);
  torsoGroup.add(chestGroup);
  if (refs.chestRef) refs.chestRef.current = chestGroup;

  // Cyber Ribs
  [-1, 1].forEach((side) => {
    const ribGeo = new THREE.BoxGeometry(0.045, 0.3, 0.18);
    const ribMesh = new THREE.Mesh(ribGeo, darkTrimMaterial);
    ribMesh.position.set(side * 0.23, 0, 0.02);
    chestGroup.add(ribMesh);
  });

  // Quantum Arc Core
  const coreGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.045, 24);
  coreGeo.rotateX(Math.PI / 2);
  const coreMesh = new THREE.Mesh(coreGeo, glowMaterial);
  coreMesh.position.set(0, 0.07, 0.145);
  chestGroup.add(coreMesh);
  if (refs.arcCoreRef) refs.arcCoreRef.current = coreMesh;

  const coreRingGeo = new THREE.TorusGeometry(0.085, 0.016, 12, 32);
  const coreRingMesh = new THREE.Mesh(coreRingGeo, darkTrimMaterial);
  coreRingMesh.position.set(0, 0.07, 0.145);
  chestGroup.add(coreRingMesh);

  // =========================================================================
  // 4. NECK, HEAD & VISOR
  // =========================================================================
  const neckGeo = new THREE.CylinderGeometry(0.075, 0.088, 0.11, 16);
  const neckMesh = new THREE.Mesh(neckGeo, darkTrimMaterial);
  neckMesh.position.set(0, 0.26, 0);
  chestGroup.add(neckMesh);
  if (refs.neckRef) refs.neckRef.current = neckMesh;

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.15, 0);
  neckMesh.add(headGroup);
  if (refs.headRef) refs.headRef.current = headGroup;

  const headGeo = new THREE.SphereGeometry(0.19, 32, 24);
  headGeo.scale(0.86, 1.05, 0.96);
  const headMesh = new THREE.Mesh(headGeo, armorMaterial);
  headGroup.add(headMesh);

  // Hologram Visor & Eyes
  const visorGeo = new THREE.CylinderGeometry(0.145, 0.145, 0.065, 24, 1, false, 0, Math.PI);
  visorGeo.rotateZ(Math.PI / 2);
  visorGeo.rotateY(Math.PI / 2);
  const visorMesh = new THREE.Mesh(visorGeo, glowMaterial);
  visorMesh.position.set(0, 0.04, 0.125);
  headGroup.add(visorMesh);
  if (refs.visorRef) refs.visorRef.current = visorMesh;

  const eyeGeo = new THREE.SphereGeometry(0.024, 16, 16);
  eyeGeo.scale(1, 0.7, 0.5);

  const leftEye = new THREE.Mesh(eyeGeo, eyeGlowMaterial);
  leftEye.position.set(-0.065, 0.04, 0.175);
  headGroup.add(leftEye);
  if (refs.leftEyeRef) refs.leftEyeRef.current = leftEye;

  const rightEye = new THREE.Mesh(eyeGeo, eyeGlowMaterial);
  rightEye.position.set(0.065, 0.04, 0.175);
  headGroup.add(rightEye);
  if (refs.rightEyeRef) refs.rightEyeRef.current = rightEye;

  const eyelidGeo = new THREE.BoxGeometry(0.052, 0.014, 0.022);
  const leftEyelid = new THREE.Mesh(eyelidGeo, darkTrimMaterial);
  leftEyelid.position.set(-0.065, 0.054, 0.18);
  headGroup.add(leftEyelid);
  if (refs.leftEyelidRef) refs.leftEyelidRef.current = leftEyelid;

  const rightEyelid = new THREE.Mesh(eyelidGeo, darkTrimMaterial);
  rightEyelid.position.set(0.065, 0.054, 0.18);
  headGroup.add(rightEyelid);
  if (refs.rightEyelidRef) refs.rightEyelidRef.current = rightEyelid;

  const eyebrowGeo = new THREE.BoxGeometry(0.048, 0.007, 0.016);
  const leftEyebrow = new THREE.Mesh(eyebrowGeo, glowMaterial);
  leftEyebrow.position.set(-0.065, 0.078, 0.178);
  headGroup.add(leftEyebrow);
  if (refs.leftEyebrowRef) refs.leftEyebrowRef.current = leftEyebrow;

  const rightEyebrow = new THREE.Mesh(eyebrowGeo, glowMaterial);
  rightEyebrow.position.set(0.065, 0.078, 0.178);
  headGroup.add(rightEyebrow);
  if (refs.rightEyebrowRef) refs.rightEyebrowRef.current = rightEyebrow;

  const jawGroup = new THREE.Group();
  jawGroup.position.set(0, -0.092, 0.145);
  headGroup.add(jawGroup);
  if (refs.jawRef) refs.jawRef.current = jawGroup;

  const mouthGeo = new THREE.BoxGeometry(0.08, 0.02, 0.02);
  const mouthMesh = new THREE.Mesh(mouthGeo, darkTrimMaterial);
  jawGroup.add(mouthMesh);
  if (refs.mouthRef) refs.mouthRef.current = mouthMesh;

  // =========================================================================
  // 5. ARTICULATED ARMS, HANDS & FINGERS
  // =========================================================================
  // RIGHT ARM
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.33, 0.13, 0);
  chestGroup.add(rightArmGroup);
  if (refs.rightArmRef) refs.rightArmRef.current = rightArmGroup;

  const shoulderGeo = new THREE.SphereGeometry(0.095, 16, 16);
  shoulderGeo.scale(1.2, 0.9, 1.1);
  const rShoulder = new THREE.Mesh(shoulderGeo, armorMaterial);
  rightArmGroup.add(rShoulder);

  const rUpperArmGeo = new THREE.CylinderGeometry(0.046, 0.042, 0.23, 16);
  rUpperArmGeo.translate(0, -0.115, 0);
  const rUpperArm = new THREE.Mesh(rUpperArmGeo, armorMaterial);
  rightArmGroup.add(rUpperArm);

  const rightForearmGroup = new THREE.Group();
  rightForearmGroup.position.set(0, -0.23, 0);
  rightArmGroup.add(rightForearmGroup);
  if (refs.rightForearmRef) refs.rightForearmRef.current = rightForearmGroup;

  const forearmGeo = new THREE.CylinderGeometry(0.041, 0.035, 0.22, 16);
  forearmGeo.translate(0, -0.11, 0);
  const rForearm = new THREE.Mesh(forearmGeo, darkTrimMaterial);
  rightForearmGroup.add(rForearm);

  const rightHandGroup = new THREE.Group();
  rightHandGroup.position.set(0, -0.22, 0);
  rightForearmGroup.add(rightHandGroup);
  if (refs.rightHandRef) refs.rightHandRef.current = rightHandGroup;

  const handGeo = new THREE.BoxGeometry(0.055, 0.065, 0.032);
  handGeo.translate(0, -0.032, 0);
  const rHand = new THREE.Mesh(handGeo, glowMaterial);
  rightHandGroup.add(rHand);

  // LEFT ARM
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.33, 0.13, 0);
  chestGroup.add(leftArmGroup);
  if (refs.leftArmRef) refs.leftArmRef.current = leftArmGroup;

  const lShoulder = new THREE.Mesh(shoulderGeo, armorMaterial);
  leftArmGroup.add(lShoulder);

  const lUpperArmGeo = new THREE.CylinderGeometry(0.046, 0.042, 0.23, 16);
  lUpperArmGeo.translate(0, -0.115, 0);
  const lUpperArm = new THREE.Mesh(lUpperArmGeo, armorMaterial);
  leftArmGroup.add(lUpperArm);

  const leftForearmGroup = new THREE.Group();
  leftForearmGroup.position.set(0, -0.23, 0);
  leftArmGroup.add(leftForearmGroup);
  if (refs.leftForearmRef) refs.leftForearmRef.current = leftForearmGroup;

  const lForearm = new THREE.Mesh(forearmGeo, darkTrimMaterial);
  leftForearmGroup.add(lForearm);

  const leftHandGroup = new THREE.Group();
  leftHandGroup.position.set(0, -0.22, 0);
  leftForearmGroup.add(leftHandGroup);
  if (refs.leftHandRef) refs.leftHandRef.current = leftHandGroup;

  const lHand = new THREE.Mesh(handGeo, glowMaterial);
  leftHandGroup.add(lHand);
}

function buildEnvironment(envGroup: THREE.Group, envId: HoloEnvironmentId) {
  envGroup.clear();
  if (envId === 'transparent_hologram') return;

  const floorGeo = new THREE.PlaneGeometry(16, 16);
  floorGeo.rotateX(-Math.PI / 2);

  const gridHelper = new THREE.GridHelper(16, 32, 0x00f0ff, 0x0a2240);
  gridHelper.position.y = -0.44;
  envGroup.add(gridHelper);
}

function buildHoloPedestal(group: THREE.Group) {
  const ringGeo = new THREE.TorusGeometry(0.65, 0.015, 12, 64);
  ringGeo.rotateX(Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.6 });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  group.add(ringMesh);
}

function buildParticleDust(): THREE.Points {
  const count = 120;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 3;
    positions[i * 3 + 1] = Math.random() * 2.5 - 0.2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.025, transparent: true, opacity: 0.5 });
  return new THREE.Points(geo, mat);
}
