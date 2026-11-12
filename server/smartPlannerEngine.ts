import { GoogleGenAI } from '@google/genai';

export interface PlanTimeBlock {
  id: string;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "10:30"
  title: string;
  category: 'Study' | 'Work' | 'Personal' | 'Projects' | 'Health' | 'Break';
  durationMinutes: number;
  isBreak?: boolean;
  notes?: string;
}

export interface ProposedTask {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'Study' | 'Work' | 'Personal' | 'Projects';
  dueDate?: string;
  estimatedMinutes?: number;
}

export interface SmartPlanResult {
  summary: string;
  clarificationPrompt?: string;
  timeBlocks: PlanTimeBlock[];
  tasks: ProposedTask[];
  tips: string[];
}

export async function generateSmartPlan({
  prompt,
  currentTasks = [],
  currentDate,
  aiClient,
}: {
  prompt: string;
  currentTasks?: Array<{ title: string; category?: string; priority?: string; isDone?: boolean }>;
  currentDate?: string;
  aiClient: GoogleGenAI;
}): Promise<SmartPlanResult> {
  const dateStr = currentDate || new Date().toISOString().split('T')[0];

  const systemInstruction = `You are the lead Executive AI Productivity Planner for SUPERAI's Smart Planner.
Your role is to build practical, realistic, conflict-free daily and weekly schedules and task breakdowns.

RULES:
1. NO OVERLAPPING TIME BLOCKS: Ensure startTime and endTime for consecutive blocks do not overlap.
2. REALISTIC PACING: Always include buffer time, short breaks (10-15m), and meal intervals (30-60m). Avoid burnout schedules.
3. ACTIONABLE STEPS: Break large vague goals into concrete, bite-sized tasks with realistic time estimates.
4. CLARIFICATION: If the prompt is missing critical context (e.g., specific exam subjects or deadlines), provide a strong default schedule, but also formulate a brief helpful clarification suggestion.
5. STRICT JSON OUTPUT: Return ONLY a valid JSON object matching the requested schema.`;

  const existingTasksContext = currentTasks && currentTasks.length > 0
    ? `Current pending tasks on the user's board:\n${currentTasks.slice(0, 8).map(t => `- [${t.priority || 'medium'}] ${t.title} (${t.category || 'Work'})`).join('\n')}`
    : 'No current tasks on board.';

  const userPrompt = `Today's Date: ${dateStr}
User Request: "${prompt}"

Context of existing board tasks:
${existingTasksContext}

Generate an optimal schedule and task action items in JSON format:
{
  "summary": "Concise 1-2 sentence overview explaining the structure and strategy of this plan.",
  "clarificationPrompt": "Optional question or guidance if more details (e.g. exact exam dates, available hours) would refine the plan further. Leave empty string if fully specified.",
  "timeBlocks": [
    {
      "id": "block_1",
      "startTime": "09:00",
      "endTime": "10:30",
      "title": "Specific focus item",
      "category": "Study",
      "durationMinutes": 90,
      "isBreak": false,
      "notes": "Actionable guidance"
    },
    {
      "id": "block_2",
      "startTime": "10:30",
      "endTime": "10:45",
      "title": "Hydration & Cognitive Break",
      "category": "Break",
      "durationMinutes": 15,
      "isBreak": true,
      "notes": "Step away from screen"
    }
  ],
  "tasks": [
    {
      "title": "Concrete task name",
      "description": "Short explanation",
      "priority": "high",
      "category": "Study",
      "dueDate": "${dateStr}",
      "estimatedMinutes": 45
    }
  ],
  "tips": [
    "Practical productivity advice tailored to this schedule"
  ]
}`;

  const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

  for (const model of models) {
    try {
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
      const callPromise = aiClient.models.generateContent({
        model,
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const response: any = await Promise.race([callPromise, timeoutPromise]);

      if (response && response.text) {
        const clean = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(clean);
        return {
          summary: parsed.summary || 'Custom plan generated.',
          clarificationPrompt: parsed.clarificationPrompt || undefined,
          timeBlocks: Array.isArray(parsed.timeBlocks) ? parsed.timeBlocks : [],
          tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
          tips: Array.isArray(parsed.tips) ? parsed.tips : [],
        };
      }
    } catch (err: any) {
      console.warn(`Smart plan generation with ${model} failed:`, err?.message || err);
    }
  }

  // Graceful structured fallback
  return {
    summary: `Structured productivity schedule organized for: ${prompt}`,
    timeBlocks: [
      { id: 'b1', startTime: '09:00', endTime: '10:30', title: 'Deep Work: High-Priority Deliverable', category: 'Work', durationMinutes: 90, isBreak: false, notes: 'Focus with zero notifications.' },
      { id: 'b2', startTime: '10:30', endTime: '10:45', title: 'Rest & Stretch Break', category: 'Break', durationMinutes: 15, isBreak: true },
      { id: 'b3', startTime: '10:45', endTime: '12:30', title: 'Secondary Task Execution & Review', category: 'Work', durationMinutes: 105, isBreak: false },
      { id: 'b4', startTime: '12:30', endTime: '13:30', title: 'Lunch & Recharge Interval', category: 'Break', durationMinutes: 60, isBreak: true },
      { id: 'b5', startTime: '13:30', endTime: '15:30', title: 'Project Progress & Collaborative Sprint', category: 'Projects', durationMinutes: 120, isBreak: false },
      { id: 'b6', startTime: '15:30', endTime: '15:45', title: 'Short Walk Break', category: 'Break', durationMinutes: 15, isBreak: true },
      { id: 'b7', startTime: '15:45', endTime: '17:00', title: 'Daily Wrap-up, Inbox Zero & Next Day Prep', category: 'Personal', durationMinutes: 75, isBreak: false },
    ],
    tasks: [
      { title: `Complete primary focus milestone for ${prompt.slice(0, 30)}`, priority: 'high', category: 'Work', dueDate: dateStr, estimatedMinutes: 60 },
      { title: 'Review deadlines and sync deliverables', priority: 'medium', category: 'Work', dueDate: dateStr, estimatedMinutes: 30 },
      { title: 'Organize study/work reference notes', priority: 'low', category: 'Study', dueDate: dateStr, estimatedMinutes: 20 },
    ],
    tips: [
      'Use the 90-minute focus block for your hardest task when willpower is highest.',
      'Take genuine breaks away from screens to prevent cognitive fatigue.',
    ],
  };
}

export async function breakdownTaskSteps({
  taskTitle,
  taskDescription,
  deadline,
  aiClient,
}: {
  taskTitle: string;
  taskDescription?: string;
  deadline?: string;
  aiClient: GoogleGenAI;
}): Promise<Array<{ title: string; estimatedMinutes: number; priority: 'low' | 'medium' | 'high' }>> {
  const prompt = `Break down this task into 3 to 6 logical, chronological, actionable micro-steps:
Task: "${taskTitle}"
${taskDescription ? `Description: "${taskDescription}"` : ''}
${deadline ? `Deadline: ${deadline}` : ''}

Output JSON format:
{
  "steps": [
    { "title": "Clear step action", "estimatedMinutes": 30, "priority": "high" }
  ]
}`;

  try {
    const res = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    if (res && res.text) {
      const clean = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed.steps) && parsed.steps.length > 0) {
        return parsed.steps;
      }
    }
  } catch (err: any) {
    console.warn('Breakdown failed:', err?.message || err);
  }

  return [
    { title: `Define specifications and gather resources for ${taskTitle}`, estimatedMinutes: 20, priority: 'high' },
    { title: `Draft initial implementation / core solution`, estimatedMinutes: 60, priority: 'high' },
    { title: `Review, test, and polish final deliverable`, estimatedMinutes: 30, priority: 'medium' },
  ];
}

export async function generateProjectPlanRoadmap({
  projectName,
  description,
  targetDate,
  aiClient,
}: {
  projectName: string;
  description: string;
  targetDate: string;
  aiClient: GoogleGenAI;
}): Promise<Array<{ title: string; targetDate: string; tasks: string[] }>> {
  const prompt = `Create a structured milestone roadmap for this project:
Project: "${projectName}"
Goal / Description: "${description}"
Target Date: ${targetDate}

Return 3 to 5 realistic milestone phases with target dates leading up to ${targetDate}.
Output JSON format:
{
  "milestones": [
    {
      "title": "Phase 1: Research & Discovery",
      "targetDate": "YYYY-MM-DD",
      "tasks": [
        "Task 1",
        "Task 2"
      ]
    }
  ]
}`;

  try {
    const res = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    if (res && res.text) {
      const clean = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed.milestones) && parsed.milestones.length > 0) {
        return parsed.milestones;
      }
    }
  } catch (err: any) {
    console.warn('Project plan failed:', err?.message || err);
  }

  return [
    {
      title: 'Phase 1: Scoping & Setup',
      targetDate: targetDate,
      tasks: ['Define scope and key deliverables', 'Setup tools and gather assets'],
    },
    {
      title: 'Phase 2: Core Execution',
      targetDate: targetDate,
      tasks: ['Build primary components', 'Conduct initial review'],
    },
    {
      title: 'Phase 3: Final Delivery',
      targetDate: targetDate,
      tasks: ['Final quality check', 'Deliver and document outcome'],
    },
  ];
}
