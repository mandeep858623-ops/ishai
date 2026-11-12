import React, { useRef } from 'react';
import { SlideData, SlideElement, SlideLayout } from './types';
import { ThemeColors } from './themeConfig';
import { 
  Type, 
  Image as ImageIcon, 
  Square, 
  Sliders, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Bold, 
  Italic, 
  Layers, 
  Trash2, 
  Layout, 
  MessageSquare,
  Upload,
  Link
} from 'lucide-react';

interface SlidePropertiesPanelProps {
  slide: SlideData;
  selectedElement: SlideElement | null;
  theme: ThemeColors;
  onUpdateElement: (elementId: string, updates: Partial<SlideElement>) => void;
  onDeleteElement: (elementId: string) => void;
  onChangeSlideLayout: (layout: SlideLayout) => void;
  onUpdateSlideBg: (color: string) => void;
  onUpdateSlideNotes: (notes: string) => void;
  onUpdateSlideCategory: (tag: string) => void;
  onBringToFront: (elementId: string) => void;
  onSendToBack: (elementId: string) => void;
}

const COLOR_PALETTE = [
  '#ffffff', '#000000', '#10b981', '#34d399', '#38bdf8', '#2563eb',
  '#c084fc', '#a855f7', '#f59e0b', '#ef4444', '#94a3b8', '#0f172a'
];

const FONT_FAMILIES = [
  { label: 'System Sans', value: 'sans-serif' },
  { label: 'Modern Inter', value: 'Inter, sans-serif' },
  { label: 'Editorial Serif', value: 'Georgia, serif' },
  { label: 'Technical Mono', value: 'monospace' },
];

export const SlidePropertiesPanel: React.FC<SlidePropertiesPanelProps> = ({
  slide,
  selectedElement,
  theme,
  onUpdateElement,
  onDeleteElement,
  onChangeSlideLayout,
  onUpdateSlideBg,
  onUpdateSlideNotes,
  onUpdateSlideCategory,
  onBringToFront,
  onSendToBack,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateElement(selectedElement.id, {
          imageUrl: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full lg:w-72 bg-[#05080c] border-l border-emerald-950 p-3 flex flex-col font-mono text-xs select-none overflow-y-auto max-h-[700px] space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-emerald-300">
          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {selectedElement ? `${selectedElement.type.toUpperCase()} INSPECTOR` : 'SLIDE INSPECTOR'}
          </span>
        </div>

        {selectedElement && (
          <button
            onClick={() => onDeleteElement(selectedElement.id)}
            className="p-1 rounded bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-400"
            title="Delete Selected Element (Del)"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* =================================================================== */}
      {/* CASE 1: TEXT ELEMENT SELECTED */}
      {/* =================================================================== */}
      {selectedElement && selectedElement.type === 'text' && (
        <div className="space-y-3">
          {/* Content editing */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 block font-bold">TEXT CONTENT:</label>
            <textarea
              rows={4}
              value={selectedElement.content || ''}
              onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })}
              className="w-full bg-black border border-emerald-900 rounded p-2 text-xs text-white outline-none focus:border-emerald-400 resize-none leading-relaxed"
            />
          </div>

          {/* Typography: Font family & Size */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-zinc-500 block">Font Family:</label>
              <select
                value={selectedElement.fontFamily || 'sans-serif'}
                onChange={(e) => onUpdateElement(selectedElement.id, { fontFamily: e.target.value })}
                className="w-full bg-black border border-emerald-950 rounded p-1 text-[11px] text-zinc-300 outline-none"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 block">Size (pt):</label>
              <input
                type="number"
                min={8}
                max={72}
                value={selectedElement.fontSize || 14}
                onChange={(e) => onUpdateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                className="w-full bg-black border border-emerald-950 rounded p-1 text-[11px] text-zinc-300 outline-none font-bold"
              />
            </div>
          </div>

          {/* Formatting: Bold, Italic, Alignment */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 block">Style & Alignment:</label>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  onUpdateElement(selectedElement.id, {
                    fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold',
                  })
                }
                className={`p-1.5 rounded border ${
                  selectedElement.fontWeight === 'bold'
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                    : 'bg-black border-emerald-950 text-zinc-400'
                }`}
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() =>
                  onUpdateElement(selectedElement.id, {
                    fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic',
                  })
                }
                className={`p-1.5 rounded border ${
                  selectedElement.fontStyle === 'italic'
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                    : 'bg-black border-emerald-950 text-zinc-400'
                }`}
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-[1px] bg-emerald-950 mx-1" />

              <button
                onClick={() => onUpdateElement(selectedElement.id, { align: 'left' })}
                className={`p-1.5 rounded border ${
                  selectedElement.align === 'left' || !selectedElement.align
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                    : 'bg-black border-emerald-950 text-zinc-400'
                }`}
                title="Align Left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onUpdateElement(selectedElement.id, { align: 'center' })}
                className={`p-1.5 rounded border ${
                  selectedElement.align === 'center'
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                    : 'bg-black border-emerald-950 text-zinc-400'
                }`}
                title="Align Center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onUpdateElement(selectedElement.id, { align: 'right' })}
                className={`p-1.5 rounded border ${
                  selectedElement.align === 'right'
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                    : 'bg-black border-emerald-950 text-zinc-400'
                }`}
                title="Align Right"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Text Color Swatches */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 block">Text Color:</label>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => onUpdateElement(selectedElement.id, { color: c })}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full border transition-transform ${
                    selectedElement.color === c ? 'scale-125 border-emerald-400 ring-1 ring-white' : 'border-black/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Layer order */}
          <div className="pt-2 border-t border-emerald-950 flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">Layer Order:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onBringToFront(selectedElement.id)}
                className="px-2 py-1 bg-black border border-emerald-950 rounded hover:border-emerald-700 text-[10px]"
              >
                Bring Front
              </button>
              <button
                onClick={() => onSendToBack(selectedElement.id)}
                className="px-2 py-1 bg-black border border-emerald-950 rounded hover:border-emerald-700 text-[10px]"
              >
                Send Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* CASE 2: IMAGE ELEMENT SELECTED */}
      {/* =================================================================== */}
      {selectedElement && selectedElement.type === 'image' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 block font-bold">IMAGE SOURCE URL:</label>
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="https://..."
                value={selectedElement.imageUrl || ''}
                onChange={(e) => onUpdateElement(selectedElement.id, { imageUrl: e.target.value })}
                className="flex-1 bg-black border border-emerald-950 rounded px-2 py-1 text-[11px] text-white outline-none"
              />
            </div>
          </div>

          {/* Local Upload */}
          <div className="space-y-1">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 p-2 rounded text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>UPLOAD LOCAL PHOTO</span>
            </button>
          </div>

          {/* Object Fit & Corner Radius */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-zinc-500 block">Fit Mode:</label>
              <select
                value={selectedElement.objectFit || 'cover'}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, {
                    objectFit: e.target.value as 'cover' | 'contain',
                  })
                }
                className="w-full bg-black border border-emerald-950 rounded p-1 text-[11px] text-zinc-300 outline-none"
              >
                <option value="cover">Cover (Fill)</option>
                <option value="contain">Contain (Fit)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 block">Corner Radius:</label>
              <input
                type="number"
                min={0}
                max={40}
                value={selectedElement.borderRadius || 6}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, { borderRadius: Number(e.target.value) })
                }
                className="w-full bg-black border border-emerald-950 rounded p-1 text-[11px] text-zinc-300 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* CASE 3: SHAPE ELEMENT SELECTED */}
      {/* =================================================================== */}
      {selectedElement && selectedElement.type === 'shape' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 block">Shape Type:</label>
            <select
              value={selectedElement.shapeType || 'card'}
              onChange={(e) =>
                onUpdateElement(selectedElement.id, { shapeType: e.target.value as any })
              }
              className="w-full bg-black border border-emerald-950 rounded p-1 text-[11px] text-zinc-300 outline-none"
            >
              <option value="card">Card Container (Rounded)</option>
              <option value="roundRect">Pill / Soft Rectangle</option>
              <option value="rect">Sharp Rectangle</option>
              <option value="circle">Circle / Oval</option>
              <option value="line">Divider Line</option>
            </select>
          </div>

          {/* Fill Color */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 block">Fill Color:</label>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => onUpdateElement(selectedElement.id, { fillColor: c })}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full border transition-transform ${
                    selectedElement.fillColor === c ? 'scale-125 border-emerald-400 ring-1 ring-white' : 'border-black/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Border Color */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 block">Border Color:</label>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => onUpdateElement(selectedElement.id, { borderColor: c })}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full border transition-transform ${
                    selectedElement.borderColor === c ? 'scale-125 border-emerald-400 ring-1 ring-white' : 'border-black/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Border Width & Opacity */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-zinc-500 block">Border (px):</label>
              <input
                type="number"
                min={0}
                max={10}
                value={selectedElement.borderWidth !== undefined ? selectedElement.borderWidth : 1}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, { borderWidth: Number(e.target.value) })
                }
                className="w-full bg-black border border-emerald-950 rounded p-1 text-[11px] text-zinc-300 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 block">Opacity (0-1):</label>
              <input
                type="number"
                step={0.1}
                min={0.1}
                max={1}
                value={selectedElement.opacity !== undefined ? selectedElement.opacity : 1}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, { opacity: Number(e.target.value) })
                }
                className="w-full bg-black border border-emerald-950 rounded p-1 text-[11px] text-zinc-300 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* CASE 4: NO ELEMENT SELECTED -> SLIDE LEVEL PROPERTIES */}
      {/* =================================================================== */}
      {!selectedElement && (
        <div className="space-y-4">
          {/* Change Slide Layout */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400 block font-bold flex items-center gap-1">
              <Layout className="w-3 h-3 text-emerald-400" />
              <span>SLIDE LAYOUT:</span>
            </label>
            <select
              value={slide.layout || 'content'}
              onChange={(e) => onChangeSlideLayout(e.target.value as SlideLayout)}
              className="w-full bg-black border border-emerald-900 rounded p-1.5 text-xs text-emerald-300 outline-none focus:border-emerald-400 font-bold"
            >
              <option value="content">Title &amp; Content (Card + Takeaway)</option>
              <option value="two_column">Two Columns (Comparison)</option>
              <option value="three_card">3-Card Concept Pillars</option>
              <option value="image_text">Image with Text Card</option>
              <option value="full_image">Full Bleed Visual Hero</option>
              <option value="stats">Key Metrics &amp; Stats</option>
              <option value="timeline">Timeline &amp; Roadmap</option>
              <option value="agenda">Agenda / Table of Contents</option>
              <option value="section">Section Divider</option>
              <option value="quote">Quote &amp; Vision</option>
              <option value="quiz_activity">Quiz / Discussion Check</option>
              <option value="conclusion">Conclusion &amp; Next Steps</option>
              <option value="thank_you">Thank You / Closing</option>
              <option value="title">Title / Cover Slide</option>
            </select>
          </div>

          {/* Section / Category Tag */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 block font-bold">CATEGORY / SECTION TAG:</label>
            <input
              type="text"
              value={slide.categoryTag || ''}
              onChange={(e) => onUpdateSlideCategory(e.target.value)}
              placeholder="e.g. EXECUTIVE SUMMARY, FINANCIAL AUDIT"
              className="w-full bg-black border border-emerald-950 rounded p-1.5 text-xs text-white outline-none focus:border-emerald-400"
            />
          </div>

          {/* Custom Slide Background Color */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 block font-bold">SLIDE BACKGROUND:</label>
            <div className="flex flex-wrap gap-1.5">
              {['#070d0a', '#0b132b', '#170b28', '#180e07', '#09090b', '#ffffff', '#1e293b'].map(
                (bg) => (
                  <button
                    key={bg}
                    onClick={() => onUpdateSlideBg(bg)}
                    style={{ backgroundColor: bg }}
                    className={`w-6 h-6 rounded border transition-transform ${
                      slide.bgColor === bg ? 'scale-110 border-emerald-400 ring-2 ring-emerald-400' : 'border-zinc-800'
                    }`}
                  />
                )
              )}
            </div>
          </div>

          {/* Speaker Notes */}
          <div className="space-y-1 pt-2 border-t border-emerald-950">
            <label className="text-[10px] text-zinc-400 block font-bold flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-cyan-400" />
              <span>SPEAKER NOTES:</span>
            </label>
            <textarea
              rows={4}
              placeholder="Presenter talking points for this slide..."
              value={slide.speakerNotes || ''}
              onChange={(e) => onUpdateSlideNotes(e.target.value)}
              className="w-full bg-black border border-emerald-950 rounded p-2 text-xs text-zinc-300 outline-none focus:border-emerald-500 leading-relaxed resize-none"
            />
            <p className="text-[9px] text-zinc-500">
              *Speaker notes are automatically included inside downloaded PowerPoint (.pptx) slides!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
