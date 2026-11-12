import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Code2,
  Copy,
  Check,
  ExternalLink,
  Info,
  Lock,
} from 'lucide-react';
import { WebSecurityScanResult } from './types';

export const WebSecurityScannerView: React.FC = () => {
  const [targetUrl, setTargetUrl] = useState('https://github.com');
  const [hasAuthorized, setHasAuthorized] = useState(true);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<WebSecurityScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeConfigTab, setActiveConfigTab] = useState<'nginx' | 'apache' | 'express' | 'nextjs'>('nginx');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const handleScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetUrl.trim()) return;
    if (!hasAuthorized) {
      setErrorMsg('Please confirm you have authorization to assess this domain.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/cyber/web-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl: targetUrl.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Security check failed');
      }
      setScanResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Audit failed');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-emerald-400 border-emerald-500 bg-emerald-950/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]';
      case 'B':
        return 'text-cyan-400 border-cyan-500 bg-cyan-950/40';
      case 'C':
        return 'text-amber-400 border-amber-500 bg-amber-950/40';
      case 'D':
      case 'F':
      default:
        return 'text-rose-400 border-rose-500 bg-rose-950/40';
    }
  };

  const copyConfig = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const remediationConfigs = {
    nginx: `# Recommended Nginx Security Headers (nginx.conf or sites-available)
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'none';" always;
server_tokens off;`,
    apache: `# Apache Configuration (.htaccess or httpd.conf)
<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
  Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; object-src 'none';"
</IfModule>
ServerSignature Off
ServerTokens Prod`,
    express: `// Node.js Express Security Middleware (Helmet.js or manual)
import helmet from 'helmet';

// Recommended production configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'sameorigin' },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);
app.disable('x-powered-by');`,
    nextjs: `// Next.js Config (next.config.js headers)
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'; object-src 'none';" },
        ],
      },
    ];
  },
};`,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            Website Security Scanner &amp; Header Auditor
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Non-destructive passive audit inspecting HTTP response headers, cookie flags, and transport security.
          </p>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['https://github.com', 'https://cloudflare.com', 'https://google.com'].map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setTargetUrl(preset);
              }}
              className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors cursor-pointer"
            >
              {preset.replace('https://', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Target input form */}
      <div className="p-4 rounded-xl border border-cyan-500/30 bg-zinc-950/90 shadow-xl space-y-3">
        <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Lock className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-black border border-zinc-700 focus:border-cyan-400 text-cyan-300 pl-9 pr-4 py-2.5 rounded-lg text-xs font-mono focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-lg transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <ShieldCheck className="w-4 h-4 fill-black" />
            {loading ? 'Auditing Headers...' : 'Run Security Audit'}
          </button>
        </form>

        {/* Authorization checkbox */}
        <div className="flex items-center gap-2 pt-1 text-xs text-zinc-400">
          <input
            type="checkbox"
            id="authCheck"
            checked={hasAuthorized}
            onChange={(e) => setHasAuthorized(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-700 bg-black text-cyan-500 focus:ring-0 cursor-pointer"
          />
          <label htmlFor="authCheck" className="cursor-pointer select-none text-[11px]">
            I affirm that I have permission or am conducting authorized passive inspection of this public URL.
          </label>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
            <Info className="w-4 h-4 text-rose-400 shrink-0" />
            {errorMsg}
          </div>
        )}
      </div>

      {/* Audit Results View */}
      {scanResult && (
        <div className="space-y-6">
          {/* Score & Summary Card */}
          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-950/90 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div
                className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center font-black ${getGradeColor(
                  scanResult.grade
                )}`}
              >
                <span className="text-3xl">{scanResult.grade}</span>
                <span className="text-[10px] tracking-wider uppercase font-normal">Grade</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{scanResult.url}</span>
                </h3>
                <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 font-mono">
                  <span>HTTP Status: <strong className="text-emerald-400">{scanResult.statusCode} {scanResult.statusText}</strong></span>
                  <span>•</span>
                  <span>Security Score: <strong className="text-cyan-300">{scanResult.score}/100</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-center sm:text-right">
              <div>
                <div className="text-xl font-bold text-emerald-400">
                  {scanResult.checks.filter((c) => c.present).length} / {scanResult.checks.length}
                </div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Headers Enforced</div>
              </div>
              <div className="w-px h-8 bg-zinc-800" />
              <div>
                <div className="text-xl font-bold text-rose-400">
                  {scanResult.checks.filter((c) => !c.present).length}
                </div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Missing Defenses</div>
              </div>
            </div>
          </div>

          {/* Detailed Security Header Checks */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-3">
            <h3 className="text-sm font-bold text-white mb-2">Header Inspection Findings</h3>
            <div className="space-y-2.5">
              {scanResult.checks.map((check) => (
                <div
                  key={check.id}
                  className={`p-3.5 rounded-lg border text-xs ${
                    check.present
                      ? 'border-emerald-950/80 bg-emerald-950/10'
                      : 'border-zinc-800 bg-zinc-900/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {check.present ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span className="font-bold text-white">{check.name}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          check.severity === 'HIGH'
                            ? 'bg-rose-950 border border-rose-800 text-rose-300'
                            : check.severity === 'MEDIUM'
                            ? 'bg-amber-950 border border-amber-800 text-amber-300'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {check.severity}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        check.present
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {check.present ? 'ENFORCED' : 'NOT DETECTED'}
                    </span>
                  </div>

                  <p className="text-zinc-400 text-[11px] mt-1.5">{check.description}</p>

                  {check.value && (
                    <div className="mt-2 p-2 rounded bg-black border border-zinc-800 font-mono text-[10px] text-zinc-300 break-all">
                      {check.value}
                    </div>
                  )}

                  {!check.present && (
                    <div className="mt-2 text-[10px] text-cyan-300 font-mono bg-cyan-950/30 border border-cyan-900/60 p-2 rounded">
                      <strong>Remediation:</strong> {check.recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Hardening & Remediation Generator */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">One-Click Server Hardening Configurations</h3>
              </div>

              <div className="flex items-center gap-1">
                {(['nginx', 'apache', 'express', 'nextjs'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveConfigTab(tab)}
                    className={`px-2.5 py-1 text-[11px] rounded uppercase font-mono font-bold transition-colors cursor-pointer ${
                      activeConfigTab === tab
                        ? 'bg-cyan-500 text-black'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative rounded-lg bg-black border border-zinc-800 p-3 font-mono text-xs text-zinc-300">
              <button
                onClick={() => copyConfig(remediationConfigs[activeConfigTab])}
                className="absolute top-2.5 right-2.5 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedSnippet ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedSnippet ? 'Copied' : 'Copy Snippet'}
              </button>
              <pre className="overflow-x-auto text-[11px] leading-relaxed pt-2">
                {remediationConfigs[activeConfigTab]}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
