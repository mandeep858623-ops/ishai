import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { 
  Search, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Layers, 
  Info, 
  Cpu, 
  X,
  ChevronDown,
  ChevronUp,
  Camera,
  Database,
  Download,
  Glasses
} from 'lucide-react';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { 
  createGear, 
  createPiston, 
  createWrench, 
  createGenericPart,
  createAssemblyFromRecipe,
  MechanicalObjectParts,
  _vec3,
  _mat4
} from '../../utils/mechanicalProcedural';
import { soundEngine } from '../../utils/audio';

interface MechanicalLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  writeLog: (text: string, tag?: string) => void;
}

// Software WebGL Detection
const isSoftwareGl = (() => {
  if (typeof document === 'undefined') return true;
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param));
  // Free resources
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
})();

export const MechanicalLabModal: React.FC<MechanicalLabModalProps> = ({
  isOpen,
  onClose,
  writeLog
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const currentObjectRef = useRef<MechanicalObjectParts | null>(null);
  const frameIdRef = useRef<number>(0);
  
  // HUD State
  const [searchTerm, setSearchQuery] = useState('');
  const [activeObjectLabel, setActiveObjectLabel] = useState('SYSTEM_IDLE');
  const [isHudCollapsed, setIsHudCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'controls' | 'stats' | 'search'>('search');
  const [isExploded, setIsExploded] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [isXrSupported, setIsXrSupported] = useState(false);

  // WebXR Support Check
  useEffect(() => {
    if (typeof navigator !== 'undefined' && (navigator as any).xr) {
      (navigator as any).xr.isSessionSupported('immersive-vr').then((supported: boolean) => {
        setIsXrSupported(supported);
        if (supported) writeLog('[3D_LAB]: WebXR Hardware Detected', 'SYSTEM');
      });
    }
  }, [writeLog]);

  // Render on demand helpers
  const renderBusy = useRef(false);
  const renderDirty = useRef(false);

  const tick = useCallback(() => {
    if (controlsRef.current) controlsRef.current.update();
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, []);

  const requestRender = useCallback(() => {
    if (rendererRef.current?.xr.isPresenting) return; // XR handles its own loop
    
    if (renderBusy.current) {
      renderDirty.current = true;
      return;
    }
    renderBusy.current = true;
    frameIdRef.current = requestAnimationFrame(() => {
      renderDirty.current = false;
      tick();
      
      const done = () => {
        renderBusy.current = false;
        if (renderDirty.current) requestRender();
      };

      if (isSoftwareGl) {
        // Simple poll for completion in software mode
        setTimeout(done, 50);
      } else {
        done();
      }
    });
  }, [tick]);

  // Initialize Three.js Environment
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    // 1. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.xr.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    
    // Add VR Button
    const vrButton = VRButton.createButton(renderer);
    vrButton.style.display = 'none'; // We'll trigger it from our own UI
    containerRef.current.appendChild(vrButton);
    rendererRef.current = renderer;

    const onSessionStart = () => {
      renderer.setAnimationLoop(tick);
      writeLog('[3D_LAB]: WebXR Session started', 'SYSTEM');
    };
    const onSessionEnd = () => {
      renderer.setAnimationLoop(null);
      writeLog('[3D_LAB]: WebXR Session ended', 'SYSTEM');
      requestRender();
    };
    renderer.xr.addEventListener('sessionstart', onSessionStart);
    renderer.xr.addEventListener('sessionend', onSessionEnd);

    // 2. Scene & Atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c10);
    // Cool Hemisphere Fill vs Warm Directional Key
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.04);
    sceneRef.current = scene;

    // Environment map (Procedural Studio)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Camera & Controls
    const camera = new THREE.PerspectiveCamera(
      42, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      100
    );
    camera.position.set(4, 3, 6);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.addEventListener('change', requestRender);
    controlsRef.current = controls;

    // 4. Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x4488ff, 0x111111, 0.5); // Cool fill
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.4); // Warm key
    dirLight.position.set(5, 10, 2);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 5;
    dirLight.shadow.camera.bottom = -5;
    dirLight.shadow.camera.left = -5;
    dirLight.shadow.camera.right = 5;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.mapSize.set(1024, 1024);
    scene.add(dirLight);

    // Floor
    const gridHelper = new THREE.GridHelper(20, 40, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    const floorGeo = new THREE.PlaneGeometry(100, 100);
    const floorMat = new THREE.MeshStandardMaterial({ 
      color: 0x05070a, 
      roughness: 0.8,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Initial Render
    requestRender();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
      requestRender();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current) {
        rendererRef.current.xr.removeEventListener('sessionstart', onSessionStart);
        rendererRef.current.xr.removeEventListener('sessionend', onSessionEnd);
        rendererRef.current.dispose();
      }
      if (currentObjectRef.current) currentObjectRef.current.dispose();
      controls.removeEventListener('change', requestRender);
    };
  }, [isOpen, requestRender, tick, writeLog]);

  const toggleVr = useCallback(async () => {
    if (!rendererRef.current || !isXrSupported) return;
    
    soundEngine.playClick();
    const session = rendererRef.current.xr.getSession();
    
    if (session === null) {
      const sessionInit = { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers'] };
      try {
        const newSession = await (navigator as any).xr.requestSession('immersive-vr', sessionInit);
        rendererRef.current.xr.setSession(newSession);
      } catch (err: any) {
        writeLog(`[3D_LAB]: VR Session Request Failed: ${err.message}`, 'ERROR');
      }
    } else {
      session.end();
    }
  }, [isXrSupported, writeLog]);

  const [isBuilding, setIsBuilding] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportGLTF = useCallback(() => {
    if (!currentObjectRef.current || isExporting) return;
    setIsExporting(true);
    soundEngine.playClick();
    writeLog(`[3D_LAB]: Initializing GLTF export sequence...`, 'SYSTEM');

    const exporter = new GLTFExporter();
    exporter.parse(
      currentObjectRef.current.group,
      (gltf) => {
        const output = JSON.stringify(gltf, null, 2);
        const blob = new Blob([output], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${activeObjectLabel || 'MECHANICAL_ASSEMBLY'}.gltf`;
        link.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
        writeLog(`[3D_LAB]: Exported assembly to GLTF successfully.`, 'SUCCESS');
      },
      (error) => {
        console.error(error);
        setIsExporting(false);
        writeLog(`[3D_LAB]: GLTF Export failed. Check console for details.`, 'ERROR');
      },
      { binary: false }
    );
  }, [activeObjectLabel, isExporting, writeLog]);

  const handleExportSTL = useCallback(() => {
    if (!currentObjectRef.current || isExporting) return;
    setIsExporting(true);
    soundEngine.playClick();
    writeLog(`[3D_LAB]: Serializing mesh for STL export...`, 'SYSTEM');

    try {
      const exporter = new STLExporter();
      const result = exporter.parse(currentObjectRef.current.group);
      
      const blob = new Blob([result], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activeObjectLabel || 'MECHANICAL_ASSEMBLY'}.stl`;
      link.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
      writeLog(`[3D_LAB]: Exported assembly to STL successfully.`, 'SUCCESS');
    } catch (err: any) {
      console.error(err);
      setIsExporting(false);
      writeLog(`[3D_LAB]: STL Export failed: ${err.message}`, 'ERROR');
    }
  }, [activeObjectLabel, isExporting, writeLog]);

  const loadObject = async (query: string) => {
    if (!sceneRef.current) return;
    
    setIsBuilding(true);
    writeLog(`[3D_LAB]: Analyzing architecture for: "${query}"...`, 'SYSTEM');

    const term = query.toLowerCase().trim();
    
    // FAST PATH: Direct Primitives
    const primitives = ['cube', 'box', 'sphere', 'ball', 'cylinder', 'pipe', 'cone', 'pyramid', 'torus', 'donut', 'ring'];
    if (primitives.some(p => term === p)) {
      writeLog(`[3D_LAB]: Direct primitive detected. Bypassing AI analysis.`, 'SYSTEM');
      const result = createGenericPart(term);
      if (currentObjectRef.current) {
        sceneRef.current.remove(currentObjectRef.current.group);
        currentObjectRef.current.dispose();
      }
      currentObjectRef.current = result;
      sceneRef.current.add(result.group);
      setActiveObjectLabel(`PRIMITIVE_${term.toUpperCase()}`);
      setIsBuilding(false);
      requestRender();
      return;
    }

    try {
      // AI Analysis Call
      const response = await fetch('/api/mechanical/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `AI analysis failed with status ${response.status}`);
      }
      const data = await response.json();
      
      if (!data.success || !data.recipe) throw new Error(data.error || 'Invalid recipe received from AI core');

      // Cleanup previous
      if (currentObjectRef.current) {
        sceneRef.current.remove(currentObjectRef.current.group);
        currentObjectRef.current.dispose();
      }

      // Procedural Assembly
      const result = createAssemblyFromRecipe(data.recipe);
      currentObjectRef.current = result;
      sceneRef.current.add(result.group);
      
      setActiveObjectLabel(data.recipe.name.toUpperCase().replace(/\s+/g, '_'));

      // Assembly Effect
      result.group.scale.set(0, 0, 0);
      const start = Date.now();
      const duration = 800;
      const animateLoad = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4); // Quartic ease out
        if (result.group) {
          result.group.scale.set(ease, ease, ease);
          requestRender();
          if (progress < 1) requestAnimationFrame(animateLoad);
        }
      };
      animateLoad();
      
      writeLog(`[3D_LAB]: Successfully assembled "${data.recipe.name}"`, 'SUCCESS');
    } catch (err: any) {
      console.error(err);
      writeLog(`[3D_LAB]: Error during assembly: ${err.message}`, 'ERROR');
      
      // Fallback to legacy or generic
      const term = query.toLowerCase().trim();
      let result: MechanicalObjectParts;
      if (term.includes('gear')) result = createGear();
      else if (term.includes('piston')) result = createPiston();
      else if (term.includes('wrench')) result = createWrench();
      else result = createGenericPart(term);
      
      if (currentObjectRef.current) {
        sceneRef.current.remove(currentObjectRef.current.group);
        currentObjectRef.current.dispose();
      }
      currentObjectRef.current = result;
      sceneRef.current.add(result.group);
      setActiveObjectLabel(`FALLBACK_${term.toUpperCase() || 'NULL'}`);
      requestRender();
    } finally {
      setIsBuilding(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    soundEngine.playClick();
    loadObject(searchTerm);
  };

  const toggleExploded = () => {
    setIsExploded(!isExploded);
    soundEngine.playClick();
    if (!currentObjectRef.current) return;
    
    const target = isExploded ? 0 : 1;
    const startPos: THREE.Vector3[] = [];
    currentObjectRef.current.group.children.forEach(child => startPos.push(child.position.clone()));
    
    const start = Date.now();
    const duration = 500;
    const animateExplode = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      currentObjectRef.current?.group.children.forEach((child, i) => {
        // Push parts away from local origin
        _vec3.copy(child.position).normalize().multiplyScalar(ease * target * 0.8);
        child.position.add(_vec3);
      });
      requestRender();
      if (progress < 1) requestAnimationFrame(animateExplode);
    };
    animateExplode();
  };

  const toggleWireframe = () => {
    setWireframe(!wireframe);
    soundEngine.playClick();
    if (!currentObjectRef.current) return;
    currentObjectRef.current.group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => (m as THREE.MeshStandardMaterial).wireframe = !wireframe);
        } else {
          (mesh.material as THREE.MeshStandardMaterial).wireframe = !wireframe;
        }
      }
    });
    requestRender();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden font-sans">
      
      {/* --- THREE.JS VIEWPORT --- */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* --- TOP HUD --- */}
      <div className="absolute top-6 left-6 right-6 flex items-start justify-between pointer-events-none z-10">
        <div className="bg-black/80 border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-4 backdrop-blur-xl pointer-events-auto">
          <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xs font-black text-white tracking-widest uppercase">3D Mechanical Lab</h2>
            <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>MATRIX_STABLE: {activeObjectLabel}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="p-3 bg-black/80 border border-white/10 hover:border-red-500/50 text-zinc-400 hover:text-red-400 rounded-2xl backdrop-blur-xl transition-all cursor-pointer pointer-events-auto shadow-2xl"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* --- BOTTOM COLLAPSIBLE DOCK --- */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 w-[90vw] max-w-[800px] z-20 transition-all duration-500 ease-in-out ${isHudCollapsed ? 'translate-y-[calc(100%-48px)]' : 'translate-y-0'}`}>
        
        {/* Collapse Toggle */}
        <div className="flex justify-center mb-2">
          <button 
            onClick={() => setIsHudCollapsed(!isHudCollapsed)}
            className="flex items-center gap-2 px-4 py-1.5 bg-black/90 border border-white/10 rounded-full text-[10px] font-bold text-zinc-400 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-lg"
          >
            {isHudCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {isHudCollapsed ? 'SHOW INTERFACE' : 'HIDE INTERFACE'}
          </button>
        </div>

        {/* Main Dock Content */}
        <div className="bg-[#0e0f12]/95 border border-white/10 rounded-3xl p-2 shadow-2xl flex flex-col gap-2 overflow-hidden">
          
          {/* Tab Headers */}
          <div className="flex items-center gap-1 p-1 bg-black/40 rounded-2xl border border-white/5">
            {[
              { id: 'search', icon: Search, label: 'Constructor' },
              { id: 'controls', icon: Layers, label: 'Simulation' },
              { id: 'stats', icon: Database, label: 'Analysis' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); soundEngine.playClick(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black transition-all cursor-pointer uppercase tracking-widest ${activeTab === tab.id ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Viewport */}
          <div className="min-h-[120px] px-4 py-3 flex flex-col">
            
            {activeTab === 'search' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <form onSubmit={handleSearchSubmit} className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
                  <input 
                    type="text"
                    placeholder={isBuilding ? "Analyzing mechanical structure..." : "Describe object... (e.g. 'heavy gear', 'dark piston')"}
                    value={searchTerm}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isBuilding}
                    className={`w-full bg-black/60 border border-white/10 focus:border-cyan-500/50 rounded-2xl pl-11 pr-4 py-3 text-xs text-white outline-none transition-all ${isBuilding ? 'opacity-50 cursor-wait' : ''}`}
                  />
                  <button 
                    type="submit"
                    disabled={isBuilding}
                    className="absolute right-2 top-1.5 bottom-1.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-wait"
                  >
                    {isBuilding ? 'CONSTRUCTING...' : 'BUILD'}
                  </button>
                </form>
                <div className="flex flex-wrap gap-2">
                  {['Gear', 'Piston', 'Wrench', 'Turbine', 'Bracket'].map(tag => (
                    <button 
                      key={tag}
                      type="button"
                      onClick={() => { setSearchQuery(tag); loadObject(tag); soundEngine.playClick(); }}
                      className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-zinc-400 hover:bg-cyan-500/10 hover:text-cyan-300 hover:border-cyan-500/30 transition-all cursor-pointer"
                    >
                      {tag.toUpperCase()}
                    </button>
                  ))}
                  <button 
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      if (currentObjectRef.current && sceneRef.current) {
                        sceneRef.current.remove(currentObjectRef.current.group);
                        currentObjectRef.current.dispose();
                        currentObjectRef.current = null;
                        setActiveObjectLabel('SYSTEM_IDLE');
                        requestRender();
                      }
                      soundEngine.playClick();
                    }}
                    className="ml-auto px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-[9px] font-black text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                  >
                    RESET SCENE
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'controls' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Visual Matrix</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={toggleWireframe}
                      className={`flex-1 py-2.5 rounded-xl border text-[10px] font-black transition-all cursor-pointer ${wireframe ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg' : 'bg-black/40 border-white/10 text-zinc-500'}`}
                    >
                      WIREFRAME
                    </button>
                    <button 
                      onClick={toggleExploded}
                      className={`flex-1 py-2.5 rounded-xl border text-[10px] font-black transition-all cursor-pointer ${isExploded ? 'bg-purple-600 border-purple-400 text-white shadow-lg' : 'bg-black/40 border-white/10 text-zinc-500'}`}
                    >
                      EXPLODED
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1 flex items-center gap-2"><Camera className="w-3 h-3" /> Perspective</label>
                  <div className="flex gap-2">
                    {['ISO', 'FRONT', 'TOP'].map(pos => (
                      <button 
                        key={pos}
                        onClick={() => {
                          soundEngine.playClick();
                          if (cameraRef.current && controlsRef.current) {
                            if (pos === 'ISO') cameraRef.current.position.set(4, 3, 6);
                            if (pos === 'FRONT') cameraRef.current.position.set(0, 0, 7);
                            if (pos === 'TOP') cameraRef.current.position.set(0, 7, 0);
                            controlsRef.current.update();
                            requestRender();
                          }
                        }}
                        className="flex-1 py-2.5 bg-black/40 border border-white/10 rounded-xl text-[10px] font-black text-zinc-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                      >
                        {pos}
                      </button>
                    ))}
                    <button 
                      onClick={() => {
                        soundEngine.playClick();
                        controlsRef.current?.reset();
                        cameraRef.current?.position.set(4, 3, 6);
                        requestRender();
                      }}
                      className="p-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-500 hover:text-cyan-400 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isXrSupported && (
                  <div className="col-span-full space-y-2">
                    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1 flex items-center gap-2">
                      <Glasses className="w-3 h-3" /> Virtual Reality
                    </label>
                    <button 
                      onClick={toggleVr}
                      className="w-full py-3 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 border border-white/10 hover:border-cyan-500/50 text-cyan-400 text-[10px] font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      ENTER IMMERSIVE VR
                    </button>
                  </div>
                )}

                <div className="col-span-full h-px bg-white/5 my-1" />
                
                <div className="col-span-full space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1 flex items-center gap-2">
                    <Download className="w-3 h-3" /> Assembly & Export
                  </label>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleExportGLTF}
                      disabled={!currentObjectRef.current || isExporting}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-cyan-600/20 border border-cyan-500/30 hover:bg-cyan-600/40 text-cyan-400 text-[10px] font-black rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      GLTF
                    </button>
                    <button 
                      onClick={handleExportSTL}
                      disabled={!currentObjectRef.current || isExporting}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white text-[10px] font-black rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      STL
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {[
                  { label: 'Complexity', value: 'Level 6' },
                  { label: 'Surface', value: 'Studio PBR' },
                  { label: 'Rendering', value: isSoftwareGl ? 'Software' : 'GPU' },
                  { label: 'Status', value: 'Verified' }
                ].map(stat => (
                  <div key={stat.label} className="bg-black/40 border border-white/5 rounded-2xl p-3 flex flex-col gap-1">
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{stat.label}</span>
                    <span className="text-[10px] font-bold text-cyan-400 font-mono">{stat.value}</span>
                  </div>
                ))}
                <div className="col-span-full flex items-start gap-3 p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl">
                  <Info className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                    Procedural Graphics Engine: Utilizing on-demand PBR rendering. Use export functions in the Simulation tab to download geometries.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
