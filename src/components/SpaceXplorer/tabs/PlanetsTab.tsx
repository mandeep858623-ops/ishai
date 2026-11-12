import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PLANETS_DATA } from '../utils/spaceData';
import { PlanetData, SavedCollectionItem } from '../types';
import { Globe, ArrowLeftRight, Bookmark, Sparkles, Shield, Rocket, Thermometer, Radio, Orbit } from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

interface PlanetsTabProps {
  initialPlanetId?: string;
  onSaveToCollection: (item: SavedCollectionItem) => void;
  onSelectTab?: (tab: any, param?: string) => void;
}

export const PlanetsTab: React.FC<PlanetsTabProps> = ({
  initialPlanetId = 'earth',
  onSaveToCollection,
  onSelectTab
}) => {
  const [activePlanet, setActivePlanet] = useState<PlanetData>(
    PLANETS_DATA.find(p => p.id === initialPlanetId) || PLANETS_DATA[3]
  );
  
  // Comparison Tool State
  const [showComparison, setShowComparison] = useState(false);
  const [comparePlanet1, setComparePlanet1] = useState<PlanetData>(PLANETS_DATA[3]); // Earth
  const [comparePlanet2, setComparePlanet2] = useState<PlanetData>(PLANETS_DATA[4]); // Mars
  const [comparePlanet3, setComparePlanet3] = useState<PlanetData>(PLANETS_DATA[2]); // Venus

  // 3D Planet Preview canvas
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || showComparison) return;
    const container = canvasRef.current;
    container.innerHTML = '';

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 4.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    const geometry = new THREE.SphereGeometry(1.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(activePlanet.color),
      roughness: 0.5,
      metalness: 0.2
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    if (activePlanet.id === 'saturn') {
      const ringGeo = new THREE.RingGeometry(2.0, 3.2, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xd7ccc8, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2.3;
      mesh.add(ring);
    }

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      mesh.rotation.y += 0.005;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [activePlanet, showComparison]);

  const handleSavePlanet = () => {
    soundEngine.playSuccess();
    onSaveToCollection({
      id: `planet_${activePlanet.id}`,
      type: 'planet',
      title: activePlanet.name,
      subtitle: activePlanet.tagline,
      savedAt: new Date().toLocaleDateString(),
      data: activePlanet
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Selector Bar */}
      <div className="bg-[#090d16] border border-cyan-900/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        
        {/* Planet Selection Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {PLANETS_DATA.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActivePlanet(p);
                setShowComparison(false);
                soundEngine.playClick();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activePlanet.id === p.id && !showComparison
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                  : 'bg-black/50 border border-cyan-900/50 text-cyan-300 hover:bg-cyan-950'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              {p.name}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowComparison(!showComparison)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            showComparison ? 'bg-purple-600 text-white shadow-lg' : 'bg-black/60 border border-purple-500/40 text-purple-300 hover:bg-purple-950'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          {showComparison ? 'Exit Comparison' : 'Compare Planets'}
        </button>
      </div>

      {/* PLANET COMPARISON MODE */}
      {showComparison ? (
        <div className="bg-[#090d16] border border-purple-500/40 rounded-3xl p-6 space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-purple-900/40 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-purple-400" />
                Planetary Comparison Matrix
              </h2>
              <p className="text-xs text-cyan-200/70">Compare physical scales, atmospheres, temperatures, and orbits side-by-side.</p>
            </div>
          </div>

          {/* Selectors for 3 Planets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { planet: comparePlanet1, setPlanet: setComparePlanet1, label: 'Planet A' },
              { planet: comparePlanet2, setPlanet: setComparePlanet2, label: 'Planet B' },
              { planet: comparePlanet3, setPlanet: setComparePlanet3, label: 'Planet C' },
            ].map((col, idx) => (
              <div key={idx} className="bg-black/50 border border-purple-900/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-400 uppercase">{col.label}</span>
                  <select
                    value={col.planet.id}
                    onChange={(e) => {
                      const found = PLANETS_DATA.find(p => p.id === e.target.value);
                      if (found) col.setPlanet(found);
                    }}
                    className="bg-zinc-900 text-white font-bold text-xs px-2.5 py-1 rounded-lg border border-purple-500/40 focus:outline-none cursor-pointer"
                  >
                    {PLANETS_DATA.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="text-center py-3">
                  <div className="w-16 h-16 mx-auto rounded-full shadow-xl flex items-center justify-center text-xl font-bold text-white mb-2" style={{ background: col.planet.texturePattern }}>
                    {col.planet.name[0]}
                  </div>
                  <h3 className="text-base font-extrabold text-white">{col.planet.name}</h3>
                  <p className="text-[10px] text-cyan-400">{col.planet.type}</p>
                </div>

                <div className="space-y-2 font-mono text-xs text-cyan-200 pt-2 border-t border-purple-900/30">
                  <div className="flex justify-between"><span>Radius:</span> <strong>{col.planet.radiusKm.toLocaleString()} km</strong></div>
                  <div className="flex justify-between"><span>Mass:</span> <strong>{col.planet.massEarths} Earths</strong></div>
                  <div className="flex justify-between"><span>Distance:</span> <strong>{col.planet.distanceFromSunAU} AU</strong></div>
                  <div className="flex justify-between"><span>Avg Temp:</span> <strong>{col.planet.meanTempC}°C</strong></div>
                  <div className="flex justify-between"><span>Moons:</span> <strong>{col.planet.moonsCount}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* SINGLE PLANET DETAILED PROFILE */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: 3D Interactive Model Canvas */}
          <div className="bg-[#090d16] border border-cyan-900/40 rounded-3xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden min-h-[420px]">
            <div className="flex items-center justify-between z-10">
              <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 bg-cyan-950 px-3 py-1 rounded-full border border-cyan-800">
                {activePlanet.type}
              </span>
              <div className="flex items-center gap-2">
                {onSelectTab && (
                  <button
                    onClick={() => onSelectTab('globe3d', activePlanet.id)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" /> 3D Globe Explorer
                  </button>
                )}
                <button
                  onClick={handleSavePlanet}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5" /> Save Object
                </button>
              </div>
            </div>

            <div ref={canvasRef} className="w-full h-64 my-auto cursor-grab active:cursor-grabbing" />

            <div className="text-center z-10">
              <h2 className="text-2xl font-extrabold text-white">{activePlanet.name}</h2>
              <p className="text-xs text-cyan-300/80 italic mt-0.5">{activePlanet.tagline}</p>
            </div>
          </div>

          {/* Right Column: Physical Specs, Atmosphere & Key Discoveries */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Overview */}
            <div className="bg-[#090d16] border border-cyan-900/40 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" /> Planetary Profile & Overview
              </h3>
              <p className="text-xs text-cyan-100/80 leading-relaxed font-sans">
                {activePlanet.description}
              </p>

              {/* Physical Spec Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
                <div className="bg-black/40 border border-cyan-900/30 p-3 rounded-2xl">
                  <span className="text-[10px] text-cyan-400/60 block">Distance from Sun</span>
                  <strong className="text-white text-sm">{activePlanet.distanceFromSunAU} AU</strong>
                </div>
                <div className="bg-black/40 border border-cyan-900/30 p-3 rounded-2xl">
                  <span className="text-[10px] text-cyan-400/60 block">Orbital Period</span>
                  <strong className="text-white text-sm">{activePlanet.orbitalPeriodDays} days</strong>
                </div>
                <div className="bg-black/40 border border-cyan-900/30 p-3 rounded-2xl">
                  <span className="text-[10px] text-cyan-400/60 block">Rotation Day</span>
                  <strong className="text-white text-sm">{activePlanet.rotationPeriodHours} hrs</strong>
                </div>
                <div className="bg-black/40 border border-cyan-900/30 p-3 rounded-2xl">
                  <span className="text-[10px] text-cyan-400/60 block">Mean Temperature</span>
                  <strong className="text-white text-sm">{activePlanet.meanTempC}°C</strong>
                </div>
              </div>
            </div>

            {/* Atmosphere & Moons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-[#090d16] border border-cyan-900/40 rounded-3xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" /> Atmospheric Composition
                </h4>
                <div className="flex flex-wrap gap-2">
                  {activePlanet.atmosphereComposition.map((gas, i) => (
                    <span key={i} className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
                      {gas}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-[#090d16] border border-cyan-900/40 rounded-3xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Orbit className="w-4 h-4 text-purple-400" /> Moons & Satellites ({activePlanet.moonsCount})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {activePlanet.majorMoons.length > 0 ? activePlanet.majorMoons.map((m, i) => (
                    <span key={i} className="text-[10px] font-bold text-purple-300 bg-purple-950/60 border border-purple-800/60 px-2.5 py-1 rounded-lg">
                      {m}
                    </span>
                  )) : (
                    <span className="text-xs text-zinc-500 italic">No natural satellites</span>
                  )}
                </div>
              </div>

            </div>

            {/* Key Facts & Exploration Missions */}
            <div className="bg-[#090d16] border border-cyan-900/40 rounded-3xl p-6 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Rocket className="w-4 h-4 text-amber-400" /> Scientific Discoveries & Notable Missions
              </h4>
              <ul className="space-y-2 text-xs text-cyan-100/80">
                {activePlanet.keyFacts.map((fact, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
