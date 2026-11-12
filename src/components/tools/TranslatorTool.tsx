import React, { useState } from 'react';
import { streamAiCompletion, speakText } from '../../utils/aiClient';
import { Languages, ArrowLeftRight, Copy, Check, Volume2, Square, Sparkles } from 'lucide-react';

export const TranslatorTool: React.FC = () => {
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [tone, setTone] = useState('Natural & Conversational');
  const [isTranslating, setIsTranslating] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [copied, setCopied] = useState(false);

  const languages = [
    'English',
    'Spanish',
    'French',
    'German',
    'Japanese',
    'Chinese (Simplified)',
    'Hindi',
    'Arabic',
    'Russian',
    'Portuguese',
    'Italian',
    'Korean',
    'Dutch',
    'Turkish',
    'Swedish',
  ];

  const tones = ['Natural & Conversational', 'Business & Professional', 'Academic & Formal', 'Creative & Literary'];

  const swapLanguages = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  const handleTranslate = () => {
    if (!inputText.trim()) return;
    setIsTranslating(true);
    setTranslatedText('');

    const systemInstruction = `You are SUPERAI Universal Translator, an elite computational linguist and localization expert.
Translate the input text faithfully and idiomatically from ${sourceLang} to ${targetLang}.
Register / Tone: ${tone}
Instructions:
- Provide the fluent, natural translation first.
- If there are cultural idioms, regional nuances, or multiple meanings, provide a short "Nuance Note" beneath the translation.`;

    const userPrompt = `Translate the following text into ${targetLang}:\n"${inputText}"`;

    const controller = streamAiCompletion(
      {
        prompt: userPrompt,
        systemInstruction,
      },
      {
        onChunk: (chunk) => {
          setTranslatedText((prev) => prev + chunk);
        },
        onDone: () => {
          setIsTranslating(false);
          setAbortController(null);
        },
        onError: (err) => {
          setTranslatedText((prev) => prev + `\n\n*[Error: ${err}]*`);
          setIsTranslating(false);
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
            <span className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Languages className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">AI Universal Translator</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Context-aware translation preserving idiomatic nuances, register, and natural cadence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Register:</span>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-teal-500"
          >
            {tones.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Language pair selectors */}
      <div className="flex items-center justify-center gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 max-w-xl mx-auto">
        <select
          value={sourceLang}
          onChange={(e) => setSourceLang(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-teal-500 flex-1 font-medium"
        >
          {languages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>

        <button
          onClick={swapLanguages}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer border border-zinc-700/60"
          title="Swap languages"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>

        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-teal-500 flex-1 font-medium"
        >
          {languages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {/* Side-by-side translation boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source box */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden flex flex-col h-72">
          <div className="px-4 py-2 bg-zinc-950/80 border-b border-zinc-800 text-xs font-semibold text-zinc-300">
            {sourceLang}
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste text to translate..."
            className="flex-1 p-4 bg-transparent text-sm text-zinc-200 focus:outline-none resize-none leading-relaxed placeholder:text-zinc-600"
          />
          <div className="p-3 bg-zinc-950/40 border-t border-zinc-800 flex justify-between items-center">
            <span className="text-[11px] text-zinc-500">{inputText.length} characters</span>
            {!isTranslating ? (
              <button
                onClick={handleTranslate}
                disabled={!inputText.trim()}
                className="bg-teal-600 hover:bg-teal-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium text-xs px-4 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Translate
              </button>
            ) : (
              <button
                onClick={() => abortController?.abort()}
                className="bg-red-600/80 hover:bg-red-600 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <Square className="w-3 h-3 fill-current" />
                Stop
              </button>
            )}
          </div>
        </div>

        {/* Target translated box */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden flex flex-col h-72">
          <div className="px-4 py-2 bg-zinc-950/80 border-b border-zinc-800 text-xs font-semibold text-zinc-300 flex justify-between items-center">
            <span>{targetLang}</span>
            {translatedText && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => speakText(translatedText)}
                  className="hover:text-white text-zinc-400 p-1"
                  title="Pronounce translation"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(translatedText);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="hover:text-white text-zinc-400 p-1"
                  title="Copy translation"
                >
                  {copied ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 p-4 overflow-y-auto text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
            {translatedText || (
              <span className="text-zinc-600 italic text-xs">Translation output will appear here...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
