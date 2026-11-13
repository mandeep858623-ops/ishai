import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import PDFParser from 'pdf2json';

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

export interface MemoryItem {
  id: string;
  title: string;
  content: string;
  type: 'note' | 'idea' | 'document' | 'project' | 'photo';
  tags: string[];
  collection: string;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  isTrashed: boolean;
  sourceReference?: string;
}

export interface AskVaultParams {
  question: string;
  memories: MemoryItem[];
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * Searches and ranks memories based on keyword relevance to user query
 */
function retrieveRelevantMemories(question: string, memories: MemoryItem[]): MemoryItem[] {
  const qTerms = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['what', 'when', 'where', 'which', 'about', 'have', 'your', 'from'].includes(w));

  if (qTerms.length === 0) {
    return memories.slice(0, 5);
  }

  const scored = memories.map((m) => {
    let score = 0;
    const tLower = m.title.toLowerCase();
    const cLower = m.content.toLowerCase();
    const tagsLower = m.tags.join(' ').toLowerCase();

    for (const term of qTerms) {
      if (tLower.includes(term)) score += 5;
      if (tagsLower.includes(term)) score += 3;
      const count = (cLower.match(new RegExp(term, 'g')) || []).length;
      score += Math.min(count, 5);
    }

    return { memory: m, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter((s) => s.score > 0).slice(0, 6).map((s) => s.memory);
}

/**
 * Asks questions grounded in user's saved vault memories
 */
export async function askMemoryVault(params: AskVaultParams): Promise<{
  answer: string;
  citations: Array<{ id: string; title: string; type: string }>;
}> {
  const { question, memories, conversationHistory = [] } = params;
  const activeMemories = memories.filter((m) => !m.isTrashed);

  if (activeMemories.length === 0) {
    return {
      answer: "Your AI Memory Vault is currently empty. Add your notes, ideas, project briefs, or upload documents to start asking questions.",
      citations: [],
    };
  }

  // Retrieve top relevant memories
  const relevantMemories = retrieveRelevantMemories(question, activeMemories);

  if (relevantMemories.length === 0) {
    return {
      answer: `I searched your vault containing ${activeMemories.length} saved memories, but could not find any notes or documents discussing "${question}".\n\nTry checking your spelling, asking about stored project topics, or adding a new memory on this subject.`,
      citations: [],
    };
  }

  const citations = relevantMemories.map((m) => ({
    id: m.id,
    title: m.title,
    type: m.type,
  }));

  const contextBlock = relevantMemories
    .map(
      (m, i) =>
        `--- MEMORY SOURCE ${i + 1}: [${m.title}] (Type: ${m.type.toUpperCase()}, Collection: ${m.collection}) ---\n${m.content.substring(0, 3000)}\n`
    )
    .join('\n');

  const systemInstruction = `You are AI Memory Vault Assistant for SUPERAI.
Your goal is to answer the user's questions based strictly on their saved knowledge and retrieved memories.

Retrieved User Memories:
${contextBlock}

Rules:
1. Ground your answer ONLY in the retrieved memory sources above.
2. Clearly cite the memory title when quoting or referencing facts, e.g. "[Source: Project Roadmap]" or "[Notes: Biology Chapter 3]".
3. If the user asks about something not contained in the retrieved memories, explicitly state that no record exists in their saved vault.
4. Distinguish stored facts from inferences or recommendations. Never invent dates, quotes, decisions, or documents.
5. Use clean Markdown formatting with clear bullet points and bold highlights.`;

  let prompt = '';
  if (conversationHistory.length > 0) {
    prompt += `Previous Conversation History:\n${conversationHistory
      .slice(-4)
      .map((h) => `${h.role.toUpperCase()}: ${h.content}`)
      .join('\n')}\n\n`;
  }
  prompt += `User Question: "${question}"`;

  try {
    const ai = getAIClient();
    for (const model of modelsToTry) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI response timed out')), 12000)
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
          return {
            answer: response.text.trim(),
            citations,
          };
        }
      } catch (err: any) {
        const msg = err?.message || String(err);
        console.warn(`[Memory Vault] Model ${model} failed:`, msg);
        if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
          console.log('[Memory Vault] Quota limit reached (429). Switching immediately to deterministic fallback.');
          break;
        }
      }
    }
  } catch (clientErr: any) {
    console.warn('[Memory Vault] Gemini client init error:', clientErr?.message);
  }

  // Deterministic Grounded Retrieval Fallback
  console.log('[Memory Vault] Using deterministic grounded fallback.');
  let fallbackAnswer = `### 🧠 Grounded Findings from Your Vault\n\n`;
  fallbackAnswer += `Based on **${relevantMemories.length}** matching memory records in your vault:\n\n`;

  for (const m of relevantMemories) {
    const preview = m.content.slice(0, 220).replace(/\n+/g, ' ');
    fallbackAnswer += `#### 📌 Source: [${m.title}] (${m.type.toUpperCase()} • ${m.collection})\n`;
    fallbackAnswer += `> "${preview}..."\n\n`;
  }

  fallbackAnswer += `*Direct Citations Available*: Click the memory badges below to open the complete source documents.`;

  return {
    answer: fallbackAnswer,
    citations,
  };
}

/**
 * Parses uploaded documents (PDF, TXT, MD, CSV) for the Memory Vault
 */
export async function parseVaultDocument(
  fileBuffer: Buffer,
  fileName: string
): Promise<{ text: string; wordCount: number; preview: string }> {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (ext === 'pdf') {
    try {
      const pdfParser = new PDFParser();

      const text = await new Promise<string>((resolve, reject) => {
        pdfParser.on('pdfParser_dataError', (err) => reject((err as any).parserError || err));
        pdfParser.on('pdfParser_dataReady', () => {
          const rawText = pdfParser.getRawTextContent();
          resolve(rawText);
        });
        pdfParser.parseBuffer(fileBuffer);
      });

      if (!text) {
        throw new Error('No readable text could be extracted. The PDF may be scanned (image-only) or password protected.');
      }
      return {
        text,
        wordCount: text.split(/\s+/).length,
        preview: text.slice(0, 300),
      };
    } catch (pdfErr: any) {
      throw new Error(`PDF Parsing failed: ${pdfErr?.message || 'Unreadable file'}`);
    }
  } else {
    // Text-based files: TXT, MD, CSV, JSON
    const text = fileBuffer.toString('utf-8').trim();
    if (!text) {
      throw new Error('The uploaded document is empty.');
    }
    return {
      text,
      wordCount: text.split(/\s+/).length,
      preview: text.slice(0, 300),
    };
  }
}
