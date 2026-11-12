import React, { useState } from 'react';
import { NewsPreferences, NEWS_CATEGORIES } from './NewsTypes';
import { X, Sliders, Check, Globe, Sparkles, Volume2, LayoutGrid, LayoutList } from 'lucide-react';

interface NewsPreferencesModalProps {
  preferences: NewsPreferences;
  onSavePreferences: (prefs: NewsPreferences) => void;
  onClose: () => void;
}

export const NewsPreferencesModal: React.FC<NewsPreferencesModalProps> = ({
  preferences,
  onSavePreferences,
  onClose,
}) => {
  const [favoriteTopics, setFavoriteTopics] = useState<string[]>(preferences.favoriteTopics || []);
  const [region, setRegion] = useState<string>(preferences.region || 'US');
  const [defaultLayout, setDefaultLayout] = useState<'card' | 'compact'>(preferences.defaultLayout || 'card');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(preferences.playbackSpeed || 1);
  const [readingTextSize, setReadingTextSize] = useState<'sm' | 'base' | 'lg'>(preferences.readingTextSize || 'base');

  const toggleTopic = (categoryTitle: string) => {
    if (favoriteTopics.includes(categoryTitle)) {
      setFavoriteTopics(favoriteTopics.filter((t) => t !== categoryTitle));
    } else {
      setFavoriteTopics([...favoriteTopics, categoryTitle]);
    }
  };

  const handleSave = () => {
    onSavePreferences({
      ...preferences,
      favoriteTopics,
      region,
      defaultLayout,
      playbackSpeed,
      readingTextSize,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-slate-100 text-lg">News Personalization & Preferences</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 text-sm">
          {/* Favorite Topics Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> Preferred News Topics ({favoriteTopics.length} Selected)
              </label>
              <button
                onClick={() => setFavoriteTopics(NEWS_CATEGORIES.map((c) => c.title))}
                className="text-xs text-blue-400 hover:underline"
              >
                Select All
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Selected topics will be prioritized in your feed and Daily AI Briefing.
            </p>

            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              {NEWS_CATEGORIES.map((cat) => {
                const isSelected = favoriteTopics.includes(cat.title);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleTopic(cat.title)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.title}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Region */}
          <div className="space-y-3">
            <label className="font-semibold text-slate-100 text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" /> Default Region / Edition
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { code: 'US', label: '🇺🇸 United States' },
                { code: 'IN', label: '🇮🇳 India' },
                { code: 'GB', label: '🇬🇧 United Kingdom' },
                { code: 'GLOBAL', label: '🌐 Global News' },
              ].map((r) => (
                <button
                  key={r.code}
                  onClick={() => setRegion(r.code)}
                  className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    region === r.code
                      ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                      : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Layout & Reading Mode */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-semibold text-slate-100 text-xs">Default Card Layout</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDefaultLayout('card')}
                  className={`flex-1 p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                    defaultLayout === 'card'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                      : 'border-slate-800 bg-slate-800/40 text-slate-400'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" /> Cards
                </button>
                <button
                  onClick={() => setDefaultLayout('compact')}
                  className={`flex-1 p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                    defaultLayout === 'compact'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                      : 'border-slate-800 bg-slate-800/40 text-slate-400'
                  }`}
                >
                  <LayoutList className="w-4 h-4" /> Compact
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-slate-100 text-xs">Reading Text Size</label>
              <div className="flex gap-2">
                {[
                  { size: 'sm', label: 'A- Small' },
                  { size: 'base', label: 'A Medium' },
                  { size: 'lg', label: 'A+ Large' },
                ].map((s) => (
                  <button
                    key={s.size}
                    onClick={() => setReadingTextSize(s.size as any)}
                    className={`flex-1 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      readingTextSize === s.size
                        ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Speech Playback Speed */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-100 text-xs flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" /> Audio Briefing Playback Speed ({playbackSpeed}x)
            </label>
            <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              {[0.8, 1, 1.25, 1.5, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    playbackSpeed === spd
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
