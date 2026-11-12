import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Volume2, FastForward, Rewind, X, Sparkles } from 'lucide-react';

interface NewsAudioPlayerBarProps {
  title: string;
  textToSpeak: string;
  playbackSpeed?: number;
  onClose: () => void;
}

export const NewsAudioPlayerBar: React.FC<NewsAudioPlayerBarProps> = ({
  title,
  textToSpeak,
  playbackSpeed = 1,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [rate, setRate] = useState<number>(playbackSpeed);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(textToSpeak);
    utt.rate = rate;
    utt.onend = () => setIsPlaying(false);
    utt.onerror = () => setIsPlaying(false);
    
    setUtterance(utt);
    window.speechSynthesis.speak(utt);
    setIsPlaying(true);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [textToSpeak]);

  const togglePlayPause = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else if (utterance) {
        window.speechSynthesis.speak(utterance);
      }
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    onClose();
  };

  const changeSpeed = (newSpeed: number) => {
    setRate(newSpeed);
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(textToSpeak);
    utt.rate = newSpeed;
    utt.onend = () => setIsPlaying(false);
    utt.onerror = () => setIsPlaying(false);
    setUtterance(utt);
    window.speechSynthesis.speak(utt);
    setIsPlaying(true);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-2xl bg-slate-900/95 border border-blue-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center justify-between gap-4">
        {/* Title & Badge */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="overflow-hidden">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
              AI Speech Listening Mode
            </span>
            <h4 className="text-xs font-semibold text-slate-100 truncate max-w-sm">
              {title}
            </h4>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={togglePlayPause}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 transition-all"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          {/* Speed Selector */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700/60 text-[11px] font-bold">
            {[1, 1.25, 1.5, 2].map((spd) => (
              <button
                key={spd}
                onClick={() => changeSpeed(spd)}
                className={`px-2 py-1 rounded-lg transition-all ${
                  rate === spd
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <button
            onClick={handleStop}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            title="Close Audio Player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
