import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Zap,
  RefreshCw,
  Copy,
  Check,
  Clock,
  Cpu,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';

export const PasswordSecurityLabView: React.FC = () => {
  const [password, setPassword] = useState('SuperAI#Cyber2026!');
  const [showPassword, setShowPassword] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Generator settings
  const [genMode, setGenMode] = useState<'chars' | 'passphrase'>('chars');
  const [genLength, setGenLength] = useState(16);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeDigits, setIncludeDigits] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [generatedResult, setGeneratedResult] = useState('');

  // TOTP Simulator State
  const [totpCode, setTotpCode] = useState('482910');
  const [totpSecondsLeft, setTotpSecondsLeft] = useState(30);

  // TOTP interval ticker
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = 30 - (now % 30);
      setTotpSecondsLeft(remaining);
      if (remaining === 30) {
        // Roll simulated TOTP code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setTotpCode(code);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute Password Metrics
  const analyzePassword = (pwd: string) => {
    let poolSize = 0;
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasDigit = /[0-9]/.test(pwd);
    const hasSymbol = /[^a-zA-Z0-9]/.test(pwd);

    if (hasLower) poolSize += 26;
    if (hasUpper) poolSize += 26;
    if (hasDigit) poolSize += 10;
    if (hasSymbol) poolSize += 33;

    const length = pwd.length;
    const entropy = length > 0 && poolSize > 0 ? length * Math.log2(poolSize) : 0;
    const totalCombinations = poolSize > 0 ? Math.pow(poolSize, length) : 0;

    // Pattern warnings
    const warnings: string[] = [];
    if (length < 12) warnings.push('Length is under recommended 12 characters');
    if (/^[a-zA-Z]+$/.test(pwd)) warnings.push('Only letters used (no digits or symbols)');
    if (/^[0-9]+$/.test(pwd)) warnings.push('Only numeric digits used');
    if (/(.)\1{2,}/.test(pwd)) warnings.push('Contains 3+ consecutive repeating characters');
    if (/12345|qwerty|asdf|password|admin/i.test(pwd)) warnings.push('Contains common predictable sequence or dictionary word');

    // Crack time estimations (seconds)
    const onlineRate = 100; // 100 guesses/sec (throttled login)
    const cpuRate = 1e7; // 10 million / sec
    const gpuClusterRate = 1e11; // 100 billion / sec (hashcat RTX 4090 cluster)
    const supercomputerRate = 1e13; // 10 trillion / sec

    const formatTime = (seconds: number) => {
      if (!isFinite(seconds) || seconds > 1e15) return 'Centuries (Mathematically infeasible)';
      if (seconds < 1) return 'Instant (< 1 second)';
      if (seconds < 60) return `${Math.round(seconds)} seconds`;
      if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
      if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
      if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
      const years = Math.round(seconds / 31536000);
      if (years > 1000000) return `${(years / 1000000).toFixed(1)} million years`;
      if (years > 1000) return `${(years / 1000).toFixed(1)} thousand years`;
      return `${years} years`;
    };

    return {
      entropy: parseFloat(entropy.toFixed(1)),
      poolSize,
      length,
      hasLower,
      hasUpper,
      hasDigit,
      hasSymbol,
      warnings,
      crackTimes: {
        online: formatTime(totalCombinations / 2 / onlineRate),
        cpu: formatTime(totalCombinations / 2 / cpuRate),
        gpu: formatTime(totalCombinations / 2 / gpuClusterRate),
        supercomputer: formatTime(totalCombinations / 2 / supercomputerRate),
      },
    };
  };

  const metrics = analyzePassword(password);

  const getEntropyLevel = (ent: number) => {
    if (ent < 40) return { label: 'Very Weak', color: 'text-rose-400', bar: 'bg-rose-500', width: '20%' };
    if (ent < 60) return { label: 'Moderate', color: 'text-amber-400', bar: 'bg-amber-500', width: '50%' };
    if (ent < 80) return { label: 'Strong', color: 'text-cyan-400', bar: 'bg-cyan-500', width: '75%' };
    return { label: 'Cryptographic Grade', color: 'text-emerald-400', bar: 'bg-emerald-500', width: '100%' };
  };

  const entropyBadge = getEntropyLevel(metrics.entropy);

  // Generate cryptographically secure password
  const generatePassword = () => {
    if (genMode === 'passphrase') {
      const wordlist = [
        'orbit', 'neon', 'matrix', 'cipher', 'quantum', 'shield', 'phoenix', 'router',
        'falcon', 'zenith', 'stellar', 'plasma', 'kernel', 'glitch', 'beacon', 'protocol',
        'apex', 'shadow', 'nebula', 'titan', 'radar', 'vortex', 'prism', 'aurora'
      ];
      const count = 4;
      const array = new Uint32Array(count);
      crypto.getRandomValues(array);
      const chosen = Array.from(array).map((val) => wordlist[val % wordlist.length]);
      const num = (array[0] % 900 + 100).toString();
      const res = `${chosen.join('-')}-${num}!`;
      setGeneratedResult(res);
      setPassword(res);
      return;
    }

    let chars = '';
    if (includeLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (includeUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeDigits) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()-_=+[]{}<>?~';
    if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';

    const array = new Uint32Array(genLength);
    crypto.getRandomValues(array);
    let pwd = '';
    for (let i = 0; i < genLength; i++) {
      pwd += chars[array[i] % chars.length];
    }
    setGeneratedResult(pwd);
    setPassword(pwd);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-400" />
            Password Security Lab &amp; Entropy Engine
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Client-side Shannon entropy calculation, brute-force cracking estimates, and Diceware passphrase generator.
          </p>
        </div>

        <button
          onClick={generatePassword}
          className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer self-start md:self-auto"
        >
          <Sparkles className="w-4 h-4 fill-black" />
          Generate Secure Password
        </button>
      </div>

      {/* Live Input & Entropy Breakdown */}
      <div className="p-4 rounded-xl border border-amber-500/30 bg-zinc-950/90 shadow-xl space-y-4">
        <div>
          <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider block mb-1.5">
            Test Password or Passphrase
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password to evaluate..."
              className="w-full bg-black border border-zinc-700 focus:border-amber-400 text-amber-300 px-3.5 py-2.5 rounded-lg text-sm font-mono focus:outline-none transition-colors pr-24"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[10px] text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(password, 'pwd-main')}
                className="text-zinc-400 hover:text-white p-1 rounded"
              >
                {copiedKey === 'pwd-main' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Entropy Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
            <span className="text-zinc-400">
              Entropy: <strong className={entropyBadge.color}>{metrics.entropy} bits</strong>
            </span>
            <span className={`font-bold ${entropyBadge.color}`}>{entropyBadge.label}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
            <div
              className={`h-full transition-all duration-300 ${entropyBadge.bar}`}
              style={{ width: entropyBadge.width }}
            />
          </div>
        </div>

        {/* Character Pool breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className={`p-2 rounded border ${metrics.hasLower ? 'border-emerald-900 bg-emerald-950/20 text-emerald-300' : 'border-zinc-800 bg-black text-zinc-600'}`}>
            ✓ Lowercase (a-z)
          </div>
          <div className={`p-2 rounded border ${metrics.hasUpper ? 'border-emerald-900 bg-emerald-950/20 text-emerald-300' : 'border-zinc-800 bg-black text-zinc-600'}`}>
            ✓ Uppercase (A-Z)
          </div>
          <div className={`p-2 rounded border ${metrics.hasDigit ? 'border-emerald-900 bg-emerald-950/20 text-emerald-300' : 'border-zinc-800 bg-black text-zinc-600'}`}>
            ✓ Digits (0-9)
          </div>
          <div className={`p-2 rounded border ${metrics.hasSymbol ? 'border-emerald-900 bg-emerald-950/20 text-emerald-300' : 'border-zinc-800 bg-black text-zinc-600'}`}>
            ✓ Symbols (!@#$)
          </div>
        </div>

        {/* Warnings */}
        {metrics.warnings.length > 0 && (
          <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/60 text-xs text-rose-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-rose-400">
              <ShieldAlert className="w-3.5 h-3.5" />
              Detected Weakness Patterns:
            </div>
            {metrics.warnings.map((w, idx) => (
              <div key={idx} className="text-[11px] text-zinc-400 pl-5">
                • {w}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cracking Scenarios Grid */}
      <div>
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          Estimated Time to Crack (Brute Force Exhaustion)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/80">
            <div className="text-[10px] text-zinc-500 uppercase">Online Web Throttling</div>
            <div className="text-[10px] text-zinc-400 font-mono">100 attempts / sec</div>
            <div className="text-sm font-bold text-emerald-400 mt-2 font-mono">
              {metrics.crackTimes.online}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/80">
            <div className="text-[10px] text-zinc-500 uppercase">Single Fast CPU</div>
            <div className="text-[10px] text-zinc-400 font-mono">10M hashes / sec</div>
            <div className="text-sm font-bold text-cyan-300 mt-2 font-mono">
              {metrics.crackTimes.cpu}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/80">
            <div className="text-[10px] text-zinc-500 uppercase">High-End GPU Rig</div>
            <div className="text-[10px] text-zinc-400 font-mono">100B hashes / sec (Hashcat)</div>
            <div className="text-sm font-bold text-amber-300 mt-2 font-mono">
              {metrics.crackTimes.gpu}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/80">
            <div className="text-[10px] text-zinc-500 uppercase">Supercomputer Cluster</div>
            <div className="text-[10px] text-zinc-400 font-mono">10T hashes / sec</div>
            <div className="text-sm font-bold text-violet-300 mt-2 font-mono">
              {metrics.crackTimes.supercomputer}
            </div>
          </div>
        </div>
      </div>

      {/* Passphrase Generator & TOTP 2FA Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Passphrase Generator */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Cryptographic Generator</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setGenMode('chars')}
                className={`text-[10px] px-2 py-0.5 rounded font-mono ${genMode === 'chars' ? 'bg-amber-500 text-black font-bold' : 'bg-zinc-900 text-zinc-400'}`}
              >
                Characters
              </button>
              <button
                onClick={() => setGenMode('passphrase')}
                className={`text-[10px] px-2 py-0.5 rounded font-mono ${genMode === 'passphrase' ? 'bg-amber-500 text-black font-bold' : 'bg-zinc-900 text-zinc-400'}`}
              >
                Diceware
              </button>
            </div>
          </div>

          {genMode === 'chars' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                <span>Length: {genLength} characters</span>
                <input
                  type="range"
                  min="8"
                  max="48"
                  value={genLength}
                  onChange={(e) => setGenLength(parseInt(e.target.value, 10))}
                  className="w-32 accent-amber-400 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeUpper}
                    onChange={(e) => setIncludeUpper(e.target.checked)}
                    className="rounded bg-black border-zinc-700 text-amber-500"
                  />
                  Uppercase (A-Z)
                </label>
                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeLower}
                    onChange={(e) => setIncludeLower(e.target.checked)}
                    className="rounded bg-black border-zinc-700 text-amber-500"
                  />
                  Lowercase (a-z)
                </label>
                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDigits}
                    onChange={(e) => setIncludeDigits(e.target.checked)}
                    className="rounded bg-black border-zinc-700 text-amber-500"
                  />
                  Numbers (0-9)
                </label>
                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSymbols}
                    onChange={(e) => setIncludeSymbols(e.target.checked)}
                    className="rounded bg-black border-zinc-700 text-amber-500"
                  />
                  Symbols (!@#$)
                </label>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-400 leading-relaxed">
              Diceware generates memorable passphrases composed of randomly selected words separated by hyphens. Ideal for master passwords and disk encryption keys.
            </p>
          )}

          <button
            onClick={generatePassword}
            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-lg transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer"
          >
            Generate &amp; Apply
          </button>
        </div>

        {/* 2FA / TOTP Educational Simulator */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">MFA / TOTP Authenticator Simulator</h3>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">RFC 6238</span>
          </div>

          <div className="p-4 rounded-xl bg-black border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">SUPERAI Sec-Ops Account</div>
              <div className="text-2xl font-black font-mono tracking-widest text-emerald-400 mt-1">
                {totpCode}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-xs font-mono font-bold text-cyan-400">
                {totpSecondsLeft}s
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-zinc-800 flex items-center justify-center relative mt-1">
                <span
                  className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Time-based One-Time Passwords (TOTP) compute an HMAC-SHA1 digest of the shared secret key and the current 30-second UNIX timestamp. Even if a password is compromised, an adversary without the TOTP seed cannot authenticate.
          </p>
        </div>
      </div>
    </div>
  );
};
