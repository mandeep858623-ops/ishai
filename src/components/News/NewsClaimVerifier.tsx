import React, { useState } from 'react';
import { ShieldCheck, Search, AlertTriangle, CheckCircle, HelpCircle, XCircle, ExternalLink, Sparkles } from 'lucide-react';
import { ClaimVerificationResult } from './NewsTypes';
import { NewsAIService } from './NewsAIService';

interface NewsClaimVerifierProps {
  initialClaim?: string;
  articleContext?: string;
  onClose?: () => void;
  onSelectArticle?: (article: any) => void;
}

export const NewsClaimVerifier: React.FC<NewsClaimVerifierProps> = ({
  initialClaim = '',
  articleContext = '',
  onClose,
}) => {
  const [statement, setStatement] = useState(initialClaim);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<ClaimVerificationResult | null>(null);

  const sampleClaims = [
    'India has surpassed $4 trillion in GDP in 2026',
    'OpenAI released GPT-5 with autonomous agent architecture',
    'ISRO launched its Gaganyaan crewed space capsule test',
    'RBI announced interest rate cuts in the latest policy review',
  ];

  const handleRunVerify = async (claimToRun?: string) => {
    const target = (claimToRun || statement).trim();
    if (!target || verifying) return;

    setVerifying(true);
    setResult(null);

    const data = await NewsAIService.verifyClaim(target, articleContext);
    setResult(data);
    setVerifying(false);
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'supported':
        return (
          <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            SUPPORTED BY VERIFIED REPORTING
          </span>
        );
      case 'contradicted':
        return (
          <span className="bg-rose-950 text-rose-300 border border-rose-700 px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-rose-400" />
            CONTRADICTED BY EVIDENCE
          </span>
        );
      case 'mixed':
        return (
          <span className="bg-amber-950 text-amber-300 border border-amber-700 px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            MIXED / QUALIFIED EVIDENCE
          </span>
        );
      default:
        return (
          <span className="bg-zinc-900 text-zinc-300 border border-zinc-700 px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-zinc-400" />
            INSUFFICIENT PRIMARY EVIDENCE
          </span>
        );
    }
  };

  return (
    <div className="bg-[#080b10] border border-amber-500/40 rounded-2xl p-4 sm:p-6 space-y-5 font-sans text-zinc-200 shadow-xl select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>VERIFY A CLAIM & FACT-CHECK ENGINE</span>
              <span className="text-[9px] font-mono uppercase bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full font-bold">
                EVIDENCE ANALYSIS
              </span>
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Cross-examine statements against verifiable news reporting & missing information
            </p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 text-xs">
            ✕ CLOSE
          </button>
        )}
      </div>

      {/* Input Box */}
      <div className="space-y-2">
        <label className="text-xs font-mono font-bold text-zinc-300 uppercase">
          Enter Claim or Statement to Cross-Examine:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRunVerify()}
            placeholder="e.g. India surpasses $4 Trillion GDP or tech startup raised funding..."
            className="flex-1 bg-black border border-zinc-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none font-mono"
          />
          <button
            onClick={() => handleRunVerify()}
            disabled={verifying || !statement.trim()}
            className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-black font-extrabold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{verifying ? 'VERIFYING...' : 'VERIFY CLAIM'}</span>
          </button>
        </div>

        {/* Quick Sample Claim Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] font-mono">
          <span className="text-zinc-500">Sample Claims:</span>
          {sampleClaims.map((claim) => (
            <button
              key={claim}
              onClick={() => {
                setStatement(claim);
                handleRunVerify(claim);
              }}
              className="bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-zinc-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              {claim}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Spinner */}
      {verifying && (
        <div className="py-12 text-center text-xs font-mono text-amber-400 space-y-3 bg-black/40 rounded-2xl border border-zinc-800">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Analyzing published news evidence & primary source disclosures...</p>
        </div>
      )}

      {/* Verification Results Panel */}
      {result && (
        <div className="bg-[#0b0f17] border border-zinc-800 rounded-2xl p-5 space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between gap-3 flex-wrap border-b border-zinc-800 pb-3">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase block">Analyzed Claim:</span>
              <p className="text-sm font-bold text-white italic">"{result.statement}"</p>
            </div>
            {getVerdictBadge(result.verdict)}
          </div>

          <div className="p-3.5 bg-black/60 border border-zinc-800 rounded-xl space-y-1 text-xs">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">Evidence Reasoning:</span>
            <p className="text-zinc-200 leading-relaxed">{result.summaryReasoning}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Supporting Evidence */}
            <div className="p-3.5 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-2">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Supporting Evidence:
              </span>
              {result.supportingEvidence.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-zinc-300">
                  {result.supportingEvidence.map((e, idx) => (
                    <li key={idx}>{e}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-500 italic">No direct supporting primary evidence indexed.</p>
              )}
            </div>

            {/* Conflicting Evidence */}
            <div className="p-3.5 bg-rose-950/20 border border-rose-800/40 rounded-xl space-y-2">
              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Conflicting or Qualified Points:
              </span>
              {result.conflictingEvidence.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-zinc-300">
                  {result.conflictingEvidence.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-500 italic">No direct contradicting evidence reported.</p>
              )}
            </div>
          </div>

          {/* Missing Information */}
          {result.missingInformation && result.missingInformation.length > 0 && (
            <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-1 text-xs">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">Missing Information Required for Full Verification:</span>
              <ul className="list-disc list-inside space-y-0.5 text-zinc-300">
                {result.missingInformation.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
