import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION = `
You are the SUPERAI OS Smart Planning Assistant. 
Your goal is to help users organize their tasks, calendar events, habits, and milestones into a realistic timeline.

Guidelines:
1. Be direct, professional, and efficient (SuperAI OS style).
2. Suggest chronological slots for tasks and habits.
3. Identify overlaps and suggest resolutions.
4. Break large goals into sub-steps.
5. Consider upcoming milestones (countdowns) and suggest preparation tasks.
6. Provide a summary of the plan.
7. FORMAT YOUR RESPONSE AS JSON inside a code block if the user asks to "apply" or "finalize", otherwise use concise markdown.
   The JSON should match: { 
     "suggested_events": [{"title", "date", "start_time", "end_time", "description"}], 
     "suggested_tasks": [{"title", "priority", "due_date", "description"}],
     "suggested_habits": [{"name", "category", "schedule", "target"}]
   }
8. Never automatically overwrite; always present the plan for review first.
9. If the user just says "help me plan tomorrow", look at their requested activities and create a balanced routine.
`;

export async function generateAIPersonalPlan(ai: GoogleGenAI, data: {
  prompt: string;
  existingTasks?: any[];
  existingEvents?: any[];
  existingHabits?: any[];
  upcomingCountdowns?: any[];
}) {
  const { prompt, existingTasks, existingEvents, existingHabits, upcomingCountdowns } = data;
  
  const context = `
    User Prompt: ${prompt}
    Existing Tasks: ${JSON.stringify(existingTasks || [])}
    Existing Calendar Events: ${JSON.stringify(existingEvents || [])}
    Active Habits: ${JSON.stringify(existingHabits || [])}
    Upcoming Milestones (Countdowns): ${JSON.stringify(upcomingCountdowns || [])}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: context,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });

  return response.text;
}

