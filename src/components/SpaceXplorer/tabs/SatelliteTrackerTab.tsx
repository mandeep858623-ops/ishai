import React, { useState, useEffect } from 'react';
import { SATELLITES_DATA } from '../utils/spaceData';
import { SatelliteData, SavedCollectionItem } from '../types';
import { calculateSatellitePosition } from '../utils/astronomyEngine';
import { Satellite, Globe, Search, Radio, Compass, Bookmark, Clock, ArrowRight, ShieldAlert } from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

interface SatelliteTrackerTabProps {
  onSaveToCollection: (item: SavedCollectionItem) => void;
}

export const SatelliteTrackerTab: React.FC<SatelliteTrackerTabProps> = ({
  onSaveToCollection
}) => {
  const [selectedSatellite, setSelectedSatellite] = useState<SatelliteData>(SATELLITES_DATA[0]);
  const [livePos, setLivePos] = useState({ lat: 0, lon: 0, altKm: 420, velocityKmSec: 7.66 });
  const [searchQuery, setSearchQuery] = useState('');

  // Live Position Update Ticker
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setLivePos(calculateSatellitePosition(selectedSatellite, now));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [selectedSatellite]);

  const filteredList = SATELLITES_DATA.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.noradId.toString().includes(searchQuery)
  );

  const handleSave = () => {
    soundEngine.playSuccess();
    onSaveToCollection({
      id: `sat_${selectedSatellite.id}`,
      type: 'satellite',
      title: selectedSatellite.name,
      subtitle: `NORAD ID: ${selectedSatellite.noradId}`,
      savedAt: new Date().toLocaleDateString(),
      data: selectedSatellite
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Bar */}
      <div className="bg-[#090d16] border border-cyan-900/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Satellite className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h2 className="text-base font-extrabold text-white">Orbital Satellite & Spacecraft Tracker</h2>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-cyan-400/60" />
          <input
            type="text"
            placeholder="Search satellite name or NORAD catalog ID (e.g. 25544, 20580)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/60 border border-cyan-900/60 focus:border-cyan-400 text-xs text-cyan-200 placeholder:text-cyan-400/40 rounded-xl pl-9 pr-3 py-2 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Satellite Selection List */}
        <div className="bg-[#090d16] border border-cyan-900/40 rounded-3xl p-4 space-y-2 max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-900">
          <span className="text-[10px] font-bold text-cyan-400/60 uppercase px-2 block">Tracked Spacecraft ({filteredList.length})</span>
          {filteredList.map((sat) => (
            <div
              key={sat.id}
              onClick={() => {
                setSelectedSatellite(sat);
                soundEngine.playClick();
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                selectedSatellite.id === sat.id
                  ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-lg'
                  : 'bg-black/40 border-cyan-900/30 text-cyan-200/80 hover:bg-cyan-950/40 hover:border-cyan-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white truncate max-w-[180px]">{sat.name}</h3>
                <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  NORAD {sat.noradId}
                </span>
              </div>
              <p className="text-[10px] text-cyan-400/70">{sat.type} • {sat.operator}</p>
            </div>
          ))}
        </div>

        {/* Selected Satellite Live Control & Map View */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#090d16] border border-cyan-900/40 rounded-3xl p-6 space-y-6">
            
            <div className="flex items-start justify-between border-b border-cyan-900/40 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1.5 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Real-Time Orbital Stream
                </span>
                <h2 className="text-xl font-extrabold text-white mt-2">{selectedSatellite.name}</h2>
                <p className="text-xs text-cyan-300/80 mt-0.5">Operated by {selectedSatellite.operator} • Launched {selectedSatellite.launchYear}</p>
              </div>

              <button
                onClick={handleSave}
                className="p-2.5 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-300 hover:text-white"
                title="Save Satellite"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Live World Map Tracking Ground Track */}
            <div className="relative w-full h-64 bg-slate-950 rounded-2xl overflow-hidden border border-cyan-900/50 flex items-center justify-center p-4">
              {/* World Map Background grid */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
              
              {/* Ground Position Marker */}
              <div className="relative z-10 text-center space-y-2">
                <div className="relative inline-block">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 animate-pulse">
                    <Satellite className="w-6 h-6" />
                  </div>
                  <div className="absolute -inset-2 rounded-full border border-cyan-400/30 animate-ping pointer-events-none" />
                </div>
                <div className="bg-black/80 border border-cyan-500/40 px-4 py-2 rounded-xl text-xs font-mono text-cyan-300 backdrop-blur-md">
                  <p>Latitude: <strong className="text-white">{livePos.lat}°</strong></p>
                  <p>Longitude: <strong className="text-white">{livePos.lon}°</strong></p>
                </div>
              </div>
            </div>

            {/* Live Orbital Telemetry Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="bg-black/40 border border-cyan-900/30 p-3 rounded-2xl">
                <span className="text-[10px] text-cyan-400/60 block">Altitude</span>
                <strong className="text-white text-sm">{livePos.altKm} km</strong>
              </div>
              <div className="bg-black/40 border border-cyan-900/30 p-3 rounded-2xl">
                <span className="text-[10px] text-cyan-400/60 block">Velocity</span>
                <strong className="text-white text-sm">{livePos.velocityKmSec} km/s</strong>
              </div>
              <div className="bg-black/40 border border-cyan-900/30 p-3 rounded-2xl">
                <span className="text-[10px] text-cyan-400/60 block">Orbit Period</span>
                <strong className="text-white text-sm">{selectedSatellite.periodMinutes} mins</strong>
              </div>
              <div className="bg-black/40 border border-cyan-900/30 p-3 rounded-2xl">
                <span className="text-[10px] text-cyan-400/60 block">Inclination</span>
                <strong className="text-white text-sm">{selectedSatellite.inclinationDeg}°</strong>
              </div>
            </div>

            <p className="text-xs text-cyan-100/80 leading-relaxed font-sans bg-black/40 border border-cyan-900/30 p-4 rounded-2xl">
              {selectedSatellite.description}
            </p>

          </div>
        </div>

      </div>

    </div>
  );
};
