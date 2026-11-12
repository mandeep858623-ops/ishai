// Client helpers for SUPERAI backend integration and browser media APIs

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

/**
 * Streams AI completion from the backend via Server-Sent Events (SSE).
 * Returns an AbortController so the user can click "Stop Generation" at any time.
 */
export function streamAiCompletion(
  payload: {
    messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
    prompt?: string;
    systemInstruction?: string;
    temperature?: number;
  },
  callbacks: StreamCallbacks
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch('/api/ai/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Server responded with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No readable response body received.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') {
            callbacks.onDone();
            return;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              callbacks.onError(parsed.error);
              return;
            }
            if (parsed.text) {
              callbacks.onChunk(parsed.text);
            }
          } catch {
            // Raw text chunk fallback
            if (dataStr) callbacks.onChunk(dataStr);
          }
        }
      }

      callbacks.onDone();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        callbacks.onDone();
        return;
      }
      callbacks.onError(err.message || 'Failed to communicate with AI service.');
    }
  })();

  return controller;
}

/**
 * Streams Language Studio completion from the backend.
 */
export function streamLanguageStudioCompletion(
  payload: Record<string, any>,
  callbacks: StreamCallbacks
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch('/api/ai/language-studio/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Server responded with status ${response.status}`);
      }

      if (!response.body) throw new Error('No readable response body received.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') {
            callbacks.onDone();
            return;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              callbacks.onError(parsed.error);
              return;
            }
            if (parsed.done) {
              callbacks.onDone();
              return;
            }
            if (parsed.text) {
              callbacks.onChunk(parsed.text);
            }
          } catch {
            if (dataStr) callbacks.onChunk(dataStr);
          }
        }
      }
      callbacks.onDone();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        callbacks.onDone();
        return;
      }
      callbacks.onError(err.message || 'Failed to communicate with Language Studio.');
    }
  })();

  return controller;
}

/**
 * Standard unary call to /api/ai/chat
 */
export async function generateAiCompletion(payload: {
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  prompt?: string;
  systemInstruction?: string;
  temperature?: number;
}): Promise<string> {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.answer || '';
}

/**
 * Browser text-to-speech
 */
export function speakText(text: string, gender: 'male' | 'female' = 'female'): boolean {
  if (!('speechSynthesis' in window)) return false;
  try {
    window.speechSynthesis.cancel();
    // Clean markdown symbols for cleaner pronunciation
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/[*_#`~[\]]/g, '')
      .slice(0, 800); // limit spoken duration

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = gender === 'female' ? 1.1 : 0.9;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const match = voices.find((v) =>
        gender === 'female'
          ? /female|samantha|zira|victoria|karen|google uk english female/i.test(v.name)
          : /male|david|george|alex|daniel|google uk english male/i.test(v.name)
      );
      if (match) utterance.voice = match;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Browser speech recognition (Speech-to-Text)
 */
export function createSpeechRecognizer(
  onResult: (transcript: string) => void,
  onError: (err: string) => void,
  onEnd: () => void
): { start: () => void; stop: () => void; isSupported: boolean } {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return {
      start: () => onError('Speech recognition is not supported in this browser.'),
      stop: () => {},
      isSupported: false,
    };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event: any) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      }
    }
    if (finalTranscript) {
      onResult(finalTranscript);
    }
  };

  recognition.onerror = (event: any) => {
    onError(event.error || 'Speech recognition error');
  };

  recognition.onend = () => {
    onEnd();
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch {
        // already started
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch {
        // already stopped
      }
    },
    isSupported: true,
  };
}
