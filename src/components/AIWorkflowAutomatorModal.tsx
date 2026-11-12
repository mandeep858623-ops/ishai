import React, { useState, useEffect } from 'react';
import { ModalWrapper } from './Modals';
import { soundEngine } from '../utils/audio';
import { exportToDocx, exportToPdf, triggerFileDownload } from '../utils/fileExporters';
import { 
  WorkflowTaskType, 
  WorkflowStepConfig 
} from '../../server/workflowService';
import { 
  Cpu, 
  Plus, 
  Play, 
  Save, 
  Trash2, 
  Copy, 
  Check, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RotateCcw, 
  ArrowDown, 
  ArrowUp, 
  Download, 
  Layers, 
  FileText, 
  HelpCircle, 
  Sparkles, 
  Globe, 
  BarChart3, 
  Code, 
  FolderCheck, 
  History, 
  BookOpen, 
  Briefcase, 
  Share2, 
  ChevronRight,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

export interface WorkflowStep {
  id: string;
  name: string;
  taskType: WorkflowTaskType;
  inputSource: 'initial' | 'previous' | string; // 'initial', 'previous', or step ID
  outputVariable: string;
  config: WorkflowStepConfig;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  output?: string;
  error?: string;
  durationMs?: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  initialInput: string;
  steps: WorkflowStep[];
}

export interface WorkflowExecutionRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  executedAt: string;
  status: 'completed' | 'failed' | 'cancelled';
  totalDurationMs: number;
  completedStepsCount: number;
  totalStepsCount: number;
  finalOutput?: string;
  failedStepName?: string;
  stepSnapshots: Array<{
    stepId: string;
    stepName: string;
    taskType: string;
    status: string;
    output?: string;
    error?: string;
    durationMs?: number;
  }>;
}

const STORAGE_WORKFLOWS_KEY = 'SUPERAI_Workflows_v1';
const STORAGE_HISTORY_KEY = 'SUPERAI_Workflow_History_v1';

// 5 Built-in Functional Templates
const WORKFLOW_TEMPLATES: Array<{
  id: string;
  name: string;
  description: string;
  icon: any;
  initialInput: string;
  steps: WorkflowStep[];
}> = [
  {
    id: 'tpl_study_pack',
    name: 'Study Pack Generator',
    description: 'Transform lecture notes or text into a comprehensive study summary, key facts, interactive quiz, and revision notes.',
    icon: BookOpen,
    initialInput: 'Photosynthesis is the process by which green plants and certain organisms transform light energy into chemical energy. During photosynthesis in green plants, light energy is captured and used to convert water, carbon dioxide, and minerals into oxygen and energy-rich organic compounds like glucose. The reactions occur in chloroplasts containing chlorophyll pigments.',
    steps: [
      {
        id: 's1',
        name: 'Summarize Material',
        taskType: 'summarize',
        inputSource: 'initial',
        outputVariable: 'summary_output',
        config: { summaryMode: 'bullet_points' },
        status: 'pending',
      },
      {
        id: 's2',
        name: 'Extract Key Facts & Concepts',
        taskType: 'extract_points',
        inputSource: 'previous',
        outputVariable: 'key_points',
        config: {},
        status: 'pending',
      },
      {
        id: 's3',
        name: 'Generate Practice Quiz',
        taskType: 'generate_quiz',
        inputSource: 's1',
        outputVariable: 'quiz_output',
        config: { quizCount: 4 },
        status: 'pending',
      },
      {
        id: 's4',
        name: 'Create Study Guide Sheet',
        taskType: 'study_sheet',
        inputSource: 'previous',
        outputVariable: 'study_sheet',
        config: {},
        status: 'pending',
      },
      {
        id: 's5',
        name: 'Export Final Study Pack',
        taskType: 'export_result',
        inputSource: 'previous',
        outputVariable: 'final_pack',
        config: { exportFormat: 'txt' },
        status: 'pending',
      },
    ],
  },
  {
    id: 'tpl_doc_intel',
    name: 'Document Intelligence',
    description: 'Extract executive summaries, identify dates, names, and milestones, and draft a high-impact intelligence report.',
    icon: Briefcase,
    initialInput: 'Project Titan Quarter 3 Brief: Launch scheduled for November 15, 2026. Lead Architect SuperAI reported 94% telemetry stabilization across neural clusters. Budget allocation approved by Executive Board for $1.2M. Key risk identified: server latency during peak load, mitigation team assigned under Sarah Chen.',
    steps: [
      {
        id: 's1',
        name: 'Executive Summary',
        taskType: 'summarize',
        inputSource: 'initial',
        outputVariable: 'exec_summary',
        config: { summaryMode: 'executive' },
        status: 'pending',
      },
      {
        id: 's2',
        name: 'Extract Dates, Names & Actions',
        taskType: 'extract_points',
        inputSource: 'initial',
        outputVariable: 'entities',
        config: {},
        status: 'pending',
      },
      {
        id: 's3',
        name: 'Format Intelligence Report',
        taskType: 'format_output',
        inputSource: 'previous',
        outputVariable: 'formatted_report',
        config: { formatType: 'markdown' },
        status: 'pending',
      },
    ],
  },
  {
    id: 'tpl_content_repurpose',
    name: 'Content Repurposer',
    description: 'Take any long-form article or idea and generate an executive summary, social media announcement, and video script.',
    icon: Share2,
    initialInput: 'Artificial General Intelligence workflows are transitioning from single-prompt chat interfaces to multi-step autonomous pipelines. When software can orchestrate data extraction, mathematical reasoning, multi-language localization, and instant report generation, enterprise productivity multiplies tenfold.',
    steps: [
      {
        id: 's1',
        name: 'Summarize Core Thesis',
        taskType: 'summarize',
        inputSource: 'initial',
        outputVariable: 'core_thesis',
        config: { summaryMode: 'concise' },
        status: 'pending',
      },
      {
        id: 's2',
        name: 'Generate Social Post',
        taskType: 'rewrite',
        inputSource: 'previous',
        outputVariable: 'social_post',
        config: { tone: 'persuasive' },
        status: 'pending',
      },
      {
        id: 's3',
        name: 'Create Short Video Script',
        taskType: 'ai_text',
        inputSource: 's1',
        outputVariable: 'video_script',
        config: { prompt: 'Write a punchy 60-second video script with Hook, Core Message, and Call-to-Action based on this summary:' },
        status: 'pending',
      },
    ],
  },
  {
    id: 'tpl_csv_insights',
    name: 'CSV Insights & Reporting',
    description: 'Parse raw CSV data, compute real statistical averages, sums, and ranges, then format into an executive report.',
    icon: BarChart3,
    initialInput: `Region,Product,Revenue,Units\nNorth,SaaS Starter,12000,120\nNorth,SaaS Pro,24000,80\nSouth,SaaS Starter,15000,150\nSouth,SaaS Pro,32000,105\nEast,SaaS Enterprise,65000,25\nWest,SaaS Enterprise,82000,32`,
    steps: [
      {
        id: 's1',
        name: 'Compute Real Statistics',
        taskType: 'analyze_data',
        inputSource: 'initial',
        outputVariable: 'stats_data',
        config: {},
        status: 'pending',
      },
      {
        id: 's2',
        name: 'Executive Plain-Language Report',
        taskType: 'rewrite',
        inputSource: 'previous',
        outputVariable: 'exec_report',
        config: { tone: 'executive' },
        status: 'pending',
      },
      {
        id: 's3',
        name: 'Format as Clean Markdown',
        taskType: 'format_output',
        inputSource: 'previous',
        outputVariable: 'final_csv_report',
        config: { formatType: 'markdown' },
        status: 'pending',
      },
    ],
  },
  {
    id: 'tpl_lang_pack',
    name: 'Language Learning Pack',
    description: 'Summarize content, translate into a target language, extract key vocabulary, and generate practice questions.',
    icon: Globe,
    initialInput: 'Traveling across Europe offers opportunities to experience ancient architecture, regional culinary traditions, and diverse languages. High-speed rail networks connect major capitals like Paris, Berlin, and Rome within hours.',
    steps: [
      {
        id: 's1',
        name: 'Summarize Context',
        taskType: 'summarize',
        inputSource: 'initial',
        outputVariable: 'summary',
        config: { summaryMode: 'concise' },
        status: 'pending',
      },
      {
        id: 's2',
        name: 'Translate to Spanish',
        taskType: 'translate',
        inputSource: 'previous',
        outputVariable: 'translated_text',
        config: { language: 'Spanish' },
        status: 'pending',
      },
      {
        id: 's3',
        name: 'Extract Vocabulary & Practice',
        taskType: 'generate_quiz',
        inputSource: 'previous',
        outputVariable: 'vocab_quiz',
        config: { quizCount: 4 },
        status: 'pending',
      },
    ],
  },
];

interface AIWorkflowAutomatorModalProps {
  onClose: () => void;
  onLog?: (text: string, tag: string) => void;
}

export const AIWorkflowAutomatorModal: React.FC<AIWorkflowAutomatorModalProps> = ({
  onClose,
  onLog,
}) => {
  // Navigation tabs: 'builder' | 'my_workflows' | 'templates' | 'history'
  const [activeTab, setActiveTab] = useState<'builder' | 'my_workflows' | 'templates' | 'history'>('builder');

  // Active Workflow State
  const [workflow, setWorkflow] = useState<WorkflowDefinition>(() => {
    return {
      id: 'wf_' + Date.now(),
      name: 'Custom Research & Study Pipeline',
      description: 'Multi-step automated analysis pipeline connecting text extraction, AI summarization, and quiz generation.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      initialInput: 'Quantum computing leverages quantum mechanical phenomena such as superposition and entanglement to perform calculations exponentially faster than classical computers for specific problem sets. Quantum key distribution (QKD) enables theoretically unbreakable cryptographic communication.',
      steps: [
        {
          id: 'step_1',
          name: 'Summarize Quantum Concepts',
          taskType: 'summarize',
          inputSource: 'initial',
          outputVariable: 'quantum_summary',
          config: { summaryMode: 'bullet_points' },
          status: 'pending',
        },
        {
          id: 'step_2',
          name: 'Extract Milestones & Action Items',
          taskType: 'extract_points',
          inputSource: 'previous',
          outputVariable: 'quantum_points',
          config: {},
          status: 'pending',
        },
        {
          id: 'step_3',
          name: 'Generate Practice Questions',
          taskType: 'generate_quiz',
          inputSource: 'step_1',
          outputVariable: 'quantum_quiz',
          config: { quizCount: 3 },
          status: 'pending',
        },
      ],
    };
  });

  // Saved Workflows & Run History from local storage
  const [savedWorkflows, setSavedWorkflows] = useState<WorkflowDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_WORKFLOWS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [runHistory, setRunHistory] = useState<WorkflowExecutionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [currentRunningStepIndex, setCurrentRunningStepIndex] = useState<number | null>(null);
  const [finalOutput, setFinalOutput] = useState<string>('');
  const [copiedText, setCopiedText] = useState(false);
  const [selectedHistoryRun, setSelectedHistoryRun] = useState<WorkflowExecutionRecord | null>(null);

  // Persist workflows when updated
  const saveWorkflowToStorage = (wfToSave: WorkflowDefinition) => {
    soundEngine.playSuccess();
    const updated = { ...wfToSave, updatedAt: new Date().toISOString() };
    setWorkflow(updated);
    setSavedWorkflows((prev) => {
      const filtered = prev.filter((w) => w.id !== updated.id);
      const next = [updated, ...filtered];
      localStorage.setItem(STORAGE_WORKFLOWS_KEY, JSON.stringify(next));
      return next;
    });
    if (onLog) {
      onLog(`[WORKFLOW_AUTOMATOR] Saved workflow "${updated.name}" (${updated.steps.length} steps)`, 'INTELLIGENCE');
    }
  };

  // Add Step to current workflow
  const handleAddStep = () => {
    soundEngine.playClick();
    const newStepNumber = workflow.steps.length + 1;
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      name: `Step ${newStepNumber}: AI Text Task`,
      taskType: 'ai_text',
      inputSource: 'previous',
      outputVariable: `step_${newStepNumber}_output`,
      config: { prompt: 'Analyze and build upon upstream content.' },
      status: 'pending',
    };
    setWorkflow((prev) => ({
      ...prev,
      steps: [...prev.steps, newStep],
    }));
  };

  // Update step field
  const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    setWorkflow((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)),
    }));
  };

  // Move step up or down
  const moveStep = (index: number, direction: 'up' | 'down') => {
    soundEngine.playClick();
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= workflow.steps.length) return;
    const newSteps = [...workflow.steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIdx];
    newSteps[targetIdx] = temp;
    setWorkflow((prev) => ({ ...prev, steps: newSteps }));
  };

  // Duplicate step
  const duplicateStep = (index: number) => {
    soundEngine.playClick();
    const source = workflow.steps[index];
    const clone: WorkflowStep = {
      ...source,
      id: `step_${Date.now()}`,
      name: `${source.name} (Copy)`,
      outputVariable: `${source.outputVariable}_copy`,
      status: 'pending',
      output: undefined,
      error: undefined,
    };
    const newSteps = [...workflow.steps];
    newSteps.splice(index + 1, 0, clone);
    setWorkflow((prev) => ({ ...prev, steps: newSteps }));
  };

  // Delete step
  const deleteStep = (stepId: string) => {
    soundEngine.playClick();
    setWorkflow((prev) => ({
      ...prev,
      steps: prev.steps.filter((s) => s.id !== stepId),
    }));
  };

  // Load a pre-built template
  const loadTemplate = (tpl: typeof WORKFLOW_TEMPLATES[0]) => {
    soundEngine.playSuccess();
    const newWf: WorkflowDefinition = {
      id: 'wf_' + Date.now(),
      name: tpl.name,
      description: tpl.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      initialInput: tpl.initialInput,
      steps: tpl.steps.map((s) => ({ ...s, id: `step_${Math.random().toString(36).substring(2, 9)}`, status: 'pending' })),
    };
    setWorkflow(newWf);
    setActiveTab('builder');
    setFinalOutput('');
    if (onLog) {
      onLog(`[WORKFLOW_AUTOMATOR] Loaded template "${tpl.name}"`, 'INTELLIGENCE');
    }
  };

  // Delete saved workflow
  const handleDeleteSavedWorkflow = (id: string) => {
    soundEngine.playClick();
    setSavedWorkflows((prev) => {
      const next = prev.filter((w) => w.id !== id);
      localStorage.setItem(STORAGE_WORKFLOWS_KEY, JSON.stringify(next));
      return next;
    });
  };

  // =========================================================================
  // EXECUTION ENGINE: RUN WORKFLOW WITH REAL DATA PASSING
  // =========================================================================
  const runWorkflow = async () => {
    if (isRunning) return;
    if (workflow.steps.length === 0) {
      alert('Please add at least one step to the workflow.');
      return;
    }

    soundEngine.playSuccess();
    setIsRunning(true);
    setFinalOutput('');

    // Reset step statuses to pending
    const initialSteps: WorkflowStep[] = workflow.steps.map((s) => ({
      ...s,
      status: 'pending',
      output: undefined,
      error: undefined,
    }));
    setWorkflow((prev) => ({ ...prev, steps: initialSteps }));

    const executionStartTime = Date.now();
    const stepOutputs: Record<string, string> = {
      initial: workflow.initialInput,
    };
    let previousStepOutput = workflow.initialInput;
    let failed = false;
    let failedStepName = '';

    const updatedSteps = [...initialSteps];

    for (let i = 0; i < updatedSteps.length; i++) {
      if (failed) {
        updatedSteps[i].status = 'skipped';
        continue;
      }

      setCurrentRunningStepIndex(i);
      updatedSteps[i].status = 'running';
      setWorkflow((prev) => ({ ...prev, steps: [...updatedSteps] }));

      // Resolve Input Source
      let resolvedInput = '';
      const src = updatedSteps[i].inputSource;
      if (src === 'initial') {
        resolvedInput = workflow.initialInput;
      } else if (src === 'previous') {
        resolvedInput = previousStepOutput;
      } else if (stepOutputs[src]) {
        resolvedInput = stepOutputs[src];
      } else {
        // Fallback to previous
        resolvedInput = previousStepOutput;
      }

      const stepStart = Date.now();

      try {
        const response = await fetch('/api/ai/workflow/execute-step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskType: updatedSteps[i].taskType,
            inputText: resolvedInput,
            config: updatedSteps[i].config,
            stepName: updatedSteps[i].name,
          }),
        });

        const data = await response.json();
        const duration = Date.now() - stepStart;

        if (response.ok && data.success) {
          soundEngine.playClick();
          updatedSteps[i].status = 'completed';
          updatedSteps[i].output = data.output;
          updatedSteps[i].durationMs = duration;

          // Store in output dictionary
          stepOutputs[updatedSteps[i].id] = data.output;
          stepOutputs[updatedSteps[i].outputVariable] = data.output;
          previousStepOutput = data.output;
        } else {
          throw new Error(data.error || 'Task execution failed.');
        }
      } catch (stepErr: any) {
        soundEngine.playAlertBeep();
        failed = true;
        failedStepName = updatedSteps[i].name;
        updatedSteps[i].status = 'failed';
        updatedSteps[i].error = stepErr?.message || 'Error executing step.';
        updatedSteps[i].durationMs = Date.now() - stepStart;
      }

      setWorkflow((prev) => ({ ...prev, steps: [...updatedSteps] }));
    }

    const totalDuration = Date.now() - executionStartTime;
    const completedCount = updatedSteps.filter((s) => s.status === 'completed').length;
    const finalResultText = previousStepOutput || 'Workflow completed.';

    setIsRunning(false);
    setCurrentRunningStepIndex(null);

    if (!failed) {
      soundEngine.playSuccess();
      setFinalOutput(finalResultText);
    }

    // Save Execution Record to History
    const historyRecord: WorkflowExecutionRecord = {
      id: 'run_' + Date.now(),
      workflowId: workflow.id,
      workflowName: workflow.name,
      executedAt: new Date().toISOString(),
      status: failed ? 'failed' : 'completed',
      totalDurationMs: totalDuration,
      completedStepsCount: completedCount,
      totalStepsCount: updatedSteps.length,
      finalOutput: !failed ? finalResultText : undefined,
      failedStepName: failed ? failedStepName : undefined,
      stepSnapshots: updatedSteps.map((s) => ({
        stepId: s.id,
        stepName: s.name,
        taskType: s.taskType,
        status: s.status,
        output: s.output,
        error: s.error,
        durationMs: s.durationMs,
      })),
    };

    setRunHistory((prev) => {
      const next = [historyRecord, ...prev.slice(0, 49)];
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(next));
      return next;
    });

    if (onLog) {
      onLog(
        `[WORKFLOW_AUTOMATOR] Workflow "${workflow.name}" finished in ${(totalDuration / 1000).toFixed(1)}s: ${completedCount}/${updatedSteps.length} steps completed`,
        failed ? 'ALERT' : 'INTELLIGENCE'
      );
    }
  };

  // Copy output helper
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    soundEngine.playClick();
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Download output helper
  const handleDownloadOutput = async (format: 'txt' | 'md' | 'pdf' | 'docx') => {
    if (!finalOutput) return;
    soundEngine.playClick();
    const baseName = workflow.name.replace(/[^a-zA-Z0-9_-]/g, '_');

    if (format === 'docx') {
      const blob = await exportToDocx({ title: workflow.name, content: finalOutput, category: 'WORKFLOW_OUTPUT' });
      triggerFileDownload(blob, `${baseName}.docx`);
    } else if (format === 'pdf') {
      const blob = exportToPdf({ title: workflow.name, content: finalOutput, category: 'WORKFLOW_OUTPUT' });
      triggerFileDownload(blob, `${baseName}.pdf`);
    } else if (format === 'md') {
      const blob = new Blob([finalOutput], { type: 'text/markdown;charset=utf-8' });
      triggerFileDownload(blob, `${baseName}.md`);
    } else {
      const blob = new Blob([finalOutput], { type: 'text/plain;charset=utf-8' });
      triggerFileDownload(blob, `${baseName}.txt`);
    }
  };

  return (
    <ModalWrapper title="⚡ AI WORKFLOW AUTOMATOR" onClose={onClose} maxWidthClass="max-w-6xl">
      <div className="flex flex-col space-y-4 font-mono text-emerald-400 text-xs min-h-[620px]">

        {/* --- HEADER BAR --- */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-950 pb-3">
          <div>
            <h2 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              AI WORKFLOW AUTOMATOR
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Connect your tools. Automate your work.
            </p>
          </div>

          {/* Navigation Tab Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => { soundEngine.playClick(); setActiveTab('builder'); }}
              className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'builder'
                  ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'bg-black text-emerald-400 border border-emerald-950 hover:border-emerald-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Create Workflow</span>
            </button>

            <button
              onClick={() => { soundEngine.playClick(); setActiveTab('templates'); }}
              className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'templates'
                  ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'bg-black text-emerald-400 border border-emerald-950 hover:border-emerald-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Templates</span>
            </button>

            <button
              onClick={() => { soundEngine.playClick(); setActiveTab('my_workflows'); }}
              className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'my_workflows'
                  ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'bg-black text-emerald-400 border border-emerald-950 hover:border-emerald-700'
              }`}
            >
              <FolderCheck className="w-3.5 h-3.5" />
              <span>My Workflows ({savedWorkflows.length})</span>
            </button>

            <button
              onClick={() => { soundEngine.playClick(); setActiveTab('history'); }}
              className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'bg-black text-emerald-400 border border-emerald-950 hover:border-emerald-700'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Run History ({runHistory.length})</span>
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* TAB 1: WORKFLOW BUILDER WORKSPACE */}
        {/* ================================================================= */}
        {activeTab === 'builder' && (
          <div className="space-y-4 flex-1 flex flex-col">
            {/* Workflow Metadata Controls */}
            <div className="bg-[#05080c] border border-emerald-950 p-3 rounded-lg space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <input
                  type="text"
                  value={workflow.name}
                  onChange={(e) => setWorkflow((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Workflow Name"
                  className="font-bold text-sm bg-black border border-emerald-900 rounded px-2.5 py-1 text-emerald-200 outline-none flex-1 min-w-[200px]"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => saveWorkflowToStorage(workflow)}
                    className="bg-black hover:bg-emerald-950 border border-emerald-900 text-emerald-300 font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Workflow</span>
                  </button>
                  <button
                    onClick={runWorkflow}
                    disabled={isRunning || workflow.steps.length === 0}
                    className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-extrabold px-5 py-1.5 rounded text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.5)] cursor-pointer"
                  >
                    {isRunning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>RUNNING ({currentRunningStepIndex !== null ? currentRunningStepIndex + 1 : 1}/{workflow.steps.length})...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span>RUN WORKFLOW</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={workflow.description}
                onChange={(e) => setWorkflow((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief workflow description..."
                className="w-full text-xs bg-black border border-emerald-950 rounded px-2.5 py-1 text-zinc-400 outline-none"
              />
            </div>

            {/* Workflow Initial Input Data Block */}
            <div className="bg-[#060a0f] border border-emerald-950 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <label className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  WORKFLOW INITIAL INPUT DATA:
                </label>
                <span className="text-[10px] text-zinc-500">
                  {workflow.initialInput.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                rows={3}
                value={workflow.initialInput}
                onChange={(e) => setWorkflow((prev) => ({ ...prev, initialInput: e.target.value }))}
                placeholder="Enter the source text, document content, or CSV data that starts the workflow..."
                className="w-full bg-black border border-emerald-900 rounded p-2.5 text-xs text-emerald-200 outline-none leading-relaxed focus:border-emerald-500"
              />
            </div>

            {/* Connected Steps Sequence */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                <span>WORKFLOW TASK STEPS ({workflow.steps.length})</span>
                <span className="text-[10px] text-zinc-500">Linear Dependency Chain</span>
              </div>

              {workflow.steps.map((step, idx) => (
                <React.Fragment key={step.id}>
                  {/* Step Card */}
                  <div
                    className={`bg-[#05080c] border rounded-lg p-3.5 space-y-3 transition-all ${
                      step.status === 'running'
                        ? 'border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                        : step.status === 'completed'
                        ? 'border-emerald-500/80'
                        : step.status === 'failed'
                        ? 'border-red-500/80 bg-red-950/10'
                        : 'border-emerald-950'
                    }`}
                  >
                    {/* Step Card Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-950 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-300 font-extrabold flex items-center justify-center text-[10px] border border-emerald-800">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={step.name}
                          onChange={(e) => updateStep(step.id, { name: e.target.value })}
                          className="font-bold text-xs bg-black border border-emerald-950 px-2 py-0.5 rounded text-emerald-200 outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 ${
                            step.status === 'completed'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                              : step.status === 'running'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 animate-pulse'
                              : step.status === 'failed'
                              ? 'bg-red-950 text-red-300 border border-red-600'
                              : step.status === 'skipped'
                              ? 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                              : 'bg-black text-zinc-400 border border-zinc-900'
                          }`}
                        >
                          {step.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          {step.status === 'running' && <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />}
                          {step.status === 'failed' && <XCircle className="w-3 h-3 text-red-400" />}
                          <span>{step.status}</span>
                          {step.durationMs && <span>({(step.durationMs / 1000).toFixed(1)}s)</span>}
                        </span>

                        {/* Reorder & Action Controls */}
                        <button
                          onClick={() => moveStep(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 bg-black border border-emerald-950 disabled:opacity-30 rounded hover:border-emerald-600"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3 h-3 text-zinc-400" />
                        </button>
                        <button
                          onClick={() => moveStep(idx, 'down')}
                          disabled={idx === workflow.steps.length - 1}
                          className="p-1 bg-black border border-emerald-950 disabled:opacity-30 rounded hover:border-emerald-600"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3 h-3 text-zinc-400" />
                        </button>
                        <button
                          onClick={() => duplicateStep(idx)}
                          className="p-1 bg-black border border-emerald-950 rounded hover:border-emerald-600"
                          title="Duplicate Step"
                        >
                          <Copy className="w-3 h-3 text-zinc-400" />
                        </button>
                        <button
                          onClick={() => deleteStep(step.id)}
                          className="p-1 bg-black border border-emerald-950 rounded hover:border-red-600"
                          title="Delete Step"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    </div>

                    {/* Step Configuration Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-zinc-500 block font-bold">TASK ACTION TYPE:</label>
                        <select
                          value={step.taskType}
                          onChange={(e) => updateStep(step.id, { taskType: e.target.value as WorkflowTaskType })}
                          className="w-full bg-black border border-emerald-900 rounded px-2.5 py-1.5 text-xs text-emerald-300 outline-none"
                        >
                          <option value="ai_text">✍️ AI Text Generator</option>
                          <option value="summarize">📝 Summarize Text</option>
                          <option value="extract_points">📌 Extract Key Points</option>
                          <option value="generate_quiz">❓ Generate Quiz</option>
                          <option value="study_sheet">📖 Create Study Sheet</option>
                          <option value="translate">🌍 Translate Text</option>
                          <option value="rewrite">🎨 Rewrite Text</option>
                          <option value="analyze_data">📊 Analyze Data (CSV)</option>
                          <option value="format_output">📐 Format Output</option>
                          <option value="export_result">💾 Export Result</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-500 block font-bold">INPUT DATA SOURCE:</label>
                        <select
                          value={step.inputSource}
                          onChange={(e) => updateStep(step.id, { inputSource: e.target.value })}
                          className="w-full bg-black border border-emerald-900 rounded px-2.5 py-1.5 text-xs text-emerald-300 outline-none"
                        >
                          <option value="initial">Workflow Initial Input</option>
                          <option value="previous">Previous Step Output</option>
                          {workflow.steps.slice(0, idx).map((prevStep, pIdx) => (
                            <option key={prevStep.id} value={prevStep.id}>
                              Step {pIdx + 1}: {prevStep.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-500 block font-bold">OUTPUT VARIABLE NAME:</label>
                        <input
                          type="text"
                          value={step.outputVariable}
                          onChange={(e) => updateStep(step.id, { outputVariable: e.target.value })}
                          placeholder="e.g. step_output"
                          className="w-full bg-black border border-emerald-900 rounded px-2.5 py-1 text-xs text-emerald-300 outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* Task-Specific Configuration Fields */}
                    {step.taskType === 'ai_text' && (
                      <div>
                        <label className="text-[10px] text-zinc-500 block font-bold">PROMPT INSTRUCTIONS:</label>
                        <input
                          type="text"
                          value={step.config.prompt || ''}
                          onChange={(e) =>
                            updateStep(step.id, { config: { ...step.config, prompt: e.target.value } })
                          }
                          placeholder="Instructions to the AI model..."
                          className="w-full bg-black border border-emerald-900 rounded px-2.5 py-1 text-xs text-emerald-200 outline-none"
                        />
                      </div>
                    )}

                    {step.taskType === 'summarize' && (
                      <div className="flex gap-2 items-center">
                        <label className="text-[10px] text-zinc-500 font-bold">SUMMARY FORMAT:</label>
                        <select
                          value={step.config.summaryMode || 'bullet_points'}
                          onChange={(e) =>
                            updateStep(step.id, {
                              config: { ...step.config, summaryMode: e.target.value as any },
                            })
                          }
                          className="bg-black border border-emerald-900 rounded px-2 py-0.5 text-xs text-emerald-300 outline-none"
                        >
                          <option value="bullet_points">Bullet Points</option>
                          <option value="concise">Concise Overview</option>
                          <option value="executive">Executive Summary</option>
                          <option value="detailed">Detailed Breakdown</option>
                        </select>
                      </div>
                    )}

                    {step.taskType === 'translate' && (
                      <div className="flex gap-2 items-center">
                        <label className="text-[10px] text-zinc-500 font-bold">TARGET LANGUAGE:</label>
                        <select
                          value={step.config.language || 'Spanish'}
                          onChange={(e) =>
                            updateStep(step.id, {
                              config: { ...step.config, language: e.target.value },
                            })
                          }
                          className="bg-black border border-emerald-900 rounded px-2 py-0.5 text-xs text-emerald-300 outline-none"
                        >
                          {['Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Hindi', 'Japanese', 'Mandarin', 'Arabic', 'Russian'].map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {step.taskType === 'rewrite' && (
                      <div className="flex gap-2 items-center">
                        <label className="text-[10px] text-zinc-500 font-bold">TONE / STYLE:</label>
                        <select
                          value={step.config.tone || 'professional'}
                          onChange={(e) =>
                            updateStep(step.id, {
                              config: { ...step.config, tone: e.target.value as any },
                            })
                          }
                          className="bg-black border border-emerald-900 rounded px-2 py-0.5 text-xs text-emerald-300 outline-none"
                        >
                          <option value="professional">Professional</option>
                          <option value="persuasive">Persuasive / Pitch</option>
                          <option value="casual">Casual / Conversational</option>
                          <option value="academic">Academic</option>
                          <option value="executive">Executive</option>
                        </select>
                      </div>
                    )}

                    {step.taskType === 'format_output' && (
                      <div className="flex gap-2 items-center">
                        <label className="text-[10px] text-zinc-500 font-bold">OUTPUT FORMAT:</label>
                        <select
                          value={step.config.formatType || 'markdown'}
                          onChange={(e) =>
                            updateStep(step.id, {
                              config: { ...step.config, formatType: e.target.value as any },
                            })
                          }
                          className="bg-black border border-emerald-900 rounded px-2 py-0.5 text-xs text-emerald-300 outline-none"
                        >
                          <option value="markdown">Markdown Document</option>
                          <option value="text">Clean Plain Text</option>
                          <option value="json">Structured JSON</option>
                        </select>
                      </div>
                    )}

                    {/* Step Output Preview (When Completed) */}
                    {step.output && (
                      <div className="bg-black/90 border border-emerald-950 rounded p-2.5 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-zinc-500">
                          <span className="font-bold text-emerald-400">OUTPUT ({step.output.split(/\s+/).length} words):</span>
                          <button
                            onClick={() => handleCopyText(step.output || '')}
                            className="hover:text-emerald-300 flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        </div>
                        <div className="text-[11px] text-zinc-300 whitespace-pre-wrap max-h-28 overflow-y-auto font-mono">
                          {step.output}
                        </div>
                      </div>
                    )}

                    {/* Step Error Display (When Failed) */}
                    {step.error && (
                      <div className="bg-red-950/40 border border-red-800 text-red-300 p-2.5 rounded text-[11px] flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>{step.error}</span>
                      </div>
                    )}
                  </div>

                  {/* Visual Connection Arrow */}
                  {idx < workflow.steps.length - 1 && (
                    <div className="flex justify-center py-0.5">
                      <div className="bg-emerald-950 border border-emerald-800 text-emerald-400 p-1 rounded-full">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}

              {/* Add Step Button */}
              <div className="pt-2">
                <button
                  onClick={handleAddStep}
                  className="w-full py-2.5 border-2 border-dashed border-emerald-900 hover:border-emerald-500 rounded-lg text-emerald-300 font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer bg-[#05080c] hover:bg-[#080d14]"
                >
                  <Plus className="w-4 h-4" />
                  <span>ADD WORKFLOW STEP</span>
                </button>
              </div>
            </div>

            {/* Final Workflow Result Viewer */}
            {finalOutput && (
              <div className="bg-[#05080c] border-2 border-emerald-500 rounded-lg p-4 space-y-3 mt-4 shadow-lg shadow-emerald-950/40">
                <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-xs text-emerald-300">
                      WORKFLOW FINAL RESULT ({finalOutput.split(/\s+/).length} Words)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyText(finalOutput)}
                      className="p-1 text-zinc-400 hover:text-emerald-300 rounded"
                      title="Copy result"
                    >
                      {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDownloadOutput('txt')}
                      className="text-[10px] bg-black border border-emerald-900 text-emerald-300 hover:bg-emerald-950 px-2 py-0.5 rounded"
                    >
                      .TXT
                    </button>
                    <button
                      onClick={() => handleDownloadOutput('md')}
                      className="text-[10px] bg-black border border-emerald-900 text-emerald-300 hover:bg-emerald-950 px-2 py-0.5 rounded"
                    >
                      .MD
                    </button>
                    <button
                      onClick={() => handleDownloadOutput('docx')}
                      className="text-[10px] bg-black border border-blue-900 text-blue-300 hover:bg-blue-950 px-2 py-0.5 rounded"
                    >
                      .DOCX
                    </button>
                    <button
                      onClick={() => handleDownloadOutput('pdf')}
                      className="text-[10px] bg-black border border-red-900 text-red-300 hover:bg-red-950 px-2 py-0.5 rounded"
                    >
                      .PDF
                    </button>
                  </div>
                </div>

                <div className="text-xs text-emerald-100 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto pr-1 font-mono">
                  {finalOutput}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: TEMPLATES (5 PRE-BUILT FUNCTIONAL TEMPLATES) */}
        {/* ================================================================= */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="border-b border-emerald-950 pb-2">
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                PRE-BUILT AUTOMATION TEMPLATES
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Load ready-to-run multi-step automated workflows for study packs, intelligence briefings, content repurposing, and CSV analytics.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {WORKFLOW_TEMPLATES.map((tpl) => {
                const IconComp = tpl.icon;
                return (
                  <div
                    key={tpl.id}
                    className="bg-[#05080c] border border-emerald-950 hover:border-emerald-600 rounded-lg p-4 space-y-3 transition-colors flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                        <IconComp className="w-4 h-4 text-emerald-400" />
                        <span>{tpl.name}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {tpl.description}
                      </p>
                      <div className="pt-2 text-[10px] text-zinc-500">
                        {tpl.steps.length} Steps: {tpl.steps.map((s) => s.name).join(' → ')}
                      </div>
                    </div>

                    <button
                      onClick={() => loadTemplate(tpl)}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-1.5 rounded text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950"
                    >
                      <span>LOAD &amp; RUN TEMPLATE</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: MY SAVED WORKFLOWS */}
        {/* ================================================================= */}
        {activeTab === 'my_workflows' && (
          <div className="space-y-4">
            <div className="border-b border-emerald-950 pb-2">
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <FolderCheck className="w-4 h-4 text-emerald-400" />
                MY SAVED WORKFLOWS ({savedWorkflows.length})
              </h3>
            </div>

            {savedWorkflows.length === 0 ? (
              <div className="py-12 text-center text-zinc-600 space-y-2">
                <Layers className="w-10 h-10 mx-auto text-zinc-700" />
                <p className="font-bold text-zinc-400">NO SAVED WORKFLOWS YET</p>
                <p className="text-[11px]">Build a workflow in the Create Workflow tab and click &ldquo;Save Workflow&rdquo;.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {savedWorkflows.map((saved) => (
                  <div
                    key={saved.id}
                    className="bg-[#05080c] border border-emerald-950 p-3.5 rounded-lg space-y-2.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-300 text-xs">{saved.name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {saved.steps.length} steps
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                        {saved.description || 'Custom workflow pipeline.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-emerald-950/80">
                      <span className="text-[9px] text-zinc-600">
                        {new Date(saved.updatedAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setWorkflow(saved);
                            setActiveTab('builder');
                            soundEngine.playSuccess();
                          }}
                          className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-bold px-2.5 py-1 rounded text-xs"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => handleDeleteSavedWorkflow(saved.id)}
                          className="p-1 text-zinc-500 hover:text-red-400 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: RUN HISTORY & EXECUTION TRACE */}
        {/* ================================================================= */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="border-b border-emerald-950 pb-2">
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                EXECUTION RUN HISTORY ({runHistory.length} RUNS)
              </h3>
            </div>

            {runHistory.length === 0 ? (
              <div className="py-12 text-center text-zinc-600 space-y-2">
                <History className="w-10 h-10 mx-auto text-zinc-700" />
                <p className="font-bold text-zinc-400">NO EXECUTIONS RECORDED</p>
                <p className="text-[11px]">Run a workflow to inspect execution traces and output logs.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* List of past runs */}
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {runHistory.map((run) => (
                    <div
                      key={run.id}
                      onClick={() => {
                        soundEngine.playClick();
                        setSelectedHistoryRun(run);
                      }}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors space-y-1 ${
                        selectedHistoryRun?.id === run.id
                          ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200'
                          : 'bg-[#05080c] border-emerald-950 hover:border-emerald-800 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="truncate">{run.workflowName}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                            run.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' : 'bg-red-950 text-red-400'
                          }`}
                        >
                          {run.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500">
                        <span>{new Date(run.executedAt).toLocaleTimeString()}</span>
                        <span>
                          {run.completedStepsCount}/{run.totalStepsCount} Steps ({(run.totalDurationMs / 1000).toFixed(1)}s)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Run Details Trace */}
                <div className="lg:col-span-2 bg-[#05080c] border border-emerald-950 rounded-lg p-4 space-y-3">
                  {selectedHistoryRun ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
                        <div>
                          <h4 className="font-bold text-xs text-emerald-300">{selectedHistoryRun.workflowName}</h4>
                          <span className="text-[10px] text-zinc-500">
                            Run at {new Date(selectedHistoryRun.executedAt).toLocaleString()} • Duration: {(selectedHistoryRun.totalDurationMs / 1000).toFixed(2)}s
                          </span>
                        </div>
                        <span className="font-bold text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 uppercase">
                          {selectedHistoryRun.status}
                        </span>
                      </div>

                      {/* Step Snapshots Trace */}
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {selectedHistoryRun.stepSnapshots.map((step, idx) => (
                          <div key={idx} className="bg-black border border-emerald-950 p-2.5 rounded text-xs space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span>Step {idx + 1}: {step.stepName}</span>
                              <span className="text-[10px] text-zinc-500">{step.taskType} ({((step.durationMs || 0) / 1000).toFixed(1)}s)</span>
                            </div>
                            {step.output && (
                              <p className="text-[10px] text-zinc-400 truncate font-mono">
                                {step.output.slice(0, 100)}...
                              </p>
                            )}
                            {step.error && (
                              <p className="text-[10px] text-red-400 font-mono">
                                Error: {step.error}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Final Result in History */}
                      {selectedHistoryRun.finalOutput && (
                        <div className="space-y-1 pt-2 border-t border-emerald-950">
                          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
                            <span>FINAL WORKFLOW OUTPUT:</span>
                            <button
                              onClick={() => handleCopyText(selectedHistoryRun.finalOutput || '')}
                              className="hover:text-emerald-300 flex items-center gap-1 text-[10px]"
                            >
                              <Copy className="w-3 h-3" /> Copy Output
                            </button>
                          </div>
                          <div className="text-xs text-zinc-300 bg-black p-2.5 rounded border border-emerald-950 whitespace-pre-wrap max-h-40 overflow-y-auto font-mono">
                            {selectedHistoryRun.finalOutput}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-16 text-center text-zinc-600">
                      Select a run record on the left to inspect execution details and outputs.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </ModalWrapper>
  );
};
