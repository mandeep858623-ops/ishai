import React, { useState } from 'react';
import { Contact, IntruderLog } from '../types/os';
import { soundEngine } from '../utils/audio';

interface ModalWrapperProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({ title, onClose, children, maxWidthClass = 'max-w-xl' }) => (
  <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
    <div className={`bg-[#0a0a0a] border border-emerald-500/80 shadow-[0_0_30px_rgba(16,185,129,0.3)] rounded-lg ${maxWidthClass} w-full max-h-[92dvh] flex flex-col font-mono text-emerald-400 overflow-hidden my-auto`}>
      <div className="flex items-center justify-between border-b border-emerald-500/40 px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-[#0e0e0e] shrink-0">
        <div className="flex items-center gap-2 truncate pr-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <h3 className="font-bold text-xs sm:text-sm tracking-wider uppercase text-emerald-300 truncate">
            {title}
          </h3>
        </div>
        <button
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="text-[11px] sm:text-xs border border-emerald-500/60 px-2 py-1 rounded hover:bg-emerald-500 hover:text-black transition-colors shrink-0 active:scale-95"
        >
          [ ✕ CLOSE ]
        </button>
      </div>
      <div className="p-3 sm:p-5 overflow-y-auto flex-1">{children}</div>
    </div>
  </div>
);

// Contacts Modal
export const ContactsModal: React.FC<{
  contacts: Contact[];
  onAdd: (name: string, phone: string) => void;
  onDelete: (index: number) => void;
  onClear: () => void;
  onClose: () => void;
  onMessageContact?: (phone: string) => void;
}> = ({ contacts, onAdd, onDelete, onClear, onClose, onMessageContact }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    onAdd(name.trim(), phone.trim());
    setName('');
    setPhone('');
  };

  return (
    <ModalWrapper title="📁 CONTACT DIRECTORY MANIFEST" onClose={onClose}>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Contact Tag Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-black border border-emerald-800 focus:border-emerald-500 px-3 py-1.5 text-xs text-emerald-300 rounded flex-1 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Routing Number (e.g. +1415...)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="bg-black border border-emerald-800 focus:border-emerald-500 px-3 py-1.5 text-xs text-emerald-300 rounded flex-1 focus:outline-none"
        />
        <button
          type="submit"
          className="bg-emerald-500 text-black font-bold px-3 py-1.5 text-xs rounded hover:bg-emerald-400 transition-colors"
        >
          + ADD
        </button>
      </form>

      <div className="max-h-60 overflow-y-auto space-y-2 mb-4 pr-1">
        {contacts.length === 0 ? (
          <div className="text-xs text-emerald-600/70 py-4 text-center">
            No address objects stored in matrix registry.
          </div>
        ) : (
          contacts.map((c, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between border border-emerald-950 bg-black/60 p-2.5 rounded text-xs"
            >
              <div>
                <span className="text-emerald-300 font-semibold">{c.name}</span>
                <span className="text-emerald-600 mx-2">→</span>
                <span className="text-emerald-400/90">{c.phone}</span>
              </div>
              <div className="flex gap-2">

                <button
                  onClick={() => onDelete(idx)}
                  className="border border-red-900/60 text-red-400 hover:bg-red-500 hover:text-black px-2 py-0.5 rounded text-[10px]"
                >
                  DEL
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-emerald-950">
        <span className="text-[11px] text-emerald-600">Total Entries: {contacts.length}</span>
        {contacts.length > 0 && (
          <button
            onClick={onClear}
            className="text-[10px] text-red-400 hover:underline border border-red-950 px-2 py-1 rounded"
          >
            PURGE ALL CONTACTS
          </button>
        )}
      </div>
    </ModalWrapper>
  );
};

// Hangman Game Modal
export const HangmanModal: React.FC<{
  onClose: () => void;
  onLog: (msg: string, tag: string) => void;
}> = ({ onClose, onLog }) => {
  const words = ['OVERKILL', 'DEVELOPER', 'SECURITY', 'KINETIC', 'INFRASTRUCTURE', 'TERMINAL', 'PROTOCOL', 'CYBERSPACE'];
  const [word, setWord] = useState(() => words[Math.floor(Math.random() * words.length)]);
  const [guessed, setGuessed] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(6);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const handleGuess = (char: string) => {
    if (guessed.includes(char) || attempts <= 0) return;
    soundEngine.playClick();
    const newGuessed = [...guessed, char];
    setGuessed(newGuessed);

    if (word.includes(char)) {
      const isWon = word.split('').every((c) => newGuessed.includes(c));
      if (isWon) {
        soundEngine.playSuccess();
        onLog(`Hangman string fully verified! Target phrase: ${word}`, 'GAME');
      }
    } else {
      const rem = attempts - 1;
      setAttempts(rem);
      if (rem <= 0) {
        soundEngine.playAlertBeep();
        onLog(`Hangman allocations exhausted. Target phrase was: ${word}`, 'GAME');
      }
    }
  };

  const restart = () => {
    const next = words[Math.floor(Math.random() * words.length)];
    setWord(next);
    setGuessed([]);
    setAttempts(6);
  };

  const isWon = word.split('').every((c) => guessed.includes(c));
  const isLost = attempts <= 0;

  return (
    <ModalWrapper title="🔠 HANGMAN DECRYPTION PUZZLE" onClose={onClose}>
      <div className="text-center py-4">
        <div className="text-xs text-emerald-500 mb-2">
          REMAINING ALLOCATIONS: <span className="font-bold text-amber-400">{attempts}</span> / 6
        </div>
        <div className="tracking-widest text-2xl font-bold text-emerald-300 my-4">
          {word.split('').map((char, i) => (
            <span key={i} className="mx-1 border-b-2 border-emerald-500 pb-1 inline-block w-6 text-center">
              {guessed.includes(char) || isLost ? char : '_'}
            </span>
          ))}
        </div>

        {isWon && (
          <div className="text-sm font-bold text-emerald-400 my-2 bg-emerald-950/60 p-2 rounded border border-emerald-500">
            ✓ DECRYPTION COMPLETE! KEY AUTHORIZED.
          </div>
        )}
        {isLost && (
          <div className="text-sm font-bold text-red-400 my-2 bg-red-950/60 p-2 rounded border border-red-500">
            ✗ ACCESS DENIED! KEY WAS: {word}
          </div>
        )}

        <div className="grid grid-cols-7 gap-1 mt-6 max-w-sm mx-auto">
          {alphabet.map((char) => {
            const used = guessed.includes(char);
            return (
              <button
                key={char}
                disabled={used || isWon || isLost}
                onClick={() => handleGuess(char)}
                className={`py-1.5 text-xs font-bold rounded transition-colors ${
                  used
                    ? 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                    : 'bg-black text-emerald-400 border border-emerald-800 hover:bg-emerald-500 hover:text-black'
                }`}
              >
                {char}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={restart}
            className="border border-emerald-500 text-xs px-4 py-1.5 rounded hover:bg-emerald-500 hover:text-black transition-colors"
          >
            [ NEW TARGET VECTOR ]
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

// Guess Number Modal
export const GuessNumberModal: React.FC<{
  onClose: () => void;
  onLog: (msg: string, tag: string) => void;
}> = ({ onClose, onLog }) => {
  const [secret, setSecret] = useState(() => Math.floor(Math.random() * 100) + 1);
  const [guess, setGuess] = useState('');
  const [hint, setHint] = useState('Input integer between 1 and 100');
  const [attempts, setAttempts] = useState(0);
  const [won, setWon] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(guess, 10);
    if (isNaN(val)) return;
    soundEngine.playClick();
    const newTries = attempts + 1;
    setAttempts(newTries);

    if (val === secret) {
      soundEngine.playSuccess();
      setWon(true);
      setHint(`[SUCCESS] Verified match in ${newTries} attempts! Number was ${secret}.`);
      onLog(`Match verified! Secret tracking integer locked: ${secret} (${newTries} tries)`, 'GAME');
    } else if (val < secret) {
      setHint(`[-] Input target vector ${val} is HIGHER.`);
      onLog(`Guess ${val} -> Secret vector is HIGHER.`, 'GAME');
    } else {
      setHint(`[-] Input target vector ${val} is LOWER.`);
      onLog(`Guess ${val} -> Secret vector is LOWER.`, 'GAME');
    }
    setGuess('');
  };

  const restart = () => {
    setSecret(Math.floor(Math.random() * 100) + 1);
    setAttempts(0);
    setWon(false);
    setHint('Input integer between 1 and 100');
  };

  return (
    <ModalWrapper title="🎯 GUESS NUMBER INTELLIGENCE" onClose={onClose}>
      <div className="text-center py-4">
        <p className="text-xs text-emerald-400 mb-4">{hint}</p>
        {!won ? (
          <form onSubmit={handleSubmit} className="flex justify-center gap-2 max-w-xs mx-auto">
            <input
              type="number"
              min="1"
              max="100"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="1 - 100"
              autoFocus
              className="bg-black border border-emerald-600 px-3 py-1.5 text-center text-sm text-emerald-300 rounded w-28 focus:outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              className="bg-emerald-500 text-black font-bold px-4 py-1.5 text-xs rounded hover:bg-emerald-400"
            >
              TEST
            </button>
          </form>
        ) : (
          <button
            onClick={restart}
            className="border border-emerald-500 text-xs px-4 py-1.5 rounded hover:bg-emerald-500 hover:text-black"
          >
            [ RE-INITIALIZE SECRET ]
          </button>
        )}
        <div className="mt-4 text-[11px] text-emerald-600">Attempts made: {attempts}</div>
      </div>
    </ModalWrapper>
  );
};

// Reflex Arcade Game (Game X)
export const ReflexGameModal: React.FC<{
  onClose: () => void;
  onLog: (msg: string, tag: string) => void;
}> = ({ onClose, onLog }) => {
  const [gameState, setGameState] = useState<'IDLE' | 'WAITING' | 'CLICK_NOW' | 'FINISHED' | 'TOO_EARLY'>('IDLE');
  const [time, setTime] = useState<number | null>(null);
  const startTimeRef = React.useRef<number>(0);
  const timerRef = React.useRef<number | null>(null);

  const startTest = () => {
    soundEngine.playClick();
    setGameState('WAITING');
    setTime(null);
    const delay = Math.floor(Math.random() * 2500) + 1500;
    timerRef.current = window.setTimeout(() => {
      startTimeRef.current = Date.now();
      setGameState('CLICK_NOW');
      soundEngine.playAlertBeep();
    }, delay);
  };

  const handleClick = () => {
    if (gameState === 'WAITING') {
      if (timerRef.current) clearTimeout(timerRef.current);
      setGameState('TOO_EARLY');
      soundEngine.playAlertBeep();
    } else if (gameState === 'CLICK_NOW') {
      const elapsed = Date.now() - startTimeRef.current;
      setTime(elapsed);
      setGameState('FINISHED');
      soundEngine.playSuccess();
      onLog(`Arcade reflex speed matrix test completed: ${elapsed}ms`, 'GAME');
    }
  };

  return (
    <ModalWrapper title="🎮 REFLEX SPEED MATRIX (GAME X)" onClose={onClose}>
      <div className="text-center py-4">
        {gameState === 'IDLE' && (
          <div>
            <p className="text-xs text-emerald-400 mb-4">
              Test neural latency response. When the signal fires, engage immediately.
            </p>
            <button
              onClick={startTest}
              className="bg-emerald-500 text-black font-bold px-6 py-2 text-xs rounded hover:bg-emerald-400"
            >
              [ INITIATE SPEED PROBE ]
            </button>
          </div>
        )}

        {(gameState === 'WAITING' || gameState === 'CLICK_NOW') && (
          <div
            onClick={handleClick}
            className={`w-full h-44 rounded-lg flex items-center justify-center cursor-pointer select-none border transition-colors ${
              gameState === 'WAITING'
                ? 'bg-red-950/40 border-red-800 text-red-400'
                : 'bg-emerald-500 border-white text-black font-extrabold text-xl animate-pulse'
            }`}
          >
            {gameState === 'WAITING' ? 'STAND BY FOR GREEN TRIGGER...' : 'ENGAGE NOW! [CLICK]'}
          </div>
        )}

        {gameState === 'TOO_EARLY' && (
          <div>
            <p className="text-red-400 font-bold text-sm mb-4">
              [FAULT] Triggered before signal! Synchronization lost.
            </p>
            <button
              onClick={startTest}
              className="border border-red-500 text-red-400 px-4 py-1.5 text-xs rounded hover:bg-red-500 hover:text-black"
            >
              RE-ARM TEST
            </button>
          </div>
        )}

        {gameState === 'FINISHED' && (
          <div>
            <div className="text-2xl font-bold text-emerald-300 mb-2">{time} ms</div>
            <p className="text-xs text-emerald-500 mb-4">
              {time && time < 220
                ? '⚡ SUPERHUMAN CYBERNETIC REFLEX!'
                : time && time < 350
                ? '✓ NOMINAL COMBAT RESPONSE'
                : '⚠ SLUGGISH LATENCY DETECTED'}
            </p>
            <button
              onClick={startTest}
              className="border border-emerald-500 text-emerald-400 px-4 py-1.5 text-xs rounded hover:bg-emerald-500 hover:text-black"
            >
              RUN AGAIN
            </button>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};

// Notes Modal
export const NotesModal: React.FC<{
  note: string;
  onSave: (note: string) => void;
  onClose: () => void;
}> = ({ note, onSave, onClose }) => {
  const [content, setContent] = useState(note);
  const [appendLine, setAppendLine] = useState('');

  const handleAppend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appendLine.trim()) return;
    const updated = `${content}\n -> [${new Date().toLocaleTimeString()}] ${appendLine.trim()}`;
    setContent(updated);
    onSave(updated);
    setAppendLine('');
  };

  const handleClear = () => {
    const blank = '--- SECURE INTERNAL MEMORY ALLOCATION ---\n';
    setContent(blank);
    onSave(blank);
  };

  return (
    <ModalWrapper title="📝 SECURE TRANSIENT NOTE ENGINE" onClose={onClose}>
      <div className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            onSave(e.target.value);
          }}
          className="w-full h-44 bg-black border border-emerald-800 p-2.5 rounded font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
        />
        <form onSubmit={handleAppend} className="flex gap-2">
          <input
            type="text"
            placeholder="Append memory line entry..."
            value={appendLine}
            onChange={(e) => setAppendLine(e.target.value)}
            className="flex-1 bg-black border border-emerald-800 px-3 py-1.5 text-xs text-emerald-300 rounded focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="bg-emerald-500 text-black font-bold px-3 py-1.5 text-xs rounded hover:bg-emerald-400"
          >
            APPEND
          </button>
        </form>
        <div className="flex justify-between items-center text-[10px] text-emerald-600">
          <span>Auto-committed to local encrypted storage block.</span>
          <button onClick={handleClear} className="text-red-400 hover:underline">
            PURGE MEMORY
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

// Intruder Log Modal
export const IntruderLogModal: React.FC<{
  intruders: IntruderLog[];
  onClear: () => void;
  onClose: () => void;
}> = ({ intruders, onClear, onClose }) => (
  <ModalWrapper title="🚨 INTRUDER TRACE TELEMETRY LOG" onClose={onClose}>
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {intruders.length === 0 ? (
        <div className="text-center py-6 text-xs text-emerald-600">
          No security breach vectors or unauthorized intruders logged.
        </div>
      ) : (
        intruders.map((item) => (
          <div key={item.id} className="border border-red-900/60 bg-red-950/20 p-3 rounded text-xs space-y-2">
            <div className="flex justify-between text-red-400">
              <span className="font-bold">🚨 UNAUTHORIZED BYPASS ATTEMPT</span>
              <span>{item.timestamp}</span>
            </div>
            {item.image ? (
              <img
                src={item.image}
                alt="Intruder Snapshot"
                className="w-full h-48 object-cover rounded border border-red-800"
              />
            ) : (
              <div className="h-24 bg-black border border-red-900/40 rounded flex items-center justify-center text-red-500/80 text-[11px]">
                [WEBCAM FEED STREAM CAPTURED - DATA CACHED]
              </div>
            )}
            <div className="text-[10px] text-red-500">
              Status: {item.status} | Audio Alarm Triggered | Log Written
            </div>
          </div>
        ))
      )}
    </div>
    {intruders.length > 0 && (
      <div className="mt-4 pt-2 border-t border-emerald-950 flex justify-end">
        <button
          onClick={onClear}
          className="text-xs text-red-400 border border-red-900 px-3 py-1 rounded hover:bg-red-500 hover:text-black"
        >
          CLEAR INTRUDER LOGS
        </button>
      </div>
    )}
  </ModalWrapper>
);

// Voice Settings Modal
export const VoiceSettingsModal: React.FC<{
  sensitivity: number;
  onChangeSensitivity: (val: number) => void;
  voiceGender: 'Male' | 'Female';
  onToggleGender: () => void;
  audioMuted: boolean;
  onToggleMute: () => void;
  onClose: () => void;
}> = ({ sensitivity, onChangeSensitivity, voiceGender, onToggleGender, audioMuted, onToggleMute, onClose }) => {
  return (
    <ModalWrapper title="🎙️ VOICE ASSISTANT CALIBRATION" onClose={onClose}>
      <div className="space-y-6 py-2">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-emerald-300 uppercase tracking-tighter">Wake-Word Sensitivity</label>
            <span className="text-[10px] text-emerald-500 font-mono">{(sensitivity * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.01"
            max="1.0"
            step="0.01"
            value={sensitivity}
            onChange={(e) => onChangeSensitivity(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-emerald-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[9px] text-emerald-700 uppercase font-bold tracking-tighter">
            <span>Low (Hard to trigger)</span>
            <span>High (Easy to trigger)</span>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed italic">
            Calibrate how clearly you must say "Hey SuperAI" to trigger the listener. Lower sensitivity prevents false triggers in noisy environments.
          </p>
        </div>

        <div className="pt-4 border-t border-emerald-950 grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-[10px] text-zinc-500 font-bold block uppercase tracking-widest">Voice Profile</label>
            <button
              onClick={onToggleGender}
              className="w-full py-2 bg-emerald-950/30 border border-emerald-800 text-emerald-400 text-[10px] font-bold rounded hover:bg-emerald-500 hover:text-black transition-all uppercase"
            >
              {voiceGender === 'Male' ? 'MALE CORE' : 'FEMALE CORE'}
            </button>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-zinc-500 font-bold block uppercase tracking-widest">System Audio</label>
            <button
              onClick={onToggleMute}
              className={`w-full py-2 border text-[10px] font-bold rounded transition-all uppercase ${
                audioMuted 
                  ? 'bg-red-950/30 border-red-900 text-red-400 hover:bg-red-500 hover:text-black' 
                  : 'bg-emerald-950/30 border-emerald-800 text-emerald-400 hover:bg-emerald-500 hover:text-black'
              }`}
            >
              {audioMuted ? 'MUTED' : 'ACTIVE'}
            </button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
