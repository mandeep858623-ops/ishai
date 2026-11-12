import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Terminal,
  Globe,
  KeyRound,
  FileCode2,
  BookOpen,
  Fingerprint,
  Award,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  X,
  Maximize2,
  Minimize2,
  Search,
  Activity,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { soundEngine } from '../../utils/audio';
import { CyberModule, SecurityProject } from './types';
import { CyberCommandCenter } from './CyberCommandCenter';
import { IpIntelligenceView } from './IpIntelligenceView';
import { WebSecurityScannerView } from './WebSecurityScannerView';
import { AiHackerTerminalView } from './AiHackerTerminalView';
import { PasswordSecurityLabView } from './PasswordSecurityLabView';
import { SecurityCodeAuditorView } from './SecurityCodeAuditorView';
import { DigitalForensicsView } from './DigitalForensicsView';
import { HackerAcademyView } from './HackerAcademyView';
import { LogAnalyzerView } from './LogAnalyzerView';
import { PhishingMalwareLabView } from './PhishingMalwareLabView';
import { CyberChallengeArenaView } from './CyberChallengeArenaView';
import { SecurityProjectsView } from './SecurityProjectsView';

interface CyberWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
}

const STORAGE_PROJECTS_KEY = 'SUPERAI_CYBER_PROJECTS';
const STORAGE_CTF_KEY = 'SUPERAI_CYBER_SOLVED_CTF';
const STORAGE_LESSONS_KEY = 'SUPERAI_CYBER_COMPLETED_LESSONS';

export const CyberWorkspaceModal: React.FC<CyberWorkspaceModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [activeModule, setActiveModule] = useState<CyberModule>('COMMAND_CENTER');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Persistent Projects State
  const [projects, setProjects] = useState<SecurityProject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROJECTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'proj-demo-1',
        title: 'Acme Cloud API Security Assessment',
        clientName: 'Acme Corp',
        status: 'IN_PROGRESS',
        startDate: '2026-10-27',
        inScope: ['api.acme.com', 'auth.acme.com'],
        outOfScope: ['billing.acme.com', 'production-db.internal'],
        rulesOfEngagement: 'Authorized non-destructive penetration test under mutual NDA.',
        findings: [
          {
            id: 'VULN-101',
            title: 'Missing Content-Security-Policy (CSP) Header',
            severity: 'MEDIUM',
            cwe: 'CWE-1021',
            status: 'OPEN',
            target: 'https://api.acme.com',
            description: 'No CSP configured on root domain, allowing inline script execution.',
            impact: 'Increased vulnerability to Cross-Site Scripting (XSS).',
            remediation: "Deploy Content-Security-Policy with strict nonces and default-src 'self'.",
            cvssScore: 5.4,
            createdAt: '2026-10-27',
          },
        ],
      },
    ];
  });

  // Persistent Solved CTF Challenges
  const [solvedChallenges, setSolvedChallenges] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CTF_KEY);
      return saved ? JSON.parse(saved) : ['ctf-1'];
    } catch {
      return ['ctf-1'];
    }
  });

  // Persistent Completed Academy Lessons
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LESSONS_KEY);
      return saved ? JSON.parse(saved) : ['lesson-1'];
    } catch {
      return ['lesson-1'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
    } catch {}
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CTF_KEY, JSON.stringify(solvedChallenges));
    } catch {}
  }, [solvedChallenges]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LESSONS_KEY, JSON.stringify(completedLessons));
    } catch {}
  }, [completedLessons]);

  if (!isOpen) return null;

  const handleModuleSwitch = (mod: CyberModule) => {
    soundEngine.playClick();
    setActiveModule(mod);
  };

  const handleSolveChallenge = (challengeId: string) => {
    soundEngine.playSuccess();
    setSolvedChallenges((prev) => (prev.includes(challengeId) ? prev : [...prev, challengeId]));
  };

  const handleCompleteLesson = (lessonId: string) => {
    soundEngine.playSuccess();
    setCompletedLessons((prev) => (prev.includes(lessonId) ? prev : [...prev, lessonId]));
  };

  const navItems = [
    { id: 'COMMAND_CENTER' as CyberModule, label: 'Command Center', icon: Activity, group: 'CORE' },
    { id: 'IP_INTELLIGENCE' as CyberModule, label: 'IP & DNS Intelligence', icon: Globe, group: 'RECON' },
    { id: 'WEB_SCANNER' as CyberModule, label: 'Website Security Scanner', icon: ShieldAlert, group: 'RECON' },
    { id: 'HACKER_TERMINAL' as CyberModule, label: 'AI Hacker Terminal', icon: Terminal, group: 'TOOLS' },
    { id: 'CODE_AUDITOR' as CyberModule, label: 'Security Code Auditor', icon: FileCode2, group: 'TOOLS' },
    { id: 'PASSWORD_LAB' as CyberModule, label: 'Password Security Lab', icon: KeyRound, group: 'TOOLS' },
    { id: 'DIGITAL_FORENSICS' as CyberModule, label: 'Digital Forensics', icon: Fingerprint, group: 'ANALYSIS' },
    { id: 'LOG_ANALYZER' as CyberModule, label: 'Log Threat Analyzer', icon: FileSpreadsheet, group: 'ANALYSIS' },
    { id: 'PHISHING_MALWARE' as CyberModule, label: 'Phishing & Malware Lab', icon: AlertTriangle, group: 'ANALYSIS' },
    { id: 'HACKER_ACADEMY' as CyberModule, label: 'Hacker Academy & OWASP', icon: BookOpen, group: 'ACADEMY' },
    { id: 'CHALLENGE_ARENA' as CyberModule, label: 'Challenge Arena (CTF)', icon: Award, group: 'ACADEMY' },
    { id: 'SECURITY_PROJECTS' as CyberModule, label: 'My Security Projects', icon: Layers, group: 'PROJECTS' },
  ];

  const filteredNav = navItems.filter((item) =>
    item.label.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
      <div
        className={`w-full bg-[#0a0a0c] border border-emerald-500/40 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col overflow-hidden transition-all duration-300 ${
          isFullScreen ? 'h-full max-h-screen rounded-none' : 'h-[92vh] max-w-7xl'
        }`}
      >
        {/* Top Header Bar */}
        <div className="z-10 bg-[#0c0d10] border-b border-zinc-800 px-4 py-3 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white tracking-wider text-sm flex items-center gap-1.5">
                  SUPERAI ETHICAL HACKER
                </span>
                <span className="hidden sm:inline-block px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-950 border border-emerald-800 text-emerald-400">
                  SEC-OPS LAB
                </span>
              </div>
              <div className="text-[10px] text-zinc-500">
                Ethical Cybersecurity &amp; Penetration Testing Workstation
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            >
              {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950/80 text-zinc-400 hover:text-rose-300 border border-zinc-800 hover:border-rose-800 transition-colors cursor-pointer"
              title="Close Workstation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workstation Workspace Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Collapsible Left Navigation Sidebar */}
          <div
            className={`bg-[#08090b] border-r border-zinc-900 flex flex-col justify-between transition-all duration-200 shrink-0 ${
              sidebarCollapsed ? 'w-16' : 'w-64'
            }`}
          >
            <div className="p-3 space-y-3">
              {/* Search filter in sidebar */}
              {!sidebarCollapsed && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={sidebarSearch}
                    onChange={(e) => setSidebarSearch(e.target.value)}
                    placeholder="Search modules..."
                    className="w-full bg-black border border-zinc-800 text-zinc-300 pl-8 pr-2.5 py-1.5 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              )}

              {/* Module Nav Links */}
              <div className="space-y-1 overflow-y-auto max-h-[calc(80vh-140px)] pr-0.5">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeModule === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleModuleSwitch(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                      }`}
                      title={item.label}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-zinc-900 text-[11px] text-zinc-500 font-mono flex items-center justify-between">
              {!sidebarCollapsed ? (
                <>
                  <span>CTF Flags: {solvedChallenges.length}</span>
                  <button
                    onClick={() => setSidebarCollapsed(true)}
                    className="text-zinc-500 hover:text-white"
                  >
                    «
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="w-full text-center text-zinc-400 hover:text-white py-1"
                >
                  »
                </button>
              )}
            </div>
          </div>

          {/* Right Main Content Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-950/40">
            {activeModule === 'COMMAND_CENTER' && (
              <CyberCommandCenter
                onNavigate={handleModuleSwitch}
                projects={projects}
                solvedChallengesCount={solvedChallenges.length}
                completedLessonsCount={completedLessons.length}
              />
            )}

            {activeModule === 'IP_INTELLIGENCE' && <IpIntelligenceView />}

            {activeModule === 'WEB_SCANNER' && <WebSecurityScannerView />}

            {activeModule === 'HACKER_TERMINAL' && <AiHackerTerminalView />}

            {activeModule === 'PASSWORD_LAB' && <PasswordSecurityLabView />}

            {activeModule === 'CODE_AUDITOR' && <SecurityCodeAuditorView />}

            {activeModule === 'DIGITAL_FORENSICS' && <DigitalForensicsView />}

            {activeModule === 'HACKER_ACADEMY' && (
              <HackerAcademyView
                completedLessons={completedLessons}
                onLessonComplete={handleCompleteLesson}
              />
            )}

            {activeModule === 'LOG_ANALYZER' && <LogAnalyzerView />}

            {activeModule === 'PHISHING_MALWARE' && <PhishingMalwareLabView />}

            {activeModule === 'CHALLENGE_ARENA' && (
              <CyberChallengeArenaView
                solvedChallenges={solvedChallenges}
                onSolveChallenge={handleSolveChallenge}
              />
            )}

            {activeModule === 'SECURITY_PROJECTS' && (
              <SecurityProjectsView
                projects={projects}
                onUpdateProjects={(updated) => setProjects(updated)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
