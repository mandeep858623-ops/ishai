import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { getMoonPhaseInfo } from '../utils/astronomyEngine';
import { Star, Calendar, MapPin, Compass, Shield, Rocket, Globe } from 'lucide-react';

export const MoonTab: React.FC = () => {
  const moonInfo = getMoonPhaseInfo();
  const [selectedSite, setSelectedSite] = useState<string>('apollo11');
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const container = canvasRef.current;
    container.innerHTML = '';

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 3.8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    // Position sunlight according to phase angle
    sunLight.position.set(5, 2, 5);
    scene.add(sunLight);

    // Create 3D Moon Mesh
    const geometry = new THREE.SphereGeometry(1.4, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      roughness: 0.9,
      metalness: 0.1
    });

    const moonMesh = new THREE.Mesh(geometry, material);
    scene.add(moonMesh);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      moonMesh.rotation.y += 0.003;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [moonInfo]);

  const apolloSites = [
    { id: 'apollo11', name: 'Apollo 11', site: 'Sea of Tranquility', date: 'July 20, 1969', astronauts: 'Neil Armstrong, Buzz Aldrin' },
    { id: 'apollo12', name: 'Apollo 12', site: 'Ocean of Storms', date: 'Nov 19, 1969', astronauts: 'Pete Conrad, Alan Bean' },
    { id: 'apollo14', name: 'Apollo 14', site: 'Fra Mauro', date: 'Feb 5, 1971', astronauts: 'Alan Shepard, Edgar Mitchell' },
    { id: 'apollo15', name: 'Apollo 15', site: 'Hadley Rille', date: 'July 30, 1971', astronauts: 'David Scott, James Irwin' },
    { id: 'apollo16', name: 'Apollo 16', site: 'Descartes Highlands', date: 'April 21, 1972', astronauts: 'John Young, Charles Duke' },
    { id: 'apollo17', name: 'Apollo 17', site: 'Taurus-Littrow', date: 'Dec 11, 1972', astronauts: 'Gene Cernan, Harrison Schmitt' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Phase Header Banner */}
      <div className="bg-[#090d16] border border-cyan-900/40 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-300">Lunar Observation & Phase Data</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">{moonInfo.phaseName}</h1>
          <p className="text-xs text-cyan-200/70 leading-relaxed">
            The Moon is Earth’s only natural satellite. Current illumination is {moonInfo.illuminationPercentage}%, at an estimated lunar age of {moonInfo.ageDays} days.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 font-mono text-xs text-cyan-200 w-full md:w-auto">
          <div className="bg-black/50 border border-cyan-900/40 p-3.5 rounded-2xl">
            <span className="text-[10px] text-cyan-400/60 block">Illumination</span>
            <strong className="text-white text-base">{moonInfo.illuminationPercentage}%</strong>
          </div>
          <div className="bg-black/50 border border-cyan-900/40 p-3.5 rounded-2xl">
            <span className="text-[10px] text-cyan-400/60 block">Moon Age</span>
            <strong className="text-white text-base">{moonInfo.ageDays} days</strong>
          </div>
          <div className="bg-black/50 border border-cyan-900/40 p-3.5 rounded-2xl">
            <span className="text-[10px] text-cyan-400/60 block">Next Full Moon</span>
            <strong className="text-amber-300 text-xs">{moonInfo.nextFullMoonDate}</strong>
          </div>
          <div className="bg-black/50 border border-cyan-900/40 p-3.5 rounded-2xl">
            <span className="text-[10px] text-cyan-400/60 block">Next New Moon</span>
            <strong className="text-cyan-300 text-xs">{moonInfo.nextNewMoonDate}</strong>
          </div>
        </div>
      </div>

      {/* Grid: 3D Lunar Interactive View & Apollo Landing Sites */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive 3D Moon Canvas */}
        <div className="bg-[#090d16] border border-cyan-900/40 rounded-3xl p-6 flex flex-col items-center justify-between min-h-[400px]">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider self-start flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" /> Interactive 3D Lunar Globe
          </h3>

          <div ref={canvasRef} className="w-full h-64 my-auto cursor-grab active:cursor-grabbing" />

          <p className="text-[10px] text-cyan-400/60 text-center">
            Drag to rotate lunar hemisphere. Tidal locking keeps the same face toward Earth.
          </p>
        </div>

        {/* Historic Apollo Landing Sites Explorer */}
        <div className="lg:col-span-2 bg-[#090d16] border border-cyan-900/40 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Rocket className="w-4 h-4 text-amber-400" /> Historic Apollo Landing Sites on Lunar Surface
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {apolloSites.map((site) => (
              <div 
                key={site.id}
                onClick={() => setSelectedSite(site.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                  selectedSite === site.id
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg'
                    : 'bg-black/40 border-cyan-900/30 text-cyan-200/80 hover:bg-cyan-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{site.name}</h4>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                    {site.date}
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-semibold">{site.site}</p>
                <p className="text-[10px] text-zinc-400">Crew: {site.astronauts}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
