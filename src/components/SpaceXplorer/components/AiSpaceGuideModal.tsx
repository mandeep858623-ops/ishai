import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User, Loader2, Volume2, VolumeX } from 'lucide-react';
import { soundEngine, speakText, stopSpeaking } from '../../../utils/audio';

interface AiSpaceGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuestion?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

export const AiSpaceGuideModal: React.FC<AiSpaceGuideModalProps> = ({
  isOpen,
  onClose,
  initialQuestion
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'ai',
      text: 'Greetings, Space Explorer! I am your AI Astronomy Guide. Ask me anything about planets, stars, black holes, space missions, satellite orbits, or quantum cosmology.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuestion && isOpen) {
      handleAsk(initialQuestion);
    }
  }, [initialQuestion, isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleAsk = async (questionText?: string) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    soundEngine.playClick();
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: q,
          systemInstruction: `You are the AI Space Guide inside SUPERAI SPACE XPLORER. 
          Provide clear, engaging, scientifically accurate, and fascinating astronomy answers. 
          Use clean formatting, short paragraphs, and bullet points where helpful. Never invent fake celestial bodies or false mission dates.`
        })
      });

      const data = await res.json();
      const answer = data.answer || data.text || 'I analyzed the cosmic parameters, but the data stream was interrupted. Please try asking again.';

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      soundEngine.playSuccess();
    } catch (err) {
      console.error('AI Space Guide Error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'Deep space signal loss. Unable to reach the neural astronomical database right now.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      soundEngine.playAlertBeep();
    } finally {
      setLoading(false);
    }
  };

  const handleSpeechToggle = (text: string) => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      speakText(text, 'Male');
      setIsSpeaking(true);
    }
  };

  if (!isOpen) return null;

  const quickQuestions = [
    "Why is Mars red?",
    "How far away is Saturn?",
    "What is inside a black hole?",
    "Which planets are visible tonight?",
    "How do satellites stay in orbit?",
    "What is the James Webb Space Telescope currently observing?"
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-[#090d16] border border-cyan-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[600px]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-cyan-950/80 via-blue-950/80 to-indigo-950/80 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm tracking-wide flex items-center gap-2">
                AI SPACE GUIDE
                <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">Gemini Powered</span>
              </h3>
              <p className="text-[11px] text-cyan-300/70">Your personal astrophysics & astronomy assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Question Chips */}
        <div className="px-4 py-2 bg-black/40 border-b border-cyan-900/30 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] text-cyan-400/60 font-bold shrink-0">Prompts:</span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(q)}
              disabled={loading}
              className="text-[10px] whitespace-nowrap px-2.5 py-1 rounded-full bg-cyan-950/60 hover:bg-cyan-800/40 border border-cyan-500/30 text-cyan-300 transition-all cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.sender === 'ai' && (
                <div className="w-8 h-8 rounded-lg bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl p-3.5 space-y-1 ${
                m.sender === 'user'
                  ? 'bg-cyan-600 text-white rounded-tr-none'
                  : 'bg-zinc-900/90 border border-cyan-500/20 text-cyan-100 rounded-tl-none'
              }`}>
                <div className="flex items-center justify-between text-[9px] opacity-60 pb-1">
                  <span>{m.sender === 'user' ? 'YOU' : 'AI SPACE GUIDE'}</span>
                  <span>{m.time}</span>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-xs">
                  {m.text}
                </div>
                {m.sender === 'ai' && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleSpeechToggle(m.text)}
                      className="text-[10px] text-cyan-400 hover:text-white flex items-center gap-1 opacity-70 hover:opacity-100"
                    >
                      <Volume2 className="w-3 h-3" /> Read Aloud
                    </button>
                  </div>
                )}
              </div>
              {m.sender === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-zinc-900/90 border border-cyan-500/20 text-cyan-300 p-3 rounded-2xl rounded-tl-none text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>Computing orbital and astrophysical parameters...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleAsk(); }} className="p-4 bg-black/60 border-t border-cyan-900/40 flex gap-2">
          <input
            type="text"
            placeholder="Ask about planets, stars, black holes, NASA missions..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-zinc-950 border border-cyan-800/80 focus:border-cyan-400 text-xs text-cyan-200 px-3.5 py-2.5 rounded-xl focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
