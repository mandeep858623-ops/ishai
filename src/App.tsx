/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { UserMode, LogEntry, Contact, IntruderLog } from './types/os';
import { soundEngine, speakText, subscribeSpeech, stopSpeaking } from './utils/audio';
import { MatrixRain } from './components/MatrixRain';
import {
  Mic,
  Box,
  Palette,
  Mail,
  Rocket,
  Image,
  Bot,
  Search,
  Calendar,
  Code,
  Sparkles,
  Video,
  Film,
  Music,
  FileText,
  GraduationCap,
  BarChart2,
  Zap,
  Target,
  Tv,
  Monitor,
  MessageSquare,
  Key,
  Users,
  Wifi,
  Trash2,
  Database,
  Skull,
  Activity,
  CloudSun,
  Cpu,
  Building2,
  Newspaper,
  Gamepad2,
  Dice5,
  HelpCircle,
  Smile,
  Flame,
  BatteryCharging,
  Terminal,
  RotateCcw,
  Clock,
  Lock,
  Globe,
  FileSignature,
  HardDrive,
  SearchCode,
  Calculator,
  Radio,
  Shield,
  Compass,
  CalendarDays,
  Wrench,
  Gauge,
  MapPin,
  Link2,
  Archive,
  RefreshCw,
  EyeOff,
  TrendingUp,
  Volume2,
  Languages,
  Map,
  Camera,
  Scan,
  ShieldAlert,
  MessageCircle,
  PhoneCall,
  Maximize,
  Minimize,
} from 'lucide-react';

import {
  ContactsModal,
  HangmanModal,
  GuessNumberModal,
  ReflexGameModal,
  NotesModal,
  IntruderLogModal,
  ModalWrapper,
} from './components/Modals';
import { AICoreModal } from './components/AICoreModal';
import { WiFiVaultModal } from './components/WiFiVaultModal';
import { ImageCreatorModal } from './components/ImageCreatorModal';
import { VideoCreatorModal } from './components/VideoCreatorModal';
import { MusicPlayerModal } from './components/MusicPlayerModal';
import { ResearchModal } from './components/ResearchModal';
import { SmartPlannerModal } from './components/SmartPlannerModal';
import { AICoderModal } from './components/AICoderModal';
import { LanguageStudio } from './components/tools/LanguageStudio';

import { DocumentPPTMakerModal, ToolType } from './components/DocumentPPTMakerModal';
import { StudyGeniusModal, StudyToolType } from './components/StudyGeniusModal';
import { AIDataAnalystModal, AnalystTab } from './components/AIDataAnalystModal';
import { AIWorkflowAutomatorModal } from './components/AIWorkflowAutomatorModal';
import { AIMemoryVaultModal, VaultNavTab } from './components/AIMemoryVaultModal';
import { FirebaseAuthModal } from './components/FirebaseAuthModal';
import { MyFilesModal } from './components/MyFilesModal';
import { UserProfileMenu } from './components/UserProfileMenu';
import { UserProfile } from '../server/authService';
import { FocusStudioModal } from './components/FocusStudioModal';
import { AIVideoEditorModal } from './components/AIVideoEditorModal';
import { AIImageStudioModal } from './components/AIImageStudio/AIImageStudioModal';
import { UniversalTVRemoteModal } from './components/UniversalTVRemoteModal';
import { AIScreenCompanionModal } from './components/AIScreenCompanionModal';
import { ClockWorkspaceModal } from './components/ClockWorkspace/ClockWorkspaceModal';
import { MapsWorkspaceModal } from './components/Maps/MapsWorkspaceModal';
import { RecipientConsentModal } from './components/Maps/RecipientConsentModal';
import { CyberWorkspaceModal } from './components/Cyber/CyberWorkspaceModal';
import { WhatsAppWorkspaceModal } from './components/WhatsApp/WhatsAppWorkspaceModal';
import { VoiceCallModal } from './components/WhatsApp/VoiceCallModal';
import { CameraModal } from './components/Camera/CameraModal';
import { NewsModal } from './components/NewsModal';
import { StocksWorkspaceModal } from './components/Stocks/StocksWorkspaceModal';
import { FirewallBrowserModal } from './components/Firewall/FirewallBrowserModal';
import { WhatIfEngineModal } from './components/WhatIf/WhatIfEngineModal';
import { LensXModal } from './components/LensX/LensXModal';
import { SpaceXplorerModal } from './components/SpaceXplorer/SpaceXplorerModal';
import { GmailConnectModal } from './components/Gmail/GmailConnectModal';
import { VoiceRecorderModal } from './components/VoiceRecorder/VoiceRecorderModal';
import { GameVerseModal } from './components/GameVerse/GameVerseModal';
import { Sidebar } from './components/Sidebar';
import { VoiceAssistant2 } from './components/VoiceAssistant/VoiceAssistant2';
import { MechanicalLabModal } from './components/Three/MechanicalLabModal';
import { WhiteboardModal } from './components/WhiteboardModal';
import { WeatherModal } from './components/WeatherModal';
import { HoloAIModal } from './components/HoloAI/HoloAIModal';
import { CityverseModal } from './components/CityverseModal';
import { SettingsModal } from './components/SettingsModal';
import { StartupIntroVideo } from './components/StartupIntroVideo';
import { UserSettings } from './types/ishaan';
import { Settings as SettingsIcon } from 'lucide-react';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const DEV_PASS = 'ishai14';
const CONTACTS_KEY = 'Ishai_Contacts';
const NOTES_KEY = 'Ishai_Notes';

export default function App() {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userMode, setUserMode] = useState<UserMode>('GUEST');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // Consent-based Live Location Sharing Invite Detection from URL
  const [recipientInviteToken, setRecipientInviteToken] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('loc_invite') || params.get('share_token') || null;
    } catch {
      return null;
    }
  });

  // Startup Cinematic Video Intro Preference & State
  const [startupIntroEnabled, setStartupIntroEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ishai_startup_intro_enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [showStartupIntro, setShowStartupIntro] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ishai_startup_intro_enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Audio / Speech settings
  const [voiceGender, setVoiceGender] = useState<'Male' | 'Female'>('Male');
  const [audioMuted, setAudioMuted] = useState(false);
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const [voiceAssistantActive, setVoiceAssistantActive] = useState(false);

  // Application Preferences & Settings
  const [userSettings, setUserSettings] = useState<UserSettings>(() => ({
    theme: 'dark',
    responseTone: 'balanced',
    fontSize: 'md',
    speechEnabled: true,
    voiceGender: voiceGender === 'Male' ? 'male' : 'female',
    startupIntroEnabled: startupIntroEnabled,
  }));

  // Automatic Full Screen State & Controls
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const requestFullscreenMode = useCallback(() => {
    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        const elem = document.documentElement as any;
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(() => {});
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen();
        }
      }
    } catch {}
  }, []);

  const toggleFullscreenMode = useCallback(() => {
    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        requestFullscreenMode();
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {}
  }, [requestFullscreenMode]);

  // Track fullscreen changes and enable auto-fullscreen on first user interaction on load
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);

    // Attempt immediately on mount
    requestFullscreenMode();

    // Attach auto-fullscreen trigger on first user gesture anywhere on screen
    const autoFsGesture = () => {
      requestFullscreenMode();
      window.removeEventListener('click', autoFsGesture);
      window.removeEventListener('touchstart', autoFsGesture);
      window.removeEventListener('keydown', autoFsGesture);
    };

    window.addEventListener('click', autoFsGesture, { once: true });
    window.addEventListener('touchstart', autoFsGesture, { once: true });
    window.addEventListener('keydown', autoFsGesture, { once: true });

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      window.removeEventListener('click', autoFsGesture);
      window.removeEventListener('touchstart', autoFsGesture);
      window.removeEventListener('keydown', autoFsGesture);
    };
  }, [requestFullscreenMode]);

  const handleReplayIntro = useCallback(() => {
    soundEngine.playClick();
    setShowStartupIntro(true);
    setStartupIntroEnabled(true);
    try {
      localStorage.setItem('ishai_startup_intro_enabled', 'true');
    } catch {}
  }, []);

  const handleUpdateSettings = useCallback((newSet: Partial<UserSettings>) => {
    setUserSettings((prev) => {
      const next = { ...prev, ...newSet };
      if (newSet.startupIntroEnabled !== undefined) {
        setStartupIntroEnabled(newSet.startupIntroEnabled);
        try {
          localStorage.setItem('ishai_startup_intro_enabled', JSON.stringify(newSet.startupIntroEnabled));
        } catch {}
      }
      if (newSet.voiceGender) {
        setVoiceGender(newSet.voiceGender === 'male' ? 'Male' : 'Female');
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const unsub = subscribeSpeech((speaking, text) => {
      setSpeakingText(speaking ? text : null);
    });
    return unsub;
  }, []);

  // Telemetry HUD state
  const [ramLoad, setRamLoad] = useState(38);
  const [currentTime, setCurrentTime] = useState('');

  // Terminal Logs
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      tag: 'INITIALIZE',
      text: 'ISHAI OS ENVIRONMENT BOOTED COMPLETE. ALL FUNCTION MODULES ROUTED IN-BOX.',
    },
  ]);
  const [commandInput, setCommandInput] = useState('');
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  // Persistent storage state
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem(CONTACTS_KEY) || localStorage.getItem('SuperAI_Contacts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeNote, setActiveNote] = useState<string>(() => {
    try {
      return localStorage.getItem(NOTES_KEY) || localStorage.getItem('SuperAI_Notes') || '--- SECURE INTERNAL MEMORY ALLOCATION ---\n';
    } catch {
      return '--- SECURE INTERNAL MEMORY ALLOCATION ---\n';
    }
  });

  const [intruders, setIntruders] = useState<IntruderLog[]>([]);

  // Modals & Popups
  const [activeModal, setActiveModal] = useState<
    | null
    | 'CONTACTS'
    | 'HANGMAN'
    | 'GUESS_NUM'
    | 'GAME_X'
    | 'NOTES'
    | 'INTRUDERS'
    | 'MATRIX_FULL'
    | 'CALC'
    | 'AI_CORE'
    | 'WIFI_VAULT'
    | 'IMAGE_CREATOR'
    | 'VIDEO_CREATOR'
    | 'MUSIC_PLAYER'
    | 'RESEARCH'
    | 'PLANNER'
    | 'AI_CODER'
    | 'LANGUAGE_STUDIO'
    | 'DOC_PPT_MAKER'
    | 'STUDY_GENIUS'
    | 'DATA_ANALYST'
    | 'WORKFLOW_AUTOMATOR'
    | 'AUTH_MODAL'
    | 'MY_FILES'
    | 'FOCUS_STUDIO'
    | 'AI_VIDEO_EDITOR'
    | 'AI_IMAGE_STUDIO'
    | 'UNIVERSAL_TV_REMOTE'
    | 'AI_SCREEN_COMPANION'
    | 'SETTINGS'

    | 'SAY_PROMPT'
    | 'WEATHER_PROMPT'
    | 'TASK_KILL'
    | 'VAULT'
    | 'SEARCH_PROMPT'
    | 'PASS_GEN'
    | 'CLOCK'
    | 'MAPS'
    | 'CYBER_SECURITY'
    | 'WHATSAPP'
    | 'VOICE_CALL'
    | 'CAMERA'
    | 'NEWS'
    | 'STOCKS'
    | 'FIREWALL'
    | 'WHAT_IF'
    | 'LENS_X'
    | 'SPACE_XPLORER'
    | 'GMAIL'
    | 'VOICE_RECORDER'
    | '3D_LAB'
    | 'WHITEBOARD'
    | 'WEATHER'
    | 'HOLO_AI'
    | 'CITYVERSE'
  >(null);

  // Stealth & Screen Effects
  const [stealthMode, setStealthMode] = useState(false);
  const [screenGlitch, setScreenGlitch] = useState(false);
  const [matrixBackground, setMatrixBackground] = useState(true);

  // Sub-dialog prompt states
  const [promptInput, setPromptInput] = useState('');
  const [toolSearch, setToolSearch] = useState('');
  const [researchInitialTopic, setResearchInitialTopic] = useState('');
  const [activeCall, setActiveCall] = useState<{ targetUser: string, type: 'voice' | 'video' } | null>(null);

  const [initialDocTool, setInitialDocTool] = useState<ToolType>('document');
  const [initialStudyTool, setInitialStudyTool] = useState<StudyToolType>('upload');
  const [initialAnalystTab, setInitialAnalystTab] = useState<AnalystTab>('overview');

  // NEW VOICE CONTROL STATES
  const [coderInitialTab, setCoderInitialTab] = useState<'editor' | 'preview' | 'console'>('editor');
  const [coderInitialAction, setCoderInitialAction] = useState<string>('');
  const [vaultInitialTab, setVaultInitialTab] = useState<VaultNavTab>('all');
  const [gameInitialTab, setGameInitialTab] = useState<'hub' | 'builtin' | 'webportals' | 'aicreator' | 'profile'>('hub');
  const [gameInitialGame, setGameInitialGame] = useState<string>('');
  const [newsInitialTab, setNewsInitialTab] = useState<'home' | 'india' | 'tech' | 'verifier' | 'comparer' | 'briefing' | 'library'>('home');
  const [newsInitialSearch, setNewsInitialSearch] = useState<string>('');
  const [plannerInitialTab, setPlannerInitialTab] = useState<'dashboard' | 'tasks' | 'ai_planner' | 'calendar' | 'projects' | 'settings'>('dashboard');
  const [plannerInitialAction, setPlannerInitialAction] = useState<string>('');
  const [screenCompanionInitialImage, setScreenCompanionInitialImage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get('studio') === 'image' ||
        params.get('feature') === 'image-studio' ||
        window.location.hash.includes('image-studio') ||
        window.location.hash.includes('ai-image-studio')
      ) {
        setActiveModal('AI_IMAGE_STUDIO');
      }
    } catch {}
  }, []);
  // Global Voice Activation listener: "Hey SuperAI" wake-word listener on home page / OS interface
  const [globalVoiceActive, setGlobalVoiceActive] = useState<boolean>(false);
  const [lastVoiceActivity, setLastVoiceActivity] = useState<number>(Date.now());
  const globalSpeechRecRef = useRef<any>(null);

  const toggleGlobalVoiceAssistant = useCallback((forceState?: boolean) => {
    setVoiceAssistantActive((prev) => (forceState !== undefined ? forceState : !prev));
  }, []);

  // Background Wake-word Listener (optional, but requested for "Hey Ishai")
  useEffect(() => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) return;
    
    // We only want background listening if the main assistant is NOT already active
    if (voiceAssistantActive) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const spoken = event.results[event.results.length - 1][0].transcript.toLowerCase();
      if (spoken.includes('hey ishai') || spoken.includes('hi ishai') || spoken.includes('ishai')) {
        setVoiceAssistantActive(true);
        soundEngine.playSuccess();
      }
    };

    recognition.onerror = () => { /* Silent fail for background */ };
    
    try {
      recognition.start();
    } catch {}

    return () => {
      try { recognition.stop(); } catch {}
    };
  }, [voiceAssistantActive]);

  // Global Keyboard Shortcut listener: 
  // Ctrl+Shift+S -> Screen Companion
  // Ctrl+Shift+V -> Toggle Voice Assistant
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          f_screen_companion();
        } else if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          toggleGlobalVoiceAssistant();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [voiceGender, audioMuted, toggleGlobalVoiceAssistant]);

  // Authenticated User State & Persistence (Default to null so Sign In / Register is visible)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('ISHAI_User_Session_v1') || localStorage.getItem('SUPERAI_User_Session_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load user session:', e);
    }
    return null;
  });

  const [authToken, setAuthToken] = useState<string>(() => {
    return localStorage.getItem('ISHAI_Auth_Token_v1') || localStorage.getItem('SUPERAI_Auth_Token_v1') || '';
  });

  const [authModalInitialMode, setAuthModalInitialMode] = useState<'signin' | 'signup' | 'settings'>('signin');

  const handleAuthSuccess = (user: UserProfile, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    try {
      localStorage.setItem('ISHAI_User_Session_v1', JSON.stringify(user));
      localStorage.setItem('ISHAI_Auth_Token_v1', token);
      localStorage.setItem('SUPERAI_User_Session_v1', JSON.stringify(user));
      localStorage.setItem('SUPERAI_Auth_Token_v1', token);
    } catch (e) {
      console.warn('Failed to persist auth session:', e);
    }
  };

  const handleSignOut = () => {
    soundEngine.playClick();
    setCurrentUser(null);
    setAuthToken('');
    localStorage.removeItem('ISHAI_User_Session_v1');
    localStorage.removeItem('ISHAI_Auth_Token_v1');
    localStorage.removeItem('SUPERAI_User_Session_v1');
    localStorage.removeItem('SUPERAI_Auth_Token_v1');
    writeLog('[AUTH] User signed out securely. Session invalidated.', 'SECURITY');
    setAuthModalInitialMode('signin');
    setActiveModal('AUTH_MODAL');
  };

  // Real-time synchronization of Firebase Auth session across tabs and reloads
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          let token = '';
          try {
            token = await fbUser.getIdToken();
          } catch (tokenErr) {
            console.warn('[App] Firebase token service not enabled, using offline session token.');
            token = 'offline_token_' + fbUser.uid;
          }
          const now = new Date().toISOString();
          const profile: UserProfile = {
            uid: fbUser.uid,
            fullName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email || '',
            role: 'user',
            createdAt: fbUser.metadata?.creationTime ? new Date(fbUser.metadata.creationTime).toISOString() : now,
            updatedAt: now,
          };
          setCurrentUser((prev) => {
            if (prev && prev.uid === profile.uid && prev.email === profile.email) {
              return prev;
            }
            return profile;
          });
          setAuthToken((prev) => (prev === token ? prev : token));
          localStorage.setItem('ISHAI_User_Session_v1', JSON.stringify(profile));
          localStorage.setItem('ISHAI_Auth_Token_v1', token);
          window.dispatchEvent(new CustomEvent('vault_updated', { detail: { userId: fbUser.uid } }));
        } catch (e) {
          console.warn('[App] Error syncing auth session:', e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
      // Fluctuate RAM slightly to simulate telemetry load
      setRamLoad((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.min(94, Math.max(22, prev + delta));
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Audio/Voice refs to keep writeLog callback identity stable across all renders
  const audioMutedRef = useRef(audioMuted);
  audioMutedRef.current = audioMuted;
  const voiceGenderRef = useRef(voiceGender);
  voiceGenderRef.current = voiceGender;

  // Log writer with vocalizer - stable identity prevents infinite update depth in child modals
  const writeLog = useCallback((text: string, tag = 'SYSTEM') => {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      tag,
      text,
    };
    setLogs((prev) => [...prev, entry]);
    if (!audioMutedRef.current) {
      speakText(text, voiceGenderRef.current);
    }
  }, []);

  // Webcam Intruder Snapshot
  const captureIntruder = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.createElement('video');
        video.srcObject = stream;
        await video.play();

        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, 640, 480);
          const dataUrl = canvas.toDataURL('image/jpeg');
          const newIntruder: IntruderLog = {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleString(),
            image: dataUrl,
            status: 'CAPTURED_VIA_LOCAL_WEBCAM',
          };
          setIntruders((prev) => [newIntruder, ...prev]);
        }
        stream.getTracks().forEach((track) => track.stop());
      } else {
        throw new Error('Webcam API unavailable');
      }
    } catch {
      // Synthetic fallback capture if camera permission is denied
      const newIntruder: IntruderLog = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString(),
        status: 'SURVEILLANCE_FLAG_RECORDED_NO_CAM_PERM',
      };
      setIntruders((prev) => [newIntruder, ...prev]);
    }
  };

  // Auth Handler
  const handleAuth = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundEngine.playClick();

    const pass = passwordInput.trim().toLowerCase();
    if (pass === 'ishai14' || pass === 'superai14' || pass === DEV_PASS) {
      setUserMode('DEV');
      setIsLoggedIn(true);
      setAuthError(false);
      soundEngine.playSuccess();
      writeLog('Access granted Ishai.', 'SECURITY');
    } else {
      setUserMode('GUEST');
      setIsLoggedIn(true);
      setAuthError(true);
      soundEngine.playAlertBeep();
      writeLog('Intruder alert. Access denied. Entering Guest Sandbox.', 'SECURITY');
      captureIntruder();
    }
  };

  // Bypass Security button
  const handleBypass = () => {
    soundEngine.playClick();
    setUserMode('GUEST');
    setIsLoggedIn(true);
    writeLog('Bypass acknowledged. Initializing restricted GUEST environment.', 'SECURITY');
  };

  // CLI Command processor
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    const cmd = commandInput.trim();
    setCommandInput('');
    executeCommand(cmd);
  };

  // -------------------------------------------------------------
  // ALL 41 MODULE IMPLEMENTATIONS MATCHING PYTHON SCRIPT
  // -------------------------------------------------------------

  const f_audio = () => {
    soundEngine.playClick();
    const next = voiceGender === 'Male' ? 'Female' : 'Male';
    setVoiceGender(next);
    writeLog(`Voice profile updated to ${next}.`, 'CONFIG');
    speakText(`Voice profile switched to ${next}.`, next);
  };


  const testVoice = () => {
    soundEngine.playSuccess();
    setAudioMuted(false);
    speakText('Audio system online. Voice synthesizer active.', voiceGender);
    writeLog('🔊 Audio test triggered. Voice speech synthesizer active.', 'CONFIG');
  };

  const f_ai_image_studio = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('AI Image Studio online. Creative generation, editing, and design workspace ready.', voiceGender);
    }
    writeLog('🎨 AI Image Studio Workspace online. Real text-to-image, natural language photo editing, and multi-layer design canvas initialized.', 'STUDIO');
    setActiveModal('AI_IMAGE_STUDIO');
  };

  const f_image_creator = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('What picture do you want to make?', voiceGender);
    }
    writeLog('🎨 AI Image Creator opened. AI Prompt: "What picture do you want to make?"', 'INTELLIGENCE');
    setActiveModal('IMAGE_CREATOR');
  };

  const f_video_creator = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('What video do you want to create?', voiceGender);
    }
    writeLog('🎬 AI Video Creator opened. AI Prompt: "What video do you want to create?"', 'INTELLIGENCE');
    setActiveModal('VIDEO_CREATOR');
  };

  const f_ai_video_editor = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('AI Video Editor online. Multitrack timeline ready.', voiceGender);
    }
    writeLog('🎥 AI Video Editor Workspace activated. Canva/CapCut-class timeline, canvas compositor, and smart captions online.', 'STUDIO');
    setActiveModal('AI_VIDEO_EDITOR');
  };

  const f_music_player = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('What song do you want to listen to?', voiceGender);
    }
    writeLog('🎵 Music & Song Studio opened. AI Prompt: "What song do you want to listen to?"', 'MUSIC');
    setActiveModal('MUSIC_PLAYER');
  };

  const f_research = (topicParam?: string) => {
    soundEngine.playClick();
    if (topicParam) {
      setResearchInitialTopic(topicParam);
    } else {
      setResearchInitialTopic('');
    }
    if (!audioMuted) {
      speakText('Deep research protocol online. What topic shall we investigate?', voiceGender);
    }
    writeLog('🔬 Autonomous Deep Research Engine activated. Ready for live web and peer-reviewed exploration.', 'INTELLIGENCE');
    setActiveModal('RESEARCH');
  };

  const f_planner = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('Smart Planner online. Your day, organized.', voiceGender);
    }
    writeLog('📅 Smart Planner activated. Daily tasks, AI scheduling, and calendar matrix online.', 'TASK');
    setActiveModal('PLANNER');
  };



  const f_wifi = () => {
    soundEngine.playClick();
    setActiveModal('WIFI_VAULT');
    writeLog('--- WIRELESS CREDENTIAL DECRYPTION ENGINE ---', 'SECURITY');
    writeLog('📶 SSID: HOME_5G_CORE          🔑 PASSWORD: SuperAI_Security#2026', 'DECRYPT');
    writeLog('📶 SSID: WORKSPACE_STATION    🔑 PASSWORD: cyberAlpha!9942', 'DECRYPT');
    writeLog('📶 SSID: STUDIO_FIBER_HIGH_SPEED 🔑 PASSWORD: TurboSpeedPass@882', 'DECRYPT');
    writeLog('📶 SSID: MOBILE_HOTSPOT_PORTABLE 🔑 PASSWORD: superai_personal_99', 'DECRYPT');
    writeLog('📶 SSID: AIRPORT_PUBLIC_VIP   🔑 PASSWORD: [OPEN / UNPROTECTED]', 'DECRYPT');
    writeLog('Wireless credential database decrypted. All passwords revealed in Wi-Fi Vault.', 'SECURITY');
  };

  const f_weather = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('Weather Platform online. Live meteorological telemetry active.', voiceGender);
    }
    writeLog('🌤️ WEATHER Platform initialized. Synoptic meteorological engine online.', 'METEOROLOGY');
    setActiveModal('WEATHER');
  };

  const f_holo_ai = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('Holo AI visual assistant online.', voiceGender);
    }
    writeLog('🤖 HOLO AI 3D Embodied Holographic Assistant activated.', 'HOLO_AI');
    setActiveModal('HOLO_AI');
  };

  const f_cityverse = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('CITYVERSE 3D City Simulator online. Urban topology and infrastructure engine active.', voiceGender);
    }
    writeLog('🏙️ CITYVERSE 3D City Builder & Management Engine initialized. Real-time grid simulation active.', 'CITYVERSE');
    setActiveModal('CITYVERSE');
  };

  const executeWeather = async (city: string) => {
    setActiveModal(null);
    writeLog(`Fetching raw weather data matrix for: ${city.toUpperCase()}...`, 'INTELLIGENCE');
    try {
      const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=3`);
      const txt = await res.text();
      if (txt) {
        writeLog(txt.trim(), 'METEOROLOGY');
      } else {
        writeLog(`Weather: 22°C Clear Skies, Humidity 45%, Wind 12 km/h in ${city}`, 'METEOROLOGY');
      }
    } catch {
      writeLog(`Weather telemetry for ${city}: 21°C, 1014 hPa, Clear Conditions`, 'METEOROLOGY');
    }
  };

  const f_news = async () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('SUPERAI NEWS 2.0 Command Center online.', voiceGender);
    }
    writeLog('📰 Launching SUPERAI NEWS 2.0 — Ultimate AI-Powered News Command Center...', 'INTELLIGENCE');
    setActiveModal('NEWS');
  };

  const f_calc = () => {
    soundEngine.playClick();
    setActiveModal('CALC');
    setPromptInput('45 * 12 / (2 + 3)');
  };

  const executeCalc = (expr: string) => {
    setActiveModal(null);
    try {
      const clean = expr.replace(/[^0-9+\-*/().]/g, '');
      // Evaluate basic arithmetic
      // eslint-disable-next-line no-eval
      const res = Function(`"use strict"; return (${clean})`)();
      writeLog(`Matrix Input: ${expr} -> Evaluation Result: ${res}`, 'COMPUTE');
      soundEngine.playSuccess();
    } catch (e) {
      writeLog(`Computational verification failure: ${String(e)}`, 'ERROR');
      soundEngine.playAlertBeep();
    }
  };

  const f_clock = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('Clock Workspace online. Time management protocols initialized.', voiceGender);
    }
    writeLog('⏰ SUPERAI OS Clock Workspace online. High-precision time, calendar, planner, and AI scheduler synchronized.', 'TIME');
    setActiveModal('CLOCK');
  };

  const f_maps = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('SUPERAI Maps online. Initializing global navigation matrix.', voiceGender);
    }
    writeLog('🗺️ SUPERAI Maps online. High-precision emerald navigation system active.', 'NAV');
    setActiveModal('MAPS');
  };

  const f_cyber = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('SUPERAI Ethical Hacker workstation online. Defense operations active.', voiceGender);
    }
    writeLog('🛡️ SUPERAI Ethical Hacker workstation initialized. Defense & pentest operations online.', 'SECURITY');
    setActiveModal('CYBER_SECURITY');
  };

  const f_contacts = () => {
    soundEngine.playClick();
    setActiveModal('CONTACTS');
  };

  const f_ai = () => {
    soundEngine.playClick();
    setActiveModal('AI_CORE');
  };



  const f_ai_coder = () => {
    soundEngine.playClick();
    setActiveModal('AI_CODER');
  };

  const f_language_studio = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('Language Studio online. How can I help with your languages today?', voiceGender);
    }
    writeLog('🌍 Language Studio initialized.', 'INTELLIGENCE');
    setActiveModal('LANGUAGE_STUDIO');
  };





  const f_doc_ppt_maker = (tool: ToolType = 'document') => {
    soundEngine.playClick();
    setInitialDocTool(tool);
    if (!audioMuted) {
      speakText('Document and Presentation studio initialized.', voiceGender);
    }
    writeLog(`📄 Document & PPT Maker online: Mode [${tool.toUpperCase()}]. Genuine DOCX, PPTX, and PDF generators active.`, 'INTELLIGENCE');
    setActiveModal('DOC_PPT_MAKER');
  };

  const f_study_genius = (tool: StudyToolType = 'upload') => {
    soundEngine.playClick();
    setInitialStudyTool(tool);
    if (!audioMuted) {
      speakText('Study Genius workspace online. Ready to boost learning.', voiceGender);
    }
    writeLog(`🎓 Study Genius workspace initialized: Mode [${tool.toUpperCase()}]. PDF text extraction, AI flashcards, quizzes & tutor active.`, 'INTELLIGENCE');
    setActiveModal('STUDY_GENIUS');
  };

  const f_data_analyst = (tab: AnalystTab = 'overview') => {
    soundEngine.playClick();
    setInitialAnalystTab(tab);
    if (!audioMuted) {
      speakText('AI Data Analyst online. Ready to analyze your spreadsheets.', voiceGender);
    }
    writeLog(`📊 AI Data Analyst workspace initialized: Tab [${tab.toUpperCase()}]. CSV and Excel statistical computation active.`, 'INTELLIGENCE');
    setActiveModal('DATA_ANALYST');
  };

  const f_workflow_automator = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('AI Workflow Automator online. Ready to chain tasks.', voiceGender);
    }
    writeLog('⚡ AI Workflow Automator online. Multi-step task execution engine active.', 'INTELLIGENCE');
    setActiveModal('WORKFLOW_AUTOMATOR');
  };

  const f_focus_studio = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('Focus Studio online. Distraction free workspace ready.', voiceGender);
    }
    writeLog('🎯 Focus Studio initialized. Focus timer, daily goals, and AI coach active.', 'INTELLIGENCE');
    setActiveModal('FOCUS_STUDIO');
  };

  const f_universal_tv_remote = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('Universal TV Remote active. Connect and control your Smart TV.', voiceGender);
    }
    writeLog('📺 Universal TV Remote initialized. Hardware & network adapters online.', 'REMOTE');
    setActiveModal('UNIVERSAL_TV_REMOTE');
  };

  const f_screen_companion = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('AI Screen Companion online. Screenshot analysis and visual guidance ready.', voiceGender);
    }
    writeLog('🖥️ AI Screen Companion initialized. Multimodal vision and step-by-step guidance active.', 'COMPANION');
    setActiveModal('AI_SCREEN_COMPANION');
  };

  const f_whatsapp = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('SUPERAI WhatsApp workspace online. Real-time messaging ready.', voiceGender);
    }
    writeLog('💬 SUPERAI WhatsApp Workspace initialized with Firebase Cloud Firestore & Auth.', 'WHATSAPP');
    setActiveModal('WHATSAPP');
  };

  const f_camera = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('Camera system online. Initializing visual capture unit.', voiceGender);
    }
    writeLog('📸 Camera Workspace activated. Live optics and persistent photo gallery online.', 'VISUAL');
    setActiveModal('CAMERA');
  };

  const f_lensx = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('LENS X visual intelligence system online. Search what you see.', voiceGender);
    }
    writeLog('📸 LENS X — Ultimate Visual Search & Camera Intelligence activated.', 'INTELLIGENCE');
    setActiveModal('LENS_X');
  };

  const f_space = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('Space Xplorer online. Interactive 3D astronomy and sky map active.', voiceGender);
    }
    writeLog('🚀 SPACE XPLORER — Interactive Astronomy & Space Exploration Ecosystem activated.', 'INTELLIGENCE');
    setActiveModal('SPACE_XPLORER');
  };

  const f_gmail = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('Gmail Connect workspace online.', voiceGender);
    }
    writeLog('📧 Launching ISHAI Gmail Connect — Official Google OAuth 2.0 Email Workspace activated.', 'GMAIL');
    setActiveModal('GMAIL');
  };

  const f_voice_recorder = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('Voice Recorder online. Sound studio ready.', voiceGender);
    }
    writeLog('🎙️ Launching ISHAI Voice Recorder — Sound Studio and Personal Audio Vault initialized.', 'STUDIO');
    setActiveModal('VOICE_RECORDER');
  };

  const f_3d_lab = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('3D Mechanical Lab online. Constructing high-fidelity procedural engineering models.', voiceGender);
    }
    writeLog('🛠️ 3D MECHANICAL LAB initialized. Real-time Three.js procedural generation and PBR simulation active.', 'ENGINEERING');
    setActiveModal('3D_LAB');
  };

  const f_whiteboard = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('Whiteboard Studio online. Your infinite creative workspace ready.', voiceGender);
    }
    writeLog('🎨 WHITEBOARD Studio initialized. Infinite canvas and AI design tools online.', 'STUDIO');
    setActiveModal('WHITEBOARD');
  };

  const f_voice_call = (targetUser: string, type: 'voice' | 'video') => {
    soundEngine.playClick();
    setActiveCall({ targetUser, type });
    setActiveModal('VOICE_CALL');
    writeLog(`📞 Initializing ${type} call with ${targetUser}...`, 'COMMUNICATION');
  };

  const f_play_shadow = () => {
    soundEngine.playClick();
    writeLog('🎮 PLAYED: LEVEL 1 SHADOW', 'GAME');
    writeLog('🎮 Played Level 1 Shadow as a stealth operative. Staying still to avoid footstep noise while sneaking past the guards is tense. The tactical map and shadow cloak are cool tools.', 'GAME');
    if (!audioMuted) {
      speakText('Level one shadow complete. Stealth operations successful.', voiceGender);
    }
  };

  const askAiQuestion = async (q: string) => {
    writeLog(`[AI QUERY]: ${q}`, 'INTELLIGENCE');
    const answerEntryId = Math.random().toString(36).substring(2, 9);
    setLogs((prev) => [
      ...prev,
      {
        id: answerEntryId,
        timestamp: new Date().toLocaleTimeString(),
        tag: 'INTELLIGENCE',
        text: '🤖 [AI ANSWER]: ...',
      },
    ]);

    try {
      const res = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q }),
      });

      if (!res.ok || !res.body) {
        const fallbackRes = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: q }),
        });
        let ans = 'Completed.';
        try {
          const raw = await fallbackRes.text();
          if (raw && raw.trim()) {
            const data = JSON.parse(raw);
            ans = data.answer || raw;
          }
        } catch {
          ans = 'System operation processed.';
        }
        setLogs((prev) =>
          prev.map((l) => (l.id === answerEntryId ? { ...l, text: `🤖 [AI ANSWER]: ${ans}` } : l))
        );
        if (!audioMuted) speakText(ans, voiceGender);
        soundEngine.playSuccess();
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
                setLogs((prev) =>
                  prev.map((l) =>
                    l.id === answerEntryId ? { ...l, text: `🤖 [AI ANSWER]: ${currentText}` } : l
                  )
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
        if (!audioMuted) speakText(accumulated, voiceGender);
      }
    } catch (err: any) {
      setLogs((prev) =>
        prev.map((l) =>
          l.id === answerEntryId
            ? { ...l, tag: 'ERROR', text: `[-] Query failed: ${err.message || 'Network error'}` }
            : l
        )
      );
      soundEngine.playAlertBeep();
    }
  };

  const f_say = () => {
    soundEngine.playClick();
    setActiveModal('SAY_PROMPT');
    setPromptInput('');
  };

  const executeSay = (txt: string) => {
    setActiveModal(null);
    writeLog(txt, 'VIRTUAL');
  };

  const f_crack = () => {
    soundEngine.playClick();
    writeLog('Initializing hardware cryptographic crack simulator...', 'SECURITY');
    setTimeout(() => {
      writeLog('Target SHA-256 Digest: e1f868d40767db326fa2a188f54c9c10fdf4ea8e7b936d85a0c3291845183db7', 'HASH');
      writeLog('Entropy Analysis: 256 bits | Rainbow Matrix: Matched', 'SECURITY');
      writeLog('Decrypted Cleartext Key: superai14', 'CRACK_RESULT');
      writeLog('Security decrypt signature trace complete.', 'SECURITY');
      soundEngine.playSuccess();
    }, 600);
  };

  const f_clean = () => {
    soundEngine.playClick();
    writeLog('Executing complete environment temporary partition flush...', 'SYSTEM');
    setTimeout(() => {
      writeLog('Flushed temporary DOM buffers and session caches.', 'SYSTEM');
      writeLog('Operational purge resolved. 412 MB unallocated memory recovered.', 'SYSTEM');
      soundEngine.playSuccess();
    }, 600);
  };

  const f_memory_vault = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('AI Memory Vault online. Knowledge base ready.', voiceGender);
    }
    writeLog('🧠 AI Memory Vault online. Grounded knowledge search and document hub active.', 'DATABASE');
    setActiveModal('VAULT');
  };

  const f_tasks = () => {
    soundEngine.playClick();
    setActiveModal('TASK_KILL');
  };

  const executeTaskKill = (proc: string) => {
    setActiveModal(null);
    writeLog(`Kill command transmitted to target image allocation: ${proc}`, 'SYSTEM');
    soundEngine.playSuccess();
  };

  const f_health = () => {
    soundEngine.playClick();
    const perf = (performance as unknown as { memory?: { totalJSHeapSize: number; usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    const usedMB = perf ? Math.round(perf.usedJSHeapSize / (1024 * 1024)) : 142;
    const totalMB = perf ? Math.round(perf.totalJSHeapSize / (1024 * 1024)) : 256;
    writeLog(`🧠 RAM HEALTH MATRIX:`, 'TELEMETRY');
    writeLog(` -> Volatile Allocation Strain: ${ramLoad}%`, 'TELEMETRY');
    writeLog(` -> Heap Allocation Used: ${usedMB} MB / ${totalMB} MB`, 'TELEMETRY');
    writeLog(` -> Hard Physical Memory Total: 16384 MB`, 'TELEMETRY');
  };

  const f_ludo = () => {
    soundEngine.playClick();
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    writeLog(`🎲 [LUDO MATRIX SIMULATOR] Rolled Vector: [${d1}] and [${d2}] -> Total Leap: ${d1 + d2}`, 'GAME');
    soundEngine.playSuccess();
  };

  const f_hang = () => {
    soundEngine.playClick();
    setActiveModal('HANGMAN');
  };

  const f_guess = () => {
    soundEngine.playClick();
    setActiveModal('GUESS_NUM');
  };

  const f_boom = () => {
    soundEngine.playAlertBeep();
    writeLog('CRITICAL FAULT SIMULATION TRIGGERED: SYSTEM GLITCH IN PROGRESS...', 'ALERT');
    setScreenGlitch(true);
    setTimeout(() => {
      setScreenGlitch(false);
      writeLog('Core safety interlocks contained simulated meltdown.', 'SYSTEM');
    }, 1800);
  };

  const f_bat = async () => {
    soundEngine.playClick();
    try {
      const getBattery = (navigator as unknown as { getBattery?: () => Promise<{ level: number; charging: boolean }> }).getBattery;
      if (getBattery) {
        const b = await getBattery();
        const pct = Math.round(b.level * 100);
        writeLog(`Power Management Matrix: Cells registered at ${pct}% (${b.charging ? 'Charging' : 'On Battery'}).`, 'SYSTEM');
      } else {
        writeLog('Power Management Matrix: Cells registered at 88% remaining. AC Node Connected.', 'SYSTEM');
      }
    } catch {
      writeLog('Power Management Matrix: Cells registered at 92% nominal charge.', 'SYSTEM');
    }
  };

  const f_matrix = () => {
    soundEngine.playClick();
    setActiveModal('MATRIX_FULL');
  };

  const f_reboot = () => {
    soundEngine.playClick();
    writeLog('Soft flushing execution workspace... Re-orienting terminal interface layout wrapper.', 'SYSTEM');
    setTimeout(() => {
      setIsLoggedIn(false);
      setPasswordInput('');
    }, 900);
  };

  const f_passgen = () => {
    soundEngine.playClick();
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~';
    let token = '';
    for (let i = 0; i < 20; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    writeLog(`🔑 [COMPLIANCE STRING GENERATOR] Buffered token sequence: ${token}`, 'SECURITY');
    soundEngine.playSuccess();
  };

  const f_ip = async () => {
    soundEngine.playClick();
    writeLog('🌐 Querying WAN architecture gateway node information...', 'NETWORK');
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      writeLog(`[+] Public Interface WAN Node Pointer: ${data.ip}`, 'NETWORK');
    } catch {
      writeLog('[+] Public Interface WAN Node Pointer: 104.28.19.42 (Routed via Cloudflare Gateway)', 'NETWORK');
    }
  };

  const f_note = () => {
    soundEngine.playClick();
    setActiveModal('NOTES');
  };

  const f_scan = () => {
    soundEngine.playClick();
    const storageSize = JSON.stringify(localStorage).length;
    writeLog(`📁 Local Storage Block Analysis: ${Math.round(storageSize / 1024)} KB data allocated.`, 'FILES');
    writeLog(` -> [DOM] ${document.title} Active`, 'FILES');
  };

  const f_search = () => {
    soundEngine.playClick();
    setActiveModal('SEARCH_PROMPT');
    setPromptInput('');
  };

  const executeSearch = (q: string) => {
    setActiveModal(null);
    if (q.trim()) {
      window.open(`https://google.com/search?q=${encodeURIComponent(q.trim())}`, '_blank');
      writeLog(`Dispatched global search indexing pipeline for: "${q}"`, 'NETWORK');
    }
  };

  const f_ports = () => {
    soundEngine.playClick();
    const conn = (navigator as any).connection;
    writeLog(`📡 Network Status: ${navigator.onLine ? 'ONLINE' : 'OFFLINE'} | Latency: ${conn ? conn.rtt : 'N/A'}ms`, 'NETWORK');
  };

  const f_fire = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('ISHAI Firewall Universal In-App Internet Workspace online.', voiceGender);
    }
    writeLog('🛡️ ISHAI Firewall — Ultimate Universal In-App Internet Experience activated.', 'SECURITY');
    setActiveModal('FIREWALL');
  };

  const f_whatif = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('SUPERAI What If Engine online. Explore impossible possibilities.', voiceGender);
    }
    writeLog('🌌 SUPERAI — What If? Engine activated.', 'INTELLIGENCE');
    setActiveModal('WHAT_IF');
  };

  const f_game2 = () => {
    soundEngine.playClick();
    setActiveModal('GAME_X');
  };

  const f_cpu = () => {
    soundEngine.playClick();
    const cores = navigator.hardwareConcurrency || 8;
    writeLog('💻 LOGIC HOST PROFILES:', 'HARDWARE');
    writeLog(` -> Processor Unit Architecture Type: x86_64 / ARMv8 Hybrid`, 'HARDWARE');
    writeLog(` -> Core Logical Threads: ${cores} Threads Active`, 'HARDWARE');
    writeLog(` -> Base Platform Kernel: ${navigator.platform} (${navigator.userAgent.split(' ')[0]})`, 'HARDWARE');
  };

  const f_cal = () => {
    soundEngine.playClick();
    const today = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    writeLog(`Calendar timeline vector verification: ${today}`, 'SYSTEM');
  };

  const f_reg = () => {
    soundEngine.playClick();
    writeLog('Virtual system environment sandbox constraints active: Registry branch manipulation bypassed.', 'SECURITY');
  };

  const f_speed = () => {
    soundEngine.playClick();
    writeLog('🚀 Bandwidth transfer capability matrix: Transmitting at 14ms latency response to nearest cloud host node.', 'NETWORK');
    writeLog('Downlink throughput: 942.5 Mbps | Jitter: 0.8ms', 'NETWORK');
  };

  const f_loc = () => {
    soundEngine.playClick();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          writeLog(`📍 Geographic tracking node: Lat ${pos.coords.latitude.toFixed(4)}, Lon ${pos.coords.longitude.toFixed(4)} (Accuracy ±${Math.round(pos.coords.accuracy)}m)`, 'LOCATION');
        },
        () => {
          writeLog('Geographic tracking location indicators successfully masked behind proxy layers.', 'SECURITY');
        }
      );
    } else {
      writeLog('Geographic tracking location indicators successfully masked behind software layout layers.', 'SECURITY');
    }
  };

  const f_crypto = async () => {
    soundEngine.playClick();
    writeLog('⛓️ Querying decentralized token reference tracker...', 'FINANCE');
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd');
      const data = await res.json();
      writeLog(`BTC: $${data.bitcoin?.usd?.toLocaleString() || '95,400'} | ETH: $${data.ethereum?.usd?.toLocaleString() || '3,450'} | SOL: $${data.solana?.usd?.toLocaleString() || '220'}`, 'FINANCE');
    } catch {
      writeLog('BTC: $95,240 USD (+2.4%) | ETH: $3,480 USD (+1.8%) | SOL: $218 USD (+4.1%)', 'FINANCE');
    }
  };

  const f_backup = () => {
    soundEngine.playClick();
    const backupData = {
      timestamp: new Date().toISOString(),
      userMode,
      contacts,
      activeNote,
      intruders,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ishai_Backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    writeLog('Redundancy configurations successfully duplicated to disk (Ishai_Backup.json).', 'DATABASE');
    soundEngine.playSuccess();
  };

  const f_empty = () => {
    soundEngine.playClick();
    if (userMode !== 'DEV') {
      soundEngine.playAlertBeep();
      writeLog('Access Blocked: Elevated structural clearance (DEV) required to flush memory block tables.', 'ERROR');
      return;
    }
    writeLog('Host structural recycling cache space indicators successfully purged.', 'SYSTEM');
    soundEngine.playSuccess();
  };

  const f_boost = () => {
    soundEngine.playClick();
    writeLog('Workspace page allocation tracking parameters optimized. Processing efficiency increased.', 'SYSTEM');
    setRamLoad((prev) => Math.max(20, prev - 15));
    soundEngine.playSuccess();
  };

  const f_stealth = () => {
    soundEngine.playClick();
    setStealthMode((prev) => !prev);
    writeLog(`Operational tracking footprint signatures masked behind localized loop variables. (Stealth: ${!stealthMode ? 'ENABLED' : 'DISABLED'})`, 'SECURITY');
  };

  const f_stocks = () => {
    soundEngine.playClick();
    if (!audioMuted) {
      speakText('SUPERAI Stocks Ultimate Financial Intelligence Platform online.', voiceGender);
    }
    writeLog('📈 SUPERAI Stocks — Ultimate Financial Intelligence Platform activated.', 'FINANCE');
    setActiveModal('STOCKS');
  };

  const executeCommand = useCallback((cmd: string) => {
    soundEngine.playClick();
    writeLog(`> ${cmd}`, 'USER_EXEC');

    const lower = cmd.toLowerCase();
    if (lower === 'help') {
      writeLog(
        'Available Direct Commands: help, clear, wifi, weather, news, calc, contacts, notes, hang, guess, ludo, bat, matrix, ip, speed, cpu, restart, shadow',
        'SYSTEM'
      );
    } else if (lower === 'clear') {
      setLogs([]);
    } else if (lower === 'shadow') {
      f_play_shadow();
    } else if (lower.startsWith('say ')) {
      const phrase = cmd.substring(4);
      writeLog(phrase, 'VIRTUAL');
    } else if (lower === 'wifi') {
      f_wifi();
    } else if (
      lower === 'weather' ||
      lower === 'forecast' ||
      lower === 'radar' ||
      lower === 'rain' ||
      lower === 'temperature' ||
      lower === 'meteorology' ||
      lower === 'climate'
    ) {
      f_weather();
    } else if (
      lower === 'holo' ||
      lower === 'holoai' ||
      lower === 'holo ai' ||
      lower === 'avatar' ||
      lower === 'assistant' ||
      lower === '3d assistant'
    ) {
      f_holo_ai();
    } else if (
      lower === 'cityverse' ||
      lower === 'city' ||
      lower === 'city simulator' ||
      lower === 'city builder' ||
      lower === '3d city' ||
      lower === 'metropolis'
    ) {
      f_cityverse();
    } else if (lower === 'news') {
      f_news();
    } else if (
      lower === 'intro' ||
      lower === 'replay intro' ||
      lower === 'play intro' ||
      lower === 'watch intro' ||
      lower === 'start intro' ||
      lower === 'intro video'
    ) {
      handleReplayIntro();
    } else if (lower === 'stocks') {
      f_stocks();
    } else if (lower === 'firewall') {
      f_fire();
    } else if (lower === 'whatif' || lower === 'what if') {
      f_whatif();
    } else if (
      lower === 'space' ||
      lower === 'spacexplorer' ||
      lower === 'space xplorer' ||
      lower === 'astronomy' ||
      lower === 'sky' ||
      lower === 'skymap' ||
      lower === 'sky map' ||
      lower === 'solar system' ||
      lower === 'planets'
    ) {
      f_space();
    } else if (lower === 'lensx' || lower === 'lens x' || lower === 'lens') {
      f_lensx();
    } else if (lower === 'gmail' || lower === 'mail' || lower === 'email' || lower === 'compose') {
      f_gmail();
    } else if (
      lower === 'voicerecorder' ||
      lower === 'voice recorder' ||
      lower === 'recorder' ||
      lower === 'record' ||
      lower === 'voice note' ||
      lower === 'voicenote' ||
      lower === 'audio record' ||
      lower === 'sound studio'
    ) {
      f_voice_recorder();
    } else if (
      lower === 'lab' ||
      lower === '3d' ||
      lower === '3d lab' ||
      lower === 'mechanical lab' ||
      lower === '3d mechanical lab' ||
      lower === 'mechanical' ||
      lower === 'construct' ||
      lower === 'engineering'
    ) {
      f_3d_lab();
    } else if (
      lower === 'whiteboard' ||
      lower === 'board' ||
      lower === 'canvas' ||
      lower === 'sketch' ||
      lower === 'draw' ||
      lower === 'infinite canvas' ||
      lower === 'white board'
    ) {
      f_whiteboard();
    } else if (lower === 'hang') {
      setActiveModal('HANGMAN');
    } else if (lower === 'guess') {
      setActiveModal('GUESS_NUM');
    } else if (lower === 'ludo') {
      f_ludo();
    } else if (lower === 'bat') {
      f_bat();
    } else if (lower === 'matrix') {
      setActiveModal('MATRIX_FULL');
    } else if (lower === 'restart' || lower === 'reboot') {
      f_reboot();
    } else if (lower === 'contacts') {
      setActiveModal('CONTACTS');
    } else if (lower === 'notes') {
      setActiveModal('NOTES');
    } else if (lower === 'ip') {
      f_ip();
    } else if (lower === 'ai' || lower === 'chat') {
      f_ai();
    } else if (
      lower === 'studio' ||
      lower === 'image studio' ||
      lower === 'imagestudio' ||
      lower === 'ai image studio' ||
      lower === 'poster' ||
      lower === 'posters' ||
      lower === 'thumbnail' ||
      lower === 'thumbnails' ||
      lower === 'logo' ||
      lower === 'logos' ||
      lower === 'wallpaper' ||
      lower === 'wallpapers'
    ) {
      f_ai_image_studio();
    } else if (lower === 'image' || lower === 'images' || lower === 'real photo' || lower === 'real photos' || lower === 'photo' || lower === 'photos') {
      f_image_creator();
    } else if (lower === 'creator' || lower === 'image creator' || lower === 'art' || lower === 'draw' || lower === 'picture' || lower === 'paint') {
      f_image_creator();
    } else if (lower.startsWith('draw ') || lower.startsWith('art ') || lower.startsWith('make image ') || lower.startsWith('create image ')) {
      f_image_creator();

    } else if (lower === 'video' || lower === 'videos' || lower === 'video creator' || lower === 'movie' || lower === 'clip' || lower === 'film') {
      f_video_creator();
    } else if (lower.startsWith('video ') || lower.startsWith('make video ') || lower.startsWith('create video ') || lower.startsWith('generate video ')) {
      f_video_creator();

    } else if (lower === 'music' || lower === 'song' || lower === 'songs' || lower === 'player' || lower === 'play' || lower === 'audio') {
      f_music_player();
    } else if (lower.startsWith('play ') || lower.startsWith('music ') || lower.startsWith('song ')) {
      f_music_player();

    } else if (lower === 'research' || lower === 'deep research' || lower === 'study' || lower === 'investigate' || lower === 'deepresearch') {
      f_research();
    } else if (lower.startsWith('research ') || lower.startsWith('deep research ') || lower.startsWith('study ') || lower.startsWith('investigate ')) {
      const target = cmd.replace(/^(research|deep research|study|investigate)\s+/i, '').trim();
      f_research(target);

    } else if (lower === 'studio' || lower === 'language' || lower === 'languages' || lower === 'language studio') {
      f_language_studio();
    } else if (lower === 'whatsapp' || lower === 'messages' || lower === 'message' || lower === 'chat') {
      f_whatsapp();
    } else if (lower.startsWith('sms ') || lower.startsWith('msg ') || lower.startsWith('message ') || lower.startsWith('text ')) {
      writeLog('Messaging features have been removed by user request.', 'SECURITY');
    } else if (lower === 'doc' || lower === 'docs' || lower === 'document' || lower === 'maker' || lower === 'docmaker' || lower === 'document maker') {
      f_doc_ppt_maker('document');
    } else if (lower === 'ppt' || lower === 'presentation' || lower === 'slides' || lower === 'slide' || lower === 'powerpoint') {
      f_doc_ppt_maker('presentation');
    } else if (lower === 'pdf' || lower === 'pdf maker') {
      f_doc_ppt_maker('pdf');
    } else if (lower === 'resume' || lower === 'cv' || lower === 'resume maker') {
      f_doc_ppt_maker('resume');
    } else if (lower === 'report' || lower === 'report maker') {
      f_doc_ppt_maker('report');
    } else if (lower === 'worksheet' || lower === 'worksheet maker') {
      f_doc_ppt_maker('worksheet');
    } else if (lower === 'letter' || lower === 'application' || lower === 'letter maker') {
      f_doc_ppt_maker('letter');
    } else if (lower === 'school project' || lower === 'project maker') {
      f_doc_ppt_maker('school_project');
    } else if (lower === 'notes' || lower === 'study' || lower === 'study material') {
      f_doc_ppt_maker('notes');
    } else if (lower === 'studygenius' || lower === 'genius' || lower === 'study genius') {
      f_study_genius('upload');
    } else if (lower === 'flashcards' || lower === 'flashcard' || lower === 'deck') {
      f_study_genius('flashcards');
    } else if (lower === 'quiz' || lower === 'quizzes') {
      f_study_genius('quiz');
    } else if (lower === 'tutor' || lower === 'socratic' || lower === 'solve') {
      f_study_genius('tutor');
    } else if (lower === 'asknotes' || lower === 'ask notes' || lower === 'ask pdf') {
      f_study_genius('ask_notes');
    } else if (lower === 'analyst' || lower === 'data' || lower === 'dataanalyst' || lower === 'data analyst' || lower === 'csv' || lower === 'excel' || lower === 'spreadsheet') {
      f_data_analyst('overview');
    } else if (lower === 'askdata' || lower === 'ask data') {
      f_data_analyst('ask_data');
    } else if (lower === 'charts' || lower === 'chart' || lower === 'plot') {
      f_data_analyst('charts');
    } else if (lower === 'stats' || lower === 'statistics' || lower === 'correlation') {
      f_data_analyst('statistics');
    } else if (lower === 'quality' || lower === 'clean' || lower === 'data quality') {
      f_data_analyst('quality');
    } else if (lower === 'workflow' || lower === 'automator' || lower === 'workflows' || lower === 'automate' || lower === 'pipeline') {
      f_workflow_automator();
    } else if (lower === 'focus' || lower === 'focusstudio' || lower === 'focus studio' || lower === 'pomodoro' || lower === 'productivity' || lower === 'timer') {
      f_focus_studio();
    } else if (lower === 'vault' || lower === 'memory' || lower === 'memories' || lower === 'knowledge' || lower === 'memoryvault' || lower === 'memory vault') {
      f_memory_vault();
    } else if (lower === 'login' || lower === 'signin' || lower === 'signup' || lower === 'register' || lower === 'auth' || lower === 'profile' || lower === 'account') {
      setAuthModalInitialMode('signin');
      setActiveModal('AUTH_MODAL');
    } else if (lower === 'myfiles' || lower === 'files' || lower === 'storage' || lower === 'my files' || lower === 'user files') {
      setActiveModal('MY_FILES');
    } else if (lower === 'logout' || lower === 'signout') {
      handleSignOut();
    } else if (
      lower === 'planner' ||
      lower === 'smart planner' ||
      lower === 'smartplanner' ||
      lower === 'tasks' ||
      lower === 'todo' ||
      lower === 'todos' ||
      lower === 'schedule' ||
      lower === 'timetable'
    ) {
      f_planner();
    } else if (
      lower === 'clock' ||
      lower === 'time' ||
      lower === 'watch' ||
      lower === 'calendar' ||
      lower === 'alarms' ||
      lower === 'world clock' ||
      lower === 'stopwatch' ||
      lower === 'timer' ||
      lower === 'focus' ||
      lower === 'routines' ||
      lower === 'journal' ||
      lower === 'notes'
    ) {
      f_clock();
    } else if (
      lower === 'maps' ||
      lower === 'map' ||
      lower === 'navigation' ||
      lower === 'gps' ||
      lower === 'route' ||
      lower === 'trip' ||
      lower === 'travel' ||
      lower === 'explore'
    ) {
      f_maps();
    } else if (
      lower === 'cyber' ||
      lower === 'hack' ||
      lower === 'hacker' ||
      lower === 'ethical' ||
      lower === 'pentest' ||
      lower === 'security' ||
      lower === 'ethical hacker' ||
      lower === 'cyber security' ||
      lower === 'ctf' ||
      lower === 'terminal' ||
      lower === 'forensics'
    ) {
      f_cyber();
    } else if (lower.startsWith('plan ') || lower.startsWith('planner ') || lower.startsWith('schedule ') || lower.startsWith('todo ')) {
      f_planner();

    } else if (lower === 'tv' || lower === 'remote' || lower === 'tv remote' || lower === 'universal tv remote' || lower === 'tvremote' || lower === 'smart tv') {
      f_universal_tv_remote();
    } else if (lower === 'screen' || lower === 'companion' || lower === 'ai screen companion' || lower === 'screen companion' || lower === 'screenshot' || lower === 'screen analysis') {
      f_screen_companion();
    } else if (lower.startsWith('ai ') || lower.startsWith('ask ') || lower.startsWith('? ')) {
      const q = cmd.replace(/^(ai|ask|\?)\s+/i, '');
      askAiQuestion(q);
    } else if (cmd.includes('?') || /^(what|why|how|who|where|when|can|explain|tell|is|are)\b/i.test(cmd)) {
      askAiQuestion(cmd);
    }
  }, [
    writeLog, 
    soundEngine, 
    askAiQuestion, 
    setActiveModal, 
    handleSignOut, 
    setLogs, 
    setAuthModalInitialMode,
    f_play_shadow,
    f_wifi,
    f_weather,
    f_news,
    f_ludo,
    f_bat,
    f_reboot,
    f_ip,
    f_ai,
    f_ai_image_studio,
    f_image_creator,
    f_video_creator,
    f_music_player,
    f_research,
    f_language_studio,
    f_whatsapp,
    f_doc_ppt_maker,
    f_study_genius,
    f_data_analyst,
    f_workflow_automator,
    f_focus_studio,
    f_memory_vault,
    f_planner,
    f_clock,
    f_maps,
    f_cyber,
    f_universal_tv_remote,
    f_screen_companion,
    f_space,
    f_lensx,
    f_stocks,
    f_fire,
    f_whatif,
    f_gmail,
    f_voice_recorder
  ]);

  // Tools manifest
  const tools = useMemo(() => [
    { name: '🎙️ VOICE RECORDER', cmd: f_voice_recorder, icon: Mic },
    { name: '🛠️ 3D MECHANICAL LAB', cmd: f_3d_lab, icon: Box },
    { name: '🎨 WHITEBOARD', cmd: f_whiteboard, icon: Palette },
    { name: '📧 GMAIL CONNECT', cmd: f_gmail, icon: Mail },
    { name: '🚀 SPACE XPLORER', cmd: f_space, icon: Rocket },
    { name: '🎨 AI IMAGE STUDIO', cmd: f_ai_image_studio, icon: Image },
    { name: '🤖 AI CHAT', cmd: f_ai, icon: Bot },
    { name: '🔬 DEEP RESEARCH', cmd: () => f_research(), icon: Search },
    { name: '📅 SMART PLANNER', cmd: f_planner, icon: Calendar },
    { name: '⚡ AI CODER', cmd: f_ai_coder, icon: Code },
    { name: '🎨 IMAGE CREATOR', cmd: f_image_creator, icon: Sparkles },
    { name: '🎬 VIDEO CREATOR', cmd: f_video_creator, icon: Video },
    { name: '🎥 AI VIDEO EDITOR', cmd: f_ai_video_editor, icon: Film },
    { name: '🎵 MUSIC PLAYER', cmd: f_music_player, icon: Music },

    { name: '📑 DOC & PPT MAKER', cmd: () => f_doc_ppt_maker('document'), icon: FileText },
    { name: '🎓 STUDY GENIUS', cmd: () => f_study_genius('upload'), icon: GraduationCap },
    { name: '📊 AI DATA ANALYST', cmd: () => f_data_analyst('overview'), icon: BarChart2 },
    { name: '⚡ WORKFLOW AUTOMATOR', cmd: f_workflow_automator, icon: Zap },
    { name: '🎯 FOCUS STUDIO', cmd: f_focus_studio, icon: Target },
    { name: '📺 UNIVERSAL TV REMOTE', cmd: f_universal_tv_remote, icon: Tv },
    { name: '🖥️ AI SCREEN COMPANION', cmd: f_screen_companion, icon: Monitor },

    { name: '🗣️ SAY', cmd: f_say, icon: MessageSquare },
    { name: '🔑 FIND PASS', cmd: f_crack, icon: Key },
    { name: '📁 CONTACTS', cmd: f_contacts, icon: Users },
    { name: '📡 WIFI CRACK', cmd: f_wifi, icon: Wifi },
    { name: '🧹 SYS PURGE', cmd: f_clean, icon: Trash2 },
    { name: '🧠 AI MEMORY VAULT', cmd: f_memory_vault, icon: Database },
    { name: '💀 TASK KILL', cmd: f_tasks, icon: Skull },
    { name: '🧠 RAM HEALTH', cmd: f_health, icon: Activity },
    { name: '🌤️ WEATHER', cmd: f_weather, icon: CloudSun },
    { name: '🤖 HOLO AI', cmd: f_holo_ai, icon: Cpu },
    { name: '🏙️ CITYVERSE 3D', cmd: f_cityverse, icon: Building2 },
    { name: '📰 TECH NEWS', cmd: f_news, icon: Newspaper },
    { name: '🎲 MINI LUDO', cmd: f_ludo, icon: Dice5 },
    { name: '🔠 HANGMAN', cmd: f_hang, icon: HelpCircle },
    { name: '🎯 GUESS NUM', cmd: f_guess, icon: Smile },
    { name: '💣 BOOM', cmd: f_boom, icon: Flame },
    { name: '🔋 BATTERY', cmd: f_bat, icon: BatteryCharging },
    { name: '📺 MATRIX RAIN', cmd: f_matrix, icon: Terminal },
    { name: '🔄 RESTART', cmd: f_reboot, icon: RotateCcw },
    { name: '🕒 CLOCK', cmd: f_clock, icon: Clock },
    { name: '🔑 PASS GEN', cmd: f_passgen, icon: Lock },
    { name: '🌐 IP TRACE', cmd: f_ip, icon: Globe },
    { name: '📝 SECURE NOTE', cmd: f_note, icon: FileSignature },
    { name: '📁 SCAN ROOT', cmd: f_scan, icon: HardDrive },
    { name: '🔍 SEARCH', cmd: f_search, icon: SearchCode },
    { name: '🧮 CALC', cmd: f_calc, icon: Calculator },
    { name: '📡 PORT SCAN', cmd: f_ports, icon: Radio },
    { name: '🛡️ FIREWALL', cmd: f_fire, icon: Shield },
    { name: '🌌 WHAT IF? ENGINE', cmd: f_whatif, icon: Compass },
    { name: '🎮 GAME X', cmd: f_game2, icon: Gamepad2 },
    { name: '💻 CPU INFO', cmd: f_cpu, icon: Cpu },
    { name: '📅 CALENDAR', cmd: f_cal, icon: CalendarDays },
    { name: '🛠️ REGEDIT', cmd: f_reg, icon: Wrench },
    { name: '🚀 SPEED TEST', cmd: f_speed, icon: Gauge },
    { name: '📍 LOCATION', cmd: f_loc, icon: MapPin },
    { name: '⛓️ CRYPTO', cmd: f_crypto, icon: Link2 },
    { name: '📂 BACKUP', cmd: f_backup, icon: Archive },
    { name: '🗑️ RECYCLE', cmd: f_empty, icon: RefreshCw },
    { name: '⚡ BOOST RAM', cmd: f_boost, icon: Zap },
    { name: '🕵️ STEALTH', cmd: f_stealth, icon: EyeOff },
    { name: '📉 STOCKS', cmd: f_stocks, icon: TrendingUp },
    { name: '🎵 AUDIO', cmd: f_audio, icon: Volume2 },
    { name: '🌍 LANGUAGE STUDIO', cmd: f_language_studio, icon: Languages },
    { name: '🗺️ ISHAI MAPS', cmd: f_maps, icon: Map },
    { name: '📸 CAMERA', cmd: f_camera, icon: Camera },
    { name: '📸 LENS X', cmd: f_lensx, icon: Scan },
    { name: '🛡️ ETHICAL HACKER', cmd: f_cyber, icon: ShieldAlert },
    { name: '💬 WHATSAPP', cmd: f_whatsapp, icon: MessageCircle },
    { name: '📞 VOICE CALL', cmd: () => f_voice_call('Friend', 'voice'), icon: PhoneCall },
  ], [f_cityverse, f_holo_ai, f_3d_lab, f_voice_recorder, f_gmail, f_space, f_ai_image_studio, f_ai, f_research, f_planner, f_ai_coder, f_image_creator, f_video_creator, f_ai_video_editor, f_music_player, f_doc_ppt_maker, f_study_genius, f_data_analyst, f_workflow_automator, f_focus_studio, f_universal_tv_remote, f_screen_companion, f_say, f_crack, f_contacts, f_wifi, f_clean, f_memory_vault, f_tasks, f_health, f_weather, f_news, f_ludo, f_hang, f_guess, f_boom, f_bat, f_matrix, f_reboot, f_clock, f_passgen, f_ip, f_note, f_scan, f_search, f_calc, f_ports, f_fire, f_whatif, f_game2, f_cpu, f_cal, f_reg, f_speed, f_loc, f_crypto, f_backup, f_empty, f_boost, f_stealth, f_stocks, f_audio, f_language_studio, f_maps, f_camera, f_lensx, f_cyber, f_whatsapp, f_voice_call]);


  const onExecuteVoiceAction = useCallback((action: string, params: any) => {
    let rawTarget = (params.target || '').toLowerCase().trim();
    
    // Hindi Normalization
    const hindiMappings: Record<string, string> = {
      'kholo': 'open',
      'chalao': 'open',
      'dikhau': 'show',
      'on karo': 'on',
      'band karo': 'close',
      'piche': 'back',
      'aage': 'forward'
    };
    Object.entries(hindiMappings).forEach(([hindi, eng]) => {
      if (rawTarget.includes(hindi)) rawTarget = rawTarget.replace(hindi, eng).trim();
    });

    // Reset initial states
    setCoderInitialTab('editor');
    setCoderInitialAction('');
    setVaultInitialTab('all');
    setGameInitialTab('hub');
    setGameInitialGame('');
    setNewsInitialTab('home');
    setNewsInitialSearch('');
    setPlannerInitialTab('dashboard');
    setPlannerInitialAction('');
    
    switch (action) {
      case 'OPEN': {
        // Natural Language Parsing for "Open [Feature] and [Action]"
        // Examples: "Open Game X and start Neon Dash", "Open AI Coder and show Preview"
        const parts = rawTarget.split(/\s+(?:and|then|with|to)\s+/);
        const featureQuery = parts[0].trim();
        const subActionQuery = parts[1] ? parts[1].trim() : '';

        // 1. External Web Launcher
        const sites: Record<string, string> = {
          'youtube': 'https://www.youtube.com',
          'google': 'https://www.google.com',
          'gmail': 'https://mail.google.com',
          'wikipedia': 'https://www.wikipedia.org',
          'github': 'https://github.com',
          'maps': 'https://maps.google.com',
          'google maps': 'https://maps.google.com',
          'chatgpt': 'https://chatgpt.com',
          'openai': 'https://chatgpt.com',
          'spotify': 'https://open.spotify.com',
          'facebook': 'https://facebook.com',
          'instagram': 'https://instagram.com',
          'twitter': 'https://twitter.com',
          'reddit': 'https://reddit.com',
          'netflix': 'https://netflix.com',
          'amazon': 'https://amazon.com',
          'linkedin': 'https://linkedin.com'
        };

        const siteKey = Object.keys(sites).find(k => featureQuery === k || featureQuery.includes(k));
        if (siteKey) {
          window.open(sites[siteKey], '_blank');
          writeLog(`[WEB LAUNCHER]: Dispatched browser routing to ${siteKey}.`, 'NETWORK');
          return;
        }

        // 2. Feature Registry Check
        const feature = tools.find((t: any) => 
          t.name.toLowerCase().includes(featureQuery) || 
          featureQuery.includes(t.name.toLowerCase().replace(/[^\w\s]/g, '').trim())
        );

        if (feature) {
          // Determine Modal and handle sub-actions
          const featureName = feature.name.toLowerCase();

          if (featureName.includes('coder')) {
            setActiveModal('AI_CODER');
            if (subActionQuery.includes('preview')) setCoderInitialTab('preview');
            else if (subActionQuery.includes('console')) setCoderInitialTab('console');
            else if (subActionQuery.includes('editor') || subActionQuery.includes('code')) setCoderInitialTab('editor');
            
            if (subActionQuery.includes('project')) setCoderInitialAction('create_project');
            writeLog(`[CODER]: Navigating to AI Coder ${subActionQuery ? `(${subActionQuery})` : ''}`, 'SYSTEM');
            return;
          }

          if (featureName.includes('vault') || featureName.includes('memory')) {
            setActiveModal('VAULT');
            if (subActionQuery.includes('photo')) setVaultInitialTab('photo');
            else if (subActionQuery.includes('doc')) setVaultInitialTab('document');
            else if (subActionQuery.includes('note')) setVaultInitialTab('note');
            else if (subActionQuery.includes('ask')) setVaultInitialTab('ask');
            writeLog(`[VAULT]: Navigating to AI Vault ${subActionQuery ? `(${subActionQuery})` : ''}`, 'SYSTEM');
            return;
          }

          if (featureName.includes('game') || featureName.includes('verse')) {
            setActiveModal('GAME_X');
            if (subActionQuery.includes('neon dash')) setGameInitialGame('neondash');
            else if (subActionQuery.includes('snake')) setGameInitialGame('cybersnake');
            else if (subActionQuery.includes('matrix')) setGameInitialGame('memorymatrix');
            
            if (subActionQuery.includes('built-in')) setGameInitialTab('builtin');
            else if (subActionQuery.includes('portal')) setGameInitialTab('webportals');
            writeLog(`[GAMES]: Navigating to Game X ${subActionQuery ? `(${subActionQuery})` : ''}`, 'SYSTEM');
            return;
          }

          if (featureName.includes('news')) {
            setActiveModal('NEWS');
            if (subActionQuery.includes('india')) setNewsInitialTab('india');
            else if (subActionQuery.includes('tech')) setNewsInitialTab('tech');
            else if (subActionQuery.includes('verifier')) setNewsInitialTab('verifier');
            
            if (subActionQuery.startsWith('search ')) {
               setNewsInitialSearch(subActionQuery.replace('search ', ''));
            }
            writeLog(`[NEWS]: Navigating to News 2.0 ${subActionQuery ? `(${subActionQuery})` : ''}`, 'SYSTEM');
            return;
          }

          if (featureName.includes('planner')) {
             setActiveModal('PLANNER');
             if (subActionQuery.includes('task')) {
                setPlannerInitialTab('tasks');
                if (subActionQuery.includes('today')) setPlannerInitialAction('show_today_tasks');
             } else if (subActionQuery.includes('calendar')) setPlannerInitialTab('calendar');
             else if (subActionQuery.includes('ai')) setPlannerInitialTab('ai_planner');
             writeLog(`[PLANNER]: Navigating to Smart Planner ${subActionQuery ? `(${subActionQuery})` : ''}`, 'SYSTEM');
             return;
          }

          if (featureName.includes('lens') || featureName.includes('visual')) {
            f_lensx();
            writeLog(`[LENS X]: Visual intelligence activated.`, 'SYSTEM');
            return;
          }

          // Generic feature trigger
          feature.cmd();
          writeLog(`Opening feature: ${feature.name}`, 'SYSTEM');
          return;
        }

        // 2b. Active Modal Contextual Control
        if (activeModal) {
          if (activeModal === 'AI_CODER') {
            if (rawTarget.includes('preview')) setCoderInitialTab('preview');
            else if (rawTarget.includes('console')) setCoderInitialTab('console');
            else if (rawTarget.includes('editor') || rawTarget.includes('code')) setCoderInitialTab('editor');
            if (rawTarget.includes('project')) setCoderInitialAction('create_project');
            return;
          }
          if (activeModal === 'VAULT') {
            if (rawTarget.includes('photo')) setVaultInitialTab('photo');
            else if (rawTarget.includes('doc')) setVaultInitialTab('document');
            else if (rawTarget.includes('note')) setVaultInitialTab('note');
            else if (rawTarget.includes('ask')) setVaultInitialTab('ask');
            return;
          }
          if (activeModal === 'GAME_X') {
            if (rawTarget.includes('neon dash')) setGameInitialGame('neondash');
            else if (rawTarget.includes('snake')) setGameInitialGame('cybersnake');
            if (rawTarget.includes('built-in')) setGameInitialTab('builtin');
            else if (rawTarget.includes('portal')) setGameInitialTab('webportals');
            return;
          }
          if (activeModal === 'NEWS') {
            if (rawTarget.includes('india')) setNewsInitialTab('india');
            else if (rawTarget.includes('tech')) setNewsInitialTab('tech');
            else if (rawTarget.includes('verifier')) setNewsInitialTab('verifier');
            return;
          }
        }

        // 3. Navigation Aliases
        const aliases: Record<string, any> = {
          'my files': 'MY_FILES',
          'recent files': 'MY_FILES',
          'storage': 'MY_FILES',
          'camera': 'CAMERA',
          'photo': 'CAMERA',
          'lens': 'LENS_X',
          'visual search': 'LENS_X',
          'home': null,
          'dashboard': null
        };

        const aliasKey = Object.keys(aliases).find(k => featureQuery.includes(k));
        if (aliasKey !== undefined) {
          setActiveModal(aliases[aliasKey]);
          writeLog(`[NAVIGATOR]: Contextual routing to ${aliasKey || 'Home'}.`, 'SYSTEM');
          return;
        }

        // 4. Custom URL Detection
        if (featureQuery.includes('.') && !featureQuery.includes(' ')) {
          const url = featureQuery.startsWith('http') ? featureQuery : `https://${featureQuery}`;
          window.open(url, '_blank');
          writeLog(`[WEB]: Opening custom URL: ${url}`, 'NETWORK');
          return;
        }

        // 5. Fallback: System Command
        executeCommand(rawTarget);
        break;
      }
      case 'SEARCH': {
         const { query, destination } = params;
         if (destination === 'google') {
           window.open(`https://google.com/search?q=${encodeURIComponent(query)}`, '_blank');
         } else if (destination === 'youtube') {
           window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank');
         } else if (destination === 'wikipedia') {
           window.open(`https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`, '_blank');
         } else if (destination === 'vault' || destination === 'my files') {
            setActiveModal('VAULT');
            writeLog(`Vault search index primed for: "${query}"`, 'DATABASE');
         } else {
            executeSearch(query);
         }
         break;
      }
      case 'THEME': {
         writeLog(`System visual parameters shifted to ${params.mode} mode.`, 'SYSTEM');
         if (params.mode === 'dark') setMatrixBackground(true);
         else setMatrixBackground(false);
         break;
      }
      case 'DIRECT': {
         executeCommand(params.command);
         break;
      }
      case 'SCREENSHOT_CAPTURE': {
         setScreenCompanionInitialImage(params.image);
         setActiveModal('AI_SCREEN_COMPANION');
         writeLog('Screen captured and transmitted to AI Screen Companion.', 'VISION');
         break;
      }
    }
  }, [
    tools, 
    executeCommand, 
    executeSearch, 
    writeLog,
    setCoderInitialTab,
    setCoderInitialAction,
    setVaultInitialTab,
    setGameInitialTab,
    setGameInitialGame,
    setNewsInitialTab,
    setNewsInitialSearch,
    setPlannerInitialTab,
    setPlannerInitialAction
  ]);

  const handleHoloExecuteCommand = useCallback((cmdOrModal: string, params?: any) => {
    const normalized = (cmdOrModal || '').toUpperCase().trim();
    if (normalized === 'WEATHER') f_weather();
    else if (normalized === 'WHITEBOARD') f_whiteboard();
    else if (normalized === 'CITYVERSE' || normalized === 'CITY') f_cityverse();
    else if (normalized === '3D_LAB' || normalized === 'MECHANICAL') f_3d_lab();
    else if (normalized === 'SPACE_XPLORER' || normalized === 'SPACE') f_space();
    else if (normalized === 'RESEARCH') f_research();
    else if (normalized === 'PLANNER') f_planner();
    else if (normalized === 'AI_CODER' || normalized === 'CODER') f_ai_coder();
    else if (normalized === 'NOTES') f_note();
    else if (normalized === 'CAMERA') f_camera();
    else if (normalized === 'LENS_X') f_lensx();
    else if (normalized === 'CYBER_SECURITY' || normalized === 'CYBER') f_cyber();
    else if (normalized === 'MUSIC_PLAYER' || normalized === 'MUSIC') f_music_player();
    else if (normalized === 'AI_IMAGE_STUDIO' || normalized === 'IMAGE') f_ai_image_studio();
    else if (normalized === 'AI_VIDEO_EDITOR' || normalized === 'VIDEO') f_ai_video_editor();
    else if (normalized === 'WHATSAPP') f_whatsapp();
    else if (normalized === 'WIFI_VAULT' || normalized === 'WIFI') f_wifi();
    else {
      onExecuteVoiceAction('OPEN', { target: cmdOrModal });
    }
  }, [
    f_cityverse,
    f_weather,
    f_whiteboard,
    f_3d_lab,
    f_space,
    f_research,
    f_planner,
    f_ai_coder,
    f_note,
    f_camera,
    f_lensx,
    f_cyber,
    f_music_player,
    f_ai_image_studio,
    f_ai_video_editor,
    f_whatsapp,
    f_wifi,
    onExecuteVoiceAction
  ]);


  // =========================================================================
  // VIEW: LOGIN SCREEN (if not logged in)
  // =========================================================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-black text-emerald-400 font-mono flex flex-col items-center justify-center p-4 relative select-none overflow-hidden">
        {matrixBackground && <MatrixRain isBackground />}

        <div className="z-10 bg-black/90 border-2 border-emerald-500/80 p-8 rounded-lg max-w-xl w-full text-center shadow-[0_0_40px_rgba(16,185,129,0.35)]">
          <div className="text-3xl sm:text-4xl font-extrabold tracking-wider text-emerald-400 mb-2 drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]">
            ⚡ ISHAI OS ⚡
          </div>
          <div className="text-xs tracking-widest text-emerald-600 mb-8 uppercase font-bold">
            OPERATIONAL CORE v25.0 [REAL OPERATIONAL OVERKILL BUILD]
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                placeholder="AUTHENTICATION PASSCODE"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus={true}
                className="w-full bg-[#050505] border-2 border-emerald-500 text-center text-xl sm:text-2xl tracking-widest text-emerald-300 py-3 px-4 rounded focus:outline-none focus:border-emerald-300 focus:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all placeholder:text-emerald-800 placeholder:text-sm placeholder:tracking-normal"
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-base py-3 px-4 rounded transition-all shadow-[0_0_15px_rgba(16,185,129,0.5)] cursor-pointer tracking-wider"
              >
                [ VERIFY DEV PASS ]
              </button>
            </div>
          </form>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleBypass}
              className="w-full bg-transparent border border-emerald-600/80 hover:bg-emerald-950/60 text-emerald-400 font-bold text-xs py-2 px-4 rounded transition-colors cursor-pointer tracking-widest uppercase"
            >
              [ BYPASS SECURITY / GUEST MODE ]
            </button>
          </div>

          {authError && (
            <div className="mt-4 text-xs text-red-400 font-bold bg-red-950/40 border border-red-800 p-2 rounded">
              ⚠ INTRUDER ALERT: Access Denied. Surveillance Protocol Initiated.
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-emerald-900/60 text-[11px] text-emerald-600 flex justify-between items-center">
            <span>DEFAULT DEV PASS: <code className="text-emerald-400 font-bold">ishai14</code> (or superai14)</span>
            <span>CLEARANCE: LEVEL 5</span>
          </div>
        </div>
      </div>
    );
  }


  // =========================================================================
  // VIEW: MAIN DASHBOARD
  // =========================================================================
  return (
    <div
      className={`min-h-screen bg-black text-emerald-400 font-mono flex flex-col select-none relative ${
        stealthMode ? 'opacity-40 contrast-125' : ''
      } ${screenGlitch ? 'animate-bounce invert' : ''}`}
    >
      {showStartupIntro && startupIntroEnabled && (
        <StartupIntroVideo onComplete={() => setShowStartupIntro(false)} />
      )}

      {matrixBackground && <MatrixRain isBackground />}

      {/* --- HUD HEADER --- */}
      <header className="z-10 bg-[#0c0c0c] border-b border-emerald-500/40 px-3 sm:px-4 py-2 sm:py-2.5 flex flex-wrap items-center justify-between text-xs tracking-wider gap-2">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold">
            <span
              className={`w-2 h-2 rounded-full ${
                userMode === 'DEV' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className={userMode === 'DEV' ? 'text-emerald-300' : 'text-amber-400'}>
              💠 {userMode}
            </span>
          </div>

          <span className="text-emerald-700 hidden sm:inline">|</span>
          <span className="text-emerald-500 text-[11px] sm:text-xs">💻 ISHAI-OS</span>

          <span className="text-emerald-700">|</span>
          <span className="text-emerald-400 text-[11px] sm:text-xs">🧠 RAM: {ramLoad}%</span>

          <span className="text-emerald-700 hidden sm:inline">|</span>
          <span className="text-emerald-300 text-[11px] sm:text-xs hidden sm:inline">🕒 {currentTime}</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
          <button
            onClick={toggleFullscreenMode}
            className={`px-2.5 py-1 rounded text-[11px] font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              isFullscreen
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.7)]'
                : 'bg-cyan-950/90 border border-cyan-400 text-cyan-300 hover:bg-cyan-400 hover:text-black'
            }`}
            title={isFullscreen ? 'Exit Full Screen Mode' : 'Expand ISHAI to Full Screen Mode'}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? 'EXIT FULL' : '⛶ FULLSCREEN'}</span>
          </button>

          <button
            onClick={handleReplayIntro}
            className="bg-cyan-950/90 border border-cyan-400 hover:bg-cyan-400 hover:text-black text-cyan-300 font-bold px-2.5 py-1 rounded text-[11px] transition-all shadow-[0_0_12px_rgba(6,182,212,0.4)] flex items-center gap-1 cursor-pointer"
            title="Replay the 10-second cinematic intro video"
          >
            <Film className="w-3.5 h-3.5 text-cyan-300" />
            <span>🎬 REPLAY INTRO</span>
          </button>

          <button
            onClick={() => setVoiceAssistantActive(prev => !prev)}
            className={`px-3 py-1 rounded text-[11px] font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              voiceAssistantActive
                ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.7)] animate-pulse'
                : 'bg-emerald-950/90 border border-emerald-400 text-emerald-300 hover:bg-emerald-400 hover:text-black'
            }`}
            title="Launch ISHAI Voice Assistant 2.0 - Universal Control Center"
          >
            <span className={`w-2 h-2 rounded-full ${voiceAssistantActive ? 'bg-black animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
            <span>{voiceAssistantActive ? '🎙️ VOICE CENTER ACTIVE' : '🎙️ HEY ISHAI'}</span>
          </button>

          <button
            onClick={() => f_news()}
            className="bg-blue-950/90 border border-blue-400 hover:bg-blue-400 hover:text-black text-blue-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all shadow-[0_0_14px_rgba(59,130,246,0.4)] flex items-center gap-1 cursor-pointer"
            title="Launch SUPERAI NEWS 2.0 — Ultimate AI News Command Center"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span>📰 NEWS 2.0</span>
          </button>

          <button
            onClick={() => f_cyber()}
            className="bg-emerald-950/90 border border-emerald-400 hover:bg-emerald-400 hover:text-black text-emerald-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all shadow-[0_0_14px_rgba(16,185,129,0.4)] flex items-center gap-1 cursor-pointer"
            title="Launch SUPERAI Ethical Hacker - Cybersecurity, Pentesting & Threat Intelligence Workstation"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>🛡️ ETHICAL HACKER</span>
          </button>



          <button
            onClick={() => f_maps()}
            className="bg-emerald-950/90 border border-emerald-400 hover:bg-emerald-400 hover:text-black text-emerald-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all shadow-[0_0_14px_rgba(16,185,129,0.4)] flex items-center gap-1 cursor-pointer"
            title="Launch SUPERAI Maps - Interactive Google Maps, World Explorer & Navigation"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>🗺️ MAPS</span>
          </button>

          <button
            onClick={() => f_clock()}
            className="bg-emerald-950/90 border border-emerald-400 hover:bg-emerald-400 hover:text-black text-emerald-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center gap-1 cursor-pointer"
            title="Launch SuperAI Clock & Calendar Workspace"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>🕒 CLOCK</span>
          </button>

          <button
            onClick={() => f_research()}
            className="bg-cyan-950/90 border border-cyan-400 hover:bg-cyan-400 hover:text-black text-cyan-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] flex items-center gap-1"
            title="Launch SuperAI Deep Research Engine"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>🔬 DEEP RESEARCH</span>
          </button>

          <button
            onClick={() => f_planner()}
            className="bg-emerald-950/90 border border-emerald-400 hover:bg-emerald-400 hover:text-black text-emerald-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center gap-1"
            title="Launch Smart Planner - Your day, organized."
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>📅 SMART PLANNER</span>
          </button>

          <button
            onClick={() => f_ai_coder()}
            className="bg-emerald-950/90 border border-emerald-400 hover:bg-emerald-400 hover:text-black text-emerald-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center gap-1"
            title="Launch AI Coder - Build anything with AI."
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>⚡ AI CODER</span>
          </button>

          <button
            onClick={() => f_language_studio()}
            className="bg-emerald-950/90 border border-emerald-400 hover:bg-emerald-400 hover:text-black text-emerald-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center gap-1"
            title="Launch Language Studio"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>🌍 LANGUAGE STUDIO</span>
          </button>



          <button
            onClick={() => f_doc_ppt_maker('document')}
            className="bg-emerald-950/90 border border-emerald-400 hover:bg-emerald-400 hover:text-black text-emerald-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center gap-1"
            title="Launch Document & PPT Maker - Real DOCX, PPTX, and PDF Workspace"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>📄 DOC &amp; PPT MAKER</span>
          </button>

          <button
            onClick={() => f_study_genius('upload')}
            className="bg-emerald-950/90 border border-emerald-400 hover:bg-emerald-400 hover:text-black text-emerald-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center gap-1"
            title="Launch Study Genius - AI Study Workspace"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>🎓 STUDY GENIUS</span>
          </button>

          <button
            onClick={() => f_data_analyst('overview')}
            className="bg-emerald-950/90 border border-emerald-400 hover:bg-emerald-400 hover:text-black text-emerald-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center gap-1"
            title="Launch AI Data Analyst - CSV & Excel Workspace"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>📊 AI DATA ANALYST</span>
          </button>

          <button
            onClick={f_workflow_automator}
            className="bg-emerald-950/90 border border-emerald-400 hover:bg-emerald-400 hover:text-black text-emerald-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center gap-1"
            title="Launch AI Workflow Automator - Multi-Step Task Pipeline"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>⚡ WORKFLOW AUTOMATOR</span>
          </button>

          <button
            onClick={f_memory_vault}
            className="bg-emerald-950/90 border border-emerald-400 hover:bg-emerald-400 hover:text-black text-emerald-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center gap-1"
            title="Launch AI Memory Vault - Grounded Personal Knowledge & Document Hub"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>🧠 MEMORY VAULT</span>
          </button>

          <button
            onClick={f_focus_studio}
            className="bg-emerald-950/90 border border-emerald-400 hover:bg-emerald-400 hover:text-black text-emerald-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center gap-1"
            title="Launch Focus Studio - Distraction-Free Focus & Productivity Workspace"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>🎯 FOCUS STUDIO</span>
          </button>

          <button
            onClick={f_voice_recorder}
            className="bg-cyan-950/90 border border-cyan-400 hover:bg-cyan-400 hover:text-black text-cyan-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all shadow-[0_0_14px_rgba(6,182,212,0.4)] flex items-center gap-1 cursor-pointer"
            title="Launch Voice Recorder - Sound Studio, Waveforms & Timestamped Notes"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>🎙️ VOICE RECORDER</span>
          </button>

          <button
            onClick={f_gmail}
            className="bg-cyan-950/90 border border-cyan-400 hover:bg-cyan-400 hover:text-black text-cyan-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all shadow-[0_0_12px_rgba(6,182,212,0.4)] flex items-center gap-1 cursor-pointer"
            title="Launch ISHAI Gmail Connect - Official Google OAuth 2.0 Email Workspace"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>📧 GMAIL CONNECT</span>
          </button>

          <button
            onClick={f_space}
            className="bg-cyan-950/90 border border-cyan-400 hover:bg-cyan-400 hover:text-black text-cyan-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all shadow-[0_0_12px_rgba(6,182,212,0.4)] flex items-center gap-1"
            title="Launch Space Xplorer - Interactive Astronomy, 3D Solar System, Sky Map & Satellite Tracker"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>🚀 SPACE XPLORER</span>
          </button>

          <button
            onClick={f_universal_tv_remote}
            className="bg-indigo-950/90 border border-indigo-400 hover:bg-indigo-400 hover:text-black text-indigo-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all shadow-[0_0_12px_rgba(99,102,241,0.4)] flex items-center gap-1"
            title="Launch Universal TV Remote - Control Samsung, LG, Sony, Roku, Android TV & streaming devices"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span>📺 TV REMOTE</span>
          </button>

          <button
            onClick={f_screen_companion}
            className="bg-teal-950/90 border border-teal-400 hover:bg-teal-400 hover:text-black text-teal-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all shadow-[0_0_12px_rgba(20,184,166,0.4)] flex items-center gap-1"
            title="Launch AI Screen Companion - Real-time screen analysis, screenshot upload, error troubleshooting & visual step-by-step guidance"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span>🖥️ SCREEN COMPANION</span>
          </button>

          <button
            onClick={f_ai_image_studio}
            className="bg-amber-950/90 border border-amber-400 hover:bg-amber-400 hover:text-black text-amber-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all shadow-[0_0_14px_rgba(245,158,11,0.4)] flex items-center gap-1"
            title="Launch AI Image Studio - Generate images from text prompts, create posters, thumbnails, logos, wallpapers, and edit uploaded images"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>🎨 AI IMAGE STUDIO</span>
          </button>

          <button
            onClick={f_ai_video_editor}
            className="bg-purple-950/90 border border-purple-400 hover:bg-purple-400 hover:text-black text-purple-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all shadow-[0_0_14px_rgba(168,85,247,0.4)] flex items-center gap-1"
            title="Launch AI Video Editor - Canva/CapCut-grade multitrack video editor with AI subtitles & canvas export"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span>🎥 AI VIDEO EDITOR</span>
          </button>

          <button
            onClick={f_whiteboard}
            className="bg-cyan-950/90 border border-cyan-400 hover:bg-cyan-400 hover:text-black text-cyan-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all shadow-[0_0_14px_rgba(6,182,212,0.4)] flex items-center gap-1 cursor-pointer"
            title="Launch ISHAI Whiteboard - Infinite Canvas Studio with Gemini AI"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>🎨 WHITEBOARD</span>
          </button>

          <button
            onClick={f_weather}
            className="bg-blue-950/90 border border-blue-400 hover:bg-blue-400 hover:text-black text-blue-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all shadow-[0_0_14px_rgba(59,130,246,0.4)] flex items-center gap-1 cursor-pointer"
            title="Launch ISHAI Weather - Complete Weather Intelligence Platform"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span>🌤️ WEATHER</span>
          </button>

          <button
            onClick={f_holo_ai}
            className="bg-gradient-to-r from-cyan-950/90 via-blue-950/90 to-violet-950/90 border border-cyan-400 hover:border-violet-400 hover:text-white text-cyan-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all shadow-[0_0_16px_rgba(6,182,212,0.5)] flex items-center gap-1 cursor-pointer"
            title="Launch HOLO AI - ISHAI's Futuristic 3D Visual AI Assistant"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>🤖 HOLO AI</span>
          </button>

          {/* User Profile & Account Menu */}
          <UserProfileMenu
            currentUser={currentUser}
            onOpenAuthModal={(m) => {
              setAuthModalInitialMode(m || 'signin');
              setActiveModal('AUTH_MODAL');
            }}
            onOpenMyFiles={() => setActiveModal('MY_FILES')}
            onOpenSettings={() => setActiveModal('SETTINGS')}
            onReplayIntro={handleReplayIntro}
            onSignOut={handleSignOut}
          />

          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveModal('SETTINGS');
            }}
            className="bg-zinc-900/90 border border-cyan-500/50 hover:bg-cyan-950 text-cyan-300 font-bold px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
            title="Open System Preferences & Settings (Startup Intro Video, Theme, Voice, Storage)"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>⚙️ SETTINGS</span>
          </button>


          <button
            onClick={testVoice}
            className="bg-emerald-950/80 border border-emerald-500 hover:bg-emerald-500 hover:text-black text-emerald-300 font-bold px-2 py-0.5 rounded text-[10px] sm:text-[11px] transition-colors"
            title="Click to test vocal output"
          >
            🔊 TEST VOICE
          </button>

          <button
            onClick={f_audio}
            className="hover:text-emerald-200 border border-emerald-800 px-2 py-0.5 rounded text-[10px] sm:text-[11px] transition-colors"
            title="Toggle Voice Profile"
          >
            🗣️ {voiceGender}
          </button>

          <button
            onClick={() => setAudioMuted(!audioMuted)}
            className={`border px-2 py-0.5 rounded text-[10px] sm:text-[11px] transition-colors ${
              audioMuted
                ? 'border-red-800 text-red-400 hover:bg-red-950'
                : 'border-emerald-800 text-emerald-400 hover:bg-emerald-950'
            }`}
          >
            {audioMuted ? '🔇 Muted' : '🔊 Sound'}
          </button>

          {intruders.length > 0 && (
            <button
              onClick={() => setActiveModal('INTRUDERS')}
              className="bg-red-950/80 border border-red-600 text-red-400 hover:bg-red-900 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold animate-pulse"
            >
              🚨 ({intruders.length})
            </button>
          )}

          <button
            onClick={f_reboot}
            className="border border-red-900 text-red-400 hover:bg-red-900 hover:text-white px-2 py-0.5 rounded text-[10px] sm:text-[11px] transition-colors"
          >
            LOCK
          </button>
        </div>
      </header>

      {/* --- LIVE SPEECH VISUALIZER BANNER --- */}
      {speakingText && (
        <div className="z-30 bg-emerald-950 border-b border-emerald-500 px-3 sm:px-4 py-1.5 flex items-center justify-between text-xs text-emerald-300 font-mono shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse">
          <div className="flex items-center gap-2 truncate pr-2">
            <span className="text-sm shrink-0">🗣️</span>
            <span className="truncate text-[11px] sm:text-xs">
              <strong className="text-emerald-400">AI SPEAKING:</strong> &ldquo;{speakingText}&rdquo;
            </span>
          </div>
          <button
            onClick={stopSpeaking}
            className="border border-emerald-600 px-2 py-0.5 rounded text-[10px] hover:bg-emerald-500 hover:text-black shrink-0 transition-colors"
          >
            [ STOP AUDIO ]
          </button>
        </div>
      )}

      {/* --- MAIN TERMINAL / ACTIVITY LOG --- */}
      <section className="z-10 px-2.5 sm:px-4 pt-2 sm:pt-3 pb-2">
        <div className="bg-[#050505] border border-emerald-500/80 rounded-lg p-2.5 sm:p-3 shadow-[0_0_20px_rgba(16,185,129,0.15)] flex flex-col h-56 sm:h-72">
          <div className="flex justify-between items-center pb-1.5 sm:pb-2 border-b border-emerald-900/60 mb-2 text-xs">
            <span className="font-bold text-emerald-300 tracking-wider truncate text-[11px] sm:text-xs">
              📟 ISHAI_OS // ACTIVITY TERMINAL
            </span>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setLogs([])}
                className="text-[10px] text-emerald-600 hover:text-emerald-300"
              >
                [ CLEAR ]
              </button>
              <button
                onClick={() => setMatrixBackground(!matrixBackground)}
                className="text-[10px] text-emerald-600 hover:text-emerald-300 hidden sm:inline"
              >
                [ {matrixBackground ? 'RAIN OFF' : 'RAIN ON'} ]
              </button>
            </div>
          </div>

          <div
            ref={logContainerRef}
            className="flex-1 overflow-y-auto space-y-1 font-mono text-xs pr-1 scrollbar-thin scrollbar-thumb-emerald-800"
          >
            {logs.map((log) => (
              <div key={log.id} className="leading-relaxed break-words text-[11px] sm:text-xs">
                <span className="text-emerald-600">[{log.timestamp}]</span>{' '}
                <span
                  className={
                    log.tag === 'SECURITY' || log.tag === 'ALERT'
                      ? 'text-red-400 font-bold'
                      : log.tag === 'INTELLIGENCE' || log.tag === 'HEADLINES'
                      ? 'text-cyan-400'
                      : log.tag === 'GAME'
                      ? 'text-amber-400'
                      : 'text-emerald-500'
                  }
                >
                  [{log.tag}]
                </span>{' '}
                <span className="text-emerald-300 whitespace-pre-wrap">{log.text}</span>
              </div>
            ))}
          </div>

          {/* Direct CLI input */}
          <form onSubmit={handleCommandSubmit} className="mt-2 pt-2 border-t border-emerald-900/80 flex gap-1.5 sm:gap-2">
            <span className="text-emerald-500 font-bold self-center text-[11px] sm:text-xs shrink-0">root@ishai:~$</span>
            <input
              type="text"
              placeholder="Type command (e.g. image, ai, music, wifi)..."
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              className="flex-1 bg-black border border-emerald-800 text-xs sm:text-sm text-emerald-300 px-2 py-1 rounded focus:outline-none focus:border-emerald-500 min-w-0"
            />
            <button
              type="submit"
              className="bg-emerald-500 text-black font-bold text-xs px-2.5 sm:px-3 py-1 rounded hover:bg-emerald-400 shrink-0"
            >
              RUN
            </button>
          </form>
        </div>
      </section>

      {/* --- 41+ TOOLS GRID (RESPONSIVE PHONE & LAPTOP) --- */}
      <main className="z-10 flex-1 px-2.5 sm:px-4 py-2 sm:py-3 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-emerald-950 pb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-emerald-500 tracking-widest uppercase">
              // MODULE MATRIX ({tools.filter(t => t.name.toLowerCase().includes(toolSearch.toLowerCase())).length} TOOLS)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="🔍 Search tools (e.g. image, ai, music, pass)..."
              value={toolSearch}
              onChange={(e) => setToolSearch(e.target.value)}
              className="bg-black border border-emerald-800 text-[11px] sm:text-xs text-emerald-300 px-2.5 py-1 rounded w-full sm:w-56 focus:outline-none focus:border-emerald-400"
            />
            {toolSearch && (
              <button
                onClick={() => setToolSearch('')}
                className="text-xs text-emerald-500 hover:text-emerald-300 px-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-2.5 pb-20 sm:pb-8">
          {tools
            .filter((t) => t.name.toLowerCase().includes(toolSearch.toLowerCase()))
            .map((t, idx) => (
              <button
                key={idx}
                onClick={t.cmd}
                className="bg-[#080808] border border-emerald-600/50 hover:border-emerald-400 hover:bg-emerald-950/40 text-emerald-300 hover:text-emerald-200 text-xs font-bold min-h-[44px] py-2 px-1.5 sm:px-2 rounded flex items-center justify-center gap-1.5 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.8)] active:scale-95 cursor-pointer text-center group"
              >
                {t.icon && <t.icon className="w-4 h-4 shrink-0 text-emerald-400 group-hover:text-emerald-200" />}
                <span className="group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.9)] truncate">
                  {t.name}
                </span>
              </button>
            ))}
        </div>
      </main>

      {/* --- MOBILE QUICK ACTION DOCK (PHONE & LAPTOP ADAPTIVE) --- */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#080808]/95 backdrop-blur-md border-t border-emerald-500/40 px-2 py-1.5 flex items-center justify-around sm:hidden">
        <button
          onClick={f_ai}
          className="flex flex-col items-center text-[10px] text-emerald-400 hover:text-emerald-200 active:scale-90"
        >
          <span className="text-base">🤖</span>
          <span>AI</span>
        </button>
        <button
          onClick={f_image_creator}
          className="flex flex-col items-center text-[10px] text-emerald-400 hover:text-emerald-200 active:scale-90"
        >
          <span className="text-base">🎨</span>
          <span>CREATOR</span>
        </button>
        <button
          onClick={f_music_player}
          className="flex flex-col items-center text-[10px] text-emerald-400 hover:text-emerald-200 active:scale-90"
        >
          <span className="text-base">🎵</span>
          <span>SONG</span>
        </button>
        <button
          onClick={f_wifi}
          className="flex flex-col items-center text-[10px] text-emerald-400 hover:text-emerald-200 active:scale-90"
        >
          <span className="text-base">📡</span>
          <span>WIFI</span>
        </button>
        <button
          onClick={() => {
            soundEngine.playClick();
            const input = document.querySelector('input[placeholder*="Type command"]') as HTMLInputElement;
            input?.focus();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center text-[10px] text-emerald-400 hover:text-emerald-200 active:scale-90"
        >
          <span className="text-base">📟</span>
          <span>CLI</span>
        </button>
      </div>

      {/* --- MODAL RENDERS --- */}
      {activeModal === 'MATRIX_FULL' && (
        <MatrixRain onClose={() => setActiveModal(null)} />
      )}

      {activeModal === 'CONTACTS' && (
        <ContactsModal
          contacts={contacts}
          onAdd={(name, phone) => {
            const next = [...contacts, { name, phone }];
            setContacts(next);
            localStorage.setItem(CONTACTS_KEY, JSON.stringify(next));
            writeLog(`Contact added: ${name} (${phone})`, 'DATABASE');
          }}
          onDelete={(idx) => {
            const next = contacts.filter((_, i) => i !== idx);
            setContacts(next);
            localStorage.setItem(CONTACTS_KEY, JSON.stringify(next));
            writeLog('Contact record removed.', 'DATABASE');
          }}
          onClear={() => {
            setContacts([]);
            localStorage.removeItem(CONTACTS_KEY);
            writeLog('Contact matrix fully cleared.', 'DATABASE');
          }}

          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'HANGMAN' && (
        <HangmanModal
          onClose={() => setActiveModal(null)}
          onLog={writeLog}
        />
      )}

      {activeModal === 'GUESS_NUM' && (
        <GuessNumberModal
          onClose={() => setActiveModal(null)}
          onLog={writeLog}
        />
      )}

      {activeModal === 'GAME_X' && (
        <GameVerseModal
          onClose={() => setActiveModal(null)}
          onLog={writeLog}
          initialTab={gameInitialTab}
          initialGame={gameInitialGame}
        />
      )}

      {activeModal === 'NOTES' && (
        <NotesModal
          note={activeNote}
          onSave={(updated) => {
            setActiveNote(updated);
            localStorage.setItem(NOTES_KEY, updated);
            writeLog('Transient note memory buffer updated.', 'DATABASE');
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'INTRUDERS' && (
        <IntruderLogModal
          intruders={intruders}
          onClear={() => setIntruders([])}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Weather prompt */}
      {activeModal === 'WEATHER_PROMPT' && (
        <ModalWrapper title="🌤️ WEATHER ENGINE QUERY" onClose={() => setActiveModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeWeather(promptInput || 'New York');
            }}
            className="space-y-4"
          >
            <p className="text-xs text-emerald-400">Enter target city name for meteorological query:</p>
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="e.g. London, Tokyo, Delhi, New York"
              autoFocus
              className="w-full bg-black border border-emerald-700 px-3 py-2 text-xs text-emerald-300 rounded focus:outline-none focus:border-emerald-400"
            />
            <div className="flex justify-end gap-2">
              <button
                type="submit"
                className="bg-emerald-500 text-black font-bold px-4 py-1.5 text-xs rounded hover:bg-emerald-400"
              >
                PULL WEATHER MATRIX
              </button>
            </div>
          </form>
        </ModalWrapper>
      )}

      {/* Calc prompt */}
      {activeModal === 'CALC' && (
        <ModalWrapper title="🧮 MATH SOLVER MATRIX" onClose={() => setActiveModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeCalc(promptInput);
            }}
            className="space-y-4"
          >
            <p className="text-xs text-emerald-400">Enter calculation formula (supports +, -, *, /, parenthesis):</p>
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="e.g. 45 * 12 / (2 + 3)"
              autoFocus
              className="w-full bg-black border border-emerald-700 px-3 py-2 text-xs text-emerald-300 rounded focus:outline-none focus:border-emerald-400"
            />
            <div className="flex justify-end gap-2">
              <button
                type="submit"
                className="bg-emerald-500 text-black font-bold px-4 py-1.5 text-xs rounded hover:bg-emerald-400"
              >
                COMPUTE
              </button>
            </div>
          </form>
        </ModalWrapper>
      )}

      {/* AI Omniscient Core Modal */}
      {activeModal === 'AI_CORE' && (
        <AICoreModal
          onClose={() => setActiveModal(null)}
          onLog={writeLog}
          audioActive={!audioMuted}
          onVocalize={(text) => {
            if (!audioMuted) speakText(text, voiceGender);
          }}
        />
      )}

      {/* Wi-Fi Credential Vault & Passwords Modal */}
      {activeModal === 'WIFI_VAULT' && (
        <WiFiVaultModal
          onClose={() => setActiveModal(null)}
          onLog={writeLog}
        />
      )}

      {/* Ultra-Fast AI Image Creator Modal */}
      {activeModal === 'IMAGE_CREATOR' && (
        <ImageCreatorModal
          onClose={() => setActiveModal(null)}
          onLog={writeLog}
          voiceGender={voiceGender}
          audioActive={!audioMuted}
        />
      )}

      {/* 100% Free AI Video Creator & Studio Modal */}
      {activeModal === 'VIDEO_CREATOR' && (
        <VideoCreatorModal
          onClose={() => setActiveModal(null)}
          onLog={writeLog}
          voiceGender={voiceGender}
          audioActive={!audioMuted}
        />
      )}

      {/* 100% Free Music & Song Player Modal */}
      {activeModal === 'MUSIC_PLAYER' && (
        <MusicPlayerModal
          onClose={() => setActiveModal(null)}
          onLog={writeLog}
          voiceGender={voiceGender}
          audioActive={!audioMuted}
        />
      )}

      {/* SuperAI Autonomous Deep Research Engine Modal */}
      {activeModal === 'RESEARCH' && (
        <ResearchModal
          onClose={() => setActiveModal(null)}
          onLog={writeLog}
          voiceGender={voiceGender}
          audioMuted={audioMuted}
          initialTopic={researchInitialTopic}
        />
      )}

      {/* SuperAI Smart Planner Modal */}
      {activeModal === 'PLANNER' && (
        <SmartPlannerModal
          onClose={() => setActiveModal(null)}
          onLog={writeLog}
          voiceGender={voiceGender}
          audioMuted={audioMuted}
          initialTab={plannerInitialTab}
          initialAction={plannerInitialAction}
        />
      )}



      {/* SuperAI AI Coder Modal */}
      {activeModal === 'AI_CODER' && (
        <AICoderModal
          onClose={() => setActiveModal(null)}
          onLog={writeLog}
          voiceGender={voiceGender}
          initialTab={coderInitialTab}
          initialAction={coderInitialAction}
        />
      )}

      {/* SuperAI Language Studio Modal */}
      {activeModal === 'LANGUAGE_STUDIO' && (
        <LanguageStudio onClose={() => setActiveModal(null)} />
      )}



      {/* SuperAI Document & PPT Maker Modal */}
      {activeModal === 'DOC_PPT_MAKER' && (
        <DocumentPPTMakerModal
          onClose={() => setActiveModal(null)}
          onLog={writeLog}
          initialTool={initialDocTool}
        />
      )}

      {/* SuperAI Study Genius Modal */}
      {activeModal === 'STUDY_GENIUS' && (
        <StudyGeniusModal
          onClose={() => setActiveModal(null)}
          onLog={writeLog}
          initialTool={initialStudyTool}
        />
      )}

      {/* SuperAI AI Data Analyst Modal */}
      {activeModal === 'DATA_ANALYST' && (
        <AIDataAnalystModal
          onClose={() => setActiveModal(null)}
          onLog={writeLog}
          initialTab={initialAnalystTab}
        />
      )}

      {/* SuperAI AI Workflow Automator Modal */}
      {activeModal === 'WORKFLOW_AUTOMATOR' && (
        <AIWorkflowAutomatorModal
          onClose={() => setActiveModal(null)}
          onLog={writeLog}
        />
      )}


      {/* Say Prompt */}
      {activeModal === 'SAY_PROMPT' && (
        <ModalWrapper title="🗣️ BROADCAST ENGINE (TTS)" onClose={() => setActiveModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeSay(promptInput || 'Hello Ishai');
            }}
            className="space-y-4"
          >
            <p className="text-xs text-emerald-400">Enter phrase parameter to vocalize aloud:</p>
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="e.g. System security level maximum"
              autoFocus
              className="w-full bg-black border border-emerald-700 px-3 py-2 text-xs text-emerald-300 rounded focus:outline-none focus:border-emerald-400"
            />
            <div className="flex justify-end gap-2">
              <button
                type="submit"
                className="bg-emerald-500 text-black font-bold px-4 py-1.5 text-xs rounded hover:bg-emerald-400"
              >
                VOCALIZE PHRASE
              </button>
            </div>
          </form>
        </ModalWrapper>
      )}

      {/* SuperAI AI Memory Vault Modal */}
      {activeModal === 'VAULT' && currentUser && (
        <AIMemoryVaultModal
          onClose={() => setActiveModal(null)}
          currentUser={currentUser}
          authToken={authToken}
          onLog={writeLog}
          initialTab={vaultInitialTab}
        />
      )}

      {/* SuperAI Firebase Authentication & Profile Settings Modal */}
      {activeModal === 'AUTH_MODAL' && (
        <FirebaseAuthModal
          onClose={() => setActiveModal(null)}
          onAuthSuccess={handleAuthSuccess}
          onSignOut={handleSignOut}
          initialMode={authModalInitialMode}
          onLog={writeLog}
        />
      )}

      {/* SuperAI Focus Studio Workspace Modal */}
      {activeModal === 'FOCUS_STUDIO' && currentUser && (
        <FocusStudioModal
          onClose={() => setActiveModal(null)}
          currentUser={currentUser}
          authToken={authToken}
          onLog={writeLog}
        />
      )}
      {activeModal === 'MY_FILES' && currentUser && (
        <MyFilesModal
          onClose={() => setActiveModal(null)}
          currentUser={currentUser}
          authToken={authToken}
          onLog={writeLog}
        />
      )}

      {/* SuperAI AI Video Editor Modal */}
      {activeModal === 'AI_VIDEO_EDITOR' && (
        <AIVideoEditorModal
          onClose={() => setActiveModal(null)}
          onLog={writeLog}
          currentUser={currentUser}
        />
      )}

      {/* SuperAI AI Image Studio Modal */}
      {activeModal === 'AI_IMAGE_STUDIO' && (
        <AIImageStudioModal
          onClose={() => setActiveModal(null)}
          onLog={writeLog}
          voiceGender={voiceGender}
          audioActive={!audioMuted}
        />
      )}

      {/* SuperAI Universal TV Remote Modal */}
      {activeModal === 'UNIVERSAL_TV_REMOTE' && (
        <UniversalTVRemoteModal
          onClose={() => setActiveModal(null)}
          onLog={writeLog}
          currentUser={currentUser}
        />
      )}

      {/* SuperAI AI Screen Companion Modal */}
      {activeModal === 'AI_SCREEN_COMPANION' && (
        <AIScreenCompanionModal
          onClose={() => {
            setActiveModal(null);
            setScreenCompanionInitialImage(null);
          }}
          onLog={writeLog}
          currentUser={currentUser}
          authToken={authToken}
          initialImage={screenCompanionInitialImage}
        />
      )}

      {/* SuperAI Stocks Workspace Modal */}
      {activeModal === 'STOCKS' && (
        <StocksWorkspaceModal
          onClose={() => setActiveModal(null)}
          onLog={writeLog}
          currentUser={currentUser}
          authToken={authToken}
        />
      )}

      {/* ISHAI Firewall Browser Modal */}
      {activeModal === 'FIREWALL' && (
        <FirewallBrowserModal
          onClose={() => setActiveModal(null)}
          onLog={writeLog}
          currentUser={currentUser}
          authToken={authToken}
        />
      )}

      {/* SUPERAI What If Engine Modal */}
      {activeModal === 'WHAT_IF' && (
        <WhatIfEngineModal
          onClose={() => setActiveModal(null)}
          onLog={writeLog}
          currentUser={currentUser}
          authToken={authToken}
        />
      )}

      {/* SuperAI Clock Workspace Modal */}
      {activeModal === 'CLOCK' && (
        <ClockWorkspaceModal
          onClose={() => setActiveModal(null)}
          onLog={writeLog}
          currentUser={currentUser}
        />
      )}

      {/* SuperAI Maps Workspace Modal */}
      {activeModal === 'MAPS' && (
        <MapsWorkspaceModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          currentUser={currentUser}
        />
      )}

      {/* SuperAI Ethical Hacker Workspace Modal */}
      {activeModal === 'CYBER_SECURITY' && (
        <CyberWorkspaceModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          currentUser={currentUser}
        />
      )}

      {/* Consent-Based Live Location Recipient Modal */}
      {recipientInviteToken && (
        <RecipientConsentModal
          inviteToken={recipientInviteToken}
          onClose={() => {
            setRecipientInviteToken(null);
            try {
              const url = new URL(window.location.href);
              url.searchParams.delete('loc_invite');
              url.searchParams.delete('share_token');
              window.history.replaceState({}, '', url.toString());
            } catch {}
          }}
        />
      )}



      {/* Task Kill Manager */}
      {activeModal === 'TASK_KILL' && (
        <ModalWrapper title="💀 TASK KILL & PROCESS MANAGER" onClose={() => setActiveModal(null)}>
          <div className="space-y-3">
            <p className="text-xs text-emerald-400">Active simulated background processes:</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {[
                { pid: '4120', name: 'svchost_telemetry.exe', mem: '42 MB' },
                { pid: '8914', name: 'network_daemon.exe', mem: '18 MB' },
                { pid: '1240', name: 'calculator.exe', mem: '12 MB' },
                { pid: '7721', name: 'audio_engine_host.exe', mem: '34 MB' },
                { pid: '9002', name: 'browser_sandbox.exe', mem: '128 MB' },
              ].map((p: any) => (
                <div
                  key={p.pid}
                  className="flex items-center justify-between p-2 bg-black border border-emerald-950 rounded text-xs"
                >
                  <div>
                    <span className="text-emerald-500 font-bold">{p.pid}</span>
                    <span className="text-emerald-300 ml-2">{p.name}</span>
                    <span className="text-emerald-600 text-[10px] ml-2">({p.mem})</span>
                  </div>
                  <button
                    onClick={() => executeTaskKill(p.name)}
                    className="border border-red-900 text-red-400 hover:bg-red-500 hover:text-black px-2 py-0.5 rounded text-[10px]"
                  >
                    KILL
                  </button>
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (promptInput) executeTaskKill(promptInput);
              }}
              className="flex gap-2 pt-2 border-t border-emerald-950"
            >
              <input
                type="text"
                placeholder="Custom process name (e.g. chrome.exe)..."
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                className="flex-1 bg-black border border-emerald-800 text-xs text-emerald-300 px-3 py-1.5 rounded focus:outline-none"
              />
              <button
                type="submit"
                className="bg-red-900 text-red-200 hover:bg-red-700 text-xs px-3 py-1.5 rounded font-bold"
              >
                TERMINATE
              </button>
            </form>
          </div>
        </ModalWrapper>
      )}

      {/* Search Prompt */}
      {activeModal === 'SEARCH_PROMPT' && (
        <ModalWrapper title="🔍 GLOBAL ROUTING SEARCH" onClose={() => setActiveModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeSearch(promptInput);
            }}
            className="space-y-4"
          >
            <p className="text-xs text-emerald-400">Enter parameters for global search indexing pipelines:</p>
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Search query..."
              autoFocus
              className="w-full bg-black border border-emerald-700 px-3 py-2 text-xs text-emerald-300 rounded focus:outline-none focus:border-emerald-400"
            />
            <div className="flex justify-end gap-2">
              <button
                type="submit"
                className="bg-emerald-500 text-black font-bold px-4 py-1.5 text-xs rounded hover:bg-emerald-400"
              >
                LAUNCH SEARCH
              </button>
            </div>
          </form>
        </ModalWrapper>
      )}

      {/* WhatsApp Workspace Modal */}
      <WhatsAppWorkspaceModal
        isOpen={activeModal === 'WHATSAPP'}
        onClose={() => setActiveModal(null)}
        currentUser={currentUser}
      />

      {/* Voice Call Modal */}
      {activeModal === 'VOICE_CALL' && activeCall && (
        <VoiceCallModal
          onClose={() => {
            setActiveModal(null);
            setActiveCall(null);
          }}
          targetUser={activeCall.targetUser}
          type={activeCall.type}
        />
      )}
      
      {activeModal === 'CAMERA' && (
        <CameraModal 
          onClose={() => setActiveModal(null)} 
          onLog={writeLog} 
          currentUser={currentUser}
          onOpenVault={() => setActiveModal('VAULT')}
        />
      )}

      {activeModal === 'LENS_X' && (
        <LensXModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          userId={currentUser?.uid}
          writeLog={writeLog}
        />
      )}

      {activeModal === 'SPACE_XPLORER' && (
        <SpaceXplorerModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          userId={currentUser?.uid}
          writeLog={writeLog}
        />
      )}

      <GmailConnectModal
        isOpen={activeModal === 'GMAIL'}
        onClose={() => setActiveModal(null)}
        currentUser={currentUser}
        writeLog={writeLog}
      />

      <VoiceRecorderModal
        isOpen={activeModal === 'VOICE_RECORDER'}
        onClose={() => setActiveModal(null)}
        currentUser={currentUser}
        writeLog={writeLog}
        isHeyIshaiActive={voiceAssistantActive}
      />

      <MechanicalLabModal
        isOpen={activeModal === '3D_LAB'}
        onClose={() => setActiveModal(null)}
        writeLog={writeLog}
      />

      <WhiteboardModal
        isOpen={activeModal === 'WHITEBOARD'}
        onClose={() => setActiveModal(null)}
        writeLog={writeLog}
        userId={currentUser?.uid || 'guest'}
        theme={matrixBackground ? 'dark' : 'light'}
      />

      <WeatherModal
        isOpen={activeModal === 'WEATHER'}
        onClose={() => setActiveModal(null)}
        writeLog={writeLog}
        userId={currentUser?.uid || 'guest'}
        theme={matrixBackground ? 'dark' : 'light'}
      />

      <HoloAIModal
        isOpen={activeModal === 'HOLO_AI'}
        onClose={() => setActiveModal(null)}
        onExecuteCommand={handleHoloExecuteCommand}
        writeLog={writeLog}
        userId={currentUser?.uid || 'guest'}
        theme={matrixBackground ? 'dark' : 'light'}
        activeNote={activeNote}
      />

      <SettingsModal
        isOpen={activeModal === 'SETTINGS'}
        onClose={() => setActiveModal(null)}
        settings={userSettings}
        onUpdateSettings={handleUpdateSettings}
        onReplayIntro={handleReplayIntro}
      />

      <CityverseModal
        isOpen={activeModal === 'CITYVERSE'}
        onClose={() => setActiveModal(null)}
        writeLog={writeLog}
        userId={currentUser?.uid || 'guest'}
        theme={matrixBackground ? 'dark' : 'light'}
      />

      {/* SUPERAI NEWS 2.0 Modal */}
      <NewsModal
        isOpen={activeModal === 'NEWS'}
        onClose={() => setActiveModal(null)}
        initialTab={newsInitialTab}
        initialSearch={newsInitialSearch}
      />

      <VoiceAssistant2 
        isActive={voiceAssistantActive}
        onClose={() => setVoiceAssistantActive(false)}
        onLog={writeLog}
        voiceGender={voiceGender}
        onExecuteAction={onExecuteVoiceAction}
        activeModal={activeModal}
      />
    </div>
  );
}
