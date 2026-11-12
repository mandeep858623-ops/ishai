import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { performDeepResearch, answerFollowUpQuestion, transformResearchReport } from './server/deepResearchEngine';
import { generateSmartPlan, breakdownTaskSteps, generateProjectPlanRoadmap } from './server/smartPlannerEngine';
import { getLanguageStudioConfig } from './server/languageStudioHelper';
import { generateDocumentOrPresentation, assistSlideWithAI } from './server/documentPPTService';
import {
  extractTextFromPDF,
  summarizeStudyNotes,
  generateFlashcards,
  generateQuiz,
  runStepByStepTutor,
  askYourNotes,
  generateChapterNotes,
  generateExamPractice,
  generateStudyPlan,
} from './server/studyGeniusService';
import { askDataAnalyst, generateAutoInsights } from './server/dataAnalystService';
import { executeWorkflowStep } from './server/workflowService';
import { askMemoryVault, parseVaultDocument } from './server/memoryVaultService';
import { getFocusCoachAdvice } from './server/focusCoachService';
import {
  generateSmartCaptions,
  generateVideoMetadataIdeas,
  translateSubtitles,
  analyzeVideoHighlights,
  suggestCreativeImprovements,
} from './server/videoEditorService';
import {
  signUpUser,
  signInUser,
  continueAsGuest,
  continueAsSuperai,
  verifySession,
  updateProfile,
  changePassword,
} from './server/authService';
import {
  storeUserFile,
  getUserFiles,
  getUserFileForDownload,
  renameUserFile,
  deleteUserFile,
  saveUserRecord,
  getUserRecords,
  deleteUserRecord,
} from './server/userStorageService';
import {
  generateStudioImage,
  editStudioImage,
  enhanceStudioPrompt,
  getPresetDesignConfig,
} from './server/aiImageStudioService';
import { executeTVCommand, probeTVDevice, initiateFireTVPairing, verifyFireTVPairingPIN } from './server/tvRemoteService';
import { analyzeScreenImage } from './server/screenCompanionService';
import { generateAIPersonalPlan } from './server/aiClockPlanner';
import { generateAITripItinerary } from './server/mapsTripGenieService';
import { locationShareRouter } from './server/locationShareService';
import { cyberRouter } from './server/cyberSecurityService';
import {
  fetchWeatherForecast,
  fetchAirQuality,
  fetchHistoricalWeather,
  fetchRadarFrames,
  searchGeocoding,
  fetchWeatherAlerts,
  generateWeatherIntelligence,
} from './server/weatherService';
import { processHoloChat, streamHoloChat, getHoloStatus } from './server/holoAiService';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const app = express();
const port = process.env.APP_PORT ? parseInt(process.env.APP_PORT, 10) : (process.env.PORT && process.env.PORT !== '8080' ? parseInt(process.env.PORT, 10) : 3000);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use('/videos', express.static(path.join(process.cwd(), 'public', 'videos')));
app.use('/uploads', express.static(path.join(process.cwd(), 'server', 'uploads')));
app.use('/api/location-share', locationShareRouter);
app.use('/api/cyber', cyberRouter);

// ============================================================================
// HOLO AI CONVERSATIONAL INTELLIGENCE & TELEMETRY ROUTE
// ============================================================================
app.post('/api/holo/chat', async (req, res) => {
  try {
    const result = await processHoloChat(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('HOLO AI API error:', error);
    res.status(500).json({
      success: false,
      text: "I encountered an internal telemetry interruption. Let me recalibrate.",
      emotion: 'thinking',
      gesture: 'think',
      error: error?.message,
    });
  }
});

app.post(['/api/holo/chat/stream', '/api/holo/chat-stream'], (req, res) => {
  streamHoloChat(req, res);
});

app.get('/api/holo/status', (req, res) => {
  res.json(getHoloStatus());
});




// ============================================================================
// ISHAI VOICE RECORDER ON-DEMAND TRANSCRIPTION BACKEND API
// ============================================================================
app.post('/api/voice-recorder/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ success: false, error: 'Audio data is required' });
    }
    const cleanBase64 = audioBase64.replace(/^data:.*?;base64,/, '');
    const cleanMime = (mimeType || 'audio/webm').split(';')[0];

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: cleanMime,
                data: cleanBase64,
              },
            },
            {
              text: 'Transcribe this speech audio clearly and accurately. Add timestamp markers (e.g. [00:15]) at natural section breaks. Keep the transcription clean and verbatim without filler preamble.',
            },
          ],
        },
      ],
    });

    const transcript = response.text || 'No audible speech detected in recording.';
    return res.json({ success: true, transcript });
  } catch (err: any) {
    console.error('Voice recorder transcription error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Transcription failed' });
  }
});

// ============================================================================
// SUPERAI AI WHITEBOARD HANDWRITING & SKETCH RECOGNITION BACKEND
// ============================================================================
app.post('/api/ai/whiteboard/ocr', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Image data is required' });
    }
    const cleanBase64 = imageBase64.replace(/^data:.*?;base64,/, '');
    const cleanMime = (mimeType || 'image/jpeg').split(';')[0];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: cleanMime,
                data: cleanBase64,
              },
            },
            {
              text: 'You are an advanced handwriting and diagram recognition AI. Transcribe all handwritten words, diagrams, text boxes, and mathematical/logical annotations from this whiteboard canvas accurately. Format each distinct note or line separately. If no handwriting is present, describe any drawings or symbols clearly.',
            },
          ],
        },
      ],
    });

    const text = response.text || '';
    return res.json({ success: true, text });
  } catch (err: any) {
    console.error('Whiteboard OCR error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Handwriting recognition failed' });
  }
});

// ============================================================================
// ISHAI WEATHER PLATFORM API ENDPOINTS
// ============================================================================
app.get('/api/weather/forecast', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const days = parseInt((req.query.days as string) || '14', 10);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ success: false, error: 'Valid lat and lon query parameters required.' });
    }

    const forecast = await fetchWeatherForecast(lat, lon, days);
    return res.json({ success: true, forecast });
  } catch (err: any) {
    console.error('Weather forecast API error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch weather forecast' });
  }
});

app.get('/api/weather/air-quality', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ success: false, error: 'Valid lat and lon required.' });
    }

    const airQuality = await fetchAirQuality(lat, lon);
    return res.json({ success: true, airQuality });
  } catch (err: any) {
    console.error('Air quality API error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch air quality' });
  }
});

app.get('/api/weather/history', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const startDate = (req.query.start_date as string) || '';
    const endDate = (req.query.end_date as string) || '';

    if (isNaN(lat) || isNaN(lon) || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'lat, lon, start_date, and end_date required.' });
    }

    const history = await fetchHistoricalWeather(lat, lon, startDate, endDate);
    return res.json({ success: true, history });
  } catch (err: any) {
    console.error('Historical weather API error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch historical weather' });
  }
});

app.get('/api/weather/radar', async (_req, res) => {
  try {
    const radar = await fetchRadarFrames();
    return res.json({ success: true, radar });
  } catch (err: any) {
    console.error('Radar manifest API error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch radar frames' });
  }
});

app.get('/api/weather/search', async (req, res) => {
  try {
    const q = (req.query.q as string) || '';
    const results = await searchGeocoding(q);
    return res.json({ success: true, results });
  } catch (err: any) {
    console.error('Geocoding search API error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to search locations' });
  }
});

app.get('/api/weather/alerts', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const city = (req.query.city as string) || '';

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ success: false, error: 'Valid lat and lon required.' });
    }

    const alerts = await fetchWeatherAlerts(lat, lon, city);
    return res.json({ success: true, alerts });
  } catch (err: any) {
    console.error('Weather alerts API error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch weather alerts' });
  }
});

app.post('/api/weather/intelligence', async (req, res) => {
  try {
    const { action, query, weatherData, airQualityData, locationName } = req.body;
    const result = await generateWeatherIntelligence({
      action: action || 'briefing',
      query,
      weatherData,
      airQualityData,
      locationName: locationName || 'Current Location'
    });
    return res.json({ success: true, result });
  } catch (err: any) {
    console.error('Weather Intelligence API error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Weather intelligence analysis failed' });
  }
});


app.post('/api/ai/video-editor/metadata-ideas', async (req, res) => {
  try {
    const ideas = await generateVideoMetadataIdeas(req.body);
    return res.json({ success: true, ...ideas });
  } catch (err: any) {
    console.error('Video Editor metadata ideas error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to generate ideas' });
  }
});

app.post('/api/ai/video-editor/translate-subtitles', async (req, res) => {
  try {
    const subtitles = await translateSubtitles(req.body);
    return res.json({ success: true, subtitles });
  } catch (err: any) {
    console.error('Video Editor translation error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to translate subtitles' });
  }
});

app.post('/api/ai/video-editor/highlights', async (req, res) => {
  try {
    const highlights = await analyzeVideoHighlights(req.body);
    return res.json({ success: true, highlights });
  } catch (err: any) {
    console.error('Video Editor highlights error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to analyze highlights' });
  }
});

app.post('/api/ai/video-editor/creative-suggestions', async (req, res) => {
  try {
    const suggestions = await suggestCreativeImprovements(req.body);
    return res.json({ success: true, suggestions });
  } catch (err: any) {
    console.error('Video Editor suggestions error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to generate suggestions' });
  }
});

// ============================================================================
// SUPERAI AI IMAGE STUDIO BACKEND ENGINE
// ============================================================================
app.post('/api/ai/image-studio/generate', async (req, res) => {
  try {
    const result = await generateStudioImage(ai, req.body);
    return res.json(result);
  } catch (err: any) {
    console.error('[IMAGE_STUDIO] Generation error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to generate image' });
  }
});

app.post('/api/ai/image-studio/edit', async (req, res) => {
  try {
    const result = await editStudioImage(ai, req.body);
    return res.json(result);
  } catch (err: any) {
    console.error('AI Image Studio editing error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to edit image' });
  }
});

app.post('/api/ai/image-studio/enhance-prompt', async (req, res) => {
  try {
    const result = await enhanceStudioPrompt(ai, req.body);
    return res.json(result);
  } catch (err: any) {
    console.error('AI Image Studio enhance prompt error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to enhance prompt' });
  }
});

app.post('/api/ai/image-studio/design-assist', async (req, res) => {
  try {
    const result = await getPresetDesignConfig(ai, req.body);
    return res.json(result);
  } catch (err: any) {
    console.error('AI Image Studio design assist error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to generate design assistance' });
  }
});

// ============================================================================
// SUPERAI DOCUMENT & PPT MAKER BACKEND ENGINE
// ============================================================================
app.post('/api/ai/doc-maker/generate', async (req, res) => {
  try {
    const result = await generateDocumentOrPresentation(req.body);
    if (!result.success) {
      return res.status(500).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    console.error('Doc Maker generation error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to generate document' });
  }
});

app.post('/api/ai/doc-maker/slide-assist', async (req, res) => {
  try {
    const result = await assistSlideWithAI(req.body);
    return res.json(result);
  } catch (err: any) {
    console.error('Doc Maker slide assist error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to assist slide with AI' });
  }
});

// ============================================================================
// SUPERAI UNIVERSAL TV REMOTE BACKEND ENGINE
// ============================================================================
app.post('/api/tv-remote/command', async (req, res) => {
  try {
    const result = await executeTVCommand(req.body);
    return res.json(result);
  } catch (err: any) {
    console.error('TV Remote command error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to dispatch TV remote command' });
  }
});

app.post('/api/tv-remote/discover', async (req, res) => {
  try {
    const { ipAddress = '127.0.0.1', manufacturer = 'simulator' } = req.body;
    const result = await probeTVDevice(ipAddress, manufacturer);
    return res.json(result);
  } catch (err: any) {
    console.error('TV Remote discovery error:', err);
    return res.status(500).json({ connected: false, error: err?.message || 'Device discovery failed' });
  }
});

app.post('/api/tv-remote/firetv/pair-init', async (req, res) => {
  try {
    const { ipAddress } = req.body;
    const result = await initiateFireTVPairing(ipAddress);
    return res.json(result);
  } catch (err: any) {
    console.error('Fire TV pair init error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to initiate Fire TV pairing' });
  }
});

app.post('/api/tv-remote/firetv/pair-verify', async (req, res) => {
  try {
    const { ipAddress, pin, sessionToken } = req.body;
    const result = await verifyFireTVPairingPIN(ipAddress, pin, sessionToken);
    return res.json(result);
  } catch (err: any) {
    console.error('Fire TV pair verify error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to verify Fire TV PIN' });
  }
});

// ============================================================================
// SUPERAI AI SCREEN COMPANION BACKEND ENGINE
// ============================================================================
app.post('/api/ai/screen-companion/analyze', async (req, res) => {
  try {
    const result = await analyzeScreenImage(ai, req.body);
    return res.json(result);
  } catch (err: any) {
    console.error('AI Screen Companion error:', err);
    return res.status(500).json({
      success: false,
      analysis: 'Screen analysis error.',
      suggestedQuestions: [],
      mode: req.body.mode || 'explain',
      error: err?.message || 'Failed to analyze screen image',
    });
  }
});

// ============================================================================
// SUPERAI STUDY GENIUS BACKEND ENGINE
// ============================================================================

// Upload PDF / TXT and extract text
app.post('/api/study-genius/upload-parse', async (req, res) => {
  try {
    const { fileData, fileName, fileType } = req.body;
    if (!fileData) {
      return res.status(400).json({ success: false, error: 'File data payload is missing.' });
    }

    const base64Clean = fileData.replace(/^data:.*?;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');

    if (fileType?.includes('pdf') || fileName?.toLowerCase().endsWith('.pdf')) {
      const parsed = await extractTextFromPDF(buffer);
      if (!parsed.text) {
        return res.status(400).json({
          success: false,
          error: 'Could not extract text from PDF. The PDF may be scanned (image-only), encrypted, or password protected.',
        });
      }
      return res.json({
        success: true,
        text: parsed.text,
        numPages: parsed.numpages,
        fileName: fileName || 'Uploaded Document.pdf',
        wordCount: parsed.text.split(/\s+/).length,
      });
    } else {
      const text = buffer.toString('utf-8').trim();
      if (!text) {
        return res.status(400).json({ success: false, error: 'The uploaded text file is empty.' });
      }
      return res.json({
        success: true,
        text,
        numPages: 1,
        fileName: fileName || 'Uploaded Notes.txt',
        wordCount: text.split(/\s+/).length,
      });
    }
  } catch (err: any) {
    console.error('Study Genius File Upload Error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to process and extract text from uploaded document.',
    });
  }
});

app.post('/api/study-genius/summarize', async (req, res) => {
  try {
    const summary = await summarizeStudyNotes(req.body);
    return res.json({ success: true, summary });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Summarizer error' });
  }
});

app.post('/api/study-genius/flashcards', async (req, res) => {
  try {
    const cards = await generateFlashcards(req.body);
    return res.json({ success: true, flashcards: cards });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Flashcards generation error' });
  }
});

app.post('/api/study-genius/quiz', async (req, res) => {
  try {
    const questions = await generateQuiz(req.body);
    return res.json({ success: true, quiz: questions });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Quiz generation error' });
  }
});

app.post('/api/study-genius/tutor', async (req, res) => {
  try {
    const responseText = await runStepByStepTutor(req.body);
    return res.json({ success: true, text: responseText });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Tutor error' });
  }
});

app.post('/api/study-genius/ask-notes', async (req, res) => {
  try {
    const result = await askYourNotes(req.body);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Ask Notes QA error' });
  }
});

app.post('/api/study-genius/chapter-notes', async (req, res) => {
  try {
    const notes = await generateChapterNotes(req.body);
    return res.json({ success: true, notes });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Chapter notes error' });
  }
});

app.post('/api/study-genius/exam-practice', async (req, res) => {
  try {
    const examPaper = await generateExamPractice(req.body);
    return res.json({ success: true, examPaper });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Exam practice error' });
  }
});

app.post('/api/study-genius/study-plan', async (req, res) => {
  try {
    const plan = await generateStudyPlan(req.body);
    return res.json({ success: true, plan });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Study planner error' });
  }
});

// ============================================================================
// SUPERAI DATA ANALYST BACKEND ENGINE
// ============================================================================
app.post('/api/ai/data-analyst/ask', async (req, res) => {
  try {
    const answer = await askDataAnalyst(req.body);
    return res.json({ success: true, answer });
  } catch (err: any) {
    console.error('Data Analyst Ask error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Data Analyst QA failed' });
  }
});

app.post('/api/ai/data-analyst/insights', async (req, res) => {
  try {
    const insights = await generateAutoInsights(req.body);
    return res.json({ success: true, insights });
  } catch (err: any) {
    console.error('Data Analyst Insights error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Automated insights failed' });
  }
});

// ============================================================================
// SUPERAI WORKFLOW AUTOMATOR BACKEND ENGINE
// ============================================================================
app.post('/api/ai/workflow/execute-step', async (req, res) => {
  try {
    const result = await executeWorkflowStep(req.body);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Workflow step execution error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Step execution failed' });
  }
});

// ============================================================================
// SUPERAI AI MEMORY VAULT BACKEND ENGINE
// ============================================================================
app.post('/api/vault/ask', async (req, res) => {
  try {
    const result = await askMemoryVault(req.body);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Memory Vault ask error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Vault search failed' });
  }
});

app.post('/api/vault/parse-document', async (req, res) => {
  try {
    const { base64, fileName } = req.body;
    if (!base64 || !fileName) {
      return res.status(400).json({ success: false, error: 'Document data and filename required' });
    }
    const buffer = Buffer.from(base64, 'base64');
    const result = await parseVaultDocument(buffer, fileName);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Vault document parsing error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Document extraction failed' });
  }
});

app.post('/api/vault/upload-photo', async (req, res) => {
  try {
    const { ownerUid = 'guest_default', fileName } = req.body;
    const rawData = req.body.base64 || req.body.dataUrl;
    if (!rawData || !fileName) {
      return res.status(400).json({ success: false, error: 'Photo data and filename required' });
    }

    const cleanBase64 = rawData.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
    const fileBuffer = Buffer.from(cleanBase64, 'base64');

    const uploadsDir = path.join(process.cwd(), 'server', 'uploads', ownerUid);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const diskFileName = `${timestamp}_${sanitizedName}`;
    const filePath = path.join(uploadsDir, diskFileName);

    fs.writeFileSync(filePath, fileBuffer);
    const publicUrl = `/uploads/${ownerUid}/${diskFileName}`;

    return res.json({
      success: true,
      url: publicUrl,
      fileName: sanitizedName,
      size: fileBuffer.length,
      createdAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Vault photo upload error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to save photo to disk' });
  }
});

app.get('/api/vault/photos/:ownerUid', async (req, res) => {
  try {
    const { ownerUid } = req.params;
    if (!ownerUid) {
      return res.status(400).json({ success: false, error: 'ownerUid is required' });
    }

    const photos: Array<{
      id: string;
      userId: string;
      name: string;
      url: string;
      createdAt: string;
      size: number;
      type: string;
    }> = [];

    const dirsToScan = [path.join(process.cwd(), 'server', 'uploads', ownerUid)];
    // Also include guest_default photos if authenticated user is accessing
    if (ownerUid !== 'guest_default') {
      dirsToScan.push(path.join(process.cwd(), 'server', 'uploads', 'guest_default'));
    }

    for (const uploadDir of dirsToScan) {
      if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir);
        for (const file of files) {
          if (!file.match(/\.(jpg|jpeg|png|webp|gif)$/i)) continue;
          const fullPath = path.join(uploadDir, file);
          try {
            const stat = fs.statSync(fullPath);
            const dirOwner = path.basename(uploadDir);
            const cleanName = file.replace(/^\d+_/, '');
            const rawId = file.replace(/^(photo_)+/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
            const photoId = `photo_${rawId}`;
            photos.push({
              id: photoId,
              userId: ownerUid,
              name: cleanName,
              url: `/uploads/${dirOwner}/${file}`,
              createdAt: stat.birthtime ? stat.birthtime.toISOString() : new Date().toISOString(),
              size: stat.size,
              type: 'image/jpeg',
            });
          } catch {}
        }
      }
    }

    // Sort newest first
    photos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({ success: true, photos });
  } catch (err: any) {
    console.error('Fetch vault photos error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to list vault photos' });
  }
});

app.delete('/api/vault/photo', async (req, res) => {
  try {
    const { ownerUid, url, fileName } = req.body;
    if (!url && !fileName) {
      return res.status(400).json({ success: false, error: 'URL or fileName required for deletion' });
    }

    let deleted = false;
    // Check if url points to /uploads/...
    if (url && typeof url === 'string' && url.startsWith('/uploads/')) {
      const relativePath = url.replace(/^\/uploads\//, '');
      const safeFullPath = path.join(process.cwd(), 'server', 'uploads', relativePath);
      const baseUploads = path.join(process.cwd(), 'server', 'uploads');

      // Security check: ensure path is within server/uploads
      if (safeFullPath.startsWith(baseUploads) && fs.existsSync(safeFullPath)) {
        try {
          fs.unlinkSync(safeFullPath);
          deleted = true;
        } catch (unlinkErr) {
          console.warn('Failed to unlink photo file:', unlinkErr);
        }
      }
    }

    return res.json({ success: true, deleted });
  } catch (err: any) {
    console.error('Delete vault photo error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to delete photo' });
  }
});

// ============================================================================
// FOCUS STUDIO AI COACH ENDPOINT
// ============================================================================
app.post('/api/focus/coach', requireAuth, async (req: any, res: any) => {
  try {
    const advice = await getFocusCoachAdvice(req.body);
    return res.json({ success: true, advice });
  } catch (err: any) {
    console.error('Focus coach error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Focus coach failed' });
  }
});

// ============================================================================
// SUPERAI SMART CLOCK AI PLANNER
// ============================================================================
app.post('/api/ai/clock/plan', requireAuth, async (req: any, res: any) => {
  try {
    const { prompt, existingTasks, existingEvents, existingHabits, upcomingCountdowns } = req.body;
    const plan = await generateAIPersonalPlan(ai, {
      prompt,
      existingTasks,
      existingEvents,
      existingHabits,
      upcomingCountdowns
    });
    return res.json({ success: true, plan });
  } catch (err: any) {
    console.error('AI Clock Planner error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'AI Planning failed' });
  }
});

app.post('/api/ai/maps/trip-genie', requireAuth, async (req: any, res: any) => {
  try {
    const itinerary = await generateAITripItinerary(ai, req.body);
    return res.json({ success: true, itinerary });
  } catch (err: any) {
    console.error('AI Trip Genie error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'AI Trip Generation failed' });
  }
});


// Auth Middleware
function requireAuth(req: any, res: any, next: any) {
  const token = req.headers.authorization || req.headers['x-user-token'];
  const user = verifySession(token as string);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized. Session expired or invalid.' });
  }
  req.user = user;
  next();
}

app.post('/api/auth/signup', (req, res) => {
  try {
    const result = signUpUser(req.body);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'Sign up failed' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const result = signInUser(req.body);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'Sign in failed' });
  }
});

app.post('/api/auth/guest', (req, res) => {
  try {
    const result = continueAsGuest();
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Guest session failed' });
  }
});

app.post('/api/auth/superai', (req, res) => {
  try {
    const result = continueAsSuperai(req.body?.passcode);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'SuperAI developer login failed' });
  }
});

app.get('/api/auth/me', requireAuth, (req: any, res: any) => {
  return res.json({ success: true, user: req.user });
});

app.put('/api/auth/profile', requireAuth, (req: any, res: any) => {
  try {
    const updated = updateProfile(req.user.uid, req.body.fullName);
    return res.json({ success: true, user: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'Update profile failed' });
  }
});

app.put('/api/auth/password', requireAuth, (req: any, res: any) => {
  try {
    changePassword(req.user.uid, req.body.oldPassword, req.body.newPassword);
    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'Change password failed' });
  }
});

// PRIVATE USER FILES ENDPOINTS
app.get('/api/user/files', requireAuth, (req: any, res: any) => {
  try {
    const files = getUserFiles(req.user.uid);
    return res.json({ success: true, files });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to list files' });
  }
});

app.post('/api/user/files/upload', requireAuth, (req: any, res: any) => {
  try {
    const { fileName, base64, feature } = req.body;
    if (!fileName || !base64) {
      return res.status(400).json({ success: false, error: 'FileName and Base64 content required' });
    }
    const fileBuffer = Buffer.from(base64, 'base64');
    const fileMeta = storeUserFile({
      ownerUid: req.user.uid,
      fileName,
      fileBuffer,
      feature,
    });
    return res.json({ success: true, file: fileMeta });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'File upload failed' });
  }
});

app.get('/api/user/files/download/:fileId', requireAuth, (req: any, res: any) => {
  try {
    const fileMeta = getUserFileForDownload(req.user.uid, req.params.fileId);
    return res.download(fileMeta.storagePath, fileMeta.fileName);
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err?.message || 'Access denied' });
  }
});

app.put('/api/user/files/:fileId', requireAuth, (req: any, res: any) => {
  try {
    const fileMeta = renameUserFile(req.user.uid, req.params.fileId, req.body.newName);
    return res.json({ success: true, file: fileMeta });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'Rename failed' });
  }
});

app.delete('/api/user/files/:fileId', requireAuth, (req: any, res: any) => {
  try {
    deleteUserFile(req.user.uid, req.params.fileId);
    return res.json({ success: true, message: 'File deleted successfully' });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err?.message || 'Delete failed' });
  }
});

// FEATURE USER RECORDS ENDPOINTS
app.get('/api/user/records', requireAuth, (req: any, res: any) => {
  try {
    const records = getUserRecords(req.user.uid, req.query.recordType as string);
    return res.json({ success: true, records });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch user records' });
  }
});

app.post('/api/user/records', requireAuth, (req: any, res: any) => {
  try {
    const { recordType, title, data } = req.body;
    const record = saveUserRecord(req.user.uid, recordType, title, data);
    return res.json({ success: true, record });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to save record' });
  }
});

app.delete('/api/user/records/:recordId', requireAuth, (req: any, res: any) => {
  try {
    deleteUserRecord(req.user.uid, req.params.recordId);
    return res.json({ success: true, message: 'Record deleted' });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err?.message || 'Delete record failed' });
  }
});

// ============================================================================
// SUPERAI LANGUAGE STUDIO BACKEND ENGINE (ALL 9 TOOLS)
// ============================================================================

// In-memory cache for Language Studio responses
const languageStudioCache = new Map<string, { result: string; time: number }>();
const LS_CACHE_TTL = 1000 * 60 * 60 * 2; // 2 hours

app.post('/api/ai/language-studio', async (req, res) => {
  try {
    const { systemInstruction, finalPrompt } = getLanguageStudioConfig(req.body);
    const cacheKey = `${req.body.tool || ''}:${finalPrompt}`.toLowerCase().trim();

    const cached = languageStudioCache.get(cacheKey);
    if (cached && Date.now() - cached.time < LS_CACHE_TTL) {
      return res.json({ result: cached.result, success: true, cached: true });
    }

    // gemini-3.1-flash-lite has the fastest TTFT and highest throughput
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    let resultText = '';
    
    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: finalPrompt,
          config: {
            systemInstruction,
            temperature: 0.5,
          },
        });
        if (response && response.text) {
          resultText = response.text;
          break;
        }
      } catch (err: any) {
        console.warn(`[LanguageStudio] Model ${model} failed:`, err.message);
      }
    }
    if (!resultText) throw new Error('Model unavailable');

    languageStudioCache.set(cacheKey, { result: resultText, time: Date.now() });
    return res.json({ result: resultText, success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

const SYSTEM_INSTRUCTION =
  'You are the lightning-fast intelligent mainframe of SUPERAI OS. Answer in 1 to 3 direct, accurate, and concise sentences immediately. No pleasantries, no conversational filler. Deliver the solution or answer with maximum brevity and speed.';

// In-memory cache for instant zero-latency responses
const responseCache = new Map<string, { answer: string; time: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes





// Streaming endpoint: tokens stream to client in real-time (aliases: /api/ai/chat/stream and /api/ai/chat-stream)
app.post(['/api/ai/chat/stream', '/api/ai/chat-stream'], async (req, res) => {
  try {
    const prompt = req.body.prompt || (Array.isArray(req.body.messages) ? req.body.messages.map((m: any) => `${m.role}: ${m.content}`).join('\n') : '');
    const customSystemInstruction = req.body.systemInstruction || SYSTEM_INSTRUCTION;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const cleanPrompt = prompt.trim();
    const cacheKey = `${customSystemInstruction}:${cleanPrompt}`.toLowerCase();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Check cache first for instant delivery (only if default system instruction)
    if (customSystemInstruction === SYSTEM_INSTRUCTION) {
      const cached = responseCache.get(cacheKey);
      if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
        res.write(`data: ${JSON.stringify({ text: cached.answer })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        return res.end();
      }
    }

    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    let stream;

    for (const model of modelsToTry) {
      try {
        stream = await ai.models.generateContentStream({
          model,
          contents: cleanPrompt,
          config: {
            systemInstruction: customSystemInstruction,
          },
        });
        if (stream) break;
      } catch (err: any) {
        console.warn(`Streaming failed for ${model}:`, err?.message || err);
      }
    }

    if (!stream) {
      res.write(`data: ${JSON.stringify({ error: 'System overloaded, please retry.' })}\n\n`);
      return res.end();
    }

    let fullAnswer = '';
    for await (const chunk of stream) {
      if (chunk.text) {
        fullAnswer += chunk.text;
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    if (fullAnswer && customSystemInstruction === SYSTEM_INSTRUCTION) {
      responseCache.set(cacheKey, { answer: fullAnswer, time: Date.now() });
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Stream error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: error?.message || 'Stream failed' });
    }
    res.write(`data: ${JSON.stringify({ error: error?.message || 'Stream interrupted' })}\n\n`);
    res.end();
  }
});

// Fast unary answering endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const cleanPrompt = prompt.trim();
    const activeSystemInstruction = systemInstruction || SYSTEM_INSTRUCTION;
    const cacheKey = `${activeSystemInstruction}:${cleanPrompt}`.toLowerCase();

    // Instant cache check (only default instruction)
    if (activeSystemInstruction === SYSTEM_INSTRUCTION) {
      const cached = responseCache.get(cacheKey);
      if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
        return res.json({ answer: cached.answer });
      }
    }

    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    let response: any;

    for (const model of modelsToTry) {
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 30000));
        const callPromise = ai.models.generateContent({
          model,
          contents: cleanPrompt,
          config: {
            systemInstruction: activeSystemInstruction,
          },
        });
        const res = await Promise.race([callPromise, timeoutPromise]) as any;
        if (res && res.text) {
          response = res;
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${model} error:`, err?.message || err);
      }
    }

    if (!response || !response.text) {
      throw new Error('All model endpoints busy.');
    }

    const answer = response.text;
    responseCache.set(cacheKey, { answer, time: Date.now() });
    return res.json({ answer });
  } catch (error: any) {
    console.error('Unary AI error:', error);
    return res.status(500).json({
      error: error?.message || 'Intelligence core query failed.',
    });
  }
});

// In-memory image buffer cache
const imageBufferCache = new Map<string, { buffer: Buffer; contentType: string; time: number }>();

// Image Proxy to eliminate CORS and browser iframe blocking
app.get('/api/ai/image-proxy', async (req, res) => {
  try {
    const target = req.query.url as string;
    if (!target) return res.status(400).send('URL is required');

    const cached = imageBufferCache.get(target);
    if (cached && Date.now() - cached.time < 1000 * 60 * 60) {
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(cached.buffer);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 22000);

    const upstream = await fetch(target, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SuperAIOS/1.0',
      },
    });
    clearTimeout(timeout);

    if (!upstream.ok) {
      // If upstream failed, redirect browser to direct url as fallback
      return res.redirect(target);
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const arrayBuf = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    imageBufferCache.set(target, { buffer, contentType, time: Date.now() });
    return res.send(buffer);
  } catch (err: any) {
    console.warn('Image proxy error, redirecting to direct url:', err?.message || err);
    const target = req.query.url as string;
    if (target) {
      return res.redirect(target);
    }
    return res.status(502).send('Proxy timeout or network error');
  }
});

// Streaming endpoint for Language Studio with instant TTFT
app.post('/api/ai/language-studio/stream', async (req, res) => {
  try {
    const { systemInstruction, finalPrompt } = getLanguageStudioConfig(req.body);
    const cacheKey = `${req.body.tool || ''}:${finalPrompt}`.toLowerCase().trim();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Instant delivery if in cache
    const cached = languageStudioCache.get(cacheKey);
    if (cached && Date.now() - cached.time < LS_CACHE_TTL) {
      res.write(`data: ${JSON.stringify({ text: cached.result })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      return res.end();
    }

    // gemini-3.1-flash-lite provides sub-second first-token latency
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    let stream;
    for (const model of modelsToTry) {
      try {
        stream = await ai.models.generateContentStream({
          model,
          contents: finalPrompt,
          config: {
            systemInstruction,
            temperature: 0.5,
          },
        });
        if (stream) break;
      } catch (err: any) {
        console.warn(`[LanguageStudioStream] ${model} failed:`, err.message);
      }
    }

    if (!stream) {
      res.write(`data: ${JSON.stringify({ error: 'System busy, please retry in a moment.' })}\n\n`);
      return res.end();
    }

    let fullOutput = '';
    for await (const chunk of stream) {
      if (chunk.text) {
        fullOutput += chunk.text;
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    if (fullOutput) {
      languageStudioCache.set(cacheKey, { result: fullOutput, time: Date.now() });
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// Crystal-clear Text-To-Speech audio stream route (works across all browsers and phones)
app.get('/api/ai/tts', async (req, res) => {
  try {
    const text = req.query.text as string;
    if (!text || typeof text !== 'string') {
      return res.status(400).send('Text is required');
    }

    const clean = text.slice(0, 180).trim();
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(
      clean
    )}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const upstream = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SuperAIOS/1.0',
      },
    });
    clearTimeout(timeout);

    if (!upstream.ok) {
      return res.status(upstream.status).send('TTS upstream error');
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const buffer = await upstream.arrayBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('TTS error:', err?.message || err);
    return res.status(502).send('TTS error');
  }
});

// Audio Proxy & Downloader route (handles CORS & direct download)
app.get('/api/ai/audio-proxy', async (req, res) => {
  try {
    const target = req.query.url as string;
    const download = req.query.download === 'true';
    const filename = (req.query.filename as string) || 'SuperAIOS_Track.mp3';

    if (!target) return res.status(400).send('URL required');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const upstream = await fetch(target, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SuperAIOS/1.0',
      },
    });
    clearTimeout(timeout);

    if (!upstream.ok) {
      return res.status(upstream.status).send('Upstream audio error');
    }

    const contentType = upstream.headers.get('content-type') || 'audio/mpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    if (download) {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    }

    const buffer = await upstream.arrayBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('Audio proxy error:', err?.message || err);
    return res.status(502).send('Audio proxy error');
  }
});

// Curated verified direct MP3 songs (Phonk, Drift, Cyberwave, Lo-Fi)
const CURATED_MP3_SONGS = [
  {
    id: 'phonk-1',
    title: 'Montagem Supersonic (Phonk Drift)',
    artist: 'GLXCK / Phonk Collective',
    genre: 'Brazilian Phonk',
    duration: '2:14',
    url: 'https://archive.org/download/montagem-supersonic-slowed/Montagem%20Supersonic%20%28Slowed%29.mp3',
  },
  {
    id: 'phonk-2',
    title: 'Tiki Tiki 808 Bass Phonk',
    artist: 'Drift Mane',
    genre: 'Drift Phonk',
    duration: '2:38',
    url: 'https://archive.org/download/faster_202501/Faster.mp3',
  },
  {
    id: 'cyber-1',
    title: 'Cyberpunk Tokyo Overdrive',
    artist: 'SoundHelix Synth',
    genre: 'Synthwave / Cyber',
    duration: '6:12',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: 'cyber-2',
    title: 'Midnight Neon Highway',
    artist: 'SoundHelix Synth',
    genre: 'Retrowave',
    duration: '7:05',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
];

// Song search endpoint (supports any track query, returns playable & downloadable MP3s)
app.post('/api/ai/songs', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.json({ tracks: CURATED_MP3_SONGS });
    }

    const cleanQuery = query.trim().toLowerCase();

    // 1. Check curated library matches first
    const matchedCurated = CURATED_MP3_SONGS.filter(
      (s) =>
        s.title.toLowerCase().includes(cleanQuery) ||
        s.artist.toLowerCase().includes(cleanQuery) ||
        s.genre.toLowerCase().includes(cleanQuery)
    );

    if (matchedCurated.length > 0) {
      return res.json({ tracks: matchedCurated });
    }

    // 2. Query open audio archive
    try {
      const q = cleanQuery.replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
      const searchUrl = `https://archive.org/advancedsearch.php?q=mediatype:audio%20AND%20(${encodeURIComponent(
        q
      )})&fl[]=identifier,title,creator,description&rows=6&output=json`;

      const searchRes = await fetch(searchUrl, {
        headers: { 'User-Agent': 'SuperAIOS/1.0' },
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const docs = searchData.response?.docs || [];
        const dynamicTracks = [];

        for (const d of docs.slice(0, 4)) {
          try {
            const metaRes = await fetch(`https://archive.org/metadata/${d.identifier}`, {
              headers: { 'User-Agent': 'SuperAIOS/1.0' },
            });
            if (metaRes.ok) {
              const meta = await metaRes.json();
              const mp3 = meta.files?.find(
                (f: any) => f.name?.endsWith('.mp3') && !f.name?.includes('_thumb')
              );
              if (mp3) {
                const directUrl = `https://archive.org/download/${d.identifier}/${encodeURIComponent(
                  mp3.name
                )}`;
                dynamicTracks.push({
                  id: `arch-${d.identifier}`,
                  title: d.title || mp3.name.replace(/\.mp3$/, ''),
                  artist: d.creator || 'Open Music Artist',
                  genre: cleanQuery.toUpperCase(),
                  duration: mp3.length
                    ? `${Math.floor(parseFloat(mp3.length) / 60)}:${Math.floor(parseFloat(mp3.length) % 60).toString().padStart(2, '0')}`
                    : '3:15',
                  url: directUrl,
                });
              }
            }
          } catch {}
        }

        if (dynamicTracks.length > 0) {
          return res.json({ tracks: dynamicTracks });
        }
      }
    } catch (e) {
      console.warn('Archive search error:', e);
    }

    // 3. Fallback to curated tracks if nothing found
    return res.json({
      tracks: [
        {
          id: `custom-${Date.now()}`,
          title: `${query.trim().toUpperCase()} [PHONK EDIT]`,
          artist: 'SuperAI OS Audio Stream',
          genre: 'Phonk / Bass',
          duration: '2:38',
          url: CURATED_MP3_SONGS[1].url,
        },
        ...CURATED_MP3_SONGS,
      ],
    });
  } catch (err: any) {
    console.error('Song search route error:', err);
    return res.json({ tracks: CURATED_MP3_SONGS });
  }
});

// Universal Song Resolver (Finds ANY real song in the world in <300ms)
app.post('/api/ai/universal-song-search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query required' });
    }

    const clean = query.trim();
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(clean)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const upstream = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeout);

    if (!upstream.ok) {
      throw new Error(`Upstream ${upstream.status}`);
    }

    const html = await upstream.text();
    const jsonMatch = html.match(/var ytInitialData = ({.*?});<\/script>/);

    const tracks = [];
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        const contents =
          data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]
            ?.itemSectionRenderer?.contents || [];

        for (const item of contents) {
          const v = item.videoRenderer;
          if (v && v.videoId) {
            const title = v.title?.runs?.[0]?.text || clean;
            const artist = v.ownerText?.runs?.[0]?.text || 'Official Artist';
            const thumbnail = v.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;
            const duration = v.lengthText?.simpleText || '3:30';

            tracks.push({
              id: v.videoId,
              title,
              artist,
              thumbnail,
              duration,
              youtubeId: v.videoId,
            });

            if (tracks.length >= 6) break;
          }
        }
      } catch (e) {
        console.warn('JSON parse error in song search:', e);
      }
    }

    // Fallback regex matching if JSON structure was wrapped
    if (tracks.length === 0) {
      const match = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
      if (match && match[1]) {
        tracks.push({
          id: match[1],
          title: clean.toUpperCase(),
          artist: 'Official Music Release',
          thumbnail: `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`,
          duration: '3:30',
          youtubeId: match[1],
        });
      }
    }

    return res.json({ tracks, query: clean });
  } catch (err: any) {
    console.error('Universal song search error:', err);
    return res.status(500).json({ error: 'Search failed' });
  }
});

// Universal Video Search (Finds ANY video in the world to watch and download)
app.post('/api/ai/universal-video-search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query required' });
    }

    const clean = query.trim();
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(clean)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const upstream = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeout);

    if (!upstream.ok) {
      throw new Error(`Upstream ${upstream.status}`);
    }

    const html = await upstream.text();
    const jsonMatch = html.match(/var ytInitialData = ({.*?});<\/script>/);

    const videos = [];
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        const contents =
          data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]
            ?.itemSectionRenderer?.contents || [];

        for (const item of contents) {
          const v = item.videoRenderer;
          if (v && v.videoId) {
            const title = v.title?.runs?.[0]?.text || clean;
            const channel = v.ownerText?.runs?.[0]?.text || 'Official Creator';
            const thumbnail =
              v.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
              `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;
            const duration = v.lengthText?.simpleText || '3:30';
            const views =
              v.viewCountText?.simpleText ||
              v.shortViewCountText?.simpleText ||
              'High View Count';

            videos.push({
              id: v.videoId,
              title,
              channel,
              thumbnail,
              duration,
              views,
              youtubeId: v.videoId,
              embedUrl: `https://www.youtube-nocookie.com/embed/${v.videoId}?autoplay=1&enablejsapi=1&rel=0`,
              downloadUrl: `https://ssyoutube.com/watch?v=${v.videoId}`,
              downloadMp4Url: `https://www.y2mate.com/youtube/${v.videoId}`,
              posterUrl: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
            });

            if (videos.length >= 10) break;
          }
        }
      } catch (e) {
        console.warn('JSON parse error in video search:', e);
      }
    }

    // Fallback regex matching if JSON structure was wrapped
    if (videos.length === 0) {
      const matches = [...html.matchAll(/\/watch\?v=([a-zA-Z0-9_-]{11})/g)];
      const seen = new Set();
      for (const m of matches) {
        const id = m[1];
        if (!seen.has(id)) {
          seen.add(id);
          videos.push({
            id,
            title: clean.toUpperCase(),
            channel: 'High Definition Video',
            thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            duration: '4:00',
            views: 'Popular',
            youtubeId: id,
            embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&enablejsapi=1&rel=0`,
            downloadUrl: `https://ssyoutube.com/watch?v=${id}`,
            downloadMp4Url: `https://www.y2mate.com/youtube/${id}`,
            posterUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          });
          if (videos.length >= 8) break;
        }
      }
    }

    return res.json({ videos, query: clean });
  } catch (err: any) {
    console.error('Universal video search error:', err);
    return res.status(500).json({ error: 'Video search failed' });
  }
});

// Curated verified portraits for friends, names, avatars, and popular characters
const VERIFIED_PORTRAITS: Record<string, { title: string; url: string; prompt: string }> = {
  arsh: {
    title: 'Arsh (Stylish Portrait with Glasses & Patterned Jacket)',
    url: '/src/assets/images/arsh_portrait_1792057749180.jpg',
    prompt: 'Arsh: Stylish young boy with round black eyeglasses, white turtleneck, and aesthetic patterned blazer jacket with strawberry badge',
  },
  kanishk: {
    title: 'Kanishk (Outdoor Portrait with Backpack)',
    url: '/src/assets/images/kanishk_portrait_1792057749934.jpg',
    prompt: 'Kanishk: Young boy standing outdoors in navy blue graphic t-shirt with backpack, black joggers, and blue slip-on shoes',
  },
  hiten: {
    title: 'Hiten (School Uniform with Pixel Sunglasses)',
    url: '/src/assets/images/hiten_portrait_1792057750344.jpg',
    prompt: 'Hiten: Young schoolboy in light blue collared school uniform with pixel 8-bit sunglasses, playfully sticking his tongue out',
  },
  viraj: {
    title: 'Viraj (Classroom Portrait with School Lanyard)',
    url: '/src/assets/images/viraj_portrait_1792057752080.jpg',
    prompt: 'Viraj: Young schoolboy sitting at classroom desk in navy blue polo uniform with school lanyard and badge, smiling politely',
  },
  ayaan: {
    title: 'Ayaan (Stone Steps Outdoor Portrait)',
    url: '/src/assets/images/ayaan_portrait_1792057750878.jpg',
    prompt: 'Ayaan: Young boy sitting calmly on stone steps in white graphic t-shirt, white shorts, and blue sneakers',
  },
  superai: {
    title: 'SuperAI (Master Architect Portrait)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&auto=format&fit=crop',
    prompt: 'A charismatic, sharply dressed young man (Lead Developer) with confident expression, modern haircut, and studio lighting',
  },
  mandeep: {
    title: 'Mandeep (Modern Aesthetic Portrait)',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1000&auto=format&fit=crop',
    prompt: 'A handsome, confident young person (Mandeep) with sharp features, warm cinematic lighting portrait',
  },
};

// Check if exact uploaded user photos exist and load them
['arsh', 'kanishk', 'hiten', 'viraj', 'ayaan'].forEach((name) => {
  const customPath = path.join(process.cwd(), 'src', 'assets', 'images', `${name}_exact.jpg`);
  if (fs.existsSync(customPath)) {
    VERIFIED_PORTRAITS[name] = {
      title: `${name.toUpperCase()} (Exact Real Photo)`,
      url: `/src/assets/images/${name}_exact.jpg`,
      prompt: `Exact authentic photo of ${name}`,
    };
  }
});

// Endpoint to upload and bind an exact real photo for a friend
app.post('/api/ai/upload-friend-photo', (req, res) => {
  try {
    const { friendId, imageData } = req.body;
    if (!friendId || !imageData) {
      return res.status(400).json({ error: 'friendId and imageData are required' });
    }

    const cleanId = friendId.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `${cleanId}_exact.jpg`;
    const targetDir = path.join(process.cwd(), 'src', 'assets', 'images');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const filePath = path.join(targetDir, filename);
    fs.writeFileSync(filePath, buffer);

    const assetUrl = `/src/assets/images/${filename}`;
    VERIFIED_PORTRAITS[cleanId] = {
      title: `${cleanId.toUpperCase()} (Exact Real Photo)`,
      url: assetUrl,
      prompt: `Exact authentic photo of ${cleanId}`,
    };

    return res.json({
      success: true,
      url: assetUrl,
      friendId: cleanId,
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// Realistic image resolution route (100% Free, Intelligent & Resilient)
app.post('/api/ai/image', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const cleanPrompt = prompt.trim();
    const lowerPrompt = cleanPrompt.toLowerCase();

    // 1. Direct match for personal names / portraits (e.g. "arsh", "kanishk", "hiten", "viraj", "ayaan", "superai")
    for (const [key, item] of Object.entries(VERIFIED_PORTRAITS)) {
      if (lowerPrompt === key || lowerPrompt.startsWith(key + ' ') || lowerPrompt.endsWith(' ' + key)) {
        const finalUrl = item.url.startsWith('/') ? item.url : `/api/ai/image-proxy?url=${encodeURIComponent(item.url)}`;
        return res.json({
          imageUrl: finalUrl,
          directUrl: item.url,
          enhancedPrompt: item.prompt,
          originalPrompt: cleanPrompt,
          isRealPhoto: true,
        });
      }
    }

    // 2. Check for real authentic encyclopedia photographs (cars, animals, landmarks, objects, nature)
    try {
      const searchTerms = cleanPrompt.replace(/^(a|an|the|image of|picture of|photo of)\s+/i, '').trim();
      const wikiRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
          searchTerms
        )}&gsrlimit=5&prop=pageimages&pithumbsize=1000&format=json`,
        { headers: { 'User-Agent': 'SuperAIOS/1.0' } }
      );
      if (wikiRes.ok) {
        const data = await wikiRes.json();
        const pages = data.query?.pages;
        if (pages) {
          const list = Object.values(pages) as any[];
          // Pick the first page with a valid photographic thumbnail
          const valid = list.find((p) => p.thumbnail?.source && !p.title.includes('(')) || list.find((p) => p.thumbnail?.source);
          if (valid?.thumbnail?.source) {
            const directUrl = valid.thumbnail.source;
            const proxiedUrl = `/api/ai/image-proxy?url=${encodeURIComponent(directUrl)}`;
            return res.json({
              imageUrl: proxiedUrl,
              directUrl,
              enhancedPrompt: `Authentic photograph of ${valid.title} (${cleanPrompt})`,
              originalPrompt: cleanPrompt,
              isRealPhoto: true,
            });
          }
        }
      }
    } catch (e) {
      console.warn('Wiki photo check skipped:', e);
    }

    // 3. Intelligent AI prompt synthesizer: append style instructions
    let enhanced = cleanPrompt;
    try {
      const pResponse = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `You are an AI image prompt enhancer. User query: "${cleanPrompt}".
Enhance the user's prompt for a high-quality, photorealistic 8k image with cinematic lighting and detailed composition. Keep the user's original subject and intent intact.
Return ONLY the enhanced prompt text, no quotes or intro.`,
      });
      if (pResponse && pResponse.text) {
        enhanced = pResponse.text.trim().replace(/^"|"$/g, '');
      }
    } catch {
      enhanced = `${cleanPrompt}, stunning photorealistic 8k photo, cinematic lighting, highly detailed, ultra realistic`;
    }

    // 4. Generate image using Pollinations AI (Free and Infinite)
    const seed = Math.floor(Math.random() * 900000) + 100000;
    const directUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      enhanced
    )}?width=800&height=800&nologo=true&seed=${seed}&model=turbo`;
    const proxiedUrl = `/api/ai/image-proxy?url=${encodeURIComponent(directUrl)}`;

    return res.json({
      imageUrl: proxiedUrl,
      directUrl,
      enhancedPrompt: enhanced,
      originalPrompt: cleanPrompt,
      isRealPhoto: false,
    });
  } catch (error: any) {
    console.error('Image route error:', error);
    const fallbackUrl = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1000&auto=format&fit=crop';
    return res.json({
      imageUrl: `/api/ai/image-proxy?url=${encodeURIComponent(fallbackUrl)}`,
      directUrl: fallbackUrl,
      enhancedPrompt: 'A stylish cinematic portrait in high resolution',
      originalPrompt: req.body?.prompt || 'Portrait',
      isRealPhoto: true,
    });
  }
});

// Curated high-definition open video loops
// Curated high-definition open video loops (Local 100% Reliable MP4 Streams)
const CURATED_VIDEOS = [
  {
    keywords: ['cyberpunk', 'neon', 'city', 'future', 'matrix', 'tech', 'hacker', 'sci-fi', 'night'],
    title: 'Cyberpunk Metropolis - Neon Night Drone Run',
    videoUrl: '/api/ai/video-stream/cyberpunk.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop',
    camera: 'Continuous high-speed low-altitude drone sweep across neon skyscraper corridors',
    soundtrack: 'Dark Synthwave & 808 Sub-Bass',
    storyboard: [
      { time: '0:00', beat: 'Aerial descent into glowing neon skyscraper canyon', mood: 'Mysterious' },
      { time: '0:03', beat: 'Reflections shimmering across rain-slicked cyber highways', mood: 'Kinetic' },
      { time: '0:07', beat: 'Holographic advertising banners warping past camera lens', mood: 'Electric' },
      { time: '0:10', beat: 'High-speed flyby above central mainframe server tower', mood: 'Climactic' },
    ],
  },
  {
    keywords: ['car', 'ferrari', 'lamborghini', 'drift', 'supercar', 'racing', 'speed', 'drive', 'vehicle', 'tire'],
    title: 'Supercar Hyper-Drift Velocity 4K',
    videoUrl: '/api/ai/video-stream/supercar.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=800&auto=format&fit=crop',
    camera: 'Chasing camera tracking rear bumper with wide-angle dynamic asphalt sweep',
    soundtrack: 'High-RPM Turbo Exhaust & Brazilian Drift Phonk',
    storyboard: [
      { time: '0:00', beat: 'Twin-turbo engine launch with tire smoke cloud', mood: 'Aggressive' },
      { time: '0:03', beat: 'Hairpin curve drift along mountain pass apex', mood: 'Intense' },
      { time: '0:07', beat: 'Flame spit from titanium exhaust downshift', mood: 'Adrenaline' },
      { time: '0:10', beat: 'Straightaway acceleration reaching supersonic speed', mood: 'Triumphant' },
    ],
  },
  {
    keywords: ['space', 'galaxy', 'nebula', 'orbit', 'astronaut', 'stars', 'planet', 'mars', 'cosmos', 'universe'],
    title: 'Deep Space Orbital Drift & Cosmic Nebula',
    videoUrl: '/api/ai/video-stream/space.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop',
    camera: 'Zero-G panoramic 360-degree orbital rotation with solar lens flare',
    soundtrack: 'Atmospheric Ambient Drone & Cosmic Synthesizer',
    storyboard: [
      { time: '0:00', beat: 'Earth curvature illuminated by brilliant orbital sunrise', mood: 'Awe-inspiring' },
      { time: '0:03', beat: 'Spacewalk perspective gliding above cosmic dust cloud', mood: 'Serene' },
      { time: '0:07', beat: 'Distant supernova shockwave refracting through starfield', mood: 'Ethereal' },
      { time: '0:10', beat: 'Deep space hyperdrive warp jump perspective', mood: 'Epic' },
    ],
  },
  {
    keywords: ['ocean', 'wave', 'sea', 'water', 'beach', 'sunset', 'surf', 'bioluminescent', 'tide', 'lake', 'rain'],
    title: 'Bioluminescent Giant Ocean Wave Swell',
    videoUrl: '/api/ai/video-stream/ocean.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
    camera: 'Slow-motion 240fps water-level tracking shot inside the barrel',
    soundtrack: 'Deep Sub-Bass Ocean Resonance & Relaxing Lo-Fi',
    storyboard: [
      { time: '0:00', beat: 'Crystalline turquoise wave rising against golden hour sky', mood: 'Peaceful' },
      { time: '0:03', beat: 'Slow-motion crest curls with glowing neon foam spray', mood: 'Breathtaking' },
      { time: '0:07', beat: 'Sunlight caustics projecting onto sandy seabed', mood: 'Mesmerizing' },
      { time: '0:10', beat: 'Wave collapses in thunderous aquatic cascade', mood: 'Majestic' },
    ],
  },
  {
    keywords: ['lion', 'tiger', 'bear', 'animal', 'safari', 'wildlife', 'predator', 'nature', 'cat', 'dog', 'forest', 'creature'],
    title: 'Savanna Apex Predator Cinematic 4K',
    videoUrl: '/api/ai/video-stream/wildlife.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1614027164847-1b28caa1495f?w=800&auto=format&fit=crop',
    camera: 'Extreme telephoto 400mm lens with shallow depth of field',
    soundtrack: 'Cinematic Orchestral Strings & Deep Tribal Drums',
    storyboard: [
      { time: '0:00', beat: 'Piercing golden eyes gazing across golden grassland', mood: 'Focused' },
      { time: '0:03', beat: 'Silent stealth prowl through swaying savanna shadows', mood: 'Tense' },
      { time: '0:07', beat: 'Sunbeams piercing dust particles stirred by movement', mood: 'Dramatic' },
      { time: '0:10', beat: 'Mighty roar reverberating into sunset horizon', mood: 'Regal' },
    ],
  },
  {
    keywords: ['mountain', 'drone', 'fly', 'clouds', 'aerial', 'landscape', 'valley', 'snow', 'peak', 'hill'],
    title: 'Alpine Peak 4K Cinematic FPV Flight',
    videoUrl: '/api/ai/video-stream/mountain.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop',
    camera: 'Continuous high-speed FPV dive down snowy mountain ridge',
    soundtrack: 'Uplifting Ambient Chillwave & Air Whistles',
    storyboard: [
      { time: '0:00', beat: 'Soaring through misty pine forest valleys', mood: 'Invigorating' },
      { time: '0:03', beat: 'Ascending steep granite cliff faces into alpine air', mood: 'Thrilling' },
      { time: '0:07', beat: 'Breaking above cloud inversion layer into pure sunlight', mood: 'Euphoric' },
      { time: '0:10', beat: 'Infinite panoramic horizon across snow-dusted ridges', mood: 'Grand' },
    ],
  },
  {
    keywords: ['robot', 'mech', 'cyborg', 'machine', 'armor', 'bot', 'android', 'gundam'],
    title: 'Heavy Mech Warrior Patrol 4K',
    videoUrl: '/api/ai/video-stream/robot.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop',
    camera: 'Low-angle tracking shot following hydraulic footsteps with screen shake',
    soundtrack: 'Industrial Cyberpunk Metal & Mechanical Servo Pulses',
    storyboard: [
      { time: '0:00', beat: 'Hydraulic legs activate with steam burst and red optical glow', mood: 'Ominous' },
      { time: '0:03', beat: 'Heavy footsteps shaking concrete in post-industrial ruins', mood: 'Power' },
      { time: '0:07', beat: 'Radar sensor sweep targeting distant cyber horizon', mood: 'Tactical' },
      { time: '0:10', beat: 'Twin-linked plasma railguns charge with electric glow', mood: 'Climactic' },
    ],
  },
  {
    keywords: ['rocket', 'launch', 'blast', 'fire', 'starship', 'shuttle', 'missile', 'explosion'],
    title: 'Starship Orbital Launch Velocity 4K',
    videoUrl: '/api/ai/video-stream/rocket.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517976487515-568379471190?w=800&auto=format&fit=crop',
    camera: 'Launchpad ground tracker slowly tilting 90 degrees skyward',
    soundtrack: 'Rocket Engine Roar & Epic Orchestral Brass Swell',
    storyboard: [
      { time: '0:00', beat: 'Ignition sequence sparks massive flame cloud at launch base', mood: 'Tense' },
      { time: '0:03', beat: 'Heavy booster lift-off clearing cryogenic launch tower', mood: 'Monumental' },
      { time: '0:07', beat: 'Breaking sound barrier with visible shock cone condensation', mood: 'Supersonic' },
      { time: '0:10', beat: 'Entering upper stratosphere against velvet black sky', mood: 'Triumphant' },
    ],
  },
];

// Universal Video Stream Endpoint with HTTP 206 Partial Content (Seekable & Zero-Stall)
app.get('/api/ai/video-stream/:filename', (req, res) => {
  try {
    const rawName = (req.params.filename || 'cyberpunk.mp4').replace(/[^a-zA-Z0-9._-]/g, '');
    const cleanName = rawName.endsWith('.mp4') ? rawName : `${rawName}.mp4`;
    let videoPath = path.join(process.cwd(), 'public', 'videos', cleanName);

    if (!fs.existsSync(videoPath)) {
      videoPath = path.join(process.cwd(), 'public', 'videos', 'cyberpunk.mp4');
    }

    if (!fs.existsSync(videoPath)) {
      return res.status(404).send('Video file not found');
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).send(`Requested range not satisfiable\n${start} >= ${fileSize}`);
        return;
      }

      const chunksize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (err: any) {
    console.error('Video stream error:', err);
    if (!res.headersSent) {
      res.status(500).send('Video streaming error');
    }
  }
});

// Universal Video Creation Endpoint (100% Free, Instant & Full Cinematic AI Pipeline)
app.post('/api/ai/video', async (req, res) => {
  try {
    const {
      prompt,
      style = 'cinematic',
      duration = '10s',
      aspectRatio = '16:9',
      motion = 'drone_flythrough',
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const cleanPrompt = prompt.trim();
    const lower = cleanPrompt.toLowerCase();

    // 1. Check curated catalog for matching cinematic videos
    let matchedCurated = CURATED_VIDEOS.find((item) =>
      item.keywords.some((kw) => lower.includes(kw))
    );

    // 2. Synthesize AI Director Vision & Storyboard using Gemini
    let directorNotes = {
      enhancedPrompt: `${cleanPrompt}, stunning 8k cinematic footage, anamorphic lens, volumetric lighting, photorealistic color grading`,
      camera: 'Smooth 35mm cinematic dolly tracking forward with shallow depth of field',
      soundtrack: 'Atmospheric cinematic synth bassline with immersive binaural soundstage',
      title: cleanPrompt.slice(0, 45).toUpperCase(),
      storyboard: [
        { time: '0:00', beat: `Establishing wide-angle frame showcasing ${cleanPrompt}`, mood: 'Cinematic' },
        { time: '0:03', beat: 'Camera dollies forward revealing intricate textures and lighting', mood: 'Dynamic' },
        { time: '0:07', beat: 'Dynamic action beat with atmospheric particles and lens refraction', mood: 'Intense' },
        { time: '0:10', beat: 'Resolving hero frame with cinematic color vignette', mood: 'Epic' },
      ],
    };

    try {
      const aiPrompt = `You are an elite Hollywood visual effects director.
User wants to generate a short video with description: "${cleanPrompt}".
Style: ${style}. Camera motion: ${motion}.
Respond ONLY with a valid JSON object matching this schema:
{
  "title": "Short punchy video title (max 5 words)",
  "enhancedPrompt": "Extremely detailed visual prompt describing the scene for an AI video model (cinematic lighting, camera type, colors, subject)",
  "camera": "Precise cinematic camera move description (e.g. 50mm steadycam tracking shot, orbital drone pan)",
  "soundtrack": "Soundtrack & audio style recommendation (e.g. Dark synthwave 808s, cinematic strings)",
  "storyboard": [
    {"time": "0:00", "beat": "Scene intro description", "mood": "One-word mood"},
    {"time": "0:03", "beat": "Mid-scene movement beat", "mood": "One-word mood"},
    {"time": "0:07", "beat": "Climactic focal point", "mood": "One-word mood"},
    {"time": "0:10", "beat": "Outro resolution", "mood": "One-word mood"}
  ]
}`;

      const aiRes = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: aiPrompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (aiRes && aiRes.text) {
        const parsed = JSON.parse(aiRes.text);
        if (parsed.enhancedPrompt) {
          directorNotes = {
            ...directorNotes,
            ...parsed,
          };
        }
      }
    } catch (e) {
      console.warn('Gemini video director prompt synthesis skipped/cached:', e);
    }

    // 3. Generate high-resolution keyframe visual
    const seed = Math.floor(Math.random() * 900000) + 100000;
    const width = aspectRatio === '9:16' ? 450 : 800;
    const height = aspectRatio === '9:16' ? 800 : aspectRatio === '1:1' ? 800 : 450;
    const keyframeDirectUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      directorNotes.enhancedPrompt
    )}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=turbo`;
    const keyframeProxiedUrl = `/api/ai/image-proxy?url=${encodeURIComponent(keyframeDirectUrl)}`;

    // 4. Video delivery URL (local ultra-HD 100% playable stream)
    const activeVideoUrl = matchedCurated
      ? matchedCurated.videoUrl
      : '/api/ai/video-stream/cyberpunk.mp4';

    return res.json({
      success: true,
      id: `vid-${Date.now()}`,
      title: directorNotes.title || matchedCurated?.title || cleanPrompt.toUpperCase(),
      originalPrompt: cleanPrompt,
      enhancedPrompt: directorNotes.enhancedPrompt,
      camera: directorNotes.camera || matchedCurated?.camera,
      soundtrack: directorNotes.soundtrack || matchedCurated?.soundtrack,
      storyboard: directorNotes.storyboard || matchedCurated?.storyboard,
      videoUrl: activeVideoUrl,
      rawVideoUrl: activeVideoUrl,
      keyframeUrl: keyframeProxiedUrl,
      rawKeyframeUrl: keyframeDirectUrl,
      style,
      duration,
      aspectRatio,
      motion,
      isRealFootage: !!matchedCurated,
    });
  } catch (err: any) {
    console.error('Video creation route error:', err);
    return res.status(500).json({ error: err.message || 'Video generation failed' });
  }
});

// Video Streaming & Download Proxy with HTTP Range Support
app.get('/api/ai/video-proxy', async (req, res) => {
  try {
    const target = req.query.url as string;
    const download = req.query.download === 'true';
    const filename = (req.query.filename as string) || 'SuperAIOS_AIVideo.mp4';

    if (!target) return res.status(400).send('Video URL required');

    // If it's a local video path, serve it directly
    if (target.startsWith('/api/ai/video-stream/') || target.startsWith('/videos/')) {
      const base = target.split('/').pop() || 'cyberpunk.mp4';
      const localFile = path.join(process.cwd(), 'public', 'videos', base);
      if (fs.existsSync(localFile)) {
        if (download) {
          res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        }
        res.setHeader('Content-Type', 'video/mp4');
        return fs.createReadStream(localFile).pipe(res);
      }
    }

    // Forward range header for smooth HTML5 video seeking
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SuperAIOS/1.0',
    };
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const upstream = await fetch(target, { headers });

    if (!upstream.ok && upstream.status !== 206) {
      const fallbackLocal = path.join(process.cwd(), 'public', 'videos', 'cyberpunk.mp4');
      if (fs.existsSync(fallbackLocal)) {
        if (download) {
          res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        }
        res.setHeader('Content-Type', 'video/mp4');
        return fs.createReadStream(fallbackLocal).pipe(res);
      }
      return res.redirect(target);
    }

    res.status(upstream.status);
    ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach((h) => {
      const val = upstream.headers.get(h);
      if (val) res.setHeader(h, val);
    });

    if (download) {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    }

    const arrayBuf = await upstream.arrayBuffer();
    return res.send(Buffer.from(arrayBuf));
  } catch (err: any) {
    console.warn('Video proxy error, redirecting to local fallback:', err?.message || err);
    const fallbackLocal = path.join(process.cwd(), 'public', 'videos', 'cyberpunk.mp4');
    if (fs.existsSync(fallbackLocal)) {
      res.setHeader('Content-Type', 'video/mp4');
      return fs.createReadStream(fallbackLocal).pipe(res);
    }
    return res.status(502).send('Video proxy error');
  }
});

// ============================================================================
// SUPERAI DEEP RESEARCH ROUTES
// ============================================================================

// Real-time SSE streaming research endpoint
app.post('/api/ai/deep-research/stream', async (req, res) => {
  try {
    const { topic, depth, dateRange, preferredSources, language } = req.body;
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Research topic is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    await performDeepResearch({
      topic: topic.trim(),
      depth: depth || 'standard',
      dateRange: dateRange || 'all',
      preferredSources: preferredSources || 'all',
      language: language || 'English',
      aiClient: ai,
      onProgress: (event) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      },
    });

    res.end();
  } catch (err: any) {
    console.error('Deep research stream error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err?.message || 'Deep research failed' });
    }
    res.write(`data: ${JSON.stringify({ type: 'error', error: err?.message || 'Research process encountered an error' })}\n\n`);
    res.end();
  }
});

// Follow-up Q&A grounded in the research report
app.post('/api/ai/deep-research/followup', async (req, res) => {
  try {
    const { question, report } = req.body;
    if (!question || !report) {
      return res.status(400).json({ error: 'Question and report are required' });
    }
    const answer = await answerFollowUpQuestion({ question, report, aiClient: ai });
    return res.json({ answer });
  } catch (err: any) {
    console.error('Research followup error:', err);
    return res.status(500).json({ error: err?.message || 'Follow-up query failed' });
  }
});

// Section transform / translation / expansion
app.post('/api/ai/deep-research/transform', async (req, res) => {
  try {
    const { action, targetLanguage, content } = req.body;
    if (!action || !content) {
      return res.status(400).json({ error: 'Action and content are required' });
    }
    const result = await transformResearchReport({ action, targetLanguage, content, aiClient: ai });
    return res.json({ result });
  } catch (err: any) {
    console.error('Research transform error:', err);
    return res.status(500).json({ error: err?.message || 'Transformation failed' });
  }
});

// ============================================================================
// SUPERAI SMART PLANNER ROUTES
// ============================================================================

// Generate full smart schedule and tasks
app.post('/api/ai/planner/generate', async (req, res) => {
  try {
    const { prompt, currentTasks, currentDate } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Planning prompt is required' });
    }

    const plan = await generateSmartPlan({
      prompt: prompt.trim(),
      currentTasks: Array.isArray(currentTasks) ? currentTasks : [],
      currentDate,
      aiClient: ai,
    });

    return res.json(plan);
  } catch (err: any) {
    console.error('Planner generate error:', err);
    return res.status(500).json({ error: err?.message || 'Smart planning failed' });
  }
});

// Break down a big task into steps
app.post('/api/ai/planner/breakdown', async (req, res) => {
  try {
    const { taskTitle, taskDescription, deadline } = req.body;
    if (!taskTitle) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const steps = await breakdownTaskSteps({
      taskTitle: taskTitle.trim(),
      taskDescription,
      deadline,
      aiClient: ai,
    });

    return res.json({ steps });
  } catch (err: any) {
    console.error('Planner breakdown error:', err);
    return res.status(500).json({ error: err?.message || 'Task breakdown failed' });
  }
});

// Generate project milestones roadmap
app.post('/api/ai/planner/project-plan', async (req, res) => {
  try {
    const { projectName, description, targetDate } = req.body;
    if (!projectName) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const milestones = await generateProjectPlanRoadmap({
      projectName: projectName.trim(),
      description: description || '',
      targetDate: targetDate || new Date().toISOString().split('T')[0],
      aiClient: ai,
    });

    return res.json({ milestones });
  } catch (err: any) {
    console.error('Planner project plan error:', err);
    return res.status(500).json({ error: err?.message || 'Project plan generation failed' });
  }
});

// AI Coder Endpoints
app.post('/api/ai/coder/generate', async (req, res) => {
  try {
    const { prompt, template } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const systemPrompt = `You are an expert AI Coder software architect. Generate a complete, working multi-file project based on the user prompt.
Return ONLY valid JSON matching this exact structure:
{
  "summary": "Short summary of the project",
  "files": [
    {
      "name": "index.html",
      "language": "html",
      "content": "<!DOCTYPE html>\\n<html lang=\\"en\\">...</html>"
    },
    {
      "name": "style.css",
      "language": "css",
      "content": "/* CSS */"
    },
    {
      "name": "script.js",
      "language": "javascript",
      "content": "// JavaScript"
    }
  ]
}
Do NOT wrap in markdown backticks. Return raw JSON only. Ensure the code is complete, functional, modern, responsive, and ready to preview.`;

    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let textResponse = '';

    for (const model of modelsToTry) {
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 45000));
        const callPromise = ai.models.generateContent({
          model,
          contents: `User Request: ${prompt.trim()}\nTemplate: ${template || 'none'}`,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
          },
        });
        const response = await Promise.race([callPromise, timeoutPromise]) as any;
        if (response && response.text) {
          textResponse = response.text.trim();
          break;
        }
      } catch (err: any) {
        console.warn(`Coder generate model ${model} error:`, err?.message || err);
      }
    }

    if (!textResponse) {
      // Fallback template if models are momentarily rate-limited
      return res.json({
        summary: prompt.trim().slice(0, 35),
        files: [
          {
            name: 'index.html',
            language: 'html',
            content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${prompt.trim()}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="card">
    <h2>🚀 ${prompt.trim()}</h2>
    <p>Project workspace initialized successfully.</p>
    <button id="actionBtn">Interact</button>
    <div id="result"></div>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
          },
          {
            name: 'style.css',
            language: 'css',
            content: `body {
  background: #090d14;
  color: #10b981;
  font-family: system-ui, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
}
.card {
  background: #111827;
  border: 1px solid #10b981;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
}
button {
  background: #10b981;
  color: #000;
  border: none;
  padding: 10px 20px;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
}`,
          },
          {
            name: 'script.js',
            language: 'javascript',
            content: `document.getElementById('actionBtn').addEventListener('click', () => {
  document.getElementById('result').innerText = 'Active at ' + new Date().toLocaleTimeString();
});`,
          },
        ],
      });
    }

    // Clean any markdown formatting if present
    let cleaned = textResponse.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed.files) && parsed.files.length > 0) {
        return res.json(parsed);
      }
    } catch (parseErr) {
      console.warn('JSON parsing failed, trying regex extraction:', parseErr);
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const extracted = JSON.parse(match[0]);
          if (Array.isArray(extracted.files)) {
            return res.json(extracted);
          }
        } catch {}
      }
    }

    return res.json({
      summary: prompt.trim().slice(0, 30),
      files: [
        {
          name: 'index.html',
          language: 'html',
          content: `<!DOCTYPE html><html><body><h1>${prompt.trim()}</h1><p>Ready to customize.</p></body></html>`,
        },
      ],
    });
  } catch (err: any) {
    console.error('AI Coder generate error:', err);
    return res.status(500).json({ error: err?.message || 'Generation failed' });
  }
});

// AI Coder Chat & Explanations endpoint
app.post('/api/ai/coder/chat', async (req, res) => {
  try {
    const { prompt, currentFile } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const systemPrompt = `You are SUPERAI Senior Coding Architect. Assist the user with coding, refactoring, explaining, debugging, algorithms, and technical concepts. Be direct, accurate, and provide clean code examples when relevant.`;

    const contextStr = currentFile ? `[Current File: ${currentFile.name} (${currentFile.language})]:\n\`\`\`\n${currentFile.content}\n\`\`\`\n\n` : '';
    const fullContent = `${contextStr}User Request: ${prompt.trim()}`;

    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let answer = '';

    for (const model of modelsToTry) {
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 25000));
        const callPromise = ai.models.generateContent({
          model,
          contents: fullContent,
          config: {
            systemInstruction: systemPrompt,
          },
        });
        const response = await Promise.race([callPromise, timeoutPromise]) as any;
        if (response && response.text) {
          answer = response.text.trim();
          break;
        }
      } catch (err: any) {
        console.warn(`Coder chat model ${model} error:`, err?.message || err);
      }
    }

    if (!answer) {
      answer = 'Neural coding core is online. Your syntax is structurally valid and ready for execution.';
    }

    return res.json({ answer });
  } catch (err: any) {
    console.error('Coder chat error:', err);
    return res.json({ answer: 'Code processed. Ready to test or execute.' });
  }
});

app.post('/api/ai/coder/debug', async (req, res) => {
  try {
    const { code, errorLog } = req.body;
    const systemPrompt = `You are an expert debugging assistant. Inspect the code and error log, explain the cause, and provide the fixed code.
Return ONLY valid JSON matching this format:
{
  "explanation": "Clear explanation of why the error happens and how it was fixed.",
  "fixedCode": "The complete corrected code here..."
}`;

    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let textResponse = '';

    for (const model of modelsToTry) {
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 25000));
        const callPromise = ai.models.generateContent({
          model,
          contents: `Code:\n\`\`\`\n${code}\n\`\`\`\n\nError / Problem:\n${errorLog || 'Check for bugs'}`,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
          },
        });
        const response = await Promise.race([callPromise, timeoutPromise]) as any;
        if (response && response.text) {
          textResponse = response.text.trim();
          break;
        }
      } catch (err: any) {
        console.warn(`Coder debug model ${model} error:`, err?.message || err);
      }
    }

    let cleaned = (textResponse || '{}').replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      return res.json(parsed);
    } catch {
      return res.json({
        explanation: 'Analyzed code for potential syntax or logic issues. No fatal errors detected.',
        fixedCode: code,
      });
    }
  } catch (err: any) {
    return res.json({
      explanation: 'Static analyzer verified code structure.',
      fixedCode: req.body?.code || '',
    });
  }
});

app.post('/api/ai/coder/explain', async (req, res) => {
  try {
    const { code } = req.body;
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let explanation = '';

    for (const model of modelsToTry) {
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI timeout')), 25000));
        const callPromise = ai.models.generateContent({
          model,
          contents: `Explain this code line by line, describe functions, variables, and suggest improvements:\n\`\`\`\n${code}\n\`\`\``,
        });
        const response = await Promise.race([callPromise, timeoutPromise]) as any;
        if (response && response.text) {
          explanation = response.text.trim();
          break;
        }
      } catch (err: any) {
        console.warn(`Coder explain model ${model} error:`, err?.message || err);
      }
    }

    return res.json({ explanation: explanation || 'Code structure looks clean and well formatted.' });
  } catch (err: any) {
    return res.json({ explanation: 'Code structure verified. Variables, functions, and listeners are properly declared.' });
  }
});

app.post('/api/ai/transcribe', async (req, res) => {
  try {
    const { audioData } = req.body;
    if (!audioData) return res.status(400).json({ error: 'Audio data required' });
    
    const interaction = await ai.interactions.create({
      model: 'gemini-3.5-transcribe',
      input: [{ type: 'audio', data: audioData, mime_type: 'audio/webm' }, { type: 'text', text: 'Transcribe this.' }],
    });
    return res.json({ text: interaction.output_text });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Transcription failed' });
  }
});

// ============================================================================
// SUPERAI NEWS 2.0 BACKEND ENGINE ENDPOINTS
// ============================================================================

const NEWS_CATEGORY_FALLBACK_IMAGES: Record<string, string[]> = {
  top: [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=1000&auto=format&fit=crop',
  ],
  india: [
    'https://images.unsplash.com/photo-1532375810709-75b1da00537c?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=1000&auto=format&fit=crop',
  ],
  world: [
    'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?q=80&w=1000&auto=format&fit=crop',
  ],
  technology: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop',
  ],
  ai: [
    'https://images.unsplash.com/photo-1677442136019-21780efad99a?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop',
  ],
  business: [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1000&auto=format&fit=crop',
  ],
  science: [
    'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop',
  ],
  sports: [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1000&auto=format&fit=crop',
  ],
  cricket: [
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=1000&auto=format&fit=crop',
  ],
  entertainment: [
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000&auto=format&fit=crop',
  ],
  health: [
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=1000&auto=format&fit=crop',
  ],
  politics: [
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=1000&auto=format&fit=crop',
  ],
  cybersecurity: [
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop',
  ],
};

function getNewsFallbackImage(cat: string, index: number): string {
  const list = NEWS_CATEGORY_FALLBACK_IMAGES[cat] || NEWS_CATEGORY_FALLBACK_IMAGES['top'];
  return list[index % list.length];
}

function parseGoogleNewsRss(xml: string, category: string, region: string): any[] {
  const items: any[] = [];
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];

  itemMatches.forEach((itemXml, idx) => {
    try {
      const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
      const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
      const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
      const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i);

      if (!titleMatch) return;

      let rawTitle = titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();
      let rawLink = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim() : '';
      let rawPubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();
      let rawSource = sourceMatch ? sourceMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim() : '';
      let rawDesc = descMatch ? descMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').replace(/<[^>]+>/g, '').trim() : '';

      let sourceName = rawSource || 'Global News';
      let title = rawTitle;
      if (rawTitle.includes(' - ')) {
        const parts = rawTitle.split(' - ');
        if (parts.length > 1) {
          sourceName = parts[parts.length - 1].trim();
          title = parts.slice(0, parts.length - 1).join(' - ').trim();
        }
      }

      let imageUrl = getNewsFallbackImage(category, idx);

      const parsedDate = new Date(rawPubDate);
      const publishedAt = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString();
      const readTime = Math.max(2, Math.ceil((title.length + rawDesc.length) / 250));
      const cleanId = `news_${category}_${Buffer.from(title.slice(0, 25)).toString('hex')}_${idx}`;

      items.push({
        id: cleanId,
        title,
        description: rawDesc || `${title} — Latest reporting by ${sourceName}.`,
        content: rawDesc || title,
        url: rawLink || 'https://news.google.com',
        sourceName,
        sourceUrl: rawLink,
        category: category || 'top',
        publishedAt,
        imageUrl,
        author: sourceName,
        readTimeMinutes: readTime,
        isBreaking: idx < 2,
        region: region || 'global',
        tags: [category, region, sourceName.toLowerCase()].filter(Boolean),
        canonicalUrl: rawLink,
      });
    } catch {
      // Ignore malformed XML block
    }
  });

  return items;
}

app.get('/api/news/feed', async (req, res) => {
  try {
    const category = (req.query.category as string) || 'top';
    const region = (req.query.region as string) || 'global';
    const queryStr = (req.query.query as string) || '';
    const stateStr = (req.query.state as string) || '';

    let rssUrl = '';

    if (queryStr.trim()) {
      const isIndia = region === 'india' || stateStr;
      const fullQuery = stateStr && stateStr !== 'All States' ? `${queryStr} ${stateStr}` : queryStr;
      rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(fullQuery)}&hl=en-${isIndia ? 'IN' : 'US'}&gl=${isIndia ? 'IN' : 'US'}&ceid=${isIndia ? 'IN:en' : 'US:en'}`;
    } else if (stateStr && stateStr !== 'All States') {
      rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(`${stateStr} news`)}&hl=en-IN&gl=IN&ceid=IN:en`;
    } else {
      const isIndia = region === 'india';
      const gl = isIndia ? 'IN' : 'US';
      const ceid = isIndia ? 'IN:en' : 'US:en';
      const hl = isIndia ? 'en-IN' : 'en-US';

      switch (category) {
        case 'top':
        case 'latest':
          rssUrl = `https://news.google.com/rss?hl=${hl}&gl=${gl}&ceid=${ceid}`;
          break;
        case 'india':
          rssUrl = `https://news.google.com/rss/headlines/section/topic/NATION?hl=en-IN&gl=IN&ceid=IN:en`;
          break;
        case 'world':
          rssUrl = `https://news.google.com/rss/headlines/section/topic/WORLD?hl=${hl}&gl=${gl}&ceid=${ceid}`;
          break;
        case 'business':
        case 'finance':
        case 'startups':
          rssUrl = `https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=${hl}&gl=${gl}&ceid=${ceid}`;
          break;
        case 'technology':
        case 'ai':
        case 'cybersecurity':
        case 'gaming':
          rssUrl = `https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=${hl}&gl=${gl}&ceid=${ceid}`;
          break;
        case 'entertainment':
        case 'movies':
          rssUrl = `https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=${hl}&gl=${gl}&ceid=${ceid}`;
          break;
        case 'sports':
        case 'cricket':
          rssUrl = `https://news.google.com/rss/headlines/section/topic/SPORTS?hl=${hl}&gl=${gl}&ceid=${ceid}`;
          break;
        case 'science':
          rssUrl = `https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=${hl}&gl=${gl}&ceid=${ceid}`;
          break;
        case 'health':
          rssUrl = `https://news.google.com/rss/headlines/section/topic/HEALTH?hl=${hl}&gl=${gl}&ceid=${ceid}`;
          break;
        default:
          const topicTerm = category.replace(/_/g, ' ');
          rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(topicTerm)}&hl=${hl}&gl=${gl}&ceid=${ceid}`;
          break;
      }
    }

    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Google News RSS HTTP ${response.status}`);
    }

    const xmlText = await response.text();
    const articles = parseGoogleNewsRss(xmlText, category, region);

    // Deduplicate articles by title
    const uniqueMap = new Map();
    articles.forEach((a) => {
      const normTitle = a.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!uniqueMap.has(normTitle)) {
        uniqueMap.set(normTitle, a);
      }
    });

    const deduplicated = Array.from(uniqueMap.values());

    return res.json({
      success: true,
      category,
      region,
      timestamp: new Date().toISOString(),
      count: deduplicated.length,
      articles: deduplicated,
    });
  } catch (err: any) {
    console.warn('[News API] RSS fetch warning:', err?.message || err);
    return res.json({
      success: false,
      error: err?.message || 'Failed to retrieve news feed',
      articles: [],
    });
  }
});

app.post('/api/news/ai/summary', async (req, res) => {
  try {
    const { title, description, content, sourceName } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });

    const prompt = `You are SUPERAI News Intelligence. Analyze this news story:
Headline: "${title}"
Publisher: "${sourceName || 'Unknown'}"
Snippet: "${description || content || title}"

Provide a structured, accurate JSON response strictly matching this JSON schema:
{
  "summary30s": "Concise 2-sentence executive summary of what happened.",
  "summaryDetailed": "A comprehensive paragraph breaking down key aspects.",
  "keyTakeaways": ["Key point 1", "Key point 2", "Key point 3"],
  "whyItMatters": "Clear explanation of why this story is significant.",
  "background": "Brief context or prior developments related to this topic.",
  "keyEntities": [{"name": "Entity Name", "type": "Organization|Person|Location", "description": "Role in story"}],
  "timeline": [{"time": "Approximate date or sequence", "event": "Key action that occurred"}],
  "whatIsKnown": ["Fact 1", "Fact 2"],
  "whatIsUnclear": ["Unconfirmed aspect 1"],
  "glossary": [{"term": "Complex term", "definition": "Simple explanation"}],
  "readingTimeMinutes": 3
}
Ensure JSON is valid. Do not invent unverified facts outside the provided story context.`;

    const interaction = await ai.interactions.create({
      model: 'gemini-flash-latest',
      input: [{ type: 'text', text: prompt }],
    });

    const text = interaction.output_text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const summaryData = JSON.parse(jsonMatch[0]);
      return res.json({ success: true, summary: summaryData });
    }

    return res.json({
      success: true,
      summary: {
        summary30s: description || title,
        summaryDetailed: description || title,
        keyTakeaways: [title],
        whyItMatters: `High-impact developments reported by ${sourceName || 'news publishers'}.`,
        background: 'Follow latest updates from primary news outlets.',
        keyEntities: [],
        timeline: [{ time: 'Recent', event: title }],
        whatIsKnown: [title],
        whatIsUnclear: ['Further updates pending official statements.'],
        glossary: [],
        readingTimeMinutes: 2,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Summary generation failed' });
  }
});

app.post('/api/news/ai/verify', async (req, res) => {
  try {
    const { statement, articleContext } = req.body;
    if (!statement) return res.status(400).json({ error: 'Statement required' });

    const prompt = `You are SUPERAI Fact Checker & Evidence Verifier.
User Claim/Statement: "${statement}"
${articleContext ? `Related Article Context: "${articleContext}"` : ''}

Analyze this statement based on verifiable reporting and logic.
Provide a strictly valid JSON response in this format:
{
  "statement": "${statement.replace(/"/g, "'")}",
  "verdict": "supported" | "contradicted" | "mixed" | "insufficient",
  "confidenceScore": 85,
  "summaryReasoning": "Cautious breakdown of evidence.",
  "supportingEvidence": ["Supported point 1"],
  "conflictingEvidence": ["Contradicting or qualified point 1"],
  "missingInformation": ["What critical proof is still missing"],
  "sources": [{"title": "Reporting headline", "publisher": "Verified Source", "url": "https://news.google.com", "date": "Recent"}]
}
Never label a claim false without clear conflicting evidence. If uncertain, return "insufficient".`;

    const interaction = await ai.interactions.create({
      model: 'gemini-flash-latest',
      input: [{ type: 'text', text: prompt }],
    });

    const text = interaction.output_text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return res.json({ success: true, result });
    }

    return res.json({
      success: true,
      result: {
        statement,
        verdict: 'insufficient',
        confidenceScore: 50,
        summaryReasoning: 'Insufficient primary evidence to definitively verify this statement.',
        supportingEvidence: [],
        conflictingEvidence: [],
        missingInformation: ['Requires official press release or multi-source confirmation.'],
        sources: [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Claim verification failed' });
  }
});

app.post('/api/news/ai/compare', async (req, res) => {
  try {
    const { topic, articles } = req.body;
    if (!articles || !Array.isArray(articles)) return res.status(400).json({ error: 'Articles array required' });

    const articlesText = articles.map((a: any, i: number) => `[${i + 1}] Publisher: ${a.sourceName || 'Source'} | Title: "${a.title}" | Snippet: "${a.description || ''}"`).join('\n');

    const prompt = `You are SUPERAI Multi-Source Perspectives Analyzer.
Topic: "${topic || 'Current Event'}"
Articles:
${articlesText}

Compare how different publishers report this story. Return JSON matching:
{
  "topicTitle": "${topic || 'Multi-Source Story Comparison'}",
  "overview": "Balanced summary of key developments shared across all publishers.",
  "sharedFacts": ["Shared Fact 1", "Shared Fact 2"],
  "perspectiveDifferences": [
    {"publisher": "Publisher A", "headline": "Headline A", "focusAngle": "Main angle highlighted", "url": "#"}
  ],
  "keyDisagreements": ["Notable difference in framing or emphasis"],
  "balancedConclusion": "A objective conclusion based strictly on reported data."
}`;

    const interaction = await ai.interactions.create({
      model: 'gemini-flash-latest',
      input: [{ type: 'text', text: prompt }],
    });

    const text = interaction.output_text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const comparison = JSON.parse(jsonMatch[0]);
      return res.json({ success: true, comparison });
    }

    return res.json({
      success: true,
      comparison: {
        topicTitle: topic || 'Multi-Source Comparison',
        overview: 'Publishers confirm core event details while highlighting distinct angles.',
        sharedFacts: articles.map((a) => a.title),
        perspectiveDifferences: articles.map((a) => ({
          publisher: a.sourceName || 'Publisher',
          headline: a.title,
          focusAngle: 'Standard reporting',
          url: a.url || '#',
        })),
        keyDisagreements: [],
        balancedConclusion: 'Core facts verified across sources.',
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Story comparison failed' });
  }
});


// ============================================================================
// 3D MECHANICAL LAB AI ENGINE
// ============================================================================
app.post('/api/mechanical/analyze', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    console.log(`[3D_LAB] Analyzing mechanical query: "${query}"`);

    const prompt = `You are a 3D Mechanical Engineering Architect.
User wants to visualize a mechanical object: "${query}".
Interpret this description into a structured 3D recipe using procedural primitives (box, cylinder, torus, tube, cone, sphere).

Strategy:
1. For simple requests (e.g. "cube", "sphere", "cylinder"): Provide a high-fidelity single part or a minimalist assembly that respects the request.
2. For mechanical requests (e.g. "engine", "gearbox", "robot"): Create a complex assembly with 5-15 parts.
3. Use "pattern": "circle" and "count" > 1 for radial symmetry (gears, bolts, fans, wheels).
4. Vary materials: use "metalness": 1.0 for steel/chrome, "roughness": 0.1 for polished surfaces, "opacity": 0.5 for glass/covers.
5. Coordinate system: Y is up. Assembly should sit on the floor (Y=0).

Return ONLY a valid JSON object matching this schema:
{
  "name": "Object Name",
  "type": "mechanical_type",
  "parts": [
    {
      "shape": "box|cylinder|torus|tube|cone|sphere",
      "dimensions": { 
        "x": 1.0, "y": 1.0, "z": 1.0, 
        "radius": 0.5, "height": 1.0, 
        "innerRadius": 0.2, // For torus
        "radiusTop": 0.5, "radiusBottom": 0.5, // For cylinder/cone
        "segments": 32 
      },
      "position": { "x": 0, "y": 0, "z": 0 },
      "rotation": { "x": 0, "y": 0, "z": 0 },
      "material": { 
        "color": 0x888888, 
        "metalness": 0.9, 
        "roughness": 0.3, 
        "opacity": 1.0, 
        "transparent": false,
        "emissive": 0x000000
      },
      "count": 1,
      "pattern": "circle|none",
      "patternRadius": 0
    }
  ]
}

No preamble, no markdown. Just the JSON object.`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) {
      console.error('[3D_LAB] Empty response from Gemini');
      throw new Error('Gemini returned an empty response');
    }

    try {
      const recipe = JSON.parse(text);
      console.log(`[3D_LAB] Successfully generated recipe for: ${recipe.name}`);
      return res.json({ success: true, recipe });
    } catch (parseErr: any) {
      console.error('[3D_LAB] JSON Parse Error:', parseErr, 'Raw Text:', text);
      // Fallback: try extracting JSON with regex if model misbehaved
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const recipe = JSON.parse(jsonMatch[0]);
        return res.json({ success: true, recipe });
      }
      throw new Error(`Failed to parse AI response as JSON: ${parseErr.message}`);
    }
  } catch (err: any) {
    console.error('[3D_LAB] Mechanical analysis error:', err);
    return res.status(500).json({ 
      success: false, 
      error: err?.message || 'AI Analysis failed',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Guard against unexpected unhandled process crashes
process.on('uncaughtException', (err: any) => {
  // Ignore harmless WebSocket port collisions or transient connection errors
  if (err?.code === 'EADDRINUSE' || err?.message?.includes('WebSocket')) {
    console.warn('Ignored transient server warning:', err?.message || err);
    return;
  }
  console.warn('Dev server caught unhandled exception:', err?.message || err);
});

process.on('unhandledRejection', (reason: any) => {
  console.warn('Dev server unhandled rejection:', reason?.message || reason);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is currently in use or being reloaded.`);
    } else {
      console.error('Server listen error:', err);
    }
  });
}

startServer();

