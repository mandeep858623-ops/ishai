import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Shield, Check, X, AlertTriangle, Navigation, Clock, 
  Eye, Radio, Smartphone, Lock, Copy, CheckCheck, Compass, Activity, Play 
} from 'lucide-react';
import { soundEngine } from '../../utils/audio';

interface RecipientConsentModalProps {
  inviteToken: string;
  onClose: () => void;
}

export const RecipientConsentModal: React.FC<RecipientConsentModalProps> = ({ inviteToken, onClose }) => {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [packetCount, setPacketCount] = useState(0);
  const [isSimulatedTransit, setIsSimulatedTransit] = useState(false);

  // Sharing state
  const [sharingStatus, setSharingStatus] = useState<
    'AWAITING' | 'APPROVED' | 'DECLINED' | 'PERMISSION_DENIED' | 'STOPPED' | 'EXPIRED'
  >('AWAITING');
  const [currentCoords, setCurrentCoords] = useState<{ 
    lat: number; 
    lng: number; 
    accuracy?: number;
    speed?: number | null;
    heading?: number | null;
  } | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const watchIdRef = useRef<number | null>(null);
  const simIntervalRef = useRef<any>(null);

  // Fetch session details on mount
  useEffect(() => {
    fetchSessionDetails();
  }, [inviteToken]);

  const fetchSessionDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/location-share/session/${inviteToken}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load location sharing request.');
      }
      setSession(data);
      setSecondsRemaining(data.remainingSeconds || 0);

      if (data.status === 'EXPIRED') {
        setSharingStatus('EXPIRED');
      } else if (data.status === 'DECLINED') {
        setSharingStatus('DECLINED');
      } else if (data.status === 'SHARING_STOPPED') {
        setSharingStatus('STOPPED');
      } else if (data.status === 'SHARING_ACTIVE') {
        setSharingStatus('APPROVED');
        startLocationWatcher();
      }
    } catch (err: any) {
      setError(err.message || 'Invitation not found or network error.');
    } finally {
      setIsLoading(false);
    }
  };

  // Countdown timer for session duration
  useEffect(() => {
    if (sharingStatus !== 'APPROVED' || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          stopSharing('EXPIRED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sharingStatus, secondsRemaining]);

  // Handle Copy Invite Link
  const handleCopyLink = () => {
    try {
      soundEngine.playClick();
      const url = window.location.origin + '/?loc_invite=' + inviteToken;
      navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {}
  };

  // Handle Approve Action
  const handleApprove = async () => {
    soundEngine.playSuccess();
    try {
      const res = await fetch('/api/location-share/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteToken, decision: 'APPROVE' }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to register approval.');
      }

      setSharingStatus('APPROVED');
      startLocationWatcher();
    } catch (err: any) {
      setError(err.message || 'Failed to approve request.');
    }
  };

  // Handle Decline Action
  const handleDecline = async () => {
    soundEngine.playClick();
    try {
      await fetch('/api/location-share/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteToken, decision: 'DECLINE' }),
      });
      setSharingStatus('DECLINED');
    } catch {
      setSharingStatus('DECLINED');
    }
  };

  // Start watching location and streaming updates
  const startLocationWatcher = () => {
    if (!navigator.geolocation) {
      // Fallback to simulated transit if browser has no geolocation object
      startSimulatedTransit();
      return;
    }

    // Request high accuracy GPS
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          heading: pos.coords.heading,
          speed: pos.coords.speed,
        };
        setCurrentCoords(coords);
        setLastUpdatedTime(Date.now());
        setPacketCount(prev => prev + 1);

        // Push updates to backend
        try {
          await fetch('/api/location-share/update-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: inviteToken,
              ...coords,
            }),
          });
        } catch (e) {
          console.warn('Failed to push coordinate update:', e);
        }
      },
      async (err) => {
        console.warn('Geolocation error or iframe restriction:', err);
        if (err.code === err.PERMISSION_DENIED) {
          setSharingStatus('PERMISSION_DENIED');
          await fetch('/api/location-share/respond', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: inviteToken, decision: 'PERMISSION_DENIED' }),
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Start Simulated Transit GPS (ideal for desktop testing / sandbox previews)
  const startSimulatedTransit = async () => {
    soundEngine.playSuccess();
    setIsSimulatedTransit(true);
    setSharingStatus('APPROVED');

    // Make sure server has APPROVED status
    try {
      await fetch('/api/location-share/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteToken, decision: 'APPROVE' }),
      });
    } catch {}

    // Initial seed coordinate: Central Manhattan NYC
    let currentLat = 40.7128;
    let currentLng = -74.0060;
    let heading = 45;

    // Clear existing
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);

    const emitSimulatedStep = async () => {
      // Step ~15 meters in heading direction
      const stepDist = 0.00015;
      currentLat += stepDist * Math.cos((heading * Math.PI) / 180);
      currentLng += stepDist * Math.sin((heading * Math.PI) / 180);
      heading = (heading + (Math.random() * 6 - 3)) % 360;

      const simCoords = {
        lat: Number(currentLat.toFixed(6)),
        lng: Number(currentLng.toFixed(6)),
        accuracy: 8,
        heading: Math.round(heading),
        speed: 1.4, // walking speed ~5 km/h
      };

      setCurrentCoords(simCoords);
      setLastUpdatedTime(Date.now());
      setPacketCount(prev => prev + 1);

      try {
        await fetch('/api/location-share/update-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: inviteToken,
            ...simCoords,
          }),
        });
      } catch (e) {
        console.warn('Sim transit upload failure:', e);
      }
    };

    emitSimulatedStep();
    simIntervalRef.current = setInterval(emitSimulatedStep, 2000);
  };

  // Stop sharing location
  const stopSharing = async (finalStatus: 'STOPPED' | 'EXPIRED' = 'STOPPED') => {
    soundEngine.playAlertBeep();
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }

    try {
      await fetch('/api/location-share/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteToken }),
      });
    } catch {}

    setSharingStatus(finalStatus);
  };

  // Clean up watchers and simulation on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    };
  }, []);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 select-none font-sans overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl w-full max-w-lg p-6 shadow-[0_0_60px_rgba(0,0,0,0.9)] relative text-zinc-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-zinc-100 font-extrabold text-sm sm:text-base tracking-wider uppercase">
                  SUPERAI MAPS
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold">
                  VERIFIED CONSENT
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                Consent-Based Live Location Portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
            <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest animate-pulse">
              Verifying Secure Invitation Token...
            </p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="bg-rose-950/20 border border-rose-900/50 rounded-2xl p-5 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
            <h3 className="text-rose-300 font-bold text-sm">Invitation Unavailable</h3>
            <p className="text-xs text-zinc-400 font-mono">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer"
            >
              Close Window
            </button>
          </div>
        )}

        {/* Valid Invitation Awaiting Approval */}
        {!isLoading && !error && session && sharingStatus === 'AWAITING' && (
          <div className="space-y-4">
            
            {/* Requester Identity Card */}
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold tracking-widest block">
                    Verified Requester
                  </span>
                  <h3 className="text-zinc-100 text-base font-extrabold mt-0.5">
                    {session.requesterName}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-[10px] font-mono">
                    Target: {session.recipientPhone}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Copy Invitation Link"
                  >
                    {isCopied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="border-t border-zinc-800/80 pt-3 grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-zinc-500 block">Stated Purpose:</span>
                  <span className="text-zinc-200 font-bold">{session.purpose || 'Personal Navigation'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">Sharing Duration:</span>
                  <span className="text-emerald-400 font-bold">{session.durationMinutes} Minutes</span>
                </div>
              </div>
            </div>

            {/* Privacy & Consent Disclosures */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-zinc-200 font-bold text-[11px] uppercase tracking-wider">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>What will be shared?</span>
              </div>
              <ul className="text-[11px] text-zinc-400 space-y-1.5 list-disc list-inside font-mono">
                <li>High-precision GPS coordinates (Latitude &amp; Longitude)</li>
                <li>Estimated device accuracy radius (in meters)</li>
                <li>Live update timestamps while this tab remains active</li>
              </ul>
              <p className="text-[10px] text-zinc-500 font-mono italic pt-2 border-t border-zinc-800/80">
                🔒 You can stop or revoke sharing at any second. Your location will NOT be shared unless you explicitly approve below.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleDecline}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4 text-rose-400" />
                  <span>Decline</span>
                </button>
                
                <button
                  onClick={handleApprove}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Approve &amp; Share</span>
                </button>
              </div>

              {/* Instant Sandbox Simulated Movement Mode */}
              <button
                onClick={startSimulatedTransit}
                className="w-full bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-500/40 text-cyan-300 py-2.5 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-cyan-400" />
                <span>⚡ Simulate Live Transit (Desktop / Sandbox Mode)</span>
              </button>
            </div>

          </div>
        )}

        {/* ACTIVE SHARING STATE */}
        {!isLoading && sharingStatus === 'APPROVED' && (
          <div className="space-y-4">
            <div className="bg-zinc-900/80 border border-cyan-500/40 rounded-2xl p-5 text-center space-y-4">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.4)]">
                  <Radio className="w-7 h-7 animate-pulse" />
                </div>
                <span className="absolute w-20 h-20 rounded-full bg-cyan-500/20 animate-ping pointer-events-none" />
              </div>

              <div>
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-zinc-100 text-base font-extrabold uppercase tracking-wider">
                    Live Location Sharing Active
                  </h3>
                  <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                    isSimulatedTransit
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {isSimulatedTransit ? 'Simulated Transit' : 'Hardware GPS'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-mono mt-1">
                  Transmitting real-time GPS telemetry to <span className="text-cyan-400 font-bold">{session?.requesterName}</span>
                </p>
              </div>

              {/* Rich Telemetry Display */}
              <div className="bg-black/60 border border-zinc-800 rounded-xl p-3.5 text-left font-mono space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">GPS Accuracy:</span>
                  <span className="text-zinc-200 font-bold">
                    {currentCoords?.accuracy ? `±${currentCoords.accuracy} meters` : 'Acquiring lock...'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Coordinates:</span>
                  <span className="text-cyan-400 font-bold">
                    {currentCoords ? `${currentCoords.lat.toFixed(5)}, ${currentCoords.lng.toFixed(5)}` : 'Resolving GPS...'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Transit Speed &amp; Heading:</span>
                  <span className="text-emerald-400 font-bold">
                    {currentCoords?.speed ? `${(currentCoords.speed * 3.6).toFixed(1)} km/h` : 'Stationary'}
                    {currentCoords?.heading ? ` · ${Math.round(currentCoords.heading)}°` : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Transmitted Packets:</span>
                  <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    {packetCount} updates
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Time Remaining:</span>
                  <span className="text-amber-400 font-bold">
                    {formatSeconds(secondsRemaining)}
                  </span>
                </div>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-2.5 text-[10px] text-zinc-400 font-mono flex items-center justify-between">
                <span>📱 Keep this browser tab open for continuous tracking.</span>
                <button
                  onClick={handleCopyLink}
                  className="text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer ml-2 shrink-0"
                >
                  {isCopied ? 'Link Copied!' : 'Copy Link'}
                </button>
              </div>

              <button
                onClick={() => stopSharing('STOPPED')}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(239,68,68,0.4)] cursor-pointer"
              >
                Stop Sharing Immediately
              </button>
            </div>
          </div>
        )}

        {/* PERMISSION DENIED STATE */}
        {!isLoading && sharingStatus === 'PERMISSION_DENIED' && (
          <div className="bg-amber-950/20 border border-amber-500/40 rounded-2xl p-5 text-center space-y-3.5">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
            <h3 className="text-amber-300 text-sm font-bold uppercase tracking-wider">
              Location Permission Denied
            </h3>
            <p className="text-xs text-zinc-400 font-mono leading-relaxed">
              Browser hardware geolocation was blocked or restricted by the current iframe policy.
            </p>
            <div className="p-3 bg-zinc-950 border border-amber-500/30 rounded-xl space-y-2">
              <p className="text-[11px] text-zinc-300 font-mono">
                You can still test and verify the live tracking map using simulated GPS transit:
              </p>
              <button
                onClick={startSimulatedTransit}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>⚡ Test with Simulated Transit (Demo Mode)</span>
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        )}

        {/* DECLINED STATE */}
        {!isLoading && sharingStatus === 'DECLINED' && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 text-center space-y-3">
            <X className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="text-zinc-200 text-sm font-bold uppercase tracking-wider">
              Request Declined
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              You declined this location request. No GPS data was accessed or shared.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        )}

        {/* STOPPED OR EXPIRED STATE */}
        {!isLoading && (sharingStatus === 'STOPPED' || sharingStatus === 'EXPIRED') && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 text-center space-y-3">
            <Clock className="w-10 h-10 text-zinc-500 mx-auto" />
            <h3 className="text-zinc-200 text-sm font-bold uppercase tracking-wider">
              {sharingStatus === 'EXPIRED' ? 'Session Expired' : 'Sharing Terminated'}
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              {sharingStatus === 'EXPIRED'
                ? 'The requested sharing duration has elapsed. Location transmission is closed.'
                : 'You have stopped sharing your location. All coordinate tracking is turned off.'}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
