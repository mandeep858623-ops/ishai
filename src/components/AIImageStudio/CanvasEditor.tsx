import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  CanvasLayer,
  TextLayer,
  ShapeLayer,
  StickerLayer,
  ImageLayer,
  CanvasProject,
  AspectRatioType,
} from './types';
import {
  Type,
  Square,
  Sparkles,
  Download,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  RotateCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Move,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Palette,
  Layers,
} from 'lucide-react';
import { soundEngine } from '../../utils/audio';

interface CanvasEditorProps {
  initialBackgroundUrl?: string;
  initialTitle?: string;
  initialSubtitle?: string;
  initialMode?: 'poster' | 'thumbnail' | 'logo' | 'wallpaper' | 'social' | 'custom';
  aspectRatio?: AspectRatioType;
  onSaveToCreations?: (project: CanvasProject, exportedImageUrl: string) => void;
}

const FONT_FAMILIES = [
  { name: 'Impact (Thumbnail Bold)', value: 'Impact, sans-serif' },
  { name: 'Montserrat (Modern Bold)', value: 'Montserrat, sans-serif' },
  { name: 'Inter (Clean Tech)', value: 'Inter, sans-serif' },
  { name: 'Orbitron (Futuristic)', value: 'Orbitron, sans-serif' },
  { name: 'Playfair (Elegant Serif)', value: 'Playfair Display, serif' },
  { name: 'Courier (Terminal Monospace)', value: 'Courier New, monospace' },
];

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  initialBackgroundUrl,
  initialTitle,
  initialSubtitle,
  initialMode = 'thumbnail',
  aspectRatio = '16:9',
  onSaveToCreations,
}) => {
  // Dimensions
  const getDimensions = (ratio: AspectRatioType) => {
    switch (ratio) {
      case '16:9':
        return { width: 1280, height: 720 };
      case '9:16':
        return { width: 720, height: 1280 };
      case '3:4':
        return { width: 900, height: 1200 };
      case '4:3':
        return { width: 1200, height: 900 };
      case '1:1':
      default:
        return { width: 1080, height: 1080 };
    }
  };

  const dims = getDimensions(aspectRatio);
  const [canvasWidth, setCanvasWidth] = useState(dims.width);
  const [canvasHeight, setCanvasHeight] = useState(dims.height);
  const [backgroundColor, setBackgroundColor] = useState('#0a0d14');
  const [zoom, setZoom] = useState(0.65);
  const [layers, setLayers] = useState<CanvasLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  // Undo / Redo history
  const [history, setHistory] = useState<CanvasLayer[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Dragging and Transform state
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [layerStartPos, setLayerStartPos] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // Push state to undo history
  const pushHistory = useCallback((newLayers: CanvasLayer[]) => {
    setHistory((prev) => {
      const slice = prev.slice(0, historyIndex + 1);
      return [...slice, newLayers];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Initial setup with initialBackgroundUrl or defaults
  useEffect(() => {
    const initialDims = getDimensions(aspectRatio);
    setCanvasWidth(initialDims.width);
    setCanvasHeight(initialDims.height);

    const initLayers: CanvasLayer[] = [];

    // Background Image Layer if provided
    if (initialBackgroundUrl) {
      initLayers.push({
        id: `layer-bg-${Date.now()}`,
        type: 'image',
        name: 'Background Artwork',
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        width: initialDims.width,
        height: initialDims.height,
        rotation: 0,
        opacity: 1,
        imageUrl: initialBackgroundUrl,
        objectFit: 'cover',
      });
    }

    // Title Layer
    if (initialTitle || initialMode === 'thumbnail' || initialMode === 'poster') {
      const titleText = initialTitle || (initialMode === 'thumbnail' ? 'INSANE DISCOVERY!' : 'ANNUAL GRAND EVENT');
      initLayers.push({
        id: `layer-title-${Date.now()}`,
        type: 'text',
        name: 'Main Title',
        visible: true,
        locked: false,
        x: initialDims.width * 0.08,
        y: initialDims.height * 0.22,
        width: initialDims.width * 0.84,
        height: 120,
        rotation: 0,
        opacity: 1,
        text: titleText,
        fontSize: initialMode === 'thumbnail' ? 68 : 56,
        fontFamily: 'Impact, sans-serif',
        fontWeight: '900',
        fontStyle: 'normal',
        fill: '#facc15', // Vibrant yellow for thumbnails
        textAlign: 'center',
        stroke: '#000000',
        strokeWidth: 8,
        shadowColor: 'rgba(0,0,0,0.85)',
        shadowBlur: 16,
        shadowOffsetX: 4,
        shadowOffsetY: 6,
        letterSpacing: 2,
      });
    }

    // Subtitle Layer
    if (initialSubtitle || initialMode === 'poster' || initialMode === 'thumbnail') {
      const subText = initialSubtitle || (initialMode === 'thumbnail' ? 'Watch Before It Is Too Late' : 'Special Guest Speakers • Free Registration');
      initLayers.push({
        id: `layer-sub-${Date.now()}`,
        type: 'text',
        name: 'Subtitle',
        visible: true,
        locked: false,
        x: initialDims.width * 0.1,
        y: initialDims.height * 0.44,
        width: initialDims.width * 0.8,
        height: 60,
        rotation: 0,
        opacity: 1,
        text: subText,
        fontSize: 32,
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 'bold',
        fontStyle: 'normal',
        fill: '#ffffff',
        textAlign: 'center',
        stroke: '#050505',
        strokeWidth: 4,
        shadowColor: 'rgba(0,0,0,0.8)',
        shadowBlur: 10,
        shadowOffsetX: 2,
        shadowOffsetY: 3,
        letterSpacing: 1,
      });
    }

    // Badge Sticker
    if (initialMode === 'thumbnail') {
      initLayers.push({
        id: `layer-badge-${Date.now()}`,
        type: 'sticker',
        name: 'Highlight Badge',
        visible: true,
        locked: false,
        x: initialDims.width * 0.08,
        y: initialDims.height * 0.08,
        width: 140,
        height: 48,
        rotation: -4,
        opacity: 1,
        text: '🔥 4K ULTRA',
        category: 'badge',
        backgroundColor: '#ef4444',
        textColor: '#ffffff',
      });
    }

    setLayers(initLayers);
    setHistory([initLayers]);
    setHistoryIndex(0);
    if (initLayers.length > 0) {
      setSelectedLayerId(initLayers[initLayers.length - 1].id);
    }
  }, [initialBackgroundUrl, initialTitle, initialSubtitle, initialMode, aspectRatio]);

  // Preload images into cache
  useEffect(() => {
    layers.forEach((l) => {
      if (l.type === 'image' && l.imageUrl) {
        if (!imageCacheRef.current.has(l.imageUrl)) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = l.imageUrl;
          img.onload = () => {
            imageCacheRef.current.set(l.imageUrl, img);
            renderCanvas();
          };
        }
      }
    });
  }, [layers]);

  // Render Canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw canvas background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Render layers in bottom-to-top order
    layers.forEach((layer) => {
      if (!layer.visible) return;

      ctx.save();
      ctx.globalAlpha = layer.opacity;

      // Handle translation and rotation
      const cx = layer.x + layer.width / 2;
      const cy = layer.y + layer.height / 2;
      ctx.translate(cx, cy);
      if (layer.rotation) {
        ctx.rotate((layer.rotation * Math.PI) / 180);
      }
      ctx.translate(-cx, -cy);

      if (layer.type === 'image') {
        const cachedImg = imageCacheRef.current.get(layer.imageUrl);
        if (cachedImg && cachedImg.complete) {
          // Apply image filters if set
          const filters = [];
          if (layer.filterBrightness) filters.push(`brightness(${100 + layer.filterBrightness}%)`);
          if (layer.filterContrast) filters.push(`contrast(${100 + layer.filterContrast}%)`);
          if (layer.filterSaturation) filters.push(`saturate(${100 + layer.filterSaturation}%)`);
          if (layer.filterBlur) filters.push(`blur(${layer.filterBlur}px)`);
          if (layer.filterSepia) filters.push(`sepia(${layer.filterSepia}%)`);
          if (layer.filterGrayscale) filters.push(`grayscale(${layer.filterGrayscale}%)`);
          if (layer.filterInvert) filters.push(`invert(${layer.filterInvert}%)`);
          if (layer.filterHueRotate) filters.push(`hue-rotate(${layer.filterHueRotate}deg)`);

          if (filters.length > 0) {
            ctx.filter = filters.join(' ');
          }

          ctx.drawImage(cachedImg, layer.x, layer.y, layer.width, layer.height);
          ctx.filter = 'none';
        } else {
          // Placeholder rectangle while loading
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '16px monospace';
          ctx.fillText('Loading Image...', layer.x + 20, layer.y + 40);
        }
      } else if (layer.type === 'shape') {
        const s = layer as ShapeLayer;
        ctx.fillStyle = s.fill;
        if (s.stroke && s.strokeWidth) {
          ctx.strokeStyle = s.stroke;
          ctx.lineWidth = s.strokeWidth;
        }

        if (s.shapeType === 'circle') {
          ctx.beginPath();
          ctx.ellipse(
            layer.x + layer.width / 2,
            layer.y + layer.height / 2,
            layer.width / 2,
            layer.height / 2,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
          if (s.stroke && s.strokeWidth) ctx.stroke();
        } else if (s.shapeType === 'pill' || s.cornerRadius) {
          const radius = s.cornerRadius || layer.height / 2;
          ctx.beginPath();
          ctx.roundRect(layer.x, layer.y, layer.width, layer.height, radius);
          ctx.fill();
          if (s.stroke && s.strokeWidth) ctx.stroke();
        } else if (s.shapeType === 'border') {
          ctx.lineWidth = s.strokeWidth || 6;
          ctx.strokeStyle = s.stroke || s.fill;
          ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);
        } else if (s.shapeType === 'line') {
          ctx.beginPath();
          ctx.moveTo(layer.x, layer.y + layer.height / 2);
          ctx.lineTo(layer.x + layer.width, layer.y + layer.height / 2);
          ctx.lineWidth = s.strokeWidth || 4;
          ctx.strokeStyle = s.fill;
          ctx.stroke();
        } else {
          ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
          if (s.stroke && s.strokeWidth) ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);
        }
      } else if (layer.type === 'sticker') {
        const stk = layer as StickerLayer;
        ctx.beginPath();
        ctx.roundRect(layer.x, layer.y, layer.width, layer.height, 8);
        ctx.fillStyle = stk.backgroundColor;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = stk.textColor;
        ctx.font = `bold 18px Impact, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stk.text, layer.x + layer.width / 2, layer.y + layer.height / 2);
      } else if (layer.type === 'text') {
        const t = layer as TextLayer;

        // Optional background badge behind text
        if (t.backgroundColor) {
          const pad = t.backgroundPadding || 8;
          ctx.fillStyle = t.backgroundColor;
          ctx.beginPath();
          ctx.roundRect(
            layer.x - pad,
            layer.y - pad,
            layer.width + pad * 2,
            layer.height + pad * 2,
            t.backgroundRadius || 6
          );
          ctx.fill();
        }

        ctx.font = `${t.fontStyle || 'normal'} ${t.fontWeight || 'bold'} ${t.fontSize}px ${t.fontFamily}`;
        ctx.textAlign = t.textAlign || 'center';
        ctx.textBaseline = 'top';

        // Configure shadows
        if (t.shadowColor) {
          ctx.shadowColor = t.shadowColor;
          ctx.shadowBlur = t.shadowBlur || 8;
          ctx.shadowOffsetX = t.shadowOffsetX || 2;
          ctx.shadowOffsetY = t.shadowOffsetY || 3;
        }

        const textX =
          t.textAlign === 'center'
            ? layer.x + layer.width / 2
            : t.textAlign === 'right'
            ? layer.x + layer.width
            : layer.x;

        // Stroke outline (important for thumbnails/posters!)
        if (t.stroke && t.strokeWidth) {
          ctx.strokeStyle = t.stroke;
          ctx.lineWidth = t.strokeWidth;
          ctx.lineJoin = 'miter';
          ctx.miterLimit = 2;
          ctx.strokeText(t.text, textX, layer.y);
        }

        // Fill text
        ctx.fillStyle = t.fill;
        ctx.fillText(t.text, textX, layer.y);

        // Reset shadow
        ctx.shadowColor = 'transparent';
      }

      ctx.restore();
    });

    // Render selection bounding box and handles for active layer
    const activeLayer = layers.find((l) => l.id === selectedLayerId);
    if (activeLayer && !activeLayer.locked) {
      ctx.save();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(activeLayer.x, activeLayer.y, activeLayer.width, activeLayer.height);

      // Handle corner markers
      ctx.setLineDash([]);
      ctx.fillStyle = '#10b981';
      const handleSize = 10;
      const corners = [
        { x: activeLayer.x, y: activeLayer.y },
        { x: activeLayer.x + activeLayer.width, y: activeLayer.y },
        { x: activeLayer.x, y: activeLayer.y + activeLayer.height },
        { x: activeLayer.x + activeLayer.width, y: activeLayer.y + activeLayer.height },
      ];
      corners.forEach((c) => {
        ctx.fillRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
      });
      ctx.restore();
    }
  }, [layers, selectedLayerId, canvasWidth, canvasHeight, backgroundColor]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Pointer Interaction
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);

    // Check if clicked inside selected layer's resize handle
    const active = layers.find((l) => l.id === selectedLayerId);
    if (active && !active.locked) {
      const handleSize = 16;
      const isBottomRight =
        Math.abs(coords.x - (active.x + active.width)) < handleSize &&
        Math.abs(coords.y - (active.y + active.height)) < handleSize;

      if (isBottomRight) {
        setIsResizing(true);
        setResizeHandle('bottom-right');
        setDragStart(coords);
        setLayerStartPos({ x: active.x, y: active.y, width: active.width, height: active.height });
        return;
      }
    }

    // Hit test layers from top to bottom
    const reversed = [...layers].reverse();
    const clickedLayer = reversed.find((l) => {
      if (!l.visible || l.locked) return false;
      return (
        coords.x >= l.x &&
        coords.x <= l.x + l.width &&
        coords.y >= l.y &&
        coords.y <= l.y + l.height
      );
    });

    if (clickedLayer) {
      setSelectedLayerId(clickedLayer.id);
      setIsDragging(true);
      setDragStart(coords);
      setLayerStartPos({
        x: clickedLayer.x,
        y: clickedLayer.y,
        width: clickedLayer.width,
        height: clickedLayer.height,
      });
    } else {
      setSelectedLayerId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging && !isResizing) return;
    const coords = getCanvasCoords(e);
    const dx = coords.x - dragStart.x;
    const dy = coords.y - dragStart.y;

    if (isDragging && selectedLayerId) {
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id === selectedLayerId && !l.locked) {
            return {
              ...l,
              x: Math.round(layerStartPos.x + dx),
              y: Math.round(layerStartPos.y + dy),
            };
          }
          return l;
        })
      );
    } else if (isResizing && selectedLayerId) {
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id === selectedLayerId && !l.locked) {
            return {
              ...l,
              width: Math.max(30, Math.round(layerStartPos.width + dx)),
              height: Math.max(20, Math.round(layerStartPos.height + dy)),
            };
          }
          return l;
        })
      );
    }
  };

  const handleMouseUp = () => {
    if (isDragging || isResizing) {
      pushHistory(layers);
    }
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  // Layer Management Tools
  const addTextLayer = () => {
    soundEngine.playClick();
    const newLayer: TextLayer = {
      id: `text-${Date.now()}`,
      type: 'text',
      name: `Text ${layers.length + 1}`,
      visible: true,
      locked: false,
      x: canvasWidth * 0.2,
      y: canvasHeight * 0.4,
      width: canvasWidth * 0.6,
      height: 80,
      rotation: 0,
      opacity: 1,
      text: 'YOUR TEXT HERE',
      fontSize: 48,
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 'bold',
      fontStyle: 'normal',
      fill: '#ffffff',
      textAlign: 'center',
      stroke: '#000000',
      strokeWidth: 4,
      shadowColor: 'rgba(0,0,0,0.7)',
      shadowBlur: 10,
    };
    const next = [...layers, newLayer];
    setLayers(next);
    setSelectedLayerId(newLayer.id);
    pushHistory(next);
  };

  const addShapeLayer = (shapeType: 'rectangle' | 'circle' | 'pill' | 'banner') => {
    soundEngine.playClick();
    const newLayer: ShapeLayer = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      name: `${shapeType.toUpperCase()} Layer`,
      visible: true,
      locked: false,
      x: canvasWidth * 0.2,
      y: canvasHeight * 0.35,
      width: shapeType === 'banner' ? canvasWidth * 0.8 : 300,
      height: shapeType === 'banner' ? 70 : 200,
      rotation: 0,
      opacity: 0.9,
      shapeType: shapeType === 'banner' ? 'rectangle' : shapeType,
      fill: shapeType === 'banner' ? '#dc2626' : '#10b981',
      cornerRadius: shapeType === 'pill' ? 999 : 8,
    };
    const next = [...layers, newLayer];
    setLayers(next);
    setSelectedLayerId(newLayer.id);
    pushHistory(next);
  };

  const addBadgeSticker = (text: string, color: string) => {
    soundEngine.playClick();
    const newLayer: StickerLayer = {
      id: `sticker-${Date.now()}`,
      type: 'sticker',
      name: `Badge: ${text}`,
      visible: true,
      locked: false,
      x: canvasWidth * 0.1,
      y: canvasHeight * 0.1,
      width: 140,
      height: 48,
      rotation: -3,
      opacity: 1,
      text,
      category: 'badge',
      backgroundColor: color,
      textColor: '#ffffff',
    };
    const next = [...layers, newLayer];
    setLayers(next);
    setSelectedLayerId(newLayer.id);
    pushHistory(next);
  };

  const duplicateSelected = () => {
    if (!selectedLayerId) return;
    const l = layers.find((item) => item.id === selectedLayerId);
    if (!l) return;
    soundEngine.playClick();
    const dup: CanvasLayer = {
      ...l,
      id: `${l.type}-${Date.now()}`,
      name: `${l.name} (Copy)`,
      x: l.x + 25,
      y: l.y + 25,
    };
    const next = [...layers, dup];
    setLayers(next);
    setSelectedLayerId(dup.id);
    pushHistory(next);
  };

  const deleteSelected = () => {
    if (!selectedLayerId) return;
    soundEngine.playClick();
    const next = layers.filter((l) => l.id !== selectedLayerId);
    setLayers(next);
    setSelectedLayerId(next.length > 0 ? next[next.length - 1].id : null);
    pushHistory(next);
  };

  const moveLayerOrder = (direction: 'up' | 'down') => {
    if (!selectedLayerId) return;
    const idx = layers.findIndex((l) => l.id === selectedLayerId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= layers.length) return;

    soundEngine.playClick();
    const copy = [...layers];
    const [moved] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, moved);
    setLayers(copy);
    pushHistory(copy);
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  };

  const toggleLayerLock = (id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l))
    );
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      soundEngine.playClick();
      const prevIndex = historyIndex - 1;
      setLayers(history[prevIndex]);
      setHistoryIndex(prevIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      soundEngine.playClick();
      const nextIndex = historyIndex + 1;
      setLayers(history[nextIndex]);
      setHistoryIndex(nextIndex);
    }
  };

  // Export Canvas
  const handleExport = (format: 'png' | 'jpeg' = 'png') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    soundEngine.playSuccess();

    // Deselect layer to clear bounding box before capturing
    setSelectedLayerId(null);

    setTimeout(() => {
      renderCanvas();
      const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const dataUrl = canvas.toDataURL(mime, 0.95);

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `AI_Image_Studio_${initialMode}_${Date.now()}.${format}`;
      link.click();

      if (onSaveToCreations) {
        const project: CanvasProject = {
          id: `proj-${Date.now()}`,
          name: initialTitle || `${initialMode.toUpperCase()} Composition`,
          width: canvasWidth,
          height: canvasHeight,
          aspectRatio,
          backgroundColor,
          layers,
          updatedAt: new Date().toLocaleTimeString(),
        };
        onSaveToCreations(project, dataUrl);
      }
    }, 100);
  };

  const activeLayer = layers.find((l) => l.id === selectedLayerId);

  return (
    <div className="flex flex-col lg:flex-row h-full font-mono text-emerald-400 bg-[#090d14] rounded-lg overflow-hidden border border-emerald-900/60 select-none">
      {/* --- TOP / LEFT CANVAS TOOLBAR --- */}
      <div className="w-full lg:w-64 bg-[#05080f] border-b lg:border-b-0 lg:border-r border-emerald-950 p-3 flex flex-col gap-3 shrink-0 overflow-y-auto max-h-[300px] lg:max-h-none">
        <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
          <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-400" />
            CANVAS TOOLS
          </span>
          <span className="text-[10px] text-emerald-600 bg-emerald-950/60 px-1.5 py-0.5 rounded">
            {canvasWidth}×{canvasHeight}
          </span>
        </div>

        {/* Add Elements */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-emerald-500 uppercase tracking-wider font-bold">
            Add Layer
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={addTextLayer}
              className="flex items-center justify-center gap-1.5 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/80 text-emerald-300 text-xs py-1.5 px-2 rounded cursor-pointer transition-colors"
            >
              <Type className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Text</span>
            </button>
            <button
              onClick={() => addShapeLayer('rectangle')}
              className="flex items-center justify-center gap-1.5 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/80 text-emerald-300 text-xs py-1.5 px-2 rounded cursor-pointer transition-colors"
            >
              <Square className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Shape</span>
            </button>
            <button
              onClick={() => addShapeLayer('banner')}
              className="flex items-center justify-center gap-1.5 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/80 text-emerald-300 text-xs py-1.5 px-2 rounded cursor-pointer transition-colors"
            >
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Banner</span>
            </button>
            <button
              onClick={() => addBadgeSticker('🔥 HOT', '#ef4444')}
              className="flex items-center justify-center gap-1.5 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/80 text-emerald-300 text-xs py-1.5 px-2 rounded cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>+ Badge</span>
            </button>
          </div>
        </div>

        {/* Quick Badges preset */}
        <div className="space-y-1">
          <span className="text-[10px] text-emerald-600">Quick Stickers:</span>
          <div className="flex flex-wrap gap-1">
            {[
              { label: 'TOP 10', bg: '#f59e0b' },
              { label: 'MUST SEE', bg: '#ef4444' },
              { label: 'NEW', bg: '#10b981' },
              { label: 'LIVE', bg: '#dc2626' },
              { label: '4K', bg: '#8b5cf6' },
              { label: 'SALE', bg: '#06b6d4' },
            ].map((b, idx) => (
              <button
                key={idx}
                onClick={() => addBadgeSticker(b.label, b.bg)}
                className="text-[10px] px-2 py-0.5 rounded font-bold transition-transform hover:scale-105"
                style={{ backgroundColor: b.bg, color: '#ffffff' }}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Layer Stack */}
        <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-500 uppercase tracking-wider font-bold">
              Layer Stack ({layers.length})
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => moveLayerOrder('up')}
                disabled={!selectedLayerId}
                title="Bring Forward"
                className="p-1 hover:bg-emerald-950 rounded text-emerald-400 disabled:opacity-30"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => moveLayerOrder('down')}
                disabled={!selectedLayerId}
                title="Send Backward"
                className="p-1 hover:bg-emerald-950 rounded text-emerald-400 disabled:opacity-30"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1 border border-emerald-950/80 rounded p-1 bg-black/40 max-h-44 scrollbar-thin">
            {[...layers].reverse().map((layer) => {
              const isSelected = layer.id === selectedLayerId;
              return (
                <div
                  key={layer.id}
                  onClick={() => setSelectedLayerId(layer.id)}
                  className={`flex items-center justify-between p-1.5 rounded text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-emerald-900/60 border border-emerald-500 text-white font-bold'
                      : 'hover:bg-emerald-950/40 text-emerald-400 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-[11px] opacity-70">
                      {layer.type === 'text'
                        ? '🔤'
                        : layer.type === 'image'
                        ? '🖼️'
                        : layer.type === 'sticker'
                        ? '🏷️'
                        : '📐'}
                    </span>
                    <span className="truncate text-[11px]">{layer.name}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerVisibility(layer.id);
                      }}
                      className="text-emerald-500 hover:text-emerald-300 p-0.5"
                    >
                      {layer.visible ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3 text-emerald-800" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerLock(layer.id);
                      }}
                      className="text-emerald-500 hover:text-emerald-300 p-0.5"
                    >
                      {layer.locked ? (
                        <Lock className="w-3 h-3 text-amber-400" />
                      ) : (
                        <Unlock className="w-3 h-3 opacity-40 hover:opacity-100" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Layer Action Buttons */}
        {activeLayer && (
          <div className="pt-2 border-t border-emerald-950 flex gap-2">
            <button
              onClick={duplicateSelected}
              className="flex-1 flex items-center justify-center gap-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-[11px] py-1 rounded text-emerald-300"
            >
              <Copy className="w-3 h-3" />
              <span>Duplicate</span>
            </button>
            <button
              onClick={deleteSelected}
              className="flex-1 flex items-center justify-center gap-1 bg-red-950/40 hover:bg-red-900/60 border border-red-800 text-[11px] py-1 rounded text-red-300"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* --- CENTER WORKSPACE / CANVAS VIEWPORT --- */}
      <div className="flex-1 flex flex-col bg-[#020408] overflow-hidden min-h-[400px]">
        {/* Top Control Bar */}
        <div className="bg-[#05080f] border-b border-emerald-950 px-3 py-2 flex items-center justify-between text-xs flex-wrap gap-2">
          {/* Undo / Redo / Zoom */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1 rounded bg-black/40 border border-emerald-900 hover:border-emerald-600 disabled:opacity-30 text-emerald-300"
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1 rounded bg-black/40 border border-emerald-900 hover:border-emerald-600 disabled:opacity-30 text-emerald-300"
              title="Redo (Ctrl+Y)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <span className="text-emerald-800">|</span>
            <button
              onClick={() => setZoom((z) => Math.max(0.25, z - 0.1))}
              className="p-1 rounded bg-black/40 border border-emerald-900 hover:border-emerald-600 text-emerald-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-emerald-400 font-bold min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
              className="p-1 rounded bg-black/40 border border-emerald-900 hover:border-emerald-600 text-emerald-300"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(0.65)}
              className="text-[10px] text-emerald-500 hover:text-emerald-300 px-1"
            >
              Fit
            </button>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('png')}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs px-3 py-1.5 rounded flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.4)] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT PNG</span>
            </button>
            <button
              onClick={() => handleExport('jpeg')}
              className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs px-2.5 py-1.5 rounded cursor-pointer"
            >
              JPEG
            </button>
          </div>
        </div>

        {/* Scrollable Canvas Container */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center relative bg-[radial-gradient(#064e3b_1px,transparent_1px)] [background-size:16px_16px]">
          <div
            style={{
              width: canvasWidth * zoom,
              height: canvasHeight * zoom,
              transformOrigin: 'center center',
            }}
            className="relative shadow-[0_0_35px_rgba(0,0,0,0.9)] border border-emerald-800/80 rounded"
          >
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                cursor: isDragging ? 'grabbing' : activeLayer ? 'move' : 'default',
              }}
            />
          </div>
        </div>
      </div>

      {/* --- RIGHT PROPERTIES PANEL (FOR ACTIVE LAYER) --- */}
      {activeLayer && (
        <div className="w-full lg:w-72 bg-[#05080f] border-t lg:border-t-0 lg:border-l border-emerald-950 p-3 space-y-3 overflow-y-auto max-h-[300px] lg:max-h-none text-xs">
          <div className="pb-2 border-b border-emerald-950 flex items-center justify-between">
            <span className="font-bold text-emerald-300 uppercase truncate">
              {activeLayer.name}
            </span>
            <span className="text-[10px] text-emerald-600 uppercase font-mono">
              {activeLayer.type}
            </span>
          </div>

          {/* Text Layer Properties */}
          {activeLayer.type === 'text' && (
            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] text-emerald-500 uppercase block mb-1 font-bold">
                  Text Content
                </label>
                <textarea
                  value={(activeLayer as TextLayer).text}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLayers((prev) =>
                      prev.map((l) => (l.id === activeLayer.id ? { ...l, text: val } : l))
                    );
                  }}
                  rows={2}
                  className="w-full bg-black border border-emerald-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-emerald-500 uppercase block mb-1 font-bold">
                  Font Family
                </label>
                <select
                  value={(activeLayer as TextLayer).fontFamily}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLayers((prev) =>
                      prev.map((l) => (l.id === activeLayer.id ? { ...l, fontFamily: val } : l))
                    );
                  }}
                  className="w-full bg-black border border-emerald-800 rounded p-1 text-xs text-emerald-300"
                >
                  {FONT_FAMILIES.map((f, i) => (
                    <option key={i} value={f.value}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-emerald-500 block mb-1 font-bold">
                    Size ({(activeLayer as TextLayer).fontSize}px)
                  </label>
                  <input
                    type="range"
                    min="14"
                    max="140"
                    value={(activeLayer as TextLayer).fontSize}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setLayers((prev) =>
                        prev.map((l) => (l.id === activeLayer.id ? { ...l, fontSize: val } : l))
                      );
                    }}
                    className="w-full accent-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-emerald-500 block mb-1 font-bold">
                    Color
                  </label>
                  <div className="flex gap-1.5 items-center">
                    <input
                      type="color"
                      value={(activeLayer as TextLayer).fill}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLayers((prev) =>
                          prev.map((l) => (l.id === activeLayer.id ? { ...l, fill: val } : l))
                        );
                      }}
                      className="w-7 h-7 rounded border border-emerald-800 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={(activeLayer as TextLayer).fill}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLayers((prev) =>
                          prev.map((l) => (l.id === activeLayer.id ? { ...l, fill: val } : l))
                        );
                      }}
                      className="w-20 bg-black border border-emerald-900 text-xs px-1.5 py-0.5 rounded text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Stroke / Outline */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-950">
                <div>
                  <label className="text-[10px] text-emerald-500 block mb-1 font-bold">
                    Stroke Width ({(activeLayer as TextLayer).strokeWidth || 0}px)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={(activeLayer as TextLayer).strokeWidth || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setLayers((prev) =>
                        prev.map((l) => (l.id === activeLayer.id ? { ...l, strokeWidth: val } : l))
                      );
                    }}
                    className="w-full accent-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-emerald-500 block mb-1 font-bold">
                    Stroke Color
                  </label>
                  <input
                    type="color"
                    value={(activeLayer as TextLayer).stroke || '#000000'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLayers((prev) =>
                        prev.map((l) => (l.id === activeLayer.id ? { ...l, stroke: val } : l))
                      );
                    }}
                    className="w-7 h-7 rounded border border-emerald-800 bg-transparent cursor-pointer"
                  />
                </div>
              </div>

              {/* Shadow */}
              <div>
                <label className="text-[10px] text-emerald-500 block mb-1 font-bold">
                  Shadow Blur ({(activeLayer as TextLayer).shadowBlur || 0}px)
                </label>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={(activeLayer as TextLayer).shadowBlur || 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setLayers((prev) =>
                      prev.map((l) => (l.id === activeLayer.id ? { ...l, shadowBlur: val } : l))
                    );
                  }}
                  className="w-full accent-emerald-400"
                />
              </div>
            </div>
          )}

          {/* Shape Layer Properties */}
          {activeLayer.type === 'shape' && (
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-emerald-500 block mb-1 font-bold">
                  Fill Color
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={(activeLayer as ShapeLayer).fill}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLayers((prev) =>
                        prev.map((l) => (l.id === activeLayer.id ? { ...l, fill: val } : l))
                      );
                    }}
                    className="w-8 h-8 rounded border border-emerald-800 bg-transparent cursor-pointer"
                  />
                  <span className="text-white">{(activeLayer as ShapeLayer).fill}</span>
                </div>
              </div>
            </div>
          )}

          {/* Common Layer Properties: Opacity & Rotation */}
          <div className="pt-2 border-t border-emerald-950 space-y-2">
            <div>
              <label className="text-[10px] text-emerald-500 block mb-1">
                Opacity ({Math.round(activeLayer.opacity * 100)}%)
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={activeLayer.opacity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setLayers((prev) =>
                    prev.map((l) => (l.id === activeLayer.id ? { ...l, opacity: val } : l))
                  );
                }}
                className="w-full accent-emerald-400"
              />
            </div>

            <div>
              <label className="text-[10px] text-emerald-500 block mb-1">
                Rotation ({activeLayer.rotation}°)
              </label>
              <input
                type="range"
                min="-180"
                max="180"
                value={activeLayer.rotation}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setLayers((prev) =>
                    prev.map((l) => (l.id === activeLayer.id ? { ...l, rotation: val } : l))
                  );
                }}
                className="w-full accent-emerald-400"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
