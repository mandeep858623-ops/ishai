import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ModalWrapper } from './Modals';
import { soundEngine, speakText, stopSpeaking } from '../utils/audio';
import {
  Monitor,
  Upload,
  Clipboard,
  Play,
  Square,
  Sparkles,
  HelpCircle,
  Copy,
  Volume2,
  VolumeX,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Plus,
  Send,
  MessageSquare,
  Shield,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileText,
  Wrench,
  ListOrdered,
  BookOpen,
  Layout,
  Code2,
  ArrowRight,
  Eye,
  Settings,
  History,
  Mic,
  MicOff,
  Radio,
  Check,
  Lock,
  X,
  CheckCircle
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

export type CompanionMode =
  | 'explain'
  | 'fix_error'
  | 'step_by_step'
  | 'explain_app'
  | 'summarize'
  | 'help_learn'
  | 'design_review'
  | 'understand_code';

export interface CompanionSession {
  id: string;
  title: string;
  mode: CompanionMode;
  imageUrl: string;
  createdAt: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    text: string;
    timestamp: string;
    suggestedQuestions?: string[];
  }>;
}

interface AIScreenCompanionModalProps {
  onClose: () => void;
  onLog?: (text: string, tag: string) => void;
  currentUser?: any;
  authToken?: string;
  initialImage?: string | null;
}

const MODES: Array<{
  id: CompanionMode;
  title: string;
  icon: any;
  color: string;
  badge: string;
  desc: string;
  promptPlaceholder: string;
  voiceKeywords: string[];
}> = [
  {
    id: 'explain',
    title: 'Explain My Screen',
    icon: Lightbulb,
    color: 'from-amber-500 to-yellow-600',
    badge: 'Overview',
    desc: 'Describe layout, windows, buttons, and what is on screen.',
    promptPlaceholder: 'Explain what is displayed on my screen...',
    voiceKeywords: ['explain screen', 'explain my screen', 'what is on my screen', 'describe screen', 'overview'],
  },
  {
    id: 'fix_error',
    title: 'Fix an Error',
    icon: Wrench,
    color: 'from-red-500 to-rose-600',
    badge: 'Troubleshoot',
    desc: 'Diagnose software errors, popups, and status warnings.',
    promptPlaceholder: 'What is causing this error and how do I fix it?',
    voiceKeywords: ['fix error', 'fix an error', 'troubleshoot', 'solve error', 'why is this failing', 'error message'],
  },
  {
    id: 'step_by_step',
    title: 'Guide Me Step by Step',
    icon: ListOrdered,
    color: 'from-emerald-500 to-teal-600',
    badge: 'Visual Steps',
    desc: 'Numbered visual guidance using exact button labels.',
    promptPlaceholder: 'How do I complete this task step by step?',
    voiceKeywords: ['guide me', 'step by step', 'how do i', 'instructions', 'walk me through', 'guide'],
  },
  {
    id: 'explain_app',
    title: 'Explain This App',
    icon: Layout,
    color: 'from-indigo-500 to-purple-600',
    badge: 'UI & Menus',
    desc: 'Understand software features, toolbars, and menus.',
    promptPlaceholder: 'How do I use this application and its features?',
    voiceKeywords: ['explain app', 'explain this app', 'how to use this app', 'app features', 'software menu'],
  },
  {
    id: 'summarize',
    title: 'Summarize My Screen',
    icon: FileText,
    color: 'from-cyan-500 to-blue-600',
    badge: 'Summary',
    desc: 'Summarize readable documents, web pages, and tables.',
    promptPlaceholder: 'Summarize the readable text on my screen...',
    voiceKeywords: ['summarize', 'summarize screen', 'summary', 'tldr', 'read summary'],
  },
  {
    id: 'help_learn',
    title: 'Help Me Learn',
    icon: BookOpen,
    color: 'from-green-500 to-emerald-600',
    badge: 'Education',
    desc: 'Explain concepts, diagrams, questions, or formulas.',
    promptPlaceholder: 'Explain the concept or question visible on screen...',
    voiceKeywords: ['help me learn', 'teach me', 'explain concept', 'study this', 'learn this'],
  },
  {
    id: 'design_review',
    title: 'Review My Design',
    icon: Layers,
    color: 'from-pink-500 to-rose-600',
    badge: 'UI/UX Feedback',
    desc: 'Constructive feedback on visual layouts and UX design.',
    promptPlaceholder: 'Review the UI/UX design and visual hierarchy...',
    voiceKeywords: ['review design', 'review my design', 'ui review', 'ux review', 'feedback design'],
  },
  {
    id: 'understand_code',
    title: 'Understand This Code',
    icon: Code2,
    color: 'from-purple-500 to-violet-600',
    badge: 'Code & Terminal',
    desc: 'Analyze source code, diagnose syntax/logic errors.',
    promptPlaceholder: 'Explain this code and help fix any bugs...',
    voiceKeywords: ['understand code', 'check code', 'fix code', 'debug code', 'code error', 'explain code'],
  },
];

const STORAGE_SESSIONS_KEY = 'SUPERAI_ScreenCompanion_Sessions';
const STORAGE_PERMISSION_DISMISSED = 'SUPERAI_ScreenCompanion_PermissionDismissed_v2';

export const AIScreenCompanionModal: React.FC<AIScreenCompanionModalProps> = ({
  onClose,
  onLog,
  currentUser,
  initialImage,
}) => {
  // Active Analysis Mode
  const [activeMode, setActiveMode] = useState<CompanionMode>('explain');

  // Input Image State (Base64 URL)
  const [currentImage, setCurrentImage] = useState<string | null>(initialImage || null);
  const [imageZoom, setImageZoom] = useState<number>(1);

  // Live Screen Capture State
  const [isSharingLive, setIsSharingLive] = useState<boolean>(false);
  const [liveStreamError, setLiveStreamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Permission Flow Modal (Shown initially or on demand)
  const [showPermissionPrompt, setShowPermissionPrompt] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_PERMISSION_DISMISSED) !== 'true';
  });
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);

  // Voice Access System States
  const [isVoiceAccessActive, setIsVoiceAccessActive] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [lastVoiceCommand, setLastVoiceCommand] = useState<string | null>(null);
  const [autoSpeakResponse, setAutoSpeakResponse] = useState<boolean>(true);
  const [showVoiceCheatsheet, setShowVoiceCheatsheet] = useState<boolean>(false);
  const [speechRecSupported, setSpeechRecSupported] = useState<boolean>(true);

  // Conversation & Session State
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => `session-${Date.now()}`);
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      role: 'user' | 'assistant';
      text: string;
      timestamp: string;
      suggestedQuestions?: string[];
    }>
  >([]);

  // Session History List
  const [sessions, setSessions] = useState<CompanionSession[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SESSIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback
    }
    return [];
  });

  const [showHistorySidebar, setShowHistorySidebar] = useState<boolean>(false);

  // Refs for callbacks & speech engine
  const speechRecRef = useRef<any>(null);
  const currentImageRef = useRef<string | null>(currentImage);
  const activeModeRef = useRef<CompanionMode>(activeMode);
  const isSharingLiveRef = useRef<boolean>(isSharingLive);
  const isAnalyzingRef = useRef<boolean>(isAnalyzing);

  useEffect(() => {
    currentImageRef.current = currentImage;
  }, [currentImage]);

  useEffect(() => {
    activeModeRef.current = activeMode;
  }, [activeMode]);

  useEffect(() => {
    isSharingLiveRef.current = isSharingLive;
  }, [isSharingLive]);

  useEffect(() => {
    isAnalyzingRef.current = isAnalyzing;
  }, [isAnalyzing]);

  // Load Firestore Sessions if logged in with matching Firebase Auth UID
  useEffect(() => {
    if (!auth.currentUser || auth.currentUser.uid !== currentUser?.uid) return;
    const loadFirestoreSessions = async () => {
      try {
        const ref = doc(db, 'user_screen_companion_records', currentUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.sessions) && data.sessions.length > 0) {
            setSessions(data.sessions);
          }
        }
      } catch (err) {
        console.warn('Firestore companion load error:', err);
      }
    };
    loadFirestoreSessions();
  }, [currentUser]);

  // Persist Sessions locally & Firestore
  const syncSessions = (updated: CompanionSession[]) => {
    setSessions(updated);
    try {
      localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(updated.slice(0, 15)));
    } catch {}

    if (auth.currentUser && auth.currentUser.uid === currentUser?.uid) {
      try {
        const ref = doc(db, 'user_screen_companion_records', currentUser.uid);
        setDoc(ref, {
          user_id: currentUser.uid,
          sessions: updated.slice(0, 15),
          updated_at: new Date().toISOString(),
        }).catch((err) => console.warn('Firestore companion save error:', err));
      } catch (err) {
        console.warn('Firestore companion save error:', err);
      }
    }
  };

  // Clipboard Paste Event Listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                soundEngine.playSuccess();
                setCurrentImage(event.target.result as string);
                setImageZoom(1);
                if (onLog) onLog('[SCREEN_COMPANION] Screenshot pasted from clipboard.', 'VISION');
              }
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onLog]);

  // Method A: File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        soundEngine.playSuccess();
        setCurrentImage(event.target.result as string);
        setImageZoom(1);
        if (onLog) onLog(`[SCREEN_COMPANION] Screenshot uploaded: ${file.name}`, 'VISION');
      }
    };
    reader.readAsDataURL(file);
  };

  // Method B: Native Live Screen Capture
  const startLiveScreenCapture = async (): Promise<boolean> => {
    soundEngine.playClick();
    setLiveStreamError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      setLiveStreamError('Screen capture API is not supported in this browser or OS environment. Please use Screenshot Upload or Clipboard Paste.');
      soundEngine.playAlertBeep();
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      mediaStreamRef.current = stream;
      setIsSharingLive(true);
      soundEngine.playSuccess();

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video autoplay warning:', playErr);
        }
      }

      // Automatically capture initial snapshot frame after 300ms
      setTimeout(() => {
        captureFrameFromLiveStream();
      }, 300);

      stream.getVideoTracks()[0].onended = () => {
        stopLiveScreenCapture();
      };

      if (onLog) onLog('[SCREEN_COMPANION] Live screen sharing session initiated successfully.', 'VISION');
      return true;
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'AbortError' || err.message?.includes('Permission denied')) {
        if (onLog) onLog('[SCREEN_COMPANION] Screen capture dialog dismissed or cancelled by user.', 'VISION');
        setLiveStreamError(null);
      } else {
        soundEngine.playAlertBeep();
        setLiveStreamError(`Screen capture error: ${err.message || 'Permission denied'}`);
      }
      setIsSharingLive(false);
      return false;
    }
  };

  const stopLiveScreenCapture = () => {
    soundEngine.playClick();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsSharingLive(false);
    if (onLog) onLog('[SCREEN_COMPANION] Live screen sharing session ended.', 'VISION');
  };

  const captureFrameFromLiveStream = (): string | null => {
    try {
      if (videoRef.current) {
        const video = videoRef.current;
        const w = video.videoWidth || video.clientWidth || window.innerWidth || 1280;
        const h = video.videoHeight || video.clientHeight || window.innerHeight || 720;

        const canvas = document.createElement('canvas');
        canvas.width = w > 0 ? w : 1280;
        canvas.height = h > 0 ? h : 720;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          } catch {
            // Fallback render
            ctx.fillStyle = '#05080c';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 32px monospace';
            ctx.fillText('SUPERAI SCREEN CAPTURE FRAME', 40, 80);
          }

          const dataUrl = canvas.toDataURL('image/png');
          setCurrentImage(dataUrl);
          setImageZoom(1);
          soundEngine.playSuccess();
          if (onLog) onLog('[SCREEN_COMPANION] Screen capture snapshot successfully clicked and loaded.', 'VISION');
          return dataUrl;
        }
      }
    } catch (e) {
      console.warn('Capture error:', e);
    }

    // Ultimate fallback data URL (solid dark preview with timestamp)
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = 1280;
    fallbackCanvas.height = 720;
    const fCtx = fallbackCanvas.getContext('2d');
    if (fCtx) {
      fCtx.fillStyle = '#080d16';
      fCtx.fillRect(0, 0, 1280, 720);
      fCtx.fillStyle = '#10b981';
      fCtx.font = 'bold 36px monospace';
      fCtx.fillText('SUPERAI SCREEN CAPTURE SNAPSHOT', 60, 120);
      fCtx.fillStyle = '#94a3b8';
      fCtx.font = '24px monospace';
      fCtx.fillText('Captured at: ' + new Date().toLocaleTimeString(), 60, 180);
      fCtx.fillText('Ready for AI Vision Analysis & Step-by-Step Guidance', 60, 230);
    }
    const fallbackUrl = fallbackCanvas.toDataURL('image/png');
    setCurrentImage(fallbackUrl);
    setImageZoom(1);
    soundEngine.playSuccess();
    return fallbackUrl;
  };

  // Perform Vision Analysis Call
  const handleAnalyzeScreen = useCallback(async (overridePrompt?: string, overrideMode?: CompanionMode) => {
    let activeImg = currentImageRef.current;

    // If live sharing is active and no screenshot is selected yet, take a snapshot first!
    if (!activeImg && isSharingLiveRef.current) {
      activeImg = captureFrameFromLiveStream();
    }

    if (!activeImg) {
      soundEngine.playAlertBeep();
      alert('Please upload a screenshot or start screen capture first.');
      return;
    }

    soundEngine.playClick();
    setIsAnalyzing(true);

    const modeToUse = overrideMode || activeModeRef.current;
    const userQuery =
      overridePrompt ||
      customPrompt ||
      MODES.find((m) => m.id === modeToUse)?.promptPlaceholder ||
      'Analyze this screen';

    const userMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user' as const,
      text: userQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setCustomPrompt('');

    try {
      const response = await fetch('/api/ai/screen-companion/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: activeImg,
          mode: modeToUse,
          prompt: userQuery,
          conversationHistory: updatedMessages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        soundEngine.playSuccess();
        const assistantMessage = {
          id: Math.random().toString(36).substring(2, 9),
          role: 'assistant' as const,
          text: data.analysis,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedQuestions: data.suggestedQuestions || [],
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);

        // Save session
        const currentSession: CompanionSession = {
          id: currentSessionId,
          title: `${MODES.find((m) => m.id === modeToUse)?.title || 'Screen Analysis'} (${new Date().toLocaleDateString()})`,
          mode: modeToUse,
          imageUrl: activeImg,
          createdAt: new Date().toISOString(),
          messages: finalMessages,
        };

        const existingIdx = sessions.findIndex((s) => s.id === currentSessionId);
        let nextSessions = [...sessions];
        if (existingIdx >= 0) {
          nextSessions[existingIdx] = currentSession;
        } else {
          nextSessions = [currentSession, ...nextSessions];
        }
        syncSessions(nextSessions);

        if (onLog) onLog(`[SCREEN_COMPANION] Completed vision analysis mode: [${modeToUse}]`, 'VISION');

        // Hands-Free Voice Access auto-feedback: speak the top summary
        if (autoSpeakResponse) {
          const firstSentence = data.analysis.split('\n\n')[0].replace(/[*#]/g, '').slice(0, 220);
          speakText(firstSentence, 'Male');
        }
      } else {
        soundEngine.playAlertBeep();
        const errorMessage = {
          id: Math.random().toString(36).substring(2, 9),
          role: 'assistant' as const,
          text: `⚠️ Analysis Warning: ${data.error || 'The model was unable to process this image.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages([...updatedMessages, errorMessage]);
      }
    } catch (err: any) {
      soundEngine.playAlertBeep();
      const errorMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'assistant' as const,
        text: `⚠️ Network Error: ${err?.message || 'Check connection and retry.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  }, [messages, currentSessionId, sessions, autoSpeakResponse, onLog]);

  // Voice Access Command Parser & Dispatcher
  const processVoiceCommand = useCallback((rawTranscript: string) => {
    const text = rawTranscript.trim().toLowerCase();
    if (!text) return;

    setLastVoiceCommand(rawTranscript);

    // 0. Primary Wake-Word & Trigger Command: "Analyze screen" / "Hey Companion, analyze screen"
    if (
      text.includes('analyze screen') ||
      text.includes('analyze my screen') ||
      text === 'analyze' ||
      text.includes('hey companion analyze') ||
      text.includes('capture and analyze') ||
      text.includes('take screenshot and analyze') ||
      text.includes('inspect screen')
    ) {
      soundEngine.playSuccess();
      speakText('Wake word detected. Analyzing screen now.', 'Male');
      handleAnalyzeScreen();
      return;
    }

    // 1. Audio and Speech control
    if (text.includes('stop speaking') || text.includes('quiet') || text.includes('silence') || text.includes('stop talking')) {
      stopSpeaking();
      soundEngine.playClick();
      return;
    }

    if (text.includes('stop listening') || text.includes('pause voice') || text.includes('turn off voice') || text.includes('mute voice')) {
      setIsVoiceAccessActive(false);
      speakText('Voice Access paused.', 'Male');
      return;
    }

    // 2. Screen & Stream commands
    if (text.includes('take snapshot') || text.includes('capture screen') || text.includes('take screenshot') || text.includes('new snapshot') || text.includes('grab frame')) {
      captureFrameFromLiveStream();
      speakText('Screen snapshot captured.', 'Male');
      return;
    }

    if (text.includes('start screen share') || text.includes('share screen') || text.includes('capture live')) {
      startLiveScreenCapture();
      return;
    }

    if (text.includes('stop screen share') || text.includes('stop sharing')) {
      stopLiveScreenCapture();
      speakText('Screen share stopped.', 'Male');
      return;
    }

    if (text.includes('zoom in')) {
      setImageZoom((z) => Math.min(3, z + 0.3));
      soundEngine.playClick();
      return;
    }

    if (text.includes('zoom out')) {
      setImageZoom((z) => Math.max(0.5, z - 0.3));
      soundEngine.playClick();
      return;
    }

    if (text.includes('fit screen') || text.includes('reset zoom') || text.includes('actual size')) {
      setImageZoom(1);
      soundEngine.playClick();
      return;
    }

    if (text.includes('read aloud') || text.includes('speak answer') || text.includes('read response')) {
      const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
      if (lastAssistantMsg) {
        speakText(lastAssistantMsg.text.replace(/[*#]/g, ''), 'Male');
      } else {
        speakText('No analysis answer available yet.', 'Male');
      }
      return;
    }

    if (text.includes('clear') || text.includes('new session') || text.includes('reset session')) {
      startNewSession();
      speakText('Session reset.', 'Male');
      return;
    }

    // 3. Mode switching & Direct Analysis commands
    for (const m of MODES) {
      if (m.voiceKeywords.some((kw) => text.includes(kw))) {
        setActiveMode(m.id);
        handleAnalyzeScreen(m.promptPlaceholder, m.id);
        speakText(`Switching to ${m.title} and analyzing screen.`, 'Male');
        return;
      }
    }

    // 4. Natural Voice Questions (Direct On-Screen Query)
    if (
      text.startsWith('where') ||
      text.startsWith('how') ||
      text.startsWith('why') ||
      text.startsWith('what') ||
      text.startsWith('can you') ||
      text.startsWith('find') ||
      text.startsWith('locate') ||
      text.includes('button') ||
      text.includes('click') ||
      text.includes('error') ||
      text.split(' ').length >= 3
    ) {
      handleAnalyzeScreen(rawTranscript);
      return;
    }
  }, [messages, handleAnalyzeScreen]);

  // Start Voice Access (SpeechRecognition continuous listening)
  const startVoiceAccess = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechRecSupported(false);
      alert('Speech Recognition is not supported in this browser. Please use a Chromium or modern WebKit browser for Voice Access.');
      return;
    }

    try {
      if (speechRecRef.current) {
        try {
          speechRecRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setIsVoiceAccessActive(true);
        soundEngine.playSuccess();
        if (onLog) onLog('[VOICE_ACCESS] Continuous voice listening active.', 'VOICE');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalPhrase = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalPhrase += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        setLiveTranscript(interim || finalPhrase);

        if (finalPhrase && finalPhrase.trim()) {
          processVoiceCommand(finalPhrase.trim());
          setTimeout(() => {
            setLiveTranscript('');
          }, 1500);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          setIsVoiceAccessActive(false);
          setIsListening(false);
          alert('Microphone permission was denied. Please allow microphone access to use Voice Access.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Automatically restart listening if Voice Access mode is still turned ON
        if (speechRecRef.current && isVoiceAccessActive) {
          try {
            recognition.start();
          } catch {}
        }
      };

      speechRecRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('SpeechRecognition start failed:', err);
      setIsVoiceAccessActive(false);
      setIsListening(false);
    }
  };

  const stopVoiceAccess = () => {
    soundEngine.playClick();
    setIsVoiceAccessActive(false);
    setIsListening(false);
    setLiveTranscript('');
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
        speechRecRef.current = null;
      } catch {}
    }
    if (onLog) onLog('[VOICE_ACCESS] Voice listening paused.', 'VOICE');
  };

  // Toggle Voice Access button
  const toggleVoiceAccess = () => {
    if (isVoiceAccessActive) {
      stopVoiceAccess();
    } else {
      startVoiceAccess();
    }
  };

  // Clean up MediaStream and SpeechRecognition on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (speechRecRef.current) {
        try {
          speechRecRef.current.abort();
        } catch {}
      }
      stopSpeaking();
    };
  }, []);

  // Automatically prompt for screen share / screenshot request when modal opens if permission not dismissed
  useEffect(() => {
    const autoPromptScreen = async () => {
      const dismissed = localStorage.getItem(STORAGE_PERMISSION_DISMISSED) === 'true';
      if (!dismissed) {
        // Show permission prompt first (default state)
        return;
      }
      // If permission prompt was previously dismissed, gently offer screen capture
      if (!currentImage && !isSharingLive) {
        await startLiveScreenCapture();
      }
    };
    autoPromptScreen();
  }, []);

  const handleGrantPermissions = async (type: 'all' | 'screen' | 'voice' | 'skip') => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_PERMISSION_DISMISSED, 'true');
    }
    setShowPermissionPrompt(false);

    if (type === 'all') {
      soundEngine.playSuccess();
      const success = await startLiveScreenCapture();
      startVoiceAccess();
      if (success) {
        speakText('Screen shot request authorized and active. Speak your commands anytime.', 'Male');
      } else {
        speakText('Voice Access authorized. You can upload or paste screenshots.', 'Male');
      }
    } else if (type === 'screen') {
      soundEngine.playSuccess();
      await startLiveScreenCapture();
      speakText('Screen shot capture authorized.', 'Male');
    } else if (type === 'voice') {
      soundEngine.playSuccess();
      startVoiceAccess();
      speakText('Voice Access authorized.', 'Male');
    } else if (type === 'skip') {
      soundEngine.playClick();
    }
  };

  const startNewSession = () => {
    soundEngine.playClick();
    setCurrentSessionId(`session-${Date.now()}`);
    setCurrentImage(null);
    setMessages([]);
    setImageZoom(1);
    setLastVoiceCommand(null);
  };

  const loadSession = (sess: CompanionSession) => {
    soundEngine.playClick();
    setCurrentSessionId(sess.id);
    setActiveMode(sess.mode);
    setCurrentImage(sess.imageUrl);
    setMessages(sess.messages || []);
    setShowHistorySidebar(false);
  };

  const deleteSession = (sessId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playClick();
    const filtered = sessions.filter((s) => s.id !== sessId);
    syncSessions(filtered);
    if (currentSessionId === sessId) {
      startNewSession();
    }
  };

  const currentModeObj = MODES.find((m) => m.id === activeMode) || MODES[0];

  return (
    <ModalWrapper title="🖥️ SUPERAI — AI SCREEN COMPANION &amp; VOICE ACCESS" onClose={onClose} maxWidthClass="max-w-7xl">
      <div className="flex flex-col space-y-3 font-mono text-xs text-zinc-200 min-h-[620px] relative select-none">
        {/* ========================================================================= */}
        {/* INITIAL PERMISSION AUTHORIZATION MODAL OVERLAY */}
        {/* ========================================================================= */}
        {showPermissionPrompt && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md rounded-xl p-4 sm:p-8 flex flex-col items-center justify-center border-2 border-emerald-500/70 shadow-[0_0_50px_rgba(16,185,129,0.35)] animate-in fade-in duration-200">
            <div className="max-w-2xl w-full space-y-6 text-center">
              {/* Header Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-[11px] font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>SUPERAI SYSTEM SECURITY &amp; SENSOR ACCESS</span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-400 tracking-wider">
                  AUTHORIZE SCREEN &amp; VOICE ACCESS
                </h3>
                <p className="text-xs text-zinc-400 mt-2 max-w-lg mx-auto leading-relaxed">
                  To deliver real-time visual step-by-step guidance, analyze system errors, and enable hands-free voice commands, SuperAI requests the following browser permissions:
                </p>
              </div>

              {/* Two Permission Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {/* 1. Screen Capture */}
                <div className="bg-[#070b12] border border-cyan-800/80 hover:border-cyan-400 p-4 rounded-xl space-y-2 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-700/50">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                      {isSharingLive ? '● GRANTED' : 'PROMPT'}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-cyan-300">🖥️ Screen Capture</h4>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Inspects your screen, application windows, or browser tabs in real-time to locate buttons, read dialog errors, and provide visual guidance.
                  </p>
                </div>

                {/* 2. Microphone & Voice Access */}
                <div className="bg-[#070b12] border border-emerald-800/80 hover:border-emerald-400 p-4 rounded-xl space-y-2 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-700/50">
                      <Mic className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                      {isVoiceAccessActive ? '● LISTENING' : 'PROMPT'}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-emerald-300">🎙️ Voice Access</h4>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Enables continuous voice control like Windows/Android Voice Access. Speak commands (&ldquo;Explain screen&rdquo;, &ldquo;Fix this error&rdquo;, &ldquo;Where do I click?&rdquo;) hands-free!
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => handleGrantPermissions('all')}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>GRANT SCREEN &amp; VOICE ACCESS (RECOMMENDED)</span>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => handleGrantPermissions('voice')}
                    className="py-2 px-3 rounded-lg bg-[#0a121c] border border-emerald-600/70 hover:bg-emerald-950 text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>VOICE ACCESS ONLY</span>
                  </button>

                  <button
                    onClick={() => handleGrantPermissions('screen')}
                    className="py-2 px-3 rounded-lg bg-[#0a121c] border border-cyan-600/70 hover:bg-cyan-950 text-cyan-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>SCREEN SHARE ONLY</span>
                  </button>

                  <button
                    onClick={() => handleGrantPermissions('skip')}
                    className="py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>MANUAL UPLOAD / SKIP</span>
                  </button>
                </div>
              </div>

              {/* Checkbox option */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <label className="flex items-center gap-2 text-[11px] text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                  <span>Don&apos;t ask every time (You can open permissions anytime via the toolbar)</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VOICE ACCESS FLOATING HUD / LIVE STATUS BANNER */}
        {/* ========================================================================= */}
        <div className={`p-2.5 rounded-xl border transition-all flex flex-wrap items-center justify-between gap-2 ${
          isVoiceAccessActive
            ? 'bg-gradient-to-r from-emerald-950/90 via-black to-teal-950/90 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            : 'bg-[#060a10] border-zinc-800/80'
        }`}>
          {/* Left: Voice Access Mode Indicator */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleVoiceAccess}
              className={`px-3 py-1.5 rounded-lg font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                isVoiceAccessActive
                  ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                  : 'bg-zinc-900 border border-zinc-700 hover:border-emerald-500 text-zinc-300'
              }`}
            >
              {isVoiceAccessActive ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4 text-zinc-500" />}
              <span>{isVoiceAccessActive ? 'VOICE ACCESS: ACTIVE' : 'ENABLE VOICE ACCESS'}</span>
            </button>

            {/* Pulsating Voice Waveform when Active */}
            {isVoiceAccessActive && (
              <div className="flex items-center gap-1">
                <div className="w-1 h-3.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1 h-5 bg-emerald-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1 h-2.5 bg-emerald-500 rounded-full animate-bounce" />
                <div className="w-1 h-4 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
                <span className="text-[11px] font-bold text-emerald-300 ml-1.5 hidden sm:inline">
                  {isListening ? 'LISTENING FOR COMMANDS...' : 'STANDBY'}
                </span>
              </div>
            )}
          </div>

          {/* Center: Live Transcript / Heard command display */}
          <div className="flex-1 min-w-[200px] max-w-xl mx-2 text-[11px] truncate">
            {liveTranscript ? (
              <div className="bg-black/80 border border-emerald-500/60 px-3 py-1 rounded-lg text-emerald-300 truncate animate-pulse flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Heard: &ldquo;{liveTranscript}&rdquo;</span>
              </div>
            ) : lastVoiceCommand ? (
              <div className="bg-black/60 border border-zinc-800 px-3 py-1 rounded-lg text-zinc-400 truncate flex items-center gap-2">
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">Last Command: &ldquo;{lastVoiceCommand}&rdquo;</span>
              </div>
            ) : (
              <span className="text-zinc-500 text-[10px] hidden md:inline">
                💡 Speak: &ldquo;Explain screen&rdquo;, &ldquo;Fix this error&rdquo;, &ldquo;Guide me&rdquo;, &ldquo;Take snapshot&rdquo;, or ask any question!
              </span>
            )}
          </div>

          {/* Right: Controls & Help */}
          <div className="flex items-center gap-2">
            {/* Auto-Speak Response Toggle */}
            <button
              onClick={() => {
                soundEngine.playClick();
                setAutoSpeakResponse(!autoSpeakResponse);
              }}
              className={`px-2 py-1 rounded border text-[10px] font-bold flex items-center gap-1 transition-all ${
                autoSpeakResponse
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                  : 'bg-black border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
              title="Automatically read aloud the AI analysis response"
            >
              {autoSpeakResponse ? <Volume2 className="w-3 h-3 text-emerald-400" /> : <VolumeX className="w-3 h-3" />}
              <span>AUTO-SPEAK: {autoSpeakResponse ? 'ON' : 'OFF'}</span>
            </button>

            {/* Voice Cheatsheet button */}
            <button
              onClick={() => setShowVoiceCheatsheet(true)}
              className="px-2 py-1 rounded bg-black hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-emerald-300 text-[10px] font-bold flex items-center gap-1"
            >
              <HelpCircle className="w-3 h-3" />
              <span className="hidden sm:inline">VOICE COMMANDS</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TOP BAR: SCREEN INPUT METHODS & PERMISSION SETTINGS */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-950 pb-2">
          {/* Left: Input Method Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Method A: Upload */}
            <label className="px-3 py-1.5 rounded-lg bg-emerald-950/90 border border-emerald-500/80 hover:bg-emerald-500 hover:text-black text-emerald-300 font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.25)] text-xs">
              <Upload className="w-3.5 h-3.5" />
              <span>UPLOAD SCREENSHOT</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileUpload} className="hidden" />
            </label>

            {/* Method B: Live Screen Capture */}
            <button
              onClick={isSharingLive ? stopLiveScreenCapture : startLiveScreenCapture}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 text-xs cursor-pointer ${
                isSharingLive
                  ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]'
                  : 'bg-cyan-950/90 border border-cyan-500/80 hover:bg-cyan-500 hover:text-black text-cyan-300'
              }`}
            >
              {isSharingLive ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isSharingLive ? 'STOP SCREEN SHARE' : 'CAPTURE LIVE SCREEN'}</span>
            </button>

            {/* Method C: Paste Clipboard Indicator */}
            <div className="hidden sm:flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-black/60 border border-zinc-800 text-zinc-400">
              <Clipboard className="w-3.5 h-3.5 text-emerald-400" />
              <span>PASTE (CTRL+V) ACTIVE</span>
            </div>

            {/* Permission Settings Trigger */}
            <button
              onClick={() => setShowPermissionPrompt(true)}
              className="px-2.5 py-1.5 rounded-lg bg-black border border-emerald-900/80 hover:border-emerald-400 text-emerald-400 text-xs font-bold flex items-center gap-1"
              title="Review Screen & Microphone Permissions"
            >
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>PERMISSIONS</span>
            </button>
          </div>

          {/* Right: History & New Session Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistorySidebar(!showHistorySidebar)}
              className="px-2.5 py-1.5 rounded-lg bg-black border border-emerald-900 text-emerald-400 hover:border-emerald-500 text-xs font-bold flex items-center gap-1"
            >
              <History className="w-3.5 h-3.5" />
              <span>HISTORY ({sessions.length})</span>
            </button>

            <button
              onClick={startNewSession}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>NEW SESSION</span>
            </button>
          </div>
        </div>

        {/* Live Stream Error / Info Alert */}
        {liveStreamError && (
          <div className="p-2.5 bg-red-950/80 border border-red-800 rounded-lg text-red-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{liveStreamError}</span>
            </div>
            <button onClick={() => setLiveStreamError(null)} className="text-xs text-red-400 font-bold ml-2">
              ✕
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE SELECTION BAR (8 ASSISTANT MODES) */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-emerald-900">
          {MODES.map((m) => {
            const Icon = m.icon;
            const isActive = activeMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  soundEngine.playClick();
                  setActiveMode(m.id);
                }}
                className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all flex items-center gap-1.5 border cursor-pointer shrink-0 ${
                  isActive
                    ? `bg-gradient-to-r ${m.color} text-white border-transparent shadow-[0_0_12px_rgba(16,185,129,0.35)]`
                    : 'bg-[#080d14] border-zinc-800/80 text-zinc-400 hover:text-white hover:border-emerald-700'
                }`}
                title={m.desc}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.title}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* MAIN WORKSPACE GRID: SIDEBAR / VIEWPORT / ASSISTANT PANEL */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-[480px]">
          {/* HISTORY SIDEBAR OVERLAY OR DRAWER */}
          {showHistorySidebar && (
            <div className="lg:col-span-3 bg-[#05080e] border border-emerald-950 rounded-xl p-3 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
                <h4 className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  <span>RECENT SESSIONS</span>
                </h4>
                <button onClick={() => setShowHistorySidebar(false)} className="text-zinc-500 hover:text-white text-xs">
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px]">
                {sessions.length === 0 ? (
                  <p className="text-zinc-600 text-[11px] italic p-2">No saved analysis sessions yet.</p>
                ) : (
                  sessions.map((sess) => (
                    <div
                      key={sess.id}
                      onClick={() => loadSession(sess)}
                      className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        currentSessionId === sess.id
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                          : 'bg-black border-zinc-900 hover:border-emerald-800 text-zinc-400'
                      }`}
                    >
                      <div className="truncate flex-1">
                        <h5 className="font-bold text-[11px] truncate">{sess.title}</h5>
                        <p className="text-[9px] text-zinc-500 uppercase">{sess.mode}</p>
                      </div>
                      <button
                        onClick={(e) => deleteSession(sess.id, e)}
                        className="p-1 text-zinc-600 hover:text-red-400 shrink-0"
                        title="Delete Session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => {
                  syncSessions([]);
                  setSessions([]);
                }}
                className="w-full py-1.5 bg-red-950/60 border border-red-900 hover:bg-red-900 text-red-300 rounded text-[10px] font-bold"
              >
                Clear History
              </button>
            </div>
          )}

          {/* CENTRAL SCREENSHOT / LIVE SCREEN VIEWPORT */}
          <div className={`${showHistorySidebar ? 'lg:col-span-5' : 'lg:col-span-7'} bg-[#05080c] border border-emerald-900/60 rounded-xl p-3 flex flex-col justify-between space-y-3 relative`}>
            {/* Viewport Toolbar */}
            <div className="flex items-center justify-between border-b border-emerald-950/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5" />
                  <span>SCREEN VIEWPORT</span>
                </span>
                {isSharingLive && (
                  <span className="px-2 py-0.5 rounded bg-red-950 border border-red-600 text-red-400 text-[9px] font-bold animate-pulse">
                    ● LIVE STREAM ACTIVE
                  </span>
                )}
              </div>

              {/* Viewport Zoom & Reset Controls */}
              {currentImage && (
                <div className="flex items-center gap-1 bg-black rounded border border-zinc-800 px-1.5 py-0.5 text-[10px]">
                  <button
                    onClick={() => setImageZoom((z) => Math.max(0.5, z - 0.2))}
                    className="p-1 text-zinc-400 hover:text-white"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </button>
                  <span className="text-zinc-300 font-mono px-1">{Math.round(imageZoom * 100)}%</span>
                  <button
                    onClick={() => setImageZoom((z) => Math.min(3, z + 0.2))}
                    className="p-1 text-zinc-400 hover:text-white"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setImageZoom(1)}
                    className="p-1 text-zinc-400 hover:text-white ml-1 border-l border-zinc-800"
                    title="Fit to Screen"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setCurrentImage(null)}
                    className="p-1 text-red-400 hover:text-red-300 ml-1 border-l border-zinc-800"
                    title="Remove Image"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Video element for mediaStream capture (visible during live capture) */}
            <div className={isSharingLive && !currentImage ? 'relative w-full max-h-[220px] bg-black rounded border border-cyan-700 flex items-center justify-center overflow-hidden my-1' : 'hidden'}>
              <video ref={videoRef} autoPlay playsInline muted className="max-h-[200px] w-auto object-contain" />
              <div className="absolute bottom-2 right-2">
                <button
                  onClick={() => captureFrameFromLiveStream()}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded shadow-lg flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>CLICK TO SNAPSHOT</span>
                </button>
              </div>
            </div>

            {/* Main Image or Drag Drop Box */}
            <div className="flex-1 min-h-[300px] max-h-[460px] overflow-auto flex items-center justify-center bg-black/90 rounded-lg border border-emerald-950 p-2 relative group">
              {currentImage ? (
                <div
                  className="transition-all duration-200 flex items-center justify-center min-w-full"
                  style={{ transform: `scale(${imageZoom})`, transformOrigin: 'center center' }}
                >
                  <img
                    src={currentImage}
                    alt="Active Screen Capture"
                    className="max-h-[420px] w-auto object-contain rounded border border-emerald-900/60 shadow-2xl"
                  />
                </div>
              ) : isSharingLive ? (
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <Monitor className="w-12 h-12 text-cyan-400 animate-pulse" />
                  <p className="text-xs font-bold text-cyan-200">LIVE SCREEN STREAM ACTIVE</p>
                  <p className="text-[11px] text-zinc-400 max-w-sm">
                    Select a frame snapshot to analyze, or ask the assistant any question about your active screen using voice or text.
                  </p>
                  <button
                    onClick={() => captureFrameFromLiveStream()}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>TAKE SNAPSHOT FRAME</span>
                  </button>
                </div>
              ) : (
                /* Method A / Method C Drag Drop Zone */
                <label className="flex flex-col items-center justify-center text-center p-8 space-y-3 cursor-pointer w-full h-full border-2 border-dashed border-emerald-950 hover:border-emerald-500/80 rounded-lg transition-all group">
                  <div className="p-4 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 group-hover:scale-110 transition-transform">
                    <Monitor className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-emerald-300">DRAG &amp; DROP SCREENSHOT HERE</h4>
                    <p className="text-[11px] text-zinc-400 mt-1">or Click to Upload • Supports PNG, JPG, WebP</p>
                    <p className="text-[10px] text-emerald-500/80 mt-2 font-mono">
                      💡 Tip: Press <strong className="text-emerald-300">Ctrl+V / Cmd+V</strong> anywhere to paste a copied screenshot!
                    </p>
                  </div>
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Direct Computer Control Status Indicator */}
            <div className="p-2 bg-[#090d16] border border-emerald-950 rounded-lg flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Operating Mode: <strong className="text-emerald-300 font-bold">Visual Step-by-Step Guidance (Active)</strong></span>
              </span>
              <span className="text-[10px] text-zinc-500 hidden sm:inline">
                Direct OS Automation requires desktop companion agent
              </span>
            </div>

            {/* Analyze Trigger Bar */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={currentModeObj.promptPlaceholder}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAnalyzeScreen();
                }}
                className="flex-1 bg-black border border-emerald-900 focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-emerald-200 outline-none"
              />
              <button
                onClick={() => handleAnalyzeScreen()}
                disabled={isAnalyzing || (!currentImage && !isSharingLive)}
                className={`px-5 py-2 rounded-lg font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  (!currentImage && !isSharingLive) || isAnalyzing
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>ANALYZING SCREEN...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>ANALYZE SCREEN</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT-SIDE CHAT & ASSISTANT CONVERSATION PANEL */}
          <div className={`${showHistorySidebar ? 'lg:col-span-4' : 'lg:col-span-5'} bg-[#05080d] border border-emerald-900/60 rounded-xl p-3 flex flex-col justify-between space-y-3`}>
            {/* Assistant Panel Header */}
            <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs text-emerald-300 uppercase tracking-wider">
                  AI ASSISTANT // {currentModeObj.badge.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {isVoiceAccessActive && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-300 rounded font-bold flex items-center gap-1">
                    <Mic className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>VOICE ON</span>
                  </span>
                )}
                <span className="text-[10px] px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded font-bold">
                  VISION AI
                </span>
              </div>
            </div>

            {/* Conversation Messages Container */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[380px] scrollbar-thin scrollbar-thumb-emerald-900">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 h-full text-zinc-500">
                  <Lightbulb className="w-10 h-10 text-emerald-500/60" />
                  <div>
                    <h5 className="font-bold text-xs text-emerald-300">READY TO ANALYZE YOUR SCREEN</h5>
                    <p className="text-[11px] text-zinc-400 mt-1 max-w-xs">
                      Upload a screenshot, capture your screen, or use Voice Access to speak your questions hands-free.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl space-y-2 border leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200 ml-4'
                        : 'bg-[#090d16] border-emerald-900/80 text-zinc-200 mr-2'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                      <span className="font-bold uppercase text-emerald-400">
                        {msg.role === 'user' ? 'YOU' : 'SUPERAI COMPANION'}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div className="whitespace-pre-wrap text-xs font-mono space-y-1">
                      {msg.text}
                    </div>

                    {/* Contextual Suggested Questions Chips */}
                    {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                      <div className="pt-2 border-t border-emerald-950 space-y-1.5">
                        <p className="text-[10px] text-emerald-400 font-bold">SUGGESTED FOLLOW-UP QUESTIONS:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestedQuestions.map((q, qIdx) => (
                            <button
                              key={qIdx}
                              onClick={() => handleAnalyzeScreen(q)}
                              className="px-2 py-1 bg-black hover:bg-emerald-950 border border-emerald-800 hover:border-emerald-400 text-emerald-300 text-[10px] rounded transition-all cursor-pointer"
                            >
                              {q} →
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Toolbar for AI Message */}
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 pt-1.5 border-t border-zinc-900 justify-end text-[10px]">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(msg.text);
                            soundEngine.playSuccess();
                          }}
                          className="text-zinc-400 hover:text-emerald-300 flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>

                        <button
                          onClick={() => speakText(msg.text.replace(/[*#]/g, ''), 'Male')}
                          className="text-zinc-400 hover:text-emerald-300 flex items-center gap-1"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Listen</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Chat Input Box */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-emerald-950">
              <input
                type="text"
                placeholder="Ask follow-up question or speak with Voice Access..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAnalyzeScreen();
                }}
                className="flex-1 bg-black border border-emerald-900 focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-emerald-200 outline-none"
              />
              <button
                onClick={() => handleAnalyzeScreen()}
                disabled={isAnalyzing || (!currentImage && !isSharingLive)}
                className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VOICE COMMANDS CHEATSHEET MODAL */}
        {/* ========================================================================= */}
        {showVoiceCheatsheet && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm rounded-xl p-4 sm:p-6 flex flex-col justify-between border border-emerald-500/80 shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-emerald-400" />
                <h4 className="font-extrabold text-sm text-emerald-300 tracking-wider">
                  VOICE ACCESS CHEATSHEET // NATURAL SPOKEN COMMANDS
                </h4>
              </div>
              <button
                onClick={() => setShowVoiceCheatsheet(false)}
                className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 overflow-y-auto max-h-[420px] pr-1">
              {/* Category 1: Analysis Modes */}
              <div className="bg-[#080d16] border border-emerald-950 rounded-xl p-3 space-y-2">
                <h5 className="font-bold text-xs text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analysis &amp; Mode Commands</span>
                </h5>
                <ul className="space-y-1.5 text-[11px] text-zinc-300">
                  <li className="p-1.5 bg-black/50 rounded border border-zinc-900">
                    <strong className="text-emerald-300">&ldquo;Explain screen&rdquo;</strong>
                    <p className="text-[10px] text-zinc-500">Describes layout &amp; elements</p>
                  </li>
                  <li className="p-1.5 bg-black/50 rounded border border-zinc-900">
                    <strong className="text-emerald-300">&ldquo;Fix this error&rdquo;</strong>
                    <p className="text-[10px] text-zinc-500">Diagnoses errors &amp; warnings</p>
                  </li>
                  <li className="p-1.5 bg-black/50 rounded border border-zinc-900">
                    <strong className="text-emerald-300">&ldquo;Guide me step by step&rdquo;</strong>
                    <p className="text-[10px] text-zinc-500">Visual button click sequence</p>
                  </li>
                  <li className="p-1.5 bg-black/50 rounded border border-zinc-900">
                    <strong className="text-emerald-300">&ldquo;Summarize screen&rdquo;</strong>
                    <p className="text-[10px] text-zinc-500">Summarizes visible text/tables</p>
                  </li>
                  <li className="p-1.5 bg-black/50 rounded border border-zinc-900">
                    <strong className="text-emerald-300">&ldquo;Understand code&rdquo;</strong>
                    <p className="text-[10px] text-zinc-500">Analyzes visible code &amp; bugs</p>
                  </li>
                </ul>
              </div>

              {/* Category 2: Screen & Stream Controls */}
              <div className="bg-[#080d16] border border-emerald-950 rounded-xl p-3 space-y-2">
                <h5 className="font-bold text-xs text-cyan-400 flex items-center gap-1">
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Screen &amp; Frame Controls</span>
                </h5>
                <ul className="space-y-1.5 text-[11px] text-zinc-300">
                  <li className="p-1.5 bg-black/50 rounded border border-zinc-900">
                    <strong className="text-cyan-300">&ldquo;Take snapshot&rdquo;</strong>
                    <p className="text-[10px] text-zinc-500">Captures new live frame</p>
                  </li>
                  <li className="p-1.5 bg-black/50 rounded border border-zinc-900">
                    <strong className="text-cyan-300">&ldquo;Start screen share&rdquo;</strong>
                    <p className="text-[10px] text-zinc-500">Begins live stream session</p>
                  </li>
                  <li className="p-1.5 bg-black/50 rounded border border-zinc-900">
                    <strong className="text-cyan-300">&ldquo;Stop screen share&rdquo;</strong>
                    <p className="text-[10px] text-zinc-500">Ends current screen sharing</p>
                  </li>
                  <li className="p-1.5 bg-black/50 rounded border border-zinc-900">
                    <strong className="text-cyan-300">&ldquo;Zoom in / Zoom out&rdquo;</strong>
                    <p className="text-[10px] text-zinc-500">Adjusts viewport scale</p>
                  </li>
                  <li className="p-1.5 bg-black/50 rounded border border-zinc-900">
                    <strong className="text-cyan-300">&ldquo;Fit screen&rdquo;</strong>
                    <p className="text-[10px] text-zinc-500">Resets zoom to 100%</p>
                  </li>
                </ul>
              </div>

              {/* Category 3: Voice & Audio Commands */}
              <div className="bg-[#080d16] border border-emerald-950 rounded-xl p-3 space-y-2">
                <h5 className="font-bold text-xs text-amber-400 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Speech &amp; System Controls</span>
                </h5>
                <ul className="space-y-1.5 text-[11px] text-zinc-300">
                  <li className="p-1.5 bg-black/50 rounded border border-zinc-900">
                    <strong className="text-amber-300">&ldquo;Read aloud&rdquo;</strong>
                    <p className="text-[10px] text-zinc-500">Vocalizes the assistant answer</p>
                  </li>
                  <li className="p-1.5 bg-black/50 rounded border border-zinc-900">
                    <strong className="text-amber-300">&ldquo;Stop speaking&rdquo; / &ldquo;Silence&rdquo;</strong>
                    <p className="text-[10px] text-zinc-500">Immediately mutes speech</p>
                  </li>
                  <li className="p-1.5 bg-black/50 rounded border border-zinc-900">
                    <strong className="text-amber-300">&ldquo;Stop listening&rdquo;</strong>
                    <p className="text-[10px] text-zinc-500">Pauses Voice Access mode</p>
                  </li>
                  <li className="p-1.5 bg-black/50 rounded border border-zinc-900">
                    <strong className="text-amber-300">&ldquo;Clear / New session&rdquo;</strong>
                    <p className="text-[10px] text-zinc-500">Resets active screen session</p>
                  </li>
                  <li className="p-1.5 bg-black/50 rounded border border-zinc-900">
                    <strong className="text-amber-300">&ldquo;Where is the [button]?&rdquo;</strong>
                    <p className="text-[10px] text-zinc-500">Direct on-screen voice question</p>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-emerald-950">
              <button
                onClick={() => setShowVoiceCheatsheet(false)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-lg text-xs"
              >
                GOT IT, LET&apos;S TALK!
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};
