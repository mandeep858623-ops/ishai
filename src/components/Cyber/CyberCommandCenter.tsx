import React from 'react';
import {
  ShieldAlert,
  Terminal,
  Globe,
  KeyRound,
  FileCode2,
  Search,
  BookOpen,
  Award,
  Layers,
  Activity,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ArrowRight,
  Fingerprint,
} from 'lucide-react';
import { CyberModule, SecurityFinding, SecurityProject } from './types';

interface CyberCommandCenterProps {
  onNavigate: (module: CyberModule) => void;
  projects: SecurityProject[];
  solvedChallengesCount: number;
  completedLessonsCount: number;
}

export const CyberCommandCenter: React.FC<CyberCommandCenterProps> = ({
  onNavigate,
  projects,
  solvedChallengesCount,
  completedLessonsCount,
}) => {
  // Compute total findings
  const allFindings = projects.flatMap((p) => p.findings);
  const criticalCount = allFindings.filter((f) => f.severity === 'CRITICAL').length;
  const highCount = allFindings.filter((f) => f.severity === 'HIGH').length;

  return (
    <div className="space-y-6">
      {/* Top Banner: Defcon & Global Cyber Posture */}
      <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-zinc-950/80 to-cyan-950/40 p-5 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 h-full w-96 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_70%)] pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Operational Status: Ready
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                DEFCON 2 • ELEVATED POSTURE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-emerald-400" />
              SUPERAI ETHICAL HACKER
            </h1>
            <p className="text-xs text-zinc-400 max-w-2xl mt-1">
              Authorized cybersecurity command workstation. Conduct passive intelligence, non-destructive web security audits, code vulnerability reviews, sandboxed terminal experiments, and hands-on CTF simulations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('WEB_SCANNER')}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-black" />
              Quick Audit
            </button>
            <button
              onClick={() => onNavigate('HACKER_TERMINAL')}
              className="px-4 py-2 bg-zinc-900 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              Launch CLI
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/70">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Active Assessments</div>
          <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-2">
            {projects.length}
            <span className="text-xs text-emerald-400 font-normal">Active scopes</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/70">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Security Findings</div>
          <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-2">
            {allFindings.length}
            <span className="text-xs text-rose-400 font-normal">
              {criticalCount} crit / {highCount} high
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/70">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Academy Progress</div>
          <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-2">
            {completedLessonsCount}
            <span className="text-xs text-cyan-400 font-normal">modules completed</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/70">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">CTF Challenge Score</div>
          <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-2">
            {solvedChallengesCount * 100}
            <span className="text-xs text-amber-400 font-normal">{solvedChallengesCount} flags captured</span>
          </div>
        </div>
      </div>

      {/* Quick Launch Grid */}
      <div>
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          Primary Operational Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[
            {
              id: 'IP_INTELLIGENCE' as CyberModule,
              title: 'IP & DNS Intelligence',
              icon: Globe,
              color: 'text-emerald-400',
              bgColor: 'bg-emerald-500/10',
              borderColor: 'hover:border-emerald-500/60',
              desc: 'Resolve real A/AAAA/MX/TXT records, verify ASN info, calculate CIDR masks, and test latency.',
            },
            {
              id: 'WEB_SCANNER' as CyberModule,
              title: 'Website Security Scanner',
              icon: ShieldAlert,
              color: 'text-cyan-400',
              bgColor: 'bg-cyan-500/10',
              borderColor: 'hover:border-cyan-500/60',
              desc: 'Audit HTTP response headers (CSP, HSTS, X-Frame, Cookies), compute A-F grades, and get fixes.',
            },
            {
              id: 'HACKER_TERMINAL' as CyberModule,
              title: 'AI Hacker Terminal',
              icon: Terminal,
              color: 'text-emerald-400',
              bgColor: 'bg-emerald-500/10',
              borderColor: 'hover:border-emerald-500/60',
              desc: 'Sandboxed CLI emulator with 20+ commands (dig, ping, hash, decode, whois, nmap simulation).',
            },
            {
              id: 'CODE_AUDITOR' as CyberModule,
              title: 'Security Code Auditor',
              icon: FileCode2,
              color: 'text-violet-400',
              bgColor: 'bg-violet-500/10',
              borderColor: 'hover:border-violet-500/60',
              desc: 'AI-powered static source analysis. Detect injection, auth flaws, IDOR, and generate secure patches.',
            },
            {
              id: 'PASSWORD_LAB' as CyberModule,
              title: 'Password Security Lab',
              icon: KeyRound,
              color: 'text-amber-400',
              bgColor: 'bg-amber-500/10',
              borderColor: 'hover:border-amber-500/60',
              desc: 'Shannon entropy calculator, brute-force cracking estimates, secure Diceware generator, and 2FA TOTP.',
            },
            {
              id: 'DIGITAL_FORENSICS' as CyberModule,
              title: 'Digital Forensics Workbench',
              icon: Fingerprint,
              color: 'text-blue-400',
              bgColor: 'bg-blue-500/10',
              borderColor: 'hover:border-blue-500/60',
              desc: 'Client-side file integrity hashing (SHA-256, SHA-1, MD5), metadata inspect, and timeline builder.',
            },
            {
              id: 'HACKER_ACADEMY' as CyberModule,
              title: 'Hacker Academy & OWASP',
              icon: BookOpen,
              color: 'text-pink-400',
              bgColor: 'bg-pink-500/10',
              borderColor: 'hover:border-pink-500/60',
              desc: '3-tier curriculum from Linux fundamentals to web vulnerabilities, with interactive quizzes and badges.',
            },
            {
              id: 'LOG_ANALYZER' as CyberModule,
              title: 'Log Analyzer & IR',
              icon: FileSpreadsheet,
              color: 'text-teal-400',
              bgColor: 'bg-teal-500/10',
              borderColor: 'hover:border-teal-500/60',
              desc: 'Parse Apache/Nginx web logs and auth logs. Detect SQLi, path traversal, and brute-force bursts.',
            },
            {
              id: 'PHISHING_MALWARE' as CyberModule,
              title: 'Phishing & Threat Intelligence',
              icon: AlertTriangle,
              color: 'text-orange-400',
              bgColor: 'bg-orange-500/10',
              borderColor: 'hover:border-orange-500/60',
              desc: 'Email header validator (SPF/DKIM/DMARC), URL defanger, YARA builder, and MITRE ATT&CK explorer.',
            },
            {
              id: 'CHALLENGE_ARENA' as CyberModule,
              title: 'Cyber Challenge Arena (CTF)',
              icon: Award,
              color: 'text-yellow-400',
              bgColor: 'bg-yellow-500/10',
              borderColor: 'hover:border-yellow-500/60',
              desc: 'Hands-on Capture The Flag puzzles in cryptography, web exploitation concepts, and forensic analysis.',
            },
            {
              id: 'SECURITY_PROJECTS' as CyberModule,
              title: 'My Security Projects & Reports',
              icon: Layers,
              color: 'text-indigo-400',
              bgColor: 'bg-indigo-500/10',
              borderColor: 'hover:border-indigo-500/60',
              desc: 'Manage authorized penetration testing scopes, track findings, and export professional PDF/MD reports.',
            },
          ].map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                onClick={() => onNavigate(mod.id)}
                className={`group p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 transition-all cursor-pointer flex flex-col justify-between ${mod.borderColor} hover:bg-zinc-900/90 hover:shadow-lg`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className={`p-2 rounded-lg ${mod.bgColor} ${mod.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>Enter Module</span>
                  <span className="font-mono text-emerald-400/80">[ACTIVE]</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ethical Rules of Engagement Notice */}
      <div className="p-3.5 rounded-xl border border-emerald-950 bg-emerald-950/20 text-xs text-zinc-400 flex items-start gap-3">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
        <div className="space-y-0.5">
          <span className="font-bold text-emerald-300">SUPERAI Ethical Code of Conduct:</span>
          <p className="text-zinc-400 text-[11px]">
            All testing must strictly occur on systems you own or have explicit, documented authorization to assess. Passive reconnaissance tools perform non-intrusive DNS and public header verification. Do not attempt unapproved penetration testing.
          </p>
        </div>
      </div>
    </div>
  );
};
