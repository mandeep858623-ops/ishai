/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ModalWrapper } from '../Modals';
import { soundEngine, speakText } from '../../utils/audio';
import {
  Sparkles,
  Compass,
  Clock,
  Sliders,
  Brain,
  Bookmark,
  Share2,
  Download,
  Trash2,
  Plus,
  Send,
  Zap,
  Globe,
  Flame,
  Atom,
  ChevronRight,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

interface WhatIfEngineModalProps {
  onClose: () => void;
  onLog?: (text: string, tag: string) => void;
  currentUser?: any;
  authToken?: string;
}

interface SimulationScenario {
  id: string;
  title: string;
  prompt: string;
  category: string;
  overview: string;
  assumptions: string[];
  immediateConsequences: string[];
  longTermConsequences: string[];
  branches: Array<{ name: string; description: string; type: 'optimistic' | 'challenging' | 'unexpected' }>;
  timeline: Array<{ stage: string; description: string }>;
  createdAt: string;
}

const PRESET_PROMPTS = [
  'What if Earth had two moons?',
  'What if dinosaurs never became extinct?',
  'What if humans could breathe underwater?',
  'What if gravity became half as strong?',
  'What if India became a space superpower?',
  'What if humans lived on Mars?'
];

export const WhatIfEngineModal: React.FC<WhatIfEngineModalProps> = ({
  onClose,
  onLog,
  currentUser
}) => {
  const userPrefix = currentUser?.uid ? `user_${currentUser.uid}_` : 'guest_';
  
  const [promptInput, setPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSimulation, setActiveSimulation] = useState<SimulationScenario | null>(null);
  
  // Saved Library
  const [savedSimulations, setSavedSimulations] = useState<SimulationScenario[]>(() => {
    try {
      const saved = localStorage.getItem(`${userPrefix}whatif_simulations`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState<'home' | 'simulation' | 'library'>('home');
  const [variableMultiplier, setVariableMultiplier] = useState<number>(1.0);

  // Chat inside simulation
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: 'Ask me anything about this simulation, alternate timelines, or underlying scientific assumptions.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(`${userPrefix}whatif_simulations`, JSON.stringify(savedSimulations));
    } catch {}
  }, [savedSimulations, userPrefix]);

  const generateSimulation = async (scenarioPrompt?: string) => {
    const q = scenarioPrompt || promptInput;
    if (!q.trim()) return;

    soundEngine.playClick();
    setIsGenerating(true);
    if (onLog) onLog(`[WHAT_IF] Generating simulation for: "${q}"`, 'INTELLIGENCE');

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Create a detailed JSON simulation analysis for the hypothetical scenario: "${q}". 
          Return ONLY valid JSON with the following structure:
          {
            "title": "Short catchy title",
            "overview": "Detailed world overview paragraph",
            "assumptions": ["Assumption 1", "Assumption 2", "Assumption 3"],
            "immediateConsequences": ["Consequence 1", "Consequence 2"],
            "longTermConsequences": ["Long term 1", "Long term 2"],
            "branches": [
              {"name": "Optimistic Path", "description": "...", "type": "optimistic"},
              {"name": "Challenging Path", "description": "...", "type": "challenging"},
              {"name": "Unexpected Path", "description": "...", "type": "unexpected"}
            ],
            "timeline": [
              {"stage": "Immediate", "description": "..."},
              {"stage": "1 Year", "description": "..."},
              {"stage": "10 Years", "description": "..."}
            ]
          }`,
          systemInstruction: "You are the SUPERAI What If? Engine. Generate rich, imaginative, scientifically grounded simulation data in strict JSON format."
        })
      });
      const data = await res.json();
      let parsed: any = null;
      try {
        const cleanJson = data.answer.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleanJson);
      } catch {
        parsed = {
          title: q,
          overview: data.answer || `Exploring the hypothetical consequences of ${q}.`,
          assumptions: ['Physical laws remain constant unless specified', 'Initial ecosystem adaptation phase'],
          immediateConsequences: ['Immediate global awareness and disruption', 'Readjustment of infrastructure'],
          longTermConsequences: ['Evolutionary adaptation', 'Cultural and technological shifts'],
          branches: [
            { name: 'Harmonious Coexistence', description: 'Civilization adapts successfully with innovative engineering.', type: 'optimistic' },
            { name: 'Resource Scarcity', description: 'Severe environmental bottlenecks challenge global stability.', type: 'challenging' },
            { name: 'Unforeseen Mutation', description: 'Bizarre secondary effects alter the trajectory of civilization.', type: 'unexpected' }
          ],
          timeline: [
            { stage: 'Immediate', description: 'Initial shockwave and planetary readjustment.' },
            { stage: '1 Year', description: 'Societies establish new operational protocols.' },
            { stage: '10 Years', description: 'Generational adaptation transforms daily life.' }
          ]
        };
      }

      const newSim: SimulationScenario = {
        id: `sim-${Date.now()}`,
        title: parsed.title || q,
        prompt: q,
        category: 'Science & Cosmos',
        overview: parsed.overview,
        assumptions: parsed.assumptions || [],
        immediateConsequences: parsed.immediateConsequences || [],
        longTermConsequences: parsed.longTermConsequences || [],
        branches: parsed.branches || [],
        timeline: parsed.timeline || [],
        createdAt: new Date().toLocaleDateString()
      };

      setActiveSimulation(newSim);
      setSavedSimulations([newSim, ...savedSimulations]);
      setActiveTab('simulation');
      soundEngine.playSuccess();
      speakText(`Simulation generated for ${newSim.title}`, 'Male');
    } catch (err: any) {
      soundEngine.playAlertBeep();
      if (onLog) onLog(`[WHAT_IF ERROR]: ${err.message}`, 'ERROR');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || !activeSimulation) return;
    const q = chatInput;
    const newMsgs = [...chatMessages, { role: 'user' as const, text: q }];
    setChatMessages(newMsgs);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `In the context of the simulation "${activeSimulation.title}" (${activeSimulation.overview}), answer this follow-up: ${q}`,
          systemInstruction: "You are the SUPERAI What If? Engine assistant. Answer thoughtfully and imaginatively."
        })
      });
      const data = await res.json();
      const ans = data.answer || "Interesting perspective on this timeline.";
      setChatMessages([...newMsgs, { role: 'assistant', text: ans }]);
      speakText(ans.slice(0, 180), 'Male');
    } catch {
      setChatMessages([...newMsgs, { role: 'assistant', text: "Unable to connect to simulation core." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <ModalWrapper title="🌌 SUPERAI — WHAT IF? ENGINE" onClose={onClose} maxWidthClass="max-w-7xl">
      <div className="flex flex-col h-[780px] font-mono text-xs text-emerald-300 bg-[#03060a] border border-emerald-500/40 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.3)]">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-black/80 border-b border-emerald-500/20">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
            <div>
              <h2 className="text-sm font-extrabold text-emerald-300 tracking-wider">WHAT IF? ENGINE</h2>
              <p className="text-[10px] text-emerald-600">Immersive Possibility &amp; Timeline Simulation Core</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${activeTab === 'home' ? 'bg-emerald-500 text-black' : 'bg-emerald-950/40 text-emerald-500 hover:text-emerald-300'}`}
            >
              Explore
            </button>
            {activeSimulation && (
              <button
                onClick={() => setActiveTab('simulation')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${activeTab === 'simulation' ? 'bg-emerald-500 text-black' : 'bg-emerald-950/40 text-emerald-500 hover:text-emerald-300'}`}
              >
                Active Simulation
              </button>
            )}
            <button
              onClick={() => setActiveTab('library')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${activeTab === 'library' ? 'bg-emerald-500 text-black' : 'bg-emerald-950/40 text-emerald-500 hover:text-emerald-300'}`}
            >
              Saved Library ({savedSimulations.length})
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* 1. HOMEPAGE & PROMPT STUDIO */}
          {activeTab === 'home' && (
            <div className="flex flex-col items-center justify-center min-h-[580px] text-center space-y-8 max-w-3xl mx-auto">
              <div className="space-y-3">
                <span className="text-[10px] tracking-widest text-emerald-500 uppercase font-bold px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800">
                  INFINITE REALITIES UNLOCKED
                </span>
                <h1 className="text-3xl sm:text-5xl font-black text-emerald-200 tracking-wider">
                  WHAT IF... EVERYTHING WERE DIFFERENT?
                </h1>
                <p className="text-xs text-emerald-600 max-w-lg mx-auto">
                  Explore impossible possibilities. Discover unexpected futures through AI-generated branching simulations.
                </p>
              </div>

              <div className="w-full space-y-4">
                <div className="flex items-center bg-black border-2 border-emerald-500/80 rounded-2xl px-4 py-3 gap-3 shadow-[0_0_35px_rgba(16,185,129,0.25)]">
                  <Brain className="w-5 h-5 text-emerald-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="What would you like to imagine? (e.g. What if Earth had two moons?)"
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && generateSimulation()}
                    className="w-full bg-transparent text-emerald-200 placeholder:text-emerald-700 focus:outline-none text-sm font-bold"
                  />
                  <button
                    onClick={() => generateSimulation()}
                    disabled={isGenerating}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-extrabold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>CREATE SIMULATION</span>
                  </button>
                </div>

                {/* Preset Prompt Pills */}
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {PRESET_PROMPTS.map(preset => (
                    <button
                      key={preset}
                      onClick={() => {
                        setPromptInput(preset);
                        generateSimulation(preset);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-900/60 hover:border-emerald-500 text-emerald-400 text-xs font-bold transition-all cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. ACTIVE SIMULATION WORKSPACE */}
          {activeTab === 'simulation' && activeSimulation && (
            <div className="space-y-6">
              <div className="p-6 bg-black/60 border border-emerald-900/60 rounded-2xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-emerald-600 uppercase font-bold">Scenario Simulation</span>
                    <h2 className="text-2xl font-black text-emerald-200 mt-1">{activeSimulation.title}</h2>
                  </div>
                  <span className="text-xs px-3 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                    {activeSimulation.category}
                  </span>
                </div>
                <p className="text-xs text-emerald-400/90 leading-relaxed">{activeSimulation.overview}</p>
              </div>

              {/* Assumptions & Consequences */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 bg-black/40 border border-emerald-900/50 rounded-2xl space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <Atom className="w-4 h-4" /> Core Assumptions
                  </h3>
                  <ul className="space-y-2">
                    {activeSimulation.assumptions.map((ass, i) => (
                      <li key={i} className="text-xs text-emerald-500 flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span> {ass}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 bg-black/40 border border-emerald-900/50 rounded-2xl space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <Flame className="w-4 h-4" /> Immediate Consequences
                  </h3>
                  <ul className="space-y-2">
                    {activeSimulation.immediateConsequences.map((con, i) => (
                      <li key={i} className="text-xs text-emerald-500 flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">→</span> {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Branching Timelines & Futures */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Compass className="w-4 h-4" /> Possible Branching Futures
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {activeSimulation.branches.map((b, i) => (
                    <div key={i} className="p-4 bg-black/60 border border-emerald-900/60 rounded-xl space-y-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        b.type === 'optimistic' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        b.type === 'challenging' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        'bg-purple-950 text-purple-400 border border-purple-800'
                      }`}>
                        {b.type}
                      </span>
                      <h4 className="font-bold text-emerald-200 mt-2">{b.name}</h4>
                      <p className="text-[11px] text-emerald-500 leading-snug">{b.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Variable Control Panel */}
              <div className="p-5 bg-black/40 border border-emerald-900/50 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Sliders className="w-4 h-4" /> Interactive Simulation Variable
                </h3>
                <div>
                  <label className="text-[11px] text-emerald-500 font-bold block mb-1">
                    Variable Scaling Factor: {variableMultiplier.toFixed(1)}x
                  </label>
                  <input
                    type="range" min="0.5" max="3.0" step="0.1"
                    value={variableMultiplier}
                    onChange={(e) => setVariableMultiplier(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>

              {/* AI Simulation Follow-up Chat */}
              <div className="flex flex-col h-[400px] bg-black/60 border border-emerald-900/60 rounded-2xl overflow-hidden">
                <div className="px-6 py-3 bg-emerald-950/40 border-b border-emerald-900/60 flex items-center gap-3">
                  <Brain className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-emerald-200">Simulation Assistant Core</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user' ? 'bg-emerald-500 text-black font-bold rounded-tr-none' : 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-200 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-emerald-950/40 text-emerald-500 text-xs px-4 py-3 rounded-2xl animate-pulse">
                        Simulating alternate branches...
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-black/80 border-t border-emerald-900/60 flex gap-3">
                  <input
                    type="text"
                    placeholder="Ask about this simulation..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                    className="flex-1 bg-emerald-950/30 border border-emerald-900/60 rounded-xl px-4 py-2.5 text-emerald-200 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={sendChat}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Ask
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. SAVED LIBRARY TAB */}
          {activeTab === 'library' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">Saved Simulation Library</h3>
              {savedSimulations.length === 0 ? (
                <div className="p-12 text-center text-emerald-700 font-bold">No saved simulations yet. Create one from the Explore tab!</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedSimulations.map(sim => (
                    <div
                      key={sim.id}
                      onClick={() => {
                        setActiveSimulation(sim);
                        setActiveTab('simulation');
                        soundEngine.playClick();
                      }}
                      className="p-5 bg-black/60 border border-emerald-900/60 hover:border-emerald-500 rounded-xl cursor-pointer transition-all space-y-2 group"
                    >
                      <div className="flex justify-between items-center text-[10px] text-emerald-600">
                        <span>{sim.createdAt}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSavedSimulations(savedSimulations.filter(s => s.id !== sim.id));
                            soundEngine.playClick();
                          }}
                          className="text-emerald-700 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h4 className="font-bold text-emerald-200 group-hover:text-emerald-300">{sim.title}</h4>
                      <p className="text-xs text-emerald-600 line-clamp-2">{sim.overview}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </ModalWrapper>
  );
};
