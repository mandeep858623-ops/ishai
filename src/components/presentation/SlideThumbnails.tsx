import React, { useState } from 'react';
import { SlideData, SlideLayout } from './types';
import { ThemeColors } from './themeConfig';
import { 
  Plus, 
  Copy, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Layout, 
  Sparkles,
  Columns,
  Image as ImageIcon,
  BarChart2,
  CheckCircle2
} from 'lucide-react';

interface SlideThumbnailsProps {
  slides: SlideData[];
  currentIndex: number;
  theme: ThemeColors;
  onSelectSlide: (index: number) => void;
  onAddSlide: (layout: SlideLayout) => void;
  onDuplicateSlide: (index: number) => void;
  onDeleteSlide: (index: number) => void;
  onMoveSlide: (from: number, to: number) => void;
}

export const SlideThumbnails: React.FC<SlideThumbnailsProps> = ({
  slides,
  currentIndex,
  theme,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState<number | null>(null);

  const LAYOUT_OPTIONS: Array<{
    id: SlideLayout;
    label: string;
    icon: any;
    desc: string;
  }> = [
    { id: 'content', label: 'Title & Content', icon: Layout, desc: 'Bullet points with key takeaway' },
    { id: 'two_column', label: 'Two Columns', icon: Columns, desc: 'Side-by-side comparison' },
    { id: 'three_card', label: '3-Card Pillars', icon: Layout, desc: 'Three structured concept cards' },
    { id: 'image_text', label: 'Image with Text', icon: ImageIcon, desc: 'Visual illustration & points' },
    { id: 'full_image', label: 'Full Bleed Visual', icon: ImageIcon, desc: 'Hero photo with message overlay' },
    { id: 'stats', label: 'Key Metrics & Stats', icon: BarChart2, desc: '3 prominent data metrics' },
    { id: 'timeline', label: 'Timeline & Phases', icon: Sparkles, desc: 'Chronological roadmap' },
    { id: 'agenda', label: 'Agenda / Objectives', icon: Layout, desc: 'Numbered table of contents' },
    { id: 'section', label: 'Section Divider', icon: Sparkles, desc: 'Impactful topic divider' },
    { id: 'quote', label: 'Quote / Vision', icon: Layout, desc: 'Memorable quote & attribution' },
    { id: 'quiz_activity', label: 'Quiz / Activity', icon: CheckCircle2, desc: 'Check for understanding' },
    { id: 'conclusion', label: 'Conclusion & Next Steps', icon: CheckCircle2, desc: 'Wrap-up & call-to-action' },
    { id: 'thank_you', label: 'Thank You / Closing', icon: Sparkles, desc: 'Closing slide & contact info' },
    { id: 'title', label: 'Title / Cover Slide', icon: Sparkles, desc: 'Large title & subtitle' },
  ];

  return (
    <div className="w-full sm:w-64 bg-[#05080c] border-r border-emerald-950 flex flex-col h-full font-mono text-xs select-none">
      {/* Header */}
      <div className="p-3 border-b border-emerald-950 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-emerald-300">
          <Layout className="w-3.5 h-3.5 text-emerald-400" />
          <span>SLIDES ({slides.length})</span>
        </div>

        {/* Add slide trigger */}
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-2 py-1 rounded text-[11px] flex items-center gap-1 transition-all shadow-sm shadow-emerald-900 cursor-pointer"
            title="Add a new slide with layout"
          >
            <Plus className="w-3 h-3" />
            <span>NEW</span>
          </button>

          {/* Add Slide Layout Dropdown */}
          {showAddMenu && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-zinc-950 border border-emerald-800 rounded-lg shadow-2xl p-2 z-50 space-y-1">
              <div className="text-[10px] text-zinc-400 font-bold px-2 py-1 border-b border-zinc-800">
                CHOOSE SLIDE LAYOUT
              </div>
              {LAYOUT_OPTIONS.map((opt) => {
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onAddSlide(opt.id);
                      setShowAddMenu(false);
                    }}
                    className="w-full text-left p-2 rounded hover:bg-emerald-950/60 border border-transparent hover:border-emerald-800 transition-all flex items-start gap-2 group cursor-pointer"
                  >
                    <IconComponent className="w-4 h-4 text-emerald-400 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-bold text-emerald-200 text-xs">{opt.label}</div>
                      <div className="text-[10px] text-zinc-400">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Slide Thumbnails Scrollable List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
        {slides.map((slide, idx) => {
          const isActive = currentIndex === idx;

          return (
            <div
              key={slide.id || idx}
              onClick={() => onSelectSlide(idx)}
              className={`group relative rounded-lg border p-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-950/50 border-emerald-400 shadow-lg shadow-emerald-950/80 ring-1 ring-emerald-400'
                  : 'bg-black/80 border-emerald-950/70 hover:border-emerald-700/80'
              }`}
            >
              {/* Thumbnail Header Bar */}
              <div className="flex items-center justify-between text-[10px] mb-1.5">
                <span className="font-bold text-zinc-400 flex items-center gap-1">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-extrabold ${
                    isActive ? 'bg-emerald-400 text-black' : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="text-zinc-500 uppercase">
                    {slide.layout || 'content'}
                  </span>
                </span>

                {/* Quick actions for hover / active */}
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveSlide(idx, idx - 1);
                    }}
                    disabled={idx === 0}
                    className="p-1 hover:bg-zinc-800 disabled:opacity-20 rounded text-zinc-400 hover:text-white"
                    title="Move Slide Up"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveSlide(idx, idx + 1);
                    }}
                    disabled={idx === slides.length - 1}
                    className="p-1 hover:bg-zinc-800 disabled:opacity-20 rounded text-zinc-400 hover:text-white"
                    title="Move Slide Down"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateSlide(idx);
                    }}
                    className="p-1 hover:bg-emerald-900 rounded text-emerald-400"
                    title="Duplicate Slide"
                  >
                    <Copy className="w-3 h-3" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSlideToDelete(idx);
                    }}
                    disabled={slides.length <= 1}
                    className="p-1 hover:bg-red-950 disabled:opacity-20 rounded text-red-400"
                    title="Delete Slide"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Miniature Visual 16:9 Canvas Preview */}
              <div
                style={{
                  background: slide.bgColor || theme.canvasBg,
                }}
                className="w-full aspect-[16/9] rounded border border-emerald-950/80 overflow-hidden p-2 flex flex-col justify-between shadow-inner relative"
              >
                {/* Simulated visual slide contents in thumbnail */}
                {slide.layout === 'title' || idx === 0 ? (
                  <div className="h-full flex flex-col justify-center pl-2 border-l-2 border-emerald-400">
                    <div className="text-[9px] font-bold text-emerald-300 truncate">
                      {slide.title || 'Untitled Slide'}
                    </div>
                    {slide.subtitle && (
                      <div className="text-[7px] text-zinc-400 truncate mt-0.5">
                        {slide.subtitle}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="border-b border-emerald-950/80 pb-0.5">
                      <div className="text-[8px] font-bold text-emerald-300 truncate">
                        {slide.title || 'Untitled Slide'}
                      </div>
                    </div>

                    <div className="space-y-0.5 flex-1 pt-1 overflow-hidden">
                      {(slide.bulletPoints || []).slice(0, 3).map((b, bIdx) => (
                        <div key={bIdx} className="text-[7px] text-zinc-400 truncate flex items-center gap-1">
                          <span className="text-emerald-500">•</span>
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>

                    {slide.takeaway && (
                      <div className="text-[6.5px] text-emerald-400 truncate font-bold bg-emerald-950/60 px-1 py-0.5 rounded">
                        💡 {slide.takeaway}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {slideToDelete !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0b1016] border border-red-800 rounded-lg p-4 max-w-sm w-full space-y-3 font-mono text-xs shadow-2xl">
            <h4 className="font-bold text-red-400 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              <span>DELETE SLIDE {slideToDelete + 1}?</span>
            </h4>
            <p className="text-zinc-300 text-[11px] leading-relaxed">
              Are you sure you want to permanently delete "{slides[slideToDelete]?.title || 'this slide'}"? This action can be undone with Ctrl+Z.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setSlideToDelete(null)}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteSlide(slideToDelete);
                  setSlideToDelete(null);
                }}
                className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
              >
                Delete Slide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
