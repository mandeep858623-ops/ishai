import React, { useState } from 'react';
import { ModalWrapper } from './Modals';
import { soundEngine, speakText } from '../utils/audio';

interface GeneratedImage {
  id: string;
  originalPrompt: string;
  enhancedPrompt: string;
  imageUrl: string;
  directUrl?: string;
  timestamp: string;
  isRealPhoto?: boolean;
}

interface ImageCreatorModalProps {
  onClose: () => void;
  onLog: (text: string, tag: string) => void;
  voiceGender: 'Male' | 'Female';
  audioActive: boolean;
}

const PRESETS = [
  'bear',
  'tiger',
  'ferrari sports car',
  'cyberpunk city at night',
  'golden retriever puppy',
  'astronaut in space',
  'superhero flying over skyline',
  'tropical beach sunset',
];

export const ImageCreatorModal: React.FC<ImageCreatorModalProps> = ({
  onClose,
  onLog,
  voiceGender,
  audioActive,
}) => {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [fullScreen, setFullScreen] = useState(false);
  const [imgLoadError, setImgLoadError] = useState(false);

  const handleGenerate = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = (customQuery || prompt).trim();
    if (!query || generating) return;

    soundEngine.playClick();
    setGenerating(true);
    setImgLoadError(false);
    onLog(`[AI_IMAGE_CREATOR]: Synthesizing image for: "${query}" (100% Free)...`, 'INTELLIGENCE');

    try {
      const res = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const imageUrl = data.imageUrl || data.directUrl;

      const item: GeneratedImage = {
        id: `art-${Date.now()}`,
        originalPrompt: query,
        enhancedPrompt: data.enhancedPrompt || query,
        imageUrl,
        directUrl: data.directUrl,
        timestamp: new Date().toLocaleTimeString(),
        isRealPhoto: data.isRealPhoto,
      };

      setCurrentImage(item);
      setHistory((prev) => [item, ...prev]);
      setGenerating(false);
      soundEngine.playSuccess();
      onLog(`✓ Image of "${query}" generated successfully (100% free).`, 'SYSTEM');

      if (audioActive) {
        speakText(`Here is the image of ${query}.`, voiceGender);
      }
    } catch (err: any) {
      console.error(err);
      setGenerating(false);
      soundEngine.playAlertBeep();
      onLog(`[-] Could not generate picture: ${err.message || 'Network error'}`, 'ERROR');
    }
  };

  const handleImageError = () => {
    if (currentImage && currentImage.directUrl && currentImage.imageUrl !== currentImage.directUrl) {
      setCurrentImage({
        ...currentImage,
        imageUrl: currentImage.directUrl,
      });
    } else {
      setImgLoadError(true);
    }
  };

  const handleDownload = () => {
    if (!currentImage) return;
    soundEngine.playClick();
    const a = document.createElement('a');
    a.href = currentImage.imageUrl;
    a.download = `SuperAI_${currentImage.originalPrompt.replace(/[^a-z0-9]/gi, '_')}.jpg`;
    a.target = '_blank';
    a.click();
    soundEngine.playSuccess();
  };

  return (
    <ModalWrapper title="🎨 100% FREE AI IMAGE CREATOR" onClose={onClose}>
      <div className="flex flex-col max-h-[580px] font-mono text-emerald-400">
        {/* Free Banner */}
        <div className="bg-emerald-950/40 border border-emerald-800/80 px-2.5 py-1 rounded mb-2.5 flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            100% FREE AI IMAGE CREATION · UNLIMITED
          </span>
          <span className="text-emerald-500 text-[10px]">ULTRA-FAST SPEED</span>
        </div>

        {/* Popular Preset chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 mb-2.5 border-b border-emerald-950 text-[10px] scrollbar-none items-center">
          <span className="text-emerald-600 whitespace-nowrap">Presets:</span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              disabled={generating}
              onClick={() => {
                setPrompt(p);
                handleGenerate(undefined, p);
              }}
              className="bg-black border border-emerald-900/80 hover:border-emerald-500 hover:bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded whitespace-nowrap transition-colors text-[10px] cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Prompt Input Form */}
        <form onSubmit={(e) => handleGenerate(e)} className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Type any picture (e.g. bear, tiger, sports car, cyberpunk city)..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={generating}
            autoFocus
            className="flex-1 bg-black border border-emerald-800 focus:border-emerald-400 text-xs text-emerald-300 px-3 py-2 rounded focus:outline-none placeholder:text-emerald-800 font-mono"
          />
          <button
            type="submit"
            disabled={generating || !prompt.trim()}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-extrabold text-xs px-5 py-2 rounded transition-colors whitespace-nowrap cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            {generating ? 'FETCHING...' : '⚡ MAKE PICTURE'}
          </button>
        </form>

        {/* Image Display Area */}
        <div className="flex-1 bg-black/95 border border-emerald-900 rounded p-2 flex flex-col items-center justify-center min-h-[320px] overflow-hidden relative">
          {generating ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
              <div className="text-xs text-emerald-300 font-bold tracking-wider animate-pulse text-center">
                GENERATING PICTURE FREE OF CHARGE...
              </div>
              <div className="text-[11px] text-emerald-600">
                Fetching high-resolution AI imagery...
              </div>
            </div>
          ) : currentImage && !imgLoadError ? (
            <div className="w-full flex flex-col items-center">
              <div className="relative group max-w-[420px] w-full flex justify-center bg-black/80 rounded border border-emerald-800 overflow-hidden">
                <img
                  src={currentImage.imageUrl}
                  alt={currentImage.originalPrompt}
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                  className="max-h-[320px] w-auto max-w-full object-contain rounded shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all"
                />
                <button
                  onClick={() => setFullScreen(true)}
                  className="absolute top-2 right-2 bg-black/80 hover:bg-emerald-500 hover:text-black border border-emerald-600 text-emerald-300 text-[10px] font-bold px-2 py-1 rounded transition-colors"
                >
                  🔍 EXPAND
                </button>
              </div>

              {/* Meta details & download */}
              <div className="w-full flex flex-wrap justify-between items-center mt-3 pt-2 border-t border-emerald-950 text-xs px-2 gap-2">
                <div className="truncate max-w-[280px]">
                  <span className="text-emerald-500">Image of: </span>
                  <strong className="text-emerald-300 font-bold capitalize">{currentImage.originalPrompt}</strong>
                </div>
                <div className="flex gap-2">
                  <a
                    href={currentImage.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-emerald-800 hover:bg-emerald-950 text-emerald-400 px-2 py-1 rounded text-[11px]"
                  >
                    VIEW LINK
                  </a>
                  <button
                    onClick={handleDownload}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-3 py-1 rounded text-[11px] transition-colors"
                  >
                    ↓ DOWNLOAD
                  </button>
                </div>
              </div>

              <div className="w-full mt-1 px-2 text-[10px] text-emerald-700 truncate">
                {currentImage.enhancedPrompt}
              </div>
            </div>
          ) : imgLoadError ? (
            <div className="text-center text-xs text-red-400 py-10 space-y-2">
              <div className="text-2xl">⚠️</div>
              <div>Image transfer interrupted by connection.</div>
              <button
                onClick={() => handleGenerate(undefined, currentImage?.originalPrompt || prompt)}
                className="bg-emerald-500 text-black font-bold px-4 py-1 rounded text-xs hover:bg-emerald-400 mt-2"
              >
                RELOAD IMAGE
              </button>
            </div>
          ) : (
            <div className="text-center text-xs text-emerald-600 py-12 space-y-2">
              <div className="text-3xl">🐻 🏎️ 🐅 🚀</div>
              <div className="font-bold text-emerald-400 text-sm">Free AI Picture Generator</div>
              <div>Type any subject like <code className="text-emerald-300">bear</code>, <code className="text-emerald-300">tiger</code>, or <code className="text-emerald-300">ferrari</code> and tap <strong>MAKE PICTURE</strong>.</div>
              <div className="text-[11px] text-emerald-500 mt-1 font-semibold">
                ✓ 100% Free · No payment or account needed.
              </div>
            </div>
          )}
        </div>

        {/* Gallery of recent creations */}
        {history.length > 1 && (
          <div className="mt-2 pt-2 border-t border-emerald-950 flex items-center gap-2 overflow-x-auto text-[10px]">
            <span className="text-emerald-600 whitespace-nowrap font-bold">Recent:</span>
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentImage(item);
                  setImgLoadError(false);
                }}
                className={`border p-0.5 rounded overflow-hidden shrink-0 transition-all ${
                  currentImage?.id === item.id ? 'border-emerald-400 ring-1 ring-emerald-500' : 'border-emerald-900 opacity-60 hover:opacity-100'
                }`}
                title={item.originalPrompt}
              >
                <img src={item.imageUrl} alt={item.originalPrompt} referrerPolicy="no-referrer" className="w-9 h-9 object-cover rounded" />
              </button>
            ))}
          </div>
        )}

        {/* Fullscreen Modal View */}
        {fullScreen && currentImage && (
          <div
            onClick={() => setFullScreen(false)}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 cursor-pointer"
          >
            <div className="max-w-4xl max-h-[85vh] overflow-hidden rounded-lg border border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.5)]">
              <img src={currentImage.imageUrl} alt={currentImage.originalPrompt} referrerPolicy="no-referrer" className="max-h-[80vh] w-auto object-contain" />
            </div>
            <div className="text-xs text-emerald-400 mt-3 font-mono">
              [ CLICK ANYWHERE TO CLOSE FULLSCREEN ]
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};
