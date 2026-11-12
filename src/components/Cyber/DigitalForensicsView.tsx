import React, { useState } from 'react';
import {
  Fingerprint,
  FileSearch,
  Upload,
  Copy,
  Check,
  Shield,
  Clock,
  Plus,
  Trash2,
  Download,
  AlertCircle,
  FileCode,
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  timestamp: string;
  artifact: string;
  action: string;
  evidence: string;
  severity: 'INFO' | 'SUSPICIOUS' | 'MALICIOUS';
}

export const DigitalForensicsView: React.FC = () => {
  // File inspection state
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [lastModified, setLastModified] = useState<string | null>(null);
  const [sha256Hash, setSha256Hash] = useState<string | null>(null);
  const [sha1Hash, setSha1Hash] = useState<string | null>(null);
  const [magicBytes, setMagicBytes] = useState<string | null>(null);
  const [extractedStrings, setExtractedStrings] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isHashing, setIsHashing] = useState(false);

  // Forensic Timeline state
  const [timeline, setTimeline] = useState<TimelineEvent[]>([
    {
      id: 't-1',
      timestamp: '2026-10-27 08:14:22 UTC',
      artifact: 'auth.log / syslog',
      action: 'Multiple failed SSH attempts (Brute-force indicator)',
      evidence: 'Failed password for invalid user admin from 198.51.100.24 port 48210',
      severity: 'SUSPICIOUS',
    },
    {
      id: 't-2',
      timestamp: '2026-10-27 08:15:01 UTC',
      artifact: '/tmp/svc_agent.sh',
      action: 'Unauthorized executable script dropped into /tmp directory',
      evidence: 'SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      severity: 'MALICIOUS',
    },
  ]);

  const [newTimestamp, setNewTimestamp] = useState('');
  const [newArtifact, setNewArtifact] = useState('');
  const [newAction, setNewAction] = useState('');
  const [newEvidence, setNewEvidence] = useState('');
  const [newSeverity, setNewSeverity] = useState<'INFO' | 'SUSPICIOUS' | 'MALICIOUS'>('INFO');

  // Handle local file drop/select
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize(file.size);
    setFileType(file.type || 'application/octet-stream');
    setLastModified(new Date(file.lastModified).toISOString());
    setIsHashing(true);

    try {
      const buffer = await file.arrayBuffer();

      // SHA-256
      const sha256Buffer = await crypto.subtle.digest('SHA-256', buffer);
      const sha256Hex = Array.from(new Uint8Array(sha256Buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      setSha256Hash(sha256Hex);

      // SHA-1
      const sha1Buffer = await crypto.subtle.digest('SHA-1', buffer);
      const sha1Hex = Array.from(new Uint8Array(sha1Buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      setSha1Hash(sha1Hex);

      // Magic Bytes (First 8 bytes in Hex)
      const firstBytes = new Uint8Array(buffer.slice(0, 8));
      const magicHex = Array.from(firstBytes)
        .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
        .join(' ');
      setMagicBytes(magicHex);

      // Extract ASCII strings (min length 4)
      const textDecoder = new TextDecoder('latin1');
      const rawText = textDecoder.decode(buffer.slice(0, 100000)); // scan first 100KB
      const matches = rawText.match(/[a-zA-Z0-9_\-\.\/:\?&=]{4,}/g) || [];
      const interesting = matches
        .filter((s) => s.length >= 6 && (s.includes('http') || s.includes('/') || s.includes('.') || s.includes('=')))
        .slice(0, 20);
      setExtractedStrings(interesting);
    } catch (err) {
      console.error('File parsing error:', err);
    } finally {
      setIsHashing(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Add timeline event
  const handleAddTimelineEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtifact.trim() || !newAction.trim()) return;

    const event: TimelineEvent = {
      id: `t-${Date.now()}`,
      timestamp: newTimestamp.trim() || new Date().toISOString(),
      artifact: newArtifact.trim(),
      action: newAction.trim(),
      evidence: newEvidence.trim(),
      severity: newSeverity,
    };

    setTimeline((prev) => [...prev, event]);
    setNewArtifact('');
    setNewAction('');
    setNewEvidence('');
    setNewTimestamp('');
  };

  const handleDeleteEvent = (id: string) => {
    setTimeline((prev) => prev.filter((ev) => ev.id !== id));
  };

  const exportTimeline = () => {
    let md = `# DIGITAL FORENSICS INCIDENT TIMELINE\nGenerated: ${new Date().toISOString()}\n\n`;
    timeline.forEach((ev, i) => {
      md += `### ${i + 1}. [${ev.severity}] ${ev.timestamp}\n`;
      md += `- **Artifact**: ${ev.artifact}\n`;
      md += `- **Observed Action**: ${ev.action}\n`;
      if (ev.evidence) md += `- **Evidence**: \`${ev.evidence}\`\n`;
      md += `\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forensics_timeline_${Date.now()}.md`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-blue-400" />
            Digital Forensics Workbench &amp; Artifact Analyzer
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Client-side cryptographic hash verification, file magic header inspection, ASCII string triage, and incident timeline logging.
          </p>
        </div>

        <button
          onClick={exportTimeline}
          className="px-3.5 py-2 rounded-lg bg-zinc-900 border border-blue-500/40 hover:border-blue-400 text-blue-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Export Timeline (.md)
        </button>
      </div>

      {/* File Hasher & Metadata */}
      <div className="p-4 rounded-xl border border-blue-500/30 bg-zinc-950/90 shadow-xl space-y-4">
        <div className="border-2 border-dashed border-zinc-800 hover:border-blue-500/60 rounded-xl p-6 text-center transition-colors bg-black/40">
          <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <h3 className="text-xs font-bold text-white">Select File for Client-Side Hash Verification</h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            100% private in-browser analysis. Files are never uploaded to any remote server.
          </p>
          <label className="mt-3 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-lg transition-all cursor-pointer">
            Browse File
            <input type="file" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        {isHashing && (
          <div className="text-xs font-mono text-blue-400 animate-pulse text-center py-2">
            Calculating cryptographic SHA-256 / SHA-1 digests...
          </div>
        )}

        {fileName && !isHashing && (
          <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-3 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3 border-b border-zinc-900">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">File Name</span>
                <span className="text-white font-bold">{fileName}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">File Size</span>
                <span className="text-zinc-300">
                  {fileSize ? `${(fileSize / 1024).toFixed(1)} KB (${fileSize} bytes)` : '0 bytes'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">Magic Bytes (Header)</span>
                <span className="text-cyan-400 font-bold">{magicBytes || 'N/A'}</span>
              </div>
            </div>

            {/* SHA-256 */}
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block mb-1">SHA-256 Checksum:</span>
              <div className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800 text-emerald-400 break-all">
                <span>{sha256Hash}</span>
                <button
                  onClick={() => copyToClipboard(sha256Hash || '', 'sha256')}
                  className="text-zinc-500 hover:text-white ml-2"
                >
                  {copiedKey === 'sha256' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* SHA-1 */}
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block mb-1">SHA-1 Checksum:</span>
              <div className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800 text-cyan-400 break-all">
                <span>{sha1Hash}</span>
                <button
                  onClick={() => copyToClipboard(sha1Hash || '', 'sha1')}
                  className="text-zinc-500 hover:text-white ml-2"
                >
                  {copiedKey === 'sha1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Extracted strings */}
            {extractedStrings.length > 0 && (
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block mb-1">
                  Extracted Indicators &amp; Strings (Sample):
                </span>
                <div className="p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 text-[11px] max-h-32 overflow-y-auto space-y-0.5">
                  {extractedStrings.map((str, i) => (
                    <div key={i} className="truncate">
                      • {str}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Forensic Timeline Builder */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Forensic Incident Timeline</h3>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">{timeline.length} Recorded Artifacts</span>
        </div>

        {/* Add Event Form */}
        <form onSubmit={handleAddTimelineEvent} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <input
            type="text"
            value={newTimestamp}
            onChange={(e) => setNewTimestamp(e.target.value)}
            placeholder="Timestamp (e.g. 2026-10-27 10:30 UTC)"
            className="bg-black border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded text-xs font-mono focus:outline-none focus:border-blue-400"
          />
          <input
            type="text"
            value={newArtifact}
            onChange={(e) => setNewArtifact(e.target.value)}
            placeholder="Artifact Source (e.g. auth.log, PCAP)"
            className="bg-black border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded text-xs font-mono focus:outline-none focus:border-blue-400"
          />
          <input
            type="text"
            value={newAction}
            onChange={(e) => setNewAction(e.target.value)}
            placeholder="Observed Event / TTP"
            className="bg-black border border-zinc-700 text-zinc-300 px-3 py-1.5 rounded text-xs font-mono focus:outline-none focus:border-blue-400"
          />
          <div className="flex gap-2">
            <select
              value={newSeverity}
              onChange={(e) => setNewSeverity(e.target.value as any)}
              className="bg-black border border-zinc-700 text-xs px-2 py-1.5 rounded text-zinc-300 font-mono focus:outline-none"
            >
              <option value="INFO">Info</option>
              <option value="SUSPICIOUS">Suspicious</option>
              <option value="MALICIOUS">Malicious</option>
            </select>
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        </form>

        {/* Timeline Events List */}
        <div className="space-y-2.5">
          {timeline.map((ev) => (
            <div
              key={ev.id}
              className={`p-3 rounded-lg border text-xs font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                ev.severity === 'MALICIOUS'
                  ? 'border-rose-950 bg-rose-950/20'
                  : ev.severity === 'SUSPICIOUS'
                  ? 'border-amber-950 bg-amber-950/20'
                  : 'border-zinc-800 bg-black/60'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      ev.severity === 'MALICIOUS'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : ev.severity === 'SUSPICIOUS'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {ev.severity}
                  </span>
                  <span className="text-zinc-400 text-[11px]">{ev.timestamp}</span>
                  <span className="text-blue-400 font-bold">{ev.artifact}</span>
                </div>
                <div className="text-white font-medium">{ev.action}</div>
                {ev.evidence && (
                  <div className="text-[10px] text-zinc-500 break-all">{ev.evidence}</div>
                )}
              </div>

              <button
                onClick={() => handleDeleteEvent(ev.id)}
                className="text-zinc-600 hover:text-rose-400 p-1 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
