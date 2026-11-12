import React, { useState, useEffect } from 'react';
import { ModalWrapper } from './Modals';
import { soundEngine } from '../utils/audio';
import { exportToDocx, exportToPdf, triggerFileDownload } from '../utils/fileExporters';
import { 
  Flashcard, 
  QuizQuestion, 
  StudyTask 
} from '../../server/studyGeniusService';
import { 
  GraduationCap, 
  Upload, 
  FileText, 
  BookOpen, 
  BrainCircuit, 
  HelpCircle, 
  MessageSquareQuote, 
  BookMarked, 
  Award, 
  Calendar, 
  BarChart3, 
  Sparkles, 
  Check, 
  Copy, 
  Download, 
  RotateCcw, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  CheckCircle2, 
  XCircle, 
  Info, 
  Lightbulb, 
  Layers, 
  Clock, 
  AlertTriangle,
  FileCheck
} from 'lucide-react';

export type StudyToolType = 
  | 'upload'
  | 'summarizer'
  | 'flashcards'
  | 'quiz'
  | 'tutor'
  | 'ask_notes'
  | 'chapter_notes'
  | 'exam_practice'
  | 'planner'
  | 'progress';

interface StudyGeniusModalProps {
  onClose: () => void;
  onLog?: (text: string, tag: string) => void;
  initialTool?: StudyToolType;
}

const TOOLS_LIST: Array<{
  id: StudyToolType;
  title: string;
  tag: string;
  icon: any;
  desc: string;
}> = [
  {
    id: 'upload',
    title: 'Upload Notes & PDFs',
    tag: 'DOC PROCESSING',
    icon: Upload,
    desc: 'Extract clean text and structured data from PDFs, TXT, and lecture notes.',
  },
  {
    id: 'summarizer',
    title: 'AI Summarizer',
    tag: '7 MODES',
    icon: FileText,
    desc: 'Generate executive summaries, chapter notes, bullet points, key dates & formulas.',
  },
  {
    id: 'flashcards',
    title: 'Flashcard Generator',
    tag: 'ACTIVE RECALL',
    icon: Layers,
    desc: 'Interactive 3D flip study cards with mastery tracking, shuffle, and deck storage.',
  },
  {
    id: 'quiz',
    title: 'Quiz Generator',
    tag: 'SELF ASSESSMENT',
    icon: BrainCircuit,
    desc: 'Multiple choice, True/False, and short-answer quizzes with instant grading & explanations.',
  },
  {
    id: 'tutor',
    title: 'Step-by-Step Tutor',
    tag: 'INTERACTIVE AI',
    icon: HelpCircle,
    desc: 'Socratic AI tutor that breaks difficult math, science, and humanities concepts into steps.',
  },
  {
    id: 'ask_notes',
    title: 'Ask Your Notes',
    tag: 'GROUNDED QA',
    icon: MessageSquareQuote,
    desc: 'Natural language Q&A strictly grounded in your uploaded documents with citations.',
  },
  {
    id: 'chapter_notes',
    title: 'Chapter Notes Maker',
    tag: 'SYLLABUS NOTES',
    icon: BookMarked,
    desc: 'Publication-ready chapter guides with objectives, key terms, tables, and review questions.',
  },
  {
    id: 'exam_practice',
    title: 'Exam Practice',
    tag: 'MOCK PAPERS',
    icon: Award,
    desc: 'Generate realistic exam papers with mark allocations, rubrics, and official answer schemes.',
  },
  {
    id: 'planner',
    title: 'Study Planner',
    tag: 'TIMETABLE',
    icon: Calendar,
    desc: 'Custom study roadmaps, daily task goals, and revision sessions tailored to your exam timeline.',
  },
  {
    id: 'progress',
    title: 'Progress Tracker',
    tag: 'ANALYTICS',
    icon: BarChart3,
    desc: 'Track flashcard mastery, quiz scores, completed study tasks, and revision stats.',
  },
];

const FLASHCARD_DECKS_KEY = 'SUPERAI_Flashcard_Decks_v1';
const STUDY_PLAN_KEY = 'SUPERAI_Study_Plan_v1';
const PROGRESS_METRICS_KEY = 'SUPERAI_Study_Progress_Metrics_v1';

export const StudyGeniusModal: React.FC<StudyGeniusModalProps> = ({
  onClose,
  onLog,
  initialTool = 'upload',
}) => {
  // Navigation State
  const [activeTool, setActiveTool] = useState<StudyToolType>(initialTool);

  // Uploaded Document State
  const [uploadedDocText, setUploadedDocText] = useState<string>('');
  const [uploadedDocName, setUploadedDocName] = useState<string>('');
  const [uploadedDocPageCount, setUploadedDocPageCount] = useState<number>(1);
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 1. Summarizer State
  const [summarizerMode, setSummarizerMode] = useState<
    'short' | 'detailed' | 'chapter_wise' | 'bullet_point' | 'definitions' | 'formulas_dates' | 'exam_revision'
  >('detailed');
  const [summaryCustomTopic, setSummaryCustomTopic] = useState('');
  const [summaryOutput, setSummaryOutput] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  // 2. Flashcards State
  const [flashcardCount, setFlashcardCount] = useState(8);
  const [flashcardDifficulty, setFlashcardDifficulty] = useState('Medium');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<string>>(new Set());
  const [needRevisionCards, setNeedRevisionCards] = useState<Set<string>>(new Set());
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);

  // 3. Quiz State
  const [quizQuestionCount, setQuizQuestionCount] = useState(5);
  const [quizDifficulty, setQuizDifficulty] = useState('Medium');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // 4. Step-by-Step Tutor State
  const [tutorQuestion, setTutorQuestion] = useState('');
  const [tutorUserAttempt, setTutorUserAttempt] = useState('');
  const [tutorResponse, setTutorResponse] = useState('');
  const [loadingTutor, setLoadingTutor] = useState(false);

  // 5. Ask Your Notes QA State
  const [notesQuestion, setNotesQuestion] = useState('');
  const [notesQaResult, setNotesQaResult] = useState<{
    answer: string;
    foundInNotes: boolean;
    citations: string[];
  } | null>(null);
  const [loadingNotesQa, setLoadingNotesQa] = useState(false);

  // 6. Chapter Notes State
  const [chapterSubject, setChapterSubject] = useState('General Science / Humanities');
  const [chapterGrade, setChapterGrade] = useState('High School / College');
  const [chapterTopic, setChapterTopic] = useState('');
  const [chapterNotesResult, setChapterNotesResult] = useState('');
  const [loadingChapterNotes, setLoadingChapterNotes] = useState(false);

  // 7. Exam Practice State
  const [examTopic, setExamTopic] = useState('');
  const [examType, setExamType] = useState('Midterm / Final Exam');
  const [examPaperResult, setExamPaperResult] = useState('');
  const [loadingExamPaper, setLoadingExamPaper] = useState(false);

  // 8. Study Planner State
  const [plannerSubjects, setPlannerSubjects] = useState('Physics (Electromagnetism), Mathematics (Calculus), Chemistry (Organic)');
  const [plannerHours, setPlannerHours] = useState(3);
  const [plannerDays, setPlannerDays] = useState(14);
  const [plannerResult, setPlannerResult] = useState<{
    planTitle: string;
    scheduleSummary: string;
    tasks: StudyTask[];
  } | null>(() => {
    try {
      const saved = localStorage.getItem(STUDY_PLAN_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loadingPlanner, setLoadingPlanner] = useState(false);

  // Copy feedback
  const [copiedText, setCopiedText] = useState(false);

  // Progress metrics from localStorage
  const [progressStats, setProgressStats] = useState<{
    flashcardsReviewed: number;
    quizzesCompleted: number;
    quizAveragePct: number;
    tasksCompleted: number;
  }>(() => {
    try {
      const saved = localStorage.getItem(PROGRESS_METRICS_KEY);
      return saved ? JSON.parse(saved) : { flashcardsReviewed: 0, quizzesCompleted: 0, quizAveragePct: 0, tasksCompleted: 0 };
    } catch {
      return { flashcardsReviewed: 0, quizzesCompleted: 0, quizAveragePct: 0, tasksCompleted: 0 };
    }
  });

  // Save progress metrics helper
  const updateProgressStats = (delta: Partial<typeof progressStats>) => {
    setProgressStats((prev) => {
      const next = { ...prev, ...delta };
      localStorage.setItem(PROGRESS_METRICS_KEY, JSON.stringify(next));
      return next;
    });
  };

  // Switch active tool
  const selectTool = (tool: StudyToolType) => {
    soundEngine.playClick();
    setActiveTool(tool);
  };

  // =========================================================================
  // FILE UPLOAD HANDLER (PDF & TXT PARSING)
  // =========================================================================
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    soundEngine.playClick();
    setUploadingFile(true);
    setUploadError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const fileData = e.target?.result as string;
          const res = await fetch('/api/study-genius/upload-parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileData,
              fileName: file.name,
              fileType: file.type,
            }),
          });

          const data = await res.json();
          if (res.ok && data.success) {
            soundEngine.playSuccess();
            setUploadedDocText(data.text);
            setUploadedDocName(data.fileName);
            setUploadedDocPageCount(data.numPages || 1);

            if (onLog) {
              onLog(`[STUDY_GENIUS] Uploaded & extracted ${data.fileName} (${data.wordCount} words, ${data.numPages} pages)`, 'INTELLIGENCE');
            }
          } else {
            soundEngine.playAlertBeep();
            setUploadError(data.error || 'Failed to extract text from file.');
          }
        } catch (err: any) {
          soundEngine.playAlertBeep();
          setUploadError(err?.message || 'Error processing uploaded file.');
        } finally {
          setUploadingFile(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError('Failed to read file.');
      setUploadingFile(false);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // =========================================================================
  // TOOL 1: AI SUMMARIZER
  // =========================================================================
  const handleGenerateSummary = async () => {
    const textToUse = uploadedDocText || summaryCustomTopic;
    if (!textToUse.trim()) {
      alert('Please upload a study document or enter a topic to summarize.');
      return;
    }

    soundEngine.playClick();
    setLoadingSummary(true);

    try {
      const res = await fetch('/api/study-genius/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToUse,
          mode: summarizerMode,
          topic: summaryCustomTopic,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setSummaryOutput(data.summary);
      } else {
        soundEngine.playAlertBeep();
        alert(data.error || 'Summarization failed.');
      }
    } catch (err: any) {
      soundEngine.playAlertBeep();
      alert('Network error during summary generation.');
    } finally {
      setLoadingSummary(false);
    }
  };

  // =========================================================================
  // TOOL 2: FLASHCARD GENERATOR
  // =========================================================================
  const handleGenerateFlashcards = async () => {
    const textToUse = uploadedDocText || summaryCustomTopic || 'General Science & History Fundamentals';
    soundEngine.playClick();
    setLoadingFlashcards(true);
    setFlashcards([]);
    setCurrentCardIndex(0);
    setIsCardFlipped(false);

    try {
      const res = await fetch('/api/study-genius/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToUse,
          count: flashcardCount,
          difficulty: flashcardDifficulty,
          topic: summaryCustomTopic,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.flashcards)) {
        soundEngine.playSuccess();
        setFlashcards(data.flashcards);
      } else {
        soundEngine.playAlertBeep();
        alert(data.error || 'Flashcard generation failed.');
      }
    } catch (err) {
      soundEngine.playAlertBeep();
      alert('Network error generating flashcards.');
    } finally {
      setLoadingFlashcards(false);
    }
  };

  const markCardKnowledge = (cardId: string, known: boolean) => {
    soundEngine.playClick();
    if (known) {
      setKnownCards((prev) => new Set(prev).add(cardId));
      setNeedRevisionCards((prev) => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    } else {
      setNeedRevisionCards((prev) => new Set(prev).add(cardId));
      setKnownCards((prev) => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    }

    updateProgressStats({ flashcardsReviewed: progressStats.flashcardsReviewed + 1 });

    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsCardFlipped(false);
    }
  };

  // =========================================================================
  // TOOL 3: QUIZ GENERATOR
  // =========================================================================
  const handleGenerateQuiz = async () => {
    const textToUse = uploadedDocText || summaryCustomTopic || 'General Knowledge Study Subject';
    soundEngine.playClick();
    setLoadingQuiz(true);
    setQuizQuestions([]);
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);

    try {
      const res = await fetch('/api/study-genius/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToUse,
          count: quizQuestionCount,
          difficulty: quizDifficulty,
          topic: summaryCustomTopic,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.quiz)) {
        soundEngine.playSuccess();
        setQuizQuestions(data.quiz);
      } else {
        soundEngine.playAlertBeep();
        alert(data.error || 'Quiz generation failed.');
      }
    } catch (err) {
      soundEngine.playAlertBeep();
      alert('Network error generating quiz.');
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleScoreQuiz = () => {
    soundEngine.playSuccess();
    let score = 0;
    quizQuestions.forEach((q) => {
      const uAns = userAnswers[q.id]?.trim().toLowerCase();
      const cAns = q.correctAnswer.trim().toLowerCase();
      if (uAns && (uAns === cAns || cAns.includes(uAns))) {
        score += 1;
      }
    });

    const percentage = Math.round((score / quizQuestions.length) * 100);
    setQuizScore(percentage);
    setQuizSubmitted(true);

    const prevPctAvg = progressStats.quizAveragePct || percentage;
    const newAvg = Math.round((prevPctAvg + percentage) / 2);
    updateProgressStats({
      quizzesCompleted: progressStats.quizzesCompleted + 1,
      quizAveragePct: newAvg,
    });
  };

  // =========================================================================
  // TOOL 4: STEP-BY-STEP TUTOR
  // =========================================================================
  const handleAskTutor = async (hintOnly = false) => {
    if (!tutorQuestion.trim() || loadingTutor) return;
    soundEngine.playClick();
    setLoadingTutor(true);

    try {
      const res = await fetch('/api/study-genius/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: tutorQuestion,
          contextText: uploadedDocText,
          userAnswer: tutorUserAttempt,
          requestHint: hintOnly,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setTutorResponse(data.text);
      } else {
        soundEngine.playAlertBeep();
        alert(data.error || 'Tutor error.');
      }
    } catch (err) {
      soundEngine.playAlertBeep();
      alert('Network error during tutor request.');
    } finally {
      setLoadingTutor(false);
    }
  };

  // =========================================================================
  // TOOL 5: ASK YOUR NOTES
  // =========================================================================
  const handleAskNotes = async () => {
    if (!notesQuestion.trim() || loadingNotesQa) return;
    soundEngine.playClick();
    setLoadingNotesQa(true);

    try {
      const res = await fetch('/api/study-genius/ask-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: notesQuestion,
          notesText: uploadedDocText,
          fileName: uploadedDocName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setNotesQaResult(data);
      } else {
        soundEngine.playAlertBeep();
        alert(data.error || 'QA error.');
      }
    } catch (err) {
      soundEngine.playAlertBeep();
      alert('Network error querying study notes.');
    } finally {
      setLoadingNotesQa(false);
    }
  };

  // =========================================================================
  // TOOL 6: CHAPTER NOTES MAKER
  // =========================================================================
  const handleGenerateChapterNotes = async () => {
    const topicToUse = chapterTopic || uploadedDocText || 'Fundamental Concepts';
    if (!topicToUse.trim()) return;

    soundEngine.playClick();
    setLoadingChapterNotes(true);

    try {
      const res = await fetch('/api/study-genius/chapter-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicOrText: topicToUse,
          subject: chapterSubject,
          gradeLevel: chapterGrade,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setChapterNotesResult(data.notes);
      } else {
        soundEngine.playAlertBeep();
        alert(data.error || 'Chapter notes error.');
      }
    } catch (err) {
      soundEngine.playAlertBeep();
      alert('Network error generating chapter notes.');
    } finally {
      setLoadingChapterNotes(false);
    }
  };

  // =========================================================================
  // TOOL 7: EXAM PRACTICE PAPER
  // =========================================================================
  const handleGenerateExamPractice = async () => {
    const topicToUse = examTopic || uploadedDocText || 'Comprehensive Final Exam Review';
    if (!topicToUse.trim()) return;

    soundEngine.playClick();
    setLoadingExamPaper(true);

    try {
      const res = await fetch('/api/study-genius/exam-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicOrText: topicToUse,
          examType,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setExamPaperResult(data.examPaper);
      } else {
        soundEngine.playAlertBeep();
        alert(data.error || 'Exam practice error.');
      }
    } catch (err) {
      soundEngine.playAlertBeep();
      alert('Network error generating exam practice.');
    } finally {
      setLoadingExamPaper(false);
    }
  };

  // =========================================================================
  // TOOL 8: STUDY PLANNER
  // =========================================================================
  const handleGenerateStudyPlan = async () => {
    if (!plannerSubjects.trim()) return;

    soundEngine.playClick();
    setLoadingPlanner(true);

    try {
      const res = await fetch('/api/study-genius/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectsAndTopics: plannerSubjects,
          dailyHoursAvailable: plannerHours,
          daysUntilExam: plannerDays,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.plan) {
        soundEngine.playSuccess();
        setPlannerResult(data.plan);
        localStorage.setItem(STUDY_PLAN_KEY, JSON.stringify(data.plan));
      } else {
        soundEngine.playAlertBeep();
        alert(data.error || 'Study planner error.');
      }
    } catch (err) {
      soundEngine.playAlertBeep();
      alert('Network error generating study plan.');
    } finally {
      setLoadingPlanner(false);
    }
  };

  const toggleTaskCompletion = (taskId: string) => {
    if (!plannerResult) return;
    soundEngine.playClick();
    const updatedTasks = plannerResult.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const updatedPlan = { ...plannerResult, tasks: updatedTasks };
    setPlannerResult(updatedPlan);
    localStorage.setItem(STUDY_PLAN_KEY, JSON.stringify(updatedPlan));

    const finishedCount = updatedTasks.filter((t) => t.completed).length;
    updateProgressStats({ tasksCompleted: finishedCount });
  };

  // Generic copy helper
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    soundEngine.playClick();
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Generic download helper (Docx / PDF / TXT)
  const handleDownloadContent = async (title: string, text: string, format: 'docx' | 'pdf' | 'txt') => {
    if (!text) return;
    soundEngine.playClick();

    if (format === 'docx') {
      const blob = await exportToDocx({ title, content: text, category: 'STUDY_GENIUS' });
      triggerFileDownload(blob, `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`);
    } else if (format === 'pdf') {
      const blob = exportToPdf({ title, content: text, category: 'STUDY_GENIUS' });
      triggerFileDownload(blob, `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
    } else {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      triggerFileDownload(blob, `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`);
    }
  };

  return (
    <ModalWrapper title="🎓 STUDY GENIUS — AI STUDY WORKSPACE" onClose={onClose} maxWidthClass="max-w-5xl">
      <div className="flex flex-col space-y-4 font-mono text-emerald-400 text-xs min-h-[580px]">

        {/* --- TOOL SELECTOR TAB STRIP --- */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-emerald-950 scrollbar-thin">
          {TOOLS_LIST.map((tool) => {
            const IconComp = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => selectTool(tool.id)}
                className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  activeTool === tool.id
                    ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                    : 'bg-black text-emerald-400 border border-emerald-950 hover:border-emerald-700'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{tool.title}</span>
              </button>
            );
          })}
        </div>

        {/* Upload Status Bar Notification */}
        {uploadedDocName && (
          <div className="bg-emerald-950/40 border border-emerald-800/80 rounded px-3 py-1.5 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2 truncate">
              <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">
                <strong className="text-emerald-300">ACTIVE STUDY DOCUMENT:</strong> {uploadedDocName} ({uploadedDocPageCount} page{uploadedDocPageCount > 1 ? 's' : ''}, {uploadedDocText.split(/\s+/).length} words)
              </span>
            </div>
            <button
              onClick={() => {
                setUploadedDocText('');
                setUploadedDocName('');
                soundEngine.playClick();
              }}
              className="text-zinc-500 hover:text-red-400 text-[10px] underline shrink-0 ml-2"
            >
              Remove
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* TOOL 1: UPLOAD NOTES & PDFS */}
        {/* ================================================================= */}
        {activeTool === 'upload' && (
          <div className="space-y-4">
            <div className="border-b border-emerald-950 pb-2">
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                UPLOAD STUDY NOTES, PDFS &amp; LECTURE TRANSCRIPTS
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Upload your course materials (PDF or TXT) to automatically extract text for instant AI summaries, flashcards, quizzes, and Q&amp;A.
              </p>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-emerald-900/80 hover:border-emerald-500 bg-[#05080c] hover:bg-[#090d14] rounded-lg p-8 text-center space-y-3 transition-colors cursor-pointer"
            >
              <Upload className="w-10 h-10 mx-auto text-emerald-400 animate-bounce" />
              <div>
                <p className="font-bold text-emerald-200 text-sm">Drag and drop your PDF or TXT notes here</p>
                <p className="text-zinc-500 text-[11px] mt-1">Supports multi-page text PDFs, lecture transcripts, and plain text notes</p>
              </div>

              <label className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-4 py-2 rounded text-xs transition-colors cursor-pointer">
                <span>BROWSE FILES</span>
                <input
                  type="file"
                  accept=".pdf,.txt,text/plain,application/pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {uploadingFile && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded text-xs flex items-center justify-between animate-pulse">
                <span>Reading file and extracting document text...</span>
                <RotateCcw className="w-4 h-4 animate-spin" />
              </div>
            )}

            {uploadError && (
              <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 rounded text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Manual Text Input / Extracted Preview */}
            <div className="space-y-1 pt-2">
              <div className="flex items-center justify-between text-[11px]">
                <label className="text-zinc-400 font-bold">OR PASTE / EDIT YOUR STUDY NOTES MANUALLY:</label>
                {uploadedDocText && (
                  <span className="text-emerald-500">{uploadedDocText.split(/\s+/).length} Words</span>
                )}
              </div>
              <textarea
                rows={8}
                value={uploadedDocText}
                onChange={(e) => {
                  setUploadedDocText(e.target.value);
                  if (!uploadedDocName) setUploadedDocName('Manual Notes Input');
                }}
                placeholder="Paste lecture notes, textbook chapters, or topic summaries here..."
                className="w-full bg-black border border-emerald-900 focus:border-emerald-400 rounded p-3 text-xs text-emerald-200 outline-none leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TOOL 2: AI SUMMARIZER */}
        {/* ================================================================= */}
        {activeTool === 'summarizer' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs text-emerald-300 uppercase tracking-wider">
                  AI STUDY SUMMARIZER &amp; REVISION NOTES
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] text-zinc-400 block font-bold">SUMMARIZATION MODE:</label>
                <select
                  value={summarizerMode}
                  onChange={(e) => setSummarizerMode(e.target.value as any)}
                  className="w-full bg-black border border-emerald-900 focus:border-emerald-400 rounded px-2.5 py-2 text-xs text-emerald-300 outline-none"
                >
                  <option value="detailed">Detailed Section-by-Section Summary</option>
                  <option value="short">Short Executive Overview (3-4 Paragraphs)</option>
                  <option value="chapter_wise">Chapter-Wise / Section Breakdown</option>
                  <option value="bullet_point">Bullet-Point Key Takeaways</option>
                  <option value="definitions">Glossary &amp; Key Definitions</option>
                  <option value="formulas_dates">Important Dates, Formulas &amp; Key Facts</option>
                  <option value="exam_revision">Exam Revision Sheet &amp; Mnemonics</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 block font-bold">OPTIONAL TOPIC FOCUS:</label>
                <input
                  type="text"
                  placeholder="e.g. Thermodynamics, WW2 timeline"
                  value={summaryCustomTopic}
                  onChange={(e) => setSummaryCustomTopic(e.target.value)}
                  className="w-full bg-black border border-emerald-900 rounded px-3 py-2 text-xs text-emerald-300 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleGenerateSummary}
                disabled={loadingSummary}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-extrabold px-5 py-2 rounded text-xs flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(16,185,129,0.4)] cursor-pointer"
              >
                {loadingSummary ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>SUMMARIZING...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>GENERATE SUMMARY</span>
                  </>
                )}
              </button>
            </div>

            {/* Summary Output */}
            {summaryOutput && (
              <div className="bg-[#05080c] border border-emerald-900 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
                  <span className="font-bold text-emerald-300 text-xs uppercase">
                    GENERATED SUMMARY ({summaryOutput.split(/\s+/).length} Words)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyText(summaryOutput)}
                      className="p-1 text-zinc-400 hover:text-emerald-300 rounded"
                      title="Copy text"
                    >
                      {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDownloadContent('Study_Summary', summaryOutput, 'docx')}
                      className="text-[10px] bg-black border border-blue-900 text-blue-300 hover:bg-blue-950 px-2 py-0.5 rounded"
                    >
                      .DOCX
                    </button>
                    <button
                      onClick={() => handleDownloadContent('Study_Summary', summaryOutput, 'pdf')}
                      className="text-[10px] bg-black border border-red-900 text-red-300 hover:bg-red-950 px-2 py-0.5 rounded"
                    >
                      .PDF
                    </button>
                  </div>
                </div>

                <div className="text-xs text-emerald-100 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto pr-1">
                  {summaryOutput}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TOOL 3: FLASHCARD GENERATOR */}
        {/* ================================================================= */}
        {activeTool === 'flashcards' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs text-emerald-300 uppercase tracking-wider">
                  INTERACTIVE STUDY FLASHCARDS
                </h3>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-emerald-400 font-bold">Known: {knownCards.size}</span>
                <span className="text-amber-400 font-bold">Needs Review: {needRevisionCards.size}</span>
              </div>
            </div>

            {/* Flashcard Generation Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-zinc-500 block font-bold">CARD COUNT:</label>
                <select
                  value={flashcardCount}
                  onChange={(e) => setFlashcardCount(Number(e.target.value))}
                  className="w-full bg-black border border-emerald-900 rounded px-2.5 py-1.5 text-xs text-emerald-300 outline-none"
                >
                  {[5, 8, 10, 12, 15, 20].map((n) => (
                    <option key={n} value={n} className="bg-zinc-950 text-white">
                      {n} Cards
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 block font-bold">DIFFICULTY:</label>
                <select
                  value={flashcardDifficulty}
                  onChange={(e) => setFlashcardDifficulty(e.target.value)}
                  className="w-full bg-black border border-emerald-900 rounded px-2.5 py-1.5 text-xs text-emerald-300 outline-none"
                >
                  <option value="Easy">Easy (Core Terms)</option>
                  <option value="Medium">Medium (Balanced Recall)</option>
                  <option value="Hard">Hard (Deep Analytical Concepts)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleGenerateFlashcards}
                  disabled={loadingFlashcards}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-2 px-3 rounded text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950"
                >
                  {loadingFlashcards ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>GENERATING DECK...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>GENERATE FLASHCARDS</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Flashcard Active Viewer */}
            {flashcards.length > 0 && (
              <div className="space-y-3 pt-2">
                {/* Progress bar */}
                <div className="w-full bg-black border border-emerald-950 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{ width: `${((currentCardIndex + 1) / flashcards.length) * 100}%` }}
                  />
                </div>

                {/* 3D Flip Flashcard */}
                <div
                  onClick={() => {
                    soundEngine.playClick();
                    setIsCardFlipped(!isCardFlipped);
                  }}
                  className={`min-h-[220px] p-6 bg-[#080d14] border-2 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all shadow-lg shadow-black/60 relative select-none ${
                    isCardFlipped
                      ? 'border-cyan-500/80 bg-[#07131d]'
                      : 'border-emerald-500/80 bg-[#07100b]'
                  }`}
                >
                  <div className="absolute top-3 left-3 text-[10px] font-bold text-zinc-500">
                    CARD {currentCardIndex + 1} OF {flashcards.length} • {isCardFlipped ? 'ANSWER (BACK)' : 'QUESTION (FRONT)'}
                  </div>

                  <div className="absolute top-3 right-3 text-[10px] text-emerald-400 font-bold bg-black px-2 py-0.5 rounded border border-emerald-950">
                    Click to flip 🔄
                  </div>

                  <div className="text-sm font-bold leading-relaxed max-w-xl text-emerald-200">
                    {isCardFlipped
                      ? flashcards[currentCardIndex]?.back
                      : flashcards[currentCardIndex]?.front}
                  </div>
                </div>

                {/* Navigation and Knowledge Controls */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        if (currentCardIndex > 0) {
                          setCurrentCardIndex(currentCardIndex - 1);
                          setIsCardFlipped(false);
                          soundEngine.playClick();
                        }
                      }}
                      disabled={currentCardIndex === 0}
                      className="p-2 bg-black border border-emerald-900 hover:border-emerald-500 disabled:opacity-30 rounded text-emerald-300"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (currentCardIndex < flashcards.length - 1) {
                          setCurrentCardIndex(currentCardIndex + 1);
                          setIsCardFlipped(false);
                          soundEngine.playClick();
                        }
                      }}
                      disabled={currentCardIndex === flashcards.length - 1}
                      className="p-2 bg-black border border-emerald-900 hover:border-emerald-500 disabled:opacity-30 rounded text-emerald-300"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => markCardKnowledge(flashcards[currentCardIndex]?.id, false)}
                      className="bg-amber-950/80 hover:bg-amber-900 border border-amber-600 text-amber-300 font-bold px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Need Revision
                    </button>
                    <button
                      onClick={() => markCardKnowledge(flashcards[currentCardIndex]?.id, true)}
                      className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 font-bold px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Mark Known
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TOOL 4: QUIZ GENERATOR */}
        {/* ================================================================= */}
        {activeTool === 'quiz' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs text-emerald-300 uppercase tracking-wider">
                  INTERACTIVE AI QUIZ &amp; KNOWLEDGE EVALUATOR
                </h3>
              </div>
              {quizScore !== null && (
                <span className="font-bold text-xs px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-600 text-emerald-300">
                  SCORE: {quizScore}%
                </span>
              )}
            </div>

            {/* Quiz Generation Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-zinc-500 block font-bold">QUESTIONS:</label>
                <select
                  value={quizQuestionCount}
                  onChange={(e) => setQuizQuestionCount(Number(e.target.value))}
                  className="w-full bg-black border border-emerald-900 rounded px-2.5 py-1.5 text-xs text-emerald-300 outline-none"
                >
                  {[3, 5, 8, 10, 15].map((n) => (
                    <option key={n} value={n} className="bg-zinc-950 text-white">
                      {n} Questions
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 block font-bold">DIFFICULTY:</label>
                <select
                  value={quizDifficulty}
                  onChange={(e) => setQuizDifficulty(e.target.value)}
                  className="w-full bg-black border border-emerald-900 rounded px-2.5 py-1.5 text-xs text-emerald-300 outline-none"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleGenerateQuiz}
                  disabled={loadingQuiz}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-2 px-3 rounded text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950 cursor-pointer"
                >
                  {loadingQuiz ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>BUILDING QUIZ...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>GENERATE QUIZ</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quiz Active Question List */}
            {quizQuestions.length > 0 && (
              <div className="space-y-4 pt-2">
                {quizQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="bg-[#060a0e] border border-emerald-950 rounded-lg p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-300">
                        QUESTION {idx + 1}. {q.question}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-black text-zinc-400 border border-emerald-950">
                        {q.topicTag}
                      </span>
                    </div>

                    {/* Options if MCQ or True/False */}
                    {q.options && q.options.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, oIdx) => {
                          const selected = userAnswers[q.id] === opt;
                          const isCorrect = q.correctAnswer.trim().toLowerCase() === opt.trim().toLowerCase();

                          let optionStyle = 'bg-black border-zinc-900 text-zinc-300 hover:border-emerald-700';
                          if (selected) {
                            optionStyle = 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold';
                          }
                          if (quizSubmitted) {
                            if (isCorrect) {
                              optionStyle = 'bg-emerald-950 border-emerald-400 text-emerald-200 font-bold';
                            } else if (selected && !isCorrect) {
                              optionStyle = 'bg-red-950 border-red-600 text-red-300';
                            }
                          }

                          return (
                            <button
                              key={oIdx}
                              disabled={quizSubmitted}
                              onClick={() => {
                                soundEngine.playClick();
                                setUserAnswers((prev) => ({ ...prev, [q.id]: opt }));
                              }}
                              className={`p-2.5 rounded text-left text-xs border transition-colors ${optionStyle}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      /* Short Answer / Fill in Blank Input */
                      <input
                        type="text"
                        disabled={quizSubmitted}
                        value={userAnswers[q.id] || ''}
                        onChange={(e) =>
                          setUserAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        placeholder="Type your answer here..."
                        className="w-full bg-black border border-emerald-900 rounded p-2 text-xs text-emerald-200 outline-none"
                      />
                    )}

                    {/* Explanation after submission */}
                    {quizSubmitted && (
                      <div className="p-2.5 bg-black/80 border border-emerald-900/60 rounded text-[11px] text-zinc-300 space-y-1">
                        <div className="font-bold text-emerald-400">
                          Correct Answer: {q.correctAnswer}
                        </div>
                        <p className="text-zinc-400 leading-relaxed">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}

                {/* Submit / Scoring Actions */}
                {!quizSubmitted ? (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleScoreQuiz}
                      className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-6 py-2.5 rounded text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer"
                    >
                      SUBMIT QUIZ FOR GRADED REVIEW
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-950/40 border border-emerald-600 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-emerald-300 text-sm">QUIZ COMPLETED!</span>
                      <p className="text-[11px] text-zinc-300 mt-0.5">
                        Your Score: <strong className="text-emerald-400">{quizScore}%</strong>. Score has been logged to your Progress Tracker.
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateQuiz}
                      className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-4 py-2 rounded text-xs"
                    >
                      Retake New Quiz
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TOOL 5: STEP-BY-STEP TUTOR */}
        {/* ================================================================= */}
        {activeTool === 'tutor' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs text-emerald-300 uppercase tracking-wider">
                  SOCRATIC STEP-BY-STEP TUTOR
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-zinc-400 block font-bold">ASK YOUR QUESTION / PROBLEM:</label>
                <textarea
                  rows={3}
                  value={tutorQuestion}
                  onChange={(e) => setTutorQuestion(e.target.value)}
                  placeholder="e.g. How do I solve 2x^2 + 5x - 3 = 0? Or: Explain Newton's Third Law with real examples."
                  className="w-full bg-black border border-emerald-900 focus:border-emerald-400 rounded p-3 text-xs text-emerald-200 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block font-bold">YOUR ATTEMPT / ANSWER (OPTIONAL):</label>
                <input
                  type="text"
                  value={tutorUserAttempt}
                  onChange={(e) => setTutorUserAttempt(e.target.value)}
                  placeholder="Type what you think the answer is to get feedback on your work..."
                  className="w-full bg-black border border-emerald-900 focus:border-emerald-400 rounded px-3 py-2 text-xs text-emerald-200 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => handleAskTutor(true)}
                  disabled={loadingTutor || !tutorQuestion.trim()}
                  className="bg-amber-950 hover:bg-amber-900 border border-amber-600 text-amber-300 font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5"
                >
                  <Lightbulb className="w-3.5 h-3.5" /> Request Hint
                </button>
                <button
                  onClick={() => handleAskTutor(false)}
                  disabled={loadingTutor || !tutorQuestion.trim()}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-extrabold px-5 py-2 rounded text-xs flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(16,185,129,0.4)] cursor-pointer"
                >
                  {loadingTutor ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>TUTOR THINKING...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>EXPLAIN STEP-BY-STEP</span>
                    </>
                  )}
                </button>
              </div>

              {/* Response */}
              {tutorResponse && (
                <div className="bg-[#05080c] border border-emerald-900 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
                    <span className="font-bold text-emerald-300 text-xs">TUTOR STEP-BY-STEP EXPLANATION</span>
                    <button
                      onClick={() => handleCopyText(tutorResponse)}
                      className="p-1 text-zinc-400 hover:text-emerald-300 rounded"
                    >
                      {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="text-xs text-emerald-100 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto pr-1">
                    {tutorResponse}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TOOL 6: ASK YOUR NOTES */}
        {/* ================================================================= */}
        {activeTool === 'ask_notes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
              <div className="flex items-center gap-2">
                <MessageSquareQuote className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs text-emerald-300 uppercase tracking-wider">
                  ASK YOUR UPLOADED NOTES (GROUNDED QA)
                </h3>
              </div>
            </div>

            {!uploadedDocText ? (
              <div className="bg-[#080d14] border border-amber-800/80 p-4 rounded-lg text-amber-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>NO STUDY DOCUMENT UPLOADED YET</span>
                </div>
                <p className="text-[11px] text-zinc-300">
                  Please go to the <strong>Upload Notes &amp; PDFs</strong> tab first to upload your textbook PDF or study notes.
                </p>
                <button
                  onClick={() => selectTool('upload')}
                  className="bg-amber-500 text-black font-bold text-xs px-3 py-1 rounded hover:bg-amber-400"
                >
                  Go to Upload Tab →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                  <span>Searching in:</span>
                  <code className="text-emerald-300 bg-black px-2 py-0.5 rounded border border-emerald-950 font-bold">
                    {uploadedDocName}
                  </code>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={notesQuestion}
                    onChange={(e) => setNotesQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskNotes()}
                    placeholder="e.g. Explain the 3rd chapter concept or find the formula for acceleration..."
                    className="flex-1 bg-black border border-emerald-900 rounded px-3 py-2 text-xs text-emerald-200 outline-none focus:border-emerald-400"
                  />
                  <button
                    onClick={handleAskNotes}
                    disabled={loadingNotesQa || !notesQuestion.trim()}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-5 py-2 rounded text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950 cursor-pointer"
                  >
                    {loadingNotesQa ? 'SEARCHING...' : 'ASK NOTES'}
                  </button>
                </div>

                {notesQaResult && (
                  <div className="bg-[#05080c] border border-emerald-900 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
                      <span className="font-bold text-xs text-emerald-300">
                        {notesQaResult.foundInNotes ? '✓ ANSWER FOUND IN NOTES' : '💡 GENERAL KNOWLEDGE CONTEXT'}
                      </span>
                      <button
                        onClick={() => handleCopyText(notesQaResult.answer)}
                        className="p-1 text-zinc-400 hover:text-emerald-300 rounded"
                      >
                        {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="text-xs text-emerald-100 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto pr-1">
                      {notesQaResult.answer}
                    </div>

                    {notesQaResult.citations.length > 0 && (
                      <div className="pt-2 border-t border-emerald-950/80 text-[10px] text-zinc-400 flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-emerald-500">CITATIONS / PASSAGES:</span>
                        {notesQaResult.citations.map((c, idx) => (
                          <span key={idx} className="bg-black border border-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-mono">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TOOL 7: CHAPTER NOTES MAKER */}
        {/* ================================================================= */}
        {activeTool === 'chapter_notes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
              <div className="flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs text-emerald-300 uppercase tracking-wider">
                  CHAPTER NOTES MAKER
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-zinc-500 block font-bold">SUBJECT:</label>
                <input
                  type="text"
                  value={chapterSubject}
                  onChange={(e) => setChapterSubject(e.target.value)}
                  className="w-full bg-black border border-emerald-900 rounded px-2.5 py-1.5 text-xs text-emerald-300 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 block font-bold">GRADE LEVEL:</label>
                <select
                  value={chapterGrade}
                  onChange={(e) => setChapterGrade(e.target.value)}
                  className="w-full bg-black border border-emerald-900 rounded px-2.5 py-1.5 text-xs text-emerald-300 outline-none"
                >
                  <option value="Middle School (Grade 6-8)">Middle School (Grade 6-8)</option>
                  <option value="High School (Grade 9-12)">High School (Grade 9-12)</option>
                  <option value="College / Undergraduate">College / Undergraduate</option>
                  <option value="Postgraduate / Professional">Postgraduate / Professional</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 block font-bold">CHAPTER TITLE / TOPIC:</label>
              <input
                type="text"
                value={chapterTopic}
                onChange={(e) => setChapterTopic(e.target.value)}
                placeholder="e.g. Chapter 4: Photosynthesis and Cellular Respiration"
                className="w-full bg-black border border-emerald-900 rounded px-3 py-2 text-xs text-emerald-300 outline-none focus:border-emerald-400"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleGenerateChapterNotes}
                disabled={loadingChapterNotes || (!chapterTopic && !uploadedDocText)}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-5 py-2 rounded text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950 cursor-pointer"
              >
                {loadingChapterNotes ? 'GENERATING CHAPTER NOTES...' : 'GENERATE CHAPTER NOTES'}
              </button>
            </div>

            {chapterNotesResult && (
              <div className="bg-[#05080c] border border-emerald-900 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
                  <span className="font-bold text-xs text-emerald-300">STRUCTURED CHAPTER GUIDE</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadContent('Chapter_Notes', chapterNotesResult, 'docx')}
                      className="text-[10px] bg-black border border-blue-900 text-blue-300 hover:bg-blue-950 px-2 py-0.5 rounded"
                    >
                      .DOCX
                    </button>
                    <button
                      onClick={() => handleDownloadContent('Chapter_Notes', chapterNotesResult, 'pdf')}
                      className="text-[10px] bg-black border border-red-900 text-red-300 hover:bg-red-950 px-2 py-0.5 rounded"
                    >
                      .PDF
                    </button>
                  </div>
                </div>

                <div className="text-xs text-emerald-100 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto pr-1 font-mono">
                  {chapterNotesResult}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TOOL 8: EXAM PRACTICE */}
        {/* ================================================================= */}
        {activeTool === 'exam_practice' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs text-emerald-300 uppercase tracking-wider">
                  MOCK EXAM PRACTICE PAPER GENERATOR
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-zinc-500 block font-bold">EXAM TYPE:</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full bg-black border border-emerald-900 rounded px-2.5 py-1.5 text-xs text-emerald-300 outline-none"
                >
                  <option value="Midterm Exam">Midterm Exam</option>
                  <option value="Final Exam">Final Comprehensive Exam</option>
                  <option value="Competitive Entrance Test">Competitive Entrance Test</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block font-bold">SYLLABUS / TOPIC:</label>
                <input
                  type="text"
                  value={examTopic}
                  onChange={(e) => setExamTopic(e.target.value)}
                  placeholder="e.g. Organic Chemistry / World War II History"
                  className="w-full bg-black border border-emerald-900 rounded px-3 py-1.5 text-xs text-emerald-300 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleGenerateExamPractice}
                disabled={loadingExamPaper}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-5 py-2 rounded text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950 cursor-pointer"
              >
                {loadingExamPaper ? 'CREATING EXAM PAPER...' : 'GENERATE EXAM PAPER'}
              </button>
            </div>

            {examPaperResult && (
              <div className="bg-[#05080c] border border-emerald-900 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
                  <span className="font-bold text-xs text-emerald-300">MOCK EXAM PAPER &amp; MARKING SCHEME</span>
                  <button
                    onClick={() => handleDownloadContent('Exam_Paper', examPaperResult, 'pdf')}
                    className="text-[10px] bg-black border border-red-900 text-red-300 hover:bg-red-950 px-2 py-0.5 rounded"
                  >
                    Download .PDF
                  </button>
                </div>

                <div className="text-xs text-emerald-100 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto pr-1">
                  {examPaperResult}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TOOL 9: STUDY PLANNER */}
        {/* ================================================================= */}
        {activeTool === 'planner' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs text-emerald-300 uppercase tracking-wider">
                  PERSONALIZED STUDY ROADMAP &amp; TIMETABLE
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[10px] text-zinc-500 block font-bold">SUBJECTS &amp; SYLLABUS:</label>
                <input
                  type="text"
                  value={plannerSubjects}
                  onChange={(e) => setPlannerSubjects(e.target.value)}
                  className="w-full bg-black border border-emerald-900 rounded px-3 py-1.5 text-xs text-emerald-300 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500 block font-bold">DAILY HOURS:</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={plannerHours}
                    onChange={(e) => setPlannerHours(Number(e.target.value))}
                    className="w-full bg-black border border-emerald-900 rounded px-2.5 py-1.5 text-xs text-emerald-300 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 block font-bold">DAYS TO EXAM:</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={plannerDays}
                    onChange={(e) => setPlannerDays(Number(e.target.value))}
                    className="w-full bg-black border border-emerald-900 rounded px-2.5 py-1.5 text-xs text-emerald-300 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleGenerateStudyPlan}
                disabled={loadingPlanner}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-5 py-2 rounded text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950 cursor-pointer"
              >
                {loadingPlanner ? 'GENERATING TIMETABLE...' : 'CREATE STUDY PLAN'}
              </button>
            </div>

            {/* Timetable Tasks List */}
            {plannerResult && (
              <div className="bg-[#05080c] border border-emerald-900 rounded-lg p-4 space-y-3">
                <div className="border-b border-emerald-950 pb-2">
                  <h4 className="font-bold text-xs text-emerald-300">{plannerResult.planTitle}</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{plannerResult.scheduleSummary}</p>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {plannerResult.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTaskCompletion(task.id)}
                      className={`p-2.5 border rounded flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        task.completed
                          ? 'bg-emerald-950/40 border-emerald-700/80 text-emerald-300 line-through'
                          : 'bg-black border-emerald-950 text-emerald-100 hover:border-emerald-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => {}}
                          className="accent-emerald-500"
                        />
                        <div>
                          <div className="font-bold text-xs">{task.taskTitle}</div>
                          <div className="text-[10px] text-zinc-500">
                            {task.day} • {task.subject} ({task.durationMinutes} mins)
                          </div>
                        </div>
                      </div>

                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        task.priority === 'high' ? 'bg-red-950 text-red-400' : 'bg-zinc-900 text-zinc-400'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TOOL 10: PROGRESS TRACKER */}
        {/* ================================================================= */}
        {activeTool === 'progress' && (
          <div className="space-y-4">
            <div className="border-b border-emerald-950 pb-2">
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                STUDENT PROGRESS &amp; ACTIVITY ANALYTICS
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Real-time tracking of active recall flashcards, quiz scores, and daily timetable completion.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-[#070d14] border border-emerald-950 p-4 rounded-lg space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold block">FLASHCARDS REVIEWED</span>
                <span className="text-2xl font-extrabold text-emerald-400">{progressStats.flashcardsReviewed}</span>
                <span className="text-[10px] text-zinc-400 block">Active Recall Cards</span>
              </div>

              <div className="bg-[#070d14] border border-emerald-950 p-4 rounded-lg space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold block">QUIZZES COMPLETED</span>
                <span className="text-2xl font-extrabold text-cyan-400">{progressStats.quizzesCompleted}</span>
                <span className="text-[10px] text-zinc-400 block">Evaluated Tests</span>
              </div>

              <div className="bg-[#070d14] border border-emerald-950 p-4 rounded-lg space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold block">QUIZ AVERAGE ACCURACY</span>
                <span className="text-2xl font-extrabold text-amber-400">{progressStats.quizAveragePct}%</span>
                <span className="text-[10px] text-zinc-400 block">Knowledge Retention</span>
              </div>

              <div className="bg-[#070d14] border border-emerald-950 p-4 rounded-lg space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold block">STUDY TASKS COMPLETED</span>
                <span className="text-2xl font-extrabold text-indigo-400">{progressStats.tasksCompleted}</span>
                <span className="text-[10px] text-zinc-400 block">Timetable Goals</span>
              </div>
            </div>

            <div className="bg-[#05080c] border border-emerald-900 rounded-lg p-4 space-y-2">
              <h4 className="font-bold text-xs text-emerald-300">RETENTION RECOMMENDATIONS</h4>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                {progressStats.flashcardsReviewed < 10
                  ? '• Start by generating flashcards from your uploaded study materials to boost active recall.'
                  : '• Great job reviewing flashcards! Try taking a Quiz Generator evaluation next.'}
              </p>
            </div>
          </div>
        )}

      </div>
    </ModalWrapper>
  );
};
