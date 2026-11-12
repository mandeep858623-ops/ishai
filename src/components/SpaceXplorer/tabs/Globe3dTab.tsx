import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { PLANETS_DATA } from '../utils/spaceData';
import { PLANETARY_LOCATIONS, PlanetaryLocation } from '../utils/planetaryLocations';
import { createPlanetTexture } from '../utils/planetTextureGenerator';
import { PlanetData } from '../types';
import {
  Search, ZoomIn, ZoomOut, Compass, RotateCcw, Maximize2, Minimize2,
  Globe, MapPin, Eye, Layers, Navigation, Info, ArrowRight,
  Sliders, Sparkles, Ruler, Check, X, Shield, Activity
} from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

interface Globe3dTabProps {
  initialPlanetId?: string;
  onOpenAiGuide?: (question: string) => void;
  onSaveToCollection?: (item: any) => void;
}

export const Globe3dTab: React.FC<Globe3dTabProps> = ({
  initialPlanetId = 'earth',
  onOpenAiGuide,
  onSaveToCollection
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Active Planet & Camera Settings
  const [activePlanetId, setActivePlanetId] = useState<string>(initialPlanetId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<PlanetaryLocation | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Camera & Navigation HUD States
  const [zoomLevel, setZoomLevel] = useState(3.5); // Distance from planet center
  const [tiltAngleDeg, setTiltAngleDeg] = useState(0); // 0° = straight down, 70° = surface perspective
  const [compassHeading, setCompassHeading] = useState(0); // Rotation around target point
  const [showAtmosphere, setShowAtmosphere] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLocationDrawer, setShowLocationDrawer] = useState(false);

  // Measuring Tool State
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePointA, setMeasurePointA] = useState<{ lat: number; lon: number; name?: string } | null>(null);
  const [measurePointB, setMeasurePointB] = useState<{ lat: number; lon: number; name?: string } | null>(null);

  // Active Planet Data
  const currentPlanetData = useMemo(() => {
    return PLANETS_DATA.find((p) => p.id === activePlanetId) || PLANETS_DATA[3]; // Default Earth
  }, [activePlanetId]);

  // Locations filtered for active planet
  const planetLocations = useMemo(() => {
    return PLANETARY_LOCATIONS.filter((loc) => loc.planetId === activePlanetId);
  }, [activePlanetId]);

  // Search autocomplete results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return PLANETARY_LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.category.toLowerCase().includes(q) ||
        loc.planetId.toLowerCase().includes(q) ||
        (loc.countryOrRegion && loc.countryOrRegion.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [searchQuery]);

  // --- THREE.JS ENGINE REFS ---
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const planetGroupRef = useRef<THREE.Group | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const atmosphereMeshRef = useRef<THREE.Mesh | null>(null);
  const gridMeshRef = useRef<THREE.LineSegments | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const buildingsGroupRef = useRef<THREE.Group | null>(null);

  // Interaction State
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const targetCamPosRef = useRef(new THREE.Vector3(0, 0, 3.5));
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0, 0));
  const currentCamPosRef = useRef(new THREE.Vector3(0, 0, 3.5));
  const currentLookAtRef = useRef(new THREE.Vector3(0, 0, 0));

  // --- HELPER: Lat/Lon to 3D Sphere Position ---
  const latLonToVector3 = useCallback((lat: number, lon: number, radius: number = 1.0) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  }, []);

  // --- HELPER: Fly Camera smoothly to Lat/Lon ---
  const flyToLocation = useCallback(
    (lat: number, lon: number, customAltitude: number = 2.0) => {
      soundEngine.playSuccess();
      const radius = 1.0;
      const targetPos = latLonToVector3(lat, lon, radius);

      // Camera position slightly outward along the normal vector
      const camPos = latLonToVector3(lat, lon, customAltitude);

      targetLookAtRef.current.copy(targetPos);
      targetCamPosRef.current.copy(camPos);
      setZoomLevel(customAltitude);
    },
    [latLonToVector3]
  );

  // Handle location selection from search or cards
  const handleSelectLocation = (loc: PlanetaryLocation) => {
    if (loc.planetId !== activePlanetId) {
      setActivePlanetId(loc.planetId);
    }
    setSelectedLocation(loc);
    setShowLocationDrawer(true);
    setSearchQuery('');
    setIsSearching(false);
    flyToLocation(loc.lat, loc.lon, loc.altitude || 1.8);

    if (isMeasuring) {
      if (!measurePointA) {
        setMeasurePointA({ lat: loc.lat, lon: loc.lon, name: loc.name });
      } else if (!measurePointB) {
        setMeasurePointB({ lat: loc.lat, lon: loc.lon, name: loc.name });
      }
    }
  };

  // Switch Active Planet
  const handlePlanetChange = (planetId: string) => {
    soundEngine.playClick();
    setActivePlanetId(planetId);
    setSelectedLocation(null);
    setShowLocationDrawer(false);

    // Reset camera to default distance
    targetCamPosRef.current.set(0, 0, 3.5);
    targetLookAtRef.current.set(0, 0, 0);
    setZoomLevel(3.5);
    setTiltAngleDeg(0);
    setCompassHeading(0);
  };

  // Reset Camera to Home Position
  const handleResetHome = () => {
    soundEngine.playClick();
    targetCamPosRef.current.set(0, 0, 3.5);
    targetLookAtRef.current.set(0, 0, 0);
    setZoomLevel(3.5);
    setTiltAngleDeg(0);
    setCompassHeading(0);
    setSelectedLocation(null);
  };

  // Zoom Handler (+ / -)
  const handleZoom = (delta: number) => {
    soundEngine.playClick();
    setZoomLevel((prev) => {
      const next = Math.max(1.3, Math.min(8.0, prev + delta));
      const direction = currentCamPosRef.current.clone().normalize();
      targetCamPosRef.current.copy(direction.multiplyScalar(next));
      return next;
    });
  };

  // Tilt Handler
  const handleTiltChange = (newTilt: number) => {
    setTiltAngleDeg(newTilt);
    const rad = (newTilt * Math.PI) / 180;
    const dist = zoomLevel;
    const y = Math.sin(rad) * dist * 0.5;
    const z = Math.cos(rad) * dist;
    targetCamPosRef.current.setY(y).setZ(z);
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    soundEngine.playClick();
    if (!mountRef.current) return;
    if (!document.fullscreenElement) {
      mountRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Great-Circle Haversine Distance Calculation
  const measuredDistanceKm = useMemo(() => {
    if (!measurePointA || !measurePointB) return null;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = currentPlanetData.radiusKm || 6371;
    const dLat = toRad(measurePointB.lat - measurePointA.lat);
    const dLon = toRad(measurePointB.lon - measurePointA.lon);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(measurePointA.lat)) *
        Math.cos(toRad(measurePointB.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }, [measurePointA, measurePointB, currentPlanetData]);

  // --- INITIALIZE THREE.JS GLOBE SCENE ---
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    container.innerHTML = '';

    const width = container.clientWidth;
    const height = Math.max(500, container.clientHeight);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // Dark cosmic slate
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 3.5);
    cameraRef.current = camera;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    // Starfield Background Particles
    const starGeo = new THREE.BufferGeometry();
    const starCount = 2500;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 800;
      starPositions[i + 1] = (Math.random() - 0.5) * 800;
      starPositions[i + 2] = (Math.random() - 0.5) * 800;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.9, transparent: true, opacity: 0.85 });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Planet Root Group
    const planetGroup = new THREE.Group();
    scene.add(planetGroup);
    planetGroupRef.current = planetGroup;

    // Build Procedural Textures
    const textures = createPlanetTexture(activePlanetId);

    // Main Planet Sphere
    const sphereGeo = new THREE.SphereGeometry(1.0, 64, 64);
    const sphereMat = new THREE.MeshStandardMaterial({
      map: textures.surfaceTexture,
      roughness: activePlanetId === 'earth' ? 0.4 : 0.7,
      metalness: activePlanetId === 'earth' ? 0.2 : 0.1
    });
    const planetMesh = new THREE.Mesh(sphereGeo, sphereMat);
    planetGroup.add(planetMesh);

    // Earth Clouds Layer
    if (activePlanetId === 'earth' && textures.cloudsTexture) {
      const cloudGeo = new THREE.SphereGeometry(1.02, 64, 64);
      const cloudMat = new THREE.MeshStandardMaterial({
        map: textures.cloudsTexture,
        transparent: true,
        opacity: 0.8,
        blending: THREE.NormalBlending
      });
      const cloudsMesh = new THREE.Mesh(cloudGeo, cloudMat);
      planetGroup.add(cloudsMesh);
      cloudsMeshRef.current = cloudsMesh;
    }

    // Saturn / Uranus 3D Ring System
    if ((activePlanetId === 'saturn' || activePlanetId === 'uranus') && textures.ringsTexture) {
      const innerR = activePlanetId === 'saturn' ? 1.4 : 1.3;
      const outerR = activePlanetId === 'saturn' ? 2.3 : 1.8;
      const ringGeo = new THREE.RingGeometry(innerR, outerR, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        map: textures.ringsTexture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2.2;
      planetGroup.add(ringMesh);
    }

    // Atmosphere Glow Shell
    if (showAtmosphere && (activePlanetId === 'earth' || activePlanetId === 'mars' || activePlanetId === 'venus' || activePlanetId === 'neptune')) {
      const glowGeo = new THREE.SphereGeometry(1.05, 32, 32);
      const glowColor = activePlanetId === 'earth' ? 0x3b82f6 : activePlanetId === 'mars' ? 0xef4444 : activePlanetId === 'venus' ? 0xeab308 : 0x0284c7;
      const glowMat = new THREE.MeshBasicMaterial({
        color: glowColor,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.35
      });
      const atmosphereMesh = new THREE.Mesh(glowGeo, glowMat);
      scene.add(atmosphereMesh);
      atmosphereMeshRef.current = atmosphereMesh;
    }

    // Latitude / Longitude Grid Wireframe
    const gridGeo = new THREE.WireframeGeometry(new THREE.SphereGeometry(1.005, 18, 12));
    const gridMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: showGrid ? 0.35 : 0 });
    const gridMesh = new THREE.LineSegments(gridGeo, gridMat);
    planetGroup.add(gridMesh);
    gridMeshRef.current = gridMesh;

    // 3D Location Markers Group
    const markersGroup = new THREE.Group();
    planetGroup.add(markersGroup);
    markersGroupRef.current = markersGroup;

    if (showMarkers) {
      planetLocations.forEach((loc) => {
        const markerPos = latLonToVector3(loc.lat, loc.lon, 1.015);

        // Marker Sphere Pin
        const pinGeo = new THREE.SphereGeometry(0.025, 16, 16);
        const pinColor = loc.category === 'City' ? 0x38bdf8 : loc.category === 'Volcano' ? 0xef4444 : loc.category === 'Landing Site' ? 0xa855f7 : 0xf59e0b;
        const pinMat = new THREE.MeshBasicMaterial({ color: pinColor });
        const pinMesh = new THREE.Mesh(pinGeo, pinMat);
        pinMesh.position.copy(markerPos);

        // Outer Pulsing Glow Ring
        const ringGeo = new THREE.RingGeometry(0.03, 0.05, 16);
        const ringMat = new THREE.MeshBasicMaterial({ color: pinColor, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.copy(markerPos);
        ringMesh.lookAt(markerPos.clone().multiplyScalar(2));

        const pinGroup = new THREE.Group();
        pinGroup.add(pinMesh);
        pinGroup.add(ringMesh);
        pinGroup.userData = { location: loc };

        markersGroup.add(pinGroup);
      });
    }

    // 3D Earth Building / Landmark Models (Eiffel Tower, Pyramids, Empire State)
    const buildingsGroup = new THREE.Group();
    planetGroup.add(buildingsGroup);
    buildingsGroupRef.current = buildingsGroup;

    if (activePlanetId === 'earth') {
      // 1. Pyramids of Giza
      const gizaPos = latLonToVector3(29.9792, 31.1342, 1.008);
      const pyrGeo = new THREE.ConeGeometry(0.03, 0.04, 4);
      const pyrMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.8 });
      const pyrMesh = new THREE.Mesh(pyrGeo, pyrMat);
      pyrMesh.position.copy(gizaPos);
      pyrMesh.lookAt(gizaPos.clone().multiplyScalar(2));
      pyrMesh.rotation.x += Math.PI / 2;
      buildingsGroup.add(pyrMesh);

      // 2. Eiffel Tower Paris
      const parisPos = latLonToVector3(48.8566, 2.3522, 1.008);
      const eiffelGeo = new THREE.CylinderGeometry(0.005, 0.02, 0.05, 4);
      const eiffelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6 });
      const eiffelMesh = new THREE.Mesh(eiffelGeo, eiffelMat);
      eiffelMesh.position.copy(parisPos);
      eiffelMesh.lookAt(parisPos.clone().multiplyScalar(2));
      eiffelMesh.rotation.x += Math.PI / 2;
      buildingsGroup.add(eiffelMesh);
    }

    // --- ANIMATION LOOP ---
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Slow passive planetary self-rotation
      if (planetGroupRef.current) {
        planetGroupRef.current.rotation.y += 0.0008;
      }

      // Slightly faster clouds rotation
      if (cloudsMeshRef.current) {
        cloudsMeshRef.current.rotation.y += 0.0012;
      }

      // Smooth camera interpolation towards target camera position & lookAt
      currentCamPosRef.current.lerp(targetCamPosRef.current, 0.08);
      currentLookAtRef.current.lerp(targetLookAtRef.current, 0.08);

      if (cameraRef.current) {
        cameraRef.current.position.copy(currentCamPosRef.current);
        cameraRef.current.lookAt(currentLookAtRef.current);
      }

      // Calculate compass heading
      if (planetGroupRef.current) {
        setCompassHeading(Math.round(((planetGroupRef.current.rotation.y * 180) / Math.PI) % 360));
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // --- MOUSE & TOUCH NAVIGATION EVENT HANDLERS ---
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !planetGroupRef.current) return;

      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      planetGroupRef.current.rotation.y += deltaX * 0.005;
      planetGroupRef.current.rotation.x += deltaY * 0.005;

      // Clamp vertical rotation
      planetGroupRef.current.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, planetGroupRef.current.rotation.x));

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.002;
      setZoomLevel((prev) => {
        const next = Math.max(1.3, Math.min(8.0, prev + zoomDelta));
        const dir = currentCamPosRef.current.clone().normalize();
        targetCamPosRef.current.copy(dir.multiplyScalar(next));
        return next;
      });
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });

    // Handle Window Resize
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
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domElement.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [activePlanetId, showAtmosphere, latLonToVector3]);

  // Update Grid Visibility dynamically
  useEffect(() => {
    if (gridMeshRef.current) {
      (gridMeshRef.current.material as THREE.LineBasicMaterial).opacity = showGrid ? 0.35 : 0;
    }
  }, [showGrid]);

  return (
    <div className="relative w-full h-[82vh] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl select-none font-sans text-slate-100 flex flex-col">
      {/* --- TOP HUD BAR: SEARCH & PLANET SWITCHER --- */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-none">
        {/* Universal Search Bar */}
        <div className="relative w-full sm:w-80 pointer-events-auto">
          <div className="relative flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3.5 py-2 shadow-lg focus-within:border-cyan-400 transition-all">
            <Search className="w-4 h-4 text-cyan-400 shrink-0 mr-2" />
            <input
              type="text"
              placeholder={`Search ${currentPlanetData.name} features, cities, craters...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearching(true);
              }}
              onFocus={() => setIsSearching(true)}
              className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearching(false);
                }}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Search Dropdown */}
          {isSearching && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-30 max-h-64 overflow-y-auto">
              {searchResults.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => handleSelectLocation(loc)}
                  className="w-full flex items-center justify-between p-2.5 hover:bg-cyan-950/60 border-b border-slate-800/60 last:border-0 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{loc.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {loc.category} • {loc.planetId.toUpperCase()} {loc.countryOrRegion ? `(${loc.countryOrRegion})` : ''}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3 h-3 text-cyan-400 opacity-60" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Planet Quick Switcher Bar */}
        <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1 rounded-xl shadow-lg overflow-x-auto max-w-full scrollbar-none">
          {PLANETS_DATA.map((p) => {
            const isActive = p.id === activePlanetId;
            return (
              <button
                key={p.id}
                onClick={() => handlePlanetChange(p.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/20"
                  style={{ backgroundColor: p.color }}
                />
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- THREE.JS 3D CANVAS VIEWPORT --- */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* --- LEFT HUD OVERLAY: PLANET SPECS & FEATURED LOCATIONS --- */}
      <div className="absolute top-16 left-3 z-10 hidden sm:flex flex-col gap-2 max-w-xs pointer-events-none">
        {/* Planet Info Badge */}
        <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: currentPlanetData.color }} />
              {currentPlanetData.name}
              <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/80 border border-cyan-800/80 px-1.5 py-0.5 rounded">
                {currentPlanetData.type}
              </span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">3D GLOBE</span>
          </div>
          <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">{currentPlanetData.tagline}</p>

          <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800 text-[10px] text-slate-400">
            <div>Radius: <span className="text-slate-200 font-semibold">{currentPlanetData.radiusKm.toLocaleString()} km</span></div>
            <div>Temp: <span className="text-slate-200 font-semibold">{currentPlanetData.meanTempC}°C</span></div>
            <div>Orbit: <span className="text-slate-200 font-semibold">{currentPlanetData.orbitalPeriodDays} days</span></div>
            <div>Moons: <span className="text-slate-200 font-semibold">{currentPlanetData.moonsCount}</span></div>
          </div>
        </div>

        {/* Featured Surface Locations List */}
        <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl shadow-xl max-h-56 overflow-y-auto space-y-1">
          <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase px-1 mb-1">
            FEATURED LOCATIONS ({planetLocations.length})
          </div>
          {planetLocations.map((loc) => {
            const isSelected = selectedLocation?.id === loc.id;
            return (
              <button
                key={loc.id}
                onClick={() => handleSelectLocation(loc)}
                className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/90 border border-cyan-500/80 text-cyan-200 font-semibold'
                    : 'hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MapPin className={`w-3 h-3 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className="truncate">{loc.name}</span>
                </div>
                <span className="text-[9px] text-slate-500">{loc.category}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- RIGHT HUD OVERLAY: GOOGLE EARTH NAVIGATION CONTROLS --- */}
      <div className="absolute bottom-6 right-4 z-20 flex flex-col items-center gap-2.5 pointer-events-auto">
        {/* Compass Widget */}
        <button
          onClick={() => {
            soundEngine.playClick();
            setCompassHeading(0);
            if (planetGroupRef.current) planetGroupRef.current.rotation.y = 0;
          }}
          className="w-10 h-10 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/90 flex items-center justify-center shadow-xl hover:border-cyan-400 transition-all cursor-pointer group"
          title="Reset North Compass Heading"
        >
          <div
            className="transition-transform duration-300"
            style={{ transform: `rotate(${-compassHeading}deg)` }}
          >
            <Compass className="w-5 h-5 text-cyan-400 group-hover:scale-110" />
          </div>
        </button>

        {/* Zoom & Tilt Controls Stack */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/90 rounded-2xl p-1.5 shadow-2xl flex flex-col items-center gap-1.5">
          <button
            onClick={() => handleZoom(-0.5)}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-200 hover:text-cyan-400 transition-colors cursor-pointer"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-8 h-px bg-slate-800" />

          <button
            onClick={() => handleZoom(0.5)}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-200 hover:text-cyan-400 transition-colors cursor-pointer"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="w-8 h-px bg-slate-800" />

          {/* Reset Home */}
          <button
            onClick={handleResetHome}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-200 hover:text-cyan-400 transition-colors cursor-pointer"
            title="Reset Camera to Home View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Layer Toggles Menu Bar */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/90 rounded-2xl p-1.5 shadow-2xl flex flex-col items-center gap-1.5">
          {/* Lat/Lon Grid Toggle */}
          <button
            onClick={() => {
              soundEngine.playClick();
              setShowGrid(!showGrid);
            }}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              showGrid ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:bg-slate-800'
            }`}
            title="Toggle Latitude/Longitude Grid Lines"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Atmosphere Glow Toggle */}
          <button
            onClick={() => {
              soundEngine.playClick();
              setShowAtmosphere(!showAtmosphere);
            }}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              showAtmosphere ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:bg-slate-800'
            }`}
            title="Toggle Atmosphere Glow"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Distance Measure Tool */}
          <button
            onClick={() => {
              soundEngine.playClick();
              setIsMeasuring(!isMeasuring);
              if (isMeasuring) {
                setMeasurePointA(null);
                setMeasurePointB(null);
              }
            }}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isMeasuring ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400 hover:bg-slate-800'
            }`}
            title="Measure Surface Distance (Click 2 locations)"
          >
            <Ruler className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* --- MEASURE DISTANCE BANNER OVERLAY --- */}
      {isMeasuring && (
        <div className="absolute bottom-4 left-4 z-20 bg-slate-900/95 backdrop-blur-md border border-emerald-500/80 p-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs">
          <Ruler className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-emerald-300">SURFACE MEASUREMENT TOOL</div>
            <div className="text-[11px] text-slate-300">
              {!measurePointA && 'Click a location or pin to set Point A.'}
              {measurePointA && !measurePointB && `Point A: ${measurePointA.name || 'Selected'}. Now select Point B.`}
              {measurePointA && measurePointB && (
                <span className="text-emerald-200 font-semibold">
                  Distance: {measuredDistanceKm?.toLocaleString()} km (~{Math.round((measuredDistanceKm || 0) * 0.621371).toLocaleString()} miles)
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setMeasurePointA(null);
              setMeasurePointB(null);
              setIsMeasuring(false);
            }}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* --- LOCATION DETAIL SLIDE-OVER DRAWER --- */}
      {showLocationDrawer && selectedLocation && (
        <div className="absolute bottom-4 left-4 right-16 sm:right-auto sm:w-96 z-20 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/80 p-4 rounded-2xl shadow-2xl space-y-3 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded">
                {selectedLocation.category} • {selectedLocation.planetId.toUpperCase()}
              </span>
              <h3 className="text-base font-bold text-white mt-1">{selectedLocation.name}</h3>
              {selectedLocation.countryOrRegion && (
                <p className="text-xs text-slate-400">{selectedLocation.countryOrRegion}</p>
              )}
            </div>
            <button
              onClick={() => setShowLocationDrawer(false)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{selectedLocation.description}</p>

          {/* Elevation / Coordinates Specs */}
          <div className="grid grid-cols-2 gap-2 p-2 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-slate-400">
            <div>
              Coordinates:{' '}
              <span className="text-slate-200 font-mono font-semibold">
                {selectedLocation.lat.toFixed(2)}°, {selectedLocation.lon.toFixed(2)}°
              </span>
            </div>
            {selectedLocation.elevationMeters !== undefined && (
              <div>
                Elevation:{' '}
                <span className="text-slate-200 font-mono font-semibold">
                  {selectedLocation.elevationMeters.toLocaleString()} m
                </span>
              </div>
            )}
          </div>

          {/* Key Facts */}
          {selectedLocation.keyFacts && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 tracking-wider">GEOLOGICAL & HISTORIC HIGHLIGHTS:</div>
              <ul className="space-y-1 text-[11px] text-slate-300">
                {selectedLocation.keyFacts.map((fact, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                flyToLocation(selectedLocation.lat, selectedLocation.lon, selectedLocation.altitude || 1.8);
              }}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Fly To Surface</span>
            </button>

            {onOpenAiGuide && (
              <button
                onClick={() => {
                  onOpenAiGuide(`Tell me more about ${selectedLocation.name} on ${selectedLocation.planetId}`);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold py-1.5 px-3 rounded-xl text-xs flex items-center gap-1 border border-cyan-800/80 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
