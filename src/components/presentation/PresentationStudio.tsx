import React, { useState, useEffect, useCallback } from 'react';
import { SlideData, SlideElement, SlideLayout, PPTTheme, PresentationProject } from './types';
import { THEME_CONFIGS, ThemeColors } from './themeConfig';
import { generateLayoutElements } from './layoutDefaults';
import { 
  exportStudioPresentationToPptx, 
  exportStudioPresentationToPdf, 
  triggerFileDownload 
} from './PptxStudioExporter';
import { SlideCanvas } from './SlideCanvas';
import { SlideThumbnails } from './SlideThumbnails';
import { TopToolbar } from './TopToolbar';
import { SlidePropertiesPanel } from './SlidePropertiesPanel';
import { SlideshowModal } from './SlideshowModal';
import { AISlideAssistantModal } from './AISlideAssistantModal';
import { soundEngine } from '../../utils/audio';
import { 
  Sparkles, 
  Wand2, 
  Image as ImageIcon, 
  RotateCw, 
  Type, 
  Columns, 
  Layers as LayersIcon, 
  CheckCircle2, 
  RefreshCw, 
  Palette, 
  HelpCircle,
  Lightbulb
} from 'lucide-react';

const STORAGE_KEY_SAVED_DECKS = 'SUPERAI_PPT_Studio_Projects_v2';

interface PresentationStudioProps {
  initialTitle?: string;
  initialSlides?: SlideData[];
  initialTheme?: PPTTheme;
  onClose?: () => void;
  onLog?: (text: string, tag: string) => void;
}

export const PresentationStudio: React.FC<PresentationStudioProps> = ({
  initialTitle = 'Executive Presentation',
  initialSlides,
  initialTheme = 'emerald',
  onClose,
  onLog,
}) => {
  // Title & Theme
  const [title, setTitle] = useState(initialTitle);
  const [theme, setTheme] = useState<PPTTheme>(initialTheme);

  // Initialize slides with synthesized elements if not present
  const initializeSlides = useCallback(
    (rawSlides: SlideData[], currentTheme: PPTTheme): SlideData[] => {
      const themeConf = THEME_CONFIGS[currentTheme] || THEME_CONFIGS.emerald;
      return rawSlides.map((s, idx) => {
        const layout: SlideLayout =
          s.layout ||
          (idx === 0
            ? 'title'
            : idx === rawSlides.length - 1
            ? 'conclusion'
            : 'content');
        const enriched: SlideData = {
          ...s,
          id: s.id || `slide-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          layout,
          categoryTag: s.categoryTag || (idx === 0 ? 'OVERVIEW' : `SECTION 0${idx}`),
          bulletPoints: s.bulletPoints || ['Key strategic point', 'Measurable milestone'],
        };

        if (!enriched.elements || enriched.elements.length === 0) {
          enriched.elements = generateLayoutElements(enriched, themeConf);
        }
        return enriched;
      });
    },
    []
  );

  // Base slides state
  const [slides, setSlides] = useState<SlideData[]>(() => {
    if (initialSlides && initialSlides.length > 0) {
      const themeConf = THEME_CONFIGS[initialTheme] || THEME_CONFIGS.emerald;
      return initialSlides.map((s, idx) => {
        const layout = s.layout || (idx === 0 ? 'title' : 'content');
        const slideItem = { ...s, id: s.id || `slide-${Date.now()}-${idx}`, layout };
        if (!slideItem.elements || slideItem.elements.length === 0) {
          slideItem.elements = generateLayoutElements(slideItem, themeConf);
        }
        return slideItem;
      });
    }

    // Default starter slide deck if opened empty
    const themeConf = THEME_CONFIGS[initialTheme] || THEME_CONFIGS.emerald;
    const starterTitleSlide: SlideData = {
      id: `slide-${Date.now()}-0`,
      layout: 'title',
      categoryTag: 'EXECUTIVE BRIEFING',
      title: initialTitle,
      subtitle: 'Comprehensive Strategy, Roadmap & Action Plan',
      bulletPoints: ['Market Opportunity', 'Core Methodology', 'Target Impact'],
      speakerNotes: 'Welcome attendees, set expectations, and introduce the presentation agenda.',
    };
    starterTitleSlide.elements = generateLayoutElements(starterTitleSlide, themeConf);

    const starterContentSlide: SlideData = {
      id: `slide-${Date.now()}-1`,
      layout: 'content',
      categoryTag: 'STRATEGIC FOUNDATION',
      title: 'Key Market Drivers & Priorities',
      subtitle: 'Core operational catalysts driving transformation',
      bulletPoints: [
        'Accelerating automation adoption across core workflows',
        'Real-time data integration reducing decision latency',
        'Standardized scalable cloud architecture',
        'Measurable cost efficiencies realized in early quarters',
      ],
      takeaway: 'Early strategic adoption creates compounding competitive advantages.',
      speakerNotes: 'Walk through historical bottlenecks and emphasize modern solutions.',
    };
    starterContentSlide.elements = generateLayoutElements(starterContentSlide, themeConf);

    return [starterTitleSlide, starterContentSlide];
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<SlideData[][]>([]);
  const [redoStack, setRedoStack] = useState<SlideData[][]>([]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Modals & AI Actions
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);
  const [downloadingPptx, setDownloadingPptx] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const currentThemeConfig = THEME_CONFIGS[theme] || THEME_CONFIGS.emerald;
  const currentSlide = slides[currentIndex] || slides[0];
  const selectedElement = (currentSlide.elements || []).find((el) => el.id === selectedElementId) || null;

  // Push to undo stack before mutative operations
  const pushHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-20), JSON.parse(JSON.stringify(slides))]);
    setRedoStack([]);
    setSaveStatus('unsaved');
  }, [slides]);

  // Undo
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    soundEngine.playClick();
    const previous = history[history.length - 1];
    setRedoStack((prev) => [JSON.parse(JSON.stringify(slides)), ...prev]);
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setSlides(previous);
    setSaveStatus('unsaved');
  }, [history, slides]);

  // Redo
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    soundEngine.playClick();
    const next = redoStack[0];
    setHistory((prev) => [...prev, JSON.parse(JSON.stringify(slides))]);
    setRedoStack((prev) => prev.slice(1));
    setSlides(next);
    setSaveStatus('unsaved');
  }, [redoStack, slides]);

  // Keyboard shortcuts (Ctrl+Z / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Update specific element on the active slide
  const handleUpdateElement = (elementId: string, updates: Partial<SlideElement>) => {
    setSlides((prevSlides) =>
      prevSlides.map((s, idx) => {
        if (idx !== currentIndex) return s;
        const updatedElements = (s.elements || []).map((el) =>
          el.id === elementId ? { ...el, ...updates } : el
        );
        return { ...s, elements: updatedElements };
      })
    );
    setSaveStatus('unsaved');
  };

  // Delete element
  const handleDeleteElement = (elementId: string) => {
    pushHistory();
    soundEngine.playClick();
    setSlides((prevSlides) =>
      prevSlides.map((s, idx) => {
        if (idx !== currentIndex) return s;
        return {
          ...s,
          elements: (s.elements || []).filter((el) => el.id !== elementId),
        };
      })
    );
    setSelectedElementId(null);
  };

  // Add new element to active slide
  const handleAddText = () => {
    pushHistory();
    soundEngine.playClick();
    const newTextEl: SlideElement = {
      id: `el-text-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      type: 'text',
      content: 'New Editable Text',
      fontSize: 16,
      fontWeight: 'bold',
      fontFamily: 'sans-serif',
      color: currentThemeConfig.textColor,
      align: 'left',
      x: 25,
      y: 35,
      w: 40,
      h: 12,
      zIndex: 10,
    };

    setSlides((prev) =>
      prev.map((s, idx) =>
        idx === currentIndex
          ? { ...s, elements: [...(s.elements || []), newTextEl] }
          : s
      )
    );
    setSelectedElementId(newTextEl.id);
  };

  const handleAddImage = () => {
    pushHistory();
    soundEngine.playClick();
    const newImgEl: SlideElement = {
      id: `el-img-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      type: 'image',
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80',
      x: 30,
      y: 30,
      w: 36,
      h: 40,
      borderRadius: 8,
      objectFit: 'cover',
      zIndex: 8,
    };

    setSlides((prev) =>
      prev.map((s, idx) =>
        idx === currentIndex
          ? { ...s, elements: [...(s.elements || []), newImgEl] }
          : s
      )
    );
    setSelectedElementId(newImgEl.id);
  };

  const handleAddShape = (shapeType: 'card' | 'rect' | 'circle' | 'line') => {
    pushHistory();
    soundEngine.playClick();
    const newShapeEl: SlideElement = {
      id: `el-shape-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      type: 'shape',
      shapeType,
      x: 25,
      y: 30,
      w: shapeType === 'line' ? 50 : 35,
      h: shapeType === 'line' ? 0.6 : 32,
      fillColor: shapeType === 'line' ? currentThemeConfig.accent : currentThemeConfig.cardBg,
      borderColor: currentThemeConfig.cardBorder,
      borderWidth: 1,
      zIndex: 5,
    };

    setSlides((prev) =>
      prev.map((s, idx) =>
        idx === currentIndex
          ? { ...s, elements: [...(s.elements || []), newShapeEl] }
          : s
      )
    );
    setSelectedElementId(newShapeEl.id);
  };

  // Add Slide
  const handleAddSlide = (layout: SlideLayout) => {
    pushHistory();
    soundEngine.playClick();
    const newSlide: SlideData = {
      id: `slide-${Date.now()}-${slides.length}`,
      layout,
      categoryTag: `SECTION 0${slides.length}`,
      title: layout === 'conclusion' ? 'Summary & Next Steps' : 'New Presentation Slide',
      subtitle: 'Key strategic observation and roadmap details',
      bulletPoints: [
        'First primary insight or analytical finding',
        'Actionable implementation detail and metric',
        'Long-term operational value realization',
      ],
      takeaway: 'Core takeaway highlight for this section.',
      speakerNotes: 'Presenter talking notes for this slide.',
    };

    newSlide.elements = generateLayoutElements(newSlide, currentThemeConfig);
    const nextSlides = [...slides, newSlide];
    setSlides(nextSlides);
    setCurrentIndex(nextSlides.length - 1);
    setSelectedElementId(null);
  };

  // Duplicate Slide
  const handleDuplicateSlide = (idx: number) => {
    pushHistory();
    soundEngine.playClick();
    const target = slides[idx];
    if (!target) return;

    const duplicated: SlideData = {
      ...JSON.parse(JSON.stringify(target)),
      id: `slide-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      title: `${target.title} (Copy)`,
    };

    const nextSlides = [
      ...slides.slice(0, idx + 1),
      duplicated,
      ...slides.slice(idx + 1),
    ];
    setSlides(nextSlides);
    setCurrentIndex(idx + 1);
  };

  // Delete Slide
  const handleDeleteSlide = (idx: number) => {
    if (slides.length <= 1) return;
    pushHistory();
    soundEngine.playClick();
    const nextSlides = slides.filter((_, i) => i !== idx);
    setSlides(nextSlides);
    setCurrentIndex(Math.max(0, idx - 1));
    setSelectedElementId(null);
  };

  // Move / Reorder Slide
  const handleMoveSlide = (from: number, to: number) => {
    if (to < 0 || to >= slides.length) return;
    pushHistory();
    soundEngine.playClick();
    const nextSlides = [...slides];
    const item = nextSlides.splice(from, 1)[0];
    nextSlides.splice(to, 0, item);
    setSlides(nextSlides);
    setCurrentIndex(to);
  };

  // Change Theme
  const handleChangeTheme = (newTheme: PPTTheme) => {
    pushHistory();
    soundEngine.playSuccess();
    setTheme(newTheme);

    const newConf = THEME_CONFIGS[newTheme] || THEME_CONFIGS.emerald;
    // Update all slides' elements that use default theme colors
    setSlides((prevSlides) =>
      prevSlides.map((s) => ({
        ...s,
        bgColor: undefined, // revert to theme background
        elements: generateLayoutElements(s, newConf),
      }))
    );
  };

  // Change active slide layout
  const handleChangeSlideLayout = (layout: SlideLayout) => {
    pushHistory();
    soundEngine.playClick();
    const updatedSlide: SlideData = {
      ...currentSlide,
      layout,
    };
    updatedSlide.elements = generateLayoutElements(updatedSlide, currentThemeConfig);

    setSlides((prev) =>
      prev.map((s, idx) => (idx === currentIndex ? updatedSlide : s))
    );
    setSelectedElementId(null);
  };

  // Layer ordering
  const handleBringToFront = (elementId: string) => {
    setSlides((prev) =>
      prev.map((s, idx) => {
        if (idx !== currentIndex) return s;
        const highestZ = Math.max(...(s.elements || []).map((el) => el.zIndex || 1), 10);
        return {
          ...s,
          elements: (s.elements || []).map((el) =>
            el.id === elementId ? { ...el, zIndex: highestZ + 1 } : el
          ),
        };
      })
    );
  };

  const handleSendToBack = (elementId: string) => {
    setSlides((prev) =>
      prev.map((s, idx) => {
        if (idx !== currentIndex) return s;
        const lowestZ = Math.min(...(s.elements || []).map((el) => el.zIndex || 1), 1);
        return {
          ...s,
          elements: (s.elements || []).map((el) =>
            el.id === elementId ? { ...el, zIndex: Math.max(1, lowestZ - 1) } : el
          ),
        };
      })
    );
  };

  // Slide level properties
  const handleUpdateSlideBg = (color: string) => {
    setSlides((prev) =>
      prev.map((s, idx) => (idx === currentIndex ? { ...s, bgColor: color } : s))
    );
    setSaveStatus('unsaved');
  };

  const handleUpdateSlideNotes = (notes: string) => {
    setSlides((prev) =>
      prev.map((s, idx) => (idx === currentIndex ? { ...s, speakerNotes: notes } : s))
    );
    setSaveStatus('unsaved');
  };

  const handleUpdateSlideCategory = (tag: string) => {
    setSlides((prev) =>
      prev.map((s, idx) => (idx === currentIndex ? { ...s, categoryTag: tag } : s))
    );
    setSaveStatus('unsaved');
  };

  // AI Copilot slide update handler
  const handleApplySlideUpdate = (updatedSlide: SlideData) => {
    pushHistory();
    soundEngine.playSuccess();
    const regeneratedElements = generateLayoutElements(updatedSlide, currentThemeConfig);
    const completeSlide = {
      ...updatedSlide,
      elements: regeneratedElements,
    };

    setSlides((prev) =>
      prev.map((s, idx) => (idx === currentIndex ? completeSlide : s))
    );
    if (onLog) {
      onLog(`[PPT_STUDIO] AI Slide Copilot updated slide ${currentIndex + 1}`, 'STUDIO');
    }
  };

  // 1-Click Quick AI Slide Design Actions
  const handleQuickAIAction = async (command: string) => {
    if (aiLoading) return;
    soundEngine.playClick();
    setAiLoading(true);
    setAiNotice(`Applying AI: "${command}"...`);

    try {
      const response = await fetch('/api/ai/doc-maker/slide-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: command,
          slide: currentSlide,
          presentationTitle: title,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success && data.slide) {
        handleApplySlideUpdate(data.slide);
        setAiNotice(`✨ ${data.explanation || 'Slide updated successfully!'}`);
        setTimeout(() => setAiNotice(null), 3500);
        soundEngine.playSuccess();
      } else {
        setAiNotice(`⚠️ ${data.error || 'AI update failed'}`);
        setTimeout(() => setAiNotice(null), 4000);
      }
    } catch (err: any) {
      setAiNotice(`⚠️ ${err?.message || 'Network request failed'}`);
      setTimeout(() => setAiNotice(null), 4000);
    } finally {
      setAiLoading(false);
    }
  };

  // =========================================================================
  // PERSISTENCE: SAVE PRESENTATION TO LOCALSTORAGE & SERVER
  // =========================================================================
  const handleSave = () => {
    setSaveStatus('saving');
    soundEngine.playSuccess();

    try {
      const project: PresentationProject = {
        id: `deck-${Date.now()}`,
        title: title || 'Untitled Presentation',
        theme,
        slides,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 1. LocalStorage Persistence
      const existingStr = localStorage.getItem(STORAGE_KEY_SAVED_DECKS);
      const existing: PresentationProject[] = existingStr ? JSON.parse(existingStr) : [];
      const updated = [project, ...existing.filter((p) => p.title !== project.title)].slice(0, 25);
      localStorage.setItem(STORAGE_KEY_SAVED_DECKS, JSON.stringify(updated));

      // 2. Sync to backend storage records if available
      fetch('/api/storage/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordType: 'presentation',
          title: project.title,
          data: project,
        }),
      }).catch(() => {});

      setSaveStatus('saved');
      if (onLog) {
        onLog(`[PPT_STUDIO] Saved presentation "${project.title}" (${slides.length} slides)`, 'STORAGE');
      }
    } catch (err: any) {
      console.warn('[PPT Studio] Save warning:', err);
      setSaveStatus('saved');
    }
  };

  // =========================================================================
  // EXPORT 1: GENUINE EDITABLE POWERPOINT (.PPTX)
  // =========================================================================
  const handleDownloadPptx = async () => {
    soundEngine.playClick();
    setDownloadingPptx(true);

    try {
      const blob = await exportStudioPresentationToPptx({
        title: title || 'Presentation Deck',
        slides,
        theme,
        author: 'SUPERAI Presentation Studio',
      });

      triggerFileDownload(blob, `${(title || 'Presentation').replace(/[^a-zA-Z0-9_-]/g, '_')}.pptx`);
      soundEngine.playSuccess();

      if (onLog) {
        onLog(`[PPT_STUDIO] Exported native editable PowerPoint: "${title}.pptx"`, 'EXPORT');
      }
    } catch (err: any) {
      soundEngine.playAlertBeep();
      alert(`PowerPoint export failure: ${err?.message || err}`);
    } finally {
      setDownloadingPptx(false);
    }
  };

  // =========================================================================
  // EXPORT 2: PRESENTATION SLIDES PDF (.PDF)
  // =========================================================================
  const handleDownloadPdf = () => {
    soundEngine.playClick();
    setDownloadingPdf(true);

    try {
      const blob = exportStudioPresentationToPdf({
        title: title || 'Presentation Deck',
        slides,
        theme,
        author: 'SUPERAI',
      });

      triggerFileDownload(blob, `${(title || 'Presentation').replace(/[^a-zA-Z0-9_-]/g, '_')}_Slides.pdf`);
      soundEngine.playSuccess();

      if (onLog) {
        onLog(`[PPT_STUDIO] Exported widescreen Presentation PDF: "${title}.pdf"`, 'EXPORT');
      }
    } catch (err: any) {
      soundEngine.playAlertBeep();
      alert(`PDF export failure: ${err?.message || err}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-[620px] bg-[#030609] text-zinc-200 font-mono text-xs overflow-hidden">
      {/* 1. TOP TOOLBAR */}
      <TopToolbar
        title={title}
        theme={theme}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
        saveStatus={saveStatus}
        zoom={zoom}
        onUpdateTitle={(newTitle) => {
          setTitle(newTitle);
          setSaveStatus('unsaved');
        }}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onAddSlide={handleAddSlide}
        onAddText={handleAddText}
        onAddImage={handleAddImage}
        onAddShape={handleAddShape}
        onChangeTheme={handleChangeTheme}
        onStartSlideshow={() => setIsSlideshowOpen(true)}
        onSave={handleSave}
        onDownloadPptx={handleDownloadPptx}
        onDownloadPdf={handleDownloadPdf}
        onOpenAICopilot={() => setIsAICopilotOpen(true)}
        onSetZoom={setZoom}
        downloadingPptx={downloadingPptx}
        downloadingPdf={downloadingPdf}
      />

      {/* 2. MAIN WORKSPACE (Left Thumbnails + Center 16:9 Canvas + Right Properties Panel) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left: Slide Thumbnails Navigator */}
        <SlideThumbnails
          slides={slides}
          currentIndex={currentIndex}
          theme={currentThemeConfig}
          onSelectSlide={(idx) => {
            soundEngine.playClick();
            setCurrentIndex(idx);
            setSelectedElementId(null);
          }}
          onAddSlide={handleAddSlide}
          onDuplicateSlide={handleDuplicateSlide}
          onDeleteSlide={handleDeleteSlide}
          onMoveSlide={handleMoveSlide}
        />

        {/* Center: Interactive 16:9 Canvas Stage & AI Design Controls */}
        <div className="flex-1 flex flex-col bg-[#05080c] overflow-hidden">
          {/* AI DESIGN CONTROLS TOOLBAR */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#080d14] border-b border-emerald-950/80 overflow-x-auto text-[11px] select-none no-scrollbar shrink-0 gap-2">
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-1 text-purple-400 font-bold mr-1">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">AI Controls:</span>
              </div>

              <button
                type="button"
                onClick={() => handleQuickAIAction('Improve Design')}
                disabled={aiLoading}
                className="px-2 py-1 rounded bg-[#0f172a] hover:bg-[#1e293b] text-sky-300 border border-sky-900/60 hover:border-sky-500 flex items-center gap-1 transition-all text-[10px] font-semibold disabled:opacity-50"
                title="Improve visual hierarchy, typography, and polish"
              >
                <Sparkles className="w-3 h-3 text-sky-400" />
                <span>Improve Design</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickAIAction('Make More Professional')}
                disabled={aiLoading}
                className="px-2 py-1 rounded bg-[#0f172a] hover:bg-[#1e293b] text-indigo-300 border border-indigo-900/60 hover:border-indigo-500 flex items-center gap-1 transition-all text-[10px] font-semibold disabled:opacity-50"
                title="Elevate tone, structure, and executive clarity"
              >
                <Wand2 className="w-3 h-3 text-indigo-400" />
                <span>Make Professional</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickAIAction('Make More Visual')}
                disabled={aiLoading}
                className="px-2 py-1 rounded bg-[#0f172a] hover:bg-[#1e293b] text-fuchsia-300 border border-fuchsia-900/60 hover:border-fuchsia-500 flex items-center gap-1 transition-all text-[10px] font-semibold disabled:opacity-50"
                title="Transform layout into image-led or visual card presentation"
              >
                <ImageIcon className="w-3 h-3 text-fuchsia-400" />
                <span>Make More Visual</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickAIAction('Simplify Text')}
                disabled={aiLoading}
                className="px-2 py-1 rounded bg-[#0f172a] hover:bg-[#1e293b] text-emerald-300 border border-emerald-900/60 hover:border-emerald-500 flex items-center gap-1 transition-all text-[10px] font-semibold disabled:opacity-50"
                title="Condense bullets into punchy, high-impact takeaways"
              >
                <Type className="w-3 h-3 text-emerald-400" />
                <span>Simplify Text</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickAIAction('Add More Detail')}
                disabled={aiLoading}
                className="px-2 py-1 rounded bg-[#0f172a] hover:bg-[#1e293b] text-amber-300 border border-amber-900/60 hover:border-amber-500 flex items-center gap-1 transition-all text-[10px] font-semibold disabled:opacity-50"
                title="Expand points with comprehensive data and context"
              >
                <Lightbulb className="w-3 h-3 text-amber-400" />
                <span>Add Detail</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickAIAction('Generate Alternative Layout')}
                disabled={aiLoading}
                className="px-2 py-1 rounded bg-[#0f172a] hover:bg-[#1e293b] text-cyan-300 border border-cyan-900/60 hover:border-cyan-500 flex items-center gap-1 transition-all text-[10px] font-semibold disabled:opacity-50"
                title="Cycle or switch to alternative complementary layout"
              >
                <Columns className="w-3 h-3 text-cyan-400" />
                <span>Alternative Layout</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickAIAction('Add Relevant Images')}
                disabled={aiLoading}
                className="px-2 py-1 rounded bg-[#0f172a] hover:bg-[#1e293b] text-pink-300 border border-pink-900/60 hover:border-pink-500 flex items-center gap-1 transition-all text-[10px] font-semibold disabled:opacity-50"
                title="Add high-impact conceptual photographic visuals"
              >
                <ImageIcon className="w-3 h-3 text-pink-400" />
                <span>Add Images</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickAIAction('Fix Layout Problems')}
                disabled={aiLoading}
                className="px-2 py-1 rounded bg-[#0f172a] hover:bg-[#1e293b] text-teal-300 border border-teal-900/60 hover:border-teal-500 flex items-center gap-1 transition-all text-[10px] font-semibold disabled:opacity-50"
                title="Balance bullet lengths and visual proportions"
              >
                <CheckCircle2 className="w-3 h-3 text-teal-400" />
                <span>Fix Layout</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickAIAction('Regenerate Selected Slide')}
                disabled={aiLoading}
                className="px-2 py-1 rounded bg-[#0f172a] hover:bg-[#1e293b] text-rose-300 border border-rose-900/60 hover:border-rose-500 flex items-center gap-1 transition-all text-[10px] font-semibold disabled:opacity-50"
                title="Completely re-architect slide with fresh perspective"
              >
                <RefreshCw className={`w-3 h-3 text-rose-400 ${aiLoading ? 'animate-spin' : ''}`} />
                <span>Regenerate Slide</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAICopilotOpen(true)}
                className="px-2.5 py-1 rounded bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-600 flex items-center gap-1 transition-all text-[10px] font-bold shadow-[0_0_10px_rgba(168,85,247,0.3)] ml-1"
              >
                <Sparkles className="w-3 h-3 text-purple-300 animate-pulse" />
                <span>AI Copilot...</span>
              </button>
            </div>

            {/* Status / Feedback Banner */}
            {aiNotice && (
              <div className="shrink-0 text-[10px] px-2 py-0.5 rounded bg-black/80 border border-purple-800 text-purple-200 font-bold animate-fadeIn flex items-center gap-1">
                {aiLoading && <RotateCw className="w-2.5 h-2.5 animate-spin text-purple-400" />}
                <span>{aiNotice}</span>
              </div>
            )}
          </div>

          {/* Center Canvas Stage */}
          <div className="flex-1 flex items-center justify-center overflow-auto p-2 sm:p-4">
            <SlideCanvas
              slide={currentSlide}
              theme={currentThemeConfig}
              selectedElementId={selectedElementId}
              onSelectElement={(elId) => setSelectedElementId(elId)}
              onUpdateElement={handleUpdateElement}
              onDeleteElement={handleDeleteElement}
              zoom={zoom}
            />
          </div>
        </div>

        {/* Right: Properties Inspector Panel */}
        <SlidePropertiesPanel
          slide={currentSlide}
          selectedElement={selectedElement}
          theme={currentThemeConfig}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
          onChangeSlideLayout={handleChangeSlideLayout}
          onUpdateSlideBg={handleUpdateSlideBg}
          onUpdateSlideNotes={handleUpdateSlideNotes}
          onUpdateSlideCategory={handleUpdateSlideCategory}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
        />
      </div>

      {/* 3. FULLSCREEN SLIDESHOW MODAL */}
      {isSlideshowOpen && (
        <SlideshowModal
          slides={slides}
          initialIndex={currentIndex}
          theme={currentThemeConfig}
          onClose={() => setIsSlideshowOpen(false)}
        />
      )}

      {/* 4. AI SLIDE COPILOT MODAL */}
      {isAICopilotOpen && (
        <AISlideAssistantModal
          currentSlide={currentSlide}
          slideIndex={currentIndex}
          presentationTitle={title}
          onApplySlideUpdate={handleApplySlideUpdate}
          onClose={() => setIsAICopilotOpen(false)}
        />
      )}
    </div>
  );
};
