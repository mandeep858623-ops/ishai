import React, { useState, useRef } from 'react';
import { soundEngine } from '../../utils/audio';
import { speakText, stopSpeaking, createSpeechRecognizer, streamLanguageStudioCompletion } from '../../utils/aiClient';
import { 
  CheckCheck, Sparkles, GraduationCap, MessageSquare, Layers, 
  Mic, Scissors, BookMarked, Volume2, Copy, Check, 
  Square, RefreshCw, Send, Zap
} from 'lucide-react';

export const POPULAR_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Japanese', 
  'Chinese (Mandarin)', 'Hindi', 'Arabic', 'Russian', 
  'Portuguese', 'Italian', 'Korean', 'Dutch', 'Turkish'
];

interface BaseLanguageToolProps {
  toolId: string;
  toolName: string;
  tagline: string;
  defaultLang?: string;
  hasTargetLang?: boolean;
  children: (
    run: (payload: Record<string, any>) => void, 
    loading: boolean, 
    selectedLang: string, 
    setSelectedLang: (l: string) => void
  ) => React.ReactNode;
}

const BaseLanguageTool: React.FC<BaseLanguageToolProps> = ({ 
  toolId, 
  toolName, 
  tagline,
  defaultLang = 'English',
  hasTargetLang = true,
  children 
}) => {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState(defaultLang);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleStop = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(false);
  };

  const run = (payload: Record<string, any>) => {
    soundEngine.playClick();
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setLoading(true);
    setOutput('');
    setError(null);

    const controller = streamLanguageStudioCompletion(
      { 
        tool: toolId, 
        targetLang,
        ...payload 
      },
      {
        onChunk: (chunk) => {
          setOutput((prev) => prev + chunk);
        },
        onDone: () => {
          setLoading(false);
          abortRef.current = null;
        },
        onError: (err) => { 
          setError(err); 
          setLoading(false); 
          abortRef.current = null;
        }
      }
    );

    abortRef.current = controller;
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      speakText(output);
      setTimeout(() => setSpeaking(false), 8000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar with controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-950/80 pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-emerald-300 tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              {toolName}
            </h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
              FAST-STREAM
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">{tagline}</p>
        </div>

        {hasTargetLang && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500">Language:</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-black border border-emerald-900/80 text-emerald-300 rounded px-2.5 py-1 text-xs outline-none focus:border-emerald-500"
            >
              {POPULAR_LANGUAGES.map((l) => (
                <option key={l} value={l} className="bg-zinc-950 text-white">
                  {l}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main input controls */}
      {children(run, loading, targetLang, setTargetLang)}

      {/* Live streaming status */}
      {loading && (
        <div className="flex items-center justify-between text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-800/40 rounded px-3 py-1.5 animate-pulse">
          <span className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            STREAMING HIGH-SPEED RESPONSE...
          </span>
          <button
            onClick={handleStop}
            className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 border border-red-900/50 rounded px-2 py-0.5 bg-black"
          >
            <Square className="w-2.5 h-2.5" /> Stop
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-3 bg-red-950/30 border border-red-800/50 text-red-400 text-xs rounded">
          ⚠️ {error}
        </div>
      )}

      {/* Stream output display */}
      {output && (
        <div className="relative mt-4 rounded-lg bg-[#070a0e] border border-emerald-900/60 p-4 shadow-lg shadow-black/40">
          <div className="flex items-center justify-between border-b border-emerald-950/80 pb-2 mb-3">
            <span className="text-[11px] font-bold text-zinc-400 tracking-wider">
              AI RESPONSE STREAM
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSpeak}
                className="p-1.5 text-zinc-400 hover:text-emerald-300 rounded hover:bg-emerald-950/40 transition-colors"
                title="Read Aloud"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-black border border-emerald-900 hover:border-emerald-500 text-emerald-300 transition-colors"
                title="Copy to Clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'COPIED' : 'COPY'}</span>
              </button>
            </div>
          </div>
          <div className="text-xs text-emerald-100/90 whitespace-pre-wrap leading-relaxed font-mono select-text">
            {output}
          </div>
        </div>
      )}
    </div>
  );
};

export const GrammarChecker: React.FC = () => {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'standard' | 'advanced'>('standard');

  return (
    <BaseLanguageTool 
      toolId="grammar" 
      toolName="Grammar & Style Proofreader"
      tagline="Rapid proofreading, punctuation analysis, syntax correction, and stylistic polish."
      hasTargetLang={false}
    >
      {(run, loading) => (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500">Polish Level:</span>
            <button
              onClick={() => setMode('standard')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                mode === 'standard' 
                  ? 'bg-emerald-500 text-black font-bold' 
                  : 'bg-black text-zinc-400 border border-emerald-950'
              }`}
            >
              Standard Grammar
            </button>
            <button
              onClick={() => setMode('advanced')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                mode === 'advanced' 
                  ? 'bg-emerald-500 text-black font-bold' 
                  : 'bg-black text-zinc-400 border border-emerald-950'
              }`}
            >
              Advanced Style Polish
            </button>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type text to check grammar, punctuation, and flow..."
            className="w-full bg-[#0b0e14] border border-emerald-900/80 focus:border-emerald-500 rounded p-3 text-xs text-emerald-200 outline-none placeholder:text-zinc-600 transition-colors"
            rows={5}
          />

          <div className="flex justify-end gap-2">
            <button
              disabled={loading || !text.trim()}
              onClick={() => run({ prompt: text, style: mode })}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              {loading ? 'CHECKING...' : 'RUN FAST CHECK'}
            </button>
          </div>
        </div>
      )}
    </BaseLanguageTool>
  );
};

export const LanguageLearner: React.FC = () => {
  const [topic, setTopic] = useState('Essential travel and ordering food');
  const [level, setLevel] = useState('Beginner');

  return (
    <BaseLanguageTool 
      toolId="learn" 
      toolName="Fast Language Academy"
      tagline="Rapid custom lesson modules with vocabulary, IPA pronunciation, grammar, and quick quiz."
      defaultLang="Spanish"
      hasTargetLang={true}
    >
      {(run, loading, targetLang) => (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Target Proficiency Level:</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-black border border-emerald-900 rounded px-2.5 py-1.5 text-xs text-emerald-300 outline-none focus:border-emerald-500"
              >
                <option value="Beginner (A1-A2)">Beginner (A1-A2)</option>
                <option value="Intermediate (B1-B2)">Intermediate (B1-B2)</option>
                <option value="Advanced (C1-C2)">Advanced (C1-C2)</option>
                <option value="Business & Technical">Business & Technical</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Topic or Real-World Goal:</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Airport check-in, Doctor visit, Job interview..."
                className="w-full bg-[#0b0e14] border border-emerald-900 rounded px-3 py-1.5 text-xs text-emerald-200 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              disabled={loading || !topic.trim()}
              onClick={() => run({ prompt: topic, level, targetLang })}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              {loading ? 'GENERATING MODULE...' : 'GENERATE LESSON NOW'}
            </button>
          </div>
        </div>
      )}
    </BaseLanguageTool>
  );
};

export const ConversationPartner: React.FC = () => {
  const [input, setInput] = useState('');
  const [scenario, setScenario] = useState('Ordering coffee at a cafe');
  const [difficulty, setDifficulty] = useState('Beginner');

  return (
    <BaseLanguageTool 
      toolId="conversation" 
      toolName="Interactive Conversation Partner"
      tagline="Immersive real-time dialogue simulation with instant feedback and reply recommendations."
      defaultLang="French"
      hasTargetLang={true}
    >
      {(run, loading, targetLang) => (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Roleplay Scenario:</label>
              <input
                type="text"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                className="w-full bg-[#0b0e14] border border-emerald-900 rounded px-3 py-1.5 text-xs text-emerald-200 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Difficulty Register:</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-black border border-emerald-900 rounded px-2.5 py-1.5 text-xs text-emerald-300 outline-none focus:border-emerald-500"
              >
                <option value="Beginner">Beginner (Simple words, short sentences)</option>
                <option value="Intermediate">Intermediate (Natural speed, common idioms)</option>
                <option value="Fluent">Fluent Native (Fast, nuanced, colloquial)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Say something in ${targetLang} or English...`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && input.trim() && !loading) {
                  run({ prompt: input, scenario, difficulty, targetLang });
                }
              }}
              className="flex-1 bg-[#0b0e14] border border-emerald-900 rounded px-3 py-2 text-xs text-emerald-200 outline-none focus:border-emerald-500"
            />
            <button
              disabled={loading || !input.trim()}
              onClick={() => run({ prompt: input, scenario, difficulty, targetLang })}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              {loading ? 'REPLYING...' : 'SEND'}
            </button>
          </div>
        </div>
      )}
    </BaseLanguageTool>
  );
};

export const VocabularyBuilder: React.FC = () => {
  const [topic, setTopic] = useState('High-frequency conversational phrases');

  return (
    <BaseLanguageTool 
      toolId="vocab" 
      toolName="Vocabulary Architect"
      tagline="Curated, high-yield terminology with phonetic breakdowns, translations, and context sentences."
      defaultLang="Japanese"
      hasTargetLang={true}
    >
      {(run, loading, targetLang) => (
        <div className="space-y-3">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic (e.g. Technology, Medical, Business, Travel)..."
            className="w-full bg-[#0b0e14] border border-emerald-900 rounded px-3 py-2 text-xs text-emerald-200 outline-none focus:border-emerald-500"
          />

          <div className="flex justify-end">
            <button
              disabled={loading || !topic.trim()}
              onClick={() => run({ prompt: topic, targetLang })}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950"
            >
              <Layers className="w-3.5 h-3.5" />
              {loading ? 'CURATING...' : 'BUILD VOCABULARY'}
            </button>
          </div>
        </div>
      )}
    </BaseLanguageTool>
  );
};

export const PronunciationCoach: React.FC = () => {
  const [phrase, setPhrase] = useState('Supercalifragilisticexpialidocious');

  return (
    <BaseLanguageTool 
      toolId="pronunciation" 
      toolName="Phonetics & Pronunciation Coach"
      tagline="In-depth phonetic mechanics, IPA transcription, primary stress, and tongue/mouth positions."
      defaultLang="English"
      hasTargetLang={true}
    >
      {(run, loading, targetLang) => (
        <div className="space-y-3">
          <input
            type="text"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder="Type any word or phrase to get detailed pronunciation breakdown..."
            className="w-full bg-[#0b0e14] border border-emerald-900 rounded px-3 py-2 text-xs text-emerald-200 outline-none focus:border-emerald-500"
          />

          <div className="flex justify-end">
            <button
              disabled={loading || !phrase.trim()}
              onClick={() => run({ prompt: phrase, targetLang })}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950"
            >
              <Mic className="w-3.5 h-3.5" />
              {loading ? 'ANALYZING...' : 'ANALYZE PRONUNCIATION'}
            </button>
          </div>
        </div>
      )}
    </BaseLanguageTool>
  );
};

export const Summarizer: React.FC = () => {
  const [text, setText] = useState('');
  const [action, setAction] = useState('summarize');

  return (
    <BaseLanguageTool 
      toolId="summarize" 
      toolName="Text Simplification & Synthesis"
      tagline="Rapid executive summaries, grade-6 simplification, and key takeaway extractions."
      hasTargetLang={false}
    >
      {(run, loading) => (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500">Action:</span>
            {['summarize', 'simplify', 'explain difficult words', 'extract key points'].map((act) => (
              <button
                key={act}
                onClick={() => setAction(act)}
                className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${
                  action === act 
                    ? 'bg-emerald-500 text-black font-bold' 
                    : 'bg-black text-zinc-400 border border-emerald-950'
                }`}
              >
                {act}
              </button>
            ))}
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste article, documentation, or lengthy text to process..."
            className="w-full bg-[#0b0e14] border border-emerald-900 rounded p-3 text-xs text-emerald-200 outline-none focus:border-emerald-500"
            rows={5}
          />

          <div className="flex justify-end">
            <button
              disabled={loading || !text.trim()}
              onClick={() => run({ prompt: text, action })}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950"
            >
              <Scissors className="w-3.5 h-3.5" />
              {loading ? 'SYNTHESIZING...' : 'SYNTHESIZE TEXT'}
            </button>
          </div>
        </div>
      )}
    </BaseLanguageTool>
  );
};

export const Dictionary: React.FC = () => {
  const [word, setWord] = useState('');

  return (
    <BaseLanguageTool 
      toolId="dictionary" 
      toolName="Comprehensive Lexicon Dictionary"
      tagline="Fast lexical definitions, etymologies, IPA phonetics, collocations, and contextual examples."
      defaultLang="English"
      hasTargetLang={true}
    >
      {(run, loading, targetLang) => (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Enter word or term to lookup..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && word.trim() && !loading) {
                  run({ prompt: word, targetLang });
                }
              }}
              className="flex-1 bg-[#0b0e14] border border-emerald-900 rounded px-3 py-2 text-xs text-emerald-200 outline-none focus:border-emerald-500"
            />
            <button
              disabled={loading || !word.trim()}
              onClick={() => run({ prompt: word, targetLang })}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950"
            >
              <BookMarked className="w-3.5 h-3.5" />
              {loading ? 'SEARCHING...' : 'LOOKUP WORD'}
            </button>
          </div>
        </div>
      )}
    </BaseLanguageTool>
  );
};
