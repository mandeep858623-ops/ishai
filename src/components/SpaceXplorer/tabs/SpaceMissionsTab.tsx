import React, { useState } from 'react';
import { SPACE_MISSIONS_DATA } from '../utils/spaceData';
import { SpaceMission, SavedCollectionItem } from '../types';
import { Rocket, Bookmark, CheckCircle2, Calendar, Shield } from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

interface SpaceMissionsTabProps {
  onSaveToCollection: (item: SavedCollectionItem) => void;
}

export const SpaceMissionsTab: React.FC<SpaceMissionsTabProps> = ({
  onSaveToCollection
}) => {
  const [selectedMission, setSelectedMission] = useState<SpaceMission>(SPACE_MISSIONS_DATA[0]);

  const handleSave = () => {
    soundEngine.playSuccess();
    onSaveToCollection({
      id: `mission_${selectedMission.id}`,
      type: 'mission',
      title: selectedMission.name,
      subtitle: `${selectedMission.agency} • Launched ${selectedMission.launchDate}`,
      savedAt: new Date().toLocaleDateString(),
      data: selectedMission
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="bg-[#090d16] border border-cyan-900/40 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-extrabold text-white">Space Missions Explorer & Planetary Probes</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Missions Selection List */}
        <div className="bg-[#090d16] border border-cyan-900/40 rounded-3xl p-4 space-y-2 max-h-[580px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-900">
          <span className="text-[10px] font-bold text-cyan-400/60 uppercase px-2 block">Historic & Active Missions ({SPACE_MISSIONS_DATA.length})</span>
          {SPACE_MISSIONS_DATA.map((m) => (
            <div
              key={m.id}
              onClick={() => {
                setSelectedMission(m);
                soundEngine.playClick();
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                selectedMission.id === m.id
                  ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg'
                  : 'bg-black/40 border-cyan-900/30 text-cyan-200/80 hover:bg-amber-950/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white">{m.name}</h3>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                  m.status === 'Active' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                }`}>
                  {m.status}
                </span>
              </div>
              <p className="text-[10px] text-amber-300/80">{m.agency} • {m.type}</p>
            </div>
          ))}
        </div>

        {/* Selected Mission Detail Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#090d16] border border-cyan-900/40 rounded-3xl p-6 space-y-6">
            
            <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-amber-500/40 bg-black">
              <img src={selectedMission.imageUrl} alt={selectedMission.name} className="w-full h-full object-cover opacity-85" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-6 flex flex-col justify-end">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-800">
                      {selectedMission.agency} • {selectedMission.type}
                    </span>
                    <h2 className="text-2xl font-extrabold text-white mt-1">{selectedMission.name}</h2>
                  </div>
                  <button
                    onClick={handleSave}
                    className="p-3 rounded-2xl bg-black/60 border border-amber-500/40 text-amber-300 hover:text-white backdrop-blur-md"
                    title="Save Mission"
                  >
                    <Bookmark className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Mission Objectives</h4>
              <p className="text-xs text-cyan-100/80 leading-relaxed font-sans bg-black/40 border border-cyan-900/30 p-4 rounded-2xl">
                {selectedMission.objectives}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Key Achievements & Milestones</h4>
              <ul className="space-y-2 text-xs text-cyan-100/80">
                {selectedMission.keyAchievements.map((ach, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-black/40 border border-cyan-900/30 p-3 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{ach}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
