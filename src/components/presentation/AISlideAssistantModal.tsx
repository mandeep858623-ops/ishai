import React, { useState } from 'react';
import { SlideData } from './types';
import { Sparkles, Wand2, ArrowRight, RotateCcw, Check, MessageSquare } from 'lucide-react';

interface AISlideAssistantModalProps {
  currentSlide: SlideData;
  slideIndex: number;
  presentationTitle: string;
  onApplySlideUpdate: (updatedSlide: SlideData) => void;
  onClose: () => void;
}

const QUICK_COMMANDS = [
  { label: '✨ Improve Design', prompt: 'Improve Design: polish typography, balance layout, and elevate aesthetics.' },
  { label: '👔 Make More Professional', prompt: 'Make More Professional: refine tone, structure bullets with action verbs, and strengthen executive clarity.' },
  { label: '🎨 Make More Visual', prompt: 'Make More Visual: transition to image-led or card layout with relevant high-impact concept photography.' },
  { label: '✂️ Simplify Text', prompt: 'Simplify Text: shorten all bullet points into punchy, concise, scannable phrases under 8 words each.' },
  { label: '📝 Add More Detail', prompt: 'Add More Detail: expand points with deep strategic analysis, metrics, and thorough contextual explanations.' },
  { label: '🔀 Generate Alternative Layout', prompt: 'Generate Alternative Layout: restructure into a contrasting layout like three-card pillars, two-column comparison, or metrics showcase.' },
  { label: '🖼️ Add Relevant Images', prompt: 'Add Relevant Images: pair with high-resolution contextual concept photography and image-text split.' },
  { label: '⚡ Fix Layout Problems', prompt: 'Fix Layout Problems: balance bullet lengths, normalize proportions, and resolve layout spacing issues.' },
  { label: '🔁 Regenerate Selected Slide', prompt: 'Regenerate Selected Slide: completely rewrite and redesign this slide from scratch on this presentation topic.' },
  { label: '🎙️ Generate Speaker Notes', prompt: 'Generate professional, spoken talking points and presentation script for the presenter to say aloud.' },
  { label: '📊 Add Key Metrics & KPIs', prompt: 'Add 3 quantitative statistics, percentages, and performance indicators.' },
  { label: '🎯 Strengthen Key Takeaway', prompt: 'Craft a memorable, executive-grade single-sentence takeaway for this slide.' },
];

export const AISlideAssistantModal: React.FC<AISlideAssistantModalProps> = ({
  currentSlide,
  slideIndex,
  presentationTitle,
  onApplySlideUpdate,
  onClose,
}) => {
  const [customInstruction, setCustomInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewSlide, setPreviewSlide] = useState<SlideData | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  const handleExecuteAI = async (command: string) => {
    if (!command.trim() || loading) return;

    setLoading(true);
    setError(null);
    setPreviewSlide(null);
    setAiExplanation(null);

    try {
      const response = await fetch('/api/ai/doc-maker/slide-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: command.trim(),
          slide: currentSlide,
          presentationTitle,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success && data.slide) {
        setPreviewSlide(data.slide);
        setAiExplanation(data.explanation || 'AI generated enhancements ready for review.');
      } else {
        setError(data.error || 'Failed to process AI slide update.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (previewSlide) {
      onApplySlideUpdate(previewSlide);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#080d14] border border-purple-800/80 rounded-xl p-5 max-w-2xl w-full font-mono text-xs shadow-2xl flex flex-col space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-950/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-950 border border-purple-600 text-purple-300">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-purple-200">
                AI SLIDE COPILOT — SLIDE {slideIndex + 1}
              </h3>
              <p className="text-[11px] text-zinc-400">
                Editing: "{currentSlide.title || 'Untitled Slide'}"
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        {/* Quick 1-Click Action Buttons */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-400 block font-bold">
            QUICK ENHANCEMENT COMMANDS:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {QUICK_COMMANDS.map((cmd, idx) => (
              <button
                key={idx}
                disabled={loading}
                onClick={() => handleExecuteAI(cmd.prompt)}
                className="text-left p-2 rounded bg-black/60 border border-purple-950/60 hover:border-purple-500 text-zinc-300 hover:text-purple-200 text-xs transition-all flex items-center justify-between group disabled:opacity-50 cursor-pointer"
              >
                <span>{cmd.label}</span>
                <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:text-purple-400 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>

        {/* Custom Instruction Prompt */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-400 block font-bold">
            CUSTOM INSTRUCTION / PROMPT:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Add 2 points about quantum encryption and make tone executive..."
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleExecuteAI(customInstruction);
              }}
              className="flex-1 bg-black border border-purple-900 rounded p-2 text-xs text-white outline-none focus:border-purple-400"
            />
            <button
              disabled={loading || !customInstruction.trim()}
              onClick={() => handleExecuteAI(customInstruction)}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-purple-950"
            >
              {loading ? (
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              <span>ENHANCE</span>
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded bg-red-950/40 border border-red-800 text-red-300 text-xs">
            ⚠️ {error}
          </div>
        )}

        {/* AI Proposal Preview */}
        {previewSlide && (
          <div className="p-3 rounded-lg bg-black/90 border border-emerald-500/80 space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between text-emerald-300 font-bold text-xs pb-1 border-b border-emerald-950">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>AI PROPOSED ENHANCEMENTS</span>
              </span>
              <span className="text-[10px] text-zinc-400 uppercase">
                Layout: {previewSlide.layout}
              </span>
            </div>

            {aiExplanation && (
              <p className="text-[11px] text-emerald-400 italic">
                "{aiExplanation}"
              </p>
            )}

            {/* Slide Title & Subtitle Preview */}
            <div>
              <div className="font-bold text-emerald-200 text-xs">
                {previewSlide.title}
              </div>
              {previewSlide.subtitle && (
                <div className="text-[10px] text-zinc-400">
                  {previewSlide.subtitle}
                </div>
              )}
            </div>

            {/* Bullets Preview */}
            <div className="space-y-1 pl-1">
              {(previewSlide.bulletPoints || []).map((bp, bIdx) => (
                <div key={bIdx} className="text-zinc-300 text-xs flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{bp}</span>
                </div>
              ))}
            </div>

            {/* Takeaway */}
            {previewSlide.takeaway && (
              <div className="p-2 rounded bg-emerald-950/40 border border-emerald-900 text-emerald-300 text-xs font-bold">
                💡 Key Takeaway: {previewSlide.takeaway}
              </div>
            )}

            {/* Speaker Notes */}
            {previewSlide.speakerNotes && (
              <div className="p-2 rounded bg-cyan-950/30 border border-cyan-900 text-cyan-300 text-[11px]">
                <span className="font-bold block mb-0.5">🎙️ Speaker Notes:</span>
                {previewSlide.speakerNotes}
              </div>
            )}

            {/* Apply / Discard Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-950">
              <button
                onClick={() => setPreviewSlide(null)}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
              >
                Discard
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-950"
              >
                <Check className="w-3.5 h-3.5" />
                <span>APPLY TO SLIDE</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
