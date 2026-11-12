import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, RotateCcw } from 'lucide-react';
import { ModalWrapper } from './Modals';
import { soundEngine } from '../utils/audio';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  writeLog: (text: string, tag?: string) => void;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({ isOpen, onClose, writeLog }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      writeLog('Voice recording started.', 'VOICE');
    } catch (err) {
      console.error('Microphone error:', err);
      writeLog('Failed to access microphone.', 'ERROR');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      writeLog('Voice recording stopped.', 'VOICE');
    }
  };

  if (!isOpen) return null;

  return (
    <ModalWrapper title="🎙️ VOICE RECORDER" onClose={onClose} maxWidthClass="max-w-sm">
      <div className="p-4 space-y-4 text-center">
        <div className="text-4xl font-mono text-emerald-400">
          {Math.floor(duration / 60).toString().padStart(2, '0')}:{(duration % 60).toString().padStart(2, '0')}
        </div>
        
        <div className="flex justify-center gap-4">
          {!isRecording ? (
            <button onClick={startRecording} className="p-4 bg-emerald-600 rounded-full text-black">
              <Mic size={32} />
            </button>
          ) : (
            <button onClick={stopRecording} className="p-4 bg-red-600 rounded-full text-white">
              <Square size={32} />
            </button>
          )}
        </div>

        {audioURL && (
          <div className="mt-4">
            <audio src={audioURL} controls className="w-full" />
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};
