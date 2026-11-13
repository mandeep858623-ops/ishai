import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

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

const modelsToTry = [
  'gemini-4-hydrogen',
  'gemini-3.1-flash-lite',
];

export interface FocusCoachParams {
  taskTitle: string;
  taskDescription?: string;
  userRoutine?: string;
  totalTasksCount?: number;
  completedTasksCount?: number;
}

/**
 * AI Focus Coach for breaking down tasks and advising productivity strategies
 */
export async function getFocusCoachAdvice(params: FocusCoachParams): Promise<string> {
  const { taskTitle, taskDescription, userRoutine = 'Pomodoro (25m work / 5m break)', totalTasksCount = 0, completedTasksCount = 0 } = params;

  const systemInstruction = `You are SUPERAI Focus Studio AI Productivity Coach.
Your goal is to help the user break down complex tasks into actionable steps, recommend optimal focus session structures, and provide encouraging coaching.

Context:
- Current Task: "${taskTitle}"
- Description: "${taskDescription || 'None'}"
- User Routine: "${userRoutine}"
- Active Tasks Progress: ${completedTasksCount}/${totalTasksCount} completed

Guidelines:
1. Provide a structured checklist (3-5 concrete steps).
2. Recommend the best session duration (e.g. 25m Pomodoro or 45m Deep Work).
3. Offer a brief, high-energy motivational tip.
4. Keep formatting clean with Markdown headers and bullet points.`;

  const prompt = `Help me plan and break down my focus session for: "${taskTitle}"`;

  try {
    const ai = getAIClient();
    for (const model of modelsToTry) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI response timed out')), 10000)
        );
        const callPromise = ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
          },
        });

        const response = (await Promise.race([callPromise, timeoutPromise])) as any;
        if (response && response.text && response.text.trim()) {
          return response.text.trim();
        }
      } catch (err: any) {
        const msg = err?.message || String(err);
        console.warn(`[Focus Coach] Model ${model} failed:`, msg);
        if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
          break;
        }
      }
    }
  } catch (clientErr: any) {
    console.warn('[Focus Coach] Gemini client init error:', clientErr?.message);
  }

  // Deterministic fallback if AI model is unavailable
  return `### 🎯 AI Focus Coach: Strategy for "${taskTitle}"\n\n` +
    `#### 📋 Actionable Breakdown:\n` +
    `1. **Phase 1 (Preparation & Scope)**: Review requirements, gather resources, and eliminate distractions.\n` +
    `2. **Phase 2 (Deep Execution)**: Run a single 25-minute Pomodoro focused strictly on primary implementation.\n` +
    `3. **Phase 3 (Review & Refine)**: Evaluate progress and commit completed milestones.\n\n` +
    `💡 **Coach Tip**: Consistency beats intensity. Stick to your chosen routine ("${userRoutine}") and take a short break when the timer rings!`;
}
