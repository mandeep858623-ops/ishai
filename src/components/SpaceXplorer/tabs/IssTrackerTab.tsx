import React, { useState, useEffect } from 'react';
import { calculateSatellitePosition } from '../utils/astronomyEngine';
import { SATELLITES_DATA } from '../utils/spaceData';
import { Satellite, Video, Users, Globe, Radio, ShieldCheck, ExternalLink, Activity } from 'lucide-react';

export const IssTrackerTab: React.FC = () => {
  const iss = SATELLITES_DATA.find(s => s.id === 'iss') || SATELLITES_DATA[0];
  const [livePos, setLivePos] = useState({ lat: 28.5, lon: -80.5, altKm: 420, velocityKmSec: 7.66 });

  useEffect(() => {
    const update = () => {
      setLivePos(calculateSatellitePosition(iss, new Date()));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [iss]);

  const currentCrew = [
    { name: 'Sunita Williams', role: 'Expedition Commander', agency: 'NASA' },
    { name: 'Barry Wilmore', role: 'Flight Engineer', agency: 'NASA' },
    { name: 'Don Pettit', role: 'Flight Engineer', agency: 'NASA' },
    { name: 'Alexey Ovchinin', role: 'Flight Engineer', agency: 'Roscosmos' },
    { name: 'Ivan Vagner', role: 'Flight Engineer', agency: 'Roscosmos' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-950/80 via-indigo-950/80 to-black border border-cyan-500/40 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-300">ISS Command Center Live Telemetry</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">International Space Station (ISS)</h1>
          <p className="text-xs text-cyan-200/70 max-w-xl">
            Orbiting Earth every 92.68 minutes at a speed of ~27,600 km/h (~7.66 km/s) at an altitude of 420 km.
          </p>
        </div>

        <div className="bg-black/60 border border-cyan-500/30 p-4 rounded-2xl font-mono text-xs text-cyan-200 space-y-1 shrink-0 min-w-[220px]">
          <div className="flex justify-between"><span>Latitude:</span> <strong className="text-white">{livePos.lat}°</strong></div>
          <div className="flex justify-between"><span>Longitude:</span> <strong className="text-white">{livePos.lon}°</strong></div>
          <div className="flex justify-between"><span>Altitude:</span> <strong className="text-white">{livePos.altKm} km</strong></div>
          <div className="flex justify-between"><span>Speed:</span> <strong className="text-white">{(livePos.velocityKmSec * 3600).toLocaleString()} km/h</strong></div>
        </div>
      </div>

      {/* Grid: Live Video Stream & Astronaut Crew Onboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* NASA ISS Live Video Stream Embed */}
        <div className="lg:col-span-2 bg-[#090d16] border border-cyan-900/40 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-400" />
              NASA Official ISS High-Definition Earth Views (HDEV) Stream
            </h3>
            <a 
              href="https://www.youtube.com/watch?v=21X5lGlDOfg" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs text-cyan-400 hover:text-white flex items-center gap-1 font-bold"
            >
              Open Official Stream <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-cyan-900/60 bg-black flex items-center justify-center">
            <iframe
              src="https://www.youtube-nocookie.com/embed/21X5lGlDOfg?autoplay=0&mute=1"
              title="NASA Live ISS Stream"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="text-[11px] text-cyan-400/60">
            * Note: Live video from ISS is available when the station is in contact with ground stations and during orbit daylight passes.
          </p>
        </div>

        {/* Current Expedition Astronaut Crew Onboard */}
        <div className="bg-[#090d16] border border-cyan-900/40 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            Active Astronaut Crew Onboard ({currentCrew.length})
          </h3>

          <div className="space-y-3">
            {currentCrew.map((c, i) => (
              <div key={i} className="bg-black/50 border border-cyan-900/30 p-3 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-white">{c.name}</h4>
                  <p className="text-[10px] text-cyan-400/70">{c.role}</p>
                </div>
                <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-800">
                  {c.agency}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
