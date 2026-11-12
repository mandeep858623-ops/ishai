import React, { useState, useEffect } from 'react';
import { SlideData } from './types';
import { ThemeColors } from './themeConfig';
import { SlideCanvas } from './SlideCanvas';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Minimize, 
  X, 
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface SlideshowModalProps {
  slides: SlideData[];
  initialIndex?: number;
  theme: ThemeColors;
  onClose: () => void;
}

export const SlideshowModal: React.FC<SlideshowModalProps> = ({
  slides,
  initialIndex = 0,
  theme,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showNotes, setShowNotes] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key.toLowerCase() === 'n') {
        setShowNotes((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, onClose]);

  const currentSlide = slides[currentIndex] || slides[0];
  const progressPercent = ((currentIndex + 1) / slides.length) * 100;

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between font-mono text-xs select-none">
      {/* Top Floating Controls */}
      <div className="w-full bg-black/70 backdrop-blur-md p-3 flex items-center justify-between border-b border-zinc-900 z-10">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-bold">
            SLIDESHOW MODE
          </span>
          <span className="text-zinc-400 text-xs">
            Slide {currentIndex + 1} of {slides.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Notes toggle */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 font-bold transition-colors ${
              showNotes
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
            title="Toggle Speaker Notes (N)"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Notes</span>
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleBrowserFullscreen}
            className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Close / ESC */}
          <button
            onClick={onClose}
            className="p-1.5 rounded bg-red-950/70 border border-red-800 text-red-300 hover:bg-red-900 transition-colors"
            title="Exit Slideshow (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Slide Presentation Stage */}
      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Previous Arrow overlay */}
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="absolute left-4 z-20 p-3 rounded-full bg-black/60 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-emerald-950 hover:border-emerald-600 disabled:opacity-0 transition-all cursor-pointer shadow-2xl"
          title="Previous Slide (← / PageUp)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Scaled Presentation Canvas */}
        <div className="w-full max-w-5xl">
          <SlideCanvas
            slide={currentSlide}
            theme={theme}
            selectedElementId={null}
            onSelectElement={() => {}}
            onUpdateElement={() => {}}
            onDeleteElement={() => {}}
            zoom={100}
            readOnly={true}
          />
        </div>

        {/* Next Arrow overlay */}
        <button
          onClick={() => setCurrentIndex((prev) => Math.min(slides.length - 1, prev + 1))}
          disabled={currentIndex === slides.length - 1}
          className="absolute right-4 z-20 p-3 rounded-full bg-black/60 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-emerald-950 hover:border-emerald-600 disabled:opacity-0 transition-all cursor-pointer shadow-2xl"
          title="Next Slide (→ / Space / PageDown)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Optional Speaker Notes Overlay Panel */}
        {showNotes && currentSlide.speakerNotes && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-2xl w-full bg-black/90 border border-cyan-800/80 rounded-lg p-3 text-cyan-200 z-30 shadow-2xl backdrop-blur-md">
            <div className="text-[10px] text-cyan-400 font-bold mb-1 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              <span>PRESENTER SPEAKER NOTES</span>
            </div>
            <div className="text-xs leading-relaxed max-h-24 overflow-y-auto pr-1">
              {currentSlide.speakerNotes}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status & Progress Bar */}
      <div className="w-full bg-[#05080c] border-t border-zinc-900 p-2 flex flex-col gap-1.5 z-10">
        <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-emerald-400 transition-all duration-200"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-400 px-2">
          <span>Navigate using Arrow Keys or Spacebar • Press ESC to exit</span>
          <div className="flex items-center gap-1">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentIndex === i ? 'bg-emerald-400 w-5' : 'bg-zinc-700 hover:bg-zinc-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
