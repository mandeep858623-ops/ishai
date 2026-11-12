import React, { useState } from 'react';
import { ArrowLeft, RefreshCw, Maximize, AlertCircle, Play, Globe, ShieldCheck, Sparkles } from 'lucide-react';
import { PlayableGame, BUILT_IN_GAMES } from './GameVerseTypes';

interface InAppGamePlayerProps {
  title: string;
  url?: string;
  embedUrl?: string;
  isNative?: boolean;
  nativeGameId?: string;
  recommendedAlternativeGameId?: string;
  onExit: () => void;
  onLaunchNativeGame: (gameId: string) => void;
}

export const InAppGamePlayer: React.FC<InAppGamePlayerProps> = ({
  title,
  url,
  embedUrl,
  isNative = false,
  nativeGameId,
  recommendedAlternativeGameId,
  onExit,
  onLaunchNativeGame,
}) => {
  const [loading, setLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [key, setKey] = useState(0);

  const alternativeGame: PlayableGame | undefined = BUILT_IN_GAMES.find(
    (g) => g.id === (recommendedAlternativeGameId || 'neon_dash')
  );

  const handleReload = () => {
    setLoading(true);
    setIframeError(false);
    setKey((prev) => prev + 1);
  };

  const handleFullscreen = () => {
    const elem = document.getElementById('game-container-element');
    if (elem) {
      if (elem.requestFullscreen) elem.requestFullscreen();
    }
  };

  const targetUrl = embedUrl || url;

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-white rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl">
      {/* Player Header Control Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Game X
          </button>

          <div>
            <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
              <span>{title}</span>
              {isNative ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-600/20 text-purple-300 border border-purple-500/30">
                  SUPERAI Native Game
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Web Portal
                </span>
              )}
            </h3>
            {targetUrl && (
              <p className="text-[10px] text-slate-500 font-mono truncate max-w-sm">
                {targetUrl}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {targetUrl && (
            <button
              onClick={handleReload}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Reload Frame"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}

          <button
            onClick={handleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Toggle Fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Game Container */}
      <div id="game-container-element" className="relative flex-1 w-full h-full bg-slate-950 min-h-[480px] flex items-center justify-center">
        {targetUrl && !iframeError ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {loading && (
              <div className="absolute inset-0 z-10 bg-slate-950/90 flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
                <p className="text-xs font-mono text-cyan-300 animate-pulse">
                  Connecting to Game Portal...
                </p>
              </div>
            )}

            <iframe
              key={key}
              src={targetUrl}
              title={title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; gamepad"
              allowFullScreen
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setIframeError(true);
              }}
            />
          </div>
        ) : (
          /* Native Game or Embedded Blocked Fallback Container */
          <div className="p-8 max-w-xl mx-auto text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/30">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-100">
                Playable In-App Game Alternative
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                External website security headers (X-Frame-Options) prevent embedding the root website directly inside an iframe window.
                Enjoy this verified SUPERAI Playable Alternative:
              </p>
            </div>

            {alternativeGame && (
              <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-5 space-y-4 text-left shadow-lg">
                <div className="flex items-center gap-4">
                  <img
                    src={alternativeGame.thumbnailUrl}
                    alt={alternativeGame.title}
                    className="w-16 h-16 rounded-xl object-cover border border-purple-500/40"
                  />
                  <div>
                    <h4 className="font-extrabold text-slate-100 text-sm">{alternativeGame.title}</h4>
                    <p className="text-xs text-purple-300">{alternativeGame.tagline}</p>
                    <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                      Category: {alternativeGame.category.toUpperCase()} • XP Reward: +{alternativeGame.xpReward}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onLaunchNativeGame(alternativeGame.id)}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20"
                >
                  <Play className="w-4 h-4 fill-current" /> PLAY SUPERAI NATIVE ALTERNATIVE
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
