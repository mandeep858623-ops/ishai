import React, { useState } from 'react';
import { streamAiCompletion } from '../../utils/aiClient';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { Palette, Sparkles, Lightbulb, Compass, Film, Copy, Check, Square } from 'lucide-react';

export const CreativeStudio: React.FC = () => {
  const [category, setCategory] = useState('Brand & Product Names');
  const [prompt, setPrompt] = useState('');
  const [creativityLevel, setCreativityLevel] = useState(0.85);
  const [output, setOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [copied, setCopied] = useState(false);

  const categories = [
    { id: 'Brand & Product Names', icon: Sparkles },
    { id: 'Startup & Innovation Concepts', icon: Lightbulb },
    { id: 'Story Worlds & Characters', icon: Compass },
    { id: 'Video & Script Hooks', icon: Film },
    { id: 'Marketing Slogans & Taglines', icon: Palette },
  ];

  const handleBrainstorm = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setOutput('');

    const systemInstruction = `You are SUPERAI Creative Studio, an elite creative director, worldbuilder, and naming strategist.
Domain: ${category}
Generate imaginative, distinct, memorable, and high-impact concepts.
Avoid clichés and generic tropes. For naming, include rationale and stylistic notes.
Format your output with clear sections, bullet points, and aesthetic presentation.`;

    const userPrompt = `Creative Brief / Context:
${prompt}

Please brainstorm top-tier, inventive ideas for ${category}.`;

    const controller = streamAiCompletion(
      {
        prompt: userPrompt,
        systemInstruction,
        temperature: creativityLevel,
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

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
              <Palette className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">AI Creative Studio & Brainstorming</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Generate novel brand identities, fictional lore, viral hooks, and startup concepts.
          </p>
        </div>
      </div>

      {/* Category selector */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const Icon = c.icon;
          const isActive = category === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                isActive
                  ? 'bg-fuchsia-500/15 border-fuchsia-500/40 text-fuchsia-300'
                  : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {c.id}
            </button>
          );
        })}
      </div>

      {/* Brief Input */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur space-y-3">
        <div>
          <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
            Creative Brief & Constraints
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., High-end sustainable electric hydrofoil watercraft company targeting maritime explorers, tone should feel sleek, Nordic, and futuristic..."
            rows={3}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-fuchsia-500 resize-none leading-relaxed"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400">Creativity Index:</span>
            <input
              type="range"
              min="0.4"
              max="1.0"
              step="0.05"
              value={creativityLevel}
              onChange={(e) => setCreativityLevel(parseFloat(e.target.value))}
              className="accent-fuchsia-500 w-28 cursor-pointer"
            />
            <span className="text-xs font-mono text-fuchsia-400 font-semibold">{creativityLevel}</span>
          </div>

          <div className="flex gap-2">
            {!isGenerating ? (
              <button
                onClick={handleBrainstorm}
                disabled={!prompt.trim()}
                className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium text-xs px-5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Ignite Ideas
              </button>
            ) : (
              <button
                onClick={() => abortController?.abort()}
                className="bg-red-600/80 hover:bg-red-600 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Stop
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Output Panel */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden min-h-[350px]">
        <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950/80 border-b border-zinc-800 text-xs text-zinc-400">
          <span className="font-semibold text-zinc-200">Creative Concepts & Concepts Matrix</span>
          {output && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(output);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex items-center gap-1.5 hover:text-white px-2 py-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-fuchsia-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{copied ? 'Copied' : 'Copy Concepts'}</span>
            </button>
          )}
        </div>

        <div className="p-5 bg-zinc-950/30">
          {output ? (
            <MarkdownRenderer content={output} className="text-zinc-200 text-sm leading-relaxed" />
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
              <Palette className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm font-medium text-zinc-400">Creative concepts will emerge here</p>
              <p className="text-xs text-zinc-600 max-w-sm mt-1">
                Select a category and outline your vision to generate non-standard ideas, names, and narratives.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
