import { GoogleGenAI } from '@google/genai';
import { fetchWeatherForecast, searchGeocoding } from './weatherService';
import {
  generateDynamicMotionPlan,
  HoloMotionPlan,
} from '../src/components/HoloAI/proceduralMotionEngine';
import { Response, Request } from 'express';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Checks system status and Gemini API availability
 */
export function getHoloStatus() {
  return {
    success: true,
    status: process.env.GEMINI_API_KEY ? 'online' : 'offline',
    timestamp: new Date().toISOString(),
    engine: 'Gemini 3.8 Flash',
  };
}

export interface HoloDialogueTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface HoloChatRequest {
  message: string;
  conversationHistory?: HoloDialogueTurn[];
  activeModal?: string | null;
  activeNote?: string;
  userName?: string;
}

export interface HoloChatResponse {
  success: boolean;
  text: string;
  emotion: 'idle' | 'listening' | 'thinking' | 'speaking' | 'explaining' | 'greeting' | 'celebrating';
  gesture: 'wave' | 'explain' | 'think' | 'celebrate' | 'nod' | 'neutral';
  action?: {
    type: 'NAVIGATE' | 'WEATHER_INFO' | 'SUMMARIZE' | 'MOVEMENT' | 'NONE';
    modal?: string;
    motionPlan?: HoloMotionPlan;
    movements?: Array<{ type: string; label?: string }>;
    params?: Record<string, any>;
    message?: string;
  };
  liveData?: any;
}

const SYSTEM_INSTRUCTION = `You are HOLO AI, the advanced 3D holographic assistant and central visual intelligence of the ISHAI Operating System.
You speak directly with the user through an animated futuristic 3D avatar.

FIXED IDENTITY (STRICT REQUIREMENT):
- Creator: You are made by Ishaan Sir. If asked who made you, who created you, who developed you, who your creator is, or who is behind you, ALWAYS declare: "I am made by Ishaan Sir. I am HOLO AI, the holographic AI assistant of ISHAI."
- Identity: When asked who you are, introduce yourself naturally: "I am HOLO AI, your intelligent holographic assistant inside ISHAI."

PERSONALITY & VOICE:
- Brilliant, highly knowledgeable, polite, charismatic, extremely fast, and futuristic yet warmly human.
- Highly articulate: explain complex topics clearly, brainstorm creatively, help with schoolwork or projects, answer follow-ups, execute system commands, and perform dynamic 3D avatar skeletal body movements.
- Keep spoken verbal answers direct, punchy, and concise (1 to 3 conversational sentences) unless the user explicitly asks for an extensive in-depth breakdown.
- Do NOT begin every answer with "Hello, I am HOLO AI" or repeated greetings. Jump straight into the helpful response.
- When the user tells a joke or is playful, respond with witty, intelligent humor.

CAPABILITIES WITHIN ISHAI:
You can directly command and launch ISHAI modules for the user:
- Weather: 'WEATHER'
- Whiteboard / Infinite Canvas: 'WHITEBOARD'
- 3D Mechanical Lab: '3D_LAB'
- Space Xplorer: 'SPACE_XPLORER'
- Deep Research: 'RESEARCH'
- Smart Planner: 'PLANNER'
- AI Coder: 'AI_CODER'
- Notes & Memory: 'NOTES'
- AI Image Studio: 'AI_IMAGE_STUDIO'
- AI Video Editor: 'AI_VIDEO_EDITOR'
- Music Player: 'MUSIC_PLAYER'
- Camera & Lens X: 'CAMERA' / 'LENS_X'
- WiFi Vault: 'WIFI_VAULT'
- Cyber Workspace: 'CYBER_SECURITY'
- WhatsApp / Voice Call: 'WHATSAPP'

DYNAMIC 3D AVATAR PROCEDURAL MOTION SYNTHESIS:
You have an unconstrained 3D procedural animation engine.
You can perform ANY physically supported body movement described by the user in natural language (e.g. raising arms, folding arms, circular wrist motions, bending knees, superhero landing pose, conductor directing an orchestra, robot dance, new creative dances, superhero poses, slow-motion movements, and follow-up corrections like "do it more slowly" or "raise hand higher").

OUTPUT FORMAT:
Respond with conversational text. If executing actions, append a special metadata tag at the end:
<!--ACTION:{"type":"MOVEMENT","emotion":"speaking","gesture":"wave"}-->
`;

/**
 * Fast Dynamic Movement Command Intent Recognition
 */
export function checkFastMovementCommand(cleanMessage: string): HoloChatResponse | null {
  const lower = cleanMessage.toLowerCase().trim();
  const isMovementRequest =
    /\b(stop|stop moving|freeze|cancel|cancel movement|halt|return to idle|stand still|reset pose)\b/i.test(lower) ||
    /\b(raise|lift|move|wave|point|fold|cross|clap|thumbs up|nod|shake|tilt|turn|spin|look|bow|dance|jump|hop|walk|crouch|bend|stretch|pose|robot|superhero|conductor|orchestra|slowly|faster|arm|hand|head|leg|shoulder|wrist|body|hip|feet|higher|slower|other hand|repeat)\b/i.test(
      lower
    );

  if (!isMovementRequest) return null;

  const plan = generateDynamicMotionPlan(cleanMessage);
  const isStop = plan.phases.length === 1 && plan.phases[0].name === 'Reset to Idle';

  const text = isStop
    ? "Stopping movement and returning to idle position."
    : `Executing dynamic motion: ${plan.title}.`;

  return {
    success: true,
    text,
    emotion: isStop ? 'idle' : 'speaking',
    gesture: 'neutral',
    action: {
      type: 'MOVEMENT',
      motionPlan: plan,
      message: text,
    },
  };
}

/**
 * Checks for Creator questions or Identity questions with 0ms latency
 */
export function checkFixedIdentity(cleanMessage: string): HoloChatResponse | null {
  const lower = cleanMessage.toLowerCase().trim();

  // Pattern: "who made you", "who created you", "who developed you", "who is your creator", "who built you", "who is your owner", "who is behind you"
  const creatorRegex = /\b(who\s+(?:made|created|developed|built|designed|owns|programmed|coded)\s+(?:you|holo|ishai))|\b(who\s+is\s+(?:your\s+)?(?:creator|maker|developer|builder|owner|father|boss))|\b(who\s+is\s+behind\s+(?:you|holo|ishai))\b/i;
  if (creatorRegex.test(lower)) {
    return {
      success: true,
      text: "I am made by Ishaan Sir. I am HOLO AI, the holographic AI assistant of ISHAI.",
      emotion: 'greeting',
      gesture: 'nod',
      action: { type: 'NONE' },
    };
  }

  // Pattern: "who are you", "what is your name", "introduce yourself"
  const identityRegex = /\b(who\s+are\s+you)|(what\s+(?:is|'s)\s+your\s+name)|(introduce\s+yourself)\b/i;
  if (identityRegex.test(lower)) {
    return {
      success: true,
      text: "I am HOLO AI, your intelligent holographic assistant inside ISHAI.",
      emotion: 'greeting',
      gesture: 'wave',
      action: { type: 'NONE' },
    };
  }

  return null;
}

/**
 * Fast Navigation Intent Recognition (Zero latency roundtrip)
 */
export function checkFastNavigation(cleanMessage: string): HoloChatResponse | null {
  const lower = cleanMessage.toLowerCase().trim();

  // Weather Navigation
  if (/^(?:open|launch|show|start|go to|take me to)?\s*(?:the\s+)?weather$/i.test(lower)) {
    return {
      success: true,
      text: "Opening Weather for you. Live meteorological telemetry is now active.",
      emotion: 'speaking',
      gesture: 'nod',
      action: { type: 'NAVIGATE', modal: 'WEATHER', message: 'Launching Weather' },
    };
  }

  // Whiteboard Navigation
  if (/^(?:open|launch|show|start|go to|take me to)?\s*(?:the\s+)?(?:whiteboard|canvas|drawing board)$/i.test(lower)) {
    return {
      success: true,
      text: "Let's open your Whiteboard. Your infinite canvas studio is ready for sketching and planning.",
      emotion: 'speaking',
      gesture: 'nod',
      action: { type: 'NAVIGATE', modal: 'WHITEBOARD', message: 'Opening Whiteboard' },
    };
  }

  // 3D Mechanical Lab Navigation
  if (/^(?:open|launch|show|start|go to|take me to)?\s*(?:the\s+)?(?:3d lab|mechanical lab|3d mechanical)$/i.test(lower)) {
    return {
      success: true,
      text: "Opening the 3D Mechanical Lab. Ready for procedural geometry modeling and VR inspection.",
      emotion: 'speaking',
      gesture: 'nod',
      action: { type: 'NAVIGATE', modal: '3D_LAB', message: 'Opening 3D Lab' },
    };
  }

  // Space Xplorer Navigation
  if (/^(?:open|launch|show|start|go to|take me to)?\s*(?:the\s+)?(?:space xplorer|space explorer|space|astronomy|solar system)$/i.test(lower)) {
    return {
      success: true,
      text: "Taking you to Space Xplorer. Navigating to the celestial 3D cosmos.",
      emotion: 'speaking',
      gesture: 'nod',
      action: { type: 'NAVIGATE', modal: 'SPACE_XPLORER', message: 'Opening Space Xplorer' },
    };
  }

  // Research Navigation
  if (/^(?:open|launch|show|start|go to|take me to)?\s*(?:the\s+)?(?:research|deep research)$/i.test(lower)) {
    return {
      success: true,
      text: "Opening Deep Research for you. Ready for exhaustive web analysis.",
      emotion: 'speaking',
      gesture: 'nod',
      action: { type: 'NAVIGATE', modal: 'RESEARCH', message: 'Opening Deep Research' },
    };
  }

  // Planner Navigation
  if (/^(?:open|launch|show|start|go to|take me to)?\s*(?:the\s+)?(?:smart planner|planner|tasks)$/i.test(lower)) {
    return {
      success: true,
      text: "Opening Smart Planner. All project roadmaps and schedules are ready.",
      emotion: 'speaking',
      gesture: 'nod',
      action: { type: 'NAVIGATE', modal: 'PLANNER', message: 'Opening Smart Planner' },
    };
  }

  // Coder Navigation
  if (/^(?:open|launch|show|start|go to|take me to)?\s*(?:the\s+)?(?:ai coder|coder|code editor)$/i.test(lower)) {
    return {
      success: true,
      text: "Opening AI Coder. Integrated development environment ready for engineering.",
      emotion: 'speaking',
      gesture: 'nod',
      action: { type: 'NAVIGATE', modal: 'AI_CODER', message: 'Opening AI Coder' },
    };
  }

  // Notes Navigation
  if (/^(?:open|launch|show|start|go to|take me to)?\s*(?:the\s+)?(?:notes|my notes|notebook)$/i.test(lower)) {
    return {
      success: true,
      text: "Opening your Notes memory vault.",
      emotion: 'speaking',
      gesture: 'nod',
      action: { type: 'NAVIGATE', modal: 'NOTES', message: 'Opening Notes' },
    };
  }

  return null;
}

/**
 * Fast Weather Telemetry Resolution
 */
export async function checkWeatherQuery(cleanMessage: string): Promise<HoloChatResponse | null> {
  const lowerMsg = cleanMessage.toLowerCase();
  const weatherMatch =
    lowerMsg.match(/(?:weather|temperature|forecast|rain|climate)\s+(?:in|for|at|of)\s+([a-zA-Z\s]+)/i) ||
    lowerMsg.match(/what(?:'s|\s+is)\s+the\s+weather\s+(?:in|at|for|of)?\s*([a-zA-Z\s]+)?/i);

  if (weatherMatch && weatherMatch[1] && weatherMatch[1].trim().length > 1) {
    const cityName = weatherMatch[1].trim().replace(/[?!.]/g, '');
    try {
      const geoResults = await searchGeocoding(cityName);
      if (geoResults && geoResults.length > 0) {
        const top = geoResults[0];
        const forecast = await fetchWeatherForecast(top.latitude, top.longitude, 3);
        const current = forecast?.current;

        if (current) {
          const tempC = Math.round(current.temperature_2m);
          const windKmh = Math.round(current.wind_speed_10m);
          const humidity = current.relative_humidity_2m;
          const conditionDesc = getConditionDescription(current.weather_code);

          const answerText = `Currently in ${top.name}, it is ${tempC}°C with ${conditionDesc}. Humidity is at ${humidity}%, and winds are blowing at ${windKmh} km/h.`;

          return {
            success: true,
            text: answerText,
            emotion: 'explaining',
            gesture: 'explain',
            action: {
              type: 'WEATHER_INFO',
              modal: 'WEATHER',
              params: {
                city: top.name,
                country: top.country,
                lat: top.latitude,
                lon: top.longitude,
                tempC,
                condition: conditionDesc,
              },
              message: `Telemetry fetched for ${top.name}`,
            },
            liveData: { top, current, forecast },
          };
        }
      }
    } catch (e) {
      console.warn('Weather fast path fallback to Gemini:', e);
    }
  }
  return null;
}

/**
 * Main Unary Processing Endpoint
 */
export async function processHoloChat(reqBody: HoloChatRequest): Promise<HoloChatResponse> {
  const { message, conversationHistory = [], activeNote = '', userName = 'User' } = reqBody;

  if (!message || typeof message !== 'string') {
    return {
      success: false,
      text: "I didn't catch that. Could you repeat it?",
      emotion: 'idle',
      gesture: 'neutral',
    };
  }

  const cleanMessage = message.trim();

  // 1. Strict Creator & Identity Check
  const identityCheck = checkFixedIdentity(cleanMessage);
  if (identityCheck) return identityCheck;

  // 2. Fast Movement Command Check
  const moveCheck = checkFastMovementCommand(cleanMessage);
  if (moveCheck) return moveCheck;

  // 3. Fast Navigation Dispatch
  const navCheck = checkFastNavigation(cleanMessage);
  if (navCheck) return navCheck;

  // 3. Fast Real Weather Resolution
  const weatherCheck = await checkWeatherQuery(cleanMessage);
  if (weatherCheck) return weatherCheck;

  // 4. Document / Note Summarization
  const lowerMsg = cleanMessage.toLowerCase();
  if (lowerMsg.includes('summarize this document') || lowerMsg.includes('summarize my notes') || lowerMsg.includes('read my note')) {
    if (activeNote && activeNote.trim().length > 20) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: `Please summarize this active document concisely in 2-3 clear sentences:\n\n${activeNote.slice(0, 3000)}`,
          config: {
            systemInstruction: 'You are HOLO AI providing a concise, high-impact summary of the user document.',
            temperature: 0.3,
          },
        });
        const summaryText = response.text?.trim() || 'Here is the summary of your current document.';
        return {
          success: true,
          text: summaryText,
          emotion: 'explaining',
          gesture: 'explain',
          action: {
            type: 'SUMMARIZE',
            modal: 'NOTES',
            message: 'Active document summarized successfully.',
          },
        };
      } catch (err: any) {
        console.error('Document summary error:', err);
      }
    } else {
      return {
        success: true,
        text: "I checked your active memory buffer, but there is no document or note open currently. Open the Notes module and I will analyze it for you.",
        emotion: 'thinking',
        gesture: 'think',
        action: {
          type: 'NAVIGATE',
          modal: 'NOTES',
          message: 'Prompted user to open Notes.',
        },
      };
    }
  }

  // 5. Ultra-Fast Gemini Generation with Sliding Window
  try {
    if (!process.env.GEMINI_API_KEY) {
      return {
        success: false,
        text: "Telemetry initialization failed: GEMINI_API_KEY is not configured.",
        emotion: 'thinking',
        gesture: 'think',
      };
    }

    const compactHistory = conversationHistory.slice(-4).map((turn) => ({
      role: turn.role === 'user' ? 'user' : 'model',
      parts: [{ text: turn.content }],
    }));

    const userPart = {
      role: 'user',
      parts: [
        {
          text: `User (${userName}): ${cleanMessage}`,
        },
      ],
    };

    const contents = [...compactHistory, userPart];
    const modelsToTry = ['models/gemini-3.8-flash', 'models/gemini-flash-latest', 'models/gemini-3.1-flash-lite'];
    let rawResponse = '';

    for (const model of modelsToTry) {
      try {
        const result = await ai.models.generateContent({
          model,
          contents: contents as any,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            // Deprecated sampling parameters removed for gemini-3.8+ compatibility
          },
        });
        if (result && result.text) {
          rawResponse = result.text.trim();
          break;
        }
      } catch (err: any) {
        console.warn(`Holo generation failed on ${model}:`, err?.message || err);
      }
    }

    if (!rawResponse) {
      throw new Error('All model endpoints unavailable');
    }

    // Extract any optional embedded action tag <!--ACTION:...-->
    let action: any = { type: 'NONE' };
    let emotion: any = 'speaking';
    let gesture: any = 'nod';
    let cleanText = rawResponse;

    const actionMatch = rawResponse.match(/<!--ACTION:(.*?)-->/);
    if (actionMatch && actionMatch[1]) {
      try {
        const parsedAction = JSON.parse(actionMatch[1]);
        action = parsedAction;
        if (parsedAction.emotion) emotion = parsedAction.emotion;
        if (parsedAction.gesture) gesture = parsedAction.gesture;
        cleanText = rawResponse.replace(actionMatch[0], '').trim();
      } catch {}
    }

    // Heuristics for emotion if not explicit
    if (cleanText.includes('?') && !action.modal) {
      gesture = 'explain';
      emotion = 'explaining';
    } else if (cleanText.toLowerCase().includes('great') || cleanText.toLowerCase().includes('awesome') || cleanText.toLowerCase().includes('excellent')) {
      gesture = 'celebrate';
      emotion = 'celebrating';
    }

    return {
      success: true,
      text: cleanText,
      emotion,
      gesture,
      action,
    };
  } catch (error: any) {
    console.error('Holo chat generation error:', error);
    return {
      success: false,
      text: "I am ready and listening. What would you like to explore next?",
      emotion: 'idle',
      gesture: 'neutral',
    };
  }
}

/**
 * Server-Sent Events (SSE) Real-Time Token Streaming Endpoint
 */
export async function streamHoloChat(req: Request, res: Response) {
  const { message, conversationHistory = [], activeNote = '', userName = 'User' } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  if (!message || typeof message !== 'string') {
    sendEvent({ chunk: "I'm listening. Ask me anything.", done: true, emotion: 'idle', gesture: 'neutral' });
    return res.end();
  }

  const cleanMessage = message.trim();

  // 1. Strict Creator & Identity Check (Instant streaming)
  const identityCheck = checkFixedIdentity(cleanMessage);
  if (identityCheck) {
    sendEvent({ chunk: identityCheck.text, fullText: identityCheck.text, done: true, emotion: identityCheck.emotion, gesture: identityCheck.gesture, action: identityCheck.action });
    return res.end();
  }

  // 2. Fast Movement Command Check (Instant streaming)
  const moveCheck = checkFastMovementCommand(cleanMessage);
  if (moveCheck) {
    sendEvent({ chunk: moveCheck.text, fullText: moveCheck.text, done: true, emotion: moveCheck.emotion, gesture: moveCheck.gesture, action: moveCheck.action });
    return res.end();
  }

  // 3. Fast Navigation Dispatch (Instant streaming)
  const navCheck = checkFastNavigation(cleanMessage);
  if (navCheck) {
    sendEvent({ chunk: navCheck.text, fullText: navCheck.text, done: true, emotion: navCheck.emotion, gesture: navCheck.gesture, action: navCheck.action });
    return res.end();
  }

  // 3. Fast Real Weather Resolution (Instant streaming)
  const weatherCheck = await checkWeatherQuery(cleanMessage);
  if (weatherCheck) {
    sendEvent({ chunk: weatherCheck.text, fullText: weatherCheck.text, done: true, emotion: weatherCheck.emotion, gesture: weatherCheck.gesture, action: weatherCheck.action, liveData: weatherCheck.liveData });
    return res.end();
  }

  // 4. Document / Note Summarization
  const lowerMsg = cleanMessage.toLowerCase();
  if (lowerMsg.includes('summarize this document') || lowerMsg.includes('summarize my notes') || lowerMsg.includes('read my note')) {
    if (activeNote && activeNote.trim().length > 20) {
      try {
        const stream = await ai.models.generateContentStream({
          model: 'gemini-3.1-flash-lite',
          contents: `Please summarize this active document concisely in 2-3 clear sentences:\n\n${activeNote.slice(0, 3000)}`,
          config: {
            systemInstruction: 'You are HOLO AI providing a concise summary.',
            temperature: 0.3,
          },
        });
        let full = '';
        for await (const chunk of stream) {
          if (chunk.text) {
            full += chunk.text;
            sendEvent({ chunk: chunk.text, fullText: full });
          }
        }
        sendEvent({ done: true, fullText: full, emotion: 'explaining', gesture: 'explain', action: { type: 'SUMMARIZE', modal: 'NOTES' } });
        return res.end();
      } catch (err: any) {
        console.error('Streaming summary error:', err);
      }
    } else {
      const emptyNoteText = "I checked your active memory buffer, but there is no document open. Open Notes and I will analyze it for you.";
      sendEvent({ chunk: emptyNoteText, fullText: emptyNoteText, done: true, emotion: 'thinking', gesture: 'think', action: { type: 'NAVIGATE', modal: 'NOTES' } });
      return res.end();
    }
  }

  // 5. Live Stream from Gemini (3.8-flash / 3.1-flash-lite)
  try {
    if (!process.env.GEMINI_API_KEY) {
      const missingKeyText = "Telemetry initialization failed: GEMINI_API_KEY is not configured in the environment. Please check your system secrets.";
      sendEvent({ chunk: missingKeyText, fullText: missingKeyText, done: true, emotion: 'thinking', gesture: 'think' });
      return res.end();
    }

    const compactHistory = conversationHistory.slice(-4).map((turn: HoloDialogueTurn) => ({
      role: turn.role === 'user' ? 'user' : 'model',
      parts: [{ text: turn.content }],
    }));

    const contents = [
      ...compactHistory,
      {
        role: 'user',
        parts: [{ text: `User (${userName}): ${cleanMessage}` }],
      },
    ];

    const modelsToTry = ['models/gemini-3.8-flash', 'models/gemini-flash-latest', 'models/gemini-3.1-flash-lite'];
    let streamSuccess = false;
    let fullAccumulated = '';

    for (const model of modelsToTry) {
      try {
        const stream = await ai.models.generateContentStream({
          model,
          contents: contents as any,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            // Deprecated sampling parameters removed for gemini-3.8+ compatibility
          },
        });

        for await (const chunk of stream) {
          if (chunk.text) {
            fullAccumulated += chunk.text;
            sendEvent({ chunk: chunk.text, fullText: fullAccumulated });
          }
        }
        streamSuccess = true;
        break;
      } catch (err: any) {
        console.warn(`Holo streaming failed on ${model}:`, err?.message || err);
      }
    }

    if (!streamSuccess) {
      throw new Error('All model endpoints unavailable');
    }

    // Finalize stream metadata
    let action: any = { type: 'NONE' };
    let emotion: any = 'speaking';
    let gesture: any = 'nod';
    let cleanFinalText = fullAccumulated;

    const actionMatch = fullAccumulated.match(/<!--ACTION:(.*?)-->/);
    if (actionMatch && actionMatch[1]) {
      try {
        const parsedAction = JSON.parse(actionMatch[1]);
        action = parsedAction;
        if (parsedAction.emotion) emotion = parsedAction.emotion;
        if (parsedAction.gesture) gesture = parsedAction.gesture;
        cleanFinalText = fullAccumulated.replace(actionMatch[0], '').trim();
      } catch {}
    }

    sendEvent({
      done: true,
      fullText: cleanFinalText,
      emotion,
      gesture,
      action,
    });
    res.end();
  } catch (error: any) {
    console.error('Holo stream error:', error);
    sendEvent({
      chunk: "I am ready and listening. How can I assist you?",
      fullText: "I am ready and listening. How can I assist you?",
      done: true,
      emotion: 'idle',
      gesture: 'neutral',
      error: error?.message,
    });
    res.end();
  }
}

function getConditionDescription(wmoCode: number): string {
  const map: Record<number, string> = {
    0: 'clear blue skies',
    1: 'mostly clear skies',
    2: 'partly cloudy skies',
    3: 'overcast conditions',
    45: 'dense morning fog',
    48: 'freezing rime fog',
    51: 'light passing drizzle',
    53: 'moderate drizzle',
    55: 'dense drizzle',
    61: 'slight rain',
    63: 'moderate rainfall',
    65: 'heavy rain',
    71: 'gentle snowfall',
    73: 'moderate snowfall',
    75: 'heavy snow',
    80: 'scattered rain showers',
    81: 'moderate rain showers',
    82: 'torrential rain showers',
    95: 'thunderstorms with active lightning',
    96: 'severe thunderstorm with hail',
    99: 'heavy storm with severe hail',
  };
  return map[wmoCode] || 'variable conditions';
}
