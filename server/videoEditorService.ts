import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const MODELS_TO_TRY = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];

async function generateEditorText(prompt: string): Promise<string> {
  let lastError: any;
  for (const model of MODELS_TO_TRY) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      if (response?.text) {
        return response.text.trim();
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('All AI models failed');
}

export interface SubtitleResponseItem {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

/**
 * Generate Smart Synchronized Subtitles using Gemini AI
 */
export async function generateSmartCaptions(params: {
  topicOrAudioSummary?: string;
  durationSeconds: number;
  language?: string;
  pacingStyle?: 'creator' | 'podcast' | 'cinematic' | 'educational';
}): Promise<SubtitleResponseItem[]> {
  const { topicOrAudioSummary, durationSeconds, language = 'English', pacingStyle = 'creator' } = params;
  const targetDuration = Math.max(3, Math.min(120, durationSeconds || 15));

  const prompt = `You are a professional video editor and caption transcription engine.
Generate a realistic, synchronized JSON array of subtitles for a video with duration ${targetDuration} seconds.
Content context/topic: "${topicOrAudioSummary || 'Exciting modern tech cinematic presentation'}"
Language: ${language}
Pacing Style: ${pacingStyle} (short punchy phrases, 2-5 words per caption segment, suitable for TikTok/Shorts/Reels).

Rules:
1. Return ONLY valid JSON in format:
[
  { "start": 0.0, "end": 1.8, "text": "Welcome to the future", "speaker": "Host" },
  { "start": 1.9, "end": 3.6, "text": "This changes everything", "speaker": "Host" }
]
2. The last subtitle must finish on or before ${targetDuration.toFixed(1)} seconds.
3. Subtitle timestamps must never overlap, and start must be < end.
4. Do not include markdown code block formatting like \`\`\`json. Return raw JSON array only.`;

  try {
    const text = await generateEditorText(prompt);
    const cleanJson = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item, idx) => ({
        start: Number(item.start) || idx * 2,
        end: Number(item.end) || (idx * 2) + 1.8,
        text: String(item.text || ''),
        speaker: item.speaker || 'Host',
      }));
    }
  } catch (err) {
    console.warn('[VideoEditorService] Caption generation fallback:', err);
  }

  // Fallback realistic creator subtitles
  const segmentDuration = Math.max(1.5, targetDuration / 6);
  const words = [
    '⚡ Watch this transformation',
    'Created directly in SUPERAI',
    'Multitrack precision editing',
    'Custom captions and effects',
    'Ready for Shorts and Reels',
    'Exported in high definition',
  ];

  return words.map((txt, idx) => ({
    start: Number((idx * segmentDuration).toFixed(2)),
    end: Number((Math.min(targetDuration, (idx + 1) * segmentDuration - 0.2)).toFixed(2)),
    text: txt,
    speaker: 'Speaker',
  }));
}

/**
 * Generate Video Hooks, Titles & Descriptions
 */
export async function generateVideoMetadataIdeas(params: {
  topic: string;
  genre?: string;
  targetPlatform?: 'YouTube' | 'TikTok' | 'Instagram Reels' | 'Podcast';
}) {
  const { topic, genre = 'Tech / Creative', targetPlatform = 'YouTube' } = params;

  const prompt = `You are a viral YouTube, TikTok, and Instagram creative strategist.
Suggest 5 high-converting titles, 3 opening hook lines, and 1 engaging description with hashtags for:
Topic: "${topic}"
Genre: "${genre}"
Platform: "${targetPlatform}"

Return ONLY JSON:
{
  "titles": ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"],
  "hooks": ["Hook 1", "Hook 2", "Hook 3"],
  "description": "Engaging description text with hashtags...",
  "recommendedTags": ["#tag1", "#tag2", "#tag3"]
}`;

  try {
    const text = await generateEditorText(prompt);
    const cleanJson = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.warn('[VideoEditorService] Title gen error:', err);
    return {
      titles: [
        `How I Created ${topic} with AI in 60 Seconds`,
        `The Ultimate Guide to ${topic} (2026 Edition)`,
        `Stop Doing ${topic} The Hard Way!`,
        `Inside ${topic}: Master Creative Workflow`,
        `${topic} Changed Everything We Know`,
      ],
      hooks: [
        'If you are still editing videos manually, you need to see this...',
        'Here is the exact framework top creators use to produce viral clips.',
        'Watch until the end because step 3 will save you hours of work.',
      ],
      description: `Exploring ${topic} with professional editing, AI-powered captions, and seamless effects. #superai #videoediting #creator`,
      recommendedTags: ['#editing', '#videoeditor', '#contentcreator', '#viral'],
    };
  }
}

/**
 * Translate Subtitles while strictly preserving timestamps
 */
export async function translateSubtitles(params: {
  subtitles: SubtitleResponseItem[];
  targetLanguage: string;
}): Promise<SubtitleResponseItem[]> {
  const { subtitles, targetLanguage } = params;
  if (!subtitles || subtitles.length === 0) return [];

  const prompt = `Translate the text in the following subtitle segments into "${targetLanguage}".
IMPORTANT: You MUST keep the exact "start", "end", and "speaker" fields unchanged. Only translate the "text" property.

Input Subtitles:
${JSON.stringify(subtitles, null, 2)}

Return ONLY valid JSON matching the exact same schema. No markdown backticks.`;

  try {
    const text = await generateEditorText(prompt);
    const cleanJson = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item, idx) => ({
        start: subtitles[idx]?.start ?? item.start,
        end: subtitles[idx]?.end ?? item.end,
        text: item.text,
        speaker: subtitles[idx]?.speaker ?? item.speaker,
      }));
    }
  } catch (err) {
    console.warn('[VideoEditorService] Subtitle translation error:', err);
  }

  return subtitles;
}

/**
 * Propose AI Highlights & Smart Cuts
 */
export async function analyzeVideoHighlights(params: {
  videoName: string;
  durationSeconds: number;
  clipCount: number;
}) {
  const { videoName, durationSeconds, clipCount } = params;

  const prompt = `You are a professional video editor analyzing a timeline.
Video title: "${videoName}"
Total Duration: ${durationSeconds.toFixed(1)} seconds
Number of clips: ${clipCount}

Suggest 3 punchy highlight ranges that make the strongest short video (Shorts / Reels format of 15 to 30 seconds), along with rationales.

Return ONLY JSON:
[
  {
    "title": "Hook & Main Action",
    "start": 0.0,
    "end": 8.5,
    "duration": 8.5,
    "reason": "Captures viewer attention immediately with core visual hook"
  },
  {
    "title": "Climax Reveal",
    "start": 10.0,
    "end": 18.0,
    "duration": 8.0,
    "reason": "Highest visual energy and key storytelling takeaway"
  }
]`;

  try {
    const text = await generateEditorText(prompt);
    const cleanJson = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.warn('[VideoEditorService] Highlights gen fallback:', err);
    return [
      {
        title: 'Opening Hook Segment',
        start: 0,
        end: Math.min(durationSeconds, 6.5),
        duration: Math.min(durationSeconds, 6.5),
        reason: 'Immediate visual grabber for short-form retention',
      },
      {
        title: 'Key Demonstration',
        start: Math.max(0, durationSeconds * 0.3),
        end: Math.min(durationSeconds, durationSeconds * 0.75),
        duration: Math.min(durationSeconds * 0.45, 12),
        reason: 'Presents the core content with clear pacing',
      },
    ];
  }
}
/**
 * Propose Creative Improvements for the video
 */
export async function suggestCreativeImprovements(params: {
  videoName: string;
  durationSeconds: number;
  clipCount: number;
  aspectRatio: string;
}) {
  const { videoName, durationSeconds, clipCount, aspectRatio } = params;

  const prompt = `You are an award-winning creative director for social media content.
Analyze this video project and suggest 3-4 specific creative improvements (transitions, pacing, text placement, or visual style).
Project Name: "${videoName}"
Duration: ${durationSeconds.toFixed(1)}s
Clips: ${clipCount}
Format: ${aspectRatio}

Return ONLY JSON:
[
  {
    "type": "transition" | "pacing" | "visual" | "text",
    "suggestion": "Specific actionable suggestion",
    "reason": "Why this works for ${aspectRatio} format",
    "autoApplyPossible": boolean
  }
]`;

  try {
    const text = await generateEditorText(prompt);
    const cleanJson = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    return [
      {
        type: 'transition',
        suggestion: 'Apply "Fade to Black" transitions between all video clips for a cinematic feel.',
        reason: 'Smooths out jumps between different scenes.',
        autoApplyPossible: true,
      },
      {
        type: 'text',
        suggestion: 'Add a bold "Main Title" text clip in the first 2 seconds.',
        reason: 'Captures viewer attention immediately.',
        autoApplyPossible: false,
      },
    ];
  }
}
