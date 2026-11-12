import React, { useState, useEffect } from 'react';
import { 
  X, 
  Camera as CameraIcon, 
  Image as ImageIcon, 
  LayoutGrid, 
  ArrowRight,
  Database,
  Brain,
  Sparkles
} from 'lucide-react';
import { CameraService, CameraPhoto } from '../../services/CameraService';
import { CameraLive } from './CameraLive';
import { PhotoGallery } from './PhotoGallery';
import { soundEngine } from '../../utils/audio';
import { UserProfile } from '../../../server/authService';

interface CameraModalProps {
  onClose: () => void;
  onLog: (msg: string, tag?: string) => void;
  currentUser?: UserProfile | null;
  onOpenVault?: () => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ 
  onClose, 
  onLog, 
  currentUser,
  onOpenVault 
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'gallery'>('camera');
  const [photos, setPhotos] = useState<CameraPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhotos();

    // Listen to vault updates to keep gallery in sync
    const handleVaultUpdate = () => {
      loadPhotos();
    };

    window.addEventListener('vault_updated', handleVaultUpdate);
    return () => {
      window.removeEventListener('vault_updated', handleVaultUpdate);
    };
  }, [currentUser?.uid]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const data = await CameraService.getPhotos(currentUser?.uid);
      setPhotos(data);
    } catch (err) {
      console.error(err);
      onLog("Failed to load photos.", "ERROR");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSaved = (newPhoto: CameraPhoto) => {
    setPhotos(prev => {
      const exists = prev.some(p => p.id === newPhoto.id);
      if (exists) return prev;
      return [newPhoto, ...prev];
    });
    onLog(`Photo "${newPhoto.name}" saved to AI Vault → Photos.`, "DATABASE");
  };

  const handlePhotoDeleted = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handlePhotoUpdated = (id: string, updates: Partial<CameraPhoto>) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  return (
    <div className="fixed inset-0 z-[70] bg-[#050505]/95 backdrop-blur-xl flex flex-col font-mono text-emerald-400 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-3 sm:p-4 border-b border-emerald-500/20 bg-black/60 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CameraIcon className="text-black w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tighter uppercase italic flex items-center gap-2">
              <span>SuperAI <span className="text-emerald-500">Camera</span></span>
              <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase not-italic">
                AUTO-SAVE TO VAULT
              </span>
            </h2>
            <p className="text-[9px] sm:text-[10px] text-emerald-700 font-bold tracking-widest uppercase">
              Optical Capture Unit • Directly Connected to AI Vault → Photos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Direct Link to AI Vault Photos */}
          {onOpenVault && (
            <button
              onClick={() => {
                soundEngine.playClick();
                onOpenVault();
              }}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)] cursor-pointer"
            >
              <Brain className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI VAULT → PHOTOS</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-black text-[9px] font-black">
                {photos.length}
              </span>
            </button>
          )}

          {/* Close button */}
          <button 
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-2 hover:bg-red-500 hover:text-white rounded-xl transition-all text-emerald-500/70 border border-transparent hover:border-red-400 cursor-pointer"
            title="Close Camera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Tabs Bar */}
      <nav className="flex items-center justify-center p-2 bg-black/40 gap-2 border-b border-emerald-500/10 shrink-0 z-30">
        <button
          onClick={() => {
            soundEngine.playClick();
            setActiveTab('camera');
          }}
          className={`flex items-center gap-2 px-6 sm:px-8 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            activeTab === 'camera' 
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 scale-102' 
              : 'text-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-950/30'
          }`}
        >
          <CameraIcon className="w-4 h-4" />
          <span>LIVE CAPTURE</span>
        </button>
        <button
          onClick={() => {
            soundEngine.playClick();
            setActiveTab('gallery');
          }}
          className={`flex items-center gap-2 px-6 sm:px-8 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            activeTab === 'gallery' 
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 scale-102' 
              : 'text-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-950/30'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>SAVED PHOTOS</span>
          {photos.length > 0 && (
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === 'gallery' ? 'bg-black text-emerald-400 font-extrabold' : 'bg-emerald-900/60 text-emerald-400'}`}>
              {photos.length}
            </span>
          )}
        </button>
      </nav>

      {/* Main View Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col z-10">
        {activeTab === 'camera' ? (
          <CameraLive 
            onPhotoSaved={handlePhotoSaved} 
            onLog={onLog} 
            currentUser={currentUser}
            onOpenGallery={() => setActiveTab('gallery')}
            onOpenVault={onOpenVault}
            recentPhotos={photos}
          />
        ) : (
          <PhotoGallery 
            photos={photos} 
            loading={loading} 
            onPhotoDeleted={handlePhotoDeleted}
            onPhotoUpdated={handlePhotoUpdated}
            onLog={onLog}
            onOpenCapture={() => setActiveTab('camera')}
          />
        )}
      </div>

      {/* Footer / Telemetry Status */}
      <footer className="p-2 border-t border-emerald-500/20 bg-black/60 flex justify-between items-center text-[9px] sm:text-[10px] font-bold text-emerald-700 tracking-widest uppercase shrink-0 z-30">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
             SUPERAI OPTICS v4.2
          </span>
          <span className="opacity-40">|</span>
          <span className="text-emerald-500/70">
            {photos.length} PHOTOS INDEXED IN VAULT
          </span>
        </div>
        <div className="flex items-center gap-2">
          {currentUser && (
            <span className="text-zinc-500">
              USER: {currentUser.fullName || currentUser.email}
            </span>
          )}
        </div>
      </footer>
    </div>
  );
};
