import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { PLANETS_DATA } from '../utils/spaceData';
import { PlanetData, SpaceXTab } from '../types';
import { Play, Pause, FastForward, RotateCcw, Info, Eye, Sliders, ArrowRight } from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

interface SolarSystemTabProps {
  onSelectPlanet: (planetId: string) => void;
  onOpenPlanetTab: (planetId: string) => void;
}

export const SolarSystemTab: React.FC<SolarSystemTabProps> = ({
  onSelectPlanet,
  onOpenPlanetTab
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // State
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(PLANETS_DATA[3]); // Default Earth
  const [isPaused, setIsPaused] = useState(false);
  const [timeSpeed, setTimeSpeed] = useState(1);
  const [showOrbits, setShowOrbits] = useState(true);
  const [educationalMode, setEducationalMode] = useState(true);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const planetsMeshesRef = useRef<Map<string, { mesh: THREE.Mesh; pivot: THREE.Group; orbitLine: THREE.Line; speed: number }>>(new Map());
  const targetCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 40, 60));
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const currentLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = Math.max(500, container.clientHeight);

    // Renderer setup with software WebGL guard
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const renderer = new THREE.WebGLRenderer({ antialias: !isSoftwareGl, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 40, 70);
    cameraRef.current = camera;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 2.5, 1000);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Starfield Background Particles
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 1000;
      starPos[i + 1] = (Math.random() - 0.5) * 1000;
      starPos[i + 2] = (Math.random() - 0.5) * 1000;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true, opacity: 0.8 });
    const starField = new THREE.Points(starsGeo, starMat);
    scene.add(starField);

    // Build Sun & Planets
    const meshesMap = new Map();

    PLANETS_DATA.forEach((pData, idx) => {
      const pivot = new THREE.Group();
      scene.add(pivot);

      let radius = pData.scale3D;
      let orbitRadius = idx === 0 ? 0 : 10 + idx * 8; // Educational distribution distance

      let geometry: THREE.BufferGeometry = new THREE.SphereGeometry(radius, 32, 32);
      let material: THREE.Material;

      if (pData.id === 'sun') {
        material = new THREE.MeshBasicMaterial({ color: new THREE.Color(pData.color) });
      } else {
        material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(pData.color),
          roughness: 0.6,
          metalness: 0.2
        });
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(orbitRadius, 0, 0);
      pivot.add(mesh);

      // Add Saturn's Rings
      if (pData.id === 'saturn') {
        const ringGeo = new THREE.RingGeometry(radius * 1.4, radius * 2.3, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xd7ccc8, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2.3;
        mesh.add(ringMesh);
      }

      // Draw Orbit Line
      const orbitGeo = new THREE.BufferGeometry();
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * orbitRadius, 0, Math.sin(theta) * orbitRadius));
      }
      orbitGeo.setFromPoints(points);
      const orbitMat = new THREE.LineBasicMaterial({ color: 0x1e3a8a, transparent: true, opacity: 0.4 });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      if (idx > 0) scene.add(orbitLine);

      meshesMap.set(pData.id, {
        mesh,
        pivot,
        orbitLine,
        speed: (pData.orbitSpeedRatio || 0.1) * 0.005
      });
    });

    planetsMeshesRef.current = meshesMap;

    // Animation Loop
    let animFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Rotate Planets & Orbits
      if (!isPaused) {
        planetsMeshesRef.current.forEach(({ mesh, pivot, speed }) => {
          mesh.rotation.y += 0.01;
          pivot.rotation.y += speed * timeSpeed;
        });
      }

      // Smooth Camera Animation towards target
      if (cameraRef.current) {
        cameraRef.current.position.lerp(targetCamPosRef.current, 0.05);
        currentLookAtRef.current.lerp(targetLookAtRef.current, 0.05);
        cameraRef.current.lookAt(currentLookAtRef.current);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = Math.max(500, mountRef.current.clientHeight);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
      }
    };
  }, [isPaused, timeSpeed]);

  // Focus Camera on Selected Planet
  const focusPlanet = useCallback((pData: PlanetData) => {
    setSelectedPlanet(pData);
    soundEngine.playClick();
    onSelectPlanet(pData.id);

    const meshObj = planetsMeshesRef.current.get(pData.id);
    if (!meshObj || !cameraRef.current) return;

    if (pData.id === 'sun') {
      targetLookAtRef.current.set(0, 0, 0);
      targetCamPosRef.current.set(0, 30, 45);
    } else {
      // Get world position of target planet
      const worldPos = new THREE.Vector3();
      meshObj.mesh.getWorldPosition(worldPos);

      targetLookAtRef.current.copy(worldPos);
      targetCamPosRef.current.set(
        worldPos.x + pData.scale3D * 4,
        worldPos.y + pData.scale3D * 3,
        worldPos.z + pData.scale3D * 5
      );
    }
  }, [onSelectPlanet]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* Simulation Controls Header Bar */}
      <div className="bg-[#090d16] border border-cyan-900/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        
        {/* Planet Quick Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {PLANETS_DATA.map((p) => (
            <button
              key={p.id}
              onClick={() => focusPlanet(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                selectedPlanet?.id === p.id 
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30' 
                  : 'bg-black/50 border border-cyan-900/50 text-cyan-300 hover:bg-cyan-950'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              {p.name}
            </button>
          ))}
        </div>

        {/* Play / Speed / Orbit Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 bg-black/60 border border-cyan-900/60 text-cyan-300 hover:text-white rounded-xl flex items-center gap-1 text-xs font-bold"
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>

          <div className="flex items-center bg-black/60 border border-cyan-900/60 rounded-xl p-0.5 text-xs text-cyan-300">
            {[1, 5, 20, 100].map(s => (
              <button
                key={s}
                onClick={() => setTimeSpeed(s)}
                className={`px-2.5 py-1 rounded-lg font-bold ${timeSpeed === s ? 'bg-cyan-600 text-white' : 'hover:text-white'}`}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              targetLookAtRef.current.set(0, 0, 0);
              targetCamPosRef.current.set(0, 45, 70);
            }}
            className="p-2 bg-black/60 border border-cyan-900/60 text-cyan-300 hover:text-white rounded-xl"
            title="Reset Camera to Full View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div className="relative w-full h-[620px] bg-black rounded-3xl overflow-hidden border border-cyan-900/50 shadow-2xl">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Glassmorphic Selected Planet Info Overlay */}
        {selectedPlanet && (
          <div className="absolute bottom-6 left-6 max-w-sm bg-[#090d16]/90 border border-cyan-500/40 backdrop-blur-md rounded-2xl p-5 shadow-2xl text-xs space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800">
                {selectedPlanet.type}
              </span>
              <button
                onClick={() => onOpenPlanetTab(selectedPlanet.id)}
                className="text-cyan-300 hover:text-white text-[11px] font-bold flex items-center gap-1 underline"
              >
                Planet Explorer <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedPlanet.color }} />
                {selectedPlanet.name}
              </h3>
              <p className="text-[11px] text-cyan-200/80 italic mt-0.5">{selectedPlanet.tagline}</p>
            </div>

            <p className="text-cyan-100/70 text-[11px] leading-relaxed line-clamp-3">
              {selectedPlanet.description}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-cyan-900/40 font-mono text-[10px] text-cyan-300">
              <div><strong>Distance:</strong> {selectedPlanet.distanceFromSunAU} AU</div>
              <div><strong>Orbital Period:</strong> {selectedPlanet.orbitalPeriodDays} days</div>
              <div><strong>Radius:</strong> {selectedPlanet.radiusKm.toLocaleString()} km</div>
              <div><strong>Moons:</strong> {selectedPlanet.moonsCount}</div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
