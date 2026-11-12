import React, { useState } from 'react';
import {
  GeneratedStudioImage,
  AspectRatioType,
} from './types';
import {
  Sparkles,
  Wand2,
  Minimize2,
  Palette,
  Maximize2,
  Trash2,
  Bookmark,
  Download,
  Edit,
  Layers,
  RotateCcw,
  Upload,
  AlertCircle,
  CheckCircle,
  Cpu,
  Clock,
  Image as ImageIcon,
} from 'lucide-react';
import { soundEngine } from '../../utils/audio';

interface CreateTabProps {
  onOpenInDesignStudio: (imageUrl: string, prompt: string, ratio: AspectRatioType) => void;
  onSendToEditImage: (imageUrl: string) => void;
  onSaveToCreations: (item: GeneratedStudioImage) => void;
  recentCreations: GeneratedStudioImage[];
}

const STYLE_PRESETS = [
  { id: 'none', label: 'Raw / Default', icon: '✨' },
  { id: 'photorealistic', label: 'Photorealistic', icon: '📸' },
  { id: 'cinematic', label: 'Cinematic', icon: '🎬' },
  { id: 'anime', label: 'Anime & Manga', icon: '⚡' },
  { id: 'digital-art', label: 'Digital Concept', icon: '🎨' },
  { id: '3d-render', label: '3D Octane Render', icon: '🔮' },
  { id: 'cyberpunk', label: 'Cyberpunk Neon', icon: '🌆' },
  { id: 'watercolor', label: 'Watercolor', icon: '🖌️' },
  { id: 'minimalist', label: 'Minimalist Clean', icon: '📐' },
  { id: 'fantasy', label: 'Epic Fantasy', icon: '🐉' },
  { id: 'vintage', label: 'Vintage 70s Film', icon: '📼' },
  { id: 'vector', label: 'Clean Vector SVG', icon: '💎' },
];

const ASPECT_RATIOS: Array<{ id: AspectRatioType; label: string; ratio: string; desc: string }> = [
  { id: '1:1', label: 'Square', ratio: '1:1', desc: 'Instagram / Avatar' },
  { id: '16:9', label: 'Landscape', ratio: '16:9', desc: 'YouTube / Desktop' },
  { id: '9:16', label: 'Portrait', ratio: '9:16', desc: 'Reels / Stories' },
  { id: '4:3', label: 'Standard', ratio: '4:3', desc: 'Display / Photo' },
  { id: '3:4', label: 'Poster', ratio: '3:4', desc: 'Posters / Print' },
];

export const CreateTab: React.FC<CreateTabProps> = ({
  onOpenInDesignStudio,
  onSendToEditImage,
  onSaveToCreations,
  recentCreations,
}) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('1:1');
  const [selectedStyle, setSelectedStyle] = useState('photorealistic');
  const [selectedModel, setSelectedModel] = useState<'gemini-3.1-flash-lite' | 'gemini-nano-banana-2.1'>('gemini-3.1-flash-lite');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [showNegative, setShowNegative] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceFileName, setReferenceFileName] = useState('');

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<GeneratedStudioImage[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Enhancer state
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceSuccess, setEnhanceSuccess] = useState(false);

  // Reference Image Upload
  const handleRefUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReferenceFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setReferenceImage(reader.result as string);
      soundEngine.playSuccess();
    };
    reader.readAsDataURL(file);
  };

  // Enhance Prompt with Gemini
  const handleEnhance = async (action: 'enhance' | 'shorten' | 'style' | 'more_detailed') => {
    if (!prompt.trim() || enhancing) return;
    soundEngine.playClick();
    setEnhancing(true);
    setEnhanceSuccess(false);

    try {
      const res = await fetch('/api/ai/image-studio/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          action,
          targetStyle: selectedStyle,
        }),
      });
      const data = await res.json();
      if (data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
        setEnhanceSuccess(true);
        soundEngine.playSuccess();
        setTimeout(() => setEnhanceSuccess(false), 3000);
      }
    } catch (err: any) {
      console.warn('Enhance prompt failed:', err);
    } finally {
      setEnhancing(false);
    }
  };

  // Generate Image Action
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || generating) return;

    soundEngine.playClick();
    setGenerating(true);
    setErrorMsg(null);
    setElapsedSeconds(0);

    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    try {
      const res = await fetch('/api/ai/image-studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          style: selectedStyle,
          model: selectedModel,
          negativePrompt: showNegative ? negativePrompt : undefined,
          referenceImageBase64: referenceImage || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`Generation failed with code ${res.status}`);
      }

      const data = await res.json();
      clearInterval(timer);

      if (data.images && data.images.length > 0) {
        const newImages: GeneratedStudioImage[] = data.images.map((img: any) => ({
          ...img,
          aspectRatio,
          type: 'generated',
        }));

        setGeneratedImages((prev) => [...newImages, ...prev]);
        newImages.forEach((img) => onSaveToCreations(img));
        soundEngine.playSuccess();
      } else {
        throw new Error(data.error || 'No image output received');
      }
    } catch (err: any) {
      clearInterval(timer);
      console.error(err);
      setErrorMsg(err.message || 'Generation failed. Please try again.');
      soundEngine.playAlertBeep();
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (img: GeneratedStudioImage) => {
    soundEngine.playClick();
    const a = document.createElement('a');
    a.href = img.url;
    a.download = `SuperAI_Image_${img.prompt.slice(0, 20).replace(/[^a-z0-9]/gi, '_')}.png`;
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full font-mono text-emerald-400 overflow-y-auto pr-1">
      {/* Left Input & Configuration Column */}
      <div className="w-full lg:w-[460px] flex flex-col gap-3.5 shrink-0">
        {/* Main Prompt Card */}
        <div className="bg-[#05080f] border border-emerald-900/80 rounded-lg p-3.5 shadow-[0_0_20px_rgba(0,0,0,0.8)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              IMAGE PROMPT
            </span>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-emerald-600">Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as any)}
                className="bg-black border border-emerald-800 text-emerald-300 rounded px-1.5 py-0.5 text-[10px]"
              >
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
                <option value="gemini-nano-banana-2.1">gemini-nano-banana-2.1 (Ultra HD)</option>
              </select>
            </div>
          </div>

          {/* Prompt Textarea */}
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to create in vivid detail (e.g. 'A sleek cybernetic supercar drifting through neon rain at midnight, cinematic 8k reflections, volumetric mist')..."
              rows={4}
              className="w-full bg-[#020408] border border-emerald-800/90 rounded-md p-2.5 text-xs text-white placeholder:text-emerald-800/80 focus:outline-none focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all resize-none"
            />
            {prompt && (
              <button
                onClick={() => setPrompt('')}
                className="absolute top-2 right-2 text-emerald-600 hover:text-emerald-400 p-1"
                title="Clear Prompt"
              >
                ✕
              </button>
            )}
          </div>

          {/* AI Prompt Enhancer Action Strip */}
          <div className="pt-1 border-t border-emerald-950 flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] text-emerald-600 font-bold shrink-0">AI Enhancer:</span>
            <button
              type="button"
              onClick={() => handleEnhance('enhance')}
              disabled={enhancing || !prompt.trim()}
              className="flex items-center gap-1 text-[10px] bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 px-2 py-0.5 rounded transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Wand2 className="w-3 h-3 text-emerald-400" />
              <span>Enhance</span>
            </button>
            <button
              type="button"
              onClick={() => handleEnhance('shorten')}
              disabled={enhancing || !prompt.trim()}
              className="flex items-center gap-1 text-[10px] bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 px-2 py-0.5 rounded transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Minimize2 className="w-3 h-3 text-cyan-400" />
              <span>Shorten</span>
            </button>
            <button
              type="button"
              onClick={() => handleEnhance('style')}
              disabled={enhancing || !prompt.trim()}
              className="flex items-center gap-1 text-[10px] bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 px-2 py-0.5 rounded transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Palette className="w-3 h-3 text-amber-400" />
              <span>Style</span>
            </button>
            <button
              type="button"
              onClick={() => handleEnhance('more_detailed')}
              disabled={enhancing || !prompt.trim()}
              className="flex items-center gap-1 text-[10px] bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 px-2 py-0.5 rounded transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Maximize2 className="w-3 h-3 text-purple-400" />
              <span>Details</span>
            </button>

            {enhanceSuccess && (
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 ml-auto animate-pulse">
                <CheckCircle className="w-3 h-3" /> Enhanced!
              </span>
            )}
          </div>

          {/* Reference Image Upload (Optional Conditioning) */}
          <div className="pt-2 border-t border-emerald-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 cursor-pointer hover:text-emerald-300">
                <Upload className="w-3 h-3" />
                <span>Reference Image (Optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleRefUpload}
                  className="hidden"
                />
              </label>
              {referenceFileName && (
                <span className="text-[10px] text-cyan-400 truncate max-w-[150px]">
                  {referenceFileName}
                </span>
              )}
            </div>
            {referenceImage && (
              <button
                onClick={() => {
                  setReferenceImage(null);
                  setReferenceFileName('');
                }}
                className="text-[10px] text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            )}
          </div>

          {/* Collapsible Negative Prompt */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowNegative(!showNegative)}
              className="text-[10px] text-emerald-600 hover:text-emerald-400 flex items-center gap-1"
            >
              <span>{showNegative ? '▼' : '▶'} Negative Prompt (Exclude elements)</span>
            </button>
            {showNegative && (
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="blurry, distorted anatomy, text artifacts, low quality, oversaturated"
                className="w-full mt-1.5 bg-black border border-emerald-900 rounded p-1.5 text-[11px] text-emerald-300"
              />
            )}
          </div>
        </div>

        {/* Aspect Ratio Picker */}
        <div className="bg-[#05080f] border border-emerald-900/80 rounded-lg p-3 space-y-2">
          <span className="text-xs font-bold text-emerald-300 block">
            📐 ASPECT RATIO
          </span>
          <div className="grid grid-cols-5 gap-1.5">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar.id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setAspectRatio(ar.id);
                }}
                className={`flex flex-col items-center justify-center p-2 rounded border transition-all cursor-pointer ${
                  aspectRatio === ar.id
                    ? 'bg-emerald-900/60 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'bg-black/40 border-emerald-950 hover:border-emerald-800 text-emerald-400'
                }`}
              >
                <span className="text-xs font-extrabold">{ar.ratio}</span>
                <span className="text-[9px] opacity-75">{ar.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Style Presets Grid */}
        <div className="bg-[#05080f] border border-emerald-900/80 rounded-lg p-3 space-y-2">
          <span className="text-xs font-bold text-emerald-300 block">
            🎨 VISUAL STYLE PRESETS
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {STYLE_PRESETS.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedStyle(st.id);
                }}
                className={`p-1.5 rounded border text-left flex flex-col transition-all cursor-pointer ${
                  selectedStyle === st.id
                    ? 'bg-emerald-900/60 border-emerald-400 text-white'
                    : 'bg-black/40 border-emerald-950 hover:border-emerald-800 text-emerald-400'
                }`}
              >
                <span className="text-sm">{st.icon}</span>
                <span className="text-[10px] font-bold truncate mt-0.5">{st.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={() => handleGenerate()}
          disabled={generating || !prompt.trim()}
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-950 disabled:text-emerald-700 text-black font-extrabold py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer transition-all active:scale-98 tracking-wider"
        >
          {generating ? (
            <>
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>GENERATING ARTWORK ({elapsedSeconds}s)...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>GENERATE IMAGE</span>
            </>
          )}
        </button>

        {errorMsg && (
          <div className="p-2.5 bg-red-950/40 border border-red-800 text-red-300 rounded text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span className="flex-1">{errorMsg}</span>
            <button
              onClick={() => handleGenerate()}
              className="text-[10px] bg-red-900/60 hover:bg-red-800 text-white px-2 py-0.5 rounded"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Right Column: Generation Results & Live Canvas Previews */}
      <div className="flex-1 flex flex-col gap-3 min-h-[350px]">
        {/* Results Header */}
        <div className="bg-[#05080f] border border-emerald-950 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-300">
              🖼️ STUDIO GENERATION GALLERY
            </span>
            <span className="text-[10px] text-emerald-600 bg-emerald-950/60 px-1.5 py-0.5 rounded">
              {generatedImages.length} results
            </span>
          </div>
          {generating && (
            <span className="text-[11px] text-emerald-400 animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Neural synthesis in progress ({elapsedSeconds}s)
            </span>
          )}
        </div>

        {/* Results Gallery Grid */}
        {generatedImages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 overflow-y-auto pr-1">
            {generatedImages.map((img) => (
              <div
                key={img.id}
                className="bg-[#05080f] border border-emerald-900/80 rounded-lg overflow-hidden flex flex-col shadow-[0_0_15px_rgba(0,0,0,0.8)] group"
              >
                {/* Image Container */}
                <div className="relative bg-black aspect-auto flex items-center justify-center overflow-hidden min-h-[220px]">
                  <img
                    src={img.url}
                    alt={img.prompt}
                    className="w-full h-auto max-h-[340px] object-contain group-hover:scale-[1.02] transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-emerald-400 border border-emerald-900">
                    {img.aspectRatio}
                  </div>
                  <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[9px] text-emerald-500 border border-emerald-950">
                    {img.model}
                  </div>
                </div>

                {/* Info & Prompt */}
                <div className="p-3 flex-1 flex flex-col justify-between gap-2.5 bg-[#080d17]">
                  <p className="text-xs text-white line-clamp-2 leading-relaxed">
                    &ldquo;{img.prompt}&rdquo;
                  </p>

                  {/* Actions Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-2 border-t border-emerald-950/80 text-[11px]">
                    <button
                      onClick={() => handleDownload(img)}
                      className="flex items-center justify-center gap-1 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 py-1.5 rounded cursor-pointer transition-colors"
                      title="Download image file"
                    >
                      <Download className="w-3 h-3 text-emerald-400" />
                      <span>Download</span>
                    </button>

                    <button
                      onClick={() => onOpenInDesignStudio(img.url, img.prompt, img.aspectRatio)}
                      className="flex items-center justify-center gap-1 bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 py-1.5 rounded cursor-pointer transition-colors"
                      title="Open in Design Studio Canvas"
                    >
                      <Layers className="w-3 h-3 text-cyan-400" />
                      <span>In Canvas</span>
                    </button>

                    <button
                      onClick={() => onSendToEditImage(img.url)}
                      className="flex items-center justify-center gap-1 bg-purple-950/70 hover:bg-purple-900 border border-purple-800 text-purple-300 py-1.5 rounded cursor-pointer transition-colors"
                      title="Send to Edit Image workspace"
                    >
                      <Edit className="w-3 h-3 text-purple-400" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => {
                        soundEngine.playClick();
                        setPrompt(img.prompt);
                        setAspectRatio(img.aspectRatio);
                      }}
                      className="flex items-center justify-center gap-1 bg-black/60 hover:bg-emerald-950 border border-emerald-900 text-emerald-400 py-1.5 rounded cursor-pointer transition-colors"
                      title="Reuse this prompt & settings"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reuse</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#05080f] border border-dashed border-emerald-950 rounded-lg p-6 text-center text-emerald-700 space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-900/60 flex items-center justify-center text-emerald-500">
              <ImageIcon className="w-8 h-8 opacity-60" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-400">Ready to Create</h3>
              <p className="text-xs text-emerald-600 max-w-sm mt-1">
                Enter your prompt and choose your visual style, aspect ratio, and model to generate ultra-high-resolution images.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
