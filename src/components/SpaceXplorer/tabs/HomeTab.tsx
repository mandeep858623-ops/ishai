import React, { useState, useEffect } from 'react';
import { SpaceXTab, SavedCollectionItem } from '../types';
import { PLANETS_DATA, ASTRONOMICAL_EVENTS_DATA, DEEP_SPACE_DATA, SATELLITES_DATA } from '../utils/spaceData';
import { calculateSatellitePosition, getMoonPhaseInfo } from '../utils/astronomyEngine';
import { Sparkles, Globe, Eye, ArrowRight, Satellite, Search, Bookmark, Compass, Clock, Star, Calendar } from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

interface HomeTabProps {
  onSelectTab: (tab: SpaceXTab, param?: string) => void;
  onSelectObject: (type: 'planet' | 'constellation' | 'satellite' | 'deepspace', id: string) => void;
  onOpenAiGuide: (question?: string) => void;
  onSaveToCollection: (item: SavedCollectionItem) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  onSelectTab,
  onSelectObject,
  onOpenAiGuide,
  onSaveToCollection
}) => {
  const [localTime, setLocalTime] = useState('');
  const [utcTime, setUtcTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [issPos, setIssPos] = useState({ lat: 0, lon: 0, altKm: 420 });
  const moonInfo = getMoonPhaseInfo();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setLocalTime(now.toLocaleTimeString());
      setUtcTime(now.toISOString().substring(11, 19) + ' UTC');
      const iss = SATELLITES_DATA.find(s => s.id === 'iss');
      if (iss) {
        setIssPos(calculateSatellitePosition(iss, now));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const searchResults = searchQuery.trim() ? [
    ...PLANETS_DATA.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => ({ type: 'planet' as const, id: p.id, title: p.name, desc: p.tagline })),
    ...DEEP_SPACE_DATA.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.catalogId.toLowerCase().includes(searchQuery.toLowerCase())).map(d => ({ type: 'deepspace' as const, id: d.id, title: d.name, desc: d.type })),
    ...SATELLITES_DATA.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(s => ({ type: 'satellite' as const, id: s.id, title: s.name, desc: s.type }))
  ] : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner & Universal Search Bar */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-950/80 via-purple-950/40 to-black border border-cyan-500/30 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Astronomical Command Center
              </span>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400/80 bg-black/40 px-3 py-1 rounded-full border border-cyan-900/50">
                <Clock className="w-3.5 h-3.5" />
                <span>Local: {localTime || '--:--'}</span>
                <span className="opacity-40">|</span>
                <span>{utcTime || '--:--'}</span>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Explore the Universe in Real-Time
            </h1>
            <p className="text-xs md:text-sm text-cyan-100/70 leading-relaxed">
              Interactive 3D Solar System, Live Planetarium Night Sky, Orbital Satellite Tracking, Lunar Phases, and Deep Space Exploration powered by NASA data & Gemini AI.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => { soundEngine.playClick(); onSelectTab('skymap'); }}
              className="px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs tracking-wider transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4" /> Live Sky Map
            </button>
            <button
              onClick={() => { soundEngine.playClick(); onSelectTab('solarsystem'); }}
              className="px-5 py-3 rounded-2xl bg-indigo-600/80 hover:bg-indigo-500 text-white font-extrabold text-xs tracking-wider transition-all border border-indigo-400/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Globe className="w-4 h-4 text-cyan-300" /> 3D Solar System
            </button>
            <button
              onClick={() => { soundEngine.playClick(); onOpenAiGuide(); }}
              className="px-5 py-3 rounded-2xl bg-purple-600/40 hover:bg-purple-500/60 text-purple-200 font-extrabold text-xs tracking-wider transition-all border border-purple-400/40 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-300" /> AI Space Guide
            </button>
          </div>
        </div>

        {/* Universal Space Search Input */}
        <div className="mt-8 relative max-w-2xl">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 absolute left-4 text-cyan-400/70" />
            <input
              type="text"
              placeholder="Search any planet, constellation, satellite (ISS, Hubble), or galaxy (Andromeda)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/60 border border-cyan-500/40 focus:border-cyan-400 text-sm text-cyan-100 placeholder:text-cyan-400/40 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none backdrop-blur-md transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 text-xs text-cyan-400 hover:text-white">Clear</button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0f1d] border border-cyan-500/40 rounded-2xl shadow-2xl z-30 p-2 space-y-1 max-h-72 overflow-y-auto">
              {searchResults.map((res, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setSearchQuery('');
                    if (res.type === 'planet') onSelectTab('planets', res.id);
                    else if (res.type === 'satellite') onSelectTab('satellites', res.id);
                    else if (res.type === 'deepspace') onSelectTab('deepspace', res.id);
                  }}
                  className="p-3 rounded-xl hover:bg-cyan-500/10 transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-cyan-300">{res.title}</div>
                    <div className="text-[10px] text-cyan-400/60">{res.desc}</div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                    {res.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid Section: Today's Visible Planets & Moon Phase */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Visible Planets */}
        <div className="lg:col-span-2 bg-[#090d16] border border-cyan-900/40 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-cyan-400" />
              Today's Visible Planets & Sky Targets
            </h2>
            <button onClick={() => onSelectTab('skymap')} className="text-xs text-cyan-400 hover:text-cyan-200 flex items-center gap-1 font-semibold">
              Sky Map View <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { planet: PLANETS_DATA[1], visibility: 'Morning Sky', constellation: 'Taurus' },
              { planet: PLANETS_DATA[2], visibility: 'Evening Star', constellation: 'Pisces' },
              { planet: PLANETS_DATA[4], visibility: 'High Overhead', constellation: 'Aries' },
              { planet: PLANETS_DATA[5], visibility: 'All Night', constellation: 'Taurus' }
            ].map((item, idx) => (
              <div 
                key={idx}
                onClick={() => onSelectTab('planets', item.planet.id)}
                className="bg-black/40 border border-cyan-900/30 hover:border-cyan-500/40 rounded-2xl p-3.5 transition-all hover:scale-[1.02] cursor-pointer space-y-2"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-extrabold shadow-md" style={{ background: item.planet.texturePattern }}>
                  {item.planet.name[0]}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">{item.planet.name}</h3>
                  <span className="inline-block text-[9px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 mt-1">
                    {item.visibility}
                  </span>
                  <p className="text-[10px] text-cyan-400/60 mt-1">In {item.constellation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Moon Phase & ISS Mini Tracker */}
        <div className="space-y-6">
          {/* Moon Phase Box */}
          <div 
            onClick={() => onSelectTab('moon')}
            className="bg-[#090d16] border border-cyan-900/40 hover:border-cyan-500/40 rounded-3xl p-5 cursor-pointer transition-all space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400" /> Lunar Phase Today
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono">
                {moonInfo.illuminationPercentage}% Illum
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-slate-800 via-slate-500 to-slate-200 border-2 border-cyan-400/30 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-2xl">🌔</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300">{moonInfo.phaseName}</h3>
                <p className="text-xs text-cyan-400/70">Moon Age: {moonInfo.ageDays} days</p>
                <p className="text-[10px] text-zinc-500 mt-1">Next Full Moon: {moonInfo.nextFullMoonDate}</p>
              </div>
            </div>
          </div>

          {/* Live ISS Orbital Position Card */}
          <div 
            onClick={() => onSelectTab('iss')}
            className="bg-gradient-to-r from-cyan-950/40 to-indigo-950/40 border border-cyan-500/30 hover:border-cyan-400 rounded-3xl p-5 cursor-pointer transition-all space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Satellite className="w-4 h-4 text-cyan-400 animate-pulse" /> ISS Live Orbit
              </span>
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                ACTIVE
              </span>
            </div>
            <div className="space-y-1 font-mono text-xs text-cyan-200">
              <p className="flex justify-between"><span>Latitude:</span> <strong className="text-white">{issPos.lat}°</strong></p>
              <p className="flex justify-between"><span>Longitude:</span> <strong className="text-white">{issPos.lon}°</strong></p>
              <p className="flex justify-between"><span>Altitude:</span> <strong className="text-white">{issPos.altKm} km</strong></p>
            </div>
            <p className="text-[10px] text-cyan-400/60 pt-1 group-hover:text-cyan-300 flex items-center gap-1">
              Click to open ISS Satellite Command Center <ArrowRight className="w-3 h-3" />
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming Astronomical Events */}
      <div className="bg-[#090d16] border border-cyan-900/40 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            Upcoming Astronomical Events & Phenomena
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ASTRONOMICAL_EVENTS_DATA.map((evt) => (
            <div key={evt.id} className="bg-black/50 border border-cyan-900/30 rounded-2xl p-4 space-y-2 hover:border-cyan-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60">
                  {evt.type}
                </span>
                <span className="text-[10px] text-cyan-400/80 font-mono">{evt.date}</span>
              </div>
              <h3 className="text-sm font-bold text-white">{evt.title}</h3>
              <p className="text-xs text-cyan-100/70 leading-relaxed line-clamp-2">{evt.description}</p>
              <div className="pt-2 border-t border-cyan-900/30 text-[10px] text-cyan-400/60">
                <strong>Viewing:</strong> {evt.viewingTips}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Deep Space Discoveries */}
      <div className="bg-[#090d16] border border-cyan-900/40 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Deep Space Highlights & Galaxies
          </h2>
          <button onClick={() => onSelectTab('deepspace')} className="text-xs text-cyan-400 hover:text-cyan-200 flex items-center gap-1 font-semibold">
            Explore All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {DEEP_SPACE_DATA.slice(0, 3).map((obj) => (
            <div 
              key={obj.id} 
              onClick={() => onSelectTab('deepspace', obj.id)}
              className="group relative rounded-2xl overflow-hidden border border-cyan-900/30 hover:border-cyan-500/50 cursor-pointer aspect-video bg-black"
            >
              <img src={obj.imageUrl} alt={obj.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-4 flex flex-col justify-end">
                <span className="text-[9px] font-bold text-cyan-300 uppercase">{obj.type} • {obj.constellation}</span>
                <h3 className="text-sm font-extrabold text-white group-hover:text-cyan-200">{obj.name}</h3>
                <p className="text-[10px] text-zinc-400">{obj.distanceLightYears.toLocaleString()} Light Years away</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
