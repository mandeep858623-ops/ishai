/**
 * WebRTC Peer-to-Peer Voice Call Engine
 * Provides direct, anonymous, end-to-end encrypted audio calling over the internet
 * with no telephone numbers, zero carrier tracking, and real-time audio visualization.
 */

export interface PeerCallCallbacks {
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: 'idle' | 'joining' | 'waiting' | 'connecting' | 'connected' | 'disconnected' | 'failed') => void;
  onPeerJoined?: (peerId: string, peerName: string) => void;
  onPeerLeft?: (peerId: string) => void;
  onVolumeChange?: (volume: number) => void; // 0 to 100
  onError?: (err: string) => void;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

export class WebRTCVoiceEngine {
  private roomId: string;
  private peerId: string;
  private peerName: string;
  private callbacks: PeerCallCallbacks;
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteAudioElement: HTMLAudioElement | null = null;
  private isInitiator = false;
  private isPolling = false;
  private lastSignalTime = 0;
  private pollInterval: any = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private isMuted = false;

  constructor(roomId: string, peerId: string, peerName: string, callbacks: PeerCallCallbacks) {
    this.roomId = roomId;
    this.peerId = peerId;
    this.peerName = peerName;
    this.callbacks = callbacks;
  }

  public async start(): Promise<boolean> {
    try {
      this.callbacks.onConnectionStateChange?.('joining');

      // 1. Initialize Microphone with telecom voice filters
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
        },
        video: false,
      });

      // 2. Setup Audio Visualizer for local mic
      this.setupVisualizer(this.localStream);

      // 3. Register with backend room
      const joinRes = await fetch(`/api/voice/room/${encodeURIComponent(this.roomId)}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peerId: this.peerId, peerName: this.peerName }),
      });
      const joinData = await joinRes.json();

      // If we are the 2nd (or later) peer in the room, we initiate the WebRTC offer
      if (joinData.participantCount > 1) {
        this.isInitiator = true;
      }

      this.callbacks.onConnectionStateChange?.(this.isInitiator ? 'connecting' : 'waiting');

      // 4. Create Peer Connection
      this.createPeerConnection();

      // 5. Start signal polling loop
      this.startSignalPolling();

      if (this.isInitiator) {
        // Send initial offer
        await this.makeOffer();
      }

      return true;
    } catch (err: any) {
      console.error('Failed to initialize WebRTC call:', err);
      this.callbacks.onError?.(err?.message || 'Could not access microphone or join voice room.');
      this.callbacks.onConnectionStateChange?.('failed');
      return false;
    }
  }

  private createPeerConnection() {
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Add local mic audio tracks to peer connection
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        this.pc?.addTrack(track, this.localStream!);
      });
    }

    // Handle remote audio stream
    this.pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        if (!this.remoteAudioElement) {
          this.remoteAudioElement = new Audio();
          this.remoteAudioElement.autoplay = true;
        }
        this.remoteAudioElement.srcObject = remoteStream;
        this.remoteAudioElement.play().catch((e) => console.warn('Autoplay prevented:', e));
        this.callbacks.onRemoteStream?.(remoteStream);
        this.callbacks.onConnectionStateChange?.('connected');
      }
    };

    // Handle ICE Candidates
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal('candidate', event.candidate);
      }
    };

    // Connection state changes
    this.pc.onconnectionstatechange = () => {
      const state = this.pc?.connectionState;
      if (state === 'connected') {
        this.callbacks.onConnectionStateChange?.('connected');
      } else if (state === 'disconnected') {
        this.callbacks.onConnectionStateChange?.('disconnected');
      } else if (state === 'failed') {
        this.callbacks.onConnectionStateChange?.('failed');
      }
    };
  }

  private async makeOffer() {
    if (!this.pc) return;
    try {
      const offer = await this.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
      await this.pc.setLocalDescription(offer);
      await this.sendSignal('offer', offer);
    } catch (e) {
      console.warn('Error creating offer:', e);
    }
  }

  private async handleOffer(offer: RTCSessionDescriptionInit) {
    if (!this.pc) this.createPeerConnection();
    try {
      await this.pc!.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.pc!.createAnswer();
      await this.pc!.setLocalDescription(answer);
      await this.sendSignal('answer', answer);
    } catch (e) {
      console.warn('Error handling offer:', e);
    }
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.pc) return;
    try {
      await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (e) {
      console.warn('Error handling answer:', e);
    }
  }

  private async handleCandidate(candidate: RTCIceCandidateInit) {
    if (!this.pc) return;
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn('Error adding ICE candidate:', e);
    }
  }

  private async sendSignal(type: 'offer' | 'answer' | 'candidate' | 'hangup' | 'join' | 'ping', payload: any) {
    try {
      await fetch(`/api/voice/room/${encodeURIComponent(this.roomId)}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: this.peerId,
          type,
          payload,
        }),
      });
    } catch (e) {
      console.warn('Failed to send signal:', e);
    }
  }

  private startSignalPolling() {
    this.isPolling = true;
    this.pollInterval = setInterval(async () => {
      if (!this.isPolling) return;
      try {
        const res = await fetch(
          `/api/voice/room/${encodeURIComponent(this.roomId)}/signals?peerId=${encodeURIComponent(
            this.peerId
          )}&since=${this.lastSignalTime}`
        );
        if (!res.ok) return;
        const signals: Array<{ type: string; payload: any; from: string; timestamp: number }> = await res.json();

        for (const sig of signals) {
          if (sig.timestamp > this.lastSignalTime) {
            this.lastSignalTime = sig.timestamp;
          }

          if (sig.type === 'join') {
            this.callbacks.onPeerJoined?.(sig.from, sig.payload?.peerName || 'Remote Peer');
            // If we are waiting, trigger offer
            if (!this.isInitiator && this.pc?.connectionState !== 'connected') {
              this.isInitiator = true;
              this.makeOffer();
            }
          } else if (sig.type === 'offer') {
            await this.handleOffer(sig.payload);
          } else if (sig.type === 'answer') {
            await this.handleAnswer(sig.payload);
          } else if (sig.type === 'candidate') {
            await this.handleCandidate(sig.payload);
          } else if (sig.type === 'hangup') {
            this.callbacks.onPeerLeft?.(sig.from);
            this.callbacks.onConnectionStateChange?.('disconnected');
          }
        }
      } catch (err) {
        // Silent catch for polling
      }
    }, 1200);
  }

  private setupVisualizer(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 255) * 100 * 2.5));

        this.callbacks.onVolumeChange?.(this.isMuted ? 0 : normalized);
        this.animFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('Audio visualizer setup failed:', e);
    }
  }

  public toggleMute(): boolean {
    if (!this.localStream) return false;
    this.isMuted = !this.isMuted;
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !this.isMuted;
    });
    return this.isMuted;
  }

  public endCall() {
    this.isPolling = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    // Inform peers
    this.sendSignal('hangup', { peerId: this.peerId }).catch(() => {});

    // Notify backend
    fetch(`/api/voice/room/${encodeURIComponent(this.roomId)}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ peerId: this.peerId }),
    }).catch(() => {});

    // Stop all local mic tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }

    // Close audio context
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }

    // Stop remote audio element
    if (this.remoteAudioElement) {
      this.remoteAudioElement.pause();
      this.remoteAudioElement.srcObject = null;
      this.remoteAudioElement = null;
    }

    // Close RTCPeerConnection
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    this.callbacks.onConnectionStateChange?.('idle');
  }
}
