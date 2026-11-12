import React, { useState, useEffect, useRef } from 'react';
import { streamAiCompletion, speakText, stopSpeaking, createSpeechRecognizer } from '../../utils/aiClient';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, AlertCircle, RotateCcw } from 'lucide-react';

interface VoiceTurn {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const VoiceAssistantTool: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [speechFeedback, setSpeechFeedback] = useState('Tap the microphone to speak with SUPERAI');
  const [conversation, setConversation] = useState<VoiceTurn[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'Hello. I am SUPERAI Voice Assistant. How can I assist you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const recognizerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
    };
  }, []);

  const handleStartListening = () => {
    stopSpeaking();
    setTranscript('');
    setSpeechFeedback('Listening... Speak now');

    const recognizer = createSpeechRecognizer(
      (finalText) => {
        setTranscript(finalText);
        setIsListening(false);
        handleSendVoiceQuery(finalText);
      },
      (err) => {
        setIsListening(false);
        setSpeechFeedback(`Speech input notice: ${err}`);
      },
      () => {
        setIsListening(false);
      }
    );

    recognizerRef.current = recognizer;
    if (recognizer.isSupported) {
      setIsListening(true);
      recognizer.start();
    } else {
      setSpeechFeedback('Speech Recognition is not supported by your browser engine. You can type in the chat instead.');
    }
  };

  const handleStopListening = () => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }
    setIsListening(false);
    setSpeechFeedback('Listening paused');
  };

  const handleSendVoiceQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userTurn: VoiceTurn = {
      id: Date.now().toString(),
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setConversation((prev) => [...prev, userTurn]);
    setIsThinking(true);
    setSpeechFeedback('Thinking...');

    let assistantResponse = '';
    const assistantId = (Date.now() + 1).toString();

    streamAiCompletion(
      {
        prompt: queryText,
        systemInstruction:
          'You are SUPERAI Voice Assistant. Respond concisely, conversationally, and warmly in 2-3 natural sentences suitable for spoken audio.',
      },
      {
        onChunk: (chunk) => {
          assistantResponse += chunk;
        },
        onDone: () => {
          setIsThinking(false);
          const aiTurn: VoiceTurn = {
            id: assistantId,
            sender: 'assistant',
            text: assistantResponse,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setConversation((prev) => [...prev, aiTurn]);
          setSpeechFeedback('Spoken response complete');
          if (ttsEnabled) {
            speakText(assistantResponse);
          }
        },
        onError: (err) => {
          setIsThinking(false);
          setSpeechFeedback(`Failed to get response: ${err}`);
        },
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Mic className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">Voice Assistant & Audio Interaction</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Browser-native microphone speech recognition and synthesized vocal responses.
          </p>
        </div>
        <button
          onClick={() => {
            setTtsEnabled(!ttsEnabled);
            if (ttsEnabled) stopSpeaking();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
            ttsEnabled
              ? 'bg-pink-500/10 border-pink-500/30 text-pink-300'
              : 'bg-zinc-900 border-zinc-800 text-zinc-500'
          }`}
        >
          {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span>Audio Output {ttsEnabled ? 'On' : 'Muted'}</span>
        </button>
      </div>

      {/* Interactive Orb Visualizer */}
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur relative overflow-hidden">
        {/* Glowing animated circles */}
        <div className="relative flex items-center justify-center my-6">
          <div
            className={`absolute w-44 h-44 rounded-full transition-all duration-700 ${
              isListening
                ? 'bg-pink-500/20 scale-125 animate-ping'
                : isThinking
                ? 'bg-indigo-500/20 scale-110 animate-pulse'
                : 'bg-zinc-800/20 scale-100'
            }`}
          />
          <div
            className={`w-32 h-32 rounded-full border-2 flex items-center justify-center shadow-2xl transition-all duration-500 relative z-10 ${
              isListening
                ? 'border-pink-500 bg-pink-500/20 shadow-[0_0_50px_rgba(236,72,153,0.4)]'
                : isThinking
                ? 'border-indigo-500 bg-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.4)]'
                : 'border-zinc-700 bg-zinc-900 shadow-none'
            }`}
          >
            <button
              onClick={isListening ? handleStopListening : handleStartListening}
              className="p-6 rounded-full cursor-pointer focus:outline-none hover:scale-105 transition-transform"
              title={isListening ? 'Stop listening' : 'Start microphone'}
            >
              {isListening ? (
                <Mic className="w-10 h-10 text-pink-400 animate-pulse" />
              ) : (
                <Mic className="w-10 h-10 text-zinc-400 hover:text-white" />
              )}
            </button>
          </div>
        </div>

        <p className="text-sm font-medium text-zinc-200 mt-4 text-center">{speechFeedback}</p>
        {transcript && <p className="text-xs text-pink-300 mt-2 font-mono italic">"{transcript}"</p>}
      </div>

      {/* Transcript Log */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <span className="text-xs font-semibold text-zinc-300">Voice Session Transcript</span>
          <button
            onClick={() => setConversation([])}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </button>
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {conversation.map((turn) => (
            <div
              key={turn.id}
              className={`p-3 rounded-lg text-xs leading-relaxed ${
                turn.sender === 'user'
                  ? 'bg-zinc-900 border border-zinc-800 text-zinc-200 ml-8'
                  : 'bg-pink-950/20 border border-pink-900/40 text-pink-200 mr-8'
              }`}
            >
              <div className="flex justify-between items-center mb-1 text-[10px] text-zinc-500">
                <span className="font-semibold text-zinc-400">
                  {turn.sender === 'user' ? 'You' : 'SUPERAI Voice'}
                </span>
                <span>{turn.timestamp}</span>
              </div>
              <p>{turn.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
