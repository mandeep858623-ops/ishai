import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  X, 
  History, 
  Settings, 
  ChevronRight, 
  Search, 
  Globe, 
  Command, 
  Terminal,
  Volume2,
  VolumeX,
  RotateCcw,
  Play,
  Brain,
  MessageSquare,
  AlertCircle,
  Sliders
} from 'lucide-react';
import { soundEngine, speakText, stopSpeaking, subscribeSpeech } from '../../utils/audio';

interface VoiceAssistantProps {
  isActive: boolean;
  onClose: () => void;
  onLog: (text: string, tag?: string) => void;
  voiceGender: 'Male' | 'Female';
  onExecuteAction: (action: string, params?: any) => void;
  activeModal: string | null;
}

import html2canvas from 'html2canvas';

export interface CommandHistoryItem {
  id: string;
  transcript: string;
  action: string;
  timestamp: number;
  status: 'success' | 'failed' | 'processing';
}

export const VoiceAssistant2: React.FC<VoiceAssistantProps> = ({
  isActive,
  onClose,
  onLog,
  voiceGender,
  onExecuteAction,
  activeModal
}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [history, setHistory] = useState<CommandHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingText, setSpeakingText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [deviceType, setDeviceType] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  
  // Settings
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [autoListen, setAutoListen] = useState(false);
  const [speechRate, setSpeechSpeed] = useState(1.0);

  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync with audio engine
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|phone/i.test(ua)) {
      setDeviceType(ua.includes('ipad') || ua.includes('tablet') ? 'tablet' : 'mobile');
    } else {
      setDeviceType('desktop');
    }

    const unsub = subscribeSpeech((speaking, text) => {
      setIsSpeaking(speaking);
      setSpeakingText(text);
    });
    return unsub;
  }, []);

  const addToHistory = (transcript: string, action: string, status: 'success' | 'failed' | 'processing' = 'success') => {
    const newItem: CommandHistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      transcript,
      action,
      timestamp: Date.now(),
      status
    };
    setHistory(prev => [newItem, ...prev].slice(0, 20));
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isThinking]);

  const callAI = async (prompt: string) => {
    setIsThinking(true);
    const newMessages = [...chatMessages, { role: 'user' as const, content: prompt }];
    setChatMessages(newMessages);
    
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: newMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n'),
          systemInstruction: `You are ISHAI, the intelligent AI assistant for the SUPERAI Operating System. 
          Current Device: ${deviceType.toUpperCase()}
          Capabilities: 
          - Conversational AI (Natural language)
          - App Navigation (Open [App Name])
          - Browser Control (New tab, Refresh, Back/Forward)
          - Keyboard Control (Press [key], combinations like Ctrl+C)
          - Voice Typing (Type [text] into focused fields)
          - Mouse Control (Click [element name], Scroll)
          - Screen Assistance (Screenshot, Explain what is on screen)
          
          Guidelines:
          - Be concise (1-3 sentences).
          - Use plain text (no markdown).
          - Never invent facts or citations.
          - If a keyboard shortcut is likely blocked by the browser (like Alt+Tab), inform the user.
          - If the user asks to type, check if they specified WHAT to type.
          - For multi-step commands, identify all steps.`
        }),
      });

      const data = await response.json();
      if (data.answer) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
        if (speechEnabled) {
          speakText(data.answer, voiceGender);
        }
      } else {
        throw new Error('No answer received');
      }
    } catch (err) {
      console.error('AI Error:', err);
      onLog('AI Core is unresponsive.', 'ERROR');
      setChatMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, my neural core is currently under maintenance. Please try again in a moment." }]);
    } finally {
      setIsThinking(false);
    }
  };

  const processCommand = useCallback((text: string) => {
    const spoken = text.toLowerCase().trim();
    if (!spoken) return;

    onLog(`[VOICE]: Recognized "${spoken}"`, 'VOICE');
    
    // Multi-step command split
    const steps = spoken.split(/\s+and\s+|\s+then\s+|,/).map(s => s.trim()).filter(Boolean);
    
    if (steps.length > 1) {
      onLog(`[VOICE]: Multi-step command detected: ${steps.length} actions.`, 'SYSTEM');
      steps.forEach((step, index) => {
        setTimeout(() => {
          handleStep(step);
        }, index * 1000); // Small delay between steps
      });
    } else {
      handleStep(spoken);
    }
  }, [onLog, onExecuteAction]);

  const simulateKeyPress = (keyStr: string) => {
    const key = keyStr.toLowerCase();
    const isCtrl = key.includes('control') || key.includes('ctrl');
    const isAlt = key.includes('alt');
    const isShift = key.includes('shift');
    const isMeta = key.includes('windows') || key.includes('cmd') || key.includes('command') || key.includes('meta');

    let mainKey = key.split('+').pop()?.trim() || key;
    if (mainKey === 'enter') mainKey = 'Enter';
    if (mainKey === 'escape') mainKey = 'Escape';
    if (mainKey === 'space') mainKey = ' ';
    if (mainKey === 'tab') mainKey = 'Tab';
    if (mainKey === 'backspace') mainKey = 'Backspace';
    if (mainKey === 'delete') mainKey = 'Delete';
    if (mainKey.includes('arrow')) {
      mainKey = mainKey.replace('arrow ', '').charAt(0).toUpperCase() + mainKey.replace('arrow ', '').slice(1);
      mainKey = 'Arrow' + mainKey;
    }

    const event = new KeyboardEvent('keydown', {
      key: mainKey,
      ctrlKey: isCtrl,
      altKey: isAlt,
      shiftKey: isShift,
      metaKey: isMeta,
      bubbles: true
    });
    
    document.activeElement?.dispatchEvent(event);
    onLog(`[VOICE]: Dispatched KeyboardEvent: ${mainKey} (Ctrl:${isCtrl}, Alt:${isAlt})`, 'SYSTEM');
  };

  const handleTyping = (text: string) => {
    const active = document.activeElement;
    if (active && (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)) {
      const start = active.selectionStart || 0;
      const end = active.selectionEnd || 0;
      const val = active.value;
      active.value = val.substring(0, start) + text + val.substring(end);
      active.selectionStart = active.selectionEnd = start + text.length;
      active.dispatchEvent(new Event('input', { bubbles: true }));
      onLog(`[VOICE]: Typed "${text}" into active field.`, 'SYSTEM');
    } else {
      onLog('[VOICE ERROR]: No active text field detected for typing.', 'ERROR');
      if (speechEnabled) speakText("Please click into a text field first so I know where to type.", voiceGender);
    }
  };

  const clickElement = (searchText: string) => {
    const elements = Array.from(document.querySelectorAll('button, a, [role="button"], input[type="submit"]'));
    const target = elements.find(el => 
      el.textContent?.toLowerCase().includes(searchText.toLowerCase()) || 
      el.getAttribute('aria-label')?.toLowerCase().includes(searchText.toLowerCase())
    ) as HTMLElement | undefined;

    if (target) {
      target.click();
      onLog(`[VOICE]: Clicked element matching "${searchText}"`, 'SYSTEM');
    } else {
      onLog(`[VOICE ERROR]: Could not find clickable element matching "${searchText}"`, 'ERROR');
    }
  };

  const captureScreen = async () => {
    if (speechEnabled) speakText("Capturing screen... Please wait.", voiceGender);
    try {
      const canvas = await html2canvas(document.body);
      const dataUrl = canvas.toDataURL('image/png');
      onExecuteAction('SCREENSHOT_CAPTURE', { image: dataUrl });
      onLog('[VOICE]: Screenshot captured successfully.', 'SYSTEM');
      if (speechEnabled) speakText("Screenshot captured. Opening Screen Companion for analysis.", voiceGender);
    } catch (err) {
      onLog('[VOICE ERROR]: Screenshot failed.', 'ERROR');
    }
  };

  const handleStep = (step: string) => {
    // 1. Language Normalization (Hindi to English)
    let normalized = step.toLowerCase();
    
    // Hindi variants
    const hindiMappings: Record<string, string> = {
      'kholo': 'open',
      'open karo': 'open',
      'chalao': 'launch',
      'dikhao': 'show',
      'dikhau': 'show',
      'search karo': 'search',
      'dhundo': 'search',
      'band karo': 'close',
      'piche jao': 'go back',
      'aage jao': 'go forward',
      'upar jao': 'scroll up',
      'neeche jao': 'scroll down',
      'refresh karo': 'refresh',
      'on karo': 'on',
      'chalu karo': 'on',
      'ruk jao': 'stop'
    };

    Object.entries(hindiMappings).forEach(([hindi, english]) => {
      if (normalized.includes(hindi)) {
        normalized = normalized.replace(hindi, english).trim();
      }
    });

    // 2. Command Extraction
    // Support "Open YouTube" and "YouTube open" (common in natural speech/Hindi)
    const openVerbs = 'open|launch|start|run|show|take me to|navigate to';
    const openMatch = normalized.match(new RegExp(`(?:${openVerbs})\\s+(.*)`, 'i')) || 
                      normalized.match(new RegExp(`(.*)\\s+(?:${openVerbs})`, 'i'));
    
    const searchVerbs = 'search|find|query';
    const searchMatch = normalized.match(new RegExp(`(?:${searchVerbs})\\s+(?:for\\s+)?(.*?)(?:\\s+on\\s+(google|youtube|wikipedia|vault|my files|the web))?$`, 'i')) ||
                        normalized.match(new RegExp(`(.*?)\\s+(?:on\\s+(google|youtube|wikipedia|vault|my files|the web)\\s+)?(?:${searchVerbs})$`, 'i'));
    
    if (openMatch) {
      const target = (openMatch[1] || openMatch[2] || '').trim();
      if (target) {
        onExecuteAction('OPEN', { target });
        addToHistory(step, `Opening ${target}`);
        return;
      }
    }

    if (searchMatch) {
      const query = (searchMatch[1] || '').trim();
      const destination = searchMatch[2] || 'google';
      if (query) {
        onExecuteAction('SEARCH', { query, destination });
        addToHistory(step, `Searching ${destination} for ${query}`);
        return;
      }
    }

    // Context / UI Controls
    if (normalized.includes('go back') || normalized.includes('piche')) {
      window.history.back();
      onLog('Navigating back.', 'SYSTEM');
      addToHistory(step, 'Browser Back');
    } else if (normalized.includes('go forward') || normalized.includes('aage')) {
      window.history.forward();
      onLog('Navigating forward.', 'SYSTEM');
      addToHistory(step, 'Browser Forward');
    } else if (normalized.includes('refresh') || normalized.includes('reload')) {
      window.location.reload();
      addToHistory(step, 'Reload Page');
    } else if (normalized.includes('scroll down') || normalized.includes('neeche')) {
      window.scrollBy({ top: 500, behavior: 'smooth' });
      addToHistory(step, 'Scroll Down');
    } else if (normalized.includes('scroll to top') || normalized.includes('scroll up') || normalized.includes('upar')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      addToHistory(step, 'Scroll Top');
    } else if (normalized.includes('dark mode')) {
      onExecuteAction('THEME', { mode: 'dark' });
      addToHistory(step, 'Dark Mode');
    } else if (normalized.includes('light mode')) {
      onExecuteAction('THEME', { mode: 'light' });
      addToHistory(step, 'Light Mode');
    } else if (normalized.includes('cancel') || normalized.includes('stop') || normalized.includes('ruk jao')) {
      stopSpeaking();
      setIsListening(false);
      addToHistory(step, 'Action Cancelled');
    } else if (normalized.includes('full screen') || normalized.includes('maximize')) {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => console.error(e));
        addToHistory(step, 'Fullscreen Enabled');
      } else {
        document.exitFullscreen();
        addToHistory(step, 'Fullscreen Disabled');
      }
    } else if (normalized.includes('go home') || normalized.includes('dashboard')) {
      onExecuteAction('OPEN', { target: 'home' });
      addToHistory(step, 'Navigate Home');
      return;
    } else if (normalized.includes('new tab')) {
      window.open('about:blank', '_blank');
      addToHistory(step, 'Open New Tab');
      return;
    } else if (normalized.startsWith('press') || normalized.startsWith('hit')) {
      const keyStr = normalized.replace(/press|hit/i, '').trim();
      simulateKeyPress(keyStr);
      addToHistory(step, `Key: ${keyStr}`);
      return;
    } else if (normalized.startsWith('type') || normalized.startsWith('write')) {
      const text = step.replace(/type|write/i, '').trim();
      handleTyping(text);
      addToHistory(step, `Typed text`);
      return;
    } else if (normalized === 'delete last word' || normalized === 'delete word') {
       const active = document.activeElement;
       if (active && (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)) {
         const words = active.value.trim().split(' ');
         words.pop();
         active.value = words.join(' ') + (active.value.endsWith(' ') ? ' ' : '');
         active.dispatchEvent(new Event('input', { bubbles: true }));
         addToHistory(step, 'Delete Word');
       }
       return;
    } else if (normalized === 'select all' || normalized === 'select all text') {
       const active = document.activeElement;
       if (active && (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)) {
         active.select();
         addToHistory(step, 'Select All');
       }
       return;
    } else if (normalized === 'clear' || normalized === 'clear text' || normalized === 'clear field') {
       const active = document.activeElement;
       if (active && (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)) {
         active.value = '';
         active.dispatchEvent(new Event('input', { bubbles: true }));
         addToHistory(step, 'Clear Text');
       }
       return;
    } else if (normalized.startsWith('click')) {
      const target = normalized.replace('click', '').trim();
      clickElement(target);
      addToHistory(step, `Clicked ${target}`);
      return;
    } else if (normalized.includes('screenshot') || normalized.includes('take a picture of my screen')) {
      captureScreen();
      addToHistory(step, 'Screenshot');
      return;
    } else if (normalized.includes('zoom in')) {
      document.body.style.zoom = (parseFloat(document.body.style.zoom || '1') + 0.1).toString();
      addToHistory(step, 'Zoom In');
      return;
    } else if (normalized.includes('zoom out')) {
      document.body.style.zoom = (parseFloat(document.body.style.zoom || '1') - 0.1).toString();
      addToHistory(step, 'Zoom Out');
      return;
    } else if (normalized.includes('reset zoom')) {
      document.body.style.zoom = '1';
      addToHistory(step, 'Reset Zoom');
      return;
    } else {
      // If it looks like a question or natural language, use AI
      const questionWords = ['what', 'who', 'how', 'where', 'when', 'why', 'is', 'can', 'explain', 'tell', 'history', 'show', 'describe'];
      const isQuestion = questionWords.some(word => normalized.startsWith(word)) || normalized.endsWith('?');
      
      if (isQuestion || normalized.split(' ').length > 4) {
        callAI(step);
        addToHistory(step, 'AI Query');
      } else {
        // Direct command fallback for system CLI
        onExecuteAction('DIRECT', { command: normalized });
        addToHistory(step, 'System Command');
      }
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser.');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // We want a clear end to process command
    recognition.interimResults = true;
    recognition.lang = 'en-US'; // We'll handle Hindi/mixed via processing if possible, or support multiple langs

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript('');
      setFinalTranscript('');
      soundEngine.playSuccess();
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const result = event.results[i][0].transcript;
          setFinalTranscript(result);
          processCommand(result);
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech Recognition Error:', event.error);
      setIsListening(false);
      soundEngine.playAlertBeep();

      if (event.error === 'not-allowed') {
        setMicError('Microphone access is blocked. School smartboards often have security policies that prevent browser recording.');
      } else if (event.error === 'no-speech') {
        // No action needed for silent timeout
      } else if (event.error === 'network') {
        setMicError('Network error: Speech recognition requires an active internet connection.');
      } else {
        setMicError(`Recognition failed: ${event.error || 'Check microphone connection'}`);
      }
      
      if (event.error !== 'no-speech') {
        onLog(`[VOICE ERROR]: ${event.error}`, 'ERROR');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (autoListen) {
        setTimeout(startListening, 1000);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const toggleAssistant = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
    onClose();
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md pointer-events-auto">
      <div className="w-full max-w-lg bg-[#050505] border-2 border-emerald-500/50 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.3)] flex flex-col font-mono text-emerald-400">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-emerald-500/20 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`absolute -inset-1 bg-emerald-500/20 rounded-full blur-sm ${isListening ? 'animate-pulse' : ''}`} />
              <Mic className={`w-5 h-5 ${isListening ? 'text-emerald-400' : 'text-emerald-800'}`} />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-widest text-emerald-300">ISHAI VOICE 2.0</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-emerald-800'}`} />
                <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-tighter">
                  {isListening ? 'System Listening...' : 'Standby Mode'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-xl transition-colors ${showHistory ? 'bg-emerald-500 text-black' : 'hover:bg-emerald-500/10'}`}
              title="Command History"
            >
              <History className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-xl transition-colors ${showSettings ? 'bg-emerald-500 text-black' : 'hover:bg-emerald-500/10'}`}
              title="Voice Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={toggleAssistant}
              className="p-2 hover:bg-red-500/10 text-emerald-600 hover:text-red-400 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-[300px] max-h-[500px] overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-emerald-900">
          {showSettings ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5" /> Core Parameters
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-[10px] text-emerald-700 hover:text-emerald-400 underline uppercase">Close</button>
              </div>
              
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-xl">
                  <span className="text-xs font-bold">Voice Response</span>
                  <button 
                    onClick={() => setSpeechEnabled(!speechEnabled)}
                    className={`w-10 h-5 rounded-full transition-all relative ${speechEnabled ? 'bg-emerald-500' : 'bg-emerald-950'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-black transition-all ${speechEnabled ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-xl">
                  <span className="text-xs font-bold">Continuous Listening</span>
                  <button 
                    onClick={() => setAutoListen(!autoListen)}
                    className={`w-10 h-5 rounded-full transition-all relative ${autoListen ? 'bg-emerald-500' : 'bg-emerald-950'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-black transition-all ${autoListen ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                <div className="p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold">Speech Speed</span>
                    <span className="text-[10px] text-emerald-500 font-mono">{speechRate.toFixed(1)}x</span>
                  </div>
                  <input 
                    type="range" min="0.5" max="2.0" step="0.1" 
                    value={speechRate}
                    onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 h-1 bg-emerald-900 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          ) : showHistory ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                  <History className="w-3.5 h-3.5" /> Command Log
                </h3>
                <div className="flex gap-4">
                  <button onClick={() => setChatMessages([])} className="text-[10px] text-emerald-700 hover:text-emerald-400 uppercase font-bold">Clear Chat</button>
                  <button onClick={() => setHistory([])} className="text-[10px] text-emerald-700 hover:text-red-400 uppercase font-bold">Clear Log</button>
                </div>
              </div>
              
              <div className="space-y-2">
                {history.length === 0 ? (
                  <p className="text-[10px] text-emerald-900 text-center py-10">NO COMMAND DATA LOGGED</p>
                ) : history.map(item => (
                  <div key={item.id} className="p-3 bg-emerald-950/10 border border-emerald-900/30 rounded-xl flex items-start justify-between gap-3">
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs text-emerald-300 font-bold truncate">&quot;{item.transcript}&quot;</p>
                      <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" /> {item.action}
                      </p>
                    </div>
                    <span className="text-[9px] text-emerald-900 whitespace-nowrap">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full gap-6">
              {/* Visualizer */}
              <div className="flex justify-center py-6">
                <div className="flex items-center gap-1 h-12">
                  {[...Array(12)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-1 rounded-full bg-emerald-500/60 transition-all duration-300 ${isListening ? 'animate-bounce' : 'h-2'}`}
                      style={{ 
                        height: isListening ? `${Math.random() * 40 + 10}px` : '4px',
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: '0.6s'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Transcription & Chat Area */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-emerald-900/50 mb-4">
                  {chatMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-bold shadow-lg ${
                        msg.role === 'user' 
                          ? 'bg-emerald-500 text-black rounded-tr-none' 
                          : 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/20 rounded-tl-none'
                      }`}>
                        <div className="flex items-center gap-2 mb-1 opacity-50">
                          {msg.role === 'user' ? <Mic className="w-3 h-3" /> : <Brain className="w-3 h-3" />}
                          <span className="text-[10px] uppercase tracking-tighter">{msg.role === 'user' ? 'User' : 'ISHAI'}</span>
                        </div>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isThinking && (
                    <div className="flex justify-start">
                      <div className="bg-emerald-950/50 text-emerald-500/50 border border-emerald-500/10 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-3">
                        <div className="flex gap-1">
                          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Processing</span>
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>

                {/* --- ERROR FEEDBACK --- */}
                {micError && (
                  <div className="mb-4 p-3 bg-red-950/40 border border-red-800 rounded-2xl text-[10px] text-red-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="leading-relaxed">
                        <strong className="text-red-400">INPUT BLOCKED:</strong> {micError}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowTroubleshooter(true)}
                        className="flex-1 py-1.5 bg-red-900/60 hover:bg-red-800 rounded-xl font-bold transition-all border border-red-700/50 cursor-pointer"
                      >
                        Launch Troubleshooter
                      </button>
                      <button 
                        onClick={() => setMicError(null)}
                        className="px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 rounded-xl font-bold transition-all border border-zinc-700/50 cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* --- TROUBLESHOOTER OVERLAY --- */}
                {showTroubleshooter && (
                  <div className="absolute inset-0 z-[70] bg-[#050505] p-6 flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="flex items-center justify-between mb-6 pb-2 border-b border-emerald-900/50">
                       <div className="flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-emerald-400" />
                          <h3 className="text-xs font-black tracking-widest text-white uppercase">Acoustic Troubleshooter</h3>
                       </div>
                       <button onClick={() => setShowTroubleshooter(false)} className="p-1 hover:bg-emerald-500/10 rounded-lg">
                          <X className="w-5 h-5 text-emerald-800" />
                       </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-5 text-[10px] text-emerald-600 leading-relaxed pr-2 scrollbar-thin scrollbar-thumb-emerald-900">
                       <section>
                          <h4 className="text-emerald-300 font-bold mb-1 flex items-center gap-1.5">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 1. Smartboard Connectivity
                          </h4>
                          <p className="pl-3 italic">Verify the smartboard has an active microphone device. Look for a mic icon or small pinhole on the bezel. If using an external USB mic, plug it into the primary board port.</p>
                       </section>

                       <section>
                          <h4 className="text-emerald-300 font-bold mb-1 flex items-center gap-1.5">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 2. Browser Level Permission
                          </h4>
                          <p className="pl-3 italic">Click the 🔒 icon in your browser address bar. Check "Microphone" and ensure it is set to ALLOW. If blocked, the OS core cannot capture audio streams.</p>
                       </section>

                       <section className="bg-amber-950/10 border border-amber-900/30 p-3 rounded-xl">
                          <h4 className="text-amber-400 font-bold mb-1 flex items-center gap-1.5">
                             <AlertCircle className="w-3 h-3" /> School Network Policy
                          </h4>
                          <p className="pl-3 text-amber-200/70 italic">Educational networks often enforce "Safe Browsing" policies that block real-time recording. Contact IT to whitelist this application domain.</p>
                       </section>

                       <section>
                          <h4 className="text-emerald-300 font-bold mb-1 flex items-center gap-1.5">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 3. System Level Privacy
                          </h4>
                          <p className="pl-3 italic">Check the Smartboard's internal OS settings. Go to Privacy &gt; Microphone and toggle "Allow apps to access microphone" to ON.</p>
                       </section>
                    </div>

                    <div className="pt-4 mt-auto border-t border-emerald-900/50 flex gap-2">
                       <button 
                          onClick={() => window.location.reload()}
                          className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-[9px] font-bold rounded-xl transition-all border border-zinc-800 cursor-pointer"
                       >
                          REBOOT APPLICATION
                       </button>
                       <button 
                          onClick={() => setShowTroubleshooter(false)}
                          className="flex-1 py-2 bg-emerald-500 text-black text-[9px] font-black rounded-xl hover:bg-emerald-400 transition-all cursor-pointer"
                       >
                          ACKNOWLEDGE
                       </button>
                    </div>
                  </div>
                )}

                <div className="text-center">
                  {isListening ? (
                    <>
                      <p className="text-emerald-800 text-[10px] uppercase font-black tracking-widest mb-2">Capturing Data Streams...</p>
                      <p className="text-lg font-bold leading-tight">
                        {interimTranscript || finalTranscript ? (
                          <>
                            <span className="text-emerald-300">{finalTranscript}</span>
                            <span className="text-emerald-600">{interimTranscript}</span>
                          </>
                        ) : (
                          <span className="text-emerald-900 opacity-50 italic font-medium">Listening...</span>
                        )}
                      </p>
                    </>
                  ) : isSpeaking ? (
                    <div className="flex items-center justify-center gap-3 px-4 py-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                      <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />
                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest italic">Vocalizing Output</p>
                    </div>
                  ) : chatMessages.length === 0 && (
                    <div className="space-y-4">
                      <p className="text-lg font-bold text-emerald-400/80 italic">Ready for voice input.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                        {["What is AI?", "Open News", "Search for music", "Tell me a joke"].map(cmd => (
                          <button 
                            key={cmd}
                            onClick={() => processCommand(cmd)}
                            className="px-3 py-2 bg-emerald-950/30 border border-emerald-900/50 rounded-xl text-[10px] text-emerald-600 hover:text-emerald-400 hover:border-emerald-500/50 transition-all text-left flex items-center gap-2 group"
                          >
                            <Play className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {cmd}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="px-6 py-5 border-t border-emerald-500/20 bg-black/40 flex items-center justify-between gap-4">
          <button 
            onClick={() => {
              if (isSpeaking) stopSpeaking();
              else if (isListening) recognitionRef.current?.stop();
            }}
            className={`p-3.5 rounded-2xl transition-all ${isSpeaking || isListening ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-emerald-950/50 text-emerald-700'}`}
            disabled={!isSpeaking && !isListening}
          >
            {isSpeaking ? <VolumeX className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button 
            onClick={startListening}
            disabled={isListening}
            className={`flex-1 flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl font-black tracking-widest transition-all ${isListening ? 'bg-emerald-900/20 text-emerald-700' : 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-[1.02] active:scale-95'}`}
          >
            {isListening ? (
              <>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                LISTENING
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 fill-current" />
                INITIATE COMMAND
              </>
            )}
          </button>

          <div className="hidden sm:flex flex-col items-end opacity-40">
             <span className="text-[8px] font-black text-emerald-900 uppercase tracking-tighter">Powered By</span>
             <span className="text-[10px] font-black text-emerald-700 tracking-widest uppercase">Ishai OS Core</span>
          </div>
        </div>

      </div>
    </div>
  );
};
