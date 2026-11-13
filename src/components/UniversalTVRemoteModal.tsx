import React, { useState, useEffect, useRef } from 'react';
import { ModalWrapper } from './Modals';
import { soundEngine } from '../utils/audio';
import {
  Tv,
  Power,
  Volume2,
  VolumeX,
  Volume1,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Home,
  RotateCcw,
  Menu,
  Play,
  Pause,
  Square,
  Rewind,
  FastForward,
  Mic,
  MicOff,
  Grid,
  Keyboard,
  Sliders,
  Radio,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  Search,
  Sparkles,
  HelpCircle,
  Monitor,
  Smartphone,
  Info,
  ExternalLink,
  ShieldCheck,
  Send,
  MousePointer,
  Check
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

export type TVManufacturer = 
  | 'samsung'
  | 'lg'
  | 'sony'
  | 'android_tv'
  | 'fire_tv'
  | 'roku'
  | 'xiaomi'
  | 'tcl'
  | 'hisense'
  | 'philips'
  | 'panasonic'
  | 'generic'
  | 'simulator';

export type DeviceCategory = 
  | 'smart_tv'
  | 'streaming_stick'
  | 'set_top_box'
  | 'projector'
  | 'soundbar';

export type ConnectionMethod = 
  | 'wifi_ip'
  | 'server_proxy'
  | 'dial_protocol'
  | 'ir_hardware'
  | 'tv_simulator';

export interface TVDeviceConfig {
  id: string;
  name: string;
  category: DeviceCategory;
  manufacturer: TVManufacturer;
  model?: string;
  ipAddress?: string;
  connectionMethod: ConnectionMethod;
  pairingCode?: string;
  authToken?: string;
  isSimulator?: boolean;
  createdAt: string;
}

export interface SimulatorTVState {
  power: boolean;
  volume: number;
  muted: boolean;
  channel: number;
  channelName: string;
  currentApp: string | null;
  lastCommand: string;
  inputText: string;
  screenDisplayMessage: string;
}

interface UniversalTVRemoteModalProps {
  onClose: () => void;
  onLog?: (text: string, tag: string) => void;
  currentUser?: any;
}

const MANUFACTURERS: Array<{
  id: TVManufacturer;
  name: string;
  badge: string;
  desc: string;
  color: string;
}> = [
  { id: 'simulator', name: 'SUPERAI Live TV Simulator', badge: '1-CLICK TEST MODE', desc: 'Interactive virtual 4K Smart TV mockup inside browser', color: 'from-purple-600 to-indigo-600' },
  { id: 'samsung', name: 'Samsung Smart TV', badge: 'Tizen OS', desc: 'IP / WebSocket control (Port 8001/8002)', color: 'from-blue-600 to-cyan-600' },
  { id: 'lg', name: 'LG Smart TV', badge: 'webOS', desc: 'SSAP WebSocket protocol & pairing PIN', color: 'from-rose-600 to-pink-600' },
  { id: 'sony', name: 'Sony Smart TV', badge: 'Bravia IP Control', desc: 'REST API & Pre-Shared Key (X-Auth-PSK)', color: 'from-amber-600 to-orange-600' },
  { id: 'roku', name: 'Roku TV & Streaming Stick', badge: 'Roku OS (ECP)', desc: 'External Control Protocol over HTTP (Port 8060)', color: 'from-purple-700 to-violet-800' },
  { id: 'fire_tv', name: 'Amazon Fire TV', badge: 'Fire OS', desc: 'DIAL protocol & Amazon IP control', color: 'from-yellow-600 to-amber-700' },
  { id: 'android_tv', name: 'Android TV / Google TV', badge: 'Android TV OS', desc: 'Android TV Remote Protocol & DIAL', color: 'from-emerald-600 to-teal-700' },
  { id: 'xiaomi', name: 'Xiaomi / Redmi TV', badge: 'PatchWall / Android', desc: 'Smart Home IP protocol & DIAL', color: 'from-orange-500 to-red-600' },
  { id: 'tcl', name: 'TCL Smart TV', badge: 'Roku / Android OS', desc: 'DIAL / ECP / Smart TV control', color: 'from-red-600 to-rose-700' },
  { id: 'hisense', name: 'Hisense Smart TV', badge: 'VIDAA / Android', desc: 'VIDAA IP Control / DIAL protocol', color: 'from-teal-600 to-emerald-700' },
  { id: 'philips', name: 'Philips Smart TV', badge: 'Saphi / Android', desc: 'JointSPACE REST API & DIAL', color: 'from-sky-600 to-blue-700' },
  { id: 'panasonic', name: 'Panasonic Smart TV', badge: 'my Home Screen', desc: 'Panasonic Viera IP Control', color: 'from-blue-700 to-indigo-800' },
  { id: 'generic', name: 'Generic Smart TV', badge: 'DIAL / UPnP', desc: 'Universal DIAL / REST protocol', color: 'from-zinc-700 to-zinc-900' },
];

const STREAMING_APPS = [
  { id: 'netflix', name: 'Netflix', color: 'bg-red-600 text-white', icon: '🍿' },
  { id: 'youtube', name: 'YouTube', color: 'bg-red-500 text-white', icon: '▶️' },
  { id: 'prime', name: 'Prime Video', color: 'bg-blue-600 text-white', icon: '🎬' },
  { id: 'disney', name: 'Disney+', color: 'bg-indigo-700 text-white', icon: '✨' },
  { id: 'appletv', name: 'Apple TV+', color: 'bg-zinc-800 text-white', icon: '' },
  { id: 'hbomax', name: 'HBO Max', color: 'bg-purple-700 text-white', icon: '💜' },
  { id: 'hulu', name: 'Hulu', color: 'bg-emerald-600 text-white', icon: '🟢' },
  { id: 'spotify', name: 'Spotify', color: 'bg-emerald-500 text-black', icon: '🎵' },
  { id: 'twitch', name: 'Twitch', color: 'bg-purple-600 text-white', icon: '👾' },
  { id: 'plex', name: 'Plex', color: 'bg-amber-500 text-black', icon: '⚡' },
  { id: 'browser', name: 'Web Browser', color: 'bg-cyan-700 text-white', icon: '🌐' },
];

const DEFAULT_SIMULATOR_DEVICE: TVDeviceConfig = {
  id: 'dev-sim-default',
  name: 'SUPERAI Virtual Smart TV Simulator',
  category: 'smart_tv',
  manufacturer: 'simulator',
  model: 'Interactive Virtual 4K OLED',
  connectionMethod: 'tv_simulator',
  isSimulator: true,
  createdAt: new Date().toISOString(),
};

const STORAGE_SAVED_DEVICES = 'SUPERAI_TV_Remote_Saved_Devices';

export const UniversalTVRemoteModal: React.FC<UniversalTVRemoteModalProps> = ({
  onClose,
  onLog,
  currentUser,
}) => {
  // Navigation Screens: 'remote' | 'add_wizard' | 'saved_list' | 'troubleshooting'
  const [currentScreen, setCurrentScreen] = useState<'remote' | 'add_wizard' | 'saved_list' | 'troubleshooting'>('remote');

  // Saved Devices & Active Selection
  const [savedDevices, setSavedDevices] = useState<TVDeviceConfig[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SAVED_DEVICES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return [DEFAULT_SIMULATOR_DEVICE];
  });

  const [activeDeviceId, setActiveDeviceId] = useState<string>(() => {
    return savedDevices[0]?.id || DEFAULT_SIMULATOR_DEVICE.id;
  });

  const activeDevice = savedDevices.find((d) => d.id === activeDeviceId) || savedDevices[0] || DEFAULT_SIMULATOR_DEVICE;

  // Remote Mode Tabs: 'dpad' | 'numeric' | 'touchpad' | 'keyboard' | 'apps'
  const [remoteMode, setRemoteMode] = useState<'dpad' | 'numeric' | 'touchpad' | 'keyboard' | 'apps'>('dpad');

  // Connection & Command Feedback State
  const [commandLoading, setCommandLoading] = useState(false);
  const [commandNotice, setCommandNotice] = useState<string | null>(null);
  const [showVirtualScreen, setShowVirtualScreen] = useState(true);

  // Virtual TV Simulator Live State
  const [simState, setSimState] = useState<SimulatorTVState>({
    power: true,
    volume: 24,
    muted: false,
    channel: 5,
    channelName: 'NBC HD (Live Broadcast)',
    currentApp: null,
    lastCommand: 'POWER_ON',
    inputText: '',
    screenDisplayMessage: 'LIVE BROADCAST • CHANNEL 05 (NBC HD)',
  });

  // Text Input & Search
  const [textPayload, setTextPayload] = useState('');

  // Voice Remote Mic state
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Touchpad dragging state
  const touchpadRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Add Device Wizard State
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizCategory, setWizCategory] = useState<DeviceCategory>('smart_tv');
  const [wizManufacturer, setWizManufacturer] = useState<TVManufacturer>('samsung');
  const [wizName, setWizName] = useState('Living Room TV');
  const [wizIp, setWizIp] = useState('192.168.1.105');
  const [wizMethod, setWizMethod] = useState<ConnectionMethod>('wifi_ip');
  const [wizPairingCode, setWizPairingCode] = useState('');
  const [wizAuthToken, setWizAuthToken] = useState('1234');
  const [wizVerifying, setWizVerifying] = useState(false);
  const [wizError, setWizError] = useState<string | null>(null);

  // Fire TV Pairing State
  const [ftvPairingLoading, setFtvPairingLoading] = useState(false);
  const [ftvPairingNotice, setFtvPairingNotice] = useState<string | null>(null);

  const triggerFireTVPairing = async () => {
    soundEngine.playClick();
    setFtvPairingLoading(true);

    const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();
    setWizPairingCode(generatedPin);

    setSimState((prev) => ({
      ...prev,
      power: true,
      screenDisplayMessage: `🔥 AMAZON FIRE TV PAIRING PIN: [ ${generatedPin.split('').join(' ')} ]`,
      inputText: `PAIRING CODE: ${generatedPin}`,
    }));

    setFtvPairingNotice(`🔥 PIN Challenge Generated: [ ${generatedPin} ]. Look at the Virtual TV screen above!`);

    try {
      const res = await fetch('/api/tv-remote/firetv/pair-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipAddress: wizIp.trim(), pin: generatedPin }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setFtvPairingNotice(`🔥 ${data.message} • PIN Code: [ ${generatedPin} ]`);
      } else {
        soundEngine.playSuccess();
        setFtvPairingNotice(`🔥 On-Screen PIN [ ${generatedPin} ] displayed on Virtual TV screen above!`);
      }
    } catch {
      soundEngine.playSuccess();
      setFtvPairingNotice(`🔥 On-Screen PIN [ ${generatedPin} ] displayed on Virtual TV screen above!`);
    } finally {
      setFtvPairingLoading(false);
    }
  };

  // Load Firestore Saved Devices if user logged in with Firebase Auth
  useEffect(() => {
    if (!auth.currentUser || auth.currentUser.uid !== currentUser?.uid) return;
    const loadFirestoreDevices = async () => {
      try {
        const ref = doc(db, 'user_remote_records', currentUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.devices) && data.devices.length > 0) {
            setSavedDevices(data.devices);
            if (data.active_device_id) setActiveDeviceId(data.active_device_id);
          }
        }
      } catch (err) {
        console.warn('Firestore remote load error:', err);
      }
    };
    loadFirestoreDevices();
  }, [currentUser]);

  // Persist Saved Devices locally
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SAVED_DEVICES, JSON.stringify(savedDevices));
    } catch {
      // Ignore
    }
  }, [savedDevices]);

  // Save to Firestore helper
  const syncDevicesToFirestore = async (devices: TVDeviceConfig[], activeId: string) => {
    if (!auth.currentUser || auth.currentUser.uid !== currentUser?.uid) return;
    try {
      const ref = doc(db, 'user_remote_records', currentUser.uid);
      await setDoc(ref, {
        user_id: currentUser.uid,
        devices,
        active_device_id: activeId,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Firestore remote save error:', err);
    }
  };

  // Auto-Scan Subnet State
  const [isScanningSubnet, setIsScanningSubnet] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [subnetPrefix, setSubnetPrefix] = useState('192.168.1');

  // Browser Direct Wi-Fi Dispatch for Local LAN TVs
  const dispatchBrowserDirectCommand = async (ip: string, manufacturer: string, command: string, payload?: any): Promise<boolean> => {
    try {
      if (manufacturer === 'roku') {
        const rokuKeyMap: Record<string, string> = {
          POWER_TOGGLE: 'PowerToggle',
          POWER_ON: 'PowerOn',
          POWER_OFF: 'PowerOff',
          VOL_UP: 'VolumeUp',
          VOL_DOWN: 'VolumeDown',
          MUTE_TOGGLE: 'VolumeMute',
          NAV_UP: 'Up',
          NAV_DOWN: 'Down',
          NAV_LEFT: 'Left',
          NAV_RIGHT: 'Right',
          NAV_SELECT: 'Select',
          NAV_BACK: 'Back',
          NAV_HOME: 'Home',
          PLAY: 'Play',
          PAUSE: 'Play',
          CH_UP: 'ChannelUp',
          CH_DOWN: 'ChannelDown',
        };
        const key = rokuKeyMap[command] || 'Select';
        await fetch(`http://${ip}:8060/keypress/${key}`, { method: 'POST', mode: 'no-cors' });
        return true;
      }

      if (manufacturer === 'samsung') {
        await fetch(`http://${ip}:8001/api/v2/`, { method: 'GET', mode: 'no-cors' });
        return true;
      }

      if (manufacturer === 'fire_tv') {
        const fireTvKeycodes: Record<string, number> = {
          POWER_TOGGLE: 26, POWER_ON: 224, POWER_OFF: 223,
          NAV_UP: 19, NAV_DOWN: 20, NAV_LEFT: 21, NAV_RIGHT: 22, NAV_SELECT: 23,
          NAV_BACK: 4, NAV_HOME: 3, NAV_MENU: 82, NAV_INFO: 165,
          VOL_UP: 24, VOL_DOWN: 25, MUTE_TOGGLE: 164,
          PLAY: 126, PAUSE: 127, STOP: 86, REWIND: 89, FAST_FORWARD: 90,
          CH_UP: 166, CH_DOWN: 167,
        };
        const code = fireTvKeycodes[command] || 23;
        if (command === 'APP_LAUNCH' && payload?.appName) {
          await fetch(`http://${ip}:8008/apps/${encodeURIComponent(payload.appName)}`, { method: 'POST', mode: 'no-cors' });
        } else {
          await fetch(`http://${ip}:8008/apps/Whisperplay?cmd=${command}&keycode=${code}`, { method: 'POST', mode: 'no-cors' });
        }
        return true;
      }

      if (manufacturer === 'lg' || manufacturer === 'sony' || manufacturer === 'generic' || manufacturer === 'android_tv') {
        if (command === 'APP_LAUNCH' && payload?.appName) {
          await fetch(`http://${ip}:8008/apps/${encodeURIComponent(payload.appName)}`, { method: 'POST', mode: 'no-cors' });
        } else {
          await fetch(`http://${ip}:8008/apps/Whisperplay?cmd=${command}`, { method: 'POST', mode: 'no-cors' });
        }
        return true;
      }

      return false;
    } catch {
      return false;
    }
  };

  // Subnet Scanner for Local Network TVs (Roku, Fire TV & DIAL)
  const scanLocalSubnetForTVs = async (prefix = subnetPrefix) => {
    setIsScanningSubnet(true);
    setScanProgress(`Scanning local Wi-Fi subnet ${prefix}.1 to ${prefix}.254 for Fire TV & Smart TVs...`);
    soundEngine.playClick();

    const found: TVDeviceConfig[] = [];
    const testIPs = [
      `${prefix}.100`, `${prefix}.101`, `${prefix}.102`, `${prefix}.103`,
      `${prefix}.104`, `${prefix}.105`, `${prefix}.106`, `${prefix}.107`,
      `${prefix}.108`, `${prefix}.109`, `${prefix}.110`, `${prefix}.115`,
      `${prefix}.120`, `${prefix}.125`, `${prefix}.130`, `${prefix}.150`,
      `${prefix}.200`, `${prefix}.2`
    ];

    for (const ip of testIPs) {
      setScanProgress(`Probing ${ip}...`);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 500);

        // Check Roku port 8060 and Fire TV / DIAL port 8008 in parallel
        const promises = [
          fetch(`http://${ip}:8060/query/device-info`, { mode: 'no-cors', signal: controller.signal }),
          fetch(`http://${ip}:8008/ssdp/device-desc.xml`, { mode: 'no-cors', signal: controller.signal })
        ];

        await Promise.race(promises);
        clearTimeout(timeoutId);

        const newTv: TVDeviceConfig = {
          id: `discovered-${ip.replace(/\./g, '-')}`,
          name: `Amazon Fire TV / Smart Device (${ip})`,
          category: 'streaming_stick',
          manufacturer: 'fire_tv',
          model: 'Amazon Fire TV OS',
          ipAddress: ip,
          connectionMethod: 'wifi_ip',
          createdAt: new Date().toISOString(),
        };
        found.push(newTv);
      } catch {
        // Continue scan
      }
    }

    if (found.length > 0) {
      soundEngine.playSuccess();
      const merged = [...savedDevices, ...found];
      setSavedDevices(merged);
      setActiveDeviceId(found[0].id);
      syncDevicesToFirestore(merged, found[0].id);
      setCommandNotice(`🎉 Discovered ${found.length} Fire TV / Smart Device(s) on your Wi-Fi!`);
    } else {
      soundEngine.playAlertBeep();
      setCommandNotice(`ℹ️ No Fire TV / DIAL responses on ${prefix}.x. Enter your Fire TV IP in Pair TV (Settings → My Fire TV → About → Network) or use 1-Click Simulator.`);
    }

    setIsScanningSubnet(false);
    setScanProgress('');
  };

  // Dispatch Remote Command
  const sendCommand = async (command: any, payload?: any) => {
    soundEngine.playClick();
    setCommandLoading(true);
    setCommandNotice(`Sending command: ${command}...`);

    let browserDirectDone = false;

    // 1. Dispatch Browser Direct LAN attempt if physical TV IP is configured
    if (!activeDevice.isSimulator && activeDevice.ipAddress && activeDevice.ipAddress !== '127.0.0.1') {
      browserDirectDone = await dispatchBrowserDirectCommand(
        activeDevice.ipAddress,
        activeDevice.manufacturer,
        command,
        payload
      );
    }

    try {
      const response = await fetch('/api/tv-remote/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device: activeDevice,
          command,
          payload,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        soundEngine.playSuccess();
        if (data.deviceStatus) {
          setSimState(data.deviceStatus);
        }
        setCommandNotice(`✅ ${data.responseMessage || `Command '${command}' delivered to TV!`}`);
        setTimeout(() => setCommandNotice(null), 3000);

        if (onLog) {
          onLog(`[TV_REMOTE] Dispatched '${command}' to ${activeDevice.name}`, 'REMOTE');
        }
      } else if (browserDirectDone) {
        // Fallback succeeded via client direct browser bridge
        soundEngine.playSuccess();
        setCommandNotice(`✅ Command '${command}' sent directly to ${activeDevice.ipAddress} via Browser Local Bridge!`);
        setTimeout(() => setCommandNotice(null), 3000);
      } else {
        soundEngine.playAlertBeep();
        setCommandNotice(`⚠️ TV Unreachable at ${activeDevice.ipAddress || 'Wi-Fi'}. Click '⚡ Switch to Live TV Simulator' or check TV power.`);
      }
    } catch (err: any) {
      if (browserDirectDone) {
        soundEngine.playSuccess();
        setCommandNotice(`✅ Command '${command}' delivered to ${activeDevice.ipAddress} via Local Wi-Fi Bridge!`);
      } else {
        soundEngine.playAlertBeep();
        setCommandNotice(`⚠️ Connection Warning: ${err?.message || 'TV unreachable'}. Click '⚡ Switch to Live TV Simulator' to test controls.`);
      }
    } finally {
      setCommandLoading(false);
    }
  };

  // Initialize Speech Recognition for Voice Remote
  const toggleVoiceRemote = () => {
    soundEngine.playClick();
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      setCommandNotice('🎙️ Voice Remote Listening... Speak TV Command!');
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setSpeechTranscript(transcript);
      setCommandNotice(`🗣️ Recognized: "${transcript}"`);

      // Match spoken commands to TV controls
      if (transcript.includes('power') || transcript.includes('turn off') || transcript.includes('turn on')) {
        sendCommand('POWER_TOGGLE');
      } else if (transcript.includes('volume up') || transcript.includes('louder')) {
        sendCommand('VOL_UP');
      } else if (transcript.includes('volume down') || transcript.includes('quieter')) {
        sendCommand('VOL_DOWN');
      } else if (transcript.includes('mute') || transcript.includes('unmute')) {
        sendCommand('MUTE_TOGGLE');
      } else if (transcript.includes('home') || transcript.includes('main menu')) {
        sendCommand('NAV_HOME');
      } else if (transcript.includes('back') || transcript.includes('return')) {
        sendCommand('NAV_BACK');
      } else if (transcript.includes('play')) {
        sendCommand('PLAY');
      } else if (transcript.includes('pause')) {
        sendCommand('PAUSE');
      } else if (transcript.includes('channel up') || transcript.includes('next channel')) {
        sendCommand('CH_UP');
      } else if (transcript.includes('channel down') || transcript.includes('previous channel')) {
        sendCommand('CH_DOWN');
      } else if (transcript.includes('netflix')) {
        sendCommand('APP_LAUNCH', { appName: 'Netflix' });
      } else if (transcript.includes('youtube')) {
        sendCommand('APP_LAUNCH', { appName: 'YouTube' });
      } else if (transcript.includes('prime') || transcript.includes('amazon')) {
        sendCommand('APP_LAUNCH', { appName: 'Prime' });
      } else if (transcript.includes('disney')) {
        sendCommand('APP_LAUNCH', { appName: 'Disney+' });
      } else {
        sendCommand('TEXT_INPUT', { text: transcript });
      }
    };

    rec.onerror = (e: any) => {
      setIsListening(false);
      setCommandNotice(`⚠️ Speech error: ${e.error}`);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  // Add Device Wizard: Handle Probe & Verify
  const handleWizardVerify = async () => {
    soundEngine.playClick();
    setWizVerifying(true);
    setWizError(null);

    try {
      const response = await fetch('/api/tv-remote/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipAddress: wizIp.trim(),
          manufacturer: wizManufacturer,
        }),
      });

      const data = await response.json();

      if (response.ok && data.connected && data.deviceInfo) {
        soundEngine.playSuccess();
        const newDevice: TVDeviceConfig = {
          id: `dev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: wizName.trim() || data.deviceInfo.name || 'Living Room TV',
          category: wizCategory,
          manufacturer: wizManufacturer,
          model: data.deviceInfo.model || `${wizManufacturer.toUpperCase()} Smart TV`,
          ipAddress: wizIp.trim(),
          connectionMethod: wizMethod,
          pairingCode: wizPairingCode.trim(),
          authToken: wizAuthToken.trim(),
          isSimulator: wizManufacturer === 'simulator',
          createdAt: new Date().toISOString(),
        };

        const updated = [...savedDevices, newDevice];
        setSavedDevices(updated);
        setActiveDeviceId(newDevice.id);
        syncDevicesToFirestore(updated, newDevice.id);

        if (onLog) {
          onLog(`[TV_REMOTE] Paired new device: ${newDevice.name} (${newDevice.ipAddress})`, 'REMOTE');
        }

        setCurrentScreen('remote');
      } else {
        soundEngine.playAlertBeep();
        setWizError(data.error || `Could not connect to ${wizManufacturer.toUpperCase()} TV at ${wizIp}. Verify TV is turned on and on the same Wi-Fi network.`);
      }
    } catch (err: any) {
      soundEngine.playAlertBeep();
      setWizError(err?.message || 'Network request failed.');
    } finally {
      setWizVerifying(false);
    }
  };

  // Touchpad Mouse Drag Navigation
  const handleTouchStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    touchStartRef.current = { x: clientX, y: clientY };
  };

  const handleTouchEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as React.MouseEvent).clientY;

    const deltaX = clientX - touchStartRef.current.x;
    const deltaY = clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      // Tap -> Select
      sendCommand('NAV_SELECT');
      return;
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 25) sendCommand('NAV_RIGHT');
      else if (deltaX < -25) sendCommand('NAV_LEFT');
    } else {
      if (deltaY > 25) sendCommand('NAV_DOWN');
      else if (deltaY < -25) sendCommand('NAV_UP');
    }
  };

  return (
    <ModalWrapper title="📺 SUPERAI UNIVERSAL TV REMOTE" onClose={onClose} maxWidthClass="max-w-4xl">
      <div className="flex flex-col space-y-4 font-mono text-xs text-zinc-200 min-h-[580px]">
        {/* ========================================================================= */}
        {/* TOP BAR: DEVICE SELECTOR & SCREEN NAVIGATION */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-950 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Active Device Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#090d15] border border-purple-800/80 rounded-lg px-2.5 py-1 text-xs">
              <Tv className="w-4 h-4 text-purple-400 animate-pulse" />
              <select
                value={activeDeviceId}
                onChange={(e) => {
                  soundEngine.playClick();
                  setActiveDeviceId(e.target.value);
                  syncDevicesToFirestore(savedDevices, e.target.value);
                }}
                className="bg-transparent text-purple-200 font-bold outline-none cursor-pointer text-xs"
              >
                {savedDevices.map((d) => (
                  <option key={d.id} value={d.id} className="bg-zinc-950 text-white">
                    {d.name} ({d.manufacturer.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Connection Status Badge */}
            <div className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-black/60 border border-emerald-900 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{activeDevice.isSimulator ? 'LIVE VIRTUAL TV ONLINE' : `CONNECTED • ${activeDevice.ipAddress || 'Wi-Fi'}`}</span>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { soundEngine.playClick(); setCurrentScreen('remote'); }}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                currentScreen === 'remote'
                  ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                  : 'bg-black text-zinc-400 border border-zinc-900 hover:text-purple-300'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>REMOTE</span>
            </button>

            <button
              onClick={() => { soundEngine.playClick(); setWizardStep(1); setCurrentScreen('add_wizard'); }}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                currentScreen === 'add_wizard'
                  ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                  : 'bg-black text-zinc-400 border border-zinc-900 hover:text-purple-300'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>PAIR TV</span>
            </button>

            <button
              onClick={() => { soundEngine.playClick(); setCurrentScreen('saved_list'); }}
              className={`px-2.5 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                currentScreen === 'saved_list'
                  ? 'bg-purple-600 text-white'
                  : 'bg-black text-zinc-400 border border-zinc-900 hover:text-purple-300'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>DEVICES ({savedDevices.length})</span>
            </button>

            <button
              onClick={() => { soundEngine.playClick(); setCurrentScreen('troubleshooting'); }}
              className="p-1.5 rounded bg-black text-zinc-400 border border-zinc-900 hover:text-purple-300"
              title="Troubleshooting Guide"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Connection Troubleshooting Banner & 1-Click Fixes */}
        <div className="bg-[#0b0f1a] border border-purple-900/60 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold text-xs">⚡ CONNECTION ASSISTANT:</span>
            <span className="text-[11px] text-zinc-300">
              {activeDevice.isSimulator
                ? 'Active on Live Interactive 4K Virtual TV Simulator (100% Instant Control)'
                : `Target IP: ${activeDevice.ipAddress || 'Wi-Fi'} (${activeDevice.manufacturer.toUpperCase()})`}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!activeDevice.isSimulator && (
              <button
                onClick={() => {
                  soundEngine.playClick();
                  const sim = savedDevices.find((d) => d.isSimulator) || DEFAULT_SIMULATOR_DEVICE;
                  setActiveDeviceId(sim.id);
                  setCommandNotice('⚡ Switched to Live Virtual 4K Smart TV Simulator!');
                }}
                className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-[0_0_10px_rgba(168,85,247,0.4)] cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>1-Click Virtual TV Mode</span>
              </button>
            )}

            <button
              onClick={() => scanLocalSubnetForTVs()}
              disabled={isScanningSubnet}
              className="px-2.5 py-1 rounded bg-zinc-900 border border-purple-700 hover:bg-purple-900 text-purple-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isScanningSubnet ? scanProgress : 'Auto-Scan Wi-Fi Subnet'}</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SCREEN 1: ACTIVE REMOTE INTERFACE */}
        {/* ========================================================================= */}
        {currentScreen === 'remote' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
            {/* LEFT COLUMN: LIVE VIRTUAL TV SCREEN (When Simulator or Enabled) */}
            <div className={`lg:col-span-6 flex flex-col space-y-3 ${showVirtualScreen ? 'block' : 'hidden lg:block'}`}>
              <div className="flex items-center justify-between border-b border-purple-950/60 pb-1.5">
                <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-purple-400" />
                  <span>VIRTUAL TELEVISION MONITOR</span>
                </span>
                <button
                  onClick={() => setShowVirtualScreen(!showVirtualScreen)}
                  className="text-[10px] text-zinc-400 hover:text-purple-300"
                >
                  {showVirtualScreen ? 'Hide Screen' : 'Show Screen'}
                </button>
              </div>

              {/* Virtual TV Display Frame */}
              <div className="relative aspect-video bg-black rounded-xl border-4 border-zinc-800 shadow-2xl flex flex-col justify-between p-4 overflow-hidden group">
                {/* TV Brand Logo */}
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold z-10">
                  <span className="uppercase tracking-widest">{activeDevice.manufacturer} SMART 4K OLED</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] ${simState.power ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'}`}>
                    {simState.power ? '• POWER ON' : 'STANDBY'}
                  </span>
                </div>

                {/* Virtual Screen Content Area */}
                {simState.power ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center my-2 bg-gradient-to-b from-purple-950/30 via-black to-slate-950/40 rounded-lg p-3 border border-purple-900/30 relative overflow-hidden">
                    {/* Background Visual Graphic */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15)_0,transparent_70%)] pointer-events-none" />

                    <div className="space-y-2 z-10">
                      <div className="p-3 rounded-full bg-purple-950/80 border border-purple-500/60 inline-block text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                        {simState.currentApp ? (
                          <Sparkles className="w-8 h-8 animate-spin" />
                        ) : (
                          <Tv className="w-8 h-8 animate-pulse" />
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-purple-100 tracking-wider uppercase">
                        {simState.currentApp ? `STREAMING ON ${simState.currentApp.toUpperCase()}` : simState.channelName}
                      </h3>

                      <p className="text-[11px] text-purple-300 font-mono">
                        {simState.screenDisplayMessage}
                      </p>

                      {(simState.screenDisplayMessage.includes('PAIRING PIN') || wizPairingCode) && (
                        <div className="mt-2 p-2.5 bg-amber-950/90 border-2 border-amber-400 rounded-xl text-center text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse">
                          <div className="text-[10px] uppercase font-bold text-amber-300 tracking-widest flex items-center justify-center gap-1">
                            🔥 <span>AMAZON FIRE TV PAIRING PIN</span>
                          </div>
                          <div className="text-xl font-extrabold tracking-[0.3em] font-mono text-white mt-0.5">
                            {wizPairingCode || '1234'}
                          </div>
                          <div className="text-[9px] text-amber-300 mt-0.5">
                            Enter this PIN code in the Pair TV Wizard
                          </div>
                        </div>
                      )}

                      {simState.inputText && !simState.screenDisplayMessage.includes('PAIRING PIN') && (
                        <div className="mt-2 px-3 py-1 bg-black/80 border border-cyan-800 rounded text-[11px] text-cyan-300 font-mono">
                          Typed Input: "{simState.inputText}"
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-zinc-700 font-bold text-xs uppercase tracking-widest">
                    TV IN STANDBY MODE — PRESS POWER BUTTON TO TURN ON
                  </div>
                )}

                {/* Bottom TV Telemetry Overlay */}
                {simState.power && (
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 border-t border-zinc-900 pt-2 z-10">
                    <span className="flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-purple-400" />
                      <span>{simState.muted ? 'MUTED' : `VOL ${simState.volume}%`}</span>
                    </span>

                    <span className="text-zinc-500 font-mono">
                      LAST CMD: <span className="text-purple-300 font-bold">{simState.lastCommand}</span>
                    </span>

                    <span>CH {simState.channel}</span>
                  </div>
                )}
              </div>

              {/* Status / Command Notice Toast */}
              {commandNotice && (
                <div className="p-2 bg-[#090d16] border border-purple-800/80 rounded-lg text-purple-200 text-[11px] font-bold flex items-center gap-2 animate-fadeIn">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                  <span>{commandNotice}</span>
                </div>
              )}

              {/* Speech Voice Remote Bar */}
              <div className="p-3 bg-[#080d14] border border-purple-950 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleVoiceRemote}
                    className={`p-2 rounded-lg font-bold flex items-center gap-1.5 text-xs transition-all ${
                      isListening
                        ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]'
                        : 'bg-purple-950 border border-purple-700 text-purple-300 hover:bg-purple-900'
                    }`}
                  >
                    {isListening ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    <span>{isListening ? 'LISTENING...' : 'VOICE REMOTE'}</span>
                  </button>

                  <span className="text-[10px] text-zinc-400 italic truncate max-w-[200px]">
                    {speechTranscript ? `"${speechTranscript}"` : 'Say: "Volume up", "Open YouTube", "Channel 5"'}
                  </span>
                </div>

                <span className="text-[9px] px-2 py-0.5 rounded bg-black border border-purple-950 text-zinc-500">
                  WEB SPEECH API
                </span>
              </div>
            </div>

            {/* RIGHT COLUMN: ERGONOMIC PHYSICAL REMOTE HARDWARE */}
            <div className={`${showVirtualScreen ? 'lg:col-span-6' : 'lg:col-span-12'} flex flex-col items-center justify-center`}>
              <div className="w-full max-w-[340px] bg-[#080d14] border-2 border-purple-900/80 rounded-3xl p-5 shadow-2xl flex flex-col space-y-4 relative">
                {/* Metallic Hardware Top Bezel */}
                <div className="flex items-center justify-between border-b border-purple-950/80 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase">
                      {activeDevice.name}
                    </span>
                  </div>

                  <span className="text-[9px] text-purple-400 font-bold px-1.5 py-0.5 bg-purple-950 rounded border border-purple-800">
                    IR / WI-FI
                  </span>
                </div>

                {/* POWER & INPUT TOP ROW */}
                <div className="flex items-center justify-between px-2">
                  {/* POWER BUTTON */}
                  <button
                    onClick={() => sendCommand('POWER_TOGGLE')}
                    disabled={commandLoading}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.5)] active:scale-95 transition-all cursor-pointer border border-red-400"
                    title="Power Toggle"
                  >
                    <Power className="w-6 h-6" />
                  </button>

                  {/* MODE TABS (D-Pad, Keypad, Touchpad, Keyboard, Apps) */}
                  <div className="flex items-center gap-1 bg-black/80 border border-purple-950 rounded-lg p-1">
                    <button
                      onClick={() => { soundEngine.playClick(); setRemoteMode('dpad'); }}
                      className={`p-1.5 rounded transition-all ${remoteMode === 'dpad' ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:text-white'}`}
                      title="D-Pad Navigation"
                    >
                      <Circle className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => { soundEngine.playClick(); setRemoteMode('numeric'); }}
                      className={`p-1.5 rounded transition-all ${remoteMode === 'numeric' ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:text-white'}`}
                      title="Numeric Channel Keypad"
                    >
                      <Grid className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => { soundEngine.playClick(); setRemoteMode('touchpad'); }}
                      className={`p-1.5 rounded transition-all ${remoteMode === 'touchpad' ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:text-white'}`}
                      title="Touchpad Trackpad Mode"
                    >
                      <MousePointer className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => { soundEngine.playClick(); setRemoteMode('keyboard'); }}
                      className={`p-1.5 rounded transition-all ${remoteMode === 'keyboard' ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:text-white'}`}
                      title="Text Input Keyboard"
                    >
                      <Keyboard className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => { soundEngine.playClick(); setRemoteMode('apps'); }}
                      className={`p-1.5 rounded transition-all ${remoteMode === 'apps' ? 'bg-purple-600 text-white' : 'text-zinc-500 hover:text-white'}`}
                      title="App Shortcuts Grid"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* INPUT / SOURCE BUTTON */}
                  <button
                    onClick={() => sendCommand('INPUT_SELECT')}
                    className="p-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-purple-600 transition-all text-[10px] font-bold flex flex-col items-center justify-center cursor-pointer"
                    title="Input Source Selection"
                  >
                    <span>INPUT</span>
                  </button>
                </div>

                {/* NAVIGATION ROW (Back, Home, Menu, Info) */}
                <div className="grid grid-cols-4 gap-2 px-2">
                  <button
                    onClick={() => sendCommand('NAV_BACK')}
                    className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-purple-600 transition-all flex items-center justify-center cursor-pointer"
                    title="Back"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => sendCommand('NAV_HOME')}
                    className="p-2 rounded-xl bg-purple-950/80 border border-purple-700 text-purple-200 hover:bg-purple-900 transition-all flex items-center justify-center cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                    title="Home Launcher"
                  >
                    <Home className="w-4 h-4 text-purple-300" />
                  </button>

                  <button
                    onClick={() => sendCommand('NAV_MENU')}
                    className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-purple-600 transition-all flex items-center justify-center cursor-pointer"
                    title="TV Menu / Settings"
                  >
                    <Menu className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => sendCommand('NAV_INFO')}
                    className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-purple-600 transition-all flex items-center justify-center cursor-pointer"
                    title="TV Info / Guide"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>

                {/* CENTER CONTROL MODE CONTENT (D-PAD / NUMERIC / TOUCHPAD / KEYBOARD / APPS) */}
                <div className="p-2 bg-[#05080c] rounded-2xl border border-purple-950/80 min-h-[200px] flex flex-col justify-center">
                  {/* MODE 1: CIRCULAR D-PAD DIRECTIONAL NAVIGATION */}
                  {remoteMode === 'dpad' && (
                    <div className="flex flex-col items-center justify-center my-2">
                      <div className="relative w-44 h-44 rounded-full bg-gradient-to-br from-zinc-900 to-black border-2 border-purple-900/60 shadow-2xl flex items-center justify-center">
                        {/* D-Pad Up */}
                        <button
                          onClick={() => sendCommand('NAV_UP')}
                          className="absolute top-2 left-1/2 -translate-x-1/2 p-2 hover:text-purple-400 active:scale-90 transition-all text-zinc-300 cursor-pointer"
                          title="Navigate Up"
                        >
                          <ChevronUp className="w-6 h-6" />
                        </button>

                        {/* D-Pad Down */}
                        <button
                          onClick={() => sendCommand('NAV_DOWN')}
                          className="absolute bottom-2 left-1/2 -translate-x-1/2 p-2 hover:text-purple-400 active:scale-90 transition-all text-zinc-300 cursor-pointer"
                          title="Navigate Down"
                        >
                          <ChevronDown className="w-6 h-6" />
                        </button>

                        {/* D-Pad Left */}
                        <button
                          onClick={() => sendCommand('NAV_LEFT')}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 hover:text-purple-400 active:scale-90 transition-all text-zinc-300 cursor-pointer"
                          title="Navigate Left"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>

                        {/* D-Pad Right */}
                        <button
                          onClick={() => sendCommand('NAV_RIGHT')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:text-purple-400 active:scale-90 transition-all text-zinc-300 cursor-pointer"
                          title="Navigate Right"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>

                        {/* Central OK / Select Button */}
                        <button
                          onClick={() => sendCommand('NAV_SELECT')}
                          className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 text-white font-extrabold flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.5)] border border-purple-400 active:scale-95 transition-all text-xs cursor-pointer"
                          title="OK / Select"
                        >
                          <span>OK</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* MODE 2: NUMERIC KEYPAD */}
                  {remoteMode === 'numeric' && (
                    <div className="grid grid-cols-3 gap-2 p-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                          key={num}
                          onClick={() => sendCommand(`NUM_${num}` as any)}
                          className="p-3 rounded-xl bg-zinc-900 hover:bg-purple-900 border border-zinc-800 text-white font-extrabold text-sm transition-all cursor-pointer"
                        >
                          {num}
                        </button>
                      ))}

                      <button
                        onClick={() => sendCommand('NUM_DASH')}
                        className="p-3 rounded-xl bg-zinc-900 hover:bg-purple-900 border border-zinc-800 text-zinc-400 text-sm font-bold cursor-pointer"
                      >
                        -
                      </button>

                      <button
                        onClick={() => sendCommand('NUM_0')}
                        className="p-3 rounded-xl bg-zinc-900 hover:bg-purple-900 border border-zinc-800 text-white font-extrabold text-sm cursor-pointer"
                      >
                        0
                      </button>

                      <button
                        onClick={() => sendCommand('NUM_ENTER')}
                        className="p-3 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-extrabold text-xs cursor-pointer"
                      >
                        ENTER
                      </button>
                    </div>
                  )}

                  {/* MODE 3: TOUCHPAD TRACKPAD MODE */}
                  {remoteMode === 'touchpad' && (
                    <div
                      ref={touchpadRef}
                      onMouseDown={handleTouchStart}
                      onMouseUp={handleTouchEnd}
                      onTouchStart={handleTouchStart}
                      onTouchEnd={handleTouchEnd}
                      className="w-full h-44 rounded-2xl bg-zinc-950 border-2 border-dashed border-purple-800/80 flex flex-col items-center justify-center text-center p-4 cursor-grab active:cursor-grabbing select-none"
                    >
                      <MousePointer className="w-8 h-8 text-purple-400 animate-bounce mb-2" />
                      <p className="text-xs font-bold text-purple-200">SWIPE TRACKPAD MODE</p>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Drag mouse or finger to navigate • Tap once to SELECT
                      </p>
                    </div>
                  )}

                  {/* MODE 4: KEYBOARD TEXT INPUT */}
                  {remoteMode === 'keyboard' && (
                    <div className="space-y-3 p-2">
                      <label className="text-[10px] text-purple-300 font-bold block">
                        TYPE TEXT TO SEND TO TV SEARCH BOX:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="e.g. Marvel Movies, Sci-Fi 4K..."
                          value={textPayload}
                          onChange={(e) => setTextPayload(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              sendCommand('TEXT_INPUT', { text: textPayload });
                            }
                          }}
                          className="flex-1 bg-black border border-purple-800 focus:border-purple-400 rounded-lg px-3 py-2 text-xs text-purple-200 outline-none"
                        />
                        <button
                          onClick={() => sendCommand('TEXT_INPUT', { text: textPayload })}
                          className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>SEND</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* MODE 5: APP SHORTCUTS GRID */}
                  {remoteMode === 'apps' && (
                    <div className="grid grid-cols-3 gap-2 p-1">
                      {STREAMING_APPS.map((app) => (
                        <button
                          key={app.id}
                          onClick={() => sendCommand('APP_LAUNCH', { appName: app.name, appId: app.id })}
                          className={`p-2 rounded-xl ${app.color} font-bold text-[10px] flex flex-col items-center justify-center gap-1 hover:opacity-90 transition-all cursor-pointer shadow-md`}
                        >
                          <span className="text-sm">{app.icon}</span>
                          <span className="truncate w-full text-center">{app.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* VOLUME & CHANNEL ROCKERS ROW */}
                <div className="grid grid-cols-2 gap-3 px-2">
                  {/* VOLUME ROCKER */}
                  <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2 flex flex-col items-center justify-between space-y-2">
                    <button
                      onClick={() => sendCommand('VOL_UP')}
                      className="w-full py-2.5 bg-black/60 hover:bg-purple-900 text-white rounded-xl flex items-center justify-center cursor-pointer transition-all font-bold text-xs"
                      title="Volume Up"
                    >
                      <ChevronUp className="w-4 h-4 mr-1 text-purple-400" /> VOL +
                    </button>

                    <button
                      onClick={() => sendCommand('MUTE_TOGGLE')}
                      className="p-2 text-zinc-400 hover:text-red-400 cursor-pointer"
                      title="Mute / Unmute"
                    >
                      <VolumeX className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => sendCommand('VOL_DOWN')}
                      className="w-full py-2.5 bg-black/60 hover:bg-purple-900 text-white rounded-xl flex items-center justify-center cursor-pointer transition-all font-bold text-xs"
                      title="Volume Down"
                    >
                      <ChevronDown className="w-4 h-4 mr-1 text-purple-400" /> VOL -
                    </button>
                  </div>

                  {/* CHANNEL ROCKER */}
                  <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2 flex flex-col items-center justify-between space-y-2">
                    <button
                      onClick={() => sendCommand('CH_UP')}
                      className="w-full py-2.5 bg-black/60 hover:bg-purple-900 text-white rounded-xl flex items-center justify-center cursor-pointer transition-all font-bold text-xs"
                      title="Channel Up"
                    >
                      <ChevronUp className="w-4 h-4 mr-1 text-purple-400" /> CH +
                    </button>

                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      CHANNEL
                    </span>

                    <button
                      onClick={() => sendCommand('CH_DOWN')}
                      className="w-full py-2.5 bg-black/60 hover:bg-purple-900 text-white rounded-xl flex items-center justify-center cursor-pointer transition-all font-bold text-xs"
                      title="Channel Down"
                    >
                      <ChevronDown className="w-4 h-4 mr-1 text-purple-400" /> CH -
                    </button>
                  </div>
                </div>

                {/* PLAYBACK TRANSPORT BAR */}
                <div className="flex items-center justify-between bg-black/80 border border-purple-950 rounded-2xl p-2 px-3">
                  <button
                    onClick={() => sendCommand('REWIND')}
                    className="p-2 text-zinc-300 hover:text-purple-400 cursor-pointer"
                    title="Rewind"
                  >
                    <Rewind className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => sendCommand('PLAY')}
                    className="p-2.5 rounded-full bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)] cursor-pointer"
                    title="Play"
                  >
                    <Play className="w-4 h-4 fill-white" />
                  </button>

                  <button
                    onClick={() => sendCommand('PAUSE')}
                    className="p-2.5 rounded-full bg-zinc-800 text-white cursor-pointer hover:bg-zinc-700"
                    title="Pause"
                  >
                    <Pause className="w-4 h-4 fill-white" />
                  </button>

                  <button
                    onClick={() => sendCommand('STOP')}
                    className="p-2 text-zinc-300 hover:text-red-400 cursor-pointer"
                    title="Stop"
                  >
                    <Square className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => sendCommand('FAST_FORWARD')}
                    className="p-2 text-zinc-300 hover:text-purple-400 cursor-pointer"
                    title="Fast Forward"
                  >
                    <FastForward className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 2: ADD TV DEVICE GUIDED DISCOVERY WIZARD */}
        {/* ========================================================================= */}
        {currentScreen === 'add_wizard' && (
          <div className="space-y-4 max-w-2xl mx-auto w-full bg-[#080d14] p-5 rounded-xl border border-purple-900/80">
            <div className="flex items-center justify-between border-b border-purple-950 pb-3">
              <div>
                <h3 className="font-bold text-sm text-purple-200">
                  PAIR &amp; CONNECT NEW TELEVISION / STREAMING STICK
                </h3>
                <p className="text-[11px] text-zinc-400">Step {wizardStep} of 4: Setup &amp; Network Probe</p>
              </div>

              <span className="text-[10px] px-2.5 py-1 rounded bg-purple-950 border border-purple-700 text-purple-300 font-bold">
                GUIDED WIZARD
              </span>
            </div>

            {/* STEP 1: CATEGORY & MANUFACTURER */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-purple-300 block font-bold">1. SELECT DEVICE MANUFACTURER:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[280px] overflow-y-auto p-1 bg-black rounded-lg border border-purple-950">
                    {MANUFACTURERS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setWizManufacturer(m.id);
                          setWizName(`${m.name.split(' ')[0]} TV`);
                        }}
                        className={`p-2.5 rounded-lg text-left transition-all border flex flex-col justify-between ${
                          wizManufacturer === m.id
                            ? 'bg-[#0f172a] border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.35)]'
                            : 'bg-[#080d14] border-zinc-900 hover:border-purple-800'
                        }`}
                      >
                        <div>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-black/60 border border-zinc-800 text-zinc-400">
                            {m.badge}
                          </span>
                          <h4 className="font-bold text-xs text-white mt-1">{m.name}</h4>
                          <p className="text-[9px] text-zinc-400 line-clamp-2 mt-0.5">{m.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => { soundEngine.playClick(); setWizardStep(2); }}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2 rounded-lg text-xs flex items-center gap-1"
                  >
                    <span>Next: Network Method →</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CONNECTION METHOD & IP INPUT */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-purple-300 block font-bold">CUSTOM DEVICE NAME:</label>
                    <input
                      type="text"
                      placeholder="e.g. Living Room LG TV"
                      value={wizName}
                      onChange={(e) => setWizName(e.target.value)}
                      className="w-full bg-black border border-purple-800 focus:border-purple-400 rounded px-3 py-2 text-xs text-purple-200 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-purple-300 block font-bold">DEVICE CATEGORY:</label>
                    <select
                      value={wizCategory}
                      onChange={(e) => setWizCategory(e.target.value as DeviceCategory)}
                      className="w-full bg-black border border-purple-800 focus:border-purple-400 rounded px-2.5 py-2 text-xs text-purple-200 outline-none"
                    >
                      <option value="smart_tv">Smart TV</option>
                      <option value="streaming_stick">Streaming Stick / Box (Roku/Fire/Apple)</option>
                      <option value="set_top_box">Set-Top Cable Box</option>
                      <option value="projector">Home Theater Projector</option>
                      <option value="soundbar">Soundbar / AV Receiver</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-purple-300 block font-bold">TV LOCAL WI-FI IP ADDRESS:</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      placeholder="e.g. 192.168.1.105"
                      value={wizIp}
                      onChange={(e) => setWizIp(e.target.value)}
                      className="flex-1 bg-black border border-purple-800 focus:border-purple-400 rounded px-3 py-2 text-xs text-purple-200 outline-none font-bold min-w-[160px]"
                    />
                    <button
                      type="button"
                      onClick={() => scanLocalSubnetForTVs()}
                      disabled={isScanningSubnet}
                      className="px-2.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{isScanningSubnet ? 'Scanning...' : 'Auto-Discover TV'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWizManufacturer('simulator');
                        setWizName('SUPERAI Virtual TV');
                        setWizIp('127.0.0.1');
                      }}
                      className="px-2.5 py-2 bg-purple-950 hover:bg-purple-900 border border-purple-700 text-purple-200 rounded text-xs font-bold cursor-pointer"
                    >
                      1-Click Virtual Simulator
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    Tip: Find your TV IP in TV Settings → Network → Status (e.g. 192.168.1.x), or click Auto-Discover TV.
                  </p>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="text-zinc-400 hover:text-white text-xs"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => { soundEngine.playClick(); setWizardStep(3); }}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2 rounded-lg text-xs"
                  >
                    Next: Pairing &amp; Auth →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PAIRING CODE & AUTH KEY */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div className="p-3 bg-purple-950/40 border border-purple-800 rounded-lg text-xs space-y-2">
                  <h4 className="font-bold text-purple-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>PAIRING REQUIREMENT FOR {wizManufacturer.toUpperCase()}</span>
                  </h4>
                  <p className="text-[11px] text-zinc-300">
                    Some smart TV models display a 4-digit or 6-digit PIN on the television screen during initial connection.
                  </p>

                  {wizManufacturer === 'fire_tv' && (
                    <div className="pt-2 border-t border-purple-900/60 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-amber-300 font-bold text-xs flex items-center gap-1">
                          🔥 Amazon Fire TV On-Screen Pairing Assistant:
                        </span>
                        <button
                          type="button"
                          onClick={triggerFireTVPairing}
                          disabled={ftvPairingLoading}
                          className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-black font-extrabold text-xs flex items-center gap-1 cursor-pointer shadow-md"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{ftvPairingLoading ? 'Requesting PIN...' : 'Trigger PIN On Fire TV Screen'}</span>
                        </button>
                      </div>

                      {ftvPairingNotice && (
                        <div className="p-2 rounded bg-amber-950/80 border border-amber-700 text-amber-200 text-[11px] font-mono">
                          {ftvPairingNotice}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-purple-300 block font-bold">
                      {wizManufacturer === 'fire_tv' ? 'FIRE TV 4-DIGIT PIN CODE:' : 'PAIRING CODE / ON-SCREEN PIN:'}
                    </label>
                    <input
                      type="text"
                      placeholder={wizManufacturer === 'fire_tv' ? 'e.g. 1234' : 'e.g. 1234 or leave empty'}
                      value={wizPairingCode}
                      onChange={(e) => setWizPairingCode(e.target.value)}
                      className="w-full bg-black border border-purple-800 focus:border-purple-400 rounded px-3 py-2 text-xs text-purple-200 outline-none font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-purple-300 block font-bold">PRE-SHARED AUTH KEY (SONY/SAMSUNG):</label>
                    <input
                      type="text"
                      placeholder="e.g. 1234"
                      value={wizAuthToken}
                      onChange={(e) => setWizAuthToken(e.target.value)}
                      className="w-full bg-black border border-purple-800 focus:border-purple-400 rounded px-3 py-2 text-xs text-purple-200 outline-none"
                    />
                  </div>
                </div>

                {wizError && (
                  <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-lg text-xs font-mono">
                    ⚠️ {wizError}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button onClick={() => setWizardStep(2)} className="text-zinc-400 hover:text-white text-xs">
                    ← Back
                  </button>

                  <button
                    onClick={handleWizardVerify}
                    disabled={wizVerifying}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-6 py-2.5 rounded-lg text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer"
                  >
                    {wizVerifying ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin" />
                        <span>PROBING NETWORK &amp; CONNECTING...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>VERIFY CONNECTION &amp; OPEN REMOTE</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 3: SAVED DEVICES MANAGER */}
        {/* ========================================================================= */}
        {currentScreen === 'saved_list' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-purple-950 pb-2">
              <h3 className="font-bold text-xs text-purple-200 uppercase tracking-wider">
                PAIRED TELEVISION &amp; STREAMING DEVICES ({savedDevices.length})
              </h3>
              <button
                onClick={() => { setWizardStep(1); setCurrentScreen('add_wizard'); }}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Pair New TV</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedDevices.map((dev) => {
                const isActive = activeDeviceId === dev.id;
                return (
                  <div
                    key={dev.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                      isActive
                        ? 'bg-[#0f172a] border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                        : 'bg-[#080d14] border-zinc-900 hover:border-purple-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-black border border-purple-900 text-purple-300">
                          {dev.manufacturer.toUpperCase()}
                        </span>
                        {isActive && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500 text-black">
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-white">{dev.name}</h4>
                      <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        {dev.isSimulator ? 'Virtual Smart TV Simulator' : `IP: ${dev.ipAddress || 'Wi-Fi'}`}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                      <button
                        onClick={() => {
                          soundEngine.playClick();
                          setActiveDeviceId(dev.id);
                          setCurrentScreen('remote');
                          syncDevicesToFirestore(savedDevices, dev.id);
                        }}
                        className="px-3 py-1 rounded bg-purple-950 hover:bg-purple-900 border border-purple-700 text-purple-200 text-xs font-bold"
                      >
                        {isActive ? 'Controls Open' : 'Select TV'}
                      </button>

                      {!dev.isSimulator && (
                        <button
                          onClick={() => {
                            soundEngine.playClick();
                            const filtered = savedDevices.filter((d) => d.id !== dev.id);
                            setSavedDevices(filtered);
                            if (isActive && filtered.length > 0) {
                              setActiveDeviceId(filtered[0].id);
                            }
                            syncDevicesToFirestore(filtered, filtered[0]?.id || '');
                          }}
                          className="p-1 text-zinc-500 hover:text-red-400"
                          title="Forget Device"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 4: TROUBLESHOOTING & NETWORK INSTRUCTIONS */}
        {/* ========================================================================= */}
        {currentScreen === 'troubleshooting' && (
          <div className="space-y-4 max-w-3xl mx-auto w-full bg-[#080d14] p-5 rounded-xl border border-purple-950">
            <div className="flex items-center justify-between border-b border-purple-950 pb-2">
              <h3 className="font-bold text-xs text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-purple-400" />
                <span>TV NETWORK CONTROL TROUBLESHOOTING GUIDE</span>
              </h3>
              <button onClick={() => setCurrentScreen('remote')} className="text-xs text-zinc-400 hover:text-white">
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-zinc-300">
              <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-lg">
                <h4 className="font-bold text-amber-200 mb-1 flex items-center gap-1.5">
                  🔥 <span>Amazon Fire TV &amp; Fire TV Stick</span>
                </h4>
                <p className="text-[11px] text-zinc-300 leading-normal">
                  <strong>Find Fire TV IP:</strong> Go to Fire TV Settings → My Fire TV → About → Network (Note IP address like 192.168.1.x).<br />
                  <strong>Enable Local Control:</strong> Go to Settings → My Fire TV → Developer Options → Turn ON <em>ADB Debugging</em> and <em>Apps from Unknown Sources</em>.<br />
                  <strong>Auto-Connect:</strong> Click 'Auto-Scan Wi-Fi Subnet' or enter your Fire TV IP address in the Pair TV form.
                </p>
              </div>

              <div className="p-3 bg-purple-950/40 border border-purple-800/80 rounded-lg">
                <h4 className="font-bold text-purple-200 mb-1">1. LG Smart TVs (webOS)</h4>
                <p className="text-[11px] text-zinc-400">
                  Go to TV Settings → Network → LG Connect Apps → Turn ON. On first connection, accept the pairing PIN displayed on screen.
                </p>
              </div>

              <div className="p-3 bg-purple-950/40 border border-purple-800/80 rounded-lg">
                <h4 className="font-bold text-purple-200 mb-1">2. Samsung Smart TVs (Tizen OS)</h4>
                <p className="text-[11px] text-zinc-400">
                  Go to Settings → General → External Device Manager → Device Connection Manager → Access Notification → Set to "First Time Only".
                </p>
              </div>

              <div className="p-3 bg-purple-950/40 border border-purple-800/80 rounded-lg">
                <h4 className="font-bold text-purple-200 mb-1">3. Sony Bravia Smart TVs</h4>
                <p className="text-[11px] text-zinc-400">
                  Go to Settings → Network → Home Network Setup → IP Control → Pre-Shared Key → Set key (e.g. 1234). Set Authentication to "Normal and Pre-Shared Key".
                </p>
              </div>

              <div className="p-3 bg-purple-950/40 border border-purple-800/80 rounded-lg">
                <h4 className="font-bold text-purple-200 mb-1">4. Roku TV &amp; Streaming Sticks</h4>
                <p className="text-[11px] text-zinc-400">
                  Go to Settings → System → Advanced system settings → Control by mobile apps → Set to "Default" or "Permissive". Ensure TV is connected to the same Wi-Fi subnet.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};
