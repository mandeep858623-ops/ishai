import React, { useState, useEffect } from 'react';
import { ModalWrapper } from '../Modals';
import {
  StudioTab,
  GeneratedStudioImage,
  AspectRatioType,
  CanvasProject,
} from './types';
import { CreateTab } from './CreateTab';
import { EditImageTab } from './EditImageTab';
import { CanvasEditor } from './CanvasEditor';
import { SpecializedModesTab } from './SpecializedModesTab';
import { MyCreationsTab } from './MyCreationsTab';
import { PromptLibraryTab } from './PromptLibraryTab';
import { SettingsTab } from './SettingsTab';
import {
  Sparkles,
  Edit,
  Layers,
  Wand2,
  FolderOpen,
  Bookmark,
  Sliders,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { soundEngine, speakText } from '../../utils/audio';

interface AIImageStudioModalProps {
  onClose: () => void;
  onLog: (text: string, tag: string) => void;
  voiceGender?: 'Male' | 'Female';
  audioActive?: boolean;
}

const STORAGE_KEY_CREATIONS = 'SUPERAI_Studio_Creations_v1';

export const AIImageStudioModal: React.FC<AIImageStudioModalProps> = ({
  onClose,
  onLog,
  voiceGender = 'Male',
  audioActive = true,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('create');
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Persistent creations store
  const [creations, setCreations] = useState<GeneratedStudioImage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CREATIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // State passed to Design Studio
  const [canvasBgUrl, setCanvasBgUrl] = useState<string | undefined>(undefined);
  const [canvasTitle, setCanvasTitle] = useState<string | undefined>(undefined);
  const [canvasSubtitle, setCanvasSubtitle] = useState<string | undefined>(undefined);
  const [canvasMode, setCanvasMode] = useState<'poster' | 'thumbnail' | 'logo' | 'wallpaper' | 'social' | 'custom'>('thumbnail');
  const [canvasAspectRatio, setCanvasAspectRatio] = useState<AspectRatioType>('16:9');

  // State passed to Edit Image tab
  const [imageToEdit, setImageToEdit] = useState<string | undefined>(undefined);

  // Prompt passed to Create tab
  const [prefilledPrompt, setPrefilledPrompt] = useState<string | undefined>(undefined);

  const saveCreation = (item: GeneratedStudioImage) => {
    setCreations((prev) => {
      // Avoid duplicate IDs
      const filtered = prev.filter((c) => c.id !== item.id);
      const next = [item, ...filtered];
      try {
        localStorage.setItem(STORAGE_KEY_CREATIONS, JSON.stringify(next.slice(0, 50)));
      } catch (e) {
        console.warn('Storage limit reached, truncating:', e);
      }
      return next;
    });
    onLog(`[AI Image Studio] Saved creation "${item.prompt.slice(0, 30)}" to My Creations.`, 'STUDIO');
  };

  const deleteCreation = (id: string) => {
    setCreations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      localStorage.setItem(STORAGE_KEY_CREATIONS, JSON.stringify(next));
      return next;
    });
    onLog('[AI Image Studio] Removed item from My Creations.', 'STUDIO');
  };

  // Navigations between tabs
  const handleOpenInDesignStudio = (
    imageUrl: string,
    prompt: string,
    ratio: AspectRatioType = '16:9'
  ) => {
    soundEngine.playClick();
    setCanvasBgUrl(imageUrl);
    setCanvasTitle(prompt.slice(0, 40).toUpperCase());
    setCanvasSubtitle('Studio Composition');
    setCanvasMode('custom');
    setCanvasAspectRatio(ratio);
    setActiveTab('design');
    onLog(`[AI Image Studio] Transferred artwork to Design Studio canvas.`, 'STUDIO');
  };

  const handleLaunchModeInCanvas = (
    bgUrl: string,
    title: string,
    subtitle: string,
    mode: 'poster' | 'thumbnail' | 'logo' | 'wallpaper' | 'social',
    aspectRatio: AspectRatioType
  ) => {
    soundEngine.playClick();
    setCanvasBgUrl(bgUrl);
    setCanvasTitle(title);
    setCanvasSubtitle(subtitle);
    setCanvasMode(mode);
    setCanvasAspectRatio(aspectRatio);
    setActiveTab('design');
    onLog(`[AI Image Studio] Launched ${mode.toUpperCase()} in Design Studio with interactive layers.`, 'STUDIO');
  };

  const handleSendToEditImage = (imageUrl: string) => {
    soundEngine.playClick();
    setImageToEdit(imageUrl);
    setActiveTab('edit');
    onLog(`[AI Image Studio] Opened image in Edit Image workspace.`, 'STUDIO');
  };

  const handleUsePromptFromLibrary = (promptText: string, style: string, ratio: AspectRatioType) => {
    soundEngine.playClick();
    setPrefilledPrompt(promptText);
    setActiveTab('create');
    onLog(`[AI Image Studio] Loaded template prompt from Library.`, 'STUDIO');
  };

  const TABS = [
    { id: 'create', label: '1. Create', icon: <Sparkles className="w-3.5 h-3.5" />, desc: 'Text-to-Image' },
    { id: 'edit', label: '2. Edit Image', icon: <Edit className="w-3.5 h-3.5" />, desc: 'Condition & Filter' },
    { id: 'design', label: '3. Design Studio', icon: <Layers className="w-3.5 h-3.5" />, desc: 'Canvas & Layers' },
    { id: 'modes', label: '4. Specialised Modes', icon: <Wand2 className="w-3.5 h-3.5" />, desc: 'Poster, Thumbnails, Logo' },
    { id: 'creations', label: '5. My Creations', icon: <FolderOpen className="w-3.5 h-3.5" />, desc: `Saved (${creations.length})` },
    { id: 'prompts', label: '6. Prompt Library', icon: <Bookmark className="w-3.5 h-3.5" />, desc: 'Templates' },
    { id: 'settings', label: '7. Settings', icon: <Sliders className="w-3.5 h-3.5" />, desc: 'Configs' },
  ];

  return (
    <ModalWrapper
      title="🎨 AI IMAGE STUDIO — GENERATION, EDITING & DESIGN"
      onClose={onClose}
    >
      <div
        className={`flex flex-col font-mono text-emerald-400 ${
          isFullScreen ? 'h-[88vh]' : 'h-[620px] max-h-[82vh]'
        }`}
      >
        {/* Studio Subheader Navigation Tabs */}
        <div className="bg-[#05080f] border-b border-emerald-950 px-2 py-1.5 flex items-center justify-between gap-1 overflow-x-auto shrink-0 scrollbar-none">
          <div className="flex items-center gap-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundEngine.playClick();
                    setActiveTab(tab.id as StudioTab);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : 'hover:bg-emerald-950/70 text-emerald-400 hover:text-emerald-200'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1 rounded text-emerald-500 hover:text-emerald-300 hover:bg-emerald-950"
              title={isFullScreen ? 'Exit Full Screen' : 'Expand Full Screen'}
            >
              {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-3 overflow-hidden bg-black/50">
          {activeTab === 'create' && (
            <CreateTab
              onOpenInDesignStudio={handleOpenInDesignStudio}
              onSendToEditImage={handleSendToEditImage}
              onSaveToCreations={saveCreation}
              recentCreations={creations}
            />
          )}

          {activeTab === 'edit' && (
            <EditImageTab
              initialImageUrl={imageToEdit}
              onOpenInDesignStudio={(url, prompt) => handleOpenInDesignStudio(url, prompt, '1:1')}
              onSaveToCreations={saveCreation}
            />
          )}

          {activeTab === 'design' && (
            <CanvasEditor
              initialBackgroundUrl={canvasBgUrl}
              initialTitle={canvasTitle}
              initialSubtitle={canvasSubtitle}
              initialMode={canvasMode}
              aspectRatio={canvasAspectRatio}
              onSaveToCreations={(proj, exportedUrl) => {
                saveCreation({
                  id: proj.id,
                  url: exportedUrl,
                  prompt: proj.name,
                  enhancedPrompt: `Canvas Project with ${proj.layers.length} layers`,
                  aspectRatio: proj.aspectRatio,
                  model: 'design-studio-compositor',
                  timestamp: proj.updatedAt,
                  type: 'canvas_design',
                  canvasData: proj,
                });
              }}
            />
          )}

          {activeTab === 'modes' && (
            <SpecializedModesTab
              onLaunchInDesignStudio={handleLaunchModeInCanvas}
              onSaveToCreations={saveCreation}
            />
          )}

          {activeTab === 'creations' && (
            <MyCreationsTab
              creations={creations}
              onOpenInDesignStudio={handleOpenInDesignStudio}
              onSendToEditImage={handleSendToEditImage}
              onDeleteCreation={deleteCreation}
            />
          )}

          {activeTab === 'prompts' && (
            <PromptLibraryTab onUsePrompt={handleUsePromptFromLibrary} />
          )}

          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </ModalWrapper>
  );
};
