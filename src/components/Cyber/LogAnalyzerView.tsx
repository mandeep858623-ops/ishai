import React, { useState } from 'react';
import {
  FileSpreadsheet,
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  BarChart3,
  RotateCcw,
  CheckCircle2,
  XOctagon,
} from 'lucide-react';

interface ParsedLogLine {
  id: string;
  raw: string;
  ip: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  threatLevel: 'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS';
  threatReason?: string;
}

export const LogAnalyzerView: React.FC = () => {
  const sampleLogs = {
    webAttacks: `198.51.100.42 - - [27/Oct/2026:10:14:02 +0000] "GET / HTTP/1.1" 200 4820 "-" "Mozilla/5.0"
198.51.100.42 - - [27/Oct/2026:10:14:03 +0000] "GET /about HTTP/1.1" 200 3210 "-" "Mozilla/5.0"
203.0.113.88 - - [27/Oct/2026:10:15:10 +0000] "GET /../../../../etc/passwd HTTP/1.1" 400 312 "-" "python-requests/2.28"
203.0.113.88 - - [27/Oct/2026:10:15:12 +0000] "GET /..%2f..%2f..%2fwindows/win.ini HTTP/1.1" 404 280 "-" "python-requests/2.28"
192.0.2.14 - - [27/Oct/2026:10:16:30 +0000] "GET /api/users?id=1%20UNION%20SELECT%20null,username,password%20FROM%20users HTTP/1.1" 500 520 "-" "sqlmap/1.7"
192.0.2.14 - - [27/Oct/2026:10:16:32 +0000] "GET /api/users?id=1'%20OR%20'1'='1 HTTP/1.1" 200 8910 "-" "sqlmap/1.7"
198.51.100.190 - - [27/Oct/2026:10:17:00 +0000] "GET /.env HTTP/1.1" 404 180 "-" "DirBuster/1.0"
198.51.100.190 - - [27/Oct/2026:10:17:01 +0000] "GET /config.php.bak HTTP/1.1" 404 180 "-" "DirBuster/1.0"
198.51.100.190 - - [27/Oct/2026:10:17:02 +0000] "GET /.git/HEAD HTTP/1.1" 404 180 "-" "DirBuster/1.0"
198.51.100.42 - - [27/Oct/2026:10:18:20 +0000] "GET /dashboard HTTP/1.1" 200 7412 "-" "Mozilla/5.0"`,
    cleanTraffic: `198.51.100.10 - - [27/Oct/2026:09:00:01 +0000] "GET / HTTP/1.1" 200 4820 "-" "Mozilla/5.0"
198.51.100.10 - - [27/Oct/2026:09:00:03 +0000] "GET /assets/style.css HTTP/1.1" 304 0 "-" "Mozilla/5.0"
198.51.100.10 - - [27/Oct/2026:09:00:04 +0000] "GET /assets/app.js HTTP/1.1" 304 0 "-" "Mozilla/5.0"
198.51.100.12 - - [27/Oct/2026:09:01:15 +0000] "GET /products HTTP/1.1" 200 12040 "-" "Mozilla/5.0"
198.51.100.12 - - [27/Oct/2026:09:01:25 +0000] "GET /cart HTTP/1.1" 200 3410 "-" "Mozilla/5.0"`,
  };

  const [rawLogs, setRawLogs] = useState(sampleLogs.webAttacks);
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'SUSPICIOUS' | 'MALICIOUS' | 'CLEAN'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Parse logs
  const parseLogs = (text: string): ParsedLogLine[] => {
    const lines = text.split('\n').filter((l) => l.trim().length > 0);
    return lines.map((line, idx) => {
      // Regex for Combined Log Format
      const match = line.match(/^(\S+) \S+ \S+ \[(.*?)\] "(.*?) (.*?) (.*?)" (\d+) (\d+)/);
      const ip = match ? match[1] : (line.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/)?.[0] || 'Unknown IP');
      const timestamp = match ? match[2] : 'Unknown Time';
      const method = match ? match[3] : 'GET';
      const path = match ? match[4] : line;
      const statusCode = match ? parseInt(match[6], 10) : 200;

      // Detect Threats
      let threatLevel: 'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS' = 'CLEAN';
      let threatReason: string | undefined = undefined;

      const pathLower = path.toLowerCase();
      const rawLower = line.toLowerCase();

      if (
        pathLower.includes('..') ||
        pathLower.includes('%2e%2e') ||
        pathLower.includes('/etc/passwd') ||
        pathLower.includes('windows/win.ini')
      ) {
        threatLevel = 'MALICIOUS';
        threatReason = 'Path Traversal / Local File Inclusion (LFI)';
      } else if (
        pathLower.includes('union') ||
        pathLower.includes('select') ||
        pathLower.includes("1'='1") ||
        pathLower.includes('sleep(') ||
        rawLower.includes('sqlmap')
      ) {
        threatLevel = 'MALICIOUS';
        threatReason = 'SQL Injection (SQLi) attempt detected';
      } else if (
        pathLower.includes('.env') ||
        pathLower.includes('.git') ||
        pathLower.includes('wp-admin') ||
        rawLower.includes('dirbuster') ||
        rawLower.includes('nikto')
      ) {
        threatLevel = 'SUSPICIOUS';
        threatReason = 'Automated directory reconnaissance / Sensitive file probe';
      } else if (statusCode === 401 || statusCode === 403) {
        threatLevel = 'SUSPICIOUS';
        threatReason = 'Unauthorized or forbidden resource probe';
      }

      return {
        id: `log-${idx}`,
        raw: line,
        ip,
        timestamp,
        method,
        path,
        statusCode,
        threatLevel,
        threatReason,
      };
    });
  };

  const parsed = parseLogs(rawLogs);

  // Compute metrics
  const maliciousCount = parsed.filter((p) => p.threatLevel === 'MALICIOUS').length;
  const suspiciousCount = parsed.filter((p) => p.threatLevel === 'SUSPICIOUS').length;
  const cleanCount = parsed.filter((p) => p.threatLevel === 'CLEAN').length;

  const filtered = parsed.filter((p) => {
    if (filterSeverity !== 'ALL' && p.threatLevel !== filterSeverity) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        p.ip.toLowerCase().includes(term) ||
        p.path.toLowerCase().includes(term) ||
        (p.threatReason && p.threatReason.toLowerCase().includes(term))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-teal-400" />
            Web &amp; Server Log Threat Analyzer
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Identify directory traversal, SQL injection probes, sensitive credential leaks, and automated reconnaissance scanners.
          </p>
        </div>

        {/* Log Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setRawLogs(sampleLogs.webAttacks)}
            className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-teal-300 hover:border-teal-500/50 transition-colors cursor-pointer"
          >
            Load Attack Logs Sample
          </button>
          <button
            onClick={() => setRawLogs(sampleLogs.cleanTraffic)}
            className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-teal-300 hover:border-teal-500/50 transition-colors cursor-pointer"
          >
            Load Clean Logs Sample
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/70">
          <div className="text-[10px] text-zinc-500 uppercase font-semibold">Total Requests</div>
          <div className="text-2xl font-black text-white mt-1 font-mono">{parsed.length}</div>
        </div>

        <div className="p-3.5 rounded-xl border border-rose-900/60 bg-rose-950/20">
          <div className="text-[10px] text-rose-400 uppercase font-semibold">Malicious Requests</div>
          <div className="text-2xl font-black text-rose-400 mt-1 font-mono">{maliciousCount}</div>
        </div>

        <div className="p-3.5 rounded-xl border border-amber-900/60 bg-amber-950/20">
          <div className="text-[10px] text-amber-400 uppercase font-semibold">Suspicious Activity</div>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">{suspiciousCount}</div>
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-900/60 bg-emerald-950/20">
          <div className="text-[10px] text-emerald-400 uppercase font-semibold">Clean Requests</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{cleanCount}</div>
        </div>
      </div>

      {/* Editor & Raw Input */}
      <div className="p-4 rounded-xl border border-teal-500/30 bg-zinc-950/90 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-bold uppercase">Log Stream Input (Apache / Nginx Combined)</span>
          <button
            onClick={() => setRawLogs('')}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>

        <textarea
          value={rawLogs}
          onChange={(e) => setRawLogs(e.target.value)}
          rows={5}
          placeholder="Paste server access or auth logs here..."
          className="w-full bg-black border border-zinc-800 focus:border-teal-400 text-teal-300 p-3 rounded-lg text-xs font-mono focus:outline-none resize-y"
        />
      </div>

      {/* Log Findings Table */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Event Log Inspector</span>
            <span className="text-xs text-zinc-500 font-mono">({filtered.length} entries)</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by IP or URL..."
                className="bg-black border border-zinc-700 text-zinc-300 pl-8 pr-3 py-1 rounded text-xs font-mono focus:outline-none focus:border-teal-400 w-44"
              />
            </div>

            <div className="flex items-center gap-1 text-[11px] font-mono">
              {(['ALL', 'MALICIOUS', 'SUSPICIOUS', 'CLEAN'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    filterSeverity === sev
                      ? 'bg-teal-500 text-black font-bold'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="space-y-2 font-mono text-xs max-h-96 overflow-y-auto pr-1">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                item.threatLevel === 'MALICIOUS'
                  ? 'border-rose-950 bg-rose-950/20'
                  : item.threatLevel === 'SUSPICIOUS'
                  ? 'border-amber-950 bg-amber-950/20'
                  : 'border-zinc-800 bg-black'
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      item.threatLevel === 'MALICIOUS'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : item.threatLevel === 'SUSPICIOUS'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {item.threatLevel}
                  </span>
                  <span className="text-zinc-400 text-[11px]">{item.ip}</span>
                  <span className="text-zinc-500 text-[10px]">{item.timestamp}</span>
                </div>

                <div className="text-white break-all flex items-center gap-2">
                  <span className="font-bold text-teal-400">{item.method}</span>
                  <span>{item.path}</span>
                </div>

                {item.threatReason && (
                  <div className="text-[10px] text-rose-300 flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                    <span>{item.threatReason}</span>
                  </div>
                )}
              </div>

              <div className="shrink-0 text-right">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    item.statusCode >= 500
                      ? 'text-rose-400'
                      : item.statusCode >= 400
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  HTTP {item.statusCode}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
