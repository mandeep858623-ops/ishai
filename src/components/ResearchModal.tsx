import React, { useState, useEffect, useRef } from 'react';
import { soundEngine, speakText } from '../utils/audio';
import {
  Search,
  BookOpen,
  FileText,
  ExternalLink,
  Download,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Calendar,
  Globe,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Volume2,
  Printer,
  ChevronRight,
  FolderOpen,
  ArrowRight,
  MessageSquare,
  Send,
  Loader2,
  Trash2,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export interface ResearchSource {
  id: number;
  title: string;
  url: string;
  publisher: string;
  date?: string;
  snippet: string;
  sourceType: 'web' | 'academic' | 'encyclopedia' | 'government' | 'news';
  extractedText?: string;
}

export interface ResearchReport {
  id: string;
  topic: string;
  depth: 'quick' | 'standard' | 'deep';
  dateRange: string;
  preferredSources: string;
  language: string;
  timestamp: string;
  title: string;
  executiveSummary: string;
  background: string;
  keyFindings: Array<{ text: string; citationIds: number[] }>;
  detailedAnalysis: string;
  evidenceAndFacts: Array<{ claim: string; metricOrDate: string; citationIds: number[]; confidence: 'high' | 'moderate' | 'emerging' }>;
  viewpointsComparison: {
    consensus: string;
    debatesAndDisagreements: string;
  };
  datesAndStatistics: Array<{ item: string; detail: string; citationId?: number }>;
  limitations: string[];
  conclusion: string;
  sources: ResearchSource[];
  methodology: {
    queriesExecuted: string[];
    sourcesAnalyzedCount: number;
    pagesCrawledCount: number;
    completionTimeSeconds: number;
  };
  rawMarkdown: string;
}

interface ResearchModalProps {
  onClose: () => void;
  onLog: (text: string, tag: string) => void;
  voiceGender?: 'Male' | 'Female';
  audioMuted?: boolean;
  initialTopic?: string;
}

const EXAMPLE_TOPICS = [
  'Solid-state battery commercialization timeline and current breakthroughs',
  'Recent advancements in quantum computing error correction (2025-2026)',
  'Global semiconductor supply chain shifts and regional fab expansions',
  'CRISPR gene therapy approvals and clinical trial efficacy in 2025-2026',
  'Commercial nuclear fusion: SPARC, ITER, and private stellarators progress',
  'Next-generation AI inference accelerators: GPU vs Custom Silicon benchmarks',
];

const STORAGE_KEY = 'superai_deep_research_saved_reports';

export const ResearchModal: React.FC<ResearchModalProps> = ({
  onClose,
  onLog,
  voiceGender = 'Male',
  audioMuted = false,
  initialTopic = '',
}) => {
  // Input parameters
  const [topic, setTopic] = useState(initialTopic);
  const [depth, setDepth] = useState<'quick' | 'standard' | 'deep'>('standard');
  const [dateRange, setDateRange] = useState('all');
  const [preferredSources, setPreferredSources] = useState('all');
  const [language, setLanguage] = useState('English');
  const [showFilters, setShowFilters] = useState(false);

  // Execution state
  const [isResearching, setIsResearching] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [activeQueries, setActiveQueries] = useState<string[]>([]);
  const [liveSources, setLiveSources] = useState<ResearchSource[]>([]);
  const [crawledUrls, setCrawledUrls] = useState<string[]>([]);

  // Results state
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [activeTab, setActiveTab] = useState<'report' | 'sources' | 'evidence' | 'followup'>('report');
  const [selectedSource, setSelectedSource] = useState<ResearchSource | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Saved reports library drawer
  const [showSavedDrawer, setShowSavedDrawer] = useState(false);
  const [savedReports, setSavedReports] = useState<ResearchReport[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Follow-up Q&A state
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpHistory, setFollowUpHistory] = useState<Array<{ question: string; answer: string; timestamp: string }>>([]);

  // Transform actions state (simplify, expand, translate)
  const [transforming, setTransforming] = useState(false);
  const [transformMessage, setTransformMessage] = useState('');

  // Auto-scroll progress container
  const progressLogsRef = useRef<HTMLDivElement>(null);
  const followUpEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (progressLogsRef.current) {
      progressLogsRef.current.scrollTop = progressLogsRef.current.scrollHeight;
    }
  }, [liveSources, statusMessage]);

  useEffect(() => {
    followUpEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [followUpHistory, followUpLoading]);

  // Start research handler
  const startResearch = async (searchTopic?: string) => {
    const targetTopic = (searchTopic || topic).trim();
    if (!targetTopic || isResearching) return;

    soundEngine.playClick();
    setIsResearching(true);
    setProgress(5);
    setCurrentStage('UNDERSTANDING');
    setStatusMessage(`Initiating deep research for "${targetTopic}"...`);
    setActiveQueries([]);
    setLiveSources([]);
    setCrawledUrls([]);
    setReport(null);
    setFollowUpHistory([]);
    setSelectedSource(null);

    onLog(`🔬 Initiating Deep Research [${depth.toUpperCase()}]: "${targetTopic}"`, 'INTELLIGENCE');

    if (!audioMuted) {
      speakText('Initiating multi-source deep web research protocol.', voiceGender);
    }

    try {
      const response = await fetch('/api/ai/deep-research/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: targetTopic,
          depth,
          dateRange,
          preferredSources,
          language,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evt of events) {
          const trimmed = evt.trim();
          if (!trimmed.startsWith('data:')) continue;
          try {
            const data = JSON.parse(trimmed.replace(/^data:\s*/, ''));

            if (data.type === 'stage') {
              if (data.stage) setCurrentStage(data.stage);
              if (data.progress) setProgress(data.progress);
              if (data.message) setStatusMessage(data.message);
            } else if (data.type === 'query') {
              if (data.query) {
                setActiveQueries((prev) => (prev.includes(data.query) ? prev : [...prev, data.query]));
              }
            } else if (data.type === 'source_found') {
              if (data.source) {
                setLiveSources((prev) => [...prev, data.source]);
              }
              if (data.progress) setProgress(data.progress);
              if (data.message) setStatusMessage(data.message);
            } else if (data.type === 'source_crawled') {
              if (data.url) {
                setCrawledUrls((prev) => [...prev, data.url]);
              }
              if (data.progress) setProgress(data.progress);
              if (data.message) setStatusMessage(data.message);
            } else if (data.type === 'complete' && data.report) {
              setReport(data.report);
              setProgress(100);
              setCurrentStage('COMPLETE');
              setStatusMessage(data.message || 'Research completed.');
              soundEngine.playSuccess();
              onLog(`✅ Deep Research complete: "${data.report.title}" (${data.report.sources.length} sources verified)`, 'INTELLIGENCE');

              if (!audioMuted) {
                speakText(`Research completed. ${data.report.sources.length} independent sources verified.`, voiceGender);
              }
            } else if (data.type === 'error') {
              throw new Error(data.error || 'Deep research error');
            }
          } catch (e: any) {
            console.warn('Error parsing SSE event:', e);
          }
        }
      }
    } catch (err: any) {
      console.error('Research error:', err);
      setStatusMessage(`Error: ${err?.message || 'Research process failed'}`);
      soundEngine.playAlertBeep();
      onLog(`⚠️ Deep Research error: ${err?.message || 'Failed to complete research'}`, 'ALERT');
    } finally {
      setIsResearching(false);
    }
  };

  // Save report to localStorage
  const saveReportToStorage = (targetReport: ResearchReport) => {
    soundEngine.playClick();
    const updated = [targetReport, ...savedReports.filter((r) => r.id !== targetReport.id)].slice(0, 30);
    setSavedReports(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Delete saved report
  const deleteSavedReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playClick();
    const updated = savedReports.filter((r) => r.id !== id);
    setSavedReports(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Copy full report
  const copyReportMarkdown = () => {
    if (!report) return;
    soundEngine.playClick();
    navigator.clipboard.writeText(report.rawMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export report to Markdown (.md)
  const exportMarkdown = () => {
    if (!report) return;
    soundEngine.playClick();
    const blob = new Blob([report.rawMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_ResearchReport.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export / Print PDF
  const exportPDF = () => {
    if (!report) return;
    soundEngine.playClick();
    window.print();
  };

  // Read aloud executive summary
  const readExecutiveSummary = () => {
    if (!report || !report.executiveSummary) return;
    soundEngine.playClick();
    speakText(report.executiveSummary, voiceGender);
  };

  // Handle follow-up submit
  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpQuestion.trim() || !report || followUpLoading) return;

    const q = followUpQuestion.trim();
    setFollowUpQuestion('');
    setFollowUpLoading(true);
    soundEngine.playClick();

    try {
      const res = await fetch('/api/ai/deep-research/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, report }),
      });
      const data = await res.json();
      const answer = data.answer || 'No analysis available.';

      setFollowUpHistory((prev) => [
        ...prev,
        { question: q, answer, timestamp: new Date().toLocaleTimeString() },
      ]);
      soundEngine.playSuccess();
    } catch (err: any) {
      setFollowUpHistory((prev) => [
        ...prev,
        { question: q, answer: `Follow-up error: ${err.message}`, timestamp: new Date().toLocaleTimeString() },
      ]);
    } finally {
      setFollowUpLoading(false);
    }
  };

  // Handle transform action (simplify, expand, translate)
  const handleTransform = async (action: 'simplify' | 'expand' | 'translate', targetLang?: string) => {
    if (!report || transforming) return;
    soundEngine.playClick();
    setTransforming(true);
    setTransformMessage(
      action === 'simplify'
        ? 'Simplifying analysis...'
        : action === 'expand'
        ? 'Expanding technical analysis with deep evidence...'
        : `Translating report into ${targetLang}...`
    );

    try {
      const res = await fetch('/api/ai/deep-research/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          targetLanguage: targetLang,
          content: report.detailedAnalysis,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setReport((prev) => (prev ? { ...prev, detailedAnalysis: data.result } : null));
        soundEngine.playSuccess();
      }
    } catch (err) {
      console.warn('Transform failed:', err);
    } finally {
      setTransforming(false);
      setTransformMessage('');
    }
  };

  // Deepen research into a specific finding
  const handleDeepenFinding = (findingText: string) => {
    const subTopic = `${topic}: ${findingText.replace(/\[\d+\]/g, '').slice(0, 100)}`;
    setTopic(subTopic);
    setDepth('deep');
    startResearch(subTopic);
  };

  // Citation link click handler
  const handleCitationClick = (citationId: number) => {
    soundEngine.playClick();
    const found = (report?.sources || liveSources).find((s) => s.id === citationId);
    if (found) {
      setSelectedSource(found);
      setActiveTab('sources');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#090b0e] border border-emerald-500/80 shadow-[0_0_35px_rgba(16,185,129,0.25)] rounded-xl max-w-6xl w-full h-[92dvh] flex flex-col font-mono text-zinc-100 overflow-hidden my-auto">
        {/* TOP WINDOW HEADER */}
        <div className="flex items-center justify-between border-b border-emerald-500/40 px-3.5 py-2.5 sm:px-5 sm:py-3 bg-[#0d1219] shrink-0">
          <div className="flex items-center gap-2 truncate pr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <h3 className="font-bold text-xs sm:text-sm tracking-wider uppercase text-emerald-300 truncate font-mono">
              🔬 SUPERAI DEEP RESEARCH WORKSPACE
            </h3>
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="text-[11px] sm:text-xs border border-emerald-500/60 px-2.5 py-1 rounded hover:bg-emerald-500 hover:text-black transition-colors shrink-0 active:scale-95 font-mono"
          >
            [ ✕ CLOSE ]
          </button>
        </div>

        <div className="flex flex-col flex-1 text-zinc-100 font-sans select-text bg-[#090b0e] overflow-hidden">
        {/* TOP STATUS BAR */}
        <div className="bg-[#0e131b] border-b border-emerald-900/40 px-4 py-2 flex items-center justify-between text-xs font-mono shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              DEEP RESEARCH ENGINE v4.2
            </span>
            <span className="text-zinc-600 hidden sm:inline">|</span>
            <span className="text-cyan-400 text-[11px] hidden sm:inline">
              🌐 ZERO-HALLUCINATION WEB GROUNDING
            </span>
            <span className="text-zinc-600 hidden md:inline">|</span>
            <span className="text-zinc-400 text-[11px] hidden md:inline">
              PEER-REVIEWED & ENCYCLOPEDIC REPOSITORIES
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSavedDrawer(!showSavedDrawer)}
              className="flex items-center gap-1 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs px-2.5 py-1 rounded border border-zinc-700 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Library ({savedReports.length})</span>
            </button>
          </div>
        </div>

        {/* MAIN BODY AREA */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* LEFT / MAIN WORKSPACE */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#090b0e]">
            {/* INPUT PANEL (ALWAYS ACCESSIBLE OR EXPANDABLE) */}
            <div className="p-3 sm:p-4 border-b border-zinc-800/80 bg-[#0d1219]/70 shrink-0">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      rows={2}
                      placeholder="What do you want to research? (e.g. Next-generation solid-state battery chemistry, Quantum computing error mitigation, CRISPR approvals in 2025)..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          startResearch();
                        }
                      }}
                      disabled={isResearching}
                      className="w-full bg-[#07090d] border border-emerald-900/60 focus:border-emerald-500 rounded-lg p-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors resize-none scrollbar-thin"
                    />
                  </div>

                  <button
                    onClick={() => startResearch()}
                    disabled={isResearching || !topic.trim()}
                    className={`h-[68px] px-5 rounded-lg font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shrink-0 ${
                      isResearching || !topic.trim()
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-black border border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    }`}
                  >
                    {isResearching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>RESEARCHING...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>DEEP RESEARCH</span>
                      </>
                    )}
                  </button>
                </div>

                {/* DEPTH SELECTION & FILTERS TOGGLE */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-zinc-500 font-mono text-[11px] mr-1">DEPTH:</span>
                    <button
                      onClick={() => setDepth('quick')}
                      disabled={isResearching}
                      className={`px-2.5 py-1 rounded text-xs font-mono transition-colors border ${
                        depth === 'quick'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 font-bold'
                          : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                      title="Fast brief (~3-5 sources • 15s)"
                    >
                      ⚡ Quick
                    </button>
                    <button
                      onClick={() => setDepth('standard')}
                      disabled={isResearching}
                      className={`px-2.5 py-1 rounded text-xs font-mono transition-colors border ${
                        depth === 'standard'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 font-bold'
                          : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                      title="Standard in-depth synthesis (6-10 sources • 30s)"
                    >
                      📑 Standard
                    </button>
                    <button
                      onClick={() => setDepth('deep')}
                      disabled={isResearching}
                      className={`px-2.5 py-1 rounded text-xs font-mono transition-colors border ${
                        depth === 'deep'
                          ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                          : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                      title="Exhaustive investigation (10-18+ sources • 45s)"
                    >
                      🔬 Deep Research
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
                        showFilters
                          ? 'bg-zinc-800 text-zinc-200 border-zinc-600'
                          : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Filters {dateRange !== 'all' || preferredSources !== 'all' || language !== 'English' ? '●' : ''}</span>
                    </button>
                  </div>
                </div>

                {/* EXPANDABLE ADVANCED FILTERS */}
                {showFilters && (
                  <div className="p-3 bg-[#07090d] border border-zinc-800 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-in fade-in duration-150">
                    <div>
                      <label className="text-zinc-400 font-mono text-[11px] block mb-1">
                        📅 Date Range:
                      </label>
                      <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="w-full bg-[#12161f] border border-zinc-700 rounded px-2 py-1 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option value="all">Any time</option>
                        <option value="2024-2026">2024-2026 Latest</option>
                        <option value="past_year">Past Year</option>
                        <option value="past_month">Past Month</option>
                        <option value="past_week">Past Week</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-zinc-400 font-mono text-[11px] block mb-1">
                        🏛️ Preferred Sources:
                      </label>
                      <select
                        value={preferredSources}
                        onChange={(e) => setPreferredSources(e.target.value)}
                        className="w-full bg-[#12161f] border border-zinc-700 rounded px-2 py-1 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option value="all">All Reputable Sources</option>
                        <option value="academic">Academic Papers & Journals (arXiv, CrossRef, .edu)</option>
                        <option value="government">Official & Government (.gov, UN, NIST, WHO)</option>
                        <option value="news">Tech & Financial News Media</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-zinc-400 font-mono text-[11px] block mb-1">
                        🌐 Research Language:
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full bg-[#12161f] border border-zinc-700 rounded px-2 py-1 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
                      >
                        <option value="English">English</option>
                        <option value="Español">Español (Spanish)</option>
                        <option value="Français">Français (French)</option>
                        <option value="Deutsch">Deutsch (German)</option>
                        <option value="中文">中文 (Chinese)</option>
                        <option value="日本語">日本語 (Japanese)</option>
                        <option value="हिन्दी">हिन्दी (Hindi)</option>
                        <option value="Português">Português (Portuguese)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* EXAMPLE TOPIC CHIPS (WHEN NO REPORT IS ACTIVE) */}
                {!report && !isResearching && (
                  <div className="pt-1">
                    <span className="text-[11px] text-zinc-500 font-mono block mb-1.5">
                      💡 EXPLORE VERIFIED RESEARCH TOPICS:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {EXAMPLE_TOPICS.map((ex, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setTopic(ex);
                            startResearch(ex);
                          }}
                          className="bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-300 border border-zinc-800 text-[11px] px-2.5 py-1 rounded-full transition-colors text-left flex items-center gap-1"
                        >
                          <ChevronRight className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="truncate max-w-[260px] sm:max-w-none">{ex}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* LIVE RESEARCH PROGRESS DISPLAY */}
            {isResearching && (
              <div className="p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto flex-1">
                {/* CYBER PROGRESS HUD */}
                <div className="bg-[#0b0f15] border border-emerald-900/60 rounded-xl p-4 sm:p-5 shadow-[0_0_25px_rgba(16,185,129,0.15)] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                      <span className="font-mono text-sm font-bold text-emerald-300">
                        STAGE: {currentStage}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-sm text-emerald-400">
                      {progress}%
                    </span>
                  </div>

                  {/* PROGRESS BAR */}
                  <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300 ease-out shadow-[0_0_15px_rgba(16,185,129,0.6)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <p className="text-xs font-mono text-zinc-300">
                    {statusMessage}
                  </p>

                  {/* STAGES STEPPER */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-2 border-t border-zinc-800/80 text-[10px] font-mono">
                    {[
                      { key: 'UNDERSTANDING', label: '1. Strategy' },
                      { key: 'SEARCHING', label: '2. Live Search' },
                      { key: 'REVIEWING', label: '3. Web Crawler' },
                      { key: 'COMPARING', label: '4. Evidence' },
                      { key: 'WRITING', label: '5. Synthesis' },
                      { key: 'COMPLETE', label: '6. Report' },
                    ].map((st, idx) => {
                      const isPast =
                        st.key === currentStage ||
                        (st.key === 'UNDERSTANDING' && progress >= 15) ||
                        (st.key === 'SEARCHING' && progress >= 30) ||
                        (st.key === 'REVIEWING' && progress >= 60) ||
                        (st.key === 'COMPARING' && progress >= 75) ||
                        (st.key === 'WRITING' && progress >= 85) ||
                        (st.key === 'COMPLETE' && progress >= 100);

                      const isCurrent = st.key === currentStage;

                      return (
                        <div
                          key={idx}
                          className={`p-1.5 rounded text-center border transition-colors ${
                            isCurrent
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500 font-bold'
                              : isPast
                              ? 'bg-zinc-900/60 text-zinc-300 border-zinc-800'
                              : 'bg-zinc-950/40 text-zinc-600 border-zinc-900'
                          }`}
                        >
                          {st.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* REAL-TIME DISCOVERED SOURCES STREAM */}
                <div className="flex-1 flex flex-col min-h-0 bg-[#07090d] border border-zinc-800 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2">
                    <span className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      DISCOVERED SOURCES STREAM ({liveSources.length})
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      Pages Analyzed: {crawledUrls.length}
                    </span>
                  </div>

                  <div
                    ref={progressLogsRef}
                    className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs scrollbar-thin scrollbar-thumb-zinc-800"
                  >
                    {liveSources.map((src) => (
                      <div
                        key={src.id}
                        className="bg-[#0e131b] border border-zinc-800/80 hover:border-emerald-700/60 p-2.5 rounded-lg flex flex-col gap-1 text-zinc-300 transition-colors"
                      >
                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <span className="text-emerald-400 font-bold">[{src.id}] {src.publisher}</span>
                          <span className="text-[10px] uppercase bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">
                            {src.sourceType}
                          </span>
                        </div>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-sans font-semibold text-cyan-300 hover:text-cyan-200 hover:underline truncate"
                        >
                          {src.title}
                        </a>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 font-sans">
                          {src.snippet}
                        </p>
                      </div>
                    ))}

                    {liveSources.length === 0 && (
                      <div className="h-32 flex items-center justify-center text-zinc-600 text-xs font-mono">
                        Connecting to live multi-engine search indexers...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* RESEARCH REPORT VIEW (WHEN READY) */}
            {report && !isResearching && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* TOOLBAR CONTROLS */}
                <div className="bg-[#0b0f15] border-b border-zinc-800 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
                  {/* TABS */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveTab('report')}
                      className={`px-3 py-1 rounded text-xs font-mono flex items-center gap-1.5 border transition-colors ${
                        activeTab === 'report'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 font-bold'
                          : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Report</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('sources')}
                      className={`px-3 py-1 rounded text-xs font-mono flex items-center gap-1.5 border transition-colors ${
                        activeTab === 'sources'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 font-bold'
                          : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Sources ({report.sources.length})</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('evidence')}
                      className={`px-3 py-1 rounded text-xs font-mono flex items-center gap-1.5 border transition-colors ${
                        activeTab === 'evidence'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 font-bold'
                          : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Evidence Matrix</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('followup')}
                      className={`px-3 py-1 rounded text-xs font-mono flex items-center gap-1.5 border transition-colors ${
                        activeTab === 'followup'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 font-bold'
                          : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ask Follow-up {followUpHistory.length > 0 ? `(${followUpHistory.length})` : ''}</span>
                    </button>
                  </div>

                  {/* ACTION CONTROLS */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={readExecutiveSummary}
                      className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:text-emerald-400 text-xs transition-colors"
                      title="Read aloud executive summary"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={copyReportMarkdown}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs transition-colors"
                      title="Copy clean report markdown"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={exportMarkdown}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs transition-colors"
                      title="Download Markdown (.md)"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="hidden sm:inline">.MD</span>
                    </button>

                    <button
                      onClick={exportPDF}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs transition-colors"
                      title="Print / Save PDF"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">PDF</span>
                    </button>

                    <button
                      onClick={() => saveReportToStorage(report)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs border transition-colors ${
                        savedSuccess
                          ? 'bg-emerald-900/80 text-emerald-300 border-emerald-500'
                          : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 border-emerald-800'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{savedSuccess ? 'Saved' : 'Save'}</span>
                    </button>
                  </div>
                </div>

                {/* TRANSFORM STATUS BANNER */}
                {transforming && (
                  <div className="bg-cyan-950/80 border-b border-cyan-800 px-4 py-1.5 flex items-center justify-between text-xs text-cyan-300 font-mono animate-pulse">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {transformMessage}
                    </span>
                  </div>
                )}

                {/* TAB 1: MAIN REPORT VIEWER */}
                {activeTab === 'report' && (
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
                    {/* REPORT HEADER */}
                    <div className="border-b border-zinc-800 pb-4">
                      <div className="flex flex-wrap items-center gap-2 mb-2 text-xs font-mono text-zinc-400">
                        <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded uppercase font-bold">
                          {report.depth} RESEARCH
                        </span>
                        <span>•</span>
                        <span>{report.sources.length} Verified Sources</span>
                        <span>•</span>
                        <span>Completed in {report.methodology.completionTimeSeconds}s</span>
                        <span>•</span>
                        <span>{report.timestamp}</span>
                      </div>
                      <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 font-sans tracking-tight">
                        {report.title}
                      </h1>
                    </div>

                    {/* SECTION 1: EXECUTIVE SUMMARY */}
                    <div className="bg-[#0b0f16] border border-emerald-900/50 rounded-xl p-4 sm:p-5 shadow-sm">
                      <h2 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        1. Executive Summary
                      </h2>
                      <div className="text-sm text-zinc-200 leading-relaxed font-sans">
                        <FormattedWithCitations text={report.executiveSummary} onCitationClick={handleCitationClick} />
                      </div>
                    </div>

                    {/* SECTION 2: BACKGROUND & CONTEXT */}
                    <div className="bg-[#0b0f16] border border-zinc-800/80 rounded-xl p-4 sm:p-5">
                      <h2 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        2. Background & Technical Foundations
                      </h2>
                      <div className="text-sm text-zinc-300 leading-relaxed font-sans">
                        <FormattedWithCitations text={report.background} onCitationClick={handleCitationClick} />
                      </div>
                    </div>

                    {/* SECTION 3: KEY FINDINGS */}
                    <div className="bg-[#0b0f16] border border-zinc-800/80 rounded-xl p-4 sm:p-5">
                      <h2 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        3. Key Verified Findings
                      </h2>
                      <div className="space-y-2.5">
                        {report.keyFindings.map((finding, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-[#07090d] border border-zinc-800/70 rounded-lg flex items-start justify-between gap-3 group hover:border-emerald-800/60 transition-colors"
                          >
                            <div className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-mono flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <div className="text-sm text-zinc-200 leading-relaxed">
                                <FormattedWithCitations text={finding.text} onCitationClick={handleCitationClick} />
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeepenFinding(finding.text)}
                              className="opacity-0 group-hover:opacity-100 shrink-0 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded transition-all"
                              title="Initiate deeper targeted research on this finding"
                            >
                              Deepen 🔬
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 4: DETAILED ANALYSIS */}
                    <div className="bg-[#0b0f16] border border-zinc-800/80 rounded-xl p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                          <Layers className="w-4 h-4" />
                          4. Detailed In-Depth Analysis
                        </h2>

                        {/* TRANSFORM CONTROLS */}
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <button
                            onClick={() => handleTransform('simplify')}
                            className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
                          >
                            Simplify
                          </button>
                          <button
                            onClick={() => handleTransform('expand')}
                            className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
                          >
                            Expand
                          </button>
                        </div>
                      </div>

                      <div className="text-sm text-zinc-300 leading-relaxed space-y-3 font-sans">
                        <FormattedWithCitations text={report.detailedAnalysis} onCitationClick={handleCitationClick} />
                      </div>
                    </div>

                    {/* SECTION 5: VIEWPOINTS & DEBATE */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#0b0f16] border border-emerald-900/40 rounded-xl p-4">
                        <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Expert Consensus
                        </h3>
                        <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                          <FormattedWithCitations text={report.viewpointsComparison.consensus} onCitationClick={handleCitationClick} />
                        </p>
                      </div>

                      <div className="bg-[#0b0f16] border border-amber-900/40 rounded-xl p-4">
                        <h3 className="text-xs font-mono font-bold text-amber-400 uppercase mb-2 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Debates & Conflicting Claims
                        </h3>
                        <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                          <FormattedWithCitations text={report.viewpointsComparison.debatesAndDisagreements} onCitationClick={handleCitationClick} />
                        </p>
                      </div>
                    </div>

                    {/* SECTION 6: LIMITATIONS & UNRESOLVED QUESTIONS */}
                    <div className="bg-[#0b0f16] border border-zinc-800/80 rounded-xl p-4 sm:p-5">
                      <h2 className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4" />
                        5. Limitations & Unresolved Questions
                      </h2>
                      <ul className="space-y-1.5 text-xs text-zinc-300 font-sans list-disc list-inside">
                        {report.limitations.map((lim, i) => (
                          <li key={i} className="leading-relaxed">
                            <FormattedWithCitations text={lim} onCitationClick={handleCitationClick} />
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* SECTION 7: FINAL CONCLUSION */}
                    <div className="bg-[#0b0f16] border border-emerald-900/60 rounded-xl p-4 sm:p-5">
                      <h2 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        6. Final Strategic Conclusion
                      </h2>
                      <div className="text-sm text-zinc-200 leading-relaxed font-sans">
                        <FormattedWithCitations text={report.conclusion} onCitationClick={handleCitationClick} />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: VERIFIED SOURCES PANEL */}
                {activeTab === 'sources' && (
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <div>
                        <h2 className="text-sm font-mono font-bold text-emerald-400">
                          VERIFIED INDEPENDENT SOURCE DOCKET ({report.sources.length})
                        </h2>
                        <p className="text-xs text-zinc-400">
                          Every claim is cited against these verified public, academic, and governmental references.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {report.sources.map((src) => (
                        <div
                          key={src.id}
                          className={`bg-[#0b0f16] border rounded-xl p-3.5 flex flex-col justify-between gap-2.5 transition-colors ${
                            selectedSource?.id === src.id
                              ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                              : 'border-zinc-800/80 hover:border-zinc-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between text-xs font-mono mb-1 text-zinc-400">
                              <span className="text-emerald-400 font-bold">[{src.id}] {src.publisher}</span>
                              <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                                {src.sourceType}
                              </span>
                            </div>
                            <h3 className="text-sm font-semibold text-zinc-100 hover:text-cyan-300 transition-colors">
                              {src.title}
                            </h3>
                            <p className="text-xs text-zinc-400 mt-1 line-clamp-3 leading-relaxed font-sans">
                              {src.snippet}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs font-mono">
                            <span className="text-[11px] text-zinc-500">
                              {src.date ? `Date: ${src.date}` : 'Verified Source'}
                            </span>
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs hover:underline"
                            >
                              <span>Open Source</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: EVIDENCE & METRICS MATRIX */}
                {activeTab === 'evidence' && (
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
                    <div>
                      <h2 className="text-sm font-mono font-bold text-emerald-400 mb-1">
                        VERIFIED FACTS & EMPIRICAL EVIDENCE MATRIX
                      </h2>
                      <p className="text-xs text-zinc-400">
                        Cross-referenced metrics, benchmark results, and milestone assertions extracted from independent pages.
                      </p>
                    </div>

                    {/* EVIDENCE CLAIMS TABLE */}
                    <div className="border border-zinc-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-[#0e131b] text-zinc-400 border-b border-zinc-800">
                          <tr>
                            <th className="p-3">Verified Claim</th>
                            <th className="p-3">Metric / Milestone</th>
                            <th className="p-3">Confidence</th>
                            <th className="p-3 text-right">Source Citations</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 font-sans">
                          {report.evidenceAndFacts.map((ef, idx) => (
                            <tr key={idx} className="hover:bg-zinc-900/40">
                              <td className="p-3 text-zinc-200">{ef.claim}</td>
                              <td className="p-3 text-cyan-300 font-mono text-[11px]">{ef.metricOrDate}</td>
                              <td className="p-3">
                                <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                                  ef.confidence === 'high'
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                                }`}>
                                  {ef.confidence}
                                </span>
                              </td>
                              <td className="p-3 text-right font-mono">
                                {ef.citationIds.map((cid) => (
                                  <button
                                    key={cid}
                                    onClick={() => handleCitationClick(cid)}
                                    className="ml-1 text-[11px] text-cyan-400 hover:text-cyan-200 underline font-bold"
                                  >
                                    [{cid}]
                                  </button>
                                ))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* DATES & STATS BREAKDOWN */}
                    <div>
                      <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2">
                        📅 Milestones & Quantitative Data Points
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {report.datesAndStatistics.map((ds, idx) => (
                          <div key={idx} className="bg-[#0b0f16] border border-zinc-800/80 p-3 rounded-lg flex items-start justify-between gap-2 text-xs">
                            <span className="font-semibold text-zinc-200">{ds.item}</span>
                            <span className="text-emerald-400 font-mono text-[11px] text-right shrink-0">
                              {ds.detail}
                              {ds.citationId && (
                                <button
                                  onClick={() => handleCitationClick(ds.citationId!)}
                                  className="ml-1 text-cyan-400 hover:underline"
                                >
                                  [{ds.citationId}]
                                </button>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: INTERACTIVE FOLLOW-UP WORKSPACE */}
                {activeTab === 'followup' && (
                  <div className="flex-1 flex flex-col overflow-hidden bg-[#07090d]">
                    <div className="p-3 bg-[#0d1219] border-b border-zinc-800 text-xs font-mono text-zinc-300 flex items-center justify-between">
                      <span>💬 INTERACTIVE RESEARCH CONSULTATION</span>
                      <span className="text-zinc-500 text-[11px]">
                        Grounded in {report.sources.length} sources and report findings
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
                      {followUpHistory.length === 0 && (
                        <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-zinc-500 text-xs">
                          <HelpCircle className="w-8 h-8 text-zinc-700 mb-2" />
                          <p className="font-semibold text-zinc-400">Ask any follow-up question about this research</p>
                          <p className="text-[11px] mt-1 text-zinc-500 max-w-md">
                            Queries are answered strictly using verified evidence from the synthesized report and web sources.
                          </p>
                        </div>
                      )}

                      {followUpHistory.map((item, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="bg-zinc-800/80 rounded-lg p-3 text-xs text-zinc-200 font-mono max-w-[85%] ml-auto border border-zinc-700/60">
                            <span className="text-emerald-400 font-bold block mb-1">YOU:</span>
                            {item.question}
                          </div>
                          <div className="bg-[#0b0f16] rounded-lg p-3.5 text-xs text-zinc-200 font-sans max-w-[95%] border border-emerald-900/40 space-y-1.5 leading-relaxed">
                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 border-b border-zinc-800 pb-1 mb-1">
                              <span className="text-cyan-400 font-bold">🔬 DEEP RESEARCH ANALYST</span>
                              <span>{item.timestamp}</span>
                            </div>
                            <FormattedWithCitations text={item.answer} onCitationClick={handleCitationClick} />
                          </div>
                        </div>
                      ))}

                      {followUpLoading && (
                        <div className="bg-[#0b0f16] rounded-lg p-3 text-xs text-zinc-400 font-mono flex items-center gap-2 border border-emerald-900/40">
                          <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                          <span>Cross-referencing research dossier and synthesizing response...</span>
                        </div>
                      )}

                      <div ref={followUpEndRef} />
                    </div>

                    {/* FOLLOW-UP INPUT BAR */}
                    <form onSubmit={handleFollowUpSubmit} className="p-3 bg-[#0d1219] border-t border-zinc-800 flex gap-2">
                      <input
                        type="text"
                        placeholder="Ask follow-up question (e.g. Which company has the nearest production timeline?)..."
                        value={followUpQuestion}
                        onChange={(e) => setFollowUpQuestion(e.target.value)}
                        disabled={followUpLoading}
                        className="flex-1 bg-[#07090d] border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="submit"
                        disabled={followUpLoading || !followUpQuestion.trim()}
                        className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-black disabled:text-zinc-600 font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Ask</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SAVED REPORTS SIDE DRAWER */}
          {showSavedDrawer && (
            <div className="w-full md:w-80 bg-[#0a0d13] border-l border-zinc-800 flex flex-col shrink-0 z-20">
              <div className="p-3 border-b border-zinc-800 flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                  SAVED RESEARCH ARCHIVE ({savedReports.length})
                </span>
                <button
                  onClick={() => setShowSavedDrawer(false)}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800">
                {savedReports.length === 0 && (
                  <div className="text-center py-10 text-zinc-600 text-xs font-mono">
                    No saved research reports yet.
                  </div>
                )}

                {savedReports.map((saved) => (
                  <div
                    key={saved.id}
                    onClick={() => {
                      soundEngine.playClick();
                      setReport(saved);
                      setShowSavedDrawer(false);
                      setActiveTab('report');
                    }}
                    className="p-3 bg-[#0d121a] hover:bg-[#121822] border border-zinc-800 hover:border-emerald-700/60 rounded-lg cursor-pointer transition-colors group text-left"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1">
                      <span className="uppercase text-emerald-400 font-bold">{saved.depth}</span>
                      <span>{saved.timestamp.split(',')[0]}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-zinc-200 line-clamp-2 group-hover:text-emerald-300">
                      {saved.title}
                    </h4>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/60 text-[10px] font-mono text-zinc-500">
                      <span>{saved.sources.length} sources</span>
                      <button
                        onClick={(e) => deleteSavedReport(saved.id, e)}
                        className="text-zinc-600 hover:text-red-400 p-1"
                        title="Delete saved report"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
};

// ----------------------------------------------------------------------------
// HELPER: FORMAT TEXT WITH INTERACTIVE CITATION BUTTONS
// ----------------------------------------------------------------------------
const FormattedWithCitations: React.FC<{
  text: string;
  onCitationClick: (id: number) => void;
}> = ({ text, onCitationClick }) => {
  // Regex to match citation tags like [1], [2], [1, 2], [1, 3, 5]
  const citationRegex = /\[(\d+(?:,\s*\d+)*)\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = citationRegex.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
    }

    const citationNums = match[1].split(',').map((n) => parseInt(n.trim(), 10)).filter(Boolean);
    parts.push(
      <span key={`cite-${matchIndex}`} className="inline-flex items-center gap-0.5 mx-0.5">
        {citationNums.map((num, i) => (
          <button
            key={i}
            onClick={() => onCitationClick(num)}
            className="text-[11px] font-mono font-bold text-cyan-400 hover:text-cyan-200 bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-800/80 px-1 rounded transition-colors align-super"
            title={`View verified source [${num}]`}
          >
            [{num}]
          </button>
        ))}
      </span>
    );

    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <span>{parts}</span>;
};
