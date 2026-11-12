import React, { useState, useEffect } from 'react';
import { Play, ArrowLeft, Trophy, BookOpen, CheckCircle2, Lightbulb, RotateCcw } from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

interface WordQuestProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
  highScore: number;
}

const WORD_PACKS = [
  { word: 'CYBER', clue: 'Relating to computers, information technology, and virtual reality' },
  { word: 'MATRIX', clue: 'An environment or material in which something develops' },
  { word: 'NEURAL', clue: 'Relating to a nerve or the central nervous system' },
  { word: 'PULSE', clue: 'A single vibration or short burst of sound or electric current' },
  { word: 'QUANTUM', clue: 'A discrete quantity of energy proportional to frequency' },
  { word: 'AVATAR', clue: 'An icon or figure representing a user in virtual reality' },
  { word: 'FUSION', clue: 'The process or result of joining two or more things together' },
  { word: 'SIGNAL', clue: 'A gesture, action, or sound that conveys information' },
  { word: 'SHIELD', clue: 'A broad piece of armor or protective energy barrier' },
  { word: 'CRYPTO', clue: 'Relating to hidden codes or digital cryptography' },
];

export const WordQuest: React.FC<WordQuestProps> = ({ onGameOver, onExit, highScore }) => {
  const [wordIdx, setWordIdx] = useState(0);
  const [guess, setGuess] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [revealedLetters, setRevealedLetters] = useState<string[]>([]);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'SUCCESS' | 'GAMEOVER'>('START');
  const [currentHighScore, setCurrentHighScore] = useState(highScore);

  const currentPack = WORD_PACKS[wordIdx % WORD_PACKS.length];

  const startGame = () => {
    setWordIdx(0);
    setScore(0);
    setStreak(0);
    setHintsLeft(3);
    setGuess('');
    setRevealedLetters([]);
    setGameState('PLAYING');
  };

  const handleLetterInput = (letter: string) => {
    if (gameState !== 'PLAYING') return;
    if (guess.length < currentPack.word.length) {
      soundEngine.playClick();
      setGuess((prev) => (prev + letter).toUpperCase());
    }
  };

  const handleBackspace = () => {
    if (guess.length > 0) {
      soundEngine.playClick();
      setGuess((prev) => prev.slice(0, -1));
    }
  };

  const handleUseHint = () => {
    if (hintsLeft > 0 && gameState === 'PLAYING') {
      soundEngine.playClick();
      setHintsLeft((h) => h - 1);
      const unrevealed = currentPack.word
        .split('')
        .filter((char) => !revealedLetters.includes(char));

      if (unrevealed.length > 0) {
        const hintChar = unrevealed[Math.floor(Math.random() * unrevealed.length)];
        setRevealedLetters((r) => [...r, hintChar]);
      }
    }
  };

  const handleSubmitWord = () => {
    if (guess.length !== currentPack.word.length) return;

    if (guess === currentPack.word) {
      soundEngine.playSuccess();
      const points = 100 + streak * 25;
      const newScore = score + points;
      setScore(newScore);
      if (newScore > currentHighScore) setCurrentHighScore(newScore);
      setStreak((s) => s + 1);
      setGameState('SUCCESS');
      onGameOver(newScore);

      setTimeout(() => {
        setWordIdx((i) => i + 1);
        setGuess('');
        setRevealedLetters([]);
        setGameState('PLAYING');
      }, 1500);
    } else {
      soundEngine.playAlertBeep();
      setStreak(0);
      setGuess('');
    }
  };

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') handleBackspace();
      else if (e.key === 'Enter') handleSubmitWord();
      else if (/^[a-zA-Z]$/.test(e.key)) {
        handleLetterInput(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [guess, gameState]);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-950 text-white rounded-3xl border border-teal-500/30 max-w-2xl mx-auto shadow-2xl space-y-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Exit
        </button>

        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-teal-400" />
          <h2 className="font-extrabold text-base tracking-wider text-teal-400">
            WORD QUEST
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-teal-950 border border-teal-800 text-teal-300 px-3 py-1 rounded-lg flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> BEST: {currentHighScore}
          </span>
        </div>
      </div>

      {/* Main Play View */}
      <div className="relative w-full max-w-md aspect-square bg-slate-900 rounded-2xl p-6 border border-teal-500/30 flex flex-col items-center justify-between shadow-inner">
        {gameState === 'START' && (
          <div className="p-6 text-center space-y-4 z-10 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-teal-600/20 text-teal-400 flex items-center justify-center mx-auto border border-teal-500/40 animate-pulse">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">WORD QUEST</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Decipher cyber vocabulary words from clues! Type or tap letters to form the target word.
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-sm shadow-lg shadow-teal-600/30 flex items-center gap-2 mx-auto transition-all"
            >
              <Play className="w-4 h-4 fill-current" /> START QUEST
            </button>
          </div>
        )}

        {gameState === 'SUCCESS' && (
          <div className="absolute inset-0 bg-teal-950/90 z-20 flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in">
            <CheckCircle2 className="w-12 h-12 text-teal-400 animate-bounce" />
            <h3 className="text-2xl font-black text-white">WORD SOLVED!</h3>
            <p className="text-xs text-teal-300">+ {100 + streak * 25} Points (Streak {streak}x)</p>
          </div>
        )}

        {(gameState === 'PLAYING' || gameState === 'SUCCESS') && (
          <div className="w-full space-y-5 my-auto">
            {/* Clue Box */}
            <div className="bg-slate-950 p-4 rounded-xl border border-teal-800 text-center space-y-1">
              <span className="text-[10px] font-mono text-teal-400 font-bold uppercase tracking-wider block">
                WORD CLUE #{wordIdx + 1}
              </span>
              <p className="text-xs text-slate-200 font-medium italic">
                "{currentPack.clue}"
              </p>
            </div>

            {/* Letter Slots */}
            <div className="flex justify-center gap-2">
              {currentPack.word.split('').map((char, i) => {
                const guessedChar = guess[i] || '';
                const isRevealed = revealedLetters.includes(char);
                return (
                  <div
                    key={i}
                    className={`w-12 h-14 rounded-xl border-2 font-black text-2xl flex items-center justify-center transition-all ${
                      guessedChar
                        ? 'border-teal-400 bg-teal-950 text-teal-200 shadow-md'
                        : isRevealed
                        ? 'border-amber-500 bg-amber-950/60 text-amber-300'
                        : 'border-slate-800 bg-slate-950 text-slate-600'
                    }`}
                  >
                    {guessedChar || (isRevealed ? char : '')}
                  </div>
                );
              })}
            </div>

            {/* Hint Button */}
            <div className="flex justify-between items-center px-2">
              <button
                onClick={handleUseHint}
                disabled={hintsLeft <= 0}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold disabled:opacity-40"
              >
                <Lightbulb className="w-4 h-4" /> Hint ({hintsLeft} left)
              </button>

              <button
                onClick={handleSubmitWord}
                disabled={guess.length !== currentPack.word.length}
                className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs disabled:opacity-40"
              >
                SUBMIT WORD
              </button>
            </div>
          </div>
        )}
      </div>

      {/* On-Screen Keyboard */}
      {gameState === 'PLAYING' && (
        <div className="w-full max-w-md bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
          {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1">
              {row.split('').map((char) => (
                <button
                  key={char}
                  onClick={() => handleLetterInput(char)}
                  className="px-2.5 py-2 bg-slate-950 hover:bg-teal-950 border border-slate-800 text-slate-200 hover:text-teal-300 font-bold text-xs rounded-lg active:scale-95"
                >
                  {char}
                </button>
              ))}
              {rIdx === 2 && (
                <button
                  onClick={handleBackspace}
                  className="px-3 py-2 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs rounded-lg"
                >
                  ⌫
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
