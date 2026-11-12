import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, Play, Pause, Volume2, VolumeX, SkipBack, 
  SkipForward, CloudRain, Waves, Wind, Trees,
  Zap, Flame, Coffee, Moon, Sun, Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const FocusSoundStudioTab: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSound, setCurrentSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sounds = [
    { id: 'rain', name: 'Deep Rain', icon: CloudRain, color: '#3b82f6', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, // Placeholder for demo
    { id: 'waves', name: 'Ocean Waves', icon: Waves, color: '#06b6d4', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'forest', name: 'Forest Birds', icon: Trees, color: '#10b981', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'wind', name: 'Artic Wind', icon: Wind, color: '#f8fafc', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 'white', name: 'White Noise', icon: Zap, color: '#94a3b8', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
    { id: 'fire', name: 'Campfire', icon: Flame, color: '#f59e0b', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
    { id: 'cafe', name: 'Paris Cafe', icon: Coffee, color: '#78350f', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
    { id: 'space', name: 'Deep Space', icon: Moon, color: '#8b5cf6', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
  ];

  useEffect(() => {
    if (isPlaying && currentSound) {
      const sound = sounds.find(s => s.id === currentSound);
      if (sound) {
        if (!audioRef.current) {
          audioRef.current = new Audio(sound.url);
          audioRef.current.loop = true;
        } else {
          audioRef.current.src = sound.url;
        }
        audioRef.current.volume = isMuted ? 0 : volume;
        audioRef.current.play().catch(err => {
          console.error('Audio playback failed:', err);
          setIsPlaying(false);
        });
      }
    } else if (audioRef.current) {
      audioRef.current.pause();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isPlaying, currentSound, isMuted, volume]);

  const togglePlay = (soundId: string) => {
    if (currentSound === soundId) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSound(soundId);
      setIsPlaying(true);
    }
  };

  const currentSoundData = sounds.find(s => s.id === currentSound);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-emerald-100 flex items-center gap-2">
            <Music className="w-5 h-5 text-emerald-500" />
            FOCUS SOUND STUDIO
          </h3>
          <p className="text-xs text-emerald-700 font-medium">Ambient audio environments to enhance your deep work sessions.</p>
        </div>
        <div className="flex items-center gap-4 bg-emerald-950/20 border border-emerald-500/10 rounded-xl px-4 py-2">
           <div className="flex items-center gap-2">
              <button onClick={() => setIsMuted(!isMuted)} className="text-emerald-500 hover:text-emerald-400">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-24 h-1 bg-emerald-950 rounded-full appearance-none cursor-pointer accent-emerald-500"
              />
           </div>
           <div className="w-px h-4 bg-emerald-500/20" />
           <button className="flex items-center gap-2 text-[10px] font-black text-emerald-700 hover:text-emerald-500 uppercase tracking-widest">
              <Timer className="w-4 h-4" />
              Sleep Timer
           </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {sounds.map((sound) => (
          <motion.button
            key={sound.id}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => togglePlay(sound.id)}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all relative overflow-hidden group ${
              currentSound === sound.id && isPlaying 
                ? 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]' 
                : 'bg-emerald-950/10 border-emerald-500/10 hover:border-emerald-500/30'
            }`}
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity"
              style={{ backgroundColor: sound.color }}
            />
            
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all ${
              currentSound === sound.id && isPlaying 
                ? 'bg-emerald-500 text-black shadow-lg scale-110' 
                : 'bg-emerald-950/50 text-emerald-800 group-hover:text-emerald-500'
            }`}>
              <sound.icon className="w-8 h-8" />
            </div>
            
            <span className={`text-xs font-black uppercase tracking-widest ${
              currentSound === sound.id && isPlaying ? 'text-emerald-400' : 'text-emerald-900 group-hover:text-emerald-700'
            }`}>
              {sound.name}
            </span>

            {currentSound === sound.id && isPlaying && (
              <div className="absolute top-2 right-2 flex gap-0.5">
                {[1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    animate={{ height: [4, 12, 6, 10, 4] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                    className="w-0.5 bg-emerald-500 rounded-full"
                  />
                ))}
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {currentSound && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6"
          >
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 text-black rounded-xl flex items-center justify-center shadow-lg">
                   {currentSoundData && <currentSoundData.icon className="w-6 h-6" />}
                </div>
                <div>
                   <p className="text-[10px] text-emerald-800 font-black uppercase tracking-widest">Now Playing</p>
                   <h4 className="text-xl font-black text-emerald-100 tracking-tight">{currentSoundData?.name}</h4>
                </div>
             </div>
             
             <div className="flex items-center gap-6">
                <button className="text-emerald-900 hover:text-emerald-500 transition-colors">
                  <SkipBack className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 bg-emerald-500 text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-105 transition-all"
                >
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 translate-x-0.5" />}
                </button>
                <button className="text-emerald-900 hover:text-emerald-500 transition-colors">
                  <SkipForward className="w-6 h-6" />
                </button>
             </div>
             
             <div className="hidden sm:flex flex-col items-end">
                <p className="text-[10px] text-emerald-800 font-black uppercase tracking-widest mb-2">Ambient Intensity</p>
                <div className="flex gap-1">
                   {[...Array(12)].map((_, i) => (
                     <div 
                        key={i} 
                        className={`w-1.5 h-6 rounded-full ${i < (volume * 12) ? 'bg-emerald-500' : 'bg-emerald-950'}`} 
                     />
                   ))}
                </div>
             </div>
          </motion.div>
        </AnimatePresence>
      )}

      <div className="flex flex-col items-center justify-center py-10 opacity-20">
         <div className="flex items-center gap-2 mb-2">
            <Music className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">SuperAI-OS Audio Core</span>
         </div>
         <p className="text-[8px] text-emerald-800 font-bold uppercase">All ambient assets are licensed for non-commercial personal productivity use.</p>
      </div>
    </div>
  );
};
