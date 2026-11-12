import React, { useState, useEffect } from 'react';
import { Phone, Video, X, Mic, MicOff, Camera, CameraOff } from 'lucide-react';

interface VoiceCallModalProps {
  onClose: () => void;
  targetUser: string;
  type: 'voice' | 'video';
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({ onClose, targetUser, type }) => {
  const [status, setStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  useEffect(() => {
    // Simulate call flow
    const timer = setTimeout(() => {
      setStatus('connected');
    }, 3000); // 3 seconds ringing

    return () => clearTimeout(timer);
  }, []);

  const handleEndCall = () => {
    setStatus('ended');
    setTimeout(onClose, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-[#161616] border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl space-y-8">
        <div className={`w-24 h-24 mx-auto rounded-3xl ${status === 'ringing' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'} border flex items-center justify-center text-white`}>
          {type === 'video' ? <Video className="w-10 h-10" /> : <Phone className="w-10 h-10" />}
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-white">{targetUser}</h2>
          <p className="text-sm text-zinc-400 capitalize mt-1.5">{status}...</p>
        </div>

        {status === 'connected' && (
          <div className="flex justify-center gap-6">
            <button onClick={() => setMuted(!muted)} className={`p-4 rounded-full ${muted ? 'bg-red-500' : 'bg-zinc-800 hover:bg-zinc-700'} transition-colors`}>
              {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            {type === 'video' && (
              <button onClick={() => setCameraOff(!cameraOff)} className={`p-4 rounded-full ${cameraOff ? 'bg-red-500' : 'bg-zinc-800 hover:bg-zinc-700'} transition-colors`}>
                {cameraOff ? <CameraOff className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
              </button>
            )}
          </div>
        )}

        <div className="pt-2">
          <button 
            onClick={handleEndCall}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" /> End Call
          </button>
        </div>
      </div>
    </div>
  );
};
