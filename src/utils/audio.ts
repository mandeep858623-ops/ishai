// High-reliability Audio and Speech Synthesis Engine for SuperAI OS

class SoundEngine {
  private ctx: AudioContext | null = null;

  public initCtx() {
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch {
      // Audio permission pending
    }
  }

  // 1000Hz alert beep
  playAlertBeep() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1000, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.65);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.65);
    } catch {
      // Ignored
    }
  }

  // Terminal button click
  playClick() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Ignored
    }
  }

  // Success chime
  playSuccess() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch {
      // Ignored
    }
  }

  // Camera shutter sound
  playCameraShutter() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'white' as any; // Approximate white noise with high freq
      osc.frequency.setValueAtTime(4000, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {
      // Ignored
    }
  }
}

export const soundEngine = new SoundEngine();

// Global reference prevents browser garbage collector from prematurely killing audio
let activeAudio: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;

// Speech listener callback for UI subtitle / visualizer indicator
type SpeechListener = (speaking: boolean, text: string) => void;
const listeners: SpeechListener[] = [];

export function subscribeSpeech(listener: SpeechListener) {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

function notifySpeech(speaking: boolean, text: string) {
  listeners.forEach((l) => l(speaking, text));
}

/**
 * High-Reliability Dual-Engine Speech System:
 * Plays via crystal-clear HTML5 Audio stream (/api/ai/tts)
 * with automatic fallback to Web Speech API.
 */
export function speakText(text: string, gender: 'Male' | 'Female' = 'Male') {
  if (!text || !text.trim()) return;

  const cleanText = text.trim();
  
  // CRITICAL: Stop ALL previous speech (both server audio & Web Speech) to ensure only one engine plays
  stopSpeaking();
  
  soundEngine.initCtx();
  notifySpeech(true, cleanText);

  // Engine 1: Crystal-clear server-side audio stream
  const ttsUrl = `/api/ai/tts?text=${encodeURIComponent(cleanText.slice(0, 180))}`;
  const audio = new Audio(ttsUrl);
  activeAudio = audio;

  audio.onended = () => {
    notifySpeech(false, '');
    activeAudio = null;
  };

  audio.onerror = () => {
    // If network audio stream fails, fallback immediately to browser SpeechSynthesis
    activeAudio = null;
    speakViaWebSpeech(cleanText, gender);
  };

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // Autoplay blocked or restricted -> fallback to WebSpeech
      speakViaWebSpeech(cleanText, gender);
    });
  }
}

function speakViaWebSpeech(text: string, gender: 'Male' | 'Female') {
  if (!('speechSynthesis' in window)) {
    notifySpeech(false, '');
    return;
  }

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    activeUtterance = utterance; // Keep alive against GC
    utterance.rate = 1.0;
    utterance.pitch = gender === 'Male' ? 0.9 : 1.15;

    utterance.onend = () => {
      notifySpeech(false, '');
      activeUtterance = null;
    };

    utterance.onerror = () => {
      notifySpeech(false, '');
      activeUtterance = null;
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      if (gender === 'Female') {
        const femaleVoice = voices.find((v) =>
          /female|zira|samantha|victoria|karen|susan|fiona|google us english/i.test(v.name)
        );
        if (femaleVoice) utterance.voice = femaleVoice;
      } else {
        const maleVoice = voices.find((v) =>
          /male|david|george|alex|daniel|oliver|google uk english male/i.test(v.name)
        );
        if (maleVoice) utterance.voice = maleVoice;
      }
    }

    window.speechSynthesis.speak(utterance);
  } catch {
    notifySpeech(false, '');
  }
}

export function stopSpeaking() {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {}
    activeAudio = null;
  }
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
  notifySpeech(false, '');
}
