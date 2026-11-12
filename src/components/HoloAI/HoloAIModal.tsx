import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Send,
  X,
  Volume2,
  VolumeX,
  RotateCcw,
  Square,
  Play,
  Pause,
  Settings,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  MessageSquare,
  Bot,
  User,
  Shield,
  Layers,
  Check,
  AlertCircle,
  HelpCircle,
  Expand,
  Shrink,
  Camera,
  CameraOff,
  Activity,
  Zap,
} from 'lucide-react';
import { HoloAvatarScene } from './HoloAvatarScene';
import { FloatingHoloWidgets } from './FloatingHoloWidgets';
import { CameraFaceTracker } from './CameraFaceTracker';
import {
  faceTrackingService,
  FaceTrackingMetrics,
  FaceTrackingMode,
  DEFAULT_FACE_METRICS,
} from './faceTrackingService';
import {
  parseMovementCommands,
  HoloMovementInstruction,
  MOVEMENT_DEFINITIONS,
} from './movementEngine';
import {
  HoloMotionPlan,
  generateDynamicMotionPlan,
} from './proceduralMotionEngine';
import {
  HoloModelId,
  HoloEnvironmentId,
  HoloState,
  HoloGesture,
  HoloChatMessage,
  HoloUserSettings,
  DEFAULT_HOLO_SETTINGS,
  HOLO_MODELS,
  HOLO_ENVIRONMENTS,
} from './types';
import { soundEngine } from '../../utils/audio';
import { db, auth, handleFirestoreError, OperationType } from '../../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface HoloAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (action: string, params?: any) => void;
  writeLog: (text: string, tag?: string) => void;
  userId?: string;
  theme?: 'dark' | 'light';
  activeNote?: string;
}

export const HoloAIModal: React.FC<HoloAIModalProps> = ({
  isOpen,
  onClose,
  onExecuteCommand,
  writeLog,
  userId = 'guest',
  theme: appTheme = 'dark',
  activeNote = '',
}) => {
  // 1. Settings & Customization
  const [settings, setSettings] = useState<HoloUserSettings>(() => {
    try {
      const cached = localStorage.getItem(`ISHAI_Holo_Settings_${userId}`);
      return cached ? JSON.parse(cached) : DEFAULT_HOLO_SETTINGS;
    } catch {
      return DEFAULT_HOLO_SETTINGS;
    }
  });

  const [uiTheme, setUiTheme] = useState<'dark' | 'light'>(appTheme);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(true);
  const [showFloatingHud, setShowFloatingHud] = useState(true);
  const [isFullscreenHolo, setIsFullscreenHolo] = useState(false);
  const [showFaceTrackerWidget, setShowFaceTrackerWidget] = useState(true);
  const [faceMetrics, setFaceMetrics] = useState<FaceTrackingMetrics>(DEFAULT_FACE_METRICS);
  const [trackingMode, setTrackingMode] = useState<FaceTrackingMode>('mirror');

  // 2. Avatar Animation & 3D Kinematic Procedural Motion Engine
  const [avatarState, setAvatarState] = useState<HoloState>('idle');
  const [gesture, setGesture] = useState<HoloGesture>('neutral');
  const [activeMotionPlan, setActiveMotionPlan] = useState<HoloMotionPlan | null>(null);

  const handleMotionPlanComplete = useCallback(() => {
    setActiveMotionPlan(null);
  }, []);

  const handleCancelAllMovements = useCallback(() => {
    setActiveMotionPlan(null);
  }, []);

  // 3. Conversation & Chat State
  const [messages, setMessages] = useState<HoloChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: "Greetings. I am HOLO AI, your intelligent holographic assistant inside ISHAI. How may I accelerate your objectives today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      emotion: 'greeting',
      gesture: 'wave',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // 4. Speech Recognition (STT) State
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // 5. Speech Synthesis (TTS) & Streaming Lip-Sync State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [liveCaption, setLiveCaption] = useState<string>('');
  const [audioVolume, setAudioVolume] = useState<number>(0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const lipSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const speechQueueRef = useRef<string[]>([]);
  const isSpeakingQueueRef = useRef<boolean>(false);
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  // 6. Universal Device Compatibility & Responsive Layout
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isLargeDisplay, setIsLargeDisplay] = useState(window.innerWidth > 1900);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsLargeDisplay(width > 1900);
    };
    window.addEventListener('resize', handleResize);
    // Initial responsive setup: default to collapsed state on phones to focus on avatar
    if (window.innerWidth < 768) {
      setShowChatDrawer(false);
      setShowFloatingHud(false);
    }
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 6. Gemini API Connection Telemetry & Automatic Reconnection
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'online' | 'offline' | 'error'>('connecting');
  const [retryCount, setRetryCount] = useState(0);

  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch('/api/holo/status');
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus(data.status === 'online' ? 'online' : 'offline');
      } else {
        setConnectionStatus('error');
      }
    } catch (err) {
      setConnectionStatus('error');
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkConnection();
    }
  }, [isOpen, checkConnection]);

  // Automatic Reconnection Mechanism (Exponential backoff-ish)
  useEffect(() => {
    if (connectionStatus === 'error' || connectionStatus === 'offline') {
      const delay = Math.min(1000 * Math.pow(2, retryCount % 5), 30000); // Max 30s delay
      const timer = setTimeout(() => {
        setRetryCount((c) => c + 1);
        checkConnection();
      }, delay);
      return () => clearTimeout(timer);
    } else if (connectionStatus === 'online') {
      setRetryCount(0);
    }
  }, [connectionStatus, retryCount, checkConnection]);

  // Weather telemetry cache for floating widget
  const [weatherSummary, setWeatherSummary] = useState<{ city?: string; tempC?: number; condition?: string }>({
    city: 'ISHAI Central',
    tempC: 22,
    condition: 'Optimal atmospheric pressure',
  });

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Sync prop theme
  useEffect(() => {
    setUiTheme(appTheme);
  }, [appTheme]);

  // Load Voices for TTS
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) setAvailableVoices(v);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Fetch Firestore settings on mount
  useEffect(() => {
    if (!isOpen) return;

    // Only attempt Firestore cloud read when user is genuinely authenticated with Firebase Auth
    // and the requested document matches their UID, satisfying isOwner(userId) in firestore.rules
    const isAuthedWithFirestore = Boolean(auth.currentUser && auth.currentUser.uid === userId && userId !== 'guest' && userId !== 'guest_default');

    if (isAuthedWithFirestore && auth.currentUser) {
      const authUid = auth.currentUser.uid;
      getDoc(doc(db, 'user_holo_settings', authUid))
        .then((snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as HoloUserSettings;
            setSettings(data);
            if (data.theme) setUiTheme(data.theme);
            if (data.show_floating_hud !== undefined) setShowFloatingHud(data.show_floating_hud);
          }
        })
        .catch((err) => {
          console.warn('Firestore holo settings read notice:', err);
          handleFirestoreError(err, OperationType.GET, `user_holo_settings/${authUid}`);
        });
    }

    setAvatarState('greeting');
    setGesture('wave');
    const timer = setTimeout(() => {
      setAvatarState('idle');
      setGesture('neutral');
    }, 3200);

    return () => clearTimeout(timer);
  }, [isOpen, userId]);

  // Save Settings Routine
  const saveSettings = useCallback(
    async (newSettings: Partial<HoloUserSettings>) => {
      const isAuthedWithFirestore = Boolean(auth.currentUser && auth.currentUser.uid === userId && userId !== 'guest' && userId !== 'guest_default');
      const effectiveUid = (isAuthedWithFirestore && auth.currentUser) ? auth.currentUser.uid : userId;

      const updated: HoloUserSettings = {
        ...settings,
        ...newSettings,
        user_id: effectiveUid,
        updated_at: new Date().toISOString(),
      };
      setSettings(updated);

      try {
        localStorage.setItem(`ISHAI_Holo_Settings_${userId}`, JSON.stringify(updated));
      } catch {}

      if (isAuthedWithFirestore && auth.currentUser) {
        try {
          await setDoc(doc(db, 'user_holo_settings', auth.currentUser.uid), updated, { merge: true });
        } catch (err) {
          console.warn('Firestore holo settings save deferred:', err);
          handleFirestoreError(err, OperationType.WRITE, `user_holo_settings/${auth.currentUser.uid}`);
        }
      }
    },
    [settings, userId]
  );

  // Auto scroll chat messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, interimTranscript]);

  // ==========================================================================
  // FAST STREAMING SPEECH QUEUE & REALISTIC LIP SYNC
  // ==========================================================================
  const stopSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    speechQueueRef.current = [];
    isSpeakingQueueRef.current = false;

    if (lipSyncIntervalRef.current) {
      clearInterval(lipSyncIntervalRef.current);
      lipSyncIntervalRef.current = null;
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setAudioVolume(0);
    setLiveCaption('');
  }, []);

  const playNextInQueue = useCallback(() => {
    if (speechQueueRef.current.length === 0) {
      isSpeakingQueueRef.current = false;
      setIsSpeaking(false);
      setAudioVolume(0);
      setAvatarState('idle');
      setGesture('neutral');
      return;
    }

    const sentence = speechQueueRef.current.shift()!;
    if (!sentence.trim() || !('speechSynthesis' in window)) {
      playNextInQueue();
      return;
    }

    isSpeakingQueueRef.current = true;
    setIsSpeaking(true);
    setLiveCaption(sentence);
    setAvatarState('speaking');

    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.rate = settings.voice_speed || 1.0;
    utterance.pitch = settings.voice_pitch || 1.0;

    if (availableVoices.length > 0) {
      if (settings.voice_id) {
        const found = availableVoices.find((v) => v.name === settings.voice_id);
        if (found) utterance.voice = found;
      } else {
        const targetGender = settings.voice_gender;
        const matched = availableVoices.find((v) =>
          targetGender === 'Female'
            ? /female|zira|samantha|victoria|karen|susan|google us english/i.test(v.name)
            : /male|david|george|alex|daniel|google uk english male/i.test(v.name)
        );
        if (matched) utterance.voice = matched;
      }
    }

    // Dynamic lip-sync cadence loop
    if (!lipSyncIntervalRef.current) {
      let step = 0;
      lipSyncIntervalRef.current = setInterval(() => {
        step += 0.28;
        const syllable = Math.sin(step) * 0.5 + 0.5;
        const randomVowel = Math.random() * 0.35;
        const vol = Math.min(1.0, syllable * 0.75 + randomVowel);
        setAudioVolume(vol);
      }, 50);
    }

    utterance.onend = () => {
      playNextInQueue();
    };

    utterance.onerror = () => {
      playNextInQueue();
    };

    window.speechSynthesis.speak(utterance);
  }, [availableVoices, settings.voice_id, settings.voice_gender, settings.voice_pitch, settings.voice_speed]);

  const queueSentenceForSpeech = useCallback(
    (sentence: string) => {
      const clean = sentence.replace(/<!--ACTION:.*?-->/g, '').trim();
      if (!clean) return;
      speechQueueRef.current.push(clean);
      if (!isSpeakingQueueRef.current) {
        playNextInQueue();
      }
    },
    [playNextInQueue]
  );

  const togglePauseSpeech = () => {
    if (!('speechSynthesis' in window)) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  // ==========================================================================
  // SPEECH RECOGNITION (STT) - INSTANT VOICE INTERRUPTION
  // ==========================================================================
  const startListening = () => {
    // Interrupt any ongoing speech immediately
    stopSpeech();
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }
    setMicError(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicError('Speech recognition is not supported in this browser. Please type below.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setAvatarState('listening');
        soundEngine.playClick();
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setInterimTranscript(interim);
        if (final) {
          setInputText(final);
          handleSendMessage(final);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setMicError('Microphone permission denied. Allow mic access in your browser bar.');
        } else if (event.error !== 'no-speech') {
          setMicError(`Voice capture note: ${event.error}`);
        }
        setIsListening(false);
        setAvatarState('idle');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      setMicError(e?.message || 'Could not initiate microphone.');
      setIsListening(false);
      setAvatarState('idle');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setAvatarState('idle');
  };

  // ==========================================================================
  // ULTRA-FAST TOKEN-BY-TOKEN STREAMING RESPONSE HANDLER
  // ==========================================================================
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    // 1. DYNAMIC 3D MOTION PLAN SYNTHESIS (Instant 0ms synthesis on client)
    // We execute this BEFORE the AI loading check so quick commands feel instant.
    const generatedPlan = generateDynamicMotionPlan(query, activeMotionPlan);
    if (generatedPlan) {
      if (generatedPlan.title.toLowerCase().includes('stop') || generatedPlan.title.toLowerCase().includes('idle')) {
        handleCancelAllMovements();
        setAvatarState('idle');
        setGesture('neutral');
      } else {
        setActiveMotionPlan(generatedPlan);
      }
    }

    soundEngine.playClick();
    if (!textToSend) setInputText('');
    setInterimTranscript('');

    if (isAiLoading) return;

    if (connectionStatus === 'offline' || connectionStatus === 'error') {
      const offlineError = "My neural link to the Gemini API is currently offline. Please wait while I attempt to reconnect.";
      const assistantMsg: HoloChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: offlineError,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        emotion: 'thinking',
        gesture: 'think',
      };
      setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: 'user', text: query, timestamp: new Date().toLocaleTimeString() } as HoloChatMessage, assistantMsg]);
      queueSentenceForSpeech(offlineError);
      return;
    }

    // 1. FAST LOCAL IDENTITY CHECK (0ms latency, zero hallucination)
    const lower = query.toLowerCase();
    const isCreatorQuestion = /\b(who\s+(?:made|created|developed|built|designed|owns|programmed|coded)\s+(?:you|holo|ishai))|\b(who\s+is\s+(?:your\s+)?(?:creator|maker|developer|builder|owner|father|boss))|\b(who\s+is\s+behind\s+(?:you|holo|ishai))\b/i.test(lower);
    if (isCreatorQuestion) {
      const fixedAnswer = "I am made by Ishaan Sir. I am HOLO AI, the holographic AI assistant of ISHAI.";
      const userMsg: HoloChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const assistantMsg: HoloChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: fixedAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        emotion: 'greeting',
        gesture: 'nod',
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setAvatarState('greeting');
      setGesture('nod');
      queueSentenceForSpeech(fixedAnswer);
      return;
    }

    const isIntroQuestion = /\b(who\s+are\s+you)|(what\s+(?:is|'s)\s+your\s+name)|(introduce\s+yourself)\b/i.test(lower);
    if (isIntroQuestion) {
      const fixedIntro = "I am HOLO AI, your intelligent holographic assistant inside ISHAI.";
      const userMsg: HoloChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const assistantMsg: HoloChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: fixedIntro,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        emotion: 'greeting',
        gesture: 'wave',
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setAvatarState('greeting');
      setGesture('wave');
      queueSentenceForSpeech(fixedIntro);
      return;
    }

    // 2. Regular Message Processing via Stream
    const userMsg: HoloChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantMsgId = `assistant-${Date.now()}`;
    const initialAssistantMsg: HoloChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      emotion: 'thinking',
      gesture: 'think',
    };

    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    setIsAiLoading(true);
    setAvatarState('thinking');
    setGesture('think');

    const abortController = new AbortController();
    activeAbortControllerRef.current = abortController;

    try {
      const historyContext = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const response = await fetch('/api/holo/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversationHistory: historyContext,
          activeNote,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No streaming response body available');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let sentenceBuffer = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (!dataStr) continue;

          try {
            const parsed = JSON.parse(dataStr);

            if (parsed.chunk) {
              accumulatedText += parsed.chunk;
              sentenceBuffer += parsed.chunk;

              // Check for sentence boundary to begin speech streaming immediately!
              const sentenceMatch = sentenceBuffer.match(/^([\s\S]*?[.!?\n]+)\s+/);
              if (sentenceMatch && sentenceMatch[1].trim().length >= 12) {
                const completedSentence = sentenceMatch[1].trim();
                queueSentenceForSpeech(completedSentence);
                sentenceBuffer = sentenceBuffer.slice(sentenceMatch[0].length);
              }

              // Update visible text
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, text: accumulatedText } : m
                )
              );
            }

            if (parsed.done) {
              // Flush any remaining text in sentence buffer to speech queue
              if (sentenceBuffer.trim()) {
                queueSentenceForSpeech(sentenceBuffer.trim());
              }

              const cleanFinalText = (parsed.fullText || accumulatedText)
                .replace(/<!--ACTION:.*?-->/g, '')
                .trim();

              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        text: cleanFinalText,
                        emotion: parsed.emotion || 'speaking',
                        gesture: parsed.gesture || 'nod',
                        action: parsed.action,
                        liveData: parsed.liveData,
                      }
                    : m
                )
              );

              setAvatarState(parsed.emotion || 'speaking');
              setGesture(parsed.gesture || 'nod');

              // Update motion plan if MOVEMENT action returned from Gemini server
              if (parsed.action?.type === 'MOVEMENT' && parsed.action.motionPlan) {
                setActiveMotionPlan(parsed.action.motionPlan);
              }

              // Update weather summary if weather data returned
              if (parsed.action?.type === 'WEATHER_INFO' && parsed.action.params) {
                setWeatherSummary({
                  city: parsed.action.params.city,
                  tempC: parsed.action.params.tempC,
                  condition: parsed.action.params.condition,
                });
              }

              // Execute ISHAI navigation command if instructed
              if (parsed.action && parsed.action.type === 'NAVIGATE' && parsed.action.modal) {
                writeLog(`HOLO AI executing navigation directive: ${parsed.action.modal}`, 'HOLO_AI');
                setTimeout(() => {
                  onExecuteCommand(parsed.action.modal, parsed.action.params);
                }, 1600);
              }
            }
          } catch (e) {
            // Raw text fallback
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn('HOLO stream error fallback:', err);
      const fallbackText = "I am ready and listening. How can I assist you further?";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, text: fallbackText } : m
        )
      );
      queueSentenceForSpeech(fallbackText);
    } finally {
      setIsAiLoading(false);
      activeAbortControllerRef.current = null;
    }
  };

  const handleClearHistory = () => {
    soundEngine.playClick();
    stopSpeech();
    setMessages([
      {
        id: 'reset-1',
        role: 'assistant',
        text: 'Dialogue stream cleared. Ready for your next query or directive.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        emotion: 'idle',
        gesture: 'neutral',
      },
    ]);
  };

  if (!isOpen) return null;

  const isDark = uiTheme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#04060c] text-white overflow-hidden select-none animate-in fade-in duration-300">
      {/* ===================================================================== */}
      {/* 1. TOP HEADER & TELEMETRY BAR */}
      {/* ===================================================================== */}
      <header
        className={`px-3 sm:px-6 flex items-center justify-between border-b backdrop-blur-xl z-30 transition-all ${
          isMobile ? 'h-12' : 'h-14 sm:h-16'
        } ${
          isDark
            ? 'bg-[#070b14]/85 border-cyan-500/20'
            : 'bg-white/95 border-cyan-400/30 text-zinc-900'
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`${isMobile ? 'w-7 h-7' : 'w-9 h-9'} rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 text-white`}>
            <Bot className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className={`font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 ${
                isMobile ? 'text-xs' : 'text-sm sm:text-base'
              }`}>
                HOLO AI
              </span>
              {!isMobile && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  HOLOGRAPHIC AI ASSISTANT
                </span>
              )}
              <div className="flex items-center gap-1 sm:gap-1.5 ml-1">
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                  connectionStatus === 'online' ? 'bg-emerald-400' :
                  connectionStatus === 'connecting' ? 'bg-amber-400 animate-pulse' :
                  'bg-rose-500'
                }`} />
                <span className={`font-bold font-mono uppercase tracking-tighter ${
                  isMobile ? 'text-[8px]' : 'text-[9px]'
                } ${
                  connectionStatus === 'online' ? 'text-emerald-400/80' :
                  connectionStatus === 'connecting' ? 'text-amber-400/80' :
                  'text-rose-500/80'
                }`}>
                  {connectionStatus}
                </span>
              </div>
            </div>
            {!isMobile && (
              <p className="text-[10px] text-zinc-400 font-mono hidden sm:block">
                Made by Ishaan Sir • Token-Stream Latency • Natural Voice & Visemes • ISHAI OS Core
              </p>
            )}
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {/* Speaking Audio Controls */}
          {isSpeaking && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 text-xs">
              <button
                onClick={togglePauseSpeech}
                className="hover:text-white p-1 cursor-pointer"
                title={isPaused ? 'Resume Speech' : 'Pause Speech'}
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={stopSpeech}
                className="hover:text-rose-400 p-1 cursor-pointer"
                title="Stop Speaking Immediately"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Fullscreen Hologram Mode Toggle */}
          <button
            onClick={() => {
              setIsFullscreenHolo((prev) => !prev);
              setShowChatDrawer(false);
              setShowSettingsDrawer(false);
            }}
            className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
              isFullscreenHolo
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20'
                : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white'
            }`}
            title={isFullscreenHolo ? 'Exit Fullscreen Hologram' : 'Fullscreen Hologram Mode'}
          >
            {isFullscreenHolo ? <Shrink className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
          </button>

          {/* Face Tracking Camera Toggle */}
          <button
            onClick={() => setShowFaceTrackerWidget((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showFaceTrackerWidget
                ? faceMetrics.detected
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/20'
                  : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white'
            }`}
            title="Toggle Face Tracking Camera"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Face Tracking</span>
            {faceMetrics.detected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {/* Toggle Chat History Drawer */}
          <button
            onClick={() => {
              setShowChatDrawer((prev) => !prev);
              if (isFullscreenHolo) setIsFullscreenHolo(false);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showChatDrawer && !isFullscreenHolo
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white'
            }`}
            title="Toggle Dialogue Stream"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Dialogue</span>
          </button>

          {/* Settings Drawer Toggle */}
          <button
            onClick={() => {
              setShowSettingsDrawer((prev) => !prev);
              if (isFullscreenHolo) setIsFullscreenHolo(false);
            }}
            className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
              showSettingsDrawer
                ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white'
            }`}
            title="Avatar & Voice Personalization"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Exit HOLO AI */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-white/10 bg-black/40 hover:bg-rose-500/20 hover:border-rose-500/40 text-zinc-400 hover:text-rose-300 transition-all cursor-pointer"
            title="Exit HOLO AI"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. MAIN 3D VIEWPORT & FLOATING OVERLAYS */}
      {/* ===================================================================== */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex">
        {/* 3D Scene Viewport */}
        <div className="relative flex-1 w-full h-full">
          <HoloAvatarScene
            modelId={settings.model_id}
            environmentId={settings.environment_id}
            avatarState={avatarState}
            gesture={gesture}
            avatarScale={settings.avatar_scale}
            animationIntensity={settings.animation_intensity}
            reducedMotion={settings.reduced_motion}
            isSpeaking={isSpeaking}
            audioVolume={audioVolume}
            faceMetrics={faceMetrics}
            trackingMode={trackingMode}
            activeMotionPlan={activeMotionPlan}
            onMotionPlanComplete={handleMotionPlanComplete}
          />

          {/* 3D Movement Status HUD Indicator & Reset Control */}
          <div className="absolute top-4 right-4 z-40 flex items-center gap-2 animate-in fade-in">
            <div className="px-3 py-1.5 rounded-xl bg-black/80 border border-cyan-500/40 backdrop-blur-xl text-xs flex items-center gap-2 text-cyan-300 shadow-2xl shadow-cyan-500/20 font-mono">
              <Activity className={`w-3.5 h-3.5 ${activeMotionPlan ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
              <span>
                {activeMotionPlan ? (
                  <span className="font-bold text-white">{activeMotionPlan.title}</span>
                ) : (
                  <span className="text-zinc-300 font-sans font-medium text-[11px]">3D Pose: Forward Facing Idle</span>
                )}
              </span>
            </div>

            {activeMotionPlan && (
              <button
                onClick={handleCancelAllMovements}
                className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 hover:bg-rose-500/40 transition-all cursor-pointer shadow-lg shadow-rose-500/20"
                title="Emergency Stop: Reset Avatar Pose to Idle"
              >
                <Square className="w-4 h-4 text-rose-300" />
              </button>
            )}
          </div>

          {/* Quick 3D Movement Command Bar - Swipable on touch devices */}
          {!isFullscreenHolo && (
            <div className={`absolute left-1/2 -translate-x-1/2 z-[60] overflow-x-auto no-scrollbar py-2 px-3 flex items-center gap-2 bg-black/70 border border-cyan-500/30 rounded-2xl backdrop-blur-xl shadow-2xl transition-all pointer-events-auto ${
              isMobile ? 'bottom-24 w-[96%]' : 'bottom-20 max-w-2xl w-[92%]'
            }`}>
              {[
                { label: '🖐️ Raise Hand', cmd: 'Raise your right hand' },
                { label: '👋 Wave', cmd: 'Wave at me' },
                { label: '👏 Clap', cmd: 'Clap your hands' },
                { label: '👍 Thumbs Up', cmd: 'Give me a thumbs up' },
                { label: '💃 Dance', cmd: 'Dance for me' },
                { label: '🏃 Walk', cmd: 'Walk in place' },
                { label: '🦘 Jump', cmd: 'Jump' },
                { label: '🙇 Bow', cmd: 'Bow' },
                { label: '🙅 Fold Arms', cmd: 'Fold your arms' },
                { label: '🔄 Turn Around', cmd: 'Turn around' },
                { label: '🛑 Stop', cmd: 'Stop moving' },
              ].map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleSendMessage(chip.cmd)}
                  className="px-2.5 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/30 border border-cyan-500/30 text-[11px] font-medium text-cyan-200 hover:text-white whitespace-nowrap transition-all cursor-pointer shrink-0"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Floating Camera Face Tracker PIP Widget */}
          {showFaceTrackerWidget && !isFullscreenHolo && (
            <div className="absolute top-4 left-4 z-40 max-w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-top-2">
              <CameraFaceTracker
                onMetricsUpdate={setFaceMetrics}
                trackingMode={trackingMode}
                onChangeTrackingMode={setTrackingMode}
                theme={uiTheme}
                isMobile={isMobile}
                isLargeDisplay={isLargeDisplay}
              />
            </div>
          )}

          {/* Floating Holographic HUD Panels */}
          {!isFullscreenHolo && (
            <FloatingHoloWidgets
              isVisible={showFloatingHud}
              onToggleVisibility={() => {
                const next = !showFloatingHud;
                setShowFloatingHud(next);
                saveSettings({ show_floating_hud: next });
              }}
              isSpeaking={isSpeaking}
              audioVolume={audioVolume}
              avatarState={avatarState}
              theme={uiTheme}
              onLaunchApp={(appName) => {
                soundEngine.playClick();
                writeLog(`Dispatched app launch from Holo HUD: ${appName}`, 'HOLO_AI');
                onExecuteCommand(appName);
              }}
              weatherSummary={weatherSummary}
              isMobile={isMobile}
              isLargeDisplay={isLargeDisplay}
            />
          )}

          {/* Interactive Microphone Pill on Viewport for Fast Voice Access */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`p-4 rounded-full border-2 transition-all cursor-pointer shadow-2xl flex items-center justify-center ${
                isListening
                  ? 'bg-rose-500 border-rose-300 text-white animate-pulse shadow-rose-500/50 scale-110'
                  : 'bg-cyan-500/20 border-cyan-400 text-cyan-300 hover:bg-cyan-500/40 hover:scale-105 shadow-cyan-500/30'
              }`}
              title={isListening ? 'Stop listening' : 'Start speaking to HOLO AI'}
            >
              {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {isSpeaking && (
              <button
                onClick={stopSpeech}
                className="p-3.5 rounded-full bg-rose-500/20 border border-rose-400 text-rose-300 hover:bg-rose-500/40 transition-all cursor-pointer shadow-lg"
                title="Stop Speaking"
              >
                <Square className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Live Subtitle / Spoken Captions Bar */}
          {liveCaption && (
            <div className="absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-30 max-w-2xl w-[90%] px-5 py-3 rounded-2xl bg-black/85 backdrop-blur-xl border border-cyan-500/40 shadow-2xl shadow-cyan-500/20 text-center animate-in fade-in slide-in-from-bottom-2">
              <p className="text-xs sm:text-sm font-medium text-cyan-200 leading-relaxed font-sans">
                "{liveCaption}"
              </p>
            </div>
          )}

          {/* Microphone Error Alert */}
          {micError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-md w-[90%] p-3 rounded-2xl bg-rose-950/90 border border-rose-500/50 backdrop-blur-md text-xs text-rose-200 flex items-center justify-between shadow-2xl">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                {micError}
              </span>
              <button
                onClick={() => setMicError(null)}
                className="hover:text-white p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* 3. CONVERSATION & DIALOGUE DRAWER (Collapsible & Universal) */}
        {/* =================================================================== */}
        {showChatDrawer && !isFullscreenHolo && (
          <aside
            className={`h-full flex flex-col border-l backdrop-blur-2xl z-40 transition-all duration-300 absolute sm:relative right-0 ${
              isMobile ? 'w-full inset-0 z-50' : 'w-96 md:w-[420px]'
            } ${
              isDark
                ? 'bg-[#070b14]/94 border-cyan-500/20'
                : 'bg-white/98 border-zinc-200 text-zinc-900'
            }`}
          >
            {/* Dialogue Header */}
            <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                <MessageSquare className="w-4 h-4" />
                <span>Conversation Stream</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearHistory}
                  className="px-2 py-1 rounded-lg hover:bg-white/10 text-[10px] text-zinc-400 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                  title="Clear conversation stream"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear
                </button>
                <button
                  onClick={() => setShowChatDrawer(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                  title="Close Dialogue Drawer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div
              ref={chatScrollRef}
              className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-zinc-800"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-lg ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none'
                        : isDark
                        ? 'bg-zinc-900/90 border border-cyan-500/30 text-cyan-100 rounded-tl-none'
                        : 'bg-cyan-50/90 border border-cyan-300 text-cyan-950 rounded-tl-none'
                    }`}
                  >
                    <p>{msg.text || (isAiLoading && msg.id.startsWith('assistant') ? 'Generating...' : '')}</p>

                    {/* Action Dispatch Badge */}
                    {msg.action && msg.action.type === 'NAVIGATE' && msg.action.modal && (
                      <div className="mt-2 pt-2 border-t border-cyan-500/20 flex items-center justify-between text-[11px] font-mono text-cyan-300">
                        <span>🚀 Launching {msg.action.modal}</span>
                        <button
                          onClick={() => onExecuteCommand(msg.action!.modal!)}
                          className="px-2 py-0.5 rounded bg-cyan-500/30 hover:bg-cyan-500/50 text-[10px] cursor-pointer"
                        >
                          Open Now
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 px-1 font-mono">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {/* Interim voice transcription while speaking */}
              {isListening && interimTranscript && (
                <div className="flex flex-col items-end">
                  <div className="max-w-[85%] rounded-2xl p-2.5 text-xs bg-blue-500/20 border border-blue-400/40 text-blue-200 italic animate-pulse">
                    "{interimTranscript}..."
                  </div>
                </div>
              )}

              {/* AI Thinking Animation */}
              {isAiLoading && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-zinc-900/60 border border-cyan-500/30 text-xs text-cyan-300 max-w-[200px]">
                  <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Synthesizing response...</span>
                </div>
              )}

              {/* Reconnection status when offline */}
              {(connectionStatus === 'offline' || connectionStatus === 'error') && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-[10px] text-rose-300">
                  <Activity className="w-3.5 h-3.5 animate-pulse text-rose-400" />
                  <span>Connection lost. Reconnecting to neural link (Attempt {retryCount})...</span>
                </div>
              )}
            </div>

            {/* Input & Mic Toolbar */}
            <div className="p-3 border-t border-white/10 bg-black/40">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`p-3 rounded-xl border transition-all cursor-pointer shadow-lg shrink-0 ${
                    isListening
                      ? 'bg-rose-500 border-rose-400 text-white animate-pulse shadow-rose-500/30'
                      : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30'
                  }`}
                  title={isListening ? 'Stop listening' : 'Speak to HOLO AI'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isListening ? 'Listening to your voice...' : 'Ask HOLO AI or speak a command...'
                  }
                  className="flex-1 bg-zinc-900/90 border border-white/10 focus:border-cyan-500/60 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition-all"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || isAiLoading}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 shrink-0"
                  title="Send Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </aside>
        )}

        {/* =================================================================== */}
        {/* 4. PERSONALIZATION & SETTINGS DRAWER (Collapsible) */}
        {/* =================================================================== */}
        {showSettingsDrawer && !isFullscreenHolo && (
          <aside
            className={`w-full sm:w-80 md:w-96 h-full flex flex-col border-l backdrop-blur-2xl z-30 transition-all duration-300 absolute right-0 overflow-y-auto ${
              isDark
                ? 'bg-[#070b14]/95 border-violet-500/30'
                : 'bg-white/95 border-zinc-200 text-zinc-900'
            }`}
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-violet-400">
                <Sliders className="w-4 h-4" />
                <span>HOLO AI Personalization</span>
              </div>
              <button
                onClick={() => setShowSettingsDrawer(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-5 text-xs">
              {/* Creator Identity Spec */}
              <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-1">
                <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Fixed Identity Core</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-snug">
                  "I am made by Ishaan Sir. I am HOLO AI, the holographic AI assistant of ISHAI."
                </p>
              </div>

              {/* A. Avatar Model Archetype */}
              <div className="space-y-2">
                <label className="font-bold text-zinc-300 tracking-wide uppercase text-[10px] block">
                  3D Avatar Archetype
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {HOLO_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => saveSettings({ model_id: model.id })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        settings.model_id === model.id
                          ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-lg shadow-cyan-500/10'
                          : 'border-white/10 bg-black/40 text-zinc-400 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-white text-xs">
                        <span>{model.name}</span>
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: model.primaryColor }}
                        />
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                        {model.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* B. Virtual Environment */}
              <div className="space-y-2">
                <label className="font-bold text-zinc-300 tracking-wide uppercase text-[10px] block">
                  Holographic Environment
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {HOLO_ENVIRONMENTS.map((env) => (
                    <button
                      key={env.id}
                      onClick={() => saveSettings({ environment_id: env.id })}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        settings.environment_id === env.id
                          ? 'border-violet-400 bg-violet-500/20 text-white'
                          : 'border-white/10 bg-black/40 text-zinc-400 hover:border-white/30'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-white text-xs">{env.name}</div>
                        <div className="text-[10px] text-zinc-400 truncate max-w-[200px]">
                          {env.description}
                        </div>
                      </div>
                      {settings.environment_id === env.id && (
                        <Check className="w-4 h-4 text-violet-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* C. Avatar Scale */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-bold text-zinc-300 text-[10px] uppercase">
                  <span>Hologram Size</span>
                  <span className="font-mono text-cyan-400">{settings.avatar_scale.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.35"
                  step="0.05"
                  value={settings.avatar_scale}
                  onChange={(e) => saveSettings({ avatar_scale: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* D. Animation Intensity */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-bold text-zinc-300 text-[10px] uppercase">
                  <span>Animation Dynamics</span>
                  <span className="font-mono text-violet-400">
                    {Math.round(settings.animation_intensity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="1.4"
                  step="0.1"
                  value={settings.animation_intensity}
                  onChange={(e) =>
                    saveSettings({ animation_intensity: parseFloat(e.target.value) })
                  }
                  className="w-full accent-violet-400 cursor-pointer"
                />
              </div>

              {/* E. Voice & Speech Synthesis */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <label className="font-bold text-zinc-300 tracking-wide uppercase text-[10px] block">
                  Voice Synthesis
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {(['Female', 'Male'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => saveSettings({ voice_gender: g })}
                      className={`p-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                        settings.voice_gender === g
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                          : 'border-white/10 bg-black/30 text-zinc-400'
                      }`}
                    >
                      {g} Tone
                    </button>
                  ))}
                </div>

                {availableVoices.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400">System Voice</label>
                    <select
                      value={settings.voice_id}
                      onChange={(e) => saveSettings({ voice_id: e.target.value })}
                      className="w-full p-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="">Default Recommended Voice</option>
                      {availableVoices.map((v) => (
                        <option key={v.name} value={v.name}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span>Speech Rate</span>
                    <span className="font-mono">{settings.voice_speed.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.75"
                    max="1.35"
                    step="0.05"
                    value={settings.voice_speed}
                    onChange={(e) => saveSettings({ voice_speed: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* F. Toggles */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/10 cursor-pointer">
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-300">Face Tracking HUD</span>
                    <span className="text-[10px] text-zinc-500">Floating camera view & real-time telemetry</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showFaceTrackerWidget}
                    onChange={(e) => setShowFaceTrackerWidget(e.target.checked)}
                    className="accent-cyan-400 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/10 cursor-pointer">
                  <span className="text-xs text-zinc-300">Reduced Motion</span>
                  <input
                    type="checkbox"
                    checked={settings.reduced_motion}
                    onChange={(e) => saveSettings({ reduced_motion: e.target.checked })}
                    className="accent-cyan-400 w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/10 cursor-pointer">
                  <span className="text-xs text-zinc-300">Dark Hologram Theme</span>
                  <input
                    type="checkbox"
                    checked={uiTheme === 'dark'}
                    onChange={(e) => {
                      const next = e.target.checked ? 'dark' : 'light';
                      setUiTheme(next);
                      saveSettings({ theme: next });
                    }}
                    className="accent-cyan-400 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
