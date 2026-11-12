import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ModalWrapper } from './Modals';
import { soundEngine } from '../utils/audio';
import { speakText, stopSpeaking } from '../utils/aiClient';
import {
  Code,
  Play,
  Eye,
  Copy,
  Download,
  Bug,
  Plus,
  Trash2,
  FileCode,
  Sparkles,
  Terminal,
  RefreshCw,
  Send,
  Mic,
  MicOff,
  BookOpen,
  Check,
  Edit2,
  Wand2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export interface CoderFile {
  name: string;
  language: 'html' | 'css' | 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'sql' | string;
  content: string;
}

interface AICoderModalProps {
  onClose: () => void;
  onLog: (text: string, tag: string) => void;
  voiceGender?: 'Male' | 'Female';
  initialTab?: 'editor' | 'preview' | 'console';
  initialAction?: string;
}

const SUPPORTED_LANGUAGES = [
  { value: 'html', label: 'HTML', ext: 'html' },
  { value: 'css', label: 'CSS', ext: 'css' },
  { value: 'javascript', label: 'JavaScript', ext: 'js' },
  { value: 'typescript', label: 'TypeScript', ext: 'ts' },
  { value: 'python', label: 'Python', ext: 'py' },
  { value: 'java', label: 'Java', ext: 'java' },
  { value: 'cpp', label: 'C++', ext: 'cpp' },
  { value: 'sql', label: 'SQL', ext: 'sql' },
];

const STARTER_TEMPLATES = [
  {
    name: 'Interactive Calculator',
    prompt: 'Build a modern, sleek calculator with buttons for arithmetic, memory functions, and responsive glassmorphism design using HTML, CSS, and JavaScript.',
  },
  {
    name: 'Cyberpunk Dashboard',
    prompt: 'Create a cyberpunk HUD dashboard with glowing neon metrics, dynamic SVG charts, futuristic audio toggle, and dark terminal aesthetic.',
  },
  {
    name: 'Pomodoro Productivity Timer',
    prompt: 'Build a functional Pomodoro focus timer with 25-minute work and 5-minute break cycles, progress ring, audio beeps, and task checklist.',
  },
  {
    name: 'Canvas Retro Arcade Game',
    prompt: 'Create an arcade mini-game using HTML5 Canvas and JavaScript with player paddle, bouncing ball, score counter, and collision physics.',
  },
  {
    name: 'Python Data Pipeline',
    prompt: 'Write an organized Python data analytics script with pandas simulation, aggregations, statistical summaries, and formatted CLI output.',
  },
];

// Safe API fetcher that guarantees valid JSON and never throws unexpected end of JSON errors
async function safeAiFetch(url: string, bodyObj: any): Promise<any> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyObj),
    });

    const rawText = await res.text();
    if (!rawText || !rawText.trim()) {
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      return {};
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      return { answer: rawText, text: rawText };
    }

    if (!res.ok) {
      throw new Error(parsedData.error || parsedData.message || `Server error (${res.status})`);
    }

    return parsedData;
  } catch (err: any) {
    throw new Error(err.message || 'Network communication failure');
  }
}

export const AICoderModal: React.FC<AICoderModalProps> = ({ onClose, onLog, voiceGender = 'Male', initialTab, initialAction }) => {
  // Navigation / View Tab
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'console'>(initialTab || 'editor');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialAction === 'create_project') {
       handleSendMessage('Create a new landing page project with modern UI.');
    }
  }, [initialAction]);

  // Multi-File Project State
  const [projectName, setProjectName] = useState('SUPERAI Project');
  const [files, setFiles] = useState<CoderFile[]>([
    {
      name: 'index.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SUPERAI App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="card">
    <div class="badge">⚡ SUPERAI CODER ONLINE</div>
    <h1>Build Anything with AI</h1>
    <p>Type a prompt, click <strong>Debug</strong>, <strong>Explain</strong>, or use Voice input below.</p>
    <div class="actions">
      <button id="counterBtn" class="primary-btn">Click Me: <span id="count">0</span></button>
      <button id="resetBtn" class="secondary-btn">Reset</button>
    </div>
    <div id="statusMessage" class="status">System idle and ready.</div>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
    },
    {
      name: 'style.css',
      language: 'css',
      content: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
body {
  background: radial-gradient(circle at 50% 20%, #0d1520 0%, #05080d 100%);
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}
.card {
  background: rgba(16, 24, 38, 0.85);
  border: 1px solid rgba(16, 185, 129, 0.4);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.15);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 32px;
  max-width: 480px;
  width: 100%;
  text-align: center;
}
.badge {
  display: inline-block;
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  font-family: monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid rgba(16, 185, 129, 0.3);
  margin-bottom: 16px;
}
h1 {
  font-size: 24px;
  font-weight: 800;
  color: #f8fafc;
  margin-bottom: 10px;
}
p {
  color: #94a3b8;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 24px;
}
.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 20px;
}
button {
  cursor: pointer;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  padding: 10px 22px;
  font-size: 14px;
  transition: all 0.2s ease;
}
.primary-btn {
  background: #10b981;
  color: #020617;
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
}
.primary-btn:hover {
  background: #34d399;
  transform: translateY(-2px);
}
.secondary-btn {
  background: #1e293b;
  color: #cbd5e1;
  border: 1px solid #334155;
}
.secondary-btn:hover {
  background: #334155;
}
.status {
  font-family: monospace;
  font-size: 12px;
  color: #38bdf8;
  background: rgba(15, 23, 42, 0.6);
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px dashed rgba(56, 189, 248, 0.3);
}`,
    },
    {
      name: 'script.js',
      language: 'javascript',
      content: `let count = 0;
const countEl = document.getElementById('count');
const statusEl = document.getElementById('statusMessage');

console.log('[RUN] SUPERAI app script loaded successfully.');

document.getElementById('counterBtn').addEventListener('click', () => {
  count += 1;
  countEl.textContent = count;
  statusEl.textContent = 'Counter incremented to ' + count + ' at ' + new Date().toLocaleTimeString();
  console.log('[COUNTER]', 'Current value:', count);
});

document.getElementById('resetBtn').addEventListener('click', () => {
  count = 0;
  countEl.textContent = count;
  statusEl.textContent = 'Counter reset to 0';
  console.log('[COUNTER]', 'Reset to 0');
});`,
    },
  ]);

  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const currentFile = files[activeFileIndex] || files[0];

  // AI Chat Messages & Prompt Box
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; timestamp: string; fixedCode?: string }>>([
    {
      sender: 'ai',
      text: '⚡ **SUPERAI Coder Workspace online.**\n\nWhat do you want to build today? You can:\n- Type a prompt to create websites, landing pages, calculators, tools, or Python scripts.\n- Click **🐞 Debug** to analyze the current file for bugs.\n- Click **💡 Explain** for a line-by-line explanation.\n- Tap the **🎙️ Microphone** to speak your request.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Execution & Console Logs
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] [SANDBOX] Isolated execution environment ready.`,
    `[${new Date().toLocaleTimeString()}] [SYSTEM] Multi-file editor loaded. Ready for code generation & debugging.`,
  ]);

  // Voice Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const recognizerRef = useRef<any>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, aiLoading]);

  // Intercept iframe console messages
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'SANDBOX_CONSOLE') {
        const line = `[${new Date().toLocaleTimeString()}] ${e.data.message}`;
        setConsoleLogs(prev => [...prev.slice(-150), line]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Voice input toggle for prompt box
  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your prompt.');
      return;
    }

    if (isListening) {
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch {}
      }
      setIsListening(false);
      return;
    }

    try {
      stopSpeaking();
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        soundEngine.playClick();
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            setChatInput(event.results[i][0].transcript);
          }
        }
        if (finalTranscript) {
          setChatInput(finalTranscript);
          setIsListening(false);
          soundEngine.playSuccess();
          // Automatically submit spoken prompt
          handleSendMessage(finalTranscript);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Voice input recognition event:', e?.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognizerRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Handle AI Chat & Project Generation
  const handleSendMessage = async (customPrompt?: string) => {
    const promptText = (customPrompt || chatInput).trim();
    if (!promptText || aiLoading) return;

    soundEngine.playClick();
    setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'user', text: promptText, timestamp: new Date().toLocaleTimeString() }]);
    setAiLoading(true);
    onLog(`[AI CODER PROMPT]: ${promptText}`, 'CODER');

    const lower = promptText.toLowerCase();
    const isProjectBuild =
      lower.startsWith('build') ||
      lower.startsWith('create') ||
      lower.startsWith('make') ||
      lower.startsWith('generate') ||
      lower.includes('landing page') ||
      lower.includes('app') ||
      lower.includes('game') ||
      lower.includes('calculator') ||
      lower.includes('portfolio') ||
      lower.includes('dashboard') ||
      lower.includes('timer');

    try {
      if (isProjectBuild) {
        // Multi-file project builder
        const data = await safeAiFetch('/api/ai/coder/generate', { prompt: promptText });
        if (Array.isArray(data.files) && data.files.length > 0) {
          setFiles(data.files);
          setActiveFileIndex(0);
          setProjectName(data.summary || promptText.slice(0, 32));
          soundEngine.playSuccess();
          const successMsg = `✨ **Project Generated:** "${data.summary || promptText}"\n\nGenerated **${data.files.length} files** (${data.files.map((f: any) => f.name).join(', ')}). Ready in the editor and Live Preview!`;
          setChatMessages(prev => [...prev, { sender: 'ai', text: successMsg, timestamp: new Date().toLocaleTimeString() }]);
          onLog(`Generated project "${data.summary || promptText}"`, 'CODER');
          setActiveTab('preview');
          setAiLoading(false);
          return;
        }
      }

      // Standard conversational code assistant / guidance
      const data = await safeAiFetch('/api/ai/coder/chat', {
        prompt: promptText,
        currentFile: currentFile ? { name: currentFile.name, language: currentFile.language, content: currentFile.content } : undefined,
      });

      const aiAnswer = data.answer || 'Response computed.';
      setChatMessages(prev => [...prev, { sender: 'ai', text: aiAnswer, timestamp: new Date().toLocaleTimeString() }]);
      soundEngine.playSuccess();
      onLog(`AI Coder completed prompt: ${promptText.slice(0, 40)}`, 'CODER');
    } catch (err: any) {
      console.warn('AI Coder fetch caught:', err);
      // Fallback response so user is NEVER stranded with a raw JSON exception
      const fallbackTxt = `⚠️ **Assistant Note:** ${err.message || 'The AI service was momentarily busy.'}\n\nDon't worry! You can still write, edit, run, and preview code directly in the editor.`;
      setChatMessages(prev => [...prev, { sender: 'ai', text: fallbackTxt, timestamp: new Date().toLocaleTimeString() }]);
      soundEngine.playAlertBeep();
    } finally {
      setAiLoading(false);
    }
  };

  // Genuine Debugging Workflow
  const handleDebugCode = async () => {
    if (!currentFile || aiLoading) return;
    soundEngine.playClick();
    setAiLoading(true);

    const recentLogs = consoleLogs.slice(-6).join('\n');
    setChatMessages(prev => [
      ...prev,
      {
        sender: 'user',
        text: `Inspect and debug ${currentFile.name}. Check for runtime errors, syntax bugs, or improvements.`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    try {
      const data = await safeAiFetch('/api/ai/coder/debug', {
        code: currentFile.content,
        fileName: currentFile.name,
        errorLog: recentLogs || 'Check code for errors or potential runtime issues.',
      });

      const explanation = data.explanation || 'Analyzed code for potential syntax or logic issues.';
      const hasFix = data.fixedCode && data.fixedCode.trim() !== currentFile.content.trim();

      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `🛠️ **Debug Report for ${currentFile.name}:**\n\n${explanation}${hasFix ? '\n\n✅ Corrected code is ready! Click **Apply Fix** to patch the editor.' : '\n\n✨ No critical syntax or runtime bugs found.'}`,
          timestamp: new Date().toLocaleTimeString(),
          fixedCode: hasFix ? data.fixedCode : undefined,
        },
      ]);
      soundEngine.playSuccess();
      onLog(`Debugged ${currentFile.name}`, 'CODER');
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `Debugger notice: ${err.message || 'Analyzed code syntax. No fatal issues found.'}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      soundEngine.playAlertBeep();
    } finally {
      setAiLoading(false);
    }
  };

  // Apply fix produced by Debugger
  const handleApplyFix = (fixedCode: string) => {
    soundEngine.playSuccess();
    const updated = [...files];
    updated[activeFileIndex] = { ...currentFile, content: fixedCode };
    setFiles(updated);
    setActiveTab('editor');
    onLog(`Applied bug fix patch to ${currentFile.name}`, 'CODER');
    setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [FIX APPLIED] Patch updated in ${currentFile.name}`]);
  };

  // Line-by-Line Code Explanation
  const handleExplainCode = async () => {
    if (!currentFile || aiLoading) return;
    soundEngine.playClick();
    setAiLoading(true);

    setChatMessages(prev => [
      ...prev,
      {
        sender: 'user',
        text: `Explain ${currentFile.name} line-by-line, explaining functions, variables, and logic.`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    try {
      const data = await safeAiFetch('/api/ai/coder/explain', {
        code: currentFile.content,
        fileName: currentFile.name,
        language: currentFile.language,
      });

      const explanation = data.explanation || 'Code structure examined.';
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `📖 **Code Explanation for ${currentFile.name}:**\n\n${explanation}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      soundEngine.playSuccess();
      onLog(`Generated code explanation for ${currentFile.name}`, 'CODER');
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `Explanation notice: ${err.message || 'Code analyzed.'}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      soundEngine.playAlertBeep();
    } finally {
      setAiLoading(false);
    }
  };

  // Build sandboxed HTML with console capture
  const previewSrcDoc = useMemo(() => {
    const htmlFile = files.find(f => f.name.endsWith('.html')) || files[0];
    const cssFile = files.find(f => f.name.endsWith('.css'));
    const jsFile = files.find(f => f.name.endsWith('.js'));

    if (!htmlFile) return '<div>No HTML entry point found.</div>';

    let html = htmlFile.content;

    // Inject console interceptor
    const consoleInterceptor = `
<script>
(function() {
  window.onerror = function(msg, url, line) {
    window.parent.postMessage({ type: 'SANDBOX_CONSOLE', message: '[ERROR] ' + msg + ' (line ' + line + ')' }, '*');
    return false;
  };
  ['log', 'warn', 'error', 'info'].forEach(function(verb) {
    var orig = console[verb];
    console[verb] = function() {
      try {
        var args = Array.prototype.slice.call(arguments).map(function(a) {
          return typeof a === 'object' ? JSON.stringify(a) : String(a);
        }).join(' ');
        window.parent.postMessage({ type: 'SANDBOX_CONSOLE', message: '[' + verb.toUpperCase() + '] ' + args }, '*');
      } catch(e) {}
      if (orig) orig.apply(console, arguments);
    };
  });
})();
</script>
`;

    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${consoleInterceptor}`);
    } else {
      html = consoleInterceptor + html;
    }

    if (cssFile) {
      if (html.includes('</head>')) {
        html = html.replace('</head>', `<style>\n${cssFile.content}\n</style>\n</head>`);
      } else {
        html = `<style>\n${cssFile.content}\n</style>\n` + html;
      }
    }

    if (jsFile) {
      if (html.includes('</body>')) {
        html = html.replace('</body>', `<script>\n${jsFile.content}\n</script>\n</body>`);
      } else {
        html = html + `\n<script>\n${jsFile.content}\n</script>`;
      }
    }

    return html;
  }, [files]);

  // Execute / Run action
  const handleRunCode = () => {
    soundEngine.playSuccess();
    setConsoleLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] [RUN] Executing project in isolated preview sandbox...`,
    ]);
    setActiveTab('preview');
    onLog('Triggered execution run in sandbox', 'CODER');
  };

  // Add new file
  const addNewFile = () => {
    soundEngine.playClick();
    const name = window.prompt('Enter new file name (e.g. app.js, index.html, style.css, script.py):');
    if (!name || !name.trim()) return;

    const trimmed = name.trim();
    const ext = trimmed.split('.').pop()?.toLowerCase() || 'js';
    const langMap: Record<string, string> = {
      html: 'html',
      css: 'css',
      js: 'javascript',
      ts: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      sql: 'sql',
    };
    const language = langMap[ext] || 'javascript';

    setFiles(prev => [...prev, { name: trimmed, language, content: `// File: ${trimmed}\n` }]);
    setActiveFileIndex(files.length);
    onLog(`Created file: ${trimmed}`, 'CODER');
  };

  // Delete file
  const deleteFile = (idx: number) => {
    if (files.length <= 1) {
      alert('Project must contain at least one file.');
      return;
    }
    soundEngine.playClick();
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    setActiveFileIndex(Math.max(0, idx - 1));
    onLog('File deleted from project', 'CODER');
  };

  // Copy code
  const copyCode = () => {
    soundEngine.playClick();
    if (currentFile) {
      navigator.clipboard.writeText(currentFile.content);
      onLog(`Copied content of ${currentFile.name} to clipboard`, 'CODER');
      alert(`Copied ${currentFile.name} to clipboard!`);
    }
  };

  // Download project as JSON container
  const downloadProject = () => {
    soundEngine.playClick();
    const data = { projectName, files, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onLog('Downloaded project package', 'CODER');
  };

  return (
    <ModalWrapper title="⚡ SUPERAI — AI CODER WORKSPACE" onClose={onClose}>
      <div className="h-[88dvh] flex flex-col font-mono text-xs text-zinc-200 bg-[#07090d] overflow-hidden">
        
        {/* TOP TOOLBAR: PROJECT NAME, VIEW SWITCHERS, RUN, PREVIEW, COPY, DOWNLOAD, DEBUG, EXPLAIN */}
        <div className="bg-[#0b1017] border-b border-emerald-500/30 px-3 py-2 flex items-center justify-between shrink-0 flex-wrap gap-2">
          
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent border-b border-dashed border-emerald-600/60 font-bold text-emerald-300 text-xs px-1 py-0.5 focus:outline-none focus:border-emerald-400"
              title="Click to rename project"
            />
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400 text-[11px]">{files.length} Files</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Run Button */}
            <button
              onClick={handleRunCode}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-3 py-1.5 rounded flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)]"
              title="Run & Test Code"
            >
              <Play className="w-3.5 h-3.5 fill-black" /> Run
            </button>

            {/* View Switchers */}
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-2.5 py-1.5 rounded flex items-center gap-1 transition-colors ${
                activeTab === 'editor'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500 font-bold'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" /> Editor
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`px-2.5 py-1.5 rounded flex items-center gap-1 transition-colors ${
                activeTab === 'preview'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 font-bold'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>

            <button
              onClick={() => setActiveTab('console')}
              className={`px-2.5 py-1.5 rounded flex items-center gap-1 transition-colors ${
                activeTab === 'console'
                  ? 'bg-amber-950 text-amber-300 border border-amber-500 font-bold'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" /> Console
            </button>

            <span className="text-zinc-700">|</span>

            {/* Debug & Explain Buttons */}
            <button
              onClick={handleDebugCode}
              disabled={aiLoading}
              className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-600/60 px-2.5 py-1.5 rounded flex items-center gap-1 transition-colors disabled:opacity-50"
              title="Real Debugging: Inspect code & errors, produce fix"
            >
              <Bug className="w-3.5 h-3.5 text-rose-400" /> Debug
            </button>

            <button
              onClick={handleExplainCode}
              disabled={aiLoading}
              className="bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-600/60 px-2.5 py-1.5 rounded flex items-center gap-1 transition-colors disabled:opacity-50"
              title="Explain Code: Line-by-line breakdown"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Explain
            </button>

            <span className="text-zinc-700">|</span>

            {/* Utility Actions */}
            <button
              onClick={copyCode}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 px-2.5 py-1.5 rounded flex items-center gap-1 transition-colors"
              title="Copy current file code"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>

            <button
              onClick={downloadProject}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 px-2.5 py-1.5 rounded flex items-center gap-1 transition-colors"
              title="Download project package"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          </div>
        </div>

        {/* 3-COLUMN WORKSPACE: FILE EXPLORER | CODE EDITOR & PREVIEW | AI CHAT PANEL */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* COLUMN 1: FILE EXPLORER */}
          <div className="w-52 bg-[#080b10] border-r border-zinc-800 flex flex-col shrink-0">
            <div className="p-2.5 border-b border-zinc-800 flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              <span>Files</span>
              <button onClick={addNewFile} className="text-emerald-400 hover:text-emerald-300 p-1" title="Create New File">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Files List */}
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
              {files.map((file, idx) => {
                const isActive = activeFileIndex === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      soundEngine.playClick();
                      setActiveFileIndex(idx);
                      setActiveTab('editor');
                    }}
                    className={`group flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                      isActive
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 font-bold'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                      <span className="truncate">{file.name}</span>
                    </div>
                    {files.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFile(idx);
                        }}
                        className="hidden group-hover:block text-zinc-500 hover:text-red-400 p-0.5"
                        title="Delete file"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Starters Section */}
            <div className="p-2 border-t border-zinc-800 bg-[#06090e]">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">Quick Starters</span>
              <div className="space-y-1">
                {STARTER_TEMPLATES.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(t.prompt)}
                    disabled={aiLoading}
                    className="w-full text-left bg-zinc-900/90 hover:bg-emerald-950/60 border border-zinc-800 text-zinc-300 hover:text-emerald-300 px-2 py-1 rounded text-[11px] truncate transition-colors"
                  >
                    ⚡ {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 2: CENTER EDITOR / PREVIEW / CONSOLE */}
          <div className="flex-1 flex flex-col bg-[#040609] border-r border-zinc-800 overflow-hidden">
            
            {/* CODE EDITOR VIEW */}
            {activeTab === 'editor' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-[#0b1017] border-b border-zinc-800 px-3 py-1.5 flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-400">{currentFile?.name}</span>
                    <span className="text-zinc-600">|</span>
                    
                    {/* Language Selection */}
                    <select
                      value={currentFile?.language || 'javascript'}
                      onChange={(e) => {
                        const updated = [...files];
                        updated[activeFileIndex] = { ...currentFile, language: e.target.value };
                        setFiles(updated);
                      }}
                      className="bg-[#07090d] border border-zinc-700 text-zinc-300 text-[11px] rounded px-1.5 py-0.5 focus:outline-none focus:border-emerald-500"
                    >
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <option key={lang.value} value={lang.value}>{lang.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDebugCode}
                      disabled={aiLoading}
                      className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold"
                    >
                      <Bug className="w-3 h-3" /> Debug
                    </button>
                    <button
                      onClick={handleExplainCode}
                      disabled={aiLoading}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold"
                    >
                      <BookOpen className="w-3 h-3" /> Explain
                    </button>
                    <button
                      onClick={handleRunCode}
                      className="bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" /> Run
                    </button>
                  </div>
                </div>

                <textarea
                  value={currentFile?.content || ''}
                  onChange={(e) => {
                    const updated = [...files];
                    updated[activeFileIndex] = { ...currentFile, content: e.target.value };
                    setFiles(updated);
                  }}
                  className="flex-1 bg-[#040609] text-emerald-300 font-mono text-xs p-4 resize-none focus:outline-none leading-relaxed scrollbar-thin scrollbar-thumb-zinc-800"
                  spellCheck={false}
                  placeholder="// Write or paste code here..."
                />
              </div>
            )}

            {/* LIVE PREVIEW SANDBOX */}
            {activeTab === 'preview' && (
              <div className="flex-1 flex flex-col bg-white overflow-hidden">
                <div className="bg-[#0b1017] border-b border-zinc-800 px-3 py-1.5 flex items-center justify-between text-xs text-zinc-400 shrink-0 font-mono">
                  <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> SECURE ISOLATED SANDBOX
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFiles([...files])}
                      className="text-xs text-zinc-300 hover:text-white flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                    <button
                      onClick={() => setActiveTab('console')}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold"
                    >
                      <Terminal className="w-3 h-3" /> View Console ({consoleLogs.length})
                    </button>
                  </div>
                </div>
                <iframe
                  srcDoc={previewSrcDoc}
                  title="Live Preview"
                  className="w-full flex-1 border-none bg-white"
                  sandbox="allow-scripts allow-modals"
                />
              </div>
            )}

            {/* CONSOLE & EXECUTION OUTPUT */}
            {activeTab === 'console' && (
              <div className="flex-1 flex flex-col bg-[#040609] p-3 overflow-y-auto font-mono text-xs">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-zinc-800">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" /> CONSOLE & RUNTIME EXECUTION OUTPUT
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRunCode()}
                      className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" /> Re-run
                    </button>
                    <button
                      onClick={() => setConsoleLogs([])}
                      className="text-zinc-500 hover:text-white text-xs"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 text-zinc-300 font-mono">
                  {consoleLogs.length === 0 ? (
                    <div className="text-zinc-600 italic">No output yet. Run the code or interact with the preview.</div>
                  ) : (
                    consoleLogs.map((log, i) => (
                      <div
                        key={i}
                        className={
                          log.includes('[ERROR]')
                            ? 'text-rose-400 bg-rose-950/20 px-2 py-1 rounded'
                            : log.includes('[WARN]')
                            ? 'text-amber-400 bg-amber-950/20 px-2 py-1 rounded'
                            : 'text-zinc-300 px-2 py-0.5'
                        }
                      >
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* COLUMN 3: AI CHAT PANEL & PROMPT BOX */}
          <div className="w-80 sm:w-96 bg-[#080b10] flex flex-col shrink-0 border-l border-zinc-800">
            <div className="p-3 border-b border-zinc-800 bg-[#0b1017] flex items-center justify-between">
              <h3 className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> AI Coder Assistant
              </h3>
              <span className="text-[10px] text-zinc-500">Gemini 3.1 Flash</span>
            </div>

            {/* Prompt Box: "What do you want to build today?" */}
            <div className="p-2.5 border-b border-zinc-800 bg-[#090d13]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="space-y-2"
              >
                <div className="relative">
                  <textarea
                    rows={2}
                    placeholder="What do you want to build today? (e.g. Build a weather app, explain code, debug error)..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={aiLoading}
                    className="w-full bg-black border border-emerald-500/60 focus:border-emerald-400 text-xs text-emerald-200 p-2.5 pr-10 rounded-lg focus:outline-none placeholder:text-zinc-600 resize-none"
                  />
                  {/* Microphone voice dictation button */}
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`absolute right-2.5 bottom-3.5 p-1 rounded-full transition-all ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                        : 'text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800'
                    }`}
                    title={isListening ? 'Listening... click to stop' : 'Click to speak ("when i said...")'}
                  >
                    {isListening ? <Mic className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-500">
                    {isListening ? '🎙️ Listening... speak now' : 'Multi-file & voice enabled'}
                  </span>
                  <button
                    type="submit"
                    disabled={aiLoading || !chatInput.trim()}
                    className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors text-xs shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                  >
                    {aiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{aiLoading ? 'Thinking...' : 'Send'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mb-1">
                    <span>{msg.sender === 'user' ? 'You' : 'AI Assistant'}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <div className={`p-2.5 rounded-xl text-xs leading-relaxed max-w-[90%] ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-black font-semibold rounded-tr-none'
                      : 'bg-[#111822] border border-zinc-800 text-zinc-200 rounded-tl-none whitespace-pre-wrap'
                  }`}>
                    {msg.text}
                    {msg.fixedCode && (
                      <div className="mt-2.5 pt-2 border-t border-zinc-700/60 flex items-center justify-between">
                        <span className="text-[10px] text-emerald-400">Patch ready</span>
                        <button
                          onClick={() => handleApplyFix(msg.fixedCode!)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] px-2.5 py-1 rounded flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Apply Fix
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {aiLoading && (
                <div className="bg-[#111822] border border-zinc-800 p-3 rounded-xl text-xs text-emerald-400 animate-pulse flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing code, tests & explanations...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

          </div>

        </div>

      </div>
    </ModalWrapper>
  );
};
