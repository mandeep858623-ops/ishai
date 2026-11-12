import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { ModalWrapper } from './Modals';
import { soundEngine } from '../utils/audio';
import { exportToDocx, exportToPdf, triggerFileDownload } from '../utils/fileExporters';
import { 
  parseDataFile, 
  computeNumericStats, 
  computeCategoricalStats, 
  computeCorrelationMatrix, 
  aggregateDataForChart, 
  ParsedDataset, 
  ColumnInfo 
} from '../utils/dataAnalystEngine';
import { 
  BarChart3, 
  Upload, 
  FileSpreadsheet, 
  Table, 
  Search, 
  Sparkles, 
  MessageSquare, 
  PieChart, 
  LineChart, 
  Activity, 
  ShieldCheck, 
  Download, 
  RefreshCw, 
  Check, 
  Copy, 
  AlertTriangle, 
  Filter, 
  Layers, 
  HelpCircle, 
  Trash2, 
  FileCheck, 
  ArrowUpDown, 
  TrendingUp, 
  Database, 
  Info,
  CheckCircle2,
  XCircle,
  Image as ImageIcon
} from 'lucide-react';

export type AnalystTab = 'overview' | 'ask_data' | 'charts' | 'statistics' | 'quality' | 'export';

interface AIDataAnalystModalProps {
  onClose: () => void;
  onLog?: (text: string, tag: string) => void;
  initialTab?: AnalystTab;
}

export const AIDataAnalystModal: React.FC<AIDataAnalystModalProps> = ({
  onClose,
  onLog,
  initialTab = 'overview',
}) => {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<AnalystTab>(initialTab);

  // Upload & Dataset state
  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const [parsingFile, setParsingFile] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Auto Insights
  const [autoInsights, setAutoInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Preview Data Table state
  const [tableSearch, setTableSearch] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortAscending, setSortAscending] = useState(true);
  const [tablePage, setTablePage] = useState(1);
  const rowsPerPage = 15;

  // Ask Your Data Chat state
  const [userQuestion, setUserQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [askingQuestion, setAskingQuestion] = useState(false);

  // Chart Builder state
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'doughnut' | 'scatter' | 'area'>('bar');
  const [xAxisCol, setXAxisCol] = useState<string>('');
  const [yAxisCol, setYAxisCol] = useState<string>('');
  const [chartAggregation, setChartAggregation] = useState<'sum' | 'mean' | 'count' | 'min' | 'max'>('sum');
  const [chartTitle, setChartTitle] = useState('Data Distribution Chart');

  // Quality Inspector Preview tab
  const [qualityPreviewTab, setQualityPreviewTab] = useState<'missing' | 'duplicates' | 'outliers'>('missing');
  const [cleanedRows, setCleanedRows] = useState<Record<string, any>[] | null>(null);

  // Copy feedback
  const [copiedText, setCopiedText] = useState(false);

  // Ref for chart canvas export
  const chartSvgRef = useRef<SVGSVGElement | null>(null);

  // Auto set chart axes when dataset is loaded
  useEffect(() => {
    if (dataset) {
      const catCol = dataset.columnsInfo.find((c) => c.type === 'categorical' || c.type === 'text')?.name || dataset.headers[0];
      const numCol = dataset.columnsInfo.find((c) => c.type === 'numeric')?.name || dataset.headers[1] || dataset.headers[0];
      setXAxisCol(catCol || '');
      setYAxisCol(numCol || '');
      setChartTitle(`${numCol || 'Values'} by ${catCol || 'Category'}`);
      setCleanedRows(null);
    }
  }, [dataset]);

  // Handle File Upload
  const handleFileUpload = async (file: File, sheetName?: string) => {
    if (!file) return;
    soundEngine.playClick();
    setParsingFile(true);
    setParseError(null);

    try {
      const parsed = await parseDataFile(file, sheetName);
      soundEngine.playSuccess();
      setDataset(parsed);
      setTablePage(1);

      if (onLog) {
        onLog(`[DATA_ANALYST] Loaded dataset "${parsed.fileName}" (${parsed.totalRows} rows, ${parsed.totalColumns} cols)`, 'INTELLIGENCE');
      }

      // Fetch automated executive insights from backend
      fetchAutoInsights(parsed);
    } catch (err: any) {
      soundEngine.playAlertBeep();
      setParseError(err?.message || 'Failed to parse file.');
    } finally {
      setParsingFile(false);
    }
  };

  // Fetch Auto Insights
  const fetchAutoInsights = async (ds: ParsedDataset) => {
    setLoadingInsights(true);
    try {
      const numericSummaries: Record<string, any> = {};
      ds.columnsInfo.filter((c) => c.type === 'numeric').slice(0, 5).forEach((col) => {
        numericSummaries[col.name] = computeNumericStats(col.name, ds.rows);
      });

      const res = await fetch('/api/ai/data-analyst/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: ds.fileName,
          totalRows: ds.totalRows,
          totalColumns: ds.totalColumns,
          headers: ds.headers,
          columnsInfo: ds.columnsInfo,
          numericStats: numericSummaries,
          qualityReport: ds.qualityReport,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAutoInsights(data.insights);
      }
    } catch (err) {
      console.warn('Auto insights generation error:', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Handle Sheet Change
  const handleSheetChange = async (sheetName: string) => {
    if (!dataset) return;
    const file = (document.getElementById('analyst-file-input') as HTMLInputElement)?.files?.[0];
    if (file) {
      handleFileUpload(file, sheetName);
    }
  };

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Ask Question to AI Data Analyst
  const handleAskQuestion = async (customQ?: string) => {
    const qToAsk = customQ || userQuestion;
    if (!qToAsk.trim() || !dataset || askingQuestion) return;

    soundEngine.playClick();
    setAskingQuestion(true);
    const newHistory = [...chatMessages, { role: 'user' as const, content: qToAsk }];
    setChatMessages(newHistory);
    setUserQuestion('');

    try {
      const numericSummaries: Record<string, any> = {};
      dataset.columnsInfo.filter((c) => c.type === 'numeric').slice(0, 6).forEach((col) => {
        numericSummaries[col.name] = computeNumericStats(col.name, dataset.rows);
      });

      const categoricalSummaries: Record<string, any> = {};
      dataset.columnsInfo.filter((c) => c.type === 'categorical').slice(0, 4).forEach((col) => {
        categoricalSummaries[col.name] = computeCategoricalStats(col.name, dataset.rows);
      });

      const res = await fetch('/api/ai/data-analyst/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: qToAsk,
          datasetSummary: {
            fileName: dataset.fileName,
            totalRows: dataset.totalRows,
            totalColumns: dataset.totalColumns,
            headers: dataset.headers,
            columnsInfo: dataset.columnsInfo,
            numericStats: numericSummaries,
            categoricalStats: categoricalSummaries,
            qualityReport: dataset.qualityReport,
            sampleRows: dataset.rows.slice(0, 3),
          },
          conversationHistory: newHistory,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setChatMessages([...newHistory, { role: 'assistant', content: data.answer }]);
      } else {
        soundEngine.playAlertBeep();
        setChatMessages([...newHistory, { role: 'assistant', content: `Error: ${data.error || 'Failed to process question.'}` }]);
      }
    } catch (err: any) {
      soundEngine.playAlertBeep();
      setChatMessages([...newHistory, { role: 'assistant', content: `Network error processing request: ${err?.message}` }]);
    } finally {
      setAskingQuestion(false);
    }
  };

  // Remove Duplicates (Clean Copy)
  const handleRemoveDuplicates = () => {
    if (!dataset) return;
    soundEngine.playSuccess();
    const uniqueStrings = new Set<string>();
    const cleaned = dataset.rows.filter((r) => {
      const str = JSON.stringify(r);
      if (uniqueStrings.has(str)) return false;
      uniqueStrings.add(str);
      return true;
    });
    setCleanedRows(cleaned);
  };

  // Export Chart as PNG
  const handleExportChartPng = () => {
    if (!chartSvgRef.current) return;
    soundEngine.playClick();

    const svg = chartSvgRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = svg.clientWidth || 800;
      canvas.height = svg.clientHeight || 400;
      if (ctx) {
        ctx.fillStyle = '#05080c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `${chartTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
        a.click();
      }
      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  // Download Processed CSV
  const handleDownloadCsv = (rowsToDownload?: Record<string, any>[], filenameSuffix = 'processed') => {
    if (!dataset) return;
    soundEngine.playClick();
    const rows = rowsToDownload || dataset.rows;
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    triggerFileDownload(blob, `${dataset.fileName.replace(/\.[^/.]+$/, '')}_${filenameSuffix}.csv`);
  };

  // Download Statistical Summary CSV
  const handleDownloadStatsCsv = () => {
    if (!dataset) return;
    soundEngine.playClick();

    const summaryRows: any[] = [];
    dataset.columnsInfo.forEach((col) => {
      if (col.type === 'numeric') {
        const stats = computeNumericStats(col.name, dataset.rows);
        summaryRows.push({
          Column: col.name,
          Type: col.type,
          Count: stats.count,
          NullCount: stats.nullCount,
          Sum: stats.sum,
          Mean: stats.mean,
          Median: stats.median,
          Min: stats.min,
          Max: stats.max,
          Range: stats.range,
          StdDev: stats.stdDev,
        });
      } else {
        const stats = computeCategoricalStats(col.name, dataset.rows);
        summaryRows.push({
          Column: col.name,
          Type: col.type,
          Count: stats.count,
          NullCount: stats.nullCount,
          UniqueCount: stats.uniqueCount,
          TopCategory: stats.topCategories[0]?.category || 'N/A',
          TopFrequency: stats.topCategories[0]?.count || 0,
        });
      }
    });

    const csv = Papa.unparse(summaryRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    triggerFileDownload(blob, `${dataset.fileName.replace(/\.[^/.]+$/, '')}_stats_summary.csv`);
  };

  // Table Data Filtering & Sorting
  const getFilteredAndSortedRows = () => {
    if (!dataset) return [];
    let result = [...(cleanedRows || dataset.rows)];

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(q))
      );
    }

    if (sortColumn) {
      result.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAscending ? valA - valB : valB - valA;
        }
        return sortAscending
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return result;
  };

  const filteredRows = getFilteredAndSortedRows();
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage) || 1;
  const paginatedRows = filteredRows.slice((tablePage - 1) * rowsPerPage, tablePage * rowsPerPage);

  // Compute chart data
  const chartSeriesData = dataset && xAxisCol
    ? aggregateDataForChart({
        rows: cleanedRows || dataset.rows,
        xAxis: xAxisCol,
        yAxis: yAxisCol || xAxisCol,
        aggType: chartAggregation,
      })
    : [];

  const numericCols = dataset ? dataset.columnsInfo.filter((c) => c.type === 'numeric').map((c) => c.name) : [];
  const correlationMatrix = dataset && numericCols.length > 1 ? computeCorrelationMatrix(numericCols, dataset.rows) : null;

  return (
    <ModalWrapper title="📊 AI DATA ANALYST" onClose={onClose} maxWidthClass="max-w-6xl">
      <div className="flex flex-col space-y-4 font-mono text-emerald-400 text-xs min-h-[600px]">

        {/* --- UPLOAD ZONE IF NO DATASET LOADED --- */}
        {!dataset ? (
          <div className="space-y-4">
            <div className="border-b border-emerald-950 pb-2">
              <h3 className="text-sm font-bold text-emerald-300 tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                AI DATA ANALYST — TURN DATA INTO CLEAR INSIGHTS
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Upload CSV or Excel spreadsheets (.xlsx, .xls) to run statistical computations, detect anomalies, build charts, and ask questions.
              </p>
            </div>

            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-emerald-900/80 hover:border-emerald-500 bg-[#05080c] hover:bg-[#090d14] rounded-lg p-10 text-center space-y-3 transition-colors cursor-pointer"
            >
              <Upload className="w-10 h-10 mx-auto text-emerald-400 animate-bounce" />
              <div>
                <p className="font-bold text-emerald-200 text-sm">Drag and drop your dataset here</p>
                <p className="text-zinc-500 text-[11px] mt-1">Supports CSV and Excel workbooks (.xlsx, .xls) up to 50MB</p>
              </div>

              <label className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-5 py-2.5 rounded text-xs transition-colors cursor-pointer shadow-md shadow-emerald-950">
                <span>UPLOAD DATA FILE</span>
                <input
                  id="analyst-file-input"
                  type="file"
                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {parsingFile && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded text-xs flex items-center justify-between animate-pulse">
                <span>Parsing dataset cells and detecting column datatypes...</span>
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              </div>
            )}

            {parseError && (
              <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 rounded text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            <div className="p-3 bg-[#070b10] border border-emerald-950 rounded text-[11px] text-zinc-400 space-y-1">
              <span className="font-bold text-emerald-400">🔒 DATA PRIVACY NOTICE:</span>
              <p>
                All file parsing and statistical computations are executed directly inside your local environment session. Your confidential data is never permanently stored on external servers.
              </p>
            </div>
          </div>
        ) : (
          /* --- ACTIVE DATASET WORKSPACE --- */
          <div className="space-y-4 flex-1 flex flex-col">
            
            {/* Top Dataset Workspace Bar */}
            <div className="bg-[#070a0e] border border-emerald-950 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs text-emerald-200">{dataset.fileName}</span>
                  <span className="text-[10px] text-zinc-500">
                    ({(dataset.fileSize / 1024).toFixed(1)} KB)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] bg-black px-2.5 py-1 rounded border border-emerald-950 font-bold">
                  <span className="text-emerald-400">{dataset.totalRows} Rows</span>
                  <span className="text-zinc-600">|</span>
                  <span className="text-cyan-400">{dataset.totalColumns} Columns</span>
                </div>

                {dataset.sheets.length > 1 && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-zinc-400 font-bold">Sheet:</span>
                    <select
                      value={dataset.currentSheet}
                      onChange={(e) => handleSheetChange(e.target.value)}
                      className="bg-black border border-emerald-900 rounded px-2 py-0.5 text-xs text-emerald-300 outline-none"
                    >
                      {dataset.sheets.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[10px] bg-black hover:bg-emerald-950 border border-emerald-900 text-emerald-300 px-2.5 py-1 rounded cursor-pointer transition-colors">
                  <span>Upload Different File</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Analysis Navigation Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-emerald-950 scrollbar-thin">
              {[
                { id: 'overview', title: '1. Overview', icon: Table },
                { id: 'ask_data', title: '2. Ask Your Data', icon: MessageSquare },
                { id: 'charts', title: '3. Charts', icon: BarChart3 },
                { id: 'statistics', title: '4. Statistics', icon: Activity },
                { id: 'quality', title: '5. Data Quality', icon: ShieldCheck },
                { id: 'export', title: '6. Export Results', icon: Download },
              ].map((tab) => {
                const IconComp = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { soundEngine.playClick(); setActiveTab(tab.id as AnalystTab); }}
                    className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                        : 'bg-black text-emerald-400 border border-emerald-950 hover:border-emerald-700'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                    <span>{tab.title}</span>
                  </button>
                );
              })}
            </div>

            {/* ============================================================= */}
            {/* TAB 1: OVERVIEW */}
            {/* ============================================================= */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div className="bg-[#070d14] border border-emerald-950 p-3 rounded text-center space-y-0.5">
                    <span className="text-[10px] text-zinc-500 font-bold block">TOTAL ROWS</span>
                    <span className="text-base font-bold text-emerald-300">{dataset.totalRows}</span>
                  </div>
                  <div className="bg-[#070d14] border border-emerald-950 p-3 rounded text-center space-y-0.5">
                    <span className="text-[10px] text-zinc-500 font-bold block">COLUMNS</span>
                    <span className="text-base font-bold text-cyan-300">{dataset.totalColumns}</span>
                  </div>
                  <div className="bg-[#070d14] border border-emerald-950 p-3 rounded text-center space-y-0.5">
                    <span className="text-[10px] text-zinc-500 font-bold block">MISSING CELLS</span>
                    <span className={`text-base font-bold ${dataset.qualityReport.missingPercentage > 5 ? 'text-amber-400' : 'text-emerald-300'}`}>
                      {dataset.qualityReport.missingPercentage}%
                    </span>
                  </div>
                  <div className="bg-[#070d14] border border-emerald-950 p-3 rounded text-center space-y-0.5">
                    <span className="text-[10px] text-zinc-500 font-bold block">DUPLICATES</span>
                    <span className="text-base font-bold text-indigo-300">{dataset.qualityReport.duplicateRowsCount}</span>
                  </div>
                  <div className="bg-[#070d14] border border-emerald-950 p-3 rounded text-center space-y-0.5 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-zinc-500 font-bold block">QUALITY SCORE</span>
                    <span className="text-base font-bold text-emerald-400">{dataset.qualityReport.qualityScore}/100</span>
                  </div>
                </div>

                {/* Column Types Breakdown Badges */}
                <div className="flex items-center gap-1.5 flex-wrap text-[10px] border-b border-emerald-950 pb-2">
                  <span className="text-zinc-400 font-bold">COLUMNS ({dataset.headers.length}):</span>
                  {dataset.columnsInfo.map((col) => (
                    <span
                      key={col.name}
                      className="px-2 py-0.5 bg-black border border-emerald-950 rounded flex items-center gap-1 text-zinc-300 font-mono"
                    >
                      <span className="text-emerald-400 font-bold">
                        {col.type === 'numeric' ? '#' : col.type === 'date' ? '📅' : col.type === 'boolean' ? '☑' : 'abc'}
                      </span>
                      <span>{col.name}</span>
                    </span>
                  ))}
                </div>

                {/* AI Executive Insights */}
                <div className="bg-[#05080c] border border-emerald-900 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
                    <span className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> AUTOMATED AI INSIGHTS
                    </span>
                    {loadingInsights && <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />}
                  </div>

                  {autoInsights ? (
                    <div className="text-xs text-emerald-100 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto pr-1">
                      {autoInsights}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-400 italic py-2">
                      Generating dataset observations and anomaly reports...
                    </div>
                  )}
                </div>

                {/* Interactive Data Table Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] gap-2 flex-wrap">
                    <div className="font-bold text-emerald-300">
                      DATASET PREVIEW ({filteredRows.length} Rows Shown)
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3 h-3 absolute left-2 top-2 text-zinc-500" />
                        <input
                          type="text"
                          value={tableSearch}
                          onChange={(e) => {
                            setTableSearch(e.target.value);
                            setTablePage(1);
                          }}
                          placeholder="Search cells..."
                          className="bg-black border border-emerald-900 rounded pl-7 pr-2 py-1 text-xs text-emerald-300 outline-none w-44"
                        />
                      </div>

                      {cleanedRows && (
                        <span className="text-[10px] text-cyan-400 bg-cyan-950 px-2 py-1 rounded border border-cyan-800 font-bold">
                          ✓ Duplicates Cleaned
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border border-emerald-950 rounded-lg overflow-x-auto max-h-72">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#090e15] border-b border-emerald-900 sticky top-0">
                        <tr>
                          {dataset.headers.map((h) => (
                            <th
                              key={h}
                              onClick={() => {
                                if (sortColumn === h) {
                                  setSortAscending(!sortAscending);
                                } else {
                                  setSortColumn(h);
                                  setSortAscending(true);
                                }
                              }}
                              className="p-2 border-r border-emerald-950/60 font-bold text-emerald-300 cursor-pointer hover:bg-emerald-950/40 select-none whitespace-nowrap"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span>{h}</span>
                                <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className="border-b border-emerald-950/50 hover:bg-emerald-950/30 transition-colors"
                          >
                            {dataset.headers.map((h, cIdx) => (
                              <td key={cIdx} className="p-2 border-r border-emerald-950/40 text-zinc-300 whitespace-nowrap">
                                {row[h] !== null && row[h] !== undefined ? String(row[h]) : <span className="text-zinc-600 italic">null</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Bar */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                    <span>
                      Page {tablePage} of {totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setTablePage(Math.max(1, tablePage - 1))}
                        disabled={tablePage === 1}
                        className="px-2 py-0.5 bg-black border border-emerald-900 disabled:opacity-30 rounded hover:border-emerald-600"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setTablePage(Math.min(totalPages, tablePage + 1))}
                        disabled={tablePage === totalPages}
                        className="px-2 py-0.5 bg-black border border-emerald-900 disabled:opacity-30 rounded hover:border-emerald-600"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 2: ASK YOUR DATA */}
            {/* ============================================================= */}
            {activeTab === 'ask_data' && (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="border-b border-emerald-950 pb-2">
                  <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    ASK YOUR DATA — NATURAL LANGUAGE INTELLIGENCE
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Ask questions about sales, revenue, metrics, relationships, missing values, or highest-performing categories.
                  </p>
                </div>

                {/* Sample Prompt Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-zinc-500 font-bold">Suggested Questions:</span>
                  {[
                    'What are the main findings in this dataset?',
                    'Calculate summary metrics for numerical columns.',
                    'Which category appears most frequently?',
                    'Find the top 5 highest values.',
                    'Are there missing values or potential outliers?',
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAskQuestion(chip)}
                      className="text-[10px] bg-black border border-emerald-950 hover:border-emerald-600 text-zinc-300 px-2 py-1 rounded truncate max-w-[240px]"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Chat History Messages */}
                <div className="bg-[#05080c] border border-emerald-900 rounded-lg p-4 space-y-3 flex-1 max-h-[380px] overflow-y-auto">
                  {chatMessages.length === 0 ? (
                    <div className="py-12 text-center text-zinc-600 space-y-1">
                      <MessageSquare className="w-8 h-8 mx-auto text-zinc-700" />
                      <p className="font-bold text-zinc-500">NO QUESTIONS ASKED YET</p>
                      <p className="text-[11px]">Type a question or pick a suggested chip above to analyze &ldquo;{dataset.fileName}&rdquo;.</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg text-xs leading-relaxed space-y-1 ${
                          msg.role === 'user'
                            ? 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 self-end'
                            : 'bg-black border border-emerald-900 text-emerald-100 font-mono'
                        }`}
                      >
                        <div className="text-[10px] font-bold text-zinc-500 uppercase">
                          {msg.role === 'user' ? 'YOU' : 'AI DATA ANALYST'}
                        </div>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input Row */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                    placeholder="Ask any question about your uploaded dataset..."
                    className="flex-1 bg-black border border-emerald-900 rounded px-3 py-2 text-xs text-emerald-200 outline-none focus:border-emerald-400"
                  />
                  <button
                    onClick={() => handleAskQuestion()}
                    disabled={askingQuestion || !userQuestion.trim()}
                    className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-extrabold px-5 py-2 rounded text-xs transition-all shadow-md shadow-emerald-950 cursor-pointer"
                  >
                    {askingQuestion ? 'ANALYZING...' : 'ASK DATA'}
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 3: CHARTS (INTERACTIVE CHART BUILDER) */}
            {/* ============================================================= */}
            {activeTab === 'charts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-xs text-emerald-300 uppercase tracking-wider">
                      INTERACTIVE CHART BUILDER
                    </h3>
                  </div>
                  <button
                    onClick={handleExportChartPng}
                    className="bg-emerald-950 border border-emerald-500 hover:bg-emerald-500 hover:text-black text-emerald-300 font-bold px-3 py-1 rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>DOWNLOAD CHART PNG</span>
                  </button>
                </div>

                {/* Chart Builder Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 block font-bold">CHART TYPE:</label>
                    <select
                      value={chartType}
                      onChange={(e) => setChartType(e.target.value as any)}
                      className="w-full bg-black border border-emerald-900 rounded px-2.5 py-1.5 text-xs text-emerald-300 outline-none"
                    >
                      <option value="bar">Bar Chart</option>
                      <option value="line">Line Chart</option>
                      <option value="pie">Pie Chart</option>
                      <option value="doughnut">Doughnut Chart</option>
                      <option value="area">Area Chart</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 block font-bold">X-AXIS (CATEGORY/LABEL):</label>
                    <select
                      value={xAxisCol}
                      onChange={(e) => setXAxisCol(e.target.value)}
                      className="w-full bg-black border border-emerald-900 rounded px-2.5 py-1.5 text-xs text-emerald-300 outline-none"
                    >
                      {dataset.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 block font-bold">Y-AXIS (VALUE COLUMN):</label>
                    <select
                      value={yAxisCol}
                      onChange={(e) => setYAxisCol(e.target.value)}
                      className="w-full bg-black border border-emerald-900 rounded px-2.5 py-1.5 text-xs text-emerald-300 outline-none"
                    >
                      {dataset.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 block font-bold">AGGREGATION:</label>
                    <select
                      value={chartAggregation}
                      onChange={(e) => setChartAggregation(e.target.value as any)}
                      className="w-full bg-black border border-emerald-900 rounded px-2.5 py-1.5 text-xs text-emerald-300 outline-none"
                    >
                      <option value="sum">Sum</option>
                      <option value="mean">Average</option>
                      <option value="count">Count</option>
                      <option value="min">Minimum</option>
                      <option value="max">Maximum</option>
                    </select>
                  </div>
                </div>

                {/* SVG Chart Rendering Canvas */}
                <div className="bg-[#05080c] border border-emerald-900 rounded-lg p-4 space-y-2">
                  <div className="text-center font-bold text-emerald-300 text-xs uppercase tracking-wider">
                    {chartTitle} ({chartAggregation.toUpperCase()} of {yAxisCol} BY {xAxisCol})
                  </div>

                  {chartSeriesData.length === 0 ? (
                    <div className="py-12 text-center text-zinc-600">Select valid X and Y columns to render chart.</div>
                  ) : (
                    <div className="w-full overflow-x-auto flex justify-center py-2">
                      <svg
                        ref={chartSvgRef}
                        width="760"
                        height="320"
                        viewBox="0 0 760 320"
                        className="bg-black border border-emerald-950 rounded"
                      >
                        {/* Grid lines */}
                        {[60, 120, 180, 240].map((y) => (
                          <line key={y} x1="60" y1={y} x2="720" y2={y} stroke="#13231a" strokeDasharray="4 4" />
                        ))}

                        {/* Y-Axis Line */}
                        <line x1="60" y1="40" x2="60" y2="260" stroke="#10b981" strokeWidth="1.5" />
                        {/* X-Axis Line */}
                        <line x1="60" y1="260" x2="720" y2="260" stroke="#10b981" strokeWidth="1.5" />

                        {/* Render Bars / Lines / Area */}
                        {(() => {
                          const maxVal = Math.max(...chartSeriesData.map((d) => d.value), 1);
                          const barWidth = Math.max(12, Math.min(40, (620 / chartSeriesData.length) - 8));

                          if (chartType === 'bar') {
                            return chartSeriesData.map((d, i) => {
                              const x = 75 + i * (620 / chartSeriesData.length);
                              const barH = (d.value / maxVal) * 200;
                              const y = 260 - barH;

                              return (
                                <g key={i} className="group cursor-pointer">
                                  <rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={barH}
                                    fill="#10b981"
                                    rx="2"
                                    className="hover:fill shadow-[0_0_8px_#10b981]"
                                  />
                                  {/* Value label */}
                                  <text x={x + barWidth / 2} y={y - 5} fill="#a7f3d0" fontSize="9" textAnchor="middle">
                                    {d.value}
                                  </text>
                                  {/* X Label */}
                                  <text x={x + barWidth / 2} y="278" fill="#94a3b8" fontSize="9" textAnchor="middle">
                                    {d.label.length > 8 ? `${d.label.slice(0, 7)}…` : d.label}
                                  </text>
                                </g>
                              );
                            });
                          } else if (chartType === 'line' || chartType === 'area') {
                            const points = chartSeriesData.map((d, i) => {
                              const x = 75 + i * (620 / Math.max(1, chartSeriesData.length - 1));
                              const y = 260 - (d.value / maxVal) * 200;
                              return { x, y, val: d.value, label: d.label };
                            });

                            const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');
                            const areaStr = `60,260 ${polylineStr} ${points[points.length - 1]?.x || 720},260`;

                            return (
                              <g>
                                {chartType === 'area' && (
                                  <polygon points={areaStr} fill="rgba(16, 185, 129, 0.2)" />
                                )}
                                <polyline points={polylineStr} fill="none" stroke="#10b981" strokeWidth="2.5" />
                                {points.map((p, i) => (
                                  <g key={i}>
                                    <circle cx={p.x} cy={p.y} r="4" fill="#34d399" />
                                    <text x={p.x} y={p.y - 8} fill="#a7f3d0" fontSize="9" textAnchor="middle">
                                      {p.val}
                                    </text>
                                    <text x={p.x} y="278" fill="#94a3b8" fontSize="9" textAnchor="middle">
                                      {p.label.length > 8 ? `${p.label.slice(0, 7)}…` : p.label}
                                    </text>
                                  </g>
                                ))}
                              </g>
                            );
                          } else {
                            // Pie / Doughnut SVG
                            const totalVal = chartSeriesData.reduce((a, b) => a + b.value, 0) || 1;
                            let cumulativeAngle = 0;
                            const colors = ['#10b981', '#06b6d4', '#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#3b82f6'];

                            return (
                              <g transform="translate(380, 150)">
                                {chartSeriesData.map((d, i) => {
                                  const angle = (d.value / totalVal) * Math.PI * 2;
                                  const startA = cumulativeAngle;
                                  const endA = cumulativeAngle + angle;
                                  cumulativeAngle = endA;

                                  const r = 100;
                                  const x1 = Math.cos(startA) * r;
                                  const y1 = Math.sin(startA) * r;
                                  const x2 = Math.cos(endA) * r;
                                  const y2 = Math.sin(endA) * r;
                                  const largeArc = angle > Math.PI ? 1 : 0;

                                  const pathData = `M 0 0 L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

                                  return (
                                    <path
                                      key={i}
                                      d={pathData}
                                      fill={colors[i % colors.length]}
                                      stroke="#05080c"
                                      strokeWidth="2"
                                    />
                                  );
                                })}
                                {chartType === 'doughnut' && (
                                  <circle cx="0" cy="0" r="50" fill="#05080c" />
                                )}
                              </g>
                            );
                          }
                        })()}
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 4: STATISTICS */}
            {/* ============================================================= */}
            {activeTab === 'statistics' && (
              <div className="space-y-4">
                <div className="border-b border-emerald-950 pb-2">
                  <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    DESCRIPTIVE STATISTICS &amp; PEARSON CORRELATION
                  </h3>
                </div>

                {/* Numeric Statistics Table */}
                <div className="space-y-2">
                  <span className="font-bold text-emerald-300 text-xs">NUMERICAL COLUMN STATISTICS</span>
                  <div className="border border-emerald-950 rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#090e15] border-b border-emerald-900">
                        <tr>
                          <th className="p-2 border-r border-emerald-950 font-bold text-emerald-300">Column</th>
                          <th className="p-2 border-r border-emerald-950 font-bold text-emerald-300">Count</th>
                          <th className="p-2 border-r border-emerald-950 font-bold text-emerald-300">Mean</th>
                          <th className="p-2 border-r border-emerald-950 font-bold text-emerald-300">Median</th>
                          <th className="p-2 border-r border-emerald-950 font-bold text-emerald-300">Std Dev</th>
                          <th className="p-2 border-r border-emerald-950 font-bold text-emerald-300">Min</th>
                          <th className="p-2 border-r border-emerald-950 font-bold text-emerald-300">Max</th>
                          <th className="p-2 border-r border-emerald-950 font-bold text-emerald-300">IQR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataset.columnsInfo
                          .filter((c) => c.type === 'numeric')
                          .map((col) => {
                            const stats = computeNumericStats(col.name, dataset.rows);
                            return (
                              <tr key={col.name} className="border-b border-emerald-950/50 hover:bg-emerald-950/30">
                                <td className="p-2 border-r border-emerald-950 font-bold text-emerald-200">{col.name}</td>
                                <td className="p-2 border-r border-emerald-950 text-zinc-300">{stats.count}</td>
                                <td className="p-2 border-r border-emerald-950 text-emerald-300 font-bold">{stats.mean}</td>
                                <td className="p-2 border-r border-emerald-950 text-zinc-300">{stats.median}</td>
                                <td className="p-2 border-r border-emerald-950 text-zinc-300">{stats.stdDev}</td>
                                <td className="p-2 border-r border-emerald-950 text-zinc-300">{stats.min}</td>
                                <td className="p-2 border-r border-emerald-950 text-zinc-300">{stats.max}</td>
                                <td className="p-2 border-r border-emerald-950 text-zinc-300">{stats.iqr}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Correlation Matrix Heatmap */}
                {correlationMatrix && (
                  <div className="space-y-2 pt-2">
                    <span className="font-bold text-emerald-300 text-xs">PEARSON CORRELATION MATRIX (NUMERIC PAIRS)</span>
                    <div className="border border-emerald-950 rounded-lg overflow-x-auto p-2 bg-[#05080c]">
                      <table className="w-full text-center text-xs border-collapse">
                        <thead>
                          <tr>
                            <th className="p-2 text-left text-zinc-400 font-bold">Variables</th>
                            {numericCols.map((c) => (
                              <th key={c} className="p-2 font-bold text-emerald-300 whitespace-nowrap">
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {numericCols.map((rCol) => (
                            <tr key={rCol} className="border-t border-emerald-950">
                              <td className="p-2 text-left font-bold text-emerald-200">{rCol}</td>
                              {numericCols.map((cCol) => {
                                const val = correlationMatrix[rCol]?.[cCol] ?? 0;
                                const abs = Math.abs(val);
                                const isPos = val > 0.5;
                                const isNeg = val < -0.5;

                                return (
                                  <td key={cCol} className="p-2">
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-bold ${
                                        rCol === cCol
                                          ? 'bg-zinc-900 text-zinc-400'
                                          : isPos
                                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                          : isNeg
                                          ? 'bg-red-950 text-red-300 border border-red-700'
                                          : 'bg-black text-zinc-400'
                                      }`}
                                    >
                                      {val}
                                    </span>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 5: DATA QUALITY INSPECTOR */}
            {/* ============================================================= */}
            {activeTab === 'quality' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-xs text-emerald-300 uppercase tracking-wider">
                      DATA QUALITY INSPECTOR &amp; ANOMALY CLEANER
                    </h3>
                  </div>
                  <button
                    onClick={handleRemoveDuplicates}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-3 py-1 rounded text-xs transition-colors cursor-pointer"
                  >
                    REMOVE DUPLICATES (WORKING COPY)
                  </button>
                </div>

                {/* Quality Findings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-[#05080c] border border-emerald-950 p-3 rounded space-y-1">
                    <span className="text-[10px] text-zinc-500 font-bold block">MISSING CELLS</span>
                    <span className="text-lg font-bold text-amber-400">
                      {dataset.qualityReport.missingCells} ({dataset.qualityReport.missingPercentage}%)
                    </span>
                  </div>

                  <div className="bg-[#05080c] border border-emerald-950 p-3 rounded space-y-1">
                    <span className="text-[10px] text-zinc-500 font-bold block">DUPLICATE ROWS</span>
                    <span className="text-lg font-bold text-indigo-400">
                      {dataset.qualityReport.duplicateRowsCount} Rows
                    </span>
                  </div>

                  <div className="bg-[#05080c] border border-emerald-950 p-3 rounded space-y-1">
                    <span className="text-[10px] text-zinc-500 font-bold block">IQR OUTLIERS DETECTED</span>
                    <span className="text-lg font-bold text-cyan-400">
                      {dataset.qualityReport.outlierCount} Potential Outliers
                    </span>
                  </div>
                </div>

                {/* Action Preview Tabs */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-[11px] border-b border-emerald-950 pb-1">
                    <button
                      onClick={() => setQualityPreviewTab('missing')}
                      className={`px-2.5 py-1 rounded font-bold ${
                        qualityPreviewTab === 'missing' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'text-zinc-500'
                      }`}
                    >
                      Missing Rows Preview
                    </button>
                    <button
                      onClick={() => setQualityPreviewTab('duplicates')}
                      className={`px-2.5 py-1 rounded font-bold ${
                        qualityPreviewTab === 'duplicates' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'text-zinc-500'
                      }`}
                    >
                      Duplicate Rows ({dataset.qualityReport.duplicateRowsCount})
                    </button>
                  </div>

                  <div className="bg-[#05080c] border border-emerald-950 rounded p-3 text-xs">
                    {qualityPreviewTab === 'missing' ? (
                      <p className="text-zinc-300 leading-relaxed">
                        Total {dataset.qualityReport.missingCells} missing cell values found across dataset. Missing value handling operates on a clean working copy to preserve original uploaded file contents.
                      </p>
                    ) : (
                      <p className="text-zinc-300 leading-relaxed">
                        Found {dataset.qualityReport.duplicateRowsCount} duplicate row records. Clicking &ldquo;REMOVE DUPLICATES&rdquo; above removes repeated rows and creates a sanitized dataset working copy.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 6: EXPORT RESULTS */}
            {/* ============================================================= */}
            {activeTab === 'export' && (
              <div className="space-y-4">
                <div className="border-b border-emerald-950 pb-2">
                  <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-400" />
                    EXPORT ANALYSIS &amp; CLEANED DATASETS
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Download complete computed analytical summaries, cleaned dataset copies, and quality audit reports.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleDownloadCsv(dataset.rows, 'full_dataset')}
                    className="p-4 bg-[#070d14] border border-emerald-900 hover:border-emerald-500 rounded-lg text-left transition-all space-y-1.5 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 font-bold text-emerald-300">
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>DOWNLOAD PROCESSED CSV</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Export full parsed dataset ({dataset.totalRows} rows) in clean CSV format.
                    </p>
                  </button>

                  <button
                    onClick={handleDownloadStatsCsv}
                    className="p-4 bg-[#070d14] border border-emerald-900 hover:border-emerald-500 rounded-lg text-left transition-all space-y-1.5 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 font-bold text-cyan-300">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <span>STATISTICAL SUMMARY CSV</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Export calculated descriptive statistics (mean, std dev, range, quartiles) for all columns.
                    </p>
                  </button>

                  {cleanedRows && (
                    <button
                      onClick={() => handleDownloadCsv(cleanedRows, 'cleaned_no_duplicates')}
                      className="p-4 bg-[#070d14] border border-indigo-900 hover:border-indigo-500 rounded-lg text-left transition-all space-y-1.5 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 font-bold text-indigo-300">
                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
                        <span>CLEANED DATASET CSV</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Export sanitized dataset copy with duplicate rows removed ({cleanedRows.length} rows).
                      </p>
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </ModalWrapper>
  );
};
