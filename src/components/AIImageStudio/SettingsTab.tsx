import React, { useState, useEffect } from 'react';
import { Sliders, Cpu, HardDrive, Check, Volume2, Shield } from 'lucide-react';
import { soundEngine } from '../../utils/audio';

export interface StudioSettings {
  defaultModel: string;
  defaultAspectRatio: string;
  defaultFormat: 'png' | 'jpeg' | 'webp';
  defaultScale: number;
  autoSaveToCreations: boolean;
  watermark: boolean;
  soundEffects: boolean;
}

const SETTINGS_KEY = 'SUPERAI_ImageStudio_Settings_v1';

export const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<StudioSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      defaultModel: 'gemini-3.1-flash-lite',
      defaultAspectRatio: '1:1',
      defaultFormat: 'png',
      defaultScale: 2,
      autoSaveToCreations: true,
      watermark: false,
      soundEffects: true,
    };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const updateSetting = <K extends keyof StudioSettings>(key: K, val: StudioSettings[K]) => {
    soundEngine.playClick();
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto h-full font-mono text-emerald-400 overflow-y-auto pr-1">
      <div className="bg-[#05080f] border border-emerald-900/80 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
          <span className="text-sm font-bold text-emerald-300 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            AI IMAGE STUDIO SETTINGS
          </span>
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>

        {/* Model Defaults */}
        <div className="space-y-2 text-xs">
          <label className="font-bold text-white block">Default Neural Generation Model</label>
          <select
            value={settings.defaultModel}
            onChange={(e) => updateSetting('defaultModel', e.target.value)}
            className="w-full bg-black border border-emerald-800 rounded p-2 text-emerald-300"
          >
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (High Speed &amp; Multimodal)</option>
            <option value="gemini-nano-banana-2.1">gemini-nano-banana-2.1 (Ultra-HD 1K-4K Support)</option>
          </select>
          <span className="text-[10px] text-emerald-600 block">
            Calls configured Gemini image models server-side via Google GenAI SDK.
          </span>
        </div>

        {/* Default Aspect Ratio */}
        <div className="space-y-2 text-xs pt-2 border-t border-emerald-950">
          <label className="font-bold text-white block">Default Aspect Ratio</label>
          <select
            value={settings.defaultAspectRatio}
            onChange={(e) => updateSetting('defaultAspectRatio', e.target.value)}
            className="w-full bg-black border border-emerald-800 rounded p-2 text-emerald-300"
          >
            <option value="1:1">1:1 (Square - Instagram / Avatar)</option>
            <option value="16:9">16:9 (Landscape - YouTube / Wallpaper)</option>
            <option value="9:16">9:16 (Portrait - TikTok / Reels / Stories)</option>
            <option value="3:4">3:4 (Poster / Print Document)</option>
            <option value="4:3">4:3 (Classic Display Standard)</option>
          </select>
        </div>

        {/* Export Format */}
        <div className="space-y-2 text-xs pt-2 border-t border-emerald-950">
          <label className="font-bold text-white block">Default Export File Format</label>
          <div className="flex gap-3">
            {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => updateSetting('defaultFormat', fmt)}
                className={`flex-1 py-2 rounded text-xs uppercase font-bold border transition-colors ${
                  settings.defaultFormat === fmt
                    ? 'bg-emerald-900 border-emerald-400 text-white'
                    : 'bg-black/60 border-emerald-950 text-emerald-400'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas Resolution Scale */}
        <div className="space-y-2 text-xs pt-2 border-t border-emerald-950">
          <label className="font-bold text-white block">Canvas Rasterization Export Scale</label>
          <div className="flex gap-3">
            {[
              { scale: 1, label: '1x Standard (Fast)' },
              { scale: 2, label: '2x High-DPI / Retina (Sharp)' },
              { scale: 4, label: '4x Ultra-HD 4K (Print Ready)' },
            ].map((opt) => (
              <button
                key={opt.scale}
                onClick={() => updateSetting('defaultScale', opt.scale)}
                className={`flex-1 py-2 rounded text-xs font-bold border transition-colors ${
                  settings.defaultScale === opt.scale
                    ? 'bg-emerald-900 border-emerald-400 text-white'
                    : 'bg-black/60 border-emerald-950 text-emerald-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="pt-2 border-t border-emerald-950 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">Auto-Save to My Creations</span>
              <span className="text-[10px] text-emerald-600">
                Automatically keep generated and edited designs in your workspace
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSaveToCreations}
              onChange={(e) => updateSetting('autoSaveToCreations', e.target.checked)}
              className="w-4 h-4 accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">Studio Sound Effects</span>
              <span className="text-[10px] text-emerald-600">
                Audio cues for generation complete, click, and export
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.soundEffects}
              onChange={(e) => updateSetting('soundEffects', e.target.checked)}
              className="w-4 h-4 accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
