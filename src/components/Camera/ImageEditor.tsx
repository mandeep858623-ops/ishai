import React, { useState } from 'react';
import { Sliders, Check, X, RotateCcw, Sun, Contrast, Moon, Ghost } from 'lucide-react';
import { CameraPhoto } from '../../services/CameraService';

interface ImageEditorProps {
  photo: CameraPhoto;
  onSave: (updates: Partial<CameraPhoto>) => void;
  onClose: () => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ photo, onSave, onClose }) => {
  const [filters, setFilters] = useState(photo.filters || {
    brightness: 100,
    contrast: 100,
    grayscale: false,
    sepia: false,
    hueRotate: 0
  });

  const handleSave = () => {
    onSave({ filters });
    onClose();
  };

  const resetFilters = () => {
    setFilters({
      brightness: 100,
      contrast: 100,
      grayscale: false,
      sepia: false,
      hueRotate: 0
    });
  };

  const filterStyle = {
    filter: `
      brightness(${filters.brightness}%) 
      contrast(${filters.contrast}%) 
      grayscale(${filters.grayscale ? 100 : 0}%) 
      sepia(${filters.sepia ? 100 : 0}%) 
      hue-rotate(${filters.hueRotate}deg)
    `
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-3xl flex flex-col items-center py-8 sm:py-12 px-4 overflow-y-auto">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        {/* Preview Area */}
        <div className="relative aspect-video bg-zinc-900 rounded-3xl overflow-hidden border-4 border-emerald-500/20 shadow-2xl">
          <img 
            src={photo.url} 
            style={filterStyle} 
            className="w-full h-full object-contain" 
            alt="Preview" 
          />
        </div>

        {/* Controls */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                  <div className="flex items-center gap-2"><Sun className="w-3 h-3" /> Brightness</div>
                  <span>{filters.brightness}%</span>
                </div>
                <input 
                  type="range" min="0" max="200" 
                  value={filters.brightness} 
                  onChange={(e) => setFilters({...filters, brightness: parseInt(e.target.value)})}
                  className="w-full accent-emerald-500 bg-emerald-950 h-1 rounded-full appearance-none cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                  <div className="flex items-center gap-2"><Contrast className="w-3 h-3" /> Contrast</div>
                  <span>{filters.contrast}%</span>
                </div>
                <input 
                  type="range" min="0" max="200" 
                  value={filters.contrast} 
                  onChange={(e) => setFilters({...filters, contrast: parseInt(e.target.value)})}
                  className="w-full accent-emerald-500 bg-emerald-950 h-1 rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center content-start">
               <button 
                 onClick={() => setFilters({...filters, grayscale: !filters.grayscale})}
                 className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${filters.grayscale ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-black text-emerald-500 border-emerald-500/20 hover:border-emerald-500/50'}`}
               >
                 GRAYSCALE
               </button>
               <button 
                 onClick={() => setFilters({...filters, sepia: !filters.sepia})}
                 className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${filters.sepia ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-black text-emerald-500 border-emerald-500/20 hover:border-emerald-500/50'}`}
               >
                 SEPIA
               </button>
               <button 
                 onClick={() => setFilters({...filters, brightness: 110, contrast: 120})}
                 className="px-4 py-2 rounded-xl text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-2"
               >
                 <Sliders className="w-3 h-3" /> AUTO ENHANCE
               </button>
               <button 
                 onClick={resetFilters}
                 className="px-4 py-2 rounded-xl text-[10px] font-black bg-zinc-800 text-white hover:bg-zinc-700 transition-all flex items-center gap-2"
               >
                 <RotateCcw className="w-3 h-3" /> RESET
               </button>
            </div>
          </div>

          <div className="flex gap-4">
             <button 
               onClick={onClose}
               className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-2"
             >
               <X className="w-5 h-5" /> CANCEL
             </button>
             <button 
               onClick={handleSave}
               className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl font-black transition-all active:scale-95 shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2"
             >
               <Check className="w-5 h-5" /> APPLY CHANGES
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
