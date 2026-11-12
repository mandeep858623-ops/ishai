import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, ChatMessage, UserSettings } from '../types/superai';
import { streamAiCompletion, speakText, stopSpeaking } from '../utils/aiClient';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
  Send,
  Square,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  Trash2,
  Code,
  Calculator,
  Compass,
  FileText,
} from 'lucide-react';

interface ChatWorkspaceProps {
  session: ChatSession;
  onUpdateSessionMessages: (sessionId: string, messages: ChatMessage[]) => void;
  onClearSession: (sessionId: string) => void;
  settings: UserSettings;
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  session,
  onUpdateSessionMessages,
  onClearSession,
  settings,
}) => {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages, isGenerating]);

  // Adjust textarea height automatically
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleSendMessage = (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || isGenerating) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    const nextMessages = [...session.messages, userMessage, assistantMessage];
    onUpdateSessionMessages(session.id, nextMessages);

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsGenerating(true);

    const historyForModel = nextMessages
      .slice(0, -1) // exclude currently empty streaming assistant msg
      .map((m) => ({ role: m.role, content: m.content }));

    let toneInstruction = '';
    if (settings.responseTone === 'concise') {
      toneInstruction = 'Keep responses concise, direct, and high-density.';
    } else if (settings.responseTone === 'technical') {
      toneInstruction = 'Provide deep technical rigor, proofs, architectural explanations, and complexity analysis.';
    } else if (settings.responseTone === 'creative') {
      toneInstruction = 'Provide expressive, illustrative, and engaging explanations.';
    }

    const controller = streamAiCompletion(
      {
        messages: historyForModel,
        systemInstruction: `You are SUPERAI, the advanced, elite all-in-one AI intelligence.
${toneInstruction}
Format answers with clear headings, clean markdown lists, readable tables, and syntax-highlighted code blocks where applicable.`,
      },
      {
        onChunk: (chunk) => {
          onUpdateSessionMessages(
            session.id,
            nextMessages.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
          );
        },
        onDone: () => {
          setIsGenerating(false);
          setAbortController(null);
          onUpdateSessionMessages(
            session.id,
            nextMessages.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m))
          );
        },
        onError: (err) => {
          setIsGenerating(false);
          setAbortController(null);
          onUpdateSessionMessages(
            session.id,
            nextMessages.map((m) =>
              m.id === assistantId ? { ...m, isStreaming: false, error: err, content: m.content || `[Error: ${err}]` } : m
            )
          );
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

  const handleRegenerate = () => {
    if (session.messages.length < 2 || isGenerating) return;
    const lastUserIndex = [...session.messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIndex === -1) return;

    const actualIndex = session.messages.length - 1 - lastUserIndex;
    const userPrompt = session.messages[actualIndex].content;
    const truncated = session.messages.slice(0, actualIndex);
    onUpdateSessionMessages(session.id, truncated);
    handleSendMessage(userPrompt);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const starterPrompts = [
    {
      icon: Sparkles,
      title: 'Quantum Computing Breakdown',
      desc: 'Explain quantum error correction simply with intuitive physical analogies.',
      prompt: 'Explain quantum error correction simply with intuitive physical analogies.',
    },
    {
      icon: Code,
      title: 'Architecture & Debugging',
      desc: 'Design an event-driven microservices architecture for real-time notifications.',
      prompt: 'Design an event-driven microservices architecture for real-time notifications with fault tolerance and idempotency.',
    },
    {
      icon: Calculator,
      title: 'Advanced Mathematics',
      desc: 'Derive and explain the significance of Euler’s Identity e^(i*pi) + 1 = 0.',
      prompt: 'Derive and explain the geometric and algebraic significance of Euler’s Identity e^(i*pi) + 1 = 0 step-by-step.',
    },
    {
      icon: FileText,
      title: 'Executive Strategic Writing',
      desc: 'Draft an executive briefing on AI agents transforming business workflows.',
      prompt: 'Draft an executive briefing on AI autonomous agents transforming enterprise operational workflows.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-inherit">
      {/* Top Workspace Header */}
      <header className="px-5 py-3 border-b border-inherit flex items-center justify-between text-xs backdrop-blur-md bg-inherit/90 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-bold tracking-tight text-white truncate max-w-xs sm:max-w-md">
            {session.title || 'New Conversation'}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium shrink-0">
            Gemini 3.8 Flash
          </span>
        </div>

        <div className="flex items-center gap-2">
          {session.messages.length > 0 && (
            <button
              onClick={() => onClearSession(session.id)}
              className="flex items-center gap-1 text-zinc-500 hover:text-red-400 px-2 py-1 rounded hover:bg-zinc-800/40 transition-colors cursor-pointer"
              title="Clear messages in this chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Clear Chat</span>
            </button>
          )}
        </div>
      </header>

      {/* Messages stream / Empty state */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {session.messages.length === 0 ? (
          <div className="max-w-3xl mx-auto h-full flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center text-white shadow-xl mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-pink-400">SUPERAI</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mt-2 leading-relaxed">
              Your futuristic, all-in-one intelligence workspace. Ask any question, draft complex code, solve mathematics, or brainstorm creative concepts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mt-8 text-left">
              {starterPrompts.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.prompt)}
                    className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/60 hover:border-indigo-500/40 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2 mb-1.5 text-zinc-200 group-hover:text-indigo-300">
                      <Icon className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-semibold">{p.title}</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 group-hover:text-zinc-400 leading-normal">
                      {p.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {session.messages.map((m: ChatMessage) => {
              const isUser = m.role === 'user';
              return (
                <div key={m.id} className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 shadow-md">
                      S
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-[80%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl p-4 text-sm leading-relaxed ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                          : 'bg-zinc-900/80 border border-zinc-800/80 text-zinc-200 rounded-bl-none'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      ) : (
                        <div>
                          <MarkdownRenderer content={m.content} />
                          {m.isStreaming && (
                            <span className="inline-block w-2 h-4 bg-indigo-400 animate-pulse ml-1 align-middle" />
                          )}
                          {m.error && (
                            <div className="mt-2 text-xs text-red-400 bg-red-950/40 border border-red-900/60 p-2 rounded-lg">
                              {m.error}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex items-center gap-2 mt-1.5 px-1 text-[11px] text-zinc-500">
                      <span>{m.timestamp}</span>
                      {!isUser && m.content && (
                        <>
                          <span>·</span>
                          <button
                            onClick={() => handleCopyMessage(m.id, m.content)}
                            className="hover:text-zinc-300 transition-colors p-0.5 cursor-pointer"
                            title="Copy response"
                          >
                            {copiedId === m.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => speakText(m.content, settings.voiceGender)}
                            className="hover:text-zinc-300 transition-colors p-0.5 cursor-pointer"
                            title="Listen aloud"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input Bar */}
      <div className="p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-2xl focus-within:border-indigo-500/80 transition-all p-2 flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask anything, solve an equation, write code, or draft content..."
              className="w-full bg-transparent px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none resize-none max-h-44 leading-relaxed"
            />

            <div className="flex items-center justify-between px-2 pt-1 border-t border-zinc-800/60">
              <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                <span className="hidden sm:inline">Press Enter to send · Shift+Enter for new line</span>
              </div>

              <div className="flex items-center gap-2">
                {session.messages.length > 1 && !isGenerating && (
                  <button
                    onClick={handleRegenerate}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Regenerate last response"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}

                {isGenerating ? (
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-medium text-xs py-1.5 px-3 rounded-xl transition-colors cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim()}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white transition-colors cursor-pointer shadow-md"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <p className="text-[10px] text-zinc-500 text-center mt-2">
            SUPERAI Core operates natively via Google AI Studio. Conversations are stored locally on your device.
          </p>
        </div>
      </div>
    </div>
  );
};
