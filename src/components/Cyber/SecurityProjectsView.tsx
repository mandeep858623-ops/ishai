import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  FileText,
  Download,
  Shield,
  AlertOctagon,
  Sparkles,
  CheckCircle2,
  Save,
  FileCode,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { SecurityProject, SecurityFinding } from './types';

interface SecurityProjectsViewProps {
  projects: SecurityProject[];
  onUpdateProjects: (projects: SecurityProject[]) => void;
}

export const SecurityProjectsView: React.FC<SecurityProjectsViewProps> = ({
  projects,
  onUpdateProjects,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id || ''
  );

  // New Project Form Modal/State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newInScope, setNewInScope] = useState('');
  const [newOutOfScope, setNewOutOfScope] = useState('');
  const [newRoE, setNewRoE] = useState('Authorized ethical assessment with read-only passive scanning.');

  // New Finding State
  const [showAddFinding, setShowAddFinding] = useState(false);
  const [findingTitle, setFindingTitle] = useState('');
  const [findingSeverity, setFindingSeverity] = useState<SecurityFinding['severity']>('HIGH');
  const [findingTarget, setFindingTarget] = useState('');
  const [findingCvss, setFindingCvss] = useState(7.5);
  const [findingCwe, setFindingCwe] = useState('CWE-89');
  const [findingImpact, setFindingImpact] = useState('');
  const [findingRemediation, setFindingRemediation] = useState('');

  // AI Executive Summary Generation
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [executiveSummary, setExecutiveSummary] = useState<string | null>(null);

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newProj: SecurityProject = {
      id: `proj-${Date.now()}`,
      title: newTitle.trim(),
      clientName: newClient.trim() || 'Internal Org',
      status: 'IN_PROGRESS',
      startDate: new Date().toISOString().slice(0, 10),
      inScope: newInScope.split('\n').map((s) => s.trim()).filter(Boolean),
      outOfScope: newOutOfScope.split('\n').map((s) => s.trim()).filter(Boolean),
      rulesOfEngagement: newRoE.trim(),
      findings: [],
    };

    const updated = [newProj, ...projects];
    onUpdateProjects(updated);
    setSelectedProjectId(newProj.id);
    setShowCreateModal(false);
    setNewTitle('');
    setNewClient('');
    setNewInScope('');
    setNewOutOfScope('');
  };

  const handleAddFinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !findingTitle.trim()) return;

    const newFinding: SecurityFinding = {
      id: `VULN-${Date.now().toString().slice(-4)}`,
      title: findingTitle.trim(),
      severity: findingSeverity,
      target: findingTarget.trim() || activeProject.inScope[0] || 'Target Scope',
      cvssScore: findingCvss,
      cwe: findingCwe,
      status: 'OPEN',
      description: findingTitle,
      impact: findingImpact.trim(),
      remediation: findingRemediation.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    };

    const updated = projects.map((p) =>
      p.id === activeProject.id
        ? { ...p, findings: [newFinding, ...p.findings] }
        : p
    );

    onUpdateProjects(updated);
    setShowAddFinding(false);
    setFindingTitle('');
    setFindingImpact('');
    setFindingRemediation('');
  };

  const handleDeleteFinding = (findingId: string) => {
    if (!activeProject) return;
    const updated = projects.map((p) =>
      p.id === activeProject.id
        ? { ...p, findings: p.findings.filter((f) => f.id !== findingId) }
        : p
    );
    onUpdateProjects(updated);
  };

  const handleDeleteProject = (projId: string) => {
    const updated = projects.filter((p) => p.id !== projId);
    onUpdateProjects(updated);
    if (selectedProjectId === projId) {
      setSelectedProjectId(updated[0]?.id || '');
    }
  };

  // Generate Executive Summary with Gemini
  const handleGenerateSummary = async () => {
    if (!activeProject) return;
    setIsGeneratingSummary(true);
    try {
      const res = await fetch('/api/cyber/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_report_summary',
          payload: {
            projectTitle: activeProject.title,
            targetScope: activeProject.inScope,
            findings: activeProject.findings,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.summary) {
        setExecutiveSummary(data.summary);
      }
    } catch (err) {
      console.error('Summary generation error:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Export to Markdown
  const handleExportMarkdown = () => {
    if (!activeProject) return;
    let md = `# SECURITY ASSESSMENT REPORT: ${activeProject.title}\n`;
    md += `**Client/Target Owner:** ${activeProject.clientName}\n`;
    md += `**Date:** ${activeProject.startDate}\n`;
    md += `**Rules of Engagement:** ${activeProject.rulesOfEngagement}\n\n`;

    md += `## 1. Scope Definition\n`;
    md += `### In-Scope Targets:\n`;
    activeProject.inScope.forEach((t) => (md += `- \`${t}\`\n`));
    md += `\n### Out-of-Scope Targets:\n`;
    activeProject.outOfScope.forEach((t) => (md += `- \`${t}\`\n`));
    md += `\n`;

    if (executiveSummary) {
      md += `## 2. Executive Summary\n${executiveSummary}\n\n`;
    }

    md += `## 3. Discovered Vulnerabilities & Findings (${activeProject.findings.length})\n\n`;
    activeProject.findings.forEach((f, idx) => {
      md += `### ${idx + 1}. [${f.severity}] ${f.title} (CVSS: ${f.cvssScore})\n`;
      md += `- **Vulnerability ID**: ${f.id}\n`;
      md += `- **CWE Identifier**: ${f.cwe || 'N/A'}\n`;
      md += `- **Affected Target**: \`${f.target}\`\n`;
      md += `- **Technical Impact**: ${f.impact}\n`;
      md += `- **Remediation**: ${f.remediation}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject.title.toLowerCase().replace(/\s+/g, '_')}_report.md`;
    a.click();
  };

  // Export to PDF with jsPDF
  const handleExportPdf = () => {
    if (!activeProject) return;
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.text(`PENETRATION TESTING REPORT`, 15, y);
    y += 8;

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Project: ${activeProject.title}`, 15, y);
    y += 6;
    doc.text(`Client: ${activeProject.clientName} | Date: ${activeProject.startDate}`, 15, y);
    y += 12;

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`1. Findings Overview (${activeProject.findings.length} Discovered)`, 15, y);
    y += 8;

    activeProject.findings.forEach((f, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(11);
      doc.setTextColor(f.severity === 'CRITICAL' || f.severity === 'HIGH' ? 200 : 50, 0, 0);
      doc.text(`${i + 1}. [${f.severity}] ${f.title} (CVSS ${f.cvssScore})`, 15, y);
      y += 5;

      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.text(`Target: ${f.target} | CWE: ${f.cwe || 'N/A'}`, 18, y);
      y += 5;
      doc.text(`Remediation: ${f.remediation.slice(0, 80)}...`, 18, y);
      y += 8;
    });

    doc.save(`${activeProject.title.toLowerCase().replace(/\s+/g, '_')}_report.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Authorized Penetration Testing Projects &amp; Reports
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage target scopes, Rules of Engagement (RoE), track findings, and export executive PDF/MD reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Assessment Project
          </button>
        </div>
      </div>

      {/* Main Grid: Projects List & Active Project Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Projects Selector */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Active Assessments</h3>
          {projects.map((proj) => {
            const isSelected = selectedProjectId === proj.id;
            return (
              <div
                key={proj.id}
                onClick={() => setSelectedProjectId(proj.id)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-500/60 bg-indigo-950/20 shadow-md'
                    : 'border-zinc-800 bg-zinc-950/80 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-zinc-500 font-mono">{proj.startDate}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-900 uppercase">
                    {proj.status}
                  </span>
                </div>
                <h4 className="font-bold text-white mt-0.5">{proj.title}</h4>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2 pt-2 border-t border-zinc-900">
                  <span>{proj.clientName}</span>
                  <span className="text-rose-400 font-mono font-bold">
                    {proj.findings.length} findings
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Project Workstation */}
        {activeProject ? (
          <div className="lg:col-span-2 space-y-6">
            {/* Project Overview Card */}
            <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-950/90 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-900">
                <div>
                  <h3 className="text-lg font-black text-white">{activeProject.title}</h3>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    Target Owner: <strong className="text-white">{activeProject.clientName}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportMarkdown}
                    className="px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    MD Report
                  </button>
                  <button
                    onClick={handleExportPdf}
                    className="px-2.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    PDF Report
                  </button>
                  <button
                    onClick={() => handleDeleteProject(activeProject.id)}
                    className="p-1.5 rounded bg-rose-950/40 text-rose-400 hover:bg-rose-900 border border-rose-900/60"
                    title="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Scopes & RoE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-black border border-zinc-800 space-y-1">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase block">
                    In-Scope Targets ({activeProject.inScope.length}):
                  </span>
                  {activeProject.inScope.map((s, i) => (
                    <div key={i} className="text-zinc-300">
                      • {s}
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-lg bg-black border border-zinc-800 space-y-1">
                  <span className="text-[10px] text-rose-400 font-bold uppercase block">
                    Out-Of-Scope Restrictions:
                  </span>
                  {activeProject.outOfScope.length > 0 ? (
                    activeProject.outOfScope.map((s, i) => (
                      <div key={i} className="text-zinc-500">
                        ✕ {s}
                      </div>
                    ))
                  ) : (
                    <span className="text-zinc-600 italic">None specified</span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Executive Summary Generator */}
            <div className="p-4 rounded-xl border border-indigo-500/30 bg-zinc-950/90 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    AI Executive Summary &amp; Remediation Roadmap
                  </h4>
                </div>

                <button
                  onClick={handleGenerateSummary}
                  disabled={isGeneratingSummary}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded transition-all cursor-pointer flex items-center gap-1"
                >
                  {isGeneratingSummary ? 'Drafting Summary...' : 'Generate with Gemini'}
                </button>
              </div>

              {executiveSummary && (
                <div className="p-3.5 rounded-lg bg-black border border-zinc-800 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {executiveSummary}
                </div>
              )}
            </div>

            {/* Findings Management Section */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                  <h4 className="text-sm font-bold text-white">
                    Discovered Vulnerabilities ({activeProject.findings.length})
                  </h4>
                </div>

                <button
                  onClick={() => setShowAddFinding(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Log Finding
                </button>
              </div>

              {/* Add Finding Drawer */}
              {showAddFinding && (
                <form
                  onSubmit={handleAddFinding}
                  className="p-4 rounded-lg bg-black border border-zinc-800 space-y-3 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      value={findingTitle}
                      onChange={(e) => setFindingTitle(e.target.value)}
                      placeholder="Vulnerability Title (e.g. Unauthenticated SQLi)"
                      className="bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-1.5 rounded"
                      required
                    />
                    <select
                      value={findingSeverity}
                      onChange={(e) => setFindingSeverity(e.target.value as any)}
                      className="bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-1.5 rounded font-mono"
                    >
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                      <option value="INFO">INFO</option>
                    </select>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={findingCvss}
                      onChange={(e) => setFindingCvss(parseFloat(e.target.value))}
                      placeholder="CVSS Score (e.g. 8.4)"
                      className="bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-1.5 rounded font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={findingTarget}
                      onChange={(e) => setFindingTarget(e.target.value)}
                      placeholder="Affected Target / URL path"
                      className="bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-1.5 rounded font-mono"
                    />
                    <input
                      type="text"
                      value={findingCwe}
                      onChange={(e) => setFindingCwe(e.target.value)}
                      placeholder="CWE ID (e.g. CWE-89)"
                      className="bg-zinc-950 border border-zinc-700 text-zinc-200 px-3 py-1.5 rounded font-mono"
                    />
                  </div>

                  <textarea
                    value={findingImpact}
                    onChange={(e) => setFindingImpact(e.target.value)}
                    rows={2}
                    placeholder="Technical impact explanation..."
                    className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 p-2.5 rounded"
                  />

                  <textarea
                    value={findingRemediation}
                    onChange={(e) => setFindingRemediation(e.target.value)}
                    rows={2}
                    placeholder="Defensive remediation guidance..."
                    className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 p-2.5 rounded"
                  />

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddFinding(false)}
                      className="px-3 py-1.5 text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded"
                    >
                      Save Finding
                    </button>
                  </div>
                </form>
              )}

              {/* Findings List */}
              <div className="space-y-2.5">
                {activeProject.findings.map((f) => (
                  <div
                    key={f.id}
                    className="p-3.5 rounded-lg border border-zinc-800 bg-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            f.severity === 'CRITICAL'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : f.severity === 'HIGH'
                              ? 'bg-orange-950 text-orange-300 border border-orange-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {f.severity}
                        </span>
                        <span className="font-bold text-white">{f.title}</span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          CVSS: {f.cvssScore}
                        </span>
                      </div>
                      <div className="text-zinc-400 text-[11px] font-mono">
                        Target: {f.target} {f.cwe && `• ${f.cwe}`}
                      </div>
                      <p className="text-zinc-300 text-[11px] pt-1">{f.impact}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteFinding(f.id)}
                      className="text-zinc-600 hover:text-rose-400 p-1 self-start sm:self-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* New Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg p-5 rounded-2xl bg-zinc-950 border border-indigo-500/40 shadow-2xl space-y-4 text-xs font-mono">
            <h3 className="text-base font-bold text-white">New Authorized Security Assessment</h3>
            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="text-zinc-400 uppercase text-[10px] block mb-1">Project Name</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Q4 Web Infrastructure Audit"
                  className="w-full bg-black border border-zinc-700 text-white p-2 rounded"
                  required
                />
              </div>

              <div>
                <label className="text-zinc-400 uppercase text-[10px] block mb-1">Target Client / Owner</label>
                <input
                  type="text"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  placeholder="e.g. Acme FinTech Corp"
                  className="w-full bg-black border border-zinc-700 text-white p-2 rounded"
                />
              </div>

              <div>
                <label className="text-zinc-400 uppercase text-[10px] block mb-1">
                  In-Scope Domains / IPs (one per line)
                </label>
                <textarea
                  value={newInScope}
                  onChange={(e) => setNewInScope(e.target.value)}
                  rows={3}
                  placeholder="api.example.com&#10;app.example.com"
                  className="w-full bg-black border border-zinc-700 text-emerald-400 p-2 rounded"
                  required
                />
              </div>

              <div>
                <label className="text-zinc-400 uppercase text-[10px] block mb-1">
                  Out-of-Scope Exclusions (one per line)
                </label>
                <textarea
                  value={newOutOfScope}
                  onChange={(e) => setNewOutOfScope(e.target.value)}
                  rows={2}
                  placeholder="billing.example.com&#10;production-db.internal"
                  className="w-full bg-black border border-zinc-700 text-rose-400 p-2 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded"
                >
                  Create Assessment Scope
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
