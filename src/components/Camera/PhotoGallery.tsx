import React, { useState, useMemo } from 'react';
import { Trash2, Download, Sliders, Search, ArrowUpDown, ChevronLeft, ChevronRight, Maximize2, X, MoreVertical, FileImage, Calendar, BoxSelect, Trash, CheckSquare, Square, Play, Image as ImageIcon } from 'lucide-react';
import { CameraPhoto, CameraService } from '../../services/CameraService';
import { soundEngine } from '../../utils/audio';
import { ImageEditor } from './ImageEditor';

interface PhotoGalleryProps {
  photos: CameraPhoto[];
  loading: boolean;
  onPhotoDeleted: (id: string) => void;
  onPhotoUpdated: (id: string, updates: Partial<CameraPhoto>) => void;
  onLog: (msg: string, tag?: string) => void;
  onOpenCapture: () => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, loading, onPhotoDeleted, onPhotoUpdated, onLog, onOpenCapture }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [viewerPhoto, setViewerPhoto] = useState<CameraPhoto | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [editingPhoto, setEditingPhoto] = useState<CameraPhoto | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  const filteredPhotos = useMemo(() => {
    const uniqueMap = new Map<string, CameraPhoto>();
    photos.forEach((p: CameraPhoto) => {
      const stableId = p.id ? p.id.replace(/^(photo_)+/, 'photo_') : (p.url ? `photo_${p.url.replace(/[^a-zA-Z0-9_-]/g, '_')}` : `photo_${Date.now()}`);
      if (!uniqueMap.has(stableId)) {
        uniqueMap.set(stableId, { ...p, id: stableId });
      }
    });
    return Array.from(uniqueMap.values()).filter((p: CameraPhoto) => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOrder === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return a.name.localeCompare(b.name);
    });
  }, [photos, searchQuery, sortOrder]);

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPhotos(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getFilterStyle = (photo: CameraPhoto) => {
    if (!photo.filters) return {};
    const f = photo.filters;
    return {
      filter: `
        brightness(${f.brightness ?? 100}%) 
        contrast(${f.contrast ?? 100}%) 
        grayscale(${f.grayscale ? 100 : 0}%) 
        sepia(${f.sepia ? 100 : 0}%) 
        hue-rotate(${f.hueRotate ?? 0}deg)
      `
    };
  };

  const toggleSelectAll = () => {
    if (selectedPhotos.length === filteredPhotos.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(filteredPhotos.map(p => p.id!).filter(Boolean));
    }
  };

  const handleDelete = async (photo: CameraPhoto, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    try {
      soundEngine.playAlertBeep();
      if (viewerPhoto?.id === photo.id) {
        setViewerPhoto(null);
      }
      await CameraService.deletePhoto(photo);
      onPhotoDeleted(photo.id!);
      onLog(`✓ Photo "${photo.name}" deleted.`, "DATABASE");
    } catch (err: any) {
      onLog(`Deletion error: ${err.message}`, "ERROR");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPhotos.length === 0) return;
    
    soundEngine.playAlertBeep();
    const toDelete = [...selectedPhotos];
    setSelectedPhotos([]);

    let count = 0;
    for (const id of toDelete) {
      const photo = photos.find(p => p.id === id);
      if (photo) {
        try {
          await CameraService.deletePhoto(photo);
          onPhotoDeleted(id);
          count++;
        } catch (err) {
          console.error(err);
        }
      }
    }
    onLog(`Bulk deletion complete: ${count} photos purged.`, "DATABASE");
  };

  const handleDownload = (photo: CameraPhoto, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundEngine.playSuccess();
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = photo.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startRename = (photo: CameraPhoto, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(photo.id!);
    setTempName(photo.name);
  };

  const saveRename = async (id: string) => {
    if (!tempName.trim()) return;
    try {
      await CameraService.renamePhoto(id, tempName.trim());
      onPhotoUpdated(id, { name: tempName.trim() });
      if (viewerPhoto?.id === id) {
        setViewerPhoto({ ...viewerPhoto, name: tempName.trim() } as CameraPhoto);
      }
      setRenamingId(null);
      onLog(`Photo renamed to "${tempName.trim()}".`, "DATABASE");
    } catch (err: any) {
      onLog(`Rename failed: ${err.message}`, "ERROR");
    }
  };

  const handleUpdateFilters = async (id: string, updates: Partial<CameraPhoto>) => {
    try {
      await CameraService.updatePhoto(id, updates);
      onPhotoUpdated(id, updates);
      if (viewerPhoto?.id === id) {
        setViewerPhoto({ ...viewerPhoto, ...updates } as CameraPhoto);
      }
      onLog(`Filters updated for photo.`, "DATABASE");
    } catch (err: any) {
      onLog(`Update failed: ${err.message}`, "ERROR");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black/20">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-emerald-700 font-black tracking-widest text-xs uppercase">Indexing secure gallery...</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-black/20">
        <div className="w-24 h-24 rounded-3xl bg-emerald-950/30 border border-emerald-500/10 flex items-center justify-center mb-8">
           <ImageIcon className="w-12 h-12 text-emerald-900" />
        </div>
        <h3 className="text-2xl font-black text-white mb-2 tracking-tight">NO VISUAL RECORDS FOUND</h3>
        <p className="text-emerald-800 text-sm mb-10 max-w-xs font-bold leading-relaxed uppercase">
          Optical archive is currently empty. Initializing capture sequence recommended.
        </p>
        <button 
          onClick={onOpenCapture}
          className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl font-black transition-all active:scale-95 shadow-xl shadow-emerald-500/20 flex items-center gap-3"
        >
          <Play className="w-5 h-5 fill-current" />
          START CAPTURE
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
      {/* Gallery Controls */}
      <div className="p-4 bg-black/40 border-b border-emerald-500/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-64">
           <Search className="absolute left-3 top-2.5 w-4 h-4 text-emerald-700" />
           <input 
             type="text" 
             placeholder="Search archive..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full bg-black border border-emerald-900/50 rounded-xl py-2 pl-10 pr-4 text-xs text-emerald-300 focus:outline-none focus:border-emerald-500 transition-colors"
           />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
           <select 
             value={sortOrder}
             onChange={(e) => setSortOrder(e.target.value as any)}
             className="bg-black border border-emerald-900/50 rounded-xl px-4 py-2 text-[10px] font-black text-emerald-500 focus:outline-none uppercase tracking-widest cursor-pointer"
           >
             <option value="newest">Newest First</option>
             <option value="oldest">Oldest First</option>
             <option value="name">By Filename</option>
           </select>

           {filteredPhotos.length > 0 && (
             <button
               onClick={toggleSelectAll}
               className="flex items-center gap-1.5 px-3 py-2 bg-black border border-emerald-900/50 rounded-xl text-[10px] font-black text-emerald-400 hover:border-emerald-500 transition-colors uppercase tracking-widest cursor-pointer"
             >
               {selectedPhotos.length === filteredPhotos.length ? 'Deselect All' : 'Select All'}
             </button>
           )}

           {selectedPhotos.length > 0 && (
             <button 
               onClick={handleBulkDelete}
               className="flex items-center gap-2 px-4 py-2 bg-red-900/30 text-red-400 border border-red-500/40 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all cursor-pointer shadow-md"
             >
               <Trash className="w-3.5 h-3.5" />
               Delete ({selectedPhotos.length})
             </button>
           )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-thin scrollbar-thumb-emerald-900">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {filteredPhotos.map((photo, index) => {
            const isSelected = selectedPhotos.includes(photo.id!);
            return (
              <div 
                key={photo.id}
                onClick={() => setViewerPhoto(photo)}
                className={`group relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
                  isSelected ? 'border-emerald-500 ring-4 ring-emerald-500/20 scale-95 shadow-2xl shadow-emerald-500/40' : 'border-emerald-500/10 hover:border-emerald-500/40 hover:scale-[1.02]'
                }`}
              >
                <img 
                  src={photo.url} 
                  style={getFilterStyle(photo)}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  alt={photo.name} 
                  loading="lazy"
                />
                
                {/* Selection Overlay */}
                <button 
                  onClick={(e) => toggleSelect(photo.id!, e)}
                  title={isSelected ? 'Deselect' : 'Select'}
                  className={`absolute top-2 left-2 p-1.5 rounded-lg transition-all z-20 cursor-pointer ${
                    isSelected ? 'bg-emerald-500 text-black' : 'bg-black/60 text-emerald-400 opacity-70 hover:opacity-100 hover:bg-black/80'
                  }`}
                >
                  {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                </button>

                {/* Direct 1-Click Delete Button (Always Visible) */}
                <button 
                  onClick={(e) => handleDelete(photo, e)}
                  title="Delete Photo"
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/80 hover:bg-red-600 border border-red-500/50 text-red-400 hover:text-white transition-all shadow-md active:scale-90 z-20 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Info Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                  {renamingId === photo.id ? (
                    <input 
                      autoFocus
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onBlur={() => saveRename(photo.id!)}
                      onKeyDown={(e) => e.key === 'Enter' && saveRename(photo.id!)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-emerald-500 text-black text-[10px] font-black px-1 rounded mb-1 focus:outline-none"
                    />
                  ) : (
                    <p 
                      onClick={(e) => startRename(photo, e)}
                      className="text-[10px] font-black text-white truncate mb-1 uppercase italic tracking-tighter hover:text-emerald-400"
                    >
                      {photo.name}
                    </p>
                  )}
                  <p className="text-[9px] text-emerald-600 font-bold mb-3">
                    {new Date(photo.createdAt).toLocaleDateString()}
                  </p>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => handleDownload(photo, e)}
                      className="p-2 bg-emerald-500 text-black rounded-lg hover:bg-emerald-400 transition-colors"
                      title="Download"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPhoto(photo);
                      }}
                      className="p-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
                      title="Edit Filters"
                    >
                      <Sliders className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(photo, e)}
                      className="p-2 bg-red-900 text-red-100 rounded-lg hover:bg-red-800 transition-colors ml-auto"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredPhotos.length === 0 && searchQuery && (
          <div className="py-20 text-center uppercase">
            <p className="text-emerald-900 font-black text-lg">No matches for index filter: "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Fullscreen Viewer */}
      {viewerPhoto && (
        <div className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-2xl flex flex-col animate-in fade-in duration-300">
          <header className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex flex-col">
              <span className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.2em] mb-1">Optical Review Mode</span>
              <h3 className="text-sm font-bold text-white uppercase italic tracking-tight">{viewerPhoto.name}</h3>
            </div>
            <button 
              onClick={() => setViewerPhoto(null)}
              className="p-3 bg-white/5 hover:bg-red-500 hover:text-white rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </header>

          <div className="flex-1 relative flex items-center justify-center p-4">
             <img 
               src={viewerPhoto.url} 
               style={getFilterStyle(viewerPhoto)}
               className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-500" 
               alt="Preview" 
             />
             
             {/* Navigation Arrows */}
             <button 
               onClick={() => {
                 const idx = photos.findIndex(p => p.id === viewerPhoto.id);
                 if (idx > 0) setViewerPhoto(photos[idx - 1]);
               }}
               className="absolute left-8 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all disabled:opacity-20"
               disabled={photos.findIndex(p => p.id === viewerPhoto.id) === 0}
             >
               <ChevronLeft className="w-8 h-8" />
             </button>
             <button 
               onClick={() => {
                 const idx = photos.findIndex(p => p.id === viewerPhoto.id);
                 if (idx < photos.length - 1) setViewerPhoto(photos[idx + 1]);
               }}
               className="absolute right-8 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all disabled:opacity-20"
               disabled={photos.findIndex(p => p.id === viewerPhoto.id) === photos.length - 1}
             >
               <ChevronRight className="w-8 h-8" />
             </button>
          </div>

          <footer className="p-8 bg-black/40 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-8">
             <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                   <Calendar className="w-3 h-3" /> CAPTURED
                </span>
                <span className="text-xs text-white font-bold">{new Date(viewerPhoto.createdAt).toLocaleString()}</span>
             </div>
             <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                   <BoxSelect className="w-3 h-3" /> RESOLUTION
                </span>
                <span className="text-xs text-white font-bold">{viewerPhoto.width || '?'} x {viewerPhoto.height || '?'}</span>
             </div>
             <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                   <FileImage className="w-3 h-3" /> TYPE / SIZE
                </span>
                <span className="text-xs text-white font-bold">{viewerPhoto.type?.split('/')[1]?.toUpperCase() || 'JPG'} / {(viewerPhoto.size ? (viewerPhoto.size / 1024).toFixed(1) : '?')} KB</span>
             </div>
             <div className="flex items-center justify-end gap-3 col-span-2 sm:col-span-1">
                <button 
                  onClick={() => setEditingPhoto(viewerPhoto)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-black text-xs transition-all active:scale-95 border border-white/10"
                >
                  <Sliders className="w-4 h-4" />
                  EDIT
                </button>
                <button 
                  onClick={() => handleDownload(viewerPhoto)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-black text-xs transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  <Download className="w-4 h-4" />
                  EXPORT
                </button>
                <button 
                  onClick={() => handleDelete(viewerPhoto)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-900/60 border border-red-500 text-red-200 rounded-xl font-black text-xs hover:bg-red-600 hover:text-white transition-all active:scale-95 cursor-pointer shadow-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  DELETE
                </button>
             </div>
          </footer>
        </div>
      )}
      {/* Image Editor Modal */}
      {editingPhoto && (
        <ImageEditor 
          photo={editingPhoto} 
          onSave={(updates) => handleUpdateFilters(editingPhoto.id!, updates)}
          onClose={() => setEditingPhoto(null)}
        />
      )}
    </div>
  );
};
