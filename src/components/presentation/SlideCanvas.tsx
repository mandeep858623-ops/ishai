import React, { useState, useRef, useEffect } from 'react';
import { SlideData, SlideElement } from './types';
import { ThemeColors } from './themeConfig';

interface SlideCanvasProps {
  slide: SlideData;
  theme: ThemeColors;
  selectedElementId: string | null;
  onSelectElement: (elementId: string | null) => void;
  onUpdateElement: (elementId: string, updates: Partial<SlideElement>) => void;
  onDeleteElement: (elementId: string) => void;
  zoom?: number; // e.g. 100 for 100%
  readOnly?: boolean;
}

export const SlideCanvas: React.FC<SlideCanvasProps> = ({
  slide,
  theme,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  zoom = 100,
  readOnly = false,
}) => {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Dragging state
  const [draggingElId, setDraggingElId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ mouseX: number; mouseY: number; elX: number; elY: number } | null>(null);

  // Resizing state
  const [resizingHandle, setResizingHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{
    mouseX: number;
    mouseY: number;
    elX: number;
    elY: number;
    elW: number;
    elH: number;
  } | null>(null);

  // Global mouse move & up handlers for smooth dragging & resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();

      // Handle element move
      if (draggingElId && dragStart) {
        const deltaXPercent = ((e.clientX - dragStart.mouseX) / rect.width) * 100;
        const deltaYPercent = ((e.clientY - dragStart.mouseY) / rect.height) * 100;

        const newX = Math.max(0, Math.min(95, Math.round((dragStart.elX + deltaXPercent) * 10) / 10));
        const newY = Math.max(0, Math.min(95, Math.round((dragStart.elY + deltaYPercent) * 10) / 10));

        onUpdateElement(draggingElId, { x: newX, y: newY });
      }

      // Handle element resize
      if (resizingHandle && resizeStart && selectedElementId) {
        const deltaXPercent = ((e.clientX - resizeStart.mouseX) / rect.width) * 100;
        const deltaYPercent = ((e.clientY - resizeStart.mouseY) / rect.height) * 100;

        let newW = resizeStart.elW;
        let newH = resizeStart.elH;
        let newX = resizeStart.elX;
        let newY = resizeStart.elY;

        if (resizingHandle === 'se') {
          newW = Math.max(5, Math.min(100 - resizeStart.elX, resizeStart.elW + deltaXPercent));
          newH = Math.max(4, Math.min(100 - resizeStart.elY, resizeStart.elH + deltaYPercent));
        } else if (resizingHandle === 'sw') {
          const proposedW = resizeStart.elW - deltaXPercent;
          if (proposedW >= 5) {
            newX = Math.max(0, resizeStart.elX + deltaXPercent);
            newW = proposedW;
          }
          newH = Math.max(4, Math.min(100 - resizeStart.elY, resizeStart.elH + deltaYPercent));
        } else if (resizingHandle === 'ne') {
          newW = Math.max(5, Math.min(100 - resizeStart.elX, resizeStart.elW + deltaXPercent));
          const proposedH = resizeStart.elH - deltaYPercent;
          if (proposedH >= 4) {
            newY = Math.max(0, resizeStart.elY + deltaYPercent);
            newH = proposedH;
          }
        } else if (resizingHandle === 'nw') {
          const proposedW = resizeStart.elW - deltaXPercent;
          if (proposedW >= 5) {
            newX = Math.max(0, resizeStart.elX + deltaXPercent);
            newW = proposedW;
          }
          const proposedH = resizeStart.elH - deltaYPercent;
          if (proposedH >= 4) {
            newY = Math.max(0, resizeStart.elY + deltaYPercent);
            newH = proposedH;
          }
        }

        onUpdateElement(selectedElementId, {
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
          w: Math.round(newW * 10) / 10,
          h: Math.round(newH * 10) / 10,
        });
      }
    };

    const handleMouseUp = () => {
      setDraggingElId(null);
      setDragStart(null);
      setResizingHandle(null);
      setResizeStart(null);
    };

    if (draggingElId || resizingHandle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingElId, dragStart, resizingHandle, resizeStart, selectedElementId, onUpdateElement]);

  // Keyboard shortcut to delete selected element
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly || editingTextId) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        // Prevent deleting if typing inside an input/textarea
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
          return;
        }
        e.preventDefault();
        onDeleteElement(selectedElementId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, editingTextId, readOnly, onDeleteElement]);

  // Determine slide background
  const slideBg = slide.bgColor || theme.canvasBg;

  const elements = slide.elements || [];

  return (
    <div className="w-full flex items-center justify-center p-2 sm:p-4 select-none overflow-hidden">
      <div
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'center center',
          transition: 'transform 0.15s ease',
        }}
        className="w-full max-w-[940px] shadow-2xl rounded-lg overflow-hidden border border-emerald-950/80"
      >
        {/* 16:9 Aspect Ratio Container */}
        <div
          ref={canvasRef}
          onClick={(e) => {
            // Clicking directly on canvas background deselects element
            if (e.target === canvasRef.current) {
              onSelectElement(null);
              setEditingTextId(null);
            }
          }}
          style={{
            background: slideBg,
          }}
          className="relative w-full aspect-[16/9] overflow-hidden cursor-default transition-all"
        >
          {/* Subtle grid lines background overlay for presentation guidance */}
          <div
            className="absolute inset-0 pointer-events-none opacity-5"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Render Elements */}
          {elements.map((el) => {
            const isSelected = selectedElementId === el.id;
            const isEditing = editingTextId === el.id;

            return (
              <div
                key={el.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement(el.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (el.type === 'text' && !readOnly) {
                    setEditingTextId(el.id);
                  }
                }}
                onMouseDown={(e) => {
                  if (readOnly || isEditing) return;
                  if (e.button !== 0) return; // only left click
                  e.stopPropagation();
                  onSelectElement(el.id);
                  setDraggingElId(el.id);
                  setDragStart({
                    mouseX: e.clientX,
                    mouseY: e.clientY,
                    elX: el.x,
                    elY: el.y,
                  });
                }}
                style={{
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  width: `${el.w}%`,
                  height: `${el.h}%`,
                  zIndex: el.zIndex || (isSelected ? 20 : 5),
                }}
                className={`absolute group transition-shadow ${
                  !readOnly ? 'cursor-move' : ''
                } ${
                  isSelected && !readOnly
                    ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-black/50 shadow-lg'
                    : 'hover:outline hover:outline-1 hover:outline-emerald-500/40'
                }`}
              >
                {/* --- ELEMENT TYPE 1: SHAPE --- */}
                {el.type === 'shape' && (
                  <div
                    style={{
                      backgroundColor: el.fillColor || theme.cardBg,
                      borderColor: el.borderColor || theme.cardBorder,
                      borderWidth: el.borderWidth !== undefined ? `${el.borderWidth}px` : '1px',
                      borderRadius:
                        el.shapeType === 'circle'
                          ? '9999px'
                          : el.shapeType === 'card'
                          ? '8px'
                          : el.shapeType === 'roundRect'
                          ? '6px'
                          : '0px',
                      opacity: el.opacity !== undefined ? el.opacity : 1,
                    }}
                    className="w-full h-full shadow-md backdrop-blur-xs flex items-center justify-center overflow-hidden"
                  >
                    {el.shapeType === 'line' && (
                      <div
                        style={{ backgroundColor: el.fillColor || theme.accent }}
                        className="w-full h-full"
                      />
                    )}
                  </div>
                )}

                {/* --- ELEMENT TYPE 2: IMAGE --- */}
                {el.type === 'image' && (
                  <div
                    style={{
                      borderRadius: el.borderRadius ? `${el.borderRadius}px` : '6px',
                    }}
                    className="w-full h-full overflow-hidden bg-black/40 border border-emerald-950 flex items-center justify-center"
                  >
                    {el.imageUrl ? (
                      <img
                        src={el.imageUrl}
                        alt={el.imageAlt || 'Slide visual illustration'}
                        style={{ objectFit: el.objectFit || 'cover' }}
                        className="w-full h-full pointer-events-none transition-opacity duration-300"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.failed) {
                            target.dataset.failed = 'true';
                            target.src = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80';
                          }
                        }}
                      />
                    ) : (
                      <div className="text-zinc-500 text-xs flex flex-col items-center gap-1 font-mono">
                        <span>🖼️ Click to add Image</span>
                      </div>
                    )}
                  </div>
                )}

                {/* --- ELEMENT TYPE 3: TEXT --- */}
                {el.type === 'text' && (
                  <div className="w-full h-full overflow-hidden flex flex-col justify-start">
                    {isEditing ? (
                      <textarea
                        autoFocus
                        value={el.content || ''}
                        onChange={(e) => onUpdateElement(el.id, { content: e.target.value })}
                        onBlur={() => setEditingTextId(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setEditingTextId(null);
                        }}
                        style={{
                          fontSize: el.fontSize ? `${Math.max(10, el.fontSize * 0.72)}px` : '14px',
                          color: el.color || theme.textColor,
                          fontWeight: el.fontWeight || 'normal',
                          fontStyle: el.fontStyle || 'normal',
                          textAlign: el.align || 'left',
                          fontFamily: el.fontFamily || 'inherit',
                        }}
                        className="w-full h-full bg-black/90 border border-emerald-400 p-1.5 rounded text-white resize-none outline-none leading-relaxed"
                      />
                    ) : (
                      <div
                        style={{
                          fontSize: el.fontSize ? `${Math.max(10, el.fontSize * 0.72)}px` : '14px',
                          color: el.color || theme.textColor,
                          fontWeight: el.fontWeight || 'normal',
                          fontStyle: el.fontStyle || 'normal',
                          textAlign: el.align || 'left',
                          fontFamily: el.fontFamily || 'inherit',
                        }}
                        className="w-full h-full whitespace-pre-wrap break-words leading-relaxed select-none pointer-events-none"
                      >
                        {el.content || 'Double click to edit text'}
                      </div>
                    )}
                  </div>
                )}

                {/* --- RESIZE HANDLES (When selected and not readOnly) --- */}
                {isSelected && !readOnly && !isEditing && (
                  <>
                    {/* Top-Left Handle */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setResizingHandle('nw');
                        setResizeStart({
                          mouseX: e.clientX,
                          mouseY: e.clientY,
                          elX: el.x,
                          elY: el.y,
                          elW: el.w,
                          elH: el.h,
                        });
                      }}
                      className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-emerald-400 border border-black rounded-xs cursor-nwse-resize shadow-md"
                    />

                    {/* Top-Right Handle */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setResizingHandle('ne');
                        setResizeStart({
                          mouseX: e.clientX,
                          mouseY: e.clientY,
                          elX: el.x,
                          elY: el.y,
                          elW: el.w,
                          elH: el.h,
                        });
                      }}
                      className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-emerald-400 border border-black rounded-xs cursor-nesw-resize shadow-md"
                    />

                    {/* Bottom-Left Handle */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setResizingHandle('sw');
                        setResizeStart({
                          mouseX: e.clientX,
                          mouseY: e.clientY,
                          elX: el.x,
                          elY: el.y,
                          elW: el.w,
                          elH: el.h,
                        });
                      }}
                      className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-emerald-400 border border-black rounded-xs cursor-nesw-resize shadow-md"
                    />

                    {/* Bottom-Right Handle */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setResizingHandle('se');
                        setResizeStart({
                          mouseX: e.clientX,
                          mouseY: e.clientY,
                          elX: el.x,
                          elY: el.y,
                          elW: el.w,
                          elH: el.h,
                        });
                      }}
                      className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-emerald-400 border border-black rounded-xs cursor-nwse-resize shadow-md"
                    />

                    {/* Quick Delete Floating Pill */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteElement(el.id);
                      }}
                      className="absolute -top-6 right-0 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 text-[9px] shadow-md flex items-center justify-center font-bold px-1.5 cursor-pointer"
                      title="Delete Element (Del)"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
