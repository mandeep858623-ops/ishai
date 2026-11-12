import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  X, 
  Upload, 
  Search, 
  Languages, 
  Type, 
  BookOpen, 
  ShoppingBag, 
  History, 
  Maximize2, 
  RotateCw, 
  Image as ImageIcon,
  ChevronRight,
  Sparkles,
  Loader2,
  Trash2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { soundEngine, speakText } from '../../utils/audio';

type LensMode = 'SEARCH' | 'TRANSLATE' | 'TEXT' | 'HOMEWORK' | 'SHOPPING';

interface LensResult {
  id: string;
  timestamp: string;
  mode: LensMode;
  imageUrl: string;
  analysis: string;
  data?: any;
}

interface LensXModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  writeLog: (text: string, tag?: string) => void;
}

export const LensXModal: React.FC<LensXModalProps> = ({ isOpen, onClose, userId, writeLog }) => {
  const [mode, setMode] = useState<LensMode>('SEARCH');
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<LensResult | null>(null);
  const [history, setHistory] = useState<LensResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [zoom, setZoom] = useState(1);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`superai_lensx_history_${userId || 'guest'}`);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load Lens X history:', e);
      }
    }
  }, [userId]);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem(`superai_lensx_history_${userId || 'guest'}`, JSON.stringify(history));
  }, [history, userId]);

  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setCameraPermissionDenied(false);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.warn('Camera access failed or permission denied:', err);
      setCameraPermissionDenied(true);
      writeLog('Camera permission denied or camera unavailable. Gallery upload ready.', 'INFO');
    }
  }, [facingMode, stream, writeLog]);

  useEffect(() => {
    if (isOpen && !capturedImage && !showHistory) {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, capturedImage, showHistory, startCamera]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    soundEngine.playClick();
  };

  const captureImage = () => {
    if (!videoRef.current) return;
    soundEngine.playCameraShutter();
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      analyzeImage(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCapturedImage(dataUrl);
        analyzeImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true);
    writeLog(`Lens X: Analyzing image in ${mode} mode...`, 'INTELLIGENCE');

    let prompt = "";
    switch (mode) {
      case 'TRANSLATE':
        prompt = "Detect any text in this image and translate it to English. Provide the original text and the translation. Format as 'Original: [text]\nTranslation: [translation]'. If no text found, say 'No text detected'.";
        break;
      case 'TEXT':
        prompt = "Extract all visible text from this image accurately. Maintain formatting if possible.";
        break;
      case 'HOMEWORK':
        prompt = "This image contains a homework problem or educational content. Identify the subject and solve the problem step-by-step. If it's a question, provide a detailed explanation.";
        break;
      case 'SHOPPING':
        prompt = "Identify the products in this image. Provide estimated prices, brand names, and where to buy them. If it's clothing, describe the style.";
        break;
      case 'SEARCH':
      default:
        prompt = "Identify the main object, landmark, plant, or animal in this image. Provide a detailed description, interesting facts, and related information. Be specific and accurate.";
        break;
    }

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          image: imageData.split(',')[1] // Send base64 part
        })
      });

      const data = await response.json();
      const analysis = data.answer || "No analysis available.";
      
      const newResult: LensResult = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString(),
        mode: mode,
        imageUrl: imageData,
        analysis: analysis
      };

      setResult(newResult);
      setHistory(prev => [newResult, ...prev]);
      speakText(analysis.substring(0, 200), 'Male');
      soundEngine.playSuccess();
    } catch (err) {
      console.error('Lens X Analysis Error:', err);
      writeLog('Analysis failed. Please try again.', 'ERROR');
      soundEngine.playAlertBeep();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetLens = () => {
    setCapturedImage(null);
    setResult(null);
    setIsAnalyzing(false);
    startCamera();
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    soundEngine.playClick();
  };

  const clearHistory = () => {
    if (confirm('Clear all search history?')) {
      setHistory([]);
      soundEngine.playClick();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-5xl aspect-[16/10] bg-[#0d1117] border border-zinc-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                LENS X
                <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">Visual Intelligence</span>
              </h2>
              <p className="text-xs text-zinc-500 font-medium">Search what you see with AI Vision</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-xs font-semibold ${showHistory ? 'bg-indigo-600 text-white' : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
            >
              <History className="w-4 h-4" />
              History
            </button>
            <button 
              onClick={onClose}
              className="p-2.5 bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all duration-200 border border-transparent hover:border-red-500/30"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Viewfinder / Results */}
          <div className="flex-1 relative bg-black flex flex-col overflow-hidden">
            {showHistory ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white tracking-tight">Recent Visual Searches</h3>
                  {history.length > 0 && (
                    <button 
                      onClick={clearHistory}
                      className="text-xs text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear All
                    </button>
                  )}
                </div>
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                    <History className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium opacity-50">No search history yet</p>
                    <p className="text-sm opacity-40">Start capturing to see your history here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {history.map((item) => (
                      <div key={item.id} className="group relative aspect-square rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/50 hover:border-indigo-500/50 transition-all cursor-pointer">
                        <img src={item.imageUrl} alt={item.mode} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                          <p className="text-[10px] text-zinc-400 mb-1">{item.timestamp}</p>
                          <p className="text-xs font-bold text-white truncate mb-2">{item.mode}</p>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setCapturedImage(item.imageUrl);
                                setResult(item);
                                setShowHistory(false);
                              }}
                              className="flex-1 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg"
                            >
                              View Result
                            </button>
                            <button 
                              onClick={() => deleteHistoryItem(item.id)}
                              className="p-1.5 bg-red-500/20 text-red-400 rounded-lg"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-[9px] font-bold text-white uppercase tracking-tighter">
                          {item.mode}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : capturedImage ? (
              <div className="flex-1 flex overflow-hidden">
                <div className="w-1/2 h-full relative bg-zinc-950 flex items-center justify-center p-4">
                  <img src={capturedImage} alt="Captured" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
                  <button 
                    onClick={resetLens}
                    className="absolute top-6 left-6 p-3 bg-black/60 hover:bg-zinc-800 text-white rounded-2xl backdrop-blur-md border border-white/10 transition-all"
                  >
                    <RotateCw className="w-5 h-5" />
                  </button>
                </div>
                <div className="w-1/2 h-full border-l border-zinc-800 bg-[#0d1117] flex flex-col">
                  <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                    {isAnalyzing ? (
                      <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                          <Sparkles className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-white">AI Vision Analysis...</p>
                          <p className="text-sm text-zinc-500">Processing visual features and generating insights</p>
                        </div>
                      </div>
                    ) : result ? (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between">
                          <div className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20 uppercase tracking-widest">
                            {result.mode} Analysis
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-2 text-zinc-500 hover:text-white transition-colors"><Copy className="w-4 h-4" /></button>
                            <button className="p-2 text-zinc-500 hover:text-white transition-colors"><ExternalLink className="w-4 h-4" /></button>
                          </div>
                        </div>
                        
                        <div className="bg-zinc-900/50 rounded-2xl p-5 border border-zinc-800/50">
                          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-medium">
                            {result.analysis}
                          </p>
                        </div>

                        {/* Mode Specific Extras */}
                        <div className="grid grid-cols-1 gap-4 pt-4">
                          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-center justify-between group cursor-pointer hover:border-indigo-500/30 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                                <Search className="w-5 h-5 text-indigo-400" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white">Google Search</p>
                                <p className="text-[10px] text-zinc-500">Find similar items and web results</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-all" />
                          </div>
                          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-center justify-between group cursor-pointer hover:border-indigo-500/30 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white">Shop Related</p>
                                <p className="text-[10px] text-zinc-500">Find where to buy these products</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-all" />
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 relative flex flex-col overflow-hidden">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className={`flex-1 w-full h-full object-cover transition-all duration-300 ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />

                {cameraPermissionDenied && (
                  <div className="absolute inset-0 bg-[#0d1117]/95 flex flex-col items-center justify-center p-6 text-center z-10">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                      <Camera className="w-8 h-8" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-2">Camera Access Blocked / Unavailable</h4>
                    <p className="text-xs text-zinc-400 max-w-md mb-6 leading-relaxed">
                      Your browser denied camera permission or no camera was detected. You can still upload any image or photo from your device to perform visual search!
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      Select Image from Gallery
                    </button>
                  </div>
                )}
                
                {/* Viewfinder Overlays */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                   <div className="w-64 h-64 border-2 border-white/30 rounded-3xl relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl -translate-x-1 -translate-y-1" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl translate-x-1 -translate-y-1" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl -translate-x-1 translate-y-1" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl translate-x-1 translate-y-1" />
                      
                      <div className="absolute inset-0 flex items-center justify-center opacity-40">
                         <Search className="w-8 h-8 text-white animate-pulse" />
                      </div>
                   </div>
                   <p className="mt-8 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-bold text-white/80 uppercase tracking-widest border border-white/10">
                      Align object within frame
                   </p>
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-0 inset-x-0 p-8 flex flex-col items-center space-y-6 bg-gradient-to-t from-black via-black/40 to-transparent">
                  
                  {/* Mode Selector */}
                  <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
                    {[
                      { id: 'TRANSLATE', icon: Languages, label: 'Translate' },
                      { id: 'TEXT', icon: Type, label: 'Text' },
                      { id: 'SEARCH', icon: Search, label: 'Search' },
                      { id: 'HOMEWORK', icon: BookOpen, label: 'Homework' },
                      { id: 'SHOPPING', icon: ShoppingBag, label: 'Shopping' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setMode(m.id as LensMode);
                          soundEngine.playClick();
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${mode === m.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                      >
                        <m.icon className="w-4 h-4" />
                        {mode === m.id && <span>{m.label}</span>}
                      </button>
                    ))}
                  </div>

                  {/* Main Actions */}
                  <div className="flex items-center justify-center gap-10 w-full max-w-md">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-4 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-full backdrop-blur-md border border-white/10 transition-all group"
                      title="Upload from gallery"
                    >
                      <ImageIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        accept="image/*" 
                      />
                    </button>

                    <button 
                      onClick={captureImage}
                      className="w-20 h-20 rounded-full bg-white p-1 flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:scale-110 active:scale-95 transition-all duration-300 group"
                    >
                      <div className="w-full h-full rounded-full border-[3px] border-black/5 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                          <Camera className="w-8 h-8 group-hover:rotate-12 transition-transform duration-500" />
                        </div>
                      </div>
                    </button>

                    <button 
                      onClick={toggleCamera}
                      className="p-4 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-full backdrop-blur-md border border-white/10 transition-all group"
                      title="Switch Camera"
                    >
                      <RotateCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between text-[10px] text-zinc-500 font-bold tracking-widest uppercase">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                System Ready
             </div>
             <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Gemini Vision 2.0
             </div>
          </div>
          <div className="flex items-center gap-4">
             <span className="opacity-60">© 2026 SUPERAI LENS X</span>
             <div className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400">
                PRO VERSION
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
