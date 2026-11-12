import React, { useState } from 'react';
import { CONSTELLATIONS_DATA } from '../utils/spaceData';
import { ConstellationData, SpaceXTab, SavedCollectionItem } from '../types';
import { Star, Compass, Bookmark, Search, BookOpen, Sun, Sparkles, ArrowRight } from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

interface ConstellationsTabProps {
  onSelectTab: (tab: SpaceXTab, param?: string) => void;
  onSaveToCollection: (item: SavedCollectionItem) => void;
}

export const ConstellationsTab: React.FC<ConstellationsTabProps> = ({
  onSelectTab,
  onSaveToCollection
}) => {
  const [selectedConstellation, setSelectedConstellation] = useState<ConstellationData>(CONSTELLATIONS_DATA[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredList = CONSTELLATIONS_DATA.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.englishName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = () => {
    soundEngine.playSuccess();
    onSaveToCollection({
      id: `constellation_${selectedConstellation.id}`,
      type: 'constellation',
      title: selectedConstellation.name,
      subtitle: selectedConstellation.englishName,
      savedAt: new Date().toLocaleDateString(),
      data: selectedConstellation
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Bar with Search */}
      <div className="bg-[#090d16] border border-cyan-900/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-extrabold text-white">Constellation Explorer & Star Lore</h2>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-cyan-400/60" />
          <input
            type="text"
            placeholder="Search constellation name (e.g. Orion, Ursa Major)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/60 border border-cyan-900/60 focus:border-cyan-400 text-xs text-cyan-200 placeholder:text-cyan-400/40 rounded-xl pl-9 pr-3 py-2 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Constellations List Sidebar */}
        <div className="bg-[#090d16] border border-cyan-900/40 rounded-3xl p-4 space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-900">
          <span className="text-[10px] font-bold text-cyan-400/60 uppercase px-2 block">Available Constellations ({filteredList.length})</span>
          {filteredList.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                setSelectedConstellation(c);
                soundEngine.playClick();
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                selectedConstellation.id === c.id
                  ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-lg'
                  : 'bg-black/40 border-cyan-900/30 text-cyan-200/80 hover:bg-cyan-950/40 hover:border-cyan-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{c.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
                  {c.bestViewingSeason}
                </span>
              </div>
              <p className="text-[11px] text-cyan-400/70">{c.englishName} • {c.symbolism}</p>
            </div>
          ))}
        </div>

        {/* Selected Constellation Main Details Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#090d16] border border-cyan-900/40 rounded-3xl p-6 space-y-6">
            
            <div className="flex items-start justify-between border-b border-cyan-900/40 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-800">
                  {selectedConstellation.hemisphere} Hemisphere
                </span>
                <h2 className="text-2xl font-extrabold text-white mt-2">{selectedConstellation.name} ({selectedConstellation.latinName})</h2>
                <p className="text-xs text-cyan-300/80 italic mt-0.5">{selectedConstellation.englishName} — {selectedConstellation.symbolism}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectTab('skymap')}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Compass className="w-4 h-4" /> Locate in Sky Map
                </button>
                <button
                  onClick={handleSave}
                  className="p-2 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-300 hover:text-white"
                  title="Save to Collection"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mythology & History */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" /> Mythology & Sky Lore
              </h4>
              <p className="text-xs text-cyan-100/80 leading-relaxed font-sans bg-black/40 border border-cyan-900/30 p-4 rounded-2xl">
                {selectedConstellation.mythology}
              </p>
            </div>

            {/* Brightest Stars Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" /> Key Member Stars
              </h4>
              <div className="space-y-2 font-mono text-xs">
                {selectedConstellation.stars.map((s, idx) => (
                  <div key={idx} className="bg-black/40 border border-cyan-900/30 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-white font-bold">{s.name}</span>
                      <span className="text-[10px] text-cyan-400/60 ml-2">({s.spectType})</span>
                    </div>
                    <div className="text-[10px] text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                      Mag {s.mag}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nearby Deep Space Objects */}
            {selectedConstellation.nearbyDeepSpaceObjects.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-cyan-900/40">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" /> Nearby Deep Space Galaxies & Nebulae
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedConstellation.nearbyDeepSpaceObjects.map((dso, idx) => (
                    <span key={idx} className="text-[10px] font-bold text-purple-300 bg-purple-950/60 border border-purple-800/60 px-3 py-1 rounded-lg">
                      {dso}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};
