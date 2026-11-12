import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Building2,
  Home,
  Store,
  Factory,
  GraduationCap,
  Sparkles,
  Trees,
  Bus,
  Zap,
  Droplets,
  Layers,
  Activity,
  ShieldAlert,
  Save,
  RotateCcw,
  RotateCw,
  Sun,
  Moon,
  Camera,
  Play,
  Pause,
  FastForward,
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  Download,
  Upload,
  Bot,
  HelpCircle,
  Eye,
  Sliders,
  DollarSign,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { CityCanvas3D } from './Cityverse/CityCanvas3D';
import {
  CityProject,
  TileData,
  BuildingInstance,
  CitySimulationState,
  VehicleAgent,
  OverlayMode,
  ActiveTool,
  BuildingCategory,
  BuildingDefinition,
  AiProposalBatch,
} from './Cityverse/types';
import {
  BUILDING_CATALOG,
  CITY_TEMPLATES,
  generateTemplateCity,
} from './Cityverse/cityData';
import {
  recalculateSimulationState,
  updateVehicles,
} from './Cityverse/simulationEngine';
import { processCityverseAiPrompt } from './Cityverse/CityverseAI';
import { soundEngine } from '../utils/audio';
import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

interface CityverseModalProps {
  isOpen: boolean;
  onClose: () => void;
  writeLog: (text: string, tag?: string) => void;
  userId?: string;
  theme?: 'dark' | 'light';
}

const INITIAL_SIMULATION_STATE: CitySimulationState = {
  timeOfDay: 'day',
  timeHour: 12,
  speed: 1,
  population: 0,
  employedCount: 0,
  totalJobs: 0,
  residentialCapacity: 0,
  commercialCapacity: 0,
  treasury: 250000,
  monthlyRevenue: 1200,
  monthlyExpenses: 450,
  powerDemandTotal: 0,
  powerCapacityTotal: 0,
  waterDemandTotal: 0,
  waterCapacityTotal: 0,
  trafficIndex: 12,
  cityScore: 78,
  warnings: [],
};

export const CityverseModal: React.FC<CityverseModalProps> = ({
  isOpen,
  onClose,
  writeLog,
  userId = 'guest',
  theme: appTheme = 'dark',
}) => {
  // Current Project State
  const [project, setProject] = useState<CityProject>(() =>
    generateTemplateCity('modern_metropolis', userId, 'Metropolis Central')
  );

  // Undo / Redo History Stack
  const [historyStack, setHistoryStack] = useState<TileData[][]>([]);
  const [redoStack, setRedoStack] = useState<TileData[][]>([]);

  // Active Tool & Selection State
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');
  const [selectedCategory, setSelectedCategory] = useState<BuildingCategory>('residential');
  const [selectedBuildingDefId, setSelectedBuildingDefId] = useState<string>('res_small_house');
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [selectedTileCoords, setSelectedTileCoords] = useState<{ x: number; z: number } | null>(null);

  // Overlays & Cameras
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('normal');
  const [cameraView, setCameraView] = useState<'orbit' | 'isometric' | 'top_down' | 'street'>('orbit');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live Simulation State
  const [simState, setSimState] = useState<CitySimulationState>(INITIAL_SIMULATION_STATE);
  const [vehicles, setVehicles] = useState<VehicleAgent[]>([]);

  // AI Assistant Drawer & Proposal State
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiProposal, setAiProposal] = useState<AiProposalBatch | null>(null);

  // Firestore Saved Projects List Drawer
  const [showProjectsDrawer, setShowProjectsDrawer] = useState(false);
  const [savedProjectsList, setSavedProjectsList] = useState<Array<{ id: string; name: string; updatedAt: string }>>([]);

  // Push History State before making modifications
  const pushHistory = useCallback(() => {
    setHistoryStack((prev) => [...prev.slice(-15), JSON.parse(JSON.stringify(project.tiles))]);
    setRedoStack([]);
  }, [project.tiles]);

  const handleUndo = useCallback(() => {
    if (historyStack.length === 0) return;
    const previousTiles = historyStack[historyStack.length - 1];
    setRedoStack((prev) => [...prev, JSON.parse(JSON.stringify(project.tiles))]);
    setHistoryStack((prev) => prev.slice(0, -1));
    setProject((prev) => ({ ...prev, tiles: previousTiles }));
    writeLog('Undid last city modification.', 'CITYVERSE');
  }, [historyStack, project.tiles, writeLog]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const nextTiles = redoStack[redoStack.length - 1];
    setHistoryStack((prev) => [...prev, JSON.parse(JSON.stringify(project.tiles))]);
    setRedoStack((prev) => prev.slice(0, -1));
    setProject((prev) => ({ ...prev, tiles: nextTiles }));
    writeLog('Redid city modification.', 'CITYVERSE');
  }, [redoStack, project.tiles, writeLog]);

  // Handle Tile Selection & Construction
  const handleSelectTile = useCallback(
    (x: number, z: number, instanceId?: string | null) => {
      setSelectedTileCoords({ x, z });
      setSelectedInstanceId(instanceId || null);

      if (activeTool === 'select') return;

      soundEngine.playClick();
      pushHistory();

      // Tool Action: Demolish
      if (activeTool === 'demolish') {
        setProject((prev) => {
          const nextTiles = prev.tiles.map((t) => {
            if (t.x === x && t.z === z) {
              return { ...t, isRoad: false, buildingId: undefined, buildingInstanceId: undefined };
            }
            return t;
          });
          const nextBuildings = prev.buildings.filter(
            (b) => !(b.x === x && b.z === z) && b.instanceId !== instanceId
          );
          return { ...prev, tiles: nextTiles, buildings: nextBuildings };
        });
        writeLog(`Demolished structure at Grid (${x}, ${z})`, 'CITYVERSE');
        return;
      }

      // Tool Action: Place Road
      if (activeTool === 'road') {
        setProject((prev) => {
          const nextTiles = prev.tiles.map((t) => {
            if (t.x === x && t.z === z) {
              return { ...t, isRoad: true, roadType: 'straight' as const };
            }
            return t;
          });
          return { ...prev, tiles: nextTiles };
        });
        writeLog(`Constructed road tile at (${x}, ${z})`, 'CITYVERSE');
        return;
      }

      // Tool Action: Place Building
      if (activeTool === 'building' && selectedBuildingDefId) {
        const def = BUILDING_CATALOG.find((b) => b.id === selectedBuildingDefId);
        if (!def) return;

        if (project.treasury < def.cost) {
          writeLog(`Insufficient treasury funds ($${def.cost} required).`, 'CITYVERSE');
          return;
        }

        const newInstId = `inst-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        setProject((prev) => {
          const nextTiles = prev.tiles.map((t) => {
            if (t.x >= x && t.x < x + def.width && t.z >= z && t.z < z + def.height) {
              return { ...t, buildingId: def.id, buildingInstanceId: newInstId };
            }
            return t;
          });

          const newBuilding: BuildingInstance = {
            instanceId: newInstId,
            defId: def.id,
            x,
            z,
            rotation: 0,
            occupancy: Math.floor(def.maxCapacity * 0.75),
            powered: true,
            watered: true,
            constructedAt: Date.now(),
          };

          return {
            ...prev,
            tiles: nextTiles,
            buildings: [...prev.buildings, newBuilding],
            treasury: prev.treasury - def.cost,
          };
        });
        writeLog(`Constructed ${def.name} at (${x}, ${z}). -$${def.cost}`, 'CITYVERSE');
      }

      // Tool Action: Terrain Editing
      if (activeTool.startsWith('terrain_')) {
        setProject((prev) => {
          const nextTiles = prev.tiles.map((t) => {
            if (t.x === x && t.z === z) {
              if (activeTool === 'terrain_raise') return { ...t, elevation: Math.min(5, t.elevation + 1) };
              if (activeTool === 'terrain_lower') return { ...t, elevation: Math.max(0, t.elevation - 1) };
              if (activeTool === 'terrain_flatten') return { ...t, elevation: 0 };
              if (activeTool === 'terrain_water') return { ...t, terrain: 'water' as const, elevation: 0 };
            }
            return t;
          });
          return { ...prev, tiles: nextTiles };
        });
      }
    },
    [activeTool, selectedBuildingDefId, project.treasury, pushHistory, writeLog]
  );

  // Live Simulation Engine Step Loop (Run every second)
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setSimState((prev) => {
        const { nextState, updatedTiles } = recalculateSimulationState(
          project.gridSize,
          project.tiles,
          project.buildings,
          prev
        );

        // Update Vehicles
        const nextVehicles = updateVehicles(
          project.gridSize,
          updatedTiles,
          vehicles,
          0.8,
          nextState.speed
        );
        setVehicles(nextVehicles);

        return nextState;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, project, vehicles]);

  // Load Template City
  const handleLoadTemplate = (templateId: string) => {
    soundEngine.playClick();
    const newProj = generateTemplateCity(templateId, userId, 'Cityverse Project');
    setProject(newProj);
    setHistoryStack([]);
    setRedoStack([]);
    writeLog(`Loaded starting template: "${templateId}"`, 'CITYVERSE');
  };

  // Process CITYVERSE AI Prompt
  const handleRunAiPrompt = async () => {
    if (!aiPrompt.trim() || isAiProcessing) return;
    setIsAiProcessing(true);
    soundEngine.playClick();

    try {
      const proposal = await processCityverseAiPrompt(
        aiPrompt,
        project.gridSize,
        project.tiles,
        project.buildings
      );
      setAiProposal(proposal);
      writeLog(`CITYVERSE AI generated city proposal for: "${aiPrompt}"`, 'CITYVERSE');
    } catch (err: any) {
      writeLog(`AI prompt processing error: ${err.message}`, 'CITYVERSE');
    } finally {
      setIsAiProcessing(false);
      setAiPrompt('');
    }
  };

  // Accept AI Proposal
  const handleAcceptProposal = () => {
    if (!aiProposal) return;
    soundEngine.playClick();
    pushHistory();

    aiProposal.actions.forEach((act) => {
      if (act.type === 'PLACE_BUILDING' && act.buildingDefId) {
        handleSelectTile(act.targetX, act.targetZ);
      }
    });

    setAiProposal(null);
    writeLog('Applied CITYVERSE AI proposal to city layout.', 'CITYVERSE');
  };

  // Firestore Save & Load
  const handleSaveProject = async () => {
    soundEngine.playClick();
    try {
      localStorage.setItem(`Cityverse_Project_${userId}`, JSON.stringify(project));
      if (userId && userId !== 'guest') {
        await setDoc(doc(db, 'cityverse_projects', project.id), project, { merge: true });
      }
      writeLog(`City project "${project.name}" saved successfully.`, 'CITYVERSE');
    } catch (err: any) {
      writeLog(`Save failed: ${err.message}`, 'CITYVERSE');
    }
  };

  if (!isOpen) return null;

  const activeBuildingDef = selectedInstanceId
    ? BUILDING_CATALOG.find((b) => b.id === project.buildings.find((inst) => inst.instanceId === selectedInstanceId)?.defId)
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col overflow-hidden text-white font-sans select-none animate-in fade-in duration-200">
      {/* ===================================================================== */}
      {/* 1. TOP TOOLBAR & CONTROLS */}
      {/* ===================================================================== */}
      <header className="px-4 py-2 bg-[#060c18] border-b border-cyan-500/20 flex items-center justify-between shrink-0 shadow-lg z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-black shadow-lg shadow-cyan-500/20">
            <Building2 className="w-5 h-5 text-black" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={project.name}
                onChange={(e) => setProject({ ...project, name: e.target.value })}
                className="bg-transparent text-sm font-bold text-white outline-none border-b border-transparent hover:border-cyan-500/40 focus:border-cyan-400 px-1 py-0.5"
              />
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
                CITYVERSE 3D
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">Interactive WebGL City Building & Transport Simulator</p>
          </div>
        </div>

        {/* Central Controls */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/10 text-xs">
          {/* Simulation Speed Buttons */}
          <div className="flex items-center gap-1 px-2 border-r border-white/10">
            <button
              onClick={() => setSimState({ ...simState, speed: 0 })}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                simState.speed === 0 ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
              title="Pause Simulation"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSimState({ ...simState, speed: 1 })}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                simState.speed === 1 ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
              title="Normal Speed (1x)"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSimState({ ...simState, speed: 2 })}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                simState.speed === 2 ? 'bg-cyan-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
              title="Fast Speed (2x)"
            >
              <FastForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Time of Day Toggle */}
          <div className="flex items-center gap-1 px-2 border-r border-white/10">
            {(['day', 'sunset', 'night'] as const).map((tod) => (
              <button
                key={tod}
                onClick={() => setSimState({ ...simState, timeOfDay: tod })}
                className={`p-1.5 rounded-lg capitalize text-[10px] font-semibold transition-all cursor-pointer ${
                  simState.timeOfDay === tod ? 'bg-indigo-500 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tod === 'day' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>

          {/* Overlays Toggle */}
          <div className="flex items-center gap-1 px-2 border-r border-white/10">
            {(['normal', 'power', 'water', 'services'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setOverlayMode(mode)}
                className={`px-2 py-1 rounded-lg capitalize text-[10px] font-bold transition-all cursor-pointer ${
                  overlayMode === mode ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Camera View Presets */}
          <div className="flex items-center gap-1 px-2">
            {(['orbit', 'isometric', 'top_down'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setCameraView(view)}
                className={`px-2 py-1 rounded-lg capitalize text-[10px] font-bold transition-all cursor-pointer ${
                  cameraView === view ? 'bg-violet-500 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {view.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={historyStack.length === 0}
            className="p-2 rounded-xl bg-black/40 border border-white/10 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Undo Last Action"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-2 rounded-xl bg-black/40 border border-white/10 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Redo Action"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* CITYVERSE AI Drawer Toggle */}
          <button
            onClick={() => setShowAiDrawer(!showAiDrawer)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showAiDrawer
                ? 'bg-purple-500 border-purple-400 text-white shadow-lg shadow-purple-500/20'
                : 'bg-purple-500/20 border-purple-500/40 text-purple-300 hover:bg-purple-500/30'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>CITYVERSE AI</span>
          </button>

          {/* Save Project */}
          <button
            onClick={handleSaveProject}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-black/40 hover:bg-rose-500/20 border border-white/10 text-zinc-400 hover:text-rose-300 transition-all cursor-pointer"
            title="Exit CITYVERSE"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. MAIN WORKSPACE VIEWPORT & PANELS */}
      {/* ===================================================================== */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex">
        {/* LEFT CONSTRUCTION TOOLBAR */}
        <aside className="w-72 border-r border-cyan-500/20 bg-[#060c18]/95 backdrop-blur-xl flex flex-col shrink-0 z-10 overflow-hidden">
          {/* Category Tabs */}
          <div className="p-2 border-b border-white/10 grid grid-cols-4 gap-1 text-[10px]">
            {(['residential', 'commercial', 'industrial', 'public_infrastructure'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setActiveTool('building');
                }}
                className={`p-2 rounded-xl border font-bold capitalize truncate transition-all cursor-pointer text-center ${
                  selectedCategory === cat && activeTool === 'building'
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-black/30 border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                {cat.replace('_infrastructure', '')}
              </button>
            ))}
          </div>

          {/* Active Tool Selector Bar */}
          <div className="p-2 border-b border-white/10 grid grid-cols-4 gap-1">
            <button
              onClick={() => setActiveTool('select')}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                activeTool === 'select' ? 'bg-blue-500 text-white border-blue-400' : 'bg-black/40 border-white/10 text-zinc-400'
              }`}
              title="Inspect / Select"
            >
              <Eye className="w-3.5 h-3.5" /> Select
            </button>
            <button
              onClick={() => setActiveTool('road')}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                activeTool === 'road' ? 'bg-slate-600 text-white border-slate-400' : 'bg-black/40 border-white/10 text-zinc-400'
              }`}
              title="Draw Roads"
            >
              <Bus className="w-3.5 h-3.5" /> Road
            </button>
            <button
              onClick={() => setActiveTool('demolish')}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                activeTool === 'demolish' ? 'bg-rose-500 text-white border-rose-400' : 'bg-black/40 border-white/10 text-zinc-400'
              }`}
              title="Demolish Structure"
            >
              <Trash2 className="w-3.5 h-3.5" /> Bulldoze
            </button>
            <button
              onClick={() => setActiveTool('terrain_raise')}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                activeTool.startsWith('terrain_') ? 'bg-amber-500 text-black border-amber-400' : 'bg-black/40 border-white/10 text-zinc-400'
              }`}
              title="Terrain Edit"
            >
              <Trees className="w-3.5 h-3.5" /> Terrain
            </button>
          </div>

          {/* Building Catalog List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar">
            {BUILDING_CATALOG.filter((b) => b.category === selectedCategory).map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setSelectedBuildingDefId(b.id);
                  setActiveTool('building');
                  soundEngine.playClick();
                }}
                className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedBuildingDefId === b.id && activeTool === 'building'
                    ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-lg shadow-cyan-500/10'
                    : 'border-white/10 bg-black/40 text-zinc-300 hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs">
                  <span>{b.name}</span>
                  <span className="font-mono text-cyan-400">${b.cost.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1 leading-snug">{b.description}</p>
                <div className="mt-2 flex items-center gap-3 text-[10px] font-mono text-zinc-400">
                  <span>Cap: {b.maxCapacity}</span>
                  <span>Power: {b.powerDemand}MW</span>
                  <span>Water: {b.waterDemand}KL</span>
                </div>
              </button>
            ))}
          </div>

          {/* Template Quick Selection */}
          <div className="p-3 border-t border-white/10 bg-black/40">
            <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5">
              Load Starting City Template
            </label>
            <select
              onChange={(e) => handleLoadTemplate(e.target.value)}
              className="w-full p-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white outline-none cursor-pointer"
            >
              {CITY_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </aside>

        {/* CENTER 3D CITY CANVAS */}
        <main className="flex-1 w-full h-full relative overflow-hidden bg-slate-950">
          <CityCanvas3D
            gridSize={project.gridSize}
            tiles={project.tiles}
            buildings={project.buildings}
            vehicles={vehicles}
            simState={simState}
            overlayMode={overlayMode}
            activeTool={activeTool}
            selectedBuildingDefId={selectedBuildingDefId}
            selectedInstanceId={selectedInstanceId}
            cameraView={cameraView}
            onSelectTile={handleSelectTile}
            onHoverTile={() => {}}
            theme={appTheme}
          />

          {/* CITYVERSE AI PROPOSAL MODAL OVERLAY */}
          {aiProposal && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[92%] p-5 rounded-2xl bg-[#081020]/95 border border-purple-500/50 backdrop-blur-2xl shadow-2xl shadow-purple-500/20 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span>{aiProposal.title}</span>
                </div>
                <button
                  onClick={() => setAiProposal(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed mb-4">{aiProposal.explanation}</p>

              <div className="space-y-1.5 mb-4 max-h-40 overflow-y-auto pr-1 text-xs">
                {aiProposal.actions.map((act, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-black/40 border border-white/10 font-mono text-[11px] text-purple-200">
                    • {act.description}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAcceptProposal}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs shadow-lg shadow-purple-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Apply Changes
                </button>
                <button
                  onClick={() => setAiProposal(null)}
                  className="py-2.5 px-4 rounded-xl bg-black/40 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white font-bold text-xs transition-all cursor-pointer"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </main>

        {/* RIGHT INSPECTOR & WARNINGS PANEL */}
        <aside className="w-80 border-l border-cyan-500/20 bg-[#060c18]/95 backdrop-blur-xl flex flex-col shrink-0 z-10 overflow-hidden">
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide">
              Inspector & Telemetry
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono">
              Score: {simState.cityScore}/100
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs no-scrollbar">
            {/* Selected Structure Inspector */}
            {activeBuildingDef ? (
              <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
                <div className="font-bold text-white text-sm">{activeBuildingDef.name}</div>
                <p className="text-[11px] text-zinc-300 leading-snug">{activeBuildingDef.description}</p>

                <div className="pt-2 border-t border-white/10 space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Power Status:</span>
                    <span className="text-cyan-300 font-bold">Connected ({activeBuildingDef.powerDemand}MW)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Water Supply:</span>
                    <span className="text-blue-300 font-bold">Connected ({activeBuildingDef.waterDemand}KL)</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (selectedTileCoords) {
                      handleSelectTile(selectedTileCoords.x, selectedTileCoords.z, selectedInstanceId);
                    }
                  }}
                  className="w-full mt-2 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Demolish Structure
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-center text-zinc-400">
                Click any building or tile on the 3D map to inspect its telemetry and connections.
              </div>
            )}

            {/* City Health & Warnings List */}
            <div className="space-y-2">
              <span className="font-bold text-zinc-300 text-[10px] uppercase tracking-wide block">
                Infrastructure Health Alerts
              </span>
              {simState.warnings.length > 0 ? (
                simState.warnings.map((warn, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-[11px] flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{warn}</span>
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>All municipal infrastructure networks operating nominally.</span>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* CITYVERSE AI ASSISTANT DRAWER */}
        {showAiDrawer && (
          <aside className="w-80 border-l border-purple-500/30 bg-[#081020]/95 backdrop-blur-2xl flex flex-col shrink-0 z-30 absolute right-0 top-0 bottom-0 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="p-3 border-b border-purple-500/30 flex items-center justify-between bg-purple-950/30">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                <Bot className="w-4 h-4 text-purple-400" />
                <span>CITYVERSE AI Assistant</span>
              </div>
              <button onClick={() => setShowAiDrawer(false)} className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 flex-1 overflow-y-auto space-y-3 text-xs">
              <p className="text-zinc-300 leading-relaxed text-[11px]">
                Describe what you want to build or modify in natural language. CITYVERSE AI will propose structured city actions.
              </p>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Quick Prompt Ideas</span>
                {[
                  'Build a residential neighborhood near the park',
                  'Add a hospital & fire department',
                  'Design a green solar energy park',
                  'Build a highway connecting two zones',
                ].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setAiPrompt(p);
                      soundEngine.playClick();
                    }}
                    className="w-full text-left p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-200 text-[11px] transition-all cursor-pointer"
                  >
                    "{p}"
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 border-t border-purple-500/30 bg-black/40 space-y-2">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask CITYVERSE AI to design or modify your city..."
                className="w-full h-20 p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white outline-none resize-none focus:border-purple-400"
              />
              <button
                onClick={handleRunAiPrompt}
                disabled={isAiProcessing || !aiPrompt.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs shadow-lg shadow-purple-500/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-white" />
                {isAiProcessing ? 'Generating Proposal...' : 'Generate AI Proposal'}
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 3. BOTTOM TELEMETRY STATUS BAR */}
      {/* ===================================================================== */}
      <footer className="px-4 py-2 bg-[#060c18] border-t border-cyan-500/20 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-xs shrink-0 font-mono text-zinc-300 z-20">
        <div>
          <span className="text-[10px] text-zinc-400 block">POPULATION</span>
          <span className="font-bold text-white text-sm">{simState.population.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-400 block">TREASURY</span>
          <span className="font-bold text-emerald-400 text-sm">${project.treasury.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-400 block">JOBS / EMPLOYED</span>
          <span className="font-bold text-cyan-300 text-sm">{simState.employedCount}/{simState.totalJobs}</span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-400 block">POWER GRID</span>
          <span className="font-bold text-cyan-400 text-sm">{simState.powerCapacityTotal}MW</span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-400 block">WATER GRID</span>
          <span className="font-bold text-blue-400 text-sm">{simState.waterCapacityTotal}KL</span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-400 block">TRAFFIC INDEX</span>
          <span className="font-bold text-amber-400 text-sm">{simState.trafficIndex}%</span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-400 block">CITY SCORE</span>
          <span className="font-bold text-purple-400 text-sm">{simState.cityScore}/100</span>
        </div>
      </footer>
    </div>
  );
};
