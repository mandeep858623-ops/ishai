import React, { useState } from 'react';
import {
  FileCode2,
  Sparkles,
  AlertOctagon,
  CheckCircle2,
  ShieldAlert,
  Copy,
  Check,
  Code2,
  RotateCcw,
} from 'lucide-react';

interface AuditFinding {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  cwe?: string;
  owasp?: string;
  lineNumbers?: string;
  vulnerableCodeSnippet?: string;
  impact?: string;
  remediation?: string;
  secureCodeSnippet?: string;
}

interface AuditResult {
  summary: string;
  overallRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'CLEAN';
  score: number;
  findings: AuditFinding[];
  bestPractices: string[];
}

export const SecurityCodeAuditorView: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('typescript');
  const [codeSnippet, setCodeSnippet] = useState(`// Vulnerable Endpoint Sample
app.get('/api/user/search', async (req, res) => {
  const query = req.query.q;
  // Flaw 1: SQL Injection via unsanitized string interpolation
  const sql = "SELECT id, username, email FROM users WHERE username LIKE '%" + query + "%'";
  const results = await db.raw(sql);
  
  // Flaw 2: Reflected XSS if returned directly without encoding
  res.send("<div>Search results for: " + query + "</div>");
});`);

  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [rawOutput, setRawOutput] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pre-loaded Vulnerable Samples
  const samples = [
    {
      label: 'SQL Injection & XSS (Node.js)',
      lang: 'typescript',
      code: `app.get('/api/user/search', async (req, res) => {
  const query = req.query.q;
  // Flaw: Raw unparameterized SQL concatenation
  const sql = "SELECT id, username, email FROM users WHERE username LIKE '%" + query + "%'";
  const results = await db.raw(sql);
  res.send("<div>Search results for: " + query + "</div>");
});`,
    },
    {
      label: 'Path Traversal (File Read)',
      lang: 'javascript',
      code: `app.get('/download', (req, res) => {
  const fileName = req.query.file;
  // Flaw: Path traversal vulnerability (e.g. ../../etc/passwd)
  const filePath = path.join(__dirname, 'public/files', fileName);
  fs.readFile(filePath, (err, data) => {
    if (err) return res.status(404).send('Not found');
    res.send(data);
  });
});`,
    },
    {
      label: 'Hardcoded Secret & Weak Crypto',
      lang: 'python',
      code: `import hashlib
import jwt

# Flaw: Hardcoded production secret token in codebase
JWT_SECRET = "super_secret_admin_key_12345"

def hash_user_password(password):
    # Flaw: MD5 is cryptographically broken for passwords (no salt, rapid collision)
    return hashlib.md5(password.encode()).hexdigest()

def create_admin_token(user_id):
    return jwt.encode({"sub": user_id, "role": "admin"}, JWT_SECRET, algorithm="HS256")`,
    },
    {
      label: 'IDOR & Broken Authorization',
      lang: 'typescript',
      code: `app.post('/api/orders/:orderId/refund', async (req, res) => {
  const { orderId } = req.params;
  const { amount } = req.body;
  
  // Flaw: IDOR - Missing check that current authenticated user actually owns orderId
  const order = await db.orders.findById(orderId);
  if (!order) return res.status(404).send('Not found');
  
  await paymentGateway.refund(order.chargeId, amount);
  res.json({ success: true });
});`,
    },
  ];

  const handleRunAudit = async () => {
    if (!codeSnippet.trim()) return;
    setErrorMsg(null);
    setLoading(true);
    setAuditResult(null);
    setRawOutput(null);

    try {
      const res = await fetch('/api/cyber/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'audit_code',
          payload: { code: codeSnippet, language: selectedLanguage },
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Audit analysis failed');
      }

      if (data.result) {
        setAuditResult(data.result);
      } else if (data.raw) {
        setRawOutput(data.raw);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Audit failed');
    } finally {
      setLoading(false);
    }
  };

  const copySnippet = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'HIGH':
        return 'bg-orange-950 text-orange-300 border-orange-800';
      case 'MEDIUM':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      default:
        return 'bg-blue-950 text-blue-300 border-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-violet-400" />
            Security Code Auditor &amp; Static Vulnerability Review
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            AI-powered static application security testing (SAST). Identify CWE injection vectors, broken access control, and generate safe patches.
          </p>
        </div>

        {/* Sample selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {samples.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedLanguage(s.lang);
                setCodeSnippet(s.code);
              }}
              className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-violet-300 hover:border-violet-500/50 transition-colors cursor-pointer"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Editor & Controls */}
      <div className="p-4 rounded-xl border border-violet-500/30 bg-zinc-950/90 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-bold uppercase">Language:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-black border border-zinc-700 text-violet-300 text-xs px-2.5 py-1 rounded font-mono focus:outline-none focus:border-violet-400"
            >
              <option value="typescript">TypeScript / JavaScript</option>
              <option value="python">Python</option>
              <option value="go">Go (Golang)</option>
              <option value="php">PHP</option>
              <option value="sql">SQL</option>
              <option value="c">C / C++</option>
              <option value="java">Java</option>
            </select>
          </div>

          <button
            onClick={() => setCodeSnippet('')}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Code
          </button>
        </div>

        <div className="relative rounded-lg border border-zinc-800 bg-black overflow-hidden font-mono text-xs">
          <textarea
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
            rows={10}
            placeholder="// Paste application source code here for static security analysis..."
            className="w-full bg-transparent text-emerald-300 p-3.5 focus:outline-none resize-y leading-relaxed font-mono"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-zinc-500">
            Defensive SAST Engine • Powered by Gemini 2.5 Flash
          </span>

          <button
            onClick={handleRunAudit}
            disabled={loading || !codeSnippet.trim()}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs rounded-lg transition-all shadow-[0_0_15px_rgba(139,92,246,0.4)] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            {loading ? 'Analyzing AST & Security Rules...' : 'Audit Source Code'}
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Structured Findings View */}
      {auditResult && (
        <div className="space-y-6">
          {/* Executive Rating Banner */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded border uppercase ${getSeverityBadge(
                    auditResult.overallRisk
                  )}`}
                >
                  {auditResult.overallRisk} RISK LEVEL
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  Security Rating: <strong className="text-white">{auditResult.score}/100</strong>
                </span>
              </div>
              <p className="text-xs text-zinc-300 max-w-2xl">{auditResult.summary}</p>
            </div>

            <div className="text-right shrink-0">
              <div className="text-2xl font-black text-rose-400 font-mono">
                {auditResult.findings?.length || 0}
              </div>
              <div className="text-[10px] text-zinc-500 uppercase">Vulnerabilities Detected</div>
            </div>
          </div>

          {/* Findings List */}
          <div className="space-y-4">
            {auditResult.findings?.map((finding, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/90 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-900">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="text-sm font-bold text-white">{finding.title}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${getSeverityBadge(
                        finding.severity
                      )}`}
                    >
                      {finding.severity}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                    {finding.cwe && <span className="px-1.5 py-0.5 rounded bg-zinc-900">{finding.cwe}</span>}
                    {finding.owasp && <span className="px-1.5 py-0.5 rounded bg-zinc-900">{finding.owasp}</span>}
                    {finding.lineNumbers && <span className="text-amber-400">{finding.lineNumbers}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-zinc-500 font-bold">Technical Impact:</span>
                    <p className="text-zinc-300 text-[11px] leading-relaxed">{finding.impact}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-zinc-500 font-bold">Defensive Remediation:</span>
                    <p className="text-emerald-300 text-[11px] leading-relaxed">{finding.remediation}</p>
                  </div>
                </div>

                {finding.vulnerableCodeSnippet && (
                  <div>
                    <span className="text-[10px] uppercase text-rose-400 font-bold block mb-1">
                      Vulnerable Code Section:
                    </span>
                    <pre className="p-2.5 rounded bg-rose-950/20 border border-rose-950 text-rose-300 text-[11px] font-mono overflow-x-auto">
                      {finding.vulnerableCodeSnippet}
                    </pre>
                  </div>
                )}

                {finding.secureCodeSnippet && (
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Hardened &amp; Secure Replacement Code:
                      </span>
                      <button
                        onClick={() => copySnippet(finding.secureCodeSnippet!, `sec-${idx}`)}
                        className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === `sec-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedId === `sec-${idx}` ? 'Copied' : 'Copy Fix'}
                      </button>
                    </div>
                    <pre className="p-2.5 rounded bg-emerald-950/20 border border-emerald-900/60 text-emerald-300 text-[11px] font-mono overflow-x-auto">
                      {finding.secureCodeSnippet}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Best Practices */}
          {auditResult.bestPractices?.length > 0 && (
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-2">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Engineering Hardening Best Practices
              </h4>
              <ul className="space-y-1 text-xs text-zinc-300">
                {auditResult.bestPractices.map((bp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{bp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Raw output fallback if unstructured */}
      {rawOutput && (
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 font-mono text-xs text-zinc-300 whitespace-pre-wrap">
          {rawOutput}
        </div>
      )}
    </div>
  );
};
