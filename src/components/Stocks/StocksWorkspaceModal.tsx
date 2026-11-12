/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ModalWrapper } from '../Modals';
import { soundEngine, speakText } from '../../utils/audio';
import {
  TrendingUp,
  Search,
  BarChart3,
  PieChart,
  Brain,
  Newspaper,
  Calendar,
  Layers,
  Bookmark,
  Sliders,
  Activity,
  Calculator,
  BookOpen,
  Globe,
  Plus,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Send,
  Zap,
  Bell,
  Check
} from 'lucide-react';

interface StocksWorkspaceModalProps {
  onClose: () => void;
  onLog?: (text: string, tag: string) => void;
  currentUser?: any;
  authToken?: string;
}

type StockTab =
  | 'overview'
  | 'markets'
  | 'explore'
  | 'screener'
  | 'charts'
  | 'ai_lab'
  | 'portfolio'
  | 'watchlists'
  | 'compare'
  | 'news'
  | 'calendar'
  | 'ipo'
  | 'mutual_funds'
  | 'paper_trading'
  | 'journal'
  | 'calculators'
  | 'alerts'
  | 'learning';

interface StockItem {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  pe: number;
  roe: number;
  sector: string;
  high52: number;
  low52: number;
  volume: string;
  description: string;
}

const MOCK_STOCKS: StockItem[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', exchange: 'NSE', price: 2845.50, change: 35.20, changePercent: 1.25, marketCap: '₹19.2 Lakh Cr', pe: 28.4, roe: 12.5, sector: 'Energy', high52: 3025.0, low52: 2220.0, volume: '6.4M', description: 'India largest conglomerate with businesses in energy, petrochemicals, retail, and telecommunications.' },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', exchange: 'NSE', price: 4120.00, change: -18.50, changePercent: -0.45, marketCap: '₹14.9 Lakh Cr', pe: 31.2, roe: 45.8, sector: 'Technology', high52: 4500.0, low52: 3100.0, volume: '2.1M', description: 'Leading global IT services, consulting, and business solutions organization.' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', exchange: 'NSE', price: 1680.25, change: 12.75, changePercent: 0.76, marketCap: '₹12.8 Lakh Cr', pe: 19.5, roe: 16.8, sector: 'Banking', high52: 1750.0, low52: 1380.0, volume: '11.8M', description: 'Premier private sector bank in India offering commercial and transactional banking services.' },
  { symbol: 'INFY', name: 'Infosys Ltd', exchange: 'NSE', price: 1890.10, change: 24.60, changePercent: 1.32, marketCap: '₹7.8 Lakh Cr', pe: 27.8, roe: 31.4, sector: 'Technology', high52: 1950.0, low52: 1350.0, volume: '4.5M', description: 'Global leader in next-generation digital services and consulting.' },
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', price: 232.40, change: 2.10, changePercent: 0.91, marketCap: '$3.52 Trillion', pe: 34.5, roe: 145.2, sector: 'Technology', high52: 237.2, low52: 165.0, volume: '48.2M', description: 'Designer and manufacturer of consumer electronics, computer software, and online services.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', price: 138.25, change: 4.80, changePercent: 3.59, marketCap: '$3.39 Trillion', pe: 68.2, roe: 112.4, sector: 'Semiconductors', high52: 140.7, low52: 39.2, volume: '89.5M', description: 'Pioneering GPU manufacturer fueling artificial intelligence, gaming, and accelerated computing.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', price: 425.60, change: -3.40, changePercent: -0.79, marketCap: '$3.16 Trillion', pe: 36.1, roe: 38.9, sector: 'Technology', high52: 468.3, low52: 325.0, volume: '18.4M', description: 'Global technology corporation producing computer software, consumer electronics, and cloud computing.' },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', price: 218.80, change: -7.50, changePercent: -3.31, marketCap: '$698 Billion', pe: 62.4, roe: 24.1, sector: 'Automotive', high52: 271.0, low52: 138.8, volume: '62.1M', description: 'Electric vehicle and clean energy company.' }
];

export const StocksWorkspaceModal: React.FC<StocksWorkspaceModalProps> = ({
  onClose,
  onLog,
  currentUser
}) => {
  const userPrefix = currentUser?.uid ? `user_${currentUser.uid}_` : 'guest_';
  const [activeTab, setActiveTab] = useState<StockTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockItem>(MOCK_STOCKS[0]);
  const [chartTimeframe, setChartTimeframe] = useState<'1D' | '1W' | '1M' | '1Y' | '5Y'>('1M');

  // AI Research Lab state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: 'Hello! I am your SUPERAI Financial Intelligence Assistant. Ask me to analyze any stock, explain financial statements, or review your portfolio risk.' }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Portfolio state with localStorage persistence per user
  const [portfolioHoldings, setPortfolioHoldings] = useState<Array<{ symbol: string; qty: number; avgPrice: number; currentPrice: number }>>(() => {
    try {
      const saved = localStorage.getItem(`${userPrefix}portfolio`);
      return saved ? JSON.parse(saved) : [
        { symbol: 'RELIANCE', qty: 25, avgPrice: 2750.0, currentPrice: 2845.50 },
        { symbol: 'AAPL', qty: 10, avgPrice: 215.0, currentPrice: 232.40 }
      ];
    } catch {
      return [{ symbol: 'RELIANCE', qty: 25, avgPrice: 2750.0, currentPrice: 2845.50 }];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${userPrefix}portfolio`, JSON.stringify(portfolioHoldings));
    } catch {}
  }, [portfolioHoldings, userPrefix]);

  // Watchlists state with persistence
  const [watchlists, setWatchlists] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${userPrefix}watchlists`);
      return saved ? JSON.parse(saved) : ['RELIANCE', 'NVDA', 'TCS', 'AAPL'];
    } catch {
      return ['RELIANCE', 'NVDA'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${userPrefix}watchlists`, JSON.stringify(watchlists));
    } catch {}
  }, [watchlists, userPrefix]);

  // Comparison state (up to 3 stocks)
  const [compareSymbols, setCompareSymbols] = useState<string[]>(['RELIANCE', 'TCS', 'INFY']);

  // Screener state
  const [screenerSector, setScreenerSector] = useState<string>('ALL');
  const [screenerMinRoe, setScreenerMinRoe] = useState<number>(0);

  // Paper Trading state
  const [paperCash, setPaperCash] = useState<number>(100000);
  const [paperPortfolio, setPaperPortfolio] = useState<Array<{ symbol: string; qty: number; buyPrice: number }>>([]);

  // Investment Journal state
  const [journalNotes, setJournalNotes] = useState<Array<{ id: string; title: string; note: string; date: string }>>([
    { id: '1', title: 'Long-term thesis on AI hardware', note: 'NVIDIA and semiconductor leaders maintain secular demand tailwinds.', date: new Date().toLocaleDateString() }
  ]);
  const [newJournalTitle, setNewJournalTitle] = useState('');
  const [newJournalNote, setNewJournalNote] = useState('');

  // Calculators state
  const [sipMonthly, setSipMonthly] = useState(10000);
  const [sipYears, setSipYears] = useState(10);
  const [sipRate, setSipRate] = useState(14);

  // Alerts state
  const [alerts, setAlerts] = useState<Array<{ symbol: string; targetPrice: number; active: boolean }>>([
    { symbol: 'RELIANCE', targetPrice: 2900, active: true }
  ]);
  const [alertSymbol, setAlertSymbol] = useState('RELIANCE');
  const [alertPrice, setAlertPrice] = useState(3000);

  // Send AI Query
  const sendAiQuery = async (queryText?: string) => {
    const q = queryText || aiPrompt;
    if (!q.trim()) return;
    
    const newMsgs = [...aiMessages, { role: 'user' as const, text: q }];
    setAiMessages(newMsgs);
    setAiPrompt('');
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Financial Query regarding ${selectedStock.symbol} (${selectedStock.name}): ${q}. Data: P/E ${selectedStock.pe}, ROE ${selectedStock.roe}%, MarketCap ${selectedStock.marketCap}`,
          systemInstruction: "You are SUPERAI Financial Intelligence Core. Provide accurate, professional, concise financial analysis. Never guarantee investment returns."
        })
      });
      const data = await res.json();
      const answer = data.answer || "Financial analysis generated successfully.";
      setAiMessages([...newMsgs, { role: 'assistant', text: answer }]);
      speakText(answer.slice(0, 180), 'Male');
      if (onLog) onLog(`[AI_LAB] Answered query for ${selectedStock.symbol}`, 'FINANCE');
    } catch {
      setAiMessages([...newMsgs, { role: 'assistant', text: "Unable to reach AI financial core. Please check connection." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const tabs: Array<{ id: StockTab; label: string; icon: any }> = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'markets', label: 'Markets', icon: Globe },
    { id: 'explore', label: 'Explore', icon: Search },
    { id: 'screener', label: 'Screener', icon: Sliders },
    { id: 'charts', label: 'Charts', icon: BarChart3 },
    { id: 'ai_lab', label: 'AI Research Lab', icon: Brain },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'watchlists', label: 'Watchlists', icon: Bookmark },
    { id: 'compare', label: 'Compare', icon: Layers },
    { id: 'news', label: 'News', icon: Newspaper },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'ipo', label: 'IPO Center', icon: Zap },
    { id: 'mutual_funds', label: 'Mutual Funds', icon: PieChart },
    { id: 'paper_trading', label: 'Paper Trading', icon: TrendingUp },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'calculators', label: 'Calculators', icon: Calculator },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'learning', label: 'Learning Center', icon: BookOpen }
  ];

  return (
    <ModalWrapper title="📈 SUPERAI STOCKS — ULTIMATE FINANCIAL INTELLIGENCE PLATFORM" onClose={onClose} maxWidthClass="max-w-7xl">
      <div className="flex flex-col h-[780px] font-mono text-xs text-emerald-300 bg-[#04070c] border border-emerald-500/40 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.25)]">
        
        {/* Top Navbar Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-2 bg-black/60 border-b border-emerald-500/20 scrollbar-none">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab(t.id);
                  if (onLog) onLog(`[STOCKS] Switched to tab: ${t.label}`, 'FINANCE');
                }}
                className={`px-3 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                    : 'bg-emerald-950/30 text-emerald-600 hover:text-emerald-300 hover:bg-emerald-950/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'NIFTY 50', val: '24,850.25', change: '+124.50 (+0.50%)', positive: true },
                  { name: 'SENSEX', val: '81,420.10', change: '+380.15 (+0.47%)', positive: true },
                  { name: 'NASDAQ', val: '18,340.80', change: '-45.20 (-0.25%)', positive: false },
                  { name: 'S&P 500', val: '5,840.12', change: '+18.40 (+0.32%)', positive: true }
                ].map((idx, i) => (
                  <div key={i} className="p-4 bg-emerald-950/20 border border-emerald-900/50 rounded-2xl space-y-2">
                    <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-widest">{idx.name}</span>
                    <div className="text-xl font-black text-emerald-200">{idx.val}</div>
                    <div className={`text-xs font-bold flex items-center gap-1 ${idx.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {idx.positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {idx.change}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" /> Market Movers & Active Instruments
                    </h3>
                    <span className="text-[10px] text-emerald-600">Real-time Feed Active</span>
                  </div>
                  <div className="bg-black/40 border border-emerald-900/50 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-emerald-950/40 text-emerald-600 text-[10px] uppercase font-black">
                        <tr>
                          <th className="p-3">Instrument</th>
                          <th className="p-3">Exchange</th>
                          <th className="p-3 text-right">Price</th>
                          <th className="p-3 text-right">Change</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-950/50">
                        {MOCK_STOCKS.map(st => (
                          <tr key={st.symbol} className="hover:bg-emerald-950/20 transition-colors">
                            <td className="p-3">
                              <div className="font-bold text-emerald-200">{st.symbol}</div>
                              <div className="text-[10px] text-emerald-600">{st.name}</div>
                            </td>
                            <td className="p-3 text-emerald-500 font-semibold">{st.exchange}</td>
                            <td className="p-3 text-right font-bold text-emerald-300">₹{st.price.toLocaleString()}</td>
                            <td className={`p-3 text-right font-bold ${st.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {st.change >= 0 ? '+' : ''}{st.changePercent}%
                            </td>
                            <td className="p-3 text-right flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedStock(st);
                                  setActiveTab('explore');
                                }}
                                className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black text-emerald-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                              >
                                Research
                              </button>
                              <button
                                onClick={() => {
                                  if (!watchlists.includes(st.symbol)) {
                                    setWatchlists([...watchlists, st.symbol]);
                                    soundEngine.playSuccess();
                                  }
                                }}
                                className="p-1.5 bg-emerald-950/50 hover:bg-emerald-900 text-emerald-300 rounded-lg"
                                title="Add to Watchlist"
                              >
                                <Bookmark className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quick AI Assistant Card */}
                <div className="p-5 bg-gradient-to-b from-emerald-950/30 to-black border border-emerald-500/30 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <Brain className="w-5 h-5 text-emerald-400 animate-pulse" />
                      <span>AI Market Insights</span>
                    </div>
                    <p className="text-xs text-emerald-400/80 leading-relaxed">
                      Markets are showing strong resilience driven by technology and banking sectors. Inflation metrics remain within projected bounds.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('ai_lab')}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    <span>OPEN AI RESEARCH LAB</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. MARKETS TAB */}
          {activeTab === 'markets' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">Global &amp; Indian Indices Matrix</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'NIFTY 50', exchange: 'NSE', value: '24,850.25', change: '+0.50%', status: 'OPEN' },
                  { name: 'SENSEX', exchange: 'BSE', value: '81,420.10', change: '+0.47%', status: 'OPEN' },
                  { name: 'BANK NIFTY', exchange: 'NSE', value: '51,200.40', change: '+0.82%', status: 'OPEN' },
                  { name: 'NASDAQ COMPOSITE', exchange: 'NASDAQ', value: '18,340.80', change: '-0.25%', status: 'CLOSED' },
                  { name: 'S&P 500', exchange: 'NYSE', value: '5,840.12', change: '+0.32%', status: 'CLOSED' },
                  { name: 'FTSE 100', exchange: 'LSE', value: '8,240.50', change: '+0.15%', status: 'OPEN' }
                ].map((idx, i) => (
                  <div key={i} className="p-4 bg-black/60 border border-emerald-900/60 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-emerald-200">{idx.name}</h4>
                        <span className="text-[10px] text-emerald-600">{idx.exchange}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${idx.status === 'OPEN' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-zinc-900 text-zinc-500'}`}>
                        {idx.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-emerald-950">
                      <span className="text-lg font-black text-emerald-300">{idx.value}</span>
                      <span className="text-xs font-bold text-emerald-400">{idx.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. EXPLORE STOCKS TAB */}
          {activeTab === 'explore' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-emerald-600" />
                  <input
                    type="text"
                    placeholder="Search by company name, ticker or sector..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/60 border border-emerald-900/60 rounded-xl py-2.5 pl-10 pr-4 text-emerald-200 placeholder:text-emerald-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  {MOCK_STOCKS.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.symbol.toLowerCase().includes(searchQuery.toLowerCase())).map(st => (
                    <div
                      key={st.symbol}
                      onClick={() => setSelectedStock(st)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedStock.symbol === st.symbol 
                          ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                          : 'bg-black/40 border-emerald-900/50 hover:border-emerald-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-emerald-200">{st.symbol}</h4>
                          <p className="text-[10px] text-emerald-600">{st.name}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">{st.exchange}</span>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-emerald-950">
                        <span className="text-sm font-bold text-emerald-300">₹{st.price.toLocaleString()}</span>
                        <span className={`text-xs font-bold ${st.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {st.change >= 0 ? '+' : ''}{st.changePercent}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Stock Detailed Research Profile */}
                <div className="lg:col-span-2 p-6 bg-black/60 border border-emerald-900/60 rounded-2xl space-y-6">
                  <div className="flex justify-between items-start border-b border-emerald-950 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-black text-emerald-200">{selectedStock.name}</h2>
                        <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-500 text-black font-bold">{selectedStock.symbol}</span>
                      </div>
                      <p className="text-xs text-emerald-600 mt-1">Sector: {selectedStock.sector} | Exchange: {selectedStock.exchange}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-emerald-300">₹{selectedStock.price.toLocaleString()}</div>
                      <div className={`text-xs font-bold ${selectedStock.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {selectedStock.change >= 0 ? '+' : ''}{selectedStock.changePercent}% today
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-emerald-400/80 leading-relaxed">{selectedStock.description}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-xl">
                      <span className="text-[10px] text-emerald-600 uppercase">Market Cap</span>
                      <div className="text-sm font-bold text-emerald-200 mt-1">{selectedStock.marketCap}</div>
                    </div>
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-xl">
                      <span className="text-[10px] text-emerald-600 uppercase">P/E Ratio</span>
                      <div className="text-sm font-bold text-emerald-200 mt-1">{selectedStock.pe}</div>
                    </div>
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-xl">
                      <span className="text-[10px] text-emerald-600 uppercase">ROE</span>
                      <div className="text-sm font-bold text-emerald-200 mt-1">{selectedStock.roe}%</div>
                    </div>
                    <div className="p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-xl">
                      <span className="text-[10px] text-emerald-600 uppercase">Volume</span>
                      <div className="text-sm font-bold text-emerald-200 mt-1">{selectedStock.volume}</div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setActiveTab('ai_lab')}
                      className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Brain className="w-4 h-4" />
                      <span>ASK AI ABOUT {selectedStock.symbol}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (!watchlists.includes(selectedStock.symbol)) {
                          setWatchlists([...watchlists, selectedStock.symbol]);
                          soundEngine.playSuccess();
                        }
                      }}
                      className="px-4 py-3 bg-emerald-950/50 border border-emerald-500/50 hover:bg-emerald-900 text-emerald-300 font-bold rounded-xl transition-all cursor-pointer"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. STOCK SCREENER TAB */}
          {activeTab === 'screener' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4 p-4 bg-black/60 border border-emerald-900/60 rounded-xl">
                <div>
                  <label className="text-[10px] uppercase text-emerald-600 font-bold block mb-1">Sector Filter</label>
                  <select
                    value={screenerSector}
                    onChange={(e) => setScreenerSector(e.target.value)}
                    className="bg-black border border-emerald-800 rounded-lg px-3 py-1.5 text-emerald-300 text-xs"
                  >
                    <option value="ALL">All Sectors</option>
                    <option value="Technology">Technology</option>
                    <option value="Banking">Banking</option>
                    <option value="Energy">Energy</option>
                    <option value="Semiconductors">Semiconductors</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-emerald-600 font-bold block mb-1">Minimum ROE (%)</label>
                  <input
                    type="number"
                    value={screenerMinRoe}
                    onChange={(e) => setScreenerMinRoe(Number(e.target.value))}
                    className="bg-black border border-emerald-800 rounded-lg px-3 py-1.5 text-emerald-300 text-xs w-28"
                  />
                </div>
              </div>

              <div className="bg-black/60 border border-emerald-900/60 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-emerald-950/40 text-emerald-600 text-[10px] uppercase font-black">
                    <tr>
                      <th className="p-3">Symbol</th>
                      <th className="p-3">Sector</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">P/E</th>
                      <th className="p-3 text-right">ROE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-950/50">
                    {MOCK_STOCKS.filter(s => (screenerSector === 'ALL' || s.sector === screenerSector) && s.roe >= screenerMinRoe).map(st => (
                      <tr key={st.symbol} className="hover:bg-emerald-950/20">
                        <td className="p-3 font-bold text-emerald-200">{st.symbol}</td>
                        <td className="p-3 text-emerald-500">{st.sector}</td>
                        <td className="p-3 text-right font-bold text-emerald-300">₹{st.price.toLocaleString()}</td>
                        <td className="p-3 text-right text-emerald-300">{st.pe}</td>
                        <td className="p-3 text-right font-bold text-emerald-400">{st.roe}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. CHARTS & TECHNICAL ANALYSIS TAB */}
          {activeTab === 'charts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-black/60 border border-emerald-900/60 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-200 text-sm">{selectedStock.symbol} Technical Chart</span>
                  <div className="flex gap-1 bg-black border border-emerald-900 rounded-lg p-1">
                    {(['1D', '1W', '1M', '1Y', '5Y'] as const).map(tf => (
                      <button
                        key={tf}
                        onClick={() => setChartTimeframe(tf)}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold ${chartTimeframe === tf ? 'bg-emerald-500 text-black' : 'text-emerald-600 hover:text-emerald-300'}`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-emerald-400">RSI: 62.4 (Neutral) | MACD: Bullish Crossover</div>
              </div>

              <div className="h-80 bg-black/80 border border-emerald-900/60 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                  <BarChart3 className="w-64 h-64 text-emerald-500" />
                </div>
                <div className="flex justify-between z-10">
                  <div>
                    <span className="text-[10px] text-emerald-600 uppercase">Timeframe: {chartTimeframe}</span>
                    <div className="text-xl font-black text-emerald-200">₹{selectedStock.price.toLocaleString()}</div>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold">SMA (50): ₹{(selectedStock.price * 0.96).toFixed(2)}</span>
                </div>
                <div className="h-40 flex items-end gap-1.5 z-10 pt-4">
                  {[40, 45, 42, 48, 55, 52, 60, 68, 65, 72, 78, 75, 82, 88, 85, 92].map((v, i) => (
                    <div key={i} className="flex-1 bg-emerald-500/40 hover:bg-emerald-400 rounded-t transition-all" style={{ height: `${v}%` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 6. AI RESEARCH LAB TAB */}
          {activeTab === 'ai_lab' && (
            <div className="flex flex-col h-[520px] bg-black/60 border border-emerald-900/60 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 bg-emerald-950/40 border-b border-emerald-900/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-emerald-400 animate-pulse" />
                  <div>
                    <h3 className="text-sm font-extrabold text-emerald-300">SUPERAI AI FINANCIAL RESEARCH LAB</h3>
                    <p className="text-[10px] text-emerald-600">Context-Aware Gemini Intelligence Engine</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {aiMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-emerald-500 text-black font-bold rounded-tr-none' 
                        : 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-200 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-emerald-950/40 border border-emerald-500/20 px-4 py-3 rounded-2xl text-emerald-500 text-xs animate-pulse">
                      Analyzing financial models &amp; market data...
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-black/80 border-t border-emerald-900/60 flex gap-3">
                <input
                  type="text"
                  placeholder={`Ask anything about ${selectedStock.symbol} or global markets...`}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendAiQuery()}
                  className="flex-1 bg-emerald-950/30 border border-emerald-900/60 rounded-xl px-4 py-3 text-emerald-200 placeholder:text-emerald-700 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => sendAiQuery()}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Analyze</span>
                </button>
              </div>
            </div>
          )}

          {/* 7. PORTFOLIO COMMAND CENTER TAB */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-950/20 border border-emerald-900/50 rounded-2xl">
                  <span className="text-[10px] text-emerald-600 uppercase">Total Invested</span>
                  <div className="text-2xl font-black text-emerald-200 mt-1">₹89,250.00</div>
                </div>
                <div className="p-4 bg-emerald-950/20 border border-emerald-900/50 rounded-2xl">
                  <span className="text-[10px] text-emerald-600 uppercase">Current Portfolio Value</span>
                  <div className="text-2xl font-black text-emerald-300 mt-1">₹95,420.50</div>
                </div>
                <div className="p-4 bg-emerald-950/20 border border-emerald-900/50 rounded-2xl">
                  <span className="text-[10px] text-emerald-600 uppercase">Total Unrealized Profit</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">+₹6,170.50 (+6.91%)</div>
                </div>
              </div>

              <div className="bg-black/60 border border-emerald-900/60 rounded-2xl overflow-hidden">
                <div className="p-4 bg-emerald-950/40 border-b border-emerald-900/60 flex justify-between items-center">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300">Active Holdings</h3>
                  <button
                    onClick={() => {
                      setPortfolioHoldings([...portfolioHoldings, { symbol: 'TCS', qty: 5, avgPrice: 4100, currentPrice: 4120 }]);
                      soundEngine.playSuccess();
                    }}
                    className="px-3 py-1.5 bg-emerald-500 text-black rounded-lg font-extrabold text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Holding
                  </button>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-black/40 text-emerald-600 text-[10px] uppercase font-black">
                    <tr>
                      <th className="p-3">Symbol</th>
                      <th className="p-3 text-right">Quantity</th>
                      <th className="p-3 text-right">Avg Price</th>
                      <th className="p-3 text-right">Current Price</th>
                      <th className="p-3 text-right">Total Gain/Loss</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-950/50">
                    {portfolioHoldings.map((h, i) => {
                      const invested = h.qty * h.avgPrice;
                      const current = h.qty * h.currentPrice;
                      const pnl = current - invested;
                      return (
                        <tr key={i} className="hover:bg-emerald-950/20">
                          <td className="p-3 font-bold text-emerald-200">{h.symbol}</td>
                          <td className="p-3 text-right text-emerald-300">{h.qty}</td>
                          <td className="p-3 text-right text-emerald-300">₹{h.avgPrice.toLocaleString()}</td>
                          <td className="p-3 text-right text-emerald-300">₹{h.currentPrice.toLocaleString()}</td>
                          <td className={`p-3 text-right font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {pnl >= 0 ? '+' : ''}₹{pnl.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. WATCHLISTS TAB */}
          {activeTab === 'watchlists' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">My Saved Watchlists</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {watchlists.map((sym) => {
                  const stock = MOCK_STOCKS.find(s => s.symbol === sym) || MOCK_STOCKS[0];
                  return (
                    <div key={sym} className="p-4 bg-black/60 border border-emerald-900/60 rounded-xl space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-emerald-200">{sym}</span>
                        <button
                          onClick={() => {
                            setWatchlists(watchlists.filter(s => s !== sym));
                            soundEngine.playClick();
                          }}
                          className="text-emerald-600 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-emerald-950">
                        <span className="text-sm font-bold text-emerald-300">₹{stock.price.toLocaleString()}</span>
                        <span className={`text-xs font-bold ${stock.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {stock.change >= 0 ? '+' : ''}{stock.changePercent}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 9. COMPARE STOCKS TAB */}
          {activeTab === 'compare' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">Side-by-Side Company Comparison</h3>
              <div className="bg-black/60 border border-emerald-900/60 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-emerald-950/40 text-emerald-600 text-[10px] uppercase font-black">
                    <tr>
                      <th className="p-3">Metric</th>
                      {compareSymbols.map(sym => (
                        <th key={sym} className="p-3 text-right">{sym}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-950/50">
                    <tr>
                      <td className="p-3 font-bold text-emerald-400">Price</td>
                      {compareSymbols.map(sym => {
                        const st = MOCK_STOCKS.find(s => s.symbol === sym) || MOCK_STOCKS[0];
                        return <td key={sym} className="p-3 text-right text-emerald-200 font-bold">₹{st.price.toLocaleString()}</td>;
                      })}
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-emerald-400">P/E Ratio</td>
                      {compareSymbols.map(sym => {
                        const st = MOCK_STOCKS.find(s => s.symbol === sym) || MOCK_STOCKS[0];
                        return <td key={sym} className="p-3 text-right text-emerald-300">{st.pe}</td>;
                      })}
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-emerald-400">ROE</td>
                      {compareSymbols.map(sym => {
                        const st = MOCK_STOCKS.find(s => s.symbol === sym) || MOCK_STOCKS[0];
                        return <td key={sym} className="p-3 text-right text-emerald-300">{st.roe}%</td>;
                      })}
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-emerald-400">Market Cap</td>
                      {compareSymbols.map(sym => {
                        const st = MOCK_STOCKS.find(s => s.symbol === sym) || MOCK_STOCKS[0];
                        return <td key={sym} className="p-3 text-right text-emerald-300">{st.marketCap}</td>;
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 10. FINANCIAL NEWS TAB */}
          {activeTab === 'news' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">Latest Financial Headlines &amp; Insights</h3>
              {[
                { title: 'RBI Maintains Repo Rate at 6.5% Amid Stable Inflation Growth', time: '2 hours ago', source: 'Economic Times' },
                { title: 'Tech Stocks Rally as Semiconductor Demand Surges Worldwide', time: '4 hours ago', source: 'Bloomberg' },
                { title: 'Q2 Corporate Earnings Exceed Wall Street Expectations', time: '6 hours ago', source: 'Reuters' }
              ].map((item, i) => (
                <div key={i} className="p-4 bg-black/60 border border-emerald-900/60 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-emerald-600">
                    <span>{item.source}</span>
                    <span>{item.time}</span>
                  </div>
                  <h4 className="font-bold text-emerald-200">{item.title}</h4>
                </div>
              ))}
            </div>
          )}

          {/* 11. EARNINGS CALENDAR TAB */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">Upcoming Corporate Earnings &amp; Events</h3>
              {[
                { company: 'Reliance Industries', date: 'Nov 05, 2026', event: 'Q2 Financial Results & Dividend Declaration' },
                { company: 'TCS', date: 'Nov 08, 2026', event: 'Quarterly Revenue Briefing' },
                { company: 'HDFC Bank', date: 'Nov 12, 2026', event: 'Asset Quality & NPA Disclosure' }
              ].map((ev, i) => (
                <div key={i} className="p-4 bg-black/60 border border-emerald-900/60 rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-emerald-200">{ev.company}</h4>
                    <p className="text-[10px] text-emerald-600">{ev.event}</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">{ev.date}</span>
                </div>
              ))}
            </div>
          )}

          {/* 12. IPO CENTER TAB */}
          {activeTab === 'ipo' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">Active &amp; Upcoming IPO Listings</h3>
              {[
                { name: 'CyberCore Technologies Ltd', priceBand: '₹450 - ₹480', size: '₹2,400 Cr', status: 'OPEN' },
                { name: 'Apex Renewable Energy', priceBand: '₹820 - ₹860', size: '₹4,100 Cr', status: 'UPCOMING' }
              ].map((ipo, i) => (
                <div key={i} className="p-4 bg-black/60 border border-emerald-900/60 rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-emerald-200">{ipo.name}</h4>
                    <p className="text-[10px] text-emerald-600">Price Band: {ipo.priceBand} | Issue Size: {ipo.size}</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded bg-emerald-500 text-black font-extrabold">{ipo.status}</span>
                </div>
              ))}
            </div>
          )}

          {/* 13. MUTUAL FUNDS TAB */}
          {activeTab === 'mutual_funds' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">Top Rated Mutual Funds &amp; ETFs</h3>
              {[
                { name: 'SUPERAI Bluechip Equity Fund', category: 'Large Cap', nav: '₹142.50', return1yr: '+24.5%' },
                { name: 'SUPERAI Tech Innovation ETF', category: 'Sectoral', nav: '₹88.20', return1yr: '+38.2%' }
              ].map((mf, i) => (
                <div key={i} className="p-4 bg-black/60 border border-emerald-900/60 rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-emerald-200">{mf.name}</h4>
                    <p className="text-[10px] text-emerald-600">Category: {mf.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-300">{mf.nav}</div>
                    <div className="text-[10px] text-emerald-400">{mf.return1yr} (1Y)</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 14. PAPER TRADING TAB */}
          {activeTab === 'paper_trading' && (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-950/20 border border-emerald-900/50 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-emerald-600 uppercase">Virtual Cash Balance</span>
                  <div className="text-2xl font-black text-emerald-300">₹{paperCash.toLocaleString()}</div>
                </div>
                <button
                  onClick={() => {
                    setPaperCash(100000);
                    setPaperPortfolio([]);
                    soundEngine.playSuccess();
                  }}
                  className="px-3 py-1.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-lg text-xs font-bold"
                >
                  Reset Simulator
                </button>
              </div>

              <div className="bg-black/60 border border-emerald-900/60 rounded-2xl p-4 space-y-4">
                <h4 className="font-bold text-emerald-300">Simulate Order Execution</h4>
                <div className="flex gap-3">
                  <select
                    id="paper_sym"
                    className="bg-black border border-emerald-800 rounded-xl px-3 py-2 text-emerald-300"
                  >
                    {MOCK_STOCKS.map(s => <option key={s.symbol} value={s.symbol}>{s.symbol} (₹{s.price})</option>)}
                  </select>
                  <button
                    onClick={() => {
                      const sel = (document.getElementById('paper_sym') as HTMLSelectElement)?.value || 'RELIANCE';
                      const st = MOCK_STOCKS.find(s => s.symbol === sel) || MOCK_STOCKS[0];
                      if (paperCash >= st.price) {
                        setPaperCash(paperCash - st.price);
                        setPaperPortfolio([...paperPortfolio, { symbol: st.symbol, qty: 1, buyPrice: st.price }]);
                        soundEngine.playSuccess();
                      }
                    }}
                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl"
                  >
                    Buy 1 Share (Virtual)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 15. JOURNAL TAB */}
          {activeTab === 'journal' && (
            <div className="space-y-6">
              <div className="p-4 bg-black/60 border border-emerald-900/60 rounded-2xl space-y-3">
                <h4 className="font-bold text-emerald-300">Add Investment Journal Note</h4>
                <input
                  type="text"
                  placeholder="Note Title..."
                  value={newJournalTitle}
                  onChange={(e) => setNewJournalTitle(e.target.value)}
                  className="w-full bg-black border border-emerald-900 rounded-xl px-3 py-2 text-emerald-200"
                />
                <textarea
                  placeholder="Write your thesis or rationale..."
                  value={newJournalNote}
                  onChange={(e) => setNewJournalNote(e.target.value)}
                  className="w-full bg-black border border-emerald-900 rounded-xl px-3 py-2 text-emerald-200 h-24 resize-none"
                />
                <button
                  onClick={() => {
                    if (newJournalTitle && newJournalNote) {
                      setJournalNotes([{ id: Date.now().toString(), title: newJournalTitle, note: newJournalNote, date: new Date().toLocaleDateString() }, ...journalNotes]);
                      setNewJournalTitle('');
                      setNewJournalNote('');
                      soundEngine.playSuccess();
                    }
                  }}
                  className="px-4 py-2 bg-emerald-500 text-black font-bold rounded-xl"
                >
                  Save Note
                </button>
              </div>

              <div className="space-y-3">
                {journalNotes.map(n => (
                  <div key={n.id} className="p-4 bg-black/40 border border-emerald-900/50 rounded-xl space-y-1">
                    <div className="flex justify-between text-[10px] text-emerald-600">
                      <span>{n.date}</span>
                    </div>
                    <h5 className="font-bold text-emerald-200">{n.title}</h5>
                    <p className="text-xs text-emerald-400/80">{n.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 16. CALCULATORS TAB */}
          {activeTab === 'calculators' && (
            <div className="max-w-xl mx-auto p-6 bg-black/60 border border-emerald-900/60 rounded-2xl space-y-6">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-emerald-300 text-center">SIP &amp; Financial Calculator</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-emerald-500 uppercase font-bold">Monthly Investment (₹): {sipMonthly.toLocaleString()}</label>
                  <input
                    type="range" min="1000" max="100000" step="1000"
                    value={sipMonthly}
                    onChange={(e) => setSipMonthly(Number(e.target.value))}
                    className="w-full accent-emerald-500 mt-2"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-emerald-500 uppercase font-bold">Time Period (Years): {sipYears}</label>
                  <input
                    type="range" min="1" max="30" step="1"
                    value={sipYears}
                    onChange={(e) => setSipYears(Number(e.target.value))}
                    className="w-full accent-emerald-500 mt-2"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-emerald-500 uppercase font-bold">Expected Annual Return (%): {sipRate}%</label>
                  <input
                    type="range" min="5" max="30" step="0.5"
                    value={sipRate}
                    onChange={(e) => setSipRate(Number(e.target.value))}
                    className="w-full accent-emerald-500 mt-2"
                  />
                </div>
              </div>

              <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-2 text-center">
                <span className="text-xs text-emerald-500 uppercase font-bold">Estimated Future Value</span>
                <div className="text-3xl font-black text-emerald-300">
                  ₹{Math.round(sipMonthly * (((Math.pow(1 + sipRate / 1200, sipYears * 12) - 1) / (sipRate / 1200)) * (1 + sipRate / 1200))).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* 17. ALERTS TAB */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <div className="p-4 bg-black/60 border border-emerald-900/60 rounded-2xl flex gap-3">
                <select
                  value={alertSymbol}
                  onChange={(e) => setAlertSymbol(e.target.value)}
                  className="bg-black border border-emerald-800 rounded-xl px-3 py-2 text-emerald-300"
                >
                  {MOCK_STOCKS.map(s => <option key={s.symbol} value={s.symbol}>{s.symbol}</option>)}
                </select>
                <input
                  type="number"
                  placeholder="Target Price..."
                  value={alertPrice}
                  onChange={(e) => setAlertPrice(Number(e.target.value))}
                  className="bg-black border border-emerald-800 rounded-xl px-3 py-2 text-emerald-300 w-36"
                />
                <button
                  onClick={() => {
                    setAlerts([...alerts, { symbol: alertSymbol, targetPrice: alertPrice, active: true }]);
                    soundEngine.playSuccess();
                  }}
                  className="px-4 py-2 bg-emerald-500 text-black font-bold rounded-xl"
                >
                  Set Alert
                </button>
              </div>

              <div className="space-y-3">
                {alerts.map((al, i) => (
                  <div key={i} className="p-4 bg-black/40 border border-emerald-900/50 rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-emerald-200">{al.symbol} Target: ₹{al.targetPrice}</h4>
                      <p className="text-[10px] text-emerald-600">Status: {al.active ? 'Active Monitoring' : 'Triggered'}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">ACTIVE</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 18. LEARNING CENTER TAB */}
          {activeTab === 'learning' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">Financial Learning Academy &amp; Glossary</h3>
              {[
                { title: 'Understanding P/E Ratio in Fundamental Analysis', desc: 'Price-to-Earnings ratio measures a company current share price relative to its per-share earnings.' },
                { title: 'Power of Compounding & SIP Strategy', desc: 'Regular disciplined investing over long timeframes mitigates market volatility and maximizes wealth accumulation.' },
                { title: 'Risk Management & Portfolio Diversification', desc: 'Spreading investments across uncorrelated asset classes protects capital during market corrections.' }
              ].map((l, i) => (
                <div key={i} className="p-4 bg-black/60 border border-emerald-900/60 rounded-xl space-y-2">
                  <h4 className="font-bold text-emerald-200">{l.title}</h4>
                  <p className="text-xs text-emerald-400/80 leading-relaxed">{l.desc}</p>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </ModalWrapper>
  );
};
