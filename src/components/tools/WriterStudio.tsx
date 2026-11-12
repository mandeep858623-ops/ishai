import React, { useState } from 'react';
import { streamAiCompletion, speakText } from '../../utils/aiClient';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { Sparkles, Copy, Check, Download, Volume2, Square, RefreshCw } from 'lucide-react';

export const WriterStudio: React.FC = () => {
  const [contentType, setContentType] = useState('Professional Email');
  const [tone, setTone] = useState('Professional');
  const [length, setLength] = useState('Standard (~500 words)');
  const [prompt, setPrompt] = useState('');
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [copied, setCopied] = useState(false);

  const contentTypes = [
    'Professional Email',
    'Executive Summary',
    'Article / Blog Post',
    'Academic Essay',
    'Press Release',
    'Creative Story',
    'Persuasive Pitch',
  ];

  const tones = ['Professional', 'Persuasive', 'Academic', 'Casual & Friendly', 'Inspirational', 'Executive'];
  const lengths = ['Concise (~200 words)', 'Standard (~500 words)', 'In-depth (~1000 words)'];

  const handleGenerate = (refineInstruction?: string) => {
    if (!prompt.trim() && !content) return;
    setIsGenerating(true);

    let systemInstruction = `You are SUPERAI Writer, an elite content creator and writing strategist. You write articulate, compelling, high-impact content.
Format your output with clear headings, clean paragraphs, and bullet points where helpful.
Format Type: ${contentType}
Desired Tone: ${tone}
Target Length: ${length}`;

    let userPrompt = `Please write the following ${contentType}:
Topic / Key Points:
${prompt}`;

    if (refineInstruction && content) {
      userPrompt = `Here is the current draft:\n${content}\n\nPlease revise and improve it according to this instruction:\n${refineInstruction}`;
    } else {
      setContent('');
    }

    const controller = streamAiCompletion(
      {
        prompt: userPrompt,
        systemInstruction,
      },
      {
        onChunk: (chunk) => {
          setContent((prev) => prev + chunk);
        },
        onDone: () => {
          setIsGenerating(false);
          setAbortController(null);
        },
        onError: (err) => {
          setContent((prev) => prev + `\n\n*[Error: ${err}]*`);
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

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SUPERAI_Writer_${contentType.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">AI Writer & Drafting Studio</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Produce polished essays, executive summaries, emails, articles, and speeches with precision.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Content Format</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                {contentTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  {tones.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Length</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  {lengths.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Topic, Outline, or Raw Notes
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., Announcing a major product breakthrough in quantum battery storage to our enterprise customers, focusing on reliability and sustainability..."
                rows={5}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
            </div>

            <div className="flex gap-2">
              {!isGenerating ? (
                <button
                  onClick={() => handleGenerate()}
                  disabled={!prompt.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium text-xs py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Draft
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600/80 hover:bg-red-600 text-white font-medium text-xs py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Stop Writing
                </button>
              )}
            </div>
          </div>

          {content && (
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-2.5">
              <span className="text-xs font-semibold text-zinc-300 block">AI Quick Refinement</span>
              <div className="flex flex-wrap gap-1.5">
                {['Make it more concise', 'Make it more persuasive', 'Fix grammar & tone', 'Add strong call-to-action'].map(
                  (action) => (
                    <button
                      key={action}
                      disabled={isGenerating}
                      onClick={() => handleGenerate(action)}
                      className="text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded-md transition-colors border border-zinc-700/60 cursor-pointer"
                    >
                      {action}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Output Document Workspace */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-[500px]">
          <div className="flex-1 flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950/80 border-b border-zinc-800 text-xs text-zinc-400">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-zinc-200">Editor Workspace</span>
                <span>{wordCount} words</span>
                <span>·</span>
                <span>{charCount} chars</span>
              </div>
              <div className="flex items-center gap-1.5">
                {content && (
                  <>
                    <button
                      onClick={() => speakText(content)}
                      className="p-1.5 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                      title="Read aloud"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCopy}
                      className="p-1.5 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                      title="Copy text"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="p-1.5 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                      title="Download Markdown"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 p-5 overflow-y-auto bg-zinc-950/30">
              {content ? (
                <MarkdownRenderer content={content} className="text-zinc-200 text-sm leading-relaxed" />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500">
                  <Sparkles className="w-8 h-8 mb-3 opacity-30" />
                  <p className="text-sm font-medium text-zinc-400">Draft preview will render here</p>
                  <p className="text-xs text-zinc-600 max-w-sm mt-1">
                    Select your format, specify your notes or key points, and SUPERAI will craft your document.
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
