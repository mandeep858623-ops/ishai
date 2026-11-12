import React, { useState } from 'react';
import { DEEP_SPACE_DATA } from '../utils/spaceData';
import { DeepSpaceObject, SavedCollectionItem } from '../types';
import { Sparkles, Bookmark, Search, ExternalLink, Globe, Compass } from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

interface DeepSpaceTabProps {
  initialObjectId?: string;
  onSaveToCollection: (item: SavedCollectionItem) => void;
}

export const DeepSpaceTab: React.FC<DeepSpaceTabProps> = ({
  initialObjectId = 'andromeda',
  onSaveToCollection
}) => {
  const [activeObj, setActiveObj] = useState<DeepSpaceObject>(
    DEEP_SPACE_DATA.find(d => d.id === initialObjectId) || DEEP_SPACE_DATA[0]
  );
  const [filterType, setFilterType] = useState<string>('all');

  const filteredObjects = filterType === 'all' 
    ? DEEP_SPACE_DATA 
    : DEEP_SPACE_DATA.filter(d => d.type.toLowerCase().includes(filterType.toLowerCase()));

  const handleSave = () => {
    soundEngine.playSuccess();
    onSaveToCollection({
      id: `deepspace_${activeObj.id}`,
      type: 'deepspace',
      title: activeObj.name,
      subtitle: `${activeObj.catalogId} • ${activeObj.type}`,
      savedAt: new Date().toLocaleDateString(),
      data: activeObj
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Bar */}
      <div className="bg-[#090d16] border border-cyan-900/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-extrabold text-white">Deep Space Explorer — Galaxies, Nebulae & Black Holes</h2>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {['all', 'galaxy', 'nebula', 'cluster'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                filterType === type 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'bg-black/50 border border-purple-900/50 text-purple-300 hover:bg-purple-950'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Deep Space Objects Catalog Sidebar */}
        <div className="bg-[#090d16] border border-cyan-900/40 rounded-3xl p-4 space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-900">
          <span className="text-[10px] font-bold text-cyan-400/60 uppercase px-2 block">Catalog Objects ({filteredObjects.length})</span>
          {filteredObjects.map((obj) => (
            <div
              key={obj.id}
              onClick={() => {
                setActiveObj(obj);
                soundEngine.playClick();
              }}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                activeObj.id === obj.id
                  ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg'
                  : 'bg-black/40 border-cyan-900/30 text-cyan-200/80 hover:bg-purple-950/30'
              }`}
            >
              <img src={obj.imageUrl} alt={obj.name} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-purple-500/30" />
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-white truncate">{obj.name}</h3>
                <p className="text-[10px] text-purple-300/80">{obj.catalogId} • {obj.type}</p>
                <p className="text-[9px] text-zinc-400">{obj.distanceLightYears.toLocaleString()} LY</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Deep Space Inspector View */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#090d16] border border-cyan-900/40 rounded-3xl p-6 space-y-6">
            
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-purple-500/40 bg-black group">
              <img src={activeObj.imageUrl} alt={activeObj.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent p-6 flex flex-col justify-end">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300 bg-purple-950 px-2.5 py-0.5 rounded-full border border-purple-800">
                      {activeObj.type}
                    </span>
                    <h2 className="text-2xl font-extrabold text-white mt-1">{activeObj.name} ({activeObj.catalogId})</h2>
                  </div>
                  <button
                    onClick={handleSave}
                    className="p-3 rounded-2xl bg-black/60 border border-purple-500/40 text-purple-300 hover:text-white backdrop-blur-md"
                    title="Save to Collection"
                  >
                    <Bookmark className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xs text-cyan-100/80 leading-relaxed font-sans bg-black/40 border border-cyan-900/30 p-4 rounded-2xl">
              {activeObj.description}
            </p>

            {/* Scientific Parameters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="bg-black/40 border border-cyan-900/30 p-3 rounded-2xl">
                <span className="text-[10px] text-cyan-400/60 block">Constellation</span>
                <strong className="text-white text-sm">{activeObj.constellation}</strong>
              </div>
              <div className="bg-black/40 border border-cyan-900/30 p-3 rounded-2xl">
                <span className="text-[10px] text-cyan-400/60 block">Distance</span>
                <strong className="text-white text-xs">{activeObj.distanceLightYears.toLocaleString()} Light Years</strong>
              </div>
              <div className="bg-black/40 border border-cyan-900/30 p-3 rounded-2xl">
                <span className="text-[10px] text-cyan-400/60 block">Right Ascension</span>
                <strong className="text-white text-xs">{activeObj.ra}</strong>
              </div>
              <div className="bg-black/40 border border-cyan-900/30 p-3 rounded-2xl">
                <span className="text-[10px] text-cyan-400/60 block">Declination</span>
                <strong className="text-white text-xs">{activeObj.dec}</strong>
              </div>
            </div>

            <p className="text-[10px] text-zinc-500">
              Image Credit: {activeObj.imageCredit}
            </p>

          </div>
        </div>

      </div>

    </div>
  );
};
