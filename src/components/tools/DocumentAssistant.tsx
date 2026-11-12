import React, { useState } from 'react';
import { streamAiCompletion } from '../../utils/aiClient';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { FileText, Upload, Sparkles, FileSearch, CheckCircle2, Square, AlertCircle } from 'lucide-react';

export const DocumentAssistant: React.FC = () => {
  const [docContent, setDocContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [query, setQuery] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setDocContent(text);
    };
    reader.readAsText(file);
  };

  const handleRunAnalysis = (actionPrompt?: string) => {
    if (!docContent.trim()) return;
    const effectivePrompt = actionPrompt || query;
    if (!effectivePrompt.trim()) return;

    setIsGenerating(true);
    setAnalysisResult('');

    const systemInstruction = `You are SUPERAI Document Assistant, an elite intelligence analyst and document auditor.
Your job is to read, synthesize, and answer questions grounded strictly and accurately on the provided document.
- Cite specific sections or context from the document where relevant.
- If information is missing from the document, clearly state that it is not present in the provided text.
- Format responses with clear headings, bulleted takeaways, and concise summaries.`;

    const userPrompt = `DOCUMENT CONTENT:
---
${docContent.slice(0, 30000)}
---

TASK / QUESTION:
${effectivePrompt}`;

    const controller = streamAiCompletion(
      {
        prompt: userPrompt,
        systemInstruction,
      },
      {
        onChunk: (chunk) => {
          setAnalysisResult((prev) => prev + chunk);
        },
        onDone: () => {
          setIsGenerating(false);
          setAbortController(null);
        },
        onError: (err) => {
          setAnalysisResult((prev) => prev + `\n\n*[Error: ${err}]*`);
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

  const wordCount = docContent.trim() ? docContent.trim().split(/\s+/).length : 0;
  const readTimeMin = Math.ceil(wordCount / 200);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">Document Intelligence & Analyzer</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Upload or paste text documents, extract key findings, audit details, and ask grounded questions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Document Ingestion column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300">Document Source</label>
              <label className="cursor-pointer flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 hover:underline">
                <Upload className="w-3.5 h-3.5" />
                Upload file (.txt, .md, .csv)
                <input
                  type="file"
                  accept=".txt,.md,.markdown,.csv,.json,.ts,.js,.py,.html"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {fileName && (
              <div className="flex items-center gap-2 p-2 rounded bg-blue-950/40 border border-blue-900 text-xs text-blue-300">
                <FileText className="w-4 h-4 shrink-0" />
                <span className="truncate flex-1">{fileName}</span>
                <span className="text-[10px] text-blue-400">{wordCount} words</span>
              </div>
            )}

            <textarea
              value={docContent}
              onChange={(e) => {
                setDocContent(e.target.value);
                if (fileName) setFileName('');
              }}
              placeholder="Paste document text, research paper excerpts, meeting notes, contracts, or report content here..."
              rows={8}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 resize-none font-mono leading-relaxed"
            />

            {docContent && (
              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/80">
                <span>{wordCount.toLocaleString()} words</span>
                <span>~{readTimeMin} min read time</span>
              </div>
            )}
          </div>

          {/* Quick analysis prompts */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-2.5">
            <span className="text-xs font-semibold text-zinc-300 block">Preset Inquiries</span>
            <div className="flex flex-col gap-1.5">
              {[
                'Generate an executive summary with main findings',
                'Extract all action items, decisions, and next steps',
                'Identify risks, weaknesses, and potential pitfalls',
                'List key metrics, numbers, and dates mentioned',
              ].map((preset) => (
                <button
                  key={preset}
                  disabled={!docContent.trim() || isGenerating}
                  onClick={() => handleRunAnalysis(preset)}
                  className="text-left text-xs bg-zinc-800/80 hover:bg-zinc-800 disabled:opacity-50 text-zinc-300 p-2.5 rounded-lg transition-colors border border-zinc-700/60 cursor-pointer flex items-center justify-between"
                >
                  <span>{preset}</span>
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Query & Analysis Results column */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-[520px] space-y-4">
          {/* Custom grounded question */}
          <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunAnalysis()}
              placeholder="Ask any specific question grounded in this document..."
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
            />
            {!isGenerating ? (
              <button
                onClick={() => handleRunAnalysis()}
                disabled={!docContent.trim() || !query.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <FileSearch className="w-4 h-4" />
                Analyze
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="bg-red-600/80 hover:bg-red-600 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Stop
              </button>
            )}
          </div>

          {/* Results panel */}
          <div className="flex-1 flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950/80 border-b border-zinc-800 text-xs text-zinc-400">
              <span className="font-semibold text-zinc-200">Grounded Intelligence Findings</span>
            </div>

            <div className="flex-1 p-5 overflow-y-auto bg-zinc-950/30">
              {analysisResult ? (
                <MarkdownRenderer content={analysisResult} className="text-zinc-200 text-xs leading-relaxed" />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500">
                  <FileText className="w-8 h-8 mb-3 opacity-30" />
                  <p className="text-sm font-medium text-zinc-400">Document insights will appear here</p>
                  <p className="text-xs text-zinc-600 max-w-sm mt-1">
                    Upload or paste your text on the left, then select a preset analysis or ask any tailored query.
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
