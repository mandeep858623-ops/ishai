import React, { useState } from 'react';
import { ModalWrapper } from '../Modals';
import { soundEngine } from '../../utils/audio';
import {
  Languages,
  CheckCheck,
  Sparkles,
  GraduationCap,
  MessageSquare,
  Layers,
  Mic,
  Scissors,
  BookMarked,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { 
  GrammarChecker, 
  LanguageLearner, 
  ConversationPartner, 
  VocabularyBuilder, 
  PronunciationCoach, 
  Summarizer, 
  Dictionary 
} from './Tools';
import { TranslatorTool } from './TranslatorTool';
import { WriterStudio } from './WriterStudio';

const STUDIO_TOOLS = [
  { id: 'translate', title: 'Translate Text', icon: Languages, component: TranslatorTool, tag: 'POLYGLOT' },
  { id: 'grammar', title: 'Grammar Checker', icon: CheckCheck, component: GrammarChecker, tag: 'PROOFREADER' },
  { id: 'writer', title: 'AI Writing Assistant', icon: Sparkles, component: WriterStudio, tag: 'COMPOSER' },
  { id: 'learn', title: 'Learn a Language', icon: GraduationCap, component: LanguageLearner, tag: 'ACADEMY' },
  { id: 'conversation', title: 'Conversation Practice', icon: MessageSquare, component: ConversationPartner, tag: 'PARTNER' },
  { id: 'vocab', title: 'Vocabulary Builder', icon: Layers, component: VocabularyBuilder, tag: 'LEXICON' },
  { id: 'pronunciation', title: 'Pronunciation Coach', icon: Mic, component: PronunciationCoach, tag: 'PHONETICS' },
  { id: 'summarize', title: 'Summarize and Simplify', icon: Scissors, component: Summarizer, tag: 'SYNTHESIS' },
  { id: 'dictionary', title: 'Dictionary and Examples', icon: BookMarked, component: Dictionary, tag: 'LEXICOGRAPHY' },
];

export const LanguageStudio: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const activeMeta = STUDIO_TOOLS.find((t) => t.id === activeToolId);
  const ActiveComponent = activeMeta?.component || null;

  return (
    <ModalWrapper title="🌍 SUPERAI — LANGUAGE STUDIO" onClose={onClose} maxWidthClass="max-w-4xl">
      <div className="flex flex-col min-h-[500px] font-mono text-emerald-400">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-950 text-xs">
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveToolId(null)} className="text-emerald-500 hover:text-emerald-300 font-bold tracking-wider">LANGUAGE STUDIO</button>
            {activeMeta && (
              <>
                <span className="text-zinc-600">/</span>
                <span className="text-emerald-300 font-bold">{activeMeta.title}</span>
              </>
            )}
          </div>
          {activeToolId && (
            <button onClick={() => setActiveToolId(null)} className="text-[11px] bg-black border border-emerald-800 text-emerald-400 px-2 py-1 rounded">
              <ArrowLeft className="w-3 h-3 inline" /> Back
            </button>
          )}
        </div>

        {!activeToolId ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {STUDIO_TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => { soundEngine.playClick(); setActiveToolId(tool.id); }}
                className="bg-[#090c10] border border-emerald-950 hover:border-emerald-500/80 p-4 rounded-lg text-left transition-all cursor-pointer"
              >
                <div className="flex justify-between mb-2">
                    <tool.icon className="w-5 h-5 text-emerald-400" />
                    <span className="text-[9px] font-bold text-zinc-500">{tool.tag}</span>
                </div>
                <h4 className="font-bold text-xs text-emerald-300">{tool.title}</h4>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex-1">{ActiveComponent && <ActiveComponent />}</div>
        )}
      </div>
    </ModalWrapper>
  );
};
