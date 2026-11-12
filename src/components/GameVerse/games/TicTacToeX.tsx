import React, { useState } from 'react';
import { Play, RotateCcw, ArrowLeft, Trophy, Users, Bot, Sparkles, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

interface TicTacToeXProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
  highScore: number;
}

type Player = 'X' | 'O';

export const TicTacToeX: React.FC<TicTacToeXProps> = ({ onGameOver, onExit, highScore }) => {
  const [mode, setMode] = useState<'AI' | '2PLAYER'>('AI');
  const [gridSize, setGridSize] = useState<3 | 4>(3);
  const [board, setBoard] = useState<(Player | null)[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'DRAW' | null>(null);
  const [xWins, setXWins] = useState(0);
  const [oWins, setOWins] = useState(0);

  const checkWinner = (squares: (Player | null)[], size: number): Player | 'DRAW' | null => {
    const lines: number[][] = [];

    if (size === 3) {
      // Rows
      lines.push([0, 1, 2], [3, 4, 5], [6, 7, 8]);
      // Cols
      lines.push([0, 3, 6], [1, 4, 7], [2, 5, 8]);
      // Diagonals
      lines.push([0, 4, 8], [2, 4, 6]);
    } else {
      // 4x4
      for (let r = 0; r < 4; r++) lines.push([r * 4, r * 4 + 1, r * 4 + 2, r * 4 + 3]);
      for (let c = 0; c < 4; c++) lines.push([c, c + 4, c + 8, c + 12]);
      lines.push([0, 5, 10, 15], [3, 6, 9, 12]);
    }

    for (const line of lines) {
      const first = squares[line[0]];
      if (first && line.every((idx) => squares[idx] === first)) {
        return first;
      }
    }

    if (squares.every((cell) => cell !== null)) return 'DRAW';
    return null;
  };

  const makeComputerMove = (currentBoard: (Player | null)[]) => {
    const emptyIndices = currentBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((val): val is number => val !== null);

    if (emptyIndices.length === 0) return;

    // Check if AI can win immediately
    for (const idx of emptyIndices) {
      const test = [...currentBoard];
      test[idx] = 'O';
      if (checkWinner(test, gridSize) === 'O') {
        executeMove(idx, 'O', currentBoard);
        return;
      }
    }

    // Check if AI needs to block player X win
    for (const idx of emptyIndices) {
      const test = [...currentBoard];
      test[idx] = 'X';
      if (checkWinner(test, gridSize) === 'X') {
        executeMove(idx, 'O', currentBoard);
        return;
      }
    }

    // Random choice among available empty cells
    const randomIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    executeMove(randomIdx, 'O', currentBoard);
  };

  const executeMove = (index: number, player: Player, currentBoard: (Player | null)[]) => {
    const newBoard = [...currentBoard];
    newBoard[index] = player;
    setBoard(newBoard);
    soundEngine.playClick();

    const gameRes = checkWinner(newBoard, gridSize);
    if (gameRes) {
      setWinner(gameRes);
      if (gameRes === 'X') {
        setXWins((w) => w + 1);
        soundEngine.playSuccess();
        onGameOver(100);
      } else if (gameRes === 'O') {
        setOWins((w) => w + 1);
        soundEngine.playAlertBeep();
      }
    } else {
      setTurn(player === 'X' ? 'O' : 'X');
    }
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner) return;

    if (mode === 'AI' && turn !== 'X') return;

    const nextBoard = [...board];
    nextBoard[index] = turn;
    setBoard(nextBoard);
    soundEngine.playClick();

    const gameRes = checkWinner(nextBoard, gridSize);
    if (gameRes) {
      setWinner(gameRes);
      if (gameRes === 'X') {
        setXWins((w) => w + 1);
        soundEngine.playSuccess();
        onGameOver(100);
      } else if (gameRes === 'O') {
        setOWins((w) => w + 1);
        soundEngine.playAlertBeep();
      }
    } else {
      const nextTurn = turn === 'X' ? 'O' : 'X';
      setTurn(nextTurn);

      if (mode === 'AI' && nextTurn === 'O') {
        setTimeout(() => makeComputerMove(nextBoard), 400);
      }
    }
  };

  const resetBoard = (newSize: 3 | 4 = gridSize) => {
    setGridSize(newSize);
    setBoard(Array(newSize * newSize).fill(null));
    setTurn('X');
    setWinner(null);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-950 text-white rounded-3xl border border-purple-500/30 max-w-2xl mx-auto shadow-2xl space-y-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Exit
        </button>

        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h2 className="font-extrabold text-base tracking-wider text-purple-400">
            TIC-TAC-TOE X
          </h2>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setMode('AI')}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
              mode === 'AI' ? 'bg-purple-600 text-white' : 'text-slate-400'
            }`}
          >
            <Bot className="w-3.5 h-3.5" /> vs AI
          </button>
          <button
            onClick={() => setMode('2PLAYER')}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
              mode === '2PLAYER' ? 'bg-purple-600 text-white' : 'text-slate-400'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> 2-Player
          </button>
        </div>
      </div>

      {/* Mode / Grid Switcher */}
      <div className="flex items-center justify-between w-full max-w-md text-xs font-mono bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-purple-400 font-bold">X Wins: {xWins}</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400 font-bold">O Wins: {oWins}</span>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => resetBoard(3)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
              gridSize === 3 ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'text-slate-500'
            }`}
          >
            3x3
          </button>
          <button
            onClick={() => resetBoard(4)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
              gridSize === 4 ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'text-slate-500'
            }`}
          >
            4x4
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="relative w-full max-w-md aspect-square bg-slate-900 rounded-2xl p-4 border border-purple-500/30 flex flex-col items-center justify-center shadow-inner">
        {winner && (
          <div className="absolute inset-0 bg-slate-950/95 z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
            {winner === 'DRAW' ? (
              <div className="text-amber-400 font-extrabold text-xl">STALEMATE DRAW</div>
            ) : (
              <div className="text-purple-400 font-extrabold text-2xl flex items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-purple-400 animate-bounce" />
                PLAYER {winner} WINS!
              </div>
            )}

            <button
              onClick={() => resetBoard(gridSize)}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/30"
            >
              <RotateCcw className="w-4 h-4" /> REMATCH
            </button>
          </div>
        )}

        <div
          className={`w-full h-full grid gap-3 p-2 bg-slate-950 rounded-xl ${
            gridSize === 3 ? 'grid-cols-3 grid-rows-3' : 'grid-cols-4 grid-rows-4'
          }`}
        >
          {board.map((cell, idx) => (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              className={`rounded-2xl font-black text-3xl sm:text-4xl flex items-center justify-center border transition-all ${
                cell === 'X'
                  ? 'text-purple-400 border-purple-500/50 bg-purple-950/40 shadow-inner'
                  : cell === 'O'
                  ? 'text-cyan-400 border-cyan-500/50 bg-cyan-950/40 shadow-inner'
                  : 'bg-slate-900/80 border-slate-800 hover:border-purple-500/40 hover:bg-slate-800/80'
              }`}
            >
              {cell}
            </button>
          ))}
        </div>
      </div>

      {/* Turn Indicator */}
      <div className="text-xs font-mono text-slate-400">
        {!winner && (
          <span>
            Current Turn: <strong className={turn === 'X' ? 'text-purple-400' : 'text-cyan-400'}>{turn}</strong>
            {mode === 'AI' && turn === 'O' && ' (Computing AI move...)'}
          </span>
        )}
      </div>
    </div>
  );
};
