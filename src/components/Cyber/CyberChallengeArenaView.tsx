import React, { useState } from 'react';
import {
  Award,
  Flag,
  HelpCircle,
  CheckCircle2,
  Lock,
  Unlock,
  Sparkles,
  Zap,
} from 'lucide-react';
import { CtfChallenge } from './types';

interface ChallengeArenaProps {
  solvedChallenges: string[];
  onSolveChallenge: (challengeId: string) => void;
}

export const CyberChallengeArenaView: React.FC<ChallengeArenaProps> = ({
  solvedChallenges,
  onSolveChallenge,
}) => {
  const challenges: CtfChallenge[] = [
    {
      id: 'ctf-1',
      category: 'Crypto',
      title: "Caesar's Cipher Transmission",
      points: 100,
      difficulty: 'Easy',
      description:
        'An intercepted encrypted transmission reads: "FHCRENV{ebg13_pvcure_oernxre}". Use the AI Hacker Terminal or cipher tools to decode this classic ROT13 text.',
      hint: 'Apply ROT13 or Caesar shift of 13 positions.',
      flagHash: '', // plainFlag check
      plainFlag: 'SUPERAI{rot13_cipher_breaker}',
      explanation: 'ROT13 rotates each letter by 13 positions in the Latin alphabet. F -> S, H -> U, C -> P, etc.',
    },
    {
      id: 'ctf-2',
      category: 'Web',
      title: 'Encoded Session Cookie',
      points: 100,
      difficulty: 'Easy',
      description:
        'A browser cookie named "auth_session" contains the base64 string: "U1VQRVJBSXtiYXNlNjRfc2Vzc2lvbl9kZWNvZGVkfQ==". Decode it to capture the flag.',
      hint: 'Use the base64 decode command in the Hacker Terminal or standard base64 decoding.',
      flagHash: '',
      plainFlag: 'SUPERAI{base64_session_decoded}',
      explanation: 'Base64 represents binary or ASCII strings using 64 printable characters, terminated by "=" padding.',
    },
    {
      id: 'ctf-3',
      category: 'Forensics',
      title: 'Magic Bytes Fingerprint',
      points: 150,
      difficulty: 'Medium',
      description:
        'A corrupted file begins with the 4-byte sequence: "89 50 4E 47". Identify the exact standard file extension (lowercase 3 letters) to build the flag: "SUPERAI{<extension>_file_header}".',
      hint: '89 50 4E 47 in hex represents the Portable Network Graphics image format.',
      flagHash: '',
      plainFlag: 'SUPERAI{png_file_header}',
      explanation: '0x89504E47 indicates a PNG file signature (magic number) according to RFC 2083.',
    },
    {
      id: 'ctf-4',
      category: 'Web',
      title: 'Robots Reconnaissance Leak',
      points: 150,
      difficulty: 'Medium',
      description:
        'When inspecting a web server, search engines check robots.txt. If a developer accidentally wrote "Disallow: /super_secret_portal/", what is the flag format: "SUPERAI{robots_disallow_portal}"?',
      hint: 'Type the exact string requested in the challenge description.',
      flagHash: '',
      plainFlag: 'SUPERAI{robots_disallow_portal}',
      explanation: 'robots.txt files are completely public. Storing hidden administrative URLs in Disallow directives exposes them to any passive crawler.',
    },
    {
      id: 'ctf-5',
      category: 'Web',
      title: 'SQL Tautology Authentication Bypass',
      points: 200,
      difficulty: 'Hard',
      description:
        'In vulnerable legacy SQL logic: "SELECT * FROM users WHERE user=\'$user\' AND pass=\'$pass\'", entering "admin\' OR \'1\'=\'1" forces the WHERE clause to evaluate to true. Enter the flag: "SUPERAI{sql_tautology_bypass}".',
      hint: 'Recall the classic SQL injection condition where 1=1 is always true.',
      flagHash: '',
      plainFlag: 'SUPERAI{sql_tautology_bypass}',
      explanation: 'Tautology injection injects a statement that is always true (OR 1=1), causing the database to authenticate the first user record without password verification.',
    },
  ];

  const [inputFlags, setInputFlags] = useState<Record<string, string>>({});
  const [activeHintId, setActiveHintId] = useState<string | null>(null);
  const [submissionFeedback, setSubmissionFeedback] = useState<Record<string, { success: boolean; msg: string }>>({});

  const totalPoints = challenges
    .filter((c) => solvedChallenges.includes(c.id))
    .reduce((sum, c) => sum + c.points, 0);

  const handleFlagSubmit = (challenge: CtfChallenge) => {
    const entered = (inputFlags[challenge.id] || '').trim();
    if (!entered) return;

    if (entered === challenge.plainFlag) {
      onSolveChallenge(challenge.id);
      setSubmissionFeedback((prev) => ({
        ...prev,
        [challenge.id]: { success: true, msg: 'Flag Captured! Points awarded.' },
      }));
    } else {
      setSubmissionFeedback((prev) => ({
        ...prev,
        [challenge.id]: { success: false, msg: 'Incorrect flag. Check formatting.' },
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Cyber Challenge Arena &amp; CTF Lab
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Capture The Flag interactive challenges in cryptography, web exploitation concepts, forensics, and passive recon.
          </p>
        </div>

        {/* Scorecard */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-black text-yellow-400 font-mono">{totalPoints}</div>
            <div className="text-[10px] text-zinc-500 uppercase font-semibold">Arena Points</div>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {solvedChallenges.length} / {challenges.length}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase font-semibold">Flags Captured</div>
          </div>
        </div>
      </div>

      {/* Challenges List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {challenges.map((challenge) => {
          const isSolved = solvedChallenges.includes(challenge.id);
          const feedback = submissionFeedback[challenge.id];

          return (
            <div
              key={challenge.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                isSolved
                  ? 'border-emerald-500/50 bg-emerald-950/15'
                  : 'border-zinc-800 bg-zinc-950/90 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">
                      {challenge.category}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        challenge.difficulty === 'Easy'
                          ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-900'
                          : challenge.difficulty === 'Medium'
                          ? 'text-amber-400 bg-amber-950/60 border border-amber-900'
                          : 'text-rose-400 bg-rose-950/60 border border-rose-900'
                      }`}
                    >
                      {challenge.difficulty}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold text-yellow-400">
                    +{challenge.points} PTS
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flag className={`w-4 h-4 ${isSolved ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  {challenge.title}
                </h3>

                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  {challenge.description}
                </p>

                {/* Hint toggle */}
                <div className="mt-3">
                  <button
                    onClick={() =>
                      setActiveHintId(activeHintId === challenge.id ? null : challenge.id)
                    }
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono cursor-pointer"
                  >
                    <HelpCircle className="w-3 h-3" />
                    {activeHintId === challenge.id ? 'Hide Hint' : 'View Hint'}
                  </button>

                  {activeHintId === challenge.id && (
                    <div className="mt-1.5 p-2 rounded bg-cyan-950/30 border border-cyan-900/60 text-[11px] text-cyan-300">
                      💡 {challenge.hint}
                    </div>
                  )}
                </div>
              </div>

              {/* Flag Input / Solved Banner */}
              <div className="mt-4 pt-3 border-t border-zinc-900">
                {isSolved ? (
                  <div className="space-y-1.5">
                    <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      FLAG CAPTURED: {challenge.plainFlag}
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      {challenge.explanation}
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleFlagSubmit(challenge);
                    }}
                    className="space-y-2"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputFlags[challenge.id] || ''}
                        onChange={(e) =>
                          setInputFlags((prev) => ({
                            ...prev,
                            [challenge.id]: e.target.value,
                          }))
                        }
                        placeholder="SUPERAI{flag_here}"
                        className="flex-1 bg-black border border-zinc-700 text-yellow-300 px-3 py-1.5 rounded text-xs font-mono focus:outline-none focus:border-yellow-400"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs rounded transition-all cursor-pointer whitespace-nowrap"
                      >
                        Submit Flag
                      </button>
                    </div>

                    {feedback && (
                      <div
                        className={`text-[10px] font-mono ${
                          feedback.success ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {feedback.msg}
                      </div>
                    )}
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
