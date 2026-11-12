import React, { useState } from 'react';
import {
  GeneratedStudioImage,
} from './types';
import {
  Download,
  Trash2,
  Layers,
  Edit,
  ExternalLink,
  FolderOpen,
  Filter,
  Eye,
} from 'lucide-react';
import { soundEngine } from '../../utils/audio';

interface MyCreationsTabProps {
  creations: GeneratedStudioImage[];
  onOpenInDesignStudio: (imageUrl: string, prompt: string) => void;
  onSendToEditImage: (imageUrl: string) => void;
  onDeleteCreation: (id: string) => void;
}

export const MyCreationsTab: React.FC<MyCreationsTabProps> = ({
  creations,
  onOpenInDesignStudio,
  onSendToEditImage,
  onDeleteCreation,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [previewImage, setPreviewImage] = useState<GeneratedStudioImage | null>(null);

  const filtered = creations.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const handleDownload = (item: GeneratedStudioImage) => {
    soundEngine.playClick();
    const a = document.createElement('a');
    a.href = item.url;
    a.download = `SuperAI_Creation_${item.id}.png`;
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="flex flex-col gap-4 h-full font-mono text-emerald-400 overflow-y-auto pr-1">
      {/* Filter Header */}
      <div className="bg-[#05080f] border border-emerald-900/80 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-300">
            MY SAVED CREATIONS &amp; PROJECTS ({filtered.length})
          </span>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-1 text-[11px]">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'generated', label: 'Generated' },
            { id: 'edited', label: 'Edited' },
            { id: 'thumbnail', label: 'Thumbnails' },
            { id: 'poster', label: 'Posters' },
            { id: 'logo', label: 'Logos' },
            { id: 'wallpaper', label: 'Wallpapers' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => {
                soundEngine.playClick();
                setFilterType(f.id);
              }}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                filterType === f.id
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'bg-black/60 border border-emerald-950 text-emerald-400 hover:border-emerald-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Creations Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-[#05080f] border border-emerald-950 hover:border-emerald-700/80 rounded-lg overflow-hidden flex flex-col shadow-lg transition-all group"
            >
              <div
                onClick={() => setPreviewImage(item)}
                className="relative bg-black aspect-video flex items-center justify-center overflow-hidden cursor-pointer"
              >
                <img
                  src={item.url}
                  alt={item.prompt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute top-1.5 left-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-bold text-emerald-400 border border-emerald-900">
                  {item.type || 'creation'}
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Eye className="w-6 h-6 text-emerald-300" />
                </div>
              </div>

              <div className="p-2.5 flex-1 flex flex-col justify-between gap-2 bg-[#080d17]">
                <div>
                  <p className="text-[11px] text-white line-clamp-2 leading-relaxed font-sans">
                    {item.prompt}
                  </p>
                  <span className="text-[9px] text-emerald-600 block mt-1">
                    {item.timestamp} • {item.aspectRatio}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1 pt-2 border-t border-emerald-950 text-[10px]">
                  <button
                    onClick={() => handleDownload(item)}
                    className="p-1.5 bg-black/60 hover:bg-emerald-950 border border-emerald-900 rounded text-emerald-300 flex items-center justify-center"
                    title="Download File"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onOpenInDesignStudio(item.url, item.prompt)}
                    className="p-1.5 bg-cyan-950/40 hover:bg-cyan-900 border border-cyan-800 rounded text-cyan-300 flex items-center justify-center"
                    title="Open in Design Studio Canvas"
                  >
                    <Layers className="w-3 h-3 text-cyan-400" />
                  </button>
                  <button
                    onClick={() => onSendToEditImage(item.url)}
                    className="p-1.5 bg-purple-950/40 hover:bg-purple-900 border border-purple-800 rounded text-purple-300 flex items-center justify-center"
                    title="Send to Edit Image"
                  >
                    <Edit className="w-3 h-3 text-purple-400" />
                  </button>
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      onDeleteCreation(item.id);
                    }}
                    className="p-1.5 bg-red-950/40 hover:bg-red-900 border border-red-900 rounded text-red-400 flex items-center justify-center"
                    title="Delete Creation"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#05080f] border border-dashed border-emerald-950 rounded-lg p-8 text-center text-emerald-700 space-y-2">
          <FolderOpen className="w-12 h-12 opacity-50 text-emerald-600" />
          <h3 className="text-sm font-bold text-emerald-400">No creations in this category yet</h3>
          <p className="text-xs text-emerald-600 max-w-sm">
            Generate or edit an image, or create a design project, and it will be stored here automatically.
          </p>
        </div>
      )}

      {/* Full Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#090d14] border border-emerald-600 rounded-lg max-w-3xl w-full p-4 space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
              <span className="text-xs font-bold text-emerald-300 truncate">
                {previewImage.prompt}
              </span>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-emerald-500 hover:text-emerald-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[65vh] flex items-center justify-center bg-black rounded overflow-hidden">
              <img
                src={previewImage.url}
                alt={previewImage.prompt}
                className="max-h-[65vh] max-w-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-emerald-950 text-xs">
              <span className="text-[10px] text-emerald-600">
                Created: {previewImage.timestamp} • Aspect: {previewImage.aspectRatio}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onOpenInDesignStudio(previewImage.url, previewImage.prompt);
                    setPreviewImage(null);
                  }}
                  className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 px-3 py-1 rounded"
                >
                  Edit in Canvas
                </button>
                <button
                  onClick={() => handleDownload(previewImage)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-3 py-1 rounded"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
