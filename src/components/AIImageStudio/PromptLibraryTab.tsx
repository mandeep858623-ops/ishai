import React, { useState } from 'react';
import { PromptLibraryItem, AspectRatioType } from './types';
import {
  Bookmark,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
} from 'lucide-react';
import { soundEngine } from '../../utils/audio';

interface PromptLibraryTabProps {
  onUsePrompt: (prompt: string, style: string, aspectRatio: AspectRatioType) => void;
}

const CURATED_PROMPTS: PromptLibraryItem[] = [
  // Photorealistic Portraits
  {
    id: 'p-1',
    category: 'Portraits',
    title: 'Cinematic Golden Hour Portrait',
    prompt: 'A charismatic young explorer at golden hour, 35mm photography, natural bokeh, intricate skin texture, warm rim lighting, windblown hair, candid expression, 8k resolution',
    style: 'photorealistic',
    aspectRatio: '1:1',
    tags: ['portrait', 'golden hour', '35mm'],
  },
  {
    id: 'p-2',
    category: 'Portraits',
    title: 'Cyberpunk Neon Street Operative',
    prompt: 'Futuristic agent standing in neon-drenched Tokyo alleyway during rain, glowing cybernetic visor, reflective leather jacket, volumetric steam, anamorphic lens flare, sharp focus',
    style: 'cyberpunk',
    aspectRatio: '9:16',
    tags: ['cyberpunk', 'neon', 'rain'],
  },
  {
    id: 'p-3',
    category: 'Portraits',
    title: 'Renaissance Studio Oil Painting',
    prompt: 'Rembrandt style master portrait, dramatic chiaroscuro lighting, deep umber and gold tones, rich textured oil canvas brushstrokes, regal posture, museum quality',
    style: 'vintage',
    aspectRatio: '3:4',
    tags: ['oil painting', 'classic', 'chiaroscuro'],
  },

  // Sci-Fi & Cyberpunk
  {
    id: 'p-4',
    category: 'Sci-Fi & Cyber',
    title: 'Supersonic Hypercar Drift',
    prompt: 'Futuristic matte black hypercar drifting around mountain hairpin at dusk, glowing red aerodynamic vents, smoking tire vapor, wet asphalt reflections, high speed shutter',
    style: 'cinematic',
    aspectRatio: '16:9',
    tags: ['supercar', 'speed', 'cinematic'],
  },
  {
    id: 'p-5',
    category: 'Sci-Fi & Cyber',
    title: 'Orbiting Solar Ring Space Station',
    prompt: 'Massive ring-shaped orbital station overlooking planet Earth sunrise, solar panel arrays glinting in vacuum, starfield background, photorealistic scientific illustration',
    style: 'photorealistic',
    aspectRatio: '16:9',
    tags: ['space', 'station', 'earth'],
  },
  {
    id: 'p-6',
    category: 'Sci-Fi & Cyber',
    title: 'Bipedal Heavy Mech in Post-Apocalypse',
    prompt: 'Weathered combat mech warrior standing in misty overgrown industrial ruins, hydraulic pistons, moss growing on titanium armor, soft diffused daylight',
    style: '3d-render',
    aspectRatio: '16:9',
    tags: ['mech', 'robot', 'ruins'],
  },

  // Landscapes & Nature
  {
    id: 'p-7',
    category: 'Nature & Landscapes',
    title: 'Bioluminescent Giant Ocean Wave',
    prompt: 'Massive crystalline turquoise ocean wave curling in slow motion under starlit sky, glowing blue bioluminescent plankton within the water barrel, sea spray particles',
    style: 'photorealistic',
    aspectRatio: '16:9',
    tags: ['ocean', 'wave', 'bioluminescent'],
  },
  {
    id: 'p-8',
    category: 'Nature & Landscapes',
    title: 'Ethereal Mist Pine Forest Mountains',
    prompt: 'Aerial drone view flying through dense misty alpine pine valleys toward snow-capped jagged peaks, warm sunrise rays piercing low cloud fog, National Geographic quality',
    style: 'photorealistic',
    aspectRatio: '16:9',
    tags: ['mountains', 'forest', 'sunrise'],
  },

  // Commercial & Product
  {
    id: 'p-9',
    category: 'Commercial & Product',
    title: 'Luxury Matte Black Chronograph Watch',
    prompt: 'High-end luxury mechanical timepiece resting on dark slate stone with water droplet condensation, studio softbox lighting, macro 100mm lens, sapphire glass glint',
    style: 'photorealistic',
    aspectRatio: '1:1',
    tags: ['product', 'watch', 'luxury'],
  },
  {
    id: 'p-10',
    category: 'Commercial & Product',
    title: 'Artisan Pour-Over Coffee Splash',
    prompt: 'Pour-over coffee brewing in clear chemex flask, frozen droplets suspended in mid-air, steam rising, warm morning kitchen background, cinematic commercial photography',
    style: 'photorealistic',
    aspectRatio: '1:1',
    tags: ['coffee', 'beverage', 'commercial'],
  },

  // Posters & Graphic Art
  {
    id: 'p-11',
    category: 'Posters & Graphics',
    title: 'Modern Tech Expo Graphic Poster Art',
    prompt: 'Graphic design poster background art for annual AI robotics summit, clean minimalist composition, electric teal and obsidian dark gradient, subtle circuit traces',
    style: 'minimalist',
    aspectRatio: '3:4',
    tags: ['poster', 'expo', 'tech'],
  },
  {
    id: 'p-12',
    category: 'Posters & Graphics',
    title: 'Vibrant Music Festival Neon Poster',
    prompt: 'Electric summer music festival poster background, glowing psychedelic synth waves, palm tree silhouettes against purple and magenta gradient sky, retro 80s aesthetic',
    style: 'digital-art',
    aspectRatio: '3:4',
    tags: ['festival', 'music', 'synthwave'],
  },

  // Logos & Icons
  {
    id: 'p-13',
    category: 'Logos & Icons',
    title: 'Geometric Falcon Brand Mark',
    prompt: 'Modern minimalist vector logo of a soaring falcon, sharp origami geometric facets, glowing cyan and silver tones, clean centered icon on dark seamless background',
    style: 'vector',
    aspectRatio: '1:1',
    tags: ['logo', 'falcon', 'geometric'],
  },
  {
    id: 'p-14',
    category: 'Logos & Icons',
    title: 'Apex Energy Shield Emblem',
    prompt: 'Futuristic shield crest with quantum energy nucleus, sleek metallic chrome bevels, clean circular emblem mark, professional esports and tech branding',
    style: 'vector',
    aspectRatio: '1:1',
    tags: ['logo', 'shield', 'crest'],
  },
];

export const PromptLibraryTab: React.FC<PromptLibraryTabProps> = ({ onUsePrompt }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // User custom saved prompts in localStorage
  const [userPrompts, setUserPrompts] = useState<PromptLibraryItem[]>(() => {
    try {
      const saved = localStorage.getItem('SUPERAI_User_Prompts_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [newPromptText, setNewPromptText] = useState('');
  const [newPromptTitle, setNewPromptTitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const categories = ['All', 'User Saved', ...Array.from(new Set(CURATED_PROMPTS.map((p) => p.category)))];

  const handleCopy = (id: string, text: string) => {
    soundEngine.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveUserPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptText.trim()) return;
    soundEngine.playSuccess();
    const item: PromptLibraryItem = {
      id: `user-p-${Date.now()}`,
      category: 'User Saved',
      title: newPromptTitle || newPromptText.slice(0, 25),
      prompt: newPromptText.trim(),
      style: 'photorealistic',
      aspectRatio: '1:1',
      tags: ['custom'],
    };
    const next = [item, ...userPrompts];
    setUserPrompts(next);
    localStorage.setItem('SUPERAI_User_Prompts_v1', JSON.stringify(next));
    setNewPromptText('');
    setNewPromptTitle('');
    setShowAddForm(false);
  };

  const handleDeleteUserPrompt = (id: string) => {
    soundEngine.playClick();
    const next = userPrompts.filter((p) => p.id !== id);
    setUserPrompts(next);
    localStorage.setItem('SUPERAI_User_Prompts_v1', JSON.stringify(next));
  };

  const displayedPrompts =
    selectedCategory === 'All'
      ? [...userPrompts, ...CURATED_PROMPTS]
      : selectedCategory === 'User Saved'
      ? userPrompts
      : CURATED_PROMPTS.filter((p) => p.category === selectedCategory);

  return (
    <div className="flex flex-col gap-4 h-full font-mono text-emerald-400 overflow-y-auto pr-1">
      {/* Header & Categories Bar */}
      <div className="bg-[#05080f] border border-emerald-900/80 rounded-lg p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300">
              PROMPT LIBRARY &amp; TEMPLATES
            </span>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-[11px] bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 px-2.5 py-1 rounded flex items-center gap-1 font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>SAVE CUSTOM PROMPT</span>
          </button>
        </div>

        {/* Add User Prompt Form */}
        {showAddForm && (
          <form onSubmit={handleSaveUserPrompt} className="p-3 bg-black/60 border border-emerald-800 rounded-lg space-y-2 text-xs">
            <span className="font-bold text-white block">Save Prompt to Library:</span>
            <input
              type="text"
              placeholder="Title / Description..."
              value={newPromptTitle}
              onChange={(e) => setNewPromptTitle(e.target.value)}
              className="w-full bg-black border border-emerald-900 rounded p-1.5 text-white"
            />
            <textarea
              placeholder="Paste or write detailed prompt..."
              value={newPromptText}
              onChange={(e) => setNewPromptText(e.target.value)}
              rows={2}
              className="w-full bg-black border border-emerald-900 rounded p-1.5 text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-[10px] text-emerald-600 hover:text-emerald-400 px-2 py-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="text-[10px] bg-emerald-500 text-black font-bold px-3 py-1 rounded"
              >
                Save to Library
              </button>
            </div>
          </form>
        )}

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => {
                soundEngine.playClick();
                setSelectedCategory(cat);
              }}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'bg-black/60 border border-emerald-950 text-emerald-400 hover:border-emerald-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Prompts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {displayedPrompts.map((item) => (
          <div
            key={item.id}
            className="bg-[#05080f] border border-emerald-900/80 hover:border-emerald-700 rounded-lg p-3.5 flex flex-col justify-between gap-3 shadow-md"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-sans">
                  {item.title}
                </span>
                <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-900">
                  {item.category}
                </span>
              </div>

              <p className="text-xs text-emerald-300 leading-relaxed bg-[#020408] p-2 rounded border border-emerald-950 select-text">
                &ldquo;{item.prompt}&rdquo;
              </p>

              <div className="flex flex-wrap gap-1 text-[9px] text-emerald-600">
                <span>Aspect: {item.aspectRatio}</span>
                <span>• Style: {item.style}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-emerald-950 text-xs">
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(item.id, item.prompt)}
                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-200"
                  title="Copy Prompt text"
                >
                  {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                </button>

                {item.category === 'User Saved' && (
                  <button
                    onClick={() => handleDeleteUserPrompt(item.id)}
                    className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 ml-2"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  soundEngine.playSuccess();
                  onUsePrompt(item.prompt, item.style, item.aspectRatio);
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[11px] px-3 py-1 rounded flex items-center gap-1.5 cursor-pointer"
              >
                <span>Use Prompt</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
