import React, { useState, useRef, useEffect } from 'react';
import { ModalWrapper } from './Modals';
import { soundEngine } from '../utils/audio';

export interface ChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  timestamp: string;
}

interface AICoreModalProps {
  onClose: () => void;
  onLog: (text: string, tag: string) => void;
  audioActive: boolean;
  onVocalize: (text: string) => void;
}

export const AICoreModal: React.FC<AICoreModalProps> = ({
  onClose,
  onLog,
  onVocalize,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'AI',
      text: 'SUPERAI OS Core Intelligence online. I am equipped to answer ANY question across science, mathematics, coding, history, cosmology, hardware, and general knowledge. Awaiting your query.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const askQuestion = async (query: string) => {
    if (!query.trim() || loading) return;
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'USER',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    soundEngine.playClick();
    onLog(`[AI QUERY]: ${query.trim()}`, 'INTELLIGENCE');

    const aiMsgId = Math.random().toString(36).substring(2, 9);
    setMessages((prev) => [
      ...prev,
      {
        id: aiMsgId,
        sender: 'AI',
        text: '',
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    try {
      const res = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query.trim() }),
      });

      if (!res.ok || !res.body) {
        // Fallback to unary if stream fails
        const unaryRes = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: query.trim() }),
        });
        let fallbackText = 'Response computed.';
        try {
          const raw = await unaryRes.text();
          if (raw && raw.trim()) {
            const parsed = JSON.parse(raw);
            fallbackText = parsed.answer || raw;
          }
        } catch {
          fallbackText = 'Mainframe processed query.';
        }
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, text: fallbackText } : m))
        );
        soundEngine.playSuccess();
        onLog(`🤖 [AI ANSWER]: ${fallbackText}`, 'INTELLIGENCE');
        onVocalize(fallbackText);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              if (parsed.text) {
                accumulated += parsed.text;
                const currentText = accumulated;
                setMessages((prev) =>
                  prev.map((m) => (m.id === aiMsgId ? { ...m, text: currentText } : m))
                );
              }
            } catch {
              // Ignore partial JSON
            }
          }
        }
      }

      if (accumulated.trim()) {
        soundEngine.playSuccess();
        onLog(`🤖 [AI ANSWER]: ${accumulated}`, 'INTELLIGENCE');
        onVocalize(accumulated);
      }
    } catch (err: any) {
      const errorMsg = `Neural cluster query failed: ${err.message || 'Unknown network error'}`;
      setMessages((prev) =>
        prev.map((m) => (m.id === aiMsgId ? { ...m, text: errorMsg } : m))
      );
      soundEngine.playAlertBeep();
      onLog(`[-] ${errorMsg}`, 'ERROR');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    askQuestion(input);
  };

  const suggestions = [
    'How do quantum computers work?',
    'Explain the theory of relativity simply',
    'Write a Python quicksort algorithm',
    'What caused the Big Bang?',
    'Who is Alan Turing and what was the Bombe?',
    'Calculate the escape velocity of Earth',
  ];

  return (
    <ModalWrapper title="🤖 MATRIX AI OMNISCIENT CORE (ANY QUESTION)" onClose={onClose}>
      <div className="flex flex-col h-[460px]">
        {/* Suggestion tags */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 border-b border-emerald-950 scrollbar-none text-[11px]">
          <span className="text-emerald-600 self-center whitespace-nowrap">Suggested:</span>
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              disabled={loading}
              onClick={() => askQuestion(s)}
              className="bg-black border border-emerald-800 hover:border-emerald-500 hover:bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded whitespace-nowrap transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Message history */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 font-mono text-xs scrollbar-thin scrollbar-thumb-emerald-800">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-2.5 rounded border leading-relaxed ${
                m.sender === 'USER'
                  ? 'bg-emerald-950/20 border-emerald-800/80 text-emerald-300 ml-6'
                  : 'bg-black/80 border-emerald-900 text-emerald-400 mr-4'
              }`}
            >
              <div className="flex justify-between items-center mb-1 text-[10px] text-emerald-600">
                <span className="font-bold">
                  {m.sender === 'USER' ? '👤 SUPERAI_OPERATOR' : '🤖 AI_CORE_MAINFRAME'}
                </span>
                <span>{m.timestamp}</span>
              </div>
              <div className="whitespace-pre-wrap">{m.text}</div>
            </div>
          ))}

          {loading && (
            <div className="bg-black/80 border border-emerald-900 p-2.5 rounded mr-4 text-xs text-emerald-400 animate-pulse flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Analyzing neural parameters across universal knowledge base...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Query Input */}
        <form onSubmit={handleFormSubmit} className="mt-3 pt-2 border-t border-emerald-950 flex gap-2">
          <input
            type="text"
            placeholder="Ask ANY question (science, code, math, history, logic, advice)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            autoFocus
            className="flex-1 bg-black border border-emerald-800 focus:border-emerald-400 text-xs text-emerald-300 px-3 py-2 rounded focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-extrabold text-xs px-4 py-2 rounded transition-colors"
          >
            {loading ? 'COMPUTING...' : 'ASK'}
          </button>
        </form>
      </div>
    </ModalWrapper>
  );
};
