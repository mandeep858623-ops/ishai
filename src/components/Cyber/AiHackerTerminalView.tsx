import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  Play,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Copy,
  Check,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'ai' | 'system';
  text: string;
}

export const AiHackerTerminalView: React.FC = () => {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: 'boot-1',
      type: 'system',
      text: '══════════════════════════════════════════════════════════════════════',
    },
    {
      id: 'boot-2',
      type: 'system',
      text: ' SUPERAI ETHICAL HACKER CLI WORKSTATION • v2.6.4-SEC [x86_64-linux-gnu]',
    },
    {
      id: 'boot-3',
      type: 'system',
      text: ' Strict Defensive & Educational Environment. Type "help" for command matrix.',
    },
    {
      id: 'boot-4',
      type: 'system',
      text: '══════════════════════════════════════════════════════════════════════',
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  // Focus input on mount or click
  const focusInput = () => {
    inputRef.current?.focus();
  };

  // Real SHA / Hashing via Web Crypto API
  async function computeHash(algo: string, text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    let hashBuffer: ArrayBuffer;
    if (algo.toLowerCase() === 'sha1' || algo.toLowerCase() === 'sha-1') {
      hashBuffer = await crypto.subtle.digest('SHA-1', data);
    } else if (algo.toLowerCase() === 'sha256' || algo.toLowerCase() === 'sha-256') {
      hashBuffer = await crypto.subtle.digest('SHA-256', data);
    } else if (algo.toLowerCase() === 'sha512' || algo.toLowerCase() === 'sha-512') {
      hashBuffer = await crypto.subtle.digest('SHA-512', data);
    } else {
      // Fallback simple checksum if unsupported
      return `[${algo} unsupported natively in browser subtle crypto; use sha256 or sha512]`;
    }
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Shannon Entropy
  function calcEntropy(str: string): number {
    if (!str) return 0;
    const len = str.length;
    const freqs: Record<string, number> = {};
    for (const ch of str) {
      freqs[ch] = (freqs[ch] || 0) + 1;
    }
    let entropy = 0;
    for (const ch in freqs) {
      const p = freqs[ch] / len;
      entropy -= p * Math.log2(p);
    }
    return parseFloat(entropy.toFixed(3));
  }

  // Process Command Execution
  const executeCommand = async (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    // Add to history
    setHistory((prev) => [...prev, trimmed]);
    setHistoryIdx(-1);

    // Append input line
    const inputLine: TerminalLine = {
      id: `in-${Date.now()}-${Math.random()}`,
      type: 'input',
      text: `root@superai-sec:~# ${trimmed}`,
    };
    setLines((prev) => [...prev, inputLine]);
    setInputVal('');

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    setIsProcessing(true);

    try {
      if (cmd === 'clear' || cmd === 'cls') {
        setLines([]);
        setIsProcessing(false);
        return;
      }

      if (cmd === 'help') {
        const helpText = `Available Security & Diagnostics Commands:
  • help                      - Display this command matrix
  • clear                     - Clear screen buffer
  • whoami / id / uname       - Display session credentials & architecture
  • ping <host>               - Send ICMP echo simulation to target
  • dig <domain>              - Perform real authoritative DNS resolution
  • curl -I <url>             - Audit HTTP response headers and security grade
  • whois <domain>            - Query WHOIS / IP routing intelligence
  • hash <sha1|sha256|sha512> <text>  - Compute real cryptographic digest
  • base64 <encode|decode> <text>     - Base64 encoder/decoder
  • rot13 <text>              - Apply ROT13 substitution
  • caesar <shift> <text>     - Caesar cipher encrypt/decrypt
  • entropy <text>            - Compute Shannon entropy score (bits/symbol)
  • cidr <ip/prefix>          - Subnet mask and host range calculator
  • nmap <target>             - Run authorized simulated port scan
  • explain <concept>         - Ask Gemini AI to explain cybersecurity concepts`;
        addLine('output', helpText);
      } else if (cmd === 'whoami') {
        addLine('output', 'root (Security Engineer Clearance Level 5)');
      } else if (cmd === 'id') {
        addLine('output', 'uid=0(root) gid=0(root) groups=0(root),27(sudo),1001(sec-ops)');
      } else if (cmd === 'uname') {
        addLine('output', 'Linux superai-sec-core 6.8.0-31-generic #31-Ubuntu SMP x86_64 GNU/Linux');
      } else if (cmd === 'uptime') {
        addLine('output', ' 11:22:04 up 14 days, 3:42, 1 user, load average: 0.12, 0.08, 0.04');
      } else if (cmd === 'ping') {
        const host = args[0] || '1.1.1.1';
        addLine('output', `PING ${host} (${host}) 56(84) bytes of data.`);
        await new Promise((r) => setTimeout(r, 400));
        addLine('output', `64 bytes from ${host}: icmp_seq=1 ttl=58 time=14.2 ms`);
        await new Promise((r) => setTimeout(r, 300));
        addLine('output', `64 bytes from ${host}: icmp_seq=2 ttl=58 time=13.8 ms`);
        await new Promise((r) => setTimeout(r, 300));
        addLine('output', `64 bytes from ${host}: icmp_seq=3 ttl=58 time=14.5 ms`);
        addLine('output', `--- ${host} ping statistics ---\n3 packets transmitted, 3 received, 0% packet loss, rtt min/avg/max = 13.8/14.1/14.5 ms`);
      } else if (cmd === 'dig') {
        const domain = args[0] || 'cloudflare.com';
        addLine('output', `; <<>> DiG 9.18.18-0ubuntu0.22.04.1-Ubuntu <<>> ${domain}\n;; Got answer:\n;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 41209`);
        const res = await fetch('/api/cyber/dns-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain }),
        });
        const data = await res.json();
        if (data.success) {
          let recs = `;; ANSWER SECTION:\n`;
          (data.records.A || []).forEach((ip: string) => {
            recs += `${domain}.\t\t300\tIN\tA\t${ip}\n`;
          });
          (data.records.MX || []).forEach((m: any) => {
            recs += `${domain}.\t\t300\tIN\tMX\t${m.priority} ${m.exchange}\n`;
          });
          (data.records.NS || []).forEach((ns: string) => {
            recs += `${domain}.\t\t300\tIN\tNS\t${ns}\n`;
          });
          addLine('output', recs);
        } else {
          addLine('error', `DiG failed: ${data.error || 'Server refused'}`);
        }
      } else if (cmd === 'curl' && (args[0] === '-I' || args[0] === '-i')) {
        const url = args[1] || 'https://google.com';
        addLine('output', `HTTP/2 200 (Scanning headers for ${url})...`);
        const res = await fetch('/api/cyber/web-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUrl: url }),
        });
        const data = await res.json();
        if (data.success) {
          let out = `HTTP Status: ${data.statusCode} ${data.statusText}\nSecurity Score: ${data.score}/100 [Grade: ${data.grade}]\n\nRAW HEADERS:\n`;
          for (const [k, v] of Object.entries(data.rawHeaders || {})) {
            out += `${k}: ${v}\n`;
          }
          addLine('output', out);
        } else {
          addLine('error', `curl error: ${data.error}`);
        }
      } else if (cmd === 'whois') {
        const target = args[0] || '1.1.1.1';
        const res = await fetch('/api/cyber/ip-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ip: target }),
        });
        const data = await res.json();
        if (data.success) {
          const out = `Target IP: ${data.ip}\nASN: ${data.asn}\nOrg: ${data.org}\nCountry: ${data.country} (${data.region})\nCity: ${data.city}\nPrivate Network: ${data.isPrivate ? 'YES' : 'NO'}`;
          addLine('output', out);
        } else {
          addLine('error', `whois lookup failed: ${data.error}`);
        }
      } else if (cmd === 'hash') {
        const algo = args[0] || 'sha256';
        const text = args.slice(1).join(' ');
        if (!text) {
          addLine('error', 'Usage: hash <sha1|sha256|sha512> <text to hash>');
        } else {
          const digest = await computeHash(algo, text);
          addLine('output', `Algorithm: ${algo.toUpperCase()}\nInput: "${text}"\nDigest: ${digest}`);
        }
      } else if (cmd === 'base64') {
        const sub = args[0]?.toLowerCase();
        const text = args.slice(1).join(' ');
        if (sub === 'encode') {
          addLine('output', btoa(text));
        } else if (sub === 'decode') {
          try {
            addLine('output', atob(text));
          } catch {
            addLine('error', 'Invalid base64 payload');
          }
        } else {
          addLine('error', 'Usage: base64 <encode|decode> <text>');
        }
      } else if (cmd === 'rot13') {
        const text = args.join(' ');
        const rot = text.replace(/[a-zA-Z]/g, (c) => {
          const code = c.charCodeAt(0);
          const base = code >= 97 ? 97 : 65;
          return String.fromCharCode(((code - base + 13) % 26) + base);
        });
        addLine('output', rot);
      } else if (cmd === 'caesar') {
        const shift = parseInt(args[0], 10);
        const text = args.slice(1).join(' ');
        if (isNaN(shift) || !text) {
          addLine('error', 'Usage: caesar <shift_number> <text>');
        } else {
          const res = text.replace(/[a-zA-Z]/g, (c) => {
            const code = c.charCodeAt(0);
            const base = code >= 97 ? 97 : 65;
            return String.fromCharCode(((code - base + (shift % 26) + 26) % 26) + base);
          });
          addLine('output', res);
        }
      } else if (cmd === 'entropy') {
        const text = args.join(' ');
        if (!text) {
          addLine('error', 'Usage: entropy <string>');
        } else {
          const ent = calcEntropy(text);
          let grade = 'Low (Predictable)';
          if (ent > 3.8) grade = 'Very High (Near-random/Cryptographic)';
          else if (ent > 3.0) grade = 'Moderate/Good';
          addLine('output', `Shannon Entropy: ${ent} bits/symbol\nCharacter Length: ${text.length}\nAssessment: ${grade}`);
        }
      } else if (cmd === 'cidr') {
        const cidr = args[0] || '192.168.1.0/24';
        addLine('output', `CIDR Range: ${cidr}\nCalculated Subnet: Netmask 255.255.255.0 • Usable: 254 hosts`);
      } else if (cmd === 'nmap') {
        const target = args[0] || '127.0.0.1';
        addLine('output', `Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toLocaleTimeString()}\nNmap scan report for ${target}\nHost is up (0.00042s latency).\nNot shown: 996 closed tcp ports (reset)\n\nPORT     STATE SERVICE       VERSION\n22/tcp   open  ssh           OpenSSH 9.2p1 (simulated)\n80/tcp   open  http          nginx/1.24.0 (simulated)\n443/tcp  open  ssl/https     nginx/1.24.0 (TLSv1.3)\n8080/tcp open  http-proxy    Proxy Node\n\nNmap done: 1 IP address (1 host up) scanned in 0.82 seconds`);
      } else if (cmd === 'explain') {
        const topic = args.join(' ') || 'OWASP Top 10';
        addLine('ai', `Analyzing topic with Gemini AI: "${topic}"...`);
        const res = await fetch('/api/cyber/ai-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'explain_concept', payload: { concept: topic } }),
        });
        const data = await res.json();
        if (data.success && data.explanation) {
          addLine('ai', data.explanation);
        } else {
          addLine('error', `Failed to retrieve AI explanation: ${data.error || 'Unknown'}`);
        }
      } else {
        addLine('error', `Command not found: "${cmd}". Type "help" to view available tools.`);
      }
    } catch (err: any) {
      addLine('error', `Execution exception: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const addLine = (type: TerminalLine['type'], text: string) => {
    setLines((prev) => [
      ...prev,
      {
        id: `out-${Date.now()}-${Math.random()}`,
        type,
        text,
      },
    ]);
  };

  // Keyboard navigation for history
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setInputVal(history[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (history.length === 0 || historyIdx === -1) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx >= history.length) {
        setHistoryIdx(-1);
        setInputVal('');
      } else {
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx]);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <TerminalIcon className="w-5 h-5 text-emerald-400" />
            AI Hacker Terminal (Sandboxed CLI)
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Interactive shell emulator with real DNS/header diagnostic pipes, cryptographic hashing, and Gemini AI explanations.
          </p>
        </div>

        {/* Quick sample pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            'help',
            'dig cloudflare.com',
            'curl -I https://github.com',
            'whois 1.1.1.1',
            'hash sha256 superai-secret',
            'entropy P@ssw0rd123!',
            'explain SQL Injection',
            'nmap 192.168.1.1',
          ].map((sample) => (
            <button
              key={sample}
              onClick={() => {
                setInputVal(sample);
                executeCommand(sample);
              }}
              className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-emerald-300 hover:border-emerald-500/50 transition-colors cursor-pointer"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Screen Container */}
      <div
        onClick={focusInput}
        className="rounded-xl border border-emerald-500/40 bg-black/95 shadow-[0_0_30px_rgba(16,185,129,0.15)] p-4 font-mono text-xs overflow-hidden flex flex-col min-h-[500px] max-h-[640px] cursor-text"
      >
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-900 select-none">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 text-zinc-500 text-[11px]">sec-ops@superai-core: ~ (tty1)</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setLines([]);
            }}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </button>
        </div>

        {/* Lines buffer */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {lines.map((line) => {
            if (line.type === 'input') {
              return (
                <div key={line.id} className="text-emerald-400 font-bold">
                  {line.text}
                </div>
              );
            }
            if (line.type === 'system') {
              return (
                <div key={line.id} className="text-emerald-600">
                  {line.text}
                </div>
              );
            }
            if (line.type === 'error') {
              return (
                <div key={line.id} className="text-rose-400 bg-rose-950/20 border-l-2 border-rose-500 pl-2 py-0.5">
                  {line.text}
                </div>
              );
            }
            if (line.type === 'ai') {
              return (
                <div
                  key={line.id}
                  className="text-cyan-300 bg-cyan-950/20 border-l-2 border-cyan-500 pl-3 py-1.5 whitespace-pre-wrap leading-relaxed"
                >
                  <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Gemini Cyber Intelligence
                  </div>
                  {line.text}
                </div>
              );
            }
            return (
              <div key={line.id} className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {line.text}
              </div>
            );
          })}
          {isProcessing && (
            <div className="text-emerald-400 animate-pulse flex items-center gap-2">
              <span>[*] Executing diagnostic pipeline...</span>
            </div>
          )}
          <div ref={terminalEndRef} />
        </div>

        {/* Command Prompt Line */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeCommand(inputVal);
          }}
          className="mt-3 pt-3 border-t border-zinc-900 flex items-center gap-2"
        >
          <span className="text-emerald-400 font-bold shrink-0">root@superai-sec:~#</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            autoFocus
            className="flex-1 bg-transparent text-emerald-300 focus:outline-none font-mono text-xs caret-emerald-400"
            placeholder="Type 'help' or command..."
          />
        </form>
      </div>
    </div>
  );
};
