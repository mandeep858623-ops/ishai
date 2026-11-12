import React, { useState } from 'react';
import {
  AspectRatioType,
  GeneratedStudioImage,
} from './types';
import {
  Sparkles,
  Layers,
  Wand2,
  Tv,
  FileText,
  BadgeCheck,
  Monitor,
  Share2,
  AlertCircle,
} from 'lucide-react';
import { soundEngine } from '../../utils/audio';

interface SpecializedModesTabProps {
  onLaunchInDesignStudio: (
    backgroundUrl: string,
    title: string,
    subtitle: string,
    mode: 'poster' | 'thumbnail' | 'logo' | 'wallpaper' | 'social',
    aspectRatio: AspectRatioType
  ) => void;
  onSaveToCreations: (item: GeneratedStudioImage) => void;
}

type ActiveMode = 'poster' | 'thumbnail' | 'logo' | 'wallpaper' | 'social';

export const SpecializedModesTab: React.FC<SpecializedModesTabProps> = ({
  onLaunchInDesignStudio,
  onSaveToCreations,
}) => {
  const [activeMode, setActiveMode] = useState<ActiveMode>('thumbnail');

  // Form parameters
  const [topic, setTopic] = useState('');
  const [heading, setHeading] = useState('');
  const [supportingText, setSupportingText] = useState('');
  const [category, setCategory] = useState('Technology');
  const [visualStyle, setVisualStyle] = useState('High Contrast Modern');
  const [colorPalette, setColorPalette] = useState('Neon Yellow & Dark Blue');
  const [deviceTarget, setDeviceTarget] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');
  const [socialPlatform, setSocialPlatform] = useState<'instagram_post' | 'story_reel' | 'banner'>('instagram_post');

  // Loading
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Defaults per mode
  const setupDefaultsForMode = (mode: ActiveMode) => {
    setActiveMode(mode);
    soundEngine.playClick();
    setErrorMsg(null);

    switch (mode) {
      case 'thumbnail':
        setTopic('I Built an AI Operating System in 24 Hours');
        setHeading('I BUILT AN AI OS!');
        setSupportingText('Mind-Blowing Results');
        setCategory('Technology');
        setVisualStyle('Cinematic High Contrast');
        setColorPalette('Vibrant Yellow & Red');
        break;

      case 'poster':
        setTopic('Inter-School Science & Tech Exhibition 2026');
        setHeading('ANNUAL TECH EXPO 2026');
        setSupportingText('Innovate the Future • Main Auditorium • 10:00 AM');
        setCategory('School & Education');
        setVisualStyle('Clean Geometric Modern');
        setColorPalette('Teal, Emerald & Dark Navy');
        break;

      case 'logo':
        setTopic('QuantumCore Neural Technologies');
        setHeading('QUANTUMCORE');
        setSupportingText('Intelligence Accelerated');
        setCategory('AI & Software');
        setVisualStyle('Minimalist Geometric Emblem');
        setColorPalette('Cyan, Violet & Carbon');
        break;

      case 'wallpaper':
        setTopic('Nebula Over Solitude Mountains');
        setHeading('NEBULA DRIFT');
        setSupportingText('8K Ultra HD Atmosphere');
        setCategory('Deep Space & Nature');
        setVisualStyle('Photorealistic Astrophotography');
        setColorPalette('Deep Violet & Starlight Gold');
        break;

      case 'social':
        setTopic('Summer Innovation Hackathon Announcement');
        setHeading('SUMMER HACKATHON');
        setSupportingText('Register Now • Prizes Worth $20,000');
        setCategory('Event Announcement');
        setVisualStyle('Trendy Gradient & Bold Typography');
        setColorPalette('Electric Pink & Cyber Cyan');
        break;
    }
  };

  // Launch generation & canvas initialization
  const handleCreateAndOpenCanvas = async () => {
    if (!topic.trim() || generating) return;
    soundEngine.playClick();
    setGenerating(true);
    setErrorMsg(null);

    let aspectRatio: AspectRatioType = '16:9';
    if (activeMode === 'poster') aspectRatio = '3:4';
    else if (activeMode === 'thumbnail') aspectRatio = '16:9';
    else if (activeMode === 'logo') aspectRatio = '1:1';
    else if (activeMode === 'wallpaper') {
      aspectRatio = deviceTarget === 'mobile' ? '9:16' : '16:9';
    } else if (activeMode === 'social') {
      aspectRatio = socialPlatform === 'story_reel' ? '9:16' : '1:1';
    }

    try {
      // 1. Get Design assist prompt
      const assistRes = await fetch('/api/ai/image-studio/design-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: activeMode,
          title: heading,
          subtitle: supportingText,
          category,
          style: visualStyle,
          palette: colorPalette,
          aspectRatio,
        }),
      });

      const assistData = await assistRes.json();
      const promptToGenerate = assistData.backgroundPrompt || `${topic}, ${visualStyle}, ${colorPalette}, high quality 8k`;

      // 2. Generate artwork background
      const genRes = await fetch('/api/ai/image-studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToGenerate,
          aspectRatio,
          style: 'none',
          model: 'gemini-3.1-flash-lite',
        }),
      });

      const genData = await genRes.json();
      if (!genData.images || genData.images.length === 0) {
        throw new Error('Could not generate artwork for this mode');
      }

      const generatedImg = genData.images[0];

      // Save to creations
      onSaveToCreations({
        ...generatedImg,
        type: activeMode,
      });

      soundEngine.playSuccess();

      // Launch in Design Studio canvas with layers
      onLaunchInDesignStudio(
        generatedImg.url,
        heading || assistData.title,
        supportingText || assistData.subtitle,
        activeMode,
        aspectRatio
      );
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Creation failed. Please try again.');
      soundEngine.playAlertBeep();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full font-mono text-emerald-400 overflow-y-auto pr-1">
      {/* Mode Selector Strip */}
      <div className="bg-[#05080f] border border-emerald-900/80 rounded-lg p-2 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto">
          {[
            { id: 'thumbnail', label: 'YouTube Thumbnail', icon: <Tv className="w-4 h-4 text-rose-400" />, desc: '16:9 • 1280×720' },
            { id: 'poster', label: 'Poster Maker', icon: <FileText className="w-4 h-4 text-emerald-400" />, desc: '3:4 • Events & School' },
            { id: 'logo', label: 'Logo Maker', icon: <BadgeCheck className="w-4 h-4 text-amber-400" />, desc: '1:1 • Vector Concept' },
            { id: 'wallpaper', label: 'Wallpaper Maker', icon: <Monitor className="w-4 h-4 text-cyan-400" />, desc: 'Desktop & Mobile' },
            { id: 'social', label: 'Social Media Design', icon: <Share2 className="w-4 h-4 text-purple-400" />, desc: 'Instagram & Posts' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setupDefaultsForMode(m.id as ActiveMode)}
              className={`flex items-center gap-2 px-3 py-2 rounded border text-xs cursor-pointer transition-all whitespace-nowrap ${
                activeMode === m.id
                  ? 'bg-emerald-900/70 border-emerald-400 text-white font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-black/40 border-emerald-950 hover:border-emerald-800 text-emerald-400'
              }`}
            >
              {m.icon}
              <div className="flex flex-col text-left">
                <span>{m.label}</span>
                <span className="text-[9px] opacity-70">{m.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Mode Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
        {/* Left Column: Topic & Form Parameters */}
        <div className="lg:col-span-2 bg-[#05080f] border border-emerald-900/80 rounded-lg p-4 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
            <span className="text-sm font-bold text-emerald-300 uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {activeMode === 'thumbnail' && 'YouTube Thumbnail Creator (1280 × 720)'}
              {activeMode === 'poster' && 'High-Impact Poster Maker (Editable Typography)'}
              {activeMode === 'logo' && 'Brand Identity & Logo Concept Maker'}
              {activeMode === 'wallpaper' && 'Ultra-HD Wallpaper Engine'}
              {activeMode === 'social' && 'Social Media Design & Graphics'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Topic Input */}
            <div>
              <label className="text-[11px] text-emerald-500 font-bold block mb-1">
                {activeMode === 'thumbnail' && 'Video Title / Topic Idea'}
                {activeMode === 'poster' && 'Poster Event / Campaign Topic'}
                {activeMode === 'logo' && 'Brand Name & Purpose'}
                {activeMode === 'wallpaper' && 'Wallpaper Theme & Subject'}
                {activeMode === 'social' && 'Social Post Topic'}
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Unbelievable Space Discovery, Robotics Championship, Apex Coffee"
                className="w-full bg-[#020408] border border-emerald-800 rounded p-2 text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Editable Heading Overlay */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-emerald-500 font-bold block mb-1">
                  Main Heading (Overlay Layer)
                </label>
                <input
                  type="text"
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  placeholder="BIG BOLD TEXT"
                  className="w-full bg-[#020408] border border-emerald-800 rounded p-2 text-white font-bold uppercase focus:outline-none focus:border-emerald-400"
                />
                <span className="text-[10px] text-emerald-600 block mt-0.5">
                  Placed as an editable layer on the canvas
                </span>
              </div>

              <div>
                <label className="text-[11px] text-emerald-500 font-bold block mb-1">
                  Supporting Text / Date / Subtitle
                </label>
                <input
                  type="text"
                  value={supportingText}
                  onChange={(e) => setSupportingText(e.target.value)}
                  placeholder="Subheading or details"
                  className="w-full bg-[#020408] border border-emerald-800 rounded p-2 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Category / Visual Style / Palette */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-emerald-500 font-bold block mb-1">
                  Category
                </label>
                {activeMode === 'thumbnail' ? (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-black border border-emerald-800 rounded p-2 text-emerald-300"
                  >
                    <option value="Gaming">Gaming</option>
                    <option value="Technology">Technology</option>
                    <option value="Educational">Educational</option>
                    <option value="Vlog">Vlog</option>
                    <option value="Documentary">Documentary</option>
                    <option value="Science">Science</option>
                    <option value="Product Review">Product Review</option>
                    <option value="Travel">Travel</option>
                  </select>
                ) : activeMode === 'poster' ? (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-black border border-emerald-800 rounded p-2 text-emerald-300"
                  >
                    <option value="School & Education">School & Education</option>
                    <option value="Competition">Competition</option>
                    <option value="Grand Event">Grand Event</option>
                    <option value="Awareness Campaign">Awareness Campaign</option>
                    <option value="Promotional">Promotional</option>
                    <option value="Festival">Festival</option>
                    <option value="Motivational">Motivational</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-black border border-emerald-800 rounded p-2 text-emerald-300"
                  />
                )}
              </div>

              <div>
                <label className="text-[11px] text-emerald-500 font-bold block mb-1">
                  Visual Style
                </label>
                <input
                  type="text"
                  value={visualStyle}
                  onChange={(e) => setVisualStyle(e.target.value)}
                  placeholder="e.g. Cinematic High Contrast, Minimalist"
                  className="w-full bg-black border border-emerald-800 rounded p-2 text-emerald-300"
                />
              </div>

              <div>
                <label className="text-[11px] text-emerald-500 font-bold block mb-1">
                  Color Palette
                </label>
                <input
                  type="text"
                  value={colorPalette}
                  onChange={(e) => setColorPalette(e.target.value)}
                  placeholder="e.g. Neon Yellow & Red, Cyan"
                  className="w-full bg-black border border-emerald-800 rounded p-2 text-emerald-300"
                />
              </div>
            </div>

            {/* Mode-Specific Sub-Options */}
            {activeMode === 'wallpaper' && (
              <div className="pt-2 border-t border-emerald-950 flex items-center gap-3">
                <span className="text-[11px] text-emerald-500 font-bold">Device Target:</span>
                <div className="flex gap-2">
                  {(['desktop', 'mobile', 'tablet'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDeviceTarget(d)}
                      className={`px-3 py-1 rounded text-xs border ${
                        deviceTarget === d ? 'bg-emerald-900 border-emerald-400 text-white font-bold' : 'bg-black border-emerald-950 text-emerald-500'
                      }`}
                    >
                      {d.toUpperCase()} ({d === 'mobile' ? '9:16' : '16:9'})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeMode === 'social' && (
              <div className="pt-2 border-t border-emerald-950 flex items-center gap-3">
                <span className="text-[11px] text-emerald-500 font-bold">Format:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSocialPlatform('instagram_post')}
                    className={`px-3 py-1 rounded text-xs border ${
                      socialPlatform === 'instagram_post' ? 'bg-emerald-900 border-emerald-400 text-white font-bold' : 'bg-black border-emerald-950 text-emerald-500'
                    }`}
                  >
                    Post (1:1 / 1080×1080)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSocialPlatform('story_reel')}
                    className={`px-3 py-1 rounded text-xs border ${
                      socialPlatform === 'story_reel' ? 'bg-emerald-900 border-emerald-400 text-white font-bold' : 'bg-black border-emerald-950 text-emerald-500'
                    }`}
                  >
                    Story / Reel (9:16 / 1080×1920)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Create Button */}
          <div className="pt-3 border-t border-emerald-950">
            <button
              onClick={handleCreateAndOpenCanvas}
              disabled={generating || !topic.trim()}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-950 disabled:text-emerald-700 text-black font-extrabold py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer tracking-wider"
            >
              {generating ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>SYNTHESIZING &amp; PREPARING CANVAS...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>GENERATE &amp; LAUNCH IN DESIGN STUDIO</span>
                </>
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-950/40 border border-red-800 text-red-300 rounded text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Right Column: Mode Overview & Benefits */}
        <div className="bg-[#05080f] border border-emerald-900/80 rounded-lg p-4 space-y-4 text-xs">
          <span className="font-bold text-emerald-300 block pb-2 border-b border-emerald-950">
            💡 MODE HIGHLIGHTS
          </span>

          <div className="space-y-3 text-emerald-400 leading-relaxed">
            {activeMode === 'thumbnail' && (
              <>
                <div className="bg-emerald-950/30 p-2.5 rounded border border-emerald-900/60">
                  <strong className="text-white block mb-1">Standard 16:9 Canvas (1280 × 720)</strong>
                  Configured to maximize YouTube Click-Through-Rate (CTR) with high-contrast text outlines and dramatic lighting.
                </div>
                <div className="bg-emerald-950/30 p-2.5 rounded border border-emerald-900/60">
                  <strong className="text-white block mb-1">Editable Typography Layer</strong>
                  Words won't suffer from AI spelling errors because your title is rendered as an interactive, fully editable text layer.
                </div>
              </>
            )}

            {activeMode === 'poster' && (
              <>
                <div className="bg-emerald-950/30 p-2.5 rounded border border-emerald-900/60">
                  <strong className="text-white block mb-1">3:4 Portrait Poster Layout</strong>
                  Tailored for school, competition, festival, and corporate events with clear visual hierarchy.
                </div>
                <div className="bg-emerald-950/30 p-2.5 rounded border border-emerald-900/60">
                  <strong className="text-white block mb-1">Negative Space Optimization</strong>
                  The generator reserves atmospheric space for dates, locations, and subheadings.
                </div>
              </>
            )}

            {activeMode === 'logo' && (
              <>
                <div className="bg-emerald-950/30 p-2.5 rounded border border-emerald-900/60">
                  <strong className="text-white block mb-1">Clean Vector / Emblem Style</strong>
                  Produces centered brand marks and modern geometric symbols ready for business applications.
                </div>
              </>
            )}

            {activeMode === 'wallpaper' && (
              <>
                <div className="bg-emerald-950/30 p-2.5 rounded border border-emerald-900/60">
                  <strong className="text-white block mb-1">Zero Clutter Backgrounds</strong>
                  Breathtaking artistic landscapes, cyberpunk skylines, and cosmic vistas scaled to your device.
                </div>
              </>
            )}

            {activeMode === 'social' && (
              <>
                <div className="bg-emerald-950/30 p-2.5 rounded border border-emerald-900/60">
                  <strong className="text-white block mb-1">Pixel-Perfect Social Formats</strong>
                  Instantly prepares 1080×1080 posts or 1080×1920 stories/reels with engaging badges.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
