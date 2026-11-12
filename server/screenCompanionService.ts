import { GoogleGenAI } from '@google/genai';

export type CompanionMode = 
  | 'explain'
  | 'fix_error'
  | 'step_by_step'
  | 'explain_app'
  | 'summarize'
  | 'help_learn'
  | 'design_review'
  | 'understand_code';

export interface ScreenAnalysisRequest {
  imageBase64: string;
  mimeType?: string;
  mode: CompanionMode;
  prompt?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; text: string }>;
}

export interface ScreenAnalysisResult {
  success: boolean;
  analysis: string;
  suggestedQuestions: string[];
  mode: CompanionMode;
  error?: string;
}

const MODE_SYSTEM_PROMPTS: Record<CompanionMode, string> = {
  explain: `You are SUPERAI Screen Companion. Describe what is displayed on the user's screen clearly and concisely. Identify main windows, primary controls, menus, tabs, and content sections, explaining their purpose in plain language.`,

  fix_error: `You are SUPERAI Screen Companion specializing in Software Error Diagnosis. Locate and read all visible error messages, warning popups, status codes, terminal errors, or stack traces on the screen. Explain the root cause in accessible terms and provide a numbered, step-by-step troubleshooting guide to fix the issue.`,

  step_by_step: `You are SUPERAI Screen Companion providing Step-by-Step Visual Guidance. Analyze the screenshot to guide the user on what to click or select next. Use the EXACT visible labels, button text, menu titles, and icon descriptions shown on their screen. Format your answer as a clean numbered list (1, 2, 3...).`,

  explain_app: `You are SUPERAI Screen Companion App Navigator. Explain the software application, tools, settings, sidebars, and features visible in this screenshot. Help the user understand how to use this app effectively.`,

  summarize: `You are SUPERAI Screen Companion Content Summarizer. Extract and summarize all readable text, articles, tables, presentation slides, or documents visible on screen into key takeaways and bullet points.`,

  help_learn: `You are SUPERAI Screen Companion Tutor. Explain the educational material, technical concept, math problem, scientific diagram, or learning question visible in this screenshot with simple, encouraging explanations.`,

  design_review: `You are SUPERAI Screen Companion UI/UX Reviewer. Provide constructive, professional design feedback on the visual layout, typography, color palette, contrast, spacing, visual hierarchy, and usability of the interface shown in this screenshot.`,

  understand_code: `You are SUPERAI Screen Companion Code Expert. Analyze the source code, terminal commands, or IDE environment visible in this screenshot. Explain how the code works, highlight any visible bugs or syntax errors, and provide corrected code blocks when applicable.`,
};

const MODE_SUGGESTED_QUESTIONS: Record<CompanionMode, string[]> = {
  explain: [
    'Where should I click first?',
    'What does the main button do?',
    'How do I customize these settings?',
    'Can you explain this in simpler terms?',
  ],
  fix_error: [
    'Show me how to fix this step by step.',
    'Why is this error happening?',
    'What should I check if this fails?',
    'How do I prevent this error in the future?',
  ],
  step_by_step: [
    'What should I do after this step?',
    'Where is that setting located on screen?',
    'What if I do not see that button?',
    'Show me the next step with a new screenshot.',
  ],
  explain_app: [
    'What are the most useful shortcuts here?',
    'How do I export or save my work?',
    'Where are the primary preferences located?',
    'Can you explain the main toolbar buttons?',
  ],
  summarize: [
    'Give me a 3-bullet summary.',
    'What are the key statistics or data points?',
    'Are there any action items listed?',
    'Can you rephrase this for a beginner?',
  ],
  help_learn: [
    'Explain this concept like I am 10 years old.',
    'Can you solve this question step by step?',
    'What is the formula or rule used here?',
    'Give me a similar practice example.',
  ],
  design_review: [
    'How can I improve the visual contrast?',
    'What typography changes would look better?',
    'Is the visual hierarchy clear to users?',
    'How can I make this layout mobile-friendly?',
  ],
  understand_code: [
    'How do I fix the syntax error on screen?',
    'Explain line by line what this logic does.',
    'What libraries or functions are being used?',
    'How can I optimize this code for performance?',
  ],
};

export async function analyzeScreenImage(
  ai: GoogleGenAI,
  req: ScreenAnalysisRequest
): Promise<ScreenAnalysisResult> {
  const { imageBase64, mimeType, mode, prompt, conversationHistory } = req;

  if (!imageBase64) {
    return {
      success: false,
      analysis: 'No screenshot data received.',
      suggestedQuestions: MODE_SUGGESTED_QUESTIONS[mode] || [],
      mode,
      error: 'Screenshot image payload is missing.',
    };
  }

  // Clean base64 string
  let cleanData = imageBase64;
  let detectedMime = mimeType || 'image/png';

  if (imageBase64.includes(';base64,')) {
    const parts = imageBase64.split(';base64,');
    cleanData = parts[1];
    if (parts[0].startsWith('data:')) {
      detectedMime = parts[0].replace('data:', '');
    }
  }

  const systemPrompt = MODE_SYSTEM_PROMPTS[mode] || MODE_SYSTEM_PROMPTS.explain;
  const userInstruction = prompt?.trim() || 'Analyze this screen and assist me.';

  let fullPrompt = `${systemPrompt}\n\nUSER QUESTION / TASK: "${userInstruction}"`;

  if (conversationHistory && conversationHistory.length > 0) {
    const historyText = conversationHistory
      .slice(-4)
      .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`)
      .join('\n');
    fullPrompt += `\n\nRECENT CONVERSATION CONTEXT:\n${historyText}`;
  }

  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.8-flash',
  ];

  let analysisText = '';

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: detectedMime,
                  data: cleanData,
                },
              },
              {
                text: fullPrompt,
              },
            ],
          },
        ],
        config: {
          temperature: 0.4,
        },
      });

      if (response && response.text) {
        analysisText = response.text;
        break;
      }
    } catch (err: any) {
      console.warn(`[ScreenCompanion] Model ${model} failed:`, err?.message || err);
    }
  }

  if (!analysisText) {
    return {
      success: false,
      analysis: 'Unable to analyze screenshot at this moment. Please check your image clarity and retry.',
      suggestedQuestions: MODE_SUGGESTED_QUESTIONS[mode] || [],
      mode,
      error: 'All AI vision model endpoints were busy or returned empty analysis.',
    };
  }

  return {
    success: true,
    analysis: analysisText,
    suggestedQuestions: MODE_SUGGESTED_QUESTIONS[mode] || [],
    mode,
  };
}
