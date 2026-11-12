import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CONSTELLATIONS_DATA, PLANETS_DATA } from '../utils/spaceData';
import { convertRaDecToAltAz } from '../utils/astronomyEngine';
import { UserLocation } from '../types';
import { Search, Compass, Eye, MapPin, ZoomIn, ZoomOut, RefreshCw, Sun, Moon, Sparkles, SlidersHorizontal, Crosshair } from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

const PRESET_LOCATIONS: UserLocation[] = [
  { city: 'New York, USA', lat: 40.7128, lon: -74.0060, isCustom: false },
  { city: 'London, UK', lat: 51.5074, lon: -0.1278, isCustom: false },
  { city: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503, isCustom: false },
  { city: 'Sydney, Australia', lat: -33.8688, lon: 151.2093, isCustom: false },
  { city: 'Cairo, Egypt', lat: 30.0444, lon: 31.2357, isCustom: false },
  { city: 'Mumbai, India', lat: 19.0760, lon: 72.8777, isCustom: false },
  { city: 'Rio de Janeiro, Brazil', lat: -22.9068, lon: -43.1729, isCustom: false },
];

export const SkyMapTab: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Location & Time State
  const [location, setLocation] = useState<UserLocation>(PRESET_LOCATIONS[0]);
  const [obsDate, setObsDate] = useState<Date>(new Date());
  
  // Viewport Pan/Zoom
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Display Toggles
  const [nightVision, setNightVision] = useState(false);
  const [showConstellations, setShowConstellations] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showHorizon, setShowHorizon] = useState(true);

  // Selected Object Info Panel
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Geolocation trigger
  const requestGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            city: `GPS (${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°)`,
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            isCustom: true
          });
          soundEngine.playSuccess();
        },
        () => {
          alert('Location permission denied. Using preset location.');
        }
      );
    }
  };

  // Render Sky Map on Canvas
  const drawSkyMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2 + panOffset.x;
    const centerY = height / 2 + panOffset.y;
    const radius = (Math.min(width, height) / 2.2) * zoom;

    // Clear Background (Night vision vs Standard Deep Blue Sky)
    ctx.fillStyle = nightVision ? '#100000' : '#030712';
    ctx.fillRect(0, 0, width, height);

    // Sky Dome Boundary Circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = nightVision ? '#200000' : '#070f26';
    ctx.fill();
    ctx.strokeStyle = nightVision ? '#880000' : '#1e3a8a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Celestial Grid Lines
    if (showGrid) {
      ctx.strokeStyle = nightVision ? 'rgba(150, 0, 0, 0.25)' : 'rgba(30, 58, 138, 0.3)';
      ctx.lineWidth = 1;
      for (let r = 0.25; r <= 1; r += 0.25) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * r, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let angle = 0; angle < 360; angle += 45) {
        const rad = (angle * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + radius * Math.cos(rad), centerY + radius * Math.sin(rad));
        ctx.stroke();
      }
    }

    // Direction Compass Markers (N, S, E, W)
    const dirs = [
      { label: 'N', angle: -90 },
      { label: 'E', angle: 0 },
      { label: 'S', angle: 90 },
      { label: 'W', angle: 180 }
    ];
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = nightVision ? '#ff4444' : '#60a5fa';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    dirs.forEach(d => {
      const rad = (d.angle * Math.PI) / 180;
      const x = centerX + (radius + 18) * Math.cos(rad);
      const y = centerY + (radius + 18) * Math.sin(rad);
      ctx.fillText(d.label, x, y);
    });

    // Project RA/Dec to Canvas Point
    const projectSkyPoint = (raHours: number, decDeg: number) => {
      const coords = convertRaDecToAltAz(raHours, decDeg, location.lat, location.lon, obsDate);
      if (!coords.isVisible && showHorizon) return null;

      // Map Alt/Az to polar projection on sky dome canvas
      const altNorm = (90 - coords.altDeg) / 90; // 0 at zenith, 1 at horizon
      const azRad = ((coords.azDeg - 90) * Math.PI) / 180;
      
      const px = centerX + radius * altNorm * Math.cos(azRad);
      const py = centerY + radius * altNorm * Math.sin(azRad);
      return { x: px, y: py, altDeg: coords.altDeg, azDeg: coords.azDeg, isVisible: coords.isVisible };
    };

    // Draw Constellation Lines & Stars
    CONSTELLATIONS_DATA.forEach(constell => {
      const starPoints = constell.stars.map(s => ({
        ...s,
        point: projectSkyPoint(s.raHours, s.decDeg)
      }));

      // Draw constellation connecting lines
      if (showConstellations) {
        ctx.strokeStyle = nightVision ? 'rgba(255, 68, 68, 0.4)' : 'rgba(96, 165, 250, 0.4)';
        ctx.lineWidth = 1.5;
        constell.lineConnections.forEach(([p1, p2]) => {
          const pt1 = starPoints[p1]?.point;
          const pt2 = starPoints[p2]?.point;
          if (pt1 && pt2) {
            ctx.beginPath();
            ctx.moveTo(pt1.x, pt1.y);
            ctx.lineTo(pt2.x, pt2.y);
            ctx.stroke();
          }
        });
      }

      // Draw Constellation Stars
      starPoints.forEach(s => {
        if (!s.point) return;
        const starRadius = Math.max(1.5, 4.5 - s.mag);
        ctx.beginPath();
        ctx.arc(s.point.x, s.point.y, starRadius, 0, Math.PI * 2);
        
        // Color tint by spectral type
        let color = '#ffffff';
        if (s.spectType.startsWith('M') || s.spectType.startsWith('K')) color = '#ffab91'; // Warm red/orange
        else if (s.spectType.startsWith('B') || s.spectType.startsWith('O')) color = '#90caf9'; // Cool blue
        
        ctx.fillStyle = nightVision ? '#ff6666' : color;
        ctx.fill();

        if (showLabels && s.mag < 2.0) {
          ctx.font = '9px monospace';
          ctx.fillStyle = nightVision ? '#ff8888' : 'rgba(224, 242, 254, 0.7)';
          ctx.textAlign = 'left';
          ctx.fillText(s.name, s.point.x + starRadius + 3, s.point.y + 3);
        }
      });

      // Constellation Center Label
      if (showLabels && starPoints.some(s => s.point)) {
        const validPts = starPoints.map(s => s.point).filter(Boolean) as Array<{ x: number; y: number }>;
        if (validPts.length > 0) {
          const avgX = validPts.reduce((acc, p) => acc + p.x, 0) / validPts.length;
          const avgY = validPts.reduce((acc, p) => acc + p.y, 0) / validPts.length;
          ctx.font = 'bold 11px monospace';
          ctx.fillStyle = nightVision ? '#ffaaaa' : '#93c5fd';
          ctx.textAlign = 'center';
          ctx.fillText(constell.name.toUpperCase(), avgX, avgY - 12);
        }
      }
    });

    // Draw Major Planets on Sky Map
    const planetPositions = [
      { name: 'Venus', ra: 1.5, dec: 12.0, color: '#ffd54f' },
      { name: 'Mars', ra: 4.2, dec: 21.0, color: '#ff7043' },
      { name: 'Jupiter', ra: 3.8, dec: 18.5, color: '#d7ccc8' },
      { name: 'Saturn', ra: 22.5, dec: -10.2, color: '#ffe082' }
    ];

    planetPositions.forEach(p => {
      const pt = projectSkyPoint(p.ra, p.dec);
      if (!pt) return;
      
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = nightVision ? '#ff3333' : p.color;
      ctx.fill();
      ctx.strokeStyle = nightVision ? '#ffffff' : '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (showLabels) {
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = nightVision ? '#ffcccc' : '#fef08a';
        ctx.textAlign = 'left';
        ctx.fillText(`🪐 ${p.name}`, pt.x + 8, pt.y + 3);
      }
    });

  }, [zoom, panOffset, nightVision, showConstellations, showLabels, showGrid, showHorizon, location, obsDate]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
        canvasRef.current.height = Math.max(500, canvasRef.current.parentElement.clientHeight);
        drawSkyMap();
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawSkyMap]);

  useEffect(() => {
    drawSkyMap();
  }, [drawSkyMap]);

  // Mouse Canvas Interaction for Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Canvas Click Detection to Select Object
  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check if clicked near a constellation
    const foundConstell = CONSTELLATIONS_DATA.find(c => {
      return c.stars.some(s => {
        const pt = convertRaDecToAltAz(s.raHours, s.decDeg, location.lat, location.lon, obsDate);
        if (!pt.isVisible && showHorizon) return false;
        // Simple distance check
        return true;
      });
    });

    if (foundConstell) {
      setSelectedTarget(foundConstell);
      soundEngine.playClick();
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* Control Toolbar Bar */}
      <div className="bg-[#090d16] border border-cyan-900/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        
        {/* Location & Time Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-black/60 border border-cyan-900/60 px-3 py-1.5 rounded-xl text-xs text-cyan-300">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <select 
              value={location.city} 
              onChange={(e) => {
                const found = PRESET_LOCATIONS.find(p => p.city === e.target.value);
                if (found) setLocation(found);
              }}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              {PRESET_LOCATIONS.map((loc, idx) => (
                <option key={idx} value={loc.city} className="bg-slate-900 text-white">{loc.city}</option>
              ))}
              {location.isCustom && <option value={location.city}>{location.city}</option>}
            </select>
            <button onClick={requestGeolocation} className="p-1 hover:text-white text-cyan-400" title="Use Device Geolocation">
              <Crosshair className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 bg-black/60 border border-cyan-900/60 px-3 py-1.5 rounded-xl text-xs text-cyan-300">
            <Compass className="w-4 h-4 text-cyan-400" />
            <input 
              type="datetime-local" 
              value={obsDate.toISOString().substring(0, 16)} 
              onChange={(e) => setObsDate(new Date(e.target.value))}
              className="bg-transparent text-white font-mono focus:outline-none cursor-pointer"
            />
            <button onClick={() => setObsDate(new Date())} className="text-[10px] text-cyan-400 hover:text-white underline">Now</button>
          </div>
        </div>

        {/* View Options Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setNightVision(!nightVision)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${nightVision ? 'bg-red-600 text-white' : 'bg-black/60 border border-cyan-900/60 text-cyan-300 hover:bg-cyan-950'}`}
          >
            <Eye className="w-3.5 h-3.5" /> Night Vision Mode
          </button>
          <button
            onClick={() => setShowConstellations(!showConstellations)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${showConstellations ? 'bg-cyan-600 text-white' : 'bg-black/60 border border-cyan-900/60 text-cyan-400/60'}`}
          >
            Lines
          </button>
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${showLabels ? 'bg-cyan-600 text-white' : 'bg-black/60 border border-cyan-900/60 text-cyan-400/60'}`}
          >
            Labels
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${showGrid ? 'bg-cyan-600 text-white' : 'bg-black/60 border border-cyan-900/60 text-cyan-400/60'}`}
          >
            Grid
          </button>
          <button
            onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }}
            className="p-1.5 bg-black/60 border border-cyan-900/60 text-cyan-400 hover:text-white rounded-xl"
            title="Reset View"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Interactive Planetarium Canvas Viewport */}
      <div className="relative w-full h-[600px] bg-black rounded-3xl overflow-hidden border border-cyan-900/50 shadow-2xl flex flex-col">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />

        {/* Floating Zoom Controls */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-20">
          <button 
            onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
            className="p-3 bg-black/80 hover:bg-cyan-950 text-cyan-300 border border-cyan-500/40 rounded-2xl shadow-xl transition-all"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
            className="p-3 bg-black/80 hover:bg-cyan-950 text-cyan-300 border border-cyan-500/40 rounded-2xl shadow-xl transition-all"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Target Panel Overlay */}
        {selectedTarget && (
          <div className="absolute top-6 left-6 max-w-sm bg-[#090d16]/95 border border-cyan-500/50 backdrop-blur-md rounded-2xl p-5 shadow-2xl text-xs space-y-3 z-20 animate-in fade-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 px-2 py-0.5 bg-cyan-950 rounded border border-cyan-800">
                Constellation
              </span>
              <button onClick={() => setSelectedTarget(null)} className="text-cyan-400 hover:text-white font-bold">✕</button>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">{selectedTarget.name} ({selectedTarget.latinName})</h3>
              <p className="text-[11px] text-cyan-300/80 italic">{selectedTarget.englishName} • {selectedTarget.symbolism}</p>
            </div>
            <p className="text-cyan-100/70 leading-relaxed text-[11px]">{selectedTarget.mythology}</p>
            <div className="pt-2 border-t border-cyan-900/40 text-[10px] text-cyan-400 space-y-1 font-mono">
              <p><strong>Brightest Star:</strong> {selectedTarget.brightestStar} (Mag {selectedTarget.brightestStarMag})</p>
              <p><strong>Best Season:</strong> {selectedTarget.bestViewingSeason}</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
