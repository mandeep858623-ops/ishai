import React, { useState } from 'react';
import { streamAiCompletion } from '../../utils/aiClient';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { Code, Bug, Lightbulb, Zap, TestTube, Copy, Check, Square, AlertCircle } from 'lucide-react';

export const CodingStudio: React.FC = () => {
  const [language, setLanguage] = useState('TypeScript');
  const [mode, setMode] = useState<'generate' | 'debug' | 'explain' | 'refactor' | 'tests'>('generate');
  const [prompt, setPrompt] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [output, setOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [copied, setCopied] = useState(false);

  const languages = ['TypeScript', 'Python', 'JavaScript', 'Rust', 'Go', 'C++', 'Java', 'SQL', 'Bash'];

  const modes = [
    { id: 'generate', label: 'Generate Solution', icon: Code },
    { id: 'debug', label: 'Debug & Fix', icon: Bug },
    { id: 'explain', label: 'Explain Step-by-Step', icon: Lightbulb },
    { id: 'refactor', label: 'Refactor & Optimize', icon: Zap },
    { id: 'tests', label: 'Unit Tests', icon: TestTube },
  ];

  const handleRun = () => {
    if (!prompt.trim() && !inputCode.trim()) return;
    setIsGenerating(true);
    setOutput('');

    let systemInstruction = `You are SUPERAI Coding Studio, an elite principal software architect and systems engineer.
Language: ${language}
Mode: ${mode}
Provide production-ready, highly readable, idiomatic code with clear comments, type safety, error handling, and runtime/space complexity analysis (Big-O).
Always format code in fenced markdown code blocks with the language tag (e.g. \`\`\`${language.toLowerCase()}).`;

    let userPrompt = '';
    if (mode === 'generate') {
      userPrompt = `Please implement the following in ${language}:\nRequirement: ${prompt}\n${
        inputCode ? `Context / Starter Code:\n\`\`\`${language.toLowerCase()}\n${inputCode}\n\`\`\`` : ''
      }`;
    } else if (mode === 'debug') {
      userPrompt = `Please analyze and debug this ${language} code:\n\`\`\`${language.toLowerCase()}\n${inputCode}\n\`\`\`\nIssue or context: ${prompt || 'Find all bugs, edge cases, and runtime flaws, and provide the fixed code.'}`;
    } else if (mode === 'explain') {
      userPrompt = `Please explain how this ${language} code works in detail:\n\`\`\`${language.toLowerCase()}\n${inputCode}\n\`\`\`\nSpecific questions: ${prompt || 'Explain line by line and describe data flow.'}`;
    } else if (mode === 'refactor') {
      userPrompt = `Please refactor and optimize this ${language} code for clean architecture, performance, and readability:\n\`\`\`${language.toLowerCase()}\n${inputCode}\n\`\`\`\nGoals: ${prompt || 'Improve performance, simplify structure, add strong types.'}`;
    } else if (mode === 'tests') {
      userPrompt = `Please write comprehensive unit tests with test edge cases for this ${language} code:\n\`\`\`${language.toLowerCase()}\n${inputCode}\n\`\`\`\nTesting framework: ${prompt || 'Standard testing framework for this language.'}`;
    }

    const controller = streamAiCompletion(
      {
        prompt: userPrompt,
        systemInstruction,
      },
      {
        onChunk: (chunk) => {
          setOutput((prev) => prev + chunk);
        },
        onDone: () => {
          setIsGenerating(false);
          setAbortController(null);
        },
        onError: (err) => {
          setOutput((prev) => prev + `\n\n*[Error: ${err}]*`);
          setIsGenerating(false);
          setAbortController(null);
        },
      }
    );

    setAbortController(controller);
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Code className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">AI Coding Studio & Architect</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Engineered for code synthesis, algorithmic analysis, bug inspection, and refactoring.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Target Language:</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mode selection tabs */}
      <div className="flex flex-wrap gap-2">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                isActive
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur space-y-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                {mode === 'generate' ? 'Task / Feature Description' : 'Issue, Context or Goal'}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  mode === 'generate'
                    ? 'E.g., Implement an LRU Cache with O(1) get and put operations, thread-safe if applicable...'
                    : 'E.g., Getting TypeError: cannot read properties of undefined, or optimize memory usage...'
                }
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 resize-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                {mode === 'generate' ? 'Existing / Starter Code (Optional)' : 'Source Code Snippet'}
              </label>
              <textarea
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder={`// Paste your ${language} code here...`}
                rows={9}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 resize-none font-mono leading-relaxed"
              />
            </div>

            <div className="flex gap-2 pt-1">
              {!isGenerating ? (
                <button
                  onClick={handleRun}
                  disabled={!prompt.trim() && !inputCode.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium text-xs py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
                >
                  <Code className="w-4 h-4" />
                  Analyze & Synthesize
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600/80 hover:bg-red-600 text-white font-medium text-xs py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Stop Generation
                </button>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/30 text-[11px] text-zinc-400">
            <AlertCircle className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
            <span>
              <strong>Security Protocol:</strong> All code is processed via static AI intelligence. Code is not executed automatically in your browser sandbox without review.
            </span>
          </div>
        </div>

        {/* Output column */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-[520px]">
          <div className="flex-1 flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950/80 border-b border-zinc-800 text-xs text-zinc-400">
              <span className="font-semibold text-zinc-200">Architecture & Solution Output</span>
              {output && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(output);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1.5 hover:text-white px-2 py-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[11px]">{copied ? 'Copied' : 'Copy All'}</span>
                </button>
              )}
            </div>

            <div className="flex-1 p-5 overflow-y-auto bg-zinc-950/30">
              {output ? (
                <MarkdownRenderer content={output} className="text-zinc-200 text-xs" />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500">
                  <Code className="w-8 h-8 mb-3 opacity-30" />
                  <p className="text-sm font-medium text-zinc-400">Engineering output will appear here</p>
                  <p className="text-xs text-zinc-600 max-w-sm mt-1">
                    Select a mode, paste code or write your requirements to inspect bug fixes, unit tests, and architectures.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
