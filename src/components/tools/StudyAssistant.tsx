import React, { useState } from 'react';
import { streamAiCompletion, generateAiCompletion } from '../../utils/aiClient';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { GraduationCap, BookOpen, Layers, CheckCircle, HelpCircle, Square, RotateCcw } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const StudyAssistant: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('University / Advanced');
  const [mode, setMode] = useState<'explain' | 'flashcards' | 'quiz' | 'cheatsheet'>('explain');
  const [output, setOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Interactive Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const levels = ['Middle / High School', 'Undergraduate / College', 'University / Advanced', 'Explain Like I am 10'];

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setOutput('');
    setQuizQuestions([]);
    setSelectedAnswers({});
    setShowResults(false);

    if (mode === 'quiz') {
      try {
        const prompt = `Create a 4-question multiple choice quiz on the topic: "${topic}" suitable for ${level} level.
Return strictly valid JSON in this exact structure without markdown backticks:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct."
    }
  ]
}`;
        const rawJson = await generateAiCompletion({
          prompt,
          systemInstruction: 'You are an educational assessment expert. Return ONLY raw JSON without markdown formatting or code blocks.',
        });

        // Clean any code block fencing if model added it
        const cleaned = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.questions && Array.isArray(parsed.questions)) {
          setQuizQuestions(parsed.questions);
        } else {
          setOutput(rawJson);
        }
      } catch (err: any) {
        setOutput(`Failed to generate interactive quiz: ${err.message}. Please retry.`);
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    let systemInstruction = `You are SUPERAI Study Assistant, an elite academic tutor and pedagogy specialist.
Audience Level: ${level}
Pedagogy Mode: ${mode}
Provide clear, engaging, conceptually sound explanations using analogies, intuitive breakdowns, and key terminology definitions.`;

    let userPrompt = '';
    if (mode === 'explain') {
      userPrompt = `Please teach and explain this concept thoroughly using the Feynman technique (clear intuition, step-by-step mechanism, real-world analogies, and common misconceptions):\nTopic: ${topic}`;
    } else if (mode === 'flashcards') {
      userPrompt = `Please create a high-yield study flashcard deck (at least 6-8 core cards) for: "${topic}". Format each card with "Card [Number]", Front / Question / Concept, and Back / Detailed High-Yield Answer.`;
    } else if (mode === 'cheatsheet') {
      userPrompt = `Please generate an ultra-dense, comprehensive revision Cheat Sheet for exam prep on: "${topic}". Include core formulas, fundamental rules, must-remember terms, and high-yield pitfalls.`;
    }

    const controller = streamAiCompletion(
      {
        prompt: userPrompt,
        systemInstruction,
      },
      {
        onChunk: (chunk) => {
          setOutput((prev) => prev + chunk);
        },
        onDone: () => {
          setIsGenerating(false);
          setAbortController(null);
        },
        onError: (err) => {
          setOutput((prev) => prev + `\n\n*[Error: ${err}]*`);
          setIsGenerating(false);
          setAbortController(null);
        },
      }
    );

    setAbortController(controller);
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  const handleSelectOption = (qIdx: number, oIdx: number) => {
    if (showResults) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: oIdx }));
  };

  const calculateScore = () => {
    let score = 0;
    quizQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) score++;
    });
    return score;
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">AI Study Assistant & Tutor</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Master difficult subjects, test comprehension with interactive quizzes, and build study flashcards.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Target Level:</span>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            {levels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mode selectors */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'explain', label: 'Concept Deep Dive (Feynman)', icon: BookOpen },
          { id: 'flashcards', label: 'Flashcard Deck', icon: Layers },
          { id: 'quiz', label: 'Interactive Assessment Quiz', icon: HelpCircle },
          { id: 'cheatsheet', label: 'Exam Cheat Sheet', icon: CheckCircle },
        ].map((m) => {
          const Icon = m.icon;
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                isActive
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Input container */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur space-y-3">
        <div>
          <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
            Subject, Topic, or Syllabus Unit
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="E.g., Quantum Entanglement, Cellular Respiration, Keynesian Economics, Transformers in Machine Learning..."
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            />
            {!isGenerating ? (
              <button
                onClick={handleGenerate}
                disabled={!topic.trim()}
                className="bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium text-xs px-5 py-2.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Synthesize Study Material
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="bg-red-600/80 hover:bg-red-600 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Stop
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Output / Interactive Quiz View */}
      {quizQuestions.length > 0 ? (
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="font-semibold text-sm text-zinc-200">
              Interactive Mastery Quiz: {topic}
            </h3>
            {showResults && (
              <span className="text-xs font-bold text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-800">
                Score: {calculateScore()} / {quizQuestions.length} ({Math.round((calculateScore() / quizQuestions.length) * 100)}%)
              </span>
            )}
          </div>

          <div className="space-y-6">
            {quizQuestions.map((q, qIdx) => {
              const selected = selectedAnswers[qIdx];
              return (
                <div key={qIdx} className="space-y-3 p-4 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                  <p className="text-sm font-medium text-zinc-200">
                    <span className="text-amber-400 font-bold mr-2">Q{qIdx + 1}.</span>
                    {q.question}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, oIdx) => {
                      const isSelected = selected === oIdx;
                      const isCorrect = q.correctIndex === oIdx;

                      let btnStyle = 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300';
                      if (showResults) {
                        if (isCorrect) btnStyle = 'border-emerald-600 bg-emerald-950/40 text-emerald-300 font-semibold';
                        else if (isSelected && !isCorrect)
                          btnStyle = 'border-red-600 bg-red-950/40 text-red-300';
                      } else if (isSelected) {
                        btnStyle = 'border-amber-500 bg-amber-500/15 text-amber-300 font-semibold';
                      }

                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelectOption(qIdx, oIdx)}
                          className={`text-left p-3 rounded-lg border text-xs transition-colors cursor-pointer flex items-center gap-2 ${btnStyle}`}
                        >
                          <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {showResults && (
                    <div className="mt-2 p-2.5 rounded bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400 leading-relaxed">
                      <strong className="text-zinc-300">Explanation: </strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            {!showResults ? (
              <button
                onClick={() => setShowResults(true)}
                disabled={Object.keys(selectedAnswers).length === 0}
                className="bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium text-xs px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Submit Answers & Evaluate
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                className="flex items-center gap-2 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Generate New Quiz
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 min-h-[350px]">
          {output ? (
            <MarkdownRenderer content={output} className="text-zinc-200 text-sm leading-relaxed" />
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
              <GraduationCap className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm font-medium text-zinc-400">Study materials will be generated here</p>
              <p className="text-xs text-zinc-600 max-w-sm mt-1">
                Enter any academic topic or unit to generate intuitive Feynman breakdowns, study flashcards, or exam revision cheat sheets.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
