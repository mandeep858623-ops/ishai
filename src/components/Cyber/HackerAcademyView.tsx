import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Award,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { AcademyLesson } from './types';

interface HackerAcademyProps {
  completedLessons: string[];
  onLessonComplete: (lessonId: string) => void;
}

export const HackerAcademyView: React.FC<HackerAcademyProps> = ({
  completedLessons,
  onLessonComplete,
}) => {
  const lessons: AcademyLesson[] = [
    {
      id: 'lesson-1',
      category: 'BEGINNER',
      title: 'Linux Foundations & Terminal Mastery',
      duration: '15 mins',
      description: 'Understanding Linux file hierarchies, permissions (rwx/octal), process management, and piping.',
      content: `### 1. The Linux Philosophy
In Linux, almost everything is treated as a file (including hardware devices under /dev and kernel states under /proc).
- **/etc**: System-wide configuration files (e.g., passwd, shadow, hosts).
- **/var/log**: Critical diagnostic log directory (auth.log, syslog, nginx logs).
- **/tmp**: Temporary storage directory with sticky bit permissions (1777).

### 2. Permissions Architecture
Permissions are categorized into three scopes: User (u), Group (g), Others (o).
- Read (r = 4), Write (w = 2), Execute (x = 1).
- Example: \`chmod 755 script.sh\` gives rwx (7) to owner, and rx (5) to group and others.
- **SUID (SetUID)**: When a binary with SUID bit (chmod u+s) executes, it runs with the privileges of the file owner (often root). Misconfigured SUID binaries are a primary vector in local privilege escalation.`,
      quiz: [
        {
          question: 'What numerical permission grants Read and Write to Owner, and Read-only to Group and Others?',
          options: ['755', '644', '777', '600'],
          correctIndex: 1,
          explanation: 'Owner: 4 (read) + 2 (write) = 6. Group: 4 (read). Others: 4 (read). Hence 644.',
        },
        {
          question: 'Which directory traditionally holds server authentication and security event logs on Debian/Ubuntu systems?',
          options: ['/tmp', '/etc/security', '/var/log/auth.log', '/usr/bin'],
          correctIndex: 2,
          explanation: '/var/log/auth.log stores authorization logs, failed SSH logins, and sudo attempts.',
        },
      ],
    },
    {
      id: 'lesson-2',
      category: 'BEGINNER',
      title: 'TCP/IP, OSI Model & DNS Lifecycle',
      duration: '20 mins',
      description: 'Network communication layers, 3-way handshakes, and recursive DNS resolution mechanics.',
      content: `### 1. The 7-Layer OSI Model vs 4-Layer TCP/IP
Understanding where security controls operate is critical:
- **Layer 7 (Application)**: HTTP, DNS, SSH, TLS.
- **Layer 4 (Transport)**: TCP (reliable, connection-oriented) and UDP (stateless, datagrams).
- **Layer 3 (Network)**: IP routing, ICMP packets.
- **Layer 2 (Data Link)**: Ethernet frames, MAC addresses, ARP protocol.

### 2. The TCP 3-Way Handshake
1. Client sends **SYN** (Synchronize sequence number).
2. Server responds with **SYN-ACK** (Acknowledge and synchronize).
3. Client returns **ACK** (Acknowledge). The socket is now ESTABLISHED.
*Security Note*: SYN Flood attacks exploit this by sending high volumes of SYN requests without completing the handshake to exhaust server connection backlogs.`,
      quiz: [
        {
          question: 'What is the correct sequence of the TCP connection handshake?',
          options: ['ACK -> SYN -> SYN-ACK', 'SYN -> SYN-ACK -> ACK', 'SYN -> ACK -> FIN', 'FIN -> ACK -> RST'],
          correctIndex: 1,
          explanation: 'The standard TCP handshake sequence is SYN, followed by SYN-ACK from the recipient, concluded by ACK from the initiator.',
        },
      ],
    },
    {
      id: 'lesson-3',
      category: 'INTERMEDIATE',
      title: 'OWASP Top 10 Web Vulnerabilities',
      duration: '25 mins',
      description: 'In-depth analysis of Injection, Broken Access Control, IDOR, and Cross-Site Scripting (XSS).',
      content: `### 1. Broken Access Control (OWASP #1)
Broken access control occurs when users can access resources or execute actions outside their intended permissions.
- **IDOR (Insecure Direct Object Reference)**: When an application exposes a database key in an API without ownership validation (e.g. \`GET /api/documents/812\` without verifying the requesting user owns document 812).
- **Defensive Rule**: Always validate authorization on the server side using the authenticated session context, never client-supplied IDs alone.

### 2. Injection (SQLi & Command Injection)
Injection occurs when untrusted user input is directly concatenated into an interpreter command.
- **Defensive Fix**: Always utilize parameterized queries (Prepared Statements) or ORMs with parameterized bindings. Never string-interpolate query input.`,
      quiz: [
        {
          question: 'What is the most effective primary defense against SQL Injection attacks?',
          options: [
            'Client-side HTML input validation',
            'Parameterized queries (Prepared Statements)',
            'Storing passwords with MD5 hashing',
            'Disabling HTTPS',
          ],
          correctIndex: 1,
          explanation: 'Prepared statements treat user input strictly as parameters, preventing the database engine from executing input as SQL code.',
        },
      ],
    },
    {
      id: 'lesson-4',
      category: 'INTERMEDIATE',
      title: 'Applied Cryptography & Modern Hashing',
      duration: '20 mins',
      description: 'Symmetric encryption (AES-GCM), asymmetric cryptography (RSA/ECC), and salted password hashing (Argon2/bcrypt).',
      content: `### 1. Encryption vs Hashing vs Encoding
- **Encoding (e.g., Base64, Hex)**: Reversible representation of binary data without a secret key. NOT security.
- **Hashing (e.g., SHA-256, Argon2id)**: One-way cryptographic digest. Fast hashing (SHA-256) is used for data integrity. Slow, salted, memory-hard hashing (Argon2id, bcrypt, PBKDF2) is required for password storage to resist GPU cracking.
- **Encryption (e.g., AES-256-GCM)**: Two-way confidentiality mechanism requiring cryptographic keys. Authenticated Encryption with Associated Data (AEAD) provides both privacy and integrity.`,
      quiz: [
        {
          question: 'Why should fast cryptographic hashes like SHA-256 never be used for password storage without slow key-stretching?',
          options: [
            'They are reversible without a key',
            'GPUs can calculate billions of SHA-256 guesses per second, enabling rapid offline brute-force',
            'SHA-256 is only 16 bits long',
            'They do not work on web servers',
          ],
          correctIndex: 1,
          explanation: 'Modern GPU clusters calculate billions of SHA-256 hashes per second. Password storage requires slow, memory-hard algorithms like Argon2id or bcrypt.',
        },
      ],
    },
    {
      id: 'lesson-5',
      category: 'ADVANCED',
      title: 'Zero Trust Architecture & API Security',
      duration: '30 mins',
      description: 'Never trust, always verify: Microsegmentation, continuous authentication, and securing REST/GraphQL endpoints.',
      content: `### 1. The Core Tenet of Zero Trust (NIST SP 800-207)
Traditional perimeter security assumes everything inside the corporate network is trustworthy ("Castle and Moat").
Zero Trust assumes the network is hostile and compromised from the start:
1. **Verify Explicitly**: Authenticate and authorize based on all available data points (identity, device health, location).
2. **Use Least Privilege Access**: Grant minimal necessary permissions using Just-in-Time (JIT) and Just-Enough-Access (JEA).
3. **Assume Breach**: Minimize blast radius through microsegmentation and end-to-end encryption.`,
      quiz: [
        {
          question: 'What fundamental assumption distinguishes Zero Trust from traditional perimeter security?',
          options: [
            'Internal network traffic is presumed trusted',
            'Perimeter firewalls eliminate internal risks',
            'The network is assumed hostile, requiring continuous authentication for every request',
            'Passwords should never expire',
          ],
          correctIndex: 2,
          explanation: 'Zero Trust operates under the principle of "Assume Breach", verifying every user, device, and API request explicitly.',
        },
      ],
    },
  ];

  const [activeLessonId, setActiveLessonId] = useState<string>('lesson-1');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});

  const activeLesson = lessons.find((l) => l.id === activeLessonId) || lessons[0];

  const handleSelectAnswer = (qIdx: number, optIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [`${activeLesson.id}-${qIdx}`]: optIdx,
    }));
  };

  const handleGradeQuiz = () => {
    setQuizSubmitted((prev) => ({
      ...prev,
      [activeLesson.id]: true,
    }));

    // Check if all correct
    const allCorrect = activeLesson.quiz.every(
      (q, idx) => selectedAnswers[`${activeLesson.id}-${idx}`] === q.correctIndex
    );

    if (allCorrect) {
      onLessonComplete(activeLesson.id);
    }
  };

  // Badges calculation
  const badges = [
    { id: 'b-1', name: 'Terminal Novice', required: 'lesson-1', desc: 'Completed Linux foundations' },
    { id: 'b-2', name: 'Network Navigator', required: 'lesson-2', desc: 'Mastered TCP/IP and DNS' },
    { id: 'b-3', name: 'OWASP Defender', required: 'lesson-3', desc: 'Conquered web application vulnerabilities' },
    { id: 'b-4', name: 'Cipher Guardian', required: 'lesson-4', desc: 'Applied cryptography mastery' },
    { id: 'b-5', name: 'Zero Trust Architect', required: 'lesson-5', desc: 'Enterprise defense certified' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-pink-400" />
            Hacker Academy &amp; Cyber Defense Curriculum
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Structured defensive training modules from Linux fundamentals to Zero Trust architecture, with interactive graded quizzes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-mono">
            Mastery: <strong className="text-pink-400">{completedLessons.length}/{lessons.length}</strong> modules
          </span>
        </div>
      </div>

      {/* Earned Badges Strip */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-black/60">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-yellow-400" />
          Achievement Badges
        </h3>
        <div className="flex items-center gap-3 flex-wrap">
          {badges.map((b) => {
            const unlocked = completedLessons.includes(b.required);
            return (
              <div
                key={b.id}
                className={`p-2.5 rounded-lg border text-xs flex items-center gap-2.5 transition-all ${
                  unlocked
                    ? 'border-yellow-500/40 bg-yellow-950/20 text-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.1)]'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-600 opacity-60'
                }`}
                title={b.desc}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    unlocked ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-600'
                  }`}
                >
                  ★
                </div>
                <div>
                  <div className="font-bold">{b.name}</div>
                  <div className="text-[10px] text-zinc-500">{unlocked ? 'UNLOCKED' : 'LOCKED'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Study Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Lessons List */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Curriculum Roadmap</h3>
          {lessons.map((lesson) => {
            const isCompleted = completedLessons.includes(lesson.id);
            const isSelected = activeLessonId === lesson.id;
            return (
              <div
                key={lesson.id}
                onClick={() => setActiveLessonId(lesson.id)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'border-pink-500/60 bg-pink-950/20 shadow-md'
                    : 'border-zinc-800 bg-zinc-950/80 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      lesson.category === 'BEGINNER'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-900'
                        : lesson.category === 'INTERMEDIATE'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-900'
                        : 'bg-violet-950 text-violet-300 border border-violet-900'
                    }`}
                  >
                    {lesson.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-zinc-500 text-[10px]">
                    <span>{lesson.duration}</span>
                    {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                </div>
                <h4 className="font-bold text-white mt-1">{lesson.title}</h4>
                <p className="text-zinc-400 text-[11px] mt-0.5 line-clamp-2">{lesson.description}</p>
              </div>
            );
          })}
        </div>

        {/* Right: Active Lesson Content & Interactive Quiz */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lesson Content Viewer */}
          <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-950/90 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
              <div>
                <span className="text-[10px] text-pink-400 font-bold uppercase tracking-wider">
                  Module: {activeLesson.category}
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">{activeLesson.title}</h3>
              </div>
              {completedLessons.includes(activeLesson.id) && (
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Completed
                </span>
              )}
            </div>

            <div className="prose prose-invert max-w-none text-xs text-zinc-300 leading-relaxed space-y-3 whitespace-pre-wrap font-sans">
              {activeLesson.content}
            </div>
          </div>

          {/* Lesson Quiz */}
          <div className="p-5 rounded-xl border border-pink-500/30 bg-zinc-950/90 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-pink-400" />
                <h4 className="text-sm font-bold text-white">Knowledge Check Quiz</h4>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">
                {activeLesson.quiz.length} Questions
              </span>
            </div>

            <div className="space-y-4">
              {activeLesson.quiz.map((q, qIdx) => {
                const answerKey = `${activeLesson.id}-${qIdx}`;
                const chosen = selectedAnswers[answerKey];
                const submitted = quizSubmitted[activeLesson.id];
                const isCorrect = chosen === q.correctIndex;

                return (
                  <div key={qIdx} className="space-y-2 p-3.5 rounded-lg bg-black border border-zinc-800 text-xs">
                    <div className="font-bold text-white">
                      {qIdx + 1}. {q.question}
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {q.options.map((opt, optIdx) => {
                        const isThisChosen = chosen === optIdx;
                        let optionStyle = 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700';

                        if (submitted) {
                          if (optIdx === q.correctIndex) {
                            optionStyle = 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-bold';
                          } else if (isThisChosen && !isCorrect) {
                            optionStyle = 'border-rose-500 bg-rose-950/40 text-rose-300 line-through';
                          }
                        } else if (isThisChosen) {
                          optionStyle = 'border-pink-500 bg-pink-950/40 text-pink-300 font-bold';
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => !submitted && handleSelectAnswer(qIdx, optIdx)}
                            disabled={submitted}
                            className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors cursor-pointer flex items-center justify-between ${optionStyle}`}
                          >
                            <span>{opt}</span>
                            {submitted && optIdx === q.correctIndex && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {submitted && (
                      <div className="mt-2 p-2 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
                        <strong className="text-white">Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleGradeQuiz}
                className="px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-xs rounded-lg transition-all shadow-[0_0_15px_rgba(236,72,153,0.3)] cursor-pointer"
              >
                Submit Answers &amp; Verify Mastery
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
