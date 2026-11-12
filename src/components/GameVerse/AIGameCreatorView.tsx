import React, { useState } from 'react';
import { Sparkles, Bot, Play, Code, RefreshCw, CheckCircle2, ShieldCheck, Wand2, Rocket } from 'lucide-react';
import { AIGeneratedGameData } from './GameVerseTypes';

interface AIGameCreatorViewProps {
  onPlayGeneratedGame?: (game: AIGeneratedGameData) => void;
  onGrantXp?: (amount: number, reason: string) => void;
  onLog?: (msg: string, tag?: string) => void;
  onSaveCustomGame?: (game: any) => void;
}

export const AIGameCreatorView: React.FC<AIGameCreatorViewProps> = ({
  onPlayGeneratedGame,
  onGrantXp,
  onLog,
  onSaveCustomGame,
}) => {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [gameType, setGameType] = useState<'ai' | 'template'>('ai');
  const [templateType, setTemplateType] = useState<'runner' | 'shooter' | 'quiz' | 'clicker'>('runner');
  const [templateTheme, setTemplateTheme] = useState<'neon' | 'space' | 'cyber' | 'retro'>('neon');

  const samplePrompts = [
    'Build a neon space racing game with dodging lasers and speed power-ups',
    'Create a maze adventure with keys, doors, and monster patrol hazards',
    'Design a colorful bouncing ball shooter with high score multiplier',
    'Make a science quiz challenge with countdown timer and sound effects',
  ];

  const handleGenerateGame = async (targetPrompt?: string) => {
    const activePrompt = (targetPrompt || prompt).trim();
    if (!activePrompt || generating) return;

    setGenerating(true);

    try {
      const systemPrompt = `You are SUPERAI Autonomous Game Engine.
Generate a complete, self-contained HTML5 Canvas / JavaScript playable game based on this prompt: "${activePrompt}".

Requirements:
- Single HTML file string with <canvas id="gameCanvas"></canvas> and inline <script> tag.
- Include complete game loop, keyboard/click event listeners, score tracking, game over, and restart button.
- Make it responsive (width 360, height 480).
- Use beautiful dark theme colors (#020617, neon purple #a855f7, cyan #06b6d4, emerald #10b981).
- Return ONLY the executable HTML code string inside an HTML code block: \`\`\`html ... \`\`\`. Do not add conversational conversational text.`;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: systemPrompt }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.text || data.message || data.content || '';
        const match = text.match(/```html([\s\S]*?)```/) || text.match(/<html[\s\S]*?<\/html>/i);

        if (match) {
          const codeHtml = match[1] || match[0];
          const generatedGame: AIGeneratedGameData = {
            id: `ai_game_${Date.now()}`,
            title: activePrompt.slice(0, 30) + '...',
            description: `AI-Synthesized Game generated from prompt: "${activePrompt}"`,
            instructions: 'Use Arrow Keys / Spacebar or Mouse click to interact with game elements.',
            codeHtml: codeHtml.trim(),
            createdAt: new Date().toISOString(),
            prompt: activePrompt,
          };

          onGrantXp?.(200, 'AI Game Creator Achievement');
          setGenerating(false);
          onPlayGeneratedGame?.(generatedGame);
          return;
        }
      }
    } catch (err) {
      console.warn('[AIGameCreator] AI fetch error, falling back to template engine:', err);
    }

    // Fallback Template Generator
    const fallbackCode = generateTemplateHtml(templateType, templateTheme, activePrompt);
    const generatedGame: AIGeneratedGameData = {
      id: `ai_template_${Date.now()}`,
      title: `${templateTheme.toUpperCase()} ${templateType.toUpperCase()} MATRIX`,
      description: `Template-Engine game based on prompt: "${activePrompt}"`,
      instructions: 'Controls: Arrow Keys or Mouse Clicks to interact with game obstacles.',
      codeHtml: fallbackCode,
      createdAt: new Date().toISOString(),
      prompt: activePrompt,
    };

    onGrantXp?.(100, 'Template Game Built');
    setGenerating(false);
    onPlayGeneratedGame?.(generatedGame);
  };

  const generateTemplateHtml = (type: string, theme: string, userPrompt: string) => {
    return `<!DOCTYPE html>
<html>
<head>
<style>
  body { margin:0; background:#020617; color:#fff; font-family:sans-serif; text-align:center; overflow:hidden; }
  canvas { background:#090c15; border:2px solid #a855f7; border-radius:16px; margin-top:20px; box-shadow: 0 0 20px rgba(168,85,247,0.3); }
  h2 { color:#a855f7; margin-top:15px; font-size:18px; }
  .btn { background:#a855f7; color:#fff; font-weight:bold; border:none; padding:10px 20px; border-radius:10px; cursor:pointer; margin-top:10px; }
</style>
</head>
<body>
  <h2>⚡ ${theme.toUpperCase()} ${type.toUpperCase()}</h2>
  <canvas id="gameCanvas" width="340" height="420"></canvas>
  <div>
    <button className="btn" onclick="restart()">Restart Game</button>
  </div>

  <script>
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    let score = 0;
    let gameOver = false;
    let px = 150, py = 350;
    let items = [];

    function spawn() {
      if(!gameOver) {
        items.push({ x: Math.random()*300+20, y: 0, speed: Math.random()*2+2 });
      }
    }
    setInterval(spawn, 800);

    function loop() {
      ctx.clearRect(0,0,340,420);
      
      // Player
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(px, py, 40, 20);

      // Obstacles
      ctx.fillStyle = '#06b6d4';
      for(let i = items.length - 1; i >= 0; i--) {
        let it = items[i];
        it.y += it.speed;
        ctx.fillRect(it.x, it.y, 20, 20);

        if(it.y > 400) { items.splice(i, 1); score += 10; }
        if(Math.abs(it.x - px) < 30 && Math.abs(it.y - py) < 20) {
          gameOver = true;
        }
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = '14px monospace';
      ctx.fillText('SCORE: ' + score, 15, 25);

      if(gameOver) {
        ctx.fillStyle = '#ef4444';
        ctx.font = '20px sans-serif';
        ctx.fillText('GAME OVER!', 110, 200);
      } else {
        requestAnimationFrame(loop);
      }
    }
    loop();

    window.addEventListener('keydown', (e) => {
      if(e.key === 'ArrowLeft' && px > 10) px -= 25;
      if(e.key === 'ArrowRight' && px < 290) px += 25;
    });

    function restart() {
      score = 0;
      gameOver = false;
      items = [];
      loop();
    }
  </script>
</body>
</html>`;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 p-6 sm:p-8 border border-purple-500/30 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs font-semibold border border-purple-500/20">
              <Bot className="w-3.5 h-3.5" /> Generative Game Architecture
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              AI GAME CREATOR
            </h2>
            <p className="text-slate-300 text-xs max-w-xl leading-relaxed">
              Synthesize custom playable HTML5 mini-games from plain text descriptions. Earn +200 XP for every created game!
            </p>
          </div>

          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold shrink-0">
            <button
              onClick={() => setGameType('ai')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                gameType === 'ai' ? 'bg-purple-600 text-white' : 'text-slate-400'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" /> AI Mode
            </button>
            <button
              onClick={() => setGameType('template')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                gameType === 'template' ? 'bg-purple-600 text-white' : 'text-slate-400'
              }`}
            >
              <Code className="w-3.5 h-3.5" /> Template Engine
            </button>
          </div>
        </div>
      </div>

      {/* Main Creation Card */}
      <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 space-y-6 shadow-xl">
        {gameType === 'ai' ? (
          <div className="space-y-4">
            <label className="font-extrabold text-slate-100 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" /> Describe the game you want to build
            </label>

            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Create a space racing game with laser dodging and speed multipliers..."
              className="w-full p-4 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-2xl text-xs text-slate-200 outline-none placeholder-slate-500 leading-relaxed shadow-inner"
            />

            {/* Sample Prompts */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-slate-400">Sample Prompts:</span>
              <div className="flex flex-wrap gap-2">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPrompt(p);
                      handleGenerateGame(p);
                    }}
                    className="text-left text-xs bg-slate-950 hover:bg-purple-950/60 border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-purple-300 px-3 py-1.5 rounded-xl transition-all"
                  >
                    💡 {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Template Engine Controls */
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Game Type</label>
                <select
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                >
                  <option value="runner">Obstacle Runner</option>
                  <option value="shooter">Space Shooter</option>
                  <option value="quiz">Knowledge Quiz</option>
                  <option value="clicker">Speed Clicker</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Visual Theme</label>
                <select
                  value={templateTheme}
                  onChange={(e) => setTemplateTheme(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                >
                  <option value="neon">Neon Cyberpunk</option>
                  <option value="space">Space Galactic</option>
                  <option value="cyber">Matrix Emerald</option>
                  <option value="retro">8-Bit Retro Arcade</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Generate CTA Button */}
        <button
          onClick={() => handleGenerateGame()}
          disabled={generating}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {generating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Synthesizing Game Canvas & Mechanics...</span>
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5" />
              <span>SYNTHESIZE & PLAY GAME NOW</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
