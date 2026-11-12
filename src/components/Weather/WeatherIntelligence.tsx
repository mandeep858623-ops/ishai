import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  FileText, 
  Calendar, 
  TrendingUp, 
  HelpCircle,
  Shirt,
  Umbrella,
  Compass,
  AlertCircle
} from 'lucide-react';
import { RawWeatherData, RawAirQualityData, WeatherLocation } from './types';

interface WeatherIntelligenceProps {
  weather: RawWeatherData;
  airQuality: RawAirQualityData | null;
  location: WeatherLocation;
  theme: 'dark' | 'light';
}

export const WeatherIntelligence: React.FC<WeatherIntelligenceProps> = ({
  weather,
  airQuality,
  location,
  theme
}) => {
  const [activeTab, setActiveTab] = useState<'briefing' | 'weekly' | 'chat'>('briefing');
  const [briefingText, setBriefingText] = useState<string | null>(null);
  const [weeklyText, setWeeklyText] = useState<string | null>(null);
  const [isLoadingBriefing, setIsLoadingBriefing] = useState(false);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: `Hello! I am your ISHAI Weather Intelligence Core. I have loaded live meteorological telemetry and air quality metrics for ${location.name}. Ask me anything about upcoming rain windows, commute impacts, optimal exercise hours, or clothing advice!`
    }
  ]);
  const [userQuery, setUserQuery] = useState('');
  const [isAiAnswering, setIsAiAnswering] = useState(false);

  // Fetch AI Briefing
  const generateDailyBriefing = async () => {
    setIsLoadingBriefing(true);
    try {
      const res = await fetch('/api/weather/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'briefing',
          weatherData: weather,
          airQualityData: airQuality,
          locationName: `${location.name}, ${location.country}`
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setBriefingText(data.result);
      } else {
        setBriefingText('Could not generate weather briefing. Please try again.');
      }
    } catch (err: any) {
      setBriefingText(`Weather intelligence connection error: ${err.message}`);
    } finally {
      setIsLoadingBriefing(false);
    }
  };

  // Fetch Weekly Outlook
  const generateWeeklyOutlook = async () => {
    setIsLoadingWeekly(true);
    try {
      const res = await fetch('/api/weather/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'weekly_summary',
          weatherData: weather,
          airQualityData: airQuality,
          locationName: `${location.name}, ${location.country}`
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setWeeklyText(data.result);
      } else {
        setWeeklyText('Could not generate weekly summary. Please try again.');
      }
    } catch (err: any) {
      setWeeklyText(`Weekly analysis connection error: ${err.message}`);
    } finally {
      setIsLoadingWeekly(false);
    }
  };

  // Handle Q&A submit
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim() || isAiAnswering) return;

    const q = userQuery.trim();
    setUserQuery('');
    setChatMessages((prev) => [...prev, { role: 'user', text: q }]);
    setIsAiAnswering(true);

    try {
      const res = await fetch('/api/weather/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'qa',
          query: q,
          weatherData: weather,
          airQualityData: airQuality,
          locationName: `${location.name}, ${location.country}`
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setChatMessages((prev) => [...prev, { role: 'assistant', text: data.result }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', text: 'Telemetry analysis was unable to complete the query. Please retry.' }
        ]);
      }
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `Connection interruption: ${err.message}` }
      ]);
    } finally {
      setIsAiAnswering(false);
    }
  };

  const quickPrompts = [
    'Is rain expected this afternoon?',
    'What should I wear today?',
    'How will the weather change tomorrow?',
    'Is air quality safe for a morning run?'
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className={`p-6 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        theme === 'dark' 
          ? 'bg-gradient-to-r from-violet-950/40 via-indigo-950/30 to-zinc-900 border-violet-900/40' 
          : 'bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/25">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Gemini Weather Intelligence</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live reasoning grounded strictly in real Open-Meteo & Copernicus observations for {location.name}
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center rounded-2xl bg-zinc-950/70 p-1 border border-zinc-800">
          <button
            onClick={() => {
              setActiveTab('briefing');
              if (!briefingText && !isLoadingBriefing) generateDailyBriefing();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'briefing' ? 'bg-violet-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Daily Briefing
          </button>
          <button
            onClick={() => {
              setActiveTab('weekly');
              if (!weeklyText && !isLoadingWeekly) generateWeeklyOutlook();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'weekly' ? 'bg-violet-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Weekly Summary
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'chat' ? 'bg-violet-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Ask Weather AI
          </button>
        </div>
      </div>

      {/* DAILY BRIEFING TAB */}
      {activeTab === 'briefing' && (
        <div className={`p-6 rounded-3xl border shadow-xl ${
          theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <FileText className="w-4 h-4 text-violet-400" />
              <span>Executive Daily Weather Briefing</span>
            </div>
            <button
              onClick={generateDailyBriefing}
              disabled={isLoadingBriefing}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
            >
              {isLoadingBriefing ? 'Synthesizing...' : 'Re-generate'}
            </button>
          </div>

          {isLoadingBriefing ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-7 h-7 text-violet-400 animate-spin" />
              <p className="text-xs text-zinc-400">Gemini is synthesizing hourly temperatures, wind shifts, and precipitation fronts...</p>
            </div>
          ) : briefingText ? (
            <div className="prose prose-invert max-w-none text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
              {briefingText}
            </div>
          ) : (
            <div className="py-8 text-center">
              <button
                onClick={generateDailyBriefing}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-violet-600/30 hover:scale-105 transition-all cursor-pointer"
              >
                Generate Daily Briefing
              </button>
            </div>
          )}
        </div>
      )}

      {/* WEEKLY OUTLOOK TAB */}
      {activeTab === 'weekly' && (
        <div className={`p-6 rounded-3xl border shadow-xl ${
          theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>7-Day Meteorological Outlook & Trend Synthesis</span>
            </div>
            <button
              onClick={generateWeeklyOutlook}
              disabled={isLoadingWeekly}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
            >
              {isLoadingWeekly ? 'Synthesizing...' : 'Re-generate'}
            </button>
          </div>

          {isLoadingWeekly ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
              <p className="text-xs text-zinc-400">Analyzing multi-day ECMWF forecast curves...</p>
            </div>
          ) : weeklyText ? (
            <div className="prose prose-invert max-w-none text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
              {weeklyText}
            </div>
          ) : (
            <div className="py-8 text-center">
              <button
                onClick={generateWeeklyOutlook}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 hover:scale-105 transition-all cursor-pointer"
              >
                Generate 7-Day Outlook
              </button>
            </div>
          )}
        </div>
      )}

      {/* CHAT WITH WEATHER AI TAB */}
      {activeTab === 'chat' && (
        <div className={`p-6 rounded-3xl border shadow-xl flex flex-col h-[520px] ${
          theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-slate-200'
        }`}>
          {/* Quick prompts */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-zinc-800 scrollbar-none">
            {quickPrompts.map((qp) => (
              <button
                key={qp}
                onClick={() => setUserQuery(qp)}
                className="px-3 py-1.5 rounded-xl text-[11px] font-medium bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 whitespace-nowrap transition-colors cursor-pointer"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                      : 'bg-zinc-950/80 border border-zinc-800 text-zinc-200 shadow-md'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isAiAnswering && (
              <div className="flex justify-start">
                <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                  <span>Synthesizing real meteorological data...</span>
                </div>
              </div>
            )}
          </div>

          {/* Query input form */}
          <form onSubmit={handleChatSubmit} className="pt-3 border-t border-zinc-800 flex items-center gap-2">
            <input
              type="text"
              placeholder={`Ask anything about weather in ${location.name}...`}
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="flex-1 bg-zinc-950/80 border border-zinc-700/80 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!userQuery.trim() || isAiAnswering}
              className="p-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
