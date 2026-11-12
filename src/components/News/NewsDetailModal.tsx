import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Bookmark,
  Share2,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Layers,
  MessageSquare,
  Clock,
  BookOpen,
  Edit3,
  Check,
  Send,
  Zap,
} from 'lucide-react';
import { NewsArticle, AISummary } from './NewsTypes';
import { NewsAIService } from './NewsAIService';
import { NewsService } from './NewsService';
import { speakText, stopSpeaking } from '../../utils/audio';

interface NewsDetailModalProps {
  article: NewsArticle;
  onClose: () => void;
  isSaved?: boolean;
  isBookmarked?: boolean;
  onToggleSave?: (article: NewsArticle) => void;
  onToggleBookmark?: (article: NewsArticle) => void;
  onVerifyClaim?: (statement: string) => void;
  onCompareStory?: (article: NewsArticle) => void;
  onPlayAudio?: (text: string, title: string) => void;
  userId?: string;
}

export const NewsDetailModal: React.FC<NewsDetailModalProps> = ({
  article,
  onClose,
  isSaved = false,
  isBookmarked = false,
  onToggleSave,
  onToggleBookmark,
  onVerifyClaim,
  onCompareStory,
  onPlayAudio,
  userId = 'guest_default',
}) => {
  const [summaryMode, setSummaryMode] = useState<'30s' | 'detailed' | 'full'>('30s');
  const [textSize, setTextSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [readingMode, setReadingMode] = useState(false);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Audio Player State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // Ask AI Panel State
  const [showAskAIPanel, setShowAskAIPanel] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiChatMessages, setAiChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [askingAI, setAskingAI] = useState(false);

  // Personal Note State
  const [noteText, setNoteText] = useState('');
  const [savedNoteSuccess, setSavedNoteSuccess] = useState(false);

  useEffect(() => {
    // Load article summary from AI
    async function loadSummary() {
      setLoadingSummary(true);
      const summaryData = await NewsAIService.generateArticleSummary(article);
      setAiSummary(summaryData);
      setLoadingSummary(false);
    }
    loadSummary();

    // Load existing personal note
    const existingNote = NewsService.getArticleNote(article.id, userId);
    setNoteText(existingNote);

    return () => {
      stopSpeaking();
    };
  }, [article.id, userId]);

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else {
      const textToSpeak = aiSummary
        ? `${article.title}. ${aiSummary.summary30s}`
        : `${article.title}. ${article.description}`;
      speakText(textToSpeak);
      setIsPlayingAudio(true);
    }
  };

  const handleSaveNote = () => {
    NewsService.saveArticleNote(article.id, noteText, userId);
    setSavedNoteSuccess(true);
    setTimeout(() => setSavedNoteSuccess(false), 2000);
  };

  const handleSendAIQuestion = async (presetQuestion?: string) => {
    const q = (presetQuestion || aiQuestion).trim();
    if (!q || askingAI) return;

    setAiChatMessages((prev) => [...prev, { role: 'user', text: q }]);
    setAiQuestion('');
    setAskingAI(true);

    const answer = await NewsAIService.askAIAboutStory(q, article);
    setAiChatMessages((prev) => [...prev, { role: 'assistant', text: answer }]);
    setAskingAI(false);
  };

  const getTextSizeClass = () => {
    if (textSize === 'sm') return 'text-xs leading-relaxed';
    if (textSize === 'lg') return 'text-base leading-loose';
    return 'text-sm leading-relaxed';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 overflow-y-auto select-none">
      <div
        className={`bg-[#080b10] border border-cyan-500/50 shadow-2xl rounded-2xl w-full max-w-4xl max-h-[92dvh] flex flex-col font-sans text-zinc-200 overflow-hidden my-auto ${
          readingMode ? 'bg-black border-zinc-800' : ''
        }`}
      >
        {/* Reader Top Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3 bg-[#0a0e16] shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="text-[10px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              {article.sourceName}
            </span>
            <span className="text-zinc-500 text-xs hidden sm:inline">•</span>
            <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
              {new Date(article.publishedAt).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Text Size Controls */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs font-mono">
              <button
                onClick={() => setTextSize('sm')}
                className={`px-2 py-0.5 rounded ${textSize === 'sm' ? 'bg-cyan-600 text-white font-bold' : 'text-zinc-400'}`}
              >
                A-
              </button>
              <button
                onClick={() => setTextSize('md')}
                className={`px-2 py-0.5 rounded ${textSize === 'md' ? 'bg-cyan-600 text-white font-bold' : 'text-zinc-400'}`}
              >
                A
              </button>
              <button
                onClick={() => setTextSize('lg')}
                className={`px-2 py-0.5 rounded ${textSize === 'lg' ? 'bg-cyan-600 text-white font-bold' : 'text-zinc-400'}`}
              >
                A+
              </button>
            </div>

            {/* Reading Mode Toggle */}
            <button
              onClick={() => setReadingMode(!readingMode)}
              className={`p-1.5 rounded-lg border text-xs font-mono transition-colors ${
                readingMode ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title="Distraction-Free Reading Mode"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reader Main Scroll Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Main Title & Metadata */}
          <div className="space-y-3">
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">
              {article.title}
            </h1>

            <div className="flex items-center justify-between gap-3 text-xs font-mono text-zinc-400 flex-wrap pb-2 border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                <span>By {article.author || article.sourceName}</span>
                <span>•</span>
                <span>{article.readTimeMinutes} min read</span>
                <span>•</span>
                <span className="text-cyan-400 uppercase font-bold">{article.category}</span>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleAudio}
                  className={`px-3 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isPlayingAudio ? 'bg-cyan-500 text-black border-cyan-400 animate-pulse' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{isPlayingAudio ? 'PAUSE AUDIO' : 'LISTEN'}</span>
                </button>

                <button
                  onClick={() => {
                    if (onToggleBookmark) onToggleBookmark(article);
                    else if (onToggleSave) onToggleSave(article);
                  }}
                  className={`px-3 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSaved || isBookmarked ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-cyan-400' : ''}`} />
                  <span>{isSaved ? 'SAVED' : 'SAVE'}</span>
                </button>

                {onVerifyClaim && (
                  <button
                    onClick={() => onVerifyClaim(article.title)}
                    className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">VERIFY CLAIM</span>
                  </button>
                )}

                {onCompareStory && (
                  <button
                    onClick={() => onCompareStory(article)}
                    className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-purple-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span className="hidden sm:inline">COMPARE</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Featured Article Image */}
          {article.imageUrl && !readingMode && (
            <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-black border border-zinc-800 relative">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 right-2 bg-black/80 text-[10px] text-zinc-400 font-mono px-2 py-0.5 rounded">
                Image Source: {article.sourceName}
              </div>
            </div>
          )}

          {/* AI Summary Mode Switcher */}
          <div className="bg-[#0b0e16] border border-cyan-500/40 rounded-2xl p-4 space-y-4 shadow-lg shadow-cyan-950/20">
            <div className="flex items-center justify-between gap-2 flex-wrap border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="font-extrabold text-xs text-cyan-300 tracking-wider uppercase font-mono">
                  SUPERAI INTELLIGENCE SUMMARY
                </span>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-xs font-mono font-bold">
                <button
                  onClick={() => setSummaryMode('30s')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    summaryMode === '30s' ? 'bg-cyan-500 text-black font-extrabold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  30s SUMMARY
                </button>
                <button
                  onClick={() => setSummaryMode('detailed')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    summaryMode === 'detailed' ? 'bg-cyan-500 text-black font-extrabold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  DETAILED
                </button>
                <button
                  onClick={() => setSummaryMode('full')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    summaryMode === 'full' ? 'bg-cyan-500 text-black font-extrabold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  KEY FACTS & ENTITIES
                </button>
              </div>
            </div>

            {loadingSummary ? (
              <div className="py-8 text-center text-xs font-mono text-zinc-500 space-y-2">
                <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Generating AI Story Breakdown...</p>
              </div>
            ) : aiSummary ? (
              <div className="space-y-4 text-xs font-sans">
                {/* Mode 1: 30-Second Summary */}
                {summaryMode === '30s' && (
                  <div className="space-y-3">
                    <p className="text-zinc-100 text-sm leading-relaxed font-medium bg-black/40 p-3 rounded-xl border border-cyan-900/40">
                      💡 {aiSummary.summary30s}
                    </p>
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">Key Takeaways:</span>
                      <ul className="list-disc list-inside space-y-1 text-zinc-300">
                        {aiSummary.keyTakeaways.map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Mode 2: Detailed Summary */}
                {summaryMode === 'detailed' && (
                  <div className="space-y-3">
                    <p className="text-zinc-200 leading-relaxed bg-black/40 p-3 rounded-xl border border-zinc-800">
                      {aiSummary.summaryDetailed}
                    </p>
                    <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-xl space-y-1">
                      <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">Why It Matters:</span>
                      <p className="text-zinc-200">{aiSummary.whyItMatters}</p>
                    </div>
                    {aiSummary.background && (
                      <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-1">
                        <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Context & Background:</span>
                        <p className="text-zinc-300">{aiSummary.background}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Mode 3: Key Facts & Entities */}
                {summaryMode === 'full' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Entities */}
                    {aiSummary.keyEntities && aiSummary.keyEntities.length > 0 && (
                      <div className="p-3 bg-black/40 border border-zinc-800 rounded-xl space-y-2">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">Key Entities Mentioned:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {aiSummary.keyEntities.map((e, idx) => (
                            <span key={idx} className="bg-zinc-900 border border-zinc-700 text-zinc-200 px-2 py-1 rounded text-[11px]">
                              {e.name} ({e.type})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timeline */}
                    {aiSummary.timeline && aiSummary.timeline.length > 0 && (
                      <div className="p-3 bg-black/40 border border-zinc-800 rounded-xl space-y-2">
                        <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">Chronological Timeline:</span>
                        <div className="space-y-1.5 font-mono text-[11px]">
                          {aiSummary.timeline.map((t, idx) => (
                            <div key={idx} className="flex gap-2">
                              <span className="text-amber-400 shrink-0">{t.time}:</span>
                              <span className="text-zinc-300">{t.event}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* What is Known vs Unclear */}
                    <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-1">
                      <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">Confirmed Facts:</span>
                      <ul className="list-disc list-inside text-zinc-300 space-y-0.5 text-[11px]">
                        {aiSummary.whatIsKnown.map((k, idx) => (
                          <li key={idx}>{k}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-rose-950/20 border border-rose-800/40 rounded-xl space-y-1">
                      <span className="text-[10px] font-mono font-bold text-rose-400 uppercase">What Remains Unclear:</span>
                      <ul className="list-disc list-inside text-zinc-300 space-y-0.5 text-[11px]">
                        {aiSummary.whatIsUnclear.map((u, idx) => (
                          <li key={idx}>{u}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Full Article Content Text */}
          <div className={`space-y-4 text-zinc-200 ${getTextSizeClass()}`}>
            <p className="font-semibold text-zinc-100 text-sm leading-relaxed border-l-2 border-cyan-500 pl-3">
              {article.description}
            </p>
            <p className="leading-relaxed">
              {article.content || article.description}
            </p>
          </div>

          {/* Ask AI About This Story Drawer */}
          <div className="bg-[#0a0d14] border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-bold text-xs text-cyan-300 flex items-center gap-1.5 font-mono">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                ASK AI ABOUT THIS STORY
              </span>
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
              <button
                onClick={() => handleSendAIQuestion('What could happen next?')}
                className="bg-zinc-900 hover:bg-zinc-800 text-cyan-300 border border-zinc-700 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                What could happen next?
              </button>
              <button
                onClick={() => handleSendAIQuestion('Explain this in simple terms')}
                className="bg-zinc-900 hover:bg-zinc-800 text-cyan-300 border border-zinc-700 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                Explain simply
              </button>
              <button
                onClick={() => handleSendAIQuestion('What facts are confirmed vs unconfirmed?')}
                className="bg-zinc-900 hover:bg-zinc-800 text-cyan-300 border border-zinc-700 px-2.5 py-1 rounded-lg cursor-pointer"
              >
                Confirmed vs Unconfirmed
              </button>
            </div>

            {/* Q&A Chat History */}
            {aiChatMessages.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-black/60 rounded-xl border border-zinc-800 text-xs font-mono">
                {aiChatMessages.map((m, idx) => (
                  <div key={idx} className={`p-2 rounded-lg ${m.role === 'user' ? 'bg-cyan-950/60 text-cyan-200 border border-cyan-900 ml-6' : 'bg-zinc-900 text-zinc-200 border border-zinc-800 mr-6'}`}>
                    <span className="font-bold text-[10px] uppercase text-zinc-500 block mb-0.5">{m.role === 'user' ? 'You' : 'AI News Assistant'}:</span>
                    <span>{m.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Input Row */}
            <div className="flex gap-2">
              <input
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAIQuestion()}
                placeholder="Ask any question about this news story..."
                className="flex-1 bg-black border border-zinc-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
              />
              <button
                onClick={() => handleSendAIQuestion()}
                disabled={askingAI || !aiQuestion.trim()}
                className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-extrabold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                {askingAI ? 'THINKING...' : 'ASK'}
              </button>
            </div>
          </div>

          {/* Personal Article Note Box */}
          <div className="bg-[#090b10] border border-zinc-800 rounded-2xl p-4 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                PERSONAL NOTE ON THIS STORY
              </span>
              {savedNoteSuccess && <span className="text-emerald-400 text-[10px]">Saved!</span>}
            </div>

            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Write your thoughts, key insights, or research points for this article..."
              className="w-full bg-black border border-zinc-800 focus:border-cyan-500 rounded-xl p-2.5 text-xs text-zinc-200 outline-none h-20 resize-none"
            />

            <div className="flex justify-end">
              <button
                onClick={handleSaveNote}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Save Personal Note
              </button>
            </div>
          </div>
        </div>

        {/* Reader Footer Toolbar */}
        <div className="p-3 border-t border-zinc-800/80 bg-[#0a0e16] flex items-center justify-between text-xs shrink-0">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-md"
          >
            <span>READ ORIGINAL AT {article.sourceName.toUpperCase()}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer"
          >
            CLOSE READER
          </button>
        </div>
      </div>
    </div>
  );
};
