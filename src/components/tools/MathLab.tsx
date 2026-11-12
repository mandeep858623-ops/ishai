import React, { useState } from 'react';
import { streamAiCompletion } from '../../utils/aiClient';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { Calculator, Divide, HelpCircle, CheckCircle2, Square, Copy, Check } from 'lucide-react';

export const MathLab: React.FC = () => {
  const [problem, setProblem] = useState('');
  const [mode, setMode] = useState<'stepByStep' | 'conceptual' | 'practice'>('stepByStep');
  const [topic, setTopic] = useState('Calculus');
  const [solution, setSolution] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [copied, setCopied] = useState(false);

  const topics = ['Calculus', 'Algebra', 'Linear Algebra', 'Probability & Statistics', 'Discrete Math', 'Differential Equations'];

  const symbolShortcuts = ['∫', '∑', 'd/dx', '√x', 'lim', '∞', 'π', 'θ', 'x²', '±', '≤', '≥'];

  const insertSymbol = (sym: string) => {
    setProblem((prev) => prev + sym);
  };

  const handleSolve = () => {
    if (!problem.trim()) return;
    setIsGenerating(true);
    setSolution('');

    let systemInstruction = `You are SUPERAI Math Lab, a world-class mathematician, educator, and analytical engine.
Domain: ${topic}
Mode: ${mode}
Provide clear, step-by-step mathematical breakdowns.
- State formulas clearly
- Show intermediate derivations
- Explain the intuition behind key steps
- Verify the final solution for edge conditions or sanity checks.
Format equations and expressions cleanly with clear markdown or standard LaTeX notation.`;

    let userPrompt = '';
    if (mode === 'stepByStep') {
      userPrompt = `Please solve this ${topic} problem step-by-step:\n${problem}`;
    } else if (mode === 'conceptual') {
      userPrompt = `Please explain the deep mathematical intuition, geometric meaning, and concept behind this ${topic} problem or theorem:\n${problem}`;
    } else if (mode === 'practice') {
      userPrompt = `Based on this mathematical problem: "${problem}", please generate 3 similar practice problems with detailed solution hints and answers for study.`;
    }

    const controller = streamAiCompletion(
      {
        prompt: userPrompt,
        systemInstruction,
      },
      {
        onChunk: (chunk) => {
          setSolution((prev) => prev + chunk);
        },
        onDone: () => {
          setIsGenerating(false);
          setAbortController(null);
        },
        onError: (err) => {
          setSolution((prev) => prev + `\n\n*[Error: ${err}]*`);
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
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Calculator className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">AI Math Lab & Engine</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Step-by-step algebraic derivations, calculus proofs, equation solving, and conceptual breakdowns.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Subject:</span>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
          >
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Input container */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur space-y-3">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'stepByStep', label: 'Step-by-Step Derivation', icon: CheckCircle2 },
            { id: 'conceptual', label: 'Conceptual Intuition', icon: HelpCircle },
            { id: 'practice', label: 'Generate Practice Problems', icon: Divide },
          ].map((m) => {
            const Icon = m.icon;
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                  isActive
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {m.label}
              </button>
            );
          })}
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
            Mathematical Equation, Problem, or Theorem
          </label>
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="E.g., Find the integral of x^2 * e^x dx using integration by parts, or solve the system of linear equations..."
            rows={3}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 font-mono resize-none leading-relaxed"
          />
        </div>

        {/* Quick math symbol bar */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-zinc-500 mr-1">Insert Symbols:</span>
          {symbolShortcuts.map((sym) => (
            <button
              key={sym}
              onClick={() => insertSymbol(sym)}
              className="px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-mono text-xs border border-zinc-700/50 cursor-pointer"
            >
              {sym}
            </button>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          {!isGenerating ? (
            <button
              onClick={handleSolve}
              disabled={!problem.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium text-xs py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              Solve & Break Down Step-by-Step
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600/80 hover:bg-red-600 text-white font-medium text-xs py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              Stop Calculation
            </button>
          )}
        </div>
      </div>

      {/* Solution Display */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden min-h-[350px]">
        <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950/80 border-b border-zinc-800 text-xs text-zinc-400">
          <span className="font-semibold text-zinc-200">Mathematical Breakdown & Solution</span>
          {solution && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(solution);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex items-center gap-1.5 hover:text-white px-2 py-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{copied ? 'Copied' : 'Copy Solution'}</span>
            </button>
          )}
        </div>

        <div className="p-5 bg-zinc-950/30">
          {solution ? (
            <MarkdownRenderer content={solution} className="text-zinc-200 text-sm leading-relaxed" />
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
              <Calculator className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm font-medium text-zinc-400">Enter a mathematical equation or problem above</p>
              <p className="text-xs text-zinc-600 max-w-sm mt-1">
                SUPERAI will break down every single transition step with proof rigor and verification.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
