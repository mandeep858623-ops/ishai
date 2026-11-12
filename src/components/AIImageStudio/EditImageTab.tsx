import React, { useState, useRef, useEffect } from 'react';
import {
  ImageAdjustments,
  GeneratedStudioImage,
} from './types';
import {
  Upload,
  Sparkles,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Sliders,
  Download,
  Layers,
  Check,
  X,
  Undo2,
  RefreshCw,
  Eye,
  Columns,
  Wand2,
} from 'lucide-react';
import { soundEngine } from '../../utils/audio';

interface EditImageTabProps {
  initialImageUrl?: string;
  onOpenInDesignStudio: (imageUrl: string, prompt: string) => void;
  onSaveToCreations: (item: GeneratedStudioImage) => void;
}

const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
  sepia: 0,
  grayscale: 0,
  invert: 0,
  hueRotate: 0,
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
};

const QUICK_INSTRUCTIONS = [
  'Change background to sunset mountain landscape',
  'Make the lighting warmer with golden hour glow',
  'Transform into vibrant anime concept art',
  'Add futuristic neon rim lighting',
  'Convert to high-contrast cinematic black and white',
  'Enhance details, clarity and sharpness',
];

export const EditImageTab: React.FC<EditImageTabProps> = ({
  initialImageUrl,
  onOpenInDesignStudio,
  onSaveToCreations,
}) => {
  const [originalImage, setOriginalImage] = useState<string | null>(initialImageUrl || null);
  const [currentEditedImage, setCurrentEditedImage] = useState<string | null>(initialImageUrl || null);
  const [instruction, setInstruction] = useState('');
  const [editingWithAi, setEditingWithAi] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manual Adjustments
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(DEFAULT_ADJUSTMENTS);

  // Split-screen comparison slider (0 to 100%)
  const [sliderPos, setSliderPos] = useState(50);
  const [compareMode, setCompareMode] = useState<'split' | 'side-by-side' | 'single'>('split');

  // Canvas ref for rasterizing adjustments into exported file
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (initialImageUrl) {
      setOriginalImage(initialImageUrl);
      setCurrentEditedImage(initialImageUrl);
    }
  }, [initialImageUrl]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setOriginalImage(url);
      setCurrentEditedImage(url);
      setAdjustments(DEFAULT_ADJUSTMENTS);
      soundEngine.playSuccess();
    };
    reader.readAsDataURL(file);
  };

  // Run AI natural-language editing
  const handleAiEdit = async () => {
    if (!currentEditedImage || !instruction.trim() || editingWithAi) return;
    soundEngine.playClick();
    setEditingWithAi(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ai/image-studio/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: currentEditedImage,
          instruction: instruction.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error(`AI editing failed with code ${res.status}`);
      }

      const data = await res.json();
      if (data.editedImageUrl) {
        setCurrentEditedImage(data.editedImageUrl);
        soundEngine.playSuccess();
      } else {
        throw new Error(data.error || 'Failed to edit image');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Image editing encountered an error');
      soundEngine.playAlertBeep();
    } finally {
      setEditingWithAi(false);
    }
  };

  // Revert / Accept / Reject
  const handleReject = () => {
    soundEngine.playClick();
    setCurrentEditedImage(originalImage);
    setAdjustments(DEFAULT_ADJUSTMENTS);
  };

  const handleAccept = () => {
    if (!currentEditedImage) return;
    soundEngine.playSuccess();
    const item: GeneratedStudioImage = {
      id: `edit-${Date.now()}`,
      url: currentEditedImage,
      prompt: instruction || 'Edited image',
      enhancedPrompt: `Edited with instruction: ${instruction}`,
      aspectRatio: '1:1',
      model: 'gemini-3.1-flash-lite',
      timestamp: new Date().toLocaleTimeString(),
      type: 'edited',
    };
    onSaveToCreations(item);
  };

  // Rasterize with adjustments for real download
  const rasterizeToCanvas = (): Promise<string> => {
    return new Promise((resolve) => {
      if (!currentEditedImage) return resolve('');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = currentEditedImage;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 1024;
        canvas.height = img.naturalHeight || 1024;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(currentEditedImage);

        // Apply filters
        const filters: string[] = [];
        if (adjustments.brightness !== 0) filters.push(`brightness(${100 + adjustments.brightness}%)`);
        if (adjustments.contrast !== 0) filters.push(`contrast(${100 + adjustments.contrast}%)`);
        if (adjustments.saturation !== 0) filters.push(`saturate(${100 + adjustments.saturation}%)`);
        if (adjustments.blur > 0) filters.push(`blur(${adjustments.blur}px)`);
        if (adjustments.sepia > 0) filters.push(`sepia(${adjustments.sepia}%)`);
        if (adjustments.grayscale > 0) filters.push(`grayscale(${adjustments.grayscale}%)`);
        if (adjustments.invert > 0) filters.push(`invert(${adjustments.invert}%)`);
        if (adjustments.hueRotate > 0) filters.push(`hue-rotate(${adjustments.hueRotate}deg)`);

        if (filters.length > 0) ctx.filter = filters.join(' ');

        // Apply rotation and flips
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        if (adjustments.rotation) ctx.rotate((adjustments.rotation * Math.PI) / 180);
        ctx.scale(
          adjustments.flipHorizontal ? -1 : 1,
          adjustments.flipVertical ? -1 : 1
        );
        ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2);
        ctx.restore();

        resolve(canvas.toDataURL('image/png', 0.95));
      };
    });
  };

  const handleDownload = async () => {
    soundEngine.playClick();
    const finalUrl = await rasterizeToCanvas();
    const a = document.createElement('a');
    a.href = finalUrl || currentEditedImage || '';
    a.download = `SuperAI_Edited_${Date.now()}.png`;
    a.click();
  };

  const handleSendToCanvas = async () => {
    soundEngine.playClick();
    const finalUrl = await rasterizeToCanvas();
    onOpenInDesignStudio(finalUrl, instruction || 'Edited Artwork');
  };

  // Build CSS filter string for live preview
  const liveFilterStyle = [
    `brightness(${100 + adjustments.brightness}%)`,
    `contrast(${100 + adjustments.contrast}%)`,
    `saturate(${100 + adjustments.saturation}%)`,
    `blur(${adjustments.blur}px)`,
    `sepia(${adjustments.sepia}%)`,
    `grayscale(${adjustments.grayscale}%)`,
    `invert(${adjustments.invert}%)`,
    `hue-rotate(${adjustments.hueRotate}deg)`,
  ].join(' ');

  const liveTransformStyle = `rotate(${adjustments.rotation}deg) scale(${adjustments.flipHorizontal ? -1 : 1}, ${adjustments.flipVertical ? -1 : 1})`;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full font-mono text-emerald-400 overflow-y-auto pr-1">
      {/* Left Column: AI Instructions, Sliders, Transforms */}
      <div className="w-full lg:w-[420px] flex flex-col gap-3.5 shrink-0">
        {/* Upload / Source Box */}
        <div className="bg-[#05080f] border border-emerald-900/80 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300">
              📸 SOURCE IMAGE
            </span>
            <label className="text-[10px] bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 px-2 py-1 rounded cursor-pointer transition-colors flex items-center gap-1 font-bold">
              <Upload className="w-3 h-3" />
              <span>UPLOAD NEW</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* AI Natural Language Edit Card */}
        <div className="bg-[#05080f] border border-emerald-900/80 rounded-lg p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <Wand2 className="w-4 h-4 text-emerald-400" />
              AI NATURAL LANGUAGE EDIT
            </span>
            <span className="text-[9px] text-emerald-600 bg-emerald-950/60 px-1.5 py-0.5 rounded">
              Gemini Vision Core
            </span>
          </div>

          <div className="space-y-1.5">
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Tell the AI what to change (e.g. 'Turn the background into a bustling cyberpunk street', 'Add retro film light leaks', 'Remove the background subject')..."
              rows={3}
              className="w-full bg-[#020408] border border-emerald-800 rounded p-2 text-xs text-white placeholder:text-emerald-800/80 focus:outline-none focus:border-emerald-400 resize-none"
            />

            {/* Quick Prompts Chips */}
            <div className="flex flex-wrap gap-1">
              {QUICK_INSTRUCTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setInstruction(q)}
                  className="text-[9px] bg-black/60 hover:bg-emerald-950 border border-emerald-900/80 text-emerald-400 px-1.5 py-0.5 rounded truncate max-w-full"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAiEdit}
            disabled={editingWithAi || !currentEditedImage || !instruction.trim()}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-950 disabled:text-emerald-700 text-black font-extrabold py-2 px-3 rounded flex items-center justify-center gap-2 text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            {editingWithAi ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>PROCESSING AI EDIT...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>RUN AI EDIT</span>
              </>
            )}
          </button>

          {errorMsg && (
            <p className="text-[11px] text-red-400 bg-red-950/30 p-1.5 rounded border border-red-900">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Adjustments & Filter Panel */}
        <div className="bg-[#05080f] border border-emerald-900/80 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-emerald-950">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-400" />
              IMAGE ADJUSTMENTS &amp; FILTERS
            </span>
            <button
              onClick={() => setAdjustments(DEFAULT_ADJUSTMENTS)}
              className="text-[10px] text-emerald-600 hover:text-emerald-300"
            >
              Reset
            </button>
          </div>

          {/* Sliders */}
          <div className="space-y-2 text-[11px]">
            <div>
              <div className="flex justify-between text-emerald-500">
                <span>Brightness</span>
                <span>{adjustments.brightness > 0 ? `+${adjustments.brightness}` : adjustments.brightness}%</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={adjustments.brightness}
                onChange={(e) => setAdjustments({ ...adjustments, brightness: parseInt(e.target.value, 10) })}
                className="w-full accent-emerald-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-emerald-500">
                <span>Contrast</span>
                <span>{adjustments.contrast > 0 ? `+${adjustments.contrast}` : adjustments.contrast}%</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={adjustments.contrast}
                onChange={(e) => setAdjustments({ ...adjustments, contrast: parseInt(e.target.value, 10) })}
                className="w-full accent-emerald-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-emerald-500">
                <span>Saturation</span>
                <span>{adjustments.saturation > 0 ? `+${adjustments.saturation}` : adjustments.saturation}%</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={adjustments.saturation}
                onChange={(e) => setAdjustments({ ...adjustments, saturation: parseInt(e.target.value, 10) })}
                className="w-full accent-emerald-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-950">
              <div>
                <div className="flex justify-between text-emerald-500 text-[10px]">
                  <span>Blur</span>
                  <span>{adjustments.blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={adjustments.blur}
                  onChange={(e) => setAdjustments({ ...adjustments, blur: parseInt(e.target.value, 10) })}
                  className="w-full accent-emerald-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-emerald-500 text-[10px]">
                  <span>Hue Rotate</span>
                  <span>{adjustments.hueRotate}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={adjustments.hueRotate}
                  onChange={(e) => setAdjustments({ ...adjustments, hueRotate: parseInt(e.target.value, 10) })}
                  className="w-full accent-emerald-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                onClick={() => setAdjustments({ ...adjustments, sepia: adjustments.sepia > 0 ? 0 : 80 })}
                className={`py-1 rounded text-[10px] border ${
                  adjustments.sepia > 0 ? 'bg-amber-950/70 border-amber-500 text-amber-200' : 'bg-black/40 border-emerald-950 text-emerald-500'
                }`}
              >
                Sepia
              </button>
              <button
                onClick={() => setAdjustments({ ...adjustments, grayscale: adjustments.grayscale > 0 ? 0 : 100 })}
                className={`py-1 rounded text-[10px] border ${
                  adjustments.grayscale > 0 ? 'bg-slate-800 border-slate-400 text-white' : 'bg-black/40 border-emerald-950 text-emerald-500'
                }`}
              >
                Grayscale
              </button>
              <button
                onClick={() => setAdjustments({ ...adjustments, invert: adjustments.invert > 0 ? 0 : 100 })}
                className={`py-1 rounded text-[10px] border ${
                  adjustments.invert > 0 ? 'bg-purple-950/70 border-purple-500 text-purple-200' : 'bg-black/40 border-emerald-950 text-emerald-500'
                }`}
              >
                Invert
              </button>
            </div>
          </div>

          {/* Transforms */}
          <div className="pt-2 border-t border-emerald-950 flex items-center justify-between text-[11px]">
            <span className="text-emerald-500">Transform:</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setAdjustments({ ...adjustments, rotation: (adjustments.rotation + 90) % 360 })}
                className="p-1.5 bg-black/50 border border-emerald-900 rounded hover:border-emerald-600 text-emerald-300"
                title="Rotate 90° Clockwise"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setAdjustments({ ...adjustments, flipHorizontal: !adjustments.flipHorizontal })}
                className={`p-1.5 border rounded ${
                  adjustments.flipHorizontal ? 'bg-emerald-900/60 border-emerald-400 text-white' : 'bg-black/50 border-emerald-900 text-emerald-300'
                }`}
                title="Flip Horizontally"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setAdjustments({ ...adjustments, flipVertical: !adjustments.flipVertical })}
                className={`p-1.5 border rounded ${
                  adjustments.flipVertical ? 'bg-emerald-900/60 border-emerald-400 text-white' : 'bg-black/50 border-emerald-900 text-emerald-300'
                }`}
                title="Flip Vertically"
              >
                <FlipVertical className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Comparison Preview & Export Bar */}
      <div className="flex-1 flex flex-col gap-3 min-h-[400px]">
        {/* Comparison Header Controls */}
        <div className="bg-[#05080f] border border-emerald-950 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-300">
              👁️ VISUAL COMPARISON
            </span>
            <div className="flex bg-black/60 border border-emerald-950 rounded p-0.5 text-[10px]">
              <button
                onClick={() => setCompareMode('split')}
                className={`px-2 py-0.5 rounded ${compareMode === 'split' ? 'bg-emerald-900/60 text-white font-bold' : 'text-emerald-500'}`}
              >
                Split Slider
              </button>
              <button
                onClick={() => setCompareMode('side-by-side')}
                className={`px-2 py-0.5 rounded ${compareMode === 'side-by-side' ? 'bg-emerald-900/60 text-white font-bold' : 'text-emerald-500'}`}
              >
                Side by Side
              </button>
              <button
                onClick={() => setCompareMode('single')}
                className={`px-2 py-0.5 rounded ${compareMode === 'single' ? 'bg-emerald-900/60 text-white font-bold' : 'text-emerald-500'}`}
              >
                Edited Only
              </button>
            </div>
          </div>

          {/* Quick Actions (Accept / Reject) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleReject}
              className="text-[11px] text-red-400 hover:text-red-300 px-2 py-1 flex items-center gap-1 border border-red-950 rounded bg-red-950/20"
            >
              <Undo2 className="w-3 h-3" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleAccept}
              className="text-[11px] text-emerald-300 hover:text-white px-2.5 py-1 flex items-center gap-1 border border-emerald-700 rounded bg-emerald-950/50"
            >
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Save Creation</span>
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="flex-1 bg-[#020408] border border-emerald-950 rounded-lg p-4 flex items-center justify-center relative overflow-hidden select-none">
          {currentEditedImage ? (
            compareMode === 'split' && originalImage ? (
              // Interactive Split Slider View
              <div className="relative w-full max-w-2xl h-[420px] rounded overflow-hidden shadow-2xl border border-emerald-900/80">
                {/* Edited Image (Base Layer) */}
                <div
                  className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden"
                  style={{
                    filter: liveFilterStyle,
                    transform: liveTransformStyle,
                  }}
                >
                  <img
                    src={currentEditedImage}
                    alt="Edited"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Original Image (Clipped Overlay Layer) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={originalImage}
                    alt="Original"
                    className="w-full h-full object-contain"
                    style={{
                      width: '100%',
                      maxWidth: 'none',
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-400 border border-emerald-900">
                    ORIGINAL
                  </div>
                </div>

                <div className="absolute top-3 right-3 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-cyan-400 border border-cyan-900">
                  EDITED
                </div>

                {/* Slider divider line and draggable thumb */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 shadow-[0_0_10px_#10b981]"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center shadow-lg cursor-ew-resize">
                    <Columns className="w-3 h-3 text-black" />
                  </div>
                </div>

                {/* Hidden slider input */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPos}
                  onChange={(e) => setSliderPos(parseInt(e.target.value, 10))}
                  className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
                />
              </div>
            ) : compareMode === 'side-by-side' && originalImage ? (
              // Side by Side View
              <div className="grid grid-cols-2 gap-3 w-full max-w-3xl h-[420px]">
                <div className="bg-black/60 rounded border border-emerald-950 flex flex-col overflow-hidden">
                  <div className="p-1.5 bg-emerald-950/40 text-[10px] text-emerald-400 font-bold border-b border-emerald-950">
                    ORIGINAL
                  </div>
                  <div className="flex-1 flex items-center justify-center p-2">
                    <img src={originalImage} alt="Original" className="max-h-full max-w-full object-contain" />
                  </div>
                </div>

                <div className="bg-black/60 rounded border border-cyan-950 flex flex-col overflow-hidden">
                  <div className="p-1.5 bg-cyan-950/40 text-[10px] text-cyan-400 font-bold border-b border-cyan-950">
                    EDITED
                  </div>
                  <div
                    className="flex-1 flex items-center justify-center p-2"
                    style={{ filter: liveFilterStyle, transform: liveTransformStyle }}
                  >
                    <img src={currentEditedImage} alt="Edited" className="max-h-full max-w-full object-contain" />
                  </div>
                </div>
              </div>
            ) : (
              // Single Edited View
              <div
                className="max-w-2xl max-h-[420px] flex items-center justify-center overflow-hidden rounded shadow-xl"
                style={{ filter: liveFilterStyle, transform: liveTransformStyle }}
              >
                <img
                  src={currentEditedImage}
                  alt="Edited Preview"
                  className="max-h-[420px] max-w-full object-contain"
                />
              </div>
            )
          ) : (
            <div className="text-center text-emerald-700 space-y-2">
              <p className="text-xs">No image loaded yet.</p>
              <label className="inline-block bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs px-3 py-1.5 rounded cursor-pointer hover:bg-emerald-900">
                Upload Image to Edit
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        {currentEditedImage && (
          <div className="bg-[#05080f] border border-emerald-950 rounded-lg p-2.5 flex items-center justify-between text-xs flex-wrap gap-2">
            <span className="text-[10px] text-emerald-600">
              Ready to export or compose onto the multi-layer design canvas
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSendToCanvas}
                className="bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 px-3 py-1.5 rounded flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>OPEN IN DESIGN STUDIO</span>
              </button>

              <button
                onClick={handleDownload}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-3 py-1.5 rounded flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>DOWNLOAD EDITED PNG</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
