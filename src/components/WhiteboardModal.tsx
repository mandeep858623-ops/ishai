import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Tldraw, 
  Editor, 
  createShapeId, 
  DefaultColorStyle, 
  DefaultSizeStyle, 
  DefaultFillStyle 
} from 'tldraw';
import 'tldraw/tldraw.css';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  Search, 
  Sparkles, 
  Download, 
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layout,
  FileText,
  Lightbulb,
  Network,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  MousePointer,
  PenTool,
  Highlighter,
  Eraser,
  StickyNote,
  Type,
  Square,
  Circle,
  ArrowRight,
  Minus,
  Hand,
  Check,
  AlertTriangle,
  Sun,
  Moon,
  HelpCircle,
  Layers,
  Share2,
  FileDown
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { soundEngine } from '../utils/audio';
import { generateAiCompletion } from '../utils/aiClient';
import { WHITEBOARD_TEMPLATES, TemplateDefinition } from './Whiteboard/templates';
import { toRichText, extractShapeText, sanitizeSnapshot } from './Whiteboard/whiteboardUtils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface WhiteboardBoard {
  id: string;
  title: string;
  preview?: string;
  data: any;
  updatedAt: any;
  createdAt: any;
  userId: string;
}

interface WhiteboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  writeLog: (text: string, tag?: string) => void;
  userId: string;
  theme: 'dark' | 'light';
}

type ActiveCanvasTool = 
  | 'select' 
  | 'hand' 
  | 'draw' 
  | 'highlight' 
  | 'eraser' 
  | 'note' 
  | 'text' 
  | 'rectangle' 
  | 'ellipse' 
  | 'arrow' 
  | 'line';

const COLOR_SWATCHES = [
  { name: 'Cyan', tldrawColor: 'light-blue', hex: '#06b6d4' },
  { name: 'Electric Blue', tldrawColor: 'blue', hex: '#3b82f6' },
  { name: 'Violet', tldrawColor: 'violet', hex: '#8b5cf6' },
  { name: 'Emerald', tldrawColor: 'green', hex: '#10b981' },
  { name: 'Amber', tldrawColor: 'yellow', hex: '#f59e0b' },
  { name: 'Rose', tldrawColor: 'red', hex: '#ef4444' },
  { name: 'Grey', tldrawColor: 'grey', hex: '#64748b' },
  { name: 'Black/White', tldrawColor: 'black', hex: '#e2e8f0' },
];

export const WhiteboardModal: React.FC<WhiteboardModalProps> = ({
  isOpen,
  onClose,
  writeLog,
  userId,
  theme: appTheme
}) => {
  // Theme state: allows in-whiteboard toggle as well as inheriting app theme
  const [boardTheme, setBoardTheme] = useState<'dark' | 'light'>(appTheme);
  const [boards, setBoards] = useState<WhiteboardBoard[]>([]);
  const [activeBoard, setActiveBoard] = useState<WhiteboardBoard | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals & Panels
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showAskModal, setShowAskModal] = useState(false);
  const [askQuery, setAskQuery] = useState('');
  const [askResponse, setAskResponse] = useState<string | null>(null);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [activePaletteTool, setActivePaletteTool] = useState<ActiveCanvasTool>('select');
  const [currentColor, setCurrentColor] = useState('blue');
  const [currentStrokeSize, setCurrentStrokeSize] = useState<'s' | 'm' | 'l'>('m');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const editorRef = useRef<Editor | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const storageKey = useMemo(() => `ISHAI_Whiteboards_Cache_${userId || 'guest'}`, [userId]);

  // Sync with prop if it updates
  useEffect(() => {
    setBoardTheme(appTheme);
  }, [appTheme]);

  // 1. Fetch & Sync Boards (Firebase + LocalStorage fallback)
  useEffect(() => {
    if (!isOpen) return;

    // Load initial local cache for instantaneous rendering
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitizedBoards = parsed.map((b: any) => ({
            ...b,
            data: sanitizeSnapshot(b.data),
          }));
          setBoards(sanitizedBoards);
          if (!activeBoard) {
            setActiveBoard(sanitizedBoards[0]);
          }
        }
      }
    } catch (e) {
      console.warn('Local board cache load error:', e);
    }

    // Connect to Firestore only if Firebase Auth UID matches userId
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      return;
    }

    const q = query(
      collection(db, 'whiteboards'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded = snapshot.docs.map((docSnap) => {
          const docData = docSnap.data();
          return {
            id: docSnap.id,
            ...docData,
            data: sanitizeSnapshot(docData.data),
          };
        }) as WhiteboardBoard[];

        if (loaded.length > 0) {
          setBoards(loaded);
          // Persist to local cache for offline resiliency
          try {
            localStorage.setItem(storageKey, JSON.stringify(loaded));
          } catch {}

          if (!activeBoard) {
            setActiveBoard(loaded[0]);
          } else {
            // Update active board if changed externally
            const matched = loaded.find((b) => b.id === activeBoard.id);
            if (matched && matched.title !== activeBoard.title) {
              setActiveBoard(matched);
            }
          }
        }
      },
      (error) => {
        console.warn('Firestore subscription notice (using local offline cache):', error);
      }
    );

    return () => unsubscribe();
  }, [isOpen, userId, storageKey]);

  // 2. Editor Mount & Initialization
  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor;

    // Apply color scheme
    editor.user.updateUserPreferences({ colorScheme: boardTheme });

    // Load active board snapshot if present (sanitized for tldraw v3)
    if (activeBoard?.data && Object.keys(activeBoard.data).length > 0) {
      try {
        const sanitized = sanitizeSnapshot(activeBoard.data);
        if (sanitized && (sanitized.store || (sanitized.document && sanitized.document.store))) {
          editor.loadSnapshot(sanitized);
        }
      } catch (err) {
        console.warn('Could not load snapshot directly:', err);
      }
    }

    // Set initial tool
    editor.setCurrentTool('select');
    setActivePaletteTool('select');

    // Zoom change listener
    const updateZoom = () => {
      const z = Math.round(editor.getZoomLevel() * 100);
      setZoomLevel(z);
    };
    updateZoom();

    // Change listener for auto-save
    const handleChange = () => {
      updateZoom();
      setSaveStatus('saving');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        performSave();
      }, 3000); // 3s debounce for auto-save
    };

    editor.on('change', handleChange);
    return () => {
      editor.off('change', handleChange);
    };
  }, [activeBoard, boardTheme]);

  // Sync board theme with editor when toggled
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.user.updateUserPreferences({ colorScheme: boardTheme });
    }
  }, [boardTheme]);

  // 3. Save Board Routine
  const performSave = async () => {
    if (!editorRef.current || !activeBoard) return;

    try {
      setSaveStatus('saving');
      const snapshot = editorRef.current.getSnapshot();
      const updatedTimestamp = new Date().toISOString();

      // Update in-memory state
      const updatedBoard: WhiteboardBoard = {
        ...activeBoard,
        data: snapshot,
        updatedAt: updatedTimestamp,
      };

      setActiveBoard(updatedBoard);

      setBoards((prev) => {
        const updatedList = prev.map((b) => (b.id === activeBoard.id ? updatedBoard : b));
        try {
          localStorage.setItem(storageKey, JSON.stringify(updatedList));
        } catch {}
        return updatedList;
      });

      // If user is authenticated in Firebase, sync with Firestore
      if (auth.currentUser && auth.currentUser.uid === userId) {
        try {
          await updateDoc(doc(db, 'whiteboards', activeBoard.id), {
            data: snapshot,
            updatedAt: serverTimestamp(),
          });
        } catch (fbErr) {
          console.warn('Firestore remote sync deferred, cached locally:', fbErr);
        }
      }

      setSaveStatus('saved');
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Error during auto-save:', err);
      setSaveStatus('error');
    }
  };

  // 4. Create Board
  const createNewBoard = async (
    title: string = 'Untitled Board', 
    templateShapes?: any[]
  ) => {
    soundEngine.playClick();
    const newId = `board_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const newBoard: WhiteboardBoard = {
      id: newId,
      title,
      userId: userId || 'guest',
      data: {},
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Update locally first for instant reaction
    setBoards((prev) => {
      const next = [newBoard, ...prev];
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      return next;
    });

    setActiveBoard(newBoard);
    setShowTemplatesModal(false);
    writeLog(`Created new board: "${title}"`, 'WHITEBOARD');

    // If authenticated in Firebase, push to Firestore
    if (auth.currentUser && auth.currentUser.uid === userId) {
      try {
        const docRef = await addDoc(collection(db, 'whiteboards'), {
          title,
          userId,
          data: {},
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        // Sync generated Firestore ID
        newBoard.id = docRef.id;
        setActiveBoard({ ...newBoard });
      } catch (err) {
        console.warn('Firestore create deferred, using local board:', err);
      }
    }

    // Inject template shapes if requested
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.selectAll();
        editorRef.current.deleteShapes(editorRef.current.getSelectedShapeIds());
        if (templateShapes && templateShapes.length > 0) {
          editorRef.current.createShapes(templateShapes);
          editorRef.current.zoomToFit();
        }
        performSave();
      }
    }, 150);
  };

  // 5. Delete Board
  const deleteBoard = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this board? This action cannot be undone.')) return;

    soundEngine.playClick();
    const remaining = boards.filter((b) => b.id !== id);
    setBoards(remaining);

    try {
      localStorage.setItem(storageKey, JSON.stringify(remaining));
    } catch {}

    if (activeBoard?.id === id) {
      setActiveBoard(remaining.length > 0 ? remaining[0] : null);
    }

    if (auth.currentUser && auth.currentUser.uid === userId) {
      try {
        await deleteDoc(doc(db, 'whiteboards', id));
      } catch (err) {
        console.warn('Firestore delete deferred:', err);
      }
    }

    writeLog('Whiteboard deleted.', 'WHITEBOARD');
  };

  // 6. Duplicate Board
  const duplicateBoard = (board: WhiteboardBoard, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    createNewBoard(`${board.title} (Copy)`);
    setTimeout(() => {
      if (editorRef.current && board.data) {
        const sanitized = sanitizeSnapshot(board.data);
        editorRef.current.loadSnapshot(sanitized);
        performSave();
      }
    }, 200);
  };

  // 7. Rename Board
  const handleRenameSubmit = async () => {
    if (!isRenaming || !renameTitle.trim()) {
      setIsRenaming(null);
      return;
    }

    const updatedTitle = renameTitle.trim();
    setBoards((prev) => {
      const next = prev.map((b) => (b.id === isRenaming ? { ...b, title: updatedTitle } : b));
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      return next;
    });

    if (activeBoard?.id === isRenaming) {
      setActiveBoard((prev) => (prev ? { ...prev, title: updatedTitle } : null));
    }

    if (auth.currentUser && auth.currentUser.uid === userId) {
      try {
        await updateDoc(doc(db, 'whiteboards', isRenaming), {
          title: updatedTitle,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn('Firestore rename sync deferred:', e);
      }
    }

    setIsRenaming(null);
    soundEngine.playSuccess();
    writeLog(`Board renamed to: "${updatedTitle}"`, 'WHITEBOARD');
  };

  // 8. Tool Palette Controller
  const selectPaletteTool = (tool: ActiveCanvasTool) => {
    soundEngine.playClick();
    setActivePaletteTool(tool);
    if (!editorRef.current) return;

    switch (tool) {
      case 'select':
        editorRef.current.setCurrentTool('select');
        break;
      case 'hand':
        editorRef.current.setCurrentTool('hand');
        break;
      case 'draw':
        editorRef.current.setCurrentTool('draw');
        editorRef.current.setStyleForNextShapes(DefaultColorStyle, currentColor as any);
        editorRef.current.setStyleForNextShapes(DefaultSizeStyle, currentStrokeSize);
        break;
      case 'highlight':
        editorRef.current.setCurrentTool('highlight');
        editorRef.current.setStyleForNextShapes(DefaultColorStyle, currentColor as any);
        break;
      case 'eraser':
        editorRef.current.setCurrentTool('eraser');
        break;
      case 'note':
        editorRef.current.setCurrentTool('note');
        editorRef.current.setStyleForNextShapes(DefaultColorStyle, currentColor as any);
        break;
      case 'text':
        editorRef.current.setCurrentTool('text');
        editorRef.current.setStyleForNextShapes(DefaultColorStyle, currentColor as any);
        break;
      case 'rectangle':
        editorRef.current.setCurrentTool('geo');
        editorRef.current.setStyleForNextShapes(DefaultFillStyle, 'semi');
        editorRef.current.setStyleForNextShapes(DefaultColorStyle, currentColor as any);
        break;
      case 'ellipse':
        editorRef.current.setCurrentTool('geo');
        editorRef.current.setStyleForNextShapes(DefaultFillStyle, 'semi');
        editorRef.current.setStyleForNextShapes(DefaultColorStyle, currentColor as any);
        break;
      case 'arrow':
        editorRef.current.setCurrentTool('arrow');
        editorRef.current.setStyleForNextShapes(DefaultColorStyle, currentColor as any);
        break;
      case 'line':
        editorRef.current.setCurrentTool('line');
        editorRef.current.setStyleForNextShapes(DefaultColorStyle, currentColor as any);
        break;
    }
  };

  const applyColor = (colorName: string) => {
    setCurrentColor(colorName);
    soundEngine.playClick();
    if (!editorRef.current) return;
    editorRef.current.setStyleForNextShapes(DefaultColorStyle, colorName as any);
    if (editorRef.current.getSelectedShapeIds().length > 0) {
      editorRef.current.setStyleForSelectedShapes(DefaultColorStyle, colorName as any);
    }
  };

  const applyStrokeSize = (size: 's' | 'm' | 'l') => {
    setCurrentStrokeSize(size);
    soundEngine.playClick();
    if (!editorRef.current) return;
    editorRef.current.setStyleForNextShapes(DefaultSizeStyle, size);
    if (editorRef.current.getSelectedShapeIds().length > 0) {
      editorRef.current.setStyleForSelectedShapes(DefaultSizeStyle, size);
    }
  };

  // 9. Clear Canvas
  const handleClearCanvas = () => {
    if (!editorRef.current) return;
    soundEngine.playClick();
    const shapes = editorRef.current.getCurrentPageShapes();
    if (shapes.length > 0) {
      editorRef.current.deleteShapes(shapes.map((s) => s.id));
      performSave();
      writeLog('Canvas cleared completely.', 'WHITEBOARD');
    }
    setShowClearConfirm(false);
  };

  // 10. Extract Text / Visual Data Helper
  const getVisibleBoardText = (): string => {
    if (!editorRef.current) return '';
    const shapes = editorRef.current.getCurrentPageShapes();
    const texts: string[] = [];

    shapes.forEach((s: any) => {
      const txt = extractShapeText(s);
      if (txt) texts.push(txt);
    });

    return texts.join('\n');
  };

  // 11. AI SMART ACTIONS
  // A. Explain My Board
  const handleExplainBoard = async () => {
    const textContent = getVisibleBoardText();
    if (!textContent.trim()) {
      writeLog('Board is empty. Add notes or diagrams first.', 'WARNING');
      return;
    }

    try {
      setIsAiLoading(true);
      setAiMessage('Analyzing diagrams, notes, and workflows...');
      soundEngine.playClick();
      writeLog('AI is synthesizing whiteboard contents...', 'INTELLIGENCE');

      const summary = await generateAiCompletion({
        systemInstruction: `You are ISHAI Whiteboard Architect. Analyze the provided board elements, notes, and architecture diagrams. 
Produce a high-impact executive summary:
1. Core Objective & Scope
2. Key Components / Threads
3. Critical Insights & Potential Next Steps
Keep formatting concise, elegant, and directly usable on a digital canvas.`,
        prompt: `Whiteboard Content Snapshot:\n${textContent}`,
      });

      // Place editable AI Summary card on canvas
      if (editorRef.current) {
        const bounds = editorRef.current.getViewportPageBounds();
        const centerX = bounds.minX + bounds.width / 2;
        const centerY = bounds.minY + bounds.height / 2;

        editorRef.current.createShapes([
          {
            id: createShapeId(),
            type: 'note',
            x: centerX - 120,
            y: centerY - 100,
            props: {
              richText: toRichText(`✨ AI BOARD SYNTHESIS:\n\n${summary.slice(0, 400)}...`),
              color: 'violet',
              size: 'm',
            } as any,
          },
        ]);
        performSave();
      }

      writeLog('AI Board Explanation created on canvas.', 'SUCCESS');
    } catch (err: any) {
      writeLog(`AI analysis failed: ${err?.message || 'Server busy'}`, 'ERROR');
    } finally {
      setIsAiLoading(false);
      setAiMessage(null);
    }
  };

  // B. Organize Ideas into Columns
  const handleOrganizeIdeas = async () => {
    const textContent = getVisibleBoardText();
    if (!textContent.trim()) {
      writeLog('No text items found to organize.', 'WARNING');
      return;
    }

    try {
      setIsAiLoading(true);
      setAiMessage('Structuring and organizing scattered notes...');
      soundEngine.playClick();
      writeLog('AI organizing whiteboard notes into structured clusters...', 'INTELLIGENCE');

      const organizedJson = await generateAiCompletion({
        systemInstruction: `You are an information architect. Group the provided thoughts, tasks, and notes into 3 to 4 coherent themes or priorities.
Return STRICT JSON array only in this format:
[
  { "category": "Category Title", "items": ["Item 1", "Item 2"] }
]`,
        prompt: `Notes on board:\n${textContent}`,
      });

      const cleanJson = organizedJson.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (Array.isArray(parsed) && editorRef.current) {
        const bounds = editorRef.current.getViewportPageBounds();
        const startX = bounds.minX + 80;
        const startY = bounds.minY + 80;

        const colors = ['light-blue', 'violet', 'green', 'orange'];
        const newShapes: any[] = [];

        parsed.forEach((col: any, colIdx: number) => {
          const colX = startX + colIdx * 300;
          const colColor = colors[colIdx % colors.length];

          // Column Header Box
          newShapes.push({
            id: createShapeId(),
            type: 'geo',
            x: colX,
            y: startY,
            props: {
              geo: 'rectangle',
              w: 260,
              h: 60,
              richText: toRichText(col.category.toUpperCase()),
              color: colColor,
              fill: 'semi',
              size: 's',
            } as any,
          });

          // Items
          if (Array.isArray(col.items)) {
            col.items.forEach((itemText: string, itemIdx: number) => {
              newShapes.push({
                id: createShapeId(),
                type: 'note',
                x: colX + 10,
                y: startY + 80 + itemIdx * 130,
                props: {
                  richText: toRichText(itemText),
                  color: colColor,
                  size: 's',
                } as any,
              });
            });
          }
        });

        editorRef.current.createShapes(newShapes);
        performSave();
        writeLog('Organized ideas placed in structured clusters.', 'SUCCESS');
      }
    } catch (err: any) {
      writeLog(`Could not organize notes automatically: ${err.message}`, 'ERROR');
    } finally {
      setIsAiLoading(false);
      setAiMessage(null);
    }
  };

  // C. Create Mind Map
  const handleCreateMindMapPrompt = async () => {
    const topic = prompt('Enter a topic or project to map out with AI (e.g. "Space Tourism 2030", "Product Launch"):');
    if (!topic || !topic.trim()) return;

    try {
      setIsAiLoading(true);
      setAiMessage(`Constructing mind map for "${topic}"...`);
      soundEngine.playClick();
      writeLog(`AI generating mind map hierarchy for: "${topic}"...`, 'INTELLIGENCE');

      const response = await generateAiCompletion({
        systemInstruction: `You are an expert systems thinker and mind-map architect.
Given a topic, generate a radial mind map with 1 central concept and 4 to 5 main branch nodes, each having 1 to 2 child sub-points.
Return a STRICT JSON array of nodes:
[
  { "id": "root", "text": "MAIN TOPIC", "parentId": null },
  { "id": "b1", "text": "Branch 1 Title", "parentId": "root" },
  { "id": "b1_1", "text": "Sub-point A", "parentId": "b1" }
]`,
        prompt: `Create a comprehensive mind map for: ${topic}`,
      });

      const cleanJson = response.replace(/```json|```/g, '').trim();
      const nodes = JSON.parse(cleanJson);

      if (Array.isArray(nodes) && editorRef.current) {
        const bounds = editorRef.current.getViewportPageBounds();
        const rootX = bounds.minX + bounds.width / 2;
        const rootY = bounds.minY + bounds.height / 2;

        const shapes: any[] = [];
        const nodePositions = new Map<string, { id: any; x: number; y: number }>();

        // Place Root
        const rootNode = nodes.find((n: any) => !n.parentId) || nodes[0];
        const rootShapeId = createShapeId();
        nodePositions.set(rootNode.id, { id: rootShapeId, x: rootX, y: rootY });

        shapes.push({
          id: rootShapeId,
          type: 'geo',
          x: rootX - 120,
          y: rootY - 45,
          props: {
            geo: 'rectangle',
            w: 240,
            h: 90,
            richText: toRichText(rootNode.text),
            color: 'violet',
            fill: 'semi',
            size: 'm',
          } as any,
        });

        // Place Child Branches Radially
        const branches = nodes.filter((n: any) => n.parentId === rootNode.id);
        const angleStep = (2 * Math.PI) / (branches.length || 1);
        const radius = 320;

        branches.forEach((branch: any, i: number) => {
          const angle = i * angleStep;
          const bx = rootX + Math.cos(angle) * radius;
          const by = rootY + Math.sin(angle) * (radius * 0.75);
          const bShapeId = createShapeId();
          nodePositions.set(branch.id, { id: bShapeId, x: bx, y: by });

          shapes.push({
            id: bShapeId,
            type: 'geo',
            x: bx - 90,
            y: by - 35,
            props: {
              geo: 'rectangle',
              w: 180,
              h: 70,
              richText: toRichText(branch.text),
              color: i % 2 === 0 ? 'light-blue' : 'blue',
              fill: 'semi',
              size: 's',
            } as any,
          });

          // Connector arrow from root
          shapes.push({
            id: createShapeId(),
            type: 'arrow',
            props: {
              start: { type: 'binding', boundShapeId: rootShapeId, normalizedAnchor: { x: 0.5, y: 0.5 }, isExact: false },
              end: { type: 'binding', boundShapeId: bShapeId, normalizedAnchor: { x: 0.5, y: 0.5 }, isExact: false },
              color: 'grey',
              dash: 'draw',
            } as any,
          });

          // Sub-nodes
          const subNodes = nodes.filter((n: any) => n.parentId === branch.id);
          subNodes.forEach((sub: any, subIdx: number) => {
            const subX = bx + (Math.cos(angle) > 0 ? 160 : -160);
            const subY = by + (subIdx === 0 ? -40 : 40);
            const subShapeId = createShapeId();

            shapes.push({
              id: subShapeId,
              type: 'note',
              x: subX - 60,
              y: subY - 40,
              props: {
                richText: toRichText(sub.text),
                color: 'green',
                size: 's',
              } as any,
            });

            // Arrow to sub-node
            shapes.push({
              id: createShapeId(),
              type: 'arrow',
              props: {
                start: { type: 'binding', boundShapeId: bShapeId, normalizedAnchor: { x: 0.5, y: 0.5 }, isExact: false },
                end: { type: 'binding', boundShapeId: subShapeId, normalizedAnchor: { x: 0.5, y: 0.5 }, isExact: false },
                color: 'grey',
                dash: 'draw',
              } as any,
            });
          });
        });

        editorRef.current.createShapes(shapes);
        editorRef.current.zoomToFit();
        performSave();
        writeLog(`Mind map generated and placed for: "${topic}"`, 'SUCCESS');
      }
    } catch (err: any) {
      writeLog(`Mind map construction failed: ${err.message}`, 'ERROR');
    } finally {
      setIsAiLoading(false);
      setAiMessage(null);
    }
  };

  // D. Real Handwriting to Text via Multimodal Gemini Vision
  const handleConvertHandwriting = async () => {
    soundEngine.playClick();
    const canvasContainer = document.querySelector('.tl-container') as HTMLElement;
    if (!canvasContainer) {
      writeLog('Canvas container unavailable for OCR.', 'ERROR');
      return;
    }

    try {
      setIsAiLoading(true);
      setAiMessage('Scanning handwriting with Gemini Vision...');
      writeLog('Capturing canvas snapshot for multimodal handwriting OCR...', 'VISION');

      // Capture screenshot of canvas layer
      const capturedCanvas = await html2canvas(canvasContainer, {
        backgroundColor: boardTheme === 'dark' ? '#090b0e' : '#ffffff',
        scale: 1.5,
        logging: false,
      });

      const imageBase64 = capturedCanvas.toDataURL('image/jpeg', 0.85);

      // Call our dedicated server endpoint
      const response = await fetch('/api/ai/whiteboard/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType: 'image/jpeg',
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const result = await response.json();
      if (!result.success || !result.text) {
        throw new Error(result.error || 'No readable text or sketch detected.');
      }

      // Insert transcribed text onto canvas as editable objects
      if (editorRef.current) {
        const bounds = editorRef.current.getViewportPageBounds();
        const centerX = bounds.minX + bounds.width / 2;
        const centerY = bounds.minY + bounds.height / 2;

        editorRef.current.createShapes([
          {
            id: createShapeId(),
            type: 'text',
            x: centerX - 100,
            y: centerY - 60,
            props: {
              richText: toRichText(`📝 TRANSCRIBED HANDWRITING:\n${result.text}`),
              color: 'blue',
              size: 'm',
              font: 'sans',
            } as any,
          },
        ]);
        performSave();
      }

      writeLog('Handwriting successfully converted into editable text.', 'SUCCESS');
    } catch (err: any) {
      writeLog(`Handwriting recognition notice: ${err?.message || 'Check canvas readability'}`, 'ERROR');
    } finally {
      setIsAiLoading(false);
      setAiMessage(null);
    }
  };

  // E. Ask About My Board
  const handleAskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askQuery.trim()) return;

    soundEngine.playClick();
    setIsAiLoading(true);
    setAskResponse(null);

    const boardText = getVisibleBoardText();

    try {
      const answer = await generateAiCompletion({
        systemInstruction: `You are ISHAI Whiteboard Assistant. Answer the user's inquiry based strictly on the visible contents, diagrams, and notes from their current whiteboard.
Be direct, helpful, and insightful. If the information isn't present, explain clearly what is currently on the board.`,
        prompt: `BOARD CONTENT:\n${boardText || '[Empty canvas]'}\n\nUSER QUESTION: ${askQuery}`,
      });

      setAskResponse(answer);
    } catch (err: any) {
      setAskResponse(`Error processing query: ${err.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const insertAskResponseToBoard = () => {
    if (!askResponse || !editorRef.current) return;
    soundEngine.playClick();
    const bounds = editorRef.current.getViewportPageBounds();
    editorRef.current.createShapes([
      {
        id: createShapeId(),
        type: 'note',
        x: bounds.minX + bounds.width / 2 - 100,
        y: bounds.minY + bounds.height / 2 - 80,
        props: {
          richText: toRichText(`Q: ${askQuery}\n\nA: ${askResponse}`),
          color: 'blue',
          size: 's',
        } as any,
      },
    ]);
    setShowAskModal(false);
    setAskQuery('');
    setAskResponse(null);
    performSave();
    writeLog('AI Q&A note added to board.', 'SUCCESS');
  };

  // 12. Image Import (File & Drag-and-Drop)
  const handleImageUpload = (file: File) => {
    if (!editorRef.current || !file.type.startsWith('image/')) return;

    soundEngine.playClick();
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // Calculate appropriate scale
        const maxDim = 500;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = (h / w) * maxDim;
            w = maxDim;
          } else {
            w = (w / h) * maxDim;
            h = maxDim;
          }
        }

        const assetId = `asset:${Math.random().toString(36).substring(2, 9)}` as any;
        const bounds = editorRef.current!.getViewportPageBounds();

        // @ts-ignore
        editorRef.current!.createAssets([
          {
            id: assetId,
            type: 'image',
            name: file.name,
            props: {
              src: dataUrl,
              w,
              h,
              mimeType: file.type,
              isAnimated: false,
              name: file.name,
            },
          } as any,
        ]);

        editorRef.current!.createShapes([
          {
            id: createShapeId(),
            type: 'image',
            x: bounds.minX + bounds.width / 2 - w / 2,
            y: bounds.minY + bounds.height / 2 - h / 2,
            props: {
              assetId,
              w,
              h,
            } as any,
          },
        ]);

        performSave();
        writeLog(`Imported image: "${file.name}"`, 'WHITEBOARD');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // 13. Export PNG / PDF
  const exportBoard = async (format: 'png' | 'pdf') => {
    soundEngine.playClick();
    const container = document.querySelector('.tl-container') as HTMLElement;
    if (!container) return;

    try {
      writeLog(`Exporting board as ${format.toUpperCase()}...`, 'SYSTEM');
      setIsAiLoading(true);
      setAiMessage(`Generating high-fidelity ${format.toUpperCase()}...`);

      const canvas = await html2canvas(container, {
        backgroundColor: boardTheme === 'dark' ? '#090b0e' : '#ffffff',
        scale: 2, // High resolution
        logging: false,
      });

      const titleSlug = (activeBoard?.title || 'whiteboard').replace(/[^a-zA-Z0-9_\-]/g, '_');

      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `${titleSlug}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height],
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${titleSlug}.pdf`);
      }

      writeLog(`Board exported successfully as ${format.toUpperCase()}.`, 'SUCCESS');
    } catch (err: any) {
      writeLog(`Export failed: ${err.message}`, 'ERROR');
    } finally {
      setIsAiLoading(false);
      setAiMessage(null);
    }
  };

  // 14. Export JSON
  const handleExportJSON = () => {
    if (!editorRef.current || !activeBoard) return;
    soundEngine.playClick();
    const snapshot = editorRef.current.getSnapshot();
    const payload = JSON.stringify({
      version: '1.0',
      title: activeBoard.title,
      userId,
      createdAt: activeBoard.createdAt,
      data: snapshot,
    }, null, 2);

    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeBoard.title.replace(/\s+/g, '_')}_ishai_board.json`;
    a.click();
    URL.revokeObjectURL(url);
    writeLog('Whiteboard JSON backup exported.', 'SUCCESS');
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex overflow-hidden font-sans select-none transition-colors duration-200 ${
        boardTheme === 'dark' ? 'bg-[#07090c] text-zinc-200' : 'bg-slate-50 text-slate-800'
      }`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handleImageUpload(file);
      }}
    >
      {/* Hidden file input for image upload */}
      <input 
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
        }}
      />

      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR: BOARDS & TEMPLATES */}
      {/* ========================================================================= */}
      <aside 
        className={`transition-all duration-300 flex flex-col z-20 border-r ${
          boardTheme === 'dark' 
            ? 'bg-[#0a0d12] border-zinc-800/80' 
            : 'bg-white border-slate-200'
        } ${isSidebarOpen ? 'w-80' : 'w-0 overflow-hidden'}`}
      >
        {/* Brand Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          boardTheme === 'dark' ? 'border-zinc-800' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Layout className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-xs tracking-wider uppercase flex items-center gap-1.5">
                <span className={boardTheme === 'dark' ? 'text-white' : 'text-slate-900'}>ISHAI</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  STUDIO
                </span>
              </div>
              <p className="text-[10px] text-zinc-500">Infinite Canvas Workspace</p>
            </div>
          </div>

          <button 
            onClick={() => createNewBoard('New Board')}
            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30 active:scale-95 cursor-pointer"
            title="Create New Blank Board"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input 
              type="text"
              placeholder="Search recent boards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none transition-colors border ${
                boardTheme === 'dark' 
                  ? 'bg-zinc-950/70 border-zinc-800 focus:border-cyan-500 text-zinc-200 placeholder:text-zinc-600' 
                  : 'bg-slate-100 border-slate-200 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400'
              }`}
            />
          </div>
        </div>

        {/* Board List (Recent Boards Section with title, last edited, and preview indicator) */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          <div className="px-2 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Recent Boards ({boards.length})</span>
            <span className="text-[9px] text-cyan-500 font-mono">AUTOSYNC</span>
          </div>

          {boards
            .filter((b) => b.title.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((board) => {
              const isActive = activeBoard?.id === board.id;
              const isEditMode = isRenaming === board.id;

              return (
                <div 
                  key={board.id}
                  onClick={() => {
                    if (activeBoard?.id !== board.id) {
                      soundEngine.playClick();
                      setActiveBoard(board);
                    }
                  }}
                  className={`group relative flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all border ${
                    isActive
                      ? boardTheme === 'dark'
                        ? 'bg-indigo-600/15 border-indigo-500/50 text-white shadow-lg shadow-indigo-950/40'
                        : 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-sm'
                      : boardTheme === 'dark'
                      ? 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {/* Miniature Board Preview Icon with gradient */}
                  <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 border relative overflow-hidden ${
                    isActive 
                      ? 'bg-gradient-to-br from-indigo-600/30 to-violet-600/30 border-indigo-500/50 text-cyan-400' 
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-500'
                  }`}>
                    {/* Subtle dot pattern inside miniature preview */}
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:6px_6px]" />
                    <FileText className="w-5 h-5 relative z-10" />
                  </div>

                  {/* Title & Metadata */}
                  <div className="flex-1 min-w-0 pr-1">
                    {isEditMode ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input 
                          autoFocus
                          value={renameTitle}
                          onChange={(e) => setRenameTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                          onBlur={handleRenameSubmit}
                          className="w-full bg-black border border-cyan-500 rounded px-1.5 py-0.5 text-xs text-white outline-none"
                        />
                      </div>
                    ) : (
                      <div className="font-bold text-xs truncate leading-tight">
                        {board.title}
                      </div>
                    )}
                    <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{new Date(board.updatedAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Hover Actions */}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsRenaming(board.id);
                        setRenameTitle(board.title);
                      }}
                      className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-cyan-400 transition-colors"
                      title="Rename Board"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => duplicateBoard(board, e)}
                      className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-indigo-400 transition-colors"
                      title="Duplicate Board"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => deleteBoard(board.id, e)}
                      className="p-1 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
                      title="Delete Board"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Starter Templates Drawer */}
        <div className={`p-3.5 border-t ${
          boardTheme === 'dark' ? 'border-zinc-800/80 bg-[#080a0e]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Starter Templates
            </span>
            <button 
              onClick={() => setShowTemplatesModal(true)}
              className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
            >
              Browse All
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {WHITEBOARD_TEMPLATES.slice(1, 5).map((tmpl) => (
              <button 
                key={tmpl.id}
                onClick={() => createNewBoard(tmpl.name, tmpl.generateShapes())}
                className={`p-2 rounded-xl border text-left flex flex-col gap-1 transition-all group cursor-pointer ${
                  boardTheme === 'dark'
                    ? 'border-zinc-800 bg-zinc-950/40 hover:border-cyan-500/40 hover:bg-cyan-950/20'
                    : 'border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/50'
                }`}
              >
                <span className="text-[11px] font-bold text-zinc-300 group-hover:text-cyan-400 truncate">
                  {tmpl.name}
                </span>
                <span className="text-[9px] text-zinc-500 truncate leading-tight">
                  {tmpl.category}
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN CANVAS VIEWPORT */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col relative h-full min-w-0">
        
        {/* TOP TOOLBAR */}
        <header className={`h-14 border-b flex items-center justify-between px-3 sm:px-4 z-20 shrink-0 select-none ${
          boardTheme === 'dark' ? 'bg-[#090b0e]/95 border-zinc-800 backdrop-blur' : 'bg-white/95 border-slate-200 backdrop-blur'
        }`}>
          {/* Left: Sidebar Toggle, Board Title, & Save Status */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title={isSidebarOpen ? 'Collapse Boards Sidebar' : 'Expand Boards Sidebar'}
            >
              {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            <div className="h-5 w-px bg-zinc-800 hidden sm:block" />

            <div className="flex items-center gap-2 truncate">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-cyan-400 border border-indigo-500/20 shrink-0">
                <Layout className="w-3.5 h-3.5" />
              </span>
              <span className="font-extrabold text-xs sm:text-sm tracking-tight truncate max-w-[140px] sm:max-w-xs text-white">
                {activeBoard?.title || 'Select or create a board'}
              </span>
            </div>

            {/* Save Status Indicator */}
            {activeBoard && (
              <div className="items-center gap-1.5 ml-2 hidden md:flex">
                {saveStatus === 'saving' ? (
                  <span className="text-[10px] text-cyan-400 flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    Saving...
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                    <Check className="w-3 h-3 text-emerald-400" />
                    Auto-saved
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: AI Tools, Export, Theme, and Close */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {activeBoard && (
              <>
                {/* AI Suite Actions */}
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-2xl border border-white/5">
                  <button 
                    onClick={handleExplainBoard}
                    disabled={isAiLoading}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-violet-600/20 text-xs font-semibold text-violet-400 transition-all cursor-pointer disabled:opacity-50"
                    title="Explain visible notes, sketches and diagrams with Gemini"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Explain</span>
                  </button>

                  <button 
                    onClick={handleOrganizeIdeas}
                    disabled={isAiLoading}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-cyan-600/20 text-xs font-semibold text-cyan-400 transition-all cursor-pointer disabled:opacity-50"
                    title="Auto-organize notes into categorized clusters"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Organize</span>
                  </button>

                  <button 
                    onClick={handleCreateMindMapPrompt}
                    disabled={isAiLoading}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-indigo-600/20 text-xs font-semibold text-indigo-400 transition-all cursor-pointer disabled:opacity-50"
                    title="Create an editable AI Mind Map from a topic"
                  >
                    <Network className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Mind Map</span>
                  </button>

                  <button 
                    onClick={handleConvertHandwriting}
                    disabled={isAiLoading}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-emerald-600/20 text-xs font-semibold text-emerald-400 transition-all cursor-pointer disabled:opacity-50"
                    title="Convert canvas handwriting to editable text via Gemini Vision"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Handwriting OCR</span>
                  </button>

                  <button 
                    onClick={() => setShowAskModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-blue-600/20 text-xs font-semibold text-blue-400 transition-all cursor-pointer"
                    title="Ask any question about this board"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Ask Board</span>
                  </button>
                </div>

                {/* Export & Actions */}
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-2xl border border-white/5">
                  <button 
                    onClick={() => exportBoard('png')}
                    className="p-1.5 sm:p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Export as PNG Image"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => exportBoard('pdf')}
                    className="p-1.5 sm:p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Export as PDF Document"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleExportJSON}
                    className="p-1.5 sm:p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Export JSON Blueprint Backup"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Theme Toggle */}
                <button 
                  onClick={() => setBoardTheme(boardTheme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Toggle Whiteboard Dark / Light Mode"
                >
                  {boardTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                </button>
              </>
            )}

            <div className="h-5 w-px bg-zinc-800 mx-1" />

            {/* Close Modal */}
            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Close Whiteboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* CANVAS WORKSPACE */}
        <div className="flex-1 relative overflow-hidden bg-[#090b0e]">
          {/* Subtle Dot Grid Background styling for infinite canvas presence */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />

          {/* AI Busy Overlay */}
          {isAiLoading && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-2xl flex items-center gap-3 border border-white/20">
                <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
                <span>{aiMessage || 'AI IS GENERATING WORKSPACE ASSETS...'}</span>
              </div>
            </div>
          )}

          {/* Canvas Mount */}
          {activeBoard ? (
            <div key={activeBoard.id} className="absolute inset-0">
              <Tldraw 
                onMount={handleMount}
              />
            </div>
          ) : (
            /* Welcome / Zero State */
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-6 shadow-2xl shadow-cyan-500/10">
                <Layout className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                ISHAI INFINITE CANVAS STUDIO
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-8 leading-relaxed">
                A high-performance creative workspace for ideation, system architectures, tactile sketching, and Gemini multimodal synthesis.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 max-w-xl">
                <button 
                  onClick={() => createNewBoard('Untitled Canvas')}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Start Blank Canvas
                </button>
                <button 
                  onClick={() => setShowTemplatesModal(true)}
                  className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" /> Browse Starter Templates
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. COMPACT FLOATING TOOL PALETTE */}
          {/* ========================================================================= */}
          {activeBoard && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 pointer-events-auto">
              
              {/* Secondary Color & Stroke Drawer */}
              {(activePaletteTool === 'draw' || activePaletteTool === 'highlight' || activePaletteTool === 'note' || activePaletteTool === 'text' || activePaletteTool === 'rectangle' || activePaletteTool === 'ellipse') && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#090c10]/90 border border-white/10 backdrop-blur-md shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                  {/* Colors */}
                  <div className="flex items-center gap-1.5 pr-2 border-r border-white/10">
                    {COLOR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.name}
                        onClick={() => applyColor(swatch.tldrawColor)}
                        style={{ backgroundColor: swatch.hex }}
                        className={`w-5 h-5 rounded-full transition-transform cursor-pointer border ${
                          currentColor === swatch.tldrawColor ? 'scale-125 border-white ring-2 ring-cyan-500/50' : 'border-transparent hover:scale-110'
                        }`}
                        title={swatch.name}
                      />
                    ))}
                  </div>

                  {/* Stroke Size */}
                  <div className="flex items-center gap-1 pl-1">
                    {(['s', 'm', 'l'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => applyStrokeSize(size)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                          currentStrokeSize === size ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {size === 's' ? 'Thin' : size === 'm' ? 'Med' : 'Bold'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Compact Palette Bar */}
              <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-[#0a0d14]/95 border border-white/15 backdrop-blur-xl shadow-2xl">
                
                {/* Select / Move */}
                <button
                  onClick={() => selectPaletteTool('select')}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    activePaletteTool === 'select' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30' : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Select & Move Objects (V)"
                >
                  <MousePointer className="w-4 h-4" />
                </button>

                {/* Hand / Pan */}
                <button
                  onClick={() => selectPaletteTool('hand')}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    activePaletteTool === 'hand' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30' : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Pan Canvas (H / Space+Drag)"
                >
                  <Hand className="w-4 h-4" />
                </button>

                {/* Pen / Draw */}
                <button
                  onClick={() => selectPaletteTool('draw')}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    activePaletteTool === 'draw' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30' : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Pen & Freehand Drawing (D)"
                >
                  <PenTool className="w-4 h-4" />
                </button>

                {/* Highlighter */}
                <button
                  onClick={() => selectPaletteTool('highlight')}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    activePaletteTool === 'highlight' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30' : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Highlighter Tool"
                >
                  <Highlighter className="w-4 h-4" />
                </button>

                {/* Eraser */}
                <button
                  onClick={() => selectPaletteTool('eraser')}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    activePaletteTool === 'eraser' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30' : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Eraser (E)"
                >
                  <Eraser className="w-4 h-4" />
                </button>

                <div className="h-5 w-px bg-white/10 mx-0.5" />

                {/* Sticky Note */}
                <button
                  onClick={() => selectPaletteTool('note')}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    activePaletteTool === 'note' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Sticky Note (N)"
                >
                  <StickyNote className="w-4 h-4" />
                </button>

                {/* Text Box */}
                <button
                  onClick={() => selectPaletteTool('text')}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    activePaletteTool === 'text' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Text Box (T)"
                >
                  <Type className="w-4 h-4" />
                </button>

                {/* Rectangle */}
                <button
                  onClick={() => selectPaletteTool('rectangle')}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    activePaletteTool === 'rectangle' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Rectangle (R)"
                >
                  <Square className="w-4 h-4" />
                </button>

                {/* Circle */}
                <button
                  onClick={() => selectPaletteTool('ellipse')}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    activePaletteTool === 'ellipse' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Circle / Ellipse (O)"
                >
                  <Circle className="w-4 h-4" />
                </button>

                {/* Arrow */}
                <button
                  onClick={() => selectPaletteTool('arrow')}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    activePaletteTool === 'arrow' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Connected Arrow (A)"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Line */}
                <button
                  onClick={() => selectPaletteTool('line')}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    activePaletteTool === 'line' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Line (L)"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="h-5 w-px bg-white/10 mx-0.5" />

                {/* Upload Image */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  title="Import Image (Movable & Resizable)"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                {/* Undo / Redo */}
                <button
                  onClick={() => editorRef.current?.undo()}
                  className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => editorRef.current?.redo()}
                  className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 className="w-4 h-4" />
                </button>

                {/* Clear Canvas */}
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="p-2.5 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                  title="Clear Canvas"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="h-5 w-px bg-white/10 mx-0.5" />

                {/* Zoom Controls */}
                <button
                  onClick={() => editorRef.current?.zoomIn()}
                  className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <button
                  onClick={() => editorRef.current?.zoomOut()}
                  className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <button
                  onClick={() => editorRef.current?.zoomToFit()}
                  className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  title="Fit to Screen (Shift+1)"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                <span className="text-[10px] font-mono text-zinc-400 px-2 select-none">
                  {zoomLevel}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CLEAR CANVAS CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1117] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Clear entire whiteboard?</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                All strokes, shapes, and notes on this board will be removed. You can undo this action immediately with Ctrl+Z.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleClearCanvas}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ASK ABOUT MY BOARD MODAL */}
      {/* ========================================================================= */}
      {showAskModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1117] border border-white/15 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <HelpCircle className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Ask About My Board</h3>
              </div>
              <button 
                onClick={() => setShowAskModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAskSubmit} className="space-y-3">
              <input 
                type="text"
                placeholder="E.g., What are the main bottlenecks? How many tasks are in progress?"
                value={askQuery}
                onChange={(e) => setAskQuery(e.target.value)}
                autoFocus
                className="w-full bg-black/60 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-white outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={isAiLoading || !askQuery.trim()}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isAiLoading ? 'Analyzing...' : 'Ask AI'}
                </button>
              </div>
            </form>

            {askResponse && (
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <div className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {askResponse}
                </div>
                <div className="flex justify-end pt-2 border-t border-white/5">
                  <button 
                    onClick={insertAskResponseToBoard}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Note to Board
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TEMPLATES BROWSER MODAL */}
      {/* ========================================================================= */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1117] border border-white/15 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> Starter Board Templates
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Pre-configured infinite canvas environments to jumpstart your workflow.
                </p>
              </div>
              <button 
                onClick={() => setShowTemplatesModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {WHITEBOARD_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => createNewBoard(tmpl.name, tmpl.generateShapes())}
                  className="p-4 rounded-2xl border border-white/10 bg-black/40 hover:border-cyan-500/50 hover:bg-cyan-950/20 text-left transition-all group cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white group-hover:text-cyan-400">
                      {tmpl.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-medium">
                      {tmpl.category}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {tmpl.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
