import React, { useState } from 'react';
import { PPTTheme, SlideLayout } from './types';
import { THEME_CONFIGS } from './themeConfig';
import { 
  Undo, 
  Redo, 
  Plus, 
  Type, 
  Image as ImageIcon, 
  Square, 
  Palette, 
  Play, 
  Save, 
  Download, 
  FileDown, 
  Sparkles, 
  ZoomIn, 
  ZoomOut,
  Maximize2
} from 'lucide-react';

interface TopToolbarProps {
  title: string;
  theme: PPTTheme;
  canUndo: boolean;
  canRedo: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  zoom: number;
  onUpdateTitle: (title: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onAddSlide: (layout: SlideLayout) => void;
  onAddText: () => void;
  onAddImage: () => void;
  onAddShape: (shapeType: 'card' | 'rect' | 'circle' | 'line') => void;
  onChangeTheme: (theme: PPTTheme) => void;
  onStartSlideshow: () => void;
  onSave: () => void;
  onDownloadPptx: () => void;
  onDownloadPdf: () => void;
  onOpenAICopilot: () => void;
  onSetZoom: (zoom: number) => void;
  downloadingPptx?: boolean;
  downloadingPdf?: boolean;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  title,
  theme,
  canUndo,
  canRedo,
  saveStatus,
  zoom,
  onUpdateTitle,
  onUndo,
  onRedo,
  onAddSlide,
  onAddText,
  onAddImage,
  onAddShape,
  onChangeTheme,
  onStartSlideshow,
  onSave,
  onDownloadPptx,
  onDownloadPdf,
  onOpenAICopilot,
  onSetZoom,
  downloadingPptx = false,
  downloadingPdf = false,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(title);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showShapeMenu, setShowShapeMenu] = useState(false);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      onUpdateTitle(titleInput.trim());
    } else {
      setTitleInput(title);
    }
  };

  const currentThemeConfig = THEME_CONFIGS[theme] || THEME_CONFIGS.emerald;

  return (
    <div className="w-full bg-[#070b10] border-b border-emerald-950 p-2.5 flex flex-wrap items-center justify-between gap-2 font-mono text-xs select-none">
      {/* Left: Presentation Title & Undo / Redo */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Editable Title */}
        <div className="flex items-center gap-1.5">
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') {
                  setTitleInput(title);
                  setIsEditingTitle(false);
                }
              }}
              className="bg-black border border-emerald-400 rounded px-2.5 py-1 text-xs text-emerald-200 font-bold outline-none max-w-xs"
            />
          ) : (
            <div
              onClick={() => {
                setTitleInput(title);
                setIsEditingTitle(true);
              }}
              className="group flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/60 border border-emerald-950 hover:border-emerald-600 cursor-pointer transition-colors"
              title="Click to rename presentation"
            >
              <span className="font-bold text-emerald-300 max-w-[220px] truncate">
                {title || 'Untitled Presentation'}
              </span>
              <span className="text-[10px] text-zinc-500 group-hover:text-emerald-400">✎</span>
            </div>
          )}

          {/* Save Status Badge & Manual Save */}
          <button
            onClick={onSave}
            className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all border ${
              saveStatus === 'saved'
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900 hover:border-emerald-500'
                : saveStatus === 'saving'
                ? 'bg-amber-950/60 text-amber-300 border-amber-900 animate-pulse'
                : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-emerald-500'
            }`}
            title="Save presentation"
          >
            <Save className="w-3 h-3" />
            <span>
              {saveStatus === 'saved' ? 'SAVED' : saveStatus === 'saving' ? 'SAVING...' : 'SAVE'}
            </span>
          </button>
        </div>

        <div className="h-4 w-[1px] bg-emerald-950 mx-1 hidden sm:block" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded bg-black border border-emerald-950 hover:border-emerald-700 disabled:opacity-30 text-zinc-300 hover:text-white transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded bg-black border border-emerald-950 hover:border-emerald-700 disabled:opacity-30 text-zinc-300 hover:text-white transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center: Slide Insertion & Content Tools */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Add Text Box */}
        <button
          onClick={onAddText}
          className="px-2.5 py-1.5 rounded bg-black border border-emerald-950 hover:border-emerald-500 text-zinc-300 hover:text-emerald-300 flex items-center gap-1 transition-all"
          title="Insert new editable text box"
        >
          <Type className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Add Text</span>
        </button>

        {/* Add Image */}
        <button
          onClick={onAddImage}
          className="px-2.5 py-1.5 rounded bg-black border border-emerald-950 hover:border-emerald-500 text-zinc-300 hover:text-emerald-300 flex items-center gap-1 transition-all"
          title="Insert image / upload photo"
        >
          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Add Image</span>
        </button>

        {/* Add Shape Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowShapeMenu(!showShapeMenu)}
            className="px-2.5 py-1.5 rounded bg-black border border-emerald-950 hover:border-emerald-500 text-zinc-300 hover:text-emerald-300 flex items-center gap-1 transition-all"
            title="Insert shape"
          >
            <Square className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Add Shape</span>
          </button>

          {showShapeMenu && (
            <div className="absolute left-0 top-full mt-1.5 w-44 bg-zinc-950 border border-emerald-800 rounded-lg shadow-2xl p-1.5 z-50 space-y-1">
              <button
                onClick={() => {
                  onAddShape('card');
                  setShowShapeMenu(false);
                }}
                className="w-full text-left p-1.5 rounded hover:bg-emerald-950 text-emerald-200 text-xs flex items-center gap-2"
              >
                <div className="w-3.5 h-3.5 rounded border border-emerald-400 bg-emerald-950" />
                <span>Card Container</span>
              </button>
              <button
                onClick={() => {
                  onAddShape('rect');
                  setShowShapeMenu(false);
                }}
                className="w-full text-left p-1.5 rounded hover:bg-emerald-950 text-emerald-200 text-xs flex items-center gap-2"
              >
                <div className="w-3.5 h-3.5 border border-emerald-400" />
                <span>Rectangle</span>
              </button>
              <button
                onClick={() => {
                  onAddShape('circle');
                  setShowShapeMenu(false);
                }}
                className="w-full text-left p-1.5 rounded hover:bg-emerald-950 text-emerald-200 text-xs flex items-center gap-2"
              >
                <div className="w-3.5 h-3.5 rounded-full border border-emerald-400" />
                <span>Circle</span>
              </button>
              <button
                onClick={() => {
                  onAddShape('line');
                  setShowShapeMenu(false);
                }}
                className="w-full text-left p-1.5 rounded hover:bg-emerald-950 text-emerald-200 text-xs flex items-center gap-2"
              >
                <div className="w-3.5 h-[2px] bg-emerald-400" />
                <span>Divider Line</span>
              </button>
            </div>
          )}
        </div>

        {/* Theme Selector */}
        <button
          onClick={() => setShowThemeModal(true)}
          className="px-2.5 py-1.5 rounded bg-black border border-emerald-950 hover:border-emerald-500 text-zinc-300 hover:text-emerald-300 flex items-center gap-1.5 transition-all"
          title="Change Presentation Theme"
        >
          <Palette className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden md:inline">{currentThemeConfig.name}</span>
        </button>

        {/* AI Slide Copilot */}
        <button
          onClick={onOpenAICopilot}
          className="px-2.5 py-1.5 rounded bg-purple-950/80 hover:bg-purple-900 border border-purple-500 text-purple-200 font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-950/40 cursor-pointer"
          title="Open AI Slide Copilot"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
          <span>AI COPILOT</span>
        </button>
      </div>

      {/* Right: Zoom, Slideshow & Downloads */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Zoom controls */}
        <div className="flex items-center gap-0.5 bg-black border border-emerald-950 rounded px-1 py-0.5 text-[10px] text-zinc-400">
          <button
            onClick={() => onSetZoom(Math.max(50, zoom - 15))}
            className="p-1 hover:text-emerald-300"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="px-1 font-bold text-zinc-300">{zoom}%</span>
          <button
            onClick={() => onSetZoom(Math.min(150, zoom + 15))}
            className="p-1 hover:text-emerald-300"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>

        {/* Present / Slideshow Button */}
        <button
          onClick={onStartSlideshow}
          className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(16,185,129,0.4)] cursor-pointer"
          title="Start Full-Screen Presentation Slideshow"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>PRESENT</span>
        </button>

        {/* Download PPTX */}
        <button
          onClick={onDownloadPptx}
          disabled={downloadingPptx}
          className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-extrabold flex items-center gap-1.5 transition-all shadow-md shadow-amber-950 cursor-pointer disabled:opacity-50"
          title="Download genuine Microsoft PowerPoint (.pptx)"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{downloadingPptx ? 'EXPORTING...' : 'PPTX'}</span>
        </button>

        {/* Export PDF */}
        <button
          onClick={onDownloadPdf}
          disabled={downloadingPdf}
          className="px-2.5 py-1.5 rounded bg-red-900/80 hover:bg-red-700 text-red-200 border border-red-700 font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
          title="Export Presentation Slides PDF"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">PDF</span>
        </button>
      </div>

      {/* --- THEME SELECTOR MODAL --- */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#090d12] border border-emerald-800 rounded-lg p-5 max-w-md w-full space-y-4 font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
              <h4 className="font-bold text-emerald-300 flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-400" />
                <span>CHOOSE PRESENTATION THEME</span>
              </h4>
              <button
                onClick={() => setShowThemeModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(THEME_CONFIGS) as PPTTheme[]).map((thmKey) => {
                const conf = THEME_CONFIGS[thmKey];
                const isCurrent = theme === thmKey;

                return (
                  <button
                    key={thmKey}
                    onClick={() => {
                      onChangeTheme(thmKey);
                      setShowThemeModal(false);
                    }}
                    style={{ background: conf.canvasBg }}
                    className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between h-28 relative group cursor-pointer ${
                      isCurrent
                        ? 'border-emerald-400 ring-2 ring-emerald-400 shadow-lg'
                        : 'border-zinc-800 hover:border-emerald-700'
                    }`}
                  >
                    <div>
                      <div
                        style={{ color: conf.titleColor }}
                        className="font-bold text-xs truncate"
                      >
                        {conf.name}
                      </div>
                      <div
                        style={{ color: conf.textColor }}
                        className="text-[10px] mt-1 line-clamp-1"
                      >
                        Visual Sample Title
                      </div>
                    </div>

                    {/* Palette Swatches */}
                    <div className="flex items-center gap-1 mt-2">
                      <div
                        style={{ background: conf.accent }}
                        className="w-3 h-3 rounded-full border border-black/40"
                      />
                      <div
                        style={{ background: conf.cardBg }}
                        className="w-3 h-3 rounded-full border border-black/40"
                      />
                      <div
                        style={{ background: conf.titleColor }}
                        className="w-3 h-3 rounded-full border border-black/40"
                      />
                    </div>

                    {isCurrent && (
                      <span className="absolute top-2 right-2 text-[9px] font-bold text-emerald-400 bg-black/70 px-1.5 py-0.5 rounded">
                        ACTIVE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
