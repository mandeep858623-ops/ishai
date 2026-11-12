import React, { useState, useEffect } from 'react';
import { SpaceXTab, SavedCollectionItem } from './types';
import { HomeTab } from './tabs/HomeTab';
import { Globe3dTab } from './tabs/Globe3dTab';
import { SkyMapTab } from './tabs/SkyMapTab';
import { SolarSystemTab } from './tabs/SolarSystemTab';
import { PlanetsTab } from './tabs/PlanetsTab';
import { ConstellationsTab } from './tabs/ConstellationsTab';
import { SatelliteTrackerTab } from './tabs/SatelliteTrackerTab';
import { IssTrackerTab } from './tabs/IssTrackerTab';
import { MoonTab } from './tabs/MoonTab';
import { DeepSpaceTab } from './tabs/DeepSpaceTab';
import { SpaceMissionsTab } from './tabs/SpaceMissionsTab';
import { NasaCenterTab } from './tabs/NasaCenterTab';
import { MyCollectionTab } from './tabs/MyCollectionTab';
import { AiSpaceGuideModal } from './components/AiSpaceGuideModal';
import { 
  Rocket, X, Sparkles, Globe, Compass, Eye, Star, Satellite, Moon, 
  Bookmark, Shield, Info, Radio, Layers, MapPin
} from 'lucide-react';
import { soundEngine } from '../../utils/audio';

interface SpaceXplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  writeLog: (text: string, tag?: string) => void;
  initialTab?: SpaceXTab;
}

export const SpaceXplorerModal: React.FC<SpaceXplorerModalProps> = ({
  isOpen,
  onClose,
  userId,
  writeLog,
  initialTab = 'home'
}) => {
  const [activeTab, setActiveTab] = useState<SpaceXTab>(initialTab);
  const [selectedPlanetParam, setSelectedPlanetParam] = useState<string>('earth');
  const [selectedDeepSpaceParam, setSelectedDeepSpaceParam] = useState<string>('andromeda');
  const [showAiGuide, setShowAiGuide] = useState(false);
  const [aiGuideInitialQuestion, setAiGuideInitialQuestion] = useState<string>('');

  // Personal Collection Storage
  const [savedCollection, setSavedCollection] = useState<SavedCollectionItem[]>(() => {
    try {
      const saved = localStorage.getItem(`superai_space_collection_${userId || 'guest'}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(`superai_space_collection_${userId || 'guest'}`, JSON.stringify(savedCollection));
  }, [savedCollection, userId]);

  const handleSaveToCollection = (newItem: SavedCollectionItem) => {
    setSavedCollection(prev => {
      if (prev.some(i => i.id === newItem.id)) return prev;
      return [newItem, ...prev];
    });
    writeLog(`Saved ${newItem.title} to Space Collection`, 'SPACE');
  };

  const handleRemoveFromCollection = (id: string) => {
    setSavedCollection(prev => prev.filter(i => i.id !== id));
  };

  const handleSelectTab = (tab: SpaceXTab, param?: string) => {
    soundEngine.playClick();
    setActiveTab(tab);
    if (param) {
      if (tab === 'planets' || tab === 'globe3d') setSelectedPlanetParam(param);
      if (tab === 'deepspace') setSelectedDeepSpaceParam(param);
    }
  };

  const handleOpenAiGuideWithQuestion = (question?: string) => {
    if (question) setAiGuideInitialQuestion(question);
    else setAiGuideInitialQuestion('');
    setShowAiGuide(true);
    soundEngine.playClick();
  };

  if (!isOpen) return null;

  const navTabs: { id: SpaceXTab; label: string; icon: any }[] = [
    { id: 'home', label: 'Home', icon: Globe },
    { id: 'globe3d', label: '3D Globe Explorer', icon: MapPin },
    { id: 'skymap', label: 'Sky Map', icon: Compass },
    { id: 'solarsystem', label: '3D Solar System', icon: Layers },
    { id: 'planets', label: 'Planets', icon: Eye },
    { id: 'constellations', label: 'Constellations', icon: Star },
    { id: 'satellites', label: 'Satellites', icon: Satellite },
    { id: 'iss', label: 'ISS Live', icon: Radio },
    { id: 'moon', label: 'Moon', icon: Moon },
    { id: 'deepspace', label: 'Deep Space', icon: Sparkles },
    { id: 'missions', label: 'Missions', icon: Rocket },
    { id: 'nasa', label: 'NASA Center', icon: Shield },
    { id: 'collection', label: 'My Collection', icon: Bookmark },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-7xl h-[92vh] bg-[#050811] border border-cyan-500/40 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_60px_rgba(6,182,212,0.15)] font-sans">
        
        {/* Workspace Top Header */}
        <div className="px-5 py-4 bg-[#090e1a]/90 border-b border-cyan-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                SPACE XPLORER
                <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Google Earth 3D Planetary Explorer
                </span>
              </h2>
              <p className="text-[11px] text-cyan-400/60 font-mono">Interactive Planetary 3D Globes & Surface Navigation Platform</p>
            </div>
          </div>

          {/* AI Guide Trigger & Close */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenAiGuideWithQuestion()}
              className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
              <span>AI Space Guide</span>
            </button>

            <button
              onClick={onClose}
              className="p-2.5 bg-black/60 hover:bg-red-500/20 text-cyan-400 hover:text-red-400 rounded-xl transition-all border border-cyan-900/50 hover:border-red-500/30 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Nav Tabs */}
        <div className="px-4 py-2 bg-[#080c16] border-b border-cyan-900/40 flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25'
                    : 'text-cyan-300/70 hover:text-white hover:bg-cyan-950/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === 'collection' && savedCollection.length > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-black text-cyan-300' : 'bg-cyan-950 text-cyan-400 border border-cyan-800'}`}>
                    {savedCollection.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-cyan-900/40">
          {activeTab === 'home' && (
            <HomeTab
              onSelectTab={handleSelectTab}
              onSelectObject={(type, id) => {
                if (type === 'planet') handleSelectTab('globe3d', id);
                if (type === 'deepspace') handleSelectTab('deepspace', id);
                if (type === 'satellite') handleSelectTab('satellites', id);
              }}
              onOpenAiGuide={handleOpenAiGuideWithQuestion}
              onSaveToCollection={handleSaveToCollection}
            />
          )}

          {activeTab === 'globe3d' && (
            <Globe3dTab
              initialPlanetId={selectedPlanetParam}
              onOpenAiGuide={handleOpenAiGuideWithQuestion}
              onSaveToCollection={handleSaveToCollection}
            />
          )}

          {activeTab === 'skymap' && <SkyMapTab />}

          {activeTab === 'solarsystem' && (
            <SolarSystemTab
              onSelectPlanet={(id) => setSelectedPlanetParam(id)}
              onOpenPlanetTab={(id) => handleSelectTab('planets', id)}
            />
          )}

          {activeTab === 'planets' && (
            <PlanetsTab
              initialPlanetId={selectedPlanetParam}
              onSaveToCollection={handleSaveToCollection}
              onSelectTab={handleSelectTab}
            />
          )}

          {activeTab === 'constellations' && (
            <ConstellationsTab
              onSelectTab={handleSelectTab}
              onSaveToCollection={handleSaveToCollection}
            />
          )}

          {activeTab === 'satellites' && (
            <SatelliteTrackerTab onSaveToCollection={handleSaveToCollection} />
          )}

          {activeTab === 'iss' && <IssTrackerTab />}

          {activeTab === 'moon' && <MoonTab />}

          {activeTab === 'deepspace' && (
            <DeepSpaceTab
              initialObjectId={selectedDeepSpaceParam}
              onSaveToCollection={handleSaveToCollection}
            />
          )}

          {activeTab === 'missions' && (
            <SpaceMissionsTab onSaveToCollection={handleSaveToCollection} />
          )}

          {activeTab === 'nasa' && <NasaCenterTab />}

          {activeTab === 'collection' && (
            <MyCollectionTab
              userId={userId}
              savedItems={savedCollection}
              onRemoveItem={handleRemoveFromCollection}
              onSelectTab={handleSelectTab}
            />
          )}
        </div>

        {/* Embedded AI Space Guide Popup Modal */}
        <AiSpaceGuideModal
          isOpen={showAiGuide}
          onClose={() => setShowAiGuide(false)}
          initialQuestion={aiGuideInitialQuestion}
        />

      </div>
    </div>
  );
};
