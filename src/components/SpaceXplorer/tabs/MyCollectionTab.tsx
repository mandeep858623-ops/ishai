import React, { useState, useEffect } from 'react';
import { SavedCollectionItem, SpaceXTab } from '../types';
import { Bookmark, Trash2, ArrowRight, Sparkles, FolderOpen } from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

interface MyCollectionTabProps {
  userId?: string;
  savedItems: SavedCollectionItem[];
  onRemoveItem: (id: string) => void;
  onSelectTab: (tab: SpaceXTab, param?: string) => void;
}

export const MyCollectionTab: React.FC<MyCollectionTabProps> = ({
  savedItems,
  onRemoveItem,
  onSelectTab
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="bg-[#090d16] border border-cyan-900/40 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-extrabold text-white">My Space Collection & Bookmarks</h2>
        </div>
        <span className="text-xs font-mono text-cyan-300 bg-cyan-950 px-3 py-1 rounded-lg border border-cyan-800">
          {savedItems.length} Saved Items
        </span>
      </div>

      {savedItems.length === 0 ? (
        <div className="bg-[#090d16] border border-cyan-900/40 rounded-3xl p-12 text-center space-y-4">
          <FolderOpen className="w-16 h-16 text-cyan-500/20 mx-auto" />
          <h3 className="text-lg font-bold text-white">Your Space Collection is Empty</h3>
          <p className="text-xs text-cyan-200/60 max-w-md mx-auto">
            You can bookmark planets, constellations, satellites, galaxies, and space missions from any tab to build your custom astronomy library!
          </p>
          <button
            onClick={() => onSelectTab('planets')}
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer"
          >
            Explore Planets & Space Objects
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedItems.map((item) => (
            <div key={item.id} className="bg-[#090d16] border border-cyan-900/40 hover:border-cyan-500/50 rounded-2xl p-4 space-y-3 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {item.type}
                  </span>
                  <button
                    onClick={() => { soundEngine.playClick(); onRemoveItem(item.id); }}
                    className="text-zinc-500 hover:text-red-400 p-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300">{item.title}</h3>
                <p className="text-xs text-cyan-200/70 mt-0.5">{item.subtitle}</p>
              </div>

              <div className="pt-3 border-t border-cyan-900/30 flex items-center justify-between text-[10px] text-zinc-500">
                <span>Saved {item.savedAt}</span>
                <button
                  onClick={() => {
                    if (item.type === 'planet') onSelectTab('planets', item.data?.id);
                    else if (item.type === 'constellation') onSelectTab('constellations', item.data?.id);
                    else if (item.type === 'satellite') onSelectTab('satellites', item.data?.id);
                    else if (item.type === 'deepspace') onSelectTab('deepspace', item.data?.id);
                    else if (item.type === 'mission') onSelectTab('missions', item.data?.id);
                  }}
                  className="text-cyan-400 hover:text-white font-bold flex items-center gap-1"
                >
                  View Details <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
