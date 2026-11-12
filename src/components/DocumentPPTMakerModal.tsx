import React, { useState, useEffect } from 'react';
import { ModalWrapper } from './Modals';
import { soundEngine } from '../utils/audio';
import { 
  exportToDocx, 
  exportToPptx, 
  exportToPdf, 
  triggerFileDownload 
} from '../utils/fileExporters';
import { SlideData, PPTTheme, PresentationPurpose, VisualStyle, DetailLevel } from './presentation/types';
import { CORE_12_THEMES, THEME_CONFIGS } from './presentation/themeConfig';
import { PresentationStudio } from './presentation/PresentationStudio';
import { 
  FileText, 
  Presentation, 
  FileDown, 
  Briefcase, 
  FileSpreadsheet, 
  GraduationCap, 
  Mail, 
  ClipboardList, 
  BookOpen, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Plus, 
  Trash2, 
  CopyCheck, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Layers, 
  Save, 
  FolderOpen, 
  RotateCcw,
  Heading1,
  Heading2,
  Bold,
  Italic,
  List,
  Palette,
  Eye,
  Edit3,
  Upload,
  FileUp,
  Sliders,
  Target
} from 'lucide-react';

export type ToolType = 
  | 'document'
  | 'presentation'
  | 'pdf'
  | 'resume'
  | 'report'
  | 'school_project'
  | 'letter'
  | 'worksheet'
  | 'notes';

interface SavedProject {
  id: string;
  title: string;
  toolType: ToolType;
  content: string;
  slides?: SlideData[];
  date: string;
}

const SAVED_PROJECTS_KEY = 'SUPERAI_Document_Projects_v1';

const TOOLS_MANIFEST: Array<{
  id: ToolType;
  title: string;
  tag: string;
  icon: any;
  desc: string;
  samplePrompt: string;
}> = [
  {
    id: 'document',
    title: 'Document Maker',
    tag: 'DOCX / ESSAYS',
    icon: FileText,
    desc: 'General documents, comprehensive essays, research papers, project proposals, and meeting summaries.',
    samplePrompt: 'Strategic proposal on adopting renewable solar energy in municipal transit centers.',
  },
  {
    id: 'presentation',
    title: 'AI Presentation Studio',
    tag: 'VISUAL PPTX / SLIDES',
    icon: Presentation,
    desc: 'Fully visual PowerPoint studio: design, live canvas editing, custom shapes/images, AI Slide Copilot, fullscreen slideshow, and native editable .pptx export.',
    samplePrompt: 'Pitch deck on AI-driven cybersecurity automation for enterprise cloud infrastructure.',
  },
  {
    id: 'pdf',
    title: 'PDF Maker',
    tag: 'PAGINATED PDF',
    icon: FileDown,
    desc: 'Instant publication-ready PDF generator with clean margins, headings, running headers, and pagination.',
    samplePrompt: 'Technical handbook on quantum computing principles and cryptographic vulnerability.',
  },
  {
    id: 'resume',
    title: 'Résumé Maker',
    tag: 'CAREER ATS',
    icon: Briefcase,
    desc: 'Guided executive resume builder with professional summaries, competency matrices, metrics, and education.',
    samplePrompt: 'Senior Full-Stack Cloud Engineer with 6+ years in Node.js, React, Kubernetes, and Distributed Systems.',
  },
  {
    id: 'report',
    title: 'Report Maker',
    tag: 'EXECUTIVE',
    icon: FileSpreadsheet,
    desc: 'Structured analytical reports with Executive Summary, Methodology, Findings, Recommendations, and Sources.',
    samplePrompt: 'Q3 Financial & Operational Audit Report evaluating SaaS customer churn and retention strategies.',
  },
  {
    id: 'school_project',
    title: 'School Project Maker',
    tag: 'ACADEMIC',
    icon: GraduationCap,
    desc: 'Organized school and college projects with conceptual breakdowns, diagrams, Q&A exercises, and references.',
    samplePrompt: 'Grade 10 Biology Project on CRISPR Gene Editing: Mechanics, Ethics, and Future Medicine.',
  },
  {
    id: 'letter',
    title: 'Letter & Application Maker',
    tag: 'CORRESPONDENCE',
    icon: Mail,
    desc: 'Formal business letters, university applications, cover letters, resignation notices, and official requests.',
    samplePrompt: 'Formal application letter for a competitive Machine Learning Research Fellowship at Stanford.',
  },
  {
    id: 'worksheet',
    title: 'Worksheet Maker',
    tag: 'CLASSROOM',
    icon: ClipboardList,
    desc: 'Classroom practice worksheets with multiple-choice questions, fill-in-the-blanks, problem solving, and answer keys.',
    samplePrompt: 'Chemistry Practice Worksheet on Stoichiometry, Mole Concept, and Balancing Chemical Equations.',
  },
  {
    id: 'notes',
    title: 'Notes & Study Material Maker',
    tag: 'EXAM PREP',
    icon: BookOpen,
    desc: 'High-yield exam prep notes, flashcard concepts, formula summaries, key terminology, and self-test questions.',
    samplePrompt: 'Complete high-yield revision notes on World History: The Industrial Revolution & Global Trade Impacts.',
  },
];

const LANGUAGES = [
  'English', 'Hindi', 'Spanish', 'French', 'German', 
  'Japanese', 'Chinese (Simplified)', 'Arabic', 'Russian', 'Portuguese'
];

interface DocumentPPTMakerModalProps {
  onClose: () => void;
  onLog?: (text: string, tag: string) => void;
  initialTool?: ToolType;
}

export const DocumentPPTMakerModal: React.FC<DocumentPPTMakerModalProps> = ({
  onClose,
  onLog,
  initialTool = 'document',
}) => {
  // Navigation
  const [activeTool, setActiveTool] = useState<ToolType>(initialTool);
  const [currentView, setCurrentView] = useState<'dashboard' | 'create' | 'editor' | 'projects'>('dashboard');

  // Form Inputs
  const [docTitle, setDocTitle] = useState('');
  const [topicPrompt, setTopicPrompt] = useState('');
  const [instructions, setInstructions] = useState('');
  const [language, setLanguage] = useState('English');
  const [lengthPreference, setLengthPreference] = useState('Standard (~800 words)');
  const [writingStyle, setWritingStyle] = useState('Professional & Formal');
  const [referenceText, setReferenceText] = useState('');
  
  // Presentation specific inputs
  const [slideCount, setSlideCount] = useState(10);
  const [targetAudience, setTargetAudience] = useState('General Professional & Stakeholders');
  const [pptTheme, setPptTheme] = useState<PPTTheme>('modern_minimalist');
  const [pptPurpose, setPptPurpose] = useState<PresentationPurpose>('business');
  const [pptVisualStyle, setPptVisualStyle] = useState<VisualStyle>('modern_clean');
  const [pptDetailLevel, setPptDetailLevel] = useState<DetailLevel>('balanced');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // File Upload Reference Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundEngine.playClick();
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setReferenceText((prev) => 
          prev ? `${prev}\n\n[Uploaded Notes from ${file.name}]:\n${text}` : text
        );
      }
    };
    reader.readAsText(file);
  };

  // Generation status
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Editor Content State
  const [editableContent, setEditableContent] = useState('');
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // File Download state
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingPptx, setDownloadingPptx] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Saved Projects
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>(() => {
    try {
      const saved = localStorage.getItem(SAVED_PROJECTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Switch to tool
  const selectTool = (tool: ToolType) => {
    soundEngine.playClick();
    setActiveTool(tool);
    const meta = TOOLS_MANIFEST.find((t) => t.id === tool);
    if (meta && !topicPrompt) {
      setTopicPrompt(meta.samplePrompt);
      setDocTitle(meta.title === 'PPT Maker' ? 'Strategic Overview Deck' : `${meta.title} Draft`);
    }
    setCurrentView('create');
  };

  // Run AI Generation
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topicPrompt.trim() || generating) return;

    soundEngine.playClick();
    setGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch('/api/ai/doc-maker/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolType: activeTool,
          title: docTitle.trim() || topicPrompt.trim().slice(0, 50),
          topic: topicPrompt.trim(),
          instructions: instructions.trim(),
          language,
          length: lengthPreference,
          style: writingStyle,
          referenceText: referenceText.trim(),
          targetAudience,
          slideCount,
          purpose: pptPurpose,
          theme: pptTheme,
          visualStyle: pptVisualStyle,
          detailLevel: pptDetailLevel,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        soundEngine.playSuccess();
        setEditableContent(data.content || '');
        if (data.slides && Array.isArray(data.slides)) {
          setSlides(data.slides);
          setCurrentSlideIndex(0);
        }
        if (data.title) {
          setDocTitle(data.title);
        }
        setCurrentView('editor');

        if (onLog) {
          onLog(`[DOC_MAKER] Generated ${activeTool.toUpperCase()}: "${data.title}"`, 'INTELLIGENCE');
        }
      } else {
        soundEngine.playAlertBeep();
        setGenerationError(data.error || 'Failed to generate document. Please try again.');
      }
    } catch (err: any) {
      soundEngine.playAlertBeep();
      setGenerationError(err?.message || 'Network connection failed during AI generation.');
    } finally {
      setGenerating(false);
    }
  };

  // Save current project
  const handleSaveProject = () => {
    soundEngine.playSuccess();
    const newProj: SavedProject = {
      id: String(Date.now()),
      title: docTitle || 'Untitled Project',
      toolType: activeTool,
      content: editableContent,
      slides: activeTool === 'presentation' ? slides : undefined,
      date: new Date().toLocaleDateString(),
    };
    const updated = [newProj, ...savedProjects.filter((p) => p.title !== newProj.title)].slice(0, 30);
    setSavedProjects(updated);
    localStorage.setItem(SAVED_PROJECTS_KEY, JSON.stringify(updated));
  };

  // Load project
  const loadProject = (proj: SavedProject) => {
    soundEngine.playClick();
    setActiveTool(proj.toolType);
    setDocTitle(proj.title);
    setEditableContent(proj.content);
    if (proj.slides) {
      setSlides(proj.slides);
      setCurrentSlideIndex(0);
    }
    setCurrentView('editor');
  };

  // Delete project
  const deleteProject = (id: string) => {
    soundEngine.playClick();
    const updated = savedProjects.filter((p) => p.id !== id);
    setSavedProjects(updated);
    localStorage.setItem(SAVED_PROJECTS_KEY, JSON.stringify(updated));
  };

  // =========================================================================
  // DOWNLOAD 1: REAL .DOCX EXPORT
  // =========================================================================
  const handleDownloadDocx = async () => {
    if (!editableContent && slides.length === 0) return;
    soundEngine.playClick();
    setDownloadingDocx(true);

    try {
      let textToExport = editableContent;
      if (activeTool === 'presentation' && slides.length > 0) {
        textToExport = slides
          .map(
            (s, idx) =>
              `# Slide ${idx + 1}: ${s.title}\n${s.subtitle ? `*${s.subtitle}*\n\n` : ''}${s.bulletPoints.map((b) => `- ${b}`).join('\n')}\n\n${s.takeaway ? `**Key Takeaway:** ${s.takeaway}\n` : ''}${s.speakerNotes ? `**Speaker Notes:** ${s.speakerNotes}\n` : ''}`
          )
          .join('\n\n---\n\n');
      }

      const blob = await exportToDocx({
        title: docTitle || 'SUPERAI Document',
        content: textToExport,
        category: activeTool.replace('_', ' ').toUpperCase(),
      });

      triggerFileDownload(blob, `${(docTitle || 'Document').replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`);
      soundEngine.playSuccess();
    } catch (err: any) {
      soundEngine.playAlertBeep();
      alert(`DOCX export error: ${err.message}`);
    } finally {
      setDownloadingDocx(false);
    }
  };

  // =========================================================================
  // DOWNLOAD 2: REAL .PPTX EXPORT
  // =========================================================================
  const handleDownloadPptx = async () => {
    soundEngine.playClick();
    setDownloadingPptx(true);

    try {
      // If user is in document mode, convert sections to slides
      let slidesToExport = slides;
      if (slidesToExport.length === 0 && editableContent) {
        const sections = editableContent.split(/^#{1,2}\s+/m).filter(Boolean);
        slidesToExport = sections.map((sec, i) => {
          const lines = sec.split('\n').filter(Boolean);
          const sTitle = lines[0] || `Section ${i + 1}`;
          const bPoints = lines
            .slice(1)
            .filter((l) => l.trim().startsWith('-') || l.trim().startsWith('*') || l.trim().length > 10)
            .map((l) => l.replace(/^[-*•]\s+/, '').trim())
            .slice(0, 5);
          return {
            title: sTitle,
            bulletPoints: bPoints.length > 0 ? bPoints : ['Comprehensive analysis and strategic overview.'],
            takeaway: 'Key takeaway from this section.',
          };
        });
      }

      if (slidesToExport.length === 0) {
        slidesToExport = [
          {
            title: docTitle || 'Overview',
            bulletPoints: ['Introduction and problem statement', 'Core strategic roadmap', 'Conclusions and takeaways'],
            takeaway: 'Presentation ready for presentation.',
          },
        ];
      }

      const blob = await exportToPptx({
        title: docTitle || 'SUPERAI Presentation',
        slides: slidesToExport,
        theme: pptTheme,
      });

      triggerFileDownload(blob, `${(docTitle || 'Presentation').replace(/[^a-zA-Z0-9_-]/g, '_')}.pptx`);
      soundEngine.playSuccess();
    } catch (err: any) {
      soundEngine.playAlertBeep();
      alert(`PPTX export error: ${err.message}`);
    } finally {
      setDownloadingPptx(false);
    }
  };

  // =========================================================================
  // DOWNLOAD 3: REAL .PDF EXPORT
  // =========================================================================
  const handleDownloadPdf = async () => {
    if (!editableContent && slides.length === 0) return;
    soundEngine.playClick();
    setDownloadingPdf(true);

    try {
      let textToExport = editableContent;
      if (activeTool === 'presentation' && slides.length > 0) {
        textToExport = slides
          .map(
            (s, idx) =>
              `## Slide ${idx + 1}: ${s.title}\n${s.bulletPoints.map((b) => `- ${b}`).join('\n')}\n\n*Key Takeaway: ${s.takeaway || ''}*`
          )
          .join('\n\n');
      }

      const blob = exportToPdf({
        title: docTitle || 'SUPERAI Document',
        content: textToExport,
        category: activeTool.replace('_', ' ').toUpperCase(),
      });

      triggerFileDownload(blob, `${(docTitle || 'Document').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
      soundEngine.playSuccess();
    } catch (err: any) {
      soundEngine.playAlertBeep();
      alert(`PDF export error: ${err.message}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Copy Content
  const handleCopy = () => {
    navigator.clipboard.writeText(editableContent);
    setCopiedText(true);
    soundEngine.playClick();
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Text insertion for toolbar
  const insertMarkdownTag = (prefix: string, suffix: string = '') => {
    soundEngine.playClick();
    setEditableContent((prev) => `${prev}\n${prefix}New Entry${suffix}\n`);
  };

  // Slide management
  const addSlide = () => {
    soundEngine.playClick();
    const newSlide: SlideData = {
      title: 'New Slide Title',
      subtitle: 'Section Subtitle',
      bulletPoints: ['First key insight or data point', 'Second explanatory bullet', 'Strategic takeaway'],
      takeaway: 'Core highlight of this slide.',
      speakerNotes: 'Enter speaker notes here.',
    };
    const next = [...slides, newSlide];
    setSlides(next);
    setCurrentSlideIndex(next.length - 1);
  };

  const duplicateSlide = (idx: number) => {
    soundEngine.playClick();
    const target = slides[idx];
    if (!target) return;
    const duplicated: SlideData = { ...target, title: `${target.title} (Copy)` };
    const next = [...slides.slice(0, idx + 1), duplicated, ...slides.slice(idx + 1)];
    setSlides(next);
    setCurrentSlideIndex(idx + 1);
  };

  const deleteSlide = (idx: number) => {
    soundEngine.playClick();
    if (slides.length <= 1) return;
    const next = slides.filter((_, i) => i !== idx);
    setSlides(next);
    setCurrentSlideIndex(Math.max(0, idx - 1));
  };

  const moveSlide = (from: number, to: number) => {
    if (to < 0 || to >= slides.length) return;
    soundEngine.playClick();
    const next = [...slides];
    const item = next.splice(from, 1)[0];
    next.splice(to, 0, item);
    setSlides(next);
    setCurrentSlideIndex(to);
  };

  const updateCurrentSlide = (field: keyof SlideData, val: any) => {
    setSlides((prev) =>
      prev.map((s, i) => (i === currentSlideIndex ? { ...s, [field]: val } : s))
    );
  };

  const activeToolMeta = TOOLS_MANIFEST.find((t) => t.id === activeTool) || TOOLS_MANIFEST[0];

  return (
    <ModalWrapper 
      title={activeTool === 'presentation' ? "📊 AI PRESENTATION & POWERPOINT STUDIO" : "📄 DOCUMENT & PPT MAKER"} 
      onClose={onClose} 
      maxWidthClass={currentView === 'editor' && activeTool === 'presentation' ? "max-w-[96vw]" : "max-w-5xl"}
    >
      <div className="flex flex-col space-y-4 font-mono text-emerald-400 text-xs min-h-[580px]">

        {/* --- TOP BAR NAVIGATION --- */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-950 pb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => { soundEngine.playClick(); setCurrentView('dashboard'); }}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentView === 'dashboard'
                  ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'bg-black text-emerald-400 border border-emerald-900 hover:border-emerald-600'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>9-IN-1 WORKSPACE</span>
            </button>

            <button
              onClick={() => { soundEngine.playClick(); setCurrentView('create'); }}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentView === 'create'
                  ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'bg-black text-emerald-400 border border-emerald-900 hover:border-emerald-600'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI GENERATOR: {activeToolMeta.title.toUpperCase()}</span>
            </button>

            {(editableContent || slides.length > 0) && (
              <button
                onClick={() => { soundEngine.playClick(); setCurrentView('editor'); }}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentView === 'editor'
                    ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                    : 'bg-cyan-950 text-cyan-300 border border-cyan-800 hover:border-cyan-500'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>EDIT & EXPORT</span>
              </button>
            )}

            <button
              onClick={() => { soundEngine.playClick(); setCurrentView('projects'); }}
              className={`px-2.5 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                currentView === 'projects'
                  ? 'bg-emerald-500 text-black'
                  : 'bg-black text-zinc-400 border border-zinc-900 hover:text-emerald-300'
              }`}
            >
              <FolderOpen className="w-3 h-3" />
              <span>SAVED ({savedProjects.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-500 font-bold px-2 py-0.5 rounded bg-zinc-950 border border-zinc-900">
              DOCX • PPTX • PDF READY
            </span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* VIEW 1: DASHBOARD (9 SPECIALIZED TOOLS) */}
        {/* ================================================================= */}
        {currentView === 'dashboard' && (
          <div className="space-y-4">
            <div className="border-b border-emerald-950/70 pb-2">
              <h3 className="text-sm font-bold text-emerald-300 tracking-wider">
                DOCUMENT &amp; PRESENTATION CREATION MATRIX
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Generate real, genuine Microsoft Word (.docx), PowerPoint (.pptx), and publication-grade PDF documents powered by Gemini AI.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TOOLS_MANIFEST.map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => selectTool(tool.id)}
                    className="bg-[#070a0e] hover:bg-[#0c1219] border border-emerald-950 hover:border-emerald-500/80 p-4 rounded-lg text-left transition-all cursor-pointer group shadow-md shadow-black/40 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="p-2 rounded bg-emerald-950/60 border border-emerald-900/60 text-emerald-400 group-hover:text-emerald-200">
                          <IconComponent className="w-4 h-4" />
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black border border-emerald-950 text-zinc-400 group-hover:text-emerald-400">
                          {tool.tag}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-emerald-300 group-hover:text-emerald-100 mb-1">
                        {tool.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {tool.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-emerald-950/60 flex items-center justify-between text-[10px] text-emerald-500 font-bold group-hover:text-emerald-300">
                      <span>LAUNCH TOOL →</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 2: AI CREATION CONFIGURATION FORM */}
        {/* ================================================================= */}
        {currentView === 'create' && (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
              <div className="flex items-center gap-2">
                <activeToolMeta.icon className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs text-emerald-300 uppercase tracking-wider">
                  {activeTool === 'presentation' ? 'AI PRESENTATION STUDIO — DECK CONFIGURATION' : `${activeToolMeta.title} CONFIGURATION`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCurrentView('dashboard')}
                className="text-[10px] text-zinc-400 hover:text-emerald-300"
              >
                ← Switch Tool
              </button>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* PRESENTATION SPECIFIC CREATION WORKFLOW (9 FIELDS + THEME GALLERY) */}
            {/* ------------------------------------------------------------- */}
            {activeTool === 'presentation' ? (
              <div className="space-y-4">
                {/* 1. TOPIC & TITLE (Single-field instant generation supported) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] text-emerald-300 block font-bold flex items-center justify-between">
                      <span>1. PRESENTATION TOPIC OR TITLE *</span>
                      <span className="text-[10px] text-zinc-400 font-normal">Topic alone is sufficient to generate!</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Next-Gen Artificial Intelligence in Healthcare & Diagnostics"
                      value={topicPrompt}
                      onChange={(e) => setTopicPrompt(e.target.value)}
                      className="w-full bg-[#05080c] border border-emerald-800 focus:border-emerald-400 rounded px-3 py-2 text-xs text-emerald-200 outline-none font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 block font-bold">
                      SLIDE DECK HEADING:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Executive Strategy 2026"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full bg-black border border-emerald-950 focus:border-emerald-500 rounded px-3 py-2 text-xs text-emerald-300 outline-none"
                    />
                  </div>
                </div>

                {/* Quick Topic Suggestions */}
                <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                  <span className="text-zinc-500 font-bold">Quick ideas:</span>
                  {[
                    'AI Revolution in Enterprise Software',
                    'Clean Tech & Renewable Energy Roadmap',
                    'Series A Pitch Deck: Autonomous Logistics',
                    'Photosynthesis & Cellular Respiration (Biology)',
                    'Product Launch: Global SaaS Architecture',
                  ].map((idea) => (
                    <button
                      key={idea}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setTopicPrompt(idea);
                        setDocTitle(idea.split(':')[0]);
                      }}
                      className="px-2 py-0.5 rounded bg-black/60 border border-emerald-950 text-zinc-400 hover:text-emerald-300 hover:border-emerald-700 transition-all"
                    >
                      {idea}
                    </button>
                  ))}
                </div>

                {/* 2, 3, 4, 5. PURPOSE, AUDIENCE, SLIDE COUNT & LANGUAGE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#060a0f] p-3 rounded-lg border border-emerald-950/80">
                  {/* 2. Purpose */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-300 block font-bold">2. PURPOSE / CONTEXT:</label>
                    <select
                      value={pptPurpose}
                      onChange={(e) => setPptPurpose(e.target.value as PresentationPurpose)}
                      className="w-full bg-black border border-emerald-900 focus:border-emerald-400 rounded px-2 py-1.5 text-xs text-emerald-300 outline-none"
                    >
                      <option value="business">Business Strategy / Corporate</option>
                      <option value="pitch_deck">Startup Pitch Deck / Investor</option>
                      <option value="school_project">School Project / Student Assignment</option>
                      <option value="educational_lesson">Educational Lesson / Teaching</option>
                      <option value="research">Scientific &amp; Academic Research</option>
                      <option value="portfolio">Portfolio &amp; Showcase</option>
                      <option value="training">Training Workshop &amp; Onboarding</option>
                      <option value="other">General / Custom Purpose</option>
                    </select>
                  </div>

                  {/* 3. Target Audience */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-300 block font-bold">3. TARGET AUDIENCE:</label>
                    <input
                      type="text"
                      placeholder="e.g. Investors, Grade 10 Students, Leadership"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full bg-black border border-emerald-900 focus:border-emerald-400 rounded px-2.5 py-1.5 text-xs text-emerald-300 outline-none"
                    />
                  </div>

                  {/* 4. Number of Slides (Default 10) */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-300 block font-bold">4. NUMBER OF SLIDES:</label>
                    <select
                      value={slideCount}
                      onChange={(e) => setSlideCount(Number(e.target.value))}
                      className="w-full bg-black border border-emerald-900 focus:border-emerald-400 rounded px-2 py-1.5 text-xs text-emerald-300 outline-none font-bold text-emerald-400"
                    >
                      <option value={5}>5 Slides (Executive Brief)</option>
                      <option value={8}>8 Slides (Compact Deck)</option>
                      <option value={10}>10 Slides (Standard Default)</option>
                      <option value={12}>12 Slides (Comprehensive)</option>
                      <option value={15}>15 Slides (Deep Dive)</option>
                      <option value={20}>20 Slides (Full Master Deck)</option>
                    </select>
                  </div>

                  {/* 5. Language */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-300 block font-bold">5. PRESENTATION LANGUAGE:</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-black border border-emerald-900 focus:border-emerald-400 rounded px-2 py-1.5 text-xs text-emerald-300 outline-none"
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l} value={l} className="bg-zinc-950 text-white">
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 7 & 8. VISUAL STYLE & DETAIL LEVEL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#060a0f] p-3 rounded-lg border border-emerald-950/80">
                  {/* 7. Visual Style */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-300 block font-bold">7. VISUAL STYLE &amp; AESTHETIC:</label>
                    <select
                      value={pptVisualStyle}
                      onChange={(e) => setPptVisualStyle(e.target.value as VisualStyle)}
                      className="w-full bg-black border border-emerald-900 focus:border-emerald-400 rounded px-2.5 py-1.5 text-xs text-emerald-300 outline-none"
                    >
                      <option value="modern_clean">Modern Clean (Sleek photo &amp; balanced editorial)</option>
                      <option value="bold_editorial">Bold Editorial (Strong typography &amp; framed quotes)</option>
                      <option value="high_contrast">High Contrast Dark (Glow accents on deep dark canvas)</option>
                      <option value="vibrant_illustrated">Vibrant &amp; Illustrated (Colorful badges &amp; concept cards)</option>
                      <option value="corporate_classic">Corporate Classic (Trust blue, structured charts &amp; tables)</option>
                    </select>
                  </div>

                  {/* 8. Detail Level */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-300 block font-bold">8. DETAIL LEVEL:</label>
                    <select
                      value={pptDetailLevel}
                      onChange={(e) => setPptDetailLevel(e.target.value as DetailLevel)}
                      className="w-full bg-black border border-emerald-900 focus:border-emerald-400 rounded px-2.5 py-1.5 text-xs text-emerald-300 outline-none"
                    >
                      <option value="concise">Concise (Sharp, punchy, high-impact scannable bullet points)</option>
                      <option value="balanced">Balanced (Thorough yet scannable, optimal for speaking)</option>
                      <option value="detailed">Detailed (In-depth explanations, thorough context &amp; data)</option>
                    </select>
                  </div>
                </div>

                {/* 6. DESIGN THEMES GALLERY (12 PROFESSIONAL THEMES WITH CARD PREVIEWS) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-emerald-300 block font-bold">
                      6. DESIGN THEME GALLERY (SELECT 1 OF 12 THEMES):
                    </label>
                    <span className="text-[10px] text-zinc-400">
                      Active: <span className="text-emerald-400 font-bold">{THEME_CONFIGS[pptTheme]?.name || pptTheme}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[260px] overflow-y-auto p-1 border border-emerald-950 rounded-lg bg-[#04070a]">
                    {CORE_12_THEMES.map((themeKey) => {
                      const t = THEME_CONFIGS[themeKey];
                      const isSelected = pptTheme === themeKey;
                      return (
                        <button
                          key={themeKey}
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            setPptTheme(themeKey);
                          }}
                          className={`p-2.5 rounded-lg text-left transition-all relative border flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#0f172a] border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400'
                              : 'bg-[#080d14] border-zinc-900 hover:border-emerald-800/80 hover:bg-[#0c1219]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-black/60 border border-zinc-800 text-zinc-400">
                                {t.category.toUpperCase()}
                              </span>
                              {isSelected && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500 text-black">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-[11px] text-white tracking-wide truncate">
                              {t.name}
                            </h4>
                            <p className="text-[9px] text-zinc-400 line-clamp-2 mt-0.5 leading-tight">
                              {t.desc}
                            </p>
                          </div>

                          {/* Color Swatch Bar */}
                          <div className="flex items-center gap-1 mt-2.5 pt-1.5 border-t border-zinc-900">
                            <span 
                              className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                              style={{ backgroundColor: t.bg }} 
                              title="Background"
                            />
                            <span 
                              className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                              style={{ backgroundColor: t.cardBg }} 
                              title="Card Canvas"
                            />
                            <span 
                              className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                              style={{ backgroundColor: t.accent }} 
                              title="Accent Color"
                            />
                            <span 
                              className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                              style={{ backgroundColor: t.titleColor }} 
                              title="Title Color"
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 9. REFERENCE MATERIAL & FILE UPLOAD */}
                <div className="space-y-1.5 bg-[#060a0f] p-3 rounded-lg border border-emerald-950/80">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-zinc-300 block font-bold flex items-center gap-1.5">
                      <FileUp className="w-3 h-3 text-emerald-400" />
                      <span>9. OPTIONAL REFERENCE DOCUMENTS, NOTES OR FILE:</span>
                    </label>

                    <label className="cursor-pointer text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline font-bold">
                      <Upload className="w-3 h-3" />
                      <span>{uploadedFileName ? `Attached: ${uploadedFileName}` : 'Attach Notes / TXT File'}</span>
                      <input
                        type="file"
                        accept=".txt,.md,.json,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Optional: Paste reference document notes, data points, or outlines to incorporate into slides..."
                    value={referenceText}
                    onChange={(e) => setReferenceText(e.target.value)}
                    className="w-full bg-black border border-emerald-950 focus:border-emerald-500 rounded p-2 text-xs text-emerald-200 outline-none"
                  />
                </div>
              </div>
            ) : (
              /* ------------------------------------------------------------- */
              /* STANDARD DOCUMENT / REPORT / RESUME / LETTER WORKFLOW */
              /* ------------------------------------------------------------- */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 block font-bold">TITLE / HEADING:</label>
                    <input
                      type="text"
                      placeholder="e.g. Q3 Strategic Implementation Plan"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full bg-black border border-emerald-900 focus:border-emerald-400 rounded px-3 py-2 text-xs text-emerald-300 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 block font-bold">LANGUAGE:</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-black border border-emerald-900 focus:border-emerald-400 rounded px-2.5 py-2 text-xs text-emerald-300 outline-none"
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l} value={l} className="bg-zinc-950 text-white">
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 block font-bold">
                    TOPIC &amp; CORE REQUIREMENTS:
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe what you want to create in detail..."
                    value={topicPrompt}
                    onChange={(e) => setTopicPrompt(e.target.value)}
                    className="w-full bg-[#05080c] border border-emerald-900 focus:border-emerald-400 rounded p-3 text-xs text-emerald-200 outline-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 block font-bold">WRITING STYLE / TONE:</label>
                    <select
                      value={writingStyle}
                      onChange={(e) => setWritingStyle(e.target.value)}
                      className="w-full bg-black border border-emerald-900 focus:border-emerald-400 rounded px-2.5 py-2 text-xs text-emerald-300 outline-none"
                    >
                      <option value="Professional & Formal">Professional &amp; Formal</option>
                      <option value="Academic & Scholarly">Academic &amp; Scholarly</option>
                      <option value="Simple & Clear (Grade 8)">Simple &amp; Clear</option>
                      <option value="Persuasive & Executive">Persuasive &amp; Executive</option>
                      <option value="Creative & Engaging">Creative &amp; Engaging</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 block font-bold">TARGET LENGTH:</label>
                    <select
                      value={lengthPreference}
                      onChange={(e) => setLengthPreference(e.target.value)}
                      className="w-full bg-black border border-emerald-900 focus:border-emerald-400 rounded px-2.5 py-2 text-xs text-emerald-300 outline-none"
                    >
                      <option value="Concise (~400 words)">Concise (~400 words)</option>
                      <option value="Standard (~800 words)">Standard (~800 words)</option>
                      <option value="Comprehensive (~1,500 words)">Comprehensive (~1,500 words)</option>
                      <option value="In-depth Research (~2,500 words)">In-depth (~2,500 words)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 block font-bold">AUDIENCE / CLASS:</label>
                    <input
                      type="text"
                      placeholder="e.g. Executives, Grade 10, Recruiters"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full bg-black border border-emerald-900 focus:border-emerald-400 rounded px-3 py-2 text-xs text-emerald-300 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 block font-bold">
                    OPTIONAL REFERENCE TEXT / NOTES:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Paste any source research, key data points, or raw notes to include..."
                    value={referenceText}
                    onChange={(e) => setReferenceText(e.target.value)}
                    className="w-full bg-black border border-emerald-900 focus:border-emerald-400 rounded p-2 text-xs text-emerald-200 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Generation Error Display */}
            {generationError && (
              <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 rounded text-xs">
                ⚠️ {generationError}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTopicPrompt(activeToolMeta.samplePrompt)}
                  className="text-[11px] text-zinc-400 hover:text-emerald-300"
                >
                  Load Sample Prompt
                </button>
                {activeTool === 'presentation' && (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setCurrentView('editor');
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-200 underline font-bold"
                  >
                    Open Blank Slide Studio →
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={generating || !topicPrompt.trim()}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-extrabold px-6 py-2.5 rounded text-xs flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer"
              >
                {generating ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>GENERATING WITH GEMINI AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{activeTool === 'presentation' ? `GENERATE PRESENTATION (${slideCount} SLIDES)` : `GENERATE ${activeTool.toUpperCase()}`}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ================================================================= */}
        {/* VIEW 3: EDITABLE WORKSPACE & REAL FILE EXPORT */}
        {/* ================================================================= */}
        {currentView === 'editor' && (
          activeTool === 'presentation' ? (
            <div className="flex-1 flex flex-col rounded-lg overflow-hidden border border-emerald-950 min-h-[640px]">
              <PresentationStudio
                initialTitle={docTitle || 'Executive Presentation'}
                initialSlides={slides}
                initialTheme={pptTheme}
                onClose={onClose}
                onLog={onLog}
              />
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col">
              {/* Editor Action Header */}
              <div className="bg-[#070a0e] border border-emerald-950 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="bg-black border border-emerald-900 rounded px-2.5 py-1 text-xs text-emerald-300 font-bold focus:border-emerald-400 outline-none"
                  />
                  <button
                    onClick={handleSaveProject}
                    className="bg-black hover:bg-emerald-950 border border-emerald-900 text-emerald-300 px-2.5 py-1 rounded text-[11px] flex items-center gap-1 transition-colors"
                    title="Save project to local memory"
                  >
                    <Save className="w-3 h-3 text-emerald-400" />
                    <span>SAVE</span>
                  </button>
                </div>

                {/* REAL DOWNLOAD BUTTONS FOR DOCUMENTS */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleDownloadDocx}
                    disabled={downloadingDocx}
                    className="bg-blue-900/60 hover:bg-blue-600 text-white border border-blue-500 font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-950 cursor-pointer"
                    title="Download genuine Microsoft Word document (.docx)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingDocx ? 'EXPORTING...' : 'DOWNLOAD .DOCX'}</span>
                  </button>

                  <button
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf}
                    className="bg-red-900/60 hover:bg-red-600 text-white border border-red-500 font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-all shadow-md shadow-red-950 cursor-pointer"
                    title="Download publication-grade PDF (.pdf)"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>{downloadingPdf ? 'EXPORTING...' : 'DOWNLOAD .PDF'}</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    className="bg-black border border-emerald-900 text-emerald-300 hover:border-emerald-500 px-2.5 py-1.5 rounded text-xs flex items-center gap-1 transition-colors"
                    title="Copy full text"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText ? 'COPIED' : 'COPY'}</span>
                  </button>
                </div>
              </div>

              {/* DOCUMENT / REPORT / RESUME / PROJECT TEXT EDITOR */}
              <div className="flex-1 flex flex-col space-y-2">
                
                {/* Formatting Toolbar */}
                <div className="flex items-center gap-1.5 flex-wrap bg-[#05070a] border border-emerald-950 rounded p-1.5 text-xs">
                  <span className="text-[10px] text-zinc-500 mr-1 font-bold">FORMAT:</span>
                  <button
                    onClick={() => insertMarkdownTag('## ')}
                    className="p-1 px-2 bg-black hover:bg-emerald-950 border border-emerald-950 rounded text-emerald-300"
                    title="Insert Heading 1"
                  >
                    H1
                  </button>
                  <button
                    onClick={() => insertMarkdownTag('### ')}
                    className="p-1 px-2 bg-black hover:bg-emerald-950 border border-emerald-950 rounded text-emerald-300"
                    title="Insert Heading 2"
                  >
                    H2
                  </button>
                  <button
                    onClick={() => insertMarkdownTag('- ')}
                    className="p-1 px-2 bg-black hover:bg-emerald-950 border border-emerald-950 rounded text-emerald-300"
                    title="Insert Bullet Point"
                  >
                    • List
                  </button>
                  <button
                    onClick={() => insertMarkdownTag('**', '**')}
                    className="p-1 px-2 bg-black hover:bg-emerald-950 border border-emerald-950 rounded text-emerald-300 font-bold"
                    title="Bold"
                  >
                    B
                  </button>
                  <button
                    onClick={() => insertMarkdownTag('*', '*')}
                    className="p-1 px-2 bg-black hover:bg-emerald-950 border border-emerald-950 rounded text-emerald-300 italic"
                    title="Italic"
                  >
                    I
                  </button>

                  <div className="ml-auto text-[11px] text-zinc-400">
                    {editableContent.split(/\s+/).filter(Boolean).length} words • {editableContent.length} chars
                  </div>
                </div>

                {/* Main Content Text Area */}
                <textarea
                  rows={16}
                  value={editableContent}
                  onChange={(e) => setEditableContent(e.target.value)}
                  className="w-full flex-1 bg-[#05080c] border border-emerald-900 focus:border-emerald-400 rounded p-3 text-xs text-emerald-100 font-mono leading-relaxed outline-none"
                />
              </div>
            </div>
          )
        )}

        {/* ================================================================= */}
        {/* VIEW 4: SAVED PROJECTS & ARCHIVE */}
        {/* ================================================================= */}
        {currentView === 'projects' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-emerald-950 pb-2">
              <span className="font-bold">SAVED DOCUMENTS &amp; PRESENTATIONS</span>
              {savedProjects.length > 0 && (
                <button
                  onClick={() => {
                    setSavedProjects([]);
                    localStorage.removeItem(SAVED_PROJECTS_KEY);
                    soundEngine.playClick();
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  Clear All Projects
                </button>
              )}
            </div>

            {savedProjects.length === 0 ? (
              <div className="py-16 text-center text-zinc-600 space-y-1">
                <FolderOpen className="w-8 h-8 mx-auto text-zinc-700" />
                <p className="font-bold text-zinc-500">NO SAVED PROJECTS YET</p>
                <p className="text-[11px]">Generate any document or presentation and click &ldquo;SAVE&rdquo; to store it here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                {savedProjects.map((p) => (
                  <div
                    key={p.id}
                    className="bg-[#070a0e] border border-emerald-950 hover:border-emerald-700 p-3 rounded-lg flex flex-col justify-between space-y-2 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                        <span className="uppercase text-emerald-500 font-bold">{p.toolType}</span>
                        <span>{p.date}</span>
                      </div>
                      <h4 className="font-bold text-xs text-emerald-300 truncate">{p.title}</h4>
                      <p className="text-[11px] text-zinc-400 line-clamp-3 mt-1">
                        {p.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-emerald-950/60">
                      <button
                        onClick={() => loadProject(p)}
                        className="text-xs text-emerald-400 hover:underline font-bold"
                      >
                        Open Editor →
                      </button>
                      <button
                        onClick={() => deleteProject(p.id)}
                        className="text-zinc-600 hover:text-red-400 p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </ModalWrapper>
  );
};
