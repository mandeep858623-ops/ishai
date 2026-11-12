import React from 'react';
import { ArrowLeft, RotateCcw, Maximize, Sparkles, Trophy } from 'lucide-react';
import { AIGeneratedGameData } from './GameVerseTypes';

interface SandboxedGameRunnerProps {
  game: AIGeneratedGameData;
  onExit: () => void;
}

export const SandboxedGameRunner: React.FC<SandboxedGameRunnerProps> = ({ game, onExit }) => {
  const [key, setKey] = React.useState(0);

  const handleFullscreen = () => {
    const elem = document.getElementById('sandboxed-runner-element');
    if (elem && elem.requestFullscreen) {
      elem.requestFullscreen();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-white rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl">
      {/* Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" /> Exit
          </button>

          <div>
            <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>{game.title}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-600/20 text-purple-300 border border-purple-500/30">
                AI Synthesized Mini-Game
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 truncate max-w-md">
              Prompt: "{game.prompt}"
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setKey((k) => k + 1)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Restart Game"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sandboxed iframe */}
      <div id="sandboxed-runner-element" className="relative flex-1 w-full bg-slate-950 flex items-center justify-center p-2 min-h-[480px]">
        <iframe
          key={key}
          srcDoc={game.codeHtml}
          title={game.title}
          sandbox="allow-scripts allow-same-origin"
          className="w-full h-full border-0 rounded-xl bg-slate-950"
        />
      </div>
    </div>
  );
};
