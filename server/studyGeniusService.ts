import { GoogleGenAI } from '@google/genai';
import { createRequire } from 'module';
import dotenv from 'dotenv';

dotenv.config();

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

function getAIClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const modelsToTry = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];

/**
 * Extract clean text from PDF Buffer using pdf-parse
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<{
  text: string;
  numpages: number;
  info?: any;
}> {
  try {
    const data = await pdfParse(buffer);
    const cleaned = (data.text || '')
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return {
      text: cleaned,
      numpages: data.numpages || 1,
      info: data.info,
    };
  } catch (err: any) {
    throw new Error(`PDF text extraction failed: ${err?.message || 'Corrupted or encrypted PDF'}`);
  }
}

// ---------------------------------------------------------------------------
// 1. AI SUMMARIZER
// ---------------------------------------------------------------------------
export async function summarizeStudyNotes(params: {
  text: string;
  mode: 'short' | 'detailed' | 'chapter_wise' | 'bullet_point' | 'definitions' | 'formulas_dates' | 'exam_revision';
  topic?: string;
  language?: string;
}): Promise<string> {
  const { text, mode, topic = '', language = 'English' } = params;

  let modeInstruction = 'Provide a clear, balanced summary of the study material.';
  switch (mode) {
    case 'short':
      modeInstruction = 'Provide a high-impact 3-4 paragraph executive summary highlighting core concepts.';
      break;
    case 'detailed':
      modeInstruction = 'Provide a detailed, comprehensive summary organized with clear section headings and thorough explanations.';
      break;
    case 'chapter_wise':
      modeInstruction = 'Provide a chapter-by-chapter / section-by-section structured summary with key takeaways per section.';
      break;
    case 'bullet_point':
      modeInstruction = 'Provide a crisp bullet-point summary grouped into thematic categories.';
      break;
    case 'definitions':
      modeInstruction = 'Extract all key terms, jargon, and definitions in a clear glossary format.';
      break;
    case 'formulas_dates':
      modeInstruction = 'Extract all critical formulas, equations, historical dates, key statistics, and crucial facts in a structured cheat-sheet format.';
      break;
    case 'exam_revision':
      modeInstruction = 'Create an intensive exam revision sheet with high-yield topics, memory mnemonics, common exam questions, and quick-recall points.';
      break;
  }

  const systemInstruction = `You are Study Genius, an elite academic AI tutor.
Your task is to generate study notes in ${language}.
${modeInstruction}
${topic ? `Focus Topic: ${topic}` : ''}

Format clearly with Markdown headings (##), bold text, and organized bullet points. Ensure accuracy and high academic quality.`;

  const promptContent = `Study Material:\n\n${text.substring(0, 12000)}`;

  for (const model of modelsToTry) {
    try {
      const response = await getAIClient().models.generateContent({
        model,
        contents: promptContent,
        config: {
          systemInstruction,
        },
      });

      if (response && response.text) {
        return response.text.trim();
      }
    } catch (err: any) {
      console.warn(`[StudyGenius Summarize] Model ${model} failed:`, err?.message);
    }
  }

  throw new Error('AI Summarizer service temporarily unavailable. Please try again.');
}

// ---------------------------------------------------------------------------
// 2. FLASHCARD GENERATOR
// ---------------------------------------------------------------------------
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export async function generateFlashcards(params: {
  text: string;
  count?: number;
  difficulty?: string;
  topic?: string;
  language?: string;
}): Promise<Flashcard[]> {
  const { text, count = 10, difficulty = 'medium', topic = '', language = 'English' } = params;

  const systemInstruction = `You are Study Genius Flashcard Master.
Create exactly ${count} study flashcards in ${language} based on the provided material.
Difficulty Level: ${difficulty}
${topic ? `Topic Focus: ${topic}` : ''}

You MUST return STRICT JSON in this format:
[
  {
    "id": "1",
    "front": "Clear question, term, or concept for the front of the card",
    "back": "Accurate, concise answer, definition, or explanation for the back",
    "category": "Sub-topic or Subject category",
    "difficulty": "easy | medium | hard"
  }
]
Only return valid JSON array without markdown code fences.`;

  const promptContent = `Source Text:\n\n${text.substring(0, 10000)}`;

  for (const model of modelsToTry) {
    try {
      const response = await getAIClient().models.generateContent({
        model,
        contents: promptContent,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      const raw = (response.text || '').replace(/^```json\s*/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => ({
          id: item.id || String(idx + 1),
          front: item.front || 'Concept Question',
          back: item.back || 'Concept Explanation',
          category: item.category || topic || 'General Study',
          difficulty: (item.difficulty || difficulty) as any,
        }));
      }
    } catch (err: any) {
      console.warn(`[StudyGenius Flashcards] Model ${model} failed:`, err?.message);
    }
  }

  throw new Error('Failed to generate flashcards.');
}

// ---------------------------------------------------------------------------
// 3. QUIZ GENERATOR
// ---------------------------------------------------------------------------
export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'true_false' | 'fill_blank' | 'short_answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  topicTag: string;
}

export async function generateQuiz(params: {
  text: string;
  count?: number;
  difficulty?: string;
  questionType?: string;
  topic?: string;
  language?: string;
}): Promise<QuizQuestion[]> {
  const { text, count = 5, difficulty = 'Medium', questionType = 'mcq', topic = '', language = 'English' } = params;

  const systemInstruction = `You are Study Genius Quiz Engine.
Create a real, comprehensive study quiz with exactly ${count} questions in ${language}.
Difficulty: ${difficulty}
Question Types to Include: ${questionType} (or mix of MCQ, True/False, Fill in Blank, Short Answer)
${topic ? `Topic Focus: ${topic}` : ''}

You MUST return STRICT JSON array in this format:
[
  {
    "id": "q1",
    "type": "mcq" | "true_false" | "fill_blank" | "short_answer",
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"], // Required for MCQ, ["True", "False"] for true_false
    "correctAnswer": "Option B" // Must match one of the options or exact correct phrase
    "explanation": "Detailed explanation of why this answer is correct and others are incorrect.",
    "topicTag": "Specific concept tag"
  }
]
Only return valid JSON array without markdown code fences.`;

  const promptContent = `Study Material:\n\n${text.substring(0, 10000)}`;

  for (const model of modelsToTry) {
    try {
      const response = await getAIClient().models.generateContent({
        model,
        contents: promptContent,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      const raw = (response.text || '').replace(/^```json\s*/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => ({
          id: item.id || `q_${idx + 1}`,
          type: item.type || 'mcq',
          question: item.question || 'Study Question',
          options: Array.isArray(item.options) ? item.options : undefined,
          correctAnswer: item.correctAnswer || 'Answer',
          explanation: item.explanation || 'Explanation provided.',
          topicTag: item.topicTag || topic || 'General',
        }));
      }
    } catch (err: any) {
      console.warn(`[StudyGenius Quiz] Model ${model} failed:`, err?.message);
    }
  }

  throw new Error('Failed to generate quiz questions.');
}

// ---------------------------------------------------------------------------
// 4. STEP-BY-STEP TUTOR
// ---------------------------------------------------------------------------
export async function runStepByStepTutor(params: {
  question: string;
  contextText?: string;
  userAnswer?: string;
  requestHint?: boolean;
  language?: string;
}): Promise<string> {
  const { question, contextText = '', userAnswer = '', requestHint = false, language = 'English' } = params;

  const systemInstruction = `You are Study Genius Step-by-Step AI Tutor.
Your mission is to guide students to deep understanding in ${language}.

Rules:
1. Break difficult concepts or math/science problems into clear, numbered logical steps.
2. Explain WHY each step is necessary.
3. Show relevant formulas, equations, and worked examples clearly using LaTeX/Markdown notation.
4. ${requestHint ? 'Provide a subtle, helpful HINT to guide the user without revealing the full solution immediately.' : ''}
5. ${userAnswer ? `Check the student's attempted answer: "${userAnswer}". Validate calculations, point out mistakes constructively, and explain how to fix them.` : ''}
6. Always maintain an encouraging, patient, age-appropriate academic tone.`;

  const prompt = `${contextText ? `Study Context:\n${contextText.substring(0, 4000)}\n\n` : ''}Student Question / Problem: "${question}"${userAnswer ? `\nStudent Attempt: "${userAnswer}"` : ''}`;

  for (const model of modelsToTry) {
    try {
      const response = await getAIClient().models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      if (response && response.text) {
        return response.text.trim();
      }
    } catch (err: any) {
      console.warn(`[StudyGenius Tutor] Model ${model} failed:`, err?.message);
    }
  }

  throw new Error('Tutor service temporarily unavailable.');
}

// ---------------------------------------------------------------------------
// 5. ASK YOUR NOTES (DOCUMENT QA)
// ---------------------------------------------------------------------------
export async function askYourNotes(params: {
  question: string;
  notesText: string;
  fileName?: string;
  language?: string;
}): Promise<{
  answer: string;
  foundInNotes: boolean;
  citations: string[];
}> {
  const { question, notesText, fileName = 'Uploaded Notes', language = 'English' } = params;

  if (!notesText || !notesText.trim()) {
    return {
      answer: 'No study document has been uploaded yet. Please upload a PDF or TXT file first, or type/paste notes into the Upload Notes tab.',
      foundInNotes: false,
      citations: [],
    };
  }

  const systemInstruction = `You are Study Genius Document QA Engine.
Answer the user's question strictly grounded in the provided Study Notes from "${fileName}" in ${language}.

Requirements:
1. Search the study notes thoroughly for passages related to the question.
2. Quote or reference specific sections/topics from the notes.
3. If the answer is clearly present in the notes, explain it thoroughly and set foundInNotes = true.
4. If the question CANNOT be answered from the uploaded study notes, explicitly state: "This topic is not explicitly mentioned in your uploaded study notes." Then, provide a helpful general academic explanation clearly distinguished under a "💡 General Knowledge Context" heading.
5. Never invent false references or fake page numbers.

Return STRICT JSON:
{
  "answer": "Complete Markdown response answering the student question",
  "foundInNotes": true | false,
  "citations": ["Passage or Section Title 1", "Key Term 2"]
}`;

  const prompt = `Uploaded Document Text:\n\n${notesText.substring(0, 14000)}\n\nStudent Question: "${question}"`;

  for (const model of modelsToTry) {
    try {
      const response = await getAIClient().models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      const raw = (response.text || '').replace(/^```json\s*/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.answer === 'string') {
        return {
          answer: parsed.answer,
          foundInNotes: Boolean(parsed.foundInNotes),
          citations: Array.isArray(parsed.citations) ? parsed.citations : [],
        };
      }
    } catch (err: any) {
      console.warn(`[StudyGenius AskNotes] Model ${model} failed:`, err?.message);
    }
  }

  return {
    answer: 'Failed to process document QA request.',
    foundInNotes: false,
    citations: [],
  };
}

// ---------------------------------------------------------------------------
// 6. CHAPTER NOTES MAKER
// ---------------------------------------------------------------------------
export async function generateChapterNotes(params: {
  topicOrText: string;
  subject?: string;
  gradeLevel?: string;
  language?: string;
}): Promise<string> {
  const { topicOrText, subject = 'General Science/Humanities', gradeLevel = 'High School / College', language = 'English' } = params;

  const systemInstruction = `You are Study Genius Master Curriculum & Chapter Notes Writer.
Generate structured, comprehensive chapter notes in ${language}.
Subject: ${subject}
Target Grade / Academic Level: ${gradeLevel}

You MUST follow this exact chapter structure:
# [Chapter Title]

## 🎯 Learning Objectives
- Objective 1
- Objective 2

## 📖 1. Core Concept Explanations
(Detailed, clear paragraph explanations with sub-headings)

## 🔑 2. Essential Definitions & Terminology
(Glossary style breakdown of key terms)

## 📊 3. Key Formulas, Equations & Facts
(Tables, equations, and critical data points)

## 💡 4. Real-World Applications & Examples
(Practical examples demonstrating the concepts)

## 📝 5. Chapter Review Questions
(5 practice questions ranging from recall to analytical)

## ⚡ Quick Revision Summary
(Bullet points for last-minute exam review)`;

  const prompt = `Topic / Source Material:\n\n${topicOrText.substring(0, 10000)}`;

  for (const model of modelsToTry) {
    try {
      const response = await getAIClient().models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      if (response && response.text) {
        return response.text.trim();
      }
    } catch (err: any) {
      console.warn(`[StudyGenius ChapterNotes] Model ${model} failed:`, err?.message);
    }
  }

  throw new Error('Failed to generate chapter notes.');
}

// ---------------------------------------------------------------------------
// 7. EXAM PRACTICE SET GENERATOR
// ---------------------------------------------------------------------------
export async function generateExamPractice(params: {
  topicOrText: string;
  examType?: string;
  difficulty?: string;
  language?: string;
}): Promise<string> {
  const { topicOrText, examType = 'Midterm / Final Exam', difficulty = 'Medium-Hard', language = 'English' } = params;

  const systemInstruction = `You are Study Genius Exam Creator.
Generate a realistic, exam-style practice paper in ${language}.
Exam Style: ${examType}
Difficulty: ${difficulty}

Format into clear sections with mark allocation:
# 📝 EXAM PRACTICE PAPER: ${topicOrText.substring(0, 50)}
Time Allowed: 60 Minutes | Total Marks: 50

## SECTION A: Multiple Choice Questions (10 Marks)
(5 MCQs, 2 marks each)

## SECTION B: Short Answer Conceptual Questions (15 Marks)
(3 questions, 5 marks each requiring 3-4 sentence answers)

## SECTION C: Problem Solving & Analytical Questions (15 Marks)
(2 multi-part application or calculation problems)

## SECTION D: Long Answer / Essay Question (10 Marks)
(1 comprehensive synthesis question)

---
## 🗝️ OFFICIAL ANSWER KEY & SCORING MARK SCHEME
(Complete step-by-step solutions, mark breakdowns, and rubric criteria for full points)`;

  const prompt = `Source Material / Syllabus:\n\n${topicOrText.substring(0, 10000)}`;

  for (const model of modelsToTry) {
    try {
      const response = await getAIClient().models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      if (response && response.text) {
        return response.text.trim();
      }
    } catch (err: any) {
      console.warn(`[StudyGenius Exam] Model ${model} failed:`, err?.message);
    }
  }

  throw new Error('Failed to generate exam practice set.');
}

// ---------------------------------------------------------------------------
// 8. STUDY PLANNER
// ---------------------------------------------------------------------------
export interface StudyTask {
  id: string;
  day: string;
  subject: string;
  taskTitle: string;
  durationMinutes: number;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export async function generateStudyPlan(params: {
  subjectsAndTopics: string;
  dailyHoursAvailable?: number;
  daysUntilExam?: number;
  language?: string;
}): Promise<{
  planTitle: string;
  scheduleSummary: string;
  tasks: StudyTask[];
}> {
  const { subjectsAndTopics, dailyHoursAvailable = 3, daysUntilExam = 14, language = 'English' } = params;

  const systemInstruction = `You are Study Genius Productivity & Schedule Architect.
Create a realistic, actionable ${daysUntilExam}-day study timetable in ${language}.
Daily Hours Available: ${dailyHoursAvailable} Hours/day
Target Exam Horizon: ${daysUntilExam} Days

Return STRICT JSON:
{
  "planTitle": "Structured ${daysUntilExam}-Day Study Roadmap",
  "scheduleSummary": "Executive strategy summary for optimal retention and active recall",
  "tasks": [
    {
      "id": "t1",
      "day": "Day 1 (Monday)",
      "subject": "Subject Name",
      "taskTitle": "Clear, specific study task or topic breakdown",
      "durationMinutes": 45,
      "completed": false,
      "priority": "high | medium | low"
    }
  ]
}
Only return valid JSON array without markdown fences.`;

  const prompt = `Subjects, Syllabus & Weak Areas:\n${subjectsAndTopics}`;

  for (const model of modelsToTry) {
    try {
      const response = await getAIClient().models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      const raw = (response.text || '').replace(/^```json\s*/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(raw);

      if (parsed && Array.isArray(parsed.tasks)) {
        return {
          planTitle: parsed.planTitle || 'Study Timetable',
          scheduleSummary: parsed.scheduleSummary || 'Personalized study schedule',
          tasks: parsed.tasks.map((t: any, i: number) => ({
            id: t.id || `task_${i + 1}`,
            day: t.day || `Day ${i + 1}`,
            subject: t.subject || 'Study Subject',
            taskTitle: t.taskTitle || 'Review Chapter',
            durationMinutes: Number(t.durationMinutes) || 45,
            completed: Boolean(t.completed),
            priority: (t.priority || 'medium') as any,
          })),
        };
      }
    } catch (err: any) {
      console.warn(`[StudyGenius Planner] Model ${model} failed:`, err?.message);
    }
  }

  throw new Error('Failed to generate study plan.');
}
